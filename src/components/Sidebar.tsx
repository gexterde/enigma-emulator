import React from 'react';
import { ActiveTab, EnigmaConfig } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onResetMachine: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  config: EnigmaConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onResetMachine,
  isMobileOpen,
  onCloseMobile,
  config
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: string; shortcut: string }> = [
    { id: 'machine', label: 'Machine', icon: 'settings_input_component', shortcut: 'F1 / ^M' },
    { id: 'rotors', label: 'Rotor Settings', icon: 'settings_overscan', shortcut: 'F2 / ^R' },
    { id: 'plugboard', label: 'Plugboard', icon: 'settings_ethernet', shortcut: 'F3 / ^P' },
    { id: 'codebook', label: 'Codebook', icon: 'menu_book', shortcut: 'F4 / ^B' },
    { id: 'log', label: 'Log', icon: 'history_edu', shortcut: 'F5 / ^L' },
    { id: 'morseTrainer', label: 'Morse Trainer', icon: 'school', shortcut: 'F6 / ^T' }
  ];

  return (
    <>
      {/* Overlay for sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <nav
        id="sidebar"
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col z-40 w-64 border-r border-[#4e453b] bg-[#201b0f] shadow-2xl shrink-0 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[#3b3426] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3b3426] border-2 border-[#8b6f47] flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7GMVXh7JLwrcaJvJTMyXLWWowPJqQX9w-yJChY-oPx9x1aRjP881JIB1z1cXVJb0A1Uvaa_s2hTz8t0fjBALhR0I2jIgyh2PpOwglmuEO5CsnL4YMAbdkf4Wg6KhwBJhteZBUs_uja_8Js_KiIFN34gHjSsQTGWfnVPydhqxPbrHnC9pMLeRTOFhwUUyPBl4kLlT2PQcGIpXiqDCOBkSDq_NGe_UcglPvqhWWqintsiTuAA4o3faK"
                alt="Enigma M3 Insignia"
                className="w-full h-full object-cover opacity-80 mix-blend-screen"
              />
            </div>
            <div>
              <h2 className="text-ui-header font-ui-header font-bold text-[#e3c193]">Configuration</h2>
              <p className="text-monospaced-technical font-monospaced-technical text-[#d1c4b7] text-[10px] tracking-tight">
                {config.reflector.type} ({config.leftRotor.type}-{config.middleRotor.type}-{config.rightRotor.type})
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="w-8 h-8 flex items-center justify-center text-[#d1c4b7] hover:text-[#e3c193] hover:bg-[#3b3426] rounded transition-colors cursor-pointer shrink-0"
            title="Close Menu"
            aria-label="Close Menu"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full text-left px-4 py-3 min-h-[44px] flex items-center gap-3 transition-all ${
                  isActive
                    ? 'text-[#e3c193] border-r-4 border-[#ebc238] bg-[#3b3426] translate-x-1 font-bold'
                    : 'text-[#d1c4b7] hover:bg-[#2f291c] hover:text-[#ede1cd]'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'material-fill-1' : 'material-fill-0'}`}>
                  {item.icon}
                </span>
                <span className="text-ui-body font-ui-body flex-1">{item.label}</span>
                <span className={`text-[10px] font-monospaced-technical px-1.5 py-0.5 rounded border transition-colors ${
                  isActive ? 'bg-[#ebc238]/20 text-[#ebc238] border-[#ebc238]/40' : 'bg-[#18130b] text-[#8c7e6a] border-[#3b3426]'
                }`}>
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#3b3426]">
          <button
            onClick={onResetMachine}
            className="w-full py-3 min-h-[44px] bg-[#93000a] text-[#ffdad6] rounded border border-red-800/30 hover:bg-red-900 hover:text-white transition-colors font-ui-header text-ui-header shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-[0.98]"
          >
            Reset Machine
          </button>
        </div>
      </nav>
    </>
  );
};
