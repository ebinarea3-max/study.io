'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Crown,
  Pause,
  ShieldCheck,
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

  const selectedConfig = ROOM_FLAIRS[previewFlair];
  const isSelectedPro = selectedConfig.isPro;
  const canEquipPreview = !isSelectedPro || isPro;
  const isPreviewEquipped = previewFlair === currentFlair;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="flair-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0c1017] border border-white/15 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 select-none text-slate-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-start justify-between bg-white/[0.02]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 id="flair-modal-title" className="text-base sm:text-lg font-hud font-bold text-white tracking-wide">
                ROOM AVATAR FLAIRS
              </h3>
              <span className="text-[10px] font-hud font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Rooms Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Customize your animated study aura in multiplayer focus chambers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 -mr-1 -mt-0.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Interactive Preview Stage */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Ambient Glow Backdrop */}
          <div
            className="absolute w-44 h-44 rounded-full pointer-events-none blur-3xl opacity-35 transition-all duration-700"
            style={{
              backgroundColor: previewIsStudying ? selectedConfig.themeColor : '#F59E0B',
            }}
          />

          {/* Centered Avatar with Active Flair Animation */}
          <div className="relative mb-3">
            <RoomAvatarFlair
              flair={previewFlair}
              isStudying={previewIsStudying}
              isOnline={true}
              size={76}
            >
              <UserAvatar
                src={userAvatarUrl}
                name={username}
                size={76}
                className="shadow-xl"
              />
            </RoomAvatarFlair>
          </div>

          {/* Preview Details */}
          <div className="text-center mt-2">
            <div className="flex items-center justify-center gap-2">
              <h4 className="text-base font-hud font-bold text-white tracking-wide">
                {selectedConfig.name}
              </h4>
              {selectedConfig.isPro ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-hud font-bold uppercase tracking-wider text-slate-950 shadow-sm"
                  style={{
                    background: PREMIUM_GOLD_GRADIENT,
                    boxShadow: `0 0 10px ${PREMIUM_GOLD_GLOW}`,
                  }}
                >
                  <Crown className="w-3 h-3 fill-current" />
                  PRO EXCLUSIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-hud font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FREE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm px-2">
              {selectedConfig.description}
            </p>
          </div>

          {/* State Preview Pill Toggle (Studying vs Paused) */}
          <div className="mt-4 flex items-center bg-black/60 border border-white/10 p-1 rounded-2xl shadow-inner gap-1">
            <button
              type="button"
              onClick={() => setPreviewIsStudying(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider uppercase transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider uppercase transition-all cursor-pointer ${
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

        {/* Flairs Selection Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 scrollbar-thin">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] font-hud font-bold uppercase tracking-wider text-slate-400">
              Select Flair to Preview &amp; Equip
            </span>
            {currentFlair && (
              <span className="text-[11px] font-mono text-slate-400">
                Active: <strong className="text-white">{ROOM_FLAIRS[currentFlair]?.name}</strong>
              </span>
            )}
          </div>

          {ROOM_FLAIR_LIST.map((flair) => {
            const isEquipped = currentFlair === flair.id;
            const isSelected = previewFlair === flair.id;
            const canEquip = !flair.isPro || isPro;

            return (
              <div
                key={flair.id}
                onClick={() => setPreviewFlair(flair.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-white/[0.08] border-amber-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                }`}
              >
                {/* Flair Thumbnail Icon & Titles */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <RoomAvatarFlair
                      flair={flair.id}
                      isStudying={true}
                      isOnline={true}
                      size={44}
                    >
                      <UserAvatar
                        src={userAvatarUrl}
                        name={username}
                        size={44}
                      />
                    </RoomAvatarFlair>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-hud font-bold text-white truncate">
                        {flair.name}
                      </h5>
                      {flair.isPro ? (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-hud font-bold uppercase tracking-wider text-slate-950 shrink-0"
                          style={{
                            background: PREMIUM_GOLD_GRADIENT,
                          }}
                        >
                          <Crown className="w-2.5 h-2.5 fill-current" />
                          PRO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-hud font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                          FREE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                      {flair.subtitle}
                    </p>
                  </div>
                </div>

                {/* Equip / Pro Action Gate */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEquipped ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-hud font-bold uppercase tracking-wider">
                      <Check className="w-3.5 h-3.5" />
                      <span>EQUIPPED</span>
                    </span>
                  ) : canEquip ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquip(flair.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-hud font-bold uppercase tracking-wider text-slate-950 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-sm"
                      style={{
                        background: PREMIUM_GOLD_GRADIENT,
                        boxShadow: `0 0 10px ${PREMIUM_GOLD_GLOW}`,
                      }}
                      title="Pro Exclusive — Click to unlock"
                    >
                      <Crown className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">PRO EXCLUSIVE — </span>
                      <span>Unlock with Upgrade</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Flairs activate instantly in all study rooms when focusing.</span>
            <span className="sm:hidden">Equips live across study rooms.</span>
          </div>

          <div className="flex items-center gap-2">
            {!isPreviewEquipped && (
              canEquipPreview ? (
                <button
                  type="button"
                  onClick={() => handleEquip(previewFlair)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-hud font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
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
                  <span>PRO EXCLUSIVE — Unlock with Upgrade</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-hud font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
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
