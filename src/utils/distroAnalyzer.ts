import { Mp3Track, DistroReadinessReport } from '../types';

/**
 * Perform deterministic mix, EQ, loudness, vocal presence, and distribution
 * readiness analysis using Web Audio API PCM DSP algorithms.
 */
export async function analyzeDistroReadiness(track: Mp3Track): Promise<DistroReadinessReport> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 44100,
  });

  try {
    const arrayBuffer = await track.file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const duration = audioBuffer.duration;

    // We analyze up to 12 seconds from middle of track for representative mix analysis
    const startSample = Math.floor(Math.max(0, duration / 4) * sampleRate);
    const numSamples = Math.min(Math.floor(12 * sampleRate), audioBuffer.length - startSample);

    const channelL = audioBuffer.getChannelData(0).subarray(startSample, startSample + numSamples);
    const channelR = numberOfChannels > 1
      ? audioBuffer.getChannelData(1).subarray(startSample, startSample + numSamples)
      : channelL;

    // --- 1. Peak dBFS & RMS Loudness Calculation ---
    let maxPeakL = 0;
    let maxPeakR = 0;
    let sumSquareL = 0;
    let sumSquareR = 0;

    for (let i = 0; i < numSamples; i++) {
      const absL = Math.abs(channelL[i]);
      const absR = Math.abs(channelR[i]);
      if (absL > maxPeakL) maxPeakL = absL;
      if (absR > maxPeakR) maxPeakR = absR;

      sumSquareL += absL * absL;
      sumSquareR += absR * absR;
    }

    const truePeakSample = Math.max(maxPeakL, maxPeakR, 1e-6);
    const peakDbfs = Number((20 * Math.log10(truePeakSample)).toFixed(1));

    const rmsL = Math.sqrt(sumSquareL / numSamples);
    const rmsR = Math.sqrt(sumSquareR / numSamples);
    const avgRms = Math.sqrt((rmsL * rmsL + rmsR * rmsR) / 2) || 1e-6;

    // Deterministic integrated LUFS approximation (K-weighting offset ~ +0.6 dB)
    const integratedLufs = Number((20 * Math.log10(avgRms) + 0.6).toFixed(1));
    const dynamicRangeDb = Number((peakDbfs - (20 * Math.log10(avgRms))).toFixed(1));

    let loudnessRating: DistroReadinessReport['loudnessRating'] = 'Optimal for Streaming (-14 LUFS)';
    if (peakDbfs >= -0.1 || integratedLufs > -7) {
      loudnessRating = 'Over-Compressed / Clipping';
    } else if (integratedLufs >= -11 && integratedLufs <= -7.1) {
      loudnessRating = 'Loud / Club Master (-8 to -11 LUFS)';
    } else if (integratedLufs < -18) {
      loudnessRating = 'Too Quiet (>-18 LUFS)';
    }

    // --- 2. EQ Frequency Balance across 6 Octave Bands via STFT ---
    const fftSize = 4096;
    const halfFft = fftSize / 2;
    const numWindows = Math.floor(numSamples / fftSize);

    const windowFunc = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      windowFunc[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize));
    }

    let subBassAcc = 0;   // 20 - 60 Hz
    let bassAcc = 0;      // 60 - 250 Hz
    let lowMidsAcc = 0;   // 250 - 500 Hz
    let midsAcc = 0;      // 500 - 2000 Hz
    let highMidsAcc = 0;  // 2000 - 6000 Hz
    let highsAcc = 0;     // 6000 - 20000 Hz

    let totalEnergyAcc = 0;

    // Mid / Side decomposition accumulators for Vocal Presence & Stereo Width
    let centerVocalEnergy = 0;  // Center Mid power in 1k-4k Hz
    let sideVocalEnergy = 0;    // Side power in 1k-4k Hz
    let totalMidPower = 0;
    let totalSidePower = 0;

    const bin20 = Math.round((20 * fftSize) / sampleRate);
    const bin60 = Math.round((60 * fftSize) / sampleRate);
    const bin250 = Math.round((250 * fftSize) / sampleRate);
    const bin500 = Math.round((500 * fftSize) / sampleRate);
    const bin1k = Math.round((1000 * fftSize) / sampleRate);
    const bin2k = Math.round((2000 * fftSize) / sampleRate);
    const bin4k = Math.round((4000 * fftSize) / sampleRate);
    const bin6k = Math.round((6000 * fftSize) / sampleRate);
    const bin20k = Math.min(halfFft - 1, Math.round((20000 * fftSize) / sampleRate));

    for (let w = 0; w < Math.min(numWindows, 60); w++) {
      const offset = w * fftSize;
      const realL = new Float32Array(fftSize);
      const imagL = new Float32Array(fftSize);
      const realR = new Float32Array(fftSize);
      const imagR = new Float32Array(fftSize);

      for (let i = 0; i < fftSize; i++) {
        const sL = channelL[offset + i] * windowFunc[i];
        const sR = channelR[offset + i] * windowFunc[i];
        realL[i] = sL;
        realR[i] = sR;

        // Mid/Side time domain power
        const midSample = (sL + sR) * 0.5;
        const sideSample = (sL - sR) * 0.5;
        totalMidPower += midSample * midSample;
        totalSidePower += sideSample * sideSample;
      }

      fftInPlace(realL, imagL);
      fftInPlace(realR, imagR);

      for (let k = 0; k < halfFft; k++) {
        const magL = Math.sqrt(realL[k] * realL[k] + imagL[k] * imagL[k]);
        const magR = Math.sqrt(realR[k] * realR[k] + imagR[k] * imagR[k]);
        const magAvg = (magL + magR) * 0.5;
        const magSq = magAvg * magAvg;

        totalEnergyAcc += magSq;

        if (k >= bin20 && k < bin60) subBassAcc += magSq;
        else if (k >= bin60 && k < bin250) bassAcc += magSq;
        else if (k >= bin250 && k < bin500) lowMidsAcc += magSq;
        else if (k >= bin500 && k < bin2k) midsAcc += magSq;
        else if (k >= bin2k && k < bin6k) highMidsAcc += magSq;
        else if (k >= bin6k && k <= bin20k) highsAcc += magSq;

        // Vocal presence bin accumulation (1kHz - 4kHz)
        if (k >= bin1k && k < bin4k) {
          const midMag = Math.abs((realL[k] + realR[k]) * 0.5);
          const sideMag = Math.abs((realL[k] - realR[k]) * 0.5);
          centerVocalEnergy += midMag * midMag;
          sideVocalEnergy += sideMag * sideMag;
        }
      }
    }

    const totalE = totalEnergyAcc || 1e-6;

    // Express band power relative to total spectrum in dB
    const subBassDb = Number((10 * Math.log10((subBassAcc + 1e-9) / totalE)).toFixed(1));
    const bassDb = Number((10 * Math.log10((bassAcc + 1e-9) / totalE)).toFixed(1));
    const lowMidsDb = Number((10 * Math.log10((lowMidsAcc + 1e-9) / totalE)).toFixed(1));
    const midsDb = Number((10 * Math.log10((midsAcc + 1e-9) / totalE)).toFixed(1));
    const highMidsDb = Number((10 * Math.log10((highMidsAcc + 1e-9) / totalE)).toFixed(1));
    const highsDb = Number((10 * Math.log10((highsAcc + 1e-9) / totalE)).toFixed(1));

    // EQ Warnings evaluation relative to balanced mastering targets
    const eqWarnings: string[] = [];
    if (subBassDb > -6.0) eqWarnings.push('Excess Sub-Bass Mud (<60Hz is elevated)');
    if (lowMidsDb > -7.5) eqWarnings.push('Boxy Low-Mids Spike (250-500Hz build-up)');
    if (highMidsDb > -6.0) eqWarnings.push('Harsh Presence Peak (2k-6kHz harshness)');
    if (highsDb < -18.0) eqWarnings.push('Lacks Air & Shine (< -18dB above 6kHz)');
    if (bassDb < -15.0) eqWarnings.push('Thin Low-End (Bass region is recessed)');

    // --- 3. Vocal Presence Calculation ---
    const vocalRatio = centerVocalEnergy / (centerVocalEnergy + sideVocalEnergy + 1e-9);
    const vocalEnergyRatio = Math.min(100, Math.round(vocalRatio * 100));

    let vocalPresenceStatus: DistroReadinessReport['vocalPresenceStatus'] = 'Moderate Vocal';
    if (vocalEnergyRatio >= 70) {
      vocalPresenceStatus = 'Strong Lead Vocal';
    } else if (vocalEnergyRatio < 40) {
      vocalPresenceStatus = 'Instrumental / Recessed Vocal';
    }

    // --- 4. Stereo Width Calculation ---
    const sideMidRatio = totalSidePower / (totalMidPower + 1e-9);
    const stereoWidthPercent = Math.min(200, Math.round(sideMidRatio * 200));

    let stereoStatus: DistroReadinessReport['stereoStatus'] = 'Focused Stereo';
    if (numberOfChannels === 1 || stereoWidthPercent < 5) {
      stereoStatus = 'Mono';
    } else if (stereoWidthPercent > 130) {
      stereoStatus = 'Wide Stereo';
    } else if (sideMidRatio > 1.2) {
      stereoStatus = 'Potential Phase Issue';
      eqWarnings.push('Stereo Phase Incoherence (Side channel energy exceeds Mid)');
    }

    // --- 5. Overall Distribution Audit Checklist & Score ---
    const titleClean = Boolean(track.title && !track.sunoDetected.isSuno);
    const hasCoverArt = Boolean(track.coverArt?.dataUrl);
    const coverRes = track.coverArt?.width || 0;
    const coverArtResolutionOk = hasCoverArt && coverRes >= 500;
    const noAiArtifacts = !track.sunoDetected.isSuno;
    const loudnessCompliant = integratedLufs >= -16 && integratedLufs <= -9;
    const peakHeadroomOk = peakDbfs <= -0.5;

    const details: string[] = [];
    let distroScore = 100;

    if (!titleClean) {
      details.push('Track title contains AI prompts or raw file tags.');
      distroScore -= 15;
    }
    if (!hasCoverArt) {
      details.push('Missing embedded 1:1 cover art.');
      distroScore -= 20;
    } else if (!coverArtResolutionOk) {
      details.push(`Cover art resolution (${coverRes}px) is below distributor standard (>=800px recommended).`);
      distroScore -= 10;
    }
    if (!noAiArtifacts) {
      details.push('Suno/AI metadata flags detected in headers or comments.');
      distroScore -= 20;
    }
    if (!peakHeadroomOk) {
      details.push(`Peak headroom (${peakDbfs} dBFS) exceeds -0.5 dB ceiling (risk of MP3 inter-sample distortion).`);
      distroScore -= 15;
    }
    if (!loudnessCompliant) {
      details.push(`Loudness (${integratedLufs} LUFS) is outside standard streaming range (-14 LUFS ideal).`);
      distroScore -= 10;
    }
    if (eqWarnings.length > 0) {
      distroScore -= Math.min(15, eqWarnings.length * 5);
    }

    distroScore = Math.max(0, distroScore);

    let distroStatus: DistroReadinessReport['distroStatus'] = 'Ready for Distribution';
    if (distroScore < 60) {
      distroStatus = 'Action Required Before Upload';
    } else if (distroScore < 85) {
      distroStatus = 'Minor Master Tweaks Suggested';
    }

    return {
      analyzed: true,
      integratedLufs,
      peakDbfs,
      dynamicRangeDb,
      loudnessRating,
      subBassDb,
      bassDb,
      lowMidsDb,
      midsDb,
      highMidsDb,
      highsDb,
      eqWarnings,
      vocalEnergyRatio,
      vocalPresenceStatus,
      stereoWidthPercent,
      stereoStatus,
      distroScore,
      distroStatus,
      auditChecklist: {
        titleClean,
        hasCoverArt,
        coverArtResolutionOk,
        noAiArtifacts,
        loudnessCompliant,
        peakHeadroomOk,
        details,
      },
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
