import React from 'react';

const ENIGMA_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
  ['P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];

interface EnigmaKeyProps {
  char: string;
  isPressed: boolean;
  isCompact: boolean;
  keySize?: 'normal' | 'large';
  onPressStart: (char: string) => void;
  onPressEnd: (char: string) => void;
}

const EnigmaKey: React.FC<EnigmaKeyProps> = ({
  char,
  isPressed,
  isCompact,
  keySize = 'normal',
  onPressStart,
  onPressEnd
}) => {
  const isLarge = keySize === 'large';

  // Handle touch events for instant mobile response
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

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary button only
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

  // Prevent context menu (long press callout on mobile browsers)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  if (isCompact) {
    const compactSize = isLarge
      ? 'w-9 h-9 min-w-[36px] min-h-[36px] xs:w-10 xs:h-10 xs:min-w-[40px] xs:min-h-[40px] sm:w-12 sm:h-12 sm:min-w-[48px] sm:min-h-[48px] md:w-14 md:h-14 text-sm xs:text-base sm:text-lg md:text-xl'
      : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] xs:min-h-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 text-xs xs:text-sm sm:text-base';

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
        className={`bakelite-key rounded-full text-[#e3c193] font-rotor-label font-bold flex items-center justify-center cursor-pointer select-none touch-none active:scale-95 transition-all ${compactSize} ${
          isPressed ? 'key-pressed ring-2 ring-[#ebc238]/60' : ''
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
      className={`rounded-full border-2 text-[#ede1cd] flex items-center justify-center cursor-pointer select-none touch-none transition-all duration-100 ${standardSize} ${
        isPressed
          ? 'translate-y-1 bg-[#ebc238] text-[#25190b] border-white font-bold ring-4 ring-[#ebc238]/40 scale-105 shadow-[0_0_15px_#ebc238]'
          : 'border-[#83715d] bg-[#3b3426] shadow-key-base hover:border-[#e3c193] hover:bg-[#4e453b] active:scale-95'
      }`}
      aria-label={`Key ${char}`}
    >
      <span className="font-rotor-label font-bold">
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
  const isLarge = keySize === 'large';

  if (isCompact) {
    return (
      <div className="metal-plate p-2 xs:p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center w-full">
        <div className="w-full flex justify-between items-center mb-2 sm:mb-3 pb-1 border-b border-[#3d3526]/60 px-1">
          <span className="text-[10px] sm:text-[11px] font-monospaced-technical text-[#8c7e6a] tracking-wider uppercase flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-xs sm:text-sm text-[#8c7e6a]">keyboard</span>
            TASTATUR (KEYBOARD)
          </span>

          <div className="flex items-center gap-1.5">
            {onOpenMobileKeyboard && (
              <button
                type="button"
                onClick={onOpenMobileKeyboard}
                className="text-[9px] sm:text-[10px] font-monospaced-technical px-2 py-0.5 rounded border border-[#ebc238]/60 bg-[#251b0a] text-[#ebc238] hover:bg-[#ebc238] hover:text-[#181307] transition-all flex items-center gap-1 font-bold shadow-sm cursor-pointer"
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
                className={`text-[9px] sm:text-[10px] font-monospaced-technical px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 cursor-pointer ${
                  isLarge
                    ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-sm'
                    : 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
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
    <div className="bg-[#181307] border border-[#4e453b] rounded-lg p-3 sm:p-4 md:p-6 shadow-panel texture-wood flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b border-[#3b3426]">
        <span className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#8b6f47]">keyboard</span>
          Bakelite Keyboard (Tastatur)
        </span>

        <div className="flex items-center gap-2">
          {onOpenMobileKeyboard && (
            <button
              type="button"
              onClick={onOpenMobileKeyboard}
              className="text-[10px] sm:text-xs font-monospaced-technical px-2.5 py-1 rounded border border-[#ebc238]/60 bg-[#251b0a] text-[#ebc238] hover:bg-[#ebc238] hover:text-[#181307] transition-all flex items-center gap-1 font-bold shadow-sm cursor-pointer"
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
              className={`text-[10px] font-monospaced-technical px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                isLarge
                  ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-sm'
                  : 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
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
