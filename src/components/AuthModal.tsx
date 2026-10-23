import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import type { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  onOpenLegal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenLegal,
}) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    if (!agreedToTerms) {
      setErrorMessage('You must accept the License & Legal Agreement to continue.');
      return;
    }
    setIsGoogleLoading(true);
    setErrorMessage(null);
    // Direct top-level navigation to OAuth gateway
    window.location.href = '/api/auth?action=google';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-[4px] border-black shadow-brutal-2xl w-full max-w-md my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="bg-neo-yellow border-b-[4px] border-black px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neo-pink text-black border-2 border-black flex items-center justify-center shadow-brutal-sm -rotate-2">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-1.5">
                Google Authentication
              </h2>
              <span className="text-[11px] font-mono font-bold text-black/70 block">
                Secure Single Sign-On
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-neo-pink hover:bg-neo-red hover:text-white border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5 bg-neo-bg">
          {/* Security Notice Banner */}
          <div className="bg-white border-2 border-black p-3.5 shadow-brutal-sm space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black fill-neo-yellow" />
              <span className="font-mono text-xs font-black uppercase text-black">
                Authentication Policy
              </span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-black/80">
              Authentication is provided exclusively via verified Google
              Accounts. No passwords to remember, eliminating credential stuffing and password reuse risks.
            </p>
          </div>

          {/* Legal Agreement & Compliance Warning */}
          <div className="bg-neo-yellow/30 border-2 border-black p-3.5 shadow-brutal-sm space-y-2.5">
            <div className="text-[10px] font-mono font-black uppercase bg-neo-pink text-black px-2 py-0.5 border border-black inline-block">
              LEGAL NOTICE // COMPLIANCE
            </div>
            <p className="font-mono text-[10px] text-black/90 leading-tight">
              Zero tolerance for copyrighted material without rights, CSAM, non-consensual content, malware, or unlawful files. Violators are permanently banned and reported to relevant authorities.
            </p>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked) setErrorMessage(null);
                }}
                className="mt-0.5 w-4 h-4 rounded-none border-2 border-black text-black accent-neo-pink cursor-pointer"
              />
              <span className="font-mono text-[10px] font-bold text-black leading-snug">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal?.();
                  }}
                  className="underline font-black text-black hover:bg-neo-yellow px-0.5"
                >
                  License & Legal Agreement
                </button>
                , Acceptable Use Policy, and DMCA Copyright rules.
              </span>
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 bg-neo-pink border-2 border-black font-mono text-xs font-black uppercase text-black flex items-center gap-2 shadow-brutal-sm">
              <AlertCircle className="w-4 h-4 stroke-[3] flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Action Button: Continue with Google */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || !agreedToTerms}
              className="w-full py-3.5 px-4 bg-white hover:bg-neo-yellow active:translate-x-0.5 active:translate-y-0.5 border-[3px] border-black font-mono font-black text-xs sm:text-sm uppercase tracking-wide text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black stroke-[3]" />
                  <span>Redirecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Features Checklist */}
          <div className="border-t-2 border-black pt-4 grid grid-cols-2 gap-2 text-[10px] font-mono font-black uppercase text-black/75">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>Direct Sign In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>3 Free Uploads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>Pro Upgradable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
