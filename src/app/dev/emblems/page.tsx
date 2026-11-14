'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import { GrowthEmblem } from '@/components/rooms/emblems/GrowthEmblem';
import {
  EMBLEM_FAMILIES,
  ALL_EMBLEM_FAMILIES,
  type EmblemFamilyId,
  type EmblemState,
  type EmblemSize,
} from '@/components/rooms/emblems/emblemRegistry';
import {
  EMBLEM_STAGES,
  STAGE_NAMES,
  type EmblemStage,
} from '@/components/rooms/emblems/emblemStages';
import { Sparkles, Play, Pause, FastForward, Users, Activity } from 'lucide-react';

export default function DevEmblemsPage() {
  // 404 in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Showcase state
  const [activeSize, setActiveSize] = useState<EmblemSize>('md');
  const [activeState, setActiveState] = useState<EmblemState>('studying');
  const [activeStage, setActiveStage] = useState<EmblemStage>(3);
  const [isPausedAll, setIsPausedAll] = useState(false);
  const [isPreviewingDay, setIsPreviewingDay] = useState(false);
  const [viewMode, setViewMode] = useState<'families' | 'matrix' | 'simulation'>('families');

  // FPS Meter state for 100-member simulation
  const [fps, setFps] = useState<number>(60);
  const fpsRef = useRef<{ frames: number; prevTime: number }>({
    frames: 0,
    prevTime: typeof performance !== 'undefined' ? performance.now() : 0,
  });

  // FPS calculation loop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let animId: number;

    const calcFps = (time: number) => {
      fpsRef.current.frames++;
      if (time - fpsRef.current.prevTime >= 1000) {
        setFps(Math.round((fpsRef.current.frames * 1000) / (time - fpsRef.current.prevTime)));
        fpsRef.current.frames = 0;
        fpsRef.current.prevTime = time;
      }
      animId = requestAnimationFrame(calcFps);
    };

    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // "Preview a day" loop: advances stage every 1.2s through 0..6
  useEffect(() => {
    if (!isPreviewingDay) return;

    const timer = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= 6) {
          setIsPreviewingDay(false);
          return 6;
        }
        return (prev + 1) as EmblemStage;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPreviewingDay]);

  // Compute final emblem state taking "Pause all" into account
  const effectiveState: EmblemState = isPausedAll ? 'paused' : activeState;

  // Generate 100 simulated members for the simulation test
  const simulatedMembers = useRef(
    Array.from({ length: 100 }, (_, i) => {
      const fam = ALL_EMBLEM_FAMILIES[i % ALL_EMBLEM_FAMILIES.length];
      const stage = (i % 7) as EmblemStage;
      const state: EmblemState = i % 3 === 0 ? 'studying' : i % 3 === 1 ? 'paused' : 'offline';
      return {
        id: `scholar_${i + 1}`,
        name: `Scholar #${i + 1}`,
        family: fam,
        stage,
        state,
      };
    })
  ).current;

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-hud font-bold uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 2 Verified Dev Lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-hud font-bold tracking-wider text-white">
              STUDY EMBLEMS SYSTEM (/dev/emblems)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Test all 6 families &times; 7 growth stages &times; 3 states, 24-cap performance, and 100-member pod simulation.
            </p>
          </div>

          {/* Real-time Performance HUD */}
          <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] font-hud font-bold uppercase tracking-wider text-slate-400">
                Performance Meter
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-lg font-mono font-bold ${
                    fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {fps} FPS
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Max 24 Active Loops</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-hud font-bold">
            <button
              type="button"
              onClick={() => setViewMode('families')}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'families'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 6 Families
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7-Stage Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewMode('simulation')}
              className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'simulation'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Simulate 100 Members</span>
            </button>
          </div>

          {/* Controls: Size, States, Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Size Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-hud">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setActiveSize(sz)}
                  className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                    activeSize === sz
                      ? 'bg-white/20 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz} ({sz === 'sm' ? '64px' : sz === 'md' ? '112px' : '200px'})
                </button>
              ))}
            </div>

            {/* State Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-hud">
              {(['studying', 'paused', 'offline'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveState(st)}
                  className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                    activeState === st
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Pause All Button */}
            <button
              type="button"
              onClick={() => setIsPausedAll((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-hud font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPausedAll
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isPausedAll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPausedAll ? 'Resume All' : 'Pause All'}</span>
            </button>

            {/* Preview a Day Button */}
            <button
              type="button"
              onClick={() => {
                setActiveStage(0);
                setIsPreviewingDay(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-hud font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPreviewingDay
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{isPreviewingDay ? `Stage ${activeStage}...` : 'Preview a Day'}</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: All 6 Families Detailed Showcase */}
        {viewMode === 'families' && (
          <div className="space-y-6">
            {/* Stage Selector Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="text-xs font-hud font-bold uppercase tracking-wider text-slate-300">
                Current Stage: <span className="text-amber-400">Stage {activeStage} ({STAGE_NAMES[activeStage]})</span>
              </span>
              <div className="flex items-center gap-1.5">
                {EMBLEM_STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setIsPreviewingDay(false);
                      setActiveStage(s);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-hud font-bold transition-all cursor-pointer ${
                      activeStage === s
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Stg {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 6 Family Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ALL_EMBLEM_FAMILIES.map((famId) => {
                const meta = EMBLEM_FAMILIES[famId];
                return (
                  <div
                    key={famId}
                    className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col items-center gap-4"
                  >
                    {/* Header */}
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="font-hud font-bold text-white text-base tracking-wider uppercase">
                          {meta.name}
                        </h3>
                        {meta.premium ? (
                          <span className="text-[9px] font-hud font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pro
                          </span>
                        ) : (
                          <span className="text-[9px] font-hud font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 max-w-xs">{meta.tagline}</p>
                    </div>

                    {/* Emblem Showcase Tile */}
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 w-full flex items-center justify-center min-h-[160px]">
                      <GrowthEmblem
                        family={famId}
                        stage={activeStage}
                        state={effectiveState}
                        size={activeSize}
                        isPremium={true}
                        showPips={true}
                      />
                    </div>

                    {/* Small 7-Stage Strip below */}
                    <div className="w-full pt-2 border-t border-white/5">
                      <div className="grid grid-cols-7 gap-1">
                        {EMBLEM_STAGES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setActiveStage(s)}
                            className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors cursor-pointer ${
                              activeStage === s ? 'bg-white/10' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="scale-[0.4] origin-center -my-3">
                              <GrowthEmblem
                                family={famId}
                                stage={s}
                                state={effectiveState}
                                size="sm"
                                isPremium={true}
                                showPips={false}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">{s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Complete 7-Stage Growth Matrix */}
        {viewMode === 'matrix' && (
          <div className="space-y-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-hud font-bold uppercase tracking-wider p-3 text-slate-400">
                    Family
                  </th>
                  {EMBLEM_STAGES.map((stg) => (
                    <th
                      key={stg}
                      className="text-center text-xs font-hud font-bold uppercase tracking-wider p-3 text-slate-400"
                    >
                      Stage {stg} ({STAGE_NAMES[stg]})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ALL_EMBLEM_FAMILIES.map((famId) => {
                  const meta = EMBLEM_FAMILIES[famId];
                  return (
                    <tr key={famId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 align-middle">
                        <div className="font-hud font-bold text-white text-xs uppercase">
                          {meta.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {meta.premium ? 'Pro Exclusive' : 'Free Default'}
                        </div>
                      </td>
                      {EMBLEM_STAGES.map((stg) => (
                        <td key={stg} className="p-2 text-center align-middle">
                          <div className="inline-flex flex-col items-center">
                            <GrowthEmblem
                              family={famId}
                              stage={stg}
                              state={effectiveState}
                              size="sm"
                              isPremium={true}
                              showPips={false}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: Simulate 100 Members in a Study Room Pod Grid */}
        {viewMode === 'simulation' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span>
                <strong>100 Simulated Scholars:</strong> Testing IntersectionObserver performance capping. Only visible pods (max 24) keep active CSS animations; off-screen pods sleep.
              </span>
              <span className="font-mono font-bold text-sm bg-black/40 px-3 py-1 rounded-xl">
                Live: {fps} FPS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[700px] overflow-y-auto p-2 scrollbar-thin">
              {simulatedMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2 select-none"
                >
                  <GrowthEmblem
                    family={member.family}
                    stage={member.stage}
                    state={isPausedAll ? 'paused' : member.state}
                    size="sm"
                    isPremium={true}
                    showPips={true}
                  />
                  <div className="text-center w-full min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">{member.name}</p>
                    <p className="text-[9px] font-mono text-slate-400 capitalize">{member.state}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
