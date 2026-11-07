'use client';

import React, { useState, useCallback } from 'react';
import { useStudyMode } from '../../context/StudyModeContext';
import { StudyMode } from '../../types';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function StudyModeOnboarding() {
  const { setMode } = useStudyMode();
  const [selected, setSelected] = useState<StudyMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleSelect = (mode: StudyMode) => {
    if (isSubmitting || isConfirmed) return;
    setSelected(mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent, mode: StudyMode) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleSelect(mode);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected('subject');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected('focus');
    }
  };

  const handleContinue = useCallback(async () => {
    if (!selected || isSubmitting || isConfirmed) return;

    setIsSubmitting(true);
    try {
      await setMode(selected);
      setIsConfirmed(true);
    } catch {
      setIsSubmitting(false);
    }
  }, [selected, isSubmitting, isConfirmed, setMode]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-heading"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-[var(--bg)] bg-dot-grid text-[var(--text)] select-none overflow-y-auto"
    >
      {/* Soft Ambient Radial Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, var(--accent-soft, rgba(16,185,129,0.08)) 0%, transparent 65%)',
        }}
      />

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-2xl mx-auto flex flex-col items-center text-center my-auto py-6"
      >
        {/* Heading & Subtitle */}
        <div className="space-y-2 mb-8 sm:mb-10">
          <h1
            id="onboarding-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-hud font-bold tracking-wider text-[var(--text)] uppercase"
          >
            How do you like to study?
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-dim)] font-sans max-w-md mx-auto">
            You can change this anytime in Settings.
          </p>
        </div>

        {/* Options RadioGroup */}
        <div
          role="radiogroup"
          aria-label="Choose your preferred study mode"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full mb-8 sm:mb-10"
        >
          {/* Option 1: Focus Mode Card */}
          <div
            role="radio"
            aria-checked={selected === 'focus'}
            tabIndex={0}
            onClick={() => handleSelect('focus')}
            onKeyDown={(e) => handleKeyDown(e, 'focus')}
            className={`relative flex flex-col items-center p-6 sm:p-7 rounded-2xl border transition-all duration-200 cursor-pointer text-center group outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
              selected === 'focus'
                ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-[0_0_25px_var(--glow)] ring-1 ring-[var(--accent)]/40 scale-[1.01]'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] hover:border-white/20'
            }`}
          >
            {/* Selection Check Badge */}
            <div
              className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selected === 'focus'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'border border-[var(--border)] text-transparent bg-white/[0.02]'
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>

            {/* CSS Illustration: Clean timer dial & digits */}
            <div className="w-24 h-24 mb-5 rounded-full border-2 border-[var(--border)] bg-black/20 flex flex-col items-center justify-center relative shadow-inner">
              {/* Outer faint progress arc */}
              <div
                className="absolute inset-1 rounded-full border-2 border-transparent transition-colors duration-300"
                style={{
                  borderTopColor: selected === 'focus' ? 'var(--accent)' : 'rgb(var(--fg) / 0.35)',
                  borderRightColor: selected === 'focus' ? 'var(--accent)' : 'rgb(var(--fg) / 0.35)',
                }}
              />
              <span className="font-mono text-base font-bold text-[var(--text)] tracking-wider">
                25:00
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-dim)] mt-0.5">
                Focus
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-hud font-bold tracking-wider text-[var(--text)] uppercase mb-2">
              Focus mode
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-dim)] font-sans leading-relaxed">
              Just press start. See your total focus time.
            </p>
          </div>

          {/* Option 2: Subject Mode Card */}
          <div
            role="radio"
            aria-checked={selected === 'subject'}
            tabIndex={0}
            onClick={() => handleSelect('subject')}
            onKeyDown={(e) => handleKeyDown(e, 'subject')}
            className={`relative flex flex-col items-center p-6 sm:p-7 rounded-2xl border transition-all duration-200 cursor-pointer text-center group outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
              selected === 'subject'
                ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-[0_0_25px_var(--glow)] ring-1 ring-[var(--accent)]/40 scale-[1.01]'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] hover:border-white/20'
            }`}
          >
            {/* Selection Check Badge */}
            <div
              className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                selected === 'subject'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'border border-[var(--border)] text-transparent bg-white/[0.02]'
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>

            {/* CSS Illustration: Timer dial + subject chip + tiny donut */}
            <div className="w-24 h-24 mb-5 flex flex-col items-center justify-center relative">
              <div className="flex items-center gap-2">
                {/* Mini Dial */}
                <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] bg-black/20 flex items-center justify-center relative shadow-inner">
                  <div
                    className="absolute inset-0.5 rounded-full border-2 border-transparent"
                    style={{
                      borderTopColor: 'var(--accent)',
                      borderRightColor: 'var(--accent)',
                    }}
                  />
                  <span className="font-mono text-[9px] font-bold text-[var(--text)]">25m</span>
                </div>

                {/* Tiny CSS Multi-Segment Donut */}
                <div
                  className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center relative shadow-inner"
                  style={{
                    background:
                      'conic-gradient(#10B981 0deg 140deg, #8B5CF6 140deg 260deg, #F59E0B 260deg 360deg)',
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--surface)]" />
                </div>
              </div>

              {/* Subject Chip Illustration */}
              <div className="mt-2.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-mono font-medium text-[var(--text)]">Physics</span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-hud font-bold tracking-wider text-[var(--text)] uppercase mb-2">
              Subject mode
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-dim)] font-sans leading-relaxed">
              Track each subject. See where your time goes.
            </p>
          </div>
        </div>

        {/* Continue Action Button */}
        <div className="w-full max-w-xs flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={!selected || isSubmitting || isConfirmed}
            onClick={handleContinue}
            className={`w-full h-12 rounded-xl font-hud-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              selected && !isSubmitting && !isConfirmed
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 shadow-[0_0_20px_var(--glow)] active:scale-[0.98]'
                : 'bg-white/[0.06] text-[var(--text-dim)] border border-[var(--border)] cursor-not-allowed opacity-50'
            }`}
          >
            {isSubmitting || isConfirmed ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing your workspace...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
