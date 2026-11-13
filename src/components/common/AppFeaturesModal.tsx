'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Timer,
  Trophy,
  Users,
  Volume2,
  CheckSquare,
  BarChart3,
  Sparkles,
  ArrowRight,
  Play,
  Flame,
  CheckCircle2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { RankCrestBadge } from './RankCrestBadge';
import { getSupabase } from '../../lib/supabase';

interface AppFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeatureTabId = 'timers' | 'ranks' | 'rooms' | 'sounds' | 'tasks' | 'stats';

interface FeatureTab {
  id: FeatureTabId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  tag: string;
}

const FEATURE_TABS: FeatureTab[] = [
  {
    id: 'timers',
    label: 'Precision Timers',
    shortLabel: 'Timers',
    icon: Timer,
    color: '#34D399',
    tag: '3 Modes',
  },
  {
    id: 'ranks',
    label: '23 Rank Tiers',
    shortLabel: 'Ranks',
    icon: Trophy,
    color: '#F59E0B',
    tag: 'Bronze to GM',
  },
  {
    id: 'rooms',
    label: 'Live Study Rooms',
    shortLabel: 'Rooms',
    icon: Users,
    color: '#38BDF8',
    tag: 'Up to 100',
  },
  {
    id: 'sounds',
    label: 'Sounds & Themes',
    shortLabel: 'Atmosphere',
    icon: Volume2,
    color: '#A78BFA',
    tag: '8 Sounds • 18 Themes',
  },
  {
    id: 'tasks',
    label: 'Tasks & Timetable',
    shortLabel: 'Tasks',
    icon: CheckSquare,
    color: '#F472B6',
    tag: 'Smart Planner',
  },
  {
    id: 'stats',
    label: 'Deep Analytics',
    shortLabel: 'Stats',
    icon: BarChart3,
    color: '#10B981',
    tag: 'Heatmaps & 24h',
  },
];

export function AppFeaturesModal({ isOpen, onClose }: AppFeaturesModalProps) {
  const [activeTab, setActiveTab] = useState<FeatureTabId>('timers');
  const [previewTimerMode, setPreviewTimerMode] = useState<'pomodoro' | 'stopwatch' | 'countdown'>('pomodoro');
  const [selectedRankTier, setSelectedRankTier] = useState<string>('grandmaster');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://studyio-web.vercel.app/auth/callback',
        },
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setIsSigningIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="features-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[86vh] bg-[#0A0C11] border border-white/[0.1] rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        {/* Subtle top ambient hairline highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

        {/* Ambient background glow inside modal */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <header className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Tour</span>
            </span>
            <div className="hidden sm:block text-xs text-slate-400">
              Built for deep work, accountability &amp; progress
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close features modal"
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Modal Body: Tabs + Feature Showcase View */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row relative z-10 min-h-0">
          {/* Navigation Sidebar (Desktop) / Horizontal Scroll (Mobile) */}
          <nav
            aria-label="Feature categories"
            className="w-full md:w-60 shrink-0 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-white/[0.06] flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar"
          >
            {FEATURE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer shrink-0 md:shrink ${
                    isActive
                      ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${tab.color}15`,
                        color: tab.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight whitespace-nowrap">
                        {tab.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono hidden md:block">
                        {tab.tag}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 hidden md:block transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Active Feature Showcase Pane */}
          <main className="flex-1 p-5 sm:p-7 overflow-y-auto min-h-0">
            {/* 1. TIMERS */}
            {activeTab === 'timers' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-semibold mb-2">
                    01 • PRECISION FOCUS ENGINES
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Three Timer Modes Designed for Pure Flow
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Stopwatch for open-ended study, Pomodoro with structured focus &amp; break phases (25/5 and 50/10), or custom countdowns up to 24 hours. Features a 60-tick watch bezel, automatic idle detection, and sub-50ms peer synchronization across all your tabs and devices.
                  </p>
                </div>

                {/* Interactive Timer Preview Widget */}
                <div className="p-5 rounded-2xl bg-[#0F1219] border border-white/[0.08] shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    {/* Mode Switcher */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      {(['pomodoro', 'stopwatch', 'countdown'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPreviewTimerMode(mode)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                            previewTimerMode === mode
                              ? 'bg-emerald-500 text-[#04140D] shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Sync</span>
                    </div>
                  </div>

                  {/* Dial Preview */}
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                        <circle
                          cx="70"
                          cy="70"
                          r="60"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="70"
                          cy="70"
                          r="60"
                          fill="none"
                          stroke="#34D399"
                          strokeWidth="4"
                          strokeDasharray="376.99"
                          strokeDashoffset={previewTimerMode === 'pomodoro' ? 100 : previewTimerMode === 'stopwatch' ? 240 : 160}
                          strokeLinecap="round"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-mono text-2xl font-extrabold text-white">
                          {previewTimerMode === 'pomodoro'
                            ? '25:00'
                            : previewTimerMode === 'stopwatch'
                            ? '01:42:15'
                            : '45:00'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                          {previewTimerMode === 'pomodoro'
                            ? 'Focus Phase'
                            : previewTimerMode === 'stopwatch'
                            ? 'Open Focus'
                            : 'Target Left'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 max-w-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Work, Short Break, &amp; Long Break cycles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Instant cross-device active session sync</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Accumulate Rank Points (RP) &amp; Focus XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RANKS & SEASONS */}
            {activeTab === 'ranks' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-mono font-semibold mb-2">
                    02 • COMPETITIVE PROGRESSION
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Climb Through 23 Ranks from Bronze to Grandmaster
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Earn 100 Rank Points (RP) for every full hour of focus. Climb through 23 rank divisions across 8 tiers. Every calendar month features a ranked season soft reset that recalibrates tiers so everyone competes afresh.
                  </p>
                </div>

                {/* Interactive Rank Crest Viewer */}
                <div className="p-5 rounded-2xl bg-[#0F1219] border border-white/[0.08] shadow-inner space-y-4">
                  <div className="text-xs font-semibold text-slate-300">
                    Select a tier to inspect authentic crest artwork:
                  </div>

                  {/* Tier selector pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'bronze',
                      'silver',
                      'gold',
                      'platinum',
                      'diamond',
                      'champion',
                      'master',
                      'grandmaster',
                    ].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedRankTier(tier)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                          selectedRankTier === tier
                            ? 'bg-amber-400 text-neutral-950 shadow-md font-bold'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>

                  {/* Crest Display Card */}
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-6 pt-4 border-t border-white/[0.06]">
                    <div className="relative flex items-center justify-center">
                      <RankCrestBadge
                        tier={selectedRankTier}
                        size={120}
                        interactive={false}
                        priority
                      />
                    </div>

                    <div className="text-center sm:text-left space-y-1">
                      <div className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold">
                        Competitive Rank Tier
                      </div>
                      <div className="text-2xl font-black text-white capitalize">
                        {selectedRankTier}
                      </div>
                      <div className="text-xs text-slate-400 max-w-xs">
                        {selectedRankTier === 'grandmaster' && '40,000+ RP • Peak focus scholars'}
                        {selectedRankTier === 'master' && '34,500 – 39,999 RP • Master tier'}
                        {selectedRankTier === 'champion' && '30,000 – 34,499 RP • Apex competitors'}
                        {selectedRankTier === 'diamond' && '16,500 – 29,999 RP (Divisions I–IV)'}
                        {selectedRankTier === 'platinum' && '8,000 – 16,499 RP (Divisions I–IV)'}
                        {selectedRankTier === 'gold' && '2,800 – 7,999 RP (Divisions I–IV)'}
                        {selectedRankTier === 'silver' && '800 – 2,799 RP (Divisions I–IV)'}
                        {selectedRankTier === 'bronze' && '0 – 799 RP (Divisions I–IV)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. STUDY ROOMS */}
            {activeTab === 'rooms' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-mono font-semibold mb-2">
                    03 • MULTIPLAYER ACCOUNTABILITY
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Live Virtual Study Rooms Up to 100 Scholars
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Study alongside friends, cohorts, and global scholars. Create public or password-protected rooms, or join using a 6-character short code. View real-time active timers, status indicators (Studying vs Resting), and in-room chat.
                  </p>
                </div>

                {/* Mock Room Preview Card */}
                <div className="p-5 rounded-2xl bg-[#0F1219] border border-white/[0.08] shadow-inner space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Deep Work &amp; STEM Library</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          CODE: 8XF92A
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">3 scholars currently studying</div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      3 / 100 Members
                    </span>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600/80 text-white font-bold flex items-center justify-center text-xs">
                          AL
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Alexander L.</div>
                          <div className="text-[11px] text-emerald-400 font-mono">Organic Chemistry</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>01:42:10</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-600/80 text-white font-bold flex items-center justify-center text-xs">
                          MR
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Maya R.</div>
                          <div className="text-[11px] text-cyan-400 font-mono">Quantum Algorithms</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>00:54:32</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-600/80 text-white font-bold flex items-center justify-center text-xs">
                          DK
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Devin K.</div>
                          <div className="text-[11px] text-amber-400 font-mono">Short Break (5m)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Resting</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SOUNDS & THEMES */}
            {activeTab === 'sounds' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-mono font-semibold mb-2">
                    04 • IMMERSION &amp; AESTHETICS
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    8 Ambient Soundscapes &amp; 18 Custom Themes
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Tune out background chatter with engineered ambient focus audio or dive into Fullscreen Focus Mode. Customize your experience with 18 hand-crafted themes from OLED true pitch black to radiant emerald.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Soundscapes Box */}
                  <div className="p-4 rounded-2xl bg-[#0F1219] border border-white/[0.08] space-y-3">
                    <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      8 Focus Soundscapes
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Gentle Rain',
                        'Fireplace',
                        'Calm Meditation',
                        'Brown Noise',
                        'Pink Noise',
                        'White Noise',
                        'Pure Silence',
                      ].map((sound) => (
                        <span
                          key={sound}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 font-medium"
                        >
                          {sound}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Themes Box */}
                  <div className="p-4 rounded-2xl bg-[#0F1219] border border-white/[0.08] space-y-3">
                    <div className="text-xs font-bold text-pink-300 uppercase tracking-wider">
                      18 Visual Themes
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Rank Theme',
                        'Midnight',
                        'Cyberpunk',
                        'Ember',
                        'Ocean',
                        'Emerald',
                        'Amethyst',
                        'OLED Abyss',
                        'Gold Leaf',
                        'Paper (Light)',
                      ].map((theme) => (
                        <span
                          key={theme}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TASKS & TIMETABLE */}
            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[11px] font-mono font-semibold mb-2">
                    05 • PRODUCTIVITY &amp; PLANNING
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Prioritized Checklist &amp; Weekly Timetable Routine
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Prioritize study targets by high, medium, and low urgency. Smart paste automatically detects subjects and tags. Click &ldquo;Focus on this&rdquo; to lock the timer directly onto any task, or plan routine schedules on the 7-day weekly timetable.
                  </p>
                </div>

                {/* Mock Tasks Box */}
                <div className="p-5 rounded-2xl bg-[#0F1219] border border-white/[0.08] shadow-inner space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md border border-emerald-400/60 bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 line-through opacity-75">
                          Review Thermodynamics Problem Set 4
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Physics • 45m logged</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      Done
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-emerald-500/25">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md border border-white/30" />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          Synthesize Distributed Consensus Architecture
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">System Design • !High</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-[#04140D] font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Focus</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. STATS & ANALYTICS */}
            {activeTab === 'stats' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-semibold mb-2">
                    06 • ACTIONABLE INTELLIGENCE
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    24-Hour Timeline &amp; Discipline Heatmaps
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Track every session on an hourly 24-hour block timeline. Inspect subject distribution donuts across daily, weekly, and monthly scopes. View your monthly target discipline calendar matrix and daily consistency streaks.
                  </p>
                </div>

                {/* Mock Analytics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0F1219] border border-white/[0.08] space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Subject Time Allocation
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">5h 20m Today</div>
                    <div className="space-y-1.5 text-xs text-slate-300 pt-2">
                      <div className="flex justify-between">
                        <span>Computer Science</span>
                        <span className="font-mono text-emerald-400">55% (2h 55m)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Applied Mathematics</span>
                        <span className="font-mono text-cyan-400">30% (1h 35m)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cognitive Science</span>
                        <span className="font-mono text-purple-400">15% (0h 50m)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F1219] border border-white/[0.08] space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Streak &amp; Consistency
                    </div>
                    <div className="text-2xl font-mono font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-6 h-6 text-amber-400" />
                      <span>14 Days Continuous</span>
                    </div>
                    <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                      Daily consistency awards +100 XP streak bonuses. All focus history syncs permanently across web and native Android.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modal Bottom Dock */}
        <footer className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0A0C11] flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span className="text-slate-200 font-semibold">Instant cloud sync</span> &bull; Web &amp; Android &bull; Secure Google OAuth
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
            >
              Close Tour
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
