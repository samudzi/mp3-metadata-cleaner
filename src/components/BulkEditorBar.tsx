import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  Hash,
  Type,
  Search,
  CheckSquare,
  Wand2,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BulkMetadataConfig, Mp3Track } from '../types';

interface BulkEditorBarProps {
  tracks: Mp3Track[];
  selectedTracksCount: number;
  onApplyBulkMetadata: (config: BulkMetadataConfig) => void;
  onOpenCoverArtProcessor: () => void;
  onAutoSequenceTracks: (padWithZero: boolean) => void;
  onTitleCaseTitles: () => void;
  onStripLeadingNumbers: () => void;
  onOpenFindReplace: () => void;
  onOpenLyricsEditor: () => void;
}

const COMMON_GENRES = [
  'Pop', 'Rock', 'Electronic', 'Synthwave', 'Hip-Hop', 'Acoustic',
  'Ambient', 'R&B / Soul', 'Chillhop', 'Classical', 'Jazz', 'Dance',
  'Indie', 'Folk', 'Metal', 'Lo-Fi', 'Soundtrack'
];

export const BulkEditorBar: React.FC<BulkEditorBarProps> = ({
  tracks,
  selectedTracksCount,
  onApplyBulkMetadata,
  onOpenCoverArtProcessor,
  onAutoSequenceTracks,
  onTitleCaseTitles,
  onStripLeadingNumbers,
  onOpenFindReplace,
  onOpenLyricsEditor,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const [config, setConfig] = useState<BulkMetadataConfig>({
    artist: '',
    album: '',
    albumArtist: '',
    genre: '',
    year: new Date().getFullYear().toString(),
    totalTracks: String(tracks.length),
    comment: '',
    applyArtist: true,
    applyAlbum: true,
    applyAlbumArtist: false,
    applyGenre: true,
    applyYear: true,
    applyTotalTracks: false,
    applyComment: false,
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyBulkMetadata(config);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
      
      {/* Panel Top Bar */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">
            Bulk Album Metadata & Batch Processing
          </h2>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-medium">
            {selectedTracksCount} of {tracks.length} tracks selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCoverArtProcessor}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Cover Art Processor</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5">
          
          {/* Quick Action Tools Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Title Tools:</span>

            <button
              onClick={() => onAutoSequenceTracks(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Set track numbers 01, 02, 03... in list order"
            >
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto Track # (01, 02...)</span>
            </button>

            <button
              onClick={onTitleCaseTitles}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Convert all titles to proper Title Case"
            >
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto Title-Case</span>
            </button>

            <button
              onClick={onStripLeadingNumbers}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Strip '01 - ' or '1. ' prefixes from titles"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Strip Track # From Titles</span>
            </button>

            <button
              onClick={onOpenFindReplace}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Find & Replace / Regex</span>
            </button>

            <button
              onClick={onOpenLyricsEditor}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lyrics Batch Cleaner</span>
            </button>
          </div>

          {/* Form for Album Batch Metadata */}
          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              
              {/* Artist */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Artist Name</label>
                  <label className="flex items-center space-x-1 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.applyArtist}
                      onChange={e => setConfig({ ...config, applyArtist: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                    />
                    <span>Apply</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Celestial Echoes"
                  value={config.artist}
                  onChange={e => setConfig({ ...config, artist: e.target.value })}
                  disabled={!config.applyArtist}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              {/* Album */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Album Name</label>
                  <label className="flex items-center space-x-1 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.applyAlbum}
                      onChange={e => setConfig({ ...config, applyAlbum: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                    />
                    <span>Apply</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Cybernetic Horizon"
                  value={config.album}
                  onChange={e => setConfig({ ...config, album: e.target.value })}
                  disabled={!config.applyAlbum}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              {/* Genre */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Genre</label>
                  <label className="flex items-center space-x-1 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.applyGenre}
                      onChange={e => setConfig({ ...config, applyGenre: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                    />
                    <span>Apply</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="genre-suggestions"
                    placeholder="e.g. Synthwave"
                    value={config.genre}
                    onChange={e => setConfig({ ...config, genre: e.target.value })}
                    disabled={!config.applyGenre}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <datalist id="genre-suggestions">
                    {COMMON_GENRES.map(g => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Release Year</label>
                  <label className="flex items-center space-x-1 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.applyYear}
                      onChange={e => setConfig({ ...config, applyYear: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                    />
                    <span>Apply</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="2026"
                  value={config.year}
                  onChange={e => setConfig({ ...config, year: e.target.value })}
                  disabled={!config.applyYear}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="submit"
                disabled={selectedTracksCount === 0}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Apply Bulk Metadata to {selectedTracksCount} Selected Tracks</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
