import type {
  ConversionSettings,
  CropPreset,
  ExifMetadata,
  ImageFilterSettings,
  SupportedOutputFormat,
} from '../types';

export interface FormatMetadata {
  id: SupportedOutputFormat;
  label: string;
  extension: string;
  mimeType: string;
  supportsQuality: boolean;
  supportsTransparency: boolean;
  badgeColor: string;
  description: string;
}

export const OUTPUT_FORMATS: FormatMetadata[] = [
  {
    id: 'png',
    label: 'PNG',
    extension: 'png',
    mimeType: 'image/png',
    supportsQuality: false,
    supportsTransparency: true,
    badgeColor: 'bg-neo-yellow',
    description: 'Lossless raster with full alpha transparency',
  },
  {
    id: 'jpg',
    label: 'JPG',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    supportsQuality: true,
    supportsTransparency: false,
    badgeColor: 'bg-neo-cyan',
    description: 'Universal photographic format with tunable compression',
  },
  {
    id: 'jfif',
    label: 'JFIF',
    extension: 'jfif',
    mimeType: 'image/jpeg',
    supportsQuality: true,
    supportsTransparency: false,
    badgeColor: 'bg-neo-pink',
    description: 'JPEG File Interchange Format with standard APP0 header',
  },
  {
    id: 'webp',
    label: 'WEBP',
    extension: 'webp',
    mimeType: 'image/webp',
    supportsQuality: true,
    supportsTransparency: true,
    badgeColor: 'bg-neo-lime',
    description: 'Next-gen web format with superior compression & alpha',
  },
  {
    id: 'avif',
    label: 'AVIF',
    extension: 'avif',
    mimeType: 'image/avif',
    supportsQuality: true,
    supportsTransparency: true,
    badgeColor: 'bg-neo-orange',
    description: 'Ultra-compact AV1 image format for modern web performance',
  },
  {
    id: 'gif',
    label: 'GIF',
    extension: 'gif',
    mimeType: 'image/gif',
    supportsQuality: false,
    supportsTransparency: true,
    badgeColor: 'bg-neo-purple text-white',
    description: '256-color indexed GIF89a compatible anywhere',
  },
  {
    id: 'svg',
    label: 'SVG',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    supportsQuality: false,
    supportsTransparency: true,
    badgeColor: 'bg-neo-yellow',
    description: 'Scalable Vector Graphics container with responsive viewBox',
  },
  {
    id: 'bmp',
    label: 'BMP',
    extension: 'bmp',
    mimeType: 'image/bmp',
    supportsQuality: false,
    supportsTransparency: false,
    badgeColor: 'bg-neo-cyan',
    description: 'Uncompressed 24-bit Windows Bitmap pixel matrix',
  },
  {
    id: 'ico',
    label: 'ICO',
    extension: 'ico',
    mimeType: 'image/x-icon',
    supportsQuality: false,
    supportsTransparency: true,
    badgeColor: 'bg-neo-lime',
    description: 'Windows & Website Favicon container (up to 256×256)',
  },
];

export const DEFAULT_FILTERS: ImageFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  invert: false,
};

export const DEFAULT_CONVERSION_SETTINGS: ConversionSettings = {
  targetFormat: 'webp',
  quality: 88,
  width: null,
  height: null,
  lockAspectRatio: true,
  scalePercent: 100,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  cropPreset: 'free',
  filters: { ...DEFAULT_FILTERS },
  backgroundColor: '#FFFFFF',
  fillBackground: false,
  stripExif: true,
};

export const ACCEPT_ALL_IMAGE_FORMATS =
  'image/png,image/jpeg,image/jpg,image/jfif,image/pjpeg,image/webp,image/avif,image/gif,image/svg+xml,image/bmp,image/x-ms-bmp,image/x-icon,image/vnd.microsoft.icon,image/tiff,.png,.jpg,.jpeg,.jfif,.webp,.avif,.gif,.svg,.bmp,.ico,.tiff,.tif';

export function getFormatMeta(format: SupportedOutputFormat): FormatMetadata {
  return OUTPUT_FORMATS.find((f) => f.id === format) || OUTPUT_FORMATS[0];
}

export function detectFileFormatLabel(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'jfif') return 'JFIF';
  if (ext === 'jpg' || ext === 'jpeg') return 'JPG';
  if (ext === 'png') return 'PNG';
  if (ext === 'webp') return 'WEBP';
  if (ext === 'avif') return 'AVIF';
  if (ext === 'gif') return 'GIF';
  if (ext === 'svg') return 'SVG';
  if (ext === 'bmp') return 'BMP';
  if (ext === 'ico') return 'ICO';
  if (ext === 'tif' || ext === 'tiff') return 'TIFF';
  if (file.type) {
    return file.type.replace('image/', '').replace('+xml', '').toUpperCase();
  }
  return 'IMAGE';
}

export function isSupportedImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return [
    'png',
    'jpg',
    'jpeg',
    'jfif',
    'pjpeg',
    'webp',
    'avif',
    'gif',
    'svg',
    'bmp',
    'ico',
    'tif',
    'tiff',
  ].includes(ext);
}

export function normalizeUploadMimeType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'jfif' || ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'avif') return 'image/avif';
  if (ext === 'bmp') return 'image/bmp';
  if (ext === 'ico') return 'image/x-icon';
  if (ext === 'tif' || ext === 'tiff') return 'image/tiff';
  return file.type || 'image/png';
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatAspectRatio(w: number, h: number): string {
  if (!w || !h) return '1:1';
  const divisor = gcd(Math.round(w), Math.round(h));
  const rw = Math.round(w / divisor);
  const rh = Math.round(h / divisor);
  if (rw > 32 || rh > 32) {
    return `${(w / h).toFixed(2)}:1`;
  }
  return `${rw}:${rh}`;
}

/**
 * Inspects binary header magic bytes and parses embedded JPEG/TIFF EXIF tags
 */
export async function inspectImageMetadata(
  file: File,
  width: number,
  height: number
): Promise<ExifMetadata> {
  const slice = file.slice(0, Math.min(file.size, 65536));
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Build Magic Bytes Hex Signature
  const hexBytes = Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  let formatSignature = hexBytes;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    if (bytes[2] === 0xff && bytes[3] === 0xe0) {
      formatSignature = 'FF D8 FF E0 (JFIF / JPEG)';
    } else if (bytes[2] === 0xff && bytes[3] === 0xe1) {
      formatSignature = 'FF D8 FF E1 (EXIF / JPEG)';
    } else {
      formatSignature = 'FF D8 FF (JPEG STREAM)';
    }
  } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    formatSignature = '89 50 4E 47 (PNG 8-BYTE)';
  } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    formatSignature = '52 49 46 46 (RIFF / WEBP)';
  } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    formatSignature = '47 49 46 38 (GIF89a)';
  } else if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    formatSignature = '42 4D (WINDOWS BMP)';
  } else if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
    formatSignature = '00 00 01 00 (ICO CONTAINER)';
  } else if (file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml') {
    formatSignature = '3C 73 76 67 (SVG VECTOR XML)';
  }

  const detectedExtension = detectFileFormatLabel(file);
  const megapixels = ((width * height) / 1_000_000).toFixed(2);
  const aspectRatioLabel = formatAspectRatio(width, height);
  const hasAlphaChannel = ['PNG', 'WEBP', 'SVG', 'GIF', 'ICO', 'AVIF'].includes(detectedExtension);

  const rawTags: { key: string; value: string }[] = [];
  let cameraMake: string | undefined;
  let cameraModel: string | undefined;
  let software: string | undefined;
  let dateTime: string | undefined;
  let orientation: string | undefined;
  let hasGpsData = false;
  let gpsSummary: string | undefined;

  // Parse JPEG APP1 EXIF segment if present
  if (bytes.length > 12 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      if (marker === 0xda || marker === 0xd9) break; // SOS or EOI

      const segmentLength = view.getUint16(offset + 2, false);
      if (marker === 0xe0 && offset + 14 < bytes.length) {
        // JFIF APP0 header
        const jfifId = String.fromCharCode(
          bytes[offset + 4],
          bytes[offset + 5],
          bytes[offset + 6],
          bytes[offset + 7]
        );
        if (jfifId === 'JFIF') {
          const vMajor = bytes[offset + 9];
          const vMinor = bytes[offset + 10];
          const xDensity = view.getUint16(offset + 12, false);
          const yDensity = view.getUint16(offset + 14, false);
          rawTags.push({ key: 'JFIF Version', value: `${vMajor}.0${vMinor}` });
          rawTags.push({ key: 'Pixel Density', value: `${xDensity} × ${yDensity} DPI` });
        }
      } else if (marker === 0xe1 && offset + 10 < bytes.length) {
        // EXIF APP1 header
        const exifHeader = String.fromCharCode(
          bytes[offset + 4],
          bytes[offset + 5],
          bytes[offset + 6],
          bytes[offset + 7]
        );
        if (exifHeader === 'Exif') {
          const tiffStart = offset + 10;
          if (tiffStart + 8 < bytes.length) {
            const littleEndian =
              bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
            const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
            const ifd0Start = tiffStart + firstIfdOffset;

            const readAscii = (valOffset: number, count: number): string => {
              if (valOffset < 0 || valOffset + count > bytes.length) return '';
              let s = '';
              for (let i = 0; i < count - 1; i++) {
                const c = bytes[valOffset + i];
                if (c === 0) break;
                if (c >= 32 && c <= 126) s += String.fromCharCode(c);
              }
              return s.trim();
            };

            const parseIfd = (ifdOffset: number) => {
              if (ifdOffset + 2 > bytes.length) return;
              const numEntries = view.getUint16(ifdOffset, littleEndian);
              for (let i = 0; i < Math.min(numEntries, 60); i++) {
                const entryOffset = ifdOffset + 2 + i * 12;
                if (entryOffset + 12 > bytes.length) break;

                const tag = view.getUint16(entryOffset, littleEndian);
                const type = view.getUint16(entryOffset + 2, littleEndian);
                const count = view.getUint32(entryOffset + 4, littleEndian);
                const valueOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);

                if (tag === 0x010f && type === 2) {
                  cameraMake = readAscii(count <= 4 ? entryOffset + 8 : valueOffset, count);
                  if (cameraMake) rawTags.push({ key: 'Camera Make', value: cameraMake });
                } else if (tag === 0x0110 && type === 2) {
                  cameraModel = readAscii(count <= 4 ? entryOffset + 8 : valueOffset, count);
                  if (cameraModel) rawTags.push({ key: 'Camera Model', value: cameraModel });
                } else if (tag === 0x0131 && type === 2) {
                  software = readAscii(count <= 4 ? entryOffset + 8 : valueOffset, count);
                  if (software) rawTags.push({ key: 'Software', value: software });
                } else if ((tag === 0x0132 || tag === 0x9003) && type === 2) {
                  const dt = readAscii(count <= 4 ? entryOffset + 8 : valueOffset, count);
                  if (dt) {
                    dateTime = dt;
                    rawTags.push({
                      key: tag === 0x9003 ? 'Date Original' : 'Date Modified',
                      value: dt,
                    });
                  }
                } else if (tag === 0x0112 && type === 3) {
                  const orientVal = view.getUint16(entryOffset + 8, littleEndian);
                  orientation = `Code ${orientVal} (${orientVal === 1 ? 'Horizontal Normal' : 'Rotated'})`;
                  rawTags.push({ key: 'Orientation', value: orientation });
                } else if (tag === 0x8769) {
                  // Exif SubIFD
                  const subIfdOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
                  parseIfd(subIfdOffset);
                } else if (tag === 0x8825) {
                  // GPS IFD Pointer
                  hasGpsData = true;
                  gpsSummary = 'Embedded GPS Coordinates Detected';
                  rawTags.push({
                    key: 'GPS Location Tag',
                    value: 'PRESENT (Strip recommended for privacy)',
                  });
                } else if (tag === 0x8827 && type === 3) {
                  const isoVal = view.getUint16(entryOffset + 8, littleEndian);
                  rawTags.push({ key: 'ISO Speed', value: `ISO ${isoVal}` });
                }
              }
            };

            try {
              parseIfd(ifd0Start);
            } catch {
              // ignore malformed EXIF pointers
            }
          }
        }
      }

      if (segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }

  // Always include core technical inspection rows
  if (rawTags.length === 0) {
    rawTags.push({ key: 'Container Format', value: detectedExtension });
    rawTags.push({ key: 'Color Channels', value: hasAlphaChannel ? 'RGBA (32-bit)' : 'RGB (24-bit)' });
  }

  return {
    formatSignature,
    detectedExtension,
    width,
    height,
    megapixels,
    aspectRatioLabel,
    hasAlphaChannel,
    cameraMake,
    cameraModel,
    software,
    dateTime,
    orientation,
    hasGpsData,
    gpsSummary,
    exifTagCount: rawTags.length,
    rawTags,
  };
}

/**
 * Loads an image File into an HTMLImageElement, handling SVG, ICO, BMP, JFIF, WEBP, GIF, PNG, JPG
 */
export async function loadImageElement(
  file: File
): Promise<{ img: HTMLImageElement; objectUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const isSvg =
      file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = () => {
        const svgText = String(reader.result || '');
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const w = img.naturalWidth || img.width || 1024;
          const h = img.naturalHeight || img.height || 1024;
          resolve({ img, objectUrl: url, width: w, height: h });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to decode SVG vector file.'));
        };
        img.src = url;
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsText(file);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width || 512;
      const h = img.naturalHeight || img.height || 512;
      resolve({ img, objectUrl: url, width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `Browser could not decode "${file.name}". Please ensure it is a valid image file.`
        )
      );
    };
    img.src = url;
  });
}

/**
 * Computes source crop rectangle for the given CropPreset
 */
function computeCropRect(
  srcW: number,
  srcH: number,
  preset: CropPreset
): { sx: number; sy: number; sw: number; sh: number } {
  if (preset === 'free') {
    return { sx: 0, sy: 0, sw: srcW, sh: srcH };
  }

  const ratioMap: Record<Exclude<CropPreset, 'free'>, number> = {
    '1:1': 1,
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '9:16': 9 / 16,
    '3:2': 3 / 2,
  };

  const targetRatio = ratioMap[preset];
  const currentRatio = srcW / srcH;

  if (Math.abs(currentRatio - targetRatio) < 0.01) {
    return { sx: 0, sy: 0, sw: srcW, sh: srcH };
  }

  if (currentRatio > targetRatio) {
    // Source is wider than target ratio -> crop width
    const sw = Math.round(srcH * targetRatio);
    const sx = Math.round((srcW - sw) / 2);
    return { sx, sy: 0, sw, sh: srcH };
  } else {
    // Source is taller than target ratio -> crop height
    const sh = Math.round(srcW / targetRatio);
    const sy = Math.round((srcH - sh) / 2);
    return { sx: 0, sy, sw: srcW, sh };
  }
}

/**
 * Encodes an ImageData buffer into a 24-bit Uncompressed Windows BMP Blob
 */
function encodeBmpFromImageData(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true); // Pixel data offset

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // Top-down DIB (negative height)
  view.setUint16(26, 1, true); // Color planes
  view.setUint16(28, 24, true); // 24 bits per pixel (BGR)
  view.setUint32(30, 0, true); // BI_RGB (no compression)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI X
  view.setInt32(42, 2835, true); // 72 DPI Y
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  let offset = 54;
  const padding = rowSize - width * 3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      bytes[offset++] = pixels[idx + 2]; // Blue
      bytes[offset++] = pixels[idx + 1]; // Green
      bytes[offset++] = pixels[idx];     // Red
    }
    for (let p = 0; p < padding; p++) {
      bytes[offset++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encodes a Canvas into a valid Windows .ICO container (wrapping a PNG payload up to 256x256)
 */
async function encodeIcoFromCanvas(sourceCanvas: HTMLCanvasElement): Promise<Blob> {
  const maxDim = 256;
  let targetW = sourceCanvas.width;
  let targetH = sourceCanvas.height;

  if (targetW > maxDim || targetH > maxDim) {
    const scale = maxDim / Math.max(targetW, targetH);
    targetW = Math.max(1, Math.round(targetW * scale));
    targetH = Math.max(1, Math.round(targetH * scale));
  }

  const icoCanvas = document.createElement('canvas');
  icoCanvas.width = targetW;
  icoCanvas.height = targetH;
  const ctx = icoCanvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);
  }

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    icoCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('ICO PNG encode failed'))), 'image/png');
  });

  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const headerSize = 6 + 16; // ICONDIR (6) + 1 ICONDIRENTRY (16)
  const totalSize = headerSize + pngBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type 1 = ICO
  view.setUint16(4, 1, true); // 1 image entry

  // ICONDIRENTRY
  view.setUint8(6, targetW >= 256 ? 0 : targetW);
  view.setUint8(7, targetH >= 256 ? 0 : targetH);
  view.setUint8(8, 0); // Palette count
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // 32 bpp RGBA
  view.setUint32(14, pngBytes.length, true); // Payload size
  view.setUint32(18, headerSize, true); // Payload offset

  bytes.set(pngBytes, headerSize);
  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Encodes an ImageData buffer into a valid binary GIF89a image (3-3-2 256-color palette + LZW)
 */
function encodeGifFromImageData(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Build 256-color 3-3-2 RGB palette
  const palette = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const r = ((i >> 5) & 0x07) * 255 / 7;
    const g = ((i >> 2) & 0x07) * 255 / 7;
    const b = (i & 0x03) * 255 / 3;
    palette[i * 3] = Math.round(r);
    palette[i * 3 + 1] = Math.round(g);
    palette[i * 3 + 2] = Math.round(b);
  }

  // Map pixels to 8-bit palette indices
  const indexedPixels = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const a = data[i + 3];
    if (a < 128) {
      indexedPixels[p] = 0;
    } else {
      const r3 = Math.round((data[i] / 255) * 7) & 0x07;
      const g3 = Math.round((data[i + 1] / 255) * 7) & 0x07;
      const b2 = Math.round((data[i + 2] / 255) * 3) & 0x03;
      indexedPixels[p] = (r3 << 5) | (g3 << 2) | b2;
    }
  }

  // Standard LZW encoder for 8-bit minCodeSize
  const minCodeSize = 8;
  const clearCode = 1 << minCodeSize; // 256
  const eoiCode = clearCode + 1;      // 257

  const outBytes: number[] = [];

  // Header: GIF89a
  outBytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  // Logical Screen Descriptor
  outBytes.push(width & 0xff, (width >> 8) & 0xff);
  outBytes.push(height & 0xff, (height >> 8) & 0xff);
  outBytes.push(0xf7, 0x00, 0x00); // Global color table flag (256 colors)

  // Global Color Table (768 bytes)
  for (let i = 0; i < palette.length; i++) {
    outBytes.push(palette[i]);
  }

  // Image Descriptor
  outBytes.push(0x2c, 0x00, 0x00, 0x00, 0x00);
  outBytes.push(width & 0xff, (width >> 8) & 0xff);
  outBytes.push(height & 0xff, (height >> 8) & 0xff);
  outBytes.push(0x00);

  // LZW Minimum Code Size
  outBytes.push(minCodeSize);

  // Bit packer for sub-blocks
  const subBlockBuffer: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  const flushSubBlock = () => {
    if (subBlockBuffer.length > 0) {
      outBytes.push(subBlockBuffer.length);
      for (let i = 0; i < subBlockBuffer.length; i++) {
        outBytes.push(subBlockBuffer[i]);
      }
      subBlockBuffer.length = 0;
    }
  };

  const writeCode = (code: number, size: number) => {
    bitBuffer |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      subBlockBuffer.push(bitBuffer & 0xff);
      if (subBlockBuffer.length === 255) {
        flushSubBlock();
      }
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  let codeSize = minCodeSize + 1; // 9 bits
  let nextCode = eoiCode + 1;     // 258
  let dictionary = new Map<number, number>();

  writeCode(clearCode, codeSize);

  if (indexedPixels.length > 0) {
    let prefix = indexedPixels[0];
    for (let i = 1; i < indexedPixels.length; i++) {
      const k = indexedPixels[i];
      const key = (prefix << 8) | k;
      const found = dictionary.get(key);
      if (found !== undefined) {
        prefix = found;
      } else {
        writeCode(prefix, codeSize);
        if (nextCode < 4096) {
          dictionary.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          writeCode(clearCode, codeSize);
          dictionary = new Map<number, number>();
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
        }
        prefix = k;
      }
    }
    writeCode(prefix, codeSize);
  }

  writeCode(eoiCode, codeSize);
  if (bitCount > 0) {
    subBlockBuffer.push(bitBuffer & 0xff);
  }
  flushSubBlock();

  outBytes.push(0x00); // Block terminator
  outBytes.push(0x3b); // GIF Trailer ';'

  return new Blob([new Uint8Array(outBytes)], { type: 'image/gif' });
}

/**
 * Encodes a Canvas into a scalable SVG XML file with embedded lossless image data
 */
function encodeSvgFromCanvas(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  const pngDataUrl = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>Converted by ImgLink Converter Studio</title>
  <image width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="${pngDataUrl}" />
</svg>`;
  return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Applies pixel-level color adjustments if needed or uses Canvas 2D context filters
 */
function applyPixelFiltersIfNeeded(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: ImageFilterSettings
) {
  const isDefault =
    filters.brightness === 100 &&
    filters.contrast === 100 &&
    filters.saturation === 100 &&
    filters.grayscale === 0 &&
    filters.sepia === 0 &&
    !filters.invert;

  if (isDefault) return;

  // If invert is enabled or browser doesn't support ctx.filter, apply exact pixel math
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;

  const bFactor = filters.brightness / 100;
  const cFactor = Math.pow((filters.contrast + 100) / 200, 2);
  const sFactor = filters.saturation / 100;
  const grayMix = filters.grayscale / 100;
  const sepiaMix = filters.sepia / 100;
  const invert = filters.invert;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // 1. Brightness
    r *= bFactor;
    g *= bFactor;
    b *= bFactor;

    // 2. Contrast
    r = (r - 128) * cFactor + 128;
    g = (g - 128) * cFactor + 128;
    b = (b - 128) * cFactor + 128;

    // 3. Saturation
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    r = luma + (r - luma) * sFactor;
    g = luma + (g - luma) * sFactor;
    b = luma + (b - luma) * sFactor;

    // 4. Grayscale
    if (grayMix > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = r * (1 - grayMix) + gray * grayMix;
      g = g * (1 - grayMix) + gray * grayMix;
      b = b * (1 - grayMix) + gray * grayMix;
    }

    // 5. Sepia
    if (sepiaMix > 0) {
      const sr = r * 0.393 + g * 0.769 + b * 0.189;
      const sg = r * 0.349 + g * 0.686 + b * 0.168;
      const sb = r * 0.272 + g * 0.534 + b * 0.131;
      r = r * (1 - sepiaMix) + sr * sepiaMix;
      g = g * (1 - sepiaMix) + sg * sepiaMix;
      b = b * (1 - sepiaMix) + sb * sepiaMix;
    }

    // 6. Invert
    if (invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    d[i] = Math.max(0, Math.min(255, Math.round(r)));
    d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imageData, 0, 0);
}

export interface ConversionResult {
  blob: Blob;
  url: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  processingTimeMs: number;
}

/**
 * Full client-side image conversion and transformation pipeline
 */
export async function convertImageFile(
  file: File,
  settings: ConversionSettings
): Promise<ConversionResult> {
  const startTime = performance.now();
  const { img, objectUrl, width: naturalW, height: naturalH } = await loadImageElement(file);

  try {
    // 1. Compute crop area on original image
    const { sx, sy, sw, sh } = computeCropRect(naturalW, naturalH, settings.cropPreset);

    // 2. Determine target dimensions before rotation
    const scale = Math.max(10, Math.min(400, settings.scalePercent || 100)) / 100;
    let baseW = settings.width && settings.width > 0 ? Math.round(settings.width) : Math.round(sw * scale);
    let baseH = settings.height && settings.height > 0 ? Math.round(settings.height) : Math.round(sh * scale);

    baseW = Math.max(1, Math.min(8192, baseW));
    baseH = Math.max(1, Math.min(8192, baseH));

    const isRotated90or270 = settings.rotation === 90 || settings.rotation === 270;
    const outW = isRotated90or270 ? baseH : baseW;
    const outH = isRotated90or270 ? baseW : baseH;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    const formatMeta = getFormatMeta(settings.targetFormat);
    const needsOpaqueBg = !formatMeta.supportsTransparency || settings.fillBackground;

    if (needsOpaqueBg) {
      ctx.fillStyle = settings.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, outW, outH);
    } else {
      ctx.clearRect(0, 0, outW, outH);
    }

    // Apply geometric transforms (center -> rotate -> flip -> draw)
    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    if (settings.rotation) {
      ctx.rotate((settings.rotation * Math.PI) / 180);
    }
    const scaleX = settings.flipHorizontal ? -1 : 1;
    const scaleY = settings.flipVertical ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();

    // Apply color adjustments & filters accurately
    applyPixelFiltersIfNeeded(ctx, outW, outH, settings.filters);

    // 3. Encode into target format
    let outputBlob: Blob;
    let finalWidth = outW;
    let finalHeight = outH;
    const qualityFraction = Math.max(0.05, Math.min(1.0, settings.quality / 100));

    if (settings.targetFormat === 'bmp') {
      const imgData = ctx.getImageData(0, 0, outW, outH);
      outputBlob = encodeBmpFromImageData(imgData);
    } else if (settings.targetFormat === 'ico') {
      outputBlob = await encodeIcoFromCanvas(canvas);
      const maxDim = 256;
      if (outW > maxDim || outH > maxDim) {
        const s = maxDim / Math.max(outW, outH);
        finalWidth = Math.max(1, Math.round(outW * s));
        finalHeight = Math.max(1, Math.round(outH * s));
      }
    } else if (settings.targetFormat === 'gif') {
      const imgData = ctx.getImageData(0, 0, outW, outH);
      outputBlob = encodeGifFromImageData(imgData);
    } else if (settings.targetFormat === 'svg') {
      outputBlob = encodeSvgFromCanvas(canvas);
    } else if (settings.targetFormat === 'jpg' || settings.targetFormat === 'jfif') {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('JPEG encoding failed'))),
          'image/jpeg',
          qualityFraction
        );
      });
    } else if (settings.targetFormat === 'avif') {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b && b.type === 'image/avif') {
              resolve(b);
            } else {
              // Fallback to high-efficiency WebP container if browser lacks native AVIF encoder
              canvas.toBlob(
                (wb) => (wb ? resolve(wb) : reject(new Error('AVIF/WebP encoding failed'))),
                'image/webp',
                qualityFraction
              );
            }
          },
          'image/avif',
          qualityFraction
        );
      });
    } else {
      // PNG or WEBP
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`${formatMeta.label} encoding failed`))),
          formatMeta.mimeType,
          formatMeta.supportsQuality ? qualityFraction : undefined
        );
      });
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
    const fileName = `${baseName}.${formatMeta.extension}`;
    const url = URL.createObjectURL(outputBlob);
    const processingTimeMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      blob: outputBlob,
      url,
      fileName,
      mimeType: formatMeta.mimeType,
      width: finalWidth,
      height: finalHeight,
      sizeBytes: outputBlob.size,
      processingTimeMs,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Precomputed CRC32 table for standard PKZIP archive generation
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Zero-dependency client-side PKZIP (.zip) bundler for batch converted files
 */
export async function buildZipArchive(
  files: { fileName: string; blob: Blob }[]
): Promise<Blob> {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const usedNames = new Set<string>();

  for (const item of files) {
    let safeName = item.fileName;
    let counter = 1;
    while (usedNames.has(safeName)) {
      const dotIndex = item.fileName.lastIndexOf('.');
      if (dotIndex !== -1) {
        safeName = `${item.fileName.slice(0, dotIndex)}_${counter}${item.fileName.slice(dotIndex)}`;
      } else {
        safeName = `${item.fileName}_${counter}`;
      }
      counter++;
    }
    usedNames.add(safeName);

    const nameBytes = encoder.encode(safeName);
    const dataBytes = new Uint8Array(await item.blob.arrayBuffer());
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + fileName)
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 0x04034b50, true); // Signature
    lv.setUint16(4, 20, true);         // Version needed (2.0)
    lv.setUint16(6, 0x0800, true);     // UTF-8 flag
    lv.setUint16(8, 0, true);          // Store method (0 = uncompressed, fast & lossless for compressed images)
    lv.setUint16(10, 0, true);         // Time
    lv.setUint16(12, 0x21, true);      // Date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(nameBytes);

    // Central Directory Header (46 bytes + fileName)
    const centralHeader = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(centralHeader);
    cv.setUint32(0, 0x02014b50, true); // Signature
    cv.setUint16(4, 20, true);         // Version made by
    cv.setUint16(6, 20, true);         // Version needed
    cv.setUint16(8, 0x0800, true);     // UTF-8 flag
    cv.setUint16(10, 0, true);         // Store
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);    // Relative offset of local header
    new Uint8Array(centralHeader, 46).set(nameBytes);

    const localBytes = new Uint8Array(localHeader);
    localParts.push(localBytes, dataBytes);
    centralParts.push(new Uint8Array(centralHeader));

    offset += localBytes.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true); // End of Central Directory signature
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const eocdBytes = new Uint8Array(eocd);
  const totalArchiveLength = offset + centralSize + eocdBytes.length;
  const archiveBuffer = new ArrayBuffer(totalArchiveLength);
  const archiveBytes = new Uint8Array(archiveBuffer);

  let writePos = 0;
  for (const part of localParts) {
    archiveBytes.set(part, writePos);
    writePos += part.length;
  }
  for (const part of centralParts) {
    archiveBytes.set(part, writePos);
    writePos += part.length;
  }
  archiveBytes.set(eocdBytes, writePos);

  return new Blob([archiveBuffer], {
    type: 'application/zip',
  });
}
