import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { ENIGMA_KEYBOARD_ROWS } from '../lib/enigmaEngine';
import { useTheme, getTheme } from '../lib/theme';

interface EnigmaKeyProps {
  char: string;
  isPressed: boolean;
  isCompact: boolean;
  keySize: 'normal' | 'large';
  onPressStart: (char: string) => void;
  onPressEnd: (char: string) => void;
}

const EnigmaKey: React.FC<EnigmaKeyProps> = ({ char, isPressed, isCompact, keySize, onPressStart, onPressEnd }) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);

  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onPressStart(char);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onPressEnd(char);
  };
  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    onPressEnd(char);
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onPressStart(char);
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    onPressEnd(char);
  };
  const handleMouseLeave = () => {
    onPressEnd(char);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const isLarge = keySize === 'large';
  
  if (isCompact) {
    const compactSize = isLarge
      ? 'w-10 h-10 min-w-[40px] min-h-[40px] xs:w-11 xs:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 text-sm xs:text-base sm:text-lg md:text-xl'
      : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 md:min-w-[48px] text-xs xs:text-sm sm:text-base md:text-lg';

    return (
      <button
        type="button"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        className={`${t.keyShape} font-bold flex items-center justify-center cursor-pointer select-none touch-none active:scale-95 transition-all ${compactSize} ${t.fontRotor} ${
          isPressed ? t.keyCompactPressed : t.keyCompactBase
        }`}
        aria-label={`Key ${char}`}
      >
        {char}
      </button>
    );
  }

  const standardSize = isLarge
    ? 'w-9 h-9 min-w-[36px] min-h-[36px] xs:w-10 xs:h-10 xs:min-w-[40px] sm:w-13 sm:h-13 sm:min-w-[52px] md:w-14 md:h-14 md:min-w-[56px] text-sm xs:text-base sm:text-lg md:text-xl'
    : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 md:min-w-[48px] text-xs xs:text-sm sm:text-base md:text-lg';

  return (
    <button
      type="button"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      className={`${t.keyShape} border-2 flex items-center justify-center cursor-pointer select-none touch-none transition-all duration-100 ${standardSize} ${
        isPressed
          ? `translate-y-1 scale-105 ${t.keyPressed}`
          : `${t.keyBase} active:scale-95`
      }`}
      aria-label={`Key ${char}`}
    >
      <span className={`${t.fontRotor} font-bold`}>
        {char}
      </span>
    </button>
  );
};

interface KeyboardPanelProps {
  isCompact: boolean;
  pressedKey: string | null;
  handleKeyPressStart: (char: string) => void;
  handleKeyPressEnd: (char: string) => void;
  keySize?: 'normal' | 'large';
  onToggleKeySize?: () => void;
  onOpenMobileKeyboard?: () => void;
}

export const KeyboardPanel: React.FC<KeyboardPanelProps> = ({
  isCompact,
  pressedKey,
  handleKeyPressStart,
  handleKeyPressEnd,
  keySize = 'normal',
  onToggleKeySize,
  onOpenMobileKeyboard,
}) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);



  const isLarge = keySize === 'large';


  if (isCompact) {
    return (
      <div className={`${t.keyboardPanelBg} border ${t.borderBase} p-2 xs:p-3 sm:p-4 rounded-xl flex flex-col items-center w-full`}>
        <div className={`w-full flex justify-between items-center mb-2 sm:mb-3 pb-1 border-b ${t.borderBase} px-1`}>
          <span className={`text-[10px] sm:text-[11px] ${t.fontMono} ${t.textSecondary} tracking-wider uppercase flex items-center gap-1.5 font-bold`}>
            <span className={`material-symbols-outlined text-xs sm:text-sm ${t.textSecondary}`}>keyboard</span>
            TASTATUR (KEYBOARD)
          </span>
          <div className="flex items-center gap-1.5">
            {onOpenMobileKeyboard && (
              <button
                type="button"
                onClick={onOpenMobileKeyboard}
                className={`text-[9px] sm:text-[10px] ${t.fontMono} px-2 py-0.5 rounded border transition-all flex items-center gap-1 font-bold shadow-sm cursor-pointer ${t.buttonMuted}`}
                title="Open native mobile keyboard"
              >
                <span className="material-symbols-outlined text-[12px]">smartphone</span>
                <span>Mobile Keyboard</span>
              </button>
            )}
            {onToggleKeySize && (
              <button
                type="button"
                onClick={onToggleKeySize}
                className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 cursor-pointer ${
                  isLarge
                    ? `${t.buttonHighlight} font-bold shadow-sm`
                    : `${t.buttonPrimary}`
                }`}
                title="Toggle between normal and large button sizes"
              >
                <span className="material-symbols-outlined text-[11px]">
                  {isLarge ? 'zoom_out' : 'zoom_in'}
                </span>
                <span>{isLarge ? 'Large' : 'Normal'}</span>
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5 w-full max-w-2xl px-0.5">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
              {row.map((char) => (
                <EnigmaKey
                  key={char}
                  char={char}
                  isPressed={pressedKey === char}
                  isCompact={isCompact}
                  keySize={keySize}
                  onPressStart={handleKeyPressStart}
                  onPressEnd={handleKeyPressEnd}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${t.keyboardPanelBg} rounded-lg p-3 sm:p-4 md:p-6 flex flex-col items-center w-full`}>
      <div className={`w-full flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b ${t.borderBase}`}>
        <span className={`${t.fontHeader} ${t.textPrimary} text-xs uppercase tracking-widest flex items-center gap-2`}>
          <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>keyboard</span>
          Keyboard (Tastatur)
        </span>
        <div className="flex items-center gap-2">
          {onOpenMobileKeyboard && (
            <button
              type="button"
              onClick={onOpenMobileKeyboard}
              className={`text-[10px] sm:text-xs ${t.fontMono} px-2.5 py-1 rounded border transition-all flex items-center gap-1 font-bold shadow-sm cursor-pointer ${t.buttonMuted}`}
              title="Open native mobile keyboard"
            >
              <span className="material-symbols-outlined text-sm">smartphone</span>
              <span>Mobile Keyboard</span>
            </button>
          )}
          {onToggleKeySize && (
            <button
              type="button"
              onClick={onToggleKeySize}
              className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                isLarge
                  ? `${t.buttonHighlight} font-bold shadow-sm`
                  : `${t.buttonPrimary}`
              }`}
              title="Toggle between normal and large button sizes"
            >
              <span className="material-symbols-outlined text-xs">
                {isLarge ? 'zoom_out' : 'zoom_in'}
              </span>
              <span>{isLarge ? 'Large Keys' : 'Normal Size'}</span>
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 md:space-y-4 max-w-2xl w-full px-0.5">
        {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3.5">
            {row.map((char) => (
              <EnigmaKey
                key={char}
                char={char}
                isPressed={pressedKey === char}
                isCompact={isCompact}
                keySize={keySize}
                onPressStart={handleKeyPressStart}
                onPressEnd={handleKeyPressEnd}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
