'use client';

import React, { useState } from 'react';
import { GrowthEmblem } from '@/components/rooms/emblems/GrowthEmblem';
import { EMBLEM_STAGES, STAGE_NAMES, type EmblemStage } from '@/components/rooms/emblems/emblemStages';
import { EMBLEM_FAMILIES } from '@/components/rooms/emblems/emblemRegistry';
import { StudyEmblemModal } from '@/components/rooms/emblems/StudyEmblemModal';

export default function DevStudyEmblemsPage() {
  const [selectedStage, setSelectedStage] = useState<EmblemStage>(3);
  const [testState, setTestState] = useState<'studying' | 'paused' | 'offline'>('studying');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equippedFamily, setEquippedFamily] = useState<'spark' | 'crystal'>('spark');

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-hud font-bold tracking-wider text-amber-400">
              STUDY EMBLEMS DEV LAB
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Phase 1 Living scenes: Spark (Free) &amp; Crystal (Pro) across all 7 growth stages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-hud font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Launch Emblem Picker Modal
          </button>
        </header>

        {/* Global Controls */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-hud font-bold uppercase tracking-wider text-slate-400">
                Active Stage: Stage {selectedStage} ({STAGE_NAMES[selectedStage]})
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                {EMBLEM_STAGES.map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setSelectedStage(stg)}
                    className={`px-3 py-1 rounded-lg text-xs font-hud font-bold transition-all cursor-pointer ${
                      selectedStage === stg
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Stg {stg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-hud font-bold uppercase tracking-wider text-slate-400">
                State Simulation
              </span>
              <div className="flex items-center gap-2 pt-1">
                {(['studying', 'paused', 'offline'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTestState(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      testState === s
                        ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Showcase (Spark vs Crystal) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Spark Card */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-amber-500/20 space-y-6 flex flex-col items-center">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-hud font-bold uppercase">
                Free Family
              </div>
              <h2 className="text-xl font-hud font-bold text-white tracking-wider">SPARK</h2>
              <p className="text-xs text-slate-400">
                From ember to blazing bonfire with warm atmospheric glow &amp; embers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center min-h-[260px] w-full">
              <GrowthEmblem
                family="spark"
                stage={selectedStage}
                state={testState}
                size="lg"
                isPremium={false}
                showPips={true}
              />
            </div>

            {/* All 7 Stages Strip */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-hud font-bold uppercase tracking-wider text-slate-400 block text-center">
                Spark 7-Stage Growth Progression (sm size)
              </span>
              <div className="grid grid-cols-7 gap-2">
                {EMBLEM_STAGES.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <GrowthEmblem
                      family="spark"
                      stage={s}
                      state={testState}
                      size="sm"
                      isPremium={false}
                      showPips={false}
                    />
                    <span className="text-[10px] font-mono text-slate-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Crystal Card */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-cyan-500/20 space-y-6 flex flex-col items-center">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-hud font-bold uppercase">
                Pro Exclusive
              </div>
              <h2 className="text-xl font-hud font-bold text-white tracking-wider">CRYSTAL</h2>
              <p className="text-xs text-slate-400">
                From tiny shard to radiant crystal cluster with floating gems &amp; rays.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center min-h-[260px] w-full">
              <GrowthEmblem
                family="crystal"
                stage={selectedStage}
                state={testState}
                size="lg"
                isPremium={true}
                showPips={true}
              />
            </div>

            {/* All 7 Stages Strip */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-hud font-bold uppercase tracking-wider text-slate-400 block text-center">
                Crystal 7-Stage Growth Progression (sm size)
              </span>
              <div className="grid grid-cols-7 gap-2">
                {EMBLEM_STAGES.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <GrowthEmblem
                      family="crystal"
                      stage={s}
                      state={testState}
                      size="sm"
                      isPremium={true}
                      showPips={false}
                    />
                    <span className="text-[10px] font-mono text-slate-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Component */}
        <StudyEmblemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentFamily={equippedFamily}
          currentTodaySeconds={5400}
          onEquipFamily={(f) => setEquippedFamily(f as any)}
          isPro={true}
        />
      </div>
    </div>
  );
}
