import React from 'react';
import { Music2, Sparkles, FolderDown, Trash2, Wand2, Activity } from 'lucide-react';
import { Mp3Track } from '../types';

interface HeaderProps {
  tracks: Mp3Track[];
  sunoCount: number;
  onLoadSamples: () => void;
  onPurgeSuno: () => void;
  onExportZip: () => void;
  onClearAll: () => void;
  onOpenSpectralAnalyzer?: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tracks,
  sunoCount,
  onLoadSamples,
  onPurgeSuno,
  onExportZip,
  onClearAll,
  onOpenSpectralAnalyzer,
  isProcessing,
}) => {
  const selectedCount = tracks.filter(t => t.isSelected).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Localhost badge - Geometric Balance style */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <div className="w-4 h-4 border-2 border-white flex items-center justify-center">
              <Music2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                Batch MP3 Metadata & Cover Art Cleaner
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                Localhost Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              SonicClean local batch processing
            </p>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {tracks.length === 0 ? (
            <button
              onClick={onLoadSamples}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Load demo MP3 files with Suno metadata for quick testing"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Load Demo Suno Album</span>
            </button>
          ) : (
            <>
              {onOpenSpectralAnalyzer && (
                <button
                  onClick={onOpenSpectralAnalyzer}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                  title="Run mechanical spectral FFT analysis"
                >
                  <Activity className="w-4 h-4" />
                  <span>Spectral Analyzer</span>
                </button>
              )}

              {sunoCount > 0 && (
                <button
                  onClick={onPurgeSuno}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Purge {sunoCount} Suno Tags</span>
                </button>
              )}

              <button
                onClick={onExportZip}
                disabled={selectedCount === 0 || isProcessing}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <FolderDown className="w-4 h-4" />
                <span>Export {selectedCount} Cleaned MP3s (.zip)</span>
              </button>

              <button
                onClick={onClearAll}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
