import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, Home, AlertCircle } from 'lucide-react';
import { AdminPanel } from './AdminPanel';

interface SecretAdminGateProps {
  currentUserEmail?: string;
  onExit: () => void;
}

export const SecretAdminGate: React.FC<SecretAdminGateProps> = ({
  currentUserEmail = 'admin@imglink.web.id',
  onExit,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return (
      sessionStorage.getItem('imglink_admin_secret') === '020709' ||
      localStorage.getItem('imglink_admin_secret') === '020709'
    );
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '020709') {
      try {
        sessionStorage.setItem('imglink_admin_secret', '020709');
        localStorage.setItem('imglink_admin_secret', '020709');
      } catch {}
      setIsUnlocked(true);
      setError(null);
    } else {
      setError('ACCESS DENIED // INVALID CLEARANCE KEY');
      setPassword('');
    }
  };

  const handleClosePanel = () => {
    onExit();
  };

  if (isUnlocked) {
    return (
      <AdminPanel
        isOpen={true}
        onClose={handleClosePanel}
        currentUserEmail={currentUserEmail}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border-[4px] border-black shadow-brutal-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-neo-pink border-b-[4px] border-black px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neo-yellow text-black border-2 border-black flex items-center justify-center shadow-brutal-sm -rotate-2">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-1.5">
                Restricted Console
              </h2>
              <span className="text-[10px] font-mono font-bold text-black/75 block">
                Route: /rashqaandreanfitrahsulaemanganteng
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7 space-y-5 bg-neo-bg">
          <div className="bg-white border-2 border-black p-3.5 shadow-brutal-sm space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="font-mono text-xs font-black uppercase text-black">
                Security Verification
              </span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-black/80">
              This terminal is accessible exclusively through secret routing. Enter the master administrative passkey to unlock the user and member management console.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-neo-pink border-2 border-black font-mono text-xs font-black uppercase text-black flex items-center gap-2 shadow-brutal-sm">
              <AlertCircle className="w-4 h-4 stroke-[3] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-black">
                Admin Passkey
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  placeholder="Enter secret key..."
                  className="w-full bg-white border-[3px] border-black font-mono text-sm px-3.5 py-2.5 pr-10 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black placeholder:text-black/40"
                />
                <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-neo-lime hover:bg-neo-yellow active:translate-x-0.5 active:translate-y-0.5 border-[3px] border-black font-mono font-black text-xs sm:text-sm uppercase tracking-wide text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Unlock Admin Console</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          <div className="border-t-2 border-black pt-3 flex justify-center">
            <button
              onClick={onExit}
              className="font-mono text-[11px] font-black uppercase text-black/75 hover:text-black flex items-center gap-1.5 hover:underline"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Exit to Main Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
