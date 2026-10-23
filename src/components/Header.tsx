import React from 'react';
import { Link2, LogOut, LogIn, User as UserIcon, Zap, Shield, Sparkles } from 'lucide-react';
import type { AuthUser } from '../types';

interface HeaderProps {
  user: AuthUser | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onLogout }) => {
  return (
    <header className="border-b-[4px] border-black bg-white sticky top-0 z-40 shadow-brutal-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
        {/* Brand Logo in Neo-Brutalist Frame */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neo-yellow border-[3px] border-black flex items-center justify-center text-black shadow-brutal-sm -rotate-2">
            <Link2 className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tighter uppercase text-black">
              Snap<span className="bg-neo-yellow px-1 border-2 border-black ml-0.5">Link</span>
            </span>
            <span className="hidden sm:inline-block font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 bg-black text-white">
              v1.0 // B2 + NEON
            </span>
          </div>
        </div>

        {/* Feature Badges (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neo-cyan/20 border-2 border-black font-mono font-bold text-[11px] uppercase shadow-brutal-sm">
            <Zap className="w-3.5 h-3.5 fill-black" />
            Direct S3
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neo-green/20 border-2 border-black font-mono font-bold text-[11px] uppercase shadow-brutal-sm">
            <Shield className="w-3.5 h-3.5" />
            Private Bucket
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neo-purple/20 border-2 border-black font-mono font-bold text-[11px] uppercase shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Neon DB
          </span>
        </div>

        {/* Auth Navigation */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neo-bg border-2 border-black shadow-brutal-sm">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-black text-xs font-mono">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black uppercase tracking-tight text-black leading-none truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-mono text-black/60 leading-none truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="px-3 py-2 bg-neo-pink hover:bg-[#ff5577] active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-black uppercase text-xs text-black shadow-brutal-sm flex items-center gap-1 transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 bg-neo-yellow hover:bg-[#ffea30] active:translate-x-0.5 active:translate-y-0.5 border-[3px] border-black font-black uppercase text-xs tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 stroke-[3]" />
                <span>Sign In / Join</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
