import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { MORSE_MAP as MORSE_CODE } from '../lib/morse';
import { MorseReferenceSheet } from './MorseReferenceSheet';
import { AldisLamp } from './AldisLamp';
import {
  COMMON_CW_WORDS,
  Q_CODES,
  generateRandomCallsign,
  PracticeContentType,
  OpticalFilterColor
} from '../lib/morseTrainingData';

export type TrainingMethod = 'koch' | 'lcwo';
export type PracticeMode = 'copy' | 'reverse' | 'batch';
export type OutputChannel = 'audio' | 'optical' | 'both';

export interface LevelStats {
  level: number;
  method: TrainingMethod;
  accuracy: number;
  wpm: number;
  mode: PracticeMode;
  timestamp: number;
  transmission?: string;
  userTyped?: string;
  results?: Array<{ char: string; typed: string; isCorrect: boolean }>;
}

export interface SimplifiedMorseTrainerProps {
  onSwitchToAdvanced?: () => void;
  // Shared state & callbacks from MorseTrainer if passed
  method: TrainingMethod;
  setMethod: (m: TrainingMethod) => void;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  wpm: number;
  setWpm: (w: number) => void;
  charWpm: number;
  setCharWpm: (w: number) => void;
  outputChannel: OutputChannel;
  setOutputChannel: (ch: OutputChannel) => void;
  autoAdvance: boolean;
  setAutoAdvance: React.Dispatch<React.SetStateAction<boolean>>;
  stats: LevelStats[];
  setStats: React.Dispatch<React.SetStateAction<LevelStats[]>>;
  sequenceString: string;
  playerRef: React.MutableRefObject<any>;
  isLampFlashing: boolean;
  setIsLampFlashing: (flashing: boolean) => void;
  flashSymbol: string;
  setFlashSymbol: (s: string) => void;
  flashChar: string;
  setFlashChar: (c: string) => void;
  opticalFilter: OpticalFilterColor;
  setOpticalFilter: (f: OpticalFilterColor) => void;
  opticalBrightness: number;
  setOpticalBrightness: (b: number) => void;
  opticalWpm: number;
  setOpticalWpm: (w: number) => void;
  showTransmittedChar: boolean;
  setShowTransmittedChar: (show: boolean) => void;
  frequency: number;
  setFrequency: (f: number) => void;
  noiseLevel: number;
  setNoiseLevel: (n: number) => void;
  cipherTape?: string;
  onLoadCiphertextToMachine?: (header: string, ciphertext: string) => void;
}

export const SimplifiedMorseTrainer: React.FC<SimplifiedMorseTrainerProps> = ({
  onSwitchToAdvanced,
  method,
  setMethod,
  level,
  setLevel,
  wpm,
  setWpm,
  charWpm,
  setCharWpm,
  outputChannel,
  setOutputChannel,
  autoAdvance,
  setAutoAdvance,
  stats,
  setStats,
  sequenceString,
  playerRef,
  isLampFlashing,
  setIsLampFlashing,
  flashSymbol,
  setFlashSymbol,
  flashChar,
  setFlashChar,
  opticalFilter,
  setOpticalFilter,
  opticalBrightness,
  setOpticalBrightness,
  opticalWpm,
  setOpticalWpm,
  showTransmittedChar,
  setShowTransmittedChar,
  frequency,
  setFrequency,
  noiseLevel,
  setNoiseLevel,
  cipherTape,
  onLoadCiphertextToMachine
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  // Active Training Mode: Copy-Typing (default for fast training), Reverse Keying, or Batch Groups
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(() => {
    try {
      const saved = localStorage.getItem('morse_simplified_mode');
      if (saved === 'copy' || saved === 'reverse' || saved === 'batch') return saved;
    } catch {}
    return 'copy';
  });

  useEffect(() => {
    try {
      localStorage.setItem('morse_simplified_mode', practiceMode);
    } catch {}
  }, [practiceMode]);

  // Flashlight / Aldis Optical Shutter Lamp state
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [showFlashlight, setShowFlashlight] = useState<boolean>(() => {
    return outputChannel !== 'audio';
  });

  // When outputChannel is audio, ensure flashlight is turned off and hidden
  useEffect(() => {
    if (outputChannel === 'audio') {
      setShowFlashlight(false);
      setIsLampFlashing(false);
    } else {
      setShowFlashlight(true);
    }
  }, [outputChannel, setIsLampFlashing]);

  // Content type for simplified view
  const [contentType, setContentType] = useState<PracticeContentType>('lesson');
  const [drillLength, setDrillLength] = useState<number>(10); // Number of characters or words

  // Real-time copy typing state
  const [targetSequence, setTargetSequence] = useState<string>('');
  const [copyTypingIndex, setCopyTypingIndex] = useState<number>(0);
  const [copyTypingTyped, setCopyTypingTyped] = useState<string[]>([]);
  const [copyTypingStatus, setCopyTypingStatus] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [copyTypingStartTime, setCopyTypingStartTime] = useState<number>(0);
  const [hideFutureChars, setHideFutureChars] = useState<boolean>(true);
  const [showTouchKeypad, setShowTouchKeypad] = useState<boolean>(true);
  const activeCharRef = useRef<HTMLDivElement>(null);

  // Reverse / Keying practice state
  const [reverseCount, setReverseCount] = useState<number>(10);
  const [reverseSequence, setReverseSequence] = useState<string>('');
  const [reverseIndex, setReverseIndex] = useState<number>(0);
  const [reverseCurrentCode, setReverseCurrentCode] = useState<string>('');
  const [reverseEntries, setReverseEntries] = useState<Array<{ char: string; typedCode: string; expectedCode: string; isCorrect: boolean }>>([]);
  const [reverseStatus, setReverseStatus] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [reverseStartTime, setReverseStartTime] = useState<number>(0);
  const [reverseShowMorseHint, setReverseShowMorseHint] = useState<boolean>(true);
  const [ditActive, setDitActive] = useState<boolean>(false);
  const [dahActive, setDahActive] = useState<boolean>(false);

  // Batch mode state
  const [batchPlaying, setBatchPlaying] = useState<boolean>(false);
  const [batchUserInput, setBatchUserInput] = useState<string>('');
  const batchInputRef = useRef<HTMLTextAreaElement>(null);

  // Results & Session Dialog
  const [sessionResult, setSessionResult] = useState<{
    show: boolean;
    accuracy: number;
    wpm: number;
    score: number;
    total: number;
    mode: PracticeMode;
    results: Array<{ char: string; typed: string; isCorrect: boolean }>;
  } | null>(null);

  // Quick Reference Sheet Drawer
  const [showReferenceSheet, setShowReferenceSheet] = useState<boolean>(false);
  const [previewChar, setPreviewChar] = useState<string | null>(null);

  // Auto-scroll active char into view
  useEffect(() => {
    if (copyTypingStatus === 'playing' && activeCharRef.current) {
      activeCharRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [copyTypingIndex, copyTypingStatus]);

  // Current character pool
  const currentCharsList = useMemo(() => {
    return sequenceString.slice(0, level).split('');
  }, [sequenceString, level]);

  // Adaptive Error Weighting state
  const [weakCharMap, setWeakCharMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('morse_weak_chars');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const updateWeakChars = useCallback((results: Array<{ char: string; typed: string; isCorrect: boolean }>) => {
    setWeakCharMap(prev => {
      const next = { ...prev };
      results.forEach(r => {
        if (!r.char || !/^[A-Z0-9.,?/=()\-]$/.test(r.char)) return;
        if (!r.isCorrect) {
          next[r.char] = (next[r.char] || 0) + 1;
        } else {
          if (next[r.char]) {
            next[r.char] = Math.max(0, next[r.char] - 1);
          }
        }
      });
      try { localStorage.setItem('morse_weak_chars', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Generate training sequence based on current level or content
  const generateDrillSequence = useCallback((count: number = 10) => {
    if (contentType === 'enigma' && cipherTape) {
      // Split the enigma ciphertext into words based on spaces
      return cipherTape;
    }

    if (contentType === 'historical') {
      // Need to import HISTORICAL_TEXTS or define it
      const hist = [
        "SOS SOS SOS DE TITANIC WE ARE SINKING FAST",
        "TORA TORA TORA",
        "CQ CQ CQ DE KPH KPH KPH",
        "V V V DE PARIS",
        "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"
      ];
      return hist[Math.floor(Math.random() * hist.length)];
    }

    if (contentType === 'words') {
      const words: string[] = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const randWord = COMMON_CW_WORDS[Math.floor(Math.random() * COMMON_CW_WORDS.length)];
        words.push(randWord);
      }
      return words.join(' ');
    }

    if (contentType === 'qcodes') {
      const qcodes: string[] = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const randQ = Q_CODES[Math.floor(Math.random() * Q_CODES.length)];
        qcodes.push(randQ.code);
      }
      return qcodes.join(' ');
    }

    if (contentType === 'callsigns') {
      const calls: string[] = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        calls.push(generateRandomCallsign());
      }
      return calls.join(' ');
    }

    const pool = sequenceString.slice(0, level).split('');

    if (contentType === 'weak_drill') {
      let weightedPool: string[] = [];
      pool.forEach(c => {
        weightedPool.push(c); // base weight
        const errs = weakCharMap[c] || 0;
        for (let j = 0; j < errs * 2; j++) {
          weightedPool.push(c);
        }
      });
      if (weightedPool.length === 0) weightedPool = pool;
      
      let chars = '';
      for (let i = 0; i < count; i++) {
        if (i > 0 && i % 5 === 0) chars += ' ';
        chars += weightedPool[Math.floor(Math.random() * weightedPool.length)];
      }
      return chars;
    }

    // Default Lesson Characters (split into groups of 5 with spaces)
    let chars = '';
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % 5 === 0) {
        chars += ' ';
      }
      const randChar = pool[Math.floor(Math.random() * pool.length)];
      chars += randChar;
    }
    return chars;
  }, [contentType, sequenceString, level, cipherTape, weakCharMap]);

  // Play single character audio preview
  const playCharPreview = (char: string) => {
    if (playerRef.current) {
      setPreviewChar(char);
      playerRef.current.playSequence(char, () => {
        setPreviewChar(null);
      });
    }
  };

  // Play congratulatory level up tone
  const playLevelUpChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(980, ctx.currentTime);
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.4);
      }, 120);
    } catch {}
  };

  // -------------------------------------------------------------
  // COPY-TYPING SESSION HANDLERS
  // -------------------------------------------------------------
  const completeCopySession = useCallback((finalTyped: string[]) => {
    setCopyTypingStatus('completed');
    const target = targetSequence.replace(/\s/g, '');
    const userTypedNoSpaces: string[] = [];
    const targetChars = targetSequence.split('');
    
    for (let i = 0; i < targetChars.length; i++) {
      if (targetChars[i] !== ' ') {
        userTypedNoSpaces.push(finalTyped[i] || '');
      }
    }

    let correct = 0;
    const results: Array<{ char: string; typed: string; isCorrect: boolean }> = [];
    const maxLen = Math.max(target.length, userTypedNoSpaces.length);

    for (let i = 0; i < maxLen; i++) {
      const targetChar = target[i] || '';
      const userChar = userTypedNoSpaces[i]?.toUpperCase() || '';
      const isCorrect = targetChar === userChar;
      if (i < target.length && isCorrect) correct++;
      results.push({ char: targetChar, typed: userChar, isCorrect });
    }

    const accuracy = target.length > 0 ? (correct / target.length) * 100 : 0;
    const timeElapsedMs = Date.now() - copyTypingStartTime;
    const timeElapsedMin = Math.max(0.05, timeElapsedMs / 60000);
    const scoredWpm = Math.min(Math.max(5, Math.round((correct / 5) / timeElapsedMin)), 60);

    updateWeakChars(results);

    setSessionResult({
      show: true,
      accuracy,
      wpm: scoredWpm,
      score: correct,
      total: target.length,
      mode: 'copy',
      results
    });

    const newStat: LevelStats = {
      level,
      method,
      accuracy,
      wpm: scoredWpm,
      mode: 'copy',
      timestamp: Date.now(),
      transmission: targetSequence,
      userTyped: finalTyped.join(''),
      results
    };

    const updated = [...stats, newStat];
    setStats(updated);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(updated));
    } catch {}

    if (autoAdvance && accuracy >= 90 && level < sequenceString.length) {
      setLevel((prev) => prev + 1);
      playLevelUpChime();
    }
  }, [targetSequence, copyTypingStartTime, level, method, stats, autoAdvance, sequenceString.length, setLevel, setStats]);

  const startCopySession = useCallback(() => {
    if (playerRef.current) playerRef.current.stop();
    setSessionResult(null);

    const seq = generateDrillSequence(drillLength);
    setTargetSequence(seq);
    setCopyTypingIndex(0);
    setCopyTypingTyped([]);
    setCopyTypingStatus('playing');
    setCopyTypingStartTime(Date.now());

    // Play first character after short warm-up
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.playSequence(seq[0]);
      }
    }, 400);
  }, [generateDrillSequence, drillLength, playerRef]);

  const handleCopyTypeChar = useCallback((char: string) => {
    if (copyTypingStatus !== 'playing') return;
    const targetChars = targetSequence.toUpperCase();
    const currentChar = targetChars[copyTypingIndex];
    if (!currentChar) return;

    const updatedTyped = [...copyTypingTyped];
    updatedTyped[copyTypingIndex] = char.toUpperCase();
    setCopyTypingTyped(updatedTyped);

    const nextIndex = copyTypingIndex + 1;
    setCopyTypingIndex(nextIndex);

    if (nextIndex >= targetChars.length) {
      completeCopySession(updatedTyped);
    } else {
      const nextChar = targetChars[nextIndex];
      if (nextChar === ' ') {
        const updatedWithSpace = [...updatedTyped];
        updatedWithSpace[nextIndex] = ' ';
        setCopyTypingTyped(updatedWithSpace);
        const nextNextIndex = nextIndex + 1;
        setCopyTypingIndex(nextNextIndex);
        if (nextNextIndex >= targetChars.length) {
          completeCopySession(updatedWithSpace);
        } else {
          setTimeout(() => {
            if (playerRef.current && copyTypingStatus === 'playing') {
              playerRef.current.playSequence(targetChars[nextNextIndex]);
            }
          }, 600);
        }
      } else {
        setTimeout(() => {
          if (playerRef.current && copyTypingStatus === 'playing') {
            playerRef.current.playSequence(nextChar);
          }
        }, 320);
      }
    }
  }, [copyTypingStatus, targetSequence, copyTypingTyped, copyTypingIndex, completeCopySession, playerRef]);

  const handleReplayCurrentChar = useCallback(() => {
    let charToRepeat = '';
    if (practiceMode === 'copy') {
      const chars = targetSequence.toUpperCase();
      if (chars.length > 0) {
        const idx = Math.min(copyTypingIndex, chars.length - 1);
        charToRepeat = chars[idx];
      }
    } else if (practiceMode === 'reverse') {
      if (reverseSequence.length > 0) {
        const idx = Math.min(reverseIndex, reverseSequence.length - 1);
        charToRepeat = reverseSequence[idx];
      }
    } else {
      if (flashChar) {
        charToRepeat = flashChar;
      } else if (targetSequence.length > 0) {
        charToRepeat = targetSequence[0];
      }
    }

    if (charToRepeat && charToRepeat !== ' ' && playerRef.current) {
      playerRef.current.playSequence(charToRepeat);
    }
  }, [practiceMode, targetSequence, copyTypingIndex, reverseSequence, reverseIndex, flashChar, playerRef]);

  const handleSkipCurrentChar = useCallback(() => {
    if (copyTypingStatus !== 'playing') return;
    handleCopyTypeChar('—');
  }, [copyTypingStatus, handleCopyTypeChar]);

  // -------------------------------------------------------------
  // REVERSE / KEYING SESSION HANDLERS
  // -------------------------------------------------------------
  const startReverseSession = useCallback(() => {
    if (playerRef.current) playerRef.current.stop();
    setSessionResult(null);

    const seq = generateDrillSequence(reverseCount).replace(/\s/g, '');
    setReverseSequence(seq);
    setReverseIndex(0);
    setReverseCurrentCode('');
    setReverseEntries([]);
    setReverseStatus('playing');
    setReverseStartTime(Date.now());
  }, [generateDrillSequence, reverseCount, playerRef]);

  const completeReverseSession = useCallback((finalEntries: Array<{ char: string; typedCode: string; expectedCode: string; isCorrect: boolean }>) => {
    setReverseStatus('completed');
    const correct = finalEntries.filter(e => e.isCorrect).length;
    const total = finalEntries.length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const timeElapsedMs = Date.now() - reverseStartTime;
    const timeElapsedMin = Math.max(0.05, timeElapsedMs / 60000);
    const scoredWpm = Math.min(Math.max(5, Math.round((correct / 5) / timeElapsedMin)), 45);

    const results = finalEntries.map(e => ({
      char: e.char,
      typed: e.typedCode,
      isCorrect: e.isCorrect
    }));

    updateWeakChars(results);

    setSessionResult({
      show: true,
      accuracy,
      wpm: scoredWpm,
      score: correct,
      total,
      mode: 'reverse',
      results
    });

    const newStat: LevelStats = {
      level,
      method,
      accuracy,
      wpm: scoredWpm,
      mode: 'reverse',
      timestamp: Date.now(),
      transmission: reverseSequence,
      results
    };

    const updated = [...stats, newStat];
    setStats(updated);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(updated));
    } catch {}

    if (autoAdvance && accuracy >= 90 && level < sequenceString.length) {
      setLevel((prev) => prev + 1);
      playLevelUpChime();
    }
  }, [reverseStartTime, reverseSequence, level, method, stats, autoAdvance, sequenceString.length, setLevel, setStats]);

  const submitReverseChar = useCallback((code: string) => {
    if (reverseStatus !== 'playing') return;
    const currentChar = reverseSequence[reverseIndex];
    if (!currentChar) return;
    const expectedCode = MORSE_CODE[currentChar] || '';
    const isCorrect = code === expectedCode;

    const entry = {
      char: currentChar,
      typedCode: code,
      expectedCode,
      isCorrect
    };

    const nextEntries = [...reverseEntries, entry];
    setReverseEntries(nextEntries);
    setReverseCurrentCode('');

    const nextIndex = reverseIndex + 1;
    setReverseIndex(nextIndex);

    if (nextIndex >= reverseSequence.length) {
      completeReverseSession(nextEntries);
    }
  }, [reverseStatus, reverseSequence, reverseIndex, reverseEntries, completeReverseSession]);

  const handleKeyDit = useCallback(() => {
    if (reverseStatus !== 'playing') return;
    setDitActive(true);
    setTimeout(() => setDitActive(false), 100);
    
    // Play tone
    if (playerRef.current) {
      playerRef.current.playSequence('.');
    }
    setReverseCurrentCode(prev => prev + '.');
  }, [reverseStatus, playerRef]);

  const handleKeyDah = useCallback(() => {
    if (reverseStatus !== 'playing') return;
    setDahActive(true);
    setTimeout(() => setDahActive(false), 180);

    // Play tone
    if (playerRef.current) {
      playerRef.current.playSequence('-');
    }
    setReverseCurrentCode(prev => prev + '-');
  }, [reverseStatus, playerRef]);

  // -------------------------------------------------------------
  // BATCH MODE SESSION HANDLERS
  // -------------------------------------------------------------
  const startBatchSession = useCallback(() => {
    if (batchPlaying) {
      if (playerRef.current) playerRef.current.stop();
      setBatchPlaying(false);
      return;
    }
    setSessionResult(null);
    const seq = generateDrillSequence(15);
    setTargetSequence(seq);
    setBatchUserInput('');
    setBatchPlaying(true);

    setTimeout(() => {
      batchInputRef.current?.focus();
    }, 50);

    if (playerRef.current) {
      playerRef.current.playSequence(seq, () => {
        setBatchPlaying(false);
      });
    }
  }, [batchPlaying, generateDrillSequence, playerRef]);

  const submitBatchTranscript = useCallback(() => {
    const target = targetSequence.replace(/\s/g, '');
    const user = batchUserInput.toUpperCase().replace(/\s/g, '');
    let correct = 0;
    const results: Array<{ char: string; typed: string; isCorrect: boolean }> = [];
    const maxLen = Math.max(target.length, user.length);

    for (let i = 0; i < maxLen; i++) {
      const targetChar = target[i] || '';
      const userChar = user[i] || '';
      const isCorrect = targetChar === userChar;
      if (i < target.length && isCorrect) correct++;
      results.push({ char: targetChar, typed: userChar, isCorrect });
    }

    const accuracy = target.length > 0 ? (correct / target.length) * 100 : 0;
    const scoredWpm = Math.round(wpm * (accuracy / 100));

    setSessionResult({
      show: true,
      accuracy,
      wpm: scoredWpm,
      score: correct,
      total: target.length,
      mode: 'batch',
      results
    });

    const newStat: LevelStats = {
      level,
      method,
      accuracy,
      wpm: scoredWpm,
      mode: 'batch',
      timestamp: Date.now(),
      transmission: targetSequence,
      userTyped: batchUserInput,
      results
    };

    const updated = [...stats, newStat];
    setStats(updated);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(updated));
    } catch {}

    if (autoAdvance && accuracy >= 90 && level < sequenceString.length) {
      setLevel((prev) => prev + 1);
      playLevelUpChime();
    }
  }, [targetSequence, batchUserInput, wpm, level, method, stats, autoAdvance, sequenceString.length, setLevel, setStats]);

  // -------------------------------------------------------------
  // KEYBOARD LISTENER
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Global shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'F1') {
        e.preventDefault();
        if (practiceMode === 'copy') {
          if (copyTypingStatus === 'playing') setCopyTypingStatus('idle');
          else startCopySession();
        } else if (practiceMode === 'reverse') {
          if (reverseStatus === 'playing') setReverseStatus('idle');
          else startReverseSession();
        } else {
          startBatchSession();
        }
        return;
      }

      // Copy mode shortcuts
      if (practiceMode === 'copy' && copyTypingStatus === 'playing') {
        if ((e.ctrlKey || e.metaKey || e.altKey) && (e.key === 'r' || e.key === 'R') || e.key === 'F2') {
          e.preventDefault();
          handleReplayCurrentChar();
          return;
        }

        if (e.key === 'Tab' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
          e.preventDefault();
          handleSkipCurrentChar();
          return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) return;
        const key = e.key.toUpperCase();
        if (/^[A-Z0-9.,/?=-]$/.test(key)) {
          e.preventDefault();
          handleCopyTypeChar(key);
        }
      }

      // Keying / Reverse mode shortcuts
      if (practiceMode === 'reverse' && reverseStatus === 'playing' && !isInput) {
        if (e.key === '.' || e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleKeyDit();
        } else if (e.key === '-' || e.key === 'k' || e.key === 'K' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleKeyDah();
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (reverseCurrentCode) {
            submitReverseChar(reverseCurrentCode);
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setReverseCurrentCode(prev => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    practiceMode,
    copyTypingStatus,
    reverseStatus,
    reverseCurrentCode,
    startCopySession,
    startReverseSession,
    startBatchSession,
    handleCopyTypeChar,
    handleReplayCurrentChar,
    handleSkipCurrentChar,
    handleKeyDit,
    handleKeyDah,
    submitReverseChar
  ]);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-16 relative">
      
      {/* TOP HEADER: Focus Title, Mode Pills, and Console Switch */}
      <div className={`border-b ${t.borderBase} pb-3 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${t.bgAccentFaint} ${t.textAccentStrong} border ${t.borderAccent} flex items-center justify-center shadow-xs`}>
            <span className="material-symbols-outlined text-xl">school</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-base sm:text-lg ${t.fontHeader} font-bold ${t.textPrimary}`}>
                Morse Training Focus
              </h1>
              <span className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border ${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} font-bold`}>
                Level {level} / {sequenceString.length}
              </span>
            </div>
            <p className={`text-[11px] ${t.textMuted} font-mono`}>
              Distraction-free ear & key training • {method.toUpperCase()} curriculum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reference Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowReferenceSheet(true)}
            className={`px-2.5 py-1 text-xs ${t.fontHeader} rounded border ${t.panelInner} ${t.textMuted} hover:${t.textPrimary} ${t.borderBase} transition-colors cursor-pointer flex items-center gap-1.5`}
            title="Open Morse Code Reference Sheet"
          >
            <span className="material-symbols-outlined text-xs text-amber-500">menu_book</span>
            <span className="hidden sm:inline">Reference</span>
          </button>

          {/* Switch to Full Console */}
          {onSwitchToAdvanced && (
            <button
              type="button"
              onClick={onSwitchToAdvanced}
              className={`px-3 py-1 text-xs ${t.fontHeader} font-bold rounded border ${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary} hover:${t.borderAccent} transition-all cursor-pointer flex items-center gap-1.5 shadow-xs`}
              title="Switch to full telegraph console with advanced audio DSP and Aldis lamp optics"
            >
              <span className="material-symbols-outlined text-xs">tune</span>
              <span>Advanced Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* TRAINING MODE SELECTOR (3 Clean Focus Modes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setPracticeMode('batch');
            setBatchPlaying(false);
          }}
          className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            practiceMode === 'batch'
              ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} shadow-md ring-1 ring-amber-500/30 scale-[1.02]`
              : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary} hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100`
          }`}
        >
          <div className={`p-2 rounded-full shrink-0 flex items-center justify-center ${practiceMode === 'batch' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
            <span className="material-symbols-outlined text-xl leading-none">article</span>
          </div>
          <div className="overflow-hidden">
            <div className={`text-sm ${t.fontHeader} font-bold leading-tight truncate`}>Classic Batch Copy</div>
            <div className="text-[10px] opacity-75 font-mono truncate hidden sm:block">Transcribe 5-letter blocks</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPracticeMode('copy');
            setCopyTypingStatus('idle');
          }}
          className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            practiceMode === 'copy'
              ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} shadow-md ring-1 ring-amber-500/30 scale-[1.02]`
              : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary} hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100`
          }`}
        >
          <div className={`p-2 rounded-full shrink-0 flex items-center justify-center ${practiceMode === 'copy' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
            <span className="material-symbols-outlined text-xl leading-none">hearing</span>
          </div>
          <div className="overflow-hidden">
            <div className={`text-sm ${t.fontHeader} font-bold leading-tight truncate`}>Real-Time Copy</div>
            <div className="text-[10px] opacity-75 font-mono truncate hidden sm:block">Hear & type instantly</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPracticeMode('reverse');
            setReverseStatus('idle');
          }}
          className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
            practiceMode === 'reverse'
              ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} shadow-md ring-1 ring-amber-500/30 scale-[1.02]`
              : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary} hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100`
          }`}
        >
          <div className={`p-2 rounded-full shrink-0 flex items-center justify-center ${practiceMode === 'reverse' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
            <span className="material-symbols-outlined text-xl leading-none">dialpad</span>
          </div>
          <div className="overflow-hidden">
            <div className={`text-sm ${t.fontHeader} font-bold leading-tight truncate`}>Reverse Learning</div>
            <div className="text-[10px] opacity-75 font-mono truncate hidden sm:block">Send with paddle or key</div>
          </div>
        </button>
      </div>

      {/* ACTIVE SIGNAL STATUS BAR & CHANNEL / FLASHLIGHT TOGGLE */}
      <div className={`${t.panelBg} border ${t.borderBase} rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs`}>
        {/* Signal indicator */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className={`w-4 h-4 rounded-full transition-all duration-75 ${
              isLampFlashing 
                ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b] scale-125' 
                : 'bg-zinc-700/60 border border-zinc-600'
            }`} />
            {isLampFlashing && (
              <div className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
            )}
          </div>
          <span className={`text-xs font-mono font-bold ${isLampFlashing ? t.textAccentStrong : t.textMuted}`}>
            {isLampFlashing 
              ? (flashSymbol ? `PULSE: ${flashSymbol} (${flashChar})` : 'SIGNAL TRANSMITTING...') 
              : 'CARRIER IDLE'}
          </span>
        </div>

        {/* Channel toggles and Flashlight Button */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          {/* Flashlight visual toggle */}
          <button
            type="button"
            onClick={() => {
              if (outputChannel !== 'audio' && showFlashlight) {
                setOutputChannel('audio');
                setShowFlashlight(false);
                setIsLampFlashing(false);
              } else {
                setOutputChannel('both');
                setShowFlashlight(true);
              }
            }}
            className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
              outputChannel !== 'audio' && showFlashlight
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold shadow-xs'
                : `${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
            }`}
            title={outputChannel !== 'audio' && showFlashlight ? "Turn off and hide flashlight (Audio Only)" : "Turn on flashlight and enable optical beam"}
          >
            <span className="material-symbols-outlined text-sm text-amber-400">flare</span>
            <span>Flashlight {outputChannel !== 'audio' && showFlashlight ? 'Active' : 'Off'}</span>
          </button>

          {/* Signaling channel selector */}
          <div className="flex items-center gap-1">
            <span className={`${t.textMuted} mr-1 hidden sm:inline`}>Channel:</span>
            {(['audio', 'optical', 'both'] as OutputChannel[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => {
                  setOutputChannel(ch);
                  if (ch === 'audio') {
                    setShowFlashlight(false);
                    setIsLampFlashing(false);
                  } else {
                    setShowFlashlight(true);
                  }
                }}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer capitalize flex items-center gap-1 ${
                  outputChannel === ch
                    ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} font-bold`
                    : `${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {ch === 'audio' ? 'volume_up' : ch === 'optical' ? 'lightbulb' : 'sync'}
                </span>
                <span>{ch === 'both' ? 'Dual' : ch}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ALDIS OPTICAL SHUTTER LAMP / FLASHLIGHT - Hidden when Audio Only is selected */}
      {outputChannel !== 'audio' && showFlashlight && (
        <div className="animate-fadeIn sticky top-2 z-40">
          <AldisLamp
            isFlashing={isLampFlashing}
            flashSymbol={flashSymbol}
            flashChar={flashChar}
            filter={opticalFilter}
            onFilterChange={setOpticalFilter}
            brightness={opticalBrightness}
            onBrightnessChange={setOpticalBrightness}
            opticalWpm={opticalWpm}
            onOpticalWpmChange={setOpticalWpm}
            showTransmittedChar={showTransmittedChar}
            onToggleShowTransmittedChar={setShowTransmittedChar}
            isTheaterMode={isTheaterMode}
            onToggleTheaterMode={() => setIsTheaterMode((prev) => !prev)}
            outputChannel={outputChannel}
            onOutputChannelChange={setOutputChannel}
            onManualPulse={(active, symbol) => {
              setIsLampFlashing(active);
              if (active && symbol) setFlashSymbol(symbol);
              if (practiceMode === 'reverse' && reverseStatus === 'playing' && active) {
                if (symbol === '-') handleKeyDah();
                else handleKeyDit();
              }
            }}
            isPlaying={
              practiceMode === 'batch'
                ? batchPlaying
                : practiceMode === 'copy'
                  ? copyTypingStatus === 'playing'
                  : reverseStatus === 'playing'
            }
            onStartStop={
              practiceMode === 'batch'
                ? startBatchSession
                : practiceMode === 'copy'
                  ? (copyTypingStatus === 'playing' ? () => setCopyTypingStatus('idle') : startCopySession)
                  : (reverseStatus === 'playing' ? () => setReverseStatus('idle') : startReverseSession)
            }
            startStopLabel={
              practiceMode === 'batch'
                ? (batchPlaying ? 'Stop Transmission' : 'Start 5-Letter Groups')
                : practiceMode === 'copy'
                  ? (copyTypingStatus === 'playing' ? 'Stop Drill' : 'Start Drill (Ctrl+F1)')
                  : (reverseStatus === 'playing' ? 'Stop Drill' : 'Start Keying')
            }
            onRepeat={handleReplayCurrentChar}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. REAL-TIME COPY TYPING DRILL VIEW */}
      {/* ========================================================================= */}
      {practiceMode === 'copy' && (
        <div className={`${t.panelBg} border ${t.borderBase} rounded-xl p-5 shadow-panel space-y-4`}>
          
          {/* Interactive Tape Ribbon Header */}
          <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-700/40 pb-2">
            <span className={`font-bold ${t.textPrimary} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-sm text-amber-500">sync_alt</span>
              Live Intercept Ribbon
            </span>
            <div className="flex items-center gap-3">
              <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] ${t.textMuted} hover:${t.textPrimary}`}>
                <input
                  type="checkbox"
                  checked={hideFutureChars}
                  onChange={(e) => setHideFutureChars(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <span>Mask Future Letters</span>
              </label>
              {copyTypingStatus === 'playing' && (
                <span className={`${t.textAccentStrong} font-bold`}>
                  {copyTypingIndex} / {targetSequence.length}
                </span>
              )}
            </div>
          </div>

          {/* MAIN TAPE RIBBON DISPLAY */}
          <div className={`p-4 ${t.panelInner} rounded-lg border ${t.borderBase} overflow-x-auto min-h-[96px] flex items-center shadow-inner`}>
            {copyTypingStatus === 'idle' ? (
              <div className="w-full text-center py-4 space-y-2">
                <p className={`text-sm ${t.textMuted} font-mono`}>
                  Press <strong className={`${t.textAccentStrong}`}>Start Drill</strong> to begin listening.
                </p>
                <p className="text-xs text-zinc-500 font-mono">
                  Each character sounds once • Strike the matching key on your keyboard immediately.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-full justify-start py-1">
                {targetSequence.split('').map((char, index) => {
                  const isCurrent = index === copyTypingIndex;
                  const isPast = index < copyTypingIndex;
                  const typed = copyTypingTyped[index];
                  const isCorrect = typed?.toUpperCase() === char.toUpperCase();

                  if (char === ' ') {
                    return (
                      <div key={index} className="w-4 flex items-center justify-center opacity-30">
                        <div className="w-1 h-6 bg-zinc-600 rounded" />
                      </div>
                    );
                  }

                  let boxStyle = `${t.panelBg} border-zinc-700/60 text-zinc-500`;
                  if (isPast) {
                    boxStyle = isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400 font-bold'
                      : 'bg-rose-500/15 border-rose-500/60 text-rose-400 font-bold';
                  } else if (isCurrent) {
                    boxStyle = 'bg-amber-500/25 border-amber-400 text-amber-300 font-extrabold ring-2 ring-amber-400/50 scale-110 shadow-lg';
                  }

                  return (
                    <div
                      key={index}
                      ref={isCurrent ? activeCharRef : null}
                      className={`w-12 h-14 rounded-lg border flex flex-col items-center justify-center text-lg font-mono transition-all shrink-0 ${boxStyle}`}
                    >
                      <span>
                        {isPast 
                          ? typed || '—' 
                          : isCurrent 
                            ? (hideFutureChars ? '?' : char)
                            : (hideFutureChars ? '•' : char)}
                      </span>
                      <span className="text-[9px] opacity-60 font-mono tracking-tighter leading-none mt-0.5">
                        {isPast ? char : (isCurrent && !hideFutureChars ? MORSE_CODE[char] : '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS: Start, Replay, Skip */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              {copyTypingStatus === 'playing' ? (
                <button
                  type="button"
                  onClick={() => setCopyTypingStatus('idle')}
                  className={`px-4 py-2 rounded-lg ${t.fontHeader} font-bold text-xs uppercase tracking-wider border border-rose-500/60 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs`}
                >
                  <span className="material-symbols-outlined text-sm">stop</span>
                  <span>Stop Drill</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCopySession}
                  className={`px-5 py-2 rounded-lg ${t.fontHeader} font-bold text-xs uppercase tracking-wider ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white border ${t.borderAccent} transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95`}
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  <span>Start Drill (Ctrl+F1)</span>
                </button>
              )}

              {copyTypingStatus === 'playing' && (
                <>
                  <button
                    type="button"
                    onClick={handleReplayCurrentChar}
                    className={`px-3 py-2 rounded-lg text-xs ${t.fontHeader} font-bold border transition-all cursor-pointer flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 active:scale-95 shadow-xs`}
                    title="Replay character pulse (Ctrl+R or F2)"
                  >
                    <span className="material-symbols-outlined text-sm">replay</span>
                    <span>Replay (Ctrl+R)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipCurrentChar}
                    className={`px-3 py-2 rounded-lg text-xs ${t.fontHeader} font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${t.panelInner} ${t.textMuted} hover:${t.textPrimary} border-zinc-700 hover:border-zinc-500 active:scale-95`}
                    title="Skip character (Tab)"
                  >
                    <span className="material-symbols-outlined text-sm">skip_next</span>
                    <span>Skip (Tab)</span>
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTouchKeypad(!showTouchKeypad)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showTouchKeypad
                  ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent}`
                  : `${t.panelInner} ${t.textMuted} border-zinc-700 hover:${t.textPrimary}`
              }`}
            >
              <span className="material-symbols-outlined text-sm">keyboard</span>
              <span>Keypad: {showTouchKeypad ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* VIRTUAL ON-SCREEN TOUCH KEYPAD */}
          {showTouchKeypad && (
            <div className={`${t.panelInner} border ${t.borderBase} rounded-xl p-3 space-y-1.5 select-none animate-fadeIn`}>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 px-1 pb-1 border-b border-zinc-800">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-amber-500">touch_app</span>
                  Tap or click to strike letter:
                </span>
                <span>QWERTY Touch Matrix</span>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                {['Q','W','E','R','T','Y','U','I','O','P'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleCopyTypeChar(ch)}
                    className={`py-2.5 rounded-lg font-mono font-bold text-xs sm:text-sm border transition-all active:scale-90 cursor-pointer ${t.panelBg} ${t.borderBase} ${t.textPrimary} hover:border-amber-500 hover:bg-amber-500/10 flex flex-col items-center justify-center`}
                  >
                    <span>{ch}</span>
                    <span className="text-[7px] text-zinc-500 tracking-tighter leading-none">{MORSE_CODE[ch]}</span>
                  </button>
                ))}
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-9 gap-1 sm:gap-1.5 px-2 sm:px-4">
                {['A','S','D','F','G','H','J','K','L'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleCopyTypeChar(ch)}
                    className={`py-2.5 rounded-lg font-mono font-bold text-xs sm:text-sm border transition-all active:scale-90 cursor-pointer ${t.panelBg} ${t.borderBase} ${t.textPrimary} hover:border-amber-500 hover:bg-amber-500/10 flex flex-col items-center justify-center`}
                  >
                    <span>{ch}</span>
                    <span className="text-[7px] text-zinc-500 tracking-tighter leading-none">{MORSE_CODE[ch]}</span>
                  </button>
                ))}
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 px-6 sm:px-10">
                {['Z','X','C','V','B','N','M'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleCopyTypeChar(ch)}
                    className={`py-2.5 rounded-lg font-mono font-bold text-xs sm:text-sm border transition-all active:scale-90 cursor-pointer ${t.panelBg} ${t.borderBase} ${t.textPrimary} hover:border-amber-500 hover:bg-amber-500/10 flex flex-col items-center justify-center`}
                  >
                    <span>{ch}</span>
                    <span className="text-[7px] text-zinc-500 tracking-tighter leading-none">{MORSE_CODE[ch]}</span>
                  </button>
                ))}
              </div>

              {/* Numbers Row */}
              <div className="grid grid-cols-10 gap-1 pt-1 border-t border-zinc-800/80">
                {['1','2','3','4','5','6','7','8','9','0'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleCopyTypeChar(num)}
                    className={`py-1.5 rounded font-mono font-bold text-xs border transition-all active:scale-90 cursor-pointer ${t.panelBg} ${t.borderBase} ${t.textSecondary} hover:border-amber-500 hover:bg-amber-500/10 flex flex-col items-center justify-center`}
                  >
                    <span>{num}</span>
                    <span className="text-[6px] text-zinc-500 tracking-tighter leading-none">{MORSE_CODE[num]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REVERSE KEYING PRACTICE (ENCODE DITS & DAHS) */}
      {/* ========================================================================= */}
      {practiceMode === 'reverse' && (
        <div className={`${t.panelBg} border ${t.borderBase} rounded-xl p-5 shadow-panel space-y-5`}>
          
          <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-700/40 pb-2">
            <span className={`font-bold ${t.textPrimary} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-sm text-amber-500">dialpad</span>
              Straight Key & Iambic Drill
            </span>
            <div className="flex items-center gap-3">
              <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] ${t.textMuted} hover:${t.textPrimary}`}>
                <input
                  type="checkbox"
                  checked={reverseShowMorseHint}
                  onChange={(e) => setReverseShowMorseHint(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <span>Show Morse Hint</span>
              </label>
              {reverseStatus === 'playing' && (
                <span className={`${t.textAccentStrong} font-bold`}>
                  {reverseIndex + 1} / {reverseSequence.length}
                </span>
              )}
            </div>
          </div>

          {reverseStatus === 'idle' ? (
            <div className={`p-8 ${t.panelInner} rounded-xl border ${t.borderBase} text-center space-y-3`}>
              <span className="material-symbols-outlined text-4xl text-amber-500">speed</span>
              <h3 className={`text-base ${t.fontHeader} font-bold ${t.textPrimary}`}>
                Master Keying & Encoding
              </h3>
              <p className={`text-xs ${t.textMuted} font-mono max-w-md mx-auto leading-relaxed`}>
                Characters will be displayed on screen. Key out the correct dots and dashes using the on-screen key or your keyboard (<strong className={t.textPrimary}>J = Dit</strong>, <strong className={t.textPrimary}>K = Dah</strong>, <strong className={t.textPrimary}>Space/Enter = Submit</strong>).
              </p>
              <button
                type="button"
                onClick={startReverseSession}
                className={`mt-2 px-6 py-2.5 rounded-lg ${t.fontHeader} font-bold text-xs uppercase tracking-wider ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white border ${t.borderAccent} transition-all cursor-pointer shadow-md inline-flex items-center gap-2`}
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Begin Keying Drill</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* CURRENT PROMPT CARD */}
              <div className={`p-6 ${t.panelInner} rounded-xl border-2 border-amber-500/40 text-center space-y-2 relative overflow-hidden shadow-inner`}>
                <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 block">
                  Key the Morse Code for:
                </span>
                
                <div className={`text-5xl font-mono font-black ${t.textPrimary} tracking-wider`}>
                  {reverseSequence[reverseIndex]}
                </div>

                {reverseShowMorseHint && (
                  <div className="text-sm font-mono text-amber-400 font-bold tracking-widest pt-1">
                    {MORSE_CODE[reverseSequence[reverseIndex]]}
                  </div>
                )}

                {/* Live Buffer */}
                <div className="pt-2 flex items-center justify-center gap-1.5 min-h-[36px]">
                  <span className="text-xs font-mono text-zinc-500">Your Keying:</span>
                  <span className={`text-xl font-mono font-black ${t.textAccentStrong} tracking-widest bg-zinc-900/80 px-3 py-0.5 rounded border border-zinc-700 min-w-[80px]`}>
                    {reverseCurrentCode || '—'}
                  </span>
                </div>
              </div>

              {/* TACTILE KEYING CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Dit button */}
                <button
                  type="button"
                  onClick={handleKeyDit}
                  className={`py-5 rounded-xl border ${t.panelBg} ${t.borderBase} hover:border-amber-500 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 shadow-md ${
                    ditActive ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/50' : ''
                  }`}
                >
                  <span className="text-2xl font-mono font-black text-amber-400">•</span>
                  <span className={`text-xs ${t.fontHeader} font-bold ${t.textPrimary}`}>DIT ( . or J )</span>
                  <span className="text-[9px] text-zinc-500 font-mono">Short Pulse</span>
                </button>

                {/* Dah button */}
                <button
                  type="button"
                  onClick={handleKeyDah}
                  className={`py-5 rounded-xl border ${t.panelBg} ${t.borderBase} hover:border-amber-500 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 shadow-md ${
                    dahActive ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/50' : ''
                  }`}
                >
                  <span className="text-2xl font-mono font-black text-amber-400">—</span>
                  <span className={`text-xs ${t.fontHeader} font-bold ${t.textPrimary}`}>DAH ( - or K )</span>
                  <span className="text-[9px] text-zinc-500 font-mono">Long Pulse (3x)</span>
                </button>

                {/* Submit / Match button */}
                <button
                  type="button"
                  onClick={() => submitReverseChar(reverseCurrentCode)}
                  disabled={!reverseCurrentCode}
                  className={`py-5 rounded-xl border ${t.bgAccentSolid} hover:${t.bgAccentHover} disabled:opacity-40 text-white font-bold transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 shadow-md`}
                >
                  <span className="material-symbols-outlined text-xl">check</span>
                  <span className={`text-xs ${t.fontHeader} font-bold`}>SUBMIT (Space/Enter)</span>
                  <span className="text-[9px] opacity-80 font-mono">Verify Letter</span>
                </button>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setReverseCurrentCode('')}
                  disabled={!reverseCurrentCode}
                  className={`px-3 py-1 text-xs font-mono rounded border ${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary} disabled:opacity-30 cursor-pointer`}
                >
                  Clear Buffer (Backspace)
                </button>

                <button
                  type="button"
                  onClick={() => setReverseStatus('idle')}
                  className={`px-3 py-1 text-xs font-mono rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 cursor-pointer`}
                >
                  Abort Session
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BATCH INTERCEPT TRANSCRIPTION DRILL VIEW */}
      {/* ========================================================================= */}
      {practiceMode === 'batch' && (
        <div className={`${t.panelBg} border ${t.borderBase} rounded-xl p-5 shadow-panel space-y-4`}>
          
          <div className="flex justify-between items-center text-xs font-mono border-b border-zinc-700/40 pb-2">
            <span className={`font-bold ${t.textPrimary} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-sm text-amber-500">article</span>
              5-Letter Group Audio Interception
            </span>
            <span className={`text-[10px] ${t.textAccentStrong} font-bold`}>
              Wartime Standard Protocol
            </span>
          </div>

          <div className="space-y-3">
            {/* Status indicator bar */}
            <div className={`h-11 ${t.panelInner} rounded-lg border ${t.borderBase} flex items-center justify-center relative overflow-hidden px-4`}>
              {batchPlaying ? (
                <div className={`flex items-center gap-2 ${t.textAccentStrong} animate-pulse text-xs font-mono`}>
                  <span className={`w-3 h-3 rounded-full ${t.bgAccentSolid} animate-ping`} />
                  <span className="material-symbols-outlined text-base">hearing</span>
                  <span>TRANSMISSION BROADCASTING AT {wpm} WPM...</span>
                </div>
              ) : targetSequence ? (
                <div className={`flex items-center gap-1.5 ${t.textSuccess} text-xs font-mono font-bold`}>
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span>BROADCAST COMPLETE. TYPE YOUR TRANSCRIPT AND SUBMIT.</span>
                </div>
              ) : (
                <span className={`text-xs ${t.textMuted} font-mono`}>
                  READY FOR INTERCEPTION. PRESS PLAY TRANSMISSION.
                </span>
              )}
            </div>

            {/* Transcript Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={`text-[10px] font-mono ${t.textMuted} uppercase`}>
                  Operator Transcript Log
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  Type letters as you hear them
                </span>
              </div>
              <textarea
                ref={batchInputRef}
                value={batchUserInput}
                onChange={(e) => setBatchUserInput(e.target.value.toUpperCase())}
                placeholder="Log incoming telegraph letters here..."
                rows={3}
                className={`w-full ${t.panelInner} border ${t.borderBase} rounded-lg p-3 ${t.textPrimary} font-mono text-base focus:${t.borderAccent} focus:outline-none resize-none leading-relaxed select-text`}
                spellCheck="false"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startBatchSession}
                className={`py-2.5 rounded-lg ${t.fontHeader} font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                  batchPlaying
                    ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                    : `${t.panelInner} ${t.textAccentStrong} ${t.borderAccent} hover:opacity-90`
                }`}
              >
                {batchPlaying ? 'Stop Transmission' : 'Play Transmission (Ctrl+F1)'}
              </button>

              <button
                type="button"
                onClick={submitBatchTranscript}
                disabled={batchPlaying || !targetSequence || batchUserInput.length === 0}
                className={`py-2.5 ${t.bgAccentSolid} hover:${t.bgAccentHover} disabled:opacity-40 text-white rounded-lg border ${t.borderAccent} ${t.fontHeader} font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm`}
              >
                Submit & Check Accuracy
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK CURRICULUM & DRILL PARAMETERS (Compact & Essential) */}
      {/* ========================================================================= */}
      <div className={`${t.panelBg} border ${t.borderBase} rounded-xl p-4 shadow-panel space-y-4`}>
        
        <div className="flex justify-between items-center border-b border-zinc-700/40 pb-2">
          <span className={`text-xs ${t.fontHeader} font-bold ${t.textPrimary} flex items-center gap-1.5`}>
            <span className="material-symbols-outlined text-sm text-amber-500">tune</span>
            Curriculum & Speed Parameters
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMethod('koch')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                method === 'koch'
                  ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} font-bold`
                  : `${t.panelInner} ${t.textMuted} ${t.borderBase}`
              }`}
            >
              Koch Method
            </button>
            <button
              type="button"
              onClick={() => setMethod('lcwo')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                method === 'lcwo'
                  ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} font-bold`
                  : `${t.panelInner} ${t.textMuted} ${t.borderBase}`
              }`}
            >
              LCWO Method
            </button>
          </div>
        </div>

        {/* Level and Speed Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Level slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className={t.textMuted}>Lesson Level (Characters Pool):</span>
              <span className={`font-bold ${t.textAccentStrong} ${t.panelInner} px-2 py-0.5 rounded border ${t.borderBase}`}>
                Level {level}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max={sequenceString.length}
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-lg cursor-pointer accent-amber-500"
            />
          </div>

          {/* Speed slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className={t.textMuted}>Telegraph Speed (WPM):</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(5, wpm - 1);
                    setWpm(next);
                    if (charWpm < next) setCharWpm(next);
                  }}
                  className={`w-5 h-5 rounded border ${t.panelInner} ${t.borderBase} text-zinc-400 hover:text-white flex items-center justify-center text-xs`}
                >
                  -
                </button>
                <span className={`font-bold ${t.textAccentStrong} ${t.panelInner} px-2 py-0.5 rounded border ${t.borderBase}`}>
                  {wpm} WPM
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(50, wpm + 1);
                    setWpm(next);
                    if (charWpm < next) setCharWpm(next);
                  }}
                  className={`w-5 h-5 rounded border ${t.panelInner} ${t.borderBase} text-zinc-400 hover:text-white flex items-center justify-center text-xs`}
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              value={wpm}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setWpm(val);
                if (charWpm < val) setCharWpm(val);
              }}
              className="w-full h-1.5 rounded-lg cursor-pointer accent-amber-500"
            />
          </div>

        </div>

        {/* ACTIVE CHARACTER POOL CHIPS (Clickable to preview sound!) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
            <span>Current Lesson Character Pool (Tap to hear):</span>
            <span>{currentCharsList.length} Letters Active</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {currentCharsList.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => playCharPreview(ch)}
                className={`w-7 h-7 rounded font-mono font-bold text-xs border transition-all active:scale-90 cursor-pointer flex flex-col items-center justify-center ${
                  previewChar === ch
                    ? 'bg-amber-500 text-black border-amber-400 ring-2 ring-amber-400/50 scale-110'
                    : `${t.panelInner} ${t.borderBase} ${t.textPrimary} hover:border-amber-500`
                }`}
                title={`Play '${ch}' Morse Sound (${MORSE_CODE[ch]})`}
              >
                <span>{ch}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Audio Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800 text-xs font-mono">
          <label className={`flex items-center gap-2 cursor-pointer select-none ${t.textPrimary}`} title="Farnsworth spacing: Fast individual characters, but wider gaps between them.">
            <input
              type="checkbox"
              checked={charWpm > wpm}
              onChange={(e) => {
                if (e.target.checked) {
                  setCharWpm(Math.max(20, wpm));
                } else {
                  setCharWpm(wpm);
                }
              }}
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span>Farnsworth Spacing (Fast Chars)</span>
          </label>

          <div className="flex items-center justify-start md:justify-end gap-2">
            <span className="text-zinc-500">Atmosphere:</span>
            <select
              value={noiseLevel === 0 ? 'pristine' : noiseLevel < 0.3 ? 'qrn_light' : 'qrn_heavy'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'pristine') {
                  setNoiseLevel(0);
                  setFrequency(600);
                } else if (val === 'qrn_light') {
                  setNoiseLevel(0.15);
                  setFrequency(550);
                } else if (val === 'qrn_heavy') {
                  setNoiseLevel(0.4);
                  setFrequency(450);
                }
              }}
              className={`${t.panelInner} border ${t.borderBase} rounded px-2 py-0.5 text-xs ${t.textPrimary} cursor-pointer focus:outline-none`}
            >
              <option value="pristine">Pristine CW (600Hz)</option>
              <option value="qrn_light">Light Static QRN (550Hz)</option>
              <option value="qrn_heavy">Heavy Static QRN (450Hz)</option>
            </select>
          </div>
        </div>

        {/* Auto-Advance Switch & Content Type */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800 text-xs font-mono">
          <label className={`flex items-center gap-2 cursor-pointer select-none ${t.textPrimary}`}>
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="rounded accent-amber-500 cursor-pointer"
            />
            <span>Auto-Advance Level on ≥90% Mastery</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Drill Content:</span>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as PracticeContentType)}
              className={`${t.panelInner} border ${t.borderBase} rounded px-2 py-0.5 text-xs ${t.textPrimary} cursor-pointer focus:outline-none`}
            >
              <option value="lesson">Curriculum Pool</option>
              <option value="weak_drill">Weak Characters (Adaptive)</option>
              <option value="historical">Historical Contexts</option>
              <option value="words">Common CW Words</option>
              <option value="qcodes">Q-Codes</option>
              <option value="callsigns">Tactical Callsigns</option>
              {cipherTape && <option value="enigma">Enigma Ciphertext</option>}
            </select>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SESSION RESULTS & MASTERY MODAL */}
      {/* ========================================================================= */}
      {sessionResult?.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/75 z-50 p-4 animate-fadeIn">
          <div className={`${t.panelBg} border-2 ${sessionResult.accuracy >= 90 ? 'border-emerald-500' : t.borderAccent} rounded-xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl relative overflow-hidden`}>
            
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center border ${
              sessionResult.accuracy >= 90 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/60'
            }`}>
              <span className="material-symbols-outlined text-2xl">
                {sessionResult.accuracy >= 90 ? 'military_tech' : 'analytics'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className={`text-lg ${t.fontHeader} font-bold ${t.textPrimary}`}>
                {sessionResult.accuracy >= 90 ? 'Mastery Achieved!' : 'Drill Completed'}
              </h2>
              <p className={`text-xs ${t.textMuted} font-mono`}>
                Session Performance Summary
              </p>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className={`p-2.5 rounded-lg ${t.panelInner} border ${t.borderBase}`}>
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Accuracy</div>
                <div className={`text-lg font-mono font-bold ${sessionResult.accuracy >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {sessionResult.accuracy.toFixed(0)}%
                </div>
              </div>

              <div className={`p-2.5 rounded-lg ${t.panelInner} border ${t.borderBase}`}>
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Speed</div>
                <div className={`text-lg font-mono font-bold ${t.textPrimary}`}>
                  {sessionResult.wpm} WPM
                </div>
              </div>

              <div className={`p-2.5 rounded-lg ${t.panelInner} border ${t.borderBase}`}>
                <div className="text-[10px] text-zinc-500 font-mono uppercase">Score</div>
                <div className={`text-lg font-mono font-bold ${t.textPrimary}`}>
                  {sessionResult.score} / {sessionResult.total}
                </div>
              </div>
            </div>

            {/* Results preview */}
            <div className={`p-2.5 rounded-lg ${t.panelInner} border ${t.borderBase} max-h-24 overflow-y-auto font-mono text-xs flex flex-wrap gap-1 justify-center`}>
              {sessionResult.results.map((r, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded border text-[11px] font-bold ${
                    r.isCorrect 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                  }`}
                  title={r.isCorrect ? `Target: ${r.char}` : `Target: ${r.char} | Typed: ${r.typed || '—'}`}
                >
                  {r.char}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {sessionResult.accuracy >= 90 && level < sequenceString.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setSessionResult(null);
                    setLevel(prev => prev + 1);
                    if (practiceMode === 'copy') startCopySession();
                    else if (practiceMode === 'reverse') startReverseSession();
                    else startBatchSession();
                  }}
                  className={`flex-1 py-2.5 rounded-lg ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md`}
                >
                  Advance to Level {level + 1} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSessionResult(null);
                    if (practiceMode === 'copy') startCopySession();
                    else if (practiceMode === 'reverse') startReverseSession();
                    else startBatchSession();
                  }}
                  className={`flex-1 py-2.5 rounded-lg ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md`}
                >
                  Repeat Drill (↺)
                </button>
              )}

              <button
                type="button"
                onClick={() => setSessionResult(null)}
                className={`px-4 py-2.5 rounded-lg border ${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary} font-bold text-xs font-mono uppercase transition-colors cursor-pointer`}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK REFERENCE SHEET MODAL */}
      <MorseReferenceSheet
        isOpen={showReferenceSheet}
        onClose={() => setShowReferenceSheet(false)}
      />

    </div>
  );
};
