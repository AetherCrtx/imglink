import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  PlusCircle,
  FileCode,
  Globe,
  Code2,
  Sparkles,
} from 'lucide-react';
import type { ImageRecord } from '../types';
import { formatBytes, getPublicViewUrl } from '../utils/formatters';

interface ResultCardProps {
  image: ImageRecord;
  onUploadAnother: () => void;
}

type SnippetType = 'direct' | 'markdown' | 'html';

export const ResultCard: React.FC<ResultCardProps> = ({
  image,
  onUploadAnother,
}) => {
  const [copiedType, setCopiedType] = useState<SnippetType | null>(null);
  const [activeTab, setActiveTab] = useState<SnippetType>('direct');
  const [imageLoaded, setImageLoaded] = useState(false);

  const publicUrl = getPublicViewUrl(image.fileKey);

  const snippets: Record<SnippetType, { label: string; value: string; icon: React.ReactNode }> = {
    direct: {
      label: 'Direct Link',
      value: publicUrl,
      icon: <Globe className="w-4 h-4" />,
    },
    markdown: {
      label: 'Markdown',
      value: `![${image.originalName}](${publicUrl})`,
      icon: <FileCode className="w-4 h-4" />,
    },
    html: {
      label: 'HTML Embed',
      value: `<img src="${publicUrl}" alt="${image.originalName}" />`,
      icon: <Code2 className="w-4 h-4" />,
    },
  };

  const handleCopy = async (type: SnippetType, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => {
        setCopiedType((prev) => (prev === type ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Image Uploaded Successfully!
            </h3>
            <p className="text-xs text-zinc-400">
              Your image is securely stored and ready to share instantly.
            </p>
          </div>
        </div>

        <button
          onClick={onUploadAnother}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-all duration-200 border border-zinc-700 hover:border-zinc-600 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-brand-400" />
          Upload Another
        </button>
      </div>

      {/* Main Content Grid: Preview + Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left: Image Preview & Details */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative group aspect-video md:aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-950/80 border border-zinc-800 flex items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm animate-pulse">
                Loading preview...
              </div>
            )}

            <img
              src={publicUrl}
              alt={image.originalName}
              onLoad={() => setImageLoaded(true)}
              className={`max-h-full max-w-full object-contain transition-opacity duration-300 z-10 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-zinc-300 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-white/10"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1">
            <span className="truncate max-w-[200px] font-medium text-zinc-300">
              {image.originalName}
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                {image.mimeType.replace('image/', '')}
              </span>
              <span>{formatBytes(image.sizeBytes)}</span>
            </div>
          </div>
        </div>

        {/* Right: Snippet Selector & Copy Buttons */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            {/* Snippet Format Tabs */}
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              {(Object.keys(snippets) as SnippetType[]).map((type) => {
                const item = snippets[type];
                const isActive = activeTab === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Snippet Output Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
                <span>{snippets[activeTab].label}</span>
                <span className="text-zinc-500">Click copy to save to clipboard</span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={snippets[activeTab].value}
                  className="w-full bg-zinc-950 text-zinc-200 text-sm font-mono rounded-xl pl-4 pr-28 py-3.5 border border-zinc-800 focus:outline-none focus:border-brand-500/60 select-all transition-colors"
                />
                <button
                  onClick={() => handleCopy(activeTab, snippets[activeTab].value)}
                  className={`absolute right-2 top-2 bottom-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                    copiedType === activeTab
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-600 hover:bg-brand-500 text-white active:scale-95 shadow-md shadow-brand-600/20'
                  }`}
                >
                  {copiedType === activeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Access to other snippets */}
            <div className="pt-2 space-y-2.5">
              {(Object.keys(snippets) as SnippetType[])
                .filter((type) => type !== activeTab)
                .map((type) => {
                  const item = snippets[type];
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden pr-3">
                        <span className="text-zinc-400">{item.icon}</span>
                        <span className="text-xs font-medium text-zinc-400">
                          {item.label}:
                        </span>
                        <span className="text-xs text-zinc-300 font-mono truncate">
                          {item.value}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(type, item.value)}
                        className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                          copiedType === type
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {copiedType === type ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Open in new browser tab
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
