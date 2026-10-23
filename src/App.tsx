import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadZone } from './components/UploadZone';
import { ResultCard } from './components/ResultCard';
import { RecentUploads } from './components/RecentUploads';
import type { ImageRecord } from './types';
import { Sparkles, ArrowDown } from 'lucide-react';

export const App: React.FC = () => {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(true);
  const [activeResult, setActiveResult] = useState<ImageRecord | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRecentImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const response = await axios.get<ImageRecord[]>('/api/images');
      if (Array.isArray(response.data)) {
        setImages(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentImages();
  }, [fetchRecentImages]);

  const handleUploadSuccess = (newImage: ImageRecord) => {
    setActiveResult(newImage);
    setImages((prev) => [newImage, ...prev.filter((img) => img.id !== newImage.id)]);
    setActionNotice({
      message: `"${newImage.originalName}" uploaded successfully!`,
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
        message: 'Image deleted from storage and database.',
        type: 'success',
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: unknown) {
      let detail = 'Failed to delete image.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        detail = err.response.data.error;
      }
      setActionNotice({
        message: detail,
        type: 'error',
      });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-200">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* Floating Notification Toast */}
        {actionNotice && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10'
                : 'bg-red-950/90 border-red-500/40 text-red-200 shadow-red-500/10'
            }`}
          >
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>High-Speed Direct-to-Cloud Uploads</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Turn Any Image into a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-sky-400">
              Shareable URL
            </span>{' '}
            Instantly
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Directly upload to Backblaze B2 private storage with zero server payload bottlenecks.
            Get permanent short links, Markdown, and HTML embed snippets in one click.
          </p>
        </section>

        {/* Upload & Result Area */}
        <section className="space-y-6">
          {activeResult ? (
            <ResultCard
              image={activeResult}
              onUploadAnother={() => setActiveResult(null)}
            />
          ) : (
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          )}
        </section>

        {/* Divider with anchor cue */}
        <div className="relative py-2 flex items-center justify-center">
          <div className="w-full border-t border-zinc-800/80" />
          <div className="absolute px-3 bg-zinc-950 text-zinc-500 text-xs font-medium flex items-center gap-1.5">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Your Gallery History</span>
          </div>
        </div>

        {/* Recent Uploads Section */}
        <section>
          <RecentUploads
            images={images}
            isLoading={isLoadingImages}
            onRefresh={fetchRecentImages}
            onDelete={handleDeleteImage}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;
