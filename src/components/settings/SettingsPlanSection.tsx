'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Crown, CreditCard } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { useAuth } from '../../context/AuthContext';
import { FlairFrame, getMyFlair, saveMyFlair } from '../../lib/flair';
import { UserAvatar } from '../common/UserAvatar';
import toast from 'react-hot-toast';

export function SettingsPlanSection() {
  const { user } = useAuth();
  const { isPremium, premiumUntil, openPremiumModal } = usePremium();

  const [selectedFrame, setSelectedFrame] = useState<FlairFrame>('gold');
  const [showBadge, setShowBadge] = useState<boolean>(true);
  const [isLoadingFlair, setIsLoadingFlair] = useState<boolean>(false);
  const [isSavingFlair, setIsSavingFlair] = useState<boolean>(false);

  // Load current flair settings from profile_flair if premium
  useEffect(() => {
    if (!isPremium || !user?.id) return;

    let isMounted = true;
    setIsLoadingFlair(true);

    getMyFlair(user.id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setSelectedFrame(data.frame);
          setShowBadge(data.showBadge);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingFlair(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isPremium, user?.id]);


  const handleToggleShowBadge = useCallback(
    async (newVal: boolean) => {
      setShowBadge(newVal);
      if (!user?.id) return;

      setIsSavingFlair(true);
      const res = await saveMyFlair(user.id, selectedFrame, newVal);
      setIsSavingFlair(false);

      if (!res.success) {
        toast.error(res.error || 'Failed to update badge visibility.');
      } else {
        toast.success(newVal ? 'Premium badge visible to others' : 'Premium badge hidden', {
          id: 'badge-visibility-updated',
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: '12px',
          },
        });
      }
    },
    [user?.id, selectedFrame]
  );

  const formattedDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="space-y-4">
      {/* 1. Plan Overview Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] shadow-sm">
            {isPremium ? (
              <Crown className="w-5 h-5 fill-current" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-hud font-bold text-[var(--text)] tracking-wider uppercase">
                Plan
              </h4>
              {isPremium && (
                <span className="px-2 py-0.5 rounded text-[10px] font-hud font-bold tracking-widest uppercase bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-dim)] mt-0.5 font-sans">
              {isPremium ? (
                <span className="text-[var(--text)] font-medium">
                  Premium • Active until {formattedDate || 'lifetime'}
                </span>
              ) : (
                <span>Free plan</span>
              )}
            </div>
          </div>
        </div>

        <div>
          {!isPremium ? (
            <button
              type="button"
              id="settings-see-premium-btn"
              onClick={openPremiumModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>See Premium</span>
            </button>
          ) : (
            <Link
              href="/premium"
              className="px-3 py-1.5 rounded-xl text-xs font-hud font-semibold text-[#E6C15A] hover:bg-[#E6C15A]/10 border border-[#E6C15A]/30 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>View Benefits</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Premium Scholar Crown Customization (Premium Only) */}
      {isPremium && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border)]/50">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 fill-current" />
              <h4 className="text-xs font-hud font-bold text-[var(--text)] tracking-wider uppercase">
                Premium Scholar Crown
              </h4>
            </div>

            {/* Toggle: Show Crown Badge */}
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0" title="Toggle public premium crown badge">
              <span className="text-xs font-hud text-[var(--text-dim)] font-medium">
                {showBadge ? 'Crown Enabled' : 'Crown Hidden'}
              </span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) => handleToggleShowBadge(e.target.checked)}
                  disabled={isSavingFlair}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-fg/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
              </div>
            </label>
          </div>

          <p className="text-xs text-[var(--text-dim)] font-sans -mt-1">
            Display your signature golden crown icon on the bottom left of your profile avatar across Leaderboards and Study Rooms.
          </p>

          {/* Profile Icon Preview with Crown on Bottom Left */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-fg/[0.02] flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <UserAvatar
                src={user?.user_metadata?.avatar_url || (user as any)?.avatar_url}
                name={user?.user_metadata?.full_name || user?.email || 'Scholar'}
                size={54}
                className="rounded-full"
                showCrown={showBadge}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-hud font-bold text-[var(--text)] tracking-wider truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Scholar'}
                </span>
                {showBadge && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-hud font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    <span>Crown Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
                {showBadge
                  ? 'Your signature crown is visible on the bottom left of your profile icon.'
                  : 'Your signature crown is currently hidden from other scholars.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
