import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Mic,
  Zap,
  RefreshCw,
  BarChart2,
  Volume2,
  Disc,
  Info
} from 'lucide-react';
import { Mp3Track } from '../types';
import { analyzeDistroReadiness } from '../utils/distroAnalyzer';

interface DistroAuditModalProps {
  tracks: Mp3Track[];
  onUpdateTrack: (trackId: string, updates: Partial<Mp3Track>) => void;
  onClose: () => void;
  onLoadSamples?: () => void;
}

export const DistroAuditModal: React.FC<DistroAuditModalProps> = ({
  tracks,
  onUpdateTrack,
  onClose,
  onLoadSamples,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const activeTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0];

  const handleRunSingleAudit = async (track: Mp3Track) => {
    setIsAnalyzing(true);
    setProgressMsg(`Running DSP Mix, EQ & Distro Audit for "${track.title}"...`);

    try {
      const report = await analyzeDistroReadiness(track);
      onUpdateTrack(track.id, { distroReport: report });
    } catch (err) {
      console.error('Distro audit failed:', err);
      alert('Distro audit failed: ' + (err as Error).message);
    } finally {
      setIsAnalyzing(false);
      setProgressMsg('');
    }
  };

  const handleRunAllBatchAudit = async () => {
    setIsAnalyzing(true);
    let count = 0;

    for (const track of tracks) {
      count++;
      setProgressMsg(`Auditing track ${count} of ${tracks.length}: "${track.title}"...`);
      try {
        const report = await analyzeDistroReadiness(track);
        onUpdateTrack(track.id, { distroReport: report });
      } catch (err) {
        console.warn('Skipping track due to audit error', track.title, err);
      }
    }

    setIsAnalyzing(false);
    setProgressMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-xl overflow-hidden flex flex-col my-6 text-slate-800 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  Distribution & Mix Readiness Studio
                </h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                  DSP / LUFS / EQ
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic audit for DistroKid, TuneCore & Apple Music: Loudness, Peak Headroom, EQ Balance & Vocal Presence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header Bar */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <Radio className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">Target Standards:</span>
            <span className="text-slate-500">-14 LUFS Integrated • -1.0 dBFS Peak • 6-Band Tonal Curve</span>
          </div>

          <button
            onClick={handleRunAllBatchAudit}
            disabled={isAnalyzing || tracks.length === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Audit All {tracks.length} Tracks</span>
          </button>
        </div>

        {/* Grid Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Sidebar Track List */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto space-y-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Album Track List ({tracks.length})
            </span>

            {tracks.map((t, idx) => {
              const rep = t.distroReport;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                    activeTrack?.id === t.id
                      ? 'border-indigo-600 bg-white font-bold text-slate-800 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="truncate">
                    <div className="truncate font-medium">{idx + 1}. {t.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {rep ? `${rep.integratedLufs} LUFS • ${rep.distroScore}% Score` : 'Not audited'}
                    </div>
                  </div>

                  {rep ? (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      rep.distroScore >= 85
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rep.distroScore >= 60
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {rep.distroScore}%
                    </span>
                  ) : (
                    <Disc className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Inspection Canvas */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
            {activeTrack ? (
              <div className="space-y-6">
                
                {/* Active Track Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{activeTrack.title}</h4>
                    <p className="text-slate-500">
                      {activeTrack.artist || 'Unknown Artist'} • {activeTrack.album || 'Single'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRunSingleAudit(activeTrack)}
                    disabled={isAnalyzing}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>{activeTrack.distroReport ? 'Re-Audit Track' : 'Run DSP Audit'}</span>
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-center font-medium flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>{progressMsg || 'Analyzing loudness (LUFS), EQ curves, and vocal presence...'}</span>
                  </div>
                )}

                {/* Report Display */}
                {activeTrack.distroReport ? (
                  <div className="space-y-6">
                    
                    {/* Score & Verdict Banner */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      activeTrack.distroReport.distroScore >= 85
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : activeTrack.distroReport.distroScore >= 60
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : 'bg-red-50/80 border-red-200 text-red-900'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {activeTrack.distroReport.distroScore >= 85 ? (
                          <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-sm">
                            {activeTrack.distroReport.distroStatus}
                          </div>
                          <p className="text-xs opacity-90">
                            Distribution Readiness Score: {activeTrack.distroReport.distroScore}%
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-extrabold font-mono">
                          {activeTrack.distroReport.distroScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Loudness & Dynamics Metering */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        <h5 className="font-bold text-slate-800 text-xs">
                          Loudness & Peak Dynamics Meter (EBU R128 / ITU BS.1770)
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* Integrated LUFS */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-slate-500 text-[11px] font-semibold block">
                            Integrated Loudness (LUFS)
                          </span>
                          <div className="text-base font-bold font-mono text-slate-800">
                            {activeTrack.distroReport.integratedLufs} LUFS
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Target: -14.0 LUFS (Streaming Standard)
                          </div>
                        </div>

                        {/* True Peak dBFS */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-slate-500 text-[11px] font-semibold block">
                            Peak Headroom (dBFS)
                          </span>
                          <div className="text-base font-bold font-mono text-slate-800">
                            {activeTrack.distroReport.peakDbfs} dBFS
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {activeTrack.distroReport.peakDbfs <= -0.5
                              ? '✓ Safe MP3 Headroom'
                              : '⚠️ Risk of Inter-Sample Distortion'}
                          </div>
                        </div>

                        {/* Dynamic Range Crest Factor */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-slate-500 text-[11px] font-semibold block">
                            Dynamic Crest Factor
                          </span>
                          <div className="text-base font-bold font-mono text-slate-800">
                            {activeTrack.distroReport.dynamicRangeDb} dB
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {activeTrack.distroReport.loudnessRating}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Section 2: 6-Band EQ Tonal Balance Curve */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-indigo-600" />
                          <h5 className="font-bold text-slate-800 text-xs">
                            Deterministic 6-Band Tonal EQ Balance
                          </h5>
                        </div>
                        <span className="text-[10px] text-slate-400">Relative Octave Power (dB)</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {[
                          { label: 'Sub-Bass', freq: '20-60Hz', db: activeTrack.distroReport.subBassDb },
                          { label: 'Bass', freq: '60-250Hz', db: activeTrack.distroReport.bassDb },
                          { label: 'Low-Mids', freq: '250-500Hz', db: activeTrack.distroReport.lowMidsDb },
                          { label: 'Mids', freq: '500-2kHz', db: activeTrack.distroReport.midsDb },
                          { label: 'High-Mids', freq: '2k-6kHz', db: activeTrack.distroReport.highMidsDb },
                          { label: 'Highs/Air', freq: '6k-20kHz', db: activeTrack.distroReport.highsDb },
                        ].map((b, i) => (
                          <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center space-y-1">
                            <span className="text-[10px] font-bold text-slate-600 block">{b.label}</span>
                            <span className="text-[9px] text-slate-400 block">{b.freq}</span>
                            <div className="text-xs font-bold font-mono text-slate-800">
                              {b.db} dB
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* EQ Warning Flags */}
                      {activeTrack.distroReport.eqWarnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {activeTrack.distroReport.eqWarnings.map((w, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Vocal Presence & Stereo Width */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Vocal Presence */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                          <Mic className="w-4 h-4 text-indigo-600" />
                          <h5 className="font-bold text-slate-800 text-xs">Vocal Presence Index</h5>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">Center Channel (1k-4kHz):</span>
                          <span className="font-bold text-slate-800 font-mono">{activeTrack.distroReport.vocalEnergyRatio}%</span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${activeTrack.distroReport.vocalEnergyRatio}%` }}
                          />
                        </div>

                        <span className="text-[11px] text-slate-600 font-semibold block">
                          Status: {activeTrack.distroReport.vocalPresenceStatus}
                        </span>
                      </div>

                      {/* Stereo Width */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                          <BarChart2 className="w-4 h-4 text-indigo-600" />
                          <h5 className="font-bold text-slate-800 text-xs">Stereo Width & Correlation</h5>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">Side / Mid Power Ratio:</span>
                          <span className="font-bold text-slate-800 font-mono">{activeTrack.distroReport.stereoWidthPercent}%</span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, activeTrack.distroReport.stereoWidthPercent)}%` }}
                          />
                        </div>

                        <span className="text-[11px] text-slate-600 font-semibold block">
                          Status: {activeTrack.distroReport.stereoStatus}
                        </span>
                      </div>

                    </div>

                    {/* Section 4: Self-Distribution Audit Checklist */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                        <Info className="w-4 h-4 text-indigo-600" />
                        <h5 className="font-bold text-slate-800 text-xs">
                          DistroKid / TuneCore Readiness Checklist
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-2">
                          {activeTrack.distroReport.auditChecklist.titleClean ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>ID3 Title Clean & Standard</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {activeTrack.distroReport.auditChecklist.hasCoverArt ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>Embedded Cover Art Present</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {activeTrack.distroReport.auditChecklist.noAiArtifacts ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>No Suno / AI Headers</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {activeTrack.distroReport.auditChecklist.peakHeadroomOk ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>Safe Peak Headroom (&lt; -0.5 dBFS)</span>
                        </div>
                      </div>

                      {activeTrack.distroReport.auditChecklist.details.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 text-xs space-y-1">
                          <span className="font-bold block text-slate-800">Action Items:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {activeTrack.distroReport.auditChecklist.details.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                    <BarChart2 className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <h5 className="font-bold text-slate-700 text-sm">No Distribution Audit Performed Yet</h5>
                      <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                        Click "Run DSP Audit" to evaluate LUFS loudness, 6-band EQ balance, peak headroom, and vocal presence.
                      </p>
                    </div>
                    <button
                      onClick={() => handleRunSingleAudit(activeTrack)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-xs"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Audit "{activeTrack.title}" Now</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-4 my-auto">
                <ShieldCheck className="w-12 h-12 text-indigo-500 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">No Audio Tracks Loaded Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Import your MP3 files or load our demo album to perform LUFS loudness metering, 6-band EQ analysis, and streaming platform audit checks.
                  </p>
                </div>
                {onLoadSamples && (
                  <button
                    onClick={() => {
                      onLoadSamples();
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Load Demo Album to Audit</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>DistroPrep Studio • Deterministic DSP & Acoustics Engine</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
