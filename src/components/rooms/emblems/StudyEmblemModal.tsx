'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Check, Sparkles, Play, Pause, FastForward } from 'lucide-react';
import {
  ALL_EMBLEM_FAMILIES,
  EMBLEM_FAMILIES,
  type EmblemFamilyId,
  type EmblemState,
  resolveEmblemFamily,
} from './emblemRegistry';
import { type EmblemStage, STAGE_NAMES, STAGE_THRESHOLDS } from './emblemStages';
import { GrowthEmblem } from './GrowthEmblem';
import { getSupabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export const STUDY_EMBLEM_STORAGE_KEY = 'studyio_equipped_study_emblem';

export function getEquippedEmblemFamily(): EmblemFamilyId {
  if (typeof window === 'undefined') return 'spark';
  const saved = localStorage.getItem(STUDY_EMBLEM_STORAGE_KEY) as EmblemFamilyId | null;
  if (saved && EMBLEM_FAMILIES[saved]) return saved;
  return 'spark';
}

export function saveEquippedEmblemFamily(id: EmblemFamilyId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDY_EMBLEM_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('studyio_study_emblem_changed', { detail: id }));
}

interface StudyEmblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFamily: EmblemFamilyId | string | null;
  currentTodaySeconds?: number;
  onEquipFamily: (family: EmblemFamilyId) => void;
  isPro: boolean;
  onOpenUpgradeModal?: () => void;
}

export function StudyEmblemModal({
  isOpen,
  onClose,
  currentFamily,
  currentTodaySeconds = 0,
  onEquipFamily,
  isPro,
  onOpenUpgradeModal,
}: StudyEmblemModalProps) {
  const activeFamily = resolveEmblemFamily(currentFamily, isPro);
  const [selectedFamily, setSelectedFamily] = useState<EmblemFamilyId>(activeFamily);
  const [previewStage, setPreviewStage] = useState<EmblemStage>(4);
  const [previewState, setPreviewState] = useState<EmblemState>('studying');
  const [isPreviewingDay, setIsPreviewingDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dayPreviewTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedFamily(activeFamily);
      setPreviewStage(4);
      setPreviewState('studying');
      setIsPreviewingDay(false);
    }
  }, [isOpen, activeFamily]);

  // "Preview a day" simulation timer (advances 1 stage every 1.2s with level-up moment)
  useEffect(() => {
    if (!isPreviewingDay) {
      if (dayPreviewTimerRef.current) clearInterval(dayPreviewTimerRef.current);
      return;
    }

    dayPreviewTimerRef.current = setInterval(() => {
      setPreviewStage((prev) => {
        if (prev >= 6) {
          setIsPreviewingDay(false);
          return 6;
        }
        return (prev + 1) as EmblemStage;
      });
    }, 1200);

    return () => {
      if (dayPreviewTimerRef.current) clearInterval(dayPreviewTimerRef.current);
    };
  }, [isPreviewingDay]);

  // Keyboard navigation & Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    first?.focus();
    return () => window.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleStartDayPreview = () => {
    setPreviewStage(0);
    setIsPreviewingDay(true);
  };

  const handleEquip = useCallback(
    async (famId: EmblemFamilyId) => {
      const meta = EMBLEM_FAMILIES[famId];
      if (meta?.premium && !isPro) {
        onOpenUpgradeModal?.();
        return;
      }

      const previousFamily = activeFamily;
      // Optimistic client update
      onEquipFamily(famId);
      saveEquippedEmblemFamily(famId);

      const supabase = getSupabase();
      if (!supabase) {
        toast.success(`Equipped ${meta.name}!`);
        onClose();
        return;
      }

      setIsSaving(true);
      try {
        const { error } = await supabase.rpc('set_my_study_icon', { p_icon: famId });
        if (error) throw error;
        toast.success(`Equipped ${meta.name}!`);
        onClose();
      } catch (err: unknown) {
        // Rollback
        onEquipFamily(previousFamily);
        saveEquippedEmblemFamily(previousFamily);
        const msg = err instanceof Error ? err.message : 'Failed to equip emblem';
        toast.error(`Error: ${msg}`);
      } finally {
        setIsSaving(false);
      }
    },
    [isPro, activeFamily, onEquipFamily, onClose, onOpenUpgradeModal]
  );

  if (!isOpen) return null;

  const previewMeta = EMBLEM_FAMILIES[selectedFamily] || EMBLEM_FAMILIES.spark;

  return createPortal(
    <div
      ref={backdropRef}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-emblem-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[94vh] flex flex-col rounded-3xl bg-[#0c0d12] border border-white/10 shadow-2xl overflow-hidden text-white"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="study-emblem-title"
                className="font-hud font-bold text-sm uppercase tracking-wider text-white"
              >
                Pick your study emblem
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                It grows as your focus time grows today.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Diorama Stage */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-black/40 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Large Living Emblem Preview ('lg' 200px) */}
          <div className="flex flex-col items-center shrink-0">
            <GrowthEmblem
              family={selectedFamily}
              stage={previewStage}
              state={previewState}
              size="lg"
              isPremium={true}
              showPips={true}
            />
          </div>

          {/* Controls: Stage Scrubber, Preview Day, State Switcher */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Family & Stage Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-hud font-bold text-base text-white uppercase tracking-wider">
                  {previewMeta.name}
                </span>
                {previewMeta.premium && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-hud font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    Pro
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage {previewStage}: <strong className="text-slate-200">{STAGE_NAMES[previewStage]}</strong> (
                {STAGE_THRESHOLDS[previewStage] === 0
                  ? '0m'
                  : `${Math.round(STAGE_THRESHOLDS[previewStage] / 60)}m+`}
                )
              </p>
            </div>

            {/* Stage Scrubber (7 steps) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Stage 0 (Ember)</span>
                <span>Stage 6 (Zenith)</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={previewStage}
                onChange={(e) => {
                  setIsPreviewingDay(false);
                  setPreviewStage(Number(e.target.value) as EmblemStage);
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
              />
            </div>

            {/* Action Bar: Preview a Day & Studying/Paused Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleStartDayPreview}
                className={`px-3 py-1.5 rounded-xl text-xs font-hud font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isPreviewingDay
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-white/[0.05] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{isPreviewingDay ? 'Advancing Stages...' : 'Preview a Day'}</span>
              </button>

              <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-hud">
                <button
                  type="button"
                  onClick={() => setPreviewState('studying')}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    previewState === 'studying'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Studying
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewState('paused')}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    previewState === 'paused'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paused
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Emblem Family Cards Grid (2 cols mobile, 3 desktop) */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
          role="radiogroup"
          aria-label="Available study emblem families"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_EMBLEM_FAMILIES.map((famId) => {
              const meta = EMBLEM_FAMILIES[famId];
              const isSelected = selectedFamily === famId;
              const isEquipped = activeFamily === famId;
              const isLocked = meta.premium && !isPro;

              return (
                <div
                  key={famId}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => setSelectedFamily(famId)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedFamily(famId);
                    }
                  }}
                  className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none outline-none ${
                    isSelected
                      ? 'bg-white/[0.08] border-amber-400/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                      : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/15'
                  }`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                    {meta.premium && (
                      <span
                        className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400"
                        title="Pro Exclusive"
                      >
                        <Crown className="w-2.5 h-2.5 fill-current" />
                      </span>
                    )}
                    {isEquipped && (
                      <span
                        className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400"
                        title="Equipped"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Emblem Rendered at Stage 4 ('sm' size 64px) */}
                  <div className="my-1 group-hover:scale-105 transition-transform duration-200">
                    <GrowthEmblem
                      family={famId}
                      stage={4}
                      state="studying"
                      size="sm"
                      isPremium={true}
                      showPips={false}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="w-full text-center mt-2">
                    <div className="text-xs font-hud font-bold text-white uppercase tracking-wider truncate">
                      {meta.name}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {meta.tagline}
                    </div>
                  </div>

                  {/* Equip Indicator Bar */}
                  <div className="mt-2 pt-1.5 border-t border-white/[0.06] w-full flex items-center justify-center">
                    {isEquipped ? (
                      <span className="text-[10px] font-hud font-bold uppercase tracking-wider text-emerald-400">
                        Active
                      </span>
                    ) : isLocked ? (
                      <span className="text-[10px] font-hud font-bold uppercase tracking-wider text-amber-400/80 group-hover:text-amber-300 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 fill-current" />
                        Unlock
                      </span>
                    ) : (
                      <span className="text-[10px] font-hud font-semibold uppercase tracking-wider text-slate-400 group-hover:text-white">
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.01] shrink-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {previewMeta.premium && !isPro ? (
              <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 truncate">
                <Crown className="w-3.5 h-3.5 shrink-0 fill-current" />
                <span>Pro subscription required for {previewMeta.name}</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 truncate">
                Equipped: <strong className="text-white">{EMBLEM_FAMILIES[activeFamily]?.name || 'Eternal Spark'}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-hud font-bold uppercase tracking-wider text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || (selectedFamily === activeFamily && !previewMeta.premium)}
              onClick={() => handleEquip(selectedFamily)}
              className={`px-5 py-2 rounded-xl text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                previewMeta.premium && !isPro
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSaving
                ? 'Equipping...'
                : previewMeta.premium && !isPro
                ? 'Upgrade to Pro'
                : selectedFamily === activeFamily
                ? 'Equipped'
                : 'Equip Emblem'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
