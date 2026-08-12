import React, { useState } from 'react';
import { X, Sparkles, Check, Wand2, Trash2 } from 'lucide-react';
import { Mp3Track } from '../types';
import { cleanLyrics } from '../utils/sunoCleaner';

interface LyricsEditorModalProps {
  track: Mp3Track | null;
  selectedTracks: Mp3Track[];
  isOpen: boolean;
  onClose: () => void;
  onSaveTrackLyrics: (trackId: string, lyrics: string) => void;
  onBatchCleanLyrics: (options: { stripPromptTags: boolean; clearAll: boolean }) => void;
}

export const LyricsEditorModal: React.FC<LyricsEditorModalProps> = ({
  track,
  selectedTracks,
  isOpen,
  onClose,
  onSaveTrackLyrics,
  onBatchCleanLyrics,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [lyricsText, setLyricsText] = useState(track?.lyrics || '');

  const handleSaveSingle = () => {
    if (track) {
      onSaveTrackLyrics(track.id, lyricsText);
    }
    onClose();
  };

  const handleStripSunoDirectivesSingle = () => {
    const cleaned = cleanLyrics(lyricsText, {
      stripTitleBracketedTags: true,
      stripSunoArtist: true,
      stripSunoAlbum: true,
      clearComments: true,
      clearUserTextFrames: true,
      cleanLyricsPromptTags: true,
      removeLeadingTrackNumbers: false,
      autoTitleCase: false,
    });
    setLyricsText(cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              {activeTab === 'single' && track
                ? `Edit Lyrics: ${track.title}`
                : 'Batch Lyrics Processor'}
            </h3>
            <p className="text-xs text-slate-400">
              Clean AI prompt tags, format stanza lines, or add custom synchronized text
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('single')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'single'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Current Track Lyrics
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'batch'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Batch Clean Selected ({selectedTracks.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'single' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Unsynchronized ID3 Lyrics (USLT):</span>
                <button
                  type="button"
                  onClick={handleStripSunoDirectivesSingle}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strip Suno Prompt Tags</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={lyricsText}
                onChange={e => setLyricsText(e.target.value)}
                placeholder="Enter song lyrics line by line..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <p className="text-slate-300">
                  Apply batch lyrics cleaning actions across all {selectedTracks.length} currently selected tracks:
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onBatchCleanLyrics({ stripPromptTags: true, clearAll: false });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                      <Wand2 className="w-4 h-4 text-amber-400" />
                      <span>Strip AI Directives & Style Prompts</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Removes [Style:...], [Prompt:...]</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Clear lyrics from ${selectedTracks.length} tracks?`)) {
                        onBatchCleanLyrics({ stripPromptTags: false, clearAll: true });
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-500/40 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-rose-400 font-semibold">
                      <Trash2 className="w-4 h-4" />
                      <span>Clear Lyrics Completely</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Purges USLT frames</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          {activeTab === 'single' && (
            <button
              onClick={handleSaveSingle}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Lyrics</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
