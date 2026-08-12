import React from 'react';
import { Music2, Sparkles, FolderDown, Trash2, Wand2, ShieldAlert } from 'lucide-react';
import { Mp3Track } from '../types';

interface HeaderProps {
  tracks: Mp3Track[];
  sunoCount: number;
  onLoadSamples: () => void;
  onPurgeSuno: () => void;
  onExportZip: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tracks,
  sunoCount,
  onLoadSamples,
  onPurgeSuno,
  onExportZip,
  onClearAll,
  isProcessing,
}) => {
  const selectedCount = tracks.filter(t => t.isSelected).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Localhost badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Batch MP3 Metadata & Cover Art Cleaner
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Localhost Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bulk ID3 tag editor, Suno AI metadata scrubber & 1:1 cover art processor
            </p>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {tracks.length === 0 ? (
            <button
              onClick={onLoadSamples}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Load demo MP3 files with Suno metadata for quick testing"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Load Demo Suno Album</span>
            </button>
          ) : (
            <>
              {sunoCount > 0 && (
                <button
                  onClick={onPurgeSuno}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Purge {sunoCount} Suno Tags</span>
                </button>
              )}

              <button
                onClick={onExportZip}
                disabled={selectedCount === 0 || isProcessing}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <FolderDown className="w-4 h-4" />
                <span>Export {selectedCount} Cleaned MP3s (.zip)</span>
              </button>

              <button
                onClick={onClearAll}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                title="Clear all imported tracks"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
