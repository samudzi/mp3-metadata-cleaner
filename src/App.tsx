import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Mp3Track, BulkMetadataConfig, SunoCleanOptions, BatchFindReplace } from './types';
import { parseMp3File, writeMp3Metadata } from './utils/id3Handler';
import { generateSampleSunoAlbum } from './utils/SampleAudioGenerator';
import {
  cleanTitle,
  cleanArtist,
  cleanAlbum,
  cleanLyrics,
  toTitleCase,
  detectSunoMetadata
} from './utils/sunoCleaner';

import { Header } from './components/Header';
import { SunoDetectionBanner } from './components/SunoDetectionBanner';
import { FileUploader } from './components/FileUploader';
import { BulkEditorBar } from './components/BulkEditorBar';
import { TrackTable } from './components/TrackTable';
import { CoverArtProcessor } from './components/CoverArtProcessor';
import { LyricsEditorModal } from './components/LyricsEditorModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { AudioPreviewPlayer } from './components/AudioPreviewPlayer';
import { ExportPanel } from './components/ExportPanel';

export default function App() {
  const [tracks, setTracks] = useState<Mp3Track[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);

  // Modals & Panels
  const [isCoverArtOpen, setIsCoverArtOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [lyricsModal, setLyricsModal] = useState<{ isOpen: boolean; track: Mp3Track | null }>({
    isOpen: false,
    track: null,
  });

  // Active audio player
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Mp3Track | null>(null);

  // Suno Clean Options
  const [sunoOptions, setSunoOptions] = useState<SunoCleanOptions>({
    stripTitleBracketedTags: true,
    stripSunoArtist: true,
    stripSunoAlbum: true,
    clearComments: true,
    clearUserTextFrames: true,
    cleanLyricsPromptTags: true,
    removeLeadingTrackNumbers: false,
    autoTitleCase: true,
  });

  // Calculate statistics
  const sunoTracksCount = tracks.filter(t => t.sunoDetected.isSuno).length;
  const selectedTracks = tracks.filter(t => t.isSelected);

  // Handlers for File Loading
  const handleFilesSelected = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const fileArray = Array.from(files);

    try {
      const parsedResults = await Promise.all(
        fileArray.map(f => parseMp3File(f))
      );

      setTracks(prev => [...prev, ...parsedResults]);
    } catch (err) {
      console.error('Error parsing MP3 files:', err);
      alert('Failed to parse some MP3 files. Make sure they are valid MP3 audio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSamples = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const sampleTracks = generateSampleSunoAlbum();
      setTracks(sampleTracks);
      setIsProcessing(false);
    }, 300);
  };

  const handleClearAll = () => {
    if (confirm('Clear all imported MP3 tracks?')) {
      setTracks([]);
      setCurrentPlayingTrack(null);
    }
  };

  // Suno Scrubbing Handler
  const handlePurgeSuno = () => {
    setTracks(prev =>
      prev.map(track => {
        if (!track.isSelected) return track;

        const newTitle = cleanTitle(track.title, sunoOptions);
        const newArtist = cleanArtist(track.artist, sunoOptions);
        const newAlbum = cleanAlbum(track.album, sunoOptions);
        const newComments = sunoOptions.clearComments ? '' : track.comment;
        const newLyrics = cleanLyrics(track.lyrics || '', sunoOptions);

        return {
          ...track,
          title: newTitle,
          artist: newArtist,
          album: newAlbum,
          comment: newComments,
          lyrics: newLyrics,
          sunoDetected: { isSuno: false, reasons: [] },
          isCleaned: true,
        };
      })
    );
  };

  // Bulk Metadata Apply
  const handleApplyBulkMetadata = (config: BulkMetadataConfig) => {
    setTracks(prev =>
      prev.map(track => {
        if (!track.isSelected) return track;

        return {
          ...track,
          artist: config.applyArtist ? config.artist : track.artist,
          album: config.applyAlbum ? config.album : track.album,
          albumArtist: config.applyAlbumArtist ? config.albumArtist : track.albumArtist,
          genre: config.applyGenre ? config.genre : track.genre,
          year: config.applyYear ? config.year : track.year,
          comment: config.applyComment ? config.comment : track.comment,
        };
      })
    );
  };

  // Quick Action Helpers
  const handleAutoSequenceTracks = (padWithZero: boolean) => {
    setTracks(prev => {
      let counter = 1;
      return prev.map(t => {
        if (!t.isSelected) return t;
        const numStr = padWithZero
          ? String(counter).padStart(2, '0')
          : String(counter);
        counter++;
        return { ...t, trackNumber: numStr };
      });
    });
  };

  const handleTitleCaseTitles = () => {
    setTracks(prev =>
      prev.map(t => (t.isSelected ? { ...t, title: toTitleCase(t.title) } : t))
    );
  };

  const handleStripLeadingNumbers = () => {
    setTracks(prev =>
      prev.map(t => {
        if (!t.isSelected) return t;
        const stripped = t.title.replace(/^(\d{1,3}[\s.\-_]+)+/g, '').trim();
        return { ...t, title: stripped || t.title };
      })
    );
  };

  // Cover Art Processing
  const handleApplyCoverArt = (coverArt: Mp3Track['coverArt'], targetTracks: Mp3Track[]) => {
    const targetIds = new Set(targetTracks.map(t => t.id));
    setTracks(prev =>
      prev.map(t => (targetIds.has(t.id) ? { ...t, coverArt } : t))
    );
  };

  const handleRemoveCoverArt = (targetTracks: Mp3Track[]) => {
    const targetIds = new Set(targetTracks.map(t => t.id));
    setTracks(prev =>
      prev.map(t => (targetIds.has(t.id) ? { ...t, coverArt: undefined } : t))
    );
  };

  // Find & Replace
  const handleExecuteFindReplace = (config: BatchFindReplace) => {
    setTracks(prev =>
      prev.map(track => {
        if (!track.isSelected) return track;

        let flags = 'g';
        if (!config.matchCase) flags += 'i';

        let regex: RegExp;
        try {
          regex = config.useRegex
            ? new RegExp(config.find, flags)
            : new RegExp(config.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        } catch (e) {
          alert('Invalid regex expression provided.');
          return track;
        }

        const replaceField = (val: string = '') => val.replace(regex, config.replace);

        return {
          ...track,
          title: config.applyTo === 'title' || config.applyTo === 'all' ? replaceField(track.title) : track.title,
          artist: config.applyTo === 'artist' || config.applyTo === 'all' ? replaceField(track.artist) : track.artist,
          album: config.applyTo === 'album' || config.applyTo === 'all' ? replaceField(track.album) : track.album,
          genre: config.applyTo === 'genre' || config.applyTo === 'all' ? replaceField(track.genre) : track.genre,
          lyrics: config.applyTo === 'lyrics' || config.applyTo === 'all' ? replaceField(track.lyrics || '') : track.lyrics,
        };
      })
    );
  };

  // Track Table Actions
  const handleUpdateTrack = (id: string, updates: Partial<Mp3Track>) => {
    setTracks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        // Recalculate Suno status if title/artist/comment changed
        const sunoReport = detectSunoMetadata({
          title: updated.title,
          artist: updated.artist,
          album: updated.album,
          comment: updated.comment,
          lyrics: updated.lyrics,
        });
        updated.sunoDetected = sunoReport;
        return updated;
      })
    );
  };

  const handleDeleteTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
    if (currentPlayingTrack?.id === id) {
      setCurrentPlayingTrack(null);
    }
  };

  const handleToggleSelectTrack = (id: string) => {
    setTracks(prev =>
      prev.map(t => (t.id === id ? { ...t, isSelected: !t.isSelected } : t))
    );
  };

  const handleToggleSelectAll = (selected: boolean) => {
    setTracks(prev => prev.map(t => ({ ...t, isSelected: selected })));
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    const newTracks = [...tracks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newTracks.length) return;

    const temp = newTracks[index];
    newTracks[index] = newTracks[targetIdx];
    newTracks[targetIdx] = temp;

    setTracks(newTracks);
  };

  const handleTogglePlay = (track: Mp3Track) => {
    if (currentPlayingTrack?.id === track.id) {
      setCurrentPlayingTrack(null);
    } else {
      setCurrentPlayingTrack(track);
    }
  };

  // Single Track Export
  const handleExportSingle = async (track: Mp3Track) => {
    try {
      const { blob, file } = await writeMp3Metadata(track);
      saveAs(blob, file.name);
    } catch (err) {
      console.error('Failed to export single MP3:', err);
      alert('Could not export MP3 file.');
    }
  };

  // Zip Album Export
  const handleExportZip = async (zipName: string) => {
    if (selectedTracks.length === 0) return;

    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedTracks.length, currentFileName: '' });

    try {
      const zip = new JSZip();

      for (let i = 0; i < selectedTracks.length; i++) {
        const track = selectedTracks[i];
        setExportProgress({
          current: i + 1,
          total: selectedTracks.length,
          currentFileName: track.title || track.originalFileName,
        });

        const { blob, file } = await writeMp3Metadata(track);
        zip.file(file.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const sanitizeName = zipName.replace(/[/\\?%*:|"<>]/g, '').trim();
      saveAs(zipBlob, `${sanitizeName || 'Cleaned_Album'}.zip`);
    } catch (err) {
      console.error('Export zip failed:', err);
      alert('Failed to pack zip file.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-24">
      
      {/* App Header */}
      <Header
        tracks={tracks}
        sunoCount={sunoTracksCount}
        onLoadSamples={handleLoadSamples}
        onPurgeSuno={handlePurgeSuno}
        onExportZip={() => handleExportZip('Cleaned_MP3_Album')}
        onClearAll={handleClearAll}
        isProcessing={isProcessing}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Suno AI Warning & Scrubbing Banner */}
        <SunoDetectionBanner
          tracks={tracks}
          sunoOptions={sunoOptions}
          onUpdateSunoOptions={setSunoOptions}
          onPurgeSuno={handlePurgeSuno}
        />

        {/* File Drag & Drop Zone */}
        <FileUploader
          onFilesSelected={handleFilesSelected}
          onLoadSamples={handleLoadSamples}
          isProcessing={isProcessing}
          hasTracks={tracks.length > 0}
        />

        {tracks.length > 0 && (
          <>
            {/* Bulk Editor Bar */}
            <BulkEditorBar
              tracks={tracks}
              selectedTracksCount={selectedTracks.length}
              onApplyBulkMetadata={handleApplyBulkMetadata}
              onOpenCoverArtProcessor={() => setIsCoverArtOpen(true)}
              onAutoSequenceTracks={handleAutoSequenceTracks}
              onTitleCaseTitles={handleTitleCaseTitles}
              onStripLeadingNumbers={handleStripLeadingNumbers}
              onOpenFindReplace={() => setIsFindReplaceOpen(true)}
              onOpenLyricsEditor={() =>
                setLyricsModal({ isOpen: true, track: selectedTracks[0] || tracks[0] })
              }
            />

            {/* Interactive Track Grid */}
            <TrackTable
              tracks={tracks}
              currentPlayingId={currentPlayingTrack?.id || null}
              onTogglePlay={handleTogglePlay}
              onUpdateTrack={handleUpdateTrack}
              onDeleteTrack={handleDeleteTrack}
              onToggleSelectTrack={handleToggleSelectTrack}
              onToggleSelectAll={handleToggleSelectAll}
              onMoveTrack={handleMoveTrack}
              onOpenLyricsModal={track => setLyricsModal({ isOpen: true, track })}
              onExportSingle={handleExportSingle}
            />

            {/* Batch Zip Export Panel */}
            <ExportPanel
              tracks={tracks}
              isExporting={isExporting}
              exportProgress={exportProgress}
              onExportZip={handleExportZip}
            />
          </>
        )}
      </main>

      {/* Cover Art Processor Modal */}
      <CoverArtProcessor
        tracks={tracks}
        isOpen={isCoverArtOpen}
        onClose={() => setIsCoverArtOpen(false)}
        onApplyCoverArt={handleApplyCoverArt}
        onRemoveCoverArt={handleRemoveCoverArt}
      />

      {/* Lyrics Editor Modal */}
      <LyricsEditorModal
        track={lyricsModal.track}
        selectedTracks={selectedTracks}
        isOpen={lyricsModal.isOpen}
        onClose={() => setLyricsModal({ isOpen: false, track: null })}
        onSaveTrackLyrics={(id, lyrics) => handleUpdateTrack(id, { lyrics })}
        onBatchCleanLyrics={({ stripPromptTags, clearAll }) => {
          setTracks(prev =>
            prev.map(t => {
              if (!t.isSelected) return t;
              if (clearAll) return { ...t, lyrics: '' };
              if (stripPromptTags) {
                return { ...t, lyrics: cleanLyrics(t.lyrics || '', sunoOptions) };
              }
              return t;
            })
          );
        }}
      />

      {/* Find & Replace Modal */}
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        selectedTracks={selectedTracks}
        onExecuteFindReplace={handleExecuteFindReplace}
      />

      {/* Audio Preview Sticky Bar */}
      <AudioPreviewPlayer
        track={currentPlayingTrack}
        onClose={() => setCurrentPlayingTrack(null)}
      />

    </div>
  );
}
