import React, { useState } from 'react';
import { ShieldAlert, Wand2, ChevronDown, ChevronUp, CheckCircle2, Settings2 } from 'lucide-react';
import { Mp3Track, SunoCleanOptions } from '../types';

interface SunoDetectionBannerProps {
  tracks: Mp3Track[];
  sunoOptions: SunoCleanOptions;
  onUpdateSunoOptions: (options: SunoCleanOptions) => void;
  onPurgeSuno: () => void;
}

export const SunoDetectionBanner: React.FC<SunoDetectionBannerProps> = ({
  tracks,
  sunoOptions,
  onUpdateSunoOptions,
  onPurgeSuno,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const sunoTracks = tracks.filter(t => t.sunoDetected.isSuno);

  if (sunoTracks.length === 0) return null;

  // Gather reasons summary
  const allReasons = Array.from(
    new Set(sunoTracks.flatMap(t => t.sunoDetected.reasons))
  );

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-y border-amber-500/30 px-4 sm:px-6 py-3.5 my-4 rounded-xl shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Warning Icon & Status */}
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-amber-200">
                Suno AI Metadata Detected in {sunoTracks.length} of {tracks.length} Tracks
              </h3>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded bg-amber-500/20 text-amber-300">
                Action Recommended
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Contains Suno AI style prompts in titles, model tags in comments, TXXX parameters, or prompt lyrics.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Cleaning Rules</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          <button
            onClick={onPurgeSuno}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Clean All Suno Tags</span>
          </button>
        </div>
      </div>

      {/* Expanded Cleaning Settings & Detected Flags */}
      {showDetails && (
        <div className="max-w-7xl mx-auto mt-4 pt-3.5 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Detected issues list */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-300 mb-2 block">Detected Suno Artifacts:</span>
            <ul className="space-y-1.5">
              {allReasons.map((reason, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-amber-300/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Toggle Switches */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 mb-1 block">Scrubbing Toggles:</span>
            
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sunoOptions.stripTitleBracketedTags}
                onChange={e => onUpdateSunoOptions({ ...sunoOptions, stripTitleBracketedTags: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Strip bracketed style prompts from Titles (e.g. <code>[Upbeat Pop]</code>, <code>[v3.5]</code>)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sunoOptions.stripSunoArtist}
                onChange={e => onUpdateSunoOptions({ ...sunoOptions, stripSunoArtist: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Clear Artist field if set to "Suno", "Suno AI" or "Suno User"</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sunoOptions.clearComments}
                onChange={e => onUpdateSunoOptions({ ...sunoOptions, clearComments: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Purge Suno prompt URLs, seed & parameters in Comments/TXXX</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sunoOptions.cleanLyricsPromptTags}
                onChange={e => onUpdateSunoOptions({ ...sunoOptions, cleanLyricsPromptTags: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Strip AI directives from Lyrics (e.g. <code>[Style:...]</code>, <code>[Guitar Solo]</code>)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sunoOptions.autoTitleCase}
                onChange={e => onUpdateSunoOptions({ ...sunoOptions, autoTitleCase: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Auto Title-Case track names after cleaning</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
