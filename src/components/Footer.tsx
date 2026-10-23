import React from 'react';
import { Layers, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t-[4px] border-black bg-white mt-20 py-8 shadow-brutal-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-sm uppercase text-black bg-neo-yellow px-2 py-0.5 border-2 border-black shadow-brutal-sm">
              SNAPLINK
            </span>
            <span className="font-mono text-xs font-bold text-black/80">
              DIRECT CLOUD IMAGE-TO-URL PLATFORM
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono font-bold text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neo-bg border-2 border-black text-black shadow-brutal-sm">
              <Layers className="w-3.5 h-3.5 text-black" />
              REACT + VITE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neo-bg border-2 border-black text-black shadow-brutal-sm">
              <Shield className="w-3.5 h-3.5 text-black" />
              B2 S3-COMPATIBLE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neo-bg border-2 border-black text-black shadow-brutal-sm">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              NEON POSTGRESQL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
