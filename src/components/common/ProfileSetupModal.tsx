'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { Check, X, Loader2, BookOpen, ArrowRight } from 'lucide-react';

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
        setIsUnique(true);
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
        setIsUnique(true);
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
        displayName: name.trim(),
        username: cleanedHandle,
      });
    } catch (err) {
      console.error('Failed to update profile setup:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0c1017] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 relative">
        <div className="p-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-6 mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black tracking-wider uppercase text-white mb-2">WELCOME TO STUDY.IO</h2>
            <p className="text-xs text-neutral-400 font-mono tracking-tight leading-relaxed">
              Claim your unique student identifier for the global leaderboards.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-2 block">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#131822] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                maxLength={30}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-2 block">
                User ID / Handle
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-neutral-500 font-mono select-none pr-1">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-[#131822] border border-white/10 rounded-lg pl-9 pr-12 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                  maxLength={20}
                  required
                />
                <div className="absolute right-4 flex items-center">
                  {isCheckingUnique && <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />}
                  {!isCheckingUnique && username.length > 0 && isUsernameValid && isUnique === true && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                  {!isCheckingUnique && username.length > 0 && isUnique === false && (
                    <X className="w-4 h-4 text-rose-500" />
                  )}
                </div>
              </div>
              {username.length > 0 && !isCheckingUnique && isUnique === false && (
                <p className="text-[10px] text-rose-500 mt-1.5 flex items-center font-mono">
                  <X className="w-3 h-3 mr-1" /> This handle is already taken.
                </p>
              )}
              {username.length > 0 && !isUsernameValid && (
                <p className="text-[10px] text-rose-500 mt-1.5 font-mono">
                  3-20 chars, lowercase letters, numbers, and underscores only.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> INITIALIZING...
                </>
              ) : (
                <>
                  INITIALIZE PROFILE <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
