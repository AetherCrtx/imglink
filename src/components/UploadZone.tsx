import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileUp,
  X,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import type { ImageRecord, UploadProgress, AuthUser } from '../types';
import { formatBytes } from '../utils/formatters';

interface UploadZoneProps {
  user: AuthUser | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onUploadSuccess: (image: ImageRecord) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadZone: React.FC<UploadZoneProps> = ({
  user,
  onOpenAuth,
  onUploadSuccess,
  isUploading,
  setIsUploading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `UNSUPPORTED FORMAT "${file.type || 'unknown'}". ALLOWED: JPG, PNG, WEBP, GIF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `FILE SIZE (${formatBytes(file.size)}) EXCEEDS THE 10MB MAXIMUM LIMIT.`;
    }
    return null;
  };

  const processUpload = useCallback(
    async (file: File) => {
      setValidationError(null);

      if (!user) {
        onOpenAuth('login');
        return;
      }

      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }

      setIsUploading(true);
      setSelectedFileName(file.name);
      setProgress({
        stage: 'requesting-url',
        percent: 10,
        loadedBytes: 0,
        totalBytes: file.size,
        statusText: '1/3 GETTING PRESIGNED STORAGE URL...',
      });

      try {
        // Step 1: Request Presigned PUT URL from backend
        const urlResponse = await axios.post<{ uploadUrl: string; fileKey: string }>(
          '/api/upload-url',
          {
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }
        );

        const { uploadUrl, fileKey } = urlResponse.data;

        // Step 2: Upload directly to Cloud Storage using PUT
        setProgress({
          stage: 'uploading',
          percent: 20,
          loadedBytes: 0,
          totalBytes: file.size,
          statusText: '2/3 STREAMING DIRECTLY TO OBJECT STORAGE...',
        });

        await axios.put(uploadUrl, file, {
          headers: {
            'Content-Type': file.type,
          },
          transformRequest: [
            (data, headers) => {
              // Direct S3/Bucket presigned URLs reject requests containing custom Authorization headers
              if (headers) {
                delete headers.Authorization;
                delete headers.authorization;
                if (headers.common) {
                  delete headers.common.Authorization;
                  delete headers.common.authorization;
                }
              }
              return data;
            },
          ],
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const uploadFraction = progressEvent.loaded / progressEvent.total;
              const currentPercent = Math.min(85, Math.round(20 + uploadFraction * 65));
              setProgress({
                stage: 'uploading',
                percent: currentPercent,
                loadedBytes: progressEvent.loaded,
                totalBytes: progressEvent.total,
                statusText: `2/3 UPLOADING... ${Math.round(uploadFraction * 100)}% (${formatBytes(
                  progressEvent.loaded
                )} / ${formatBytes(progressEvent.total)})`,
              });
            }
          },
        });

        // Step 3: Save metadata to Neon PostgreSQL
        setProgress({
          stage: 'saving-metadata',
          percent: 92,
          loadedBytes: file.size,
          totalBytes: file.size,
          statusText: '3/3 SAVING METADATA TO NEON DB...',
        });

        const metadataResponse = await axios.post<ImageRecord>('/api/images', {
          fileKey,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });

        setProgress({
          stage: 'completed',
          percent: 100,
          loadedBytes: file.size,
          totalBytes: file.size,
          statusText: 'UPLOAD COMPLETE!',
        });

        setTimeout(() => {
          setIsUploading(false);
          setProgress(null);
          onUploadSuccess(metadataResponse.data);
        }, 500);
      } catch (err: unknown) {
        setIsUploading(false);
        let detailMessage = 'AN ERROR OCCURRED DURING UPLOAD.';
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            detailMessage = 'SESSION EXPIRED OR UNAUTHORIZED. PLEASE SIGN IN.';
            onOpenAuth('login');
          } else if (err.response?.data?.error) {
            detailMessage = err.response.data.error;
          } else if (err.message.includes('Network Error')) {
            detailMessage = 'NETWORK ERROR CONNECTING TO STORAGE BUCKET.';
          } else {
            detailMessage = err.message;
          }
        } else if (err instanceof Error) {
          detailMessage = err.message;
        }

        setProgress({
          stage: 'error',
          percent: 0,
          loadedBytes: 0,
          totalBytes: file.size,
          statusText: 'UPLOAD FAILED',
          error: detailMessage,
        });
        setValidationError(detailMessage);
      }
    },
    [user, onOpenAuth, onUploadSuccess, setIsUploading]
  );

  // Global Clipboard Paste Listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isUploading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const ext = item.type.split('/')[1] || 'png';
            const namedFile = new File(
              [file],
              `clipboard-${Date.now()}.${ext}`,
              { type: item.type }
            );
            processUpload(namedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isUploading, processUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading || !user}
      />

      {/* Validation / Error Banner (Neo-Brutalist) */}
      {validationError && (
        <div className="flex items-start gap-3 p-4 bg-neo-pink/20 border-[3px] border-black shadow-brutal text-black animate-fadeIn">
          <div className="p-1 bg-neo-pink border-2 border-black flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div className="flex-1 font-mono font-bold text-xs uppercase leading-relaxed pt-0.5">
            {validationError}
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="w-6 h-6 bg-white border-2 border-black flex items-center justify-center font-black hover:bg-black hover:text-white transition-colors"
            title="Dismiss error"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Auth Gate Banner (If not logged in) */}
      {!user ? (
        <div className="p-5 sm:p-8 md:p-10 bg-white border-[4px] border-black shadow-brutal-xl text-center space-y-5 sm:space-y-6 relative overflow-hidden">
          <div className="inline-block p-3 sm:p-4 bg-neo-yellow border-[3px] border-black shadow-brutal -rotate-2 hover:rotate-2 transition-transform">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-black stroke-[2.5]" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-block px-3 py-1 bg-neo-pink border-2 border-black font-mono font-black text-xs uppercase text-black shadow-brutal-sm rotate-1">
              ★ ACCESS RESTRICTED
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
              Sign In To Upload Images
            </h3>
            <p className="font-mono text-xs text-black/80 font-bold leading-relaxed">
              Create a free account or login with Google to generate permanent shareable URLs, direct S3 cloud storage, and view your complete archive.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 bg-neo-yellow hover:bg-neo-lime active:translate-x-1 active:translate-y-1 border-[3px] border-black font-black uppercase text-sm tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In Now</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 bg-neo-cyan hover:bg-neo-pink active:translate-x-1 active:translate-y-1 border-[3px] border-black font-black uppercase text-sm tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center"
            >
              Register Free
            </button>
          </div>
        </div>
      ) : (
        /* Neo-Brutalist Active Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative group bg-white border-[4px] border-black p-4 sm:p-8 md:p-12 transition-all duration-200 text-center select-none cursor-pointer overflow-hidden ${
            isDragging
              ? 'bg-neo-cyan/20 shadow-brutal-xl scale-[1.01]'
              : isUploading
              ? 'bg-neo-bg cursor-wait shadow-brutal'
              : 'shadow-brutal-lg hover:shadow-brutal-xl hover:-translate-x-0.5 hover:-translate-y-0.5'
          }`}
        >
          {/* Retro Window Header Bar */}
          <div className="bg-neo-yellow border-b-[3px] border-black px-3 sm:px-4 py-2 flex items-center justify-between text-black font-mono font-black text-xs uppercase -mt-4 -mx-4 mb-4 sm:-mt-8 sm:-mx-8 sm:mb-6 md:-mt-12 md:-mx-12">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-neo-red border-2 border-black rounded-full inline-block" />
              <span className="w-3 h-3 bg-neo-yellow border-2 border-black rounded-full inline-block" />
              <span className="w-3 h-3 bg-neo-lime border-2 border-black rounded-full inline-block" />
              <span className="ml-1 sm:ml-2 tracking-wider hidden xs:inline">IMGLINK // STORAGE_CLIENT</span>
              <span className="ml-1 tracking-wider xs:hidden">IMGLINK</span>
            </div>
            <span className="px-2 py-0.5 bg-black text-white text-[10px] tracking-widest font-black">
              {isUploading ? 'UPLOADING' : 'ONLINE'}
            </span>
          </div>

          {isUploading && progress ? (
            /* Uploading Progress State */
            <div className="py-4 px-2 max-w-lg mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-neo-cyan border-[3px] border-black shadow-brutal flex items-center justify-center text-black">
                  {progress.stage === 'completed' ? (
                    <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-black stroke-[3]" />
                  ) : (
                    <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin text-black stroke-[3]" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black truncate px-2 sm:px-4">
                  {selectedFileName || 'UPLOADING FILE...'}
                </h3>
                <p className="font-mono font-bold text-xs uppercase text-black/80">
                  {progress.statusText}
                </p>
              </div>

              {/* Chunky Brutalist Progress Bar */}
              <div className="w-full bg-white border-[3px] border-black h-7 sm:h-8 p-1 shadow-brutal overflow-hidden">
                <div
                  className={`h-full border-r-2 border-black transition-all duration-200 ${
                    progress.stage === 'completed' ? 'bg-neo-lime' : 'bg-neo-cyan'
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono font-black text-black">
                <span className="truncate max-w-[200px]">
                  {progress.loadedBytes > 0
                    ? `${formatBytes(progress.loadedBytes)} / ${formatBytes(progress.totalBytes)}`
                    : 'INITIALIZING'}
                </span>
                <span className="px-2 py-0.5 bg-black text-white flex-shrink-0">{progress.percent}%</span>
              </div>
            </div>
          ) : (
            /* Ready to Upload State */
            <div className="flex flex-col items-center justify-center gap-4 sm:gap-5 py-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neo-yellow group-hover:bg-neo-pink border-[3px] border-black shadow-brutal flex items-center justify-center text-black group-hover:rotate-6 group-hover:scale-105 transition-all">
                <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-black leading-snug">
                  <span className="hidden sm:inline">Drag & Drop Image Here, or </span>
                  <span className="sm:hidden">Tap to Upload or </span>
                  <span className="bg-neo-cyan px-2 py-0.5 border-2 border-black shadow-brutal-sm inline-block -rotate-1">
                    Browse
                  </span>
                </h3>
                <p className="hidden sm:block font-mono text-xs font-bold text-black/80">
                  Clipboard paste supported:{' '}
                  <kbd className="px-2 py-1 bg-neo-pink text-black border-2 border-black text-xs font-mono font-black shadow-brutal-sm">
                    CTRL + V
                  </kbd>{' '}
                  or{' '}
                  <kbd className="px-2 py-1 bg-neo-cyan text-black border-2 border-black text-xs font-mono font-black shadow-brutal-sm">
                    ⌘ + V
                  </kbd>
                </p>
                <p className="sm:hidden font-mono text-xs font-bold text-black/80">
                  Tap to select from photos, files, or camera
                </p>
              </div>

              {/* Neo-brutalist Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-neo-yellow border-2 border-black font-mono font-black text-[11px] sm:text-xs uppercase text-black shadow-brutal-sm -rotate-1 hover:scale-105 transition-transform">
                  <ImageIcon className="w-3.5 h-3.5" />
                  PNG, JPG, WEBP, GIF
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-neo-lime border-2 border-black font-mono font-black text-[11px] sm:text-xs uppercase text-black shadow-brutal-sm rotate-1 hover:scale-105 transition-transform">
                  <FileUp className="w-3.5 h-3.5" />
                  MAX 10MB
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-neo-cyan border-2 border-black font-mono font-black text-[11px] sm:text-xs uppercase text-black shadow-brutal-sm -rotate-1 hover:scale-105 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                  DIRECT S3 PRESIGNED
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
