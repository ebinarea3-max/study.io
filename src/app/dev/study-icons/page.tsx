'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Pause,
  Play,
  Users,
  Activity,
  Layers,
  Crown,
} from 'lucide-react';
import {
  ALL_ICON_IDS,
  STUDY_ICONS,
  type StudyIconId,
  type StudyIconState,
  type StudyIconSize,
} from '@/components/rooms/studyIcons/registry';
import { StudyIcon } from '@/components/rooms/studyIcons/StudyIcon';

interface MemberSimulation {
  id: string;
  name: string;
  iconId: StudyIconId;
  state: StudyIconState;
}

export default function DevStudyIconsPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedSize, setSelectedSize] = useState<StudyIconSize | 'all'>('md');
  const [isPausedAll, setIsPausedAll] = useState(false);
  const [showSim100, setShowSim100] = useState(false);
  const [simulatedMembers, setSimulatedMembers] = useState<MemberSimulation[]>([]);
  const [fps, setFps] = useState<number>(60);

  // FPS Counter Ref
  const fpsFramesRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Live FPS Readout
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      if (delta > 0) {
        const currentFps = 1000 / delta;
        fpsFramesRef.current.push(currentFps);
        if (fpsFramesRef.current.length > 30) {
          fpsFramesRef.current.shift();
        }
        const avgFps = Math.round(
          fpsFramesRef.current.reduce((a, b) => a + b, 0) / fpsFramesRef.current.length
        );
        setFps(avgFps);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Generate 100 simulated members
  useEffect(() => {
    const states: StudyIconState[] = ['studying', 'studying', 'studying', 'paused', 'idle'];
    const members: MemberSimulation[] = Array.from({ length: 100 }, (_, i) => ({
      id: `member-${i + 1}`,
      name: `Scholar ${i + 1}`,
      iconId: ALL_ICON_IDS[i % ALL_ICON_IDS.length],
      state: states[Math.floor(Math.random() * states.length)],
    }));
    setSimulatedMembers(members);
  }, []);

  if (!isClient) return null;

  // Strict 404 in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
    return null;
  }

  const sizesToRender: StudyIconSize[] =
    selectedSize === 'all' ? ['sm', 'md', 'lg'] : [selectedSize];

  const statesToRender: StudyIconState[] = isPausedAll
    ? ['paused']
    : ['studying', 'paused', 'idle'];

  const studyingCount = simulatedMembers.filter((m) => m.state === 'studying').length;

  return (
    <div className="min-h-screen bg-[#07080b] text-white p-6 sm:p-10 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-hud font-bold uppercase tracking-wider text-white">
                Study Icons Lab
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Dev Preview
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing all 10 animated icons, states, viewports, and the 24-simultaneous animation cap.
            </p>
          </div>
        </div>

        {/* Global Controls & Telemetry */}
        <div className="flex flex-wrap items-center gap-3">
          {/* FPS Readout */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">FPS:</span>
            <span
              className={`font-bold ${
                fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {fps}
            </span>
          </div>

          {/* Size Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-hud">
            {(['sm', 'md', 'lg', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  selectedSize === s
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Pause All Toggle */}
          <button
            type="button"
            onClick={() => setIsPausedAll((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-hud font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              isPausedAll
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {isPausedAll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPausedAll ? 'Resume All' : 'Pause All'}</span>
          </button>

          {/* 100 Member Simulation Toggle */}
          <button
            type="button"
            onClick={() => setShowSim100((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-hud font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              showSim100
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>100 Members Sim</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 space-y-12">
        {/* Section 1: 100 Members Stress Simulation Grid */}
        {showSim100 && (
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-hud font-bold uppercase tracking-wider text-white">
                    100 Members Room Stress Test
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Cap: 24 active animations
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Testing IntersectionObserver performance under 100 simultaneous room member cards.
                  Currently {studyingCount} members in studying state (top 24 nearest to viewport center animate; remaining hold still frame).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const states: StudyIconState[] = ['studying', 'studying', 'paused', 'idle'];
                  setSimulatedMembers((prev) =>
                    prev.map((m) => ({
                      ...m,
                      state: states[Math.floor(Math.random() * states.length)],
                    }))
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-xs font-mono text-slate-300 cursor-pointer"
              >
                Shuffle States
              </button>
            </div>

            {/* 100 Members Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3 max-h-[460px] overflow-y-auto p-2 scrollbar-thin">
              {simulatedMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col items-center p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/20 transition-all text-center"
                  style={{ contentVisibility: 'auto' }}
                >
                  <StudyIcon
                    id={m.iconId}
                    userId={m.id}
                    state={isPausedAll ? 'paused' : m.state}
                    size="sm"
                    isPremium={true}
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate w-full mt-1.5">
                    {m.name}
                  </span>
                  <span
                    className={`text-[8px] font-mono uppercase ${
                      m.state === 'studying'
                        ? 'text-emerald-400'
                        : m.state === 'paused'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isPausedAll ? 'paused' : m.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: All 10 Icons Matrix (Free + Premium) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-base font-hud font-bold uppercase tracking-wider text-white">
                All 10 Study Icons
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                4 Free icons + 6 Exclusive Premium icons rendered across all 3 focus states.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ALL_ICON_IDS.map((iconId) => {
              const meta = STUDY_ICONS[iconId];

              return (
                <div
                  key={iconId}
                  className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4 hover:border-white/20 transition-all"
                >
                  {/* Icon Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-hud font-bold text-sm uppercase tracking-wider text-white">
                        {meta.name}
                      </h3>
                      {meta.premium ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-hud font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Crown className="w-2.5 h-2.5 fill-current" />
                          Premium
                        </span>
                      ) : (
                        <span className="text-[9px] font-hud font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Free
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ID: {meta.id}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{meta.description}</p>

                  {/* Render matrix for this icon */}
                  <div className="space-y-3 pt-2">
                    {sizesToRender.map((size) => (
                      <div
                        key={size}
                        className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/5 gap-4"
                      >
                        <span className="text-[11px] font-mono text-slate-400 uppercase w-12 shrink-0">
                          {size} ({size === 'sm' ? '36px' : size === 'md' ? '64px' : '120px'})
                        </span>

                        <div className="flex items-center gap-6 sm:gap-8">
                          {statesToRender.map((st) => (
                            <div key={st} className="flex flex-col items-center gap-1.5">
                              <StudyIcon
                                id={iconId}
                                state={isPausedAll ? 'paused' : st}
                                size={size}
                                isPremium={true}
                              />
                              <span className="text-[9px] font-mono text-slate-400 uppercase">
                                {isPausedAll ? 'paused' : st}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
