import React from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { formatRotorPos } from '../lib/enigmaEngine';
import { ChevronUp, ChevronDown, Shuffle } from 'lucide-react';

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
  const dialRef = React.useRef<HTMLDivElement>(null);
  const onStepRef = React.useRef(onStep);

  React.useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent browser default screen scrolling completely
      e.preventDefault();
      e.stopPropagation();
      
      // Step the rotor up or down based on wheel direction
      if (e.deltaY < 0) {
        onStepRef.current(1);
      } else if (e.deltaY > 0) {
        onStepRef.current(-1);
      }
    };

    const element = dialRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div
      ref={dialRef}
      className={`${t.panelInner} rounded-lg p-1 xs:p-1.5 sm:p-2 border ${t.borderBase} flex flex-col items-center justify-between min-w-[56px] xs:min-w-[64px] sm:min-w-[86px] max-w-[96px] w-full shadow-sm select-none transition-all hover:border-[var(--border-accent)]`}
      title="Scroll mouse wheel here to turn rotor"
    >
      {/* Rotor Label & Type */}
      <span className={`text-[8px] xs:text-[9px] sm:text-[10px] font-bold ${t.textSecondary} ${t.fontMono} mb-0.5 xs:mb-1 tracking-tight xs:tracking-wider text-center truncate max-w-full`}>
        {label} {typeDisplay ? `(${typeDisplay})` : ''}
      </span>

      {/* Compact Rotor Window Unit */}
      <div className={`flex flex-col items-center rounded border ${t.rotorWindowBorder} ${t.rotorWindowBg} overflow-hidden ${t.rotorWindowShadow} w-9 xs:w-10 sm:w-13 my-0.5 shadow-inner`}>
        {/* Step Up Button */}
        <button
          type="button"
          onClick={() => onStep(1)}
          className={`w-full h-3.5 sm:h-4.5 flex items-center justify-center ${t.rotorWindowControl} border-b ${t.borderBase} hover:brightness-110 active:scale-95 transition-all cursor-pointer`}
          title="Rotate Up (+1)"
          aria-label="Rotate Up"
        >
          <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
        </button>

        {/* Clear Letter Display Viewport */}
        <div className="w-full h-7 sm:h-9 flex items-center justify-center bg-[var(--rotor-window-bg)] relative px-0.5">
          <span
            key={currentPos}
            className={`${t.fontRotor} text-base xs:text-lg sm:text-xl text-[var(--text-primary)] font-mono font-bold select-none leading-none animate-rotor-step tracking-normal drop-shadow-xs`}
          >
            {formatRotorPos(currentPos, ringFormat)}
          </span>
        </div>

        {/* Step Down Button */}
        <button
          type="button"
          onClick={() => onStep(-1)}
          className={`w-full h-3.5 sm:h-4.5 flex items-center justify-center ${t.rotorWindowControl} border-t ${t.borderBase} hover:brightness-110 active:scale-95 transition-all cursor-pointer`}
          title="Rotate Down (-1)"
          aria-label="Rotate Down"
        >
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
        </button>
      </div>

      {/* Notch indicator & Randomize Button */}
      <div className="flex items-center justify-between w-full mt-1 px-0.5 gap-0.5 xs:gap-1">
        <span
          className={`text-[7.5px] xs:text-[8px] sm:text-[9px] ${t.fontMono} ${isNotch ? t.textAccent : t.textSecondary} font-semibold truncate`}
          title={turnoverAction || (isNotch ? `Notch turnover at ${notchValue}` : 'Fixed stator')}
        >
          {isNotch ? `N:${notchValue}` : 'Fixed'}
        </span>
        <button
          type="button"
          onClick={onRandomize}
          className={`px-1 xs:px-1.5 py-0.5 text-[7.5px] xs:text-[8px] ${t.fontMono} ${t.buttonPrimary} border ${t.borderBase} rounded transition-all cursor-pointer flex items-center gap-0.5 hover:border-[var(--border-accent)] hover:${t.textAccent}`}
          title="Randomize Grundstellung"
          aria-label="Randomize Grundstellung"
        >
          <Shuffle className="w-2 h-2 xs:w-2.5 xs:h-2.5 text-[var(--text-accent)] shrink-0" />
          <span className="text-[7px] xs:text-[7.5px] hidden xs:inline">Rand</span>
        </button>
      </div>
    </div>
  );
};
