import React, { useState } from 'react';
import { X, Search, Replace, Check } from 'lucide-react';
import { BatchFindReplace, Mp3Track } from '../types';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTracks: Mp3Track[];
  onExecuteFindReplace: (config: BatchFindReplace) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  selectedTracks,
  onExecuteFindReplace,
}) => {
  if (!isOpen) return null;

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [applyTo, setApplyTo] = useState<BatchFindReplace['applyTo']>('title');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findText) return;

    onExecuteFindReplace({
      find: findText,
      replace: replaceText,
      useRegex,
      matchCase,
      applyTo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Find & Replace Metadata</h3>
              <p className="text-xs text-slate-400">
                Replace text patterns or regex across {selectedTracks.length} tracks
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Find Pattern:</label>
            <input
              type="text"
              placeholder={useRegex ? 'e.g. \\(Suno.*?\\)' : 'e.g. [Upbeat Pop]'}
              value={findText}
              onChange={e => setFindText(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Replace With:</label>
            <input
              type="text"
              placeholder="Leave blank to delete matched string"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Target Field:</label>
            <select
              value={applyTo}
              onChange={e => setApplyTo(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="title">Title Only</option>
              <option value="artist">Artist Only</option>
              <option value="album">Album Only</option>
              <option value="genre">Genre Only</option>
              <option value="lyrics">Lyrics Only</option>
              <option value="all">All Fields</option>
            </select>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={e => setUseRegex(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-500"
              />
              <span>Use Regular Expressions (Regex)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={e => setMatchCase(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-500"
              />
              <span>Match Case</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Replace className="w-4 h-4" />
              <span>Replace across {selectedTracks.length} Tracks</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
