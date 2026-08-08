import React, { useEffect, useState, useRef } from 'react';
import { EnigmaConfig, LogEntry, StepTrace } from '../types';
import {
  encryptChar,
  numToChar,
  formatRotorPos,
  formatRotorRing,
  generateConfigString,
  ALPHABET
} from '../lib/enigmaEngine';
import { playKeyClickSound, playRotorClickSound } from '../lib/audio';
import { SignalPathAnimation } from './SignalPathAnimation';

interface MachineViewProps {
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  onAddLog: (entry: LogEntry) => void;
  soundEnabled: boolean;
}

// Authentic Enigma M3/M4 Lampboard/Keyboard Layout (3 rows: 9, 8, 9 keys)
const ENIGMA_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
  ['P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];

export const MachineView: React.FC<MachineViewProps> = ({
  config,
  onUpdateConfig,
  onAddLog,
  soundEnabled
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
  const [showChamber, setShowChamber] = useState<boolean>(true);
  const [showSignalAnimation, setShowSignalAnimation] = useState<boolean>(false);
  const [keyboardBulbsOnly, setKeyboardBulbsOnly] = useState<boolean>(false);

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

    // Save actual trace result so visualizer matches paper tape exactly
    setLastTraceResult({
      inputChar: uppercaseChar,
      outputChar: result.outputChar,
      trace: result.trace,
      configBefore: config,
      configAfter: nextConfig
    });

    onUpdateConfig(nextConfig);

    // Illuminate target lamp
    setLitLamp(result.outputChar);

    // Update paper tape outputs
    if (!keyboardBulbsOnly) {
      setInputTape((prev) => prev + uppercaseChar);
    }
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
        setCipherTape((prev) => prev + ' ');
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
  }, [config, pressedKey, soundEnabled, keyboardBulbsOnly]);

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

          {!keyboardBulbsOnly && (
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
            <div className={`grid grid-cols-2 ${config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 max-w-2xl mx-auto pt-2`}>
              {/* Fixed Rotor (M4 Naval only — Beta/Gamma, visible only in M4 mode) — Far Left */}
              {(config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma') && (
                <div className="bg-[#120e04] rounded p-3 border border-[#3b3426] flex flex-col items-center">
                  <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical mb-1">
                    FIXED ({config.fourthRotor.type === 'Beta' ? 'β' : 'γ'})
                  </span>
                  <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-16 h-16 flex items-center justify-center my-1 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('fourthRotor', 1)}
                      className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                      title="Rotate Up (manual only)"
                    >
                      <span className="material-symbols-outlined text-[14px]">expand_less</span>
                    </button>
                    <span className="text-rotor-label font-rotor-label text-[#ebc238] text-2xl font-bold select-none">
                      {formatRotorPos(config.fourthRotor.current, ringFormat)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleManualRotorStep('fourthRotor', -1)}
                      className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                      title="Rotate Down (manual only)"
                    >
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>
                  </div>
                  <span className="text-[8px] text-[#83715d] font-monospaced-technical mt-1">Does not step</span>
                </div>
              )}

              {/* Slow Rotor */}
              <div className="bg-[#120e04] rounded p-3 border border-[#3b3426] flex flex-col items-center">
                <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical mb-1">
                  SLOW ({config.leftRotor.type})
                </span>
                <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-16 h-16 flex items-center justify-center my-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleManualRotorStep('leftRotor', 1)}
                    className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                    title="Rotate Up"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_less</span>
                  </button>
                  <span className="text-rotor-label font-rotor-label text-[#ebc238] text-2xl font-bold select-none">
                    {formatRotorPos(config.leftRotor.current, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleManualRotorStep('leftRotor', -1)}
                    className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                    title="Rotate Down"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>
                </div>
              </div>

              {/* Middle Rotor */}
              <div className="bg-[#120e04] rounded p-3 border border-[#3b3426] flex flex-col items-center">
                <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical mb-1">
                  MID ({config.middleRotor.type})
                </span>
                <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-16 h-16 flex items-center justify-center my-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleManualRotorStep('middleRotor', 1)}
                    className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                    title="Rotate Up"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_less</span>
                  </button>
                  <span className="text-rotor-label font-rotor-label text-[#ebc238] text-2xl font-bold select-none">
                    {formatRotorPos(config.middleRotor.current, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleManualRotorStep('middleRotor', -1)}
                    className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                    title="Rotate Down"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>
                </div>
              </div>

              {/* Fast Rotor */}
              <div className="bg-[#120e04] rounded p-3 border border-[#3b3426] flex flex-col items-center">
                <span className="text-[10px] text-[#d1c4b7] font-monospaced-technical mb-1">
                  FAST ({config.rightRotor.type})
                </span>
                <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-16 h-16 flex items-center justify-center my-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleManualRotorStep('rightRotor', 1)}
                    className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                    title="Rotate Up"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_less</span>
                  </button>
                  <span className="text-rotor-label font-rotor-label text-[#ebc238] text-2xl font-bold select-none">
                    {formatRotorPos(config.rightRotor.current, ringFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleManualRotorStep('rightRotor', -1)}
                    className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
                    title="Rotate Down"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>
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
          {litLamp && (
            <span className="animate-pulse text-xs font-monospaced-technical text-[#ebc238] bg-[#ebc238]/20 px-2 py-0.5 rounded border border-[#ebc238]/40">
              LAMP LIT: {litLamp}
            </span>
          )}
        </div>

        <div className="space-y-3 md:space-y-4 max-w-2xl w-full">
          {ENIGMA_KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-2 md:gap-4">
              {row.map((char) => {
                const isLit = litLamp === char;
                return (
                  <div
                    key={char}
                    className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${
                      isLit
                        ? 'bg-[#ebc238] border-[#fff5d6] text-[#25190b] shadow-lamp-glow font-bold scale-105'
                        : 'bg-[#120e04] border-[#3b3426] text-[#83715d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                    }`}
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
    </div>
  );
};
