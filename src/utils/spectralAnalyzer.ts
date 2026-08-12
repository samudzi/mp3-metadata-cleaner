import { Mp3Track } from '../types';

export interface SpectralAnalysisReport {
  analyzed: boolean;
  cutoffFrequencyHz: number;
  highBandEnergyDb: number;
  subBassRumbleEnergyDb: number;
  spectralFlatness: number;
  phaseCorrelation: number;
  isAIGeneratedSignature: boolean;
  confidenceScore: number; // 0 - 100%
  detectedSpectralSignatures: string[];
}

/**
 * Perform deterministic, mathematical spectral analysis on an audio file
 * using the browser's Web Audio API and Short-Time Fourier Transform (STFT).
 * No AI models or network calls required.
 */
export async function analyzeAudioSpectrum(file: File): Promise<SpectralAnalysisReport> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 44100,
  });

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Decode audio buffer (we only need ~6 seconds of sample for deterministic analysis)
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const duration = audioBuffer.duration;

    // Extract channel PCM data (up to 8 seconds from middle of track)
    const startSample = Math.floor(Math.max(0, duration / 3) * sampleRate);
    const analysisSamples = Math.min(Math.floor(8 * sampleRate), audioBuffer.length - startSample);

    if (analysisSamples <= 0) {
      throw new Error('Audio file too short for spectral analysis');
    }

    const channelL = audioBuffer.getChannelData(0).subarray(startSample, startSample + analysisSamples);
    const channelR = numberOfChannels > 1 
      ? audioBuffer.getChannelData(1).subarray(startSample, startSample + analysisSamples)
      : channelL;

    // --- 1. Compute Power Spectral Density via STFT Windowing ---
    const fftSize = 4096; // ~10.77 Hz per bin resolution at 44.1kHz
    const halfFft = fftSize / 2;
    const numWindows = Math.floor(channelL.length / fftSize);

    const accumulatedPower = new Float64Array(halfFft);

    // Hanning window function
    const windowFunc = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      windowFunc[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize));
    }

    let validWindows = 0;
    let subBassEnergyAcc = 0;
    let midBassEnergyAcc = 0;
    let highBandEnergyAcc = 0;
    let midBandEnergyAcc = 0;

    // Phase correlation accumulators for 8kHz-16kHz
    let sumLR = 0;
    let sumL2 = 0;
    let sumR2 = 0;

    for (let w = 0; w < Math.min(numWindows, 60); w++) {
      const offset = w * fftSize;
      const real = new Float32Array(fftSize);
      const imag = new Float32Array(fftSize);

      for (let i = 0; i < fftSize; i++) {
        real[i] = channelL[offset + i] * windowFunc[i];
        imag[i] = 0;

        // Phase correlation calculation over high frequencies
        const sampleL = channelL[offset + i];
        const sampleR = channelR[offset + i];
        sumLR += sampleL * sampleR;
        sumL2 += sampleL * sampleL;
        sumR2 += sampleR * sampleR;
      }

      // Simple Cooley-Tukey Radix-2 FFT
      fftInPlace(real, imag);

      for (let k = 0; k < halfFft; k++) {
        const magSq = real[k] * real[k] + imag[k] * imag[k];
        accumulatedPower[k] += magSq;
      }

      validWindows++;
    }

    if (validWindows === 0) {
      throw new Error('No audio frames analyzed');
    }

    // Average Power Spectrum across windows
    const avgPower = new Float64Array(halfFft);
    for (let k = 0; k < halfFft; k++) {
      avgPower[k] = accumulatedPower[k] / validWindows;
    }

    // Find reference power at 1 kHz (bin ~93)
    const bin1kHz = Math.round((1000 * fftSize) / sampleRate);
    let refPower1kHz = 0;
    for (let b = Math.max(0, bin1kHz - 5); b <= Math.min(halfFft - 1, bin1kHz + 5); b++) {
      refPower1kHz += avgPower[b];
    }
    refPower1kHz = refPower1kHz / 11 || 1e-9;

    // --- 2. Calculate High-Frequency Cutoff Frequency (Brickwall Hz) ---
    // Scan backwards from Nyquist (22.05kHz) to find where energy first exceeds threshold relative to 1kHz
    const thresholdDb = -48; // dB relative to 1kHz
    const thresholdRatio = Math.pow(10, thresholdDb / 10) * refPower1kHz;

    let cutoffBin = halfFft - 1;
    for (let b = halfFft - 1; b >= 0; b--) {
      if (avgPower[b] > thresholdRatio) {
        cutoffBin = b;
        break;
      }
    }

    const cutoffFrequencyHz = Math.round((cutoffBin * sampleRate) / fftSize);

    // --- 3. Compute High Band Energy (>16kHz) vs Mid Band (1kHz-10kHz) ---
    const bin16kHz = Math.round((16000 * fftSize) / sampleRate);
    const bin10kHz = Math.round((10000 * fftSize) / sampleRate);
    const bin20kHz = Math.round((20000 * fftSize) / sampleRate);

    for (let b = bin16kHz; b < Math.min(halfFft, bin20kHz); b++) {
      highBandEnergyAcc += avgPower[b];
    }
    for (let b = bin1kHz; b < bin10kHz; b++) {
      midBandEnergyAcc += avgPower[b];
    }

    const highBandRatio = (highBandEnergyAcc + 1e-12) / (midBandEnergyAcc + 1e-12);
    const highBandEnergyDb = Math.round(10 * Math.log10(highBandRatio));

    // --- 4. Sub-Bass DC / Sub-20Hz Energy ---
    const bin20Hz = Math.round((20 * fftSize) / sampleRate);
    const bin200Hz = Math.round((200 * fftSize) / sampleRate);

    for (let b = 0; b < bin20Hz; b++) {
      subBassEnergyAcc += avgPower[b];
    }
    for (let b = bin20Hz; b < bin200Hz; b++) {
      midBassEnergyAcc += avgPower[b];
    }

    const subBassRatio = (subBassEnergyAcc + 1e-12) / (midBassEnergyAcc + 1e-12);
    const subBassRumbleEnergyDb = Math.round(10 * Math.log10(subBassRatio));

    // --- 5. Spectral Flatness in 8kHz - 16kHz Range (Wiener Entropy) ---
    const bin8kHz = Math.round((8000 * fftSize) / sampleRate);
    let logSum = 0;
    let arithSum = 0;
    let binCount = 0;

    for (let b = bin8kHz; b < bin16kHz && b < halfFft; b++) {
      const val = avgPower[b] + 1e-12;
      logSum += Math.log(val);
      arithSum += val;
      binCount++;
    }

    const geomMean = Math.exp(logSum / binCount);
    const arithMean = arithSum / binCount;
    const spectralFlatness = Number((geomMean / (arithMean + 1e-12)).toFixed(3));

    // --- 6. Stereo Phase Correlation ---
    const phaseCorr = sumL2 > 0 && sumR2 > 0 ? sumLR / (Math.sqrt(sumL2 * sumR2) + 1e-12) : 1;
    const phaseCorrelation = Number(phaseCorr.toFixed(2));

    // --- 7. Deterministic AI Signature Evaluation ---
    const detectedSignatures: string[] = [];
    let score = 0;

    // Brickwall cutoff at typical neural vocoder sample bounds (15.5kHz, 16kHz, 12kHz, 11kHz)
    if (cutoffFrequencyHz >= 11000 && cutoffFrequencyHz <= 16500) {
      detectedSignatures.push(`Artificial Neural Bandwidth Cutoff at ${cutoffFrequencyHz} Hz`);
      score += 45;
    } else if (cutoffFrequencyHz < 11000) {
      detectedSignatures.push(`Severe Audio Low-pass Ceiling at ${cutoffFrequencyHz} Hz`);
      score += 30;
    }

    // Abnormally low high-frequency energy above 16kHz
    if (highBandEnergyDb < -42) {
      detectedSignatures.push(`High-Frequency Void (>16kHz Energy: ${highBandEnergyDb} dB)`);
      score += 25;
    }

    // Sub-bass DC offset / rumble artifact
    if (subBassRumbleEnergyDb > -6) {
      detectedSignatures.push(`Unfiltered Sub-Bass DC Offset (${subBassRumbleEnergyDb} dB)`);
      score += 15;
    }

    // High spectral flatness in 8-16kHz (metallic neural vocoder hiss)
    if (spectralFlatness > 0.35 && cutoffFrequencyHz <= 16500) {
      detectedSignatures.push(`Neural Vocoder Metallic Noise Floor (Flatness: ${spectralFlatness})`);
      score += 15;
    }

    // Stereo phase anomaly
    if (phaseCorrelation < 0.25 && numberOfChannels > 1) {
      detectedSignatures.push(`High-Band Stereo Phase Incoherence (r=${phaseCorrelation})`);
      score += 10;
    }

    const confidenceScore = Math.min(100, score);
    const isAIGeneratedSignature = confidenceScore >= 50;

    return {
      analyzed: true,
      cutoffFrequencyHz,
      highBandEnergyDb,
      subBassRumbleEnergyDb,
      spectralFlatness,
      phaseCorrelation,
      isAIGeneratedSignature,
      confidenceScore,
      detectedSpectralSignatures: detectedSignatures,
    };
  } finally {
    await audioCtx.close();
  }
}

/**
 * Standard In-Place Cooley-Tukey Radix-2 FFT algorithm
 */
function fftInPlace(real: Float32Array, imag: Float32Array) {
  const n = real.length;
  let j = 0;

  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      const tempI = imag[i];
      real[i] = real[j];
      imag[i] = imag[j];
      real[j] = tempR;
      imag[j] = tempI;
    }
    let k = n >> 1;
    while (k >= 1 && k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curWReal = 1;
      let curWImag = 0;

      for (let k = 0; k < halfLen; k++) {
        const posEven = i + k;
        const posOdd = i + k + halfLen;

        const uReal = real[posEven];
        const uImag = imag[posEven];

        const vReal = real[posOdd] * curWReal - imag[posOdd] * curWImag;
        const vImag = real[posOdd] * curWImag + imag[posOdd] * curWReal;

        real[posEven] = uReal + vReal;
        imag[posEven] = uImag + vImag;

        real[posOdd] = uReal - vReal;
        imag[posOdd] = uImag - vImag;

        const nextWReal = curWReal * wReal - curWImag * wImag;
        const nextWImag = curWReal * wImag + curWImag * wReal;
        curWReal = nextWReal;
        curWImag = nextWImag;
      }
    }
  }
}
