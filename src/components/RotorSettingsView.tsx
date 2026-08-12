import React, { useState } from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { EnigmaConfig, RotorType, ReflectorType } from '../types';
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
  const { theme } = useTheme();
  const t = getTheme(theme);
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

  const updateReflector = (type: ReflectorType) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => ({
      ...prev,
      reflector: {
        type,
        // Retains previous values, or if they did not exist yet, initializes them (Ring: 1, Start: 0)
        ring: prev.reflector?.ring || 1,
        start: prev.reflector?.start || 0,
        current: prev.reflector?.current || 0
      }
    }));
  };

  const adjustReflectorRing = (delta: number) => {
    playRotorClickSound(soundEnabled);
    setDraftConfig((prev) => {
      let currentRing = (prev.reflector?.ring || 1) + delta;
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
      const currentStart = prev.reflector?.start ?? 0;
      let newStart = (currentStart + delta + 26) % 26;
      return {
        ...prev,
        reflector: { ...prev.reflector, start: newStart, current: newStart }
      };
    });
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

  const ALL_STANDARD_ROTOR_TYPES: RotorType[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IC', 'IIC', 'IIIC', 'I-Rocket', 'II-Rocket', 'III-Rocket', 'I-K', 'II-K', 'III-K'];
  const ALL_REFLECTORS: ReflectorType[] = ['Reflector A', 'Reflector B', 'Reflector C', 'Reflector B Thin', 'Reflector C Thin', 'UKW-Rocket', 'UKW-K', 'UKW-Dual-Dynamic'];

  const randomizeField = (
    rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor' | 'reflector',
    fields: ('type' | 'ring' | 'start')[],
    types: any[]
  ) => {
    playRotorClickSound(soundEnabled);
    const randomType = types.length > 0 ? types[Math.floor(Math.random() * types.length)] : undefined;
    const randomRing = Math.floor(Math.random() * 26) + 1;
    const randomStart = Math.floor(Math.random() * 26);

    setDraftConfig((prev) => {
      const updatedRotor = { ...prev[rotorKey] };
      if (fields.includes('type') && randomType !== undefined) {
        updatedRotor.type = randomType;
      }
      if (fields.includes('ring')) {
        updatedRotor.ring = randomRing;
      }
      if (fields.includes('start')) {
        updatedRotor.start = randomStart;
        if (rotorKey === 'reflector') {
          (updatedRotor as any).current = randomStart;
        }
      }
      return {
        ...prev,
        [rotorKey]: updatedRotor
      };
    });
  };

  const randomizeRotorType = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') =>
    randomizeField(rotorKey, ['type'], ALL_STANDARD_ROTOR_TYPES);

  const randomizeRotorRing = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') =>
    randomizeField(rotorKey, ['ring'], []);

  const randomizeRotorStart = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') =>
    randomizeField(rotorKey, ['start'], []);

  const randomizeRotorEntire = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') =>
    randomizeField(rotorKey, ['type', 'ring', 'start'], ALL_STANDARD_ROTOR_TYPES);

  const randomizeFourthRotorType = () =>
    randomizeField('fourthRotor', ['type'], ['Beta', 'Gamma']);

  const randomizeFourthRotorRing = () =>
    randomizeField('fourthRotor', ['ring'], []);

  const randomizeFourthRotorStart = () =>
    randomizeField('fourthRotor', ['start'], []);

  const randomizeFourthRotorEntire = () =>
    randomizeField('fourthRotor', ['type', 'ring', 'start'], ['Beta', 'Gamma']);

  const randomizeReflectorType = () =>
    randomizeField('reflector', ['type'], ALL_REFLECTORS);

  const randomizeReflectorRing = () =>
    randomizeField('reflector', ['ring'], []);

  const randomizeReflectorStart = () =>
    randomizeField('reflector', ['start'], []);

  const randomizeReflectorEntire = () =>
    randomizeField('reflector', ['type', 'ring', 'start'], ALL_REFLECTORS);

  const randomizeAllSettings = () => {
    playRotorClickSound(soundEnabled);
    const randType = () => ALL_STANDARD_ROTOR_TYPES[Math.floor(Math.random() * ALL_STANDARD_ROTOR_TYPES.length)];
    const randRing = () => Math.floor(Math.random() * 26) + 1;
    const randStart = () => Math.floor(Math.random() * 26);
    
    const isM4Active = Math.random() < 0.5;
    const fourthType: RotorType = isM4Active ? (Math.random() < 0.5 ? 'Beta' : 'Gamma') : 'I';
    
    let refType: ReflectorType;
    if (fourthType === 'Beta') {
      refType = 'Reflector B Thin';
    } else if (fourthType === 'Gamma') {
      refType = 'Reflector C Thin';
    } else {
      const standardRefs: ReflectorType[] = ['Reflector A', 'Reflector B', 'Reflector C', 'UKW-Rocket', 'UKW-K', 'UKW-Dual-Dynamic'];
      refType = standardRefs[Math.floor(Math.random() * standardRefs.length)];
    }

    setDraftConfig({
      leftRotor: { type: randType(), ring: randRing(), start: randStart(), current: 0 },
      middleRotor: { type: randType(), ring: randRing(), start: randStart(), current: 0 },
      rightRotor: { type: randType(), ring: randRing(), start: randStart(), current: 0 },
      fourthRotor: { type: fourthType, ring: randRing(), start: randStart(), current: 0 },
      reflector: {
        type: refType,
        ring: randRing(),
        start: randStart(),
        current: 0
      },
      plugboard: draftConfig.plugboard || {}
    });
  };

  const applyMachinePreset = (preset: 'M3' | 'M4Naval' | 'Commercial' | 'Railway' | 'SwissK') => {
    playRotorClickSound(soundEnabled);
    const makeReflector = (type: ReflectorType) => ({
      type,
      ring: 1,
      start: 0,
      current: 0
    });

    if (preset === 'M3') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'I' },
        middleRotor: { ...prev.middleRotor, type: 'II' },
        rightRotor: { ...prev.rightRotor, type: 'III' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: makeReflector('Reflector B')
      }));
    } else if (preset === 'M4Naval') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'VI' },
        middleRotor: { ...prev.middleRotor, type: 'VII' },
        rightRotor: { ...prev.rightRotor, type: 'VIII' },
        fourthRotor: { ...prev.fourthRotor, type: 'Beta', ring: 1, start: 0 },
        reflector: makeReflector('Reflector B Thin')
      }));
    } else if (preset === 'Commercial') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'IC' },
        middleRotor: { ...prev.middleRotor, type: 'IIC' },
        rightRotor: { ...prev.rightRotor, type: 'IIIC' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: makeReflector('Reflector A')
      }));
    } else if (preset === 'Railway') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'I-Rocket' },
        middleRotor: { ...prev.middleRotor, type: 'II-Rocket' },
        rightRotor: { ...prev.rightRotor, type: 'III-Rocket' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },
        reflector: makeReflector('UKW-Rocket')
      }));
    } else if (preset === 'SwissK') {
      setDraftConfig((prev) => ({
        ...prev,
        leftRotor: { ...prev.leftRotor, type: 'I-K' },
        middleRotor: { ...prev.middleRotor, type: 'II-K' },
        rightRotor: { ...prev.rightRotor, type: 'III-K' },
        fourthRotor: { ...prev.fourthRotor, type: 'I' },    
        reflector: makeReflector('UKW-K')
      }));
    }
  };

  const renderRotorSelect = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') => (
    <select
      value={draftConfig[rotorKey].type}
      onChange={(e) => updateRotorType(rotorKey, e.target.value as RotorType)}
      className={`w-full min-h-[48px] ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] text-[#e3c193] font-rotor-label text-rotor-label shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-300 text-slate-800 font-sans text-sm shadow-sm'} border rounded px-3 py-2 appearance-none cursor-pointer focus:${t.borderAccent} focus:ring-1 focus:outline-none`}
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
      className={`w-full min-h-[48px] ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] text-[#e3c193] font-rotor-label text-rotor-label shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-300 text-slate-800 font-sans text-sm shadow-sm'} border rounded px-3 py-2 appearance-none cursor-pointer focus:${t.borderAccent} focus:ring-1 focus:outline-none`}
    >
      <optgroup label="M4 Naval Fixed Stators (R2)">
        <option value="Beta">Beta (Spring 1941)</option>
        <option value="Gamma">Gamma (Spring 1942)</option>
      </optgroup>
    </select>
  );

  const renderRotorSettingPanel = (
    rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor',
    label: string,
    posText: string
  ) => {
    const rotor = draftConfig[rotorKey];
    const spec = ROTOR_SPECS[rotor.type];

    return (
      <div key={rotorKey} className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-16 h-16 ${theme === 'vintage' ? 'bg-[#e3c193]/5 group-hover:bg-[#e3c193]/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'} rounded-bl-full -z-10 transition-colors`} />
        <h3 className={`${t.fontHeader} ${t.textPrimary} border-b ${t.borderBase} pb-2 mb-4 flex justify-between items-center`}>
          <span>{label}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => randomizeRotorEntire(rotorKey)}
              className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238] bg-[#120e04]/40 border border-[#3b3426]' : 'text-slate-400 hover:text-blue-500 bg-white border border-slate-300'}`}
              title={`Randomize all settings for ${label}`}
            >
              <span className="material-symbols-outlined text-xs">shuffle</span>
            </button>
            <span className={`${t.fontMono} text-[10px] ${t.textMuted}`}>{posText}</span>
          </div>
        </h3>
        <div className="space-y-4 md:space-y-5">
          {/* Type Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${t.fontMono} ${t.textMuted}`}>
                Rotor Type (Walzenlage)
              </label>
              <button
                type="button"
                onClick={() => randomizeRotorType(rotorKey)}
                className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[14px]">shuffle</span>
              </button>
            </div>
            {renderRotorSelect(rotorKey)}
          </div>

          <div>
            {/* Ring Setting */}
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${t.fontMono} ${t.textMuted}`}>
                Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
              </label>
              <button
                type="button"
                onClick={() => randomizeRotorRing(rotorKey)}
                className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                title="Randomize Ring Setting"
              >
                <span className="material-symbols-outlined text-[14px]">shuffle</span>
              </button>
            </div>
            <div className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}>
              <button
                type="button"
                onClick={() => adjustRing(rotorKey, 1)}
                className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                aria-label={`Increase ${label} Ring`}
              >
                <span className="material-symbols-outlined text-[16px]">expand_less</span>
              </button>
              <span className={`${t.fontRotor} z-10 pointer-events-none`}>
                {formatRotorRing(rotor.ring, ringFormat)}
              </span>
              <button
                type="button"
                onClick={() => adjustRing(rotorKey, -1)}
                className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                aria-label={`Decrease ${label} Ring`}
              >
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          <div>
            {/* Start Position (Grundstellung) */}
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${t.fontMono} ${t.textMuted}`}>
                Start ({ringFormat === 'number' ? '00-25' : 'A-Z'})
              </label>
              <button
                type="button"
                onClick={() => randomizeRotorStart(rotorKey)}
                className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                title="Randomize Start Position"
              >
                <span className="material-symbols-outlined text-[14px]">shuffle</span>
              </button>
            </div>
            <div className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}>
              <button
                type="button"
                onClick={() => adjustStart(rotorKey, 1)}
                className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                aria-label={`Increase ${label} Start`}
              >
                <span className="material-symbols-outlined text-[16px]">expand_less</span>
              </button>
              <span className={`${t.fontRotor} z-10 pointer-events-none`}>
                {formatRotorPos(rotor.start, ringFormat)}
              </span>
              <button
                type="button"
                onClick={() => adjustStart(rotorKey, -1)}
                className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                aria-label={`Decrease ${label} Start`}
              >
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Turnover Notch Info */}
          <div className={`${theme === 'vintage' ? 'bg-[#120e04]/80 border-[#3b3426]' : 'bg-slate-50 border-slate-200'} p-2.5 rounded border text-xs`}>
            <div className={`flex items-center justify-between ${t.textAccent} font-monospaced-technical font-bold text-[11px] mb-1`}>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">turn_right</span>
                Turnover Notch: {spec?.notch}
              </span>
              <span className={`${theme === 'vintage' ? 'text-[#8c7e6a]' : t.textMuted} text-[10px]`}>{spec?.year}</span>
            </div>
            <p className={`${theme === 'vintage' ? 'text-[#a89985]' : t.textSecondary} text-[10px] leading-snug`}>
              {spec?.turnoverAction}
            </p>
          </div>
        </div>
      </div>
    );
  };

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
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b ${t.borderBase} pb-4`}>
        <div>
          <h1 className={`text-rotor-label font-rotor-label ${t.textAccent} mb-1 text-xl md:text-2xl`}>
            Rotor Configuration (Scrambler)
          </h1>
          <p className={`${t.textSecondary} max-w-xl text-sm font-ui-body`}>
            Configure the internal wiring of the machine. Select rotors, adjust their internal ring wiring (Ringstellung), and set their initial visible starting positions (Grundstellung).
          </p>
        </div>
        <div className={`${t.panelInner} p-3 rounded border ${t.borderBase} shadow-inner flex flex-col items-start md:items-end min-w-full md:min-w-[200px]`}>
          <span className={`text-monospaced-technical font-monospaced-technical ${t.textMuted} mb-1 uppercase text-[10px]`}>
            Current String
          </span>
          <span className={`text-rotor-label font-rotor-label ${theme === 'vintage' ? 'text-[#e3c193]' : t.textAccent} text-lg md:text-xl`} id="preview-string">
            {previewString}
          </span>
        </div>
      </div>

      {showAppliedToast && (
        <div className={`${theme === 'vintage' ? 'bg-[#8b6f47]/30 border-[#ebc238] text-[#e3c193]' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded flex items-center gap-3 animate-fade-in shadow-lg`}>
          <span className={`material-symbols-outlined ${theme === 'vintage' ? 'text-[#ebc238]' : 'text-green-600'}`}>check_circle</span>
          <span className="font-ui-header text-sm">
            Rotor settings applied successfully. Machine state reset to Grundstellung.
          </span>
        </div>
      )}

      {/* Machine Model Quick Presets & Ring Format Toggle */}
      <div className={`${t.lampboardPanelBg} rounded-lg p-3 md:p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${t.textAccent} text-sm`}>settings_suggest</span>
            <span className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase`}>
              Presets:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyMachinePreset('M3')}
              className={`text-[11px] ${t.fontHeader} ${t.buttonPrimary} px-2.5 py-1 rounded transition-colors cursor-pointer`}
            >
              Enigma I / M3
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('M4Naval')}
              className={`text-[11px] ${t.fontHeader} ${t.buttonPrimary} px-2.5 py-1 rounded transition-colors cursor-pointer`}
            >
              M4 Naval
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('Commercial')}
              className={`text-[11px] ${t.fontHeader} ${t.buttonPrimary} px-2.5 py-1 rounded transition-colors cursor-pointer`}
            >
              Commercial
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('Railway')}
              className={`text-[11px] ${t.fontHeader} ${t.buttonPrimary} px-2.5 py-1 rounded transition-colors cursor-pointer`}
            >
              Railway
            </button>
            <button
              type="button"
              onClick={() => applyMachinePreset('SwissK')}
              className={`text-[11px] ${t.fontHeader} ${t.buttonPrimary} px-2.5 py-1 rounded transition-colors cursor-pointer`}
            >
              Swiss K
            </button>
            <div className={`w-px h-4 ${t.borderBase} mx-1 hidden sm:block`} />
            <button
              type="button"
              onClick={randomizeAllSettings}
              className={`text-[11px] ${t.fontHeader} ${t.buttonHighlight} px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 font-bold`}
              title="Randomize all machine and rotor settings"
            >
              <span className="material-symbols-outlined text-[12px]">shuffle</span>
              <span>Randomize All</span>
            </button>
          </div>
        </div>

        {/* Ring Format Selector Toggle */}
        <div className={`flex items-center gap-2 ${t.panelInner} px-2.5 py-1 rounded border ${t.borderBase} w-full sm:w-auto justify-between sm:justify-start`}>
          <span className={`${t.fontMono} text-[10px] ${t.textSecondary} font-bold uppercase flex items-center gap-1`}>
            <span className={`material-symbols-outlined text-xs ${t.textAccent}`}>tune</span>
            Ring Format:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetRingFormat('number')}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                ringFormat === 'number'
                  ? theme === 'vintage' ? 'bg-[#ebc238] text-[#25190b] shadow' : 'bg-blue-600 text-white shadow'
                  : theme === 'vintage' ? 'text-[#d1c4b7] hover:text-white hover:bg-[#3b3426]' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              01–26
            </button>
            <button
              type="button"
              onClick={() => handleSetRingFormat('letter')}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                ringFormat === 'letter'
                  ? theme === 'vintage' ? 'bg-[#ebc238] text-[#25190b] shadow' : 'bg-blue-600 text-white shadow'
                  : theme === 'vintage' ? 'text-[#d1c4b7] hover:text-white hover:bg-[#3b3426]' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              A–Z
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout for Settings in requested order: Reflector, Fourth Rotor, Left Rotor (Slow), Middle Rotor, Right Rotor */}
      <div className="space-y-6">
        {/* 1. Reflector (Umkehrwalze) */}
        <div className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6`}>
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${theme === 'vintage' ? 'bg-[#3b3426] border-4 border-[#181307] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]' : 'bg-slate-100 border-4 border-slate-200 shadow-inner'} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined ${t.textSecondary} text-2xl md:text-3xl`}>sync</span>
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`${t.fontHeader} ${t.textPrimary}`}>Reflector (Umkehrwalze)</h3>
              <button
                type="button"
                onClick={randomizeReflectorType}
                className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                title="Randomize Reflector Type"
              >
                <span className="material-symbols-outlined text-[16px]">shuffle</span>
              </button>
            </div>
            <p className={`text-ui-body ${t.textMuted} mb-3 text-xs`}>Determines the signal return path back through the scrambler rotors.</p>
            <select
              value={draftConfig.reflector.type}
              onChange={(e) => updateReflector(e.target.value as ReflectorType)}
              className={`w-full min-h-[48px] ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] text-[#e3c193] font-rotor-label text-rotor-label shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-300 text-slate-800 font-sans text-sm shadow-sm'} border rounded px-3 py-2 appearance-none cursor-pointer focus:${t.borderAccent} focus:ring-1 focus:outline-none`}
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
              <optgroup label="Alternative History (Unbreakable)">
                <option value="UKW-Dual-Dynamic">UKW-Dual-Dynamic (Combined Self-Coder)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Reflector Mechanics (UKW-Rotor) if UKW-Dual-Dynamic */}
        {draftConfig.reflector.type === 'UKW-Dual-Dynamic' && (
          <div className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-16 h-16 ${theme === 'vintage' ? 'bg-[#e3c193]/5 group-hover:bg-[#e3c193]/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'} rounded-bl-full -z-10 transition-colors`} />
            <h3 className={`${t.fontHeader} ${t.textPrimary} border-b ${t.borderBase} pb-2 mb-4 flex justify-between items-center`}>
              <span>Reflector Mechanics (UKW-Rotor)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={randomizeReflectorEntire}
                  className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238] bg-[#120e04]/40 border border-[#3b3426]' : 'text-slate-400 hover:text-blue-500 bg-white border border-slate-300'}`}
                  title="Randomize all settings for Reflector"
                >
                  <span className="material-symbols-outlined text-xs">shuffle</span>
                </button>
                <span className={`text-monospaced-technical text-[10px] ${t.textAccent} font-bold`}>UNLOCKED</span>
              </div>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block ${t.fontMono} ${t.textMuted}`}>
                    Reflector Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
                  </label>
                  <button
                    type="button"
                    onClick={randomizeReflectorRing}
                    className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                    title="Randomize Reflector Ring"
                  >
                    <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  </button>
                </div>
                <div className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}>
                  <button
                    type="button"
                    onClick={() => adjustReflectorRing(1)}
                    className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Increase Reflector Ring"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                  <span className={`${t.fontRotor} z-10 pointer-events-none`}>
                    {formatRotorRing(draftConfig.reflector.ring, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustReflectorRing(-1)}
                    className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Decrease Reflector Ring"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block ${t.fontMono} ${t.textMuted}`}>
                    Reflector Start ({ringFormat === 'number' ? '00-25' : 'A-Z'})
                  </label>
                  <button
                    type="button"
                    onClick={randomizeReflectorStart}
                    className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                    title="Randomize Reflector Start"
                  >
                    <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  </button>
                </div>
                <div className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}>
                  <button
                    type="button"
                    onClick={() => adjustReflectorStart(1)}
                    className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Increase Reflector Start"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                  <span className={`${t.fontRotor} z-10 pointer-events-none`}>
                    {formatRotorPos(draftConfig.reflector.start, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustReflectorStart(-1)}
                    className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Decrease Reflector Start"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`${t.panelInner} p-2.5 rounded border ${t.borderBase} text-xs mt-4`}>
              <div className={`flex items-center justify-between ${t.textAccent} ${t.fontMono} font-bold text-[11px] mb-1`}>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">autorenew</span>
                  Reflector Action: Dynamic Stepping
                </span>
                <span className={`${t.textMuted} text-[10px]`}>Asymmetric 1943</span>
              </div>
              <p className={`${t.textMuted} text-[10px] leading-snug`}>
                Self-encoding prevention mechanism disabled. The reflector rotates once every time the left (Slow) rotor completes a full turn.
              </p>
            </div>
          </div>
        )}

        {/* 2. Fourth Rotor (Fixed Stator / M4) */}
        {(draftConfig.fourthRotor.type === 'Beta' || draftConfig.fourthRotor.type === 'Gamma') && (
          <div className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-16 h-16 ${theme === 'vintage' ? 'bg-[#e3c193]/5 group-hover:bg-[#e3c193]/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'} rounded-bl-full -z-10 transition-colors`} />
            <h3 className={`${t.fontHeader} ${t.textPrimary} border-b ${t.borderBase} pb-2 mb-4 flex justify-between items-center`}>
              <span>Fourth Rotor (Fixed / IV. Rotor)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={randomizeFourthRotorEntire}
                  className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238] bg-[#120e04]/40 border border-[#3b3426]' : 'text-slate-400 hover:text-blue-500 bg-white border border-slate-300'}`}
                  title="Randomize all settings for Fourth Rotor"
                >
                  <span className="material-symbols-outlined text-xs">shuffle</span>
                </button>
                <span className={`${t.fontMono} text-[10px] ${t.textMuted}`}>Pos 4 · M4</span>
              </div>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block ${t.fontMono} ${t.textMuted}`}>
                    Rotor Type (Walzenlage)
                  </label>
                  <button
                    type="button"
                    onClick={randomizeFourthRotorType}
                    className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                    title="Randomize Fourth Rotor Type"
                  >
                    <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  </button>
                </div>
                {renderFourthRotorSelect()}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block ${t.fontMono} ${t.textMuted}`}>
                    Ring ({ringFormat === 'number' ? '01-26' : 'A-Z'})
                  </label>
                  <button
                    type="button"
                    onClick={randomizeFourthRotorRing}
                    className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                    title="Randomize Fourth Rotor Ring Setting"
                  >
                    <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  </button>
                </div>
                <div className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}>
                  <button
                    onClick={() => adjustFourthRing(1)}
                    className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Increase Fourth Rotor Ring"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                  <span className={`${t.fontRotor} z-10 pointer-events-none`}>
                    {formatRotorRing(draftConfig.fourthRotor.ring, ringFormat)}
                  </span>
                  <button
                    onClick={() => adjustFourthRing(-1)}
                    className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Decrease Fourth Rotor Ring"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block ${t.fontMono} ${t.textMuted}`}>
                    Start ({ringFormat === 'number' ? '00-25' : 'A-Z'}) · Fixed
                  </label>
                  <button
                    type="button"
                    onClick={randomizeFourthRotorStart}
                    className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded ${theme === 'vintage' ? 'text-[#8c7e6a] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                    title="Randomize Fourth Rotor Start Position"
                  >
                    <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  </button>
                </div>
                <div className={`relative rounded h-14 min-h-[48px] flex items-center justify-center overflow-hidden ${theme === 'vintage' ? 'bg-[#3b3426] border-[#3b3426] shadow-rotor-window' : 'bg-slate-100 border-slate-300 border shadow-inner'}`}>
                  <button
                    onClick={() => adjustFourthStart(1)}
                    className={`absolute top-0 w-full h-1/2 flex items-start justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Increase Fourth Rotor Start"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                  <span className={`${t.fontRotor} z-10 pointer-events-none`}>
                    {formatRotorPos(draftConfig.fourthRotor.start, ringFormat)}
                  </span>
                  <button
                    onClick={() => adjustFourthStart(-1)}
                    className={`absolute bottom-0 w-full h-1/2 flex items-end justify-center ${theme === 'vintage' ? 'text-[#d1c4b7] hover:text-[#ebc238]' : 'text-slate-400 hover:text-blue-500'} transition-colors`}
                    aria-label="Decrease Fourth Rotor Start"
                  >
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3, 4, 5. Scrambler Rotors (Left Slow, Middle Mid, Right Fast) in a 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {renderRotorSettingPanel('leftRotor', 'Left Rotor (Slow)', 'Pos 1')}
          {renderRotorSettingPanel('middleRotor', 'Middle Rotor (Mid)', 'Pos 2')}
          {renderRotorSettingPanel('rightRotor', 'Right Rotor (Fast)', 'Pos 3')}
        </div>

        {/* Apply Settings Bar */}
        <div className={`${t.lampboardPanelBg} rounded-lg p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <div>
            <h3 className={`${t.fontHeader} ${t.textPrimary}`}>Apply Rotor Configuration</h3>
            <p className={`text-xs ${t.textMuted}`}>Updates scrambler wiring, rings, and starting positions across the machine state.</p>
          </div>
          <button
            onClick={handleApply}
            className={`w-full sm:w-auto min-w-[200px] min-h-[48px] py-3 px-6 rounded transition-all ${t.fontHeader} font-bold text-base flex items-center justify-center gap-2 group cursor-pointer ${theme === 'vintage' ? 'bg-[#8b6f47] text-[#fffaf8] shadow-key-base hover:bg-[#8b6f47]/90 active:shadow-key-pressed active:translate-y-1 border border-[#e3c193]/30' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:translate-y-0.5'}`}
          >
            <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">
              memory
            </span>
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
