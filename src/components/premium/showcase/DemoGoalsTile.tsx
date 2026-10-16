'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Target, Flame, RotateCcw } from 'lucide-react';

export function DemoGoalsTile() {
  const [inView, setInView] = useState(false);
  const [percent, setPercent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const targetPercent = 72;

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

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setPercent(Math.round(ease * targetPercent));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [inView]);

  const handleReplay = () => {
    setPercent(0);
    setInView(false);
    setTimeout(() => setInView(true), 50);
  };

  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[#E6C15A]" />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Focus Goals &amp; Streaks
            </h4>
          </div>
          <button
            type="button"
            onClick={handleReplay}
            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] transition-colors cursor-pointer flex items-center gap-1"
            title="Replay ring animation"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Replay</span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-dim)] mb-4">
          Set daily targets and build uninterrupted focus streaks with real-time goal rings.
        </p>

        {/* Progress Ring Layout */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-around gap-4">
          {/* Animated SVG Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                stroke="#E6C15A"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: 'stroke-dashoffset 0.1s linear',
                  filter: 'drop-shadow(0 0 6px rgba(230, 193, 90, 0.4))',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-hud font-extrabold text-xl text-[var(--text)]">
                {percent}%
              </span>
              <span className="text-[9px] font-mono text-[var(--text-dim)]">today</span>
            </div>
          </div>

          {/* Goal Telemetry Summary */}
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] block">
                Daily Goal
              </span>
              <span className="text-sm font-bold text-[var(--text)] font-mono">
                65 / 90 mins
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex items-center gap-1.5 text-xs text-orange-400 font-mono font-semibold">
              <Flame className="w-4 h-4 fill-current" />
              <span>7-day goal streak</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-dim)] font-mono">
        Muted HUD line on timer: &ldquo;Today 65 of 90 min&rdquo;
      </div>
    </div>
  );
}
