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
    let lampClass = `${t.lampSocketBg} ${t.lampSocketBorder}`;
    let innerGlassClasses = `${t.lampSocketInnerBg} ${t.lampSocketInnerText} ${t.lampSocketInnerShadow}`;

    if (isLit) {
      if (batteryMode === 'dkl') {
        lampClass = t.lampLitDkl + ' scale-105';
        innerGlassClasses = t.lampInnerLitDkl;
      } else if (batteryMode === 'sammler') {
        lampClass = t.lampLitSammler + ' scale-110';
        innerGlassClasses = t.lampInnerLitSammler;
      } else {
        lampClass = t.lampLitGlow + ' border-[#fff5d6] scale-105';
        innerGlassClasses = t.lampInnerLitHell;
      }
    } else if (isDimIdle) {
      if (batteryMode === 'dkl') {
        lampClass = t.lampDimDkl;
      } else if (batteryMode === 'sammler') {
        lampClass = t.lampDimSammler;
      } else {
        lampClass = t.lampDim;
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
    if (batteryMode === 'dkl') {
      litStyle = t.lampLitDkl;
    } else if (batteryMode === 'sammler') {
      litStyle = t.lampLitSammler;
    } else {
      litStyle = t.lampLit;
    }
  } else if (isDimIdle) {
    if (batteryMode === 'dkl') {
      litStyle = t.lampDimDkl;
    } else if (batteryMode === 'sammler') {
      litStyle = t.lampDimSammler;
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
            <span className={`material-symbols-outlined text-xs sm:text-sm ${t.textAccent}`}>lightbulb</span>
            LAMPENFELD (LAMPBOARD)
          </span>
          <div className="flex items-center gap-1.5">
            {onToggleKeySize && (
              <button
                type="button"
                onClick={onToggleKeySize}
                className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 cursor-pointer ${
                  isLarge
                    ? t.buttonHighlight + ' font-bold shadow-sm'
                    : t.buttonPrimary
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
                batteryMode === 'dkl'
                  ? t.litLampBadgeDkl
                  : batteryMode === 'sammler'
                  ? t.litLampBadgeSammler
                  : t.litLampBadgeHell
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
          <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>lightbulb</span>
          Lampboard (Glühlampenfeld)
        </span>
        <div className="flex items-center gap-2">
          {onToggleKeySize && (
            <button
              type="button"
              onClick={onToggleKeySize}
              className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                isLarge
                  ? t.buttonHighlight + ' font-bold shadow-sm'
                  : t.buttonPrimary
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
              batteryMode === 'dkl'
                ? t.litLampBadgeDkl
                : batteryMode === 'sammler'
                ? t.litLampBadgeSammler
                : t.litLampBadgeHell
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
