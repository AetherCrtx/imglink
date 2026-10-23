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
} from 'lucide-react';
import type { ImageRecord, UploadProgress } from '../types';
import { formatBytes } from '../utils/formatters';

interface UploadZoneProps {
  onUploadSuccess: (image: ImageRecord) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadZone: React.FC<UploadZoneProps> = ({
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
      return `Unsupported format "${file.type || 'unknown'}". Allowed: JPG, PNG, WebP, GIF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatBytes(file.size)}) exceeds the 10MB maximum limit.`;
    }
    return null;
  };

  const processUpload = useCallback(
    async (file: File) => {
      setValidationError(null);
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
        statusText: 'Requesting secure direct-upload authorization...',
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

        // Step 2: Upload directly to Backblaze B2 using PUT
        setProgress({
          stage: 'uploading',
          percent: 20,
          loadedBytes: 0,
          totalBytes: file.size,
          statusText: 'Transferring directly to cloud storage...',
        });

        await axios.put(uploadUrl, file, {
          headers: {
            'Content-Type': file.type,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const uploadFraction = progressEvent.loaded / progressEvent.total;
              // Map from 20% to 85%
              const currentPercent = Math.min(
                85,
                Math.round(20 + uploadFraction * 65)
              );
              setProgress({
                stage: 'uploading',
                percent: currentPercent,
                loadedBytes: progressEvent.loaded,
                totalBytes: progressEvent.total,
                statusText: `Uploading... ${Math.round(uploadFraction * 100)}% (${formatBytes(
                  progressEvent.loaded
                )} / ${formatBytes(progressEvent.total)})`,
              });
            }
          },
        });

        // Step 3: Save metadata to Neon PostgreSQL
        setProgress({
          stage: 'saving-metadata',
          percent: 90,
          loadedBytes: file.size,
          totalBytes: file.size,
          statusText: 'Finalizing database record...',
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
          statusText: 'Upload completed successfully!',
        });

        // Brief delay for visual completion before revealing result
        setTimeout(() => {
          setIsUploading(false);
          setProgress(null);
          onUploadSuccess(metadataResponse.data);
        }, 500);
      } catch (err: unknown) {
        setIsUploading(false);
        let detailMessage = 'An unexpected error occurred during upload.';
        if (axios.isAxiosError(err)) {
          if (err.response?.data?.error) {
            detailMessage = err.response.data.error;
          } else if (err.message.includes('Network Error')) {
            detailMessage =
              'Network/CORS error while connecting to Backblaze B2. Check bucket CORS settings.';
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
          statusText: 'Upload failed',
          error: detailMessage,
        });
        setValidationError(detailMessage);
      }
    },
    [onUploadSuccess, setIsUploading]
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
            // Assign meaningful name for pasted screenshot if generic
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

  // Drag and Drop handlers
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
      const droppedFile = e.dataTransfer.files[0];
      processUpload(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      processUpload(selected);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Validation / Error Banner */}
      {validationError && (
        <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {validationError}
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-red-400/80 hover:text-red-300 transition-colors p-1 rounded-lg"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative group rounded-2xl border-2 border-dashed p-8 md:p-12 transition-all duration-300 text-center cursor-pointer select-none overflow-hidden ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10 scale-[1.01]'
            : isUploading
            ? 'border-zinc-700 bg-zinc-900/60 cursor-wait'
            : 'border-zinc-700/80 hover:border-brand-500/60 bg-zinc-900/40 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-brand-500/5'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/5 via-transparent to-indigo-600/5 pointer-events-none" />

        {isUploading && progress ? (
          /* Active Upload State */
          <div className="py-4 px-2 max-w-lg mx-auto">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  {progress.stage === 'completed' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-zinc-100 mb-1 truncate px-4">
              {selectedFileName || 'Uploading file...'}
            </h3>
            <p className="text-sm text-zinc-400 mb-6 font-medium">
              {progress.statusText}
            </p>

            {/* Real-time Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-3 p-0.5 overflow-hidden border border-zinc-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  progress.stage === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-zinc-400 font-mono">
              <span>
                {progress.loadedBytes > 0
                  ? `${formatBytes(progress.loadedBytes)} / ${formatBytes(
                      progress.totalBytes
                    )}`
                  : 'Preparing transfer'}
              </span>
              <span className="font-semibold text-zinc-200">
                {progress.percent}%
              </span>
            </div>
          </div>
        ) : (
          /* Idle / Ready to Upload State */
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="w-20 h-20 rounded-3xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 group-hover:text-brand-400 group-hover:border-brand-500/40 group-hover:scale-110 transition-all duration-300 shadow-inner">
              <UploadCloud className="w-10 h-10 transition-transform group-hover:-translate-y-1" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-bold text-zinc-100">
                Drag & drop your image here, or{' '}
                <span className="text-brand-400 underline decoration-brand-500/40 underline-offset-4 group-hover:decoration-brand-400">
                  browse
                </span>
              </h3>
              <p className="text-sm text-zinc-400">
                Supports direct clipboard paste with{' '}
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">
                  Ctrl + V
                </kbd>{' '}
                or{' '}
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">
                  ⌘ + V
                </kbd>
              </p>
            </div>

            {/* Badges / Specs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
                JPEG, PNG, WebP, GIF
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                Max 10MB
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Direct S3 Presigned
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
