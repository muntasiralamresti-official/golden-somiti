/**
 * High-performance client-side HTML5 Canvas Image Optimizer
 * Converts and compresses large images (e.g. 5MB camera photos) into lightweight WebP/JPEG
 */
export async function optimizeImageFile(
  file,
  { maxWidth = 800, maxHeight = 800, quality = 0.78, format = 'image/webp' } = {}
) {
  if (!file) throw new Error('কোনো ছবি নির্বাচন করা হয়নি');

  const originalSize = file.size;
  const bitmapUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('ছবিটি লোড করা যায়নি'));
      el.src = bitmapUrl;
    });

    let { width, height } = img;
    const origWidth = width;
    const origHeight = height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(format, quality);

    // Calculate approximate byte size of base64 dataUrl
    const base64Part = dataUrl.split(',')[1] || '';
    const optimizedSize = Math.round((base64Part.length * 3) / 4);
    const savedPercent =
      originalSize > 0
        ? Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100))
        : 0;

    return {
      dataUrl,
      originalName: file.name,
      originalSize,
      optimizedSize,
      savedPercent,
      origWidth,
      origHeight,
      width,
      height,
      format: format.replace('image/', '')
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function formatBytes(bytes) {
  const num = Number(bytes || 0);
  if (num <= 0) return '0 KB';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}
