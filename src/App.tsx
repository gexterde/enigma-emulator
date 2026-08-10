import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { RotorSettingsView } from './components/RotorSettingsView';
import { MachineView } from './components/MachineView';
import { PlugboardView } from './components/PlugboardView';
import { CodebookView } from './components/CodebookView';
import { LogView } from './components/LogView';
import { MorseTrainer } from './components/MorseTrainer';
import { SettingsModal, InfoModal, ShareModal, ShortcutsModal } from './components/Modals';
import { ActiveTab, EnigmaConfig, LogEntry } from './types';
import { DEFAULT_ENIGMA_CONFIG } from './lib/enigmaEngine';

function isValidRotorState(obj: any): boolean {
  return !!(obj && typeof obj.type === 'string' && typeof obj.ring === 'number' && typeof obj.start === 'number' && typeof obj.current === 'number');
}

function isValidEnigmaConfig(obj: any): boolean {
  if (!obj) return false;
  return !!(
    isValidRotorState(obj.leftRotor) &&
    isValidRotorState(obj.middleRotor) &&
    isValidRotorState(obj.rightRotor) &&
    isValidRotorState(obj.fourthRotor) &&
    isValidRotorState(obj.reflector) &&
    typeof obj.plugboard === 'object' &&
    obj.plugboard !== null
  );
}

export default function App() {
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [inputTape, setInputTape] = useState<string>('');
  const [cipherTape, setCipherTape] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('enigma_machine_config', JSON.stringify(config));
    } catch (e) {
      // ignore
    }
  }, [config]);

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
          match: () => e.key === 'F1' || (isCtrlOrCmd && e.key.toLowerCase() === 'm'),
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
          match: () => e.key === 'F7' || (isCtrlOrCmd && e.key.toLowerCase() === 's' && !e.shiftKey),
          action: () => setIsSettingsOpen((prev) => !prev),
        },
        {
          match: () => e.key === 'F8' || (isCtrlOrCmd && e.key.toLowerCase() === 'h'),
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

  return (
    <div className="bg-[#181307] text-[#ede1cd] min-h-screen flex flex-col font-ui-body text-ui-body texture-wood overflow-hidden">
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMenuOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
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
            <MorseTrainer />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onResetMachine={handleResetMachine}
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
    </div>
  );
}
