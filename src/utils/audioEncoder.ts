import { Mp3Encoder } from '@breezystack/lamejs';
export { downloadMp3File } from './storage';

/**
 * Base64 string to Uint8Array helper
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Check if the buffer has a RIFF WAVE header
 */
export function isWavHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 && // 'F'
    bytes[8] === 0x57 && // 'W'
    bytes[9] === 0x41 && // 'A'
    bytes[10] === 0x56 && // 'V'
    bytes[11] === 0x45    // 'E'
  );
}

/**
 * Converts Float32Array audio samples (-1.0 to 1.0) into Int16Array (-32768 to 32767)
 */
export function floatToInt16(floatSamples: Float32Array): Int16Array {
  const len = floatSamples.length;
  const int16 = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/**
 * Encodes an Int16Array of mono audio samples into an MP3 Blob using LAME MP3 Encoder
 */
export function encodeInt16ToMp3(
  samples: Int16Array,
  sampleRate = 24000,
  kbps = 192
): Blob {
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const mp3Chunks: Uint8Array[] = [];
  const maxBlockSize = 1152;

  for (let i = 0; i < samples.length; i += maxBlockSize) {
    const chunk = samples.subarray(i, i + maxBlockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Chunks.push(new Uint8Array(mp3buf));
    }
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) {
    mp3Chunks.push(new Uint8Array(endBuf));
  }

  return new Blob(mp3Chunks as unknown as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Extracts a normalized waveform peak array (e.g. 48 bars) from audio samples
 */
export function extractWaveform(samples: Float32Array | Int16Array, barCount = 48): number[] {
  const step = Math.floor(samples.length / barCount);
  if (step <= 0) return new Array(barCount).fill(0.3);

  const peaks: number[] = [];
  const isFloat = samples instanceof Float32Array;

  for (let i = 0; i < barCount; i++) {
    const start = i * step;
    const end = Math.min(start + step, samples.length);
    let max = 0;

    for (let j = start; j < end; j++) {
      const val = isFloat ? Math.abs(samples[j]) : Math.abs(samples[j] / 32768);
      if (val > max) max = val;
    }

    // Scale to a nice readable visual height between 0.15 and 1.0
    peaks.push(Math.max(0.15, Math.min(1, Math.round(max * 100) / 100)));
  }

  return peaks;
}

/**
 * Converts audio data received from Gemini (base64 PCM or WAV) into a pristine MP3 Blob
 */
export async function convertGeminiAudioToMp3(
  base64Audio: string,
  bitrate = 192,
  sampleRate = 24000
): Promise<{ mp3Blob: Blob; duration: number; waveform: number[] }> {
  const bytes = base64ToUint8Array(base64Audio);
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();

  try {
    let audioBuffer: AudioBuffer | null = null;

    // Check if it's already a valid WAV container
    if (isWavHeader(bytes)) {
      try {
        audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
      } catch (err) {
        console.warn('WAV decode failed, falling back to manual PCM decoding:', err);
      }
    }

    if (!audioBuffer) {
      // Decode raw 16-bit PCM (Gemini default 24kHz mono little-endian)
      // If headerless PCM, bytes length must be even (16-bit = 2 bytes per sample)
      let pcmOffset = 0;
      // Skip WAV header if partially present
      if (isWavHeader(bytes)) {
        pcmOffset = 44; // standard 44-byte WAV header
      }

      const rawBuffer = bytes.buffer.slice(bytes.byteOffset + pcmOffset);
      const int16Samples = new Int16Array(rawBuffer);

      // Create AudioBuffer from raw samples
      audioBuffer = ctx.createBuffer(1, int16Samples.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Samples.length; i++) {
        channelData[i] = int16Samples[i] / 32768;
      }
    }

    // Get channel 0 Float32Array data
    const floatSamples = audioBuffer.getChannelData(0);
    const int16 = floatToInt16(floatSamples);
    const actualSampleRate = audioBuffer.sampleRate || sampleRate;

    // Encode to MP3 using LAME
    const mp3Blob = encodeInt16ToMp3(int16, actualSampleRate, bitrate);
    const duration = audioBuffer.duration || (floatSamples.length / actualSampleRate);
    const waveform = extractWaveform(floatSamples, 48);

    await ctx.close();
    return { mp3Blob, duration, waveform };
  } catch (error) {
    await ctx.close().catch(() => {});
    throw error;
  }
}

/**
 * Format bytes to readable size (e.g. 150 KB, 1.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Format duration to mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate a clean, descriptive MP3 filename
 */
export function generateFilename(title: string, voice: string): string {
  const cleanTitle = (title || 'speech')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 24);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
  return `${cleanTitle}_${voice.toLowerCase()}_${dateStr}_${timeStr}.mp3`;
}
