'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Crown,
  Lock,
  Save,
  Loader2,
  Check,
  Tag,
  Shield,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { updateStudyRoomIdentityAction } from '../../app/actions/profile';
import { getSupabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { UserAvatar } from '../common/UserAvatar';

const PRESET_BADGES = [
  'VIP',
  'Scholar',
  'Night Owl',
  'Coder',
  'Architect',
  'Speedrunner',
  'Zen Master',
];

export function StudyRoomIdentityCard() {
  const { user, updateProfile } = useAuth();
  const { isPremium, openPremiumModal } = usePremium();

  const [customTitle, setCustomTitle] = useState<string>(user?.custom_title || '');
  const [customBadge, setCustomBadge] = useState<string>(user?.custom_badge || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync initial values when user changes or loads
  useEffect(() => {
    if (user) {
      setCustomTitle(user.custom_title || '');
      setCustomBadge(user.custom_badge || '');
    }
  }, [user?.custom_title, user?.custom_badge]);

  const titleLength = customTitle.length;
  const badgeLength = customBadge.length;

  const isChanged =
    (customTitle.trim() || null) !== (user?.custom_title || null) ||
    (customBadge.trim() || null) !== (user?.custom_badge || null);

  const handleSelectPreset = (preset: string) => {
    if (!isPremium) {
      openPremiumModal();
      return;
    }
    setCustomBadge(preset);
  };

  const handleClear = () => {
    setCustomTitle('');
    setCustomBadge('');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPremium) {
      openPremiumModal();
      return;
    }

    const cleanTitle = customTitle.trim();
    const cleanBadge = customBadge.trim();

    if (cleanTitle.length > 20) {
      toast.error('Custom title cannot exceed 20 characters');
      return;
    }
    if (cleanBadge.length > 15) {
      toast.error('Badge tag cannot exceed 15 characters');
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      // 1. Execute secure server action with subscription verification
      const res = await updateStudyRoomIdentityAction({
        custom_title: cleanTitle,
        custom_badge: cleanBadge,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update study room identity');
      }

      // 2. Optimistically update client AuthContext
      updateProfile({
        custom_title: cleanTitle || null,
        custom_badge: cleanBadge || null,
      });

      // 3. Fallback client-side Supabase write if connected
      const supabase = getSupabase();
      if (supabase && user?.id) {
        await supabase
          .from('profiles')
          .update({
            custom_title: cleanTitle || null,
            custom_badge: cleanBadge || null,
          })
          .eq('id', user.id);
      }

      setSavedSuccess(true);
      toast.success('Study room identity saved! ✨');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving study room identity:', err);
      toast.error(err.message || 'Error updating identity');
    } finally {
      setIsSaving(false);
    }
  };

  const resolvedAvatar =
    user?.avatarUrl ||
    (user as any)?.avatar_url ||
    (user as any)?.user_metadata?.avatar_url ||
    (user as any)?.user_metadata?.picture ||
    null;

  const resolvedName =
    (user as any)?.username || user?.displayName || user?.email?.split('@')[0] || 'Scholar';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm relative overflow-hidden">
      {/* Decorative subtle background glow */}
      <div
        className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{
          background: isPremium
            ? 'radial-gradient(circle, #E6C15A 0%, rgba(230,193,90,0) 70%)'
            : 'radial-gradient(circle, #64748b 0%, rgba(100,116,139,0) 70%)',
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-sm ${
              isPremium
                ? 'bg-[#E6C15A]/15 border-[#E6C15A]/30 text-[#E6C15A]'
                : 'bg-white/[0.04] border-[var(--border)] text-slate-400'
            }`}
          >
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-hud font-extrabold text-[var(--text)] tracking-wider uppercase">
                Study Room Identity
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-hud font-bold tracking-wider uppercase border ${
                  isPremium
                    ? 'bg-[#E6C15A]/15 border-[#E6C15A]/40 text-[#E6C15A]'
                    : 'bg-white/[0.04] border-[var(--border)] text-slate-400'
                }`}
              >
                {isPremium ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>PREMIUM EXCLUSIVE</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5" />
                    <span>LOCKED</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[var(--text-dim)] font-mono mt-0.5">
              Personalize your display title &amp; custom badge in live focus rooms
            </p>
          </div>
        </div>
      </div>

      {/* Free Tier Locked State Banner */}
      {!isPremium ? (
        <div className="relative rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] via-black/40 to-black/60 p-5 sm:p-6 text-center flex flex-col items-center gap-3 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 flex items-center justify-center text-[#E6C15A] shadow-[0_0_20px_rgba(230,193,90,0.2)]">
            <Lock className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-hud font-bold text-white tracking-wide uppercase">
              Unlock Custom Titles &amp; Room Badges
            </h4>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Stand out in live study lounges with bespoke badge tags like{' '}
              <span className="text-[#E6C15A] font-semibold">[VIP]</span> or{' '}
              <span className="text-[#E6C15A] font-semibold">[Scholar]</span> and a custom title
              displayed beside your avatar.
            </p>
          </div>

          {/* Sample Preview for Free Users */}
          <div className="my-2 p-3 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3 text-left">
            <UserAvatar src={resolvedAvatar} name={resolvedName} size={40} className="border border-[#E6C15A]/50" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{resolvedName}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E6C15A]/15 border border-[#E6C15A]/50 text-[#E6C15A] font-hud font-bold uppercase tracking-wider">
                  VIP
                </span>
              </div>
              <span className="text-[11px] font-medium text-amber-200/70">
                Grandmaster of Deep Work
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openPremiumModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E6C15A] via-[#d4af37] to-[#b38f2a] text-slate-950 text-xs font-hud font-black tracking-wider uppercase shadow-[0_0_20px_rgba(230,193,90,0.35)] hover:shadow-[0_0_25px_rgba(230,193,90,0.5)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer mt-1"
          >
            <Crown className="w-4 h-4 fill-current" />
            <span>UPGRADE TO STUDY.IO PREMIUM</span>
          </button>
        </div>
      ) : (
        /* Premium User Form */
        <form onSubmit={handleSave} className="space-y-5">
          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-black/40 border border-[#E6C15A]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs font-hud font-bold tracking-wider text-amber-300/80 uppercase">
              <Eye className="w-3.5 h-3.5" />
              <span>LIVE STUDY ROOM PREVIEW</span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#090d14]/90 border border-white/10 self-start sm:self-auto min-w-[200px]">
              <div className="relative">
                <UserAvatar
                  src={resolvedAvatar}
                  name={resolvedName}
                  size={42}
                  className="border-2 border-[#E6C15A] shadow-[0_0_12px_rgba(230,193,90,0.35)]"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-100 truncate max-w-[110px]">
                    {resolvedName}
                  </span>
                  {customBadge.trim() ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E6C15A]/15 border border-[#E6C15A]/60 text-[#E6C15A] font-hud font-bold tracking-wider uppercase shadow-[0_0_8px_rgba(230,193,90,0.2)] inline-flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{customBadge.trim()}</span>
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold uppercase tracking-wider">
                      Scholar
                    </span>
                  )}
                </div>

                {customTitle.trim() ? (
                  <span className="text-[11px] font-medium text-amber-200/80 tracking-tight truncate max-w-[160px]">
                    {customTitle.trim()}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No custom title</span>
                )}
              </div>
            </div>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Title Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="custom_title_input"
                  className="text-xs font-hud font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5 text-[#E6C15A]" />
                  <span>CUSTOM TITLE</span>
                </label>
                <span
                  className={`text-[11px] font-mono font-medium ${
                    titleLength >= 20 ? 'text-rose-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {titleLength}/20
                </span>
              </div>
              <input
                id="custom_title_input"
                type="text"
                maxLength={20}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value.slice(0, 20))}
                placeholder="e.g. Master Archivist, Coder"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E6C15A]/60 focus:ring-1 focus:ring-[#E6C15A]/40 font-mono transition-all"
              />
              <p className="text-[11px] text-slate-400 font-mono">
                Appears under your name in room participant rosters and presence cards.
              </p>
            </div>

            {/* Badge Tag Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="custom_badge_input"
                  className="text-xs font-hud font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-[#E6C15A]" />
                  <span>BADGE TAG</span>
                </label>
                <span
                  className={`text-[11px] font-mono font-medium ${
                    badgeLength >= 15 ? 'text-rose-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {badgeLength}/15
                </span>
              </div>
              <input
                id="custom_badge_input"
                type="text"
                maxLength={15}
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value.slice(0, 15))}
                placeholder="e.g. VIP, Scholar, Coder"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E6C15A]/60 focus:ring-1 focus:ring-[#E6C15A]/40 font-mono uppercase transition-all"
              />
              <p className="text-[11px] text-slate-400 font-mono">
                Pill badge displayed next to your handle with a golden border.
              </p>
            </div>
          </div>

          {/* Quick-select Preset Badges */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-hud font-bold tracking-wider text-slate-400 uppercase">
              QUICK BADGE PRESETS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BADGES.map((badge) => {
                const isSelected = customBadge.trim().toUpperCase() === badge.toUpperCase();
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => handleSelectPreset(badge)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-hud font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E6C15A] text-slate-950 border-[#E6C15A] shadow-[0_0_12px_rgba(230,193,90,0.35)]'
                        : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-[#E6C15A]/40 hover:text-white'
                    }`}
                  >
                    {badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl text-xs font-hud font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR</span>
            </button>

            <button
              type="submit"
              disabled={isSaving || (!isChanged && !savedSuccess)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E6C15A] via-[#d4af37] to-[#b38f2a] text-slate-950 text-xs font-hud font-black tracking-wider uppercase transition-all shadow-[0_0_16px_rgba(230,193,90,0.3)] hover:shadow-[0_0_22px_rgba(230,193,90,0.45)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SAVED!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE IDENTITY</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
