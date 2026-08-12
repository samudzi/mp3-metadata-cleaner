import * as musicMetadata from 'music-metadata-browser';
import { ID3Writer } from 'browser-id3-writer';
import { Mp3Track } from '../types';
import { detectSunoMetadata } from './sunoCleaner';
import { blobToDataUrl } from './imageUtils';

/**
 * Parses an MP3 file and extracts all metadata, audio info, cover art, and Suno AI flags.
 */
export async function parseMp3File(file: File): Promise<Mp3Track> {
  const id = 'track-' + Math.random().toString(36).substring(2, 11);

  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = '';
  let album = '';
  let albumArtist = '';
  let genre = '';
  let year = '';
  let trackNumber = '';
  let comment = '';
  let lyrics = '';
  let duration = 0;
  let bitrate = 0;
  let sampleRate = 0;
  let coverArt: Mp3Track['coverArt'] = undefined;

  try {
    const metadata = await musicMetadata.parseBlob(file);

    if (metadata.common) {
      const c = metadata.common;
      if (c.title) title = c.title;
      if (c.artist) artist = c.artist;
      if (c.album) album = c.album;
      if (c.albumartist) albumArtist = c.albumartist;
      if (c.genre && c.genre.length > 0) genre = c.genre.join(', ');
      if (c.year) year = String(c.year);

      if (c.track && c.track.no) {
        trackNumber = String(c.track.no);
      }

      if (c.comment && c.comment.length > 0) {
        comment = c.comment.join('; ');
      }

      if (c.lyrics && c.lyrics.length > 0) {
        lyrics = typeof c.lyrics[0] === 'string' ? c.lyrics[0] : (c.lyrics[0] as any).text || '';
      }

      // Check embedded picture (APIC)
      if (c.picture && c.picture.length > 0) {
        const pic = c.picture[0];
        const blob = new Blob([pic.data], { type: pic.format });
        const dataUrl = await blobToDataUrl(blob);
        const buffer = pic.data.buffer.slice(
          pic.data.byteOffset,
          pic.data.byteOffset + pic.data.byteLength
        );

        coverArt = {
          dataUrl,
          mimeType: pic.format,
          buffer,
        };
      }
    }

    if (metadata.format) {
      duration = metadata.format.duration || 0;
      bitrate = metadata.format.bitrate ? Math.round(metadata.format.bitrate / 1000) : 0;
      sampleRate = metadata.format.sampleRate || 0;
    }
  } catch (err) {
    console.warn('Could not fully parse metadata for', file.name, err);
  }

  // Detect Suno / AI generated flags
  const sunoReport = detectSunoMetadata({
    title,
    artist,
    album,
    comment,
    lyrics,
  });

  return {
    id,
    file,
    originalFileName: file.name,
    size: file.size,
    duration,
    bitrate,
    sampleRate,
    title,
    artist,
    album,
    albumArtist,
    genre,
    year,
    trackNumber,
    comment,
    lyrics,
    coverArt,
    sunoDetected: sunoReport,
    isCleaned: false,
    isSelected: true,
  };
}

/**
 * Writes fresh ID3v2.3 tags to an MP3 file ArrayBuffer and produces a clean Blob/File.
 */
export async function writeMp3Metadata(track: Mp3Track): Promise<{ blob: Blob; file: File }> {
  const arrayBuffer = await track.file.arrayBuffer();
  const writer = new ID3Writer(arrayBuffer);

  // Set standard ID3v2.3 frames
  const w = writer as any;

  if (track.title) {
    w.setFrame('TIT2', track.title);
  }

  if (track.artist) {
    w.setFrame('TPE1', [track.artist]);
  }

  if (track.albumArtist) {
    w.setFrame('TPE2', [track.albumArtist]);
  }

  if (track.album) {
    w.setFrame('TALB', track.album);
  }

  if (track.year) {
    const yearNum = parseInt(track.year, 10);
    if (!isNaN(yearNum)) {
      w.setFrame('TYER', yearNum);
    }
  }

  if (track.genre) {
    w.setFrame('TCON', [track.genre]);
  }

  if (track.trackNumber) {
    w.setFrame('TRCK', track.trackNumber);
  }

  if (track.comment) {
    w.setFrame('COMM', {
      description: '',
      text: track.comment,
      language: 'eng',
    });
  }

  if (track.lyrics) {
    w.setFrame('USLT', {
      description: '',
      lyrics: track.lyrics,
      language: 'eng',
    });
  }

  // Attach Cover Art
  if (track.coverArt && track.coverArt.buffer && track.coverArt.buffer.byteLength > 0) {
    w.setFrame('APIC', {
      type: 3, // 3 = Cover (front)
      data: track.coverArt.buffer,
      description: 'Cover',
      mimeType: track.coverArt.mimeType || 'image/jpeg',
    });
  }

  writer.addTag();

  const blob = writer.getBlob();
  // Form target cleaned filename e.g. "01 - Title.mp3" or "Title.mp3"
  let cleanFileName = track.originalFileName;
  if (track.title) {
    const ext = track.originalFileName.split('.').pop() || 'mp3';
    const sanitizeStr = (s: string) => s.replace(/[/\\?%*:|"<>]/g, '').trim();
    if (track.trackNumber && track.title) {
      const padTrack = track.trackNumber.padStart(2, '0');
      cleanFileName = `${padTrack} - ${sanitizeStr(track.title)}.${ext}`;
    } else if (track.title) {
      cleanFileName = `${sanitizeStr(track.title)}.${ext}`;
    }
  }

  const cleanedFile = new File([blob], cleanFileName, { type: 'audio/mpeg' });

  return {
    blob,
    file: cleanedFile,
  };
}
