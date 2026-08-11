import React, { useState, useEffect, useRef, useMemo } from 'react';

const MORSE_CODE: Record<string, string> = {
  'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
  'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
  'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
  'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
  'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
  'Y': '-.--',  'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.', '=': '-...-'
};

const METHODS = {
  koch: "KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X",
  lcwo: "KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D6X0"
};

type TrainingMethod = 'koch' | 'lcwo';
type PracticeMode = 'batch' | 'copy';

interface LevelStats {
  level: number;
  method: TrainingMethod;
  accuracy: number;
  wpm: number;
  mode: PracticeMode;
  timestamp: number;
}

class MorsePlayer {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  
  private effWpm: number = 20;
  private charWpm: number = 20;
  private frequency: number = 600;
  private noiseLevel: number = 0; // 0 to 1
  
  private isPlaying: boolean = false;
  private stopTimeout: number | null = null;

  constructor(effWpm: number = 20, charWpm: number = 20, frequency: number = 600, noiseLevel: number = 0) {
    this.effWpm = effWpm;
    this.charWpm = charWpm;
    this.frequency = frequency;
    this.noiseLevel = noiseLevel;
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
  public setFrequency(freq: number) { this.frequency = freq; }
  public setNoiseLevel(level: number) { this.noiseLevel = level; }

  public stop() {
    this.isPlaying = false;
    if (this.stopTimeout !== null) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
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

  public async playSequence(text: string, onEnded?: () => void) {
    this.initAudio();
    this.stop();
    this.isPlaying = true;
    
    if (!this.audioCtx) return;

    const charWpm = Math.max(this.charWpm, this.effWpm);
    const effWpm = this.effWpm;
    
    const u = 1.2 / charWpm;
    let interCharTime = 3 * u;
    let interWordTime = 7 * u;
    
    if (effWpm < charWpm) {
      const spaceTime = (60 / effWpm) - (31 * u);
      interCharTime = (spaceTime * 3) / 19;
      interWordTime = (spaceTime * 7) / 19;
    }

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
      this.noiseGain.gain.value = this.noiseLevel * 0.1; // scale down a bit
      
      this.noiseSource.connect(bandpass);
      bandpass.connect(this.noiseGain);
      this.noiseGain.connect(this.audioCtx.destination);
      
      this.noiseSource.start(this.audioCtx.currentTime);
    }
    
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.oscillator.start(this.audioCtx.currentTime);

    let startTime = this.audioCtx.currentTime + 0.5; // delay to start

    for (let i = 0; i < text.length; i++) {
      if (!this.isPlaying) break;
      
      const char = text[i].toUpperCase();
      if (char === ' ') {
        startTime += (interWordTime - interCharTime);
        continue;
      }
      
      const code = MORSE_CODE[char];
      if (code) {
        for (let j = 0; j < code.length; j++) {
          const symbol = code[j];
          const duration = symbol === '-' ? u * 3 : u;
          
          this.gainNode.gain.setValueAtTime(0, startTime);
          this.gainNode.gain.setTargetAtTime(1, startTime, 0.005);
          
          startTime += duration;
          
          this.gainNode.gain.setTargetAtTime(0, startTime, 0.005);
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

export const MorseTrainer: React.FC = () => {
  const [method, setMethod] = useState<TrainingMethod>('koch');
  const [level, setLevel] = useState<number>(2);
  const [wpm, setWpm] = useState<number>(20);
  const [charWpm, setCharWpm] = useState<number>(20);
  const [frequency, setFrequency] = useState<number>(600);
  const [noiseLevel, setNoiseLevel] = useState<number>(0);
  
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

  // Level Up overlay & celebratory audio
  const [showLevelUpBanner, setShowLevelUpBanner] = useState<boolean>(false);
  
  // Interactive charting and stats
  const [showChart, setShowChart] = useState<boolean>(false);
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
    
    playerRef.current = new MorsePlayer(wpm, charWpm, frequency, noiseLevel);
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
      playerRef.current.setFrequency(frequency);
      playerRef.current.setNoiseLevel(noiseLevel);
    }
  }, [wpm, charWpm, frequency, noiseLevel]);

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
  }, [practiceMode, copyTypingStatus, copyTypingIndex, targetSequence, copyTypingTyped, copyTypingStartTime]);

  const generateSequence = () => {
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
    
    for (let i = 0; i < minLen; i++) {
      if (target[i] === user[i]) {
        correct++;
      }
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
      timestamp: Date.now()
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
    }, 450);
  };

  // REAL-TIME COPY TYPING: Handle typed key
  const handleCopyTypeChar = (char: string) => {
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
    for (let i = 0; i < target.length; i++) {
      if (target[i] === userTypedNoSpaces[i]?.toUpperCase()) {
        correct++;
      }
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
      timestamp: Date.now()
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
    if (maxWpmScored === 0) return { title: "Station X Trainee", icon: "badge", desc: "Report to Bletchley Park. Complete your first practice transmission to receive your assignment." };
    if (maxWpmScored < 10) return { title: "Novice Telegrapher (Straight Key)", icon: "keyboard", desc: "Building core hand-ear muscle memory. Operating a classic brass straight key." };
    if (maxWpmScored < 15) return { title: "Radio Transcriber (Cootie Key)", icon: "radio", desc: "Decoding tactical battlefield communications. Swiping letters on a double-speed keyer." };
    if (maxWpmScored < 22) return { title: "Station X Officer (Semi-Auto Bug)", icon: "campaign", desc: "Wartime intelligence officer decoding intercepted ciphers under stressful noise." };
    if (maxWpmScored < 30) return { title: "Cipher Commander (Electronic Keyer)", icon: "bolt", desc: "Elite dispatch leader overseeing critical cryptographic networks and high-priority cables." };
    return { title: "Bletchley Codebreaker (High-Speed Operator)", icon: "military_tech", desc: "Legendary decrypter. Capable of flawless copy speeds matching automated wartime transmitters." };
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

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16 relative">
      
      {/* Level Up Banner Overlay */}
      {showLevelUpBanner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/75 z-50 p-4 animate-fadeIn">
          <div className="bg-[#1b170e] border-2 border-[#ebc238] rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-[#ebc238] to-amber-500" />
            <span className="material-symbols-outlined text-5xl text-[#ebc238] animate-bounce">military_tech</span>
            <h2 className="font-ui-header font-bold text-2xl text-[#ede1cd] tracking-wider">LEVEL COMPLETED!</h2>
            <div className="h-0.5 bg-[#3b3426] my-2" />
            <p className="text-sm text-[#d1c4b7] leading-relaxed">
              Congratulations operator! You cracked the code and reached <strong className="text-[#ebc238]">Level {level}</strong>. 
            </p>
            <p className="text-xs text-[#a89985] italic">
              "The speed and volume of intercepted teleprinter signals demands our utmost rigor."
            </p>
            <button
              onClick={() => setShowLevelUpBanner(false)}
              className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded border border-amber-500 text-xs font-bold font-ui-header cursor-pointer uppercase tracking-wider transition-colors"
            >
              Resume Interception Desk
            </button>
          </div>
        </div>
      )}

      {/* Header Desk */}
      <div className="border-b border-[#3b3426] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-ui-header font-ui-header font-bold text-[#e3c193] text-2xl flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#ebc238]">school</span>
            Bletchley Morse Training Desk
          </h1>
          <p className="text-ui-body font-ui-body text-[#a89985] text-xs">
            Build auditory telegraph muscle-memory. Perfect the dits and dahs required for wartime intelligence.
          </p>
        </div>

        {/* Level Banner badge */}
        <div className="flex items-center gap-2 bg-[#201b0f] px-3 py-1.5 rounded-lg border border-[#3b3426] shrink-0">
          <span className="text-[10px] uppercase font-monospaced-technical text-[#8c7e6a] tracking-wider">Level Progress</span>
          <span className="text-amber-500 text-sm font-bold font-mono">{level} / {sequenceString.length}</span>
        </div>
      </div>

      {/* Operator Rank Badge Card */}
      <div className="bg-[#1b170e]/95 border-2 border-[#8b6f47]/40 rounded-lg p-4 shadow-panel flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#3b3426] flex items-center justify-center text-[#ebc238] border border-[#8b6f47]">
          <span className="material-symbols-outlined text-3xl">{operatorRank.icon}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase tracking-wider font-monospaced-technical text-[#ebc238]">Active Operator Assignment</span>
          <h3 className="font-ui-header font-bold text-sm text-[#ede1cd]">{operatorRank.title}</h3>
          <p className="text-[11px] text-[#a89985] leading-relaxed max-w-2xl">{operatorRank.desc} <strong className="text-[#ede1cd]">Best Speed: {maxWpmScored} WPM.</strong></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Radio Instrument Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Method and Speed Instrument dials */}
          <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel texture-metal space-y-4">
            <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-wider pb-1.5 border-b border-[#3b3426] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">tune</span>
              Telegrapher Speeds & System Settings
            </h3>

            {/* Method switch buttons */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-monospaced-technical text-[#8c7e6a] uppercase block">Training Curriculum Method</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMethod('koch')}
                  className={`py-1.5 font-ui-header font-bold text-xs rounded border transition-colors cursor-pointer ${
                    method === 'koch' 
                      ? 'bg-[#ebc238]/10 text-[#ebc238] border-[#ebc238]' 
                      : 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
                  }`}
                  title="The Koch method introduces characters one by one at full target speed."
                >
                  Koch Standard
                </button>
                <button
                  onClick={() => setMethod('lcwo')}
                  className={`py-1.5 font-ui-header font-bold text-xs rounded border transition-colors cursor-pointer ${
                    method === 'lcwo' 
                      ? 'bg-[#ebc238]/10 text-[#ebc238] border-[#ebc238]' 
                      : 'bg-[#120e04] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
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
                <div className="flex justify-between items-center text-xs font-monospaced-technical text-[#d1c4b7]">
                  <span>Lesson Characters Level</span>
                  <div className="flex items-center gap-1.5">
                    {bestAccuracy !== null && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        bestAccuracy >= 90 ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'
                      }`}>
                        Best: {bestAccuracy.toFixed(0)}%
                      </span>
                    )}
                    <span className="text-amber-500 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-[#3b3426]">{level}</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max={sequenceString.length} 
                  value={level} 
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full accent-[#ebc238] h-1 bg-[#120e04] rounded-lg cursor-pointer"
                />
                <div className="text-[11px] font-mono text-[#a89985] break-all p-2 bg-[#120e04] rounded border border-[#3b3426] leading-relaxed">
                  Characters in current pool: <strong className="text-[#ede1cd]">{currentChars}</strong>
                </div>
              </div>

              {/* Autoadvance option */}
              <div className="flex items-center justify-between p-2.5 bg-[#120e04] rounded border border-[#3b3426]">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#ede1cd] font-ui-header">Auto-Advance Lesson Level</span>
                  <span className="text-[9px] text-[#8c7e6a]">Automatically increment level on getting ≥90% accuracy.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#3b3426] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#8c7e6a] after:border-[#3b3426] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-[#ede1cd]" />
                </label>
              </div>

              {/* Speed slider dual-pack */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-monospaced-technical text-[#d1c4b7]">
                    <span>Letter Speed</span>
                    <span className="text-[#ebc238] bg-black/40 px-1 py-0.5 rounded border border-[#3b3426] font-mono">{charWpm} WPM</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    value={charWpm} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCharWpm(val);
                      if (wpm > val) setWpm(val);
                    }}
                    className="w-full accent-[#ebc238] h-1 bg-[#120e04] rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-monospaced-technical text-[#d1c4b7]">
                    <span>Farnsworth Gap</span>
                    <span className="text-[#ebc238] bg-black/40 px-1 py-0.5 rounded border border-[#3b3426] font-mono">{wpm} WPM</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={wpm} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWpm(val);
                      if (val > charWpm) setCharWpm(val);
                    }}
                    className="w-full accent-[#ebc238] h-1 bg-[#120e04] rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Freq and static noise dials */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-monospaced-technical text-[#d1c4b7]">
                    <span>Tone Pitch</span>
                    <span className="text-[#ebc238] bg-black/40 px-1 py-0.5 rounded border border-[#3b3426] font-mono">{frequency} Hz</span>
                  </div>
                  <input 
                    type="range" 
                    min="400" 
                    max="1000" 
                    step="20"
                    value={frequency} 
                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                    className="w-full accent-[#ebc238] h-1 bg-[#120e04] rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-monospaced-technical text-[#d1c4b7]">
                    <span>Radio Static</span>
                    <span className="text-[#ebc238] bg-black/40 px-1 py-0.5 rounded border border-[#3b3426] font-mono">{Math.round(noiseLevel * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="0.8" 
                    step="0.05"
                    value={noiseLevel} 
                    onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                    className="w-full accent-[#ebc238] h-1 bg-[#120e04] rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Group lengths */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-monospaced-technical text-[#d1c4b7] uppercase tracking-wider block mb-1">Words Count</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="30" 
                    value={groupCount}
                    onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 5))}
                    className="w-full bg-[#120e04] border border-[#3b3426] rounded p-1.5 text-[#ede1cd] font-mono text-center text-xs focus:border-[#ebc238] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-monospaced-technical text-[#d1c4b7] uppercase tracking-wider block mb-1">Word Size</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="8" 
                    value={groupLength}
                    onChange={(e) => setGroupLength(Math.max(1, parseInt(e.target.value) || 5))}
                    className="w-full bg-[#120e04] border border-[#3b3426] rounded p-1.5 text-[#ede1cd] font-mono text-center text-xs focus:border-[#ebc238] focus:outline-none"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column - Telegraph Practice Room */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Practice Mode Selection Tabs */}
          <div className="flex border-b border-[#3b3426]">
            <button
              onClick={() => {
                if (copyTypingStatus === 'playing') setCopyTypingStatus('idle');
                setPracticeMode('batch');
                setResult({ score: 0, accuracy: 0, show: false });
              }}
              className={`flex-1 pb-3 text-xs font-bold font-ui-header uppercase tracking-wider border-b-2 text-center transition-colors cursor-pointer ${
                practiceMode === 'batch'
                  ? 'border-[#ebc238] text-[#ede1cd]'
                  : 'border-transparent text-[#8c7e6a] hover:text-[#d1c4b7]'
              }`}
            >
              Classic Batch Copy
            </button>
            <button
              onClick={() => {
                if (isPlaying) {
                  if (playerRef.current) playerRef.current.stop();
                  setIsPlaying(false);
                }
                setPracticeMode('copy');
                setResult({ score: 0, accuracy: 0, show: false });
              }}
              className={`flex-1 pb-3 text-xs font-bold font-ui-header uppercase tracking-wider border-b-2 text-center transition-colors cursor-pointer ${
                practiceMode === 'copy'
                  ? 'border-[#ebc238] text-[#ede1cd]'
                  : 'border-transparent text-[#8c7e6a] hover:text-[#d1c4b7]'
              }`}
            >
              Real-Time Copy Typing
            </button>
          </div>

          {/* CLASSIC BATCH INTERACTION AREA */}
          {practiceMode === 'batch' && (
            <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel space-y-5 texture-metal">
              <div className="pb-1 border-b border-[#3b3426] flex justify-between items-center">
                <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-wider">
                  Operational Broadcast Transcribing
                </h3>
                <span className="text-[10px] font-monospaced-technical text-amber-500 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 font-bold">
                  Wartime Standard
                </span>
              </div>

              <div className="space-y-4">
                
                {/* Visualizer flasher */}
                <div className="h-10 bg-[#120e04] rounded border border-[#3b3426] flex items-center justify-center relative overflow-hidden">
                  {isPlaying ? (
                    <div className="flex items-center gap-2 text-amber-500 animate-pulse text-xs font-mono">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping absolute left-4" />
                      <span className="material-symbols-outlined text-lg">hearing</span>
                      <span>INCOMING TRANSMISSION PLAYING AT {wpm} WPM...</span>
                    </div>
                  ) : targetSequence ? (
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-mono">
                      <span className="material-symbols-outlined text-lg">task_alt</span>
                      <span>SIGNAL CAPTURED. STANDBY FOR TRANSCRIPT CORRECTION</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#8c7e6a] font-mono">BROADCASTER READY. PRESS TRANSMIT BELOW.</span>
                  )}
                </div>

                {/* Textarea transcription entry */}
                <div>
                  <label className="block text-[10px] font-monospaced-technical text-[#d1c4b7] uppercase tracking-wider mb-1.5">
                    Operator's Official Log Entry
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                    placeholder="Place hands on keyboard, listen carefully, and log characters here..."
                    className="w-full h-28 bg-[#120e04] border border-[#3b3426] rounded-lg p-3 text-[#e3c193] font-mono text-base focus:border-[#ebc238] focus:outline-none resize-none leading-relaxed select-text"
                    spellCheck="false"
                    disabled={isPlaying && !targetSequence}
                  />
                </div>

                {/* Batch buttons desk */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleStartBatch}
                    className={`py-3 rounded font-ui-header font-bold text-xs uppercase tracking-wider transition-colors border active:scale-[0.98] cursor-pointer ${
                      isPlaying 
                        ? 'bg-red-950/40 text-red-400 border-red-800 hover:bg-red-900/40' 
                        : 'bg-[#2a2215] text-[#ebc238] border-[#8b6f47] hover:bg-[#3b3426]'
                    }`}
                  >
                    {isPlaying ? 'Abrupt Stop' : 'Begin Transmission'}
                  </button>
                  
                  <button 
                    onClick={checkBatchAnswer}
                    disabled={isPlaying || !targetSequence || userInput.length === 0}
                    className="py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-45 text-white rounded border border-amber-500 font-ui-header font-bold text-xs uppercase tracking-wider transition-colors active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                  >
                    Submit Log For Audit
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* REAL-TIME COPY TYPING AREA */}
          {practiceMode === 'copy' && (
            <div className="bg-[#201b0f] border border-[#4e453b] rounded-lg p-5 shadow-panel space-y-5 texture-metal">
              <div className="pb-1 border-b border-[#3b3426] flex justify-between items-center">
                <h3 className="text-ui-header font-ui-header text-[#e3c193] text-xs uppercase tracking-wider">
                  Interactive Tape Ribbon Decoding
                </h3>
                <span className="text-[10px] font-monospaced-technical text-amber-500 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 font-bold">
                  Tactical Real-time
                </span>
              </div>

              {/* Start and helper options */}
              {copyTypingStatus === 'idle' && (
                <div className="bg-[#120e04] rounded border border-[#3b3426] p-6 text-center space-y-4">
                  <div className="flex justify-center gap-8 text-[#8c7e6a] text-[10px] uppercase font-monospaced-technical">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">keyboard</span>
                      <span>Instant typing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>Calculated WPM</span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-[#d1c4b7] max-w-sm mx-auto leading-normal">
                    Listen to characters one-by-one. Type the key instantly. The system will auto-feed the next character as you type. No textareas required!
                  </p>

                  <div className="flex justify-center items-center gap-4 py-1.5">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className={`px-3 py-1 text-[10px] font-ui-header rounded border transition-colors cursor-pointer ${
                        showHints 
                          ? 'bg-amber-600/10 border-amber-500 text-amber-400 font-bold' 
                          : 'bg-black/40 border-[#3b3426] text-[#8c7e6a]'
                      }`}
                    >
                      {showHints ? 'Show Visual Letter Hints: ON' : 'Show Visual Letter Hints: OFF'}
                    </button>
                  </div>

                  <button
                    onClick={startCopyTypingSession}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-ui-header font-bold rounded border border-amber-500 text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-950/20"
                  >
                    Start Real-Time Session
                  </button>
                </div>
              )}

              {/* ACTIVE SESSION TAPE SCREEN */}
              {copyTypingStatus === 'playing' && (
                <div className="space-y-4">
                  
                  {/* Glowing letter box tape */}
                  <div className="bg-black border border-[#3b3426] rounded-md p-4 overflow-x-auto">
                    <div className="flex gap-2 justify-center py-2">
                      {targetSequence.split('').map((char, idx) => {
                        const isCurrent = idx === copyTypingIndex;
                        const isPassed = idx < copyTypingIndex;
                        const typedVal = copyTypingTyped[idx];
                        const wasCorrect = typedVal && typedVal.toUpperCase() === char.toUpperCase();

                        if (char === ' ') {
                          return (
                            <div key={idx} className="w-5 h-10 border border-transparent flex items-center justify-center shrink-0">
                              <span className="text-[10px] text-[#8c7e6a]/40">•</span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className={`w-10 h-12 flex flex-col items-center justify-center rounded border font-bold transition-all relative shrink-0 ${
                              isCurrent
                                ? 'bg-amber-600/10 text-amber-400 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                : isPassed
                                ? wasCorrect
                                  ? 'bg-green-950/35 text-green-400 border-green-800'
                                  : 'bg-red-950/35 text-red-400 border-red-800'
                                : 'bg-[#120e04] text-[#8c7e6a]/30 border-[#3b3426]/50'
                            }`}
                          >
                            <span className="text-base">
                              {showHints || isPassed ? char : '?'}
                            </span>
                            
                            <span className="text-[8px] font-mono tracking-tighter block leading-none text-amber-500 opacity-60 mt-0.5">
                              {MORSE_CODE[char.toUpperCase()]}
                            </span>

                            {isPassed && (
                              <span className={`text-[9px] font-mono absolute -bottom-1.5 font-bold ${wasCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                {typedVal || '_'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time Instructions and escape */}
                  <div className="flex justify-between items-center text-xs font-monospaced-technical p-1">
                    <span className="text-amber-500 animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      SESSION ACTIVE: TYPE ON YOUR KEYBOARD NOW...
                    </span>
                    <button
                      onClick={() => setCopyTypingStatus('idle')}
                      className="text-[#8c7e6a] hover:text-red-400 border border-transparent hover:border-red-900 bg-black/30 hover:bg-red-950/20 px-2 py-0.5 rounded text-[10px] uppercase transition-colors cursor-pointer"
                    >
                      Abort Session
                    </button>
                  </div>
                </div>
              )}

              {/* COMPLETED SCREEN */}
              {copyTypingStatus === 'completed' && (
                <div className="bg-[#120e04] rounded border border-green-900/45 p-6 text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-green-400 animate-bounce">task_alt</span>
                  <h4 className="font-ui-header font-bold text-sm text-[#ede1cd] uppercase tracking-wider">
                    Session Log Captured Successfully
                  </h4>
                  <p className="text-xs text-[#a89985] max-w-sm mx-auto leading-normal">
                    Review your results, adjust lessons, or immediately spin up another telemetry ribbon.
                  </p>
                  <button
                    onClick={startCopyTypingSession}
                    className="px-5 py-2.5 bg-green-900 hover:bg-green-800 text-green-300 font-ui-header font-bold rounded border border-green-800 text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    Start Next Tape Session
                  </button>
                </div>
              )}

            </div>
          )}

          {/* SHARED PERFORMANCE RESULTS FEEDBACK SCREEN */}
          {result.show && (
            <div className={`p-4 rounded border-2 animate-fadeIn ${
              result.accuracy >= 90 ? 'bg-green-950/25 border-green-900/60 text-green-300' : 'bg-red-950/25 border-red-900/60 text-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">
                    {result.accuracy >= 90 ? 'check_circle' : 'warning'}
                  </span>
                  <span className="font-ui-header font-bold text-xs uppercase tracking-wider">Audit Results</span>
                </div>
                <span className={`text-2xl font-bold font-mono ${
                  result.accuracy >= 90 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.accuracy.toFixed(1)}% Accuracy
                </span>
              </div>
              
              {result.accuracy >= 90 ? (
                <p className="text-xs text-green-400 font-bold font-ui-body">
                  Excellent transcribing, Operator! You reached standard operational capability. Level Up initiated.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs text-red-400 font-bold font-ui-body">
                    Accuracy dropped below the 90% required. Revise character codes and retry.
                  </p>
                  <div className="text-[10px] font-mono p-2 bg-[#0d0a03] border border-[#3b3426] rounded text-[#ede1cd] break-all leading-relaxed uppercase">
                    Target: {targetSequence}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* DETAILED PROGRESS HISTORY CHART PANEL */}
      <div className="bg-[#120e04] border border-[#3b3426] rounded-lg p-6 shadow-2xl space-y-6">
        
        {/* Header line chart controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#3b3426]">
          <div>
            <h3 className="text-[#e3c193] font-ui-header font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-amber-500">insights</span>
              Historical Performance plotting
            </h3>
            <p className="text-[10px] text-[#8c7e6a]">Interactive graph monitoring telegraphy progress on Koch and LCWO trials.</p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex gap-1 bg-[#201b0f] p-1 rounded-md border border-[#3b3426] self-stretch sm:self-auto">
            <button
              onClick={() => setChartMetric('accuracy')}
              className={`flex-1 sm:flex-none px-3 py-1 text-[10px] font-ui-header font-bold uppercase rounded cursor-pointer ${
                chartMetric === 'accuracy' ? 'bg-[#ebc238] text-[#120e04]' : 'text-[#8c7e6a] hover:text-[#ede1cd]'
              }`}
            >
              Accuracy
            </button>
            <button
              onClick={() => setChartMetric('wpm')}
              className={`flex-1 sm:flex-none px-3 py-1 text-[10px] font-ui-header font-bold uppercase rounded cursor-pointer ${
                chartMetric === 'wpm' ? 'bg-[#ebc238] text-[#120e04]' : 'text-[#8c7e6a] hover:text-[#ede1cd]'
              }`}
            >
              Speed
            </button>
            <button
              onClick={() => setChartMetric('level')}
              className={`flex-1 sm:flex-none px-3 py-1 text-[10px] font-ui-header font-bold uppercase rounded cursor-pointer ${
                chartMetric === 'level' ? 'bg-[#ebc238] text-[#120e04]' : 'text-[#8c7e6a] hover:text-[#ede1cd]'
              }`}
            >
              Level
            </button>
          </div>
        </div>

        {/* The plot canvas screen */}
        <div className="relative">
          {chartData.length === 0 ? (
            <div className="bg-[#201b0f] rounded-lg border border-[#3b3426]/60 p-10 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#3b3426]">analytics</span>
              <h4 className="text-xs font-ui-header font-bold text-[#ede1cd] uppercase tracking-wider">No Telegraph History Captured</h4>
              <p className="text-[11px] text-[#a89985] max-w-sm mx-auto">
                Once you complete your first practice session in Classic Batch or Real-Time, your auditory progress charts will appear here.
              </p>
            </div>
          ) : svgChart ? (
            <div className="space-y-4">
              
              {/* SVG Plot container */}
              <div className="relative bg-[#0d0a03] rounded-lg p-2 border border-[#3b3426]/70 shadow-inner">
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
                    className="absolute bg-[#1a140a] border border-[#ebc238] p-2.5 rounded shadow-xl text-[10px] font-mono pointer-events-none z-30 space-y-1 text-[#ede1cd]"
                    style={{
                      left: `${(hoveredDataPoint.x / svgChart.width) * 100}%`,
                      top: `${(hoveredDataPoint.y / svgChart.height) * 100 - 30}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div className="font-bold text-[#ebc238] uppercase pb-0.5 border-b border-[#3b3426] tracking-wider">
                      Practice Run #{hoveredDataPoint.index + 1}
                    </div>
                    <div>Level: <span className="text-[#ede1cd] font-bold">{hoveredDataPoint.level}</span></div>
                    <div>Accuracy: <span className="text-[#ede1cd] font-bold">{hoveredDataPoint.accuracy.toFixed(1)}%</span></div>
                    <div>Speed: <span className="text-[#ede1cd] font-bold">{hoveredDataPoint.wpm || 0} WPM</span></div>
                    <div>Mode: <span className="text-amber-500 font-bold uppercase">{hoveredDataPoint.mode === 'copy' ? 'Realtime' : 'Classic'}</span></div>
                    <div className="text-[8px] text-[#8c7e6a] pt-0.5">
                      {new Date(hoveredDataPoint.timestamp).toLocaleDateString()} {new Date(hoveredDataPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}

              </div>

              {/* Table details list */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5">
                <span className="text-[10px] text-[#8c7e6a] uppercase tracking-wider font-monospaced-technical">
                  Displaying last {chartData.length} trial records. Hover nodes to audit parameters.
                </span>
                <button
                  onClick={resetStats}
                  className="text-xs text-[#8c7e6a] hover:text-red-400 font-bold font-ui-header uppercase border border-transparent hover:border-red-900 bg-black/40 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Clear Plot History
                </button>
              </div>

            </div>
          ) : null}
        </div>

      </div>

      {/* Morse Alphabet Reference card */}
      <div className="border-t border-[#3b3426] pt-6">
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center gap-2 text-[#a89985] font-ui-header font-bold text-xs uppercase mb-2 hover:text-[#ebc238] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">
            {showChart ? 'expand_less' : 'expand_more'}
          </span>
          Auditory Code Reference Sheet
        </button>
        
        {showChart && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2 bg-[#201b0f] p-4 rounded border border-[#3b3426] animate-fadeIn select-none">
            {Object.entries(MORSE_CODE).map(([char, code]) => (
              <div 
                key={char} 
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.playSequence(char);
                  }
                }}
                className="flex flex-col items-center justify-center p-2 border border-[#3b3426]/50 rounded bg-[#120e04] hover:border-[#ebc238] hover:bg-[#201b0f] transition-all cursor-pointer hover:scale-105"
                title="Click to play code pitch sound"
              >
                <span className="text-[#e3c193] font-bold text-lg leading-none mb-1">{char}</span>
                <span className="text-[#ebc238] font-mono text-xs tracking-widest">{code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
