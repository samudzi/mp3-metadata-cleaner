/**
 * Convert Blob or File to Data URL string
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Data URL string to ArrayBuffer & mimeType
 */
export async function dataUrlToArrayBuffer(dataUrl: string): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  return { buffer, mimeType: blob.type || 'image/jpeg' };
}

/**
 * Process and resize cover art image to 1:1 square aspect ratio with optimal quality
 */
export async function processCoverArtImage(
  sourceUrlOrFile: string | File | Blob,
  targetDimensions: number = 800, // e.g. 500, 800, 1000
  quality: number = 0.85
): Promise<{
  dataUrl: string;
  mimeType: string;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadHandler = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // Determine square crop dimensions (center crop)
      const minDim = Math.min(origW, origH);
      const cropX = (origW - minDim) / 2;
      const cropY = (origH - minDim) / 2;

      // Target canvas size
      const size = targetDimensions > 0 ? targetDimensions : minDim;
      canvas.width = size;
      canvas.height = size;

      // High-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw centered cropped image onto square canvas
      ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, size, size);

      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);

      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => blob.arrayBuffer())
        .then(buffer => {
          resolve({
            dataUrl,
            mimeType,
            buffer,
            width: size,
            height: size,
          });
        })
        .catch(reject);
    };

    img.onerror = () => reject(new Error('Failed to load cover art image'));

    if (typeof sourceUrlOrFile === 'string') {
      img.src = sourceUrlOrFile;
      if (img.complete) loadHandler();
      else img.onload = loadHandler;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
        img.onload = loadHandler;
      };
      reader.onerror = reject;
      reader.readAsDataURL(sourceUrlOrFile);
    }
  });
}

/**
 * Format bytes into human readable format (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
