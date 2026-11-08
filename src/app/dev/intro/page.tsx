'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  Sparkles,
  Layers,
  BookOpen,
  Target,
  Play,
  RotateCcw,
} from 'lucide-react';
import { WelcomeIntro } from '@/components/intro/WelcomeIntro';
import { INTRO_CONTENT } from '@/lib/introContent';

export default function DevIntroPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'subject' | 'focus'>('subject');
  const [isIntroOpen, setIsIntroOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Route safety: strictly 404 in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
    return <div className="p-8 text-white font-mono">404 - Not Found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0D0E] text-white p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                  DEV TOOL
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-hud tracking-wide">
                  Welcome Intro Walkthrough Testbed
                </h1>
              </div>
              <p className="text-xs text-white/50 font-mono mt-1">
                Test the 7-step onboarding intro without modifying any account or database flags.
              </p>
            </div>
          </div>
        </div>

        {/* Control Box */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-6">
          <h2 className="text-sm font-hud font-bold tracking-wider text-white uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E6C15A]" />
            <span>Interactive Controls</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mode Toggle */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <label className="text-xs font-mono text-white/70 block">
                Study Mode Simulation:
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedMode('subject')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedMode === 'subject'
                      ? 'bg-[#E6C15A] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Subject Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('focus')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedMode === 'focus'
                      ? 'bg-[#E6C15A] text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Focus Mode</span>
                </button>
              </div>
              <p className="text-[11px] text-white/40 font-mono">
                {selectedMode === 'focus'
                  ? 'Focus mode drops subject labels, chips, and subject-specific wording.'
                  : 'Subject mode displays subject chips and session breakdown wording.'}
              </p>
            </div>

            {/* Launch Action */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-3">
              <div>
                <label className="text-xs font-mono text-white/70 block">
                  Launch Walkthrough:
                </label>
                <p className="text-[11px] text-white/40 font-mono mt-1">
                  Opens full-screen modal with dialog semantics, touch swipe, and keyboard controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIntroOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#E6C15A] hover:bg-[#D4AF37] text-black font-bold text-xs font-hud tracking-wider uppercase transition-all shadow-lg shadow-[#E6C15A]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Open Welcome Intro ({selectedMode} mode)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Copy Reference / Ground Truth Inspection */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
          <h2 className="text-sm font-hud font-bold tracking-wider text-white uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E6C15A]" />
            <span>Ground Truth Slide Copy Budget Verification</span>
          </h2>
          <div className="space-y-3">
            {INTRO_CONTENT.slides.map((s, idx) => {
              const headlineWordCount = s.headline.trim().split(/\s+/).length;
              const lineSubjectWordCount = s.lineSubject.trim().split(/\s+/).length;
              const lineFocusWordCount = s.lineFocus.trim().split(/\s+/).length;

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <strong className="text-white">{s.headline}</strong>
                      <span className="text-[10px] text-white/40">
                        ({headlineWordCount}/6 words)
                      </span>
                    </div>
                    <div className="text-neutral-400 pl-7 text-[11px]">
                      Subject: "{s.lineSubject}" ({lineSubjectWordCount}/12 words)
                    </div>
                    <div className="text-neutral-500 pl-7 text-[11px]">
                      Focus: "{s.lineFocus}" ({lineFocusWordCount}/12 words)
                    </div>
                  </div>
                  <div className="text-[10px] text-[#E6C15A]/80 font-mono text-right max-w-xs truncate">
                    {s.sourceFact}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render the Welcome Intro if opened */}
      {isIntroOpen && (
        <WelcomeIntro
          isOpen={true}
          isReplay={true}
          forcedMode={selectedMode}
          onClose={() => setIsIntroOpen(false)}
        />
      )}
    </div>
  );
}

