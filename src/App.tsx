import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { RotorSettingsView } from './components/RotorSettingsView';
import { MachineView } from './components/MachineView';
import { BatterySwitchMode } from './components/BatterySwitch';
import { playRotorClickSound } from './lib/audio';
import { PlugboardView } from './components/PlugboardView';
import { CodebookView } from './components/CodebookView';
import { LogView } from './components/LogView';
import { MorseTrainer } from './components/MorseTrainer';
import { RadioStationView } from './components/RadioStationView';
import { FrequencyAnalysisView } from './components/FrequencyAnalysisView';
import { CryptanalysisView } from './components/CryptanalysisView';
import { SettingsModal, InfoModal, ShareModal, ShortcutsModal } from './components/Modals';
import { LoginModal } from './components/LoginModal';
import { ProtectedView } from './components/ProtectedView';
import { ActiveTab, EnigmaConfig, LogEntry } from './types';
import { DEFAULT_ENIGMA_CONFIG } from './lib/enigmaEngine';
import { useTheme, getTheme } from './lib/theme';
import { useAuth } from './hooks/useAuth';
import { useSyncState } from './hooks/useSyncState';

function isValidRotorState(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  return typeof r.type === 'string' && typeof r.ring === 'number' && typeof r.start === 'number' && typeof r.current === 'number';
}

function isValidEnigmaConfig(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;
  return (
    isValidRotorState(c.leftRotor) &&
    isValidRotorState(c.middleRotor) &&
    isValidRotorState(c.rightRotor) &&
    isValidRotorState(c.fourthRotor) &&
    isValidRotorState(c.reflector) &&
    typeof c.plugboard === 'object' &&
    c.plugboard !== null
  );
}

function isValidLogEntry(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const entry = obj as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.timestamp === 'string' &&
    typeof entry.inputChar === 'string' &&
    typeof entry.outputChar === 'string' &&
    typeof entry.configString === 'string' &&
    Array.isArray(entry.trace)
  );
}

export default function App() {
  const { user, logout } = useAuth();
  useSyncState();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('machine');
  const [config, setConfig] = useState<EnigmaConfig>(() => {
    try {
      const saved = localStorage.getItem('enigma_machine_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidEnigmaConfig(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_ENIGMA_CONFIG;
  });
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('enigma_machine_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(isValidLogEntry)) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return [];
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Customizable Sender Call Sign (Absender)
  const [senderCallSign, setSenderCallSign] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('enigma_sender_callsign');
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return config.senderCallSign || 'DFS';
  });

  const handleUpdateSenderCallSign = (newSender: string) => {
    const clean = newSender.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    setSenderCallSign(clean);
    try {
      localStorage.setItem('enigma_sender_callsign', clean);
    } catch (e) {
      // ignore
    }
    setConfig((prev) => ({ ...prev, senderCallSign: clean }));
  };

  // Simulated Battery Level (0 to 100)
  const [batteryLevel, setBatteryLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('enigma_battery_level');
      return saved !== null ? Number(saved) : 100;
    } catch {
      return 100;
    }
  });

  // Battery Switch Mode State
  const [batteryMode, setBatteryMode] = useState<BatterySwitchMode>(() => {
    try {
      const saved = localStorage.getItem('enigma_battery_mode');
      return (saved as BatterySwitchMode) || 'hell';
    } catch {
      return 'hell';
    }
  });

  // Battery Level Change / Drain State
  const [batteryDrainEnabled, setBatteryDrainEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('enigma_battery_drain');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Persist Battery State
  useEffect(() => {
    try {
      localStorage.setItem('enigma_battery_level', String(batteryLevel));
    } catch {}
  }, [batteryLevel]);

  useEffect(() => {
    try {
      localStorage.setItem('enigma_battery_mode', batteryMode);
    } catch {}
  }, [batteryMode]);

  useEffect(() => {
    try {
      localStorage.setItem('enigma_battery_drain', String(batteryDrainEnabled));
    } catch {}
  }, [batteryDrainEnabled]);

  // Background depletion
  useEffect(() => {
    if (batteryMode === 'aus' || !batteryDrainEnabled) return;

    const interval = setInterval(() => {
      setBatteryLevel((prev) => {
        if (prev <= 0) return 0;
        let rate = 0.05; // 'hell'
        if (batteryMode === 'dkl') rate = 0.02;
        if (batteryMode === 'sammler') rate = 0.04;
        
        const next = prev - rate;
        return next < 0 ? 0 : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [batteryMode, batteryDrainEnabled]);

  const handleConsumePower = () => {
    if (!batteryDrainEnabled) return;

    setBatteryLevel((prev) => {
      if (prev <= 0) return 0;
      let cost = 0.25; // standard key press cost
      if (batteryMode === 'dkl') cost = 0.12;
      if (batteryMode === 'sammler') cost = 0.20;
      const next = prev - cost;
      return next < 0 ? 0 : next;
    });
  };

  const handleToggleBatteryDrain = (enabled?: boolean) => {
    setBatteryDrainEnabled((prev) => (typeof enabled === 'boolean' ? enabled : !prev));
  };

  const handleRecharge = () => {
    setBatteryLevel(100);
    playRotorClickSound(soundEnabled);
  };

  const handleSetBatteryMode = (mode: BatterySwitchMode) => {
    setBatteryMode(mode);
    playRotorClickSound(soundEnabled);
  };
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [inputTape, setInputTape] = useState<string>('');
  const [cipherTape, setCipherTape] = useState<string>('');
  const [cipherHeader, setCipherHeader] = useState<string>('');
  const [pendingAutoTransmit, setPendingAutoTransmit] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('enigma_machine_config', JSON.stringify(config));
    } catch (e) {
      // ignore
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('enigma_machine_logs', JSON.stringify(logs));
    } catch (e) {
      // ignore
    }
  }, [logs]);

  // Modals and sidebar state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Escape -> Close any active dialog or mobile menu
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsInfoOpen(false);
        setIsShareOpen(false);
        setIsShortcutsOpen(false);
        setIsMenuOpen(false);
        return;
      }

      // Compact mode toggle has special text selection check
      if (isCtrlOrCmd && e.key.toLowerCase() === 'c' && !isInputFocused) {
        const selection = window.getSelection()?.toString();
        if (!selection || selection.length === 0) {
          e.preventDefault();
          setCompactMode((prev) => !prev);
          return;
        }
      }

      const shortcuts = [
        {
          match: () => (!isCtrlOrCmd && e.key === 'F1') || (isCtrlOrCmd && e.key.toLowerCase() === 'm'),
          action: () => setActiveTab('machine'),
        },
        {
          match: () => e.key === 'F2' || (isCtrlOrCmd && e.key.toLowerCase() === 'r'),
          action: () => setActiveTab('rotors'),
        },
        {
          match: () => e.key === 'F3' || (isCtrlOrCmd && e.key.toLowerCase() === 'p'),
          action: () => setActiveTab('plugboard'),
        },
        {
          match: () => e.key === 'F4' || (isCtrlOrCmd && e.key.toLowerCase() === 'b'),
          action: () => setActiveTab('codebook'),
        },
        {
          match: () => e.key === 'F5' || (isCtrlOrCmd && e.key.toLowerCase() === 'l'),
          action: () => setActiveTab('log'),
        },
        {
          match: () => e.key === 'F6' || (isCtrlOrCmd && e.key.toLowerCase() === 't'),
          action: () => setActiveTab('morseTrainer'),
        },
        {
          match: () => e.key === 'F8' || (isCtrlOrCmd && e.key.toLowerCase() === 'x'),
          action: () => setActiveTab('radio'),
        },
        {
          match: () => e.key === 'F11' || (isCtrlOrCmd && e.key.toLowerCase() === 'y'),
          action: () => setActiveTab('frequency'),
        },
        {
          match: () => e.key === 'F12' || (isCtrlOrCmd && e.key.toLowerCase() === 'e'),
          action: () => setActiveTab('cryptanalysis'),
        },
        {
          match: () => (isCtrlOrCmd && e.key.toLowerCase() === 's' && !e.shiftKey),
          action: () => setIsSettingsOpen((prev) => !prev),
        },
        {
          match: () => e.key === 'F7' || (isCtrlOrCmd && e.key.toLowerCase() === 'h'),
          action: () => setIsInfoOpen((prev) => !prev),
        },
        {
          match: () => e.key === 'F9' || (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 's'),
          action: () => setIsShareOpen((prev) => !prev),
        },
        {
          match: () => e.key === 'F10' || (!isInputFocused && e.key === '?') || (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'k'),
          action: () => setIsShortcutsOpen((prev) => !prev),
        },
      ];

      for (const shortcut of shortcuts) {
        if (shortcut.match()) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Apply new configuration (from Rotor Settings)
  const handleApplyConfig = (newConfig: EnigmaConfig) => {
    setConfig(newConfig);
  };

  // Reset entire machine
  const handleResetMachine = () => {
    setConfig(JSON.parse(JSON.stringify(DEFAULT_ENIGMA_CONFIG)));
    setLogs([]);
    setInputTape('');
    setCipherTape('');
  };

  const handleAddLog = (entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  };

  const { theme } = useTheme();
  const t = getTheme(theme);

  return (
    <div className={`${t.appBg} min-h-screen flex flex-col ${t.fontBody} text-ui-body ${t.appTexture} overflow-hidden`}>
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMenuOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        user={user}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={logout}
      />

      {/* Body container with Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onResetMachine={handleResetMachine}
          isMobileOpen={isMenuOpen}
          onCloseMobile={() => setIsMenuOpen(false)}
          config={config}
        />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
          {activeTab === 'rotors' && (
            <RotorSettingsView
              config={config}
              onApplyConfig={handleApplyConfig}
              soundEnabled={soundEnabled}
            />
          )}

          {activeTab === 'machine' && (
            <MachineView
              config={config}
              onUpdateConfig={setConfig}
              onAddLog={handleAddLog}
              soundEnabled={soundEnabled}
              compactMode={compactMode}
              onToggleCompactMode={() => setCompactMode((prev) => !prev)}
              inputTape={inputTape}
              setInputTape={setInputTape}
              cipherTape={cipherTape}
              setCipherTape={setCipherTape}
              batteryLevel={batteryLevel}
              batteryMode={batteryMode}
              onSetBatteryMode={handleSetBatteryMode}
              onConsumePower={handleConsumePower}
              batteryDrainEnabled={batteryDrainEnabled}
              onToggleBatteryDrain={handleToggleBatteryDrain}
              senderCallSign={senderCallSign}
              onUpdateSenderCallSign={handleUpdateSenderCallSign}
              onBroadcastOverRadio={(header, ciphertext) => {
                setCipherHeader(header);
                setCipherTape(ciphertext);
                setActiveTab('radio');
                setPendingAutoTransmit(true);
              }}
            />
          )}

          {activeTab === 'plugboard' && (
            <PlugboardView
              config={config}
              onUpdateConfig={setConfig}
              soundEnabled={soundEnabled}
            />
          )}

          {activeTab === 'codebook' && (
            <CodebookView
              currentConfig={config}
              onApplyConfig={handleApplyConfig}
              onNavigateToMachine={() => setActiveTab('machine')}
            />
          )}

          {activeTab === 'log' && (
            <LogView logs={logs} onClearLogs={() => setLogs([])} />
          )}

          {activeTab === 'morseTrainer' && (
            <ProtectedView onRequireLogin={() => setIsLoginOpen(true)} title="Morse Trainer">
              <MorseTrainer />
            </ProtectedView>
          )}

          {activeTab === 'radio' && (
            <ProtectedView onRequireLogin={() => setIsLoginOpen(true)} title="Radio Station">
              <RadioStationView
                senderCallSign={senderCallSign}
                onUpdateSenderCallSign={handleUpdateSenderCallSign}
                config={config}
                onLoadCiphertextToMachine={(header, ciphertext) => {
                  setCipherTape(ciphertext);
                  setActiveTab('machine');
                }}
                onSelectTab={setActiveTab}
                incomingCiphertext={cipherTape}
                incomingHeader={cipherHeader}
                autoTransmitPending={pendingAutoTransmit}
                onAutoTransmitComplete={() => setPendingAutoTransmit(false)}
              />
            </ProtectedView>
          )}

          {activeTab === 'frequency' && (
            <FrequencyAnalysisView
              config={config}
              inputTape={inputTape}
              cipherTape={cipherTape}
            />
          )}

          {activeTab === 'cryptanalysis' && (
            <CryptanalysisView
              config={config}
              onUpdateConfig={setConfig}
              cipherTape={cipherTape}
              inputTape={inputTape}
              setActiveTab={setActiveTab}
              soundEnabled={soundEnabled}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer
        onOpenInfo={() => setIsInfoOpen(true)}
        batteryLevel={batteryLevel}
        batteryMode={batteryMode}
        onRecharge={handleRecharge}
        batteryDrainEnabled={batteryDrainEnabled}
        onToggleBatteryDrain={handleToggleBatteryDrain}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onResetMachine={handleResetMachine}
        senderCallSign={senderCallSign}
        onUpdateSenderCallSign={handleUpdateSenderCallSign}
        batteryDrainEnabled={batteryDrainEnabled}
        onToggleBatteryDrain={setBatteryDrainEnabled}
      />

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        config={config}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
