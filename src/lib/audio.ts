// Sound synthesizer for tactile mechanical feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  enabled: boolean,
  config: { type: OscillatorType; freqStart: number; freqEnd: number; decay: number; gain: number }
) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(config.freqEnd, ctx.currentTime + config.decay);

    gain.gain.setValueAtTime(config.gain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.decay);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + config.decay);
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

export function playKeyClickSound(enabled: boolean = true) {
  playTone(enabled, { type: 'triangle', freqStart: 140, freqEnd: 30, decay: 0.04, gain: 0.25 });
}

export function playRotorClickSound(enabled: boolean = true) {
  playTone(enabled, { type: 'square', freqStart: 320, freqEnd: 80, decay: 0.03, gain: 0.15 });
}

export function playPlugConnectSound(enabled: boolean = true) {
  playTone(enabled, { type: 'sine', freqStart: 220, freqEnd: 440, decay: 0.05, gain: 0.2 });
}

export function playShutterClickSound(enabled: boolean = true, opening: boolean = true) {
  playTone(enabled, {
    type: 'triangle',
    freqStart: opening ? 480 : 360,
    freqEnd: opening ? 120 : 80,
    decay: 0.025,
    gain: 0.12
  });
}

