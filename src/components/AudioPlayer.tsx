import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  CheckCircle2,
  Share2,
  Repeat,
  Radio,
} from 'lucide-react';
import { AudioTrack } from '../types';
import { formatDuration, formatFileSize } from '../utils/audioEncoder';
import { downloadMp3File } from '../utils/storage';

interface AudioPlayerProps {
  track: AudioTrack;
  onDownload?: () => void;
  showStorageBadge?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  onDownload,
  showStorageBadge = true,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = track.audioUrl;
    audio.load();
    setCurrentTime(0);
    setIsPlaying(false);

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track.audioUrl, isLooping]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio play error:', err));
    }
  };

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipSeconds = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    handleSeek(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleDownload = () => {
    downloadMp3File(track.audioBlob, track.filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
    onDownload?.();
  };

  // Waveform progress calculation
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const waveformBars = track.waveform && track.waveform.length > 0 ? track.waveform : new Array(48).fill(0.35);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md transition-all">
      <audio ref={audioRef} preload="metadata" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white text-base tracking-tight truncate max-w-xs md:max-w-md">
                {track.title || 'Generated MP3 Audio'}
              </h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                {track.voice}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{track.filename}</span>
              <span>•</span>
              <span>{formatFileSize(track.size)}</span>
              <span>•</span>
              <span>{track.bitrate} kbps MP3</span>
            </p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2">
          {showStorageBadge && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved in Local Storage</span>
            </div>
          )}
          <button
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-95'
            }`}
            title="Download MP3 file to your device"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download MP3</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Waveform Display */}
      <div
        className="group relative h-20 bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex items-center gap-1 cursor-pointer overflow-hidden select-none hover:border-slate-700 transition-colors"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          handleSeek(ratio * duration);
        }}
      >
        {/* Scrubber background indicator */}
        <div
          className="absolute inset-y-0 left-0 bg-indigo-500/10 border-r border-indigo-400/50 pointer-events-none transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Waveform Bars */}
        <div className="w-full h-full flex items-center justify-between gap-1 z-10">
          {waveformBars.map((peak, idx) => {
            const barProgress = (idx / waveformBars.length) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  className={`w-full rounded-full transition-all duration-150 ${
                    isPlayed
                      ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                      : 'bg-slate-700/80 group-hover:bg-slate-600'
                  }`}
                  style={{
                    height: `${Math.max(12, peak * 90)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Playhead slider & time stamps */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-2 mb-4 px-1">
        <span>{formatDuration(currentTime)}</span>
        <div className="flex-1 mx-3">
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.01"
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => skipSeconds(-5)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => skipSeconds(5)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Fast forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg transition-colors ${
              isLooping
                ? 'text-indigo-400 bg-indigo-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Loop playback"
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={cyclePlaybackRate}
            className="px-2 py-1 rounded-md text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Cycle playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume & Details */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
