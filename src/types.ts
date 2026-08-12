export interface Mp3Track {
  id: string;
  file: File;
  originalFileName: string;
  size: number;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  
  // ID3 Metadata
  title: string;
  artist: string;
  album: string;
  albumArtist?: string;
  genre: string;
  year: string; // or number
  trackNumber: string; // e.g. "1" or "01" or "1/12"
  totalTracks?: string;
  comment?: string;
  lyrics?: string;
  
  // Artwork
  coverArt?: {
    dataUrl: string;
    mimeType: string;
    buffer: ArrayBuffer;
    width?: number;
    height?: number;
  };
  
  // Suno & AI Detection flags
  sunoDetected: {
    isSuno: boolean;
    reasons: string[]; // e.g. ["Suno ID in comment", "Style tags in title", "Suno in artist"]
  };

  // Deterministic Spectral Analysis
  spectralReport?: {
    analyzed: boolean;
    cutoffFrequencyHz: number;
    highBandEnergyDb: number;
    subBassRumbleEnergyDb: number;
    spectralFlatness: number;
    phaseCorrelation: number;
    isAIGeneratedSignature: boolean;
    confidenceScore: number;
    detectedSpectralSignatures: string[];
  };

  // Deterministic Mix, EQ & Distribution Readiness Analysis
  distroReport?: DistroReadinessReport;

  // State
  isCleaned: boolean;
  isSelected: boolean;
  audioUrl?: string;
}

export interface DistroReadinessReport {
  analyzed: boolean;
  
  // Loudness & Peak Dynamics (EBU R128 / ITU BS.1770)
  integratedLufs: number; // e.g. -14 LUFS target
  peakDbfs: number; // e.g. -1.0 dBFS true peak ceiling
  dynamicRangeDb: number; // Crest Factor (Peak - RMS)
  loudnessRating: 'Optimal for Streaming (-14 LUFS)' | 'Loud / Club Master (-8 to -11 LUFS)' | 'Too Quiet (>-18 LUFS)' | 'Over-Compressed / Clipping';
  
  // EQ & Tonal Balance (6 Octave Bands)
  subBassDb: number; // 20-60 Hz
  bassDb: number; // 60-250 Hz
  lowMidsDb: number; // 250-500 Hz
  midsDb: number; // 500-2kHz
  highMidsDb: number; // 2k-6kHz
  highsDb: number; // 6k-20kHz
  eqWarnings: string[]; // e.g. ["Low-Mid Mud (+4.2dB)", "Lacks Air (-6dB)"]

  // Vocal Presence & Stereo Width
  vocalEnergyRatio: number; // 0 - 100% center channel vocal presence
  vocalPresenceStatus: 'Strong Lead Vocal' | 'Moderate Vocal' | 'Instrumental / Recessed Vocal';
  stereoWidthPercent: number; // 0% (Mono) to 100% (Balanced) to 150%+ (Ultra-wide)
  stereoStatus: 'Mono' | 'Focused Stereo' | 'Wide Stereo' | 'Potential Phase Issue';

  // Overall Distro Readiness Audit
  distroScore: number; // 0 - 100%
  distroStatus: 'Ready for Distribution' | 'Minor Master Tweaks Suggested' | 'Action Required Before Upload';
  auditChecklist: {
    titleClean: boolean;
    hasCoverArt: boolean;
    coverArtResolutionOk: boolean;
    noAiArtifacts: boolean;
    loudnessCompliant: boolean;
    peakHeadroomOk: boolean;
    details: string[];
  };
}

export interface BulkMetadataConfig {
  artist: string;
  album: string;
  albumArtist: string;
  genre: string;
  year: string;
  totalTracks: string;
  comment: string;
  applyArtist: boolean;
  applyAlbum: boolean;
  applyAlbumArtist: boolean;
  applyGenre: boolean;
  applyYear: boolean;
  applyTotalTracks: boolean;
  applyComment: boolean;
}

export interface CoverArtConfig {
  dataUrl?: string;
  mimeType?: string;
  buffer?: ArrayBuffer;
  fileName?: string;
  width?: number;
  height?: number;
  targetSize: 'original' | '500x500' | '800x800' | '1000x1000';
  quality: number; // 0.1 to 1.0
}

export interface SunoCleanOptions {
  stripTitleBracketedTags: boolean; // e.g., "Song [Upbeat Pop]" -> "Song"
  stripSunoArtist: boolean; // e.g., if artist is "Suno AI" or "Suno v3.5", reset or clear
  stripSunoAlbum: boolean; // e.g., if album is "Suno AI", clear or set to custom
  clearComments: boolean; // clears AI prompts, seed, parameters
  clearUserTextFrames: boolean; // clears TXXX Suno metadata
  cleanLyricsPromptTags: boolean; // strips [Verse], [Chorus], [Style:...] or suno directives from lyrics
  removeLeadingTrackNumbers: boolean; // e.g. "01 - Song" -> "Song"
  autoTitleCase: boolean;
}

export interface BatchFindReplace {
  find: string;
  replace: string;
  useRegex: boolean;
  matchCase: boolean;
  applyTo: 'title' | 'artist' | 'album' | 'genre' | 'lyrics' | 'all';
}
