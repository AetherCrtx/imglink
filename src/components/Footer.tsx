import React from 'react';
import { Layers, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/60 mt-16 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">SnapLink</span>
            <span>•</span>
            <span>Serverless Image-to-URL Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              Vercel + Vite + React
            </span>
            <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Backblaze B2 Private
            </span>
            <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Drizzle + Neon PG
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
