import React, { useState, useEffect, useRef } from 'react';

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

interface LevelStats {
  level: number;
  method: TrainingMethod;
  accuracy: number;
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
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [targetSequence, setTargetSequence] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [result, setResult] = useState<{ score: number, accuracy: number, show: boolean }>({ score: 0, accuracy: 0, show: false });
  const [groupCount, setGroupCount] = useState<number>(5);
  const [groupLength, setGroupLength] = useState<number>(5);
  
  const [showChart, setShowChart] = useState<boolean>(false);
  
  const [stats, setStats] = useState<LevelStats[]>([]);
  
  const playerRef = useRef<MorsePlayer | null>(null);

  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('morse_trainer_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch(e) {}
    
    playerRef.current = new MorsePlayer(wpm, charWpm, frequency, noiseLevel);
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setEffWPM(wpm);
      playerRef.current.setCharWPM(charWpm);
      playerRef.current.setFrequency(frequency);
      playerRef.current.setNoiseLevel(noiseLevel);
    }
  }, [wpm, charWpm, frequency, noiseLevel]);

  const sequenceString = METHODS[method];

  // Adjust level if method changes
  useEffect(() => {
    if (level > sequenceString.length) {
      setLevel(sequenceString.length);
    }
  }, [method, sequenceString.length, level]);

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

  const handleStart = () => {
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

  const checkAnswer = () => {
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
    setResult({ score: correct, accuracy, show: true });
    
    // Save stats
    const newStat: LevelStats = {
      level,
      method,
      accuracy,
      timestamp: Date.now()
    };
    const newStats = [...stats, newStat];
    setStats(newStats);
    try {
      localStorage.setItem('morse_trainer_stats', JSON.stringify(newStats));
    } catch(e) {}
  };

  const currentChars = sequenceString.slice(0, level).split('').join(' ');
  
  // Highest accuracy for current level & method
  const currentLevelStats = stats.filter(s => s.method === method && s.level === level);
  const bestAccuracy = currentLevelStats.length > 0 ? Math.max(...currentLevelStats.map(s => s.accuracy)) : null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-ui-header font-ui-header font-bold text-[#e3c193] text-2xl">Morse Trainer</h1>
          <p className="text-ui-body font-ui-body text-[#a89985]">Learn telegraphy step-by-step</p>
        </div>
      </div>

      <div className="bg-[#120e04] border border-[#3b3426] rounded-lg p-6 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Settings Section */}
          <div className="space-y-6">
            <h2 className="text-[#ebc238] font-ui-header font-bold text-lg mb-4 border-b border-[#3b3426] pb-2">Training Settings</h2>
            
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setMethod('koch')}
                className={`flex-1 py-2 font-ui-header font-bold rounded border transition-colors ${
                  method === 'koch' 
                    ? 'bg-[#3b3426] text-[#ebc238] border-[#8b6f47]' 
                    : 'bg-[#201b0f] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
                }`}
              >
                Koch Method
              </button>
              <button
                onClick={() => setMethod('lcwo')}
                className={`flex-1 py-2 font-ui-header font-bold rounded border transition-colors ${
                  method === 'lcwo' 
                    ? 'bg-[#3b3426] text-[#ebc238] border-[#8b6f47]' 
                    : 'bg-[#201b0f] text-[#8c7e6a] border-[#3b3426] hover:text-[#d1c4b7]'
                }`}
              >
                LCWO Method
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[#d1c4b7] font-ui-body text-sm font-bold uppercase tracking-wider">Lesson / Level ({level})</label>
                <div className="flex items-center gap-2">
                  {bestAccuracy !== null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bestAccuracy >= 90 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                    }`}>
                      Best: {bestAccuracy.toFixed(0)}%
                    </span>
                  )}
                  <span className="text-[#ebc238] text-xs font-mono bg-[#201b0f] px-2 py-1 rounded border border-[#3b3426]">{level} / {sequenceString.length}</span>
                </div>
              </div>
              <input 
                type="range" 
                min="2" 
                max={sequenceString.length} 
                value={level} 
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className="w-full accent-[#ebc238]"
              />
              <div className="mt-2 text-xs font-mono text-[#a89985] break-all">
                Characters: <span className="text-[#e3c193] font-bold">{currentChars}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#d1c4b7] font-ui-body text-[10px] font-bold uppercase tracking-wider">Char Speed (WPM)</label>
                  <span className="text-[#ebc238] text-[10px] font-mono bg-[#201b0f] px-1 py-0.5 rounded border border-[#3b3426]">{charWpm}</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  value={charWpm} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setCharWpm(val);
                    if (wpm > val) setWpm(val);
                  }}
                  className="w-full accent-[#ebc238]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#d1c4b7] font-ui-body text-[10px] font-bold uppercase tracking-wider">Eff. Speed (WPM)</label>
                  <span className="text-[#ebc238] text-[10px] font-mono bg-[#201b0f] px-1 py-0.5 rounded border border-[#3b3426]">{wpm}</span>
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
                  className="w-full accent-[#ebc238]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#d1c4b7] font-ui-body text-[10px] font-bold uppercase tracking-wider">Freq (Hz)</label>
                  <span className="text-[#ebc238] text-[10px] font-mono bg-[#201b0f] px-1 py-0.5 rounded border border-[#3b3426]">{frequency}</span>
                </div>
                <input 
                  type="range" 
                  min="300" 
                  max="1200" 
                  step="10"
                  value={frequency} 
                  onChange={(e) => setFrequency(parseInt(e.target.value))}
                  className="w-full accent-[#ebc238]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#d1c4b7] font-ui-body text-[10px] font-bold uppercase tracking-wider">Noise/Static Level</label>
                  <span className="text-[#ebc238] text-[10px] font-mono bg-[#201b0f] px-1 py-0.5 rounded border border-[#3b3426]">
                    {Math.round(noiseLevel * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={noiseLevel} 
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  className="w-full accent-[#ebc238]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#d1c4b7] font-ui-body text-xs font-bold uppercase tracking-wider mb-2">Groups</label>
                <input 
                  type="number" 
                  min="1" 
                  max="50" 
                  value={groupCount}
                  onChange={(e) => setGroupCount(parseInt(e.target.value))}
                  className="w-full bg-[#201b0f] border border-[#4e453b] rounded p-2 text-[#e3c193] font-mono text-center focus:border-[#ebc238] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#d1c4b7] font-ui-body text-xs font-bold uppercase tracking-wider mb-2">Group Length</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={groupLength}
                  onChange={(e) => setGroupLength(parseInt(e.target.value))}
                  className="w-full bg-[#201b0f] border border-[#4e453b] rounded p-2 text-[#e3c193] font-mono text-center focus:border-[#ebc238] focus:outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleStart}
              className={`w-full py-4 rounded font-ui-header font-bold text-lg uppercase tracking-wider transition-colors border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-[0.98] ${
                isPlaying 
                  ? 'bg-[#93000a] text-[#ffdad6] border-red-800 hover:bg-red-900' 
                  : 'bg-[#2a2215] text-[#ebc238] border-[#8b6f47] hover:bg-[#3b3426] hover:text-[#f8d75e]'
              }`}
            >
              {isPlaying ? 'Stop Transmission' : 'Start Transmission'}
            </button>
          </div>

          {/* Practice Section */}
          <div className="space-y-6">
            <h2 className="text-[#ebc238] font-ui-header font-bold text-lg mb-4 border-b border-[#3b3426] pb-2">Practice</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#d1c4b7] font-ui-body text-xs font-bold uppercase tracking-wider mb-2">Your Input</label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                  placeholder="Type what you hear..."
                  className="w-full h-32 bg-[#201b0f] border border-[#4e453b] rounded-lg p-4 text-[#e3c193] font-mono text-lg focus:border-[#ebc238] focus:outline-none resize-none"
                  spellCheck="false"
                />
              </div>

              <button 
                onClick={checkAnswer}
                disabled={isPlaying || !targetSequence || userInput.length === 0}
                className="w-full py-3 bg-[#3b3426] text-[#e3c193] rounded border border-[#4e453b] font-ui-header font-bold uppercase tracking-wider hover:bg-[#4e453b] hover:text-[#f8d75e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>

              {result.show && (
                <div className={`p-4 rounded border ${
                  result.accuracy >= 90 ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-ui-header font-bold text-[#d1c4b7]">Accuracy:</span>
                    <span className={`text-2xl font-bold font-mono ${
                      result.accuracy >= 90 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  
                  {result.accuracy >= 90 ? (
                    <p className="text-green-400 text-sm font-bold">Excellent! You are ready to advance to the next level.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-400 text-sm font-bold mb-2">Keep practicing! You need 90% to advance.</p>
                      <div>
                        <span className="block text-xs text-[#a89985] mb-1">Target:</span>
                        <div className="font-mono text-sm text-[#e3c193] break-all p-2 bg-black/40 rounded border border-[#3b3426]">{targetSequence}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Statistics Mini-view */}
            {stats.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[#a89985] font-ui-header font-bold text-sm uppercase mb-3">Recent Results</h3>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-2">
                  {stats.slice().reverse().slice(0, 5).map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-[#201b0f] p-2 rounded border border-[#3b3426]">
                      <span className="text-[#d1c4b7]">Level {s.level} ({s.method.toUpperCase()})</span>
                      <span className={`font-mono font-bold ${s.accuracy >= 90 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Morse Chart Section */}
        <div className="mt-8 border-t border-[#3b3426] pt-6">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 text-[#a89985] font-ui-header font-bold text-sm uppercase mb-2 hover:text-[#ebc238] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              {showChart ? 'expand_less' : 'expand_more'}
            </span>
            Morse Code Chart
          </button>
          
          {showChart && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2 bg-[#201b0f] p-4 rounded border border-[#3b3426]">
              {Object.entries(MORSE_CODE).map(([char, code]) => (
                <div 
                  key={char} 
                  onClick={() => {
                    if (playerRef.current) {
                      playerRef.current.playSequence(char);
                    }
                  }}
                  className="flex flex-col items-center justify-center p-2 border border-[#3b3426]/50 rounded bg-[#120e04] hover:border-[#ebc238] hover:bg-[#201b0f] transition-colors cursor-pointer"
                >
                  <span className="text-[#e3c193] font-bold text-lg leading-none mb-1">{char}</span>
                  <span className="text-[#ebc238] font-mono text-sm tracking-widest">{code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
