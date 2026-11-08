'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Clock,
  Trophy,
  Users,
  Compass,
  ArrowRight,
  Check,
  Volume2,
} from 'lucide-react';
import { INTRO_CONTENT } from '@/lib/introContent';
import { useIntro } from '@/context/IntroContext';
import { useStudyMode } from '@/context/StudyModeContext';
import { RankCrestBadge } from '../common/RankCrestBadge';

export interface WelcomeIntroProps {
  isOpen?: boolean;
  isReplay?: boolean;
  forcedMode?: 'focus' | 'subject';
  onClose?: () => void;
}

export function WelcomeIntro({
  isOpen = true,
  isReplay = false,
  forcedMode,
  onClose,
}: WelcomeIntroProps) {
  const { completeIntro, closeReplay } = useIntro();
  const { mode: actualMode } = useStudyMode();
  const activeMode = forcedMode || actualMode || 'subject';
  const isFocus = activeMode === 'focus';

  const shouldReduceMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = INTRO_CONTENT.slides.length;

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Touch tracking for swipe
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Capture previous active element to restore focus on unmount
  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    return () => {
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, []);

  // Handle Close / Skip
  const handleSkip = useCallback(() => {
    if (isReplay) {
      if (onClose) onClose();
      else closeReplay();
    } else {
      completeIntro(true);
      if (onClose) onClose();
    }
  }, [isReplay, onClose, closeReplay, completeIntro]);

  // Handle Finish
  const handleFinish = useCallback(() => {
    if (isReplay) {
      if (onClose) onClose();
      else closeReplay();
    } else {
      completeIntro(false);
      if (onClose) onClose();
    }
  }, [isReplay, onClose, closeReplay, completeIntro]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  }, [currentSlide, totalSlides, handleFinish]);

  const handleBack = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation: Left/Right arrows, Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack, handleSkip]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!elements || elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    dialog.addEventListener('keydown', trapFocus);
    return () => dialog.removeEventListener('keydown', trapFocus);
  }, [currentSlide]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Trigger only if horizontal swipe dominates vertical scroll and exceeds 45px
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handleBack();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const slide = INTRO_CONTENT.slides[currentSlide];
  const headline = slide.headline;
  const line = isFocus ? slide.lineFocus : slide.lineSubject;

  // Animation variants (350ms tween, 16px slide)
  const slideVariants: Variants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, transition: { duration: 0.25, ease: 'easeIn' as const } },
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-headline"
      aria-describedby="intro-line"
      ref={dialogRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[120] flex flex-col justify-between overflow-hidden select-none bg-[#0B0D0E] text-white"
      style={{
        colorScheme: 'dark',
        // Dotted grid texture background matching recap presentation
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Soft Ambient Accent Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] opacity-25"
        style={{
          background: 'radial-gradient(circle, #E6C15A 0%, rgba(230, 193, 90, 0) 70%)',
        }}
      />

      {/* Top Header: Progress Dots & Skip Button */}
      <header className="relative z-10 w-full max-w-[820px] mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {INTRO_CONTENT.slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${s.headline}`}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentSlide
                  ? 'w-7 bg-[#E6C15A]'
                  : idx < currentSlide
                  ? 'w-2 bg-white/40'
                  : 'w-2 bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-mono font-medium text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E6C15A]/60"
        >
          {INTRO_CONTENT.buttons.skip}
        </button>
      </header>

      {/* Screen Reader Announcement for Slide Changes */}
      <div className="sr-only" aria-live="polite">
        Slide {currentSlide + 1} of {totalSlides}: {headline}. {line}
      </div>

      {/* Main Slide Content Area */}
      <main className="relative z-10 w-full max-w-[820px] mx-auto px-6 flex-1 flex flex-col justify-center items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col items-center max-w-[620px]"
          >
            {/* Slide Visual Demo Box */}
            <div className="w-full h-56 sm:h-64 mb-6 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl p-6">
              {/* Visual 1: Welcome */}
              {slide.id === 'welcome' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 flex items-center justify-center text-[#E6C15A] shadow-lg shadow-[#E6C15A]/10">
                    <Compass className="w-8 h-8" />
                  </div>
                  <div className="text-2xl font-bold font-hud tracking-widest text-[#E6C15A] uppercase">
                    study.io
                  </div>
                </div>
              )}

              {/* Visual 2: The Timer */}
              {slide.id === 'timer' && (
                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  {/* Mode tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-[#E6C15A]/20 text-[#E6C15A] font-semibold border border-[#E6C15A]/30">
                      Pomodoro 25/5
                    </span>
                    <span className="px-2 py-1 text-white/50">Stopwatch</span>
                    <span className="px-2 py-1 text-white/50">Countdown</span>
                  </div>
                  {/* Digits dial */}
                  <div className="text-4xl font-mono font-bold tracking-wider text-white">
                    25:00
                  </div>
                  {/* Subject chip (Subject mode only) */}
                  {!isFocus && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Linear Algebra</span>
                    </div>
                  )}
                </div>
              )}

              {/* Visual 3: Ranks & RP */}
              {slide.id === 'ranks' && (
                <div className="flex items-center justify-center gap-3 sm:gap-4 overflow-x-auto py-2">
                  <div className="opacity-40 scale-75">
                    <RankCrestBadge tier="Bronze" division="I" size="sm" />
                  </div>
                  <div className="opacity-60 scale-90">
                    <RankCrestBadge tier="Silver" division="I" size="sm" />
                  </div>
                  <div className="scale-110 drop-shadow-[0_0_15px_rgba(230,193,90,0.4)]">
                    <RankCrestBadge tier="Gold" division="I" size="md" />
                  </div>
                  <div className="opacity-60 scale-90">
                    <RankCrestBadge tier="Platinum" division="I" size="sm" />
                  </div>
                  <div className="opacity-40 scale-75">
                    <RankCrestBadge tier="Diamond" division="I" size="sm" />
                  </div>
                </div>
              )}

              {/* Visual 4: Seasons & Leaderboard */}
              {slide.id === 'seasons' && (
                <div className="w-full max-w-sm flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs">
                  {/* Position 1 Badge (Gold position, no crown) */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold text-[10px] flex items-center justify-center font-mono">
                        1
                      </span>
                      <span className="font-semibold text-white">Scholar Alpha</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold">142h focus</span>
                  </div>
                  {/* Position 2 Badge (Silver) */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-300 text-black font-bold text-[10px] flex items-center justify-center font-mono">
                        2
                      </span>
                      <span className="text-white/80">Scholar Beta</span>
                    </div>
                    <span className="font-mono text-white/60">118h focus</span>
                  </div>
                  {/* Position 3 Badge (Bronze) */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center font-mono">
                        3
                      </span>
                      <span className="text-white/60">Scholar Gamma</span>
                    </div>
                    <span className="font-mono text-white/40">94h focus</span>
                  </div>
                </div>
              )}

              {/* Visual 5: Days in a row and levels */}
              {slide.id === 'streaks' && (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                      <Flame className="w-6 h-6 fill-amber-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold font-mono text-white">7 Days</div>
                      <div className="text-[11px] font-mono text-amber-400/90 uppercase tracking-wider">
                        Consistency chain
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-white/70">
                      <span>Lv. 9 Novice Scholar</span>
                      <span>850 / 1000 XP</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 6: Study rooms */}
              {slide.id === 'rooms' && (
                <div className="w-full max-w-xs p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Deep Work Room</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/70">
                      #4829XQ
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold">
                        W
                      </div>
                      <div className="w-7 h-7 rounded-full bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold">
                        K
                      </div>
                      <div className="w-7 h-7 rounded-full bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-[10px] font-bold">
                        R
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>3 studying now</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 7: Make it yours */}
              {slide.id === 'customize' && (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  {/* Theme swatches */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500 ring-2 ring-white/50" />
                    <div className="w-7 h-7 rounded-full bg-cyan-500" />
                    <div className="w-7 h-7 rounded-full bg-emerald-500" />
                    <div className="w-7 h-7 rounded-full bg-purple-500" />
                    <div className="w-7 h-7 rounded-full bg-rose-500" />
                  </div>
                  {/* Sound chips */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-[#E6C15A]" /> Rain
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60">Campfire</span>
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60">Calm music</span>
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60">Brown noise</span>
                  </div>
                </div>
              )}
            </div>

            {/* Headline (budget <= 6 words) */}
            <h2
              id="intro-headline"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2"
            >
              {headline}
            </h2>

            {/* Line (budget <= 12 words) */}
            <p
              id="intro-line"
              className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed mb-4"
            >
              {line}
            </p>

            {/* Slide 7 Special: Quiet Premium Mention */}
            {slide.id === 'customize' && (
              <div className="mt-2 text-xs text-neutral-400 font-mono flex items-center justify-center gap-1.5 flex-wrap">
                <span>{INTRO_CONTENT.premiumNote.text}</span>
                <Link
                  href={INTRO_CONTENT.premiumNote.href}
                  onClick={handleFinish}
                  className="text-[#E6C15A] hover:underline cursor-pointer"
                >
                  {INTRO_CONTENT.premiumNote.linkLabel}
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Footer: Back Button & Primary Action Button */}
      <footer className="relative z-10 w-full max-w-[820px] mx-auto px-6 pt-2 pb-8 flex items-center justify-between">
        {/* Circular Back Button (hidden on first slide to prevent layout shift) */}
        <div>
          {currentSlide > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Previous slide"
              className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E6C15A]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11 h-11" />
          )}
        </div>

        {/* Primary Next / Finish Button */}
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-98 bg-[#E6C15A] hover:bg-[#D4AF37] text-black shadow-lg shadow-[#E6C15A]/20 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E6C15A]/80"
        >
          <span>
            {currentSlide === totalSlides - 1
              ? INTRO_CONTENT.buttons.finish
              : INTRO_CONTENT.buttons.next}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
