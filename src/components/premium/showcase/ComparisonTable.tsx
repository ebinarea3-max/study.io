'use client';

import React from 'react';
import { Check, X, Sparkles, Star } from 'lucide-react';

interface ComparisonRow {
  category?: string;
  feature: string;
  description: string;
  free: string | boolean;
  premium: string | boolean;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    category: 'Core Study Tools',
    feature: 'Precision Focus Timers',
    description: 'Stopwatch mode & Pomodoro intervals (25/5 and 50/10)',
    free: true,
    premium: true,
  },
  {
    feature: 'Daily Checklist & Streaks',
    description: 'Keyboard-friendly tasks and continuous streak counters',
    free: true,
    premium: true,
  },
  {
    feature: 'Collaborative Study Rooms',
    description: 'Silent lounges and subject-specific focus halls',
    free: true,
    premium: true,
  },
  {
    feature: 'Ranked RP Progression',
    description: 'Bronze to Grandmaster monthly ladder and rank crests',
    free: true,
    premium: true,
  },
  {
    feature: 'Audio Soundscapes',
    description: 'Zero-latency synthesized chimes and focus bells',
    free: true,
    premium: true,
  },
  {
    category: 'Premium Aesthetics & Flair',
    feature: 'Handcrafted Themes',
    description: 'Warm Gold Leaf and deep Crimson palettes',
    free: '9 Standard Themes',
    premium: '11 Themes (All Handcrafted)',
  },
  {
    feature: 'Scholar Profile Star Badge',
    description: 'Distinctive gold star mark on profile and settings',
    free: false,
    premium: true,
  },
  {
    feature: 'Avatar Frames & Leaderboard Flair',
    description: 'Custom Gold, Aurora, and Ember avatar rings in rankings',
    free: false,
    premium: true,
  },
  {
    category: 'Deep Analytics & Telemetry',
    feature: 'Study Insights Heatmap',
    description: '12-week activity grid, peak hours, and weekday breakdown',
    free: 'Sample preview',
    premium: 'Full live telemetry',
  },
  {
    feature: 'Weekly Report Card',
    description: 'Automated week-over-week growth and subject analysis',
    free: 'Sample preview',
    premium: 'Full report & trends',
  },
  {
    feature: 'Daily Focus Goals',
    description: 'Configurable daily targets and goal streak telemetry',
    free: 'Sample preview',
    premium: 'Custom goals & streaks',
  },
  {
    feature: '1080x1920 Season Recap Card',
    description: 'High-resolution milestone cards for stories and socials',
    free: 'Sample preview',
    premium: 'Unlimited exports',
  },
];

export function ComparisonTable() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60">
              <th className="py-4 px-4 sm:px-6 text-xs font-hud font-bold tracking-wider uppercase text-[var(--text-dim)] w-1/2">
                Feature
              </th>
              <th className="py-4 px-4 text-center text-xs font-hud font-bold tracking-wider uppercase text-[var(--text)] w-1/4">
                Free
              </th>
              <th className="py-4 px-4 text-center text-xs font-hud font-bold tracking-wider uppercase text-[#E6C15A] w-1/4">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Premium</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-xs">
            {COMPARISON_DATA.map((row, idx) => (
              <React.Fragment key={idx}>
                {row.category && (
                  <tr className="bg-[var(--surface-2)]/30">
                    <td
                      colSpan={3}
                      className="py-2.5 px-4 sm:px-6 font-hud font-bold text-[10px] uppercase tracking-widest text-[#E6C15A]"
                    >
                      {row.category}
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-semibold text-[var(--text)] text-sm">
                      {row.feature}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)] mt-0.5 leading-snug">
                      {row.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[var(--text-dim)] font-mono">
                    {row.free === true ? (
                      <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 items-center justify-center mx-auto">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : row.free === false ? (
                      <span className="inline-flex w-5 h-5 rounded-full bg-white/5 text-[var(--text-dim)] items-center justify-center mx-auto">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[var(--text-dim)]">
                        {row.free}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {row.premium === true ? (
                      <span className="inline-flex w-5 h-5 rounded-full bg-[#E6C15A]/20 text-[#E6C15A] items-center justify-center mx-auto">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : typeof row.premium === 'string' && row.premium.includes('Coming soon') ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-hud uppercase tracking-wider font-semibold bg-white/5 text-[var(--text-dim)] border border-[var(--border)]">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#E6C15A]">
                        {row.premium}
                      </span>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
