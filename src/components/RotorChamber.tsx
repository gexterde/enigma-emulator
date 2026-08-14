import React from 'react';
import { EnigmaConfig } from '../types';
import { RotorDial } from './RotorDial';
import { ROTOR_SPECS } from '../lib/enigmaEngine';

interface RotorChamberProps {
  config: EnigmaConfig;
  ringFormat: 'number' | 'letter';
  isUKWDual: boolean;
  isM4Active: boolean;
  onManualRotorStep: (rotorKey: 'reflector' | 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor', delta: number) => void;
  onRandomizeRotor: (rotorKey: 'reflector' | 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor') => void;
}

export const RotorChamber: React.FC<RotorChamberProps> = ({
  config,
  ringFormat,
  isUKWDual,
  isM4Active,
  onManualRotorStep,
  onRandomizeRotor
}) => {
  const renderRotorView = (
    label: string,
    rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor',
    typeDisplay: string,
    isNotch: boolean
  ) => {
    const rotor = config[rotorKey];
    const notchValue = ROTOR_SPECS[rotor.type]?.notch;
    const turnoverAction = ROTOR_SPECS[rotor.type]?.turnoverAction;

    return (
      <RotorDial
        label={label}
        typeDisplay={typeDisplay}
        currentPos={rotor.current}
        ringFormat={ringFormat}
        onStep={(delta) => onManualRotorStep(rotorKey, delta)}
        onRandomize={() => onRandomizeRotor(rotorKey)}
        isNotch={isNotch}
        notchValue={notchValue}
        turnoverAction={turnoverAction}
      />
    );
  };

  return (
    <div className={`grid ${
      isUKWDual
        ? (isM4Active ? 'grid-cols-5 max-w-sm sm:max-w-md' : 'grid-cols-4 max-w-xs sm:max-w-sm')
        : (isM4Active ? 'grid-cols-4 max-w-xs sm:max-w-sm' : 'grid-cols-3 max-w-[280px] sm:max-w-[340px]')
    } gap-1.5 sm:gap-2.5 w-full mx-auto justify-items-center`}>
      {/* ─── UKW-Dual-Dynamic─── */}
      {isUKWDual && (
        <RotorDial
          label="UKW-ROTOR"
          typeDisplay=""
          currentPos={config.reflector.current}
          ringFormat={ringFormat}
          onStep={(delta) => onManualRotorStep('reflector', delta)}
          onRandomize={() => onRandomizeRotor('reflector')}
          turnoverAction="Dynamic Stator"
          isNotch={false}
        />
      )}
      {/* ────────────────────────────────────────────────────── */}

      {/* Fixed Rotor (M4 Naval only — Beta/Gamma, visible only in M4 mode) — Far Left */}
      {isM4Active && (
        renderRotorView('FIXED', 'fourthRotor', config.fourthRotor.type === 'Beta' ? 'β' : 'γ', false)
      )}

      {/* Slow Rotor */}
      {renderRotorView('SLOW', 'leftRotor', config.leftRotor.type, true)}

      {/* Middle Rotor */}
      {renderRotorView('MID', 'middleRotor', config.middleRotor.type, true)}

      {/* Fast Rotor */}
      {renderRotorView('FAST', 'rightRotor', config.rightRotor.type, true)}
    </div>
  );
};
