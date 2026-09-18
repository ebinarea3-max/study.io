'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { X, Target, Award, Flame, Sparkles, Trophy, RefreshCw } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getRankTier } from '../../lib/rankedSystem';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { gamification, simulateSeasonReset } = useStudy();

  const userRank = getRankTier(user.seasonRp || 0);
  const currentSeason = user.currentSeasonId || '2026-09';

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [dailyGoalHours, setDailyGoalHours] = useState(user.dailyGoalHours);

  // Sync state whenever user or modal open status changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setDailyGoalHours(user.dailyGoalHours);
    }
  }, [isOpen, user.displayName, user.bio, user.dailyGoalHours]);

  if (!isOpen) return null;

  // Profile avatar automatically defaults to authenticated Google profile picture
  // (from Supabase Auth metadata: avatar_url or picture) or user's existing avatarUrl
  const effectiveAvatarUrl =
    (user.user_metadata?.avatar_url as string) ||
    (user.user_metadata?.picture as string) ||
    user.avatarUrl ||
    '';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: displayName.trim() || user.displayName,
      bio: bio.trim(),
      dailyGoalHours: Number(dailyGoalHours),
      avatarUrl: effectiveAvatarUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white leading-tight">Edit Profile & Goals</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Customize your study persona & daily target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body if on ultra-compact screen; fits without scrolling on normal screens */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* User stats banner with Gamification Level & XP Progress */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <UserAvatar
                    src={effectiveAvatarUrl}
                    name={displayName || user.displayName}
                    size={48}
                    className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    {user.streakDays}d
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                    <span className="truncate max-w-[140px] sm:max-w-[180px]">{displayName || user.displayName}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${gamification.tierBadge.badgeClass}`}>
                      {gamification.tierBadge.icon} Lv. {gamification.level} · {gamification.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 font-medium">Daily Target</div>
                <div className="text-sm sm:text-base font-black text-emerald-400">{dailyGoalHours}h / day</div>
              </div>
            </div>

            {/* XP Progress Bar to Next Level */}
            <div className="pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{gamification.totalXP.toLocaleString()} Total XP</span>
                </span>
                <span className="text-emerald-400 font-bold font-mono text-[10px]">
                  {Math.round(gamification.progressPercent)}% to Lv. {gamification.level + 1}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${gamification.progressPercent}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>{gamification.xpInCurrentLevel} / {gamification.xpNeededForNextLevel} XP in level</span>
                <span className="text-emerald-400 font-mono font-medium">
                  {gamification.xpRemaining} XP remaining
                </span>
              </div>
            </div>
          </div>

          {/* Free Fire Ranked Season Card */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: userRank.config.badgeAccent }}
                />
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-300">
                  RANKED SEASON · {currentSeason}
                </span>
              </div>
              <button
                type="button"
                onClick={simulateSeasonReset}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                title="Test Monthly Soft Rank Reset"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Simulate Reset</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs sm:text-sm font-black italic tracking-wider uppercase bg-gradient-to-r ${userRank.config.metallicGradient} bg-clip-text text-transparent`}
                >
                  {userRank.fullTitle}
                </span>
              </div>
              <div className="text-right font-mono text-xs font-bold text-slate-300">
                <span style={{ color: userRank.config.badgeAccent }}>{userRank.rp.toLocaleString()}</span>
                <span className="text-slate-400"> / {userRank.maxRP.toLocaleString()} RP</span>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden relative border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(5, userRank.progressPercent))}%`,
                  backgroundColor: userRank.config.badgeAccent,
                  boxShadow: `0 0 10px ${userRank.config.glowColor}`,
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3 pt-0.5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Status / Focus Goal */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status / Focus Goal</label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="e.g. Preparing for finals / MCAT 🎯"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Daily Goal Target (Hours) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daily Study Goal: {dailyGoalHours} Hours</span>
                </label>
                <span className="text-xs text-emerald-400 font-bold">{Math.round(dailyGoalHours * 60)} mins</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="0.5"
                value={dailyGoalHours}
                onChange={e => setDailyGoalHours(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>1h Light</span>
                <span>4h Moderate</span>
                <span>6h Dedicated</span>
                <span>10h+ Hardcore</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { ProfileModal as EditProfileModal };
