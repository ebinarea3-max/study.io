'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Crown,
  Moon,
  MoreVertical,
  Ban,
  Shield,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { AvatarFlairRing, FlairCrown } from '../common/FlairBadge';
import { FlairFrame } from '../../lib/flair';

export interface Participant {
  user_id: string;
  username: string;
  avatar_url?: string | null;
  custom_title?: string | null;
  custom_badge?: string | null;
  is_host?: boolean;
  is_studying?: boolean;
  is_online?: boolean;
  is_current_user?: boolean;
  session_seconds?: number;
  today_seconds?: number;
  total_focus_seconds?: number;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

export function StudyRoomBadge({
  badge,
  className = '',
}: {
  badge?: string | null;
  className?: string;
}) {
  if (!badge || !badge.trim()) return null;

  return (
    <span
      className={`text-[9px] px-1.5 py-0.5 rounded-full bg-[#E6C15A]/10 border border-[#E6C15A]/50 text-[#E6C15A] font-hud font-bold tracking-wider uppercase shadow-[0_0_8px_rgba(230,193,90,0.2)] flex-shrink-0 inline-flex items-center gap-0.5 ${className}`}
      title={`Badge: ${badge}`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      <span>{badge.trim()}</span>
    </span>
  );
}

export function StudyRoomTitle({
  title,
  className = '',
}: {
  title?: string | null;
  className?: string;
}) {
  if (!title || !title.trim()) return null;

  return (
    <p
      className={`text-[11px] font-medium text-amber-200/75 tracking-tight truncate max-w-[130px] -mt-0.5 ${className}`}
      title={title.trim()}
    >
      {title.trim()}
    </p>
  );
}

interface ParticipantCardProps {
  participant: Participant;
  flairFrame?: FlairFrame;
  isRoomHost?: boolean;
  activeMenuUserId?: string | null;
  onToggleMenu?: (userId: string | null) => void;
  onBanMember?: (user: { userId: string; username: string }) => void;
}

export function ParticipantCard({
  participant,
  flairFrame,
  isRoomHost = false,
  activeMenuUserId,
  onToggleMenu,
  onBanMember,
}: ParticipantCardProps) {
  const isStudying = Boolean(participant.is_studying);
  const sessionSec = participant.session_seconds || 0;
  const todaySec = participant.today_seconds || 0;
  const totalFocusSec =
    participant.total_focus_seconds ?? (isStudying ? todaySec + sessionSec : todaySec);

  const isMenuOpen = activeMenuUserId === participant.user_id;

  return (
    <div className="flex flex-col items-center gap-2 group relative transition-all duration-300">
      <div className="relative">
        <AvatarFlairRing frame={flairFrame} size={64}>
          <UserAvatar
            src={participant.avatar_url}
            name={participant.username}
            size={64}
            className={`border-2 transition-all duration-300 ${
              flairFrame
                ? 'border-transparent'
                : isStudying
                ? 'border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.55)] scale-105'
                : participant.is_online
                ? 'border-slate-500 opacity-90'
                : 'border-slate-700/80 opacity-60'
            }`}
          />
        </AvatarFlairRing>

        {/* Resting status badge */}
        {!isStudying && (
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#07090e] shadow-md transition-colors ${
              participant.is_online ? 'bg-slate-700' : 'bg-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-slate-300" />
          </div>
        )}

        {/* Host action menu */}
        {isRoomHost && !participant.is_host && !participant.is_current_user && onBanMember && (
          <div className="absolute -top-1 -right-2 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu?.(isMenuOpen ? null : participant.user_id);
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center bg-[#0d121c] border border-white/20 text-slate-300 hover:text-white hover:border-amber-400/60 hover:bg-black shadow-lg transition-all cursor-pointer ${
                isMenuOpen
                  ? 'opacity-100 ring-2 ring-amber-500/50 bg-black text-amber-300 scale-105'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Scholar Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-28 bg-[#0c1017] border border-white/15 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.9)] backdrop-blur-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu?.(null);
                    onBanMember({
                      userId: participant.user_id,
                      username: participant.username,
                    });
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 text-[11px] font-hud font-bold uppercase tracking-wider transition-colors cursor-pointer text-left"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ban</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Participant Identity & Focus Time */}
      <div className="text-center mt-1 flex flex-col items-center max-w-[140px]">
        {/* Name, Crown, Host tag, and Custom Badge */}
        <div className="flex items-center gap-1.5 justify-center flex-wrap">
          <p
            className="text-sm font-bold text-slate-200 truncate max-w-[100px]"
            title={participant.username}
          >
            {participant.username}
          </p>

          {flairFrame && <FlairCrown frame={flairFrame} size={13} />}

          {participant.is_host && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold uppercase tracking-wider flex-shrink-0">
              Host
            </span>
          )}

          {/* Custom Study Room Badge */}
          {participant.custom_badge && (
            <StudyRoomBadge badge={participant.custom_badge} />
          )}
        </div>

        {/* Custom Study Room Title */}
        {participant.custom_title && (
          <StudyRoomTitle title={participant.custom_title} />
        )}

        {/* Total Focus Time Today with ticking live session timer */}
        <p
          className={`text-sm font-mono mt-1 font-bold tracking-wider transition-colors ${
            isStudying
              ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              : 'text-slate-300'
          }`}
        >
          {formatSeconds(totalFocusSec)}
        </p>

        {/* Subtitle explaining state */}
        <span
          className={`text-[10px] font-medium tracking-tight mt-0.5 ${
            isStudying
              ? 'text-amber-400/90 font-semibold'
              : participant.is_online
              ? 'text-slate-400'
              : 'text-slate-500'
          }`}
        >
          {isStudying ? (
            <span>Studying ({formatSeconds(sessionSec)})</span>
          ) : (
            <span>Today • {participant.is_online ? 'Paused' : 'Offline'}</span>
          )}
        </span>
      </div>
    </div>
  );
}

interface ParticipantListProps {
  participants: Participant[];
  flairMap?: Record<string, FlairFrame>;
  isRoomHost?: boolean;
  onBanMember?: (user: { userId: string; username: string }) => void;
  emptyMessage?: string;
}

export function ParticipantList({
  participants,
  flairMap = {},
  isRoomHost = false,
  onBanMember,
  emptyMessage = 'Waiting for scholars to join...',
}: ParticipantListProps) {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-8 justify-center items-start mt-8 pb-28 md:pb-8">
      {participants.map((p) => (
        <ParticipantCard
          key={p.user_id}
          participant={p}
          flairFrame={flairMap[p.user_id]}
          isRoomHost={isRoomHost}
          activeMenuUserId={activeMenuUserId}
          onToggleMenu={setActiveMenuUserId}
          onBanMember={onBanMember}
        />
      ))}

      {participants.length === 0 && (
        <div className="text-slate-500 text-center w-full mt-10">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default ParticipantList;
