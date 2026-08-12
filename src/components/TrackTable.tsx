import React from 'react';
import {
  Play,
  Pause,
  Trash2,
  FileText,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Download,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { Mp3Track } from '../types';

interface TrackTableProps {
  tracks: Mp3Track[];
  currentPlayingId: string | null;
  onTogglePlay: (track: Mp3Track) => void;
  onUpdateTrack: (id: string, updates: Partial<Mp3Track>) => void;
  onDeleteTrack: (id: string) => void;
  onToggleSelectTrack: (id: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  onMoveTrack: (index: number, direction: 'up' | 'down') => void;
  onOpenLyricsModal: (track: Mp3Track) => void;
  onExportSingle: (track: Mp3Track) => void;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  currentPlayingId,
  onTogglePlay,
  onUpdateTrack,
  onDeleteTrack,
  onToggleSelectTrack,
  onToggleSelectAll,
  onMoveTrack,
  onOpenLyricsModal,
  onExportSingle,
}) => {
  const allSelected = tracks.length > 0 && tracks.every(t => t.isSelected);
  const someSelected = tracks.some(t => t.isSelected) && !allSelected;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      
      {/* Table Header Controls */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-slate-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={e => onToggleSelectAll(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
            />
            <span>Select All ({tracks.length} Tracks)</span>
          </label>
        </div>

        <div className="text-slate-400">
          Showing {tracks.length} track{tracks.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-10">Select</th>
              <th className="py-3 px-2 text-center w-12">Track #</th>
              <th className="py-3 px-2 text-center w-10">Play</th>
              <th className="py-3 px-2 w-12 text-center">Art</th>
              <th className="py-3 px-3 min-w-[180px]">Title</th>
              <th className="py-3 px-3 min-w-[140px]">Artist</th>
              <th className="py-3 px-3 min-w-[140px]">Album</th>
              <th className="py-3 px-3 min-w-[110px]">Genre</th>
              <th className="py-3 px-2 w-16">Year</th>
              <th className="py-3 px-3 text-center w-28">Status</th>
              <th className="py-3 px-3 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tracks.map((track, index) => {
              const isPlaying = currentPlayingId === track.id;
              const isSuno = track.sunoDetected.isSuno;

              return (
                <tr
                  key={track.id}
                  className={`group transition ${
                    track.isSelected ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={track.isSelected}
                      onChange={() => onToggleSelectTrack(track.id)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Track Number & Ordering controls */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="text"
                        value={track.trackNumber}
                        onChange={e => onUpdateTrack(track.id, { trackNumber: e.target.value })}
                        className="w-8 text-center bg-slate-950 border border-slate-800 rounded px-1 py-1 text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onMoveTrack(index, 'up')}
                          disabled={index === 0}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onMoveTrack(index, 'down')}
                          disabled={index === tracks.length - 1}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Play Button */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => onTogglePlay(track)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isPlaying
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </td>

                  {/* Artwork Thumbnail */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 overflow-hidden mx-auto flex items-center justify-center">
                      {track.coverArt?.dataUrl ? (
                        <img src={track.coverArt.dataUrl} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={track.title}
                      onChange={e => onUpdateTrack(track.id, { title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white font-medium focus:border-indigo-500 focus:outline-none"
                    />
                  </td>

                  {/* Artist */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={track.artist}
                      onChange={e => onUpdateTrack(track.id, { artist: e.target.value })}
                      placeholder="Artist"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                    />
                  </td>

                  {/* Album */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={track.album}
                      onChange={e => onUpdateTrack(track.id, { album: e.target.value })}
                      placeholder="Album"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                    />
                  </td>

                  {/* Genre */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={track.genre}
                      onChange={e => onUpdateTrack(track.id, { genre: e.target.value })}
                      placeholder="Genre"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                    />
                  </td>

                  {/* Year */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={track.year}
                      onChange={e => onUpdateTrack(track.id, { year: e.target.value })}
                      placeholder="2026"
                      className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center text-slate-300 focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                    />
                  </td>

                  {/* Suno / Clean Status */}
                  <td className="py-2.5 px-3 text-center">
                    {isSuno ? (
                      <span
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[10px]"
                        title={track.sunoDetected.reasons.join(', ')}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Suno AI</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        <span>Clean</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onOpenLyricsModal(track)}
                        className={`p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer ${
                          track.lyrics ? 'text-indigo-400' : ''
                        }`}
                        title={track.lyrics ? 'Edit Lyrics (Has Content)' : 'Add / Edit Lyrics'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onExportSingle(track)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                        title="Export Cleaned MP3"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Remove Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
