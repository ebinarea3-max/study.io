'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   1. ANIMATED TASK ITEM
   Spring checkbox pop, smooth opacity shift, GPU transform-based strikethrough
   ═══════════════════════════════════════════════════════════════════════════ */
export interface AnimatedTaskItemProps {
  completed: boolean;
  onToggle?: () => void;
  className?: string;
  children?: React.ReactNode;
  taskText?: string;
  checkboxClassName?: string;
  renderCheckboxOnly?: boolean;
}

export function AnimatedTaskItem({
  completed,
  onToggle,
  className = '',
  children,
  taskText,
  checkboxClassName = '',
  renderCheckboxOnly = false,
}: AnimatedTaskItemProps) {
  const shouldReduceMotion = useReducedMotion();

  // Standalone Checkbox Pop Element
  const Checkbox = (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={completed ? 'Mark task incomplete' : 'Mark task complete'}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }}
      animate={
        completed && !shouldReduceMotion
          ? { scale: [0.8, 1.25, 1] }
          : { scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 z-10 will-change-transform transform-gpu ${
        completed
          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_10px_var(--glow)] border border-transparent'
          : 'border-2 border-[var(--border-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] bg-transparent'
      } ${checkboxClassName}`}
    >
      <motion.div
        initial={false}
        animate={{
          scale: completed ? 1 : 0,
          opacity: completed ? 1 : 0,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0.1 }
            : { type: 'spring', stiffness: 500, damping: 25 }
        }
        className="flex items-center justify-center will-change-transform transform-gpu"
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </motion.div>
    </motion.button>
  );

  if (renderCheckboxOnly) {
    return Checkbox;
  }

  return (
    <motion.div
      animate={{
        opacity: completed ? 0.55 : 1,
      }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={`relative flex items-center gap-3 transition-colors will-change-transform transform-gpu ${className}`}
    >
      {Checkbox}

      {/* Children or Default Strikethrough Task Text Container */}
      <div className="relative flex-1 min-w-0">
        {taskText ? (
          <div className="relative inline-block max-w-full">
            <span
              className={`block text-xs sm:text-[14px] text-[var(--text)] py-0.5 tracking-wide leading-relaxed font-sans truncate ${
                completed ? 'text-[var(--text-dim)]' : ''
              }`}
            >
              {taskText}
            </span>

            {/* GPU-composited Animated Strike-through Line (animates scaleX, NOT width!) */}
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{
                scaleX: completed ? 1 : 0,
                opacity: completed ? 1 : 0,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.1 }
                  : { type: 'spring', stiffness: 400, damping: 28 }
              }
              className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-[var(--text-dim)] pointer-events-none origin-left will-change-transform transform-gpu"
            />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ANIMATED TAB PILL
   Fluid spring-driven background pill using Framer Motion layoutId
   ═══════════════════════════════════════════════════════════════════════════ */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
}

export interface AnimatedTabPillProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  pillClassName?: string;
  tabClassName?: string;
  layoutId?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedTabPill({
  tabs,
  activeTab,
  onChange,
  className = '',
  pillClassName = '',
  tabClassName = '',
  layoutId = 'studyio-active-tab',
  size = 'md',
}: AnimatedTabPillProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 sm:px-4 py-1.5 text-xs',
    lg: 'px-4 sm:px-5 py-2 text-sm',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
    lg: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
  }[size];

  return (
    <nav
      aria-label="Navigation Tabs"
      className={`relative inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-hud font-bold tracking-wider uppercase transition-colors cursor-pointer z-10 ${sizeClasses} ${
              isActive
                ? 'text-[var(--text)] drop-shadow-sm'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            } ${tabClassName}`}
          >
            {/* Active Pill using Framer Motion layoutId */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.1 }
                    : { type: 'spring', stiffness: 450, damping: 32 }
                }
                className={`absolute inset-0 rounded-xl bg-fg/[0.08] [[data-theme="paper"]_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme="paper"]_&]:border-[var(--border-strong)] shadow-card -z-10 will-change-transform transform-gpu ${pillClassName}`}
              />
            )}

            {Icon && <Icon className={`${iconSizes} shrink-0`} />}
            <span>{tab.label}</span>

            {tab.badge !== undefined && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-fg/10 text-[var(--text)]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

