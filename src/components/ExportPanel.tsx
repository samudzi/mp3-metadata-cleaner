import React, { useState } from 'react';
import { Download, FolderDown, FileCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Mp3Track } from '../types';

interface ExportPanelProps {
  tracks: Mp3Track[];
  isExporting: boolean;
  exportProgress: { current: number; total: number; currentFileName: string } | null;
  onExportZip: (zipName: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  tracks,
  isExporting,
  exportProgress,
  onExportZip,
}) => {
  const selectedTracks = tracks.filter(t => t.isSelected);

  // Default zip name e.g. "Artist - Album (Cleaned).zip" or "Album_Tracks_Cleaned.zip"
  const sampleArtist = tracks[0]?.artist;
  const sampleAlbum = tracks[0]?.album;
  const defaultZipName =
    sampleArtist && sampleAlbum
      ? `${sampleArtist} - ${sampleAlbum} (Cleaned)`
      : sampleAlbum
      ? `${sampleAlbum} (Cleaned)`
      : 'Cleaned_MP3_Album';

  const [zipFileName, setZipFileName] = useState(defaultZipName);

  if (tracks.length === 0) return null;

  const handleZipDownload = (e: React.FormEvent) => {
    e.preventDefault();
    onExportZip(zipFileName);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl mb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Batch Export & Download</h3>
          </div>
          <p className="text-xs text-slate-400">
            Export {selectedTracks.length} selected MP3 tracks re-tagged with clean ID3v2.3 headers and embedded cover art
          </p>
        </div>

        {/* Zip Export Form */}
        <form onSubmit={handleZipDownload} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-400 font-medium">Archive Name:</span>
            <input
              type="text"
              value={zipFileName}
              onChange={e => setZipFileName(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none w-48 sm:w-60"
            />
            <span className="text-slate-500 font-mono">.zip</span>
          </div>

          <button
            type="submit"
            disabled={isExporting || selectedTracks.length === 0}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Packing Zip ({exportProgress?.current || 0}/{exportProgress?.total || selectedTracks.length})</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Cleaned Album (.zip)</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Progress Bar overlay when packing zip */}
      {isExporting && exportProgress && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Processing ID3 tags & packing: <strong>{exportProgress.currentFileName}</strong></span>
            <span className="font-mono text-indigo-400">
              {Math.round((exportProgress.current / exportProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
