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
            <label className="text-[11px] font-monospaced-technical text-[#ebc238] uppercase font-bold block mb-1">
              Reflector (Umkehrwalze - UKW)
            </label>
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
              <span className="text-[10px] font-monospaced-technical text-[#ebc238] font-bold uppercase mb-1">
                4th Rotor ({config.fourthRotor.type})
              </span>
              <div className="w-full space-y-2 mt-1">
                <div>
                  <span className="text-[10px] text-[#9e8d78] block mb-0.5">Ringstellung</span>
                  <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                    <button onClick={() => handleAdjustRing('fourthRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                    <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.fourthRotor.ring, ringFormat)}</span>
                    <button onClick={() => handleAdjustRing('fourthRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#9e8d78] block mb-0.5">Grundstellung</span>
                  <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                    <button onClick={() => handleAdjustStart('fourthRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                    <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorPos(config.fourthRotor.start, ringFormat)}</span>
                    <button onClick={() => handleAdjustStart('fourthRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── 'UKW-Dual-Dynamic' rotor quick settings ─── */}
          {config.reflector.type === 'UKW-Dual-Dynamic' && (
            <div className="bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col items-center">
              <span className="text-[10px] font-monospaced-technical text-[#ebc238] font-bold uppercase mb-1 tracking-wider">
                Reflector (UKW)
              </span>
              <div className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-center text-gray-400 font-bold mb-2 select-none">
                UKW-Dual-Dynamic
              </div>

              {/* Ring Setting */}
              <div className="w-full mb-2">
                <label className="block text-[9px] uppercase font-mono text-[#a89985] mb-0.5 text-center">Ring</label>
                <div className="flex items-center justify-between bg-[#201b0f] border border-[#4e453b] rounded px-2 py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      let currentRing = config.reflector.ring - 1;
                      if (currentRing < 1) currentRing = 26;
                      onUpdateConfig({ ...config, reflector: { ...config.reflector, ring: currentRing } });
                    }}
                    className="text-xs font-bold text-[#d1c4b7] hover:text-[#ebc238] px-1 cursor-pointer"
                  >-</button>
                  <span className="font-mono text-xs font-bold text-[#ebc238]">
                    {formatRotorRing(config.reflector.ring, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      let currentRing = config.reflector.ring + 1;
                      if (currentRing > 26) currentRing = 1;
                      onUpdateConfig({ ...config, reflector: { ...config.reflector, ring: currentRing } });
                    }}
                    className="text-xs font-bold text-[#d1c4b7] hover:text-[#ebc238] px-1 cursor-pointer"
                  >+</button>
                </div>
              </div>

              {/* Start Position */}
              <div className="w-full">
                <label className="block text-[9px] uppercase font-mono text-[#a89985] mb-0.5 text-center">Start</label>
                <div className="flex items-center justify-between bg-[#201b0f] border border-[#4e453b] rounded px-2 py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      let newStart = (config.reflector.start - 1 + 26) % 26;
                      onUpdateConfig({ ...config, reflector: { ...config.reflector, start: newStart, current: newStart } });
                    }}
                    className="text-xs font-bold text-[#d1c4b7] hover:text-[#ebc238] px-1 cursor-pointer"
                  >-</button>
                  <span className="font-mono text-xs font-bold text-[#ebc238]">
                    {formatRotorPos(config.reflector.start, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      let newStart = (config.reflector.start + 1) % 26;
                      onUpdateConfig({ ...config, reflector: { ...config.reflector, start: newStart, current: newStart } });
                    }}
                    className="text-xs font-bold text-[#d1c4b7] hover:text-[#ebc238] px-1 cursor-pointer"
                  >+</button>
                </div>
              </div>
            </div>
          )}

          {/* Left / Slow Rotor */}
          <div className="bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col items-center">
            <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase mb-1">
              Slow Rotor (Left)
            </span>
            <select
              value={config.leftRotor.type}
              onChange={(e) => handleUpdateRotorType('leftRotor', e.target.value as RotorType)}
              className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-[#ebc238] font-bold mb-2 cursor-pointer text-center"
            >
              {rotorOptions.map((r) => (
                <option key={r} value={r}>Rotor {r}</option>
              ))}
            </select>
            <div className="w-full space-y-2">
              <div>
                <span className="text-[10px] text-[#9e8d78] block mb-0.5">Ringstellung</span>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustRing('leftRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.leftRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('leftRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#9e8d78] block mb-0.5">Grundstellung</span>
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
            <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase mb-1">
              Mid Rotor (Center)
            </span>
            <select
              value={config.middleRotor.type}
              onChange={(e) => handleUpdateRotorType('middleRotor', e.target.value as RotorType)}
              className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-[#ebc238] font-bold mb-2 cursor-pointer text-center"
            >
              {rotorOptions.map((r) => (
                <option key={r} value={r}>Rotor {r}</option>
              ))}
            </select>
            <div className="w-full space-y-2">
              <div>
                <span className="text-[10px] text-[#9e8d78] block mb-0.5">Ringstellung</span>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustRing('middleRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.middleRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('middleRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#9e8d78] block mb-0.5">Grundstellung</span>
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
            <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase mb-1">
              Fast Rotor (Right)
            </span>
            <select
              value={config.rightRotor.type}
              onChange={(e) => handleUpdateRotorType('rightRotor', e.target.value as RotorType)}
              className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-2 py-1 text-xs text-[#ebc238] font-bold mb-2 cursor-pointer text-center"
            >
              {rotorOptions.map((r) => (
                <option key={r} value={r}>Rotor {r}</option>
              ))}
            </select>
            <div className="w-full space-y-2">
              <div>
                <span className="text-[10px] text-[#9e8d78] block mb-0.5">Ringstellung</span>
                <div className="flex items-center justify-between bg-[#201b0f] rounded border border-[#3b3426] p-1">
                  <button onClick={() => handleAdjustRing('rightRotor', -1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">-</button>
                  <span className="text-xs font-bold text-[#ebc238] font-monospaced-technical">{formatRotorRing(config.rightRotor.ring, ringFormat)}</span>
                  <button onClick={() => handleAdjustRing('rightRotor', 1)} className="w-6 h-6 text-xs text-[#ebc238] bg-[#2a2215] rounded hover:bg-[#ebc238] hover:text-[#1c170d] cursor-pointer">+</button>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#9e8d78] block mb-0.5">Grundstellung</span>
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
          <button
            type="button"
            onClick={handleResetPositions}
            className="px-3 py-1.5 text-xs text-[#d1c4b7] hover:text-[#ebc238] bg-[#201b0f] hover:bg-[#2c2415] rounded border border-[#3b3426] cursor-pointer transition-colors"
          >
            Reset Positions to A (01)
          </button>
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
