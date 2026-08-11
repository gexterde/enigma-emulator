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
}

const LampSocket: React.FC<LampSocketProps> = ({ char, isLit, isDimIdle, batteryMode, isCompact }) => {
  if (isCompact) {
    let lampClass = '';
    if (isLit) {
      if (batteryMode === 'dkl') lampClass = 'lamp-on-dkl scale-102';
      else if (batteryMode === 'sammler') lampClass = 'lamp-on-sammler scale-110';
      else lampClass = 'lamp-on-hell scale-105';
    }

    let idleClass = '';
    if (isDimIdle) {
      if (batteryMode === 'dkl') idleClass = 'lamp-dim-glow-dkl';
      else if (batteryMode === 'sammler') idleClass = 'lamp-dim-glow-sammler';
      else idleClass = 'lamp-dim-glow';
    }

    return (
      <div
        className={`lamp-socket w-7 h-7 min-w-[28px] xs:w-8 xs:h-8 xs:min-w-[32px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${lampClass}`}
      >
        <div
          className={`lamp-glass w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-lamp-char text-[11px] xs:text-xs sm:text-sm font-bold ${idleClass}`}
        >
          {char}
        </div>
      </div>
    );
  }

  let litStyle = 'bg-[#120e04] border-[#3b3426] text-[#83715d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]';

  if (isLit) {
    if (batteryMode === 'dkl') {
      litStyle = 'bg-[#cba832] border-[#f1e09d] text-[#25190b] shadow-[0_0_12px_#d48800] font-bold scale-102 opacity-80';
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

  return (
    <div
      className={`w-7 h-7 min-w-[28px] xs:w-8 xs:h-8 xs:min-w-[32px] sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${litStyle}`}
    >
      <span className="font-lamp-char text-xs xs:text-sm sm:text-lg md:text-xl font-bold">
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
}

export const LampboardPanel: React.FC<LampboardPanelProps> = ({
  isCompact,
  batteryMode,
  litLamp,
  dimIdleLights,
}) => {
  const isPowerOn = batteryMode !== 'aus';

  if (isCompact) {
    return (
      <div className="metal-plate p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-3 pb-1 border-b border-[#3d3526]/60 px-1">
          <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-xs text-[#ebc238]">lightbulb</span>
            LAMPENFELD (LAMPBOARD)
          </span>
          {isPowerOn && litLamp && (
            <span className={`animate-pulse text-[10px] font-monospaced-technical px-2 py-0.5 rounded border font-bold ${
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

        <div className="space-y-2 sm:space-y-2.5 w-full max-w-lg">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2.5">
              {row.map((char) => (
                <LampSocket
                  key={char}
                  char={char}
                  isLit={isPowerOn && litLamp === char}
                  isDimIdle={isPowerOn && !litLamp && dimIdleLights}
                  batteryMode={batteryMode}
                  isCompact={isCompact}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-metal flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4 pb-2 border-b border-[#3b3426]">
        <span className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#ebc238]">lightbulb</span>
          Lampboard (Glühlampenfeld)
        </span>
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

      <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-2xl w-full">
        {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-4">
            {row.map((char) => (
              <LampSocket
                key={char}
                char={char}
                isLit={isPowerOn && litLamp === char}
                isDimIdle={isPowerOn && !litLamp && dimIdleLights}
                batteryMode={batteryMode}
                isCompact={isCompact}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
