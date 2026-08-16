// Offline WAV synthesis utility for Morse code practice audio download
import { MORSE_MAP } from './morse';

export async function generateMorseWavBlob(
  text: string,
  effWpm: number,
  charWpm: number,
  frequency: number = 650,
  wordSpaceMultiplier: number = 2.0,
  edgeMs: number = 8
): Promise<Blob> {
  const sampleRate = 44100;
  const cWpm = Math.max(charWpm, effWpm);
  const u = 1.2 / cWpm;

  let interCharTime = 3 * u;
  let interWordTime = 7 * u;

  if (effWpm < cWpm) {
    const spaceTime = (60 / effWpm) - (31 * u);
    interCharTime = (spaceTime * 3) / 19;
    interWordTime = (spaceTime * 7) / 19;
  }

  // Pre-calculate total duration
  let totalSeconds = 0.6; // initial lead-in
  const upper = text.toUpperCase();

  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    if (char === ' ') {
      totalSeconds += (interWordTime * wordSpaceMultiplier - interCharTime);
      continue;
    }
    const code = MORSE_MAP[char];
    if (code) {
      for (let j = 0; j < code.length; j++) {
        const symbol = code[j];
        const duration = symbol === '-' ? u * 3 : u;
        totalSeconds += duration;
        if (j < code.length - 1) {
          totalSeconds += u;
        }
      }
      totalSeconds += interCharTime;
    }
  }

  totalSeconds += 0.8; // lead-out

  const offlineCtx = new OfflineAudioContext(1, Math.ceil(totalSeconds * sampleRate), sampleRate);
  const osc = offlineCtx.createOscillator();
  const gain = offlineCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, 0);

  osc.connect(gain);
  gain.connect(offlineCtx.destination);

  gain.gain.setValueAtTime(0, 0);
  osc.start(0);

  let currentTime = 0.5;
  const tc = Math.max(0.001, (edgeMs / 1000) / 3);

  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    if (char === ' ') {
      currentTime += (interWordTime * wordSpaceMultiplier - interCharTime);
      continue;
    }
    const code = MORSE_MAP[char];
    if (code) {
      for (let j = 0; j < code.length; j++) {
        const symbol = code[j];
        const duration = symbol === '-' ? u * 3 : u;

        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.setTargetAtTime(0.85, currentTime, tc);

        currentTime += duration;

        gain.gain.setTargetAtTime(0, currentTime, tc);
        if (j < code.length - 1) {
          currentTime += u;
        }
      }
      currentTime += interCharTime;
    }
  }

  osc.stop(currentTime + 0.5);

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = buffer.getChannelData(0);
  const numSamples = data.length;
  const dataByteCount = numSamples * bytesPerSample;
  const wavHeaderByteCount = 44;
  const totalByteCount = wavHeaderByteCount + dataByteCount;

  const arrayBuffer = new ArrayBuffer(totalByteCount);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteCount, true);

  // Write PCM float to 16-bit PCM integer
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
