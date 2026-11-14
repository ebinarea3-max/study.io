'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Crown,
  Pause,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  RoomFlairId,
  ROOM_FLAIRS,
  ROOM_FLAIR_LIST,
  saveEquippedRoomFlair,
} from '../../lib/roomFlairs';
import { RoomAvatarFlair } from './RoomAvatarFlair';
import { UserAvatar } from '../common/UserAvatar';
import { usePremium } from '../../context/PremiumContext';
import {
  PREMIUM_GOLD_GRADIENT,
  PREMIUM_GOLD_GLOW,
} from '../../lib/premium';

interface RoomAvatarFlairModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFlair: RoomFlairId;
  onEquipFlair: (flair: RoomFlairId) => void;
  isPro: boolean;
  userAvatarUrl?: string | null;
  username?: string;
  onOpenUpgradeModal?: () => void;
}

export function RoomAvatarFlairModal({
  isOpen,
  onClose,
  currentFlair,
  onEquipFlair,
  isPro,
  userAvatarUrl,
  username = 'Scholar',
  onOpenUpgradeModal,
}: RoomAvatarFlairModalProps) {
  const [mounted, setMounted] = useState(false);
  const [previewFlair, setPreviewFlair] = useState<RoomFlairId>(currentFlair);
  const [previewIsStudying, setPreviewIsStudying] = useState<boolean>(true);
  const { openPremiumModal } = usePremium();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPreviewFlair(currentFlair);
      setPreviewIsStudying(true);
    }
  }, [isOpen, currentFlair]);

  if (!isOpen || !mounted) return null;

  const triggerUpgrade = () => {
    if (onOpenUpgradeModal) {
      onOpenUpgradeModal();
    } else {
      openPremiumModal();
    }
  };

  const handleEquip = (flairId: RoomFlairId) => {
    const config = ROOM_FLAIRS[flairId];
    if (config.isPro && !isPro) {
      triggerUpgrade();
      return;
    }

    saveEquippedRoomFlair(flairId);
    onEquipFlair(flairId);
    toast.success(`Equipped ${config.name}! ✨`, {
      style: {
        background: '#0c1017',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.15)',
      },
    });
  };

  const selectedConfig = ROOM_FLAIRS[previewFlair] || ROOM_FLAIRS.default;
  const isSelectedPro = selectedConfig.isPro;
  const canEquipPreview = !isSelectedPro || isPro;
  const isPreviewEquipped = previewFlair === currentFlair;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="flair-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0c1017]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 select-none text-slate-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 id="flair-modal-title" className="text-base sm:text-lg font-hud font-bold text-white tracking-wider uppercase">
                Room Avatar Flairs
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>Rooms Only</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Customize your animated study aura visible to room members.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Interactive Preview Stage */}
        <div className="px-6 py-5 bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent border-b border-white/10 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
          {/* Ambient Glow Backdrop */}
          <div
            aria-hidden="true"
            className="absolute w-44 h-44 rounded-full pointer-events-none blur-3xl opacity-30 transition-all duration-700"
            style={{
              backgroundColor: previewIsStudying ? selectedConfig.themeColor : '#F59E0B',
            }}
          />

          {/* Centered Avatar with Active Flair Animation */}
          <div className="relative my-1">
            <RoomAvatarFlair
              flair={previewFlair}
              isStudying={previewIsStudying}
              isOnline={true}
              size={72}
            >
              <UserAvatar
                src={userAvatarUrl}
                name={username}
                size={72}
                className="shadow-2xl"
              />
            </RoomAvatarFlair>
          </div>

          {/* Preview Details */}
          <div className="text-center mt-2.5">
            <div className="flex items-center justify-center gap-2">
              <h4 className="text-base font-hud font-bold text-white tracking-wide">
                {selectedConfig.name}
              </h4>
              {selectedConfig.isPro ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-hud font-bold uppercase tracking-wider text-slate-950 shadow-sm"
                  style={{
                    background: PREMIUM_GOLD_GRADIENT,
                    boxShadow: `0 0 10px ${PREMIUM_GOLD_GLOW}`,
                  }}
                >
                  <Crown className="w-2.5 h-2.5 fill-current" />
                  PRO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-hud font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FREE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm px-2 line-clamp-2 leading-relaxed">
              {selectedConfig.description}
            </p>
          </div>

          {/* State Preview Segmented Control (Generous padding, never cuts off) */}
          <div className="mt-3.5 mb-1 inline-flex p-1 rounded-xl bg-black/60 border border-white/10 text-xs font-hud shadow-inner">
            <button
              type="button"
              onClick={() => setPreviewIsStudying(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer font-bold ${
                previewIsStudying
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studying State</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewIsStudying(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer font-bold ${
                !previewIsStudying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Pause className="w-2.5 h-2.5 fill-current text-amber-400" />
              <span>Paused State</span>
            </button>
          </div>
        </div>

        {/* Flairs Selection Grid (Balanced 2-Column Grid) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-hud font-bold uppercase tracking-wider text-slate-400">
              Select Aura to Preview &amp; Equip
            </span>
            {currentFlair && (
              <span className="text-[11px] font-mono text-slate-400">
                Active: <strong className="text-amber-300 font-hud">{ROOM_FLAIRS[currentFlair]?.name}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROOM_FLAIR_LIST.map((flair, idx) => {
              const isEquipped = currentFlair === flair.id;
              const isSelected = previewFlair === flair.id;
              const canEquip = !flair.isPro || isPro;
              const isLastOdd = idx === ROOM_FLAIR_LIST.length - 1 && ROOM_FLAIR_LIST.length % 2 !== 0;

              return (
                <div
                  key={flair.id}
                  onClick={() => setPreviewFlair(flair.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isLastOdd ? 'sm:col-span-2 sm:max-w-[calc(50%-0.375rem)] sm:mx-auto w-full' : ''
                  } ${
                    isSelected
                      ? 'bg-amber-500/[0.06] border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                  }`}
                >
                  {/* Flair Thumbnail Icon & Titles */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <RoomAvatarFlair
                        flair={flair.id}
                        isStudying={true}
                        isOnline={true}
                        size={42}
                      >
                        <UserAvatar
                          src={userAvatarUrl}
                          name={username}
                          size={42}
                        />
                      </RoomAvatarFlair>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-sm font-hud font-bold text-white truncate">
                          {flair.name}
                        </h5>
                        {flair.isPro ? (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-hud font-bold uppercase tracking-wider text-slate-950 shrink-0"
                            style={{
                              background: PREMIUM_GOLD_GRADIENT,
                            }}
                          >
                            <Crown className="w-2 h-2 fill-current" />
                            PRO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-hud font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[130px] sm:max-w-[150px] font-mono">
                        {flair.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Equip / Pro Action Gate */}
                  <div className="flex items-center shrink-0">
                    {isEquipped ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-hud font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3" />
                        <span>EQUIPPED</span>
                      </span>
                    ) : canEquip ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquip(flair.id);
                        }}
                        className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-300 hover:text-white text-[10px] font-hud font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFlair(flair.id);
                          triggerUpgrade();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-hud font-bold uppercase tracking-wider text-slate-950 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-sm"
                        style={{
                          background: PREMIUM_GOLD_GRADIENT,
                          boxShadow: `0 0 10px ${PREMIUM_GOLD_GLOW}`,
                        }}
                        title="Pro Exclusive — Click to unlock"
                      >
                        <Crown className="w-2.5 h-2.5 fill-current" />
                        <span>PRO</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Auras activate live across all study focus rooms.</span>
            <span className="sm:hidden">Equips live in study rooms.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {!isPreviewEquipped && (
              canEquipPreview ? (
                <button
                  type="button"
                  onClick={() => handleEquip(previewFlair)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-hud font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Equip {selectedConfig.name}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerUpgrade}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-hud font-bold uppercase tracking-wider text-slate-950 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md"
                  style={{
                    background: PREMIUM_GOLD_GRADIENT,
                    boxShadow: `0 0 12px ${PREMIUM_GOLD_GLOW}`,
                  }}
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>Unlock with Pro</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-hud font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
