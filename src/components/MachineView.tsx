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
import { BatterySwitch, BatterySwitchMode } from './BatterySwitch';
import { RotorQuickModal } from './RotorQuickModal';
import { PlugboardQuickModal } from './PlugboardQuickModal';
import { CodebookQuickModal } from './CodebookQuickModal';



interface MachineViewProps {
  config: EnigmaConfig;
  onUpdateConfig: (newConfig: EnigmaConfig) => void;
  onAddLog: (entry: LogEntry) => void;
  soundEnabled: boolean;
  compactMode?: boolean;
  onToggleCompactMode?: () => void;
  inputTape: string;
  setInputTape: React.Dispatch<React.SetStateAction<string>>;
  cipherTape: string;
  setCipherTape: React.Dispatch<React.SetStateAction<string>>;
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
  soundEnabled,
  compactMode,
  onToggleCompactMode,
  inputTape,
  setInputTape,
  cipherTape,
  setCipherTape
}) => {
  const [litLamp, setLitLamp] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
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

  // Message Header / Funktelegramm States
  const [senderCallSign, setSenderCallSign] = useState<string>('DFS');
  const [transmissionTime, setTransmissionTime] = useState<string>(() => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}${mins}`;
  });
  const [kenngruppe, setKenngruppe] = useState<string>('');
  const [localGrundstellung, setLocalGrundstellung] = useState<string>('');
  const [headerCopied, setHeaderCopied] = useState<boolean>(false);
  const [fullMessageCopied, setFullMessageCopied] = useState<boolean>(false);

  const getGrundstellungString = (): string => {
    const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
    const r1 = numToChar(config.rightRotor.start);
    const r2 = numToChar(config.middleRotor.start);
    const r3 = numToChar(config.leftRotor.start);
    if (isM4) {
      const r4 = numToChar(config.fourthRotor.start);
      return `${r4}${r3}${r2}${r1}`;
    }
    return `${r3}${r2}${r1}`;
  };

  const getHeaderString = (): string => {
    const lettersCount = inputTape.replace(/[^A-Z]/ig, '').length;
    const callSign = senderCallSign || '???';
    const time = transmissionTime || '????';
    const kg = kenngruppe || '???';
    const gs = getGrundstellungString() || '???';
    return `${callSign} ${time} ${lettersCount} ${kg} ${gs}`;
  };

  const handleCopyHeader = () => {
    const headerStr = getHeaderString();
    navigator.clipboard.writeText(headerStr);
    setHeaderCopied(true);
    setTimeout(() => setHeaderCopied(false), 2000);
    playRotorClickSound(soundEnabled);
  };

  const handleCopyFullMessage = () => {
    const headerStr = getHeaderString();
    const formattedCipher = formatTapeText(cipherTape) || '';
    const fullMessage = `${headerStr}\n\n${formattedCipher}`;
    navigator.clipboard.writeText(fullMessage);
    setFullMessageCopied(true);
    setTimeout(() => setFullMessageCopied(false), 2000);
    playRotorClickSound(soundEnabled);
  };

  const getActiveCodebookKenngruppe = (): string => {
    const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
    for (const sheet of HISTORICAL_CODEBOOKS) {
      for (const entry of sheet.entries) {
        const matchLeft = entry.rotors[0] === config.leftRotor.type && entry.rings[0] === config.leftRotor.ring;
        const matchMiddle = entry.rotors[1] === config.middleRotor.type && entry.rings[1] === config.middleRotor.ring;
        const matchRight = entry.rotors[2] === config.rightRotor.type && entry.rings[2] === config.rightRotor.ring;
        let matchFourth = true;
        if (entry.fourthRotor) {
          matchFourth = entry.fourthRotor === config.fourthRotor.type && entry.fourthRing === config.fourthRotor.ring;
        } else {
          matchFourth = !isM4;
        }
        if (matchLeft && matchMiddle && matchRight && matchFourth) {
          return entry.kenngruppen && entry.kenngruppen.length > 0 ? entry.kenngruppen[0].toUpperCase() : 'UIO';
        }
      }
    }
    return 'UIO';
  };

  // Sync Kenngruppe on key loaded
  useEffect(() => {
    setKenngruppe(getActiveCodebookKenngruppe());
  }, [
    config.leftRotor.type, config.leftRotor.ring,
    config.middleRotor.type, config.middleRotor.ring,
    config.rightRotor.type, config.rightRotor.ring,
    config.fourthRotor.type, config.fourthRotor.ring
  ]);

  // Sync Grundstellung local state with machine start position
  useEffect(() => {
    setLocalGrundstellung(getGrundstellungString());
  }, [
    config.leftRotor.start,
    config.middleRotor.start,
    config.rightRotor.start,
    config.fourthRotor.start,
    config.fourthRotor.type
  ]);

  // Reset current rotor positions to their initial start positions when inputTape is empty/cleared
  useEffect(() => {
    if (inputTape === '') {
      const hasDifference =
        config.leftRotor.current !== config.leftRotor.start ||
        config.middleRotor.current !== config.middleRotor.start ||
        config.rightRotor.current !== config.rightRotor.start ||
        config.fourthRotor.current !== config.fourthRotor.start;

      if (hasDifference) {
        onUpdateConfig({
          ...config,
          leftRotor: { ...config.leftRotor, current: config.leftRotor.start },
          middleRotor: { ...config.middleRotor, current: config.middleRotor.start },
          rightRotor: { ...config.rightRotor, current: config.rightRotor.start },
          fourthRotor: { ...config.fourthRotor, current: config.fourthRotor.start }
        });
      }
    }
  }, [inputTape, config, onUpdateConfig]);

  const handleGrundstellungChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
    const maxLen = isM4 ? 4 : 3;
    const truncated = val.substring(0, maxLen);
    
    setLocalGrundstellung(truncated);
    
    if (truncated.length === maxLen) {
      const charToNum = (char: string) => {
        const code = char.charCodeAt(0) - 65;
        return isNaN(code) || code < 0 || code > 25 ? 0 : code;
      };
      
      const newConfig = { ...config };
      if (isM4) {
        const c4 = charToNum(truncated[0]);
        const c3 = charToNum(truncated[1]);
        const c2 = charToNum(truncated[2]);
        const c1 = charToNum(truncated[3]);
        newConfig.fourthRotor = { ...newConfig.fourthRotor, start: c4, current: c4 };
        newConfig.leftRotor = { ...newConfig.leftRotor, start: c3, current: c3 };
        newConfig.middleRotor = { ...newConfig.middleRotor, start: c2, current: c2 };
        newConfig.rightRotor = { ...newConfig.rightRotor, start: c1, current: c1 };
      } else {
        const c3 = charToNum(truncated[0]);
        const c2 = charToNum(truncated[1]);
        const c1 = charToNum(truncated[2]);
        newConfig.leftRotor = { ...newConfig.leftRotor, start: c3, current: c3 };
        newConfig.middleRotor = { ...newConfig.middleRotor, start: c2, current: c2 };
        newConfig.rightRotor = { ...newConfig.rightRotor, start: c1, current: c1 };
      }
      onUpdateConfig(newConfig);
      playRotorClickSound(soundEnabled);
    }
  };
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
    const nextVal = (config[rotorKey].current + delta + 26) % 26;
    const isInputEmpty = inputTape === '';
    onUpdateConfig({
      ...config,
      [rotorKey]: {
        ...config[rotorKey],
        current: nextVal,
        start: isInputEmpty ? nextVal : config[rotorKey].start
      }
    });
  };

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
      <div className="bg-[#18130b] rounded-lg p-2 border border-[#3b3426] flex flex-col items-center max-w-[105px] w-full mx-auto shadow-sm">
        <span className="text-[9px] text-[#d1c4b7] font-monospaced-technical mb-0.5">
          {label} ({typeDisplay})
        </span>
        <div className="relative bg-[#3b3426] border border-[#4e453b] rounded shadow-rotor-window w-12 h-13 flex items-center justify-center my-0.5 overflow-hidden">
          <button
            type="button"
            onClick={() => handleManualRotorStep(rotorKey, 1)}
            className="absolute top-0 w-full h-1/2 flex items-start justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
            title="Rotate Up"
          >
            <span className="material-symbols-outlined text-[13px]">expand_less</span>
          </button>
          <span key={rotor.current} className="text-rotor-label font-rotor-label text-[#ebc238] text-xl font-bold select-none animate-rotor-step">
            {formatRotorPos(rotor.current, ringFormat)}
          </span>
          <button
            type="button"
            onClick={() => handleManualRotorStep(rotorKey, -1)}
            className="absolute bottom-0 w-full h-1/2 flex items-end justify-center text-[#d1c4b7] hover:text-[#ebc238] cursor-pointer"
            title="Rotate Down"
          >
            <span className="material-symbols-outlined text-[13px]">expand_more</span>
          </button>
        </div>
        {isNotch ? (
          <span className="text-[8px] font-monospaced-technical text-[#ebc238]/80 mt-0.5" title={turnoverAction}>
            Notch: {notchValue}
          </span>
        ) : (
          <span className="text-[8px] text-[#83715d] font-monospaced-technical mt-0.5" title={turnoverAction}>
            Fixed Stator
          </span>
        )}
      </div>
    );
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

          {/* Message Header (Funktelegramm-Kopf) in Compact Mode */}
          {!keyboardBulbsOnly && (
            <div className="bg-[#1b1710]/90 p-3.5 rounded-xl border border-[#3d3526] shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#3b3426] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#ebc238]">fact_check</span>
                  <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase tracking-wider font-bold">
                    Funktelegramm Header (Message Header)
                  </span>
                </div>
                <span className="text-[9px] text-[#8c7e6a] font-mono uppercase tracking-widest">
                  M3 / M4 Procedure
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Preamble */}
                <div className="border border-[#4e453b]/60 rounded p-2 bg-[#120e04]/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                      1. Preamble (Präambel)
                    </span>
                    <span className="text-[9px] text-[#8c7e6a] font-mono">Cleartext</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5" title="Sender Call Sign">
                        Sender
                      </label>
                      <input
                        type="text"
                        value={senderCallSign}
                        onChange={(e) => setSenderCallSign(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5))}
                        placeholder="DFS"
                        className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-1 py-0.5 text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors"
                        title="Sender identification call sign (Clear text)"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5 flex justify-between items-center" title="Time of Transmission">
                        <span>Time</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            const hours = String(d.getHours()).padStart(2, '0');
                            const mins = String(d.getMinutes()).padStart(2, '0');
                            setTransmissionTime(`${hours}${mins}`);
                            playRotorClickSound(soundEnabled);
                          }}
                          className="text-[8px] text-[#ebc238] hover:underline cursor-pointer font-bold"
                          title="Set to Current Time"
                        >
                          Now
                        </button>
                      </label>
                      <input
                        type="text"
                        value={transmissionTime}
                        onChange={(e) => setTransmissionTime(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                        placeholder="1200"
                        className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-1 py-0.5 text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors"
                        title="Time of transmission (HHMM clear text)"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5" title="Total Letter Count">
                        Letters
                      </label>
                      <div className="w-full bg-[#120e04] text-[#ede1cd] border border-[#3b3426] rounded px-1 py-0.5 text-xs font-monospaced-technical font-bold text-center h-[23px] flex items-center justify-center" title="Total processed character count (letters only)">
                        {inputTape.replace(/[^A-Z]/ig, '').length}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-[#8c7e6a] mt-1.5 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1">
                    Formatted: <span className="text-[#ede1cd] font-semibold">{senderCallSign || '???'}</span> <span className="text-[#ede1cd] font-semibold">{transmissionTime || '????'}</span> <span className="text-[#ede1cd] font-semibold">{inputTape.replace(/[^A-Z]/ig, '').length}</span>
                  </div>
                </div>

                {/* 2. Kenngruppe */}
                <div className="border border-[#4e453b]/60 rounded p-2 bg-[#120e04]/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                      2. Kenngruppe (Key ID)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKenngruppe(getActiveCodebookKenngruppe());
                        playRotorClickSound(soundEnabled);
                      }}
                      className="text-[9px] text-[#ebc238] hover:underline cursor-pointer font-bold font-mono"
                      title="Load indicator group from currently active daily key"
                    >
                      Sync Key
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5">
                      Indicator Group
                    </label>
                    <input
                      type="text"
                      value={kenngruppe}
                      onChange={(e) => setKenngruppe(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4))}
                      placeholder="UIO"
                      className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-1.5 py-0.5 text-xs font-monospaced-technical font-bold tracking-widest text-center focus:outline-none focus:border-[#ebc238] transition-colors"
                      title="Code group showing which daily key sheet to use"
                    />
                  </div>
                  <div className="text-[9px] text-[#8c7e6a] mt-1.5 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1">
                    Identifies key day: <span className="text-[#ebc238] font-bold font-monospaced-technical">{kenngruppe || '—'}</span>
                  </div>
                </div>

                {/* 3. Grundstellung */}
                <div className="border border-[#4e453b]/60 rounded p-2 bg-[#120e04]/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                      3. Grundstellung
                    </span>
                    <span className="text-[9px] text-[#8c7e6a] font-mono">Position</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5">
                      Rotor Indicator
                    </label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        value={localGrundstellung}
                        onChange={handleGrundstellungChange}
                        onBlur={() => setLocalGrundstellung(getGrundstellungString())}
                        className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-1.5 py-0.5 text-xs font-monospaced-technical font-bold tracking-widest text-center focus:outline-none focus:border-[#ebc238] transition-colors uppercase"
                        maxLength={config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma' ? 4 : 3}
                        title="Type letters (e.g. HER or AHER) to instantly reposition all active rotors"
                      />
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
                            const nextConfig = { ...config };
                            nextConfig.rightRotor = { ...nextConfig.rightRotor, current: (nextConfig.rightRotor.current + 1) % 26, start: (nextConfig.rightRotor.current + 1) % 26 };
                            nextConfig.middleRotor = { ...nextConfig.middleRotor, current: (nextConfig.middleRotor.current + 1) % 26, start: (nextConfig.middleRotor.current + 1) % 26 };
                            nextConfig.leftRotor = { ...nextConfig.leftRotor, current: (nextConfig.leftRotor.current + 1) % 26, start: (nextConfig.leftRotor.current + 1) % 26 };
                            if (isM4) {
                              nextConfig.fourthRotor = { ...nextConfig.fourthRotor, current: (nextConfig.fourthRotor.current + 1) % 26, start: (nextConfig.fourthRotor.current + 1) % 26 };
                            }
                            onUpdateConfig(nextConfig);
                            playRotorClickSound(soundEnabled);
                          }}
                          className="text-[7px] font-monospaced-technical bg-[#221c11] border border-[#4e453b] text-[#ebc238] hover:bg-[#ebc238]/20 px-0.5 py-0.2 rounded cursor-pointer font-bold"
                          title="Step all rotors forward"
                        >
                          +1 ALL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
                            const nextConfig = { ...config };
                            nextConfig.rightRotor = { ...nextConfig.rightRotor, current: 0, start: 0 };
                            nextConfig.middleRotor = { ...nextConfig.middleRotor, current: 0, start: 0 };
                            nextConfig.leftRotor = { ...nextConfig.leftRotor, current: 0, start: 0 };
                            if (isM4) {
                              nextConfig.fourthRotor = { ...nextConfig.fourthRotor, current: 0, start: 0 };
                            }
                            onUpdateConfig(nextConfig);
                            playRotorClickSound(soundEnabled);
                          }}
                          className="text-[7px] font-monospaced-technical bg-[#221c11] border border-[#4e453b] text-[#ede1cd] hover:bg-[#ebc238]/20 px-0.5 py-0.2 rounded cursor-pointer"
                          title="Reset all rotors to A / AAAA"
                        >
                          RESET
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-[#8c7e6a] mt-1.5 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1">
                    Start position: <span className="text-[#ebc238] font-bold font-monospaced-technical">{localGrundstellung || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3b3426]/60 justify-end">
                <button
                  type="button"
                  onClick={handleCopyHeader}
                  className={`text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                    headerCopied
                      ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                      : 'bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]'
                  }`}
                  title="Copy the Funktelegramm header/preamble to clipboard"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {headerCopied ? 'done' : 'content_copy'}
                  </span>
                  {headerCopied ? 'Header Copied!' : 'Copy Header'}
                </button>
                
                <button
                  type="button"
                  onClick={handleCopyFullMessage}
                  disabled={!cipherTape}
                  className={`text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                    !cipherTape
                      ? 'opacity-40 cursor-not-allowed bg-[#1c1811] text-[#635848] border-[#2a241a]'
                      : fullMessageCopied
                      ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                      : 'bg-[#ebc238] text-[#17130b] border-[#ebc238] hover:bg-[#f6d258]'
                  }`}
                  title="Copy full transmission (Header + Ciphertext) to clipboard"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {fullMessageCopied ? 'done' : 'forward_to_inbox'}
                  </span>
                  {fullMessageCopied ? 'Message Copied!' : 'Copy Full Message'}
                </button>
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#18130a] px-2 sm:px-3 py-1.5 rounded-lg border border-[#3d3526] shadow-inner">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRotorModal(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Rotor Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_overscan</span>
                    <span>ROTOR SETTINGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlugModal(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Plugboard Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                    <span>PLUG SETTINGS</span>
                    <span className="bg-[#ebc238]/20 text-[#ebc238] px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono">
                      {Object.keys(config.plugboard || {}).length / 2} pairs
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodebookModal(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
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
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#18130a] px-2 sm:px-3 py-1.5 rounded-lg border border-[#3d3526] shadow-inner">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRotorModal(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Rotor Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_overscan</span>
                    <span>ROTOR SETTINGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlugModal(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
                    title="Open Quick Plugboard Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                    <span>PLUG SETTINGS</span>
                    <span className="bg-[#ebc238]/20 text-[#ebc238] px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono">
                      {Object.keys(config.plugboard || {}).length / 2} pairs
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodebookModal(true)}
                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-monospaced-technical text-[#ebc238] bg-[#2a2215] hover:bg-[#ebc238] hover:text-[#1c170d] border border-[#ebc238]/40 hover:border-[#ebc238] rounded-md font-bold transition-all shadow-sm cursor-pointer"
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
                    renderRotorView('FIXED', 'fourthRotor', config.fourthRotor.type === 'Beta' ? 'β' : 'γ', false)
                  )}

                  {/* Slow Rotor */}
                  {renderRotorView('SLOW', 'leftRotor', config.leftRotor.type, true)}

                  {/* Middle Rotor */}
                  {renderRotorView('MID', 'middleRotor', config.middleRotor.type, true)}

                  {/* Fast Rotor */}
                  {renderRotorView('FAST', 'rightRotor', config.rightRotor.type, true)}
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

          {/* Message Header (Funktelegramm-Kopf) */}
          <div className="bg-[#17130b] border border-[#3b3426] p-3.5 rounded-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#3b3426] pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#ebc238]">fact_check</span>
                <span className="text-[10px] font-monospaced-technical text-[#ebc238] uppercase tracking-wider font-bold">
                  Funktelegramm Header (Message Header)
                </span>
              </div>
              <span className="text-[9px] text-[#8c7e6a] font-mono uppercase tracking-widest">
                M3 / M4 Procedure
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Preamble */}
              <div className="border border-[#4e453b]/60 rounded p-2.5 bg-[#120e04]/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                    1. Preamble (Präambel)
                  </span>
                  <span className="text-[9px] text-[#8c7e6a] font-mono">Cleartext</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5" title="Sender Call Sign">
                      Sender
                    </label>
                    <input
                      type="text"
                      value={senderCallSign}
                      onChange={(e) => setSenderCallSign(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5))}
                      placeholder="DFS"
                      className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-1.5 py-1 text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors"
                      title="Sender identification call sign (Clear text)"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5 flex justify-between items-center" title="Time of Transmission">
                      <span>Time</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const hours = String(d.getHours()).padStart(2, '0');
                          const mins = String(d.getMinutes()).padStart(2, '0');
                          setTransmissionTime(`${hours}${mins}`);
                          playRotorClickSound(soundEnabled);
                        }}
                        className="text-[8px] text-[#ebc238] hover:underline cursor-pointer font-bold"
                        title="Set to Current Time"
                      >
                        Now
                      </button>
                    </label>
                    <input
                      type="text"
                      value={transmissionTime}
                      onChange={(e) => setTransmissionTime(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                      placeholder="1200"
                      className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-1.5 py-1 text-xs font-monospaced-technical font-bold text-center focus:outline-none focus:border-[#ebc238] transition-colors"
                      title="Time of transmission (HHMM clear text)"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5" title="Total Letter Count">
                      Letters
                    </label>
                    <div className="w-full bg-[#120e04] text-[#ede1cd] border border-[#3b3426] rounded px-1.5 py-1 text-xs font-monospaced-technical font-bold text-center h-[26px] flex items-center justify-center" title="Total processed character count (letters only)">
                      {inputTape.replace(/[^A-Z]/ig, '').length}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-[#8c7e6a] mt-2 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1.5">
                  Formatted: <span className="text-[#ede1cd] font-semibold">{senderCallSign || '???'}</span> <span className="text-[#ede1cd] font-semibold">{transmissionTime || '????'}</span> <span className="text-[#ede1cd] font-semibold">{inputTape.replace(/[^A-Z]/ig, '').length}</span>
                </div>
              </div>

              {/* 2. Kenngruppe */}
              <div className="border border-[#4e453b]/60 rounded p-2.5 bg-[#120e04]/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                    2. Kenngruppe (Key ID)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setKenngruppe(getActiveCodebookKenngruppe());
                      playRotorClickSound(soundEnabled);
                    }}
                    className="text-[9px] text-[#ebc238] hover:underline cursor-pointer font-bold font-mono"
                    title="Load indicator group from currently active daily key"
                  >
                    Sync Key
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5">
                    Indicator Group
                  </label>
                  <input
                    type="text"
                    value={kenngruppe}
                    onChange={(e) => setKenngruppe(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4))}
                    placeholder="UIO"
                    className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-2 py-1 text-xs font-monospaced-technical font-bold tracking-widest text-center focus:outline-none focus:border-[#ebc238] transition-colors"
                    title="Code group showing which daily key sheet to use"
                  />
                </div>
                <div className="text-[9px] text-[#8c7e6a] mt-2 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1.5">
                  Identifies key settings sheet day: <span className="text-[#ebc238] font-bold font-monospaced-technical">{kenngruppe || '—'}</span>
                </div>
              </div>

              {/* 3. Grundstellung */}
              <div className="border border-[#4e453b]/60 rounded p-2.5 bg-[#120e04]/50 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-monospaced-technical text-[#d1c4b7] font-bold uppercase">
                    3. Grundstellung
                  </span>
                  <span className="text-[9px] text-[#8c7e6a] font-mono">Position</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[8px] text-[#8c7e6a] uppercase font-monospaced-technical block mb-0.5">
                    Rotor Indicator
                  </label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={localGrundstellung}
                      onChange={handleGrundstellungChange}
                      onBlur={() => setLocalGrundstellung(getGrundstellungString())}
                      className="w-full bg-[#1b160e] text-[#ebc238] border border-[#4e453b] rounded px-2 py-1 text-xs font-monospaced-technical font-bold tracking-widest text-center focus:outline-none focus:border-[#ebc238] transition-colors uppercase"
                      maxLength={config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma' ? 4 : 3}
                      title="Type letters (e.g. HER or AHER) to instantly reposition all active rotors"
                    />
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
                          const nextConfig = { ...config };
                          nextConfig.rightRotor = { ...nextConfig.rightRotor, current: (nextConfig.rightRotor.current + 1) % 26, start: (nextConfig.rightRotor.current + 1) % 26 };
                          nextConfig.middleRotor = { ...nextConfig.middleRotor, current: (nextConfig.middleRotor.current + 1) % 26, start: (nextConfig.middleRotor.current + 1) % 26 };
                          nextConfig.leftRotor = { ...nextConfig.leftRotor, current: (nextConfig.leftRotor.current + 1) % 26, start: (nextConfig.leftRotor.current + 1) % 26 };
                          if (isM4) {
                            nextConfig.fourthRotor = { ...nextConfig.fourthRotor, current: (nextConfig.fourthRotor.current + 1) % 26, start: (nextConfig.fourthRotor.current + 1) % 26 };
                          }
                          onUpdateConfig(nextConfig);
                          playRotorClickSound(soundEnabled);
                        }}
                        className="text-[8px] font-monospaced-technical bg-[#221c11] border border-[#4e453b] text-[#ebc238] hover:bg-[#ebc238]/20 px-1 py-0.5 rounded cursor-pointer font-bold"
                        title="Step all rotors forward"
                      >
                        +1 ALL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isM4 = config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma';
                          const nextConfig = { ...config };
                          nextConfig.rightRotor = { ...nextConfig.rightRotor, current: 0, start: 0 };
                          nextConfig.middleRotor = { ...nextConfig.middleRotor, current: 0, start: 0 };
                          nextConfig.leftRotor = { ...nextConfig.leftRotor, current: 0, start: 0 };
                          if (isM4) {
                            nextConfig.fourthRotor = { ...nextConfig.fourthRotor, current: 0, start: 0 };
                          }
                          onUpdateConfig(nextConfig);
                          playRotorClickSound(soundEnabled);
                        }}
                        className="text-[8px] font-monospaced-technical bg-[#221c11] border border-[#4e453b] text-[#ede1cd] hover:bg-[#ebc238]/20 px-1 py-0.5 rounded cursor-pointer"
                        title="Reset all rotors to A / AAAA"
                      >
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-[#8c7e6a] mt-2 italic font-mono leading-tight border-t border-[#3b3426]/30 pt-1.5">
                  Initial starting positions: <span className="text-[#ebc238] font-bold font-monospaced-technical">{localGrundstellung || '—'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2.5 border-t border-[#3b3426]/60 justify-end">
              <button
                type="button"
                onClick={handleCopyHeader}
                className={`text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                  headerCopied
                    ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                    : 'bg-[#221c11] text-[#ede1cd] border-[#4e453b] hover:bg-[#ebc238]/10 hover:text-[#ebc238] hover:border-[#ebc238]'
                }`}
                title="Copy the Funktelegramm header/preamble to clipboard"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {headerCopied ? 'done' : 'content_copy'}
                </span>
                {headerCopied ? 'Header Copied!' : 'Copy Header'}
              </button>
              
              <button
                type="button"
                onClick={handleCopyFullMessage}
                disabled={!cipherTape}
                className={`text-[10px] font-monospaced-technical font-bold uppercase px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                  !cipherTape
                    ? 'opacity-40 cursor-not-allowed bg-[#1c1811] text-[#635848] border-[#2a241a]'
                    : fullMessageCopied
                    ? 'bg-[#1b5e20] text-[#e8f5e9] border-[#2e7d32]'
                    : 'bg-[#ebc238] text-[#17130b] border-[#ebc238] hover:bg-[#f6d258]'
                }`}
                title="Copy full transmission (Header + Ciphertext) to clipboard"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {fullMessageCopied ? 'done' : 'forward_to_inbox'}
                </span>
                {fullMessageCopied ? 'Message Copied!' : 'Copy Full Message'}
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
