import React from 'react';
import { ActiveTab, EnigmaConfig } from '../types';
import { useTheme, getTheme } from '../lib/theme';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onResetMachine: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  config: EnigmaConfig;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenInfo: () => void;
  onOpenShare: () => void;
  onOpenAdmin: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onResetMachine,
  isMobileOpen,
  onCloseMobile,
  config,
  onOpenSettings,
  onOpenShortcuts,
  onOpenInfo,
  onOpenShare,
  onOpenAdmin,
  isAdmin
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  const navItems: Array<{ id: ActiveTab; label: string; icon: string; shortcut: string }> = [
    { id: 'machine', label: 'Machine', icon: 'settings_input_component', shortcut: 'F1 / ^M' },
    { id: 'rotors', label: 'Rotor Settings', icon: 'settings_overscan', shortcut: 'F2 / ^R' },
    { id: 'plugboard', label: 'Plugboard', icon: 'settings_ethernet', shortcut: 'F3 / ^P' },
    { id: 'codebook', label: 'Codebook', icon: 'menu_book', shortcut: 'F4 / ^B' },
    { id: 'log', label: 'Log', icon: 'history_edu', shortcut: 'F5 / ^L' },
    { id: 'morseTrainer', label: 'Morse Trainer', icon: 'school', shortcut: 'F6 / ^T' },
    { id: 'radio', label: 'Radio Transceiver', icon: 'radio', shortcut: 'F8 / ^X' },
    { id: 'frequency', label: 'Frequency Tool', icon: 'analytics', shortcut: 'F11 / ^Y' },
    { id: 'cryptanalysis', label: 'Crib Cracking', icon: 'auto_fix', shortcut: 'F12 / ^E' }
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
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col z-40 w-64 border-r ${t.modalBg} shadow-2xl shrink-0 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`p-4 border-b ${t.modalHeaderBg} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${t.panelBg} border-2 ${t.borderAccent} flex items-center justify-center shadow-inner overflow-hidden shrink-0`}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7GMVXh7JLwrcaJvJTMyXLWWowPJqQX9w-yJChY-oPx9x1aRjP881JIB1z1cXVJb0A1Uvaa_s2hTz8t0fjBALhR0I2jIgyh2PpOwglmuEO5CsnL4YMAbdkf4Wg6KhwBJhteZBUs_uja_8Js_KiIFN34gHjSsQTGWfnVPydhqxPbrHnC9pMLeRTOFhwUUyPBl4kLlT2PQcGIpXiqDCOBkSDq_NGe_UcglPvqhWWqintsiTuAA4o3faK"
                alt="Enigma M3 Insignia"
                className={`w-full h-full object-cover opacity-80 ${t.mixBlendMode}`}
              />
            </div>
            <div>
              <h2 className={`${t.fontHeader} font-bold ${t.textPrimary}`}>Configuration</h2>
              <p className={`${t.fontMono} ${t.textMuted} text-[10px] tracking-tight`}>
                {config.reflector.type} ({config.leftRotor.type}-{config.middleRotor.type}-{config.rightRotor.type})
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className={`w-8 h-8 flex items-center justify-center ${t.textMuted} hover:${t.textAccent} hover:bg-black/5 rounded transition-colors cursor-pointer shrink-0`}
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
                    ? `${t.textAccent} border-r-4 ${t.borderAccent} bg-black/10 translate-x-1 font-bold`
                    : `${t.textMuted} hover:bg-black/5 hover:${t.textPrimary}`
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'material-fill-1' : 'material-fill-0'}`}>
                  {item.icon}
                </span>
                <span className={`${t.fontBody} flex-1`}>{item.label}</span>
                <span className={`text-[10px] ${t.fontMono} px-1.5 py-0.5 rounded border transition-colors ${
                  isActive ? `bg-black/5 ${t.textAccent} ${t.borderAccent}` : `bg-black/5 ${t.textSecondary} ${t.borderBase}`
                }`}>
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile-only utility actions */}
        <div className="md:hidden px-4 py-3 border-t border-[#3b3426]/30 flex flex-col gap-1">
          <span className={`text-[9px] ${t.textMuted} font-mono uppercase tracking-wider mb-2 block`}>
            Utility Actions
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-[11px] ${t.textMuted} hover:bg-black/10 hover:${t.textPrimary} border ${t.borderBase} cursor-pointer transition-colors`}
            >
              <span className="material-symbols-outlined text-xs">settings</span>
              Settings
            </button>
            <button
              onClick={() => {
                onOpenShortcuts();
                onCloseMobile();
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-[11px] ${t.textMuted} hover:bg-black/10 hover:${t.textPrimary} border ${t.borderBase} cursor-pointer transition-colors`}
            >
              <span className="material-symbols-outlined text-xs">keyboard</span>
              Shortcuts
            </button>
            <button
              onClick={() => {
                onOpenInfo();
                onCloseMobile();
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-[11px] ${t.textMuted} hover:bg-black/10 hover:${t.textPrimary} border ${t.borderBase} cursor-pointer transition-colors`}
            >
              <span className="material-symbols-outlined text-xs">info</span>
              Info
            </button>
            <button
              onClick={() => {
                onOpenShare();
                onCloseMobile();
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-[11px] ${t.textMuted} hover:bg-black/10 hover:${t.textPrimary} border ${t.borderBase} cursor-pointer transition-colors`}
            >
              <span className="material-symbols-outlined text-xs">share</span>
              Share
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  onOpenAdmin();
                  onCloseMobile();
                }}
                className={`col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-[11px] ${t.dangerText} ${t.dangerLightBg} border ${t.borderDanger} cursor-pointer transition-colors`}
              >
                <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                Admin Panel
              </button>
            )}
          </div>
        </div>

        <div className={`p-4 border-t ${t.borderBase}`}>
          <button
            onClick={onResetMachine}
            className={`w-full py-3 min-h-[44px] ${t.buttonDanger} rounded transition-colors font-ui-header text-ui-header shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-[0.98]`}
          >
            Reset Machine
          </button>
        </div>
      </nav>
    </>
  );
};
