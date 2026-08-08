import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { RotorSettingsView } from './components/RotorSettingsView';
import { MachineView } from './components/MachineView';
import { PlugboardView } from './components/PlugboardView';
import { CodebookView } from './components/CodebookView';
import { LogView } from './components/LogView';
import { SettingsModal, InfoModal, ShareModal } from './components/Modals';
import { ActiveTab, EnigmaConfig, LogEntry } from './types';
import { DEFAULT_ENIGMA_CONFIG } from './lib/enigmaEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('machine');
  const [config, setConfig] = useState<EnigmaConfig>(DEFAULT_ENIGMA_CONFIG);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Apply new configuration (from Rotor Settings)
  const handleApplyConfig = (newConfig: EnigmaConfig) => {
    setConfig(newConfig);
  };

  // Reset entire machine
  const handleResetMachine = () => {
    setConfig(JSON.parse(JSON.stringify(DEFAULT_ENIGMA_CONFIG)));
    setLogs([]);
  };

  const handleAddLog = (entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  };

  return (
    <div className="bg-[#181307] text-[#ede1cd] min-h-screen flex flex-col font-ui-body text-ui-body texture-wood overflow-hidden">
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Body container with Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onResetMachine={handleResetMachine}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
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
        </main>
      </div>

      {/* Footer */}
      <Footer
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenManual={() => setIsInfoOpen(true)}
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
    </div>
  );
}
