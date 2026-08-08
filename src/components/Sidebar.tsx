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
  const navItems: Array<{ id: ActiveTab; label: string; icon: string }> = [
    { id: 'machine', label: 'Machine', icon: 'settings_input_component' },
    { id: 'plugboard', label: 'Plugboard', icon: 'settings_ethernet' },
    { id: 'rotors', label: 'Rotor Settings', icon: 'settings_overscan' },
    { id: 'codebook', label: 'Codebook', icon: 'menu_book' },
    { id: 'log', label: 'Log', icon: 'history_edu' }
  ];

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <nav
        id="sidebar"
        className={`fixed md:static left-0 top-16 h-[calc(100vh-4rem)] flex flex-col z-40 w-64 border-r border-[#4e453b] bg-[#201b0f] shadow-xl shrink-0 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-[#3b3426]">
          <div className="flex items-center gap-3 mb-2">
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
                {config.reflector} ({config.leftRotor.type}-{config.middleRotor.type}-{config.rightRotor.type})
              </p>
            </div>
          </div>
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
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
                <span className="text-ui-body font-ui-body">{item.label}</span>
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
