import { VoiceOption } from '../types';

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    accent: 'Warm & Natural',
    description: 'Soothing, friendly, and crystal clear. Excellent for narrations, tutorials, and general reading.',
    tags: ['Warm', 'Clear', 'Versatile'],
    engine: 'gemini',
    recommendedStyle: 'Natural, warm, engaging conversational tone',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    accent: 'Youthful & Energetic',
    description: 'Upbeat, modern, and engaging. Great for podcasts, announcements, and youth-oriented content.',
    tags: ['Energetic', 'Upbeat', 'Modern'],
    engine: 'gemini',
    recommendedStyle: 'Enthusiastic, lively, friendly podcast host',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    accent: 'Deep & Resonant',
    description: 'Deep baritone, cinematic, and authoritative. Perfect for dramatic storytelling, trailers, and documentaries.',
    tags: ['Deep', 'Cinematic', 'Authoritative'],
    engine: 'gemini',
    recommendedStyle: 'Deep, calm, cinematic storyteller tone',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    accent: 'Confident & Articulate',
    description: 'Direct, professional, and commanding. Ideal for news, audiobooks, and business presentations.',
    tags: ['Commanding', 'Articulate', 'Crisp'],
    engine: 'gemini',
    recommendedStyle: 'Clear, authoritative professional tone',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    accent: 'Gentle & Melodic',
    description: 'Soft, gentle, and melodic. Ideal for meditations, bedtime stories, and calming guides.',
    tags: ['Soft', 'Melodic', 'Peaceful'],
    engine: 'gemini',
    recommendedStyle: 'Calm, gentle, soothing meditation voice',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'female',
    accent: 'Polished & Expressive',
    description: 'Expressive, eloquent, and sophisticated. Ideal for literary readings and commercials.',
    tags: ['Eloquent', 'Expressive', 'Polished'],
    engine: 'gemini',
    recommendedStyle: 'Polished, expressive and articulate delivery',
  },
];

export const STYLE_PRESETS = [
  {
    id: 'conversational',
    label: 'Conversational',
    icon: 'MessageSquare',
    style: 'Natural, clear speech with conversational pacing and warm tone',
  },
  {
    id: 'storyteller',
    label: 'Audiobook & Story',
    icon: 'BookOpen',
    style: 'Expressive audiobook storyteller with emotional depth and captivating cadence',
  },
  {
    id: 'news',
    label: 'News & Broadcast',
    icon: 'Radio',
    style: 'Authoritative, crisp news anchor delivery with neutral, professional cadence',
  },
  {
    id: 'educator',
    label: 'Teacher / Explainer',
    icon: 'GraduationCap',
    style: 'Enthusiastic, approachable educator explaining fascinating concepts clearly',
  },
  {
    id: 'meditation',
    label: 'Calm & Mindful',
    icon: 'Sparkles',
    style: 'Soothing, gentle, relaxed mindfulness guide with deliberate soft pacing',
  },
  {
    id: 'trailer',
    label: 'Dramatic Trailer',
    icon: 'Film',
    style: 'Intense, dramatic cinematic voice with deep resonance and punchy emphasis',
  },
];

export const SAMPLE_TEXTS = [
  {
    title: 'Technology Intro',
    text: 'Welcome to the future of speech synthesis. With neural voice modeling, written words transform into authentic, emotionally nuanced audio ready for your next production.',
    style: 'conversational',
    voice: 'Kore',
  },
  {
    title: 'Audiobook Excerpt',
    text: 'The ancient clock tower struck midnight. Rain pattered rhythmically against the glass windows of the study as Jonathan finally uncovered the cipher hidden between the faded parchment pages.',
    style: 'storyteller',
    voice: 'Charon',
  },
  {
    title: 'Podcast Opener',
    text: "Hey everyone, welcome back to the show! Today we have an unbelievable breakdown of the newest audio tools that every creator needs in their workflow. Let's get right into it!",
    style: 'educator',
    voice: 'Puck',
  },
  {
    title: 'Mindfulness Breathing',
    text: 'Take a slow, deep breath in through your nose. Hold for a moment, and gently let it all go. Allow your shoulders to relax as you settle into this present moment.',
    style: 'meditation',
    voice: 'Zephyr',
  },
  {
    title: 'Product Pitch',
    text: 'Voxify turns any text into studio-grade MP3 audio files in seconds. Download directly to your hard drive or save securely in your local browser library with zero hassle.',
    style: 'news',
    voice: 'Fenrir',
  },
];
