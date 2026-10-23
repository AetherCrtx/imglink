import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Trash2,
  RefreshCw,
  HardDrive,
  Clock,
  ImageIcon,
  Loader2,
  AlertTriangle,
  UserCheck,
  Lock,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import type { ImageRecord, AuthUser } from '../types';
import { formatBytes, formatRelativeDate, getPublicViewUrl } from '../utils/formatters';

interface RecentUploadsProps {
  images: ImageRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: string, fileKey: string) => Promise<void>;
  user: AuthUser | null;
  activeFilter: 'all' | 'mine';
  setActiveFilter: (filter: 'all' | 'mine') => void;
  onOpenAuth?: () => void;
}

export const RecentUploads: React.FC<RecentUploadsProps> = ({
  images,
  isLoading,
  onRefresh,
  onDelete,
  user,
  activeFilter,
  setActiveFilter,
  onOpenAuth,
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

  const CARD_ACCENT_COLORS = [
    { badge: 'bg-neo-yellow', border: 'border-black', shadow: 'hover:shadow-brutal-yellow' },
    { badge: 'bg-neo-pink', border: 'border-black', shadow: 'hover:shadow-brutal-pink' },
    { badge: 'bg-neo-cyan', border: 'border-black', shadow: 'hover:shadow-brutal-cyan' },
    { badge: 'bg-neo-lime', border: 'border-black', shadow: 'hover:shadow-brutal-green' },
    { badge: 'bg-neo-orange', border: 'border-black', shadow: 'hover:shadow-brutal' },
    { badge: 'bg-neo-purple text-white', border: 'border-black', shadow: 'hover:shadow-brutal' },
  ];

  // If user is unauthenticated, show strict privacy architecture notice
  if (!user) {
    return (
      <div className="w-full bg-white border-[4px] border-black shadow-brutal-lg p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto bg-neo-pink border-[3px] border-black shadow-brutal flex items-center justify-center -rotate-2">
          <Lock className="w-7 h-7 text-black stroke-[2.5]" />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-block px-3 py-0.5 bg-neo-yellow border-2 border-black font-mono font-black text-xs uppercase text-black shadow-brutal-sm">
            STRICT PRIVACY VAULT // NO PUBLIC BROWSING
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            Private Asset Isolation
          </h3>
          <p className="font-mono text-xs text-black/80 leading-relaxed">
            ImgLink enforces zero public directory indexing. Uploaded photos are strictly private to their owner's account and are accessible only via direct CDN links. Other users cannot browse or see your images.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="px-6 py-3 bg-neo-lime hover:bg-neo-yellow active:translate-x-0.5 active:translate-y-0.5 border-[3px] border-black font-mono font-black text-xs sm:text-sm uppercase text-black shadow-brutal transition-all inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4 stroke-[3]" />
          <span>Sign In to Access Your Private Library</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border-[3px] border-black shadow-brutal">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 bg-neo-lime border-2 border-black flex items-center justify-center shadow-brutal-sm -rotate-2">
            <ShieldCheck className="w-4 h-4 stroke-[2.5] text-black" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
              Your Private Vault
            </h2>
            <span className="text-[10px] font-mono font-bold text-black/70 block">
              Accessible only by your account and direct URL holders
            </span>
          </div>
          <span className="px-2.5 sm:px-3 py-0.5 bg-neo-pink border-2 border-black font-mono font-black text-xs text-black shadow-brutal-sm rotate-1 ml-auto sm:ml-2">
            {images.length} {images.length === 1 ? 'FILE' : 'FILES'}
          </span>
        </div>

        {/* Filter & Refresh Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Admin audit toggle only */}
          {user.role === 'admin' && (
            <div className="flex bg-neo-bg border-2 border-black p-0.5 shadow-brutal-sm">
              <button
                onClick={() => setActiveFilter('mine')}
                className={`min-h-[34px] px-2.5 py-1 font-mono font-black text-[11px] uppercase flex items-center gap-1 transition-all ${
                  activeFilter === 'mine'
                    ? 'bg-neo-cyan text-black border-2 border-black shadow-brutal-sm'
                    : 'text-black hover:bg-black/10'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                Mine
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`min-h-[34px] px-2.5 py-1 font-mono font-black text-[11px] uppercase flex items-center transition-all ${
                  activeFilter === 'all'
                    ? 'bg-neo-yellow text-black border-2 border-black shadow-brutal-sm'
                    : 'text-black hover:bg-black/10'
                }`}
              >
                Admin Audit
              </button>
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="min-h-[36px] px-3 sm:px-3.5 py-1.5 bg-neo-lime hover:bg-neo-yellow active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-mono font-black text-xs uppercase text-black shadow-brutal-sm flex items-center gap-1.5 transition-all disabled:opacity-50 flex-shrink-0"
            title="Refresh assets"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 stroke-[2.5] ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && images.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border-[3px] border-black shadow-brutal p-4 space-y-4 animate-pulse"
            >
              <div className="aspect-[4/3] bg-neo-bg border-2 border-black" />
              <div className="h-5 bg-black/10 border border-black/20 w-3/4" />
              <div className="flex justify-between">
                <div className="h-4 bg-black/10 w-1/4" />
                <div className="h-4 bg-black/10 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && images.length === 0 && (
        <div className="text-center py-14 px-4 bg-white border-[4px] border-black shadow-brutal-lg space-y-3">
          <div className="w-14 h-14 mx-auto bg-neo-yellow border-[3px] border-black shadow-brutal flex items-center justify-center text-black -rotate-3">
            <ImageIcon className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-black">
            NO ASSETS IN YOUR VAULT
          </h3>
          <p className="font-mono text-xs text-black/70 font-semibold max-w-sm mx-auto">
            You have not uploaded any images yet. Upload an image above to generate an instant shareable link.
          </p>
        </div>
      )}

      {/* Gallery Cards Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map((image, index) => {
            const publicUrl = getPublicViewUrl(image.fileKey);
            const isDeleting = deletingId === image.id;
            const isConfirming = confirmDeleteId === image.id;
            const isCopied = copiedId === image.id;
            const accent = CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length];

            return (
              <div
                key={image.id}
                className="group relative flex flex-col justify-between bg-white border-[3px] border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-x-1 hover:-translate-y-1 transition-all overflow-hidden"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-[4/3] w-full bg-neo-bg border-b-[3px] border-black overflow-hidden flex items-center justify-center">
                  <img
                    src={publicUrl}
                    alt={image.originalName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Format Sticker with Alternating Neon Colors */}
                  <div
                    className={`absolute top-2 left-2 px-2.5 py-0.5 ${accent.badge} border-2 border-black font-mono font-black text-[10px] shadow-brutal-sm -rotate-2 uppercase`}
                  >
                    {image.mimeType.replace('image/', '')}
                  </div>

                  {/* Top-Right Quick External Link */}
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 min-h-[34px] min-w-[34px] p-1.5 bg-white border-2 border-black text-black hover:bg-neo-cyan shadow-brutal-sm transition-all flex items-center justify-center"
                    title="Open full view"
                  >
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>

                {/* Card Body */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4
                      className="font-black text-sm uppercase text-black truncate tracking-tight"
                      title={image.originalName}
                    >
                      {image.originalName}
                    </h4>

                    {/* Metadata line */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-black/70 mt-1.5 font-bold">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-black" />
                        {formatBytes(image.sizeBytes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-black" />
                        {formatRelativeDate(image.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center gap-2 pt-3 border-t-2 border-black">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(image)}
                      className={`flex-1 min-h-[42px] sm:min-h-[38px] py-2 px-3 border-2 border-black font-mono font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                        isCopied
                          ? 'bg-neo-lime text-black'
                          : 'bg-neo-yellow hover:bg-neo-cyan text-black'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(image)}
                      disabled={isDeleting}
                      title={isConfirming ? 'Click again to confirm delete' : 'Delete image'}
                      className={`min-h-[42px] sm:min-h-[38px] min-w-[42px] sm:min-w-[38px] p-2 border-2 border-black font-mono font-black text-xs uppercase transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center ${
                        isConfirming
                          ? 'bg-neo-red text-white animate-pulse px-2.5 flex items-center gap-1'
                          : 'bg-white hover:bg-neo-pink text-black'
                      }`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                      ) : isConfirming ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
                          <span>CONFIRM?</span>
                        </>
                      ) : (
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
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
