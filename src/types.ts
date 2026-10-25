export type UserRole = 'user' | 'admin';
export type UserTier = 'free' | 'pro';
export type ProRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  tier: UserTier;
  proRequestStatus: ProRequestStatus;
  proRequestedAt?: string | null;
  proRequestNote?: string | null;
  imageCount?: number;
}

export interface AdminMemberRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  tier: UserTier;
  proRequestStatus: ProRequestStatus;
  proRequestedAt?: string | null;
  proRequestNote?: string | null;
  imageCount: number;
  createdAt: string;
}

export interface ImageRecord {
  id: string;
  fileKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  userId?: string | null;
  isOwner?: boolean;
  createdAt: string;
}

export type UploadStage =
  | 'idle'
  | 'converting'
  | 'requesting-url'
  | 'uploading'
  | 'saving-metadata'
  | 'completed'
  | 'error';

export interface UploadProgress {
  stage: UploadStage;
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  statusText: string;
  error?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
  userId?: string;
  storageProvider?: string;
}

export type SupportedOutputFormat =
  | 'png'
  | 'jpg'
  | 'jfif'
  | 'webp'
  | 'avif'
  | 'gif'
  | 'svg'
  | 'bmp'
  | 'ico';

export type CropPreset = 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2';

export interface ImageFilterSettings {
  brightness: number; // 50 - 150 (100 default)
  contrast: number;   // 50 - 150 (100 default)
  saturation: number; // 0 - 200 (100 default)
  grayscale: number;  // 0 - 100 (0 default)
  sepia: number;      // 0 - 100 (0 default)
  invert: boolean;
}

export interface ConversionSettings {
  targetFormat: SupportedOutputFormat;
  quality: number; // 1 to 100
  width: number | null;
  height: number | null;
  lockAspectRatio: boolean;
  scalePercent: number; // 10 to 200
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  cropPreset: CropPreset;
  filters: ImageFilterSettings;
  backgroundColor: string;
  fillBackground: boolean;
  stripExif: boolean;
}

export interface ExifMetadata {
  formatSignature: string;
  detectedExtension: string;
  width: number;
  height: number;
  megapixels: string;
  aspectRatioLabel: string;
  hasAlphaChannel: boolean;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  dateTime?: string;
  orientation?: string;
  hasGpsData: boolean;
  gpsSummary?: string;
  exifTagCount: number;
  rawTags: { key: string; value: string }[];
}

export interface ConverterQueueItem {
  id: string;
  file: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  exif: ExifMetadata;
  status: 'idle' | 'processing' | 'done' | 'error';
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedFileName?: string;
  convertedMimeType?: string;
  convertedSize?: number;
  convertedWidth?: number;
  convertedHeight?: number;
  processingTimeMs?: number;
  error?: string;
}
