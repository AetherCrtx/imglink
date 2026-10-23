import React from 'react';
import { Layers, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-mono font-black text-sm uppercase text-black bg-neo-yellow px-2.5 py-1 border-2 border-black shadow-brutal-sm -rotate-1">
              IMGLINK
            </span>
            <span className="font-mono text-xs font-black text-black">
              DIRECT CLOUD IMAGE-TO-URL PLATFORM
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono font-black text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-cyan border-2 border-black text-black shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <Layers className="w-3.5 h-3.5 text-black" />
              REACT + VITE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-lime border-2 border-black text-black shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <Shield className="w-3.5 h-3.5 text-black" />
              NEON STORAGE
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-purple border-2 border-black text-white shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              <Sparkles className="w-3.5 h-3.5 fill-white text-black" />
              NEON POSTGRESQL
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-pink border-2 border-black text-black shadow-brutal-sm hover:-translate-y-0.5 transition-transform">
              GOOGLE AUTH
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
