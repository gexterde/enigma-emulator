import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useTheme, getTheme } from '../lib/theme';
//import React, { useState, useEffect, useRef } from 'react';
import { textToMorseTokens, MorseToken } from '../lib/morse';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  plaintext: string;
  ciphertext: string;
  headerString: string;
  soundEnabled: boolean;
}

type BroadcastSource = 'ciphertext' | 'plaintext' | 'full';
type NoiseType = 'static' | 'atmospheric' | 'crackle';

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  plaintext,
  ciphertext,
  headerString,
  soundEnabled: initialSoundEnabled,
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [source, setSource] = useState<BroadcastSource>('ciphertext');
  const [wpm, setWpm] = useState<number>(15); // Words per minute
  const [frequency, setFrequency] = useState<number>(700); // Hz
  const [localSound, setLocalSound] = useState<boolean>(initialSoundEnabled);
  
  // Background Noise Settings
  const [noiseVolume, setNoiseVolume] = useState<number>(30); // 0 to 100
  const [noiseType, setNoiseType] = useState<NoiseType>('atmospheric');
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState<number>(-1);
  const [isToneActive, setIsToneActive] = useState<boolean>(false);

  // Refs for tracking playback state inside asynchronous timeouts without stale closures
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Noise audio refs
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);

  const timeoutRef = useRef<number | null>(null);

  // Sync props
  useEffect(() => {
    setLocalSound(initialSoundEnabled);
  }, [initialSoundEnabled]);

  // Update noise gain dynamically when noiseVolume changes
  useEffect(() => {
    if (noiseGainRef.current && audioCtxRef.current) {
      const targetGain = (noiseVolume / 100) * 0.15;
      noiseGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
  }, [noiseVolume]);

  const getActiveText = (): string => {
    switch (source) {
      case 'plaintext':
        return plaintext || '(No plaintext input)';
      case 'ciphertext':
        return ciphertext || '(No ciphertext output)';
      case 'full':
        return `${headerString}\n\n${ciphertext || ''}`;
    }
  };

  const activeText = getActiveText();
  const tokens: MorseToken[] = textToMorseTokens(activeText);

  // Timing calculation
  const dotDuration = Math.round(1200 / wpm);
  const dashDuration = dotDuration * 3;
  const elementGap = dotDuration;
  const letterGap = dotDuration * 3;
  const wordGap = dotDuration * 7;

  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Start Background Noise Generator
  const startBackgroundNoise = () => {
    if (!localSound || noiseVolume === 0) return;
    try {
      const ctx = getAudioContext();
      if (noiseSourceRef.current) return; // Already running

      // Create 5 seconds of white/pink noise buffer
      const bufferSize = ctx.sampleRate * 5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate noise based on type
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (noiseType === 'atmospheric') {
          // Pink noise approximation (Paul Kellet's method)
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        } else if (noiseType === 'crackle') {
          // Static with occasional atmospheric clicks/pops
          output[i] = (Math.random() > 0.9985 ? (Math.random() * 4 - 2) : (white * 0.3));
        } else {
          // Standard white noise static
          output[i] = white * 0.2;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = noiseType === 'atmospheric' ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(noiseType === 'atmospheric' ? 1200 : 2500, ctx.currentTime);
      filter.Q.setValueAtTime(noiseType === 'atmospheric' ? 1.5 : 0.8, ctx.currentTime);

      const gain = ctx.createGain();
      const initialGain = (noiseVolume / 100) * 0.15;
      gain.gain.setValueAtTime(initialGain, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);

      noiseSourceRef.current = whiteNoise;
      noiseGainRef.current = gain;
      noiseFilterRef.current = filter;
    } catch (e) {
      console.debug('Noise generator error:', e);
    }
  };

  const stopBackgroundNoise = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (noiseGainRef.current) {
        noiseGainRef.current.disconnect();
        noiseGainRef.current = null;
      }
      if (noiseFilterRef.current) {
        noiseFilterRef.current.disconnect();
        noiseFilterRef.current = null;
      }
    } catch (e) {
      console.debug('Noise stop error:', e);
    }
  };

  const startTone = () => {
    if (!localSound) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (oscillatorRef.current) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsToneActive(true);
    } catch (e) {
      console.debug('Tone start error:', e);
    }
  };

  const stopTone = () => {
    try {
      if (oscillatorRef.current && gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(0.001, audioCtxRef.current.currentTime, 0.01);
        setTimeout(() => {
          try {
            oscillatorRef.current?.stop();
            oscillatorRef.current?.disconnect();
          } catch {
            // ignore
          }
          oscillatorRef.current = null;
          gainNodeRef.current = null;
        }, 15);
      }
      setIsToneActive(false);
    } catch (e) {
      console.debug('Tone stop error:', e);
    }
  };

  const stopPlayback = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopTone();
    stopBackgroundNoise();
    isPlayingRef.current = false;
    isPausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setCurrentSymbolIndex(-1);
  };

  const pausePlayback = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopTone();
    stopBackgroundNoise();
    isPlayingRef.current = false;
    isPausedRef.current = true;
    setIsPlaying(false);
    setIsPaused(true);
  };

  const resumePlayback = () => {
    if (!activeText.trim()) return;
    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    startBackgroundNoise();
    playSequence(currentIndexRef.current);
  };

  const startPlayback = () => {
    stopPlayback();
    if (!activeText.trim()) return;

    // Unlock audio context on user interaction
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {
      // ignore
    }

    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setCurrentSymbolIndex(-1);
    
    startBackgroundNoise();
    playSequence(0);
  };

  const playSequence = (tokenIdx: number) => {
    if (!isPlayingRef.current) return;
    if (tokenIdx >= tokens.length) {
      stopPlayback();
      return;
    }

    currentIndexRef.current = tokenIdx;
    setCurrentIndex(tokenIdx);
    const token = tokens[tokenIdx];

    if (!token || !token.morse || token.char === ' ') {
      setCurrentSymbolIndex(-1);
      const delay = token?.char === ' ' ? wordGap : letterGap;
      timeoutRef.current = window.setTimeout(() => {
        if (isPlayingRef.current) {
          playSequence(tokenIdx + 1);
        }
      }, delay);
      return;
    }

    playSymbol(tokenIdx, 0, token.morse);
  };

  const playSymbol = (tokenIdx: number, symbolIdx: number, morseStr: string) => {
    if (!isPlayingRef.current) return;

    if (symbolIdx >= morseStr.length) {
      setCurrentSymbolIndex(-1);
      timeoutRef.current = window.setTimeout(() => {
        if (isPlayingRef.current) {
          playSequence(tokenIdx + 1);
        }
      }, letterGap);
      return;
    }

    setCurrentSymbolIndex(symbolIdx);
    const symbol = morseStr[symbolIdx];
    const duration = symbol === '.' ? dotDuration : dashDuration;

    startTone();

    timeoutRef.current = window.setTimeout(() => {
      stopTone();

      timeoutRef.current = window.setTimeout(() => {
        if (isPlayingRef.current) {
          playSymbol(tokenIdx, symbolIdx + 1, morseStr);
        }
      }, elementGap);
    }, duration);
  };

  // Cleanup on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopPlayback();
    }
    return () => {
      stopPlayback();
    };
  }, [isOpen]);

  // Restart noise if type changes while playing
  useEffect(() => {
    if (isPlaying && localSound) {
      stopBackgroundNoise();
      startBackgroundNoise();
    }
  }, [noiseType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className={`${t.modalBg} border-2 ${t.borderAccent}/70 rounded-lg shadow-2xl w-full max-w-2xl p-6 ${t.textPrimary} flex flex-col gap-4 max-h-[90vh] overflow-y-auto`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${t.borderBase} pb-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full border transition-all ${isToneActive ? t.accentSolidBg + ' border-current shadow-lg animate-pulse' : t.mutedBg + ' ' + t.borderBase}`} />
            <div>
              <h3 className={`text-base sm:text-lg font-bold ${t.fontMono} ${t.textAccent} uppercase tracking-wide flex items-center gap-2`}>
                <span className="material-symbols-outlined text-[20px]">rss_feed</span>
                Funktelegramm Radio Broadcast (Morse Code)
              </h3>
              <p className={`text-xs ${t.textMuted} font-mono`}>
                Audio-visual Morse code transmitter operating at {frequency}Hz ({wpm} WPM)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className={`${t.textMuted} hover:${t.textPrimary} p-1.5 rounded transition-colors cursor-pointer ${t.mutedBg} border ${t.borderBase}`}
            title="Close Broadcast"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Source Selector & Audio Toggle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] ${t.textMuted} uppercase ${t.fontMono} tracking-wider`}>
              Select Transmission Source:
            </span>
            <button
              type="button"
              onClick={() => {
                const newSound = !localSound;
                setLocalSound(newSound);
                if (!newSound) stopBackgroundNoise();
                else if (isPlaying) startBackgroundNoise();
              }}
              className={`text-[10px] ${t.fontMono} font-bold uppercase px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                localSound
                  ? t.successBadge
                  : t.dangerBadge
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {localSound ? 'volume_up' : 'volume_off'}
              </span>
              {localSound ? 'Sound ON' : 'Sound OFF'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                setSource('ciphertext');
              }}
              className={`py-2 px-3 rounded text-xs ${t.fontMono} font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                source === 'ciphertext'
                  ? t.activeBadge
                  : t.inactiveBadge
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Ciphertext Output
            </button>
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                setSource('plaintext');
              }}
              className={`py-2 px-3 rounded text-xs ${t.fontMono} font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                source === 'plaintext'
                  ? t.activeBadge
                  : t.inactiveBadge
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              Plaintext Input
            </button>
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                setSource('full');
              }}
              className={`py-2 px-3 rounded text-xs ${t.fontMono} font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                source === 'full'
                  ? t.activeBadge
                  : t.inactiveBadge
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">description</span>
              Full Transmission
            </button>
          </div>
        </div>

        {/* Display Active Text & Morse Ticker */}
        <div className={`${t.panelInner} border ${t.borderBase} rounded-lg p-3 flex flex-col gap-2.5 min-h-[110px] shadow-inner`}>
          <div className={`flex items-center justify-between text-[10px] ${t.textMuted} uppercase ${t.fontMono} border-b ${t.borderBase} pb-1.5`}>
            <span>Transmission Content Preview</span>
            <span>Character {Math.min(currentIndex + 1, tokens.length)} of {tokens.length}</span>
          </div>

          <div className={`${t.fontMono} text-sm sm:text-base tracking-widest leading-relaxed break-all max-h-[80px] overflow-y-auto px-1`}>
            {tokens.map((token, idx) => {
              const isCurrent = idx === currentIndex && (isPlaying || isPaused);
              return (
                <span
                  key={idx}
                  className={`transition-colors duration-100 ${
                    isCurrent
                      ? `${t.accentLightBg} ${t.textAccent} px-0.5 rounded font-bold underline decoration-current underline-offset-4`
                      : idx < currentIndex && (isPlaying || isPaused)
                      ? t.textSecondary + ' opacity-60'
                      : t.textPrimary
                  }`}
                >
                  {token.char}
                </span>
              );
            })}
          </div>

          {/* Current Morse symbol indicator */}
          {isPlaying && tokens[currentIndex] && (
            <div className={`flex items-center gap-2 pt-1.5 border-t ${t.borderBase}/50`}>
              <span className={`text-[10px] ${t.textMuted} uppercase font-mono`}>Current Morse:</span>
              <span className={`text-xs font-mono font-bold ${t.textAccent} tracking-widest ${t.indicatorBg} px-2 py-0.5 rounded border ${t.borderBase}`}>
                {tokens[currentIndex].morse.split('').map((sym, sIdx) => (
                  <span
                    key={sIdx}
                    className={sIdx === currentSymbolIndex ? `${t.textPrimary} ${t.accentSolidBg} px-1 rounded mx-0.5` : t.textSecondary}
                  >
                    {sym}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Controls & Sliders */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${t.wellBg} p-3.5 rounded-lg border ${t.borderBase}`}>
          <div className="flex flex-col gap-1.5">
            <div className={`flex justify-between text-xs ${t.fontMono}`}>
              <span className={`${t.textMuted} uppercase`}>Speed (WPM):</span>
              <span className={`${t.textAccent} font-bold`}>{wpm} WPM</span>
            </div>
            <input
              type="range"
              min="8"
              max="30"
              step="1"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="accent-[#ebc238] cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className={`flex justify-between text-xs ${t.fontMono}`}>
              <span className={`${t.textMuted} uppercase`}>Tone Pitch (Hz):</span>
              <span className={`${t.textAccent} font-bold`}>{frequency} Hz</span>
            </div>
            <input
              type="range"
              min="400"
              max="1000"
              step="50"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="accent-[#ebc238] cursor-pointer"
            />
          </div>
        </div>

        {/* Background Radio Noise Settings */}
        <div className={`${t.wellBg} p-3.5 rounded-lg border ${t.borderBase} flex flex-col gap-3`}>
          <div className={`flex items-center justify-between text-xs ${t.fontMono} border-b ${t.borderBase} pb-2`}>
            <span className={`${t.textAccent} uppercase font-bold flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-[16px]">waves</span>
              Radio Static & Atmospheric Noise
            </span>
            <div className="flex items-center gap-1.5">
              {(['atmospheric', 'static', 'crackle'] as NoiseType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoiseType(type)}
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    noiseType === type
                      ? t.activeBadge
                      : t.inactiveBadge
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className={`flex justify-between text-xs ${t.fontMono}`}>
              <span className={`${t.textMuted} uppercase`}>Static Volume:</span>
              <span className={`${t.textAccent} font-bold`}>{noiseVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={noiseVolume}
              onChange={(e) => setNoiseVolume(Number(e.target.value))}
              className="accent-[#ebc238] cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center justify-between pt-2 border-t ${t.borderBase}`}>
          <div className={`text-[10px] ${t.textMuted} font-mono italic`}>
            {!localSound ? '⚠️ Audio output is muted' : isPlaying ? '🔊 Broadcasting with radio static active' : '🔊 Ready to broadcast'}
          </div>

          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                type="button"
                onClick={pausePlayback}
                className={`text-xs ${t.fontMono} font-bold uppercase px-4 py-2 rounded border ${t.borderAccent} ${t.accentLightBg} ${t.textAccent} hover:opacity-80 transition-all cursor-pointer flex items-center gap-1.5`}
              >
                <span className="material-symbols-outlined text-[16px]">pause</span>
                Pause
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={resumePlayback}
                disabled={!activeText.trim()}
                className={`text-xs ${t.fontMono} font-bold uppercase px-4 py-2 rounded border ${t.borderAccent} ${t.buttonHighlight} transition-all cursor-pointer flex items-center gap-1.5 shadow`}
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={startPlayback}
                disabled={!activeText.trim()}
                className={`text-xs ${t.fontMono} font-bold uppercase px-5 py-2 rounded border transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                  !activeText.trim()
                    ? t.mutedBg + ' ' + t.textMuted
                    : t.buttonHighlight
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">podcasts</span>
                Start Broadcast
              </button>
            )}

            {(isPlaying || isPaused) && (
              <button
                type="button"
                onClick={stopPlayback}
                className={`text-xs ${t.fontMono} font-bold uppercase px-3 py-2 rounded border ${t.borderBase} ${t.mutedBg} ${t.textPrimary} hover:opacity-80 transition-all cursor-pointer flex items-center gap-1`}
                title="Stop transmission"
              >
                <span className="material-symbols-outlined text-[16px]">stop</span>
                Stop
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
