export type TtsEngine = 'gemini' | 'browser';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  accent: string;
  description: string;
  tags: string[];
  engine: TtsEngine;
  recommendedStyle?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  filename: string;
  text: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number; // in seconds
  size: number; // in bytes
  voice: string;
  engine: TtsEngine;
  bitrate: number; // e.g. 128, 192, 320
  style?: string;
  createdAt: number;
  waveform: number[]; // normalized 0..1 for UI display
  isFavorite?: boolean;
}

export interface GenerationSettings {
  engine: TtsEngine;
  voice: string;
  style: string;
  bitrate: 128 | 192 | 320;
  autoDownload: boolean;
  rate: number; // 0.5 to 2.0 (for browser engine)
  pitch: number; // 0.5 to 2.0 (for browser engine)
}
