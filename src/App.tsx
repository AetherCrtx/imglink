import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadZone } from './components/UploadZone';
import { ResultCard } from './components/ResultCard';
import { RecentUploads } from './components/RecentUploads';
import { AuthModal } from './components/AuthModal';
import type { ImageRecord, AuthUser } from './types';
import { initializeAuth, clearAuthSession, setAuthSession } from './utils/auth';
import { Sparkles, ArrowDown, ShieldCheck, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine'>('all');

  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(true);
  const [activeResult, setActiveResult] = useState<ImageRecord | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize Auth on page load
  useEffect(() => {
    const existing = initializeAuth();
    if (existing) {
      setUser(existing);
    }

    // Check with backend (validates Neon Auth Google session and JWT)
    axios
      .get<{ user: AuthUser; token?: string }>('/api/auth')
      .then((res) => {
        if (res.data.user) {
          setUser(res.data.user);
          if (res.data.token) {
            setAuthSession(res.data.token, res.data.user);
          }
        }
      })
      .catch(() => {
        if (!existing) {
          clearAuthSession();
          setUser(null);
        }
      });
  }, []);

  const fetchRecentImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const response = await axios.get<ImageRecord[]>('/api/images', {
        params: { filter: activeFilter },
      });
      if (Array.isArray(response.data)) {
        setImages(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchRecentImages();
  }, [fetchRecentImages]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setActionNotice({
      message: `WELCOME, ${authenticatedUser.name.toUpperCase()}!`,
      type: 'success',
    });
    setTimeout(() => setActionNotice(null), 3500);
    fetchRecentImages();
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setActiveFilter('all');
    setActionNotice({
      message: 'LOGGED OUT SUCCESSFULLY.',
      type: 'success',
    });
    setTimeout(() => setActionNotice(null), 3500);
    fetchRecentImages();
  };

  const handleUploadSuccess = (newImage: ImageRecord) => {
    setActiveResult(newImage);
    setImages((prev) => [newImage, ...prev.filter((img) => img.id !== newImage.id)]);
    setActionNotice({
      message: `UPLOAD COMPLETE: "${newImage.originalName.toUpperCase()}"`,
      type: 'success',
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteImage = async (id: string, fileKey: string) => {
    try {
      await axios.delete('/api/images', {
        params: { id, fileKey },
      });

      setImages((prev) => prev.filter((img) => img.id !== id));
      if (activeResult?.id === id) {
        setActiveResult(null);
      }

      setActionNotice({
        message: 'IMAGE DELETED FROM STORAGE & DATABASE.',
        type: 'success',
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: unknown) {
      let detail = 'FAILED TO DELETE IMAGE.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        if (typeof data.error === 'string') {
          detail = data.error.toUpperCase();
        } else if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
          detail = data.error.message.toUpperCase();
        } else if (typeof data.message === 'string') {
          detail = data.message.toUpperCase();
        }
      }
      setActionNotice({
        message: detail,
        type: 'error',
      });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-neo-yellow selection:text-black">
      <Header
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Neo-brutalist Infinite Ticker Tape */}
      <div className="bg-neo-yellow border-b-[3px] border-black overflow-hidden py-2 select-none">
        <div className="flex w-max animate-marquee space-x-6 text-xs font-mono font-black uppercase tracking-wider text-black">
          {[1, 2].map((k) => (
            <div key={k} className="flex items-center space-x-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neo-pink text-black border-2 border-black shadow-brutal-sm rotate-1">
                ⚡ 100% PRIVATE NEON STORAGE
              </span>
              <span>✦</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neo-cyan text-black border-2 border-black shadow-brutal-sm -rotate-1">
                ★ GOOGLE OAUTH READY
              </span>
              <span>✦</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neo-lime text-black border-2 border-black shadow-brutal-sm rotate-2">
                ⚡ DIRECT PRESIGNED S3 UPLOAD
              </span>
              <span>✦</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neo-purple text-white border-2 border-black shadow-brutal-sm -rotate-1">
                ★ 10MB ULTRA-FAST PIPELINE
              </span>
              <span>✦</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neo-orange text-black border-2 border-black shadow-brutal-sm rotate-1">
                ⚡ INSTANT SHORT & EMBED URLS
              </span>
              <span>✦</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white text-black border-2 border-black shadow-brutal-sm -rotate-2">
                ★ CLIPBOARD PASTE CTRL+V
              </span>
              <span>✦</span>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 space-y-8 sm:space-y-12">
        {/* Floating Neo-Brutalist Toast */}
        {actionNotice && (
          <div
            className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 px-4 py-3 sm:px-5 sm:py-3.5 border-[3px] border-black font-mono font-black text-xs uppercase shadow-brutal-lg animate-fadeIn flex items-center gap-2.5 ${
              actionNotice.type === 'success'
                ? 'bg-neo-lime text-black'
                : 'bg-neo-pink text-black'
            }`}
          >
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* Hero Section (Neo-Brutalism) */}
        <section className="text-center space-y-4 sm:space-y-5 pt-1 sm:pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-neo-cyan border-[3px] border-black font-mono font-black text-[10px] sm:text-xs uppercase text-black shadow-brutal-sm sm:shadow-brutal -rotate-1 hover:rotate-1 transition-transform">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
            <span>DIRECT NEON S3 PRESIGNED // ZERO BOTTLENECK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-black leading-tight sm:leading-none max-w-4xl mx-auto px-1">
            Convert Any Image into a{' '}
            <span className="bg-neo-yellow px-2 py-0.5 border-[3px] border-black inline-block shadow-brutal-sm sm:shadow-brutal my-1 -rotate-1">
              Shareable URL
            </span>{' '}
            <span className="bg-neo-pink px-2 py-0.5 border-[3px] border-black inline-block shadow-brutal-sm sm:shadow-brutal my-1 rotate-1">
              Instantly.
            </span>
          </h1>

          <p className="font-mono text-xs sm:text-sm font-bold text-black/80 max-w-xl mx-auto leading-relaxed px-2">
            Ultra-fast direct-to-cloud upload to Neon Object Storage private bucket. Instant short URLs, Markdown/HTML embed snippets, and serverless database indexing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 bg-neo-lime border-2 border-black font-mono font-black text-[11px] sm:text-xs uppercase text-black shadow-brutal-sm -rotate-1 hover:scale-105 transition-transform">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-black" />
              10MB MAX PER FILE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 bg-neo-cyan border-2 border-black font-mono font-black text-[11px] sm:text-xs uppercase text-black shadow-brutal-sm rotate-1 hover:scale-105 transition-transform">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              PRIVATE OBJECT STORAGE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 bg-neo-purple border-2 border-black font-mono font-black text-[11px] sm:text-xs uppercase text-white shadow-brutal-sm -rotate-1 hover:scale-105 transition-transform">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
              NEON POSTGRESQL DB
            </span>
          </div>
        </section>

        {/* Upload & Result Stage */}
        <section className="space-y-6">
          {activeResult ? (
            <ResultCard
              image={activeResult}
              onUploadAnother={() => setActiveResult(null)}
            />
          ) : (
            <UploadZone
              user={user}
              onOpenAuth={handleOpenAuth}
              onUploadSuccess={handleUploadSuccess}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          )}
        </section>

        {/* Divider with Neo-brutalist Tag */}
        <div className="relative py-3 sm:py-4 flex items-center justify-center">
          <div className="w-full border-t-[3px] border-black" />
          <div className="absolute px-3.5 py-1 sm:px-5 sm:py-1.5 bg-neo-pink border-[3px] border-black font-mono font-black text-[11px] sm:text-xs uppercase text-black shadow-brutal-sm sm:shadow-brutal flex items-center gap-2 -rotate-1 hover:rotate-1 transition-transform">
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span>GALLERY & ARCHIVE</span>
          </div>
        </div>

        {/* Gallery History */}
        <section>
          <RecentUploads
            images={images}
            isLoading={isLoadingImages}
            onRefresh={fetchRecentImages}
            onDelete={handleDeleteImage}
            user={user}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </section>
      </main>

      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default App;
