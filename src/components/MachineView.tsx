import React, { useEffect, useState, useRef, useMemo } from 'react';
import { EnigmaConfig, LogEntry, StepTrace, RotorType, ReflectorType } from '../types';
import {
  encryptChar,
  numToChar,
  formatRotorPos,
  formatRotorRing,
  generateConfigString,
  ROTOR_SPECS,
  ALPHABET,
  charToNum
} from '../lib/enigmaEngine';
import { playKeyClickSound, playRotorClickSound } from '../lib/audio';
import { useTheme, getTheme } from '../lib/theme';
import { SignalPathAnimation } from './SignalPathAnimation';
import { PlugboardPanel } from './PlugboardPanel';
import { HISTORICAL_CODEBOOKS, CodebookSheet, CodebookEntry } from './CodebookView';
import { BatterySwitch, BatterySwitchMode } from './BatterySwitch';
import { RotorQuickModal } from './RotorQuickModal';
import { PlugboardQuickModal } from './PlugboardQuickModal';
import { CodebookQuickModal } from './CodebookQuickModal';
import { BroadcastModal } from './BroadcastModal';
import { MessageHeaderPanel } from './MessageHeaderPanel';
import { LampboardPanel } from './LampboardPanel';
import { KeyboardPanel } from './KeyboardPanel';
import { RotorChamber } from './RotorChamber';
import { RotorDial } from './RotorDial';

function useLocalStorage<T>(key: string, initial: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return initial;
      if (typeof initial === 'boolean') {
        return (saved === 'true') as unknown as T;
      }
      if (typeof initial === 'number') {
        return Number(saved) as unknown as T;
      }
      if (typeof initial === 'string') {
        return saved as unknown as T;
      }
      return JSON.parse(saved) as T;
    } catch {
      return initial;
    }
  });

  const setStored = (val: T) => {
    setValue(val);
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : String(val));
    } catch (e) {
      // ignore
    }
  };

  return [value, setStored];
}



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
  batteryLevel: number;
  batteryMode: BatterySwitchMode;
  onSetBatteryMode: (mode: BatterySwitchMode) => void;
  onConsumePower: () => void;
  batteryDrainEnabled?: boolean;
  onToggleBatteryDrain?: () => void;
  senderCallSign?: string;
  onUpdateSenderCallSign?: (newSender: string) => void;
  onBroadcastOverRadio?: (header: string, ciphertext: string) => void;
}

// Authentic Enigma M3/M4 Lampboard/Keyboard Layout (3 rows: 9, 8, 9 keys)



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
  setCipherTape,
  batteryLevel,
  batteryMode,
  onSetBatteryMode,
  onConsumePower,
  batteryDrainEnabled,
  onToggleBatteryDrain,
  senderCallSign: propSenderCallSign,
  onUpdateSenderCallSign,
  onBroadcastOverRadio
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  
  const [litLamp, setLitLamp] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [activeGroupSize, setActiveGroupSize] = useState<number>(0);

  const isM4Active = useMemo(() => 
    config.fourthRotor.type === 'Beta' || config.fourthRotor.type === 'Gamma',
    [config.fourthRotor.type]
  );
  const isUKWDual = useMemo(() => 
    config.reflector.type === 'UKW-Dual-Dynamic',
    [config.reflector.type]
  );

  const handleStepAllForward = () => {
    const isInputEmpty = inputTape === '';
    const nextConfig = { ...config };
    const nextRight = (nextConfig.rightRotor.current + 1) % 26;
    const nextMid = (nextConfig.middleRotor.current + 1) % 26;
    const nextLeft = (nextConfig.leftRotor.current + 1) % 26;
    nextConfig.rightRotor = { ...nextConfig.rightRotor, current: nextRight, start: isInputEmpty ? nextRight : nextConfig.rightRotor.start };
    nextConfig.middleRotor = { ...nextConfig.middleRotor, current: nextMid, start: isInputEmpty ? nextMid : nextConfig.middleRotor.start };
    nextConfig.leftRotor = { ...nextConfig.leftRotor, current: nextLeft, start: isInputEmpty ? nextLeft : nextConfig.leftRotor.start };
    if (isM4Active) {
      const nextFourth = (nextConfig.fourthRotor.current + 1) % 26;
      nextConfig.fourthRotor = { ...nextConfig.fourthRotor, current: nextFourth, start: isInputEmpty ? nextFourth : nextConfig.fourthRotor.start };
    }
    if (isUKWDual) {
      const nextRef = (nextConfig.reflector.current + 1) % 26;
      nextConfig.reflector = { ...nextConfig.reflector, current: nextRef, start: isInputEmpty ? nextRef : nextConfig.reflector.start };
    }
    onUpdateConfig(nextConfig);
    playRotorClickSound(soundEnabled);
  };

  const handleResetAllToA = () => {
    const isInputEmpty = inputTape === '';
    const nextConfig = { ...config };
    nextConfig.rightRotor = { ...nextConfig.rightRotor, current: 0, start: isInputEmpty ? 0 : nextConfig.rightRotor.start };
    nextConfig.middleRotor = { ...nextConfig.middleRotor, current: 0, start: isInputEmpty ? 0 : nextConfig.middleRotor.start };
    nextConfig.leftRotor = { ...nextConfig.leftRotor, current: 0, start: isInputEmpty ? 0 : nextConfig.leftRotor.start };
    if (isM4Active) {
      nextConfig.fourthRotor = { ...nextConfig.fourthRotor, current: 0, start: isInputEmpty ? 0 : nextConfig.fourthRotor.start };
    }
    if (isUKWDual) {
      nextConfig.reflector = { ...nextConfig.reflector, current: 0, start: isInputEmpty ? 0 : nextConfig.reflector.start };
    }
    onUpdateConfig(nextConfig);
    playRotorClickSound(soundEnabled);
  };

  // Ringstellung / Rotor position format: 'number' (01-26) or 'letter' (A-Z)
  const [ringFormat, setRingFormat] = useLocalStorage<'number' | 'letter'>('enigma_ring_format', 'number');

  const handleSetRingFormat = (fmt: 'number' | 'letter') => {
    setRingFormat(fmt);
  };

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('enigma_ring_format');
        if (saved === 'letter' || saved === 'number') setRingFormat(saved as 'letter' | 'number');
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setRingFormat]);

  // Visibility toggles requested by user
  const [showRotorModal, setShowRotorModal] = useState<boolean>(false);
  const [showPlugModal, setShowPlugModal] = useState<boolean>(false);
  const [showCodebookModal, setShowCodebookModal] = useState<boolean>(false);
  const [showChamber, setShowChamber] = useState<boolean>(true);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showTape, setShowTape] = useState<boolean>(true);
  const [chamberCollapsed, setChamberCollapsed] = useState<boolean>(false);
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false);
  const [tapeCollapsed, setTapeCollapsed] = useState<boolean>(false);
  const [showSignalAnimation, setShowSignalAnimation] = useState<boolean>(false);
  const [keyboardBulbsOnly, setKeyboardBulbsOnly] = useState<boolean>(false);
  const [showBatterySwitch, setShowBatterySwitch] = useLocalStorage<boolean>('enigma_show_battery_switch', true);

  // Message Header / Funktelegramm States
  const [localSenderCallSign, setLocalSenderCallSign] = useLocalStorage<string>(
    'enigma_sender_callsign',
    config.senderCallSign || 'DFS'
  );

  const senderCallSign = propSenderCallSign || config.senderCallSign || localSenderCallSign || 'DFS';

  const setSenderCallSign = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    setLocalSenderCallSign(clean);
    if (onUpdateSenderCallSign) {
      onUpdateSenderCallSign(clean);
    } else {
      onUpdateConfig({ ...config, senderCallSign: clean });
    }
  };
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

  const grundstellungString = useMemo((): string => {
    const r1 = numToChar(config.rightRotor.start);
    const r2 = numToChar(config.middleRotor.start);
    const r3 = numToChar(config.leftRotor.start);
    const u = isUKWDual ? numToChar(config.reflector?.start || 0) : '';
    if (isM4Active) {
      const r4 = numToChar(config.fourthRotor.start);
      return `${u}${r4}${r3}${r2}${r1}`;
    }
    return `${u}${r3}${r2}${r1}`;
  }, [
    isM4Active,
    isUKWDual,
    config.rightRotor.start,
    config.middleRotor.start,
    config.leftRotor.start,
    config.fourthRotor.start,
    config.reflector?.start
  ]);

  const getHeaderString = (): string => {
    const lettersCount = inputTape.replace(/[^A-Z]/ig, '').length;
    const callSign = senderCallSign || '???';
    const time = transmissionTime || '????';
    const kg = kenngruppe || '???';
    const gs = grundstellungString || '???';
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

  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importIncludeHeader, setImportIncludeHeader] = useState<boolean>(true);

  const handleImportMessage = (rawText: string, includeHeader: boolean) => {
    let messageBody = rawText;
    let currentConfig = { ...config };

    if (includeHeader) {
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const headerLine = lines[0];
        const tokens = headerLine.split(/\s+/);

        if (tokens.length >= 1 && /^[A-Z0-9]{2,6}$/.test(tokens[0])) {
          setSenderCallSign(tokens[0]);
        }
        
        const timeToken = tokens.find(t => /^\d{4}$/.test(t));
        if (timeToken) setTransmissionTime(timeToken);

        // Filter out sender (tokens[0]), time tokens (/^\d{4}$/), and pure digit count tokens (/^\d+$/)
        const nonMetaTokens = tokens.filter((t, i) => {
          if (i === 0) return false; // sender
          if (/^\d{4}$/.test(t)) return false; // time
          if (/^\d+$/.test(t)) return false; // count
          return true;
        });

        // Extract alpha tokens from nonMetaTokens
        const alphaTokens = nonMetaTokens.filter(t => /^[A-Z]{3,5}$/i.test(t));

        if (alphaTokens.length >= 1) {
          setKenngruppe(alphaTokens[0].toUpperCase());
        }

        if (alphaTokens.length >= 2) {
          const gsCandidate = alphaTokens[1].toUpperCase();
          setLocalGrundstellung(gsCandidate);

          let idx = 0;
          if (isUKWDual) {
            const u = charToNum(gsCandidate[idx++]);
            currentConfig.reflector = { ...currentConfig.reflector, start: u, current: u };
          }
          if (isM4Active) {
            const c4 = charToNum(gsCandidate[idx++]);
            currentConfig.fourthRotor = { ...currentConfig.fourthRotor, start: c4, current: c4 };
          }
          if (idx < gsCandidate.length) {
            const c3 = charToNum(gsCandidate[idx++]);
            if (idx < gsCandidate.length) {
              const c2 = charToNum(gsCandidate[idx++]);
              if (idx < gsCandidate.length) {
                const c1 = charToNum(gsCandidate[idx++]);
                currentConfig.leftRotor = { ...currentConfig.leftRotor, start: c3, current: c3 };
                currentConfig.middleRotor = { ...currentConfig.middleRotor, start: c2, current: c2 };
                currentConfig.rightRotor = { ...currentConfig.rightRotor, start: c1, current: c1 };
              } else {
                currentConfig.middleRotor = { ...currentConfig.middleRotor, start: c3, current: c3 };
                currentConfig.rightRotor = { ...currentConfig.rightRotor, start: c2, current: c2 };
              }
            } else {
              currentConfig.rightRotor = { ...currentConfig.rightRotor, start: c3, current: c3 };
            }
          }
        }

        if (lines.length > 1) {
          messageBody = lines.slice(1).join(' ');
        }
      }
    }

    const cleanedBody = messageBody.toUpperCase().replace(/[^A-Z ]/g, '');
    setInputTape(cleanedBody);

    let workingConfig = {
      ...currentConfig,
      leftRotor: { ...currentConfig.leftRotor, current: currentConfig.leftRotor.start },
      middleRotor: { ...currentConfig.middleRotor, current: currentConfig.middleRotor.start },
      rightRotor: { ...currentConfig.rightRotor, current: currentConfig.rightRotor.start },
      fourthRotor: { ...currentConfig.fourthRotor, current: currentConfig.fourthRotor.start },
      reflector: { ...currentConfig.reflector, current: currentConfig.reflector.start },
    };

    let newCipher = '';
    for (let i = 0; i < cleanedBody.length; i++) {
      const ch = cleanedBody[i];
      if (ch === ' ') {
        newCipher += ' ';
      } else {
        const { nextConfig, result } = encryptChar(ch, workingConfig);
        workingConfig = nextConfig;
        newCipher += result.outputChar;
      }
    }

    setCipherTape(newCipher);
    onUpdateConfig(currentConfig);
    playRotorClickSound(soundEnabled);
  };

  const activeCodebookKenngruppe = useMemo((): string => {
    let allSheets = HISTORICAL_CODEBOOKS;
    try {
      const saved = localStorage.getItem('enigma_custom_codebooks_v1');
      if (saved) {
        allSheets = [...HISTORICAL_CODEBOOKS, ...JSON.parse(saved)];
      }
    } catch (e) {}

    for (const sheet of allSheets) {
      for (const entry of sheet.entries) {
        const matchLeft = entry.rotors[0] === config.leftRotor.type && entry.rings[0] === config.leftRotor.ring;
        const matchMiddle = entry.rotors[1] === config.middleRotor.type && entry.rings[1] === config.middleRotor.ring;
        const matchRight = entry.rotors[2] === config.rightRotor.type && entry.rings[2] === config.rightRotor.ring;
        let matchFourth = true;
        if (entry.fourthRotor) {
          matchFourth = entry.fourthRotor === config.fourthRotor.type && entry.fourthRing === config.fourthRotor.ring;
        } else {
          matchFourth = !isM4Active;
        }
        if (matchLeft && matchMiddle && matchRight && matchFourth) {
          if (entry.kenngruppen && entry.kenngruppen.length > 0) {
            return entry.kenngruppen[0].toUpperCase();
          }
          return 'UIO';
        }
      }
    }
    return 'UIO';
  }, [
    isM4Active,
    config.leftRotor.type,
    config.leftRotor.ring,
    config.middleRotor.type,
    config.middleRotor.ring,
    config.rightRotor.type,
    config.rightRotor.ring,
    config.fourthRotor.type,
    config.fourthRotor.ring
  ]);

  // Sync Kenngruppe on key loaded
  useEffect(() => {
    setKenngruppe(activeCodebookKenngruppe);
  }, [activeCodebookKenngruppe]);

  // Sync Grundstellung local state with machine start position
  useEffect(() => {
    setLocalGrundstellung(grundstellungString);
  }, [grundstellungString]);

  // Reset current rotor positions to their initial start positions when inputTape is empty/cleared
  useEffect(() => {
    if (inputTape === '') {
      const hasDifference =
        config.leftRotor.current !== config.leftRotor.start ||
        config.middleRotor.current !== config.middleRotor.start ||
        config.rightRotor.current !== config.rightRotor.start ||
        config.fourthRotor.current !== config.fourthRotor.start ||
        config.reflector.current !== config.reflector.start;

      if (hasDifference) {
        onUpdateConfig({
          ...config,
          leftRotor: { ...config.leftRotor, current: config.leftRotor.start },
          middleRotor: { ...config.middleRotor, current: config.middleRotor.start },
          rightRotor: { ...config.rightRotor, current: config.rightRotor.start },
          fourthRotor: { ...config.fourthRotor, current: config.fourthRotor.start },
          reflector: { ...config.reflector, current: config.reflector.start }
        });
      }
    }
  }, [inputTape, config, onUpdateConfig]);

  const handleGrundstellungChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    
    let maxLen = 3;
    if (isM4Active && isUKWDual) maxLen = 5;
    else if (isM4Active || isUKWDual) maxLen = 4;

    const truncated = val.substring(0, maxLen);
    
    setLocalGrundstellung(truncated);
    
    if (truncated.length === maxLen) {
      const newConfig = { ...config };
      let idx = 0;
      if (isUKWDual) {
        const u = charToNum(truncated[idx++]);
        newConfig.reflector = { ...newConfig.reflector, start: u, current: u };
      }
      if (isM4Active) {
        const c4 = charToNum(truncated[idx++]);
        newConfig.fourthRotor = { ...newConfig.fourthRotor, start: c4, current: c4 };
      }
      const c3 = charToNum(truncated[idx++]);
      const c2 = charToNum(truncated[idx++]);
      const c1 = charToNum(truncated[idx++]);
      
      newConfig.leftRotor = { ...newConfig.leftRotor, start: c3, current: c3 };
      newConfig.middleRotor = { ...newConfig.middleRotor, start: c2, current: c2 };
      newConfig.rightRotor = { ...newConfig.rightRotor, start: c1, current: c1 };
      
      onUpdateConfig(newConfig);
      playRotorClickSound(soundEnabled);
    }
  };
  const [isCompactMode, setIsCompactMode] = useLocalStorage<boolean>('enigma_compact_mode', false);

  useEffect(() => {
    if (compactMode !== undefined && compactMode !== isCompactMode) {
      setIsCompactMode(compactMode);
    }
  }, [compactMode, isCompactMode, setIsCompactMode]);

  const handleToggleCompactMode = () => {
    const next = !isCompactMode;
    setIsCompactMode(next);
    if (onToggleCompactMode) {
      onToggleCompactMode();
    }
  };

  // Dim light effect for idle lampboard bulbs
  const [dimIdleLights, setDimIdleLights] = useLocalStorage<boolean>('enigma_dim_idle_lights', false);

  const handleToggleDimIdleLights = () => {
    setDimIdleLights(!dimIdleLights);
  };

  // Key and Lamp Touch Size ('normal' | 'large')
  const [keySize, setKeySize] = useLocalStorage<'normal' | 'large'>('enigma_key_size', 'normal');
  const handleToggleKeySize = () => {
    setKeySize(keySize === 'normal' ? 'large' : 'normal');
  };

  // Mobile virtual keyboard state and input ref
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState<boolean>(false);
  const [mobileLampDuration, setMobileLampDuration] = useLocalStorage<string>('enigma_mobile_lamp_duration', '800');
  const mobileLampTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Clean up any pending mobile lamp timeouts on unmount
  useEffect(() => {
    return () => {
      if (mobileLampTimeoutRef.current) {
        clearTimeout(mobileLampTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenMobileKeyboard = () => {
    setIsMobileKeyboardOpen(true);
    setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 50);
  };

  const handleCloseMobileKeyboard = () => {
    if (mobileLampTimeoutRef.current) {
      clearTimeout(mobileLampTimeoutRef.current);
      mobileLampTimeoutRef.current = null;
    }
    setPressedKey(null);
    setLitLamp(null);
    setIsMobileKeyboardOpen(false);
    mobileInputRef.current?.blur();
  };

  // Normalize Hungarian and international accented characters to A-Z for Enigma typing
  const normalizeToEnigmaChar = (char: string): string => {
    const map: Record<string, string> = {
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O', 'Ú': 'U', 'Ü': 'U', 'Ű': 'U',
      'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ö': 'O', 'ő': 'O', 'ú': 'U', 'ü': 'U', 'ű': 'U',
      'Ä': 'A', 'ä': 'A', 'ẞ': 'S', 'ß': 'S', 'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U',
      'à': 'A', 'è': 'E', 'ì': 'I', 'ò': 'O', 'ù': 'U', 'Â': 'A', 'Ê': 'E', 'Î': 'I', 'Ô': 'O',
      'Û': 'U', 'â': 'A', 'ê': 'E', 'î': 'I', 'ô': 'O', 'û': 'U', 'Ç': 'C', 'ç': 'C', 'Ñ': 'N', 'ñ': 'N'
    };
    const upper = char.toUpperCase();
    return map[char] || map[upper] || upper;
  };

  // Handle live typing from mobile virtual keyboard input field
  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;

    // Clear any previous timeout
    if (mobileLampTimeoutRef.current) {
      clearTimeout(mobileLampTimeoutRef.current);
      mobileLampTimeoutRef.current = null;
    }

    // Get the character typed
    const rawChar = val.slice(-1);
    const normalized = normalizeToEnigmaChar(rawChar);

    if (ALPHABET.includes(normalized)) {
      handleKeyPressStart(normalized);
      
      // If latch mode, bulb stays illuminated until next keypress
      if (mobileLampDuration !== 'latch') {
        const durationMs = parseInt(mobileLampDuration, 10) || 800;
        mobileLampTimeoutRef.current = setTimeout(() => {
          handleKeyPressEnd(normalized);
          mobileLampTimeoutRef.current = null;
        }, durationMs);
      }
    } else if (rawChar === ' ') {
      setInputTape((prev) => prev + ' ');
      if (batteryMode !== 'aus' && batteryLevel > 0) {
        setCipherTape((prev) => prev + ' ');
      }
    }

    // Clear input so next keystroke triggers input event reliably on all mobile devices
    e.target.value = '';
  };

  const configHistoryRef = useRef<EnigmaConfig[]>([]);
  const lastMachineConfigRef = useRef<EnigmaConfig>(config);

  useEffect(() => {
    if (JSON.stringify(config) !== JSON.stringify(lastMachineConfigRef.current)) {
      configHistoryRef.current = [];
    }
    lastMachineConfigRef.current = config;
  }, [config]);

  const handleBackspace = () => {
    if (inputTape.length === 0) return;

    if (mobileLampTimeoutRef.current) {
      clearTimeout(mobileLampTimeoutRef.current);
      mobileLampTimeoutRef.current = null;
    }
    setPressedKey(null);
    setLitLamp(null);

    if (configHistoryRef.current.length > 0) {
      const popped = configHistoryRef.current.pop();
      if (popped) {
        lastMachineConfigRef.current = popped;
        onUpdateConfig(popped);
      }
    }

    playRotorClickSound(soundEnabled);
    setInputTape((prev) => prev.slice(0, -1));
    setCipherTape((prev) => prev.slice(0, -1));
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCloseMobileKeyboard();
    }
  };

  const handleSetBatteryMode = (mode: BatterySwitchMode) => {
    onSetBatteryMode(mode);
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

    // Save current config to history before updating
    configHistoryRef.current.push(JSON.parse(JSON.stringify(config)));
    lastMachineConfigRef.current = nextConfig;

    // Mechanical rotor stepping occurs regardless of electrical power
    onUpdateConfig(nextConfig);

    const isPowerOn = batteryMode !== 'aus' && batteryLevel > 0;

    if (isPowerOn) {
      onConsumePower();
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
      if (target === mobileInputRef.current) return;
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
        handleBackspace();
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
      if (target === mobileInputRef.current) return;
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

  const handleManualRotorStep = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor' | 'reflector', delta: number) => {
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

  const randomizeRotorGrundstellung = (rotorKey: 'leftRotor' | 'middleRotor' | 'rightRotor' | 'fourthRotor' | 'reflector') => {
    playRotorClickSound(soundEnabled);
    const randomStart = Math.floor(Math.random() * 26);
    const newConfig = { ...config };
    if (rotorKey === 'reflector') {
      newConfig.reflector = {
        ...newConfig.reflector,
        current: randomStart,
        start: randomStart
      };
    } else {
      newConfig[rotorKey] = {
        ...newConfig[rotorKey],
        current: randomStart,
        start: randomStart
      };
    }
    onUpdateConfig(newConfig);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${t.borderBase} pb-4 gap-3`}>
        <div>
          <h1 className={`${t.fontHeader} text-xl md:text-2xl ${t.textPrimary} font-bold`}>
            Machine Dashboard
          </h1>
          <p className={`${t.textSecondary} text-xs ${t.fontBody}`}>
            Enigma M3/M4 Scrambler, Plugboard, Lampboard & Bakelite Keyboard. Type directly on your keyboard or click buttons.
          </p>
        </div>
        
        {/* Quick View Toggles & Config String */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile Keyboard Trigger Button */}
          <button
            type="button"
            onClick={handleOpenMobileKeyboard}
            className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-all flex items-center gap-1.5 font-bold cursor-pointer ${t.buttonMuted} shadow-sm`}
            title="Open phone native virtual keyboard"
          >
            <span className="material-symbols-outlined text-sm">smartphone</span>
            Mobile Keyboard
          </button>

          {/* Touch Size Toggle Button */}
          <button
            type="button"
            onClick={handleToggleKeySize}
            className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              keySize === 'large'
                ? t.buttonHighlight
                : t.buttonPrimary
            }`}
            title="Toggle between normal and large key/lamp sizes"
          >
            <span className="material-symbols-outlined text-sm">
              {keySize === 'large' ? 'zoom_out' : 'zoom_in'}
            </span>
            {keySize === 'large' ? 'Keys: Large' : 'Keys: Normal'}
          </button>

          <button
            type="button"
            onClick={handleToggleCompactMode}
            className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCompactMode
                ? t.buttonHighlight
                : t.buttonPrimary
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
            className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              keyboardBulbsOnly
                ? t.buttonHighlight
                : t.buttonPrimary
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
            className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              dimIdleLights
                ? t.buttonHighlight
                : t.buttonPrimary
            }`}
            title="Apply realistic dim glow & flickering effect to idle lampboard bulbs"
          >
            <span className="material-symbols-outlined text-sm">
              {dimIdleLights ? 'flare' : 'wb_twilight'}
            </span>
            Dim Idle Bulbs {dimIdleLights ? 'ON' : 'OFF'}
          </button>

          {!keyboardBulbsOnly && (
            <>
              <button
                type="button"
                onClick={() => setShowChamber(!showChamber)}
                className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showChamber
                    ? t.activeBadge + ' font-bold shadow-sm'
                    : t.buttonPrimary
                }`}
                title="Toggle Rotors / Scrambler Chamber Visibility"
              >
                <span className="material-symbols-outlined text-sm">
                  {showChamber ? 'visibility' : 'visibility_off'}
                </span>
                Rotors
              </button>

              <button
                type="button"
                onClick={() => setShowBatterySwitch(!showBatterySwitch)}
                className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showBatterySwitch
                    ? t.activeBadge + ' font-bold shadow-sm'
                    : t.buttonPrimary
                }`}
                title="Toggle Battery Switch Visibility"
              >
                <span className="material-symbols-outlined text-sm">
                  {showBatterySwitch ? 'visibility' : 'visibility_off'}
                </span>
                Battery Switch
              </button>

              <button
                type="button"
                onClick={() => {
                  if (headerCollapsed || tapeCollapsed || !showTape) {
                    setShowTape(true);
                    setTapeCollapsed(false);
                    setHeaderCollapsed(false);
                  } else {
                    setHeaderCollapsed(true);
                  }
                }}
                className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showTape && !tapeCollapsed && !headerCollapsed
                    ? t.activeBadge + ' font-bold shadow-sm'
                    : t.buttonPrimary
                }`}
                title="Toggle Funktelegramm Message Header Visibility"
              >
                <span className="material-symbols-outlined text-sm">
                  {showTape && !tapeCollapsed && !headerCollapsed ? 'visibility' : 'visibility_off'}
                </span>
                Header
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTape(!showTape);
                }}
                className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showTape
                    ? t.activeBadge + ' font-bold shadow-sm'
                    : t.buttonPrimary
                }`}
                title="Toggle Paper Tape Visibility"
              >
                <span className="material-symbols-outlined text-sm">
                  {showTape ? 'visibility' : 'visibility_off'}
                </span>
                Tape
              </button>

              {!isCompactMode && (
                <button
                  type="button"
                  onClick={() => setShowSignalAnimation(!showSignalAnimation)}
                  className={`text-xs ${t.fontHeader} px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    showSignalAnimation
                      ? t.activeBadge + ' font-bold shadow-sm'
                      : t.buttonPrimary
                  }`}
                  title="Toggle Signal Path Visualizer"
                >
                  <span className="material-symbols-outlined text-sm">timeline</span>
                  Signal Path
                </button>
              )}
            </>
          )}

          <div className={`text-xs ${t.fontMono} px-3 py-1.5 rounded border ${t.activeBadge}`}>
            Config: {generateConfigString(config, ringFormat)}
          </div>
        </div>
      </div>

      {isCompactMode ? (
        <div className={`${t.panelBg} p-3 sm:p-5 rounded-2xl border ${t.borderBase} shadow-2xl space-y-4 max-w-2xl mx-auto ${t.appTexture}`}>
          {keyboardBulbsOnly && (
            <div className={`rounded-lg p-2.5 text-center text-xs ${t.fontMono} flex items-center justify-between shadow-panel ${t.panelInner} border ${t.borderBase} ${t.textAccent}`}>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                Keys & Bulbs Only View Active (Minimalist Compact View)
              </span>
              <button
                type="button"
                onClick={() => setKeyboardBulbsOnly(false)}
                className={`${t.textPrimary} hover:${t.textAccent} underline ${t.fontHeader} cursor-pointer ml-2`}
              >
                Show All Panels
              </button>
            </div>
          )}

          {/* Output Tape in Compact Mode */}
          {!keyboardBulbsOnly && showTape && (
            <div className={`${t.panelBg} p-3 rounded-xl border ${t.borderBase} shadow-lg flex flex-col gap-2 w-full animate-fade-in`}>
              <div className={`flex flex-wrap items-center justify-between gap-2 px-1 border-b ${t.borderBase}/50 pb-2`}>
                <span className={`text-[10px] ${t.fontMono} ${t.textMuted} tracking-wider uppercase flex items-center gap-1.5 font-bold`}>
                  <span className={`material-symbols-outlined text-xs ${t.textAccent}`}>receipt_long</span>
                  OUTPUT TAPE
                </span>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Grouping: 5s, 4s, None */}
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] ${t.fontMono} ${t.textMuted} hidden xs:inline`}>Group:</span>
                    {[5, 4, 0].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setActiveGroupSize(size)}
                        className={`text-[9px] sm:text-[10px] ${t.fontMono} px-1.5 sm:px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          activeGroupSize === size
                            ? `${t.buttonHighlight} font-bold shadow-sm`
                            : `${t.buttonPrimary}`
                        }`}
                        title={size === 0 ? 'No grouping' : `Group text into ${size}-letter blocks`}
                      >
                        {size === 0 ? 'None' : `${size}s`}
                      </button>
                    ))}
                  </div>

                  {/* Clear Tape button */}
                  <button
                    type="button"
                    onClick={() => {
                      setInputTape('');
                      setCipherTape('');
                    }}
                    className={`text-[9px] sm:text-[10px] ${t.fontMono} ${t.dangerBadge} px-2 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer font-bold`}
                    title="Clear Tape Content"
                  >
                    <span className="material-symbols-outlined text-[12px]">backspace</span>
                    <span>Clear Tape</span>
                  </button>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => cipherTape && navigator.clipboard.writeText(formatTapeText(cipherTape))}
                    disabled={!cipherTape}
                    className={`p-1 rounded border transition-colors cursor-pointer flex items-center ${
                      cipherTape
                        ? `${t.textMuted} hover:${t.textAccent} ${t.borderBase} ${t.panelInner}`
                        : 'opacity-40 text-slate-400 border-transparent cursor-not-allowed'
                    }`}
                    title="Copy Output Tape"
                    aria-label="Copy Output"
                  >
                    <span className="material-symbols-outlined text-xs sm:text-sm">content_copy</span>
                  </button>

                  {/* Close / Show Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTapeCollapsed(!tapeCollapsed);
                    }}
                    className={`text-[10px] sm:text-[11px] ${t.fontHeader} ${t.textSecondary} hover:${t.textAccent} flex items-center gap-0.5 cursor-pointer ml-0.5 border ${t.borderBase} px-1.5 py-0.5 rounded ${t.panelInner}`}
                    title={tapeCollapsed ? 'Show Output Tape' : 'Close Output Tape'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {tapeCollapsed ? 'expand_more' : 'expand_less'}
                    </span>
                    <span>{tapeCollapsed ? 'Show' : 'Close'}</span>
                  </button>
                </div>
              </div>

              {!tapeCollapsed && (
                <div className={`${t.paperTapeBg} min-h-[44px] max-h-[80px] w-full px-3 py-2 ${t.fontMono} ${t.paperTapeText} border ${t.paperTapeBorder} overflow-y-auto break-all tracking-widest text-sm sm:text-base font-bold rounded shadow-inner flex items-center justify-between`}>
                  <span>{formatTapeText(cipherTape) || <span className={`${t.textMuted} italic font-normal text-xs`}>Tape output will appear here as you type...</span>}</span>
                </div>
              )}
            </div>
          )}

          {/* Message Header (Funktelegramm-Kopf) in Compact Mode */}
          {!keyboardBulbsOnly && showTape && !tapeCollapsed && (
            <MessageHeaderPanel
              isCompact={true}
              senderCallSign={senderCallSign}
              setSenderCallSign={setSenderCallSign}
              transmissionTime={transmissionTime}
              setTransmissionTime={setTransmissionTime}
              kenngruppe={kenngruppe}
              setKenngruppe={setKenngruppe}
              localGrundstellung={localGrundstellung}
              handleGrundstellungChange={handleGrundstellungChange}
              onGrundstellungBlur={() => setLocalGrundstellung(grundstellungString)}
              onRandomKey={() => {
                setKenngruppe(activeCodebookKenngruppe);
                playRotorClickSound(soundEnabled);
              }}
              soundEnabled={soundEnabled}
              config={config}
              inputTape={inputTape}
              cipherTape={cipherTape}
              headerCollapsed={headerCollapsed}
              setHeaderCollapsed={setHeaderCollapsed}
              handleStepAllForward={handleStepAllForward}
              handleResetAllToA={handleResetAllToA}
              headerCopied={headerCopied}
              handleCopyHeader={handleCopyHeader}
              fullMessageCopied={fullMessageCopied}
              handleCopyFullMessage={handleCopyFullMessage}
              setShowImportModal={setShowImportModal}
              setShowBroadcastModal={(val) => {
                if (val && onBroadcastOverRadio) {
                  onBroadcastOverRadio(getHeaderString(), formatTapeText(cipherTape) || '');
                }
              }}
            />
          )}

          {/* Rotor Bay (Walzenlage) */}
          {!keyboardBulbsOnly && showChamber && (
            <div className={`${t.panelBg} p-3 rounded-xl border ${t.borderBase} shadow-md animate-fade-in`}>
              <div className={`flex items-center justify-between mb-2 pb-1 border-b ${t.borderBase}/60 px-1`}>
                <span className={`text-[10px] ${t.fontMono} ${t.textSecondary} tracking-widest uppercase flex items-center gap-1 font-bold`}>
                  <span className={`material-symbols-outlined text-xs ${t.textAccent}`}>tune</span>
                  SCRAMBLER CHAMBER (WALZEN)
                </span>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-[10px] ${t.fontMono}`}>
                    <button
                      type="button"
                      onClick={() => handleSetRingFormat('number')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${ringFormat === 'number' ? `${t.buttonHighlight} font-bold` : `${t.textMuted} hover:${t.textSecondary}`}`}
                    >
                      01–26
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRingFormat('letter')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${ringFormat === 'letter' ? `${t.buttonHighlight} font-bold` : `${t.textMuted} hover:${t.textSecondary}`}`}
                    >
                      A–Z
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChamber(false)}
                    className={`text-[10px] sm:text-[11px] ${t.fontMono} ${t.textSecondary} hover:${t.textAccent} flex items-center gap-1 cursor-pointer border ${t.borderBase} px-2.5 py-1 rounded-md ${t.panelInner} transition-all font-bold`}
                    title="Close Scrambler Chamber"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                    <span>CLOSE</span>
                  </button>
                </div>
              </div>

                  {/* Quick Settings Action Bar in front of Rotors */}
              <div className={`flex flex-wrap items-center justify-between gap-2 mb-3 ${t.panelInner} px-2 sm:px-3 py-1.5 rounded-lg border ${t.borderBase} shadow-inner`}>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRotorModal(true)}
                    className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs ${t.fontMono} ${t.buttonHighlight} rounded-md font-bold transition-all shadow-sm cursor-pointer`}
                    title="Open Quick Rotor Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_overscan</span>
                    <span>ROTOR SETTINGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlugModal(true)}
                    className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs ${t.fontMono} ${t.buttonHighlight} rounded-md font-bold transition-all shadow-sm cursor-pointer`}
                    title="Open Quick Plugboard Settings Pop-Up Window"
                  >
                    <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                    <span>PLUG SETTINGS</span>
                    <span className="bg-blue-500/20 text-blue-600 px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono">
                      {Object.keys(config.plugboard || {}).length / 2} pairs
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodebookModal(true)}
                    className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs ${t.fontMono} ${t.buttonHighlight} rounded-md font-bold transition-all shadow-sm cursor-pointer`}
                    title="Open Codebook Key Sheets Quick Window"
                  >
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    <span>CODEBOOK</span>
                  </button>
                </div>
                <div className={`text-[10px] ${t.fontMono} ${t.textMuted}`}>
                  Reflector: <span className={`${t.textAccent} font-bold`}>{config.reflector.type}</span>
                  {isUKWDual && (
                    <span className="text-orange-500 font-bold ml-1">
                      (Pos: {formatRotorPos(config.reflector.current, ringFormat)})
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-w-xl mx-auto pt-1">
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${t.panelInner} p-2 sm:p-2.5 rounded-xl border ${t.borderBase}`}>
                  <RotorChamber
                    config={config}
                    ringFormat={ringFormat}
                    isUKWDual={isUKWDual}
                    isM4Active={isM4Active}
                    onManualRotorStep={handleManualRotorStep}
                    onRandomizeRotor={randomizeRotorGrundstellung}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Compact Battery Switch Panel */}
          {!keyboardBulbsOnly && showBatterySwitch && (
            <div className="w-full">
              <BatterySwitch
                mode={batteryMode}
                onChangeMode={handleSetBatteryMode}
                isPanel={true}
                onClose={() => setShowBatterySwitch(false)}
                batteryDrainEnabled={batteryDrainEnabled}
                onToggleBatteryDrain={onToggleBatteryDrain}
              />
            </div>
          )}

          {/* Mobile Phone Native Keyboard Active Bar & Hidden Input */}
          <div className="w-full">
            <input
              ref={mobileInputRef}
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              onChange={handleMobileInput}
              onKeyDown={handleMobileKeyDown}
              className="opacity-0 absolute -z-10 pointer-events-none h-0 w-0"
              aria-label="Mobile Keyboard Input Buffer"
            />

            {isMobileKeyboardOpen && (
              <div className={`${t.statusHighlight} border-2 rounded-xl p-3 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2.5 my-1`}>
                <div
                  onClick={() => mobileInputRef.current?.focus()}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 w-full"
                >
                  <div className={`w-3 h-3 rounded-full ${t.bgAccentSolid} animate-ping shrink-0`} />
                  <div>
                    <div className={`text-xs sm:text-sm ${t.fontHeader} ${t.textPrimary} flex items-center gap-1.5 font-bold`}>
                      <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>smartphone</span>
                      Mobile Keyboard Active
                    </div>
                    <div className={`text-[11px] ${t.fontMono} ${t.textMuted}`}>
                      Type on your device keyboard (A–Z) • Tap here to refocus keyboard
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                  {/* Lamp hold duration switcher */}
                  <div className={`flex items-center gap-1 ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} text-[10px] ${t.fontMono} ${t.textMuted}`}>
                    <span>Light:</span>
                    {(['400', '800', '1500', 'latch'] as const).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileLampDuration(dur);
                          mobileInputRef.current?.focus();
                        }}
                        className={`px-1 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                          mobileLampDuration === dur
                            ? `${t.buttonHighlight}`
                            : `${t.textMuted} hover:${t.textSecondary}`
                        }`}
                        title={dur === 'latch' ? 'Stays lit until next keypress' : `Lit for ${dur} milliseconds`}
                      >
                        {dur === '400' ? '0.4s' : dur === '800' ? '0.8s' : dur === '1500' ? '1.5s' : 'Latch'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInputTape((prev) => prev + ' ');
                      if (batteryMode !== 'aus' && batteryLevel > 0) {
                        setCipherTape((prev) => prev + ' ');
                      }
                      mobileInputRef.current?.focus();
                    }}
                    className={`px-2 py-1 text-xs ${t.fontMono} rounded ${t.buttonPrimary} cursor-pointer`}
                  >
                    Space
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleBackspace();
                      mobileInputRef.current?.focus();
                    }}
                    className={`px-2 py-1 text-xs ${t.fontMono} rounded ${t.dangerBadge} border cursor-pointer font-bold transition-colors`}
                  >
                    Backspace (⌫)
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseMobileKeyboard}
                    className={`px-3 py-1 text-xs ${t.fontMono} rounded ${t.buttonHighlight} font-bold shadow cursor-pointer flex items-center gap-1`}
                  >
                    <span className="material-symbols-outlined text-xs">keyboard_hide</span>
                    <span>Close</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lampboard (Lampenfeld) */}
          <LampboardPanel
            isCompact={true}
            batteryMode={batteryMode}
            batteryLevel={batteryLevel}
            litLamp={litLamp}
            dimIdleLights={dimIdleLights}
            keySize={keySize}
            onToggleKeySize={handleToggleKeySize}
          />

          {/* Bakelite Keyboard (Tastatur) */}
          <KeyboardPanel
            isCompact={true}
            pressedKey={pressedKey}
            handleKeyPressStart={handleKeyPressStart}
            handleKeyPressEnd={handleKeyPressEnd}
            keySize={keySize}
            onToggleKeySize={handleToggleKeySize}
            onOpenMobileKeyboard={handleOpenMobileKeyboard}
          />
        </div>
      ) : (
        <>
        {keyboardBulbsOnly && (
          <div className={`rounded-lg p-2.5 text-center text-xs ${t.fontMono} flex items-center justify-between shadow-panel ${t.panelInner} border ${t.borderBase} ${t.textAccent}`}>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              Keys & Bulbs Only View Active (Minimalist Machine View)
            </span>
            <button
              type="button"
              onClick={() => setKeyboardBulbsOnly(false)}
              className={`${t.textPrimary} hover:${t.textAccent} underline ${t.fontHeader} cursor-pointer ml-2`}
            >
              Show All Panels
            </button>
          </div>
        )}

      {/* Top Section: Rotors Chamber & Battery Switch Panels */}
      {!keyboardBulbsOnly && (showChamber || showBatterySwitch) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {showChamber && (
            <div className={`${showBatterySwitch ? 'lg:col-span-8' : 'lg:col-span-12'} ${t.panelBg} border ${t.borderBase} rounded-lg p-4 shadow-panel ${t.appTexture} transition-all animate-fade-in`}>
              <div className={`flex justify-between items-center mb-3 pb-2 border-b ${t.borderBase}`}>
                <h2 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-widest flex items-center gap-2`}>
                  <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>tune</span>
                  SCRAMBLER CHAMBER (WALZEN)
                </h2>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 ${t.panelInner} px-2 py-0.5 rounded border ${t.borderBase} text-[10px]`}>
                    <span className={`${t.textSecondary} font-bold uppercase hidden sm:inline`}>Format:</span>
                    <button
                      type="button"
                      onClick={() => handleSetRingFormat('number')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${t.fontMono} font-bold ${
                        ringFormat === 'number' ? `${t.buttonHighlight}` : `${t.textMuted} hover:${t.textSecondary}`
                      }`}
                      title="Show 01-26 Numbers"
                    >
                      01–26
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRingFormat('letter')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${t.fontMono} font-bold ${
                        ringFormat === 'letter' ? `${t.buttonHighlight}` : `${t.textMuted} hover:${t.textSecondary}`
                      }`}
                      title="Show A-Z Letters"
                    >
                      A–Z
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChamber(false)}
                    className={`text-[10px] sm:text-[11px] ${t.fontMono} ${t.textSecondary} hover:${t.textAccent} flex items-center gap-1 cursor-pointer border ${t.borderBase} px-2.5 py-1 rounded-md ${t.panelInner} transition-all font-bold tracking-wider`}
                    title="Close Scrambler Chamber"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                    <span>CLOSE</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-w-xl mx-auto pt-1">
                <div className={`flex flex-wrap items-center justify-between gap-2 ${t.panelInner} px-2 sm:px-3 py-1.5 rounded-lg border ${t.borderBase} shadow-inner`}>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRotorModal(true)}
                      className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs ${t.fontMono} ${t.buttonHighlight} rounded-md font-bold transition-all shadow-sm cursor-pointer`}
                      title="Open Quick Rotor Settings Pop-Up Window"
                    >
                      <span className="material-symbols-outlined text-sm">settings_overscan</span>
                      <span>ROTOR SETTINGS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPlugModal(true)}
                      className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs ${t.fontMono} ${t.buttonHighlight} rounded-md font-bold transition-all shadow-sm cursor-pointer`}
                      title="Open Quick Plugboard Settings Pop-Up Window"
                    >
                      <span className="material-symbols-outlined text-sm">settings_ethernet</span>
                      <span>PLUG SETTINGS</span>
                      <span className="bg-blue-500/20 text-blue-600 px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono">
                        {Object.keys(config.plugboard || {}).length / 2} pairs
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCodebookModal(true)}
                      className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs ${t.fontMono} ${t.buttonHighlight} rounded-md font-bold transition-all shadow-sm cursor-pointer`}
                      title="Open Codebook Key Sheets Quick Window"
                    >
                      <span className="material-symbols-outlined text-sm">menu_book</span>
                      <span>CODEBOOK</span>
                    </button>
                  </div>
                  <div className={`text-[10px] ${t.fontMono} ${t.textMuted}`}>
                    Reflector: <span className={`${t.textAccent} font-bold`}>{config.reflector.type}</span>
                  </div>
                </div>

                <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${t.panelInner} p-2 sm:p-2.5 rounded-xl border ${t.borderBase}`}>
                  <RotorChamber
                    config={config}
                    ringFormat={ringFormat}
                    isUKWDual={isUKWDual}
                    isM4Active={isM4Active}
                    onManualRotorStep={handleManualRotorStep}
                    onRandomizeRotor={randomizeRotorGrundstellung}
                  />
                </div>
              </div>
            </div>
          )}

          {showBatterySwitch && (
            <div className={`${showChamber ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
              <BatterySwitch
                mode={batteryMode}
                onChangeMode={handleSetBatteryMode}
                isPanel={true}
                onClose={() => setShowBatterySwitch(false)}
                batteryDrainEnabled={batteryDrainEnabled}
                onToggleBatteryDrain={onToggleBatteryDrain}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile Phone Native Keyboard Active Bar & Hidden Input in Standard View */}
      {isMobileKeyboardOpen && (
        <div className="w-full">
          <input
            ref={mobileInputRef}
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            onChange={handleMobileInput}
            onKeyDown={handleMobileKeyDown}
            className="opacity-0 absolute -z-10 pointer-events-none h-0 w-0"
            aria-label="Mobile Keyboard Input Buffer"
          />

              <div className={`${t.lampboardPanelBg} border-2 ${t.borderAccent}/60 rounded-xl p-3 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-2.5 my-2 shadow-lg`}>
            <div
              onClick={() => mobileInputRef.current?.focus()}
              className="flex items-center gap-2.5 cursor-pointer flex-1 w-full"
            >
              <div className={`w-3 h-3 rounded-full ${t.bgAccentSolid} animate-ping shrink-0`} />
              <div>
                <div className={`text-xs sm:text-sm ${t.fontHeader} ${t.textPrimary} flex items-center gap-1.5 font-bold`}>
                  <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>smartphone</span>
                  Mobile Keyboard Active
                </div>
                <div className={`text-[11px] ${t.fontMono} ${t.textMuted}`}>
                  Type on your device keyboard (A–Z) • Tap here to refocus keyboard
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              {/* Lamp hold duration switcher */}
              <div className={`flex items-center gap-1 ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} text-[10px] ${t.fontMono} ${t.textMuted}`}>
                <span>Light:</span>
                {(['400', '800', '1500', 'latch'] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileLampDuration(dur);
                      mobileInputRef.current?.focus();
                    }}
                    className={`px-1 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                      mobileLampDuration === dur
                        ? `${t.buttonHighlight}`
                        : `${t.textMuted} hover:${t.textSecondary}`
                    }`}
                    title={dur === 'latch' ? 'Stays lit until next keypress' : `Lit for ${dur} milliseconds`}
                  >
                    {dur === '400' ? '0.4s' : dur === '800' ? '0.8s' : dur === '1500' ? '1.5s' : 'Latch'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setInputTape((prev) => prev + ' ');
                  if (batteryMode !== 'aus' && batteryLevel > 0) {
                    setCipherTape((prev) => prev + ' ');
                  }
                  mobileInputRef.current?.focus();
                }}
                className={`px-2 py-1 text-xs ${t.fontMono} rounded ${t.buttonPrimary} cursor-pointer`}
              >
                Space
              </button>
              <button
                type="button"
                onClick={() => {
                  handleBackspace();
                  mobileInputRef.current?.focus();
                }}
                className={`px-2 py-1 text-xs ${t.fontMono} rounded ${t.dangerBadge} border cursor-pointer font-bold transition-colors`}
              >
                Backspace (⌫)
              </button>
              <button
                type="button"
                onClick={handleCloseMobileKeyboard}
                className={`px-3 py-1 text-xs ${t.fontMono} rounded ${t.buttonHighlight} font-bold shadow cursor-pointer flex items-center gap-1`}
              >
                <span className="material-symbols-outlined text-xs">keyboard_hide</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Middle Section: Lampboard (Glühlampenfeld) */}
      <LampboardPanel
        isCompact={false}
        batteryMode={batteryMode}
        batteryLevel={batteryLevel}
        litLamp={litLamp}
        dimIdleLights={dimIdleLights}
        keySize={keySize}
        onToggleKeySize={handleToggleKeySize}
      />

      {/* Bottom Section: Physical Bakelite Keyboard (Tastatur) */}
      <KeyboardPanel
        isCompact={false}
        pressedKey={pressedKey}
        handleKeyPressStart={handleKeyPressStart}
        handleKeyPressEnd={handleKeyPressEnd}
        keySize={keySize}
        onToggleKeySize={handleToggleKeySize}
        onOpenMobileKeyboard={handleOpenMobileKeyboard}
      />

      {/* Paper Tape Strip Display */}
      {!keyboardBulbsOnly && showTape && (
        <div className={`${t.lampboardPanelBg} rounded-lg p-4 space-y-4 animate-fade-in`}>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b ${t.borderBase} pb-2`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>receipt_long</span>
              <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase`}>
                Encrypted Paper Tape Output
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] ${t.fontMono} ${t.textMuted}`}>Grouping:</span>
              {[5, 4, 0].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setActiveGroupSize(size)}
                  className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    activeGroupSize === size
                      ? `${t.buttonHighlight} font-bold`
                      : `${t.buttonPrimary}`
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
              className={`text-[10px] ${t.fontMono} ${t.dangerBadge} px-2 py-0.5 rounded border transition-colors ml-1 cursor-pointer font-bold`}
            >
              Clear Tape
            </button>
              <button
                type="button"
                onClick={() => {
                  setTapeCollapsed(!tapeCollapsed);
                }}
                className={`text-[11px] ${t.fontHeader} ${t.textSecondary} hover:${t.textAccent} flex items-center gap-0.5 cursor-pointer ml-1 border ${t.borderBase} px-2 py-0.5 rounded ${t.panelInner}`}
                title={tapeCollapsed ? 'Show Paper Tape Panel' : 'Close Paper Tape Panel'}
              >
                <span className="material-symbols-outlined text-sm">
                  {tapeCollapsed ? 'expand_more' : 'expand_less'}
                </span>
                <span>{tapeCollapsed ? 'Show' : 'Close'}</span>
              </button>
            </div>
          </div>

          {/* Message Header (Funktelegramm-Kopf) */}
          {showTape && !tapeCollapsed && (
            <MessageHeaderPanel
              isCompact={false}
              senderCallSign={senderCallSign}
              setSenderCallSign={setSenderCallSign}
              transmissionTime={transmissionTime}
              setTransmissionTime={setTransmissionTime}
              kenngruppe={kenngruppe}
              setKenngruppe={setKenngruppe}
              localGrundstellung={localGrundstellung}
              handleGrundstellungChange={handleGrundstellungChange}
              onGrundstellungBlur={() => setLocalGrundstellung(grundstellungString)}
              onRandomKey={() => {
                setKenngruppe(activeCodebookKenngruppe);
                playRotorClickSound(soundEnabled);
              }}
              soundEnabled={soundEnabled}
              config={config}
              inputTape={inputTape}
              cipherTape={cipherTape}
              headerCollapsed={headerCollapsed}
              setHeaderCollapsed={setHeaderCollapsed}
              handleStepAllForward={handleStepAllForward}
              handleResetAllToA={handleResetAllToA}
              headerCopied={headerCopied}
              handleCopyHeader={handleCopyHeader}
              fullMessageCopied={fullMessageCopied}
              handleCopyFullMessage={handleCopyFullMessage}
              setShowImportModal={setShowImportModal}
              setShowBroadcastModal={(val) => {
                if (val && onBroadcastOverRadio) {
                  onBroadcastOverRadio(getHeaderString(), formatTapeText(cipherTape) || '');
                }
              }}
              onApplyRotorGrundstellung={(newGrundstellung) => {
                setLocalGrundstellung(newGrundstellung);
                let idx = 0;
                let currentConfig = { ...config };
                if (isUKWDual && newGrundstellung.length > idx) {
                  const u = charToNum(newGrundstellung[idx++]);
                  currentConfig.reflector = { ...currentConfig.reflector, start: u, current: u };
                }
                if (isM4Active && newGrundstellung.length > idx) {
                  const c4 = charToNum(newGrundstellung[idx++]);
                  currentConfig.fourthRotor = { ...currentConfig.fourthRotor, start: c4, current: c4 };
                }
                if (idx < newGrundstellung.length) {
                  const c3 = charToNum(newGrundstellung[idx++]);
                  if (idx < newGrundstellung.length) {
                    const c2 = charToNum(newGrundstellung[idx++]);
                    if (idx < newGrundstellung.length) {
                      const c1 = charToNum(newGrundstellung[idx++]);
                      currentConfig.leftRotor = { ...currentConfig.leftRotor, start: c3, current: c3 };
                      currentConfig.middleRotor = { ...currentConfig.middleRotor, start: c2, current: c2 };
                      currentConfig.rightRotor = { ...currentConfig.rightRotor, start: c1, current: c1 };
                    } else {
                      currentConfig.middleRotor = { ...currentConfig.middleRotor, start: c3, current: c3 };
                      currentConfig.rightRotor = { ...currentConfig.rightRotor, start: c2, current: c2 };
                    }
                  } else {
                    currentConfig.rightRotor = { ...currentConfig.rightRotor, start: c3, current: c3 };
                  }
                }
                onUpdateConfig(currentConfig);
              }}
            />
          )}

          {!tapeCollapsed && (
            <>
              {/* Input Text Tape */}
              <div>
                <span className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase block mb-1`}>
                  Plaintext Input:
                </span>
                <div className={`${t.paperTapeBg} ${t.paperTapeText} ${t.fontMono} p-3 rounded shadow-inner min-h-[42px] tracking-widest break-all font-bold select-all border ${t.paperTapeBorder}`}>
                  {formatTapeText(inputTape) || <span className="opacity-40 italic">Type characters above...</span>}
                </div>
              </div>

              {/* Ciphertext Output Tape */}
              <div>
                <span className={`text-[10px] ${t.fontMono} ${t.textAccent} uppercase block mb-1 font-bold`}>
                  Ciphertext Output:
                </span>
                <div className={`${t.paperTapeBg} ${t.paperTapeText} ${t.fontMono} p-3 rounded shadow-inner min-h-[42px] tracking-widest break-all font-bold border-2 ${t.paperTapeBorderActive} select-all flex justify-between items-center`}>
                  <span>{formatTapeText(cipherTape) || <span className="opacity-40 italic">Ciphertext will appear here...</span>}</span>
                  {cipherTape && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(formatTapeText(cipherTape))}
                      className={`text-[10px] font-bold ${t.paperTapeCopyButton} px-2 py-1 rounded shadow flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition-all active:scale-95`}
                      title="Copy Ciphertext"
                    >
                      <span className="material-symbols-outlined text-[12px]">content_copy</span>
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
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

      {/* Import Message Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className={`${t.modalBg} border-2 ${t.borderBase} rounded-lg shadow-2xl w-full max-w-lg p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200`}>
            <div className={`flex items-center justify-between border-b ${t.borderBase} pb-3`}>
              <h3 className={`text-sm sm:text-base font-bold ${t.fontMono} ${t.textAccent} flex items-center gap-2 uppercase tracking-wide`}>
                <span className="material-symbols-outlined text-[18px]">file_upload</span>
                Import Transmission / Message
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className={`${t.textMuted} hover:${t.textPrimary} p-1 rounded transition-colors cursor-pointer`}
                title="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className={`text-[10px] ${t.textMuted} uppercase ${t.fontMono} block mb-1`}>
                  Paste Full Message or Ciphertext:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`${senderCallSign || 'DFS'} 1200 15 UIO ABCDE\nHELLOWORLD...`}
                  rows={6}
                  className={`w-full ${t.inputBg} ${t.textPrimary} border ${t.borderBase} rounded p-2 text-xs ${t.fontMono} focus:outline-none focus:border-blue-500 resize-y`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="importIncludeHeaderCheck"
                  checked={importIncludeHeader}
                  onChange={(e) => setImportIncludeHeader(e.target.checked)}
                  className={`rounded ${t.borderBase} ${t.inputBg} ${t.textAccent} focus:ring-0 cursor-pointer w-4 h-4`}
                />
                <label htmlFor="importIncludeHeaderCheck" className={`text-xs ${t.fontMono} ${t.textSecondary} cursor-pointer select-none`}>
                  Include header (Funktelegramm preamble with callsign, time, count, key ID, and Grundstellung rotor settings)
                </label>
              </div>

              <div className={`text-[10px] ${t.textMuted} italic leading-relaxed ${t.panelInner} p-2.5 rounded border ${t.borderBase}/50`}>
                When header is enabled, the first line is parsed to automatically configure sender, transmission time, key ID, and rotor starting positions (Grundstellung). Subsequent lines (or full text if no header) form the plaintext message to encrypt.
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 pt-3 border-t ${t.borderBase}`}>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className={`text-xs ${t.fontMono} px-4 py-2 rounded border ${t.borderBase} ${t.buttonPrimary} cursor-pointer uppercase font-bold`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (importText.trim()) {
                    handleImportMessage(importText, importIncludeHeader);
                    setShowImportModal(false);
                    setImportText('');
                  }
                }}
                disabled={!importText.trim()}
                className={`text-xs ${t.fontMono} px-4 py-2 rounded border font-bold uppercase transition-all cursor-pointer ${
                  !importText.trim()
                    ? `opacity-40 cursor-not-allowed ${t.panelInner} ${t.textMuted} ${t.borderBase}`
                    : `${t.buttonHighlight}`
                }`}
              >
                Import & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
