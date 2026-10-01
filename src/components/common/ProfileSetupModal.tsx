'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { Check, X, Loader2, Sparkles } from 'lucide-react';

export function ProfileSetupModal() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isCheckingUnique, setIsCheckingUnique] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && (!user.username || !user.name)) {
      setIsOpen(true);
      // Only default to real names, not Focus Scholar or email default
      if (!name && user.name) {
        setName(user.name);
      }
    } else {
      setIsOpen(false);
    }
  }, [isAuthenticated, user, name]);

  useEffect(() => {
    const checkUsername = async () => {
      const handle = username.replace(/^@/, '').toLowerCase().trim();
      if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
        setIsUnique(null);
        return;
      }
      
      setIsCheckingUnique(true);
      const supabase = getSupabase();
      if (!supabase) {
        setIsCheckingUnique(false);
        setIsUnique(true); // Allow through if supabase is not available
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', handle)
          .neq('id', user?.id || '');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setIsUnique(false);
        } else {
          setIsUnique(true);
        }
      } catch (err) {
        console.error('Error checking username uniqueness:', err);
        setIsUnique(true); // Don't permanently lock the button on network error
      } finally {
        setIsCheckingUnique(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username, user?.id]);

  if (!isOpen) return null;

  const cleanedHandle = username.replace(/^@/, '').toLowerCase().trim();
  const isUsernameValid = /^[a-z0-9_]{3,20}$/.test(cleanedHandle);
  const isNameValid = name.trim().length >= 2;
  const canSubmit = isNameValid && isUsernameValid && isUnique !== false && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        username: cleanedHandle,
      });
      // Modal closes automatically via useEffect when profile updates
    } catch (err) {
      console.error('Failed to update profile setup:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-6 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">WELCOME TO STUDY.IO</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Claim your unique student identifier for the global leaderboards.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ebin"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                maxLength={30}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                User ID / Handle
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. ebin_k"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-9 pr-12 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                  maxLength={20}
                  required
                />
                <div className="absolute right-4 flex items-center">
                  {isCheckingUnique && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
                  {!isCheckingUnique && username.length > 0 && isUsernameValid && isUnique === true && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {!isCheckingUnique && username.length > 0 && isUnique === false && (
                    <X className="w-4 h-4 text-rose-400" />
                  )}
                </div>
              </div>
              {username.length > 0 && !isCheckingUnique && isUnique === false && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center">
                  <X className="w-3 h-3 mr-1" /> This handle is already taken.
                </p>
              )}
              {username.length > 0 && !isUsernameValid && (
                <p className="text-xs text-rose-400 mt-1.5">
                  3-20 chars, lowercase letters, numbers, and underscores only.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Setting up...
                </>
              ) : (
                'COMPLETE SETUP & ENTER'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
