import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Trash2,
  RefreshCw,
  Clock,
  HardDrive,
  ImageIcon,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { ImageRecord } from '../types';
import { formatBytes, formatRelativeDate, getPublicViewUrl } from '../utils/formatters';

interface RecentUploadsProps {
  images: ImageRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: string, fileKey: string) => Promise<void>;
}

export const RecentUploads: React.FC<RecentUploadsProps> = ({
  images,
  isLoading,
  onRefresh,
  onDelete,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCopyLink = async (image: ImageRecord) => {
    try {
      const url = getPublicViewUrl(image.fileKey);
      await navigator.clipboard.writeText(url);
      setCopiedId(image.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === image.id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDeleteClick = async (image: ImageRecord) => {
    if (confirmDeleteId !== image.id) {
      setConfirmDeleteId(image.id);
      // Auto-reset confirmation after 4 seconds if not clicked again
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === image.id ? null : prev));
      }, 4000);
      return;
    }

    try {
      setDeletingId(image.id);
      setConfirmDeleteId(null);
      await onDelete(image.id, image.fileKey);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            Recent Uploads
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 border border-zinc-700 transition-all disabled:opacity-50"
          title="Refresh gallery"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : ''}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && images.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3 animate-pulse"
            >
              <div className="aspect-[4/3] rounded-xl bg-zinc-800/60" />
              <div className="h-4 bg-zinc-800/80 rounded w-3/4" />
              <div className="flex justify-between">
                <div className="h-3 bg-zinc-800/60 rounded w-1/4" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && images.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-500">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-zinc-300 mb-1">
            No images uploaded yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Upload your first image using drag & drop or clipboard paste above to see it here.
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => {
            const publicUrl = getPublicViewUrl(image.fileKey);
            const isDeleting = deletingId === image.id;
            const isConfirming = confirmDeleteId === image.id;
            const isCopied = copiedId === image.id;

            return (
              <div
                key={image.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/20"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />
                  <img
                    src={publicUrl}
                    alt={image.originalName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top-Right Quick External Link */}
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-zinc-300 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white/10"
                    title="Open full view"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Format Pill */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/10 uppercase">
                    {image.mimeType.replace('image/', '')}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4
                      className="text-sm font-semibold text-zinc-200 truncate"
                      title={image.originalName}
                    >
                      {image.originalName}
                    </h4>

                    {/* Metadata line */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-zinc-500" />
                        {formatBytes(image.sizeBytes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {formatRelativeDate(image.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(image)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        isCopied
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Delete Button with Confirmation */}
                    <button
                      onClick={() => handleDeleteClick(image)}
                      disabled={isDeleting}
                      title={isConfirming ? 'Click again to confirm delete' : 'Delete image'}
                      className={`p-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isConfirming
                          ? 'bg-red-600 text-white animate-pulse px-2 flex items-center gap-1'
                          : 'bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/30'
                      }`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : isConfirming ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
