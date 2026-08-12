# DistroPrep Studio

DistroPrep Studio is a browser-based audio file preparation and metadata management utility designed for independent music artists and audio engineers preparing tracks for digital distribution services (such as DistroKid, TuneCore, Apple Music, and Spotify).

All processing is executed client-side using Web Audio and Web Assembly APIs. No audio files or private credentials are sent to external servers.

---

## Features

### Metadata and ID3 Management
- **Bulk Metadata Editing**: Update artist, album, album artist, genre, release year, and comment tags across multiple tracks simultaneously.
- **AI Tag Scrubbing**: Detect and strip generation artifacts, style prompt brackets (e.g., `[Upbeat Pop 120bpm]`), model tags, and UUIDs inserted into ID3 frames by AI audio generators.
- **Title Formatting**: Auto-sequence track numbers (`01`, `02`, ...), apply Title Case formatting, and strip leading track numbers from filenames.
- **Find and Replace**: Perform string or regex replacements across track titles, artists, albums, and embedded lyrics.
- **Lyrics Management**: Read, edit, and strip AI prompt directives from unsynchronized lyrics (`USLT`) frames.

### Artwork Processing
- **Cover Art Embedding**: Batch embed 1:1 square cover art images directly into ID3v2.3 tags.
- **Aspect Ratio Correction**: Center-crop non-square images to 1:1 aspect ratio.
- **Dimension Resizing**: Standardize cover art dimensions to platform specifications (500x500, 800x800, 1000x1000, 3000x3000).

### Distribution and Audio Quality Audit
- **Loudness Metering**: Integrated LUFS measurement according to ITU BS.1770 / EBU R128 standards.
- **Peak Headroom Detection**: Peak dBFS measurement to identify potential inter-sample clipping before encoding.
- **Tonal EQ Balance**: 6-band spectrum energy calculation (Sub-bass, Bass, Low-mids, Mids, High-mids, Highs).
- **Vocal Presence Index**: Mid/Side matrix separation in the 1-4 kHz range to assess lead vocal balance.
- **Stereo Width & Correlation**: Side-to-Mid power ratio and phase coherence checks.
- **Readiness Scoring**: Automated checklist for title cleanliness, cover art resolution, absence of AI metadata, and streaming platform loudness targets.

### Spectral Analysis
- **FFT Visualizer**: Interactive Fast Fourier Transform spectrum viewer with peak frequency identification, band power distribution, and spectral centroid calculations.

### Export
- **Zip Archive Export**: Re-encodes cleaned ID3v2.3 tags into MP3 files and bundles them into a downloadable `.zip` package.

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/distroprep-studio.git
   cd distroprep-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## Usage Guide

1. **Import Audio Files**: Drag and drop MP3 files into the upload area or select a folder. Alternatively, click **Load Demo Album** to test with built-in sample tracks.
2. **Review Metadata & AI Artifacts**: If AI generator tags or bracketed prompts are detected, click **Clean All Suno Tags** to purge unwanted frames.
3. **Batch Edit Tags**: Use the bulk editor bar to apply consistent album metadata, set track numbers, or update cover art across selected files.
4. **Run Distribution Audit**: Click **Distro Audit** to review LUFS integrated loudness, peak headroom, 6-band EQ balance, and platform submission readiness.
5. **Export Cleaned Files**: Specify a ZIP filename in the export section and click **Download Cleaned Album (.zip)**.

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Audio & Metadata Engine**: `music-metadata-browser`, `browser-id3-writer`, Web Audio API
- **Archive Generation**: `jszip`, `file-saver`
- **Icons**: Lucide React

---

## Privacy and Data Security

All file operations run entirely in memory within your browser environment. Audio content and metadata are not uploaded to or stored on any remote server.

---

## License

MIT License. See `LICENSE` for details.
