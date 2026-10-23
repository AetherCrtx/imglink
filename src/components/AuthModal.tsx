import React, { useState } from 'react';
import axios from 'axios';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Loader2, AlertCircle, Shield } from 'lucide-react';
import type { AuthUser } from '../types';
import { setAuthSession } from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const response = await axios.post<{ url: string }>('/api/auth', {
        action: 'google',
      });
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setErrorMessage('Failed to initiate Google authentication.');
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      setIsGoogleLoading(false);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('Failed to connect to Google OAuth.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const endpoint = '/api/auth';
      const payload = {
        action: mode,
        email: email.trim(),
        password,
        name: mode === 'register' ? name.trim() : undefined,
      };

      const response = await axios.post<{ user: AuthUser; token?: string; message: string }>(
        endpoint,
        payload
      );

      if (response.data.user) {
        setAuthSession(response.data.token || '', response.data.user);
        onAuthSuccess(response.data.user);
        onClose();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to authenticate. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* Neo-brutalist Modal Window */}
      <div className="relative w-full max-w-md max-h-[92dvh] my-auto flex flex-col bg-white border-[4px] border-black shadow-brutal-xl overflow-hidden">
        {/* Retro Window Header */}
        <div className="bg-neo-yellow border-b-[3px] border-black px-3.5 sm:px-4 py-2.5 flex items-center justify-between select-none flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-neo-red border-2 border-black rounded-full inline-block flex-shrink-0" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-neo-yellow border-2 border-black rounded-full inline-block flex-shrink-0" />
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-neo-lime border-2 border-black rounded-full inline-block flex-shrink-0" />
            <span className="font-mono font-black text-xs uppercase tracking-wider text-black ml-1 flex items-center gap-1.5 truncate">
              <Shield className="w-4 h-4 text-black stroke-[2.5] flex-shrink-0" />
              <span className="truncate">AUTH // {mode === 'login' ? 'SIGN_IN' : 'REGISTER'}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-7 sm:h-7 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-neo-pink active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Google One-Click Login Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full min-h-[48px] py-3 sm:py-3.5 bg-white hover:bg-neo-yellow active:translate-x-1 active:translate-y-1 border-[3px] border-black font-black uppercase text-xs sm:text-sm tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
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
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t-2 border-black" />
            <div className="absolute px-3 bg-white font-mono font-bold text-[10px] uppercase text-black">
              OR USE EMAIL & PASSWORD
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neo-bg border-[3px] border-black shadow-brutal-sm">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`min-h-[40px] py-2 text-xs font-black uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'bg-neo-yellow text-black border-2 border-black shadow-brutal-sm'
                  : 'bg-transparent text-black hover:bg-black/10 border-2 border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`min-h-[40px] py-2 text-xs font-black uppercase tracking-wider transition-all ${
                mode === 'register'
                  ? 'bg-neo-cyan text-black border-2 border-black shadow-brutal-sm'
                  : 'bg-transparent text-black hover:bg-black/10 border-2 border-transparent'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-neo-pink/20 border-2 border-black flex items-start gap-2 text-xs font-bold text-black shadow-brutal-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-black" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-black/60 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Creator"
                    className="w-full bg-white border-[3px] border-black font-mono text-base sm:text-sm pl-9 pr-3 py-2.5 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-black/60 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-white border-[3px] border-black font-mono text-base sm:text-sm pl-9 pr-3 py-2.5 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-black/60 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white border-[3px] border-black font-mono text-base sm:text-sm pl-9 pr-3 py-2.5 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full min-h-[48px] mt-2 py-3.5 bg-neo-lime hover:bg-neo-yellow active:translate-x-1 active:translate-y-1 border-[3px] border-black font-black uppercase text-sm tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In Now' : 'Create My Account'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="text-center pt-1">
            <p className="text-[11px] font-mono text-black/70">
              {mode === 'login' ? (
                <>
                  Need an account?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="font-bold underline text-black hover:bg-neo-yellow px-1"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="font-bold underline text-black hover:bg-neo-yellow px-1"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
