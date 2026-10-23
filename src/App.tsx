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
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        detail = err.response.data.error.toUpperCase();
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* Floating Neo-Brutalist Toast */}
        {actionNotice && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 border-[3px] border-black font-mono font-black text-xs uppercase shadow-brutal-lg animate-fadeIn flex items-center gap-2.5 ${
              actionNotice.type === 'success'
                ? 'bg-neo-green text-black'
                : 'bg-neo-pink text-black'
            }`}
          >
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* Hero Section (Neo-Brutalism) */}
        <section className="text-center space-y-5 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neo-yellow border-[3px] border-black font-mono font-black text-xs uppercase shadow-brutal -rotate-1">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>DIRECT S3 PRESIGNED // ZERO PAYLOAD BOTTLENECK</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-black leading-none max-w-4xl mx-auto">
            Convert Any Image into a{' '}
            <span className="bg-neo-yellow px-2 border-[3px] border-black inline-block shadow-brutal my-1">
              Shareable URL
            </span>{' '}
            Instantly.
          </h1>

          <p className="font-mono text-xs sm:text-sm font-bold text-black/80 max-w-xl mx-auto leading-relaxed">
            High-speed direct-to-cloud upload to Backblaze B2 private bucket storage. Instant
            short URLs, embed snippets, and serverless Neon database indexing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black font-mono font-black text-xs uppercase shadow-brutal-sm">
              <Zap className="w-3.5 h-3.5 fill-black" />
              10MB MAX PER FILE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black font-mono font-black text-xs uppercase shadow-brutal-sm">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              PRIVATE BUCKET GATEWAY
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
        <div className="relative py-4 flex items-center justify-center">
          <div className="w-full border-t-[3px] border-black" />
          <div className="absolute px-4 py-1 bg-neo-yellow border-2 border-black font-mono font-black text-xs uppercase shadow-brutal-sm flex items-center gap-1.5">
            <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
            <span>ARCHIVE & RECENT UPLOADS</span>
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
