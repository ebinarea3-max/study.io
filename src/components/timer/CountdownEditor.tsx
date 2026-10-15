'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CountdownEditorProps {
  initialSeconds: number;
  onSave: (seconds: number) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 44; // Height of each wheel item in px
const VISIBLE_ITEMS = 3; // 3 visible items: prev, selected, next

const PRESETS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '1 hr', seconds: 60 * 60 },
  { label: '1.5 hr', seconds: 90 * 60 },
  { label: '2 hr', seconds: 120 * 60 },
];

const ADJUST_BUTTONS = [
  { label: '−10 min', delta: -10 * 60 },
  { label: '−5 min', delta: -5 * 60 },
  { label: '+5 min', delta: 5 * 60 },
  { label: '+10 min', delta: 10 * 60 },
];

function formatPlainWords(totalSec: number): string {
  if (totalSec <= 0) return '0 min';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0) parts.push(`${s} sec`);

  return parts.length > 0 ? parts.join(' ') : '0 min';
}

interface WheelColumnProps {
  value: number;
  maxVal: number;
  label: string;
  isHours?: boolean;
  wrap?: boolean;
  onChange: (val: number) => void;
  onMoveToPrev?: () => void;
  onMoveToNext?: () => void;
  autoFocusOnMount?: boolean;
  columnRef?: React.RefObject<HTMLDivElement | null>;
  ariaLabel: string;
}

function WheelColumn({
  value,
  maxVal,
  label,
  isHours = false,
  wrap = false,
  onChange,
  onMoveToPrev,
  onMoveToNext,
  autoFocusOnMount = false,
  columnRef,
  ariaLabel,
}: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // In-line typing state
  const [isTyping, setIsTyping] = useState(false);
  const [typedValue, setTypedValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => Array.from({ length: maxVal + 1 }, (_, i) => i), [maxVal]);

  // Initial scroll positioning and auto-focus
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = value * ITEM_HEIGHT;
    }
    if (autoFocusOnMount && columnRef?.current) {
      columnRef.current.focus();
    }
  }, []);

  // Programmatic scroll when value changes externally
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isTyping) return;
    const target = value * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 2) {
      isProgrammaticScroll.current = true;
      el.scrollTo({ top: target, behavior: 'smooth' });
      const timer = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [value, isTyping]);

  // Debounced scroll listener for user wheel/drag
  const handleScroll = () => {
    if (isProgrammaticScroll.current || isTyping) return;
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);

    scrollDebounceRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(maxVal, index));
      if (clamped !== value) {
        onChange(clamped);
      }
    }, 60);
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isTyping) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = value > 0 ? value - 1 : wrap ? maxVal : 0;
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = value < maxVal ? value + 1 : wrap ? 0 : maxVal;
      onChange(next);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      const step = isHours ? 10 : 5;
      onChange(Math.max(0, value - step));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      const step = isHours ? 10 : 5;
      onChange(Math.min(maxVal, value + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(maxVal);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onMoveToPrev?.();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onMoveToNext?.();
    }
  };

  const handleStartTyping = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTyping(true);
    setTypedValue('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 20);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setTypedValue(raw);

    if (raw.length >= 2) {
      const num = parseInt(raw, 10);
      if (!isNaN(num)) {
        const clamped = Math.max(0, Math.min(maxVal, num));
        onChange(clamped);
      }
      setIsTyping(false);
      onMoveToNext?.();
    }
  };

  const handleInputBlur = () => {
    if (typedValue.length > 0) {
      const num = parseInt(typedValue, 10);
      if (!isNaN(num)) {
        const clamped = Math.max(0, Math.min(maxVal, num));
        onChange(clamped);
      }
    }
    setIsTyping(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={columnRef as React.RefObject<HTMLDivElement>}
        tabIndex={0}
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxVal}
        onKeyDown={handleKeyDown}
        className="relative w-20 sm:w-24 h-[132px] overflow-hidden rounded-2xl outline-none focus-visible:ring-1 focus-visible:ring-white/30"
      >
        {/* Subtle center row selection band */}
        <div className="absolute top-[44px] left-0 right-0 h-[44px] bg-white/[0.07] border border-white/[0.09] rounded-xl pointer-events-none z-0" />

        {/* Scroll-Snap Wheel Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="relative z-10 w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar select-none"
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Top spacer (1 item height) so index 0 snaps to center */}
          <div style={{ height: ITEM_HEIGHT }} className="shrink-0 pointer-events-none" />

          {items.map((itemVal) => {
            const isSelected = itemVal === value;

            return (
              <div
                key={itemVal}
                style={{ height: ITEM_HEIGHT }}
                onClick={() => {
                  if (isSelected) {
                    // Tap center value to edit by typing
                    setIsTyping(true);
                    setTypedValue('');
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 20);
                  } else {
                    onChange(itemVal);
                  }
                }}
                className={`snap-center flex items-center justify-center font-mono tabular-nums text-3xl sm:text-4xl font-bold cursor-pointer transition-colors duration-120 ${
                  isSelected
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300 opacity-40 hover:opacity-75 scale-90'
                }`}
              >
                {isSelected && isTyping ? (
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={typedValue}
                    placeholder={value.toString().padStart(2, '0')}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="w-14 h-9 bg-white/[0.12] border border-white/20 rounded-lg text-center font-mono tabular-nums text-2xl font-bold text-white outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
                    autoFocus
                  />
                ) : (
                  <span>{itemVal.toString().padStart(2, '0')}</span>
                )}
              </div>
            );
          })}

          {/* Bottom spacer so max item snaps to center */}
          <div style={{ height: ITEM_HEIGHT }} className="shrink-0 pointer-events-none" />
        </div>

        {/* Top and Bottom Gradient Fades */}
        <div className="absolute inset-x-0 top-0 h-9 bg-gradient-to-b from-[#0c0e14] via-[#0c0e14]/80 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/80 to-transparent pointer-events-none z-20" />
      </div>

      {/* Column Unit Label */}
      <span className="text-[11px] font-mono text-zinc-400 mt-1 uppercase tracking-wider select-none">
        {label}
      </span>
    </div>
  );
}

export function CountdownEditor({ initialSeconds, onSave, onCancel }: CountdownEditorProps) {
  const [hours, setHours] = useState(Math.floor(initialSeconds / 3600));
  const [minutes, setMinutes] = useState(Math.floor((initialSeconds % 3600) / 60));
  const [seconds, setSeconds] = useState(initialSeconds % 60);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const isSaveDisabled = totalSeconds < 60; // Pick at least 1 minute

  const shouldReduceMotion = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);

  // Column focus refs for keyboard arrows Left/Right navigation
  const hoursColRef = useRef<HTMLDivElement>(null);
  const minutesColRef = useRef<HTMLDivElement>(null);
  const secondsColRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    return () => {
      // Return focus to previous trigger on unmount
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    if (totalSeconds >= 60) {
      onSave(totalSeconds);
    }
  }, [totalSeconds, onSave]);

  // Adjust total by delta seconds (with clamping)
  const handleAdjust = (deltaSec: number) => {
    const nextTotal = Math.max(0, Math.min(99 * 3600 + 59 * 60 + 59, totalSeconds + deltaSec));
    setHours(Math.floor(nextTotal / 3600));
    setMinutes(Math.floor((nextTotal % 3600) / 60));
    setSeconds(nextTotal % 60);
  };

  // Reset to initialSeconds
  const handleReset = () => {
    setHours(Math.floor(initialSeconds / 3600));
    setMinutes(Math.floor((initialSeconds % 3600) / 60));
    setSeconds(initialSeconds % 60);
  };

  // Keyboard navigation for Enter and Escape, plus focus trapping
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        // If not in a focused input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input') {
          e.preventDefault();
          if (totalSeconds >= 60) {
            onSave(totalSeconds);
          }
        }
      } else if (e.key === 'Tab') {
        // Focus trap inside modal
        if (!modalCardRef.current) return;
        const focusable = modalCardRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]:not([disabled]), input:not([disabled])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [totalSeconds, onSave, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="countdown-modal-title"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-opacity duration-180"
      onClick={onCancel}
    >
      <motion.div
        ref={modalCardRef}
        onClick={(e) => e.stopPropagation()}
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.97, y: 16 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.97, y: 16 }
        }
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-[440px] bg-[#0c0e14] border border-white/[0.08] rounded-t-[24px] sm:rounded-[24px] shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col pb-8 sm:pb-6"
      >
        {/* Mobile Drag/Grab Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto sm:hidden mb-3" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              id="countdown-modal-title"
              className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug"
            >
              Set focus time
            </h2>
            {/* Live plain words total with cross-fade */}
            <div className="h-5 flex items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={formatPlainWords(totalSeconds)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="text-xs font-mono text-zinc-400 font-medium"
                >
                  {formatPlainWords(totalSeconds)}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Preset Chips Row */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {PRESETS.map((p) => {
              const isSelected = totalSeconds === p.seconds;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setHours(Math.floor(p.seconds / 3600));
                    setMinutes(Math.floor((p.seconds % 3600) / 60));
                    setSeconds(p.seconds % 60);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all duration-120 whitespace-nowrap cursor-pointer active:scale-[0.97] border ${
                    isSelected
                      ? 'bg-white/[0.12] border-white/30 text-white font-semibold shadow-sm'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Wheel Picker */}
        <div className="relative py-2 px-3 bg-black/20 rounded-2xl border border-white/[0.04] mb-3 flex items-center justify-center gap-2 sm:gap-3">
          {/* Hours Column */}
          <WheelColumn
            value={hours}
            maxVal={99}
            label="hr"
            isHours
            wrap
            onChange={setHours}
            onMoveToNext={() => minutesColRef.current?.focus()}
            columnRef={hoursColRef}
            ariaLabel="Hours"
          />

          <span className="text-2xl sm:text-3xl font-mono font-bold text-zinc-600 pb-5 select-none -translate-y-1">
            :
          </span>

          {/* Minutes Column (auto-focused on open) */}
          <WheelColumn
            value={minutes}
            maxVal={59}
            label="min"
            wrap
            onChange={setMinutes}
            onMoveToPrev={() => hoursColRef.current?.focus()}
            onMoveToNext={() => secondsColRef.current?.focus()}
            autoFocusOnMount
            columnRef={minutesColRef}
            ariaLabel="Minutes"
          />

          <span className="text-2xl sm:text-3xl font-mono font-bold text-zinc-600 pb-5 select-none -translate-y-1">
            :
          </span>

          {/* Seconds Column */}
          <WheelColumn
            value={seconds}
            maxVal={59}
            label="sec"
            wrap
            onChange={setSeconds}
            onMoveToPrev={() => minutesColRef.current?.focus()}
            columnRef={secondsColRef}
            ariaLabel="Seconds"
          />
        </div>

        {/* Adjust Buttons Row */}
        <div className="flex items-center justify-between gap-1 mb-5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {ADJUST_BUTTONS.map((adj) => (
              <button
                key={adj.label}
                type="button"
                onClick={() => handleAdjust(adj.delta)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all duration-120 active:scale-[0.97] cursor-pointer"
              >
                {adj.label}
              </button>
            ))}
          </div>

          {/* Reset button if changed */}
          {totalSeconds !== initialSeconds && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-1"
              title="Reset to initial value"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
          {/* Helper hint when total is 0 or less than 1 minute */}
          <div className="text-[11px] font-mono text-amber-400/90 min-h-[16px]">
            {isSaveDisabled && 'Pick at least 1 minute'}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-120 flex items-center gap-1.5 shadow-sm ${
                isSaveDisabled
                  ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                  : 'bg-white text-zinc-950 hover:brightness-105 active:scale-[0.97] cursor-pointer'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
