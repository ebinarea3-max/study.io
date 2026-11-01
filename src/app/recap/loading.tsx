import React from 'react';

export default function RecapLoading() {
  return (
    <div
      style={{
        colorScheme: 'dark',
        backgroundColor: 'var(--bg, #07090e)',
        color: 'var(--text, #ffffff)',
      }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden select-none"
    >
      {/* Background Ambience: base + dot grid + vignette */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-60 z-0" />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--glow, rgba(255,255,255,0.08)) 0%, transparent 65%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      {/* Skeleton Content */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center justify-center text-center space-y-8">
        {/* Status Chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-xs font-mono font-medium tracking-wider text-[var(--text-dim)]">
            Preparing your season
          </span>
        </div>

        {/* Pulsing Crest Shield Placeholder */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shadow-card animate-pulse">
          <div className="w-32 h-32 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl border border-dashed border-[var(--border)] opacity-60 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
        </div>

        {/* Skeleton Text Bars */}
        <div className="space-y-3 w-full max-w-xs flex flex-col items-center">
          <div className="h-5 w-48 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-[var(--surface)] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
