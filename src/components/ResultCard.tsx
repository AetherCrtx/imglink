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
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import type { ImageRecord, SupportedOutputFormat } from '../types';
import { formatBytes, getPublicViewUrl } from '../utils/formatters';
import {
  DEFAULT_CONVERSION_SETTINGS,
  OUTPUT_FORMATS,
  convertImageFile,
} from '../utils/imageConverter';

interface ResultCardProps {
  image: ImageRecord;
  onUploadAnother: () => void;
  onOpenInConverter?: (file: File) => void;
}

type SnippetType = 'direct' | 'markdown' | 'html';

export const ResultCard: React.FC<ResultCardProps> = ({
  image,
  onUploadAnother,
  onOpenInConverter,
}) => {
  const [copiedType, setCopiedType] = useState<SnippetType | null>(null);
  const [activeTab, setActiveTab] = useState<SnippetType>('direct');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [convertingFormat, setConvertingFormat] = useState<SupportedOutputFormat | null>(null);
  const [openingStudio, setOpeningStudio] = useState(false);

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

  const fetchImageAsFile = async (): Promise<File> => {
    const response = await fetch(publicUrl);
    const blob = await response.blob();
    return new File([blob], image.originalName || image.fileKey, {
      type: image.mimeType || blob.type || 'image/png',
    });
  };

  const handleQuickConvertDownload = async (format: SupportedOutputFormat) => {
    try {
      setConvertingFormat(format);
      const sourceFile = await fetchImageAsFile();
      const converted = await convertImageFile(sourceFile, {
        ...DEFAULT_CONVERSION_SETTINGS,
        targetFormat: format,
      });

      const a = document.createElement('a');
      a.href = converted.url;
      a.download = converted.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(converted.url), 3000);
    } catch (err) {
      console.error('Quick format download failed:', err);
    } finally {
      setConvertingFormat(null);
    }
  };

  const handleOpenStudio = async () => {
    if (!onOpenInConverter) return;
    try {
      setOpeningStudio(true);
      const sourceFile = await fetchImageAsFile();
      onOpenInConverter(sourceFile);
    } catch (err) {
      console.error('Failed to load image into Converter Studio:', err);
    } finally {
      setOpeningStudio(false);
    }
  };

  return (
    <div className="w-full bg-white border-[4px] border-black shadow-brutal-xl overflow-hidden animate-fadeIn">
      {/* Neo-brutalist Window Header */}
      <div className="bg-neo-lime border-b-[3px] border-black px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-neo-red border-2 border-black rounded-full inline-block" />
          <span className="w-3.5 h-3.5 bg-neo-yellow border-2 border-black rounded-full inline-block" />
          <span className="w-3.5 h-3.5 bg-neo-cyan border-2 border-black rounded-full inline-block" />
          <span className="font-mono font-black text-xs uppercase tracking-wider text-black ml-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 fill-black" />
            <span className="hidden sm:inline">CLOUD ASSET DEPLOYED · READY TO SHARE</span>
            <span className="sm:hidden">READY TO SHARE</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInConverter && (
            <button
              onClick={handleOpenStudio}
              disabled={openingStudio}
              className="min-h-[38px] px-3 py-1.5 bg-neo-cyan hover:bg-white border-2 border-black font-mono font-black uppercase text-xs text-black shadow-brutal-sm transition-all flex items-center gap-1.5"
            >
              {openingStudio ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>Edit / Convert</span>
            </button>
          )}

          <button
            onClick={onUploadAnother}
            className="min-h-[38px] px-3 py-1.5 bg-neo-yellow hover:bg-neo-pink border-2 border-black font-black uppercase text-xs text-black shadow-brutal-sm transition-all flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 flex-shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              <span className="hidden xs:inline">Upload </span>Another
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left: Image Preview & Details */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-video lg:aspect-[4/3] w-full bg-neo-bg border-[3px] border-black shadow-brutal overflow-hidden flex items-center justify-center p-2">
            {!imageLoaded && (
              <div className="font-mono font-bold text-xs uppercase text-black/60 animate-pulse">
                Rendering preview...
              </div>
            )}
            <img
              src={publicUrl}
              alt={image.originalName}
              onLoad={() => setImageLoaded(true)}
              className={`max-h-full max-w-full object-contain border-2 border-black/10 transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 p-2 bg-neo-cyan hover:bg-neo-yellow border-2 border-black text-black shadow-brutal-sm transition-all"
              title="Open full view"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>

          {/* Details Bar */}
          <div className="p-3 bg-neo-cyan/10 border-2 border-black shadow-brutal-sm flex items-center justify-between font-mono text-xs tabular-nums">
            <span className="font-black text-black truncate max-w-[140px] sm:max-w-[200px]">
              {image.originalName}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-neo-yellow border border-black font-black uppercase text-[10px] text-black">
                {image.mimeType.replace('image/', '').replace('+xml', '')}
              </span>
              <span className="font-bold text-black">{formatBytes(image.sizeBytes)}</span>
            </div>
          </div>

          {/* 1-Click Format Convert & Download Strip */}
          <div className="p-3 bg-neo-bg border-2 border-black space-y-2">
            <span className="font-mono font-black text-[11px] uppercase text-black flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instant Convert & Download As:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {OUTPUT_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleQuickConvertDownload(fmt.id)}
                  disabled={convertingFormat !== null}
                  className="px-2 py-1 bg-white hover:bg-neo-yellow border border-black font-mono font-black text-[10px] uppercase text-black shadow-brutal-sm flex items-center gap-1 transition-all"
                >
                  {convertingFormat === fmt.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    `.${fmt.extension}`
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Snippet Selector & Copy Buttons */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Format Switcher with Distinct Tab Colors */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-neo-bg border-[3px] border-black shadow-brutal-sm">
              {(Object.keys(snippets) as SnippetType[]).map((type) => {
                const item = snippets[type];
                const isActive = activeTab === type;
                const tabColor =
                  type === 'direct'
                    ? 'bg-neo-yellow'
                    : type === 'markdown'
                    ? 'bg-neo-cyan'
                    : 'bg-neo-pink';

                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`min-h-[42px] py-2 px-1.5 sm:px-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      isActive
                        ? `${tabColor} text-black border-2 border-black shadow-brutal-sm`
                        : 'bg-transparent text-black hover:bg-black/10 border-2 border-transparent'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate text-[11px] sm:text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Snippet Output */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                {snippets[activeTab].label} Output
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={snippets[activeTab].value}
                  className="flex-1 bg-white border-[3px] border-black font-mono text-sm px-4 py-3 shadow-brutal-sm focus:outline-none select-all text-black"
                />
                <button
                  onClick={() => handleCopy(activeTab, snippets[activeTab].value)}
                  className={`w-full sm:w-auto min-h-[46px] px-6 py-3 border-[3px] border-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 shadow-brutal hover:shadow-brutal-lg flex-shrink-0 ${
                    copiedType === activeTab
                      ? 'bg-neo-lime text-black'
                      : 'bg-neo-yellow hover:bg-neo-cyan text-black'
                  }`}
                >
                  {copiedType === activeTab ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[3]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Other Snippets Quick Cards */}
            <div className="space-y-2 pt-2">
              {(Object.keys(snippets) as SnippetType[])
                .filter((type) => type !== activeTab)
                .map((type) => {
                  const item = snippets[type];
                  return (
                    <div
                      key={type}
                      className="p-2.5 sm:p-3 bg-white border-2 border-black shadow-brutal-sm flex items-center justify-between gap-2 sm:gap-3"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                        <span className="p-1 bg-neo-bg border border-black flex-shrink-0">
                          {item.icon}
                        </span>
                        <span className="font-mono font-bold text-xs uppercase text-black flex-shrink-0">
                          {item.label}:
                        </span>
                        <span className="font-mono text-xs text-black/70 truncate">
                          {item.value}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(type, item.value)}
                        className={`flex-shrink-0 min-h-[38px] sm:min-h-[32px] px-3 py-1.5 border-2 border-black font-mono font-black text-xs uppercase transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 ${
                          copiedType === type
                            ? 'bg-neo-lime text-black'
                            : 'bg-white hover:bg-neo-yellow text-black'
                        }`}
                      >
                        {copiedType === type ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] inline-flex items-center gap-1.5 font-mono font-black text-xs uppercase text-black hover:bg-neo-yellow px-2.5 py-1.5 border-2 border-black shadow-brutal-sm transition-all"
            >
              <span>Open in new window</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
