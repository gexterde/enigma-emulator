import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, getTheme } from '../lib/theme';
import { EnigmaConfig } from '../types';
import { MORSE_MAP as MORSE_CODE_MAP, REVERSE_MORSE_MAP } from '../lib/morse';
import { MorseReferenceSheet } from './MorseReferenceSheet';

interface RadioStationViewProps {
  senderCallSign: string;
  onUpdateSenderCallSign: (newCallSign: string) => void;
  config: EnigmaConfig;
  onLoadCiphertextToMachine?: (header: string, ciphertext: string) => void;
  onSelectTab?: (tab: any) => void;
  incomingCiphertext?: string;
  incomingHeader?: string;
  autoTransmitPending?: boolean;
  onAutoTransmitComplete?: () => void;
}

interface StationPresence {
  id: string;
  callSign: string;
}

interface RadioSettingsState {
  isPowerOn?: boolean;
  frequency?: string;
  tuningSpeed?: 'slow' | 'fast' | 'fastest';
  volume?: number;
  pitch?: number;
  wpm?: number;
  staticEnabled?: boolean;
  letterPauseMs?: number;
  dashThresholdMs?: number;
  showMorseChart?: boolean;
  qsoLogs?: QSOEntry[];
}

const getSavedRadioState = (): RadioSettingsState | null => {
  try {
    const saved = localStorage.getItem('radio_state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return null;
};

interface QSOEntry {
  id: string;
  timestamp: string;
  senderCallSign: string;
  frequency: string;
  text: string;
  morse?: string;
  type: 'transmitted' | 'received' | 'system' | 'telegram';
  header?: string;
  ciphertext?: string;
}

export const RadioStationView: React.FC<RadioStationViewProps> = ({
  senderCallSign,
  onUpdateSenderCallSign,
  config,
  onLoadCiphertextToMachine,
  onSelectTab,
  incomingCiphertext,
  incomingHeader,
  autoTransmitPending,
  onAutoTransmitComplete
}) => {
  const { theme } = useTheme();
  const t = getTheme(theme);

  const initialSettings = getSavedRadioState();

  // Radio Power state
  const [isPowerOn, setIsPowerOn] = useState<boolean>(() => initialSettings?.isPowerOn ?? true);

  // Radio Frequency & Audio state
  const [frequency, setFrequency] = useState<string>(() => initialSettings?.frequency ?? '7.025');
  const [tuningSpeed, setTuningSpeed] = useState<'slow' | 'fast' | 'fastest'>(() => initialSettings?.tuningSpeed ?? 'slow');
  const [volume, setVolume] = useState<number>(() => initialSettings?.volume ?? 70);
  const [pitch, setPitch] = useState<number>(() => initialSettings?.pitch ?? 700);
  const [wpm, setWpm] = useState<number>(() => initialSettings?.wpm ?? 8);
  const [staticEnabled, setStaticEnabled] = useState<boolean>(() => initialSettings?.staticEnabled ?? true);

  // Keyer Timing Calibration
  const [letterPauseMs, setLetterPauseMs] = useState<number>(() => initialSettings?.letterPauseMs ?? 450); // 450ms pause to finish a letter (3 units at 8 WPM)
  const [dashThresholdMs, setDashThresholdMs] = useState<number>(() => initialSettings?.dashThresholdMs ?? 330); // Hold >330ms for Dash (2.2 units)
  const [showMorseChart, setShowMorseChart] = useState<boolean>(() => initialSettings?.showMorseChart ?? true);

  // Automatically adjust default letter pause and dash threshold when WPM changes
  const prevWpmRef = useRef(wpm);
  useEffect(() => {
    if (prevWpmRef.current !== wpm) {
      prevWpmRef.current = wpm;
      const unitTime = Math.round(1200 / wpm);
      setLetterPauseMs(unitTime * 3);
      setDashThresholdMs(Math.round(unitTime * 2.2));
    }
  }, [wpm]);

  // Quick Text Keyer state
  const [quickTextMessage, setQuickTextMessage] = useState<string>('');
  const [isSendingQuickText, setIsSendingQuickText] = useState<boolean>(false);

  // Socket & Presence State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedStations, setConnectedStations] = useState<StationPresence[]>([]);
  const [clientId, setClientId] = useState<string>('');

  // Keyer & Audio state
  const [isKeyPressed, setIsKeyPressed] = useState<boolean>(false);
  const [isReceivingSignal, setIsReceivingSignal] = useState<boolean>(false);
  const [activeSignalCallSign, setActiveSignalCallSign] = useState<string>('');
  const [signalStrength, setSignalStrength] = useState<number>(0);

  // Auto Morse Telegram Transmit state
  const [isTransmittingTelegram, setIsTransmittingTelegram] = useState<boolean>(false);
  const isTransmittingTelegramRef = useRef<boolean>(false);
  const [telegramTextToTransmit, setTelegramTextToTransmit] = useState<string>(incomingCiphertext || '');
  const [telegramHeaderToTransmit, setTelegramHeaderToTransmit] = useState<string>(incomingHeader || '');

  // Keep telegram text up-to-date if it changes from outside
  useEffect(() => {
    if (incomingCiphertext) {
      setTelegramTextToTransmit(incomingCiphertext);
    }
  }, [incomingCiphertext]);

  useEffect(() => {
    if (incomingHeader) {
      setTelegramHeaderToTransmit(incomingHeader);
    }
  }, [incomingHeader]);


  // Decoded Morse Tape & Logs
  const [decodedTape, setDecodedTape] = useState<string>('');
  const [currentMorseSymbols, setCurrentMorseSymbols] = useState<string>('');
  const [qsoLogs, setQsoLogs] = useState<QSOEntry[]>(() => {
    if (Array.isArray(initialSettings?.qsoLogs)) {
      return initialSettings.qsoLogs;
    }
    return [];
  });

  // Fetch settings from server on initial mount
  useEffect(() => {
    let isMounted = true;
    const loadServerSettings = async () => {
      try {
        const res = await fetch('/api/radio/settings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.settings && isMounted) {
            const s = data.settings;
            if (s.isPowerOn !== undefined) setIsPowerOn(s.isPowerOn);
            if (s.frequency !== undefined) {
              setFrequency(s.frequency);
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: 'join_frequency',
                  frequency: s.frequency,
                  callSign: senderCallSignRef.current || 'DFS'
                }));
              }
            }
            if (s.tuningSpeed !== undefined) setTuningSpeed(s.tuningSpeed);
            if (s.volume !== undefined) setVolume(s.volume);
            if (s.pitch !== undefined) setPitch(s.pitch);
            if (s.wpm !== undefined) {
              setWpm(s.wpm);
              prevWpmRef.current = s.wpm;
            }
            if (s.staticEnabled !== undefined) setStaticEnabled(s.staticEnabled);
            if (s.letterPauseMs !== undefined) setLetterPauseMs(s.letterPauseMs);
            if (s.dashThresholdMs !== undefined) setDashThresholdMs(s.dashThresholdMs);
            if (s.showMorseChart !== undefined) setShowMorseChart(s.showMorseChart);
            if (Array.isArray(s.qsoLogs)) setQsoLogs(s.qsoLogs);

            try {
              localStorage.setItem('radio_state', JSON.stringify(s));
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Failed to load server radio settings:', e);
      }
    };
    loadServerSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save settings to localStorage and server whenever changed
  const isInitialMountRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stateObj: RadioSettingsState = {
      isPowerOn,
      frequency,
      tuningSpeed,
      volume,
      pitch,
      wpm,
      staticEnabled,
      letterPauseMs,
      dashThresholdMs,
      showMorseChart,
      qsoLogs: qsoLogs.slice(0, 50)
    };

    try {
      localStorage.setItem('radio_state', JSON.stringify(stateObj));
    } catch (e) {}

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/radio/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ settings: stateObj })
        });

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'radio_settings_update',
            settings: stateObj
          }));
        }
      } catch (err) {
        console.error('Failed to sync radio settings to server:', err);
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [isPowerOn, frequency, tuningSpeed, volume, pitch, wpm, staticEnabled, letterPauseMs, dashThresholdMs, showMorseChart, qsoLogs]);

  // Sync across tabs and with useSyncState server restorations
  useEffect(() => {
    const handleStorage = (e: Event) => {
      if (e instanceof StorageEvent && e.key && e.key !== 'radio_state') {
        return;
      }
      try {
        const saved = localStorage.getItem('radio_state');
        if (saved) {
          const s = JSON.parse(saved);
          if (s.isPowerOn !== undefined) setIsPowerOn(s.isPowerOn);
          if (s.frequency !== undefined) {
            setFrequency(s.frequency);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'join_frequency',
                frequency: s.frequency,
                callSign: senderCallSignRef.current || 'DFS'
              }));
            }
          }
          if (s.tuningSpeed !== undefined) setTuningSpeed(s.tuningSpeed);
          if (s.volume !== undefined) setVolume(s.volume);
          if (s.pitch !== undefined) setPitch(s.pitch);
          if (s.wpm !== undefined) {
            setWpm(s.wpm);
            prevWpmRef.current = s.wpm;
          }
          if (s.staticEnabled !== undefined) setStaticEnabled(s.staticEnabled);
          if (s.letterPauseMs !== undefined) setLetterPauseMs(s.letterPauseMs);
          if (s.dashThresholdMs !== undefined) setDashThresholdMs(s.dashThresholdMs);
          if (s.showMorseChart !== undefined) setShowMorseChart(s.showMorseChart);
          if (Array.isArray(s.qsoLogs)) setQsoLogs(s.qsoLogs);
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keyKeyDownTimeRef = useRef<number>(0);

  // Debouncing & Touch Refs to prevent double-firing on mobile touch devices
  const lastKeyDownTimeRef = useRef<number>(0);
  const lastKeyUpTimeRef = useRef<number>(0);
  const lastDitTimeRef = useRef<number>(0);
  const lastDahTimeRef = useRef<number>(0);
  const lastCharMorseTimeRef = useRef<number>(0);
  const isTouchActiveRef = useRef<boolean>(false);

  // Web Audio Context Initialization
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play mechanical switch click audio
  const playPowerClickSound = useCallback((turningOn: boolean) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = turningOn ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(turningOn ? 180 : 120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(turningOn ? 420 : 60, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // ignore
    }
  }, [getAudioContext]);

  // CW Tone Generator
  const stopTimeoutRef = useRef<any>(null);

  const startTone = useCallback((frequencyPitch: number) => {
    if (!isPowerOn) return;
    try {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      const ctx = getAudioContext();
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
        oscRef.current = null;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequencyPitch, ctx.currentTime);

      const volMultiplier = volume / 100;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2 * volMultiplier, ctx.currentTime + 0.005);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.error("Audio CW Tone error:", e);
    }
  }, [getAudioContext, volume, isPowerOn]);

  const stopTone = useCallback(() => {
    try {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      const oscToStop = oscRef.current;
      const gainToStop = gainRef.current;

      oscRef.current = null;
      gainRef.current = null;

      if (gainToStop && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        gainToStop.gain.cancelScheduledValues(ctx.currentTime);
        gainToStop.gain.setValueAtTime(gainToStop.gain.value, ctx.currentTime);
        gainToStop.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.008);

        stopTimeoutRef.current = setTimeout(() => {
          try {
            if (oscToStop) {
              oscToStop.stop();
              oscToStop.disconnect();
            }
            if (gainToStop) {
              gainToStop.disconnect();
            }
          } catch (e) {}
          stopTimeoutRef.current = null;
        }, 12);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Atmospheric Static Noise Engine
  useEffect(() => {
    let noiseAudio: AudioNode | null = null;
    let noiseGain: GainNode | null = null;

    if (isPowerOn && staticEnabled && volume > 0) {
      try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.015;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(pitch, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime((volume / 100) * 0.04, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        whiteNoise.start();
        noiseAudio = whiteNoise;
        noiseNodeRef.current = noiseAudio;
        noiseGainRef.current = noiseGain;
      } catch (e) {
        // ignore
      }
    }

    return () => {
      if (noiseAudio) {
        try {
          (noiseAudio as any).stop?.();
          noiseAudio.disconnect();
        } catch(e) {}
      }
    };
  }, [isPowerOn, staticEnabled, volume, pitch, getAudioContext]);

  // Refs for dynamic values in WebSocket event handlers
  const frequencyRef = useRef(frequency);
  frequencyRef.current = frequency;

  const senderCallSignRef = useRef(senderCallSign);
  senderCallSignRef.current = senderCallSign;

  const pitchRef = useRef(pitch);
  pitchRef.current = pitch;

  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;

  const letterPauseMsRef = useRef(letterPauseMs);
  letterPauseMsRef.current = letterPauseMs;

  const isPowerOnRef = useRef(isPowerOn);
  isPowerOnRef.current = isPowerOn;

  const clientIdRef = useRef(clientId);
  clientIdRef.current = clientId;

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'join_frequency',
        frequency: frequencyRef.current,
        callSign: senderCallSignRef.current || 'DFS'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'connected':
            setClientId(msg.clientId);
            clientIdRef.current = msg.clientId;
            break;

          case 'presence':
            if (msg.frequency === frequencyRef.current) {
              setConnectedStations(msg.stations || []);
            }
            break;

          case 'morse_keydown':
            if (msg.frequency === frequencyRef.current) {
              setIsReceivingSignal(true);
              setActiveSignalCallSign(msg.callSign || 'UNKNOWN');
              setSignalStrength(85 + Math.floor(Math.random() * 10));
              startTone(msg.pitch || pitchRef.current);
            }
            break;

          case 'morse_keyup':
            if (msg.frequency === frequencyRef.current) {
              setIsReceivingSignal(false);
              setSignalStrength(0);
              stopTone();

              const duration = msg.duration || 100;
              const symbol = duration < dashThresholdMs ? '.' : '-';
              setCurrentMorseSymbols((prev) => prev + symbol);
            }
            break;

          case 'broadcast_telegram':
            if (msg.frequency === frequencyRef.current) {
              const newEntry: QSOEntry = {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                senderCallSign: msg.callSign,
                frequency: msg.frequency,
                text: `${msg.header}\n${msg.ciphertext}`,
                morse: msg.morseCode,
                type: 'telegram',
                header: msg.header,
                ciphertext: msg.ciphertext
              };
              setQsoLogs((prev) => [newEntry, ...prev]);

              startTone(800);
              setTimeout(() => stopTone(), 150);
            }
            break;

          case 'qso_chat':
            if (msg.frequency === frequencyRef.current) {
              const newEntry: QSOEntry = {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                senderCallSign: msg.callSign,
                frequency: msg.frequency,
                text: msg.text,
                morse: msg.morse,
                type: msg.senderId === clientIdRef.current ? 'transmitted' : 'received'
              };
              setQsoLogs((prev) => [newEntry, ...prev]);
            }
            break;

          case 'radio_settings_update':
            if (msg.settings) {
              const s = msg.settings;
              if (s.isPowerOn !== undefined) setIsPowerOn(s.isPowerOn);
              if (s.frequency !== undefined) {
                setFrequency(s.frequency);
                frequencyRef.current = s.frequency;
              }
              if (s.tuningSpeed !== undefined) setTuningSpeed(s.tuningSpeed);
              if (s.volume !== undefined) setVolume(s.volume);
              if (s.pitch !== undefined) setPitch(s.pitch);
              if (s.wpm !== undefined) {
                setWpm(s.wpm);
                prevWpmRef.current = s.wpm;
              }
              if (s.staticEnabled !== undefined) setStaticEnabled(s.staticEnabled);
              if (s.letterPauseMs !== undefined) setLetterPauseMs(s.letterPauseMs);
              if (s.dashThresholdMs !== undefined) setDashThresholdMs(s.dashThresholdMs);
              if (s.showMorseChart !== undefined) setShowMorseChart(s.showMorseChart);
              if (Array.isArray(s.qsoLogs)) setQsoLogs(s.qsoLogs);

              try {
                localStorage.setItem('radio_state', JSON.stringify(s));
              } catch (e) {}
            }
            break;
        }
      } catch (e) {
        console.error("Error parsing radio WS event:", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [startTone, stopTone, dashThresholdMs]);

  // Channel & Call Sign updates
  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_frequency',
        frequency: newFreq,
        callSign: senderCallSign || 'DFS'
      }));
    }
  };

  // Rotary Tuning Step Handler (Slow: 0.005 MHz / Fast: 0.100 MHz / Fastest: 0.500 MHz)
  const stepTuning = useCallback((direction: 'up' | 'down', customStep?: number) => {
    if (!isPowerOn) return;
    const currentF = parseFloat(frequency) || 7.025;
    const step = customStep ?? (tuningSpeed === 'slow' ? 0.005 : tuningSpeed === 'fast' ? 0.100 : 0.500);
    const nextF = direction === 'up' ? currentF + step : currentF - step;
    const clampedF = Math.min(30.000, Math.max(3.000, nextF));
    handleFrequencyChange(clampedF.toFixed(3));
  }, [isPowerOn, frequency, tuningSpeed]);

  // Mouse wheel scroll handler on the rotary knob
  const handleTuningWheel = useCallback((e: React.WheelEvent) => {
    if (!isPowerOn) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      stepTuning('up');
    } else if (e.deltaY > 0) {
      stepTuning('down');
    }
  }, [isPowerOn, stepTuning]);

  // Mouse drag handler on the rotary knob
  const isDraggingTuningRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartFreqRef = useRef<number>(7.025);

  const handleTuningMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPowerOn) return;
    isDraggingTuningRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartFreqRef.current = parseFloat(frequency) || 7.025;

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!isDraggingTuningRef.current) return;
      const deltaX = moveEv.clientX - dragStartXRef.current;
      const stepVal = tuningSpeed === 'slow' ? 0.005 : tuningSpeed === 'fast' ? 0.050 : 0.250;
      const steps = Math.round(deltaX / 4);
      const nextF = Math.min(30.000, Math.max(3.000, dragStartFreqRef.current + steps * stepVal));
      handleFrequencyChange(nextF.toFixed(3));
    };

    const handleMouseUp = () => {
      isDraggingTuningRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isPowerOn, frequency, tuningSpeed]);

  const handleCallSignUpdate = (newCall: string) => {
    onUpdateSenderCallSign(newCall);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_callsign',
        callSign: newCall
      }));
    }
  };

  // Morse Symbol to Letter Translation Timer with configurable letterPauseMs
  useEffect(() => {
    if (!currentMorseSymbols) return;
    const timer = setTimeout(() => {
      const char = REVERSE_MORSE_MAP[currentMorseSymbols] || '?';
      setDecodedTape((prev) => prev + char);
      setCurrentMorseSymbols('');
    }, letterPauseMs);

    return () => clearTimeout(timer);
  }, [currentMorseSymbols, letterPauseMs]);

  // Manual Morse Key Down / Key Up Handlers
  const handleKeyDown = useCallback(() => {
    if (!isPowerOn || isKeyPressed) return;
    const now = Date.now();
    if (now - lastKeyDownTimeRef.current < 120) return;
    lastKeyDownTimeRef.current = now;

    getAudioContext();
    setIsKeyPressed(true);
    keyKeyDownTimeRef.current = now;
    startTone(pitch);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'morse_keydown',
        pitch
      }));
    }
  }, [isPowerOn, isKeyPressed, pitch, startTone, getAudioContext]);

  const handleKeyUp = useCallback(() => {
    if (!isPowerOn || !isKeyPressed) return;
    const now = Date.now();
    if (now - lastKeyUpTimeRef.current < 120) return;
    lastKeyUpTimeRef.current = now;

    setIsKeyPressed(false);
    stopTone();
    const duration = now - keyKeyDownTimeRef.current;

    const symbol = duration < dashThresholdMs ? '.' : '-';
    setCurrentMorseSymbols((prev) => prev + symbol);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'morse_keyup',
        duration
      }));
    }
  }, [isPowerOn, isKeyPressed, stopTone, dashThresholdMs]);

  // Touch & Mouse Event Handlers for Straight Key to prevent mobile browser ghost event duplication
  const handleTouchStartKey = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouchActiveRef.current = true;
    handleKeyDown();
  }, [handleKeyDown]);

  const handleTouchEndKey = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleKeyUp();
    setTimeout(() => {
      isTouchActiveRef.current = false;
    }, 300);
  }, [handleKeyUp]);

  const handleMouseDownKey = useCallback((e: React.MouseEvent) => {
    if (isTouchActiveRef.current) return;
    handleKeyDown();
  }, [handleKeyDown]);

  const handleMouseUpKey = useCallback((e: React.MouseEvent) => {
    if (isTouchActiveRef.current) return;
    handleKeyUp();
  }, [handleKeyUp]);

  // Audio & Network play helper for a Morse code string (e.g. '.-')
  const playMorseSequence = useCallback((morseCode: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!isPowerOnRef.current) {
        resolve();
        return;
      }
      getAudioContext();

      const currentUnitTime = Math.round(1200 / wpmRef.current);
      const symbols = morseCode.split('');
      if (symbols.length === 0) {
        resolve();
        return;
      }

      let currentSymbolIndex = 0;

      const playNextSymbol = () => {
        if (!isPowerOnRef.current || currentSymbolIndex >= symbols.length) {
          resolve();
          return;
        }

        const sym = symbols[currentSymbolIndex];
        const isDash = sym === '-';
        const duration = isDash ? currentUnitTime * 3 : currentUnitTime;

        startTone(pitchRef.current);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'morse_keydown', pitch: pitchRef.current }));
        }

        setTimeout(() => {
          stopTone();
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'morse_keyup', duration }));
          }

          currentSymbolIndex++;
          if (currentSymbolIndex < symbols.length) {
            // Wait for 1 currentUnitTime (element gap) before playing next symbol
            setTimeout(playNextSymbol, currentUnitTime);
          } else {
            resolve();
          }
        }, duration);
      };

      playNextSymbol();
    });
  }, [getAudioContext, startTone, stopTone]);

  // Direct "DIT (.)" and "DAH (-)" button handlers for exact keying
  const sendDit = useCallback(() => {
    if (!isPowerOnRef.current) return;
    const currentUnitTime = Math.round(1200 / wpmRef.current);
    const now = Date.now();
    if (now - lastDitTimeRef.current < currentUnitTime * 1.5) return;
    lastDitTimeRef.current = now;

    getAudioContext();
    startTone(pitchRef.current);
    setCurrentMorseSymbols((prev) => prev + '.');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'morse_keydown', pitch: pitchRef.current }));
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'morse_keyup', duration: currentUnitTime }));
        }
      }, currentUnitTime);
    }

    setTimeout(() => {
      stopTone();
    }, currentUnitTime + 10);
  }, [getAudioContext, startTone, stopTone]);

  const sendDah = useCallback(() => {
    if (!isPowerOnRef.current) return;
    const currentUnitTime = Math.round(1200 / wpmRef.current);
    const now = Date.now();
    const dahDuration = currentUnitTime * 3;
    if (now - lastDahTimeRef.current < dahDuration * 1.2) return;
    lastDahTimeRef.current = now;

    getAudioContext();
    startTone(pitchRef.current);
    setCurrentMorseSymbols((prev) => prev + '-');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'morse_keydown', pitch: pitchRef.current }));
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'morse_keyup', duration: dahDuration }));
        }
      }, dahDuration);
    }

    setTimeout(() => {
      stopTone();
    }, dahDuration + 10);
  }, [getAudioContext, startTone, stopTone]);

  const sendSpace = useCallback(() => {
    if (!isPowerOnRef.current) return;
    setDecodedTape((prev) => prev + ' ');
  }, []);

  // Instantly commit current Morse symbols into a decoded character
  const commitCurrentMorseSymbols = useCallback(() => {
    if (!currentMorseSymbols) return;
    const char = REVERSE_MORSE_MAP[currentMorseSymbols] || '?';
    setDecodedTape((prev) => prev + char);
    setCurrentMorseSymbols('');
  }, [currentMorseSymbols]);

  const charQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);

  const processCharQueue = useCallback(async () => {
    if (isPlayingQueueRef.current) return;
    isPlayingQueueRef.current = true;

    while (charQueueRef.current.length > 0) {
      if (!isPowerOnRef.current) {
        charQueueRef.current = [];
        break;
      }

      const upperChar = charQueueRef.current.shift()!;
      const code = MORSE_CODE_MAP[upperChar];
      if (!code) {
        setDecodedTape((prev) => prev + upperChar);
        continue;
      }

      await playMorseSequence(code);
      setDecodedTape((prev) => prev + upperChar);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'qso_chat',
          text: upperChar,
          morse: code
        }));
      }

      const letterSpace = letterPauseMsRef.current;

      await new Promise(r => setTimeout(r, letterSpace));
    }

    isPlayingQueueRef.current = false;
  }, [playMorseSequence]);

  // Send a specific character or letter directly by Morse sequence with audio
  const sendCharacterMorse = useCallback((char: string) => {
    if (!isPowerOnRef.current) return;
    const now = Date.now();
    if (now - lastCharMorseTimeRef.current < 180 && charQueueRef.current.length === 0) {
      // Basic debounce for single rapid clicks, but allow queuing if they type words
    }
    lastCharMorseTimeRef.current = now;

    const upperChar = char.toUpperCase();
    if (!MORSE_CODE_MAP[upperChar]) return;

    charQueueRef.current.push(upperChar);
    processCharQueue();
  }, [processCharQueue]);

  // Keyboard Shortcuts Binding
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          handleKeyDown();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        commitCurrentMorseSymbols();
      } else if (e.key === '.' || e.key === 'z' || e.key === 'Z' || e.key === 'ArrowLeft') {
        e.preventDefault();
        sendDit();
      } else if (e.key === '-' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowRight') {
        e.preventDefault();
        sendDah();
      } else if (e.key === 'Slash' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        sendSpace();
      } else if (e.key.length === 1 && MORSE_CODE_MAP[e.key.toUpperCase()]) {
        // Direct typing mode for any letter or digit (e.g., A, S, O, B, 1, 2)
        e.preventDefault();
        sendCharacterMorse(e.key);
      }
    };

    const onGlobalKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleKeyUp();
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    window.addEventListener('keyup', onGlobalKeyUp);
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown);
      window.removeEventListener('keyup', onGlobalKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, sendDit, sendDah, sendSpace, commitCurrentMorseSymbols, sendCharacterMorse]);

  // Visualizer Scope Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = t.radioScopeBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = t.radioScopeGrid;
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isKeyPressed || isReceivingSignal ? t.radioScopeWaveActive : t.radioScopeWaveIdle;

      const amplitude = isKeyPressed || isReceivingSignal ? canvas.height * 0.35 : 2;
      const freqMult = isKeyPressed || isReceivingSignal ? 0.08 : 0.02;

      for (let x = 0; x < canvas.width; x++) {
        const noise = (Math.random() - 0.5) * (staticEnabled ? 3 : 0.5);
        const y = canvas.height / 2 + Math.sin(x * freqMult + phase) * amplitude + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.15;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isKeyPressed, isReceivingSignal, staticEnabled, t]);

  // Quick Text Sequence Player
  const handleSendTextAsMorse = (textToPlay: string) => {
    const clean = textToPlay.trim().toUpperCase();
    if (!clean || !isPowerOn) return;

    setIsSendingQuickText(true);
    
    // Push everything to the queue so it unspools sequentially with audio
    const chars = clean.split('');
    charQueueRef.current.push(...chars);
    processCharQueue();

    setQuickTextMessage('');
    
    // We clear the transmitting state immediately visually but it plays in background
    setTimeout(() => {
      setIsSendingQuickText(false);
    }, 800);
  };

  // Transmit Automated Funktelegramm Over Radio
  const handleTransmitFunktelegramm = useCallback(async () => {
    if (isTransmittingTelegramRef.current) return;
    
    const callSign = senderCallSign || 'DFS';
    const header = telegramHeaderToTransmit || `${callSign} 1200 15 UIO AAA`;
    const body = telegramTextToTransmit.trim().toUpperCase() || 'HELLOWORLD';

    const fullText = `${header} = ${body}`;
    const morseCode = fullText.split('').map((char) => MORSE_CODE_MAP[char] || '').join(' ');

    setIsTransmittingTelegram(true);
    isTransmittingTelegramRef.current = true;
    setDecodedTape(''); // Clear tape to show transmission progressing

    // We can broadcast the full telegram struct up front for the logbook so it records accurately
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'broadcast_telegram',
        header,
        ciphertext: body,
        morseCode,
        wpm: wpmRef.current
      }));
    } else {
      // Offline fallback
      const newEntry: QSOEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        senderCallSign: callSign,
        frequency: frequency,
        text: fullText,
        type: 'transmitted',
        header,
        ciphertext: body
      };
      setQsoLogs((prev) => [newEntry, ...prev]);
    }

    const currentWpm = wpmRef.current;
    const unitTime = Math.round(1200 / currentWpm);
    const letterSpace = letterPauseMsRef.current;
    const wordSpace = unitTime * 7;

    for (let i = 0; i < fullText.length; i++) {
      if (!isTransmittingTelegramRef.current) break; // Check for abort
      
      const char = fullText[i];
      if (char === ' ') {
        setDecodedTape((prev) => prev + ' ');
        // Since we already waited letterSpace after the last character,
        // we wait wordSpace - letterSpace to make the total gap 7 units.
        await new Promise((r) => setTimeout(r, Math.max(0, wordSpace - letterSpace)));
        continue;
      }

      const code = MORSE_CODE_MAP[char];
      if (code) {
        await playMorseSequence(code);
        setDecodedTape((prev) => prev + char);
        await new Promise((r) => setTimeout(r, letterSpace));
      } else {
        setDecodedTape((prev) => prev + char);
      }
    }

    setIsTransmittingTelegram(false);
    isTransmittingTelegramRef.current = false;
  }, [senderCallSign, telegramHeaderToTransmit, telegramTextToTransmit, frequency, playMorseSequence]);

  // Handle auto-transmit from MachineView
  useEffect(() => {
    if (autoTransmitPending && isConnected && !isTransmittingTelegram) {
      handleTransmitFunktelegramm();
      if (onAutoTransmitComplete) {
        onAutoTransmitComplete();
      }
    }
  }, [autoTransmitPending, isConnected, isTransmittingTelegram, handleTransmitFunktelegramm, onAutoTransmitComplete]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Connection Status */}
      <div className={`${t.panelBg} p-5 rounded-lg border ${t.borderBase} shadow-xl flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-lg ${t.wellBg} border ${t.borderAccent} flex items-center justify-center ${t.textAccent} shadow-inner`}>
            <span className="material-symbols-outlined text-3xl animate-pulse">radio</span>
          </div>
          <div>
            <h1 className={`text-xl font-bold ${t.textPrimary} flex items-center gap-2`}>
              <span>Military CW Radio Transceiver</span>
              <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold uppercase transition-all shadow-sm ${
                !isPowerOn
                  ? t.dangerBadge
                  : isConnected
                    ? t.successBadge
                    : t.dangerBadge
              }`}>
                {!isPowerOn ? 'OFFLINE (POWER OFF)' : isConnected ? 'LIVE ONLINE' : 'DISCONNECTED'}
              </span>
            </h1>
            <p className={`text-xs ${t.textMuted} mt-0.5`}>
              Real-time shortwave Morse code broadcasting and receiving across multiple connected computers
            </p>
          </div>
        </div>

        {/* Station Call Sign Config */}
        <div className="flex items-center gap-3">
          <div className={`${t.wellBg} px-3 py-1.5 rounded border ${t.borderBase} flex items-center gap-2`}>
            <span className={`text-xs font-bold ${t.textMuted} uppercase`}>Station ID:</span>
            <input
              type="text"
              value={senderCallSign}
              onChange={(e) => handleCallSignUpdate(e.target.value)}
              placeholder="DFS"
              maxLength={5}
              className={`w-16 ${t.inputBg} ${t.textAccent} font-mono font-bold text-center text-sm rounded focus:outline-none focus:${t.borderAccent}`}
            />
          </div>

          <div className={`${t.wellBg} px-3.5 py-1.5 rounded border ${t.borderBase} flex items-center gap-2`}>
            <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>group</span>
            <span className={`text-xs font-bold ${t.textPrimary}`}>
              {connectedStations.length} Station{connectedStations.length === 1 ? '' : 's'} Tuned In
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Radio Rack & Telegraph Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Radio Receiver & Frequency Control Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Historical WWII Radio Chassis Container */}
          <div className={`${t.radioChassisBg} p-6 rounded-xl border-4 shadow-2xl space-y-6 relative overflow-hidden`}>
            {/* Metallic Corner Rivets for authentic vintage chassis look */}
            <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${t.radioRivets} shadow-inner flex items-center justify-center`}>
              <div className="w-1.5 h-[1px] opacity-60 transform rotate-45" />
            </div>
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${t.radioRivets} shadow-inner flex items-center justify-center`}>
              <div className="w-1.5 h-[1px] opacity-60 transform -rotate-45" />
            </div>
            <div className={`absolute bottom-2 left-2 w-3 h-3 rounded-full ${t.radioRivets} shadow-inner flex items-center justify-center`}>
              <div className="w-1.5 h-[1px] opacity-60 transform -rotate-12" />
            </div>
            <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full ${t.radioRivets} shadow-inner flex items-center justify-center`}>
              <div className="w-1.5 h-[1px] opacity-60 transform rotate-75" />
            </div>

            {/* Top Chassis Label & Main Power Switch */}
            <div className={`flex items-center justify-between border-b ${t.radioHeaderBorder} pb-3`}>
              <div className="flex items-center gap-4">
                {/* Vintage Bakelite Rotary Power Switch */}
                <div className={`flex items-center gap-2.5 ${t.radioPowerSwitchBg} px-3 py-1.5 rounded-lg border shadow-inner`}>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider hidden sm:inline ${t.textMuted}`}>
                    STROM / POWER:
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold transition-colors ${!isPowerOn ? t.radioPowerOffText : t.textMuted}`}>
                      AUS (OFF)
                    </span>

                    {/* Physical Rotary Switch Dial */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextPower = !isPowerOn;
                        setIsPowerOn(nextPower);
                        playPowerClickSound(nextPower);
                      }}
                      title="Turn Rotary Power Switch"
                      className={`w-10 h-10 rounded-full bg-gradient-to-b ${t.radioPowerKnobBg} border-2 shadow-[0_4px_10px_rgba(0,0,0,0.8)] relative flex items-center justify-center cursor-pointer group active:scale-95 transition-transform`}
                    >
                      {/* Knurled Outer Ring */}
                      <div className="absolute inset-0.5 rounded-full border border-white/10 pointer-events-none" />

                      {/* Rotating Switch Pointer */}
                      <div
                        className="w-full h-full relative flex items-center justify-center transition-transform duration-200 ease-out"
                        style={{ transform: `rotate(${isPowerOn ? 45 : -45}deg)` }}
                      >
                        {/* Pointer Ridge */}
                        <div className={`w-2 h-8 bg-gradient-to-b ${t.radioPowerKnobBg} border border-white/20 rounded-sm shadow flex justify-center pt-0.5`}>
                          {/* Indicator Stripe */}
                          <div className={`w-1 h-2.5 rounded-full transition-colors ${isPowerOn ? t.radioPowerOnText : t.radioPowerOffText}`} />
                        </div>
                        {/* Center Cap Nut */}
                        <div className={`absolute w-3.5 h-3.5 rounded-full ${t.radioRivets} shadow-inner`} />
                      </div>
                    </button>

                    <span className={`text-[10px] font-mono font-bold transition-colors ${isPowerOn ? t.radioPowerOnText : t.textMuted}`}>
                      EIN (ON)
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col">
                  <span className={`text-xs font-serif font-extrabold tracking-widest uppercase ${t.textAccent}`}>
                    EMPFÄNGER T-100 (1941)
                  </span>
                  <span className={`text-[9px] font-mono ${t.textMuted}`}>KURZWELLE / SHORTWAVE 3–30 MHz</span>
                </div>
              </div>

              {/* Status Pilot Tube Indicator */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase font-bold ${isPowerOn ? t.radioPowerOnText : t.textMuted}`}>
                  {isPowerOn ? 'ROEHREN GEHEIZT' : 'STANDBY'}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isPowerOn
                    ? t.lampLit
                    : t.lampBase
                }`} />
              </div>
            </div>

            {/* HISTORICAL VINTAGE GLASS TUNING DIAL WINDOW */}
            <div className={`p-5 rounded-xl border-4 shadow-2xl relative transition-all duration-500 overflow-hidden ${
              isPowerOn
                ? t.radioGlassDialBgOn
                : t.radioGlassDialBgOff
            } ${t.radioGlassDialBorder}`}>
              {/* Glass reflection gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

              <div className={`flex items-center justify-between mb-2 text-[10px] font-mono tracking-widest uppercase ${t.radioDialText}`}>
                <span>SKALA / FREQUENCY DIAL (MHz)</span>
                <span>{isPowerOn ? 'VACUUM TUBE ILLUMINATED' : 'POWER OFF'}</span>
              </div>

              {/* Physical Glass Scale with Tick Marks and Sliding Needle */}
              <div className={`relative h-20 border-2 ${t.radioGlassDialBorder} ${t.wellBg} rounded-lg p-2 flex flex-col justify-between overflow-hidden shadow-inner`}>
                {/* Scale Grid Ticks */}
                <div className={`w-full flex justify-between items-end h-10 px-2 text-[10px] font-mono select-none border-b ${t.radioGlassDialBorder} ${t.radioDialText}`}>
                  {['3.0', '5.0', '7.0', '10.0', '14.0', '21.0', '28.0', '30.0'].map((mark) => (
                    <div key={mark} className="flex flex-col items-center">
                      <span className="text-[9px] font-bold tracking-tighter">{mark}</span>
                      <div className={`w-[1px] h-3 ${t.radioDialTick} mt-0.5`} />
                    </div>
                  ))}
                </div>

                {/* Sliding Physical Red Tuning Needle */}
                {(() => {
                  const freqNum = parseFloat(frequency) || 7.025;
                  const needlePct = Math.min(96, Math.max(2, ((freqNum - 3) / (30 - 3)) * 100));
                  return (
                    <div
                      className={`absolute top-0 bottom-0 w-1 ${t.radioNeedle} transition-all duration-150 z-10 flex flex-col items-center`}
                      style={{ left: `${needlePct}%` }}
                    >
                      <div className={`w-2.5 h-2.5 ${t.radioNeedle} rounded-full border border-white/40 -mt-1 shadow`} />
                    </div>
                  );
                })()}

                <div className={`flex justify-between text-[9px] font-mono opacity-80 ${t.radioDialText} pt-1 px-1`}>
                  <span>80m BAND</span>
                  <span>40m BAND</span>
                  <span>20m BAND</span>
                  <span>10m BAND</span>
                </div>
              </div>

              {/* Exact Frequency Brass Digital Display Box */}
              <div className={`mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${t.radioDisplayBoxBg} p-3 rounded-lg border-2 ${t.radioGlassDialBorder}`}>
                <div className="flex items-center gap-3">
                  {/* Vintage S-Meter Gauge (Signal Intensity) */}
                  <div className={`w-28 h-12 ${t.radioSMeterBg} rounded border p-1 flex flex-col items-center justify-between relative overflow-hidden shadow-inner`}>
                    <span className={`text-[8px] font-mono uppercase font-bold ${t.radioSMeterText}`}>EMPFANGSSTÄRKE (S-METER)</span>
                    <div className={`text-[9px] font-mono ${t.textMuted} flex justify-between w-full px-1`}>
                      <span>S1</span><span>S5</span><span>S9</span><span>+20dB</span>
                    </div>
                    {/* Moving Needle */}
                    {(() => {
                      const meterDeflection = !isPowerOn
                        ? -45
                        : (isReceivingSignal || isKeyPressed)
                          ? 25
                          : Math.sin(Date.now() / 800) * 8 - 20;
                      return (
                        <div
                          className={`absolute bottom-1 left-1/2 w-0.5 h-7 ${t.radioSMeterNeedle} origin-bottom transition-transform duration-200 shadow-md`}
                          style={{ transform: `translateX(-50%) rotate(${meterDeflection}deg)` }}
                        />
                      );
                    })()}
                  </div>

                  {/* Frequency Readout */}
                  <div>
                    <span className={`text-[9px] font-mono ${t.textMuted} uppercase block`}>ABGESTIMMTE FREQUENZ:</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-mono font-extrabold tracking-wider ${
                        isPowerOn ? t.radioDisplayReadoutOn : t.radioDisplayReadoutOff
                      }`}>
                        {isPowerOn ? parseFloat(frequency).toFixed(3) : '---.---'}
                      </span>
                      <span className={`text-sm font-mono font-bold ${t.radioDisplayTextAccent}`}>MHz</span>
                    </div>
                  </div>
                </div>

                {/* Direct Manual Numeric Input */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold ${t.textMuted}`}>TUNING:</span>
                  <input
                    type="number"
                    step="0.005"
                    min="3.000"
                    max="30.000"
                    disabled={!isPowerOn}
                    value={frequency}
                    onChange={(e) => handleFrequencyChange(e.target.value)}
                    className={`w-24 ${t.radioDisplayInputBg} border-2 font-mono font-bold text-sm px-2 py-1 rounded text-center focus:outline-none disabled:opacity-40`}
                  />
                  <span className={`text-xs font-mono ${t.textMuted}`}>MHz</span>
                </div>
              </div>

              {/* Active Call Signs on Frequency */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <span className={`text-[10px] font-mono ${t.textMuted} mr-1`}>TUNED STATIONS:</span>
                {connectedStations.map((st) => (
                  <span
                    key={st.id}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      st.callSign === senderCallSign
                        ? t.radioStationBadge
                        : t.radioPresetBtnInactive
                    }`}
                  >
                    {st.callSign} {st.callSign === senderCallSign ? '(YOU)' : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* VINTAGE MECHANICAL ROTARY TUNING KNOB MODULE */}
            <div className={`${t.radioRotaryModuleBg} p-5 rounded-xl border-2 ${t.radioRotaryModuleBorder} space-y-4 shadow-inner`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b ${t.radioHeaderBorder} pb-2`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${t.textAccent}`}>tune</span>
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${t.textPrimary}`}>
                    ABSTIMMKNOPF / ROTARY FREQUENCY TUNING
                  </span>
                </div>

                {/* SLOW / FAST / FASTEST SPEED SELECTOR SWITCH */}
                <div className={`flex flex-wrap items-center gap-1.5 ${t.wellBg} p-1 rounded-lg border ${t.borderBase}`}>
                  <span className={`text-[10px] font-mono ${t.textMuted} px-1 font-bold`}>TUNING SPEED:</span>
                  <button
                    type="button"
                    disabled={!isPowerOn}
                    onClick={() => setTuningSpeed('slow')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      tuningSpeed === 'slow'
                        ? t.radioSpeedBtnActive
                        : t.radioSpeedBtnInactive
                    }`}
                  >
                    🐢 LANGSAM / SLOW (0.005 MHz)
                  </button>
                  <button
                    type="button"
                    disabled={!isPowerOn}
                    onClick={() => setTuningSpeed('fast')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      tuningSpeed === 'fast'
                        ? t.radioSpeedBtnActive
                        : t.radioSpeedBtnInactive
                    }`}
                  >
                    🐇 SCHNELL / FAST (0.100 MHz)
                  </button>
                  <button
                    type="button"
                    disabled={!isPowerOn}
                    onClick={() => setTuningSpeed('fastest')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      tuningSpeed === 'fastest'
                        ? t.radioSpeedBtnActive
                        : t.radioSpeedBtnInactive
                    }`}
                  >
                    ⚡ AM SCHNELLSTEN / FASTEST (0.500 MHz)
                  </button>
                </div>
              </div>

              {/* MAIN ROTARY TUNING KNOB DISPLAY & CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                {/* Step Left / Decrement Button */}
                <button
                  type="button"
                  disabled={!isPowerOn}
                  onClick={() => stepTuning('down')}
                  className={`px-4 py-3 rounded-lg ${t.radioPresetBtnInactive} border-2 font-mono text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 flex flex-col items-center gap-1 cursor-pointer`}
                >
                  <span className="material-symbols-outlined text-lg">rotate_left</span>
                  <span>‹ TURN LEFT ({tuningSpeed === 'slow' ? '-0.005' : tuningSpeed === 'fast' ? '-0.100' : '-0.500'})</span>
                </button>

                {/* HEAVY BAKELITE ROTARY TUNING KNOB WITH POINTER & DRAG/WHEEL SENSORS */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    onWheel={handleTuningWheel}
                    onMouseDown={handleTuningMouseDown}
                    className={`relative w-28 h-28 rounded-full bg-gradient-to-b ${t.radioRotaryKnobBg} border-4 ${t.radioRotaryKnobBorder} shadow-[0_8px_20px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-center justify-center select-none ${
                      isPowerOn ? `cursor-grab active:cursor-grabbing hover:${t.borderAccent}` : 'opacity-40 cursor-not-allowed'
                    }`}
                    title="Scroll mouse wheel or drag left/right to turn Rotary Knob"
                  >
                    {/* Knurled Ridges Around Outer Edge */}
                    <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
                    <div className="absolute inset-2 rounded-full border border-dashed border-white/20 pointer-events-none" />

                    {/* ROTATING KNOB FACE */}
                    <div
                      className="w-full h-full relative flex items-center justify-center transition-transform duration-75 ease-out pointer-events-none"
                      style={{
                        transform: `rotate(${Math.round(((parseFloat(frequency) - 3) / 27) * 300 - 150)}deg)`
                      }}
                    >
                      {/* High contrast notch indicator */}
                      <div className={`absolute top-1.5 w-1.5 h-6 ${t.radioRotaryKnobNotch} rounded-full`} />

                      {/* Central Heavy Metallic Cap */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${t.radioRotaryCap} border-2 shadow-inner flex items-center justify-center`}>
                        <div className={`w-5 h-5 rounded-full ${t.wellBg} border border-white/20 shadow`} />
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono ${t.textMuted} text-center font-bold`}>
                    {isPowerOn ? 'SCROLL OR DRAG KNOB TO TUNE' : 'RADIO IS POWERED OFF'}
                  </span>
                </div>

                {/* Step Right / Increment Button */}
                <button
                  type="button"
                  disabled={!isPowerOn}
                  onClick={() => stepTuning('up')}
                  className={`px-4 py-3 rounded-lg ${t.radioPresetBtnInactive} border-2 font-mono text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 flex flex-col items-center gap-1 cursor-pointer`}
                >
                  <span className="material-symbols-outlined text-lg">rotate_right</span>
                  <span>TURN RIGHT › ({tuningSpeed === 'slow' ? '+0.005' : tuningSpeed === 'fast' ? '+0.100' : '+0.500'})</span>
                </button>
              </div>

              {/* Quick Step Preset Buttons */}
              <div className={`grid grid-cols-2 sm:grid-cols-7 gap-1.5 pt-1 border-t ${t.radioHeaderBorder}`}>
                {[
                  { label: '«« -0.500', action: () => stepTuning('down', 0.500) },
                  { label: '« -0.100', action: () => stepTuning('down', 0.100) },
                  { label: '‹ -0.005', action: () => stepTuning('down', 0.005) },
                  { label: 'RESET 7.025', action: () => handleFrequencyChange('7.025') },
                  { label: '+0.005 ›', action: () => stepTuning('up', 0.005) },
                  { label: '+0.100 »', action: () => stepTuning('up', 0.100) },
                  { label: '+0.500 »»', action: () => stepTuning('up', 0.500) }
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!isPowerOn}
                    onClick={btn.action}
                    className={`py-2 px-1 rounded ${t.radioPresetBtnInactive} border font-mono text-[10px] sm:text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-95`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Historical Shortwave Band Selector Switches */}
            <div>
              <label className={`text-xs font-bold uppercase block mb-2 ${t.textMuted}`}>
                Military Wave Range Presets (Wellenbereich)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: '7.025 MHz', freq: '7.025', desc: 'Wehrmacht Military CW' },
                  { name: '3.550 MHz', freq: '3.550', desc: '80m Shortwave Band' },
                  { name: '7.050 MHz', freq: '7.050', desc: 'Tactical Reserve' },
                  { name: '14.025 MHz', freq: '14.025', desc: '20m Long-Range Band' }
                ].map((channel) => (
                  <button
                    key={channel.freq}
                    type="button"
                    disabled={!isPowerOn}
                    onClick={() => handleFrequencyChange(channel.freq)}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer disabled:opacity-40 ${
                      frequency === channel.freq
                        ? t.radioPresetBtnActive
                        : t.radioPresetBtnInactive
                    }`}
                  >
                    <div className={`text-xs font-bold font-mono ${t.textAccent}`}>{channel.name}</div>
                    <div className={`text-[9px] truncate ${t.textMuted}`}>{channel.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Volume & Static Controls */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t ${t.radioHeaderBorder}`}>
              {/* Volume & Static */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${t.textPrimary}`}>Lautstärke / Volume: {volume}%</span>
                  <button
                    type="button"
                    disabled={!isPowerOn}
                    onClick={() => setStaticEnabled(!staticEnabled)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border disabled:opacity-40 ${
                      staticEnabled ? t.radioPresetBtnActive : t.radioPresetBtnInactive
                    }`}
                  >
                    Static Noise: {staticEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!isPowerOn}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className={`w-full ${t.sliderAccent} ${t.wellBg} h-2 rounded disabled:opacity-40`}
                />
              </div>

              {/* CW Audio Pitch */}
              <div className="space-y-2">
                <span className={`text-xs font-bold ${t.textPrimary}`}>CW Tone Pitch: {pitch} Hz</span>
                <input
                  type="range"
                  min="500"
                  max="900"
                  step="10"
                  disabled={!isPowerOn}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className={`w-full ${t.sliderAccent} ${t.wellBg} h-2 rounded disabled:opacity-40`}
                />
              </div>
            </div>

            {/* Timing Calibration Controls */}
            <div className={`p-3.5 rounded-lg border ${t.borderBase} ${t.wellBg} space-y-3`}>
              <span className={`text-xs font-bold ${t.textAccent} flex items-center gap-1.5 uppercase tracking-wide`}>
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>Morse Keying Calibration & Pause Timing</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Letter Pause Timeout */}
                <div className="space-y-1">
                  <div className={`flex justify-between text-[11px] font-mono ${t.textPrimary}`}>
                    <span>Letter Completion Pause:</span>
                    <span className={`font-bold ${t.textAccent}`}>{letterPauseMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="1800"
                    step="50"
                    value={letterPauseMs}
                    onChange={(e) => setLetterPauseMs(Number(e.target.value))}
                    className={`w-full ${t.sliderAccent} ${t.wellBg} h-2 rounded`}
                  />
                  <span className={`text-[9px] ${t.textMuted} block`}>
                    Time to wait before committing symbols into a letter
                  </span>
                </div>

                {/* Dash Threshold */}
                <div className="space-y-1">
                  <div className={`flex justify-between text-[11px] font-mono ${t.textPrimary}`}>
                    <span>Dash (-) Threshold:</span>
                    <span className={`font-bold ${t.textAccent}`}>{dashThresholdMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="400"
                    step="10"
                    value={dashThresholdMs}
                    onChange={(e) => setDashThresholdMs(Number(e.target.value))}
                    className={`w-full ${t.sliderAccent} ${t.wellBg} h-2 rounded`}
                  />
                  <span className={`text-[9px] ${t.textMuted} block`}>
                    Hold duration needed to register a Dash instead of Dot
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Waveform Oscilloscope Visualizer */}
            <div className="space-y-1.5">
              <div className={`flex items-center justify-between text-xs font-mono ${t.textMuted}`}>
                <span>SIGNAL OSCILLOSCOPE & SPECTRUM</span>
                {isPowerOn && isReceivingSignal && (
                  <span className={`font-bold animate-pulse ${t.textAccent}`}>
                    RECEIVING CW SIGNAL FROM {activeSignalCallSign} ({signalStrength} dB)
                  </span>
                )}
              </div>
              <canvas
                ref={canvasRef}
                width={500}
                height={75}
                className={`w-full h-20 rounded-lg border ${t.borderBase} ${t.wellBg} shadow-inner`}
              />
            </div>
          </div>

          {/* Decoded Morse Paper Tape Output */}
          <div className={`${t.panelBg} p-5 rounded-xl border ${t.borderBase} shadow-lg space-y-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${t.textPrimary} flex items-center gap-1.5`}>
                <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>description</span>
                <span>Decoded Intercept Tape</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = decodedTape.trim();
                    if (text) {
                      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        const morse = text.split('').map((char) => MORSE_CODE_MAP[char] || '').join(' ');
                        wsRef.current.send(JSON.stringify({
                          type: 'qso_chat',
                          text,
                          morse
                        }));
                      } else {
                        // Offline fallback
                        const newEntry: QSOEntry = {
                          id: crypto.randomUUID(),
                          timestamp: new Date().toLocaleTimeString(),
                          senderCallSign: senderCallSign || 'DFS',
                          frequency: frequency,
                          text,
                          type: 'transmitted'
                        };
                        setQsoLogs((prev) => [newEntry, ...prev]);
                      }
                      setDecodedTape('');
                    }
                  }}
                  disabled={!decodedTape.trim()}
                  className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border ${t.borderBase} ${t.buttonHighlight} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Save to Logbook
                </button>
                <button
                  type="button"
                  onClick={() => setDecodedTape('')}
                  className={`text-[10px] ${t.fontMono} px-2 py-0.5 rounded border ${t.borderBase} ${t.buttonMuted} cursor-pointer`}
                >
                  Clear Tape
                </button>
              </div>
            </div>

            <div className={`p-3.5 rounded border font-mono text-sm tracking-widest min-h-[50px] break-all ${t.paperTapeBg} ${t.paperTapeBorder}`}>
              {decodedTape || <span className="opacity-40 italic">Waiting for incoming CW Morse signal...</span>}
              {currentMorseSymbols && (
                <span className={`${t.textAccent} font-bold ml-1 animate-pulse`}>
                  [{currentMorseSymbols}]
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Telegraph Key & Keying Helpers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Keying Station Controls */}
          <div className={`${t.panelBg} p-6 rounded-xl border ${t.borderBase} shadow-xl space-y-4`}>
            <div className={`flex flex-col sm:flex-row items-center justify-between border-b ${t.borderBase} pb-2 gap-1`}>
              <span className={`text-xs font-bold ${t.textPrimary} uppercase`}>Morse Keying Station</span>
              <span className={`text-[10px] font-mono ${t.textAccent}`}>TYPE ANY LETTER DIRECTLY OR USE DIT/DAH/SPACE</span>
            </div>

            

            {/* Physical Straight Key (Press & Hold) */}
            <button
              type="button"
              disabled={!isPowerOn}
              onMouseDown={handleMouseDownKey}
              onMouseUp={handleMouseUpKey}
              onMouseLeave={handleMouseUpKey}
              onTouchStart={handleTouchStartKey}
              onTouchEnd={handleTouchEndKey}
              onTouchCancel={handleTouchEndKey}
              className={`w-full h-24 rounded-xl border-2 font-mono font-extrabold text-sm transition-all duration-75 select-none touch-none flex flex-col items-center justify-center gap-1 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                isKeyPressed
                  ? `${t.buttonHighlight} scale-[0.98]`
                  : `${t.radioPresetBtnInactive}`
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {isKeyPressed ? 'graphic_eq' : 'key'}
              </span>
              <span>{!isPowerOn ? 'RADIO POWER IS OFF' : isKeyPressed ? 'TRANSMITTING CW...' : 'STRAIGHT TELEGRAPH KEY (HOLD SPACE)'}</span>
            </button>
            
            {/* Quick DIT / DAH Dedicated Tapping Buttons & Commit Helper */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!isPowerOn}
                  onClick={sendDit}
                  className={`py-3.5 rounded-xl border-2 font-mono font-extrabold text-base flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-all cursor-pointer select-none touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${t.radioPresetBtnInactive}`}
                >
                  <span className={`text-xl font-black ${t.textAccent}`}>• DIT (.)</span>
                  <span className={`text-[10px] font-sans ${t.textMuted}`}>Short Tap [Key: Z / . / ←]</span>
                </button>

                <button
                  type="button"
                  disabled={!isPowerOn}
                  onClick={sendDah}
                  className={`py-3.5 rounded-xl border-2 font-mono font-extrabold text-base flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-all cursor-pointer select-none touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${t.radioPresetBtnInactive}`}
                >
                  <span className={`text-xl font-black ${t.textAccent}`}>— DAH (-)</span>
                  <span className={`text-[10px] font-sans ${t.textMuted}`}>Long Hold [Key: X / - / →]</span>
                </button>
              </div>

              {/* Commit current symbol sequence button */}
              {currentMorseSymbols && (
                <div className={`flex items-center justify-between ${t.accentLightBg} border ${t.borderAccent} rounded-lg p-2 animate-pulse`}>
                  <span className={`text-xs font-mono font-bold ${t.textAccent}`}>
                    Building: <span className={`text-sm ${t.textPrimary}`}>[{currentMorseSymbols}]</span> ({REVERSE_MORSE_MAP[currentMorseSymbols] || '?'})
                  </span>
                  <button
                    type="button"
                    onClick={commitCurrentMorseSymbols}
                    className={`px-3 py-1 rounded font-mono text-xs font-extrabold ${t.buttonHighlight} cursor-pointer shadow`}
                  >
                    Commit Letter [Enter]
                  </button>
                </div>
              )}
            </div>
            {/* Quick Text / Q-Code Quick Keyer (Instant Typing Mode) */}
            <div className={`pt-2 border-t ${t.borderBase} space-y-2`}>
              <span className={`text-xs font-bold ${t.textPrimary} block`}>
                Type Text & Transmit Instant Morse:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={!isPowerOn}
                  value={quickTextMessage}
                  onChange={(e) => setQuickTextMessage(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendTextAsMorse(quickTextMessage);
                    }
                  }}
                  placeholder="e.g. CQ CQ DE DFS or SOS"
                  className={`flex-1 ${t.inputBg} ${t.textPrimary} border ${t.borderBase} rounded px-3 py-2 text-xs font-mono focus:outline-none focus:${t.borderAccent} disabled:opacity-40`}
                />
                <button
                  type="button"
                  onClick={() => handleSendTextAsMorse(quickTextMessage)}
                  disabled={!isPowerOn || !quickTextMessage.trim()}
                  className={`px-4 py-2 rounded font-bold text-xs uppercase ${t.buttonHighlight} cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Send CW
                </button>
              </div>

              {/* Tactical Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className={`text-[10px] font-mono ${t.textMuted}`}>Presets:</span>
                {[
                  `CQ CQ DE ${senderCallSign || 'DFS'}`,
                  'SOS',
                  `DE ${senderCallSign || 'DFS'}`,
                  'QRV?',
                  '73',
                  'K'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={!isPowerOn}
                    onClick={() => handleSendTextAsMorse(preset)}
                    className={`px-2 py-1 rounded ${t.radioPresetBtnInactive} font-mono text-[10px] font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* On-Screen Interactive Morse Reference Chart */}
          <MorseReferenceSheet
            title="Morse Code Reference"
            subtitle="Click any letter, number, or symbol to transmit its Morse sequence over the air"
            icon="help"
            expanded={showMorseChart}
            onToggleExpand={() => setShowMorseChart(!showMorseChart)}
            onItemClick={(char) => sendCharacterMorse(char)}
            itemTitlePrefix="Click to send Morse code for"
          />

          {/* Automated Funktelegramm Broadcaster */}
          <div className={`${t.panelBg} p-5 rounded-xl border ${t.borderBase} shadow-xl space-y-4`}>
            <div className={`flex items-center justify-between border-b ${t.borderBase} pb-2`}>
              <span className={`text-xs font-bold ${t.textPrimary} flex items-center gap-1.5`}>
                <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>send</span>
                <span>Broadcast Encrypted Telegram</span>
              </span>
              <span className={`text-[10px] font-mono ${t.textMuted}`}>Speed: {wpm} WPM</span>
            </div>

            <div>
              <label className={`text-[11px] font-bold ${t.textMuted} block mb-1`}>
                Header (Absender, Time, Size, Kenngruppe, Grundstellung):
              </label>
              <input
                type="text"
                value={telegramHeaderToTransmit}
                onChange={(e) => setTelegramHeaderToTransmit(e.target.value.toUpperCase())}
                placeholder="DFS 1200 15 UIO AAA"
                className={`w-full ${t.inputBg} ${t.textPrimary} border ${t.borderBase} rounded p-2 text-xs font-mono focus:outline-none focus:${t.borderAccent} mb-3`}
              />

              <label className={`text-[11px] font-bold ${t.textMuted} block mb-1`}>
                Ciphertext Message / Funktelegramm Body:
              </label>
              <textarea
                value={telegramTextToTransmit}
                onChange={(e) => setTelegramTextToTransmit(e.target.value.toUpperCase())}
                placeholder="HELLOWORLD..."
                rows={3}
                className={`w-full ${t.inputBg} ${t.textPrimary} border ${t.borderBase} rounded p-2.5 text-xs font-mono focus:outline-none focus:${t.borderAccent} resize-y`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (isTransmittingTelegram) {
                  isTransmittingTelegramRef.current = false;
                  setIsTransmittingTelegram(false);
                } else {
                  handleTransmitFunktelegramm();
                }
              }}
              disabled={(!isConnected && !isTransmittingTelegram)}
              className={`w-full py-3 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isTransmittingTelegram
                  ? `${t.buttonDanger} hover:opacity-90`
                  : `${t.buttonHighlight}`
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isTransmittingTelegram ? 'cancel' : 'cell_tower'}
              </span>
              <span>{isTransmittingTelegram ? 'Cancel Broadcast' : 'Transmit Telegram Across Radio'}</span>
            </button>
          </div>

          {/* Intercept / Radio QSO History Log */}
          <div className={`${t.panelBg} p-5 rounded-xl border ${t.borderBase} shadow-xl space-y-3`}>
            <div className={`flex items-center justify-between border-b ${t.borderBase} pb-2`}>
              <span className={`text-xs font-bold ${t.textPrimary} flex items-center gap-1.5`}>
                <span className={`material-symbols-outlined text-sm ${t.textAccent}`}>receipt_long</span>
                <span>Radio Intercept Logbook</span>
              </span>
              <span className={`text-[10px] font-mono ${t.textMuted}`}>{qsoLogs.length} Records</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {qsoLogs.length === 0 ? (
                <div className={`text-center py-6 text-xs ${t.textMuted} font-mono italic`}>
                  No radio telegrams or QSOs logged on {frequency} MHz yet.
                </div>
              ) : (
                qsoLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded border text-xs space-y-1.5 ${
                      log.type === 'telegram'
                        ? `${t.accentLightBg} ${t.borderAccent} ${t.textPrimary}`
                        : `${t.wellBg} ${t.borderBase} ${t.textPrimary}`
                    }`}
                  >
                    <div className={`flex items-center justify-between text-[10px] font-mono opacity-80 border-b ${t.borderBase} pb-1`}>
                      <span className={`font-bold ${t.textAccent}`}>
                        {log.senderCallSign} @ {log.frequency} MHz
                      </span>
                      <span className={t.textMuted}>{log.timestamp}</span>
                    </div>

                    <div className="font-mono font-bold tracking-wider break-all text-xs">
                      {log.text}
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(log.text);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded ${t.buttonMuted} hover:opacity-80 flex items-center gap-1 shadow-sm cursor-pointer transition-opacity`}
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                        <span>Copy as Text</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
