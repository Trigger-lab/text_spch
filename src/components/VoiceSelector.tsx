import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Volume2,
  Sliders,
  Check,
  Radio,
  BookOpen,
  MessageSquare,
  GraduationCap,
  Film,
  Zap,
} from 'lucide-react';
import { GenerationSettings, TtsEngine } from '../types';
import { GEMINI_VOICES, STYLE_PRESETS } from '../utils/voices';

interface VoiceSelectorProps {
  settings: GenerationSettings;
  onChange: (updated: Partial<GenerationSettings>) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'voices' | 'styles' | 'settings'>('voices');
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);

  const handleVoiceSelect = (voiceId: string) => {
    const selectedVoice = GEMINI_VOICES.find((v) => v.id === voiceId);
    onChange({
      voice: voiceId,
      style: selectedVoice?.recommendedStyle || settings.style,
    });
  };

  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'Radio':
        return <Radio className="w-4 h-4" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Film':
        return <Film className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('voices')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'voices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Voices ({GEMINI_VOICES.length})
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'styles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Styles & Tone
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MP3 Output
          </button>
        </div>

        {/* Selected Voice indicator badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
          <Mic className="w-3.5 h-3.5" />
          <span>Active: {settings.voice}</span>
        </div>
      </div>

      {/* Tab 1: Voice Cards */}
      {activeTab === 'voices' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {GEMINI_VOICES.map((v) => {
              const isSelected = settings.voice === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => !disabled && handleVoiceSelect(v.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                          {v.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                            v.gender === 'female'
                              ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {v.gender}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400/90 font-medium mt-0.5">
                        {v.accent}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {v.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {v.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Style & Emotion Presets */}
      {activeTab === 'styles' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Guide the emotional nuance, pacing, and persona applied by the neural speech model:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STYLE_PRESETS.map((preset) => {
              const isSelected = settings.style === preset.style;
              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ style: preset.style })}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {getStyleIcon(preset.icon)}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">
                      {preset.label}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {preset.style}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Custom Persona / Style Instruction:
            </label>
            <input
              type="text"
              value={settings.style}
              onChange={(e) => onChange({ style: e.target.value })}
              placeholder="e.g. Enthusiastic documentary host with dramatic pauses..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Tab 3: MP3 Quality & Storage Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              MP3 Encoding Bitrate:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { rate: 128 as const, label: '128 kbps', desc: 'Compact / Fast' },
                { rate: 192 as const, label: '192 kbps', desc: 'High Quality (Default)' },
                { rate: 320 as const, label: '320 kbps', desc: 'Studio Master' },
              ].map((opt) => (
                <button
                  key={opt.rate}
                  onClick={() => onChange({ bitrate: opt.rate })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    settings.bitrate === opt.rate
                      ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto download toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <h5 className="text-xs font-semibold text-white">
                Auto-Save to Local Disk
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically download the .mp3 file to your device upon generation
              </p>
            </div>
            <button
              onClick={() => onChange({ autoDownload: !settings.autoDownload })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.autoDownload ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoDownload ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Engine note */}
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-200">
                Studio Neural Engine:
              </span>{' '}
              Speeches are processed via Google Gemini TTS (24kHz sampling rate) and encoded into standard MP3 format using LAME.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
