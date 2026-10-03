'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MonthlyLeaderboard } from '../../components/leaderboard/MonthlyLeaderboard';

export default function LeaderboardPage() {
  return (
    <div className="bg-[#05070a] text-white min-h-screen font-sans">
      {/* Top Header Navigation */}
      <div className="max-w-4xl mx-auto pt-6 px-6 sm:px-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-semibold text-neutral-300 hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <MonthlyLeaderboard isEmbedded={false} />
    </div>
  );
}
