import React from 'react';

const ENIGMA_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
  ['P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];

interface KeyboardPanelProps {
  isCompact: boolean;
  pressedKey: string | null;
  handleKeyPressStart: (char: string) => void;
  handleKeyPressEnd: (char: string) => void;
}

export const KeyboardPanel: React.FC<KeyboardPanelProps> = ({
  isCompact,
  pressedKey,
  handleKeyPressStart,
  handleKeyPressEnd,
}) => {
  if (isCompact) {
    return (
      <div className="metal-plate p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-3 pb-1 border-b border-[#3d3526]/60 px-1">
          <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-xs text-[#8c7e6a]">keyboard</span>
            TASTATUR (KEYBOARD)
          </span>
          <span className="text-[9px] font-monospaced-technical text-[#83715d]">
            PRESS OR CLICK KEYS
          </span>
        </div>

        <div className="space-y-2 sm:space-y-2.5 w-full max-w-lg">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2.5">
              {row.map((char) => {
                const isPressed = pressedKey === char;
                return (
                  <button
                    key={char}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                    onMouseUp={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                    onMouseLeave={() => handleKeyPressEnd(char)}
                    onTouchStart={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                    className={`bakelite-key w-7 h-7 min-w-[28px] xs:w-8 xs:h-8 xs:min-w-[32px] sm:w-10 sm:h-10 rounded-full text-[#e3c193] font-rotor-label font-bold text-[11px] xs:text-xs sm:text-sm flex items-center justify-center cursor-pointer select-none ${
                      isPressed ? 'key-pressed' : ''
                    }`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181307] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-wood flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4 pb-2 border-b border-[#3b3426]">
        <span className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#8b6f47]">keyboard</span>
          Bakelite Keyboard (Tastatur)
        </span>
        <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical">
          CLICK OR PRESS ANY KEY
        </span>
      </div>

      <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-2xl w-full">
        {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-4">
            {row.map((char) => {
              const isPressed = pressedKey === char;
              return (
                <button
                  key={char}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                  onMouseUp={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                  onMouseLeave={() => handleKeyPressEnd(char)}
                  onTouchStart={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                  className={`w-7 h-7 min-w-[28px] xs:w-8 xs:h-8 xs:min-w-[32px] sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 text-[#ede1cd] flex items-center justify-center transition-all cursor-pointer select-none ${
                    isPressed
                      ? 'translate-y-1 bg-[#ebc238] text-[#25190b] border-white font-bold ring-4 ring-[#ebc238]/40 scale-105 shadow-[0_0_15px_#ebc238]'
                      : 'border-[#83715d] bg-[#3b3426] shadow-key-base hover:border-[#e3c193] hover:bg-[#4e453b]'
                  }`}
                >
                  <span className="font-rotor-label font-bold text-xs xs:text-sm sm:text-base md:text-lg">
                    {char}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
