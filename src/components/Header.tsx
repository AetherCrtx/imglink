import React from 'react';
import { Link2, ShieldCheck, Zap, Database } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Link2 className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black tracking-tight text-white">
              Snap<span className="text-brand-400">Link</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono">
              Image-to-URL
            </span>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-zinc-400">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Direct S3 Upload</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Private B2 Bucket</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Neon DB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
