'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { getSupabase } from '@/lib/supabase';
import {
  Download,
  ArrowUpRight,
  X,
  Timer,
  Trophy,
  Users,
  Flame,
  Volume2,
  Palette,
  BarChart3,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { RankCrestBadge } from '@/components/common/RankCrestBadge';

interface FeatureItem {
  id: string;
  title: string;
  caption: string;
  icon: React.ElementType;
  accentColor: string;
}

const APP_FEATURES: FeatureItem[] = [
  {
    id: 'timers',
    title: 'Three timers',
    caption: 'Stopwatch, countdown and Pomodoro.',
    icon: Timer,
    accentColor: '#FFFFFF',
  },
  {
    id: 'ranks',
    title: 'Ranks and RP',
    caption: '23 ranks, a new season every month.',
    icon: Trophy,
    accentColor: '#F59E0B',
  },
  {
    id: 'rooms',
    title: 'Live rooms',
    caption: 'Study together with chat and live status.',
    icon: Users,
    accentColor: '#38BDF8',
  },
  {
    id: 'streaks',
    title: 'Streaks and levels',
    caption: 'Show up daily and level up.',
    icon: Flame,
    accentColor: '#FB923C',
  },
  {
    id: 'sounds',
    title: 'Sounds',
    caption: 'Eight ambient sounds for deep focus.',
    icon: Volume2,
    accentColor: '#A78BFA',
  },
  {
    id: 'themes',
    title: 'Themes',
    caption: 'Pick from 18 looks.',
    icon: Palette,
    accentColor: '#F472B6',
  },
  {
    id: 'stats',
    title: 'Stats',
    caption: 'Your focus time, day by day.',
    icon: BarChart3,
    accentColor: '#34D399',
  },
];

export default function MobileRestrictedPage() {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        Capacitor.isNativePlatform() ||
        Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
        Boolean(navigator?.userAgent && (
          navigator.userAgent.includes('StudyIoNativeApp') ||
          /StudyIoNativeApp/i.test(navigator.userAgent)
        ))
      );
    }
    return false;
  });

  // Check user agent and Capacitor runtime for native app identifier
  useEffect(() => {
    const isNative =
      Capacitor.isNativePlatform() ||
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      Boolean(navigator?.userAgent && (
        navigator.userAgent.includes('StudyIoNativeApp') ||
        /StudyIoNativeApp/i.test(navigator.userAgent)
      ));
    
    setIsNativeApp(isNative);
    if (isNative) {
      // Native app MUST bypass the mobile block and immediately redirect to main application interface
      router.replace('/dashboard');
    }
  }, [router]);

  // Supabase session check: if user has an active session, automatically redirect to /dashboard
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard');
        }
      });
    }
  }, [router]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Keep existing APK URL & download handler
  const apkUrl = '/downloads/study-io.apk';
  const versionString = 'Android, v2.4';

  const handleDownload = useCallback(() => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'study-io.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
  }, [apkUrl]);

  // Ensure page loads scrolled to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Bottom sheet accessibility & focus management
  const openSheet = useCallback(() => {
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 50);
  }, []);

  // Keyboard Escape listener & focus trap
  useEffect(() => {
    if (!isSheetOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSheet();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSheetOpen, closeSheet]);

  // Touch drag-down to close sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartYRef.current;
    if (diff > 60) {
      closeSheet();
    }
    touchStartYRef.current = null;
  };

  if (isNativeApp) {
    return (
      <div className="min-h-[100svh] w-full bg-[#07090E] flex flex-col items-center justify-center text-slate-100">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-xs text-slate-400 font-mono tracking-wider">Opening study.io...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] h-[100svh] max-h-[100svh] w-full bg-[#07090E] text-slate-100 overflow-hidden relative select-none flex flex-col justify-between landscape:h-auto landscape:min-h-[100svh] landscape:overflow-y-auto">
      {/* Background dot grid & soft neutral ambient illumination matching app */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-30 z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_65%)] pointer-events-none z-0" />

      {/* Main Content Column with safe-area spacing scale */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+16px)] flex-1 flex flex-col min-h-0">
        {/* Top bar: Official Logo, study.io, and Android app pill */}
        <header className="flex items-center justify-between shrink-0 mb-4 animate-rise-1">
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7 drop-shadow-sm" />
            <span className="text-base font-bold tracking-tight text-white font-sans">
              study.io
            </span>
          </div>
          {!isNativeApp && (
            <span className="text-xs font-sans px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">
              Android app
            </span>
          )}
        </header>

        {/* Hero Visual: CSS Phone frame (approx 38svh tall, 6 deg tilt, 8px float) */}
        <div className="flex-1 flex items-center justify-center min-h-[190px] max-h-[40svh] my-1 relative shrink-0 animate-rise-2">
          <div className="hero-phone relative w-[168px] sm:w-[185px] h-[260px] sm:h-[285px] rounded-[36px] border border-white/15 bg-[#0D1017] p-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.04)]">
            {/* Phone Screen Glass */}
            <div className="w-full h-full rounded-[26px] bg-[#07090E] border border-white/[0.06] p-2.5 flex flex-col justify-between items-center overflow-hidden relative">
              {/* Top speaker notch */}
              <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto shrink-0 mb-1" />

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] shrink-0">
                <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-white font-bold text-[8px] leading-none">
                  Pomodoro
                </span>
                <span className="px-1 py-0.5 text-white/40 text-[7.5px] leading-none">
                  Stopwatch
                </span>
                <span className="px-1 py-0.5 text-white/40 text-[7.5px] leading-none">
                  Countdown
                </span>
              </div>

              {/* Dial Ring with neutral white arc & 25:00 digits */}
              <div className="relative w-28 h-28 my-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Track ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="5"
                    fill="none"
                  />
                  {/* Active arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#FFFFFF"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="238.76"
                    strokeDashoffset="65"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-hud font-bold tracking-wider text-white leading-none">
                    25:00
                  </span>
                  <span className="text-[7.5px] font-mono font-medium text-slate-400 tracking-wider uppercase mt-1">
                    Deep Focus
                  </span>
                </div>
              </div>

              {/* Mini Start Button (Matching app's white primary button) */}
              <div className="w-full px-3 shrink-0">
                <div className="w-full py-1.5 rounded-xl bg-white text-[#07090E] font-bold text-[9px] text-center tracking-wide shadow-sm">
                  Start focus
                </div>
              </div>
            </div>

            {/* Overlapping Floating Chip 1: Authentic Rank Crest Badge */}
            <div className="hero-chip-1 absolute -top-2.5 -left-5 sm:-left-7 px-2.5 py-1.5 rounded-2xl bg-[#0F1117] border border-white/15 shadow-xl flex items-center gap-1.5 backdrop-blur-md z-20">
              <RankCrestBadge tier="Silver" division="I" size={24} interactive={false} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-hud font-bold text-slate-100 leading-none">
                  Silver I
                </span>
                <span className="text-[7.5px] font-mono text-amber-400 leading-tight mt-0.5">
                  Rank tier
                </span>
              </div>
            </div>

            {/* Overlapping Floating Chip 2: Live Room with 3 Avatars & Pulsing Dot */}
            <div className="hero-chip-2 absolute -bottom-2.5 -right-5 sm:-right-7 px-2.5 py-1.5 rounded-2xl bg-[#0F1117] border border-white/15 shadow-xl flex items-center gap-2 backdrop-blur-md z-20">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="text-[10px] font-medium text-slate-200">Live room</span>
              <div className="flex -space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-700 border border-[#0F1117] flex items-center justify-center text-[7.5px] text-slate-200 font-bold">
                  S
                </div>
                <div className="w-4 h-4 rounded-full bg-cyan-900 border border-[#0F1117] flex items-center justify-center text-[7.5px] text-cyan-200 font-bold">
                  K
                </div>
                <div className="w-4 h-4 rounded-full bg-amber-900 border border-[#0F1117] flex items-center justify-center text-[7.5px] text-amber-200 font-bold">
                  M
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Headline & Subline */}
        <div className="text-center my-2 shrink-0 animate-rise-3">
          <h1 className="text-2xl sm:text-3xl font-hud font-bold tracking-tight text-white leading-tight">
            Take your focus with you.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1.5 leading-relaxed max-w-xs mx-auto">
            Timers, live study rooms and monthly ranks, all in one app.
          </p>
        </div>

        {/* Secondary Actions on Hero */}
        <div className="flex items-center justify-center gap-4 my-2 shrink-0 animate-rise-4">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={openSheet}
            className="text-xs font-semibold text-slate-200 hover:text-white px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 hover:border-white/20 transition-colors cursor-pointer active:scale-[0.98]"
          >
            See what&apos;s inside
          </button>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 py-1 font-sans"
          >
            <span>Use on desktop</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      </div>

      {/* Sticky Bottom Bar with safe-area padding and Solid White Primary Button */}
      {!isNativeApp && (
        <footer className="sticky bottom-0 left-0 right-0 z-30 bg-[#07090C]/90 backdrop-blur-xl border-t border-white/[0.08] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] shrink-0 animate-rise-5">
          <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-2">
            {/* Primary Button matching the app's clean white primary buttons */}
            <button
              type="button"
              onClick={handleDownload}
              className="relative overflow-hidden w-full h-[56px] min-h-[56px] rounded-[16px] bg-white text-[#07090E] font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:bg-slate-100 transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              {/* Subtle light sweep across button every 8s */}
              <div className="button-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-black/10 to-transparent skew-x-[-25deg] pointer-events-none" />

              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>{isDownloading ? 'Downloading...' : 'Download for Android'}</span>
            </button>

            {/* Under button version string */}
            <span className="text-[11px] font-mono text-slate-400 tracking-tight">
              {versionString}
            </span>
          </div>
        </footer>
      )}

      {/* Bottom Sheet ("What's inside"): Sleek, clean vertical list matching app modals */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <div
            onClick={closeSheet}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Bottom Sheet Modal Container */}
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            tabIndex={-1}
            className="relative z-10 w-full max-w-lg mx-auto h-[82svh] max-h-[82svh] rounded-t-[32px] bg-[#0F1117] border-t border-white/10 flex flex-col justify-between overflow-hidden shadow-2xl animate-sheet-slide"
          >
            {/* Grab Handle & Touch drag-down area */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full pt-3 pb-1 cursor-grab active:cursor-grabbing flex flex-col items-center shrink-0"
            >
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Sheet Header */}
            <div className="px-6 py-3 flex items-center justify-between border-b border-white/[0.06] shrink-0">
              <div>
                <h2 id="sheet-title" className="text-base font-hud font-bold text-white tracking-wide">
                  Inside study.io
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Core capabilities on Android
                </p>
              </div>

              <button
                type="button"
                onClick={closeSheet}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vertically Scrollable Content: Sleek feature list + Install steps */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
              {/* Feature Cards */}
              {APP_FEATURES.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#141721] border border-white/[0.08] flex items-start gap-3.5 transition-colors hover:border-white/20"
                  >
                    <div
                      className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0"
                      style={{ color: item.accentColor }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-hud font-bold text-white tracking-wide">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
                        {item.caption}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* How to Install APK Card */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-hud font-bold text-slate-200 uppercase tracking-wide">
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>How to install APK</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400 font-sans">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                    <span>1. Tap &ldquo;Download for Android&rdquo; below to save the APK.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                    <span>2. If Android asks, allow installs from this browser.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                    <span>3. Open the downloaded file and tap Install.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Footer: Repeats Solid White Download Button */}
            {!isNativeApp && (
              <div className="p-4 border-t border-white/[0.08] bg-[#0B0D13] shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full h-[52px] rounded-xl bg-white text-[#07090E] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-md hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{isDownloading ? 'Downloading...' : 'Download for Android'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoped CSS animations */}
      <style jsx>{`
        @keyframes phoneFloat {
          0%, 100% {
            transform: translateY(0px) rotate(6deg);
          }
          50% {
            transform: translateY(-8px) rotate(6deg);
          }
        }

        @keyframes chipDrift {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes buttonSweep {
          0% {
            transform: translateX(-200%);
          }
          15% {
            transform: translateX(450%);
          }
          100% {
            transform: translateX(450%);
          }
        }

        @keyframes riseFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sheetSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-phone {
          animation: phoneFloat 6s ease-in-out infinite;
        }

        .hero-chip-1 {
          animation: chipDrift 6s ease-in-out infinite;
          animation-delay: 40ms;
        }

        .hero-chip-2 {
          animation: chipDrift 6s ease-in-out infinite;
          animation-delay: 80ms;
        }

        .button-sweep {
          animation: buttonSweep 8s ease-in-out infinite;
        }

        .animate-rise-1 {
          animation: riseFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both;
        }
        .animate-rise-2 {
          animation: riseFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) 70ms both;
        }
        .animate-rise-3 {
          animation: riseFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) 140ms both;
        }
        .animate-rise-4 {
          animation: riseFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) 210ms both;
        }
        .animate-rise-5 {
          animation: riseFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) 280ms both;
        }

        .animate-sheet-slide {
          animation: sheetSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-phone,
          .hero-chip-1,
          .hero-chip-2,
          .button-sweep,
          .animate-rise-1,
          .animate-rise-2,
          .animate-rise-3,
          .animate-rise-4,
          .animate-rise-5,
          .animate-sheet-slide {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
