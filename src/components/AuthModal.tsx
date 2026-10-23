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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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

      const response = await axios.post<{ user: AuthUser; token: string; message: string }>(
        endpoint,
        payload
      );

      setAuthSession(response.data.token, response.data.user);
      onAuthSuccess(response.data.user);
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Neo-brutalist Modal Window */}
      <div className="relative w-full max-w-md bg-white border-[4px] border-black shadow-brutal-xl overflow-hidden">
        {/* Retro Window Header */}
        <div className="bg-neo-yellow border-b-[3px] border-black px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-black" />
            <span className="font-mono font-black text-xs uppercase tracking-widest text-black">
              SNAPLINK // {mode === 'login' ? 'USER_LOGIN' : 'REGISTER_ACCOUNT'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-neo-pink active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-sm transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neo-bg border-[3px] border-black shadow-brutal-sm">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-black uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-black hover:bg-black/10'
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
              className={`py-2 text-xs font-black uppercase tracking-wider transition-all ${
                mode === 'register'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-black hover:bg-black/10'
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full bg-white border-[3px] border-black font-mono text-sm pl-9 pr-3 py-2.5 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black"
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
                  className="w-full bg-white border-[3px] border-black font-mono text-sm pl-9 pr-3 py-2.5 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black"
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
                  className="w-full bg-white border-[3px] border-black font-mono text-sm pl-9 pr-3 py-2.5 shadow-brutal-sm focus:outline-none focus:shadow-brutal transition-all text-black"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-neo-yellow hover:bg-[#ffed4a] active:translate-x-1 active:translate-y-1 border-[3px] border-black font-black uppercase text-sm tracking-wider text-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="text-center pt-2">
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
