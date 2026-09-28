/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic2,
  HardDrive,
  Download,
  Sparkles,
  Play,
  RotateCcw,
  ClipboardPaste,
  Trash2,
  Volume2,
  Sliders,
  Settings,
  AudioLines,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  ArrowRight,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { AudioTrack, GenerationSettings } from './types';
import {
  convertGeminiAudioToMp3,
  formatFileSize,
  generateFilename,
} from './utils/audioEncoder';
import {
  saveTrackToStorage,
  getAllTracksFromStorage,
  deleteTrackFromStorage,
  clearAllTracksFromStorage,
  updateTrackInStorage,
  getTotalStorageUsage,
  downloadMp3File,
} from './utils/storage';
import { GEMINI_VOICES, SAMPLE_TEXTS, STYLE_PRESETS } from './utils/voices';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceSelector } from './components/VoiceSelector';
import { LibraryModal } from './components/LibraryModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [text, setText] = useState<string>(SAMPLE_TEXTS[0].text);
  const [settings, setSettings] = useState<GenerationSettings>({
    engine: 'gemini',
    voice: 'Kore',
    style: 'Natural, warm, engaging conversational tone',
    bitrate: 192,
    autoDownload: false,
    rate: 1,
    pitch: 1,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [savedTracks, setSavedTracks] = useState<AudioTrack[]>([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState<number>(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load existing tracks and storage stats from IndexedDB on startup
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const tracks = await getAllTracksFromStorage();
      setSavedTracks(tracks);
      const { totalBytes } = await getTotalStorageUsage();
      setTotalStorageBytes(totalBytes);

      // If no track is currently loaded and there is at least one saved track, load the most recent
      if (!currentTrack && tracks.length > 0) {
        setCurrentTrack(tracks[0]);
      }
    } catch (err) {
      console.error('Failed to load local storage tracks:', err);
    }
  };

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Convert Text to Speech & Encode MP3
  const handleConvert = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      addToast('error', 'Empty Text', 'Please enter some text to convert to speech.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Synthesizing neural voice...');

    try {
      // 1. Call server-side Gemini TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          voice: settings.voice,
          style: settings.style,
          model: 'gemini-3.8-flash-lite-tts',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate speech.');
      }

      setGenerationStep(`Encoding MP3 (${settings.bitrate} kbps)...`);

      // 2. Convert raw PCM/WAV to true MP3 using LAME encoder
      const { mp3Blob, duration, waveform } = await convertGeminiAudioToMp3(
        data.audioBase64,
        settings.bitrate,
        data.sampleRate || 24000
      );

      setGenerationStep('Saving to Local Storage...');

      // 3. Prepare Track record
      const id = 'vox_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const titleSnippet = trimmed.slice(0, 32).trim() + (trimmed.length > 32 ? '...' : '');
      const filename = generateFilename(trimmed.slice(0, 20), settings.voice);

      const newTrack: AudioTrack = {
        id,
        title: titleSnippet || 'Voice Recording',
        filename,
        text: trimmed,
        audioBlob: mp3Blob,
        audioUrl: URL.createObjectURL(mp3Blob),
        duration,
        size: mp3Blob.size,
        voice: settings.voice,
        engine: 'gemini',
        bitrate: settings.bitrate,
        style: settings.style,
        createdAt: Date.now(),
        waveform,
      };

      // 4. Save persistently into IndexedDB Local Storage
      await saveTrackToStorage(newTrack);

      // Refresh state
      setCurrentTrack(newTrack);
      await loadLibrary();

      addToast(
        'success',
        'MP3 Generated & Saved to Local Storage!',
        `${filename} (${(mp3Blob.size / 1024).toFixed(1)} KB)`
      );

      // 5. Optional Auto-download to device hard drive
      if (settings.autoDownload) {
        downloadMp3File(mp3Blob, filename);
        addToast('info', 'Downloaded to Computer', 'Auto-save saved the file to your Downloads folder.');
      }
    } catch (error: any) {
      console.error('Error generating audio:', error);
      addToast(
        'error',
        'Speech Generation Failed',
        error?.message || 'Could not connect to TTS engine.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Delete track from library
  const handleDeleteTrack = async (id: string) => {
    try {
      await deleteTrackFromStorage(id);
      if (currentTrack?.id === id) {
        const remaining = savedTracks.filter((t) => t.id !== id);
        setCurrentTrack(remaining.length > 0 ? remaining[0] : null);
      }
      await loadLibrary();
      addToast('info', 'File Deleted', 'Track removed from your local storage.');
    } catch (err) {
      console.error('Failed to delete track:', err);
    }
  };

  // Clear entire library
  const handleClearAll = async () => {
    try {
      await clearAllTracksFromStorage();
      setCurrentTrack(null);
      await loadLibrary();
      addToast('info', 'Library Cleared', 'All MP3 files have been removed from local storage.');
    } catch (err) {
      console.error('Failed to clear library:', err);
    }
  };

  // Rename a track in local storage
  const handleRenameTrack = async (id: string, newTitle: string) => {
    try {
      await updateTrackInStorage(id, { title: newTitle });
      if (currentTrack?.id === id) {
        setCurrentTrack((prev) => (prev ? { ...prev, title: newTitle } : null));
      }
      await loadLibrary();
      addToast('success', 'Renamed', 'Track title updated in local storage.');
    } catch (err) {
      console.error('Failed to rename track:', err);
    }
  };

  // Apply a sample script
  const handleApplySample = (sample: (typeof SAMPLE_TEXTS)[0]) => {
    setText(sample.text);
    const voiceObj = GEMINI_VOICES.find((v) => v.id === sample.voice);
    const styleObj = STYLE_PRESETS.find((s) => s.id === sample.style);

    setSettings((prev) => ({
      ...prev,
      voice: sample.voice,
      style: styleObj?.style || voiceObj?.recommendedStyle || prev.style,
    }));
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        addToast('info', 'Pasted', 'Text pasted from clipboard.');
      }
    } catch (err) {
      addToast('error', 'Clipboard Access', 'Could not read from clipboard.');
    }
  };

  // Estimated stats
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Average speaking rate: ~150 words per minute -> 2.5 words per sec
  const estimatedSeconds = Math.round(wordCount / 2.5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & App Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <AudioLines className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Voxify
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  MP3 Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Convert Text to Speech & Save MP3 into Local Storage
              </p>
            </div>
          </div>

          {/* Right Header: Local Storage Badge & Library Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs font-medium text-slate-200 shadow-sm"
              title="View all MP3 files stored in browser local storage"
            >
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Local Storage:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {savedTracks.length} {savedTracks.length === 1 ? 'file' : 'files'}
              </span>
              <span className="text-slate-500 font-mono text-[11px] hidden md:inline">
                ({formatFileSize(totalStorageBytes)})
              </span>
            </button>

            <button
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Library</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Editor & Active Player (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Script Editor Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm flex flex-col gap-4">
              {/* Card Header & Tools */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Mic2 className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm text-white">
                    Text Script
                  </h2>
                </div>

                {/* Editor Utility Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                    title="Paste text from clipboard"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>

                  <button
                    onClick={() => setText('')}
                    disabled={!text}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 transition-colors"
                    title="Clear text input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Sample Prompts Pills */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-2">
                  Quick Sample Scripts:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_TEXTS.map((sample) => (
                    <button
                      key={sample.title}
                      onClick={() => handleApplySample(sample)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter or paste the text you want to convert into speech. E.g. 'Welcome to our presentation today...'"
                  rows={8}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-y leading-relaxed font-normal"
                />
              </div>

              {/* Text Counters & Reading Estimates */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-1">
                <div className="flex items-center gap-3">
                  <span>{charCount} characters</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-indigo-400">
                    <Clock className="w-3.5 h-3.5" />
                    ~{estimatedSeconds}s estimated speech
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Voice: <span className="text-slate-300">{settings.voice}</span>
                </div>
              </div>

              {/* Big Generate Action Button */}
              <button
                onClick={handleConvert}
                disabled={isGenerating || !text.trim()}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden select-none ${
                  isGenerating || !text.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 active:scale-[0.99] border border-indigo-400/30 cursor-pointer'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-semibold text-white">
                      {generationStep || 'Generating MP3...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                    <span>Convert to Speech & Save MP3</span>
                    <ArrowRight className="w-4 h-4 text-indigo-200" />
                  </>
                )}
              </button>
            </div>

            {/* Currently Active Audio Player Card */}
            {currentTrack ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    Active MP3 Audio Player
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {currentTrack.id.slice(0, 14)}...
                  </span>
                </div>

                <AudioPlayer
                  track={currentTrack}
                  showStorageBadge={true}
                  onDownload={() => {
                    addToast(
                      'success',
                      'MP3 File Saved',
                      `Downloaded ${currentTrack.filename} to your device.`
                    );
                  }}
                />
              </div>
            ) : (
              /* Empty state placeholder when no track is loaded yet */
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500">
                  <FileAudio className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">
                    No Audio Loaded
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Enter text above and click "Convert to Speech & Save MP3" to create your first track.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Voice Settings & Recent Local Storage Tracks (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Voice & MP3 Settings Card */}
            <VoiceSelector
              settings={settings}
              onChange={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
              disabled={isGenerating}
            />

            {/* Recent Local Storage MP3s Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">
                    Saved in Local Storage
                  </h3>
                </div>

                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View All ({savedTracks.length}) →
                </button>
              </div>

              {savedTracks.length === 0 ? (
                <div className="text-center py-8 px-2">
                  <p className="text-xs text-slate-500">
                    Your generated MP3 files will automatically appear here and persist across browser sessions.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedTracks.slice(0, 4).map((track) => {
                    const isSelected = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div
                          onClick={() => setCurrentTrack(track)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white truncate max-w-[160px] sm:max-w-[200px]">
                              {track.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                              {track.voice}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>{formatFileSize(track.size)}</span>
                            <span>•</span>
                            <span>{track.bitrate} kbps</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setCurrentTrack(track)}
                            className={`p-2 rounded-lg text-xs transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Play Track"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>

                          <button
                            onClick={() => {
                              downloadMp3File(track.audioBlob, track.filename);
                              addToast(
                                'success',
                                'Downloaded',
                                `Saved ${track.filename} to local computer disk.`
                              );
                            }}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Download MP3 file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete from local storage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Local Storage Indicator Meter */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Persistent Local DB Active
                </span>
                <span>{formatFileSize(totalStorageBytes)} stored</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Local Storage Library Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        tracks={savedTracks}
        onSelectTrack={(track) => {
          setCurrentTrack(track);
          setIsLibraryOpen(false);
        }}
        onDeleteTrack={handleDeleteTrack}
        onClearAll={handleClearAll}
        onRenameTrack={handleRenameTrack}
        activeTrackId={currentTrack?.id}
        totalBytes={totalStorageBytes}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Voxify Studio • Neural Text-to-Speech & MP3 Local Storage Engine
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Export Format: MPEG-1 Audio Layer III (.mp3) • 128 / 192 / 320 kbps
          </p>
        </div>
      </footer>
    </div>
  );
}
