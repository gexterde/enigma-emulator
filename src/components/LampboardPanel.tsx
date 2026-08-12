import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { ENIGMA_KEYBOARD_ROWS } from '../lib/enigmaEngine';
import { useTheme, getTheme } from '../lib/theme';

interface LampSocketProps {
  char: string;
  isLit: boolean;
  isDimIdle: boolean;
  batteryMode: string;
  isCompact: boolean;
  keySize: 'normal' | 'large';
}

const LampSocket: React.FC<LampSocketProps> = ({ char, isLit, isDimIdle, batteryMode, isCompact, keySize }) => {
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);

  const isLarge = keySize === 'large';

  if (isCompact) {
    let idleClass = '';
    let lampClass = theme === 'vintage' ? 'bg-[#15120c] border-[#2e271d]' : 'bg-slate-200 border-slate-300';
    let innerGlassClasses = theme === 'vintage' ? 'bg-[#282319]/80 text-[#8c7e6a] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]' : 'bg-slate-100 text-slate-400';

    if (isLit) {
      if (theme === 'vintage') {
        if (batteryMode === 'dkl') {
          lampClass = 'bg-[#cba832] border-[#f1e09d] scale-105 opacity-80 shadow-[0_0_8px_#d48800]';
          innerGlassClasses = 'bg-[#d48800] text-[#3d2100] font-bold shadow-[inset_0_0_4px_#ffe0a3]';
        } else if (batteryMode === 'sammler') {
          lampClass = 'bg-[#ffea70] border-[#ffffff] scale-110 shadow-[0_0_20px_#ffff80]';
          innerGlassClasses = 'bg-[#e6a100] text-[#1a0f00] font-bold shadow-[inset_0_0_8px_#ffffff]';
        } else {
          lampClass = 'bg-[#ebc238] border-[#fff5d6] scale-105 shadow-[0_0_12px_#ffc83b]';
          innerGlassClasses = 'bg-[#ffc83b] text-[#2b1700] font-bold shadow-[inset_0_0_6px_#ffffff]';
        }
      } else {
        lampClass = 'bg-blue-600 border-blue-400 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.5)]';
        innerGlassClasses = 'bg-blue-500 text-white font-bold';
      }
    } else if (isDimIdle) {
      if (theme === 'vintage') {
        idleClass = batteryMode === 'dkl' 
          ? 'lamp-dim-glow-dkl' 
          : batteryMode === 'sammler'
            ? 'lamp-dim-glow-sammler'
            : 'lamp-dim-glow';
      } else {
        lampClass = 'bg-blue-50 border-blue-200 shadow-sm animate-bulb-flicker';
        innerGlassClasses = 'bg-blue-100 text-blue-600 font-medium';
      }
    }

    const sizeClasses = isLarge
      ? 'w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 md:w-15 md:h-15 text-xs xs:text-sm sm:text-base md:text-lg'
      : 'w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-[11px] xs:text-xs sm:text-sm';

    return (
      <div
        className={`${t.lampShape} select-none flex items-center justify-center transition-all ${sizeClasses} ${lampClass}`}
      >
        <div
          className={`${t.lampShape} w-full h-full flex items-center justify-center font-bold ${innerGlassClasses} ${idleClass} ${t.fontMono}`}
        >
          {char}
        </div>
      </div>
    );
  }

  let litStyle = t.lampBase;

  if (isLit) {
    if (theme === 'vintage') {
      if (batteryMode === 'dkl') {
        litStyle = 'bg-[#cba832] border-[#f1e09d] text-[#25190b] shadow-[0_0_12px_#d48800] font-bold scale-105 opacity-80';
      } else if (batteryMode === 'sammler') {
        litStyle = 'bg-[#ffea70] border-[#ffffff] text-[#1a0f00] shadow-[0_0_25px_#ffff80,0_0_50px_#ffc83b] font-bold scale-110';
      } else {
        litStyle = 'bg-[#ebc238] border-[#fff5d6] text-[#25190b] shadow-lamp-glow font-bold scale-105';
      }
    } else {
      litStyle = t.lampLit;
    }
  } else if (isDimIdle) {
    if (theme === 'vintage') {
      if (batteryMode === 'dkl') {
        litStyle = 'lamp-dim-glow-dkl border-[#ebc238]/30';
      } else if (batteryMode === 'sammler') {
        litStyle = 'lamp-dim-glow-sammler border-[#ffea70]/70';
      } else {
        litStyle = 'lamp-dim-glow border-[#ebc238]/50';
      }
    } else {
      litStyle = t.lampDim;
    }
  }

  const standardSizeClasses = isLarge
    ? 'w-9 h-9 min-w-[36px] min-h-[36px] xs:w-10 xs:h-10 xs:min-w-[40px] sm:w-13 sm:h-13 sm:min-w-[52px] md:w-14 md:h-14 md:min-w-[56px] text-sm xs:text-base sm:text-xl md:text-2xl'
    : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 md:min-w-[48px] text-xs xs:text-sm sm:text-lg md:text-xl';

  return (
    <div
      className={`${t.lampShape} border-2 select-none flex items-center justify-center transition-all duration-100 ${standardSizeClasses} ${litStyle}`}
    >
      <span className={`${t.fontMono} font-bold`}>
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
  const { theme, setTheme } = useTheme();
  const t = getTheme(theme);



  const isPowerOn = batteryMode !== 'aus';
  const isLarge = keySize === 'large';


  if (isCompact) {
    return (
      <div className={`${t.compactPlateBg} p-2 xs:p-3 sm:p-4 rounded-xl flex flex-col items-center w-full`}>
        <div className={`w-full flex justify-between items-center mb-2 sm:mb-3 pb-1 border-b ${t.borderBase} px-1`}>
          <span className={`text-[10px] sm:text-[11px] ${t.fontMono} ${t.textSecondary} tracking-wider uppercase flex items-center gap-1.5 font-bold`}>
            <span className={`material-symbols-outlined text-xs sm:text-sm ${theme === 'vintage' ? t.textAccent : 'text-blue-500'}`}>lightbulb</span>
            LAMPENFELD (LAMPBOARD)
          </span>
          <div className="flex items-center gap-1.5">
            {onToggleKeySize && (
              <button
                type="button"
                onClick={onToggleKeySize}
                className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 cursor-pointer ${
                  isLarge
                    ? (theme === 'vintage' ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-sm' : 'bg-blue-600 text-white border-blue-600 shadow-sm')
                    : (theme === 'vintage' ? 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')
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
              <span className={`animate-pulse text-[10px] ${t.fontMono} px-2 py-0.5 rounded border font-bold ${
                theme === 'vintage' ? (
                  batteryMode === 'dkl'
                    ? 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40'
                    : batteryMode === 'sammler'
                    ? 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]'
                    : 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40'
                ) : 'text-yellow-700 bg-yellow-100 border-yellow-300'
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
    <div className={`${t.lampboardPanelBg} rounded-lg p-3 sm:p-4 md:p-6 flex flex-col items-center w-full`}>
      <div className={`w-full flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b ${t.borderBase}`}>
        <span className={`${t.fontHeader} ${t.textPrimary} text-xs uppercase tracking-widest flex items-center gap-2`}>
          <span className={`material-symbols-outlined text-sm ${theme === 'vintage' ? t.textAccent : 'text-blue-500'}`}>lightbulb</span>
          Lampboard (Glühlampenfeld)
        </span>
        <div className="flex items-center gap-2">
          {onToggleKeySize && (
            <button
              type="button"
              onClick={onToggleKeySize}
              className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                isLarge
                  ? (theme === 'vintage' ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-sm' : 'bg-blue-600 text-white border-blue-600 shadow-sm')
                  : (theme === 'vintage' ? 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')
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
            <span className={`animate-pulse text-xs ${t.fontMono} px-2 py-0.5 rounded border font-bold ${
              theme === 'vintage' ? (
                batteryMode === 'dkl'
                  ? 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40'
                  : batteryMode === 'sammler'
                  ? 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]'
                  : 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40'
              ) : 'text-yellow-700 bg-yellow-100 border-yellow-300'
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
