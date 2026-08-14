import React from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { User } from '../hooks/useAuth';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  onOpenShare: () => void;
  onOpenShortcuts: () => void;
  onOpenAdmin: () => void;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  senderCallSign?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenSettings,
  onOpenInfo,
  onOpenShare,
  onOpenShortcuts,
  onOpenAdmin,
  user,
  onLoginClick,
  onLogoutClick,
  senderCallSign
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
        <span className={`${t.fontRotor} tracking-widest uppercase text-base sm:text-lg md:text-2xl truncate`}>
          Enigma Emulator
        </span>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        {user ? (
          <div className="flex items-center bg-black/10 rounded-lg px-2 md:px-3 h-10 border border-zinc-500/20 mr-1 md:mr-2 shadow-inner">
            <span className={`hidden md:inline text-xs font-bold ${t.textMuted} mr-2 uppercase tracking-wider`}>Absender:</span>
            <span className={`${t.fontHeader} text-base md:text-lg ${t.textPrimary} tracking-widest`}>
              {senderCallSign || 'DFS'}
            </span>
            <div className="w-px h-5 bg-zinc-500/30 mx-2 md:mx-3"></div>
            <button
              onClick={onLogoutClick}
              className={`flex items-center justify-center ${t.textMuted} hover:${t.textAccent} transition-colors transform active:scale-95 text-xs font-bold uppercase tracking-wider`}
              title={`Logged in as ${user.email} - Click to Logout`}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className={`px-3 h-10 flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-lg transform active:scale-95 text-xs font-bold uppercase tracking-wider`}
          >
            <span className="material-symbols-outlined material-fill-0 mr-1 text-sm">login</span>
            <span className="hidden md:inline">Login</span>
          </button>
        )}
        <button
          onClick={onOpenShortcuts}
          className={`w-11 h-11 hidden md:flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
          title="Keyboard Shortcuts (F9 / ?)"
          aria-label="Keyboard Shortcuts"
        >
          <span className="material-symbols-outlined material-fill-0">keyboard</span>
        </button>
        <button
          onClick={onOpenSettings}
          className={`w-11 h-11 hidden md:flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
          title="Settings (^S)"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined material-fill-0">settings</span>
        </button>
        {user?.isAdmin && (
          <button
            onClick={onOpenAdmin}
            className={`w-11 h-11 hidden md:flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
            title="Database Admin"
            aria-label="Admin"
          >
            <span className="material-symbols-outlined material-fill-0">admin_panel_settings</span>
          </button>
        )}
        <button
          onClick={onOpenInfo}
          className={`w-11 h-11 hidden md:flex items-center justify-center ${t.textMuted} hover:bg-black/5 hover:${t.textAccent} transition-colors rounded-full transform active:scale-95`}
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
