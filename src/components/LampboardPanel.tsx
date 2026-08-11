import React from 'react';

const ENIGMA_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
  ['P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];

interface LampSocketProps {
  char: string;
  isLit: boolean;
  isDimIdle: boolean;
  batteryMode: string;
  isCompact: boolean;
  keySize?: 'normal' | 'large';
}

const LampSocket: React.FC<LampSocketProps> = ({
  char,
  isLit,
  isDimIdle,
  batteryMode,
  isCompact,
  keySize = 'normal'
}) => {
  const isLarge = keySize === 'large';

  if (isCompact) {
    let lampClass = '';
    if (isLit) {
      if (batteryMode === 'dkl') lampClass = 'lamp-on-dkl scale-105';
      else if (batteryMode === 'sammler') lampClass = 'lamp-on-sammler scale-110';
      else lampClass = 'lamp-on-hell scale-105';
    }

    let idleClass = '';
    if (isDimIdle) {
      if (batteryMode === 'dkl') idleClass = 'lamp-dim-glow-dkl';
      else if (batteryMode === 'sammler') idleClass = 'lamp-dim-glow-sammler';
      else idleClass = 'lamp-dim-glow';
    }

    // Dynamic responsive size classes optimized for mobile touch
    const sizeClasses = isLarge
      ? 'w-9 h-9 min-w-[36px] min-h-[36px] xs:w-10 xs:h-10 xs:min-w-[40px] xs:min-h-[40px] sm:w-12 sm:h-12 sm:min-w-[48px] sm:min-h-[48px] md:w-14 md:h-14'
      : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] xs:min-h-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12';

    const innerGlassClasses = isLarge
      ? 'w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 text-xs xs:text-sm sm:text-base md:text-lg'
      : 'w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-[11px] xs:text-xs sm:text-sm';

    return (
      <div
        className={`lamp-socket select-none rounded-full flex items-center justify-center transition-all ${sizeClasses} ${lampClass}`}
      >
        <div
          className={`lamp-glass rounded-full flex items-center justify-center font-lamp-char font-bold ${innerGlassClasses} ${idleClass}`}
        >
          {char}
        </div>
      </div>
    );
  }

  let litStyle = 'bg-[#120e04] border-[#3b3426] text-[#83715d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]';

  if (isLit) {
    if (batteryMode === 'dkl') {
      litStyle = 'bg-[#cba832] border-[#f1e09d] text-[#25190b] shadow-[0_0_12px_#d48800] font-bold scale-105 opacity-80';
    } else if (batteryMode === 'sammler') {
      litStyle = 'bg-[#ffea70] border-[#ffffff] text-[#1a0f00] shadow-[0_0_25px_#ffff80,0_0_50px_#ffc83b] font-bold scale-110';
    } else {
      litStyle = 'bg-[#ebc238] border-[#fff5d6] text-[#25190b] shadow-lamp-glow font-bold scale-105';
    }
  } else if (isDimIdle) {
    if (batteryMode === 'dkl') {
      litStyle = 'lamp-dim-glow-dkl border-[#ebc238]/30';
    } else if (batteryMode === 'sammler') {
      litStyle = 'lamp-dim-glow-sammler border-[#ffea70]/70';
    } else {
      litStyle = 'lamp-dim-glow border-[#ebc238]/50';
    }
  }

  const standardSizeClasses = isLarge
    ? 'w-9 h-9 min-w-[36px] min-h-[36px] xs:w-10 xs:h-10 xs:min-w-[40px] sm:w-13 sm:h-13 sm:min-w-[52px] md:w-14 md:h-14 md:min-w-[56px] text-sm xs:text-base sm:text-xl md:text-2xl'
    : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 md:min-w-[48px] text-xs xs:text-sm sm:text-lg md:text-xl';

  return (
    <div
      className={`rounded-full border-2 select-none flex items-center justify-center transition-all duration-100 ${standardSizeClasses} ${litStyle}`}
    >
      <span className="font-lamp-char font-bold">
        {char}
      </span>
    </div>
  );
};

interface LampboardPanelProps {
  isCompact: boolean;
  batteryMode: string;
  litLamp: string | null;
  dimIdleLights: boolean;
  keySize?: 'normal' | 'large';
  onToggleKeySize?: () => void;
}

export const LampboardPanel: React.FC<LampboardPanelProps> = ({
  isCompact,
  batteryMode,
  litLamp,
  dimIdleLights,
  keySize = 'normal',
  onToggleKeySize,
}) => {
  const isPowerOn = batteryMode !== 'aus';
  const isLarge = keySize === 'large';

  if (isCompact) {
    return (
      <div className="metal-plate p-2 xs:p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center w-full">
        <div className="w-full flex justify-between items-center mb-2 sm:mb-3 pb-1 border-b border-[#3d3526]/60 px-1">
          <span className="text-[10px] sm:text-[11px] font-monospaced-technical text-[#d1c4b7] tracking-wider uppercase flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-xs sm:text-sm text-[#ebc238]">lightbulb</span>
            LAMPENFELD (LAMPBOARD)
          </span>

          <div className="flex items-center gap-1.5">
            {onToggleKeySize && (
              <button
                type="button"
                onClick={onToggleKeySize}
                className={`text-[9px] sm:text-[10px] font-monospaced-technical px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 cursor-pointer ${
                  isLarge
                    ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-sm'
                    : 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
                }`}
                title="Toggle touch size between normal and large"
              >
                <span className="material-symbols-outlined text-[11px]">
                  {isLarge ? 'zoom_out' : 'zoom_in'}
                </span>
                <span>{isLarge ? 'Large Size' : 'Normal'}</span>
              </button>
            )}

            {isPowerOn && litLamp && (
              <span className={`animate-pulse text-[10px] font-monospaced-technical px-2 py-0.5 rounded border font-bold ${
                batteryMode === 'dkl'
                  ? 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40'
                  : batteryMode === 'sammler'
                  ? 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]'
                  : 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40'
              }`}>
                {batteryMode === 'dkl' && '2.5V: '}
                {batteryMode === 'sammler' && '4V: '}
                {batteryMode === 'hell' && '3.5V: '}
                {litLamp}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5 xs:space-y-2 sm:space-y-2.5 w-full max-w-2xl px-0.5">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
              {row.map((char) => (
                <LampSocket
                  key={char}
                  char={char}
                  isLit={isPowerOn && litLamp === char}
                  isDimIdle={isPowerOn && !litLamp && dimIdleLights}
                  batteryMode={batteryMode}
                  isCompact={isCompact}
                  keySize={keySize}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-3 sm:p-4 md:p-6 shadow-panel texture-metal flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b border-[#3b3426]">
        <span className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#ebc238]">lightbulb</span>
          Lampboard (Glühlampenfeld)
        </span>

        <div className="flex items-center gap-2">
          {onToggleKeySize && (
            <button
              type="button"
              onClick={onToggleKeySize}
              className={`text-[10px] font-monospaced-technical px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                isLarge
                  ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-sm'
                  : 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
              }`}
              title="Toggle touch size between normal and large"
            >
              <span className="material-symbols-outlined text-xs">
                {isLarge ? 'zoom_out' : 'zoom_in'}
              </span>
              <span>{isLarge ? 'Large Keys' : 'Normal Size'}</span>
            </button>
          )}

          {isPowerOn && litLamp && (
            <span className={`animate-pulse text-xs font-monospaced-technical px-2 py-0.5 rounded border font-bold ${
              batteryMode === 'dkl'
                ? 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40'
                : batteryMode === 'sammler'
                ? 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]'
                : 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40'
            }`}>
              {batteryMode === 'dkl' && 'LAMP LIT (2.5V DIM): '}
              {batteryMode === 'sammler' && 'LAMP LIT (4V SAMMLER): '}
              {batteryMode === 'hell' && 'LAMP LIT (3.5V): '}
              {litLamp}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 md:space-y-4 max-w-2xl w-full px-0.5">
        {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3.5">
            {row.map((char) => (
              <LampSocket
                key={char}
                char={char}
                isLit={isPowerOn && litLamp === char}
                isDimIdle={isPowerOn && !litLamp && dimIdleLights}
                batteryMode={batteryMode}
                isCompact={isCompact}
                keySize={keySize}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
