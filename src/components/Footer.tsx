import React from 'react';
import { Layers, ShieldCheck, Sparkles, Zap } from 'lucide-react';

interface FooterProps {
  onOpenLegal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="border-t-[4px] border-black bg-white mt-20 shadow-brutal-sm">
      {/* Neo-brutalist Multi-Color Accent Strip */}
      <div className="w-full h-3.5 border-b-[3px] border-black flex">
        <div className="flex-1 bg-neo-yellow" />
        <div className="flex-1 bg-neo-pink" />
        <div className="flex-1 bg-neo-cyan" />
        <div className="flex-1 bg-neo-lime" />
        <div className="flex-1 bg-neo-purple" />
        <div className="flex-1 bg-neo-orange" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-mono font-black text-sm uppercase text-black bg-neo-yellow px-2.5 py-1 border-2 border-black shadow-brutal-sm -rotate-1">
              IMGLINK
            </span>
            <span className="font-mono text-xs font-black text-black">
              DIRECT HIGH-SPEED IMAGE HOSTING & SHARING
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono font-black text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-cyan border-2 border-black text-black shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
              FAST DIRECT UPLOADS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-lime border-2 border-black text-black shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              INSTANT EMBED LINKS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-purple border-2 border-black text-white shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              GOOGLE VERIFIED
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-pink border-2 border-black text-black shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <Sparkles className="w-3.5 h-3.5 fill-black stroke-black" />
              UNLIMITED PRO TIER
            </span>
          </div>
        </div>

        {/* Legal & Compliance Navigation Row */}
        <div className="border-t-2 border-black pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="font-mono text-[11px] font-bold text-black/70">
            imglink.web.id // Private Cloud Asset Vault // All Rights Reserved
          </span>
          <div className="flex items-center gap-4 font-mono text-[11px] font-black uppercase text-black">
            <button
              onClick={onOpenLegal}
              className="hover:underline hover:text-neo-pink transition-colors"
            >
              Terms of Service
            </button>
            <span>//</span>
            <button
              onClick={onOpenLegal}
              className="hover:underline hover:text-neo-pink transition-colors"
            >
              Acceptable Use
            </button>
            <span>//</span>
            <button
              onClick={onOpenLegal}
              className="hover:underline hover:text-neo-pink transition-colors"
            >
              DMCA & Liability
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
