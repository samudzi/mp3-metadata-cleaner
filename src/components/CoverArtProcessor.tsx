import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Maximize2,
  Trash2,
  Sliders,
  Crop,
  Layers,
  Sparkles,
  Clipboard
} from 'lucide-react';
import { Mp3Track, CoverArtConfig } from '../types';
import { processCoverArtImage, formatBytes } from '../utils/imageUtils';

interface CoverArtProcessorProps {
  tracks: Mp3Track[];
  isOpen: boolean;
  onClose: () => void;
  onApplyCoverArt: (coverArt: Mp3Track['coverArt'], targetTracks: Mp3Track[]) => void;
  onRemoveCoverArt: (targetTracks: Mp3Track[]) => void;
}

export const CoverArtProcessor: React.FC<CoverArtProcessorProps> = ({
  tracks,
  isOpen,
  onClose,
  onApplyCoverArt,
  onRemoveCoverArt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCover, setActiveCover] = useState<Mp3Track['coverArt'] | null>(null);
  const [targetSize, setTargetSize] = useState<'500x500' | '800x800' | '1000x1000'>('800x800');
  const [quality, setQuality] = useState<number>(0.85);
  const [applyMode, setApplyMode] = useState<'selected' | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize with cover art from first track that has artwork
  useEffect(() => {
    if (isOpen && !activeCover) {
      const trackWithCover = tracks.find(t => t.coverArt && t.coverArt.dataUrl);
      if (trackWithCover?.coverArt) {
        setActiveCover(trackWithCover.coverArt);
      }
    }
  }, [isOpen, tracks]);

  if (!isOpen) return null;

  const selectedTracks = tracks.filter(t => t.isSelected);
  const targetTracks = applyMode === 'selected' ? selectedTracks : tracks;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleProcessNewImage(file);
    }
  };

  const handleProcessNewImage = async (source: File | Blob | string) => {
    setIsProcessing(true);
    try {
      const sizePx = targetSize === '500x500' ? 500 : targetSize === '800x800' ? 800 : 1000;
      const processed = await processCoverArtImage(source, sizePx, quality);
      setActiveCover({
        dataUrl: processed.dataUrl,
        mimeType: processed.mimeType,
        buffer: processed.buffer,
        width: processed.width,
        height: processed.height,
      });
    } catch (err) {
      console.error('Failed to process cover art:', err);
      alert('Could not load cover art image. Please try another JPEG/PNG file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!activeCover) return;
    onApplyCoverArt(activeCover, targetTracks);
    onClose();
  };

  const handleRemove = () => {
    if (confirm(`Remove cover art from ${targetTracks.length} tracks?`)) {
      onRemoveCoverArt(targetTracks);
      setActiveCover(null);
      onClose();
    }
  };

  const handleExtractFromTrack = async (track: Mp3Track) => {
    if (track.coverArt) {
      setActiveCover(track.coverArt);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            await handleProcessNewImage(blob);
            return;
          }
        }
      }
      alert('No image found in clipboard. Copy an image first!');
    } catch (err) {
      console.warn('Clipboard read failed:', err);
      alert('Could not read clipboard image.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Batch Cover Art Processor</h3>
              <p className="text-xs text-slate-400">
                Embed high-quality 1:1 square artwork across your MP3 album
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Cover Art Canvas & Preview */}
            <div className="flex flex-col items-center justify-center space-y-3 bg-slate-950 p-6 rounded-xl border border-slate-800 relative">
              <div className="w-56 h-56 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-2xl relative group flex items-center justify-center">
                {activeCover?.dataUrl ? (
                  <>
                    <img
                      src={activeCover.dataUrl}
                      alt="Cover Art Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 block">No Cover Art Loaded</span>
                  </div>
                )}
              </div>

              {activeCover && (
                <div className="text-center text-xs text-slate-400 space-y-0.5">
                  <span className="font-semibold text-slate-200">
                    {activeCover.width || 'Square'} × {activeCover.height || 'Square'} px
                  </span>
                  <div>
                    Format: <span className="uppercase text-slate-300">{activeCover.mimeType.replace('image/', '')}</span> • Size:{' '}
                    <span className="text-slate-300">{formatBytes(activeCover.buffer.byteLength)}</span>
                  </div>
                </div>
              )}

              {/* Upload Controls */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>

                <button
                  onClick={handlePasteClipboard}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Paste Clipboard</span>
                </button>
              </div>
            </div>

            {/* Right: Processing Options */}
            <div className="space-y-4 text-xs">
              
              {/* Target Size Preset */}
              <div className="space-y-2">
                <label className="font-bold text-slate-200 block">
                  Target Dimensions (1:1 Auto-Square Crop):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '500x500', label: '500 × 500', desc: 'Car / Legacy MP3' },
                    { id: '800x800', label: '800 × 800', desc: 'Standard HD' },
                    { id: '1000x1000', label: '1000 × 1000', desc: 'Hi-Res Album' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTargetSize(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        targetSize === item.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="font-bold text-slate-200 block">Apply Scope:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyMode('all')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      applyMode === 'all'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">All Tracks ({tracks.length})</div>
                    <div className="text-[10px] text-slate-500">Apply to full album batch</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyMode('selected')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      applyMode === 'selected'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Selected Tracks ({selectedTracks.length})</div>
                    <div className="text-[10px] text-slate-500">Apply to checked items</div>
                  </button>
                </div>
              </div>

              {/* Extract Cover Art from existing track */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="font-bold text-slate-200 block">
                  Extract Artwork From Track:
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {tracks.map((t, idx) => (
                    <div
                      key={t.id}
                      onClick={() => handleExtractFromTrack(t)}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {t.coverArt?.dataUrl ? (
                          <img src={t.coverArt.dataUrl} className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                          </div>
                        )}
                        <span className="truncate font-medium text-slate-300">
                          {idx + 1}. {t.title}
                        </span>
                      </div>
                      {t.coverArt?.dataUrl && (
                        <span className="text-[10px] text-indigo-400 font-semibold shrink-0">Use Art</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Cover Art From {targetTracks.length} Tracks</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!activeCover || isProcessing}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Cover Art ({targetTracks.length} Tracks)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
