import React from 'react';
import { useTheme, getTheme } from '../lib/theme';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  onOpenShare: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenSettings,
  onOpenInfo,
  onOpenShare,
  onOpenShortcuts
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  return (
    <header className={`${t.modalHeaderBg} shadow-md flex justify-between items-center w-full px-4 md:px-8 h-16 shrink-0 z-50`}>
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onToggleMobileMenu}
          className={`w-11 h-11 flex items-center justify-center ${t.textMuted} hover:${t.textAccent} hover:bg-black/5 rounded-full transition-colors cursor-pointer`}
          id="mobile-menu-btn"
          aria-label="Toggle menu"
          title="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className={`${t.fontRotor} tracking-widest uppercase text-lg md:text-2xl truncate`}>
          Enigma Emulator
        </span>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={onOpenShortcuts}
          className={`w-11 h-11 flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
          title="Keyboard Shortcuts (F9 / ?)"
          aria-label="Keyboard Shortcuts"
        >
          <span className="material-symbols-outlined material-fill-0">keyboard</span>
        </button>
        <button
          onClick={onOpenSettings}
          className={`w-11 h-11 flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
          title="Settings (^S)"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined material-fill-0">settings</span>
        </button>
        <button
          onClick={onOpenInfo}
          className={`w-11 h-11 flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
          title="Historical Information (F7 / ^H)"
          aria-label="Info"
        >
          <span className="material-symbols-outlined material-fill-0">info</span>
        </button>
        <button
          onClick={onOpenShare}
          className={`w-11 h-11 hidden md:flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
          title="Share Configuration (F8 / ^Shift+S)"
          aria-label="Share"
        >
          <span className="material-symbols-outlined material-fill-0">share</span>
        </button>
      </div>
    </header>
  );
};
