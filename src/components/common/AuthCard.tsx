'use client';

import React, { useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '../Logo';

interface AuthCardProps {
  onSuccess?: () => void;
  initialTab?: string;
  isModal?: boolean;
}

export function AuthCard({ onSuccess, isModal = false }: AuthCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'auth-failed') {
        return 'Google sign-in could not be completed. Please try again.';
      }
    }
    return '';
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error.message);
        setErrorMsg(error.message);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected auth error occurred';
      console.error('Unexpected auth error:', err);
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`w-full relative overflow-hidden ${
        isModal
          ? ''
          : 'bg-[var(--bg)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl'
      }`}
    >
      {/* Decorative ambient lighting */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="text-center mb-6 relative z-10">
        <div className="inline-flex items-center justify-center mb-3">
          <Logo className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Welcome to study.io
        </h2>
        <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
          Sign in to sync your study sessions and tasks
        </p>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 font-medium flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150 relative z-10">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">{errorMsg}</div>
        </div>
      )}

      {/* Full-width Google Sign-in Button */}
      <div className="relative z-10">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 active:bg-neutral-850 border border-[var(--border)] hover:border-white/25 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-neutral-950/50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-neutral-300" />
              <span className="font-medium text-neutral-200">Connecting...</span>
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

      {/* Small Muted Footer Note */}
      <p className="mt-6 text-xs text-neutral-500 text-center leading-relaxed relative z-10">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
