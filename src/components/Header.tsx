import React from 'react';
import {
  Link2,
  LogOut,
  LogIn,
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { AuthUser } from '../types';

interface HeaderProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenProModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenProModal,
}) => {
  const isPro = user?.tier === 'pro';
  const isPendingPro = user?.proRequestStatus === 'pending';

  return (
    <header className="border-b-[4px] border-black bg-white sticky top-0 z-40 shadow-brutal-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand Logo in Neo-Brutalist Frame */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neo-yellow hover:bg-neo-cyan transition-colors border-[3px] border-black flex items-center justify-center text-black shadow-brutal-sm -rotate-2">
            <Link2 className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-black">
              Img<span className="bg-neo-yellow px-1 sm:px-1.5 py-0.5 border-2 border-black ml-0.5 shadow-brutal-sm">Link</span>
            </span>
            <span className="hidden sm:inline-block font-mono font-black text-[10px] uppercase tracking-wider px-2 py-0.5 bg-neo-orange text-black border-2 border-black shadow-brutal-sm rotate-1">
              v1.0 // FAST
            </span>
          </div>
        </div>

        {/* Center Tier / Action Status (Desktop) */}
        {user && (
          <div className="hidden md:flex items-center gap-2.5">
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-lime border-2 border-black font-mono font-black text-[11px] uppercase text-black shadow-brutal-sm">
                <Crown className="w-3.5 h-3.5 stroke-[3]" />
                PRO MEMBER // UNLIMITED
              </span>
            ) : isPendingPro ? (
              <button
                onClick={onOpenProModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-orange border-2 border-black font-mono font-black text-[11px] uppercase text-black shadow-brutal-sm hover:translate-x-0.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
                PRO PENDING REVIEW
              </button>
            ) : (
              <button
                onClick={onOpenProModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-yellow hover:bg-neo-lime border-2 border-black font-mono font-black text-[11px] uppercase text-black shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black stroke-black" />
                UPGRADE TO PRO (UNLIMITED)
              </button>
            )}

            {/* Quota Indicator for Free tier */}
            {!isPro && typeof user.imageCount === 'number' && (
              <span className="inline-flex items-center px-2.5 py-1 bg-white border-2 border-black font-mono font-black text-[11px] uppercase text-black shadow-brutal-sm">
                {user.imageCount}/3 IMAGES
              </span>
            )}
          </div>
        )}

        {/* Auth Navigation */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* User Identity Chip */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-neo-cyan/20 border-2 border-black shadow-brutal-sm">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-neo-yellow text-black border-2 border-black flex items-center justify-center font-black text-xs font-mono overflow-hidden shadow-brutal-sm flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-black leading-none truncate max-w-[85px] sm:max-w-[120px]">
                      {user.name}
                    </span>
                    {isPro && (
                      <Crown className="w-3 h-3 text-black stroke-[3] fill-neo-yellow flex-shrink-0" />
                    )}
                  </div>
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-black/70 leading-none truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3 py-1.5 sm:py-2 bg-neo-pink hover:bg-neo-red active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-black uppercase text-xs text-black hover:text-white shadow-brutal-sm flex items-center gap-1 transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="min-h-[42px] px-3 sm:px-4 py-2 bg-neo-yellow hover:bg-neo-lime active:translate-x-0.5 active:translate-y-0.5 border-[3px] border-black font-black uppercase text-xs tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 stroke-[3]" />
                <span>Sign In <span className="hidden xs:inline">with Google</span></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
