import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { ENIGMA_KEYBOARD_ROWS } from '../lib/enigmaEngine';
import { useTheme, getTheme } from '../lib/theme';

interface LampSocketProps {
  char: string;
  isLit: boolean;
  isDimIdle: boolean;
  batteryMode: string;
  batteryLevel: number;
  isCompact: boolean;
  keySize: 'normal' | 'large';
}

const LampSocket: React.FC<LampSocketProps> = ({ char, isLit, isDimIdle, batteryMode, batteryLevel, isCompact, keySize }) => {
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

    const brightnessStyle = isLit
      ? { opacity: Math.max(0.15, batteryLevel / 100) }
      : isDimIdle
      ? { opacity: Math.max(0.08, (batteryLevel / 100) * 0.4) }
      : undefined;

    const sizeClasses = isLarge
      ? 'w-10 h-10 min-w-[40px] min-h-[40px] xs:w-11 xs:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 text-sm xs:text-base sm:text-lg md:text-xl'
      : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 md:min-w-[48px] text-xs xs:text-sm sm:text-base md:text-lg';

    return (
      <div
        className={`${t.lampShape} select-none flex items-center justify-center transition-all ${sizeClasses} ${lampClass}`}
        style={brightnessStyle}
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

  const brightnessStyle = isLit
    ? { opacity: Math.max(0.15, batteryLevel / 100) }
    : isDimIdle
    ? { opacity: Math.max(0.08, (batteryLevel / 100) * 0.4) }
    : undefined;

  const standardSizeClasses = isLarge
    ? 'w-9 h-9 min-w-[36px] min-h-[36px] xs:w-10 xs:h-10 xs:min-w-[40px] sm:w-13 sm:h-13 sm:min-w-[52px] md:w-14 md:h-14 md:min-w-[56px] text-sm xs:text-base sm:text-xl md:text-2xl'
    : 'w-8 h-8 min-w-[32px] min-h-[32px] xs:w-9 xs:h-9 xs:min-w-[36px] sm:w-11 sm:h-11 sm:min-w-[44px] md:w-12 md:h-12 md:min-w-[48px] text-xs xs:text-sm sm:text-lg md:text-xl';

  return (
    <div
      className={`${t.lampShape} border-2 select-none flex items-center justify-center transition-all duration-100 ${standardSizeClasses} ${litStyle}`}
      style={brightnessStyle}
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
  batteryLevel: number;
  litLamp: string | null;
  pressedKey?: string | null;
  dimIdleLights: boolean;
  keySize?: 'normal' | 'large';
  onToggleKeySize?: () => void;
}

export const LampboardPanel: React.FC<LampboardPanelProps> = ({
  isCompact,
  batteryMode,
  batteryLevel,
  litLamp,
  pressedKey,
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
      <div className={`${t.lampboardPanelBg} border ${t.borderBase} p-2 xs:p-3 sm:p-4 rounded-xl flex flex-col items-center w-full`}>
        <div className={`w-full flex flex-nowrap justify-between items-center mb-2 sm:mb-3 pb-1 border-b ${t.borderBase} px-1 min-h-[32px]`}>
          <span className={`text-[10px] sm:text-[11px] ${t.fontMono} ${t.textSecondary} tracking-wider uppercase flex items-center gap-1 sm:gap-1.5 font-bold shrink-0 truncate max-w-[45%] sm:max-w-none`}>
            <span className={`material-symbols-outlined text-xs sm:text-sm ${t.textAccent}`}>lightbulb</span>
            <span className="hidden xs:inline">LAMPENFELD (LAMPBOARD)</span>
            <span className="xs:hidden">LAMPBOARD</span>
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {onToggleKeySize && (
              <button
                type="button"
                onClick={onToggleKeySize}
                className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 cursor-pointer shrink-0 ${
                  isLarge
                    ? t.buttonHighlight + ' font-bold shadow-sm'
                    : t.buttonPrimary
                }`}
                title="Toggle touch size between normal and large"
              >
                <span className="material-symbols-outlined text-[11px]">
                  {isLarge ? 'zoom_out' : 'zoom_in'}
                </span>
                <span className="hidden xs:inline">{isLarge ? 'Large Size' : 'Normal'}</span>
                <span className="xs:hidden">{isLarge ? 'Large' : 'Norm'}</span>
              </button>
            )}
            <div className={`h-5 sm:h-6 flex items-center min-w-[50px] sm:min-w-[120px] justify-end ${isPowerOn && (litLamp || pressedKey) ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-75`}>
              <span className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 whitespace-nowrap ${
                batteryMode === 'dkl'
                  ? t.litLampBadgeDkl
                  : batteryMode === 'sammler'
                  ? t.litLampBadgeSammler
                  : t.litLampBadgeHell
              }`}>
                {pressedKey && (
                  <span className="opacity-90 font-normal">
                    KEY <span className="font-bold underline">{pressedKey}</span> ➔{' '}
                  </span>
                )}
                <span className="hidden sm:inline">
                  {batteryMode === 'dkl' && '2.5V: '}
                  {batteryMode === 'sammler' && '4V: '}
                  {batteryMode === 'hell' && '3.5V: '}
                </span>
                {!pressedKey && <span className="sm:hidden">LIT: </span>}
                <span className="font-black">{litLamp || ' '}</span>
              </span>
            </div>
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
                  batteryLevel={batteryLevel}
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
      <div className={`w-full flex flex-nowrap justify-between items-center mb-3 sm:mb-4 pb-2 border-b ${t.borderBase} min-h-[36px] sm:min-h-[40px]`}>
        <span className={`${t.fontHeader} ${t.textPrimary} text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2 shrink-0 truncate max-w-[45%] sm:max-w-none`}>
          <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>lightbulb</span>
          <span className="hidden xs:inline">Lampboard (Glühlampenfeld)</span>
          <span className="xs:hidden">Lampboard</span>
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleKeySize && (
            <button
              type="button"
              onClick={onToggleKeySize}
              className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 sm:px-2 py-0.5 rounded border transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0 ${
                isLarge
                  ? t.buttonHighlight + ' font-bold shadow-sm'
                  : t.buttonPrimary
              }`}
              title="Toggle touch size between normal and large"
            >
              <span className="material-symbols-outlined text-[11px] sm:text-xs">
                {isLarge ? 'zoom_out' : 'zoom_in'}
              </span>
              <span className="hidden xs:inline">{isLarge ? 'Large Keys' : 'Normal Size'}</span>
              <span className="xs:hidden">{isLarge ? 'Large' : 'Normal'}</span>
            </button>
          )}
          <div className={`h-6 sm:h-7 flex items-center min-w-[60px] sm:min-w-[140px] justify-end ${isPowerOn && (litLamp || pressedKey) ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-75`}>
            <span className={`text-[10px] sm:text-xs ${t.fontMono} px-1.5 sm:px-2 py-0.5 rounded border font-bold flex items-center gap-1 whitespace-nowrap ${
              batteryMode === 'dkl'
                ? t.litLampBadgeDkl
                : batteryMode === 'sammler'
                ? t.litLampBadgeSammler
                : t.litLampBadgeHell
            }`}>
              {pressedKey && (
                <span className="opacity-90 font-normal">
                  KEY <span className="font-bold underline text-xs sm:text-sm">{pressedKey}</span> ➔{' '}
                </span>
              )}
              <span className="hidden sm:inline">
                {batteryMode === 'dkl' && 'LAMP LIT (2.5V): '}
                {batteryMode === 'sammler' && 'LAMP LIT (4V): '}
                {batteryMode === 'hell' && 'LAMP LIT (3.5V): '}
              </span>
              {!pressedKey && <span className="sm:hidden">LIT: </span>}
              <span className="text-xs sm:text-sm font-black">{litLamp || ' '}</span>
            </span>
          </div>
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
                batteryLevel={batteryLevel}
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
