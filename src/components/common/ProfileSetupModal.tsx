'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { Check, X, Loader2, Upload, User, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Scholar1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber2',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Ninja3',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Matrix4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost5',
  'https://api.dicebear.com/7.x/micah/svg?seed=Phantom6',
];

export function ProfileSetupModal() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // SECTION B state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isCheckingUnique, setIsCheckingUnique] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  
  // SECTION A state
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && user.is_onboarded !== true) {
      setIsOpen(true);
      if (!name && user.displayName) setName(user.displayName);
      if (!username && user.username) setUsername(user.username);
      if (!avatarUrl && user.avatarUrl) setAvatarUrl(user.avatarUrl);
    } else {
      setIsOpen(false);
    }
  }, [isAuthenticated, user, name, username, avatarUrl]);

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
        setIsUnique(!(data && data.length > 0));
      } catch (err) {
        setIsUnique(true);
      } finally {
        setIsCheckingUnique(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username, user?.id]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase not initialized');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const cleanedHandle = username.replace(/^@/, '').toLowerCase().trim();
  const isUsernameValid = /^[a-z0-9_]{3,20}$/.test(cleanedHandle);
  const isNameValid = name.trim().length >= 2;
  const canSubmit = isNameValid && isUsernameValid && isUnique !== false && !isSubmitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        displayName: name.trim(),
        username: cleanedHandle,
        avatarUrl: avatarUrl,
        is_onboarded: true,
      });
      setIsOpen(false);
      toast.success('Identity saved!');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({ is_onboarded: true });
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0c0e14] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)] rounded-2xl w-full max-w-md overflow-hidden relative p-6">
        
        <div className="text-center mb-6">
          <h2 className="text-lg font-black tracking-widest uppercase text-white mb-1 font-hud">CHOOSE YOUR SCHOLAR IDENTITY</h2>
          <p className="text-[11px] text-amber-500/80 font-mono tracking-tight leading-relaxed uppercase">
            Personalize your profile and avatar across the arena.
          </p>
        </div>

        {/* SECTION A: AVATAR CUSTOMIZER */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 rounded-full border-2 border-amber-500/50 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-black/50">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-amber-500/50" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="w-full py-2 px-3 rounded-lg bg-amber-500/[0.08] hover:bg-amber-500/[0.15] border border-amber-500/20 text-[10px] font-hud font-bold tracking-wider text-amber-400 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Photo</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>
            
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setAvatarUrl(url)}
                  disabled={isUploading}
                  className={`relative aspect-square rounded-lg border flex items-center justify-center overflow-hidden transition-all ${
                    avatarUrl === url
                      ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400'
                      : 'border-white/10 bg-white/[0.03] hover:border-amber-500/40 hover:bg-amber-500/10'
                  }`}
                >
                  <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION B: PROFILE DETAILS */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1.5 block">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
              maxLength={30}
              placeholder="e.g. Ebin K A"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-1.5 block">
              Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-neutral-500 font-mono select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-7 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                maxLength={20}
                placeholder="e.g. ebin"
                required
              />
              <div className="absolute right-3 flex items-center">
                {isCheckingUnique && <Loader2 className="w-3.5 h-3.5 text-neutral-500 animate-spin" />}
                {!isCheckingUnique && username.length > 0 && isUsernameValid && isUnique === true && (
                  <Check className="w-4 h-4 text-emerald-500" />
                )}
                {!isCheckingUnique && username.length > 0 && isUnique === false && (
                  <X className="w-4 h-4 text-rose-500" />
                )}
              </div>
            </div>
            {username.length > 0 && !isCheckingUnique && isUnique === false && (
              <p className="text-[10px] text-rose-500 mt-1 flex items-center font-mono">
                <X className="w-3 h-3 mr-1" /> Taken.
              </p>
            )}
          </div>

          {/* SECTION C: ACTIONS */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-hud"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'SAVE IDENTITY'
              )}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full mt-3 text-center text-[10px] font-mono text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Skip for now
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
