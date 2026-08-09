import React, { useEffect, useState, useRef } from 'react';
import { EnigmaConfig, LogEntry, StepTrace, RotorType, ReflectorType } from '../types';
import {
  encryptChar,
  numToChar,
  formatRotorPos,
  formatRotorRing,
  generateConfigString,
  ROTOR_SPECS,
  ALPHABET
} from '../lib/enigmaEngine';
import { playKeyClickSound, playRotorClickSound } from '../lib/audio';
import { SignalPathAnimation } from './SignalPathAnimation';
import { PlugboardPanel } from './PlugboardPanel';
import { HISTORICAL_CODEBOOKS, CodebookSheet, CodebookEntry } from './CodebookView';

interface RotorQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
  ringFormat: 'number' | 'letter';
}

const RotorQuickModal: React.FC<RotorQuickModalProps> = ({
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
    onUpdateConfig({ ...config,    reflector: {
      type: reflectorType,
      ring: config.reflector?.ring || 1,
      start: config.reflector?.start || 0,
      current: config.reflector?.current || 0
    } });
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
        {/* ─────────────────────────────────────────────────────────────────── */}

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

interface PlugboardQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
}

const PlugboardQuickModal: React.FC<PlugboardQuickModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  soundEnabled
}) => {
  if (!isOpen) return null;

  const pairsCount = Object.keys(config.plugboard || {}).length / 2;

  const handleClearAll = () => {
    onUpdateConfig({ ...config, plugboard: {} });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#1a150c] border border-[#ebc238]/40 rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl texture-metal text-[#d1c4b7] relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#3b3426]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ebc238] text-xl">settings_ethernet</span>
            <div>
              <h2 className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                Plugboard (Steckerbrett) Quick Settings
                <span className="text-[10px] font-monospaced-technical bg-[#ebc238]/20 text-[#ebc238] px-2 py-0.5 rounded border border-[#ebc238]/40">
                  {pairsCount} / 10 Pairs
                </span>
              </h2>
              <p className="text-[11px] text-[#9e8d78]">Connect or disconnect socket pairs directly on the Enigma front panel</p>
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

        {/* Plugboard Interactive Panel */}
        <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-3 sm:p-4 shadow-panel texture-metal mb-4">
          <PlugboardPanel
            config={config}
            onUpdateConfig={onUpdateConfig}
            soundEnabled={soundEnabled}
            showTitle={false}
          />
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3b3426]">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={pairsCount === 0}
            className="px-3 py-1.5 text-xs text-[#ff8a80] hover:text-[#ff5252] bg-[#201b0f] hover:bg-[#2c1a1a] rounded border border-[#3b3426] disabled:opacity-40 cursor-pointer transition-colors"
          >
            Clear All Plugs
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

interface CodebookQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  soundEnabled: boolean;
  ringFormat: 'number' | 'letter';
}

const CodebookQuickModal: React.FC<CodebookQuickModalProps> = ({
  isOpen,
  onClose,
  onUpdateConfig,
  soundEnabled,
  ringFormat
}) => {
  if (!isOpen) return null;

  const [selectedSheetId, setSelectedSheetId] = useState<string>(HISTORICAL_CODEBOOKS[0].id);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate() || 1);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  const currentSheet = HISTORICAL_CODEBOOKS.find(s => s.id === selectedSheetId) || HISTORICAL_CODEBOOKS[0];
  const currentEntry = currentSheet.entries.find(e => e.day === selectedDay) || currentSheet.entries[0];

  const handleApply = (entry: CodebookEntry) => {
    playRotorClickSound(soundEnabled);
    const plugboardRecord: Record<string, string> = {};
    entry.plugboardPairs.forEach((pair) => {
      const clean = pair.trim().toUpperCase();
      if (clean.length === 2) {
        plugboardRecord[clean[0]] = clean[1];
        plugboardRecord[clean[1]] = clean[0];
      }
    });

    const isM4 = !!entry.fourthRotor;

    const newEnigmaConfig: EnigmaConfig = {
      leftRotor: {
        type: entry.rotors[0],
        ring: entry.rings[0],
        start: 0,
        current: 0
      },
      middleRotor: {
        type: entry.rotors[1],
        ring: entry.rings[1],
        start: 0,
        current: 0
      },
      rightRotor: {
        type: entry.rotors[2],
        ring: entry.rings[2],
        start: 0,
        current: 0
      },
      fourthRotor: {
        type: entry.fourthRotor || 'I',
        ring: entry.fourthRing || 1,
        start: 0,
        current: 0
      },
     reflector: {
        type: (entry as any).reflectorType || (isM4 ? 'Reflector B Thin' : 'Reflector B'),
        ring: (entry as any).reflectorRing || 1, // Ha a kódkönyvben a reflektornak is lenne gyűrűje
        start: 0,
        current: 0
      },
      plugboard: plugboardRecord
    };

    onUpdateConfig(newEnigmaConfig);
    setAppliedMsg(`Key for Day ${entry.day} (${currentSheet.title}) applied!`);
    setTimeout(() => setAppliedMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#1a150c] border border-[#ebc238]/40 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl texture-metal text-[#d1c4b7] relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#3b3426]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ebc238] text-xl">menu_book</span>
            <div>
              <h2 className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold leading-tight">
                Codebook & Key Sheet Quick Loader
              </h2>
              <p className="text-[11px] text-[#9e8d78]">Load daily historical Enigma key settings directly into your machine</p>
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

        {/* Sheet Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-monospaced-technical text-[#ebc238] uppercase font-bold block mb-1">
            Select Key Sheet (Schlüsseltafel)
          </label>
          <select
            value={selectedSheetId}
            onChange={(e) => {
              setSelectedSheetId(e.target.value);
              setAppliedMsg(null);
            }}
            className="w-full bg-[#201b0f] border border-[#4e453b] rounded px-3 py-2 text-xs text-[#ebc238] font-bold focus:outline-none focus:border-[#ebc238] cursor-pointer"
          >
            {HISTORICAL_CODEBOOKS.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.title} ({sheet.monthYear})
              </option>
            ))}
          </select>
        </div>

        {/* Day Selector & Key Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Day selection list */}
          <div className="bg-[#120e04] p-2.5 rounded-lg border border-[#3b3426] flex flex-col h-52">
            <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase font-bold block mb-1">
              Select Day (Tag)
            </span>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
              {currentSheet.entries.map((e) => (
                <button
                  key={e.day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(e.day);
                    setAppliedMsg(null);
                  }}
                  className={`w-full text-left px-2.5 py-1 text-xs rounded font-monospaced-technical flex items-center justify-between cursor-pointer transition-colors ${
                    selectedDay === e.day
                      ? 'bg-[#ebc238] text-[#1a150c] font-bold'
                      : 'bg-[#1b160e] text-[#d1c4b7] hover:bg-[#2a2215]'
                  }`}
                >
                  <span>Day {e.day < 10 ? `0${e.day}` : e.day}</span>
                  <span className="text-[10px] opacity-80">{e.rotors.join('-')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Entry Details */}
          <div className="sm:col-span-2 bg-[#120e04] p-3 rounded-lg border border-[#3b3426] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#3b3426] pb-1.5 mb-2">
                <span className="text-xs font-monospaced-technical text-[#ebc238] font-bold">
                  Day {currentEntry.day} Key Specs
                </span>
                <span className="text-[10px] text-[#9e8d78] font-mono">
                  {currentSheet.classification}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-[#1c170d] p-1.5 rounded border border-[#2d2518]">
                  <span className="text-[11px] text-[#8c7e6a] font-monospaced-technical">Walzenlage (Rotors):</span>
                  <span className="font-bold text-[#ebc238] font-monospaced-technical">
                    {currentEntry.fourthRotor ? `${currentEntry.fourthRotor} - ` : ''}
                    {currentEntry.rotors.join(' - ')}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#1c170d] p-1.5 rounded border border-[#2d2518]">
                  <span className="text-[11px] text-[#8c7e6a] font-monospaced-technical">Ringstellung (Rings):</span>
                  <span className="font-bold text-[#ebc238] font-monospaced-technical">
                    {currentEntry.rings.map(r => formatRotorRing(r, ringFormat)).join(' - ')}
                  </span>
                </div>

                <div className="bg-[#1c170d] p-1.5 rounded border border-[#2d2518]">
                  <span className="text-[11px] text-[#8c7e6a] font-monospaced-technical block mb-1">
                    Steckerverbindungen ({currentEntry.plugboardPairs.length} Pairs):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                    {currentEntry.plugboardPairs.map((pair, idx) => (
                      <span key={idx} className="bg-[#2a2215] text-[#ebc238] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-[#ebc238]/30">
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {appliedMsg ? (
              <div className="bg-[#2e7d32]/30 border border-[#4caf50] text-[#a5d6a7] text-xs px-3 py-1.5 rounded text-center font-bold mt-2 animate-fade-in">
                ✓ {appliedMsg}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleApply(currentEntry)}
                className="w-full mt-3 py-2 bg-[#ebc238] hover:bg-[#ffd700] text-[#1a150c] font-bold text-xs rounded transition-colors shadow cursor-pointer font-monospaced-technical uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Apply Day {currentEntry.day} Key Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3b3426]">
          <span className="text-[10px] text-[#8c7e6a] truncate max-w-[300px]">
            {currentSheet.subtitle}
          </span>
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

interface MachineViewProps {
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  onAddLog: (entry: LogEntry) => void;
  soundEnabled: boolean;
  compactMode?: boolean;
  onToggleCompactMode?: () => void;
}

// Authentic Enigma M3/M4 Lampboard/Keyboard Layout (3 rows: 9, 8, 9 keys)
const ENIGMA_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
  ['P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];

export type BatterySwitchMode = 'hell' | 'dkl' | 'aus' | 'sammler';

interface BatterySwitchProps {
  mode: BatterySwitchMode;
  onChangeMode: (mode: BatterySwitchMode) => void;
  compact?: boolean;
}

const BatterySwitch: React.FC<BatterySwitchProps> = ({ mode, onChangeMode, compact = false }) => {
  const getAngle = (m: BatterySwitchMode) => {
    switch (m) {
      case 'hell': return -54;
      case 'dkl': return -10;
      case 'aus': return 16;
      case 'sammler': return 50;
      default: return -54;
    }
  };

  const angle = getAngle(mode);

  const modes: { id: BatterySwitchMode; label: string }[] = [
    { id: 'hell', label: 'hell' },
    { id: 'dkl', label: 'dkl' },
    { id: 'aus', label: 'aus' },
    { id: 'sammler', label: 'Sammler 4V' }
  ];

  return (
    <div
      className={`flex flex-col items-center bg-[#100d07] rounded-xl border border-[#3b3426] shadow-2xl select-none w-full transition-all ${
        compact ? 'p-1.5 max-w-[145px]' : 'p-2 max-w-[160px]'
      }`}
    >
      <div className={`font-monospaced-technical text-[#a89983] uppercase tracking-wider font-bold flex items-center gap-1 ${compact ? 'text-[8px] mb-0.5' : 'text-[9px] mb-0.5'}`}>
        <span className="material-symbols-outlined text-xs text-[#ebc238]">bolt</span>
        BATTERIESCHALTER
      </div>

      <div className={`relative flex items-center justify-center bg-[#18130b] rounded-lg border border-[#2d2518] p-1 shadow-inner w-full ${compact ? 'h-20 my-0.5' : 'h-24 my-0.5'}`}>
        <svg viewBox="0 0 200 135" className="w-full h-full overflow-visible">
          <defs>
            {/* Wrinkled dark metallic panel texture gradient */}
            <radialGradient id="panelGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#211b12" />
              <stop offset="100%" stopColor="#0d0a06" />
            </radialGradient>

            {/* Brass finish gradient */}
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f7ea9b" />
              <stop offset="40%" stopColor="#d8b240" />
              <stop offset="80%" stopColor="#8f6f1c" />
              <stop offset="100%" stopColor="#57420e" />
            </linearGradient>

            {/* Bakelite knob gradient */}
            <radialGradient id="bakeliteBody" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#4a2d1d" />
              <stop offset="40%" stopColor="#28170e" />
              <stop offset="85%" stopColor="#140b06" />
              <stop offset="100%" stopColor="#090402" />
            </radialGradient>

            {/* Arc plate filter shadow */}
            <filter id="plateShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background Textured Plate */}
          <rect x="0" y="0" width="200" height="135" rx="6" fill="url(#panelGrad)" />

          {/* Center Axle Screwhole */}
          <circle cx="100" cy="92" r="6" fill="#080503" stroke="#2d2215" strokeWidth="1.2" />

          {/* Pure White Porcelain / Enamel Arc Scale Plate */}
          <path
            d="M 32,92 A 68,68 0 0,1 168,92"
            fill="none"
            stroke="#120e09"
            strokeWidth="28"
            strokeLinecap="round"
            filter="url(#plateShadow)"
          />
          <path
            d="M 32,92 A 68,68 0 0,1 168,92"
            fill="none"
            stroke="#ffffff"
            strokeWidth="25"
            strokeLinecap="round"
          />

          {/* Screws on Porcelain Arc Ends */}
          <g transform="translate(32, 92)">
            <circle cx="0" cy="0" r="3.2" fill="url(#brassGrad)" stroke="#1a1106" strokeWidth="0.6" />
            <line x1="-2" y1="-0.8" x2="2" y2="0.8" stroke="#0a0602" strokeWidth="0.8" />
          </g>
          <g transform="translate(168, 92)">
            <circle cx="0" cy="0" r="3.2" fill="url(#brassGrad)" stroke="#1a1106" strokeWidth="0.6" />
            <line x1="-2" y1="0.8" x2="2" y2="-0.8" stroke="#0a0602" strokeWidth="0.8" />
          </g>

          {/* HIGH-CONTRAST BLACK GERMAN LABELS DIRECTLY ON WHITE ENAMEL ARC */}
          {/* Label: hell (-54 deg) */}
          <g transform="translate(100, 92) rotate(-54)">
            <text x="0" y="-68" fontSize="9.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              hell
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Label: Batterie (-32 deg) */}
          <g transform="translate(100, 92) rotate(-32)">
            <text x="0" y="-68" fontSize="8" fontWeight="800" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              Batterie
            </text>
          </g>

          {/* Label: dkl (-10 deg) */}
          <g transform="translate(100, 92) rotate(-10)">
            <text x="0" y="-68" fontSize="9.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              dkl
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Label: aus (16 deg) */}
          <g transform="translate(100, 92) rotate(16)">
            <text x="0" y="-68" fontSize="9.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              aus
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Label: Sammler 4V (50 deg) */}
          <g transform="translate(100, 92) rotate(50)">
            <text x="0" y="-68" fontSize="8" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
              Sammler 4V
            </text>
            <line x1="0" y1="-62" x2="0" y2="-57" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Brass Binding Posts (4V Accumulator terminals on far right) */}
          <g transform="translate(182, 38)">
            <circle cx="0" cy="0" r="5.5" fill="url(#brassGrad)" stroke="#38290a" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#fce484" />
            <line x1="-2.8" y1="0" x2="2.8" y2="0" stroke="#261b05" strokeWidth="0.8" />
          </g>
          <g transform="translate(182, 62)">
            <circle cx="0" cy="0" r="5.5" fill="url(#brassGrad)" stroke="#38290a" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2" fill="#fce484" />
            <line x1="-2.8" y1="0" x2="2.8" y2="0" stroke="#261b05" strokeWidth="0.8" />
          </g>

          {/* ROTATING BAKELITE KNOB WITH DOUBLE-ENDED BRASS ARROW */}
          <g
            transform={`translate(100, 92) rotate(${angle})`}
            className="transition-transform duration-300 ease-out cursor-pointer"
            onClick={() => {
              const order: BatterySwitchMode[] = ['hell', 'dkl', 'aus', 'sammler'];
              const idx = order.indexOf(mode);
              onChangeMode(order[(idx + 1) % order.length]);
            }}
          >
            {/* Knob Base Outer Circle */}
            <circle cx="0" cy="0" r="32" fill="#0a0604" stroke="#281a10" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="29" fill="url(#bakeliteBody)" stroke="#110a06" strokeWidth="0.8" />

            {/* Raised Teardrop Bakelite Handle Bar */}
            <path
              d="M -10,-38 C -10,-44 10,-44 10,-38 L 12,38 C 12,44 -12,44 -12,38 Z"
              fill="url(#bakeliteBody)"
              stroke="#050302"
              strokeWidth="1"
              filter="url(#plateShadow)"
            />

            {/* Inner Handle Grip Ridge */}
            <path
              d="M -7,-34 L 7,-34 L 8,34 L -8,34 Z"
              fill="#211209"
              stroke="#382012"
              strokeWidth="0.6"
            />

            {/* Center Brass Hub Screw */}
            <circle cx="0" cy="0" r="5" fill="url(#brassGrad)" stroke="#2d1f07" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.8" fill="#120c04" />

            {/* DOUBLE-ENDED BRASS ARROW INDICATOR */}
            <g transform="translate(0, 0)">
              {/* Top Arrow Pointer (Points directly to white arc scale label) */}
              <path d="M 0,-28 L -5,-19 L -2,-19 L -2,-5 L 2,-5 L 2,-19 L 5,-19 Z" fill="url(#brassGrad)" stroke="#3d2c08" strokeWidth="0.5" />
              {/* Bottom Arrow Pointer */}
              <path d="M 0,28 L -5,19 L -2,19 L -2,5 L 2,5 L 2,19 L 5,19 Z" fill="url(#brassGrad)" stroke="#3d2c08" strokeWidth="0.5" />
            </g>
          </g>
        </svg>
      </div>

      {/* Quick Select Mode Buttons */}
      <div className={`flex items-center gap-1 w-full justify-center ${compact ? 'mt-0.5 text-[8px]' : 'mt-1 text-[9px]'} font-monospaced-technical`}>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChangeMode(m.id)}
            className={`rounded transition-all cursor-pointer font-bold ${compact ? 'px-1 py-0.2' : 'px-1.5 py-0.5'} ${
              mode === m.id
                ? m.id === 'aus'
                  ? 'bg-[#ff3b30] text-white shadow-md'
                  : 'bg-[#ebc238] text-[#25190b] shadow-md ring-1 ring-[#fff5d6]'
                : 'bg-[#1b160b] text-[#9e8d78] hover:text-[#e2d7c5] border border-[#2b2416]'
            }`}
            title={`Set Power Switch to ${m.label}`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MachineView: React.FC<MachineViewProps> = ({
  config,
  onUpdateConfig,
  onAddLog,
  soundEnabled,
  compactMode,
  onToggleCompactMode
}) => {
  const [litLamp, setLitLamp] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [inputTape, setInputTape] = useState<string>('');
  const [cipherTape, setCipherTape] = useState<string>('');
  const [activeGroupSize, setActiveGroupSize] = useState<number>(0);

  // Ringstellung / Rotor position format: 'number' (01-26) or 'letter' (A-Z)
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

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('enigma_ring_format');
        if (saved === 'letter' || saved === 'number') setRingFormat(saved);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Visibility toggles requested by user
  const [showRotorModal, setShowRotorModal] = useState<boolean>(false);
  const [showPlugModal, setShowPlugModal] = useState<boolean>(false);
  const [showCodebookModal, setShowCodebookModal] = useState<boolean>(false);
  const [showChamber, setShowChamber] = useState<boolean>(true);
  const [showSignalAnimation, setShowSignalAnimation] = useState<boolean>(false);
  const [keyboardBulbsOnly, setKeyboardBulbsOnly] = useState<boolean>(false);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    if (compactMode !== undefined) return compactMode;
    try {
      return localStorage.getItem('enigma_compact_mode') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (compactMode !== undefined && compactMode !== isCompactMode) {
      setIsCompactMode(compactMode);
    }
  }, [compactMode]);

  const handleToggleCompactMode = () => {
    const next = !isCompactMode;
    setIsCompactMode(next);
    if (onToggleCompactMode) {
      onToggleCompactMode();
    }
    try {
      localStorage.setItem('enigma_compact_mode', String(next));
    } catch (e) {
      // ignore
    }
  };

  // Dim light effect for idle lampboard bulbs
  const [dimIdleLights, setDimIdleLights] = useState<boolean>(() => {
    try {
      return localStorage.getItem('enigma_dim_idle_lights') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleToggleDimIdleLights = () => {
    const next = !dimIdleLights;
    setDimIdleLights(next);
    try {
      localStorage.setItem('enigma_dim_idle_lights', String(next));
    } catch (e) {
      // ignore
    }
  };

  // Battery rotary power switch mode ('hell' | 'dkl' | 'aus' | 'sammler')
  const [batteryMode, setBatteryMode] = useState<BatterySwitchMode>(() => {
    try {
      const saved = localStorage.getItem('enigma_battery_mode') as BatterySwitchMode;
      if (saved === 'hell' || saved === 'dkl' || saved === 'aus' || saved === 'sammler') return saved;
    } catch (e) {
      // ignore
    }
    return 'hell';
  });

  const handleSetBatteryMode = (mode: BatterySwitchMode) => {
    setBatteryMode(mode);
    playRotorClickSound(soundEnabled);
    try {
      localStorage.setItem('enigma_battery_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  // Active signal path key
  const [activeSignalKey, setActiveSignalKey] = useState<string>('A');

  // Store actual trace result from keypress to keep SignalPathAnimation in sync
  const [lastTraceResult, setLastTraceResult] = useState<{
    inputChar: string;
    outputChar: string;
    trace: StepTrace[];
    configBefore: EnigmaConfig;
    configAfter: EnigmaConfig;
  } | null>(null);

  // Handle key press down (starts when key is physically pressed or clicked)
  const handleKeyPressStart = (char: string) => {
    const uppercaseChar = char.toUpperCase();
    if (!ALPHABET.includes(uppercaseChar)) return;

    // Avoid duplicate re-triggering if already pressed
    if (pressedKey === uppercaseChar) return;

    playKeyClickSound(soundEnabled);
    setPressedKey(uppercaseChar);
    setActiveSignalKey(uppercaseChar);

    // Run cryptographic transformation
    const { nextConfig, result } = encryptChar(uppercaseChar, config);

    // Mechanical rotor stepping occurs regardless of electrical power
    onUpdateConfig(nextConfig);

    const isPowerOn = batteryMode !== 'aus';

    if (isPowerOn) {
      // Save actual trace result so visualizer matches paper tape exactly
      setLastTraceResult({
        inputChar: uppercaseChar,
        outputChar: result.outputChar,
        trace: result.trace,
        configBefore: config,
        configAfter: nextConfig
      });

      // Illuminate target lamp
      setLitLamp(result.outputChar);

      // Update paper tape outputs
      setCipherTape((prev) => prev + result.outputChar);

      // Record log entry
      const logEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        inputChar: uppercaseChar,
        outputChar: result.outputChar,
        configString: generateConfigString(nextConfig, ringFormat),
        trace: result.trace
      };
      onAddLog(logEntry);
    }

    if (!keyboardBulbsOnly) {
      setInputTape((prev) => prev + uppercaseChar);
    }
  };

  // Handle key press release (stops when key is released)
  const handleKeyPressEnd = (char?: string) => {
    if (char && pressedKey && char.toUpperCase() !== pressedKey) return;
    setPressedKey(null);
    setLitLamp(null);
  };

  // Keyboard listener for physical computer typing (press & release)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const key = e.key.toUpperCase();
      if (ALPHABET.includes(key)) {
        e.preventDefault();
        if (!e.repeat) {
          handleKeyPressStart(key);
        }
      } else if (e.key === 'Backspace' && !e.repeat) {
        e.preventDefault();
        setInputTape((prev) => prev.slice(0, -1));
        setCipherTape((prev) => prev.slice(0, -1));
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setInputTape((prev) => prev + ' ');
        if (batteryMode !== 'aus') {
          setCipherTape((prev) => prev + ' ');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      const key = e.key.toUpperCase();
      if (ALPHABET.includes(key)) {
        handleKeyPressEnd(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config, pressedKey, soundEnabled, keyboardBulbsOnly, batteryMode]);

  // Format tape string into 5-letter blocks
  const formatTapeText = (text: string) => {
    const clean = text.replace(/[^A-Z]/g, '');
    if (activeGroupSize === 0) return clean;
    const regex = new RegExp(`.{1,${activeGroupSize}}`, 'g');
    return (clean.match(regex) || []).join(' ');
  };

  const handleManualRotorStep = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor', delta: number) => {
    playRotorClickSound(soundEnabled);
    onUpdateConfig({
      ...config,
      [rotorKey]: {
        ...config[rotorKey],
        current: (config[rotorKey].current + delta + 26) % 26
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3b3426] pb-4 gap-3">
        <div>
          <h1 className="text-rotor-label font-rotor-label text-[#ebc238] text-xl md:text-2xl">
            Machine Dashboard
          </h1>
          <p className="text-[#d1c4b7] text-xs font-ui-body">
            Enigma M3/M4 Scrambler, Plugboard, Lampboard & Bakelite Keyboard. Type directly on your keyboard or click buttons.
          </p>
        </div>
        
        {/* Quick View Toggles & Config String */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleCompactMode}
            className={`text-xs font-ui-header px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCompactMode
                ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-[0_0_12px_rgba(235,194,56,0.4)]'
                : 'bg-[#120e04] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
            }`}
            title="Toggle Compact Enigma Machine Mode"
          >
            <span className="material-symbols-outlined text-sm">
              {isCompactMode ? 'compress' : 'aspect_ratio'}
            </span>
            Compact Mode
          </button>

          <button
            type="button"
            onClick={() => setKeyboardBulbsOnly(!keyboardBulbsOnly)}
            className={`text-xs font-ui-header px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              keyboardBulbsOnly
                ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-[0_0_12px_rgba(235,194,56,0.4)]'
                : 'bg-[#120e04] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
            }`}
            title="Show only the Lampboard (Bulbs) and Keyboard"
          >
            <span className="material-symbols-outlined text-sm">
              {keyboardBulbsOnly ? 'lightbulb' : 'lightbulb_outline'}
            </span>
            Keys & Bulbs Only
          </button>

          <button
            type="button"
            onClick={handleToggleDimIdleLights}
            className={`text-xs font-ui-header px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              dimIdleLights
                ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold shadow-[0_0_12px_rgba(235,194,56,0.4)]'
                : 'bg-[#120e04] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
            }`}
            title="Apply realistic dim glow & flickering effect to idle lampboard bulbs"
          >
            <span className="material-symbols-outlined text-sm">
              {dimIdleLights ? 'flare' : 'wb_twilight'}
            </span>
            Dim Idle Bulbs {dimIdleLights ? 'ON' : 'OFF'}
          </button>

          {!keyboardBulbsOnly && !isCompactMode && (
            <>
              <button
                type="button"
                onClick={() => setShowChamber(!showChamber)}
                className={`text-xs font-ui-header px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showChamber
                    ? 'bg-[#3b3426] text-[#e3c193] border-[#8b6f47] hover:bg-[#4e453b]'
                    : 'bg-[#120e04] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                }`}
                title="Toggle Scrambler Chamber Visibility"
              >
                <span className="material-symbols-outlined text-sm">
                  {showChamber ? 'visibility' : 'visibility_off'}
                </span>
                Chamber
              </button>

              {/* <button
                type="button"
                onClick={() => setShowPlugboard(!showPlugboard)}
                className={`text-xs font-ui-header px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showPlugboard
                    ? 'bg-[#3b3426] text-[#e3c193] border-[#8b6f47] hover:bg-[#4e453b]'
                    : 'bg-[#120e04] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                }`}
                title="Toggle Plugboard Visibility"
              >
                <span className="material-symbols-outlined text-sm">
                  {showPlugboard ? 'visibility' : 'visibility_off'}
                </span>
                Plugboard ({plugboardPairsCount})
              </button> */}

              <button
                type="button"
                onClick={() => setShowSignalAnimation(!showSignalAnimation)}
                className={`text-xs font-ui-header px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showSignalAnimation
                    ? 'bg-[#3b3426] text-[#e3c193] border-[#8b6f47] hover:bg-[#4e453b]'
                    : 'bg-[#120e04] text-[#83715d] border-[#3b3426] hover:text-[#d1c4b7]'
                }`}
                title="Toggle Signal Path Visualizer"
              >
                <span className="material-symbols-outlined text-sm">timeline</span>
                Signal Path
              </button>
            </>
          )}

          <div className="text-monospaced-technical text-xs text-[#e3c193] bg-[#120e04] px-3 py-1.5 rounded border border-[#3b3426]">
            Config: {generateConfigString(config, ringFormat)}
          </div>
        </div>
      </div>

      {isCompactMode ? (
        <div className="wood-texture p-3 sm:p-5 rounded-2xl border border-[#4a3e2e] shadow-2xl space-y-4 max-w-2xl mx-auto">
          {keyboardBulbsOnly && (
            <div className="bg-[#120e04] border border-[#ebc238]/40 text-[#ebc238] rounded-lg p-2.5 text-center text-xs font-monospaced-technical flex items-center justify-between shadow-panel">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                Keys & Bulbs Only View Active (Minimalist Compact View)
              </span>
              <button
                type="button"
                onClick={() => setKeyboardBulbsOnly(false)}
                className="text-white hover:text-[#ebc238] underline font-ui-header cursor-pointer ml-2"
              >
                Show All Panels
              </button>
            </div>
          )}

          {/* Output Tape */}
          {!keyboardBulbsOnly && (
            <div className="bg-[#1b1710]/90 p-3 rounded-xl border border-[#3d3526] shadow-lg flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] tracking-wider uppercase flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-xs text-[#ebc238]">receipt_long</span>
                  OUTPUT TAPE
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => cipherTape && navigator.clipboard.writeText(formatTapeText(cipherTape))}
                    className="p-1 text-[#8c7e6a] hover:text-[#e3c193] transition-colors rounded cursor-pointer"
                    title="Copy Output Tape"
                    aria-label="Copy Output"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInputTape(''); setCipherTape(''); }}
                    className="p-1 text-[#8c7e6a] hover:text-[#ff8a80] transition-colors rounded cursor-pointer"
                    title="Clear Output Tape"
                    aria-label="Clear Output"
                  >
                    <span className="material-symbols-outlined text-sm">backspace</span>
                  </button>
                </div>
              </div>
              <div className="paper-tape min-h-[44px] max-h-[80px] w-full px-3 py-2 font-monospaced-technical text-[#2b261f] overflow-y-auto break-all tracking-widest text-sm sm:text-base font-bold rounded shadow-inner flex items-center justify-between">
                <span>{formatTapeText(cipherTape) || <span className="text-[#8c7e6a] italic font-normal text-xs">Tape output will appear here as you type...</span>}</span>
              </div>
            </div>
          )}

          {/* Rotor Bay (Walzenlage) */}
          {!keyboardBulbsOnly && (
            <div className="metal-plate p-3 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#3d3526]/60 px-1">
                <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] tracking-widest uppercase flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-xs text-[#ebc238]">tune</span>
                  WALZENLAGE (ROTORS)
                </span>
                <div className="flex items-center gap-1 text-[10px] font-monospaced-technical">
                  <button
                    type="button"
                    onClick={() => handleSetRingFormat('number')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${ringFormat === 'number' ? 'bg-[#ebc238] text-[#25190b] font-bold' : 'text-[#83715d] hover:text-[#d1c4b7]'}`}
                  >
                    01–26
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRingFormat('letter')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${ringFormat === 'letter' ? 'bg-[#ebc238] text-[#25190b] font-bold' : 'text-[#83715d] hover:text-[#d1c4b7]'}`}
                  >
                    A–Z
                  </button>
                </div>
              </div>

              {/* Quick Settings Action Bar in front of Rotors */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#18130a] px-3 py-1.5 rounded-lg border border-[#3d3526] shadow-inner">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRotorModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Rotor Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_overscan</span>
                    <span>ROTOR SETTINGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlugModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Plugboard Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                    <span>PLUG SETTINGS</span>
                    <span className="bg-[#ebc238]/20 text-[#ebc238] px-1.5 py-0.2 rounded text-[10px] font-mono">
                      {Object.keys(config.plugboard || {}).length / 2} pairs
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodebookModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Codebook Key Sheets Quick Window"
                  >
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    <span>CODEBOOK</span>
                  </button>
                </div>
                <div className="text-[10px] font-monospaced-technical text-[#8c7e6a]">
                  Reflector: <span className="text-[#ebc238] font-bold">{config.reflector.type}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 py-1">
                {/* If M4 4th rotor present */}
                {(config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma') && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-monospaced-technical text-[#83715d] mb-1 font-bold">
                      FIXED
                    </span>
                    <div className="relative bg-[#120e04] border border-[#4e453b] rounded shadow-inner w-12 sm:w-14 h-16 sm:h-18 flex items-center justify-center my-0.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('fourthRotor', 1)}
                        className="absolute top-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                        title="Rotate Up"
                      >
                        <span className="material-symbols-outlined text-[14px] leading-none">expand_less</span>
                      </button>
                      <span key={config.fourthRotor.current} className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold select-none leading-none animate-rotor-step">
                        {formatRotorPos(config.fourthRotor.current, ringFormat)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('fourthRotor', -1)}
                        className="absolute bottom-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                        title="Rotate Down"
                      >
                        <span className="material-symbols-outlined text-[14px] leading-none">expand_more</span>
                      </button>
                    </div>
                    <span className="text-[10px] font-monospaced-technical text-[#ebc238] mt-1.5 font-bold tracking-wider">
                      {config.fourthRotor.type === 'Beta' ? 'β' : 'γ'}
                    </span>
                  </div>
                )}

                {/* Left Rotor */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-monospaced-technical text-[#83715d] mb-1 font-bold">SLOW</span>
                  <div className="relative bg-[#120e04] border border-[#4e453b] rounded shadow-inner w-12 sm:w-14 h-16 sm:h-18 flex items-center justify-center my-0.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('leftRotor', 1)}
                      className="absolute top-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                      title="Rotate Up"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">expand_less</span>
                    </button>
                    <span key={config.leftRotor.current} className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold select-none leading-none animate-rotor-step">
                      {formatRotorPos(config.leftRotor.current, ringFormat)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('leftRotor', -1)}
                      className="absolute bottom-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                      title="Rotate Down"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">expand_more</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] mt-1.5 font-bold tracking-wider">
                    {config.leftRotor.type}
                  </span>
                  <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={ROTOR_SPECS[config.leftRotor.type]?.turnoverAction}>
                    Notch: {ROTOR_SPECS[config.leftRotor.type]?.notch}
                  </span>
                </div>

                {/* Middle Rotor */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-monospaced-technical text-[#83715d] mb-1 font-bold">MID</span>
                  <div className="relative bg-[#120e04] border border-[#4e453b] rounded shadow-inner w-12 sm:w-14 h-16 sm:h-18 flex items-center justify-center my-0.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('middleRotor', 1)}
                      className="absolute top-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                      title="Rotate Up"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">expand_less</span>
                    </button>
                    <span key={config.middleRotor.current} className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold select-none leading-none animate-rotor-step">
                      {formatRotorPos(config.middleRotor.current, ringFormat)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('middleRotor', -1)}
                      className="absolute bottom-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                      title="Rotate Down"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">expand_more</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] mt-1.5 font-bold tracking-wider">
                    {config.middleRotor.type}
                  </span>
                  <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={ROTOR_SPECS[config.middleRotor.type]?.turnoverAction}>
                    Notch: {ROTOR_SPECS[config.middleRotor.type]?.notch}
                  </span>
                </div>

                {/* Right Rotor */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-monospaced-technical text-[#83715d] mb-1 font-bold">FAST</span>
                  <div className="relative bg-[#120e04] border border-[#4e453b] rounded shadow-inner w-12 sm:w-14 h-16 sm:h-18 flex items-center justify-center my-0.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('rightRotor', 1)}
                      className="absolute top-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                      title="Rotate Up"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">expand_less</span>
                    </button>
                    <span key={config.rightRotor.current} className="font-rotor-label text-[#ebc238] text-base sm:text-lg font-bold select-none leading-none animate-rotor-step">
                      {formatRotorPos(config.rightRotor.current, ringFormat)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('rightRotor', -1)}
                      className="absolute bottom-0 w-full h-5 flex items-center justify-center text-[#83715d] hover:text-[#ebc238] hover:bg-[#ebc238]/10 cursor-pointer transition-colors"
                      title="Rotate Down"
                    >
                      <span className="material-symbols-outlined text-[14px] leading-none">expand_more</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] mt-1.5 font-bold tracking-wider">
                    {config.rightRotor.type}
                  </span>
                  <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={ROTOR_SPECS[config.rightRotor.type]?.turnoverAction}>
                    Notch: {ROTOR_SPECS[config.rightRotor.type]?.notch}
                  </span>
                </div>

                {/* Battery Power Switch */}
                <div className="hidden sm:block h-16 w-[1px] bg-[#3b3426]/80 mx-1" />
                <BatterySwitch mode={batteryMode} onChangeMode={handleSetBatteryMode} compact={true} />
              </div>
            </div>
          )}

          {/* Lampboard (Lampenfeld) */}
          <div className="metal-plate p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3 pb-1 border-b border-[#3d3526]/60 px-1">
              <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] tracking-widest uppercase flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-xs text-[#ebc238]">lightbulb</span>
                LAMPENFELD (LAMPBOARD)
              </span>
              {batteryMode !== 'aus' && litLamp && (
                <span className={`animate-pulse text-[10px] font-monospaced-technical px-2 py-0.5 rounded border font-bold ${
                  batteryMode === 'dkl'
                    ? 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40'
                    : batteryMode === 'sammler'
                    ? 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]'
                    : 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40'
                }`}>
                  {batteryMode === 'dkl' && 'LAMP LIT (2.5V DIM): '}
                  {batteryMode === 'sammler' && 'LAMP LIT (4V SAMMLER): '}
                  {batteryMode === 'hell' && 'LAMP LIT (3.5V): '}
                  {litLamp}
                </span>
              )}
            </div>

            <div className="space-y-2.5 w-full max-w-lg">
              {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2.5">
                  {row.map((char) => {
                    const isPowerOn = batteryMode !== 'aus';
                    const isLit = isPowerOn && litLamp === char;
                    const isDimIdle = isPowerOn && !litLamp && dimIdleLights;

                    let lampClass = '';
                    if (isLit) {
                      if (batteryMode === 'dkl') lampClass = 'lamp-on-dkl scale-102';
                      else if (batteryMode === 'sammler') lampClass = 'lamp-on-sammler scale-110';
                      else lampClass = 'lamp-on-hell scale-105';
                    }

                    let idleClass = '';
                    if (isDimIdle) {
                      if (batteryMode === 'dkl') idleClass = 'lamp-dim-glow-dkl';
                      else if (batteryMode === 'sammler') idleClass = 'lamp-dim-glow-sammler';
                      else idleClass = 'lamp-dim-glow';
                    }

                    return (
                      <div
                        key={char}
                        className={`lamp-socket w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${lampClass}`}
                      >
                        <div
                          className={`lamp-glass w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-lamp-char text-xs sm:text-sm font-bold ${idleClass}`}
                        >
                          {char}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bakelite Keyboard (Tastatur) */}
          <div className="metal-plate p-3 sm:p-4 rounded-xl shadow-md flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3 pb-1 border-b border-[#3d3526]/60 px-1">
              <span className="text-[10px] font-monospaced-technical text-[#8c7e6a] tracking-widest uppercase flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-xs text-[#8c7e6a]">keyboard</span>
                TASTATUR (KEYBOARD)
              </span>
              <span className="text-[9px] font-monospaced-technical text-[#83715d]">
                PRESS OR CLICK KEYS
              </span>
            </div>

            <div className="space-y-2.5 w-full max-w-lg">
              {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2.5">
                  {row.map((char) => {
                    const isPressed = pressedKey === char;
                    return (
                      <button
                        key={char}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                        onMouseUp={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                        onMouseLeave={() => handleKeyPressEnd(char)}
                        onTouchStart={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                        className={`bakelite-key w-8 h-8 sm:w-10 sm:h-10 rounded-full text-[#e3c193] font-rotor-label font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer select-none ${
                          isPressed ? 'key-pressed' : ''
                        }`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
        {keyboardBulbsOnly && (
          <div className="bg-[#120e04] border border-[#ebc238]/40 text-[#ebc238] rounded-lg p-2.5 text-center text-xs font-monospaced-technical flex items-center justify-between shadow-panel">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              Keys & Bulbs Only View Active (Minimalist Machine View)
            </span>
            <button
              type="button"
              onClick={() => setKeyboardBulbsOnly(false)}
              className="text-white hover:text-[#ebc238] underline font-ui-header cursor-pointer ml-2"
            >
              Show All Panels
            </button>
          </div>
        )}

      {/* Top Section: Rotors Chamber (Walzen) */}
      {!keyboardBulbsOnly && (
        <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 shadow-panel texture-metal transition-all">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#3b3426]">
            <h2 className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#ebc238]">tune</span>
              Scrambler Chamber (Walzen)
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#120e04] px-2 py-0.5 rounded border border-[#3b3426] text-[10px]">
                <span className="text-[#e3c193] font-bold uppercase hidden sm:inline">Format:</span>
                <button
                  type="button"
                  onClick={() => handleSetRingFormat('number')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-mono font-bold ${
                    ringFormat === 'number' ? 'bg-[#ebc238] text-[#25190b]' : 'text-[#83715d] hover:text-[#d1c4b7]'
                  }`}
                  title="Show 01-26 Numbers"
                >
                  01–26
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRingFormat('letter')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-mono font-bold ${
                    ringFormat === 'letter' ? 'bg-[#ebc238] text-[#25190b]' : 'text-[#83715d] hover:text-[#d1c4b7]'
                  }`}
                  title="Show A-Z Letters"
                >
                  A–Z
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowChamber(!showChamber)}
                className="text-[11px] font-ui-header text-[#d1c4b7] hover:text-[#ebc238] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {showChamber ? 'expand_less' : 'expand_more'}
                </span>
                {showChamber ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {showChamber ? (
            <div className="space-y-3 max-w-xl mx-auto pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#18130a] px-3 py-1.5 rounded-lg border border-[#3d3526] shadow-inner">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRotorModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Rotor Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_overscan</span>
                    <span>ROTOR SETTINGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlugModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Plugboard Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                    <span>PLUG SETTINGS</span>
                    <span className="bg-[#ebc238]/20 text-[#ebc238] px-1.5 py-0.2 rounded text-[10px] font-mono">
                      {Object.keys(config.plugboard || {}).length / 2} pairs
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodebookModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Codebook Key Sheets Quick Window"
                  >
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    <span>CODEBOOK</span>
                  </button>
                </div>
                <div className="text-[10px] font-monospaced-technical text-[#8c7e6a]">
                  Reflector: <span className="text-[#ebc238] font-bold">{config.reflector.type}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-[#120e04]/80 p-2.5 rounded-xl border border-[#3b3426]">
               <div className={`grid grid-cols-2 ${
                  config.reflector.type === 'UKW-Dual-Dynamic'
                    ? (config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma' ? 'sm:grid-cols-5 max-w-xs sm:max-w-xl' : 'sm:grid-cols-4 max-w-xs sm:max-w-md')
                    : (config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma' ? 'sm:grid-cols-4 max-w-xs sm:max-w-md' : 'sm:grid-cols-3 max-w-xs sm:max-w-sm')
                } gap-2 w-full mx-auto`}>
                  {/* ─── UKW-Dual-Dynamic─── */}
                  {config.reflector.type === 'UKW-Dual-Dynamic' && (
                    <div className="bg-[#18130b] rounded-lg p-2 border border-[#3b3426] flex flex-col items-center max-w-[105px] w-full mx-auto shadow-sm animate-fade-in">
                      <span className="text-[9px] text-[#ebc238] font-bold font-monospaced-technical mb-0.5 tracking-wider">
                        UKW-ROTOR
                      </span>
                      <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-12 h-13 flex items-center justify-center my-0.5 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleManualRotorStep('reflector' as any, 1)}
                          className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                          title="Rotate Reflector Up (manual)"
                        >
                          <span className="material-symbols-outlined text-[13px]">expand_less</span>
                        </button>
                        <span key={config.reflector.current} className="text-rotor-label font-rotor-label text-[#ebc238] text-xl font-bold select-none animate-rotor-step">
                          {formatRotorPos(config.reflector.current, ringFormat)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleManualRotorStep('reflector' as any, -1)}
                          className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                          title="Rotate Reflector Down (manual)"
                        >
                          <span className="material-symbols-outlined text-[13px]">expand_more</span>
                        </button>
                      </div>
                      <span className="text-[8px] text-[#83715d] font-monospaced-technical mt-0.5">
                        Dynamic Stator
                      </span>
                    </div>
                  )}
                  {/* ────────────────────────────────────────────────────── */}

                  {/* Fixed Rotor (M4 Naval only — Beta/Gamma, visible only in M4 mode) — Far Left */}
                  {(config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma') && (
                    <div className="bg-[#18130b] rounded-lg p-2 border border-[#3b3426] flex flex-col items-center max-w-[105px] w-full mx-auto shadow-sm">
                      <span className="text-[9px] text-[#d1c4b7] font-monospaced-technical mb-0.5">
                        FIXED ({config.fourthRotor.type === 'Beta' ? 'β' : 'γ'})
                      </span>
                      <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-12 h-13 flex items-center justify-center my-0.5 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleManualRotorStep('fourthRotor', 1)}
                          className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                          title="Rotate Up (manual only)"
                        >
                          <span className="material-symbols-outlined text-[13px]">expand_less</span>
                        </button>
                        <span key={config.fourthRotor.current} className="text-rotor-label font-rotor-label text-[#ebc238] text-xl font-bold select-none animate-rotor-step">
                          {formatRotorPos(config.fourthRotor.current, ringFormat)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleManualRotorStep('fourthRotor', -1)}
                          className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                          title="Rotate Down (manual only)"
                        >
                          <span className="material-symbols-outlined text-[13px]">expand_more</span>
                        </button>
                      </div>
                      <span className="text-[8px] text-[#83715d] font-monospaced-technical mt-0.5" title={ROTOR_SPECS[config.fourthRotor.type]?.turnoverAction}>
                        Fixed Stator
                      </span>
                    </div>
                  )}

                  {/* Slow Rotor */}
                  <div className="bg-[#18130b] rounded-lg p-2 border border-[#3b3426] flex flex-col items-center max-w-[105px] w-full mx-auto shadow-sm">
                    <span className="text-[9px] text-[#d1c4b7] font-monospaced-technical mb-0.5">
                      SLOW ({config.leftRotor.type})
                    </span>
                    <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-12 h-13 flex items-center justify-center my-0.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('leftRotor', 1)}
                        className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                        title="Rotate Up"
                      >
                        <span className="material-symbols-outlined text-[13px]">expand_less</span>
                      </button>
                      <span key={config.leftRotor.current} className="text-rotor-label font-rotor-label text-[#ebc238] text-xl font-bold select-none animate-rotor-step">
                        {formatRotorPos(config.leftRotor.current, ringFormat)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('leftRotor', -1)}
                        className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                        title="Rotate Down"
                      >
                        <span className="material-symbols-outlined text-[13px]">expand_more</span>
                      </button>
                    </div>
                    <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={ROTOR_SPECS[config.leftRotor.type]?.turnoverAction}>
                      Notch: {ROTOR_SPECS[config.leftRotor.type]?.notch}
                    </span>
                  </div>

                  {/* Middle Rotor */}
                  <div className="bg-[#18130b] rounded-lg p-2 border border-[#3b3426] flex flex-col items-center max-w-[105px] w-full mx-auto shadow-sm">
                    <span className="text-[9px] text-[#d1c4b7] font-monospaced-technical mb-0.5">
                      MID ({config.middleRotor.type})
                    </span>
                    <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-12 h-13 flex items-center justify-center my-0.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('middleRotor', 1)}
                        className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                        title="Rotate Up"
                      >
                        <span className="material-symbols-outlined text-[13px]">expand_less</span>
                      </button>
                      <span key={config.middleRotor.current} className="text-rotor-label font-rotor-label text-[#ebc238] text-xl font-bold select-none animate-rotor-step">
                        {formatRotorPos(config.middleRotor.current, ringFormat)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('middleRotor', -1)}
                        className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                        title="Rotate Down"
                      >
                        <span className="material-symbols-outlined text-[13px]">expand_more</span>
                      </button>
                    </div>
                    <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={ROTOR_SPECS[config.middleRotor.type]?.turnoverAction}>
                      Notch: {ROTOR_SPECS[config.middleRotor.type]?.notch}
                    </span>
                  </div>

                  {/* Fast Rotor */}
                  <div className="bg-[#18130b] rounded-lg p-2 border border-[#3b3426] flex flex-col items-center max-w-[105px] w-full mx-auto shadow-sm">
                    <span className="text-[9px] text-[#d1c4b7] font-monospaced-technical mb-0.5">
                      FAST ({config.rightRotor.type})
                    </span>
                    <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-12 h-13 flex items-center justify-center my-0.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('rightRotor', 1)}
                        className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                        title="Rotate Up"
                      >
                        <span className="material-symbols-outlined text-[13px]">expand_less</span>
                      </button>
                      <span key={config.rightRotor.current} className="text-rotor-label font-rotor-label text-[#ebc238] text-xl font-bold select-none animate-rotor-step">
                        {formatRotorPos(config.rightRotor.current, ringFormat)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleManualRotorStep('rightRotor', -1)}
                        className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                        title="Rotate Down"
                      >
                        <span className="material-symbols-outlined text-[13px]">expand_more</span>
                      </button>
                    </div>
                    <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={ROTOR_SPECS[config.rightRotor.type]?.turnoverAction}>
                      Notch: {ROTOR_SPECS[config.rightRotor.type]?.notch}
                    </span>
                  </div>
                </div>

                {/* Battery Switch */}
                <div className={`flex justify-center items-center w-full ${compactMode ? 'max-w-[145px] mx-auto' : 'max-w-[160px] mx-auto'}`}>
                  <BatterySwitch mode={batteryMode} onChangeMode={handleSetBatteryMode} compact={false} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#120e04] border border-[#3b3426] rounded p-3 text-center text-xs text-[#d1c4b7] font-monospaced-technical flex items-center justify-between">
              <span>
                Chamber Hidden • Positions: Fast ({formatRotorPos(config.leftRotor.current, ringFormat)}), Mid ({formatRotorPos(config.middleRotor.current, ringFormat)}), Slow ({formatRotorPos(config.rightRotor.current, ringFormat)}){config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma' ? `, Fixed (${formatRotorPos(config.fourthRotor.current, ringFormat)})` : ''}
              </span>
              <button
                type="button"
                onClick={() => setShowChamber(true)}
                className="text-[#ebc238] hover:underline font-ui-header ml-2"
              >
                Show
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plugboard Settings Section (Steckerbrett) */}
      {/* {!keyboardBulbsOnly && (
        <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 shadow-panel texture-metal transition-all">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#3b3426]">
            <h2 className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#ebc238]">settings_ethernet</span>
              Plugboard Settings (Steckerbrett)
            </h2>
            <button
              type="button"
              onClick={() => setShowPlugboard(!showPlugboard)}
              className="text-[11px] font-ui-header text-[#d1c4b7] hover:text-[#ebc238] flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {showPlugboard ? 'expand_less' : 'expand_more'}
              </span>
              {showPlugboard ? 'Hide Plugboard' : 'Show Plugboard'}
            </button>
          </div>

          {showPlugboard ? (
            <PlugboardPanel
              config={config}
              onUpdateConfig={onUpdateConfig}
              soundEnabled={soundEnabled}
              showTitle={false}
            />
          ) : (
            <div className="bg-[#120e04] border border-[#3b3426] rounded p-3 text-center text-xs text-[#d1c4b7] font-monospaced-technical flex items-center justify-between">
              <span>
                Plugboard Hidden • Active Connections: {plugboardPairsCount} / 10 pairs
              </span>
              <button
                type="button"
                onClick={() => setShowPlugboard(true)}
                className="text-[#ebc238] hover:underline font-ui-header ml-2"
              >
                Show
              </button>
            </div>
          )}
        </div>
      )} */}

      {/* Middle Section: Lampboard (Glühlampenfeld) */}
      <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-metal flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 pb-2 border-b border-[#3b3426]">
          <span className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#ebc238]">lightbulb</span>
            Lampboard (Glühlampenfeld)
          </span>
          {batteryMode !== 'aus' && litLamp && (
            <span className={`animate-pulse text-xs font-monospaced-technical px-2 py-0.5 rounded border font-bold ${
              batteryMode === 'dkl'
                ? 'text-[#d48800] bg-[#d48800]/20 border-[#d48800]/40'
                : batteryMode === 'sammler'
                ? 'text-[#ffea70] bg-[#ffea70]/25 border-[#ffea70]/70 shadow-[0_0_10px_rgba(255,234,112,0.5)]'
                : 'text-[#ebc238] bg-[#ebc238]/20 border-[#ebc238]/40'
            }`}>
              {batteryMode === 'dkl' && 'LAMP LIT (2.5V DIM): '}
              {batteryMode === 'sammler' && 'LAMP LIT (4V SAMMLER): '}
              {batteryMode === 'hell' && 'LAMP LIT (3.5V): '}
              {litLamp}
            </span>
          )}
        </div>

        <div className="space-y-3 md:space-y-4 max-w-2xl w-full">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-2 md:gap-4">
              {row.map((char) => {
                const isPowerOn = batteryMode !== 'aus';
                const isLit = isPowerOn && litLamp === char;
                const isDimIdle = isPowerOn && !litLamp && dimIdleLights;

                let litStyle = 'bg-[#120e04] border-[#3b3426] text-[#83715d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]';

                if (isLit) {
                  if (batteryMode === 'dkl') {
                    litStyle = 'bg-[#cba832] border-[#f1e09d] text-[#25190b] shadow-[0_0_12px_#d48800] font-bold scale-102 opacity-80';
                  } else if (batteryMode === 'sammler') {
                    litStyle = 'bg-[#ffea70] border-[#ffffff] text-[#1a0f00] shadow-[0_0_25px_#ffff80,0_0_50px_#ffc83b] font-bold scale-110';
                  } else {
                    litStyle = 'bg-[#ebc238] border-[#fff5d6] text-[#25190b] shadow-lamp-glow font-bold scale-105';
                  }
                } else if (isDimIdle) {
                  if (batteryMode === 'dkl') {
                    litStyle = 'lamp-dim-glow-dkl border-[#ebc238]/30';
                  } else if (batteryMode === 'sammler') {
                    litStyle = 'lamp-dim-glow-sammler border-[#ffea70]/70';
                  } else {
                    litStyle = 'lamp-dim-glow border-[#ebc238]/50';
                  }
                }

                return (
                  <div
                    key={char}
                    className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${litStyle}`}
                  >
                    <span className="font-lamp-char text-base sm:text-lg md:text-xl">
                      {char}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Physical Bakelite Keyboard (Tastatur) */}
      <div className="bg-[#181307] border border-[#4e453b] rounded-lg p-4 md:p-6 shadow-panel texture-wood flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 pb-2 border-b border-[#3b3426]">
          <span className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#8b6f47]">keyboard</span>
            Bakelite Keyboard (Tastatur)
          </span>
          <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical">
            CLICK OR PRESS ANY KEY
          </span>
        </div>

        <div className="space-y-3 md:space-y-4 max-w-2xl w-full">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-2 md:gap-4">
              {row.map((char) => {
                const isPressed = pressedKey === char;
                return (
                  <button
                    key={char}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                    onMouseUp={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                    onMouseLeave={() => handleKeyPressEnd(char)}
                    onTouchStart={(e) => { e.preventDefault(); handleKeyPressStart(char); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleKeyPressEnd(char); }}
                    className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 text-[#ede1cd] flex items-center justify-center transition-all cursor-pointer select-none ${
                      isPressed
                        ? 'translate-y-1 bg-[#ebc238] text-[#25190b] border-white font-bold ring-4 ring-[#ebc238]/40 scale-105 shadow-[0_0_15px_#ebc238]'
                        : 'border-[#83715d] bg-[#3b3426] shadow-key-base hover:border-[#e3c193] hover:bg-[#4e453b]'
                    }`}
                  >
                    <span className="font-rotor-label font-bold text-base sm:text-lg">
                      {char}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Paper Tape Strip Display */}
      {!keyboardBulbsOnly && (
        <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 shadow-panel texture-metal space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#3b3426] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#ebc238]">receipt_long</span>
              <h3 className="text-ui-header font-ui-header text-[#ede1cd] text-xs uppercase">
                Encrypted Paper Tape Output
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-monospaced-technical text-[#d1c4b7]">Grouping:</span>
              {[5, 4, 0].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setActiveGroupSize(size)}
                  className={`text-[10px] font-monospaced-technical px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    activeGroupSize === size
                      ? 'bg-[#ebc238] text-[#25190b] border-[#ebc238] font-bold'
                      : 'bg-[#120e04] text-[#d1c4b7] border-[#3b3426] hover:bg-[#3b3426]'
                  }`}
                >
                  {size === 0 ? 'None' : `${size}s`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setInputTape('');
                  setCipherTape('');
                }}
                className="text-[10px] font-monospaced-technical text-[#ffdad6] bg-[#93000a]/40 hover:bg-[#93000a] px-2 py-0.5 rounded border border-red-800/40 transition-colors ml-2 cursor-pointer"
              >
                Clear Tape
              </button>
            </div>
          </div>

          {/* Input Text Tape */}
          <div>
            <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] uppercase block mb-1">
              Plaintext Input:
            </span>
            <div className="bg-[#f6dfc7] text-[#25190b] font-monospaced-technical p-3 rounded shadow-inner min-h-[42px] tracking-widest break-all font-bold select-all">
              {formatTapeText(inputTape) || <span className="opacity-40 italic">Type characters above...</span>}
            </div>
          </div>

          {/* Ciphertext Output Tape */}
          <div>
            <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase block mb-1">
              Ciphertext Output:
            </span>
            <div className="bg-[#f6dfc7] text-[#25190b] font-monospaced-technical p-3 rounded shadow-inner min-h-[42px] tracking-widest break-all font-bold border-2 border-[#ebc238] select-all flex justify-between items-center">
              <span>{formatTapeText(cipherTape) || <span className="opacity-40 italic">Ciphertext will appear here...</span>}</span>
              {cipherTape && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(formatTapeText(cipherTape))}
                  className="text-[10px] bg-[#25190b] text-[#f6dfc7] hover:bg-[#3c2e1e] px-2 py-1 rounded shadow flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  title="Copy Ciphertext"
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                  Copy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Signal Path Animation Section */}
      {!keyboardBulbsOnly && showSignalAnimation && (
        <SignalPathAnimation
          config={config}
          activeKey={activeSignalKey}
          isKeyPressed={!!pressedKey}
          soundEnabled={soundEnabled}
          lastTraceResult={lastTraceResult}
        />
      )}
        </>
      )}

      {/* Pop-up Modals for Rotors & Plugboard Settings */}
      <RotorQuickModal
        isOpen={showRotorModal}
        onClose={() => setShowRotorModal(false)}
        config={config}
        onUpdateConfig={onUpdateConfig}
        soundEnabled={soundEnabled}
        ringFormat={ringFormat}
      />

      <PlugboardQuickModal
        isOpen={showPlugModal}
        onClose={() => setShowPlugModal(false)}
        config={config}
        onUpdateConfig={onUpdateConfig}
        soundEnabled={soundEnabled}
      />

      <CodebookQuickModal
        isOpen={showCodebookModal}
        onClose={() => setShowCodebookModal(false)}
        onUpdateConfig={onUpdateConfig}
        soundEnabled={soundEnabled}
        ringFormat={ringFormat}
      />
    </div>
  );
};
