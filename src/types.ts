export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
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
