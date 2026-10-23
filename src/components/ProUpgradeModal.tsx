import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  Crown,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { AuthUser } from '../types';
import { setAuthSession } from '../utils/auth';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onUserUpdated: (updatedUser: AuthUser) => void;
  onOpenAuth: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onOpenAuth,
}) => {
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await axios.post<{ user: AuthUser; token?: string; message: string }>(
        '/api/auth',
        {
          action: 'request-pro',
          note: note.trim(),
        }
      );

      if (res.data.user) {
        if (res.data.token) {
          setAuthSession(res.data.token, res.data.user);
        }
        onUserUpdated(res.data.user);
        setSuccessMessage('PRO REQUEST SUBMITTED! AN ADMIN WILL REVIEW YOUR ACCOUNT SOON.');
      }
    } catch (err: unknown) {
      let detail = 'Failed to submit Pro upgrade request.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        detail = err.response.data.error;
      }
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPro = user?.tier === 'pro';
  const isPending = user?.proRequestStatus === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border-[4px] border-black shadow-brutal-2xl w-full max-w-lg my-auto overflow-hidden">
        {/* Top Header */}
        <div className="bg-neo-yellow border-b-[4px] border-black px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neo-lime border-[3px] border-black flex items-center justify-center shadow-brutal-sm -rotate-2">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-1.5">
                Upgrade to Pro
                <span className="text-[10px] font-mono font-black bg-neo-purple text-white px-2 py-0.5 border border-black">
                  UNLIMITED
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs font-mono font-bold text-black/70">
                Unlock unlimited image uploads and high-speed sharing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-neo-pink hover:bg-neo-red hover:text-white border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 bg-neo-bg">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="border-[3px] border-black p-3 bg-white shadow-brutal-sm space-y-2">
              <div className="font-black text-xs uppercase bg-black text-white px-2 py-0.5 inline-block">
                Free Member
              </div>
              <ul className="space-y-1.5 text-[11px] font-bold text-black/80">
                <li className="flex items-center gap-1.5">
                  <span className="text-black font-black">✕</span> Max 3 Image Uploads
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-black font-black">✓</span> 10MB per Image
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-black font-black">✓</span> Direct Share Links
                </li>
              </ul>
            </div>

            <div className="border-[3px] border-black p-3 bg-neo-yellow shadow-brutal-sm space-y-2">
              <div className="font-black text-xs uppercase bg-neo-lime text-black px-2 py-0.5 border border-black inline-block">
                ★ Pro Member
              </div>
              <ul className="space-y-1.5 text-[11px] font-black text-black">
                <li className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-black" /> UNLIMITED Uploads
                </li>
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-black" /> Ultra Fast CDN
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" /> Priority Admin Review
                </li>
              </ul>
            </div>
          </div>

          {/* User Status / Action View */}
          {!user ? (
            <div className="border-[3px] border-black p-4 bg-white shadow-brutal space-y-3 text-center">
              <p className="font-mono text-xs font-black uppercase text-black">
                Please sign in with your Google account to request a Pro upgrade.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-2.5 bg-neo-yellow hover:bg-neo-lime active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-black uppercase text-xs shadow-brutal transition-all"
              >
                Sign In with Google
              </button>
            </div>
          ) : isPro ? (
            <div className="border-[3px] border-black p-4 bg-neo-lime shadow-brutal text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-black stroke-[3]" />
              <h3 className="font-black text-sm uppercase text-black">
                You are already a Pro Member!
              </h3>
              <p className="font-mono text-xs font-bold text-black/80">
                You enjoy unlimited image uploads and priority hosting.
              </p>
            </div>
          ) : isPending ? (
            <div className="border-[3px] border-black p-4 bg-neo-orange shadow-brutal space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-black stroke-[3]" />
                <h3 className="font-black text-sm uppercase text-black">
                  Request Pending Admin Approval
                </h3>
              </div>
              <p className="font-mono text-xs font-bold text-black/80">
                Your request has been submitted to the Admin team. Once approved, your account will
                automatically be upgraded to unlimited Pro uploads!
              </p>
              {user.proRequestedAt && (
                <span className="text-[10px] font-mono text-black/60 block">
                  Submitted: {new Date(user.proRequestedAt).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-neo-pink border-2 border-black font-mono text-xs font-black uppercase text-black flex items-center gap-2 shadow-brutal-sm">
                  <AlertCircle className="w-4 h-4 stroke-[3]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-neo-lime border-2 border-black font-mono text-xs font-black uppercase text-black flex items-center gap-2 shadow-brutal-sm">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-mono text-xs font-black uppercase text-black">
                  Reason for Upgrade (Optional):
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Need to upload graphics for work portfolio, photography projects, etc."
                  className="w-full p-2.5 bg-white border-2 border-black font-mono text-xs text-black focus:outline-none focus:shadow-brutal-sm"
                  maxLength={500}
                />
              </div>

              <div className="bg-white border-2 border-black p-3 font-mono text-[11px] text-black/80 shadow-brutal-sm">
                💡 <span className="font-black">Pro requests are free!</span> An admin will review and approve your request shortly.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-neo-yellow hover:bg-neo-lime active:translate-x-0.5 active:translate-y-0.5 border-[3px] border-black font-black uppercase text-xs tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 stroke-[3]" />
                    <span>Send Pro Upgrade Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
