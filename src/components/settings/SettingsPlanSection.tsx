'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Crown,
  CreditCard,
  RotateCw,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { toast } from 'react-hot-toast';

export function SettingsPlanSection() {
  const {
    isPremium,
    premiumUntil,
    plan,
    status,
    cancelAtCycleEnd,
    openPremiumModal,
    refresh,
  } = usePremium();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const formattedDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Handle "Refresh status" action
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/billing/sync', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to refresh subscription status');
      }
      await refresh();
      toast.success('Subscription status refreshed! ✨');
    } catch (err: any) {
      console.error('Refresh status error:', err);
      toast.error(err.message || 'Error refreshing status');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Plan Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm flex flex-col gap-4">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-sm ${
                isPremium
                  ? 'bg-[#E6C15A]/15 border-[#E6C15A]/30 text-[#E6C15A]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-dim)]'
              }`}
            >
              {isPremium ? (
                <Crown className="w-5 h-5 fill-current" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-hud font-bold text-[var(--text)] tracking-wider uppercase">
                  {isPremium
                    ? plan === 'yearly'
                      ? 'study.io Premium (Yearly)'
                      : 'study.io Premium (Monthly)'
                    : 'Free Scholar Plan'}
                </h4>
                {isPremium && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-hud font-bold tracking-widest uppercase border ${
                      cancelAtCycleEnd
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {cancelAtCycleEnd ? 'Cancels at cycle end' : 'Active'}
                  </span>
                )}
              </div>

              <div className="text-xs text-[var(--text-dim)] mt-1 font-sans flex items-center gap-1.5">
                {isPremium ? (
                  cancelAtCycleEnd ? (
                    <span>
                      Access active until <strong className="text-[var(--text)]">{formattedDate}</strong> (no further renewal)
                    </span>
                  ) : (
                    <span>
                      Renews on <strong className="text-[var(--text)]">{formattedDate}</strong>
                    </span>
                  )
                ) : (
                  <span>Standard access to timer, tasks &amp; community</span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isPremium ? (
              <button
                type="button"
                id="settings-see-premium-btn"
                onClick={openPremiumModal}
                className="px-4 py-2 rounded-xl text-xs font-hud font-bold tracking-wider uppercase bg-[#E6C15A] text-[#1A1405] hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Premium</span>
              </button>
            ) : (
              <Link
                href="/premium"
                className="px-3.5 py-1.5 rounded-xl text-xs font-hud font-semibold text-[#E6C15A] hover:bg-[#E6C15A]/10 border border-[#E6C15A]/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>View Benefits</span>
              </Link>
            )}
          </div>
        </div>

        {/* Subscription Management Controls (When Premium) */}
        {isPremium && (
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-start gap-3 text-xs">
            {/* Refresh Status Button */}
            <button
              type="button"
              id="refresh-subscription-status-btn"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-3)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] transition-colors cursor-pointer disabled:opacity-60"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh status'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
