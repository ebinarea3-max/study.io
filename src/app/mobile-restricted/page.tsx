'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Smartphone, Download, Monitor, ShieldAlert, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function MobileRestrictedPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    // Placeholder action for native app APK / Store link
    setTimeout(() => {
      // In production, this can point to the hosted APK or store listing
      // e.g. window.location.href = '/downloads/study-io.apk';
    }, 600);
  };

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden select-none">
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ backgroundColor: 'var(--accent)' }}
      />

      {/* Top Bar with Brand */}
      <header className="relative z-10 w-full max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8 drop-shadow-md" />
          <span className="font-hud font-extrabold text-lg tracking-wider uppercase text-white">
            STUDY<span className="text-[var(--accent)] font-mono">.IO</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-hud-mono font-bold uppercase tracking-wider text-neutral-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Mobile Notice</span>
        </div>
      </header>

      {/* Main Notice Card */}
      <section className="relative z-10 w-full max-w-lg mx-auto my-auto py-8">
        <div className="bg-[var(--surface)]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

          {/* Icon Badge */}
          <div className="flex justify-center">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center shadow-lg"
                style={{ color: 'var(--accent)' }}
              >
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                <Download className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Heading & Exact Required Message */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--accent-soft)] border border-[var(--border)] text-[11px] font-hud-mono font-semibold text-[var(--accent)] tracking-wider uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Native Experience Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-hud font-bold tracking-tight text-white leading-snug">
              Study.io is only available on desktop web or our native mobile app
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed max-w-md mx-auto">
              To deliver background stopwatch timers, precise focus tracking, low-latency ambient audio, and room communications without mobile browser suspension, mobile web access is restricted.
            </p>
          </div>

          {/* Download Action Section */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-6 rounded-2xl font-hud-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] hover:brightness-110 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
                boxShadow: '0 4px 20px var(--glow)',
              }}
            >
              {downloadStarted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Download Initialized</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Native App</span>
                </>
              )}
            </button>

            {downloadStarted && (
              <p className="text-[11px] font-mono text-center text-emerald-400 animate-in fade-in duration-200">
                Opening download package. If your download doesn't start, please check back shortly.
              </p>
            )}
          </div>

          {/* Feature Checklist */}
          <div className="pt-2 border-t border-white/5 grid grid-cols-1 gap-2.5 text-xs text-neutral-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Uninterrupted background study timers & alarms</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live peer study rooms and synchronized chats</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Local offline session logging and rank progression</span>
            </div>
          </div>

          {/* Desktop Web Fallback Notice */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Monitor className="w-4 h-4 text-neutral-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-neutral-200 block truncate">
                  Are you on a desktop PC or Mac?
                </span>
                <span className="text-[10px] text-neutral-500 font-mono block truncate">
                  Request desktop site or visit via desktop browser.
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-hud-mono font-bold text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Try Web</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-lg mx-auto text-center">
        <p className="text-[11px] text-neutral-600 font-mono">
          &copy; {new Date().getFullYear()} Study.io &bull; Precision Focus Infrastructure
        </p>
      </footer>
    </main>
  );
}
