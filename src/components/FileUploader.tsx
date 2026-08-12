import React, { useRef, useState } from 'react';
import { UploadCloud, Music, FolderPlus, Sparkles, FileAudio, ShieldCheck } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onLoadSamples: () => void;
  onOpenDistroAudit?: () => void;
  isProcessing: boolean;
  hasTracks: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  onLoadSamples,
  onOpenDistroAudit,
  isProcessing,
  hasTracks,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const audioFiles = Array.from(e.dataTransfer.files).filter(
        (f: File) => f.type.includes('audio') || f.name.toLowerCase().endsWith('.mp3')
      );
      if (audioFiles.length > 0) {
        onFilesSelected(audioFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all ${
        isDragging
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
          : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/80'
      } ${hasTracks ? 'mb-6 py-6 sm:py-6' : 'my-8'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,audio/mpeg,audio/mp3"
        onChange={handleFileChange}
        className="hidden"
      />

      <input
        ref={folderInputRef}
        type="file"
        multiple
        //@ts-ignore
        webkitdirectory="true"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            {hasTracks ? 'Add More MP3 Tracks or Album Folders' : 'Drop MP3 Audio Files Here'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            Drag & drop an entire album folder or multiple MP3s. Clean Suno metadata, edit tags, and embed custom 1:1 cover art locally.
          </p>
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <FileAudio className="w-4 h-4" />
            <span>Select MP3 Files</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <span>Select Folder</span>
          </button>

          {!hasTracks && (
            <>
              <button
                onClick={onLoadSamples}
                disabled={isProcessing}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Load Demo Album</span>
              </button>

              {onOpenDistroAudit && (
                <button
                  onClick={onOpenDistroAudit}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Distro Audit</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-center space-x-4 pt-1">
          <span>• 100% Local In-Browser Processing</span>
          <span>• No Files Uploaded To Server</span>
          <span>• ID3v2.3 Compliant</span>
        </div>
      </div>
    </div>
  );
};
