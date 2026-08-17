import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { MORSE_MAP as MORSE_CODE, REVERSE_MORSE_MAP } from '../lib/morse';
import { MorseReferenceSheet } from './MorseReferenceSheet';
import { AldisLamp } from './AldisLamp';
import { SimplifiedMorseTrainer } from './SimplifiedMorseTrainer';
import {
  COMMON_CW_WORDS,
  Q_CODES,
  generateRandomCallsign,
  PracticeContentType,
  OpticalFilterColor
} from '../lib/morseTrainingData';
import { generateMorseWavBlob } from '../lib/wavExport';

const METHODS = {
  koch: "KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X",
  lcwo: "KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D6X0"
};

type TrainingMethod = 'koch' | 'lcwo';
type PracticeMode = 'batch' | 'copy' | 'reverse';
export type OutputChannel = 'audio' | 'optical' | 'both';

interface LevelStats {
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

class MorsePlayer {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  
  private effWpm: number = 20;
  private charWpm: number = 20;
  private opticalWpm: number = 5;
  private frequency: number = 600;
  private noiseLevel: number = 0; // 0 to 1
  private volume: number = 1.0; // 0 to 1
  private wordSpaceMultiplier: number = 2.0; // multiplier e.g. 1 to 5
  private edgeMs: number = 10; // envelope edge in ms
  private outputChannel: OutputChannel = 'both';
  
  private isPlaying: boolean = false;
  private stopTimeout: number | null = null;
  private scheduledFlashTimeouts: number[] = [];

  public onSignalStateChange?: (active: boolean, symbol?: string, char?: string, charIndex?: number) => void;
  public onCharProgress?: (charIndex: number, char: string) => void;

  constructor(
    effWpm: number = 20, 
    charWpm: number = 20, 
    frequency: number = 600, 
    noiseLevel: number = 0,
    volume: number = 1.0,
    wordSpaceMultiplier: number = 2.0,
    edgeMs: number = 10,
    outputChannel: OutputChannel = 'both',
    opticalWpm: number = 5
  ) {
    this.effWpm = effWpm;
    this.charWpm = charWpm;
    this.frequency = frequency;
    this.noiseLevel = noiseLevel;
    this.volume = volume;
    this.wordSpaceMultiplier = wordSpaceMultiplier;
    this.edgeMs = edgeMs;
    this.outputChannel = outputChannel;
    this.opticalWpm = opticalWpm;
  }

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setEffWPM(wpm: number) { this.effWpm = wpm; }
  public setCharWPM(wpm: number) { this.charWpm = wpm; }
  public setOpticalWpm(wpm: number) { this.opticalWpm = wpm; }
  public setFrequency(freq: number) { this.frequency = freq; }
  public setNoiseLevel(level: number) { this.noiseLevel = level; }
  public setVolume(vol: number) { this.volume = vol; }
  public setWordSpaceMultiplier(mul: number) { this.wordSpaceMultiplier = mul; }
  public setEdgeMs(edge: number) { this.edgeMs = edge; }
  public setOutputChannel(ch: OutputChannel) { this.outputChannel = ch; }

  public stop() {
    this.isPlaying = false;
    if (this.stopTimeout !== null) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    for (const tid of this.scheduledFlashTimeouts) {
      clearTimeout(tid);
    }
    this.scheduledFlashTimeouts = [];
    if (this.onSignalStateChange) {
      this.onSignalStateChange(false);
    }
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
      }
      if (this.noiseSource) {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      }
    } catch (e) {}
    this.oscillator = null;
    this.noiseSource = null;
  }

  public playDit() {
    this.initAudio();
    if (this.onSignalStateChange) this.onSignalStateChange(true, '.', '.');
    const w = this.outputChannel === 'optical' ? this.opticalWpm : Math.max(this.charWpm, this.effWpm);
    const u = 1.2 / Math.max(1, w);
    if (this.outputChannel !== 'optical') {
      this.playToneDuration(u);
    }
    const tid = window.setTimeout(() => {
      if (this.onSignalStateChange) this.onSignalStateChange(false);
    }, u * 1000);
    this.scheduledFlashTimeouts.push(tid);
  }

  public playDah() {
    this.initAudio();
    if (this.onSignalStateChange) this.onSignalStateChange(true, '-', '-');
    const w = this.outputChannel === 'optical' ? this.opticalWpm : Math.max(this.charWpm, this.effWpm);
    const u = 1.2 / Math.max(1, w);
    if (this.outputChannel !== 'optical') {
      this.playToneDuration(3 * u);
    }
    const tid = window.setTimeout(() => {
      if (this.onSignalStateChange) this.onSignalStateChange(false);
    }, 3 * u * 1000);
    this.scheduledFlashTimeouts.push(tid);
  }

  private playToneDuration(durationSec: number) {
    if (!this.audioCtx || this.outputChannel === 'optical') return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      const tc = Math.max(0.001, (this.edgeMs / 1000) / 3);
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, tc);
      gain.gain.setTargetAtTime(0, this.audioCtx.currentTime + durationSec, tc);
      
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + durationSec + 0.05);
    } catch (e) {}
  }

  public playSuccessTone() {
    this.initAudio();
    if (!this.audioCtx || this.outputChannel === 'optical') return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.frequency * 1.5, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch (e) {}
  }

  public playErrorTone() {
    this.initAudio();
    if (!this.audioCtx || this.outputChannel === 'optical') return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.2);
    } catch (e) {}
  }

  public async playSequence(text: string, onEnded?: () => void) {
    this.initAudio();
    this.stop();
    this.isPlaying = true;
    
    if (!this.audioCtx) return;

    let charWpm = Math.max(this.charWpm, this.effWpm);
    let effWpm = this.effWpm;
    
    // In soundless optical mode, synchronize the flash frequency to the optical WPM setting
    if (this.outputChannel === 'optical') {
      charWpm = this.opticalWpm;
      effWpm = this.opticalWpm;
    }
    
    const u = 1.2 / Math.max(1, charWpm);
    let interCharTime = 3 * u;
    let interWordTime = 7 * u;
    
    if (effWpm < charWpm) {
      const spaceTime = (60 / effWpm) - (31 * u);
      interCharTime = (spaceTime * 3) / 19;
      interWordTime = (spaceTime * 7) / 19;
    }

    const wordSpaceMultiplierValue = this.wordSpaceMultiplier;
    const isSoundless = this.outputChannel === 'optical';

    if (!isSoundless) {
      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();
      
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = this.frequency;
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      
      // Background noise
      if (this.noiseLevel > 0) {
        const bufferSize = this.audioCtx.sampleRate * 2;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        this.noiseSource = this.audioCtx.createBufferSource();
        this.noiseSource.buffer = noiseBuffer;
        this.noiseSource.loop = true;
        
        const bandpass = this.audioCtx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1000;
        bandpass.Q.value = 0.5;
        
        this.noiseGain = this.audioCtx.createGain();
        this.noiseGain.gain.value = this.noiseLevel * 0.1;
        
        this.noiseSource.connect(bandpass);
        bandpass.connect(this.noiseGain);
        this.noiseGain.connect(this.audioCtx.destination);
        
        this.noiseSource.start(this.audioCtx.currentTime);
      }
      
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.oscillator.start(this.audioCtx.currentTime);
    }

    let startTime = this.audioCtx.currentTime + 0.5; // delay to start

    // Setup envelope speed based on edge milliseconds
    const edgeSeconds = this.edgeMs / 1000;
    const tc = Math.max(0.001, edgeSeconds / 3);

    for (let i = 0; i < text.length; i++) {
      if (!this.isPlaying) break;
      
      const char = text[i].toUpperCase();
      if (char === ' ') {
        startTime += (interWordTime * wordSpaceMultiplierValue - interCharTime);
        continue;
      }
      
      const code = MORSE_CODE[char];
      if (code) {
        for (let j = 0; j < code.length; j++) {
          const symbol = code[j];
          const duration = symbol === '-' ? u * 3 : u;
          
          if (!isSoundless && this.gainNode) {
            this.gainNode.gain.setValueAtTime(0, startTime);
            this.gainNode.gain.setTargetAtTime(this.volume, startTime, tc);
          }

          // Schedule optical flash state changes
          const flashStartDelayMs = Math.max(0, (startTime - this.audioCtx.currentTime) * 1000);
          const flashEndDelayMs = Math.max(0, (startTime + duration - this.audioCtx.currentTime) * 1000);

          const tid1 = window.setTimeout(() => {
            if (this.isPlaying && this.onSignalStateChange) {
              this.onSignalStateChange(true, symbol, char, i);
            }
            if (this.isPlaying && j === 0 && this.onCharProgress) {
              this.onCharProgress(i, char);
            }
          }, flashStartDelayMs);

          const tid2 = window.setTimeout(() => {
            if (this.isPlaying && this.onSignalStateChange) {
              this.onSignalStateChange(false, symbol, char, i);
            }
          }, flashEndDelayMs);

          this.scheduledFlashTimeouts.push(tid1, tid2);
          
          startTime += duration;
          
          if (!isSoundless && this.gainNode) {
            this.gainNode.gain.setTargetAtTime(0, startTime, tc);
          }
          if (j < code.length - 1) {
            startTime += u; // intra-character gap
          }
        }
        startTime += interCharTime; // inter-character gap
      }
    }

    const totalDurationMs = (startTime - this.audioCtx.currentTime + 0.5) * 1000;
    
    this.stopTimeout = window.setTimeout(() => {
      this.stop();
      if (onEnded) onEnded();
    }, totalDurationMs);
  }
}

export interface MorseTrainerProps {
  cipherTape?: string;
  onLoadCiphertextToMachine?: (header: string, ciphertext: string) => void;
}

export const MorseTrainer: React.FC<MorseTrainerProps> = ({ cipherTape, onLoadCiphertextToMachine }) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [method, setMethod] = useState<TrainingMethod>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.method) return parsed.method;
      }
    } catch (e) {}
    return 'koch';
  });
  const [level, setLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.level !== undefined) return parsed.level;
      }
    } catch (e) {}
    return 2;
  });
  const [wpm, setWpm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.wpm !== undefined) return parsed.wpm;
      }
    } catch (e) {}
    return 15;
  });
  const [charWpm, setCharWpm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.charWpm !== undefined) return parsed.charWpm;
      }
    } catch (e) {}
    return 20;
  });
  const [frequency, setFrequency] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.frequency !== undefined) return parsed.frequency;
      }
    } catch (e) {}
    return 600;
  });
  const [noiseLevel, setNoiseLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.noiseLevel !== undefined) return parsed.noiseLevel;
      }
    } catch (e) {}
    return 0;
  });
  const [wordSpaceAuto, setWordSpaceAuto] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.wordSpaceAuto !== undefined) return parsed.wordSpaceAuto;
      }
    } catch (e) {}
    return true;
  });
  const [wordSpaceMultiplier, setWordSpaceMultiplier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.wordSpaceMultiplier !== undefined) return parsed.wordSpaceMultiplier;
      }
    } catch (e) {}
    return 2.0;
  });
  const [edgeMs, setEdgeMs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.edgeMs !== undefined) return parsed.edgeMs;
      }
    } catch (e) {}
    return 10;
  });
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.volume !== undefined) return parsed.volume;
      }
    } catch (e) {}
    return 1.0;
  });

  // Optical & Signaling Configuration
  const [outputChannel, setOutputChannel] = useState<OutputChannel>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.outputChannel) return parsed.outputChannel;
      }
    } catch (e) {}
    return 'both';
  });
  const [opticalWpm, setOpticalWpm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.opticalWpm !== undefined) return parsed.opticalWpm;
      }
    } catch (e) {}
    return 5;
  });
  const [showTransmittedChar, setShowTransmittedChar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.showTransmittedChar !== undefined) return parsed.showTransmittedChar;
      }
    } catch (e) {}
    return false;
  });
  const [opticalFilter, setOpticalFilter] = useState<OpticalFilterColor>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.opticalFilter) return parsed.opticalFilter;
      }
    } catch (e) {}
    return 'amber';
  });
  const [opticalBrightness, setOpticalBrightness] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.opticalBrightness !== undefined) return parsed.opticalBrightness;
      }
    } catch (e) {}
    return 100;
  });
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isLampFlashing, setIsLampFlashing] = useState<boolean>(false);
  const [flashSymbol, setFlashSymbol] = useState<string>('');
  const [flashChar, setFlashChar] = useState<string>('');

  // Practice Content Selection
  const [viewLayout, setViewLayout] = useState<'simplified' | 'advanced'>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_layout');
      if (saved === 'advanced' || saved === 'simplified') return saved;
    } catch {}
    return 'simplified';
  });

  const handleSetViewLayout = (layout: 'simplified' | 'advanced') => {
    setViewLayout(layout);
    try {
      localStorage.setItem('morse_trainer_layout', layout);
    } catch {}
  };

  const [contentType, setContentType] = useState<PracticeContentType>(() => {
    try {
      const saved = localStorage.getItem('morse_trainer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contentType) return parsed.contentType;
      }
    } catch (e) {}
    return 'lesson';
  });
  const [customText, setCustomText] = useState<string>('CQ CQ CQ DE W1AW K');
  const [isExportingWav, setIsExportingWav] = useState<boolean>(false);

  // Save settings on change
  useEffect(() => {
    try {
      const stateObj = {
        method,
        level,
        wpm,
        charWpm,
        frequency,
        noiseLevel,
        wordSpaceAuto,
        wordSpaceMultiplier,
        edgeMs,
        volume,
        outputChannel,
        opticalWpm,
        showTransmittedChar,
        opticalFilter,
        opticalBrightness,
        contentType
      };
      localStorage.setItem('morse_trainer_state', JSON.stringify(stateObj));
    } catch (e) {}
  }, [method, level, wpm, charWpm, frequency, noiseLevel, wordSpaceAuto, wordSpaceMultiplier, edgeMs, volume, outputChannel, opticalWpm, showTransmittedChar, opticalFilter, opticalBrightness, contentType]);

  // Listen for storage changes to sync across windows/tabs and upon server restoration
  useEffect(() => {
    const handleStorage = (e: Event) => {
      if (e instanceof StorageEvent && e.key && e.key !== 'morse_trainer_state' && e.key !== 'morse_trainer_stats') {
        return;
      }
      
      try {
        const saved = localStorage.getItem('morse_trainer_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.method !== undefined) setMethod(parsed.method);
          if (parsed.level !== undefined) setLevel(parsed.level);
          if (parsed.wpm !== undefined) setWpm(parsed.wpm);
          if (parsed.charWpm !== undefined) setCharWpm(parsed.charWpm);
          if (parsed.frequency !== undefined) setFrequency(parsed.frequency);
          if (parsed.noiseLevel !== undefined) setNoiseLevel(parsed.noiseLevel);
          if (parsed.wordSpaceAuto !== undefined) setWordSpaceAuto(parsed.wordSpaceAuto);
          if (parsed.wordSpaceMultiplier !== undefined) setWordSpaceMultiplier(parsed.wordSpaceMultiplier);
          if (parsed.edgeMs !== undefined) setEdgeMs(parsed.edgeMs);
          if (parsed.volume !== undefined) setVolume(parsed.volume);
          if (parsed.outputChannel !== undefined) setOutputChannel(parsed.outputChannel);
          if (parsed.opticalWpm !== undefined) setOpticalWpm(parsed.opticalWpm);
          if (parsed.showTransmittedChar !== undefined) setShowTransmittedChar(parsed.showTransmittedChar);
          if (parsed.opticalFilter !== undefined) setOpticalFilter(parsed.opticalFilter);
          if (parsed.opticalBrightness !== undefined) setOpticalBrightness(parsed.opticalBrightness);
          if (parsed.contentType !== undefined) setContentType(parsed.contentType);
        }
        
        const savedStats = localStorage.getItem('morse_trainer_stats');
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  // Practice configuration
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('batch');
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [showHints, setShowHints] = useState<boolean>(true);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [targetSequence, setTargetSequence] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [result, setResult] = useState<{ score: number, accuracy: number, show: boolean }>({ score: 0, accuracy: 0, show: false });
  const [groupCount, setGroupCount] = useState<number>(5);
  const [groupLength, setGroupLength] = useState<number>(5);
  
  // Copy typing active states
  const [copyTypingIndex, setCopyTypingIndex] = useState<number>(0);
  const [copyTypingTyped, setCopyTypingTyped] = useState<string[]>([]);
  const [copyTypingStatus, setCopyTypingStatus] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [copyTypingStartTime, setCopyTypingStartTime] = useState<number>(0);

  // Reverse Learning active states
  const [reverseCount, setReverseCount] = useState<number>(15);
  const [reverseSequence, setReverseSequence] = useState<string>('');
  const [reverseIndex, setReverseIndex] = useState<number>(0);
  const [reverseCurrentCode, setReverseCurrentCode] = useState<string>('');
  const [reverseEntries, setReverseEntries] = useState<Array<{ char: string; typedCode: string; expectedCode: string; isCorrect: boolean }>>([]);
  const [reverseStatus, setReverseStatus] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [reverseStartTime, setReverseStartTime] = useState<number>(0);
  const [reverseAutoAdvance, setReverseAutoAdvance] = useState<boolean>(true);
  const [reverseSoundEnabled, setReverseSoundEnabled] = useState<boolean>(true);
  const [reverseShowMorseHint, setReverseShowMorseHint] = useState<boolean>(false);
  const [reverseFeedback, setReverseFeedback] = useState<{ status: 'none' | 'correct' | 'incorrect'; message?: string; targetCode?: string }>({ status: 'none' });
  const [ditActive, setDitActive] = useState<boolean>(false);
  const [dahActive, setDahActive] = useState<boolean>(false);

  // Mobile virtual keyboard support
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState<boolean>(false);
  const [showTouchKeypad, setShowTouchKeypad] = useState<boolean>(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLTextAreaElement>(null);
  const [hideFutureChars, setHideFutureChars] = useState<boolean>(true);
  const activeCharRef = useRef<HTMLDivElement>(null);
  const tapeContainerRef = useRef<HTMLDivElement>(null);

  // Smooth horizontal centering of active character on ticker tape ribbon
  useEffect(() => {
    if (copyTypingStatus === 'playing' && activeCharRef.current && tapeContainerRef.current) {
      const container = tapeContainerRef.current;
      const target = activeCharRef.current;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (targetRect.left - containerRect.left) - (containerRect.width / 2) + (targetRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [copyTypingIndex, copyTypingStatus]);

  // Level Up overlay & celebratory audio
  const [showLevelUpBanner, setShowLevelUpBanner] = useState<boolean>(false);
  
  // Interactive charting and stats
  const [showChart, setShowChart] = useState<boolean>(false);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState<number | null>(null);
  const [stats, setStats] = useState<LevelStats[]>([]);
  const [chartMetric, setChartMetric] = useState<'accuracy' | 'wpm' | 'level'>('accuracy');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<(LevelStats & { x: number; y: number; index: number }) | null>(null);

  const playerRef = useRef<MorsePlayer | null>(null);

  // Initialize and load saved stats
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('morse_trainer_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (e) {}
    
    const player = new MorsePlayer(
      wpm,
      charWpm,
      frequency,
      noiseLevel,
      volume,
      wordSpaceAuto ? 1.0 : wordSpaceMultiplier,
      edgeMs,
      outputChannel,
      opticalWpm
    );
    player.onSignalStateChange = (active, symbol, char) => {
      setIsLampFlashing(active);
      if (active) {
        if (symbol) setFlashSymbol(symbol);
        if (char) setFlashChar(char);
      }
    };
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  // Update MorsePlayer params dynamically
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setEffWPM(wpm);
      playerRef.current.setCharWPM(charWpm);
      playerRef.current.setOpticalWpm(opticalWpm);
      playerRef.current.setFrequency(frequency);
      playerRef.current.setNoiseLevel(noiseLevel);
      playerRef.current.setVolume(volume);
      playerRef.current.setWordSpaceMultiplier(wordSpaceAuto ? 1.0 : wordSpaceMultiplier);
      playerRef.current.setEdgeMs(edgeMs);
      playerRef.current.setOutputChannel(outputChannel);
    }
  }, [wpm, charWpm, opticalWpm, frequency, noiseLevel, volume, wordSpaceMultiplier, wordSpaceAuto, edgeMs, outputChannel]);

  const sequenceString = METHODS[method];

  // Adjust level boundary on method change
  useEffect(() => {
    if (level > sequenceString.length) {
      setLevel(sequenceString.length);
    }
  }, [method, sequenceString.length, level]);

  // Clean up timers/listeners on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  // Compute weakest characters for personalized remediation drills
  const weakCharacters = useMemo(() => {
    const errorMap: Record<string, { total: number; missed: number }> = {};
    for (const stat of stats) {
      if (stat.results) {
        for (const res of stat.results) {
          if (res.char && res.char.trim() !== '') {
            const ch = res.char.toUpperCase();
            if (!errorMap[ch]) errorMap[ch] = { total: 0, missed: 0 };
            errorMap[ch].total++;
            if (!res.isCorrect) errorMap[ch].missed++;
          }
        }
      }
    }
    return Object.entries(errorMap)
      .filter(([_, data]) => data.missed > 0)
      .map(([char, data]) => ({
        char,
        missed: data.missed,
        total: data.total,
        rate: Math.round((data.missed / data.total) * 100)
      }))
      .sort((a, b) => b.missed - a.missed || b.rate - a.rate)
      .slice(0, 8);
  }, [stats]);

  const generateSequence = useCallback(() => {
    if (contentType === 'custom') {
      const clean = customText.toUpperCase().trim();
      return clean || 'CQ CQ CQ DE W1AW K';
    }

    if (contentType === 'words') {
      const words: string[] = [];
      for (let i = 0; i < groupCount; i++) {
        const randWord = COMMON_CW_WORDS[Math.floor(Math.random() * COMMON_CW_WORDS.length)];
        words.push(randWord);
      }
      return words.join(' ');
    }

    if (contentType === 'qcodes') {
      const qcodes: string[] = [];
      for (let i = 0; i < groupCount; i++) {
        const randQ = Q_CODES[Math.floor(Math.random() * Q_CODES.length)];
        qcodes.push(randQ.code);
      }
      return qcodes.join(' ');
    }

    if (contentType === 'callsigns') {
      const calls: string[] = [];
      for (let i = 0; i < groupCount; i++) {
        calls.push(generateRandomCallsign());
      }
      return calls.join(' ');
    }

    if (contentType === 'weak_drill' && weakCharacters.length > 0) {
      const weakChars = weakCharacters.map(w => w.char);
      const availableChars = sequenceString.slice(0, level).split('');
      const combinedPool = Array.from(new Set([...weakChars, ...availableChars]));
      let sequence = '';
      for (let i = 0; i < groupCount; i++) {
        let group = '';
        for (let j = 0; j < groupLength; j++) {
          const pool = (Math.random() < 0.65 && weakChars.length > 0) ? weakChars : combinedPool;
          const randomChar = pool[Math.floor(Math.random() * pool.length)];
          group += randomChar;
        }
        sequence += group;
        if (i < groupCount - 1) sequence += ' ';
      }
      return sequence;
    }

    // Default 'lesson' mode:
    const availableChars = sequenceString.slice(0, level).split('');
    let sequence = '';
    for (let i = 0; i < groupCount; i++) {
      let group = '';
      for (let j = 0; j < groupLength; j++) {
        const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
        group += randomChar;
      }
      sequence += group;
      if (i < groupCount - 1) sequence += ' ';
    }
    return sequence;
  }, [contentType, customText, groupCount, groupLength, weakCharacters, sequenceString, level]);

  const handleDownloadWav = async () => {
    setIsExportingWav(true);
    try {
      const textToExport = targetSequence || generateSequence();
      const blob = await generateMorseWavBlob(
        textToExport,
        wpm,
        Math.max(charWpm, wpm),
        frequency,
        wordSpaceAuto ? 1.0 : wordSpaceMultiplier,
        edgeMs
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morse_practice_${wpm}wpm_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export WAV:', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Play congratulatory high pitch vintage chime
  const playCongratulatoryChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.frequency.setValueAtTime(1050, ctx.currentTime);
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.45);
      }, 140);
    } catch (e) {}
  };

  // Level Up handler
  const handleLevelUp = () => {
    if (level < sequenceString.length) {
      setShowLevelUpBanner(true);
      setLevel((prev) => prev + 1);
      playCongratulatoryChime();
      
      setTimeout(() => {
        setShowLevelUpBanner(false);
      }, 4000);
    }
  };

  // BATCH MODE: Play Entire Sequence
  const handleStartBatch = () => {
    if (isPlaying) {
      if (playerRef.current) playerRef.current.stop();
      setIsPlaying(false);
      return;
    }
    
    const seq = generateSequence();
    setTargetSequence(seq);
    setUserInput('');
    setResult({ score: 0, accuracy: 0, show: false });
    setIsPlaying(true);

    // Auto-focus the log entry textarea so the user can immediately log characters
    setTimeout(() => {
      batchInputRef.current?.focus();
    }, 50);
    
    if (playerRef.current) {
      playerRef.current.playSequence(seq, () => {
        setIsPlaying(false);
      });
    }
  };

  // BATCH MODE: Evaluate Textarea Transcript
  const checkBatchAnswer = () => {
    const target = targetSequence.replace(/\s/g, '');
    const user = userInput.toUpperCase().replace(/\s/g, '');
    
    let correct = 0;
    const minLen = Math.min(target.length, user.length);
    const results: Array<{ char: string; typed: string; isCorrect: boolean }> = [];
    const maxLen = Math.max(target.length, user.length);
    
    for (let i = 0; i < maxLen; i++) {
      const targetChar = target[i] || '';
      const userChar = user[i] || '';
      const isCorrect = targetChar === userChar;
      if (i < minLen && isCorrect) {
        correct++;
      }
      results.push({
        char: targetChar,
        typed: userChar,
        isCorrect
      });
    }
    
    const accuracy = target.length > 0 ? (correct / target.length) * 100 : 0;
    // Scored WPM in batch mode scales with user accuracy relative to transmission speed setting
    const scoredWpm = Math.round(wpm * (accuracy / 100));

    setResult({ score: correct, accuracy, show: true });
    
    const newStat: LevelStats = {
      level,
      method,
      accuracy,
      wpm: scoredWpm,
      mode: 'batch',
      timestamp: Date.now(),
      transmission: targetSequence,
      userTyped: userInput,
      results
    };
    
    const newStats = [...stats, newStat];
    setStats(newStats);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(newStats));
    } catch(e) {}

    if (autoAdvance && accuracy >= 90) {
      handleLevelUp();
    }
  };

  // REAL-TIME COPY TYPING: Evaluate session speed & accuracy
  const completeCopyTypingSession = (finalTyped: string[]) => {
    setCopyTypingStatus('completed');
    
    const target = targetSequence.replace(/\s/g, '');
    
    // Extract non-space entries
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
      if (i < target.length && isCorrect) {
        correct++;
      }
      results.push({
        char: targetChar,
        typed: userChar,
        isCorrect
      });
    }

    const accuracy = target.length > 0 ? (correct / target.length) * 100 : 0;
    
    // Time elapsed calculation for standard Morse speed rating
    const timeElapsedMs = Date.now() - copyTypingStartTime;
    const timeElapsedMin = Math.max(0.1, timeElapsedMs / 60000); 
    const typedWpm = Math.round((correct / 5) / timeElapsedMin);
    
    // Scale WPM relative to accuracy
    const scoredWpm = Math.min(Math.max(5, typedWpm), 60);

    setResult({ score: correct, accuracy, show: true });

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

    const updatedStats = [...stats, newStat];
    setStats(updatedStats);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(updatedStats));
    } catch (e) {}

    if (autoAdvance && accuracy >= 90) {
      handleLevelUp();
    }
  };

  // REAL-TIME COPY TYPING: Initialize Session
  const startCopyTypingSession = () => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);

    const seq = generateSequence();
    setTargetSequence(seq);
    setCopyTypingIndex(0);
    setCopyTypingTyped([]);
    setCopyTypingStatus('playing');
    setCopyTypingStartTime(Date.now());
    setResult({ score: 0, accuracy: 0, show: false });

    // Sound first character immediately after standard telegraph delay
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.playSequence(seq[0]);
      }
      if (isMobileKeyboardOpen) {
        mobileInputRef.current?.focus();
      }
    }, 450);
  };

  // REAL-TIME COPY TYPING: Handle typed key
  const handleCopyTypeChar = useCallback((char: string) => {
    if (copyTypingStatus !== 'playing') return;

    const targetChars = targetSequence.toUpperCase();
    const updatedTyped = [...copyTypingTyped];
    updatedTyped[copyTypingIndex] = char;
    setCopyTypingTyped(updatedTyped);

    const nextIndex = copyTypingIndex + 1;
    setCopyTypingIndex(nextIndex);

    // End of full ribbon session
    if (nextIndex >= targetChars.length) {
      completeCopyTypingSession(updatedTyped);
    } else {
      const nextChar = targetChars[nextIndex];
      if (nextChar === ' ') {
        // Space boundary: auto-insert and delay slightly longer for word gap
        const updatedWithSpace = [...updatedTyped];
        updatedWithSpace[nextIndex] = ' ';
        setCopyTypingTyped(updatedWithSpace);
        
        const nextNextIndex = nextIndex + 1;
        setCopyTypingIndex(nextNextIndex);

        if (nextNextIndex >= targetChars.length) {
          completeCopyTypingSession(updatedWithSpace);
        } else {
          setTimeout(() => {
            if (playerRef.current && copyTypingStatus === 'playing') {
              playerRef.current.playSequence(targetChars[nextNextIndex]);
            }
          }, 650); // Natural WWII telegraph word space delay (600-700ms)
        }
      } else {
        setTimeout(() => {
          if (playerRef.current && copyTypingStatus === 'playing') {
            playerRef.current.playSequence(nextChar);
          }
        }, 350); // Balanced character-spacing pause (300-400ms)
      }
    }
  }, [copyTypingStatus, targetSequence, copyTypingTyped, copyTypingIndex, completeCopyTypingSession]);

  // Replay current character audio / optical pulse
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
    } else if (practiceMode === 'batch') {
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

  // Skip current character
  const handleSkipCurrentChar = useCallback(() => {
    if (practiceMode !== 'copy' || copyTypingStatus !== 'playing') return;
    const targetChars = targetSequence.toUpperCase();
    const currentChar = targetChars[copyTypingIndex];
    if (!currentChar) return;

    const updatedTyped = [...copyTypingTyped];
    updatedTyped[copyTypingIndex] = '—'; // Omission mark
    setCopyTypingTyped(updatedTyped);

    const nextIndex = copyTypingIndex + 1;
    setCopyTypingIndex(nextIndex);

    if (nextIndex >= targetChars.length) {
      completeCopyTypingSession(updatedTyped);
    } else {
      const nextChar = targetChars[nextIndex];
      if (nextChar === ' ') {
        const updatedWithSpace = [...updatedTyped];
        updatedWithSpace[nextIndex] = ' ';
        setCopyTypingTyped(updatedWithSpace);
        const nextNextIndex = nextIndex + 1;
        setCopyTypingIndex(nextNextIndex);
        if (nextNextIndex >= targetChars.length) {
          completeCopyTypingSession(updatedWithSpace);
        } else {
          setTimeout(() => {
            if (playerRef.current && copyTypingStatus === 'playing') {
              playerRef.current.playSequence(targetChars[nextNextIndex]);
            }
          }, 650);
        }
      } else {
        setTimeout(() => {
          if (playerRef.current && copyTypingStatus === 'playing') {
            playerRef.current.playSequence(nextChar);
          }
        }, 350);
      }
    }
  }, [practiceMode, copyTypingStatus, targetSequence, copyTypingIndex, copyTypingTyped, completeCopyTypingSession]);


  // REVERSE LEARNING (ENCODING) MODE
  const generateReverseSequence = (count: number = 15) => {
    const availableChars = sequenceString.slice(0, level).split('');
    let seq = '';
    for (let i = 0; i < count; i++) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      seq += randomChar;
    }
    return seq;
  };

  const startReverseSession = () => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);

    const seq = generateReverseSequence(reverseCount);
    setReverseSequence(seq);
    setTargetSequence(seq);
    setReverseIndex(0);
    setReverseCurrentCode('');
    setReverseEntries([]);
    setReverseStatus('playing');
    setReverseStartTime(Date.now());
    setReverseFeedback({ status: 'none' });
    setResult({ score: 0, accuracy: 0, show: false });
  };

  const completeReverseSession = (finalEntries: Array<{ char: string; typedCode: string; expectedCode: string; isCorrect: boolean }>) => {
    setReverseStatus('completed');

    let correct = 0;
    for (const e of finalEntries) {
      if (e.isCorrect) correct++;
    }

    const total = finalEntries.length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    const timeElapsedMs = Date.now() - reverseStartTime;
    const timeElapsedMin = Math.max(0.1, timeElapsedMs / 60000);
    const typedWpm = Math.round((correct / 5) / timeElapsedMin);
    const scoredWpm = Math.min(Math.max(5, typedWpm), 60);

    setResult({ score: correct, accuracy, show: true });

    const newStat: LevelStats = {
      level,
      method,
      accuracy,
      wpm: scoredWpm,
      mode: 'reverse',
      timestamp: Date.now(),
      transmission: reverseSequence,
      userTyped: finalEntries.map(e => e.typedCode || '—').join(' '),
      results: finalEntries.map(e => ({
        char: e.char,
        typed: e.typedCode ? (REVERSE_MORSE_MAP[e.typedCode] || e.typedCode) : '—',
        isCorrect: e.isCorrect
      }))
    };

    const updatedStats = [...stats, newStat];
    setStats(updatedStats);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(updatedStats));
    } catch (e) {}

    if (autoAdvance && accuracy >= 90) {
      handleLevelUp();
    }
  };

  const handleEvaluateReverseChar = useCallback((
    currentChar: string,
    typedCode: string,
    expectedCode: string,
    isSkipped: boolean = false
  ) => {
    const isCorrect = !isSkipped && typedCode === expectedCode;
    const newEntry = {
      char: currentChar,
      typedCode,
      expectedCode,
      isCorrect
    };
    const updatedEntries = [...reverseEntries, newEntry];
    setReverseEntries(updatedEntries);

    if (isCorrect) {
      setReverseFeedback({ status: 'correct', message: 'Correct!' });
      if (reverseSoundEnabled && playerRef.current) {
        playerRef.current.playSuccessTone();
      }
    } else {
      setReverseFeedback({
        status: 'incorrect',
        message: isSkipped ? `Skipped! Expected: ${expectedCode}` : `Discrepancy! Expected: ${expectedCode}`,
        targetCode: expectedCode
      });
      if (reverseSoundEnabled && playerRef.current) {
        playerRef.current.playErrorTone();
      }
    }

    const nextIdx = reverseIndex + 1;
    const delay = isCorrect ? 300 : 900;

    setTimeout(() => {
      if (nextIdx >= reverseSequence.length) {
        completeReverseSession(updatedEntries);
      } else {
        setReverseIndex(nextIdx);
        setReverseCurrentCode('');
        setReverseFeedback({ status: 'none' });
      }
    }, delay);
  }, [reverseEntries, reverseSoundEnabled, reverseIndex, reverseSequence, reverseStartTime, level, method, autoAdvance, stats]);

  const handleKeyDit = useCallback(() => {
    if (reverseStatus !== 'playing') return;
    if (reverseFeedback.status !== 'none') return;

    if (reverseSoundEnabled && playerRef.current) {
      playerRef.current.playDit();
    }

    setDitActive(true);
    setTimeout(() => setDitActive(false), 120);

    const currentChar = reverseSequence[reverseIndex];
    if (!currentChar) return;

    const expected = MORSE_CODE[currentChar.toUpperCase()] || '';
    const newCode = reverseCurrentCode + '.';
    setReverseCurrentCode(newCode);

    if (reverseAutoAdvance && newCode === expected) {
      handleEvaluateReverseChar(currentChar, newCode, expected);
    }
  }, [reverseStatus, reverseFeedback.status, reverseSoundEnabled, reverseSequence, reverseIndex, reverseCurrentCode, reverseAutoAdvance, handleEvaluateReverseChar]);

  const handleKeyDah = useCallback(() => {
    if (reverseStatus !== 'playing') return;
    if (reverseFeedback.status !== 'none') return;

    if (reverseSoundEnabled && playerRef.current) {
      playerRef.current.playDah();
    }

    setDahActive(true);
    setTimeout(() => setDahActive(false), 180);

    const currentChar = reverseSequence[reverseIndex];
    if (!currentChar) return;

    const expected = MORSE_CODE[currentChar.toUpperCase()] || '';
    const newCode = reverseCurrentCode + '-';
    setReverseCurrentCode(newCode);

    if (reverseAutoAdvance && newCode === expected) {
      handleEvaluateReverseChar(currentChar, newCode, expected);
    }
  }, [reverseStatus, reverseFeedback.status, reverseSoundEnabled, reverseSequence, reverseIndex, reverseCurrentCode, reverseAutoAdvance, handleEvaluateReverseChar]);

  const handleBackspaceCode = useCallback(() => {
    if (reverseStatus !== 'playing' || reverseFeedback.status !== 'none') return;
    setReverseCurrentCode(prev => prev.slice(0, -1));
  }, [reverseStatus, reverseFeedback.status]);

  const handleClearCode = useCallback(() => {
    if (reverseStatus !== 'playing' || reverseFeedback.status !== 'none') return;
    setReverseCurrentCode('');
  }, [reverseStatus, reverseFeedback.status]);

  const handleSubmitCode = useCallback(() => {
    if (reverseStatus !== 'playing' || reverseFeedback.status !== 'none') return;
    const currentChar = reverseSequence[reverseIndex];
    if (!currentChar) return;
    const expected = MORSE_CODE[currentChar.toUpperCase()] || '';
    handleEvaluateReverseChar(currentChar, reverseCurrentCode, expected);
  }, [reverseStatus, reverseFeedback.status, reverseSequence, reverseIndex, reverseCurrentCode, handleEvaluateReverseChar]);

  const handleSkipReverseChar = useCallback(() => {
    if (reverseStatus !== 'playing' || reverseFeedback.status !== 'none') return;
    const currentChar = reverseSequence[reverseIndex];
    if (!currentChar) return;
    const expected = MORSE_CODE[currentChar.toUpperCase()] || '';
    handleEvaluateReverseChar(currentChar, reverseCurrentCode, expected, true);
  }, [reverseStatus, reverseFeedback.status, reverseSequence, reverseIndex, reverseCurrentCode, handleEvaluateReverseChar]);

  // Helper function to format input log entry text into word-sized blocks (e.g. 5 chars)
  const formatToChunks = (text: string, size: number) => {
    const isTrailingSpace = text.endsWith(' ');
    const clean = text.replace(/\s/g, '');
    const chunks = [];
    for (let i = 0; i < clean.length; i += size) {
      chunks.push(clean.slice(i, i + size));
    }
    let formatted = chunks.join(' ');
    if (isTrailingSpace && clean.length > 0 && clean.length % size === 0) {
      formatted += ' ';
    }
    return formatted;
  };

  // Helper function to evaluate comparative metrics
  const getComparisonData = () => {
    if (practiceMode === 'reverse') {
      return reverseEntries.map((entry, idx) => ({
        index: idx,
        targetChar: entry.char,
        userChar: entry.typedCode ? `${entry.typedCode} (${REVERSE_MORSE_MAP[entry.typedCode] || '?'})` : '—',
        isCorrect: entry.isCorrect,
      }));
    }

    const target = targetSequence.toUpperCase().replace(/\s/g, '').split('');
    let user: string[] = [];
    if (practiceMode === 'batch') {
      user = userInput.toUpperCase().replace(/\s/g, '').split('');
    } else {
      const targetChars = targetSequence.split('');
      for (let i = 0; i < targetChars.length; i++) {
        if (targetChars[i] !== ' ') {
          user.push((copyTypingTyped[i] || '').toUpperCase());
        }
      }
    }

    return target.map((targetChar, idx) => {
      const userChar = user[idx] || '';
      const isCorrect = targetChar === userChar;
      return {
        index: idx,
        targetChar,
        userChar,
        isCorrect,
      };
    });
  };

  const handleOpenMobileKeyboard = () => {
    setIsMobileKeyboardOpen(true);
    setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 150);
  };

  const handleCloseMobileKeyboard = () => {
    setIsMobileKeyboardOpen(false);
    mobileInputRef.current?.blur();
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const lastChar = val[val.length - 1].toUpperCase();
    if (lastChar === ' ' || lastChar === '.' || lastChar === ',' || lastChar === '?' || lastChar === '/' || lastChar === '=' || /^[A-Z0-9]$/.test(lastChar)) {
      handleCopyTypeChar(lastChar);
    }
    e.target.value = ''; // Clear buffer
  };

  // Capture global key presses in real-time Copy Typing mode
  useEffect(() => {
    if (practiceMode !== 'copy' || copyTypingStatus !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      const key = e.key.toUpperCase();
      
      // Let standard backspace cancel current typing or reset previous letter if needed,
      // but standard radiotelegraphy copy streams advance in one-direction only.
      if (key === ' ' || key === '.' || key === ',' || key === '?' || key === '/' || key === '=' || /^[A-Z0-9]$/.test(key)) {
        e.preventDefault();
        handleCopyTypeChar(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [practiceMode, copyTypingStatus, copyTypingIndex, targetSequence, copyTypingTyped, copyTypingStartTime, handleCopyTypeChar]);

  // Capture global key presses in Reverse Learning (Encoding) mode
  useEffect(() => {
    if (practiceMode !== 'reverse' || reverseStatus !== 'playing') return;

    const handleReverseKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;
      const lower = key.toLowerCase();

      // Dit triggers: '.' or 'j' or 'd' or '['
      if (key === '.' || lower === 'j' || lower === 'd' || key === '[') {
        e.preventDefault();
        handleKeyDit();
      }
      // Dah triggers: '-' or '_' or 'k' or 'f' or ']' or ' ' (Space)
      else if (key === '-' || key === '_' || lower === 'k' || lower === 'f' || key === ']' || key === ' ') {
        e.preventDefault();
        handleKeyDah();
      }
      // Backspace
      else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspaceCode();
      }
      // Clear / Reset
      else if (key === 'Escape' || lower === 'c') {
        e.preventDefault();
        handleClearCode();
      }
      // Submit / Enter
      else if (key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      }
    };

    window.addEventListener('keydown', handleReverseKeyDown);
    return () => {
      window.removeEventListener('keydown', handleReverseKeyDown);
    };
  }, [practiceMode, reverseStatus, handleKeyDit, handleKeyDah, handleBackspaceCode, handleClearCode, handleSubmitCode]);

  // Capture Ctrl+F1 keyboard shortcut for starting/stopping transmission sessions
  useEffect(() => {
    const handleTrainerKeys = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isF1 = e.key === 'F1' || e.code === 'F1';

      if (isCtrlOrCmd && isF1) {
        e.preventDefault();
        e.stopPropagation();
        if (practiceMode === 'batch') {
          handleStartBatch();
        } else if (practiceMode === 'copy') {
          if (copyTypingStatus === 'playing') {
            setCopyTypingStatus('idle');
          } else {
            startCopyTypingSession();
          }
        } else if (practiceMode === 'reverse') {
          if (reverseStatus === 'playing') {
            setReverseStatus('idle');
          } else {
            startReverseSession();
          }
        }
      }
    };

    window.addEventListener('keydown', handleTrainerKeys);
    return () => {
      window.removeEventListener('keydown', handleTrainerKeys);
    };
  }, [practiceMode, copyTypingStatus, reverseStatus, isPlaying, userInput, targetSequence, level, groupCount, groupLength, charWpm, wpm, wordSpaceAuto, wordSpaceMultiplier, frequency, noiseLevel, volume, edgeMs, reverseCount]);

  // Reset metrics
  const resetStats = () => {
    if (window.confirm("Are you sure you want to delete all historical practice logs? This cannot be undone.")) {
      setStats([]);
      try {
        localStorage.removeItem('morse_trainer_stats');
      } catch (e) {}
    }
  };

  const currentChars = sequenceString.slice(0, level).split('').join(' ');
  
  // High scores filtering
  const currentLevelStats = stats.filter(s => s.method === method && s.level === level);
  const bestAccuracy = currentLevelStats.length > 0 ? Math.max(...currentLevelStats.map(s => s.accuracy)) : null;

  // Immersive Telegraph Operator Ranks
  const maxWpmScored = useMemo(() => {
    return stats.length > 0 ? Math.max(...stats.map(s => s.wpm || 0)) : 0;
  }, [stats]);

  const operatorRank = useMemo(() => {
    if (maxWpmScored === 0) return { title: "Station X Trainee", icon: "badge", desc: "Report to Operations HQ. Complete your first practice transmission to receive your assignment." };
    if (maxWpmScored < 10) return { title: "Novice Telegrapher (Straight Key)", icon: "keyboard", desc: "Building core hand-ear muscle memory. Operating a classic brass straight key." };
    if (maxWpmScored < 15) return { title: "Radio Transcriber (Cootie Key)", icon: "radio", desc: "Decoding tactical battlefield communications. Swiping letters on a double-speed keyer." };
    if (maxWpmScored < 22) return { title: "Station X Officer (Semi-Auto Bug)", icon: "campaign", desc: "Wartime intelligence officer decoding intercepted ciphers under stressful noise." };
    if (maxWpmScored < 30) return { title: "Cipher Commander (Electronic Keyer)", icon: "bolt", desc: "Elite dispatch leader overseeing critical cryptographic networks and high-priority cables." };
    return { title: "Master Codebreaker (High-Speed Operator)", icon: "military_tech", desc: "Legendary decrypter. Capable of flawless copy speeds matching automated wartime transmitters." };
  }, [maxWpmScored]);

  // MATH FOR HISTORY GRAPH
  const chartData = useMemo(() => {
    const filtered = stats.filter(s => s.method === method);
    return filtered.slice(-12); // Show last 12 entries
  }, [stats, method]);

  const svgChart = useMemo(() => {
    if (chartData.length === 0) return null;

    const width = 500;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    // Get value bounds based on metric tab
    let minY = 0;
    let maxY = 100;

    if (chartMetric === 'wpm') {
      const maxW = Math.max(...chartData.map(d => d.wpm || 0));
      maxY = Math.max(25, Math.ceil(maxW / 5) * 5);
    } else if (chartMetric === 'level') {
      const maxL = Math.max(...chartData.map(d => d.level));
      maxY = Math.max(10, Math.ceil(maxL / 5) * 5);
    }

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Compute coordinate mapping
    const points = chartData.map((d, i) => {
      let val = chartMetric === 'accuracy' ? d.accuracy : chartMetric === 'wpm' ? d.wpm : d.level;
      if (typeof val !== 'number' || isNaN(val)) {
        val = 0;
      }
      const x = paddingLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * chartWidth : 0);
      const denominator = (maxY - minY) || 1;
      const y = height - paddingBottom - ((val - minY) / denominator) * chartHeight;
      return {
        x: isFinite(x) ? x : paddingLeft,
        y: isFinite(y) ? y : height - paddingBottom,
        data: d,
        index: i
      };
    });

    // Make continuous bezier curve or direct path line
    let pathD = '';
    let areaD = '';

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
      
      areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    return { points, pathD, areaD, minY, maxY, paddingLeft, paddingRight, paddingTop, paddingBottom, width, height, chartWidth, chartHeight };
  }, [chartData, chartMetric]);

  if (viewLayout === 'simplified') {
    return (
      <SimplifiedMorseTrainer
        onSwitchToAdvanced={() => handleSetViewLayout('advanced')}
        method={method}
        setMethod={setMethod}
        level={level}
        setLevel={setLevel}
        wpm={wpm}
        setWpm={setWpm}
        charWpm={charWpm}
        setCharWpm={setCharWpm}
        outputChannel={outputChannel}
        setOutputChannel={setOutputChannel}
        autoAdvance={autoAdvance}
        setAutoAdvance={setAutoAdvance}
        stats={stats}
        setStats={setStats}
        sequenceString={sequenceString}
        playerRef={playerRef}
        isLampFlashing={isLampFlashing}
        setIsLampFlashing={setIsLampFlashing}
        flashSymbol={flashSymbol}
        setFlashSymbol={setFlashSymbol}
        flashChar={flashChar}
        setFlashChar={setFlashChar}
        opticalFilter={opticalFilter}
        setOpticalFilter={setOpticalFilter}
        opticalBrightness={opticalBrightness}
        setOpticalBrightness={setOpticalBrightness}
        opticalWpm={opticalWpm}
        setOpticalWpm={setOpticalWpm}
        showTransmittedChar={showTransmittedChar}
        setShowTransmittedChar={setShowTransmittedChar}
        frequency={frequency}
        setFrequency={setFrequency}
        noiseLevel={noiseLevel}
        setNoiseLevel={setNoiseLevel}
        cipherTape={cipherTape}
        onLoadCiphertextToMachine={onLoadCiphertextToMachine}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16 relative">
      
      {/* Level Up Banner Overlay */}
      {showLevelUpBanner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/75 z-50 p-4 animate-fadeIn">
          <div className={`${t.panelBg} border-2 ${t.borderAccent} rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${t.bgAccentSolid}`} />
            <span className={`material-symbols-outlined text-5xl ${t.textAccent} animate-bounce`}>military_tech</span>
            <h2 className={`${t.fontHeader} font-bold text-2xl ${t.textPrimary} tracking-wider`}>LEVEL COMPLETED!</h2>
            <div className={`h-0.5 ${t.panelBg} my-2`} />
            <p className={`text-sm ${t.textMuted} leading-relaxed`}>
              Congratulations operator! You cracked the code and reached <strong className={`${t.textAccent}`}>Level {level}</strong>. 
            </p>
            <p className={`text-xs ${t.textMuted} italic`}>
              "The speed and volume of intercepted teleprinter signals demands our utmost rigor."
            </p>
            <button
              onClick={() => setShowLevelUpBanner(false)}
              className={`mt-4 px-6 py-2 ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white rounded border ${t.borderAccent} text-xs font-bold ${t.fontHeader} cursor-pointer uppercase tracking-wider transition-colors`}
            >
              Resume Interception Desk
            </button>
          </div>
        </div>
      )}

      {/* Header Desk */}
      <div className={`border-b ${t.borderBase} pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <h1 className={`text-ui-header ${t.fontHeader} font-bold ${t.textSecondary} text-2xl flex items-center gap-2`}>
            <span className={`material-symbols-outlined text-2xl ${t.textAccent}`}>school</span>
            Tactical Morse Training Desk
          </h1>
          <p className={`text-ui-body ${t.fontBody} ${t.textMuted} text-xs`}>
            Build auditory telegraph muscle-memory. Perfect the dits and dahs required for wartime intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSetViewLayout('simplified')}
            className={`px-3 py-1.5 text-xs ${t.fontHeader} font-bold rounded-lg border ${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs`}
            title="Switch to streamlined focus training view"
          >
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>Simplified Focus View</span>
          </button>

          {/* Level Banner badge */}
          <div className={`flex items-center gap-2 ${t.panelBg} px-3 py-1.5 rounded-lg border ${t.borderBase} shrink-0`}>
            <span className={`text-[10px] uppercase ${t.fontMono} ${t.textMuted} tracking-wider`}>Level Progress</span>
            <span className={`${t.textAccentStrong} text-sm font-bold font-mono`}>{level} / {sequenceString.length}</span>
          </div>
        </div>
      </div>

      {/* Operator Rank Badge Card */}
      <div className={`${t.panelBg} border-2 ${t.borderAccent}/40 rounded-lg p-4 shadow-panel flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-full ${t.panelBg} flex items-center justify-center ${t.textAccent} border ${t.borderAccent}`}>
          <span className="material-symbols-outlined text-3xl">{operatorRank.icon}</span>
        </div>
        <div className="space-y-0.5">
          <span className={`text-[9px] uppercase tracking-wider ${t.fontMono} ${t.textAccent}`}>Active Operator Assignment</span>
          <h3 className={`${t.fontHeader} font-bold text-sm ${t.textPrimary}`}>{operatorRank.title}</h3>
          <p className={`text-[11px] ${t.textMuted} leading-relaxed max-w-2xl`}>{operatorRank.desc} <strong className={`${t.textPrimary}`}>Best Speed: {maxWpmScored} WPM.</strong></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Radio Instrument Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Method and Speed Instrument dials */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel ${t.appTexture} space-y-4`}>
            <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider pb-1.5 border-b ${t.borderBase} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-xs">tune</span>
              Telegrapher Speeds & System Settings
            </h3>

            {/* Method switch buttons */}
            <div className="space-y-1.5">
              <span className={`text-[9px] ${t.fontMono} ${t.textMuted} uppercase block`}>Training Curriculum Method</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMethod('koch')}
                  className={`py-1.5 ${t.fontHeader} font-bold text-xs rounded border transition-colors cursor-pointer ${
                    method === 'koch' 
                      ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent}`
                      : `${t.panelInner} ${t.textMuted} ${t.borderBase} hover:${t.textPrimary}`
                  }`}
                  title="The Koch method introduces characters one by one at full target speed."
                >
                  Koch Standard
                </button>
                <button
                  onClick={() => setMethod('lcwo')}
                  className={`py-1.5 ${t.fontHeader} font-bold text-xs rounded border transition-colors cursor-pointer ${
                    method === 'lcwo' 
                      ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent}`
                      : `${t.panelInner} ${t.textMuted} ${t.borderBase} hover:${t.textPrimary}`
                  }`}
                  title="LCWO (Learn Code Quick Online) standard character ordering sequence."
                >
                  LCWO Standard
                </button>
              </div>
            </div>

            {/* Sliders desk */}
            <div className="space-y-3.5">
              
              {/* Level select */}
              <div className="space-y-1">
                <div className={`flex justify-between items-center text-xs ${t.fontMono} ${t.textMuted}`}>
                  <span>Lesson Characters Level</span>
                  <div className="flex items-center gap-1.5">
                    {bestAccuracy !== null && (
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border shadow-xs tracking-tight ${
                        bestAccuracy >= 90 
                          ? t.successBadge
                          : t.dangerBadge
                      }`}>
                        Best: {bestAccuracy.toFixed(0)}%
                      </span>
                    )}
                    <span className={`${t.textAccentStrong} font-bold ${t.panelBg} px-1.5 py-0.5 rounded border ${t.borderBase}`}>{level}</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max={sequenceString.length} 
                  value={level} 
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                />
                <div className={`text-[11px] font-mono ${t.textMuted} break-all p-2 ${t.panelInner} rounded border ${t.borderBase} leading-relaxed`}>
                  Characters in current pool: <strong className={`${t.textPrimary}`}>{currentChars}</strong>
                </div>
              </div>

              {/* Autoadvance option */}
              <div className={`flex items-center justify-between p-2.5 ${t.panelInner} rounded border ${t.borderBase}`}>
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold ${t.textPrimary} ${t.fontHeader}`}>Auto-Advance Lesson Level</span>
                  <span className={`text-[9px] ${t.textMuted}`}>Automatically increment level on getting ≥90% accuracy.</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAdvance}
                  onClick={() => setAutoAdvance((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 ${
                    autoAdvance
                      ? `${t.bgAccentSolid} ${t.borderAccent || t.borderBase}`
                      : `${t.panelBg} ${t.borderBase}`
                  }`}
                  title={autoAdvance ? 'Disable Auto-Advance' : 'Enable Auto-Advance'}
                >
                  <span className="sr-only">Auto-Advance Lesson Level</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-md transition-transform duration-200 ease-in-out mt-[2px] ${
                      autoAdvance
                        ? 'translate-x-[18px] bg-white'
                        : 'translate-x-[2px] bg-zinc-400 dark:bg-zinc-500'
                    }`}
                  />
                </button>
              </div>

              {/* Telegraph Signal Parameters Desk */}
              <div className={`space-y-4 pt-2 border-t ${t.borderBase}`}>
                <div className={`text-[10px] uppercase font-mono ${t.textSecondary} font-bold flex items-center gap-1.5 pb-1`}>
                  <span className={`material-symbols-outlined text-xs ${t.textSecondary} animate-spin-slow`}>tune</span>
                  <span>Telegraph Signal Parameters Desk:</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Speed */}
                  <div className="space-y-1">
                    <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      <span className={`font-bold ${t.textPrimary}`}>Speed:</span>
                      <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono font-bold`}>{charWpm} WpM</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      value={charWpm} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCharWpm(val);
                        if (wpm > val) setWpm(val);
                      }}
                      className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                    />
                  </div>

                  {/* eff. Speed */}
                  <div className="space-y-1">
                    <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      <span className={`font-bold ${t.textPrimary}`}>eff. Speed:</span>
                      <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono font-bold`}>{wpm} WpM</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      value={wpm} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setWpm(val);
                        if (val > charWpm) setCharWpm(val);
                      }}
                      className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Word space */}
                  <div className="space-y-1.5">
                    <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      <span className={`font-bold ${t.textPrimary}`}>Word space:</span>
                      <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono font-bold`}>
                        {wordSpaceAuto ? 'Auto / Standard' : `${wordSpaceMultiplier.toFixed(1)} x`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className={`flex items-center gap-1.5 cursor-pointer text-[10px] ${t.textPrimary} select-none ${t.panelInner} px-2 py-1 rounded border ${t.borderBase} hover:opacity-90`}>
                        <input
                          type="checkbox"
                          checked={wordSpaceAuto}
                          onChange={(e) => setWordSpaceAuto(e.target.checked)}
                          className={`${t.sliderAccent} rounded ${t.panelBg} w-3.5 h-3.5 cursor-pointer`}
                        />
                        <span className={`font-bold ${t.textPrimary}`}>Standard / Auto</span>
                      </label>
                    </div>

                    {!wordSpaceAuto ? (
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.5"
                        value={wordSpaceMultiplier} 
                        onChange={(e) => setWordSpaceMultiplier(parseFloat(e.target.value))}
                        className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                      />
                    ) : (
                      <div className={`h-1 ${t.panelInner} rounded-lg w-full`} />
                    )}

                    <div className={`text-[9px] ${t.textMuted} leading-tight font-sans`}>
                      Standard / Auto setting means the program uses precise ratios according to the official international Morse standard, where pauses automatically scale with the set transmission speed.
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-1">
                    <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      <span className={`font-bold ${t.textPrimary}`}>Frequency:</span>
                      <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono font-bold`}>{frequency} Hz</span>
                    </div>
                    <input 
                      type="range" 
                      min="400" 
                      max="1000" 
                      step="20"
                      value={frequency} 
                      onChange={(e) => setFrequency(parseInt(e.target.value))}
                      className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Edge */}
                  <div className="space-y-1">
                    <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      <span className={`font-bold ${t.textPrimary}`}>Edge:</span>
                      <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono font-bold`}>{edgeMs}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      step="1"
                      value={edgeMs} 
                      onChange={(e) => setEdgeMs(parseInt(e.target.value))}
                      className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                    />
                  </div>

                  {/* Volume */}
                  <div className="space-y-1">
                    <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                      <span className={`font-bold ${t.textPrimary}`}>Volume:</span>
                      <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono font-bold`}>{Math.round(volume * 100)} %</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                    />
                  </div>
                </div>

                {/* Radio static */}
                <div className="space-y-1">
                  <div className={`flex justify-between items-center text-[10px] ${t.fontMono} ${t.textMuted}`}>
                    <span className={`font-bold ${t.textPrimary}`}>Atmospheric Static Noise</span>
                    <span className={`${t.textPrimary} ${t.panelInner} px-1.5 py-0.5 rounded border ${t.borderBase} font-mono`}>{Math.round(noiseLevel * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.8" 
                    step="0.05"
                    value={noiseLevel} 
                    onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                    className={`w-full h-1 ${t.panelInner} rounded-lg cursor-pointer`}
                  />
                </div>
              </div>

              {/* Group lengths */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-[9px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block mb-1`}>Words Count</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="30" 
                    value={groupCount}
                    onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 5))}
                    className={`w-full ${t.panelInner} border ${t.borderBase} rounded p-1.5 ${t.textPrimary} font-mono text-center text-xs focus:${t.borderAccent} focus:outline-none`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider block mb-1`}>Word Size</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="8" 
                    value={groupLength}
                    onChange={(e) => setGroupLength(Math.max(1, parseInt(e.target.value) || 5))}
                    className={`w-full ${t.panelInner} border ${t.borderBase} rounded p-1.5 ${t.textPrimary} font-mono text-center text-xs focus:${t.borderAccent} focus:outline-none`}
                  />
                </div>
              </div>

              {/* Output Channel (Audio vs Optical Light vs Dual) */}
              <div className={`space-y-2 pt-3 border-t ${t.borderBase}`}>
                <div className={`flex justify-between items-center text-[10px] font-mono ${t.textSecondary} font-bold uppercase tracking-wider`}>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-amber-500">sensors</span>
                    Signaling Transmission Medium
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                    outputChannel === 'optical' 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                      : outputChannel === 'audio'
                        ? `${t.panelInner} ${t.textMuted} ${t.borderBase}`
                        : `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent}`
                  }`}>
                    {outputChannel === 'optical' ? 'Soundless Light' : outputChannel === 'audio' ? 'Audio Only' : 'Dual Synced'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOutputChannel('audio')}
                    className={`py-2 text-[10px] font-bold ${t.fontHeader} rounded border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      outputChannel === 'audio'
                        ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent}`
                        : `${t.panelInner} ${t.textMuted} ${t.borderBase} hover:${t.textPrimary}`
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                    <span>Audio Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputChannel('optical')}
                    className={`py-2 text-[10px] font-bold ${t.fontHeader} rounded border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      outputChannel === 'optical'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500 font-bold shadow-xs'
                        : `${t.panelInner} ${t.textMuted} ${t.borderBase} hover:${t.textPrimary}`
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">flare</span>
                    <span>Soundless Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputChannel('both')}
                    className={`py-2 text-[10px] font-bold ${t.fontHeader} rounded border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      outputChannel === 'both'
                        ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent}`
                        : `${t.panelInner} ${t.textMuted} ${t.borderBase} hover:${t.textPrimary}`
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">sync</span>
                    <span>Dual (Sound+Light)</span>
                  </button>
                </div>

                {/* Sub-controls when Optical or Dual is selected */}
                {outputChannel !== 'audio' && (
                  <div className={`p-2.5 rounded border ${t.borderBase} ${t.panelInner} space-y-2.5 mt-2`}>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className={`font-bold ${t.textPrimary}`}>Flash Frequency (Optical WPM):</span>
                        <span className={`${t.textAccentStrong} font-bold`}>{opticalWpm} WPM ({Math.round(1200 / opticalWpm)}ms Dit)</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        step="1"
                        value={opticalWpm}
                        onChange={(e) => setOpticalWpm(parseInt(e.target.value, 10))}
                        className={`w-full h-1.5 ${t.panelBg} rounded cursor-pointer accent-amber-500`}
                      />
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {[
                          { label: '3 WPM (Slow 400ms)', wpmVal: 3 },
                          { label: '4 WPM (4 WPM)', wpmVal: 4 },
                          { label: '5 WPM (Human Std 240ms)', wpmVal: 5 },
                          { label: '6 WPM (6 WPM)', wpmVal: 6 },
                          { label: '8 WPM (Optimal 150ms)', wpmVal: 8 }
                        ].map((p) => (
                          <button
                            key={p.wpmVal}
                            type="button"
                            onClick={() => setOpticalWpm(p.wpmVal)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                              opticalWpm === p.wpmVal
                                ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} font-bold shadow-xs`
                                : `${t.panelBg} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <p className={`text-[9.5px] ${t.textMuted} leading-tight pt-0.5`}>
                        <span className="text-amber-500 font-bold">Visual Perception Rule:</span> Human eye & shutter perception requires lower frequencies than acoustic CW. The <strong>3–8 WPM</strong> range prevents visual persistence blur.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-300">
                        Show Transmitted Character Hint
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTransmittedChar((prev) => !prev)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          showTransmittedChar
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : `${t.panelBg} ${t.borderBase} ${t.textMuted}`
                        }`}
                      >
                        {showTransmittedChar ? 'Hint Visible' : 'Hint Hidden'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* WAV Export Desk */}
              <div className={`pt-2 border-t ${t.borderBase}`}>
                <button
                  type="button"
                  onClick={handleDownloadWav}
                  disabled={isExportingWav}
                  className={`w-full py-2 px-3 rounded border text-[11px] ${t.fontHeader} font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isExportingWav
                      ? `${t.panelInner} ${t.textMuted} ${t.borderBase} cursor-wait`
                      : `${t.panelInner} ${t.textSecondary} ${t.borderBase} hover:${t.borderAccent} hover:${t.textAccentStrong}`
                  }`}
                  title="Export currently configured practice sequence to high-fidelity standalone WAV audio file"
                >
                  <span className={`material-symbols-outlined text-sm ${isExportingWav ? 'animate-spin' : t.textAccent}`}>
                    {isExportingWav ? 'progress_activity' : 'download'}
                  </span>
                  <span>{isExportingWav ? 'Synthesizing Studio WAV...' : 'Download Practice Audio (.WAV)'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column - Telegraph Practice Room */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Practice Mode Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                if (copyTypingStatus === 'playing') setCopyTypingStatus('idle');
                if (reverseStatus === 'playing') setReverseStatus('idle');
                setPracticeMode('batch');
                setResult({ score: 0, accuracy: 0, show: false });
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
                <div className="text-[10px] opacity-75 font-mono truncate">Transcribe 5-letter blocks</div>
              </div>
            </button>

            <button
              onClick={() => {
                if (isPlaying) {
                  if (playerRef.current) playerRef.current.stop();
                  setIsPlaying(false);
                }
                if (reverseStatus === 'playing') setReverseStatus('idle');
                setPracticeMode('copy');
                setResult({ score: 0, accuracy: 0, show: false });
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
                <div className="text-[10px] opacity-75 font-mono truncate">Hear & type instantly</div>
              </div>
            </button>

            <button
              onClick={() => {
                if (isPlaying) {
                  if (playerRef.current) playerRef.current.stop();
                  setIsPlaying(false);
                }
                if (copyTypingStatus === 'playing') setCopyTypingStatus('idle');
                setPracticeMode('reverse');
                setResult({ score: 0, accuracy: 0, show: false });
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
                <div className="text-[10px] opacity-75 font-mono truncate">Send with paddle or key</div>
              </div>
            </button>
          </div>

          {/* Content Curriculum & Vocabulary Selection (Compact & Scannable) */}
          <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-3 sm:p-4 shadow-panel ${t.appTexture} space-y-2.5`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 border-b ${t.borderBase}`}>
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>menu_book</span>
                <span className={`text-xs font-bold ${t.fontHeader} ${t.textPrimary} uppercase tracking-wider`}>
                  Transmission Vocabulary & Source
                </span>
              </div>
              {weakCharacters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setContentType('weak_drill')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                    contentType === 'weak_drill'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                      : `${t.panelInner} ${t.textAccentStrong} ${t.borderAccent} hover:opacity-90`
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">healing</span>
                  <span>{weakCharacters.length} Weak Chars Detected</span>
                </button>
              )}
            </div>

            {/* Content Type Selector Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'lesson', label: 'Curriculum', icon: 'school' },
                { id: 'words', label: '100+ Words', icon: 'format_list_bulleted' },
                { id: 'qcodes', label: 'Q-Codes', icon: 'tag' },
                { id: 'callsigns', label: 'Callsigns', icon: 'radio' },
                { id: 'weak_drill', label: 'Weak Chars', icon: 'psychology' },
                { id: 'custom', label: 'Custom', icon: 'edit_note' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setContentType(item.id as PracticeContentType);
                    if (isPlaying && playerRef.current) {
                      playerRef.current.stop();
                      setIsPlaying(false);
                    }
                  }}
                  className={`py-1.5 px-1 text-[10px] font-bold ${t.fontHeader} rounded border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 ${
                    contentType === item.id
                      ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} shadow-xs`
                      : `${t.panelInner} ${t.textMuted} ${t.borderBase} hover:${t.textPrimary}`
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">{item.icon}</span>
                  <span className="leading-tight truncate w-full">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Custom text input box */}
            {contentType === 'custom' && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center">
                  <label className={`text-[9px] font-mono ${t.textMuted} uppercase tracking-wider`}>Custom Transmission Text</label>
                  <span className={`text-[9px] font-mono ${t.textMuted}`}>{customText.length} chars</span>
                </div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                  placeholder="E.g. CQ CQ CQ DE W1AW K OR SOS"
                  className={`w-full ${t.panelInner} border ${t.borderBase} rounded p-1.5 text-xs font-mono ${t.textPrimary} focus:${t.borderAccent} focus:outline-none`}
                />
              </div>
            )}

            {/* Weak characters badge preview */}
            {contentType === 'weak_drill' && (
              <div className={`p-2 ${t.panelInner} rounded border ${t.borderBase} space-y-1`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold ${t.textAccentStrong} font-mono flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-xs">analytics</span>
                    Targeted Operator Mistake Profile:
                  </span>
                  <span className={`text-[9px] ${t.textMuted} font-mono`}>Weighted sequence repetition</span>
                </div>
                {weakCharacters.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {weakCharacters.map((w) => (
                      <span
                        key={w.char}
                        className="px-1.5 py-0.5 rounded border border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-[10px] font-bold"
                      >
                        {w.char}: {w.missed} miss{w.missed > 1 ? 'es' : ''} ({w.rate}%)
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={`text-[10px] ${t.textMuted} italic`}>
                    No mistakes recorded yet in operational log. Practice regular sessions to build error profile.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Transmission Medium Selector Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border ${t.borderBase} ${t.panelBg} text-xs shadow-xs`}>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-amber-500">sensors</span>
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${t.textSecondary}`}>
                Signaling Medium:
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOutputChannel('audio')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  outputChannel === 'audio'
                    ? `${t.bgAccentSolid} text-white shadow-xs`
                    : `${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                }`}
                title="Audio sidetone CW tone only (Flashlight hidden)"
              >
                <span className="material-symbols-outlined text-xs">volume_up</span>
                <span>Audio Only</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputChannel('optical')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  outputChannel === 'optical'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60 font-bold shadow-xs'
                    : `${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                }`}
                title="Soundless visual light pulses (Aldis shutter lamp)"
              >
                <span className="material-symbols-outlined text-xs">flare</span>
                <span>Soundless Light</span>
              </button>

              <button
                type="button"
                onClick={() => setOutputChannel('both')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  outputChannel === 'both'
                    ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} border font-bold shadow-xs`
                    : `${t.panelInner} ${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                }`}
                title="Synchronized Audio sidetone + Optical shutter beacon"
              >
                <span className="material-symbols-outlined text-xs">sync</span>
                <span>Dual Synced</span>
              </button>
            </div>
          </div>

          {/* Signaling Beacon & Optical Shutter Lamp Station */}
          <div className="transition-all">
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
                  ? isPlaying
                  : practiceMode === 'copy'
                    ? copyTypingStatus === 'playing'
                    : reverseStatus === 'playing'
              }
              onStartStop={
                practiceMode === 'batch'
                  ? handleStartBatch
                  : practiceMode === 'copy'
                    ? (copyTypingStatus === 'playing' ? () => setCopyTypingStatus('idle') : startCopyTypingSession)
                    : (reverseStatus === 'playing' ? () => setReverseStatus('idle') : startReverseSession)
              }
              startStopLabel={
                practiceMode === 'batch'
                  ? (isPlaying ? 'Stop Broadcast' : 'Transmit (Ctrl+F1)')
                  : practiceMode === 'copy'
                    ? (copyTypingStatus === 'playing' ? 'Stop Tape' : 'Start Tape (Ctrl+F1)')
                    : (reverseStatus === 'playing' ? 'Stop Keying' : 'Start Keying (Ctrl+F1)')
              }
              onRepeat={handleReplayCurrentChar}
            />
          </div>

          {/* CLASSIC BATCH INTERACTION AREA */}
          {practiceMode === 'batch' && (
            <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel space-y-5 ${t.appTexture}`}>
              <div className={`pb-1 border-b ${t.borderBase} flex justify-between items-center`}>
                <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
                  Operational Broadcast Transcribing
                </h3>
                <span className={`text-[10px] ${t.fontMono} ${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} px-2 py-0.5 rounded border font-bold`}>
                  Wartime Standard
                </span>
              </div>

              <div className="space-y-4">
                
                {/* Visualizer flasher */}
                <div className={`h-10 ${t.panelInner} rounded border ${t.borderBase} flex items-center justify-center relative overflow-hidden`}>
                  {isPlaying ? (
                    <div className={`flex items-center gap-2 ${t.textAccentStrong} animate-pulse text-xs font-mono`}>
                      <span className={`w-3.5 h-3.5 rounded-full ${t.bgAccentSolid} animate-ping absolute left-4`} />
                      <span className="material-symbols-outlined text-lg">hearing</span>
                      <span>INCOMING TRANSMISSION PLAYING AT {wpm} WPM...</span>
                    </div>
                  ) : targetSequence ? (
                    <div className={`flex items-center gap-1.5 ${t.textSuccess} text-xs font-mono`}>
                      <span className="material-symbols-outlined text-lg">task_alt</span>
                      <span>SIGNAL CAPTURED. STANDBY FOR TRANSCRIPT CORRECTION</span>
                    </div>
                  ) : (
                    <span className={`text-[11px] ${t.textMuted} font-mono`}>BROADCASTER READY. PRESS TRANSMIT BELOW.</span>
                  )}
                </div>

                {/* Textarea transcription entry */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={`block text-[10px] ${t.fontMono} ${t.textMuted} uppercase tracking-wider`}>
                      Operator's Official Log Entry
                    </label>
                    <span className={`text-[9px] ${t.fontMono} ${t.textAccent} font-semibold`}>
                      Auto-chunked into {groupLength}-char words
                    </span>
                  </div>
                  <textarea
                    id="morse-user-input"
                    ref={batchInputRef}
                    value={userInput}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const formatted = formatToChunks(val, groupLength);
                      setUserInput(formatted);
                    }}
                    placeholder="Place hands on keyboard, listen carefully, and log characters here..."
                    className={`w-full h-28 ${t.panelInner} border ${t.borderBase} rounded-lg p-3 ${t.textSecondary} font-mono text-base focus:${t.borderAccent} focus:outline-none resize-none leading-relaxed select-text`}
                    spellCheck="false"
                    disabled={isPlaying && !targetSequence}
                  />
                </div>

                {/* Batch buttons desk */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleStartBatch}
                    className={`py-3 rounded ${t.fontHeader} font-bold text-xs uppercase tracking-wider transition-colors border active:scale-[0.98] cursor-pointer ${
                      isPlaying 
                        ? t.dangerBadge 
                        : `${t.panelInner} ${t.textAccentStrong} ${t.borderAccent} hover:opacity-90`
                    }`}
                  >
                    {isPlaying ? 'Abrupt Stop (Ctrl+F1)' : 'Begin Transmission (Ctrl+F1)'}
                  </button>
                  
                  <button 
                    onClick={checkBatchAnswer}
                    disabled={isPlaying || !targetSequence || userInput.length === 0}
                    className={`py-3 ${t.bgAccentSolid} hover:${t.bgAccentHover} disabled:opacity-45 text-white rounded border ${t.borderAccent} ${t.fontHeader} font-bold text-xs uppercase tracking-wider transition-colors active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed`}
                  >
                    Submit Log For Audit
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* REAL-TIME COPY TYPING AREA */}
          {practiceMode === 'copy' && (
            <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel space-y-5 relative ${t.appTexture}`}>
              
              {/* Hidden Mobile Keyboard Input Trigger */}
              <input
                ref={mobileInputRef}
                type="text"
                value=""
                onChange={handleMobileInputChange}
                className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-50"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                aria-label="Mobile Keyboard Input Buffer"
              />

              <div className={`pb-1 border-b ${t.borderBase} flex justify-between items-center`}>
                <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
                  Interactive Tape Ribbon Decoding
                </h3>
                <span className={`text-[10px] ${t.fontMono} ${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} px-2 py-0.5 rounded border font-bold`}>
                  Tactical Real-time
                </span>
              </div>

              {/* SHARED DECODING CONTROLS TOOLBAR (Always visible and accessible) */}
              <div className={`flex flex-wrap items-center justify-between gap-3 p-3 ${t.panelInner} rounded border ${t.borderBase}`}>
                <div className={`text-[10px] uppercase font-mono ${t.textSecondary} font-bold flex items-center gap-1.5`}>
                  <span className={`material-symbols-outlined text-xs ${t.textAccent} animate-spin-slow`}>tune</span>
                  <span>Tape Configuration Desk:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className={`px-2.5 py-1 text-[10px] ${t.fontHeader} rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                      showHints 
                        ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} font-bold`
                        : `${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{showHints ? 'visibility' : 'visibility_off'}</span>
                    <span>Hints: {showHints ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHideFutureChars(!hideFutureChars)}
                    className={`px-2.5 py-1 text-[10px] ${t.fontHeader} rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                      hideFutureChars 
                        ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} font-bold`
                        : `${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{hideFutureChars ? 'disabled_by_default' : 'view_week'}</span>
                    <span>Hide Upcoming: {hideFutureChars ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isMobileKeyboardOpen) {
                        handleCloseMobileKeyboard();
                      } else {
                        handleOpenMobileKeyboard();
                      }
                    }}
                    className={`px-2.5 py-1 text-[10px] ${t.fontHeader} rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isMobileKeyboardOpen
                        ? `${t.bgAccentFaint} ${t.borderAccent} ${t.textAccentStrong} font-bold`
                        : `${t.borderBase} ${t.textMuted} hover:${t.textPrimary}`
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">smartphone</span>
                    <span>Mobile Keyboard: {isMobileKeyboardOpen ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Start and helper options */}
              {copyTypingStatus === 'idle' && (
                <div className={`${t.panelInner} rounded border ${t.borderBase} p-6 text-center space-y-4`}>
                  <div className={`flex justify-center gap-8 ${t.textMuted} text-[10px] uppercase ${t.fontMono}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">keyboard</span>
                      <span>Instant typing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>Calculated WPM</span>
                    </div>
                  </div>
                  
                  <p className={`text-[11px] ${t.textMuted} max-w-sm mx-auto leading-normal`}>
                    Listen to characters one-by-one. Type the key instantly. The system will auto-feed the next character as you type. No textareas required!
                  </p>

                  <button
                    onClick={startCopyTypingSession}
                    className={`px-6 py-3 ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white ${t.fontHeader} font-bold rounded border ${t.borderAccent} text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-lg`}
                  >
                    Start Real-Time Session (Ctrl+F1)
                  </button>
                </div>
              )}

              {/* ACTIVE SESSION TAPE SCREEN */}
              {copyTypingStatus === 'playing' && (
                <div className="space-y-4">
                  
                  {/* Glowing letter box tape with auto-centering horizontal scroller */}
                  <div ref={tapeContainerRef} className={`${t.panelInner} border ${t.borderBase} shadow-inner rounded-md p-4 overflow-x-auto scroll-smooth`}>
                    <div className="flex gap-2 justify-start py-2 px-[45%] min-w-max">
                      {targetSequence.split('').map((char, idx) => {
                        const isCurrent = idx === copyTypingIndex;
                        const isPassed = idx < copyTypingIndex;
                        const typedVal = copyTypingTyped[idx];
                        const wasCorrect = typedVal && typedVal.toUpperCase() === char.toUpperCase();

                        if (hideFutureChars && idx >= copyTypingIndex) {
                          return null;
                        }

                        const isScrollTarget = hideFutureChars
                          ? idx === copyTypingIndex - 1
                          : isCurrent;

                        if (char === ' ') {
                          return (
                            <div 
                              key={idx} 
                              ref={isScrollTarget ? activeCharRef : undefined}
                              className="w-5 h-12 border border-transparent flex items-center justify-center shrink-0"
                            >
                              <span className={`text-[10px] ${t.textMuted}`}>•</span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            ref={isScrollTarget ? activeCharRef : undefined}
                            className={`w-10 h-12 flex flex-col items-center justify-center rounded border font-bold transition-all relative shrink-0 ${
                              isCurrent
                                ? `${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} shadow-md scale-[1.05] ring-1 ring-[var(--text-accent)]/30`
                                : isPassed
                                ? wasCorrect
                                  ? `${t.successBadge} shadow-xs`
                                  : `${t.dangerBadge} shadow-xs`
                                : `${t.panelBg} ${t.textMuted} ${t.borderBase} opacity-60`
                            }`}
                          >
                            <span className="text-base">
                              {showHints || isPassed ? char : '?'}
                            </span>
                            
                            <span className={`text-[8px] font-mono tracking-tighter block leading-none ${t.textSecondary} font-semibold mt-0.5`}>
                              {MORSE_CODE[char.toUpperCase()]}
                            </span>

                            {isPassed && (
                              <span className={`text-[9px] font-mono absolute -bottom-1.5 font-bold ${wasCorrect ? t.textSuccess : t.textDanger}`}>
                                {typedVal || '_'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isMobileKeyboardOpen && (
                    <div 
                      onClick={() => mobileInputRef.current?.focus()}
                      className={`${t.statusHighlight} border ${t.borderAccent} rounded-lg p-2.5 flex items-center justify-between gap-2.5 cursor-pointer my-1.5`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${t.bgAccentSolid} shrink-0`} />
                        <div className="text-[11px] font-mono leading-tight">
                          <span className={`font-bold ${t.textPrimary} block`}>Mobile Keyboard Engaged</span>
                          <span className={`${t.textMuted}`}>Tap here to refocus input if keyboard closes.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseMobileKeyboard();
                        }}
                        className={`${t.dangerText} hover:opacity-80 font-mono text-[9px] uppercase border ${t.borderDanger} rounded px-1.5 py-0.5 ${t.dangerLightBg} cursor-pointer`}
                      >
                        Close Keypad
                      </button>
                    </div>
                  )}

                  {/* Real-time Instructions and escape */}
                  <div className={`flex justify-between items-center text-xs ${t.fontMono} p-1`}>
                    <span className={`${t.textAccentStrong} animate-pulse flex items-center gap-1`}>
                      <span className={`w-2 h-2 rounded-full ${t.bgAccentSolid} animate-ping`} />
                      SESSION ACTIVE: TYPE ON YOUR KEYBOARD NOW...
                    </span>
                    <button
                      onClick={() => setCopyTypingStatus('idle')}
                      className={`${t.textMuted} hover:${t.textDanger} border border-transparent hover:${t.borderDanger} ${t.panelInner} px-2 py-0.5 rounded text-[10px] uppercase transition-colors cursor-pointer`}
                    >
                      Abort Session (Ctrl+F1)
                    </button>
                  </div>
                </div>
              )}

              {/* COMPLETED SCREEN */}
              {copyTypingStatus === 'completed' && (
                <div className={`${t.panelInner} rounded border ${t.borderSuccess} p-6 text-center space-y-4`}>
                  <span className={`material-symbols-outlined text-4xl ${t.textSuccess} animate-bounce`}>task_alt</span>
                  <h4 className={`${t.fontHeader} font-bold text-sm ${t.textPrimary} uppercase tracking-wider`}>
                    Session Log Captured Successfully
                  </h4>
                  <p className={`text-xs ${t.textMuted} max-w-sm mx-auto leading-normal`}>
                    Review your results, adjust lessons, or immediately spin up another telemetry ribbon.
                  </p>
                  <button
                    onClick={startCopyTypingSession}
                    className={`px-5 py-2.5 ${t.buttonSuccessSolid} ${t.fontHeader} font-bold rounded border text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer`}
                  >
                    Start Next Tape Session (Ctrl+F1)
                  </button>
                </div>
              )}

            </div>
          )}

          {/* REVERSE LEARNING INTERACTION AREA */}
          {practiceMode === 'reverse' && (
            <div className={`${t.panelBg} border ${t.borderBase} rounded-lg p-5 shadow-panel space-y-5 ${t.appTexture}`}>
              <div className={`pb-1 border-b ${t.borderBase} flex justify-between items-center`}>
                <h3 className={`text-ui-header ${t.fontHeader} ${t.textSecondary} text-xs uppercase tracking-wider`}>
                  Reverse Learning (Keying & Encoding)
                </h3>
                <span className={`text-[10px] ${t.fontMono} ${t.bgAccentFaint} ${t.textAccentStrong} ${t.borderAccent} px-2 py-0.5 rounded border font-bold`}>
                  Transmitter Mode
                </span>
              </div>

              {/* IDLE / SETUP SCREEN */}
              {reverseStatus === 'idle' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${t.borderBase} ${t.panelInner} space-y-3`}>
                    <p className={`text-xs ${t.textPrimary} leading-relaxed`}>
                      In <strong>Reverse Learning mode</strong>, you are presented with a letter or symbol and must transmit its Morse code representation using the telegraph paddle buttons or your keyboard.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Number of Prompts */}
                      <div className="space-y-1">
                        <label className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase block`}>
                          Session Length
                        </label>
                        <div className="flex gap-1">
                          {[5, 10, 15, 25, 50].map((count) => (
                            <button
                              key={count}
                              onClick={() => setReverseCount(count)}
                              className={`flex-1 py-1 text-xs font-mono font-bold rounded border transition-colors cursor-pointer ${
                                reverseCount === count
                                  ? `${t.bgAccentSolid} text-white border-transparent`
                                  : `${t.panelBg} ${t.borderBase} ${t.textSecondary} hover:${t.textPrimary}`
                              }`}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <label className={`text-[10px] ${t.fontMono} ${t.textMuted} uppercase block`}>
                          Encoding Options
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <label className={`flex items-center gap-1.5 cursor-pointer text-xs ${t.textPrimary} select-none`}>
                            <input
                              type="checkbox"
                              checked={reverseAutoAdvance}
                              onChange={(e) => setReverseAutoAdvance(e.target.checked)}
                              className={`${t.sliderAccent} rounded ${t.panelBg} w-3.5 h-3.5 cursor-pointer`}
                            />
                            <span>Auto-check on match</span>
                          </label>
                          <label className={`flex items-center gap-1.5 cursor-pointer text-xs ${t.textPrimary} select-none`}>
                            <input
                              type="checkbox"
                              checked={reverseSoundEnabled}
                              onChange={(e) => setReverseSoundEnabled(e.target.checked)}
                              className={`${t.sliderAccent} rounded ${t.panelBg} w-3.5 h-3.5 cursor-pointer`}
                            />
                            <span>Keying sidetone</span>
                          </label>
                          <label className={`flex items-center gap-1.5 cursor-pointer text-xs ${t.textPrimary} select-none`}>
                            <input
                              type="checkbox"
                              checked={reverseShowMorseHint}
                              onChange={(e) => setReverseShowMorseHint(e.target.checked)}
                              className={`${t.sliderAccent} rounded ${t.panelBg} w-3.5 h-3.5 cursor-pointer`}
                            />
                            <span>Show hint</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Cheat Legend */}
                  <div className={`p-3 rounded border ${t.borderBase} ${t.bgAccentFaint} text-[11px] ${t.fontMono} text-center space-y-1`}>
                    <div className={`font-bold ${t.textAccent} uppercase`}>Keyboard Shortcuts</div>
                    <div className={`${t.textSecondary} flex flex-wrap justify-center gap-x-4 gap-y-1`}>
                      <span><strong>Dit (•):</strong> <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">.</kbd> or <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">J</kbd> or <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">D</kbd></span>
                      <span><strong>Dah (—):</strong> <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">-</kbd> or <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">K</kbd> or <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">F</kbd> or <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">Space</kbd></span>
                      <span><strong>Clear:</strong> <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">C</kbd> / <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">Esc</kbd></span>
                      <span><strong>Submit:</strong> <kbd className="px-1 py-0.5 rounded bg-black/20 font-bold">Enter</kbd></span>
                    </div>
                  </div>

                  <button
                    onClick={startReverseSession}
                    className={`w-full py-3 ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white ${t.fontHeader} font-bold rounded-lg uppercase tracking-wider text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2`}
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Start Keying Training (Ctrl+F1)
                  </button>
                </div>
              )}

              {/* ACTIVE SESSION INTERFACE */}
              {reverseStatus === 'playing' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Progress and status header */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`${t.textMuted}`}>
                      Prompt <strong className={t.textPrimary}>{reverseIndex + 1}</strong> of <strong className={t.textPrimary}>{reverseSequence.length}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReverseSoundEnabled(!reverseSoundEnabled)}
                        className={`p-1 rounded border ${reverseSoundEnabled ? `${t.borderAccent} ${t.textAccent}` : `${t.borderBase} ${t.textMuted}`} text-[10px] flex items-center gap-1 cursor-pointer`}
                        title="Toggle sound"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {reverseSoundEnabled ? 'volume_up' : 'volume_off'}
                        </span>
                        <span>Sound</span>
                      </button>
                      <button
                        onClick={() => setReverseShowMorseHint(!reverseShowMorseHint)}
                        className={`p-1 rounded border ${reverseShowMorseHint ? `${t.borderAccent} ${t.textAccent}` : `${t.borderBase} ${t.textMuted}`} text-[10px] flex items-center gap-1 cursor-pointer`}
                        title="Toggle hint"
                      >
                        <span className="material-symbols-outlined text-xs">lightbulb</span>
                        <span>Hint</span>
                      </button>
                      <button
                        onClick={() => setReverseStatus('idle')}
                        className={`p-1 rounded border ${t.borderDanger} ${t.textDanger} text-[10px] uppercase font-bold cursor-pointer hover:bg-black/10`}
                      >
                        Abort
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full h-1.5 ${t.panelInner} rounded-full overflow-hidden border ${t.borderBase}`}>
                    <div
                      className={`h-full ${t.bgAccentSolid} transition-all duration-300`}
                      style={{ width: `${((reverseIndex) / reverseSequence.length) * 100}%` }}
                    />
                  </div>

                  {/* Sequence ticker summary ribbon */}
                  <div className={`p-2 rounded border ${t.borderBase} ${t.panelInner} overflow-x-auto flex gap-1 items-center min-h-[42px]`}>
                    {reverseSequence.split('').map((ch, idx) => {
                      const entry = reverseEntries[idx];
                      const isCurrent = idx === reverseIndex;
                      return (
                        <div
                          key={idx}
                          className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                            isCurrent
                              ? `${t.bgAccentSolid} text-white ${t.borderAccent} ring-2 ring-amber-500/50 scale-110`
                              : entry
                              ? entry.isCorrect
                                ? `${t.successBadge} border-emerald-500/50 ${t.textSuccess}`
                                : `${t.dangerBadge} border-rose-500/50 ${t.textDanger}`
                              : `${t.panelBg} ${t.borderBase} ${t.textMuted} opacity-60`
                          }`}
                        >
                          {ch}
                        </div>
                      );
                    })}
                  </div>

                  {/* MAIN ENCODING CARD */}
                  <div className={`p-6 rounded-xl border-2 ${
                    reverseFeedback.status === 'correct'
                      ? `${t.borderSuccess} ${t.bgAccentFaint}`
                      : reverseFeedback.status === 'incorrect'
                      ? `${t.borderDanger} ${t.bgAccentFaint}`
                      : `${t.borderAccent} ${t.panelInner}`
                  } text-center space-y-4 transition-colors`}>
                    
                    {/* Prompt Character */}
                    <div className="space-y-1">
                      <div className={`text-[11px] ${t.fontMono} uppercase tracking-widest ${t.textMuted}`}>
                        Transmit in Morse Code:
                      </div>
                      <div className={`text-6xl sm:text-7xl font-mono font-black ${t.textPrimary} tracking-tight select-none`}>
                        {reverseSequence[reverseIndex] || ''}
                      </div>
                      {reverseShowMorseHint && reverseSequence[reverseIndex] && (
                        <div className={`inline-block mt-1 px-2 py-0.5 rounded ${t.panelBg} border ${t.borderBase} text-xs font-mono font-bold ${t.textAccent}`}>
                          Hint: {MORSE_CODE[reverseSequence[reverseIndex].toUpperCase()] || '—'}
                        </div>
                      )}
                    </div>

                    {/* Current Input Dits & Dahs */}
                    <div className="space-y-1">
                      <div className={`text-[10px] ${t.fontMono} uppercase tracking-wider ${t.textMuted}`}>
                        Your Keying Signal:
                      </div>
                      <div className={`h-14 flex items-center justify-center gap-1.5 px-4 rounded-lg border ${t.borderBase} ${t.panelBg} font-mono text-2xl font-black ${t.textAccentStrong} select-none overflow-x-auto`}>
                        {reverseCurrentCode ? (
                          reverseCurrentCode.split('').map((sym, sIdx) => (
                            <span
                              key={sIdx}
                              className={`px-1.5 py-0.5 rounded ${t.panelInner} border ${t.borderBase} ${
                                sym === '.' ? 'text-amber-500 text-3xl' : 'text-blue-500 text-3xl'
                              }`}
                            >
                              {sym === '.' ? '•' : '—'}
                            </span>
                          ))
                        ) : (
                          <span className={`text-sm ${t.textMuted} italic font-normal`}>
                            Press Dit [ • ] or Dah [ — ] below or use keyboard
                          </span>
                        )}
                        <span className={`inline-block w-2 h-6 ${t.bgAccentSolid} animate-pulse ml-1`} />
                      </div>
                      {reverseCurrentCode && (
                        <div className={`text-[11px] font-mono ${t.textMuted}`}>
                          Raw: <span className={`${t.textPrimary} font-bold`}>{reverseCurrentCode}</span>
                          {REVERSE_MORSE_MAP[reverseCurrentCode] && (
                            <span className="ml-2">
                              Decodes to: <strong className={t.textAccent}>'{REVERSE_MORSE_MAP[reverseCurrentCode]}'</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Instant Result Feedback Message */}
                    {reverseFeedback.status !== 'none' && (
                      <div className={`p-2 rounded font-mono font-bold text-xs uppercase animate-fadeIn ${
                        reverseFeedback.status === 'correct'
                          ? `${t.textSuccess}`
                          : `${t.textDanger}`
                      }`}>
                        {reverseFeedback.message}
                      </div>
                    )}

                    {/* TELEGRAPH KEY PADDLES */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleKeyDit}
                        disabled={reverseFeedback.status !== 'none'}
                        className={`py-5 sm:py-6 rounded-xl border-2 font-mono font-black text-lg uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all cursor-pointer select-none ${
                          ditActive
                            ? `${t.bgAccentSolid} text-white border-white scale-98 shadow-inner`
                            : `${t.panelBg} ${t.borderAccent} ${t.textPrimary} hover:${t.borderBase}`
                        } ${reverseFeedback.status !== 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-3xl font-black text-amber-500">•</span>
                          <span className="text-base font-bold">DIT</span>
                        </div>
                        <span className={`text-[10px] ${t.textMuted} font-normal`}>Key: [ . ] / [ J ] / [ D ]</span>
                      </button>

                      <button
                        onClick={handleKeyDah}
                        disabled={reverseFeedback.status !== 'none'}
                        className={`py-5 sm:py-6 rounded-xl border-2 font-mono font-black text-lg uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all cursor-pointer select-none ${
                          dahActive
                            ? `${t.bgAccentSolid} text-white border-white scale-98 shadow-inner`
                            : `${t.panelBg} ${t.borderAccent} ${t.textPrimary} hover:${t.borderBase}`
                        } ${reverseFeedback.status !== 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-3xl font-black text-blue-500">—</span>
                          <span className="text-base font-bold">DAH</span>
                        </div>
                        <span className={`text-[10px] ${t.textMuted} font-normal`}>Key: [ - ] / [ K ] / [ Space ]</span>
                      </button>
                    </div>

                    {/* ACTION BUTTONS (Backspace, Clear, Submit, Skip) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleBackspaceCode}
                        disabled={reverseFeedback.status !== 'none' || !reverseCurrentCode}
                        className={`px-3 py-1.5 rounded border ${t.borderBase} ${t.panelBg} text-xs font-mono ${t.textSecondary} hover:${t.textPrimary} disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1`}
                      >
                        <span className="material-symbols-outlined text-xs">backspace</span>
                        <span>Backspace</span>
                      </button>

                      <button
                        onClick={handleClearCode}
                        disabled={reverseFeedback.status !== 'none' || !reverseCurrentCode}
                        className={`px-3 py-1.5 rounded border ${t.borderBase} ${t.panelBg} text-xs font-mono ${t.textSecondary} hover:${t.textPrimary} disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1`}
                      >
                        <span className="material-symbols-outlined text-xs">refresh</span>
                        <span>Clear (C)</span>
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={reverseFeedback.status !== 'none' || !reverseCurrentCode}
                        className={`px-4 py-1.5 rounded border ${t.borderAccent} ${t.bgAccentSolid} hover:${t.bgAccentHover} text-white text-xs font-mono font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-sm`}
                      >
                        <span className="material-symbols-outlined text-xs">check</span>
                        <span>Check & Submit (Enter)</span>
                      </button>

                      <button
                        onClick={handleSkipReverseChar}
                        disabled={reverseFeedback.status !== 'none'}
                        className={`px-3 py-1.5 rounded border ${t.borderBase} ${t.panelBg} text-xs font-mono ${t.textMuted} hover:${t.textDanger} disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1`}
                      >
                        <span className="material-symbols-outlined text-xs">skip_next</span>
                        <span>Skip</span>
                      </button>
                    </div>

                  </div>

                  {/* Compact keyboard instructions bar */}
                  <div className={`p-2.5 rounded border ${t.borderBase} ${t.panelInner} text-[10px] ${t.fontMono} ${t.textMuted} text-center`}>
                    Press keys <strong>.</strong> / <strong>-</strong> or tap the paddle boxes above to send Morse elements.
                  </div>

                </div>
              )}

              {/* COMPLETED SCREEN */}
              {reverseStatus === 'completed' && (
                <div className={`${t.panelInner} rounded border ${t.borderSuccess} p-6 text-center space-y-4`}>
                  <span className={`material-symbols-outlined text-4xl ${t.textSuccess} animate-bounce`}>task_alt</span>
                  <h4 className={`${t.fontHeader} font-bold text-sm ${t.textPrimary} uppercase tracking-wider`}>
                    Reverse Transmission Run Completed!
                  </h4>
                  <p className={`text-xs ${t.textMuted} max-w-sm mx-auto leading-normal`}>
                    Review your verification audit below, or spin up the next reverse keying practice round.
                  </p>
                  <button
                    onClick={startReverseSession}
                    className={`px-5 py-2.5 ${t.buttonSuccessSolid} ${t.fontHeader} font-bold rounded border text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer`}
                  >
                    Start Next Keying Session (Ctrl+F1)
                  </button>
                </div>
              )}

            </div>
          )}

          {/* SHARED PERFORMANCE RESULTS FEEDBACK SCREEN */}
          {result.show && (
            <div className={`p-4 sm:p-5 rounded-lg border-2 animate-fadeIn ${
              result.accuracy >= 90
                ? `${t.successBadge} ${t.textPrimary}`
                : `${t.dangerBadge} ${t.textPrimary}`
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-xl ${result.accuracy >= 90 ? t.textSuccess : t.textDanger}`}>
                    {result.accuracy >= 90 ? 'check_circle' : 'warning'}
                  </span>
                  <span className={`${t.fontHeader} font-bold text-xs uppercase tracking-wider ${t.textSecondary}`}>
                    Audit Verification Log
                  </span>
                </div>
                <span className={`text-2xl font-bold font-mono ${
                  result.accuracy >= 90 ? t.textSuccess : t.textDanger
                }`}>
                  {result.accuracy.toFixed(1)}% Accuracy
                </span>
              </div>
              
              {result.accuracy >= 90 ? (
                <p className={`text-xs font-bold ${t.fontBody} ${t.textSuccess}`}>
                  Excellent transcribing, Operator! You reached standard operational capability. Level Up initiated.
                </p>
              ) : (
                <p className={`text-xs font-bold ${t.fontBody} ${t.textDanger}`}>
                  Accuracy dropped below the 90% required. Revise character codes and retry.
                </p>
              )}

              {/* Comparative character-by-character alignment grid */}
              <div className={`space-y-3 mt-3 pt-3 border-t border-dashed ${t.borderBase}`}>
                {/* Original transmitted sequence */}
                <div className={`text-[11px] font-mono p-2.5 ${t.panelBg} border ${t.borderBase} rounded leading-normal`}>
                  <span className={`${t.textSecondary} font-bold block mb-1 uppercase tracking-wider text-[10px]`}>
                    Original Transmitted Message:
                  </span>
                  <span className={`${t.textPrimary} tracking-widest text-sm break-all font-bold uppercase`}>
                    {targetSequence}
                  </span>
                </div>

                {/* Grid Comparison */}
                <div className="space-y-1.5">
                  <span className={`${t.textSecondary} font-bold block uppercase tracking-wider text-[10px]`}>
                    Comparative Breakdown (Transmitted vs Operator Entry):
                  </span>
                  <div className={`flex flex-wrap gap-1.5 p-3 ${t.panelBg} border ${t.borderBase} rounded max-h-40 overflow-y-auto`}>
                    {getComparisonData().map((item, idx) => {
                      const needsGroupGap = (idx + 1) % groupLength === 0 && idx < targetSequence.replace(/\s/g, '').length - 1;
                      
                      return (
                        <React.Fragment key={item.index}>
                          <div 
                            className={`flex flex-col items-center justify-center w-8 h-12 rounded border text-xs font-mono font-bold transition-all ${
                              item.isCorrect
                                ? `${t.successBadge}`
                                : `${t.dangerBadge}`
                            }`}
                            title={`Char #${idx + 1}: Transmitted '${item.targetChar}', Entered '${item.userChar || 'None'}'`}
                          >
                            <span className={`text-[8px] opacity-75 leading-none ${t.textMuted}`}>TX</span>
                            <span className={`text-sm font-bold ${t.textPrimary}`}>{item.targetChar}</span>
                            <div className={`h-[1px] w-4 ${t.borderBase} border-t my-0.5`} />
                            <span className={`text-xs leading-none font-extrabold ${
                              item.isCorrect
                                ? t.textSuccess
                                : t.textDanger
                            }`}>{item.userChar || '_'}</span>
                          </div>
                          {needsGroupGap && (
                            <div className="w-2.5 flex items-center justify-center shrink-0 self-center">
                              <span className={`text-[14px] ${t.textMuted} font-bold`}>/</span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-mono ${t.textMuted}`}>
                    <span className={`w-2 h-2 rounded-full ${t.bgSuccessStrong || t.bgSuccess} shrink-0`} />
                    <span>Correct Entry</span>
                    <span className={`w-2 h-2 rounded-full ${t.buttonDangerSolid || t.textDanger} ml-3 shrink-0`} />
                    <span>Discrepancy (TX is transmitted, bottom is your entry)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* DETAILED PROGRESS HISTORY CHART PANEL */}
      <div className={`${t.panelInner} border ${t.borderBase} rounded-lg p-6 shadow-2xl space-y-6`}>
        
        {/* Header line chart controls */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b ${t.borderBase}`}>
          <div>
            <h3 className={`${t.textSecondary} ${t.fontHeader} font-bold text-sm uppercase tracking-wider flex items-center gap-2`}>
              <span className={`material-symbols-outlined text-lg ${t.textAccent}`}>insights</span>
              Historical Performance plotting
            </h3>
            <p className={`text-[10px] ${t.textMuted}`}>Interactive graph monitoring telegraphy progress on Koch and LCWO trials.</p>
          </div>

          {/* Metric Selector Tabs */}
          <div className={`flex gap-1 ${t.panelBg} p-1 rounded-md border ${t.borderBase} self-stretch sm:self-auto`}>
            <button
              onClick={() => setChartMetric('accuracy')}
              className={`flex-1 sm:flex-none px-3 py-1 text-[10px] ${t.fontHeader} font-bold uppercase rounded cursor-pointer ${
                chartMetric === 'accuracy' ? `${t.bgAccentSolid} text-white` : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
            >
              Accuracy
            </button>
            <button
              onClick={() => setChartMetric('wpm')}
              className={`flex-1 sm:flex-none px-3 py-1 text-[10px] ${t.fontHeader} font-bold uppercase rounded cursor-pointer ${
                chartMetric === 'wpm' ? `${t.bgAccentSolid} text-white` : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
            >
              Speed
            </button>
            <button
              onClick={() => setChartMetric('level')}
              className={`flex-1 sm:flex-none px-3 py-1 text-[10px] ${t.fontHeader} font-bold uppercase rounded cursor-pointer ${
                chartMetric === 'level' ? `${t.bgAccentSolid} text-white` : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
            >
              Level
            </button>
          </div>
        </div>

        {/* The plot canvas screen */}
        <div className="relative">
          {chartData.length === 0 ? (
            <div className={`${t.panelBg} rounded-lg border ${t.borderBase}/60 p-10 text-center space-y-2`}>
              <span className={`material-symbols-outlined text-4xl ${t.textMuted}/30`}>analytics</span>
              <h4 className={`text-xs ${t.fontHeader} font-bold ${t.textPrimary} uppercase tracking-wider`}>No Telegraph History Captured</h4>
              <p className={`text-[11px] ${t.textMuted} max-w-sm mx-auto`}>
                Once you complete your first practice session in Classic Batch or Real-Time, your auditory progress charts will appear here.
              </p>
            </div>
          ) : svgChart ? (
            <div className="space-y-4">
              
              {/* SVG Plot container */}
              <div className={`relative ${t.panelBg} rounded-lg p-2 border ${t.borderBase}/70 shadow-inner`}>
                <svg
                  viewBox={`0 0 ${svgChart.width} ${svgChart.height}`}
                  className="w-full h-56 select-none overflow-visible"
                >
                  <defs>
                    <linearGradient id="chart-area-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ebc238" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ebc238" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid guide rules */}
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const frac = idx / 4;
                    const yVal = svgChart.minY + frac * (svgChart.maxY - svgChart.minY);
                    const yPos = svgChart.height - svgChart.paddingBottom - frac * svgChart.chartHeight;
                    return (
                      <g key={idx} className="opacity-40">
                        <line
                          x1={svgChart.paddingLeft}
                          y1={yPos}
                          x2={svgChart.width - svgChart.paddingRight}
                          y2={yPos}
                          stroke="#3b3426"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={svgChart.paddingLeft - 8}
                          y={yPos + 3}
                          fill="#8c7e6a"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {Math.round(yVal)}{chartMetric === 'accuracy' ? '%' : ''}
                        </text>
                      </g>
                    );
                  })}

                  {/* Plot glow path area fill */}
                  {svgChart.areaD && (
                    <path d={svgChart.areaD} fill="url(#chart-area-glow)" />
                  )}

                  {/* Core trace line path */}
                  {svgChart.pathD && (
                    <path
                      d={svgChart.pathD}
                      fill="none"
                      stroke="#ebc238"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Individual coordinate nodes */}
                  {svgChart.points.map((p, idx) => {
                    const isHovered = hoveredDataPoint && hoveredDataPoint.index === idx;
                    return (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? "6" : "3.5"}
                          fill={isHovered ? "#ebc238" : "#120e04"}
                          stroke="#ebc238"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="11"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredDataPoint({ ...p.data, x: p.x, y: p.y, index: idx })}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        />
                      </g>
                    );
                  })}

                  {/* Bottom attempt index rules */}
                  {svgChart.points.map((p, idx) => (
                    <text
                      key={idx}
                      x={p.x}
                      y={svgChart.height - svgChart.paddingBottom + 16}
                      fill="#8c7e6a"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      #{idx + 1}
                    </text>
                  ))}
                </svg>

                {/* Floating coordinate tooltip */}
                {hoveredDataPoint && (
                  <div
                    className={`absolute ${t.modalBg} border ${t.borderAccent} p-2.5 rounded shadow-xl text-[10px] font-mono pointer-events-none z-30 space-y-1 ${t.textPrimary}`}
                    style={{
                      left: `${(hoveredDataPoint.x / svgChart.width) * 100}%`,
                      top: `${(hoveredDataPoint.y / svgChart.height) * 100 - 30}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div className={`font-bold ${t.textAccent} uppercase pb-0.5 border-b ${t.borderBase} tracking-wider`}>
                      Practice Run #{hoveredDataPoint.index + 1}
                    </div>
                    <div>Level: <span className={`${t.textPrimary} font-bold`}>{hoveredDataPoint.level}</span></div>
                    <div>Accuracy: <span className={`${t.textPrimary} font-bold`}>{hoveredDataPoint.accuracy.toFixed(1)}%</span></div>
                    <div>Speed: <span className={`${t.textPrimary} font-bold`}>{hoveredDataPoint.wpm || 0} WPM</span></div>
                    <div>Mode: <span className={`${t.textAccent} font-bold uppercase`}>{hoveredDataPoint.mode === 'copy' ? 'Realtime' : hoveredDataPoint.mode === 'reverse' ? 'Reverse' : 'Classic'}</span></div>
                    <div className={`text-[8px] ${t.textMuted} pt-0.5`}>
                      {new Date(hoveredDataPoint.timestamp).toLocaleDateString()} {new Date(hoveredDataPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}

              </div>

              {/* Table details list */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5 pb-4">
                <span className={`text-[10px] ${t.textMuted} uppercase tracking-wider ${t.fontMono}`}>
                  Displaying last {chartData.length} trial records. Hover nodes to audit parameters.
                </span>
                <button
                  onClick={resetStats}
                  className={`text-xs ${t.textMuted} hover:${t.textDanger} font-bold ${t.fontHeader} uppercase border border-transparent hover:${t.borderDanger} ${t.panelInner} px-2.5 py-1 rounded transition-colors cursor-pointer`}
                >
                  Clear Plot History
                </button>
              </div>

              {/* Detailed Recent Sessions Logs & Review Panel */}
              <div className={`mt-6 pt-6 border-t ${t.borderBase} space-y-4`}>
                <h4 className={`text-xs ${t.fontHeader} font-bold ${t.textPrimary} uppercase tracking-wider flex items-center gap-2`}>
                  <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>history_edu</span>
                  Operator Session Log Book
                </h4>
                
                <div className={`overflow-x-auto rounded-lg border ${t.borderBase} ${t.panelInner}`}>
                  <table className={`w-full text-left text-xs ${t.fontMono} ${t.textSecondary} min-w-[500px]`}>
                    <thead>
                      <tr className={`border-b ${t.borderBase} bg-black/15 text-[10px] uppercase tracking-wider ${t.textAccent} font-bold`}>
                        <th className="py-2.5 px-3">Run</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Method / Lvl</th>
                        <th className="py-2.5 px-3">WPM</th>
                        <th className="py-2.5 px-3">Accuracy</th>
                        <th className="py-2.5 px-3 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${t.borderBase}/50`}>
                      {[...stats].reverse().map((stat, revIdx) => {
                        const originalIdx = stats.length - 1 - revIdx;
                        const isSelected = selectedReviewIndex === originalIdx;
                        return (
                          <tr key={stat.timestamp || originalIdx} className={`${t.tableRowHover} transition-colors ${isSelected ? t.tableRowActive : ''}`}>
                            <td className={`py-2 px-3 font-bold ${t.textAccent}`}>#{originalIdx + 1}</td>
                            <td className={`py-2 px-3 text-[10px] ${t.textMuted}`}>
                              {new Date(stat.timestamp).toLocaleDateString()} {new Date(stat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                stat.mode === 'copy' 
                                  ? `${t.bgAccentFaint} ${t.textAccent}` 
                                  : stat.mode === 'reverse'
                                  ? `${t.successBadge} ${t.textSuccess}`
                                  : t.accentLightBg
                              }`}>
                                {stat.mode === 'copy' ? 'Realtime' : stat.mode === 'reverse' ? 'Reverse' : 'Classic'}
                              </span>
                            </td>
                            <td className="py-2 px-3 uppercase">{stat.method} Lvl {stat.level}</td>
                            <td className="py-2 px-3">{stat.wpm} WPM</td>
                            <td className={`py-2 px-3 font-bold ${stat.accuracy >= 90 ? t.textSuccess : stat.accuracy >= 70 ? t.textAccent : t.textDanger}`}>
                              {stat.accuracy.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => setSelectedReviewIndex(isSelected ? null : originalIdx)}
                                className={`text-[10px] font-bold ${t.fontHeader} uppercase px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                  isSelected 
                                    ? `${t.bgAccentSolid} text-white border-transparent font-extrabold`
                                    : `border-current/25 ${t.textSecondary} hover:${t.textPrimary} hover:bg-black/5`
                                }`}
                              >
                                {isSelected ? 'Close' : 'Review'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {stats.length === 0 && (
                        <tr>
                          <td colSpan={7} className={`py-6 text-center ${t.textMuted} italic`}>
                            No training trials completed yet. Start practicing above!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* EXPANDED DETAILED COMPARISON PANEL */}
                {selectedReviewIndex !== null && stats[selectedReviewIndex] && (() => {
                  const rStat = stats[selectedReviewIndex];
                  return (
                    <div className={`p-4 rounded-lg border ${t.borderAccent}/30 ${t.bgAccentFaint} space-y-4 animate-fadeIn`}>
                      <div className={`flex justify-between items-center pb-2 border-b ${t.borderBase}`}>
                        <div>
                          <h5 className={`text-xs font-bold ${t.textAccent} uppercase tracking-wider font-mono`}>
                            Audit Card: Run #{selectedReviewIndex + 1} ({rStat.mode === 'copy' ? 'Real-Time Copy' : 'Classic Batch'})
                          </h5>
                          <p className={`text-[10px] ${t.textSecondary} font-mono`}>
                            Level {rStat.level} ({rStat.method.toUpperCase()}) — {rStat.wpm} WPM — {rStat.accuracy.toFixed(1)}% Accuracy
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedReviewIndex(null)}
                          className={`text-[10px] uppercase font-bold ${t.textMuted} hover:${t.textPrimary} font-mono`}
                        >
                          ✕ Close Review
                        </button>
                      </div>

                      {/* Display letter comparison scorecard */}
                      {rStat.results && rStat.results.length > 0 ? (
                        <div className="space-y-3">
                          <span className={`text-[10px] uppercase tracking-wider ${t.textAccent} font-bold font-mono block`}>
                            Letter-by-Letter Analysis
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {rStat.results.map((item, idx) => (
                              <div
                                key={idx}
                                className={`flex flex-col items-center justify-center w-10 h-12 rounded border font-mono transition-all ${
                                  item.isCorrect
                                    ? t.successBadge
                                    : item.char === ''
                                    ? t.dangerBadge
                                    : t.dangerBadge
                                }`}
                              >
                                <span className="text-xs font-bold">{item.char || '—'}</span>
                                <span className={`text-[10px] border-t w-full text-center border-current/20 ${item.isCorrect ? t.textSuccess : `${t.textDanger} line-through`}`}>
                                  {item.typed || '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={`text-[11px] italic ${t.textMuted} font-mono`}>
                          No letter-by-letter metrics available for this legacy record.
                        </div>
                      )}

                      {/* Display overall text comparisons */}
                      {rStat.transmission && (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t ${t.borderBase} font-mono text-xs`}>
                          <div className="space-y-1">
                            <span className={`text-[10px] ${t.textMuted} uppercase`}>Target Transmission:</span>
                            <div className={`p-2.5 rounded ${t.panelInner} border ${t.borderBase} ${t.textPrimary} break-all tracking-widest font-bold`}>
                              {rStat.transmission}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className={`text-[10px] ${t.textMuted} uppercase`}>Your Input Transcript:</span>
                            <div className={`p-2.5 rounded ${t.panelInner} border ${t.borderBase} ${t.textPrimary} break-all tracking-widest font-bold`}>
                              {rStat.userTyped || '—'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          ) : null}
        </div>

      </div>

      {/* Morse Alphabet Reference card */}
      <div className={`border-t ${t.borderBase} pt-6`}>
        <MorseReferenceSheet
          title="Auditory Code Reference Sheet"
          subtitle="Click any letter, number, or special character to play its auditory Morse pitch code"
          icon="graphic_eq"
          expanded={showChart}
          onToggleExpand={() => setShowChart(!showChart)}
          onItemClick={(char) => {
            if (playerRef.current) {
              playerRef.current.playSequence(char);
            }
          }}
          itemTitlePrefix="Click to play sound for"
        />
      </div>

    </div>
  );
};
