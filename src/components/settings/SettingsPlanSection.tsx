'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Star, CreditCard } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';

export function SettingsPlanSection() {
  const { isPremium, premiumUntil, openPremiumModal } = usePremium();

  const formattedDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] shadow-sm">
          {isPremium ? (
            <Star className="w-5 h-5 fill-current" />
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
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>View Benefits</span>
          </Link>
        )}
      </div>
    </div>
  );
}
