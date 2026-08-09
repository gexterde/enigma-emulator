import React, { useState } from 'react';
import { EnigmaConfig, RotorType, ReflectorType, ReflectorState } from '../types';
import {
  generateConfigString,
  numToChar,
  charToNum,
  formatRotorRing,
  formatRotorPos,
  ROTOR_SPECS
} from '../lib/enigmaEngine';
import { playRotorClickSound } from '../lib/audio';

interface RotorSettingsViewProps {
  config: EnigmaConfig;
  onApplyConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
}

export const RotorSettingsView: React.FC<RotorSettingsViewProps> = ({
  config,
  onApplyConfig,
  soundEnabled
}) => {
  // Draft állapot inicializálása
  const [draftConfig, setDraftConfig] = useState<EnigmaConfig>(JSON.parse(JSON.stringify(config)));
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const [ringFormat, setRingFormat] = useState<'number' | 'letter'>(() => {
    try {
      const saved = localStorage.getItem('enigma_ring_format');
      if (saved === 'letter' || saved === 'number') return saved;
    } catch (e) {}
    return 'number';
  });

  const handleSetRingFormat = (fmt: 'number' | 'letter') => {
    setRingFormat(fmt);
    try {
      localStorage.setItem('enigma_ring_format', fmt);
    } catch (e) {}
  };

  // --- REFI FRISSÍTŐ FÜGGVÉNY MÓDOSÍTÁSA ---
  const updateReflector = (type: ReflectorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({
      ...prev,
      reflector: {
        type,
        // Ha átvált a dinamikusra, kap egy alapállapotot, egyébként megtartja a régit
        ring: prev.reflector?.ring || 1,
        start: prev.reflector?.start || 0,
        current: prev.reflector?.current || 0
      }
    }));
  };

  // --- ÚJ: REFLEKTOR GYŰRŰ ÉS POZÍCIÓ ÁLLÍTÓK ---
  const adjustReflectorRing = (delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let currentRing = prev.reflector.ring + delta;
      if (currentRing > 26) currentRing = 1;
      if (currentRing < 1) currentRing = 26;
      return {
        ...prev,
        reflector: { ...prev.reflector, ring: currentRing }
      };
    });
  };

  const adjustReflectorStart = (delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let newStart = (prev.reflector.start + delta + 26) % 26;
      return {
        ...prev,
        reflector: { ...prev.reflector, start: newStart, current: newStart }
      };
    });
  };

  // A többi létező handlered (adjustRing, adjustStart stb.) változatlan marad...
  const updateRotorType = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', type: RotorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({ ...prev, [rotorKey]: { ...prev[rotorKey], type } }));
  };

  const adjustRing = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let currentRing = prev[rotorKey].ring + delta;
      if (currentRing > 26) currentRing = 1;
      if (currentRing < 1) currentRing = 26;
      return { ...prev, [rotorKey]: { ...prev[rotorKey], ring: currentRing } };
    });
  };

  const adjustStart = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let newStart = (prev[rotorKey].start + delta + 26) % 26;
      return { ...prev, [rotorKey]: { ...prev[rotorKey], start: newStart } };
    });
  };

  const updateFourthRotorType = (type: RotorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({ ...prev, fourthRotor: { ...prev.fourthRotor, type } }));
  };

  // --- PRESETEK FRISSÍTÉSE ---
  const applyMachinePreset = (preset: 'M3' | 'M4Naval' | 'Commercial' | 'Railway' | 'SwissK') => {
    playRotorClickSound(soundEnabled);
    const baseRef = (type: ReflectorType): ReflectorState => ({ type, ring: 1, start: 0, current: 0 });
    
    setDraftConfig((prev) => {
      if (preset === 'M3') {
        return {
          ...prev,
          leftRotor: { ...prev.leftRotor, type: 'I' },
          middleRotor: { ...prev.middleRotor, type: 'II' },
          rightRotor: { ...prev.rightRotor, type: 'III' },
          reflector: baseRef('Reflector B')
        };
      }
      if (preset === 'M4Naval') {
        return {
          ...prev,
          leftRotor: { ...prev.leftRotor, type: 'VI' },
          middleRotor: { ...prev.middleRotor, type: 'VII' },
          rightRotor: { ...prev.rightRotor, type: 'VIII' },
          fourthRotor: { ...prev.fourthRotor, type: 'Beta', ring: 1, start: 0 },
          reflector: baseRef('Reflector B Thin')
        };
      }
      // Több preset követi ugyanezt a mintát...
      return prev;
    });
  };

  // --- SELECT RENDER ELEM KIEGÉSZÍTÉSE ---
  const renderReflectorSelect = () => (
    <select
      value={draftConfig.reflector.type}
      onChange={(e) => updateReflector(e.target.value as ReflectorType)}
      className="w-full min-h-[48px] bg-[#3b3426] border border-[#3b3426] rounded px-3 py-2 text-[#e3c193] font-rotor-label appearance-none cursor-pointer focus:border-[#ebc238] focus:outline-none"
    >
      <optgroup label="Standard Reflectors">
        <option value="Reflector A">Reflector A</option>
        <option value="Reflector B">Reflector B</option>
        <option value="Reflector C">Reflector C</option>
      </optgroup>
      <optgroup label="Alternatív Történelem (Feltörhetetlen)">
        <option value="UKW-Dual-Dynamic">UKW-Dual-Dynamic (Kombinált Önkódoló)</option>
      </optgroup>
    </select>
  );

  // A render többi része (JSX), ahol ha draftConfig.reflector.type === 'UKW-Dual-Dynamic', 
  // akkor kirajzolhatod a plusz gombokat az adjustReflectorRing és adjustReflectorStart segítségével!
  return (
    <div>
      {/* Ide jön a HTML felületed szerkezete... */}
      {renderReflectorSelect()}
      
      {/* --- ÚJ INTERFÉSZ PANEL A DINAMIKUS REFLEKTORHOZ --- */}
      {draftConfig.reflector.type === 'UKW-Dual-Dynamic' && (
        <div className="mt-4 p-3 border border-[#e3c193]/30 rounded bg-[#2b251a]">
          <h4 className="text-[#e3c193] font-bold text-sm mb-2">Reflektor Beállítások</h4>
          <div className="flex gap-4">
            <div>
              <span className="text-xs text-gray-400 block">Gyűrű (Ring)</span>
              <button onClick={() => adjustReflectorRing(-1)} className="px-2 bg-amber-900 text-white">-</button>
              <span className="mx-2 text-[#e3c193]">{formatRotorRing(draftConfig.reflector.ring, ringFormat)}</span>
              <button onClick={() => adjustReflectorRing(1)} className="px-2 bg-amber-900 text-white">+</button>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Pozíció (Start)</span>
              <button onClick={() => adjustReflectorStart(-1)} className="px-2 bg-amber-900 text-white">-</button>
              <span className="mx-2 text-[#e3c193]">{numToChar(draftConfig.reflector.start)}</span>
              <button onClick={() => adjustReflectorStart(1)} className="px-2 bg-amber-900 text-white">+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
