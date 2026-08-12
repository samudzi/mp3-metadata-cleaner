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

  // State
  isCleaned: boolean;
  isSelected: boolean;
  audioUrl?: string;
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
