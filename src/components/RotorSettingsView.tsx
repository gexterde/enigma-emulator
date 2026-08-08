import React, { useState } from 'react';
import { EnigmaConfig, RotorType, ReflectorType } from '../types';
import {
  generateConfigString,
  numToChar,
  charToNum,
  formatRotorRing,
  formatRotorPos
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
  // Local editable draft state initialized from props
  const [draftConfig, setDraftConfig] = useState<EnigmaConfig>(JSON.parse(JSON.stringify(config)));
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  // Ringstellung display format state ('number' | 'letter')
  const [ringFormat, setRingFormat] = useState<'number' | 'letter'>(() => {
    try {
      const saved = localStorage.getItem('enigma_ring_format');
      if (saved === 'letter' || saved === 'number') return saved;
    } catch (e) {
      // ignore
    }
    return 'number';
  });

  const handleSetRingFormat = (fmt: 'number' | 'letter') => {
    setRingFormat(fmt);
    try {
      localStorage.setItem('enigma_ring_format', fmt);
    } catch (e) {
      // ignore
    }
  };

  // Helper handlers for modifying rotor draft
  const updateRotorType = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', type: RotorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({
      ...prev,
      [rotorKey]: { ...prev[rotorKey], type }
    }));
  };

  const adjustRing = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let currentRing = prev[rotorKey].ring + delta;
      if (currentRing > 26) currentRing = 1;
      if (currentRing < 1) currentRing = 26;
      return {
        ...prev,
        [rotorKey]: {
          ...prev[rotorKey],
          ring: currentRing
        }
      };
    });
  };

  const adjustStart = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let newStart = (prev[rotorKey].start + delta + 26) % 26;
      return {
        ...prev,
        [rotorKey]: {
          ...prev[rotorKey],
          start: newStart
        }
      };
    });
  };

  const updateReflector = (reflector: ReflectorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({ ...prev, reflector }));
  };

  const updateFourthRotorType = (type: RotorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({
      ...prev,
      fourthRotor: { ...prev.fourthRotor, type }
    }));
  };

  const adjustFourthRing = (delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let currentRing = prev.fourthRotor.ring + delta;
      if (currentRing > 26) currentRing = 1;
      if (currentRing < 1) currentRing = 26;
      return {
        ...prev,
        fourthRotor: {
          ...prev.fourthRotor,
          ring: currentRing
        }
      };
    });
  };

  const adjustFourthStart = (delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let newStart = (prev.fourthRotor.start + delta + 26) % 26;
      return {
        ...prev,
        fourthRotor: {
          ...prev.fourthRotor,
          start: newStart
        }
      };
    });
  };

  const applyMachinePreset = (preset: 'M3' | 'M4Naval' | 'Commercial' | 'Railway' | 'SwissK') => {
    playRotorClickSound(soundEnabled);
    if (preset === 'M3') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'I' },
        middleRotor: { ...prev.middleRotor, type: 'II' },
        rightRotor: { ...prev.rightRotor, type: 'III' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: 'Reflector B'
      }));
    } else if (preset === 'M4Naval') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'VI' },
        middleRotor: { ...prev.middleRotor, type: 'VII' },
        rightRotor: { ...prev.rightRotor, type: 'VIII' },
        fourthRotor: { ...prev.fourthRotor, type: 'Beta', ring: 1, start: 0 },
        reflector: 'Reflector B Thin'
      }));
    } else if (preset === 'Commercial') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'IC' },
        middleRotor: { ...prev.middleRotor, type: 'IIC' },
        rightRotor: { ...prev.rightRotor, type: 'IIIC' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: 'Reflector A'
      }));
    } else if (preset === 'Railway') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'I-Rocket' },
        middleRotor: { ...prev.middleRotor, type: 'II-Rocket' },
        rightRotor: { ...prev.rightRotor, type: 'III-Rocket' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: 'UKW-Rocket'
      }));
    } else if (preset === 'SwissK') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'I-K' },
        middleRotor: { ...prev.middleRotor, type: 'II-K' },
        rightRotor: { ...prev.rightRotor, type: 'III-K' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: 'UKW-K'
      }));
    }
  };

  const renderRotorSelect = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') => (
    <select
      value={draftConfig[rotorKey].type}
      onChange={(e) => updateRotorType(rotorKey, e.target.value as RotorType)}
      className="w-full min-h-[48px] bg-[#3b3426] border border-[#3b3426] rounded px-3 py-2 text-[#e3c193] font-rotor-label text-rotor-label appearance-none cursor-pointer focus:border-[#ebc238] focus:ring-1 focus:ring-[#ebc238] focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
    >
      <optgroup label="Enigma I / M3 / M4 Naval (1930 - 1939)">
        <option value="I">I (1930)</option>
        <option value="II">II (1930)</option>
        <option value="III">III (1930)</option>
        <option value="IV">IV (Dec 1938)</option>
        <option value="V">V (Dec 1938)</option>
        <option value="VI">VI (1939 Naval)</option>
        <option value="VII">VII (1939 Naval)</option>
        <option value="VIII">VIII (1939 Naval)</option>
      </optgroup>
      <optgroup label="M4 Naval Greek Rotors (1941 - 1942)">
        <option value="Beta">Beta (Spring 1941)</option>
        <option value="Gamma">Gamma (Spring 1942)</option>
      </optgroup>
      <optgroup label="Commercial Enigma A, B (1924)">
        <option value="IC">IC (1924)</option>
        <option value="IIC">IIC (1924)</option>
        <option value="IIIC">IIIC (1924)</option>
      </optgroup>
      <optgroup label="German Railway (Rocket) (1941)">
        <option value="I-Rocket">I Rocket (7 Feb 1941)</option>
        <option value="II-Rocket">II Rocket (7 Feb 1941)</option>
        <option value="III-Rocket">III Rocket (7 Feb 1941)</option>
      </optgroup>
      <optgroup label="Swiss K (1939)">
        <option value="I-K">I-K (Feb 1939)</option>
        <option value="II-K">II-K (Feb 1939)</option>
        <option value="III-K">III-K (Feb 1939)</option>
      </optgroup>
    </select>
  );

  const renderFourthRotorSelect = () => (
    <select
      value={draftConfig.fourthRotor.type}
      onChange={(e) => updateFourthRotorType(e.target.value as RotorType)}
      className="w-full min-h-[48px] bg-[#3b3426] border border-[#3b3426] rounded px-3 py-2 text-[#e3c193] font-rotor-label text-rotor-label appearance-none cursor-pointer focus:border-[#ebc238] focus:ring-1 focus:ring-[#ebc238] focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
    >
      <optgroup label="M4 Naval Fixed Stators (R2)">
        <option value="Beta">Beta (Spring 1941)</option>
        <option value="Gamma">Gamma (Spring 1942)</option>
      </optgroup>
    </select>
  );

  const handleApply = () => {
    playRotorClickSound(soundEnabled);
    // Sync current positions to start positions on apply
    const syncedConfig: EnigmaConfig = {
      ...draftConfig,
      leftRotor: { ...draftConfig.leftRotor, current: draftConfig.leftRotor.start },
      middleRotor: { ...draftConfig.middleRotor, current: draftConfig.middleRotor.start },
      rightRotor: { ...draftConfig.rightRotor, current: draftConfig.rightRotor.start },
      fourthRotor: { ...draftConfig.fourthRotor, current: draftConfig.fourthRotor.start }
    };
    onApplyConfig(syncedConfig);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 2500);
  };

  const previewString = generateConfigString(draftConfig, ringFormat);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Current State Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#3b3426] pb-4">
        <div>
          <h1 className="text-rotor-label font-rotor-label text-[#ebc238] mb-1 text-xl md:text-2xl">
            Rotor Configuration (Scrambler)
          </h1>
          <p className="text-[#d1c4b7] max-w-xl text-sm font-ui-body">
            Configure the internal wiring of the machine. Select rotors, adjust their internal ring wiring (Ringstellung), and set their initial visible starting positions (Grundstellung).
          </p>
        </div>
        <div className="bg-[#120e04] p-3 rounded border border-[#3b3426] shadow-inner flex flex-col items-start md:items-end min-w-full md:min-w-[200px]">
          <span className="text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-1 uppercase text-[10px]">
            Current String
          </span>
          <span className="text-rotor-label font-rotor-label text-[#e3c193] text-lg md:text-xl" id="preview-string">
            {previewString}
          </span>
        </div>
      </div>

      {showAppliedToast && (
        <div className="bg-[#8b6f47]/30 border border-[#ebc238] text-[#e3c193] px-4 py-3 rounded flex items-center gap-3 animate-fade-in shadow-lg">
          <span className="material-symbols-outlined text-[#ebc238]">check_circle</span>
          <span className="font-ui-header text-sm">
            Rotor settings applied successfully. Machine state reset to Grundstellung.
          </span>
        </div>
      )}

      {/* Machine Model Quick Presets & Ring Format Toggle */}
      <div className="bg-[#201b0f] rounded-lg p-3 md:p-4 border border-[#4e453b] shadow-panel flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ebc238] text-sm">settings_suggest</span>
            <span className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase">
              Presets:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyMachinePreset('M3')}
              className="text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Enigma I / M3
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('M4Naval')}
              className="text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              M4 Naval
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('Commercial')}
              className="text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Commercial
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('Railway')}
              className="text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Railway
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('SwissK')}
              className="text-[11px] font-ui-header bg-[#3b3426] hover:bg-[#4e453b] text-[#e3c193] border border-[#8b6f47] px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Swiss K
            </button>
          </div>
        </div>

        {/* Ring Format Selector Toggle */}
        <div className="flex items-center gap-2 bg-[#120e04] px-2.5 py-1 rounded border border-[#4e453b] w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-monospaced-technical text-[10px] text-[#e3c193] font-bold uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-[#ebc238]">tune</span>
            Ring Format:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetRingFormat('number')}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                ringFormat === 'number'
                  ? 'bg-[#ebc238] text-[#25190b] shadow'
                  : 'text-[#d1c4b7] hover:text-white hover:bg-[#3b3426]'
              }`}
            >
              01–26
            </button>
            <button
              type="button"
              onClick={() => handleSetRingFormat('letter')}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                ringFormat === 'letter'
                  ? 'bg-[#ebc238] text-[#25190b] shadow'
                  : 'text-[#d1c4b7] hover:text-white hover:bg-[#3b3426]'
              }`}
            >
              A–Z
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout for Settings */}
      <div className={`grid grid-cols-1 ${draftConfig.fourthRotor.type === 'Beta' || draftConfig.fourthRotor.type === 'Gamma' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6`}>
        {/* Fourth Rotor (Fixed Stator — M4 Naval only, visible when Beta/Gamma selected) — Far Left */}
        {(draftConfig.fourthRotor.type === 'Beta' || draftConfig.fourthRotor.type === 'Gamma') && (
          <div className="bg-[#201b0f] rounded-lg p-4 md:p-5 border border-[#4e453b] shadow-panel texture-metal relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#e3c193]/5 rounded-bl-full -z-10 group-hover:bg-[#e3c193]/10 transition-colors" />
            <h3 className="text-ui-header font-ui-header text-[#ede1cd] border-b border-[#3b3426] pb-2 mb-4 flex justify-between items-center">
              <span>Fourth Rotor (Fixed)</span>
              <span className="text-monospaced-technical text-[10px] text-[#d1c4b7]">Pos 4 · M4</span>
            </h3>
            <div className="space-y-4 md:space-y-5">
              {/* Type Selection */}
              <div>
                <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                  Rotor Type (Walzenlage)
                </label>
                {renderFourthRotorSelect()}
              </div>

              <div>
                {/* Ring Setting */}
                <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                  Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
                </label>
                <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                  <button
                    onClick={() => adjustFourthRing(1)}
                    className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                    aria-label="Increase Fourth Rotor Ring"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                  <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                    {formatRotorRing(draftConfig.fourthRotor.ring, ringFormat)}
                  </span>
                  <button
                    onClick={() => adjustFourthRing(-1)}
                    className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                    aria-label="Decrease Fourth Rotor Ring"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>

              <div>
                {/* Start Position (Grundstellung) — Fixed rotor does not step */}
                <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                  Start ({ringFormat === 'number' ? '00-25' : 'A-Z'}) · Fixed
                </label>
                <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                  <button
                    onClick={() => adjustFourthStart(1)}
                    className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                    aria-label="Increase Fourth Rotor Start"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                  <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                    {formatRotorPos(draftConfig.fourthRotor.start, ringFormat)}
                  </span>
                  <button
                    onClick={() => adjustFourthStart(-1)}
                    className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                    aria-label="Decrease Fourth Rotor Start"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Left Rotor (Slow) */}
        <div className="bg-[#201b0f] rounded-lg p-4 md:p-5 border border-[#4e453b] shadow-panel texture-metal relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#e3c193]/5 rounded-bl-full -z-10 group-hover:bg-[#e3c193]/10 transition-colors" />
          <h3 className="text-ui-header font-ui-header text-[#ede1cd] border-b border-[#3b3426] pb-2 mb-4 flex justify-between items-center">
            <span>Left Rotor (Slow)</span>
            <span className="text-monospaced-technical text-[10px] text-[#d1c4b7]">Pos 1</span>
          </h3>
          <div className="space-y-4 md:space-y-5">
            {/* Type Selection */}
            <div>
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Rotor Type (Walzenlage)
              </label>
              {renderRotorSelect('leftRotor')}
            </div>

            <div>
              {/* Ring Setting */}
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
              </label>
              <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => adjustRing('leftRotor', 1)}
                  className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Increase Left Rotor Ring"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                  {formatRotorRing(draftConfig.leftRotor.ring, ringFormat)}
                </span>
                <button
                  onClick={() => adjustRing('leftRotor', -1)}
                  className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Decrease Left Rotor Ring"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>

            <div>
              {/* Start Position (Grundstellung) */}
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Start ({ringFormat === 'number' ? '00-25' : 'A-Z'})
              </label>
              <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => adjustStart('leftRotor', 1)}
                  className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Increase Left Rotor Start"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                  {formatRotorPos(draftConfig.leftRotor.start, ringFormat)}
                </span>
                <button
                  onClick={() => adjustStart('leftRotor', -1)}
                  className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Decrease Left Rotor Start"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Rotor */}
        <div className="bg-[#201b0f] rounded-lg p-4 md:p-5 border border-[#4e453b] shadow-panel texture-metal relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#e3c193]/5 rounded-bl-full -z-10 group-hover:bg-[#e3c193]/10 transition-colors" />
          <h3 className="text-ui-header font-ui-header text-[#ede1cd] border-b border-[#3b3426] pb-2 mb-4 flex justify-between items-center">
            <span>Middle Rotor</span>
            <span className="text-monospaced-technical text-[10px] text-[#d1c4b7]">Pos 2</span>
          </h3>
          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Rotor Type (Walzenlage)
              </label>
              {renderRotorSelect('middleRotor')}
            </div>

            <div>
              {/* Ring Setting */}
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
              </label>
              <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => adjustRing('middleRotor', 1)}
                  className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Increase Middle Rotor Ring"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                  {formatRotorRing(draftConfig.middleRotor.ring, ringFormat)}
                </span>
                <button
                  onClick={() => adjustRing('middleRotor', -1)}
                  className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Decrease Middle Rotor Ring"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>

            <div>
              {/* Start Position (Grundstellung) */}
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Start ({ringFormat === 'number' ? '00-25' : 'A-Z'})
              </label>
              <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => adjustStart('middleRotor', 1)}
                  className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Increase Middle Rotor Start"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                  {formatRotorPos(draftConfig.middleRotor.start, ringFormat)}
                </span>
                <button
                  onClick={() => adjustStart('middleRotor', -1)}
                  className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Decrease Middle Rotor Start"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rotor (Fast) */}
        <div className="bg-[#201b0f] rounded-lg p-4 md:p-5 border border-[#4e453b] shadow-panel texture-metal relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#e3c193]/5 rounded-bl-full -z-10 group-hover:bg-[#e3c193]/10 transition-colors" />
          <h3 className="text-ui-header font-ui-header text-[#ede1cd] border-b border-[#3b3426] pb-2 mb-4 flex justify-between items-center">
            <span>Right Rotor (Fast)</span>
            <span className="text-monospaced-technical text-[10px] text-[#d1c4b7]">Pos 3</span>
          </h3>
          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Rotor Type (Walzenlage)
              </label>
              {renderRotorSelect('rightRotor')}
            </div>

            <div>
              {/* Ring Setting */}
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
              </label>
              <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => adjustRing('rightRotor', 1)}
                  className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Increase Right Rotor Ring"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                  {formatRotorRing(draftConfig.rightRotor.ring, ringFormat)}
                </span>
                <button
                  onClick={() => adjustRing('rightRotor', -1)}
                  className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Decrease Right Rotor Ring"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>

            <div>
              {/* Start Position (Grundstellung) */}
              <label className="block text-monospaced-technical font-monospaced-technical text-[#d1c4b7] mb-2">
                Start ({ringFormat === 'number' ? '00-25' : 'A-Z'})
              </label>
              <div className="relative bg-[#3b3426] border border-[#3b3426] rounded shadow-rotor-window h-14 min-h-[48px] flex items-center justify-center overflow-hidden">
                <button
                  onClick={() => adjustStart('rightRotor', 1)}
                  className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Increase Right Rotor Start"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <span className="text-rotor-label font-rotor-label text-[#e3c193] z-10 pointer-events-none">
                  {formatRotorPos(draftConfig.rightRotor.start, ringFormat)}
                </span>
                <button
                  onClick={() => adjustStart('rightRotor', -1)}
                  className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] transition-colors"
                  aria-label="Decrease Right Rotor Start"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Reflector & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Reflector (Umkehrwalze) */}
        <div className="md:col-span-2 bg-[#201b0f] rounded-lg p-4 md:p-5 border border-[#4e453b] shadow-panel texture-metal flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#3b3426] border-4 border-[#181307] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#d1c4b7] text-2xl md:text-3xl">sync</span>
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-ui-header font-ui-header text-[#ede1cd] mb-1">Reflector (Umkehrwalze)</h3>
            <p className="text-ui-body text-[#d1c4b7] mb-3 text-xs">Determines the signal return path back through the scrambler rotors.</p>
            <select
              value={draftConfig.reflector}
              onChange={(e) => updateReflector(e.target.value as ReflectorType)}
              className="w-full min-h-[48px] bg-[#3b3426] border border-[#3b3426] rounded px-3 py-2 text-[#e3c193] font-rotor-label text-rotor-label appearance-none cursor-pointer focus:border-[#ebc238] focus:ring-1 focus:ring-[#ebc238] focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
            >
              <optgroup label="Standard Reflectors">
                <option value="Reflector A">Reflector A (Enigma A/B/I)</option>
                <option value="Reflector B">Reflector B / UKW-B (M3 Standard)</option>
                <option value="Reflector C">Reflector C / UKW-C (M3 Alternate)</option>
              </optgroup>
              <optgroup label="Thin Reflectors (M4 Naval)">
                <option value="Reflector B Thin">Reflector B Thin (M4 R1, 1940)</option>
                <option value="Reflector C Thin">Reflector C Thin (M4 R1, 1940)</option>
              </optgroup>
              <optgroup label="Special / Regional Variants">
                <option value="UKW-Rocket">UKW German Railway / Rocket (7 Feb 1941)</option>
                <option value="UKW-K">UKW-K Swiss K (Feb 1939)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[#201b0f] rounded-lg p-4 md:p-5 border border-[#4e453b] shadow-panel texture-metal flex flex-col justify-center gap-4">
          <button
            onClick={handleApply}
            className="w-full min-h-[48px] py-4 bg-[#8b6f47] text-[#fffaf8] rounded shadow-key-base hover:bg-[#8b6f47]/90 active:shadow-key-pressed active:translate-y-1 transition-all font-ui-header font-bold text-lg border border-[#e3c193]/30 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">
              memory
            </span>
            Apply Settings
          </button>
          <p className="text-center text-[10px] text-[#d1c4b7] font-monospaced-technical opacity-70">
            Will reset current message state.
          </p>
        </div>
      </div>
    </div>
  );
};
