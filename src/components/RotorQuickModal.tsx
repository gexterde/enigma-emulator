import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React from 'react';
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
  const { theme } = useTheme();
  const t = getTheme(theme);
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
      <div className={`${t.modalBg} border ${t.borderAccent}/40 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl ${t.appTexture} ${t.textMuted} relative my-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 mb-4 border-b ${t.borderBase}`}>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${t.textAccent} text-xl`}>settings_overscan</span>
            <div>
              <h2 className={`${t.fontRotor} ${t.textAccent} text-base sm:text-lg font-bold leading-tight`}>
                Rotor & Reflector Quick Settings
              </h2>
              <p className={`text-[11px] ${t.textMuted}`}>Adjust rotor order, ring settings (Ringstellung), and initial positions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center ${t.textMuted} hover:${t.textAccent} ${t.mutedBg} rounded-full border ${t.borderBase} transition-colors cursor-pointer`}
            title="Close"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Reflector & Machine Mode */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 ${t.panelInner} p-3 rounded-lg border ${t.borderBase}`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-[11px] ${t.fontMono} ${t.textAccent} uppercase font-bold block`}>
                Reflector (Umkehrwalze - UKW)
              </label>
              <button
                type="button"
                onClick={handleRandomizeReflectorType}
                className={`${t.textMuted} hover:${t.textAccent} p-0.5 cursor-pointer flex items-center justify-center rounded`}
                title="Randomize Reflector Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <select
              value={config.reflector.type}
              onChange={(e) => handleUpdateReflector(e.target.value as ReflectorType)}
              className={`w-full ${t.panelBg} border ${t.borderBase} rounded px-2.5 py-1.5 text-xs ${t.textAccent} font-bold focus:outline-none focus:${t.borderAccent} cursor-pointer`}
            >
              {reflectorOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {config.reflector.type === 'UKW-Dual-Dynamic' && (
              <div className={`grid grid-cols-2 gap-2 mt-2 pt-2 border-t ${t.borderBase}`}>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${t.textMuted}`}>UKW Ring</span>
                    <button
                      type="button"
                      onClick={handleRandomizeReflectorRing}
                      className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                      title="Randomize Reflector Ring"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                    <button
                      onClick={() => {
                        const cur = config.reflector.ring || 1;
                        const next = cur === 1 ? 26 : cur - 1;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, ring: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className={`w-5 h-5 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}
                    >
                      -
                    </button>
                    <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>
                      {formatRotorRing(config.reflector.ring || 1, ringFormat)}
                    </span>
                    <button
                      onClick={() => {
                        const cur = config.reflector.ring || 1;
                        const next = cur === 26 ? 1 : cur + 1;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, ring: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className={`w-5 h-5 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${t.textMuted}`}>UKW Start</span>
                    <button
                      type="button"
                      onClick={handleRandomizeReflectorStart}
                      className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                      title="Randomize Reflector Start Position"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                    <button
                      onClick={() => {
                        const cur = config.reflector.start || 0;
                        const next = (cur - 1 + 26) % 26;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, start: next, current: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className={`w-5 h-5 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}
                    >
                      -
                    </button>
                    <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>
                      {formatRotorPos(config.reflector.start || 0, ringFormat)}
                    </span>
                    <button
                      onClick={() => {
                        const cur = config.reflector.start || 0;
                        const next = (cur + 1) % 26;
                        onUpdateConfig({ ...config, reflector: { ...config.reflector, start: next, current: next } });
                        playRotorClickSound(soundEnabled);
                      }}
                      className={`w-5 h-5 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className={`text-[11px] ${t.fontMono} ${t.textAccent} uppercase font-bold block mb-1`}>
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
                  config.fourthRotor.type === 'Beta' ? t.activeBadge : t.inactiveBadge
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
                  config.fourthRotor.type === 'Gamma' ? t.activeBadge : t.inactiveBadge
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
            <div className={`${t.panelInner} p-3 rounded-lg border ${t.borderAccent}/30 flex flex-col items-center`}>
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[10px] ${t.fontMono} ${t.textAccent} font-bold uppercase`}>
                  4th Rotor ({config.fourthRotor.type})
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeFourthRotorEntire}
                  className={`${t.textMuted} hover:${t.textAccent} p-0.5 cursor-pointer flex items-center justify-center rounded`}
                  title="Randomize Fourth Rotor settings"
                >
                  <span className="material-symbols-outlined text-xs">shuffle</span>
                </button>
              </div>
              <div className="w-full space-y-2 mt-1">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${t.textMuted} block`}>Ringstellung</span>
                    <button
                      type="button"
                      onClick={() => handleRandomizeRotorRing('fourthRotor')}
                      className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                      title="Randomize Fourth Rotor Ring"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                    <button onClick={() => handleAdjustRing('fourthRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                    <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorRing(config.fourthRotor.ring, ringFormat)}</span>
                    <button onClick={() => handleAdjustRing('fourthRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${t.textMuted} block`}>Grundstellung</span>
                    <button
                      type="button"
                      onClick={() => handleRandomizeRotorStart('fourthRotor')}
                      className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                      title="Randomize Fourth Rotor Start"
                    >
                      <span className="material-symbols-outlined text-[10px]">shuffle</span>
                    </button>
                  </div>
                  <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                    <button onClick={() => handleAdjustStart('fourthRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                    <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorPos(config.fourthRotor.start, ringFormat)}</span>
                    <button onClick={() => handleAdjustStart('fourthRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Left / Slow Rotor */}
          <div className={`${t.panelInner} p-3 rounded-lg border ${t.borderBase} flex flex-col items-center`}>
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] ${t.fontMono} ${t.textMuted} font-bold uppercase`}>
                Slow Rotor (Left)
              </span>
              <button
                type="button"
                onClick={() => handleRandomizeRotorEntire('leftRotor')}
                className={`p-0.5 ${t.textMuted} hover:${t.textAccent} cursor-pointer rounded`}
                title="Randomize Left Rotor"
              >
                <span className="material-symbols-outlined text-xs">shuffle</span>
              </button>
            </div>
            <div className={`w-full ${t.panelBg} border ${t.borderBase} rounded px-2 py-1 text-xs ${t.textAccent} font-bold mb-2 flex items-center justify-between`}>
              <select
                value={config.leftRotor.type}
                onChange={(e) => handleUpdateRotorType('leftRotor', e.target.value as RotorType)}
                className={`bg-transparent border-none text-xs ${t.textAccent} font-bold cursor-pointer text-center flex-1 focus:outline-none`}
              >
                {rotorOptions.map((r) => (
                  <option key={r} value={r}>Rotor {r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRandomizeRotorType('leftRotor')}
                className={`${t.textMuted} hover:${t.textAccent} p-0.5 cursor-pointer`}
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <div className="w-full space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] ${t.textMuted} block`}>Ringstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorRing('leftRotor')}
                    className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                    title="Randomize Left Ring"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                  <button onClick={() => handleAdjustRing('leftRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                  <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorRing(config.leftRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('leftRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] ${t.textMuted} block`}>Grundstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorStart('leftRotor')}
                    className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                    title="Randomize Left Start"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                  <button onClick={() => handleAdjustStart('leftRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                  <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorPos(config.leftRotor.start, ringFormat)}</span>
                  <button onClick={() => handleAdjustStart('leftRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Rotor */}
          <div className={`${t.panelInner} p-3 rounded-lg border ${t.borderBase} flex flex-col items-center`}>
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] ${t.fontMono} ${t.textMuted} font-bold uppercase`}>
                Mid Rotor (Center)
              </span>
              <button
                type="button"
                onClick={() => handleRandomizeRotorEntire('middleRotor')}
                className={`p-0.5 ${t.textMuted} hover:${t.textAccent} cursor-pointer rounded`}
                title="Randomize Middle Rotor"
              >
                <span className="material-symbols-outlined text-xs">shuffle</span>
              </button>
            </div>
            <div className={`w-full ${t.panelBg} border ${t.borderBase} rounded px-2 py-1 text-xs ${t.textAccent} font-bold mb-2 flex items-center justify-between`}>
              <select
                value={config.middleRotor.type}
                onChange={(e) => handleUpdateRotorType('middleRotor', e.target.value as RotorType)}
                className={`bg-transparent border-none text-xs ${t.textAccent} font-bold cursor-pointer text-center flex-1 focus:outline-none`}
              >
                {rotorOptions.map((r) => (
                  <option key={r} value={r}>Rotor {r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRandomizeRotorType('middleRotor')}
                className={`${t.textMuted} hover:${t.textAccent} p-0.5 cursor-pointer`}
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <div className="w-full space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] ${t.textMuted} block`}>Ringstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorRing('middleRotor')}
                    className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                    title="Randomize Middle Ring"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                  <button onClick={() => handleAdjustRing('middleRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                  <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorRing(config.middleRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('middleRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] ${t.textMuted} block`}>Grundstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorStart('middleRotor')}
                    className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                    title="Randomize Middle Start"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                  <button onClick={() => handleAdjustStart('middleRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                  <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorPos(config.middleRotor.start, ringFormat)}</span>
                  <button onClick={() => handleAdjustStart('middleRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Fast Rotor */}
          <div className={`${t.panelInner} p-3 rounded-lg border ${t.borderBase} flex flex-col items-center`}>
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] ${t.fontMono} ${t.textMuted} font-bold uppercase`}>
                Fast Rotor (Right)
              </span>
              <button
                type="button"
                onClick={() => handleRandomizeRotorEntire('rightRotor')}
                className={`p-0.5 ${t.textMuted} hover:${t.textAccent} cursor-pointer rounded`}
                title="Randomize Right Rotor"
              >
                <span className="material-symbols-outlined text-xs">shuffle</span>
              </button>
            </div>
            <div className={`w-full ${t.panelBg} border ${t.borderBase} rounded px-2 py-1 text-xs ${t.textAccent} font-bold mb-2 flex items-center justify-between`}>
              <select
                value={config.rightRotor.type}
                onChange={(e) => handleUpdateRotorType('rightRotor', e.target.value as RotorType)}
                className={`bg-transparent border-none text-xs ${t.textAccent} font-bold cursor-pointer text-center flex-1 focus:outline-none`}
              >
                {rotorOptions.map((r) => (
                  <option key={r} value={r}>Rotor {r}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRandomizeRotorType('rightRotor')}
                className={`${t.textMuted} hover:${t.textAccent} p-0.5 cursor-pointer`}
                title="Randomize Rotor Type"
              >
                <span className="material-symbols-outlined text-[11px]">shuffle</span>
              </button>
            </div>
            <div className="w-full space-y-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] ${t.textMuted} block`}>Ringstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorRing('rightRotor')}
                    className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                    title="Randomize Right Ring"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                  <button onClick={() => handleAdjustRing('rightRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                  <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorRing(config.rightRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('rightRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] ${t.textMuted} block`}>Grundstellung</span>
                  <button
                    type="button"
                    onClick={() => handleRandomizeRotorStart('rightRotor')}
                    className={`${t.textMuted} hover:${t.textAccent} cursor-pointer`}
                    title="Randomize Right Start"
                  >
                    <span className="material-symbols-outlined text-[10px]">shuffle</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between ${t.panelBg} rounded border ${t.borderBase} p-1`}>
                  <button onClick={() => handleAdjustStart('rightRotor', -1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>-</button>
                  <span className={`text-xs font-bold ${t.textAccent} ${t.fontMono}`}>{formatRotorPos(config.rightRotor.start, ringFormat)}</span>
                  <button onClick={() => handleAdjustStart('rightRotor', 1)} className={`w-6 h-6 text-xs ${t.textAccent} ${t.mutedBg} hover:${t.accentSolidBg} hover:text-black rounded cursor-pointer transition-colors`}>+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className={`flex items-center justify-between pt-3 border-t ${t.borderBase}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPositions}
              className={`px-3 py-1.5 text-xs ${t.textMuted} hover:${t.textAccent} ${t.panelBg} hover:opacity-80 rounded border ${t.borderBase} cursor-pointer transition-colors`}
            >
              Reset to A (01)
            </button>
            <button
              type="button"
              onClick={handleRandomizeAll}
              className={`px-3 py-1.5 text-xs ${t.textAccent} hover:opacity-80 ${t.panelBg} rounded border ${t.borderAccent}/40 cursor-pointer transition-colors flex items-center gap-1 font-bold`}
            >
              <span className="material-symbols-outlined text-xs">shuffle</span>
              <span>Randomize All</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-1.5 text-xs ${t.buttonHighlight} rounded font-bold cursor-pointer transition-all shadow-md`}
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
