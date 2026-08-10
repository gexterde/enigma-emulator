import React, { useState, useEffect, useRef } from 'react';
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

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  plaintext,
  ciphertext,
  headerString,
  soundEnabled: initialSoundEnabled,
}) => {
  const [source, setSource] = useState<BroadcastSource>('ciphertext');
  const [wpm, setWpm] = useState<number>(15); // Words per minute
  const [frequency, setFrequency] = useState<number>(700); // Hz
  const [localSound, setLocalSound] = useState<boolean>(initialSoundEnabled);
  
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
  const timeoutRef = useRef<number | null>(null);

  // Sync props
  useEffect(() => {
    setLocalSound(initialSoundEnabled);
  }, [initialSoundEnabled]);

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

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopPlayback();
    }
    return () => {
      stopPlayback();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#18130a] border-2 border-[#ebc238]/70 rounded-lg shadow-2xl w-full max-w-2xl p-6 text-[#ede1cd] flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3b3426] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full border transition-all ${isToneActive ? 'bg-[#ebc238] border-[#ffe066] shadow-[0_0_12px_#ebc238]' : 'bg-[#2a2214] border-[#4e453b]'}`} />
            <div>
              <h3 className="text-base sm:text-lg font-bold font-monospaced-technical text-[#ebc238] uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">rss_feed</span>
                Funktelegramm Radio Broadcast (Morse Code)
              </h3>
              <p className="text-xs text-[#8c7e6a] font-mono">
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
            className="text-[#8c7e6a] hover:text-[#ede1cd] p-1.5 rounded transition-colors cursor-pointer bg-[#221c11] border border-[#4e453b]"
            title="Close Broadcast"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Source Selector & Audio Toggle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8c7e6a] uppercase font-monospaced-technical tracking-wider">
              Select Transmission Source:
            </span>
            <button
              type="button"
              onClick={() => setLocalSound(!localSound)}
              className={`text-[10px] font-monospaced-technical font-bold uppercase px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                localSound
                  ? 'bg-[#1b5e20]/40 text-[#e8f5e9] border-[#2e7d32]'
                  : 'bg-[#2a1a1a] text-[#ff8a80] border-[#5c2b2b]'
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
              className={`py-2 px-3 rounded text-xs font-monospaced-technical font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                source === 'ciphertext'
                  ? 'bg-[#ebc238] text-[#17130b] border-[#ebc238]'
                  : 'bg-[#1b160e] text-[#d1c4b7] border-[#4e453b] hover:bg-[#261f14]'
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
              className={`py-2 px-3 rounded text-xs font-monospaced-technical font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                source === 'plaintext'
                  ? 'bg-[#ebc238] text-[#17130b] border-[#ebc238]'
                  : 'bg-[#1b160e] text-[#d1c4b7] border-[#4e453b] hover:bg-[#261f14]'
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
              className={`py-2 px-3 rounded text-xs font-monospaced-technical font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                source === 'full'
                  ? 'bg-[#ebc238] text-[#17130b] border-[#ebc238]'
                  : 'bg-[#1b160e] text-[#d1c4b7] border-[#4e453b] hover:bg-[#261f14]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">description</span>
              Full Transmission
            </button>
          </div>
        </div>

        {/* Display Active Text & Morse Ticker */}
        <div className="bg-[#120e04] border border-[#4e453b] rounded-lg p-4 flex flex-col gap-3 min-h-[130px] shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-[#8c7e6a] uppercase font-monospaced-technical border-b border-[#3b3426] pb-2">
            <span>Transmission Content Preview</span>
            <span>Character {Math.min(currentIndex + 1, tokens.length)} of {tokens.length}</span>
          </div>

          <div className="font-monospaced-technical text-sm sm:text-base tracking-widest leading-relaxed break-all max-h-[90px] overflow-y-auto px-1">
            {tokens.map((t, idx) => {
              const isCurrent = idx === currentIndex && (isPlaying || isPaused);
              return (
                <span
                  key={idx}
                  className={`transition-colors duration-100 ${
                    isCurrent
                      ? 'text-[#ebc238] bg-[#ebc238]/20 px-0.5 rounded font-bold underline decoration-[#ebc238] underline-offset-4'
                      : idx < currentIndex && (isPlaying || isPaused)
                      ? 'text-[#635848]'
                      : 'text-[#ede1cd]'
                  }`}
                >
                  {t.char}
                </span>
              );
            })}
          </div>

          {/* Current Morse symbol indicator */}
          {isPlaying && tokens[currentIndex] && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#3b3426]/50">
              <span className="text-[10px] text-[#8c7e6a] uppercase font-mono">Current Morse:</span>
              <span className="text-xs font-mono font-bold text-[#ebc238] tracking-widest bg-[#221c11] px-2 py-0.5 rounded border border-[#4e453b]">
                {tokens[currentIndex].morse.split('').map((sym, sIdx) => (
                  <span
                    key={sIdx}
                    className={sIdx === currentSymbolIndex ? 'text-white bg-[#ebc238] px-1 rounded mx-0.5' : 'text-[#8c7e6a]'}
                  >
                    {sym}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Controls & Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#141007] p-4 rounded-lg border border-[#3b3426]">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-monospaced-technical">
              <span className="text-[#8c7e6a] uppercase">Speed (WPM):</span>
              <span className="text-[#ebc238] font-bold">{wpm} WPM</span>
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
            <div className="flex justify-between text-xs font-monospaced-technical">
              <span className="text-[#8c7e6a] uppercase">Tone Pitch (Hz):</span>
              <span className="text-[#ebc238] font-bold">{frequency} Hz</span>
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3b3426]">
          <div className="text-[10px] text-[#8c7e6a] font-mono italic">
            {!localSound ? '⚠️ Audio output is muted' : '🔊 Wireless morse audio transmitter active'}
          </div>

          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                type="button"
                onClick={pausePlayback}
                className="text-xs font-monospaced-technical font-bold uppercase px-4 py-2 rounded border border-[#ebc238] bg-[#ebc238]/20 text-[#ebc238] hover:bg-[#ebc238]/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">pause</span>
                Pause
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={resumePlayback}
                disabled={!activeText.trim()}
                className="text-xs font-monospaced-technical font-bold uppercase px-4 py-2 rounded border border-[#ebc238] bg-[#ebc238] text-[#17130b] hover:bg-[#f6d258] transition-all cursor-pointer flex items-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={startPlayback}
                disabled={!activeText.trim()}
                className={`text-xs font-monospaced-technical font-bold uppercase px-5 py-2 rounded border transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                  !activeText.trim()
                    ? 'opacity-40 cursor-not-allowed bg-[#1c1811] text-[#635848] border-[#2a241a]'
                    : 'bg-[#ebc238] text-[#17130b] border-[#ebc238] hover:bg-[#f6d258]'
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
                className="text-xs font-monospaced-technical font-bold uppercase px-3 py-2 rounded border border-[#4e453b] bg-[#221c11] text-[#ede1cd] hover:bg-[#2e2619] transition-all cursor-pointer flex items-center gap-1"
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
