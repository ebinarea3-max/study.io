'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Check, Sparkles } from 'lucide-react';
import {
  ALL_ICON_IDS,
  STUDY_ICONS,
  getDefaultIconId,
  type StudyIconId,
  type StudyIconState,
} from './studyIcons/registry';
import { StudyIcon } from './studyIcons/StudyIcon';
import { UserAvatar } from '../common/UserAvatar';
import { getSupabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const STUDY_ICON_STORAGE_KEY = 'studyio_equipped_study_icon';

export function getEquippedStudyIcon(): StudyIconId | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STUDY_ICON_STORAGE_KEY) as StudyIconId | null;
  if (saved && STUDY_ICONS[saved]) return saved;
  return null;
}

export function saveEquippedStudyIcon(id: StudyIconId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDY_ICON_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('studyio_study_icon_changed', { detail: id }));
}

interface StudyIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIconId: StudyIconId | null;
  onEquipIcon: (iconId: StudyIconId) => void;
  isPro: boolean;
  userAvatarUrl?: string | null;
  username?: string;
  userId?: string;
  onOpenUpgradeModal?: () => void;
}

export function StudyIconModal({
  isOpen,
  onClose,
  currentIconId,
  onEquipIcon,
  isPro,
  userAvatarUrl,
  username,
  userId,
  onOpenUpgradeModal,
}: StudyIconModalProps) {
  const defaultId = currentIconId || getDefaultIconId(userId || 'default_user');
  const [selectedId, setSelectedId] = useState<StudyIconId>(defaultId);
  const [previewState, setPreviewState] = useState<StudyIconState>('studying');
  const [isSaving, setIsSaving] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentIconId || getDefaultIconId(userId || 'default_user'));
      setPreviewState('studying');
    }
  }, [isOpen, currentIconId, userId]);

  // Escape key handler
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

  const activeEquippedId = currentIconId || getDefaultIconId(userId || 'default_user');
  const previewMeta = STUDY_ICONS[selectedId] || STUDY_ICONS.lamp;

  const handleEquip = useCallback(
    async (iconId: StudyIconId) => {
      const meta = STUDY_ICONS[iconId];
      if (meta?.premium && !isPro) {
        onOpenUpgradeModal?.();
        return;
      }

      const previousId = currentIconId;
      // Optimistic update
      onEquipIcon(iconId);
      saveEquippedStudyIcon(iconId);

      const supabase = getSupabase();
      if (!supabase) {
        toast.success(`Equipped ${meta.name}!`);
        onClose();
        return;
      }

      setIsSaving(true);
      try {
        const { error } = await supabase.rpc('set_my_study_icon', { p_icon: iconId });
        if (error) {
          throw error;
        }
        toast.success(`Equipped ${meta.name}!`);
        onClose();
      } catch (err: unknown) {
        // Rollback on error
        if (previousId) {
          onEquipIcon(previousId);
          saveEquippedStudyIcon(previousId);
        }
        const msg = err instanceof Error ? err.message : 'Failed to update study icon';
        toast.error(`Error: ${msg}`);
      } finally {
        setIsSaving(false);
      }
    },
    [isPro, currentIconId, onEquipIcon, onClose, onOpenUpgradeModal]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-icons-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0c0d12] border border-white/10 shadow-2xl overflow-hidden text-white"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="study-icons-title"
                className="font-hud font-bold text-sm uppercase tracking-wider text-white"
              >
                Study icons
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pick how you appear while you study in rooms.
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

        {/* Live Preview Stage */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-black/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Mini Member Card Preview */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 w-full sm:w-auto shadow-inner">
            {/* Large Study Icon Preview ('lg' 120px on desktop, styled responsive) */}
            <div className="relative">
              <StudyIcon
                id={selectedId}
                userId={userId}
                state={previewState}
                size="lg"
                isPremium={true} // Allow previewing premium animations
              />
            </div>

            {/* Member Info & Avatar */}
            <div className="flex flex-col gap-1.5 min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <UserAvatar
                  src={userAvatarUrl}
                  name={username || 'Scholar'}
                  size={36}
                  className="rounded-full"
                />
                <div className="min-w-0">
                  <div className="text-xs font-hud font-bold text-white uppercase tracking-wider truncate">
                    {username || 'Scholar'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        previewState === 'studying'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider ${
                        previewState === 'studying' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {previewState === 'studying' ? 'Studying' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Icon Label */}
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-200">
                  {previewMeta.name}
                </span>
                {previewMeta.premium && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-hud font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    Pro
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Segmented Control: Studying / Paused */}
          <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Preview State
            </span>
            <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewState('studying')}
                className={`px-3 py-1.5 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  previewState === 'studying'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Studying
              </button>
              <button
                type="button"
                onClick={() => setPreviewState('paused')}
                className={`px-3 py-1.5 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  previewState === 'paused'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paused
              </button>
            </div>
          </div>
        </div>

        {/* Icon Grid (3 cols desktop, 2 cols mobile) */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
          role="radiogroup"
          aria-label="Available study icons"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_ICON_IDS.map((iconId) => {
              const meta = STUDY_ICONS[iconId];
              const isSelected = selectedId === iconId;
              const isEquipped = activeEquippedId === iconId;
              const isLocked = meta.premium && !isPro;

              return (
                <div
                  key={iconId}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => setSelectedId(iconId)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedId(iconId);
                    }
                  }}
                  className={`group relative flex flex-col items-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none outline-none ${
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

                  {/* Icon Render at 'md' (64px) */}
                  <div className="my-1 group-hover:scale-105 transition-transform duration-200">
                    <StudyIcon
                      id={iconId}
                      userId={userId}
                      state={isSelected ? previewState : 'studying'}
                      size="md"
                      isPremium={true}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="w-full text-center mt-2.5">
                    <div className="text-xs font-hud font-bold text-white uppercase tracking-wider truncate">
                      {meta.name}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">
                      {meta.description}
                    </div>
                  </div>

                  {/* Quick Select / Equip Indicator */}
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] w-full flex items-center justify-center">
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.01] shrink-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {previewMeta.premium && !isPro ? (
              <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 truncate">
                <Crown className="w-3.5 h-3.5 shrink-0 fill-current" />
                <span>Pro subscription required for {previewMeta.name}</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 truncate">
                Active: <strong className="text-white">{STUDY_ICONS[activeEquippedId]?.name || 'Desk Lamp'}</strong>
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
              disabled={isSaving || (selectedId === activeEquippedId && !previewMeta.premium)}
              onClick={() => handleEquip(selectedId)}
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
                : selectedId === activeEquippedId
                ? 'Equipped'
                : 'Equip Icon'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
