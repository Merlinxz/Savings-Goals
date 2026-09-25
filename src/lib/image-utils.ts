/**
 * Utility functions for handling client-side image upload,
 * validation, format detection, and compression (PNG, JPG, WEBP).
 */

export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export const ACCEPTED_FILE_EXTENSIONS = '.png,.jpg,.jpeg,.webp';
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB raw limit

export interface ProcessedImageResult {
  dataUrl: string;
  format: 'PNG' | 'JPG' | 'WEBP';
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

/**
 * Validates whether the given file is an allowed image format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const isTypeSupported =
    SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
    /\.(png|jpe?g|webp)$/i.test(file.name);

  if (!isTypeSupported) {
    return {
      valid: false,
      error: 'Unsupported format. Please upload PNG, JPG/JPEG, or WebP.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 8MB.`,
    };
  }

  return { valid: true };
}

/**
 * Processes, resizes and compresses an image to an optimized Base64 data URL.
 * Automatically downscales to max 400x400 to keep localStorage footprint minimal (<60KB).
 */
export function processAndCompressImage(
  file: File,
  maxDimension = 400,
  quality = 0.88
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Invalid image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image data'));

      img.onload = () => {
        try {
          // Calculate scaled dimensions while preserving aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Determine export format
          // If original is PNG and has potential transparency, keep PNG, otherwise WebP/JPEG
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');

          let outputMime = 'image/webp';
          let formatName: 'PNG' | 'JPG' | 'WEBP' = 'WEBP';

          if (isPng) {
            // Check canvas for WebP support with transparency or export PNG
            outputMime = 'image/png';
            formatName = 'PNG';
          } else if (isWebp) {
            outputMime = 'image/webp';
            formatName = 'WEBP';
          } else {
            outputMime = 'image/jpeg';
            formatName = 'JPG';
          }

          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL(outputMime, quality);
          } catch {
            // Fallback to standard png
            dataUrl = canvas.toDataURL('image/png');
            formatName = 'PNG';
          }

          const originalSizeKb = Math.round(file.size / 1024);
          const compressedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

          resolve({
            dataUrl,
            format: formatName,
            originalSizeKb,
            compressedSizeKb,
            width,
            height,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
