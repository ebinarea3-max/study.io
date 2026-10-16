'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Award, BookOpen, RotateCcw } from 'lucide-react';

export function DemoWeeklyReportTile() {
  const [inView, setInView] = useState(false);
  const [counter, setCounter] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Number count-up animation when inView
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = 24.5;
    const duration = 1200; // ms
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = parseFloat((ease * end).toFixed(1));
      setCounter(val);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [inView]);

  const handleReplay = () => {
    setCounter(0);
    setInView(false);
    setTimeout(() => setInView(true), 50);
  };

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#E6C15A]" />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Weekly Report Card
            </h4>
          </div>
          <button
            type="button"
            onClick={handleReplay}
            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] transition-colors cursor-pointer flex items-center gap-1"
            title="Replay counter"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Replay</span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-dim)] mb-4">
          Automated weekly performance digest comparing consistency, subject growth, and study milestones.
        </p>

        {/* Big Counter Card */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] relative overflow-hidden">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] block">
                Total Focus Time
              </span>
              <div className="font-hud font-extrabold text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
                {counter.toFixed(1)}
                <span className="text-base sm:text-lg font-bold text-[#E6C15A] ml-1">hrs</span>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+22%</span>
            </div>
          </div>

          {/* Mini 7-Day Bar Comparison */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-dim)]">
              <span>Active consistency:</span>
              <span className="text-[var(--text)] font-semibold">6 of 7 days</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-dim)]">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#E6C15A]" />
                <span>Top subject:</span>
              </span>
              <span className="text-[var(--text)] font-semibold">Algorithms (+45m)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-dim)] font-mono leading-relaxed">
        &ldquo;Tuesday was your strongest day with 5.4 hours logged.&rdquo;
      </div>
    </div>
  );
}
