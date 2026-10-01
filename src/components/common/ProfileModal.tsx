'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { X, Target, User, Loader2, Save } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getRankTier } from '../../lib/rankedSystem';
import { getSupabase } from '../../lib/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const differenceInDays = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { gamification } = useStudy();

  const userRank = getRankTier(user.seasonRp || 0);

  const [displayName, setDisplayName] = useState(user.name || user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [dailyGoalHours, setDailyGoalHours] = useState(user.dailyGoalHours);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state whenever user or modal open status changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.name || user.displayName || '');
      setUsername(user.username || '');
      setDailyGoalHours(user.dailyGoalHours);
      setErrorMsg('');
    }
  }, [isOpen, user.name, user.displayName, user.username, user.dailyGoalHours]);

  if (!isOpen) return null;

  // Profile avatar automatically defaults to authenticated Google profile picture
  // (from Supabase Auth metadata: avatar_url or picture) or user's existing avatarUrl
  const effectiveAvatarUrl =
    (user.user_metadata?.avatar_url as string) ||
    (user.user_metadata?.picture as string) ||
    user.avatarUrl ||
    '';

  const cleanedHandle = username.replace(/^@/, '').toLowerCase().trim();

  let cooldownDaysLeft = 0;
  let isCooldownActive = false;

  if (user.username_changed_at) {
    cooldownDaysLeft = 30 - differenceInDays(new Date(), new Date(user.username_changed_at));
    if (cooldownDaysLeft > 0) {
      isCooldownActive = true;
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    setErrorMsg("");
    
    try {
      const updatePayload: any = {
        name: displayName.trim(),
        daily_goal_hours: Number(dailyGoalHours)
      };

      const usernameChanged = cleanedHandle !== (user.username || '');
      
      if (usernameChanged) {
        if (isCooldownActive) {
          throw new Error(`User ID can only be changed once every 30 days. Available again in ${cooldownDaysLeft} days.`);
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
        username: updatePayload.username || user.username,
        dailyGoalHours: updatePayload.daily_goal_hours,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0c1017] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight uppercase tracking-wider">Edit Profile</h3>
              <p className="text-xs text-neutral-400 font-mono tracking-tight mt-0.5">Customize your identity & targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Compact Top Header */}
          <div className="flex items-center gap-4 bg-[#131822] border border-white/5 p-4 rounded-xl">
            <UserAvatar
              src={effectiveAvatarUrl}
              name={displayName || user.displayName || 'S'}
              size={56}
              className="w-14 h-14 rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] shrink-0"
            />
            <div className="min-w-0">
              <div className="font-bold text-base text-white truncate">{displayName || user.displayName || 'Scholar'}</div>
              <div className="text-sm text-neutral-400 font-mono truncate mt-0.5">@{cleanedHandle || 'handle'}</div>
              
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-[#0c1017]" style={{ borderColor: userRank.config.badgeAccent, color: userRank.config.badgeAccent }}>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {userRank.fullTitle}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-2 block">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Ebin"
                className="w-full bg-[#131822] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
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
                  maxLength={20}
                  value={username}
                  disabled={isCooldownActive}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. ebin_k"
                  className="w-full bg-[#131822] border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-1.5 text-[10px] font-mono">
                {isCooldownActive ? (
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
                className="w-full accent-cyan-500 bg-[#131822] border border-white/5 cursor-pointer h-2 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-2 font-mono">
                <span>1h Light</span>
                <span>4h Mod</span>
                <span>6h Pro</span>
                <span>10h+ Hard</span>
              </div>
            </div>

            {errorMsg && (
              <div className="text-[11px] text-rose-500 font-mono mt-2 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-lg border border-white/10 bg-[#131822] hover:bg-white/5 text-neutral-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || displayName.trim().length < 2 || cleanedHandle.length < 3 || (cleanedHandle !== (user.username || '') && isCooldownActive)}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> SAVE PROFILE
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { ProfileModal as EditProfileModal };
