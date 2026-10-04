'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { X, Target, User, Loader2, Save, Camera, Upload, Plus, Dices } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getRankTier } from '../../lib/rankedSystem';
import { getSupabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { isAppropriateHandle, isValidHandleFormat, sanitizeHandleInput } from '../../lib/validation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const differenceInDays = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

const generateThematicIdentity = () => {
  const adjectives = ['Silent', 'Astral', 'Quantum', 'Nova', 'Apex', 'Cyber', 'Zen', 'Lucid', 'Phantom', 'Chrono', 'Arcane', 'Kinetic'];
  const nouns = ['Scholar', 'Archivist', 'Tactician', 'Monk', 'Nomad', 'Pioneer', 'Mind', 'Seeker', 'Scribe', 'Alchemist'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return {
    displayName: `${adj} ${noun}`,
    baseHandle: `${adj.toLowerCase()}${noun.toLowerCase()}`,
  };
};

const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/micah/svg?seed=ScholarA&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Archivist&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Nexus&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/shapes/svg?seed=FocusSigil&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/micah/svg?seed=Nocturne&backgroundColor=0d1117',
];

const VAULT_CATEGORIES = [
  {
    name: 'SCHOLARS & ARCHIVISTS',
    avatars: [
      'https://api.dicebear.com/9.x/micah/svg?seed=Sage1',
      'https://api.dicebear.com/9.x/micah/svg?seed=Cipher',
      'https://api.dicebear.com/9.x/micah/svg?seed=Aura',
      'https://api.dicebear.com/9.x/micah/svg?seed=Raven',
      'https://api.dicebear.com/9.x/micah/svg?seed=Atlas',
      'https://api.dicebear.com/9.x/micah/svg?seed=Zenith',
    ]
  },
  {
    name: 'ADVENTURERS & STRATEGISTS',
    avatars: [
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Alchemist',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Novelist',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Tactician',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Oracle',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Vanguard',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Chronos',
    ]
  },
  {
    name: 'MINIMALIST SIGILS',
    avatars: [
      'https://api.dicebear.com/9.x/shapes/svg?seed=Focus',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Catalyst',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Vector',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Prism',
    ]
  }
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { gamification } = useStudy();

  const userRank = getRankTier(user.seasonRp || 0);

  const [displayName, setDisplayName] = useState(user.name || user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [dailyGoalHours, setDailyGoalHours] = useState(user.dailyGoalHours);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGeneratingIdentity, setIsGeneratingIdentity] = useState(false);

  const generateUniqueHandle = async (baseHandle: string) => {
    const supabase = getSupabase();
    if (!supabase) return `${baseHandle}_${Math.floor(1000 + Math.random() * 9000)}`;
    
    let candidate = '';
    let isTaken = true;
    let attempts = 0;
    while (isTaken && attempts < 10) {
      candidate = `${baseHandle}_${Math.floor(1000 + Math.random() * 9000)}`;
      if (!isAppropriateHandle(candidate)) {
        attempts++;
        continue;
      }
      const { data } = await supabase.from('profiles').select('id').eq('username', candidate).maybeSingle();
      if (!data) isTaken = false;
      attempts++;
    }
    return candidate;
  };

  const rollNewIdentity = async () => {
    setIsGeneratingIdentity(true);
    try {
      const { displayName: newName, baseHandle } = generateThematicIdentity();
      setDisplayName(newName);
      const uniqueHandle = await generateUniqueHandle(baseHandle);
      setUsername(uniqueHandle);
      setAvatarUrl(prev => prev || PRESET_AVATARS[0]);
    } finally {
      setIsGeneratingIdentity(false);
    }
  };

  // Sync state whenever user or modal open status changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.name || user.displayName || '');
      setUsername(user.username || '');
      setDailyGoalHours(user.dailyGoalHours);
      
      const effectiveAvatarUrl =
        user.avatarUrl ||
        (user.user_metadata?.avatar_url as string) ||
        (user.user_metadata?.picture as string) ||
        '';
      setAvatarUrl(effectiveAvatarUrl);
      
      setErrorMsg('');

      if (!user.is_onboarded && !(user.username || '')) {
        rollNewIdentity();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user.name, user.displayName, user.username, user.dailyGoalHours, user.avatarUrl, user.is_onboarded]);

  // Scroll lock effect for the background page when the modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle || '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanedHandle = sanitizeHandleInput(username.replace(/^@/, ''));
  const handleIsAppropriate = cleanedHandle === '' || isAppropriateHandle(cleanedHandle);

  let cooldownDaysLeft = 0;
  let isCooldownActive = false;

  if (user.username_changed_at) {
    cooldownDaysLeft = 30 - differenceInDays(new Date(), new Date(user.username_changed_at));
    if (cooldownDaysLeft > 0) {
      isCooldownActive = true;
    }
  }

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
      toast.success('Avatar uploaded! Save profile to apply.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = async () => {
    if (!user.is_onboarded) {
      try {
        await updateProfile({ is_onboarded: true });
      } catch (err) {
        console.error(err);
      }
    }
    onClose();
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    setErrorMsg("");
    
    try {
      const updatePayload: any = {
        name: displayName.trim(),
        daily_goal_hours: Number(dailyGoalHours),
        avatar_url: avatarUrl || null,
        is_onboarded: true,
      };

      const usernameChanged = cleanedHandle !== (user.username || '');
      
      if (usernameChanged) {
        if (isCooldownActive) {
          throw new Error(`User ID can only be changed once every 30 days. Available again in ${cooldownDaysLeft} days.`);
        }
        
        if (!isValidHandleFormat(cleanedHandle)) {
          throw new Error("Handle must be 3-24 characters, alphanumeric, dashes or underscores only, without consecutive special characters.");
        }
        
        if (!isAppropriateHandle(cleanedHandle)) {
          throw new Error("Handle contains restricted or inappropriate terms. Please choose a different identity.");
        }

        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase client not initialized.");

        // Verify handle uniqueness before saving
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanedHandle)
          .neq("id", user.id)
          .maybeSingle();

        if (existing) {
          throw new Error("Handle already claimed. Try another.");
        }

        updatePayload.username = cleanedHandle;
        updatePayload.username_changed_at = new Date().toISOString();
      }
      
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not initialized.");

      // Perform async Supabase update
      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) throw error;

      // Refresh profile context so header updates immediately
      await updateProfile({
        name: updatePayload.name,
        displayName: updatePayload.name,
        username: updatePayload.username || user.username,
        dailyGoalHours: updatePayload.daily_goal_hours,
        avatarUrl: updatePayload.avatar_url,
        is_onboarded: true,
        ...(updatePayload.username_changed_at ? { username_changed_at: updatePayload.username_changed_at } : {})
      });
      onClose(); // Only close AFTER successful write
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setErrorMsg(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white/[0.07] backdrop-blur-3xl border border-white/20 rounded-2xl w-full max-w-md my-auto max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.7)] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight uppercase tracking-wider">
                {!user.is_onboarded ? "// WELCOME SCHOLAR" : "Edit Profile"}
              </h3>
              <p className="text-xs text-neutral-400 font-mono tracking-tight mt-0.5">
                {!user.is_onboarded ? "Set your identity" : "Customize your identity & targets"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Compact Top Header with Avatar Picker */}
          <div className="flex flex-col gap-3 bg-white/[0.05] backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[inset_0_1px_10px_rgba(255,255,255,0.02)]">
            <div className="flex items-center gap-4">
              <label className="relative group cursor-pointer shrink-0 rounded-full">
                <UserAvatar
                  src={avatarUrl}
                  name={displayName || user.displayName || 'S'}
                  size={56}
                  className="w-14 h-14 rounded-full border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-opacity group-hover:opacity-75 ring-2 ring-amber-500 scale-105"
                />
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
              <div className="min-w-0">
                <div className="font-bold text-base text-white truncate">{displayName || user.displayName || 'Scholar'}</div>
                <div className="text-sm text-neutral-400 font-mono truncate mt-0.5">@{cleanedHandle || 'handle'}</div>
                
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-white/[0.05] backdrop-blur-sm" style={{ borderColor: userRank.config.badgeAccent, color: userRank.config.badgeAccent }}>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {userRank.fullTitle}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Presets Row */}
            <div className="pt-2 mt-2 border-t border-white/5 pb-1">
              <div className="flex items-center gap-2.5 w-max p-2 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-x-auto scrollbar-none">
                {PRESET_AVATARS.map((url, i) => {
                  const isActive = avatarUrl === url;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setAvatarUrl(url)}
                      disabled={isUploading}
                      className={`relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-amber-500 scale-105 z-10 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'border border-white/10 opacity-70 hover:opacity-100 hover:scale-105 hover:border-amber-500/50 hover:bg-amber-500/10'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
                
                {/* Vault Trigger */}
                <button
                  type="button"
                  onClick={() => setIsVaultOpen(true)}
                  className="w-10 h-10 rounded-xl border border-dashed border-white/20 bg-white/[0.03] flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/[0.05] transition-all cursor-pointer shrink-0"
                  title="More Avatars"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Display Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold block">
                  Display Name
                </label>
                {!user.is_onboarded && (
                  <button
                    type="button"
                    onClick={rollNewIdentity}
                    disabled={isGeneratingIdentity}
                    className="text-[10px] flex items-center gap-1 font-mono uppercase text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Dices className={`w-3 h-3 ${isGeneratingIdentity ? 'animate-spin' : ''}`} />
                    Shuffle Identity
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={30}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              />
            </div>

            {/* Handle */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-2 block">
                User ID / Handle
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-neutral-500 font-mono select-none pr-1">@</span>
                <input
                  type="text"
                  required
                  maxLength={24}
                  value={username}
                  disabled={isCooldownActive}
                  onChange={(e) => setUsername(sanitizeHandleInput(e.target.value.replace(/^@/, '')))}
                  className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </div>
              <div className="mt-1.5 text-[10px] font-mono">
                {!handleIsAppropriate ? (
                  <span className="text-amber-500">Handle contains restricted or inappropriate terms. Please choose a different identity.</span>
                ) : isCooldownActive ? (
                  <span className="text-amber-400">Cooldown active: Editable in {cooldownDaysLeft} days</span>
                ) : (
                  <span className="text-neutral-500">Can only be changed once every 30 days.</span>
                )}
              </div>
            </div>

            {/* Daily Goal Target (Hours) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Daily Study Goal</span>
                </label>
                <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">{Math.round(dailyGoalHours * 60)} mins</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="0.5"
                value={dailyGoalHours}
                onChange={e => setDailyGoalHours(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-white/[0.08] border border-white/10 cursor-pointer h-2 rounded-lg appearance-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-2 font-mono">
                <span>1h Light</span>
                <span>4h Mod</span>
                <span>6h Pro</span>
                <span>10h+ Hard</span>
              </div>
            </div>

            {errorMsg && (
              <div className="text-[11px] text-amber-500 font-mono mt-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-xl text-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || displayName.trim().length < 2 || cleanedHandle.length < 3 || (cleanedHandle !== (user.username || '') && isCooldownActive) || !handleIsAppropriate}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {!user.is_onboarded ? "SAVE IDENTITY" : "SAVE PROFILE"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Avatar Vault Modal */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white/[0.07] backdrop-blur-3xl border border-amber-500/20 rounded-2xl w-full max-w-xl my-auto max-h-[85vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.7)] relative flex flex-col">
            {/* Vault Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0 bg-white/[0.02]">
              <div>
                <h3 className="font-bold text-lg text-white leading-tight uppercase tracking-wider">
                  CHOOSE SCHOLAR AVATAR
                </h3>
                <p className="text-xs text-neutral-400 font-mono tracking-tight mt-1">
                  Select an avatar that matches your study persona or upload your own.
                </p>
              </div>
              <button
                onClick={() => setIsVaultOpen(false)}
                className="p-2 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Vault Content */}
            <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-white/10">
              
              {/* Custom Upload Section */}
              <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">Custom Photo</div>
                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">PNG, JPG, WEBP (Max 2MB)</div>
                  </div>
                </div>
                <label className="px-4 py-2 bg-white/[0.05] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/50 rounded-lg text-xs font-bold text-neutral-300 hover:text-amber-400 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2">
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      handleAvatarUpload(e);
                      setIsVaultOpen(false);
                    }}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Preset Categories */}
              <div className="space-y-6">
                {VAULT_CATEGORIES.map((category, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-widest pl-1">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {category.avatars.map((url, i) => {
                        const isActive = avatarUrl === url;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setAvatarUrl(url);
                              setIsVaultOpen(false);
                            }}
                            className={`aspect-square rounded-xl flex items-center justify-center overflow-hidden transition-all cursor-pointer border ${
                              isActive
                                ? 'ring-2 ring-amber-500 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-105 z-10'
                                : 'border-white/10 bg-white/[0.03] hover:scale-105 hover:border-amber-500/50 hover:bg-amber-500/10'
                            }`}
                          >
                            <img src={url} alt={`Vault ${idx}-${i}`} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ProfileModal as EditProfileModal };
