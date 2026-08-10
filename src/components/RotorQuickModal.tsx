import React from 'react';
import { EnigmaConfig, RotorType, ReflectorType } from '../types';
import { formatRotorPos, formatRotorRing, ROTOR_SPECS } from '../lib/enigmaEngine';
import { playRotorClickSound } from '../lib/audio';

interface RotorQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
  ringFormat: 'number' | 'letter';
}

export const RotorQuickModal: React.FC<RotorQuickModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  soundEnabled,
  ringFormat
}) => {
  if (!isOpen) return null;

  const rotorOptions: RotorType[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const reflectorOptions: ReflectorType[] = ['Reflector B', 'Reflector C', 'Reflector A', 'Reflector B Thin', 'Reflector C Thin', 'UKW-Dual-Dynamic'];

  const handleUpdateRotorType = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor', type: RotorType) => {
    playRotorClickSound(soundEnabled);
    onUpdateConfig({
      ...config,
      [rotorKey]: { ...config[rotorKey], type }
    });
  };

  const handleAdjustRing = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    const currentVal = config[rotorKey].ring;
    let nextVal = currentVal + delta;
    if (nextVal > 26) nextVal = 1;
    if (nextVal < 1) nextVal = 26;
    onUpdateConfig({
      ...config,
      [rotorKey]: { ...config[rotorKey], ring: nextVal }
    });
  };

  const handleAdjustStart = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    const currentVal = config[rotorKey].start;
    let nextVal = (currentVal + delta + 26) % 26;
    onUpdateConfig({
      ...config,
      [rotorKey]: { ...config[rotorKey], start: nextVal, current: nextVal }
    });
  };

  const handleUpdateReflector = (reflectorType: ReflectorType) => {
    playRotorClickSound(soundEnabled);
    onUpdateConfig({
      ...config,
      reflector: {
        type: reflectorType,
        ring: config.reflector?.ring || 1,
        start: config.reflector?.start || 0,
        current: config.reflector?.current || 0
      }
    });
  };

  const handleResetPositions = () => {
    playRotorClickSound(soundEnabled);
    onUpdateConfig({
      ...config,
      leftRotor: { ...config.leftRotor, start: 0, current: 0 },
      middleRotor: { ...config.middleRotor, start: 0, current: 0 },
      rightRotor: { ...config.rightRotor, start: 0, current: 0 },
      fourthRotor: { ...config.fourthRotor, start: 0, current: 0 }
    });
  };

  const handleRandomizeRotorType = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') => {
    playRotorClickSound(soundEnabled);
    const randomType = rotorOptions[Math.floor(Math.random() * rotorOptions.length)];
    onUpdateConfig({
      ...config,
      [rotorKey]: { ...config[rotorKey], type: randomType }
    });
  };

  const handleRandomizeRotorRing = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor') => {
    playRotorClickSound(soundEnabled);
    const randomRing = Math.floor(Math.random() * 26) + 1;
    onUpdateConfig({
      ...config,
      [rotorKey]: { ...config[rotorKey], ring: randomRing }
    });
  };

  const handleRandomizeRotorStart = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor') => {
    playRotorClickSound(soundEnabled);
    const randomStart = Math.floor(Math.random() * 26);
    onUpdateConfig({
      ...config,
      [rotorKey]: { ...config[rotorKey], start: randomStart, current: randomStart }
    });
  };

  const handleRandomizeRotorEntire = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor') => {
    playRotorClickSound(soundEnabled);
    const randomType = rotorOptions[Math.floor(Math.random() * rotorOptions.length)];
    const randomRing = Math.floor(Math.random() * 26) + 1;
    const randomStart = Math.floor(Math.random() * 26);
    onUpdateConfig({
      ...config,
      [rotorKey]: {
        ...config[rotorKey],
        type: randomType,
        ring: randomRing,
        start: randomStart,
        current: randomStart
      }
    });
  };

  const handleRandomizeFourthRotorEntire = () => {
    playRotorClickSound(soundEnabled);
    const randomType: RotorType = Math.random() < 0.5 ? 'Beta' : 'Gamma';
    const randomRing = Math.floor(Math.random() * 26) + 1;
    const randomStart = Math.floor(Math.random() * 26);
    onUpdateConfig({
      ...config,
      fourthRotor: {
        ...config.fourthRotor,
        type: randomType,
        ring: randomRing,
        start: randomStart,
        current: randomStart
      }
    });
  };

  const handleRandomizeReflectorType = () => {
    playRotorClickSound(soundEnabled);
    const randomRef = reflectorOptions[Math.floor(Math.random() * reflectorOptions.length)];
    onUpdateConfig({
      ...config,
      reflector: {
        ...config.reflector,
        type: randomRef
      }
    });
  };

  const handleRandomizeReflectorRing = () => {
    playRotorClickSound(soundEnabled);
    const randomRing = Math.floor(Math.random() * 26) + 1;
    onUpdateConfig({
      ...config,
      reflector: {
        ...config.reflector,
        ring: randomRing
      }
    });
  };

  const handleRandomizeReflectorStart = () => {
    playRotorClickSound(soundEnabled);
    const randomStart = Math.floor(Math.random() * 26);
    onUpdateConfig({
      ...config,
      reflector: {
        ...config.reflector,
        start: randomStart,
        current: randomStart
      }
    });
  };

  const handleRandomizeReflectorEntire = () => {
    playRotorClickSound(soundEnabled);
    const randomRef = reflectorOptions[Math.floor(Math.random() * reflectorOptions.length)];
    const randomRing = Math.floor(Math.random() * 26) + 1;
    const randomStart = Math.floor(Math.random() * 26);
    onUpdateConfig({
      ...config,
      reflector: {
        type: randomRef,
        ring: randomRing,
        start: randomStart,
        current: randomStart
      }
    });
  };

  const handleRandomizeAll = () => {
    playRotorClickSound(soundEnabled);
    const randType = () => rotorOptions[Math.floor(Math.random() * rotorOptions.length)];
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
      const standardRefs: ReflectorType[] = ['Reflector A', 'Reflector B', 'Reflector C', 'UKW-Dual-Dynamic'];
      refType = standardRefs[Math.floor(Math.random() * standardRefs.length)];
    }

    onUpdateConfig({
      leftRotor: { type: randType(), ring: randRing(), start: randStart(), current: randStart() },
      middleRotor: { type: randType(), ring: randRing(), start: randStart(), current: randStart() },
      rightRotor: { type: randType(), ring: randRing(), start: randStart(), current: randStart() },
      fourthRotor: { type: fourthType, ring: randRing(), start: randStart(), current: randStart() },
      reflector: {
        type: refType,
        ring: randRing(),
        start: randStart(),
        current: randStart()
      },
      plugboard: config.plugboard || {}
    });
  };

  const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#1a150c] border border-[#ebc238]/40 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl texture-metal text-[#d1c4b7] relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#3b3426]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ebc238] text-xl">settings_overscan</span>
            <div>
              <h2 className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold leading-tight">
                Rotor & Reflector Quick Settings
              </h2>
              <p className="text-[11px] text-[#9e8d78]">Adjust rotor order, ring settings (Ringstellung), and initial positions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#8c7e6a] hover:text-[#ebc238] bg-[#221c11] rounded-full border border-[#3b3426] transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Reflector & Machine Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-[#120e04] p-3 rounded-lg border border-[#3b3426]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-monospaced-technical text-[#ebc238] uppercase font-bold block">
                Reflector (Umkehrwalze - UKW)
              </label>
              <button
                type="button"
                onClick={handleRandomizeReflectorType}
                className="text-[#8c7e6a] hover:text-[#ebc238] p-0.5 cursor-pointer flex items-center justify-center rounded"
                title="Randomize Reflector Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <select
              value={config.reflector.type}
              onChange={(e) => handleUpdateReflector(e.target.value as ReflectorType)}
              className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2.5 py-1.5 text-xs text-[#ebc238] font-bold focus:outline-none focus:border-[#ebc238] cursor-pointer"
            >
              {reflectorOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {config.reflector.type === 'UKW-Dual-Dynamic' && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#3b3426]">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#9e8d78]">UKW Ring</span>
                    <button
                      type="button"
                      onClick={handleRandomizeReflectorRing}
                      className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                      title="Randomize Reflector Ring"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                    <button
                      onClick={() => {
                        const cur = config.reflector.ring || 1;
                        const next = cur === 1 ? 26 : cur - 1;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, ring: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className="w-5 h-5 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">
                      {formatRotorRing(config.reflector.ring || 1, ringFormat)}
                    </span>
                    <button
                      onClick={() => {
                        const cur = config.reflector.ring || 1;
                        const next = cur === 26 ? 1 : cur + 1;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, ring: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className="w-5 h-5 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#9e8d78]">UKW Start</span>
                    <button
                      type="button"
                      onClick={handleRandomizeReflectorStart}
                      className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                      title="Randomize Reflector Start Position"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                    <button
                      onClick={() => {
                        const cur = config.reflector.start || 0;
                        const next = (cur - 1 + 26) % 26;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, start: next, current: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className="w-5 h-5 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">
                      {formatRotorPos(config.reflector.start || 0, ringFormat)}
                    </span>
                    <button
                      onClick={() => {
                        const cur = config.reflector.start || 0;
                        const next = (cur + 1) % 26;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, start: next, current: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className="w-5 h-5 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-monospaced-technical text-[#ebc238] uppercase font-bold block mb-1">
              4th Rotor Mode (M4 Naval)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playRotorClickSound(soundEnabled);
                  onUpdateConfig({
                    ...config,
                    fourthRotor: { ...config.fourthRotor, type: 'Beta' },
                     reflector: {
                      type: 'Reflector B Thin',
                      ring: config.reflector?.ring || 1,
                      start: config.reflector?.start || 0,
                      current: config.reflector?.current || 0
                    }
                  });
                }}
                className={`flex-1 py-1 px-2 text-xs rounded border cursor-pointer font-bold transition-all ${
                  config.fourthRotor.type === 'Beta' ? 'bg-[#ebc238] text-[#201b0f] border-[#ebc238]' : 'bg-[#201b0f] text-[#d1c4b7] border-[#3b3426] hover:text-[#ebc238]'
                }`}
              >
                M4 (Beta)
              </button>
              <button
                type="button"
                onClick={() => {
                  playRotorClickSound(soundEnabled);
                  onUpdateConfig({
                    ...config,
                    fourthRotor: { ...config.fourthRotor, type: 'Gamma' },
                     reflector: {
                      type: 'Reflector C Thin',
                      ring: config.reflector?.ring || 1,
                      start: config.reflector?.start || 0,
                      current: config.reflector?.current || 0
                    }
                  });
                }}
                className={`flex-1 py-1 px-2 text-xs rounded border cursor-pointer font-bold transition-all ${
                  config.fourthRotor.type === 'Gamma' ? 'bg-[#ebc238] text-[#201b0f] border-[#ebc238]' : 'bg-[#201b0f] text-[#d1c4b7] border-[#3b3426] hover:text-[#ebc238]'
                }`}
              >
                M4 (Gamma)
              </button>
            </div>
          </div>
        </div>

        {/* Rotors Grid */}
        <div className={`grid grid-cols-1 ${isM4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-4`}>
          {/* M4 4th Rotor if active */}
          {isM4 && (
            <div className="bg-[#120e04] p-3 rounded-lg border border-[#ebc238]/30 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-monospaced-technical text-[#ebc238] font-bold uppercase">
                  4th Rotor ({config.fourthRotor.type})
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeFourthRotorEntire}
                  className="text-[#8c7e6a] hover:text-[#ebc238] p-0.5 cursor-pointer flex items-center justify-center rounded"
                  title="Randomize Fourth Rotor settings"
                >
                  <span className="material-symbols-outlined text-xs">shuffle</span>
                </button>
              </div>
              <div className="w-full space-y-2 mt-1">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#9e8d78] block">Ringstellung</span>
                    <button
                      type="button"
                      onClick={() => handleRandomizeRotorRing('fourthRotor')}
                      className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                      title="Randomize Fourth Rotor Ring"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                    <button onClick={() => handleAdjustRing('fourthRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                    <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.fourthRotor.ring, ringFormat)}</span>
                    <button onClick={() => handleAdjustRing('fourthRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#9e8d78] block">Grundstellung</span>
                    <button
                      type="button"
                      onClick={() => handleRandomizeRotorStart('fourthRotor')}
                      className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                      title="Randomize Fourth Rotor Start"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                    <button onClick={() => handleAdjustStart('fourthRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                    <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorPos(config.fourthRotor.start, ringFormat)}</span>
                    <button onClick={() => handleAdjustStart('fourthRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Left / Slow Rotor */}
          <div className="bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                Slow Rotor (Left)
              </span>
              <button
                type="button"
                onClick={() => handleRandomizeRotorEntire('leftRotor')}
                className="p-0.5 text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer rounded"
                title="Randomize Left Rotor"
              >
                <span className="material-symbols-outlined text-xs">shuffle</span>
              </button>
            </div>
            <div className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-[#ebc238] font-bold mb-2 flex items-center justify-between">
              <select
                value={config.leftRotor.type}
                onChange={(e) => handleUpdateRotorType('leftRotor', e.target.value as RotorType)}
                className="bg-transparent border-none text-xs text-[#ebc238] font-bold cursor-pointer text-center flex-1 focus:outline-none"
              >
                {rotorOptions.map((r) => (
                  <option key={r} value={r}>Rotor {r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRandomizeRotorType('leftRotor')}
                className="text-[#8c7e6a] hover:text-[#ebc238] p-0.5 cursor-pointer"
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <div className="w-full space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#9e8d78] block">Ringstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorRing('leftRotor')}
                    className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                    title="Randomize Left Ring"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustRing('leftRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.leftRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('leftRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#9e8d78] block">Grundstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorStart('leftRotor')}
                    className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                    title="Randomize Left Start"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustStart('leftRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorPos(config.leftRotor.start, ringFormat)}</span>
                  <button onClick={() => handleAdjustStart('leftRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Rotor */}
          <div className="bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                Mid Rotor (Center)
              </span>
              <button
                type="button"
                onClick={() => handleRandomizeRotorEntire('middleRotor')}
                className="p-0.5 text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer rounded"
                title="Randomize Middle Rotor"
              >
                <span className="material-symbols-outlined text-xs">shuffle</span>
              </button>
            </div>
            <div className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-[#ebc238] font-bold mb-2 flex items-center justify-between">
              <select
                value={config.middleRotor.type}
                onChange={(e) => handleUpdateRotorType('middleRotor', e.target.value as RotorType)}
                className="bg-transparent border-none text-xs text-[#ebc238] font-bold cursor-pointer text-center flex-1 focus:outline-none"
              >
                {rotorOptions.map((r) => (
                  <option key={r} value={r}>Rotor {r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRandomizeRotorType('middleRotor')}
                className="text-[#8c7e6a] hover:text-[#ebc238] p-0.5 cursor-pointer"
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <div className="w-full space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#9e8d78] block">Ringstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorRing('middleRotor')}
                    className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                    title="Randomize Middle Ring"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustRing('middleRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.middleRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('middleRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#9e8d78] block">Grundstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorStart('middleRotor')}
                    className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                    title="Randomize Middle Start"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustStart('middleRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorPos(config.middleRotor.start, ringFormat)}</span>
                  <button onClick={() => handleAdjustStart('middleRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Fast Rotor */}
          <div className="bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                Fast Rotor (Right)
              </span>
              <button
                type="button"
                onClick={() => handleRandomizeRotorEntire('rightRotor')}
                className="p-0.5 text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer rounded"
                title="Randomize Right Rotor"
              >
                <span className="material-symbols-outlined text-xs">shuffle</span>
              </button>
            </div>
            <div className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-[#ebc238] font-bold mb-2 flex items-center justify-between">
              <select
                value={config.rightRotor.type}
                onChange={(e) => handleUpdateRotorType('rightRotor', e.target.value as RotorType)}
                className="bg-transparent border-none text-xs text-[#ebc238] font-bold cursor-pointer text-center flex-1 focus:outline-none"
              >
                {rotorOptions.map((r) => (
                  <option key={r} value={r}>Rotor {r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRandomizeRotorType('rightRotor')}
                className="text-[#8c7e6a] hover:text-[#ebc238] p-0.5 cursor-pointer"
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <div className="w-full space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#9e8d78] block">Ringstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorRing('rightRotor')}
                    className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                    title="Randomize Right Ring"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustRing('rightRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.rightRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('rightRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#9e8d78] block">Grundstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorStart('rightRotor')}
                    className="text-[#8c7e6a] hover:text-[#ebc238] cursor-pointer"
                    title="Randomize Right Start"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustStart('rightRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorPos(config.rightRotor.start, ringFormat)}</span>
                  <button onClick={() => handleAdjustStart('rightRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3b3426]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPositions}
              className="px-3 py-1.5 text-xs text-[#d1c4b7] hover:text-[#ebc238] bg-[#201b0f] hover:bg-[#2c2415] rounded border border-[#3b3426] cursor-pointer transition-colors"
            >
              Reset to A (01)
            </button>
            <button
              type="button"
              onClick={handleRandomizeAll}
              className="px-3 py-1.5 text-xs text-[#ebc238] hover:bg-[#ebc238]/20 bg-[#201b0f] rounded border border-[#ebc238]/40 cursor-pointer transition-colors flex items-center gap-1 font-bold"
            >
              <span className="material-symbols-outlined text-xs">shuffle</span>
              <span>Randomize All</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs text-[#201b0f] bg-[#ebc238] hover:bg-[#ffd700] rounded font-bold cursor-pointer transition-colors shadow-md"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
