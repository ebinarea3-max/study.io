'use client';

import React, { useState } from 'react';
import { useAuth, formatAuthError } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface AuthCardProps {
  onSuccess?: () => void;
  initialTab?: 'signin' | 'signup';
  isModal?: boolean;
}

export function AuthCard({ onSuccess, initialTab = 'signin', isModal = false }: AuthCardProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isSignUp = activeTab === 'signup';
  const passwordsMatch = isSignUp && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = isSignUp && confirmPassword.length > 0 && password !== confirmPassword;
  const passwordTooShort = isSignUp && password.length > 0 && password.length < 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (isSignUp) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || undefined);
      } else {
        await signInWithEmail(email, password);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg(formatAuthError(err));
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setErrorMsg('');
  };

  return (
    <div
      className={`w-full relative overflow-hidden ${
        isModal
          ? ''
          : 'bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl'
      }`}
    >
      {/* Sleek Tabs Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl mb-5 shadow-inner">
        <button
          type="button"
          onClick={() => switchTab('signin')}
          className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            !isSignUp
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab('signup')}
          className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isSignUp
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Create Account</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="text-center mb-5">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {isSignUp ? 'Join study.io' : 'Welcome Back'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isSignUp
            ? 'Set up your credentials to sync sessions, streaks & rooms.'
            : 'Enter your email and password to access your focus sanctuary.'}
        </p>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">{errorMsg}</div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name / Display Name (Create Account only) */}
        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Jordan"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            {passwordTooShort && (
              <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                Min 6 characters ({password.length}/6)
              </span>
            )}
            {isSignUp && password.length >= 6 && (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Valid length
              </span>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
              className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password (Create Account only) */}
        {isSignUp && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              {passwordsMatch && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </span>
              )}
              {passwordsMismatch && (
                <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Passwords do not match
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Re-type your password"
                className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  passwordsMismatch
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                    : passwordsMatch
                    ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                    : 'border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (isSignUp && (password.length < 6 || password !== confirmPassword))}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
            </>
          ) : (
            <>
              <span>{isSignUp ? 'Create Account & Enter' : 'Sign In & Enter'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Switcher link */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => switchTab(isSignUp ? 'signin' : 'signup')}
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          {isSignUp
            ? 'Already have an account? Click here to Sign In'
            : "Don't have an account yet? Click here to Create one"}
        </button>
      </div>

      {/* Privacy note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Your study sessions, stats & streaks are saved securely</span>
      </div>
    </div>
  );
}
