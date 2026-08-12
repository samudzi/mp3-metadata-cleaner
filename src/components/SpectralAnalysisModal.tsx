import React, { useState } from 'react';
import { Activity, X, CheckCircle2, AlertTriangle, Cpu, BarChart3, RefreshCw, Zap } from 'lucide-react';
import { Mp3Track } from '../types';
import { analyzeAudioSpectrum } from '../utils/spectralAnalyzer';

interface SpectralAnalysisModalProps {
  tracks: Mp3Track[];
  onUpdateTrack: (trackId: string, updates: Partial<Mp3Track>) => void;
  onClose: () => void;
}

export const SpectralAnalysisModal: React.FC<SpectralAnalysisModalProps> = ({
  tracks,
  onUpdateTrack,
  onClose,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const activeTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0];

  const handleRunSingleAnalysis = async (track: Mp3Track) => {
    setIsAnalyzing(true);
    setProgressMsg(`Analyzing PCM audio for "${track.title}"...`);

    try {
      const report = await analyzeAudioSpectrum(track.file);
      onUpdateTrack(track.id, { spectralReport: report });
    } catch (err) {
      console.error('Spectral analysis failed:', err);
      alert('Spectral analysis failed: ' + (err as Error).message);
    } finally {
      setIsAnalyzing(false);
      setProgressMsg('');
    }
  };

  const handleRunAllBatchAnalysis = async () => {
    setIsAnalyzing(true);
    let count = 0;

    for (const track of tracks) {
      count++;
      setProgressMsg(`Analyzing track ${count} of ${tracks.length}: "${track.title}"...`);
      try {
        const report = await analyzeAudioSpectrum(track.file);
        onUpdateTrack(track.id, { spectralReport: report });
      } catch (err) {
        console.warn('Skipping track due to analysis error', track.title, err);
      }
    }

    setIsAnalyzing(false);
    setProgressMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col my-8 text-slate-800 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-800">
                  Deterministic Mechanical Spectral Analyzer
                </h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Pure Math / FFT
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detects neural bandwidth brickwalls, sub-bass DC rumble, and vocoder phase noise without AI models
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

        {/* Action Bar */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Analysis Engine:</span>
            <span className="text-slate-500">Fast Fourier Transform (FFT) & Signal Processing</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunAllBatchAnalysis}
              disabled={isAnalyzing || tracks.length === 0}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Analyze All {tracks.length} Tracks</span>
            </button>
          </div>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Sidebar: Track Selector */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto space-y-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Imported Tracks ({tracks.length})
            </span>

            {tracks.map((t, idx) => {
              const rep = t.spectralReport;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                    activeTrack?.id === t.id
                      ? 'border-indigo-600 bg-white font-bold text-slate-800 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="truncate">
                    <div className="truncate font-medium">{idx + 1}. {t.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {rep ? `${rep.cutoffFrequencyHz} Hz • ${rep.confidenceScore}% AI Sig` : 'Not analyzed'}
                    </div>
                  </div>

                  {rep ? (
                    rep.isAIGeneratedSignature ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    )
                  ) : (
                    <BarChart3 className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Main Content: Track Spectral Detail */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
            {activeTrack ? (
              <div className="space-y-6">
                
                {/* Track Title Header & Analysis Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{activeTrack.title}</h4>
                    <p className="text-slate-500">
                      {activeTrack.artist || 'Unknown Artist'} • {activeTrack.sampleRate || 44100} Hz Audio • {(activeTrack.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    onClick={() => handleRunSingleAnalysis(activeTrack)}
                    disabled={isAnalyzing}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>{activeTrack.spectralReport ? 'Re-Analyze Spectrum' : 'Run Spectral Analysis'}</span>
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-center font-medium flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>{progressMsg || 'Processing audio spectrum with Fast Fourier Transform...'}</span>
                  </div>
                )}

                {/* Spectral Report Details */}
                {activeTrack.spectralReport ? (
                  <div className="space-y-6">
                    
                    {/* Verdict Card */}
                    <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                      activeTrack.spectralReport.isAIGeneratedSignature
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-green-50 border-green-200 text-green-900'
                    }`}>
                      {activeTrack.spectralReport.isAIGeneratedSignature ? (
                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="font-bold text-sm">
                          {activeTrack.spectralReport.isAIGeneratedSignature
                            ? `Deterministic AI Signature Detected (${activeTrack.spectralReport.confidenceScore}% Confidence)`
                            : `Natural Master Acoustic Profile (${activeTrack.spectralReport.confidenceScore}% AI Confidence)`}
                        </div>
                        <p className="text-xs opacity-90 leading-relaxed">
                          {activeTrack.spectralReport.isAIGeneratedSignature
                            ? 'Mathematical Fourier analysis identified acoustic artifacts (such as neural bandwidth brickwalls or sub-bass DC offset) characteristic of generative audio models.'
                            : 'Spectral energy distribution shows smooth high-frequency response and natural acoustic balance.'}
                        </p>
                      </div>
                    </div>

                    {/* Spectral Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      
                      {/* Metric 1: Cutoff Frequency */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-semibold block text-[11px]">
                          High-Freq Cutoff (Hz)
                        </span>
                        <div className="text-base font-bold text-slate-800 font-mono">
                          {activeTrack.spectralReport.cutoffFrequencyHz.toLocaleString()} Hz
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {activeTrack.spectralReport.cutoffFrequencyHz <= 16500
                            ? '⚠️ Unnatural Brickwall Ceiling'
                            : '✓ Normal >18kHz Spectrum'}
                        </div>
                      </div>

                      {/* Metric 2: High Band Energy */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-semibold block text-[11px]">
                          Upper Band Energy (&gt;16kHz)
                        </span>
                        <div className="text-base font-bold text-slate-800 font-mono">
                          {activeTrack.spectralReport.highBandEnergyDb} dB
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {activeTrack.spectralReport.highBandEnergyDb < -42
                            ? '⚠️ High-Frequency Void'
                            : '✓ Natural Upper Harmonics'}
                        </div>
                      </div>

                      {/* Metric 3: Sub-Bass DC Rumble */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-semibold block text-[11px]">
                          Sub-Bass DC Offset (&lt;20Hz)
                        </span>
                        <div className="text-base font-bold text-slate-800 font-mono">
                          {activeTrack.spectralReport.subBassRumbleEnergyDb} dB
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {activeTrack.spectralReport.subBassRumbleEnergyDb > -6
                            ? '⚠️ Unfiltered DC Rumble'
                            : '✓ Filtered Low End'}
                        </div>
                      </div>

                      {/* Metric 4: Spectral Flatness */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-500 font-semibold block text-[11px]">
                          Spectral Flatness (8-16kHz)
                        </span>
                        <div className="text-base font-bold text-slate-800 font-mono">
                          {activeTrack.spectralReport.spectralFlatness}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Wiener Entropy Ratio
                        </div>
                      </div>

                    </div>

                    {/* Detected Mechanical Signatures List */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 block">
                        Deterministic Spectral Flag List ({activeTrack.spectralReport.detectedSpectralSignatures.length}):
                      </span>

                      {activeTrack.spectralReport.detectedSpectralSignatures.length > 0 ? (
                        <ul className="space-y-2">
                          {activeTrack.spectralReport.detectedSpectralSignatures.map((sig, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-slate-700 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="font-medium">{sig}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          <span>No unnatural spectral brickwalls or neural vocoder noise detected.</span>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                    <BarChart3 className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <h5 className="font-bold text-slate-700 text-sm">No Spectral Analysis Performed Yet</h5>
                      <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                        Click "Run Spectral Analysis" to compute the PCM Fourier transform and inspect frequency cutoff points.
                      </p>
                    </div>
                    <button
                      onClick={() => handleRunSingleAnalysis(activeTrack)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-xs"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Analyze "{activeTrack.title}" Now</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">Select a track from the sidebar to inspect.</div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Deterministic Analysis • Web Audio API PCM Fourier Transform</div>
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
