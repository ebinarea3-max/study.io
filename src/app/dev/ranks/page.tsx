'use client';

import React, { useState, useEffect } from 'react';
import { RANK_TIERS } from '../../../lib/rankedSystem';
import { RankCrestBadge } from '../../../components/common/RankCrestBadge';
import { RankSettlementModal } from '../../../components/gamification/RankSettlementModal';
import { RankSettlementData } from '../../../types';

export default function RankPreviewPage() {
  const [isClient, setIsClient] = useState(false);
  const [previewData, setPreviewData] = useState<RankSettlementData | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;
  if (process.env.NODE_ENV === 'production') return <div className="p-8 text-white">Not found</div>;

  const handlePreview = (targetIdx: number) => {
    const targetTierConfig = RANK_TIERS[targetIdx];
    // Jump from the immediately preceding rank to this rank to simulate realistic promotions
    const prevConfig = targetIdx > 0 ? RANK_TIERS[targetIdx - 1] : RANK_TIERS[0];

    // For Bronze I, to show some RP gain without tier-up, just start lower in Bronze I
    const prevRP = targetIdx === 0 ? 0 : prevConfig.maxRP - 10;
    const newRP = targetTierConfig.minRP + 10;
    
    setPreviewData({
      prevRP,
      newRP,
      breakdown: {
        sessionRP: newRP - prevRP,
        goalStreakBonus: 0,
        taskBonus: 0,
        totalGained: newRP - prevRP,
        durationSeconds: 600,
        isUnderMinDuration: false,
        streakBonusClaimedToday: false,
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-8 overflow-y-auto pb-32">
      <h1 className="text-3xl font-bold text-white mb-4">Developer Rank Preview</h1>
      <p className="text-slate-400 mb-8 max-w-2xl">
        Preview ambient animations and settlement screens. This page is only available in development mode. 
        Clicking "Preview Rank-Up" temporarily overrides the local UI state to simulate a promotion from the immediately preceding rank to the selected rank.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {RANK_TIERS.map((config, idx) => (
          <div key={config.fullTitle} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col items-center shadow-lg relative overflow-hidden">
            <RankCrestBadge 
              tier={config.tier} 
              division={config.division} 
              size={120} 
            />
            <h3 className="text-white font-bold tracking-widest mt-6 mb-4 text-center">{config.fullTitle}</h3>
            <button 
              onClick={() => handlePreview(idx)}
              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md text-xs font-semibold tracking-wider text-emerald-400 transition-all active:scale-95"
            >
              PREVIEW RANK-UP
            </button>
          </div>
        ))}
      </div>

      <RankSettlementModal
        isOpen={!!previewData}
        data={previewData}
        onContinue={() => setPreviewData(null)}
      />
      
      {previewData && (
        <button 
          onClick={() => setPreviewData(null)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm uppercase tracking-widest rounded-full shadow-xl shadow-rose-900/50 z-[60] transition-transform active:scale-95 border border-rose-400/50"
        >
          Reset to my real rank
        </button>
      )}
    </div>
  );
}
