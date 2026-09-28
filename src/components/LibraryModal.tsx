import React, { useState } from 'react';
import {
  HardDrive,
  Download,
  Trash2,
  Play,
  Pause,
  Search,
  X,
  Clock,
  FileAudio,
  CheckCircle2,
  Edit2,
  Check,
  AlertTriangle,
  FolderDown,
} from 'lucide-react';
import { AudioTrack } from '../types';
import {
  formatDuration,
  formatFileSize,
} from '../utils/audioEncoder';
import { downloadMp3File } from '../utils/storage';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: AudioTrack[];
  onSelectTrack: (track: AudioTrack) => void;
  onDeleteTrack: (id: string) => void;
  onClearAll: () => void;
  onRenameTrack: (id: string, newTitle: string) => void;
  activeTrackId?: string;
  totalBytes: number;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onSelectTrack,
  onDeleteTrack,
  onClearAll,
  onRenameTrack,
  activeTrackId,
  totalBytes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoiceFilter, setSelectedVoiceFilter] = useState<string>('all');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVoice =
      selectedVoiceFilter === 'all' || t.voice === selectedVoiceFilter;
    return matchesSearch && matchesVoice;
  });

  const uniqueVoices = Array.from(new Set(tracks.map((t) => t.voice)));

  const startEditing = (track: AudioTrack) => {
    setEditingTrackId(track.id);
    setEditTitleValue(track.title);
  };

  const saveEditing = (id: string) => {
    if (editTitleValue.trim()) {
      onRenameTrack(id, editTitleValue.trim());
    }
    setEditingTrackId(null);
  };

  const handleDownload = (track: AudioTrack) => {
    downloadMp3File(track.audioBlob, track.filename);
    setDownloadedIds((prev) => new Set(prev).add(track.id));
    setTimeout(() => {
      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }, 2000);
  };

  const handleDownloadAll = () => {
    filteredTracks.forEach((track, index) => {
      setTimeout(() => {
        downloadMp3File(track.audioBlob, track.filename);
      }, index * 400);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Local Storage Audio Library
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-medium">
                  {tracks.length} MP3 {tracks.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
                <span>Space Used: {formatFileSize(totalBytes)}</span>
                <span>•</span>
                <span>Stored in Browser IndexedDB (Persistent)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tracks.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                title="Download all listed MP3 files to your computer"
              >
                <FolderDown className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Export All</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/20 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, text snippet, or filename..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Voice filter */}
            {uniqueVoices.length > 1 && (
              <select
                value={selectedVoiceFilter}
                onChange={(e) => setSelectedVoiceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Voices ({tracks.length})</option>
                {uniqueVoices.map((voice) => (
                  <option key={voice} value={voice}>
                    {voice}
                  </option>
                ))}
              </select>
            )}

            {tracks.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20"
                title="Clear all saved files from local storage"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Clear Confirmation Prompt */}
        {showClearConfirm && (
          <div className="mx-6 my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <h5 className="text-xs font-semibold text-white">
                  Permanently delete all {tracks.length} MP3 files from Local Storage?
                </h5>
                <p className="text-[11px] text-rose-300 mt-0.5">
                  This action cannot be undone. Make sure you downloaded important files first.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto mb-4">
                <FileAudio className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-200">
                {tracks.length === 0
                  ? 'No MP3 files in Local Storage yet'
                  : 'No matches found'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                {tracks.length === 0
                  ? 'Type your text, click "Convert to MP3", and your generated audio will be automatically saved here in your browser.'
                  : 'Try adjusting your search query or voice filter.'}
              </p>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isActive = track.id === activeTrackId;
              const isDownloaded = downloadedIds.has(track.id);

              return (
                <div
                  key={track.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  {/* Left: Info & Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {editingTrackId === track.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && saveEditing(track.id)
                            }
                            autoFocus
                            className="bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => saveEditing(track.id)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h4 className="font-semibold text-sm text-white truncate max-w-sm">
                            {track.title}
                          </h4>
                          <button
                            onClick={() => startEditing(track)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity"
                            title="Rename track"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        {track.voice}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2 font-normal">
                      "{track.text}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDuration(track.duration)}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(track.size)}</span>
                      <span>•</span>
                      <span>{track.bitrate} kbps</span>
                      <span>•</span>
                      <span>
                        {new Date(track.createdAt).toLocaleDateString()}{' '}
                        {new Date(track.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onSelectTrack(track)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={isActive ? 'Currently loaded' : 'Load and play'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isActive ? 'Loaded' : 'Play'}</span>
                    </button>

                    <button
                      onClick={() => handleDownload(track)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isDownloaded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95'
                      }`}
                      title="Save MP3 file to your device disk"
                    >
                      {isDownloaded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteTrack(track.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete from local storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>All tracks are preserved in your browser's persistent local storage.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
