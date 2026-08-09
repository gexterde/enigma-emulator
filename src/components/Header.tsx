import React from 'react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenSettings,
  onOpenInfo,
  onOpenShare
}) => {
  return (
    <header className="shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6)] bg-[#3b3426] shadow-md flex justify-between items-center w-full px-4 md:px-8 h-16 shrink-0 z-50">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="w-11 h-11 flex items-center justify-center text-[#d1c4b7] hover:bg-[#2f291c] rounded-full transition-colors cursor-pointer"
          id="mobile-menu-btn"
          aria-label="Toggle menu"
          title="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-rotor-label font-rotor-label text-[#e3c193] tracking-widest uppercase text-lg md:text-2xl truncate">
          Enigma Emulator
        </span>
      </div>
      <div className="flex items-center gap-1 md:gap-4">
        <button
          onClick={onOpenSettings}
          className="w-11 h-11 flex items-center justify-center text-[#d1c4b7] hover:bg-[#2f291c] transition-colors rounded-full transform active:scale-95 transition-all"
          title="Settings"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
        </button>
        <button
          onClick={onOpenInfo}
          className="w-11 h-11 flex items-center justify-center text-[#d1c4b7] hover:bg-[#2f291c] transition-colors rounded-full transform active:scale-95 transition-all"
          title="Historical Information"
          aria-label="Info"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>info</span>
        </button>
        <button
          onClick={onOpenShare}
          className="w-11 h-11 flex items-center justify-center text-[#d1c4b7] hover:bg-[#2f291c] transition-colors rounded-full transform active:scale-95 transition-all hidden md:flex"
          title="Share Configuration"
          aria-label="Share"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>share</span>
        </button>
      </div>
    </header>
  );
};
