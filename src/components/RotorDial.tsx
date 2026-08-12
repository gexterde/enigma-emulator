import React from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { formatRotorPos } from '../lib/enigmaEngine';

interface RotorDialProps {
  label: string;
  typeDisplay: string;
  currentPos: number;
  ringFormat: 'number' | 'letter';
  onStep: (delta: number) => void;
  onRandomize: () => void;
  isNotch?: boolean;
  notchValue?: string;
  turnoverAction?: string;
}

export const RotorDial: React.FC<RotorDialProps> = ({
  label,
  typeDisplay,
  currentPos,
  ringFormat,
  onStep,
  onRandomize,
  isNotch = false,
  notchValue,
  turnoverAction
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  return (
    <div className={`${t.panelInner} rounded-lg p-1.5 sm:p-2 border flex flex-col items-center max-w-[76px] sm:max-w-[105px] w-full mx-auto shadow-sm`}>
      <span className={`text-[7.5px] sm:text-[9px] ${t.textMuted} ${t.fontMono} mb-0.5 whitespace-nowrap`}>
        {label} {typeDisplay ? `(${typeDisplay})` : ''}
      </span>
      <div className={`relative rounded w-9 sm:w-12 h-11 sm:h-13 flex items-center justify-center my-0.5 overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#4e453b] border shadow-rotor-window' : 'bg-white border-slate-300 border shadow-inner'}`}>
        <button
          type="button"
          onClick={() => onStep(1)}
          className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} cursor-pointer`}
          title="Rotate Up"
        >
          <span className="material-symbols-outlined text-[10px] sm:text-[13px]">expand_less</span>
        </button>
        <span key={currentPos} className={`${t.fontRotor} text-base sm:text-xl select-none animate-rotor-step`}>
          {formatRotorPos(currentPos, ringFormat)}
        </span>
        <button
          type="button"
          onClick={() => onStep(-1)}
          className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} cursor-pointer`}
          title="Rotate Down"
        >
          <span className="material-symbols-outlined text-[10px] sm:text-[13px]">expand_more</span>
        </button>
      </div>
      {isNotch ? (
        <div className="flex flex-col items-center mt-0.5 w-full">
          <span className={`text-[7px] sm:text-[8px] ${t.fontMono} ${t.textAccent} whitespace-nowrap`} title={turnoverAction}>
            Notch: {notchValue}
          </span>
          <button
            type="button"
            onClick={onRandomize}
            className={`mt-1 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] ${t.fontMono} ${t.buttonPrimary} rounded transition-colors cursor-pointer flex items-center justify-center gap-0.5 shadow-xs w-full max-w-[56px] sm:max-w-none`}
            title="Randomize Grundstellung (Start Position)"
          >
            <span className="material-symbols-outlined text-[8px] sm:text-[10px]">shuffle</span>
            <span className="hidden xs:inline">Rand</span>
            <span className="inline xs:hidden">R</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-0.5 w-full">
          <span className={`text-[7px] sm:text-[8px] ${t.textSecondary} ${t.fontMono} whitespace-nowrap`} title={turnoverAction}>
            Fixed Stator
          </span>
          <button
            type="button"
            onClick={onRandomize}
            className={`mt-1 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] ${t.fontMono} ${t.buttonPrimary} rounded transition-colors cursor-pointer flex items-center justify-center gap-0.5 shadow-xs w-full max-w-[56px] sm:max-w-none`}
            title="Randomize Grundstellung (Start Position)"
          >
            <span className="material-symbols-outlined text-[8px] sm:text-[10px]">shuffle</span>
            <span className="hidden xs:inline">Rand</span>
            <span className="inline xs:hidden">R</span>
          </button>
        </div>
      )}
    </div>
  );
};
