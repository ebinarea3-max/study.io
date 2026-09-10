'use client';

import React, { useState } from 'react';
import { RoomMember } from '../../types';
import { formatSeconds, formatHoursAndMins } from '../../lib/utils';
import { useRoom } from '../../context/RoomContext';
import { Flame, Coffee, Sparkles, BookOpen, Clock, Zap } from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from '../common/UserAvatar';

interface MemberCardProps {
  member: RoomMember;
  isCurrentUser?: boolean;
}

const QUICK_CHEERS = ['🔥', '☕', '⚡', '👏', '🎯', '💪'];

export function MemberCard({ member, isCurrentUser }: MemberCardProps) {
  const { sendCheer } = useRoom();
  const [showCheerPicker, setShowCheerPicker] = useState(false);

  const isActive = member.status === 'studying';
  const subjectColor = member.currentSubjectColor || '#10B981';

  const handleSendCheer = (emoji: string) => {
    sendCheer(member.displayName, emoji);
    setShowCheerPicker(false);
  };

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
        isActive
          ? 'bg-slate-900/90 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10 hover:border-emerald-400 hover:shadow-emerald-500/20 active-studier-card'
          : 'bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Active Glowing Background Accent */}
      {isActive && (
        <div
          className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: subjectColor }}
        />
      )}

      {/* Top row: Avatar + Name + Flame Streak */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <UserAvatar
              src={member.avatarUrl}
              name={member.displayName}
              size={48}
              className={`w-12 h-12 rounded-xl transition-transform group-hover:scale-105 ${
                isActive
                  ? 'border-2 border-emerald-400 shadow-md shadow-emerald-500/30'
                  : 'border border-slate-700'
              }`}
            />
            {/* Live pulsating status dot */}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                isActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            >
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
              )}
            </span>
          </div>

          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5 leading-tight">
              <span className="truncate max-w-[120px]">{member.displayName}</span>
              {isCurrentUser && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  You
                </span>
              )}
            </div>
            {/* Streak indicator */}
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium mt-0.5">
              <Flame className="w-3 h-3 fill-amber-400" />
              <span>{member.streakDays}d streak</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          {isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide uppercase shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
              <Coffee className="w-3 h-3" />
              Resting
            </span>
          )}
        </div>
      </div>

      {/* Middle: Subject Pill */}
      <div className="my-3 relative z-10">
        {isActive ? (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border max-w-full truncate"
            style={{
              backgroundColor: `${subjectColor}15`,
              borderColor: `${subjectColor}40`,
              color: subjectColor,
            }}
          >
            <BookOpen className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{member.currentSubjectName || 'Studying'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Taking a quick breather</span>
          </div>
        )}
      </div>

      {/* Timer Display Box */}
      <div
        className={`p-3 rounded-xl border relative z-10 ${
          isActive
            ? 'bg-slate-950/80 border-emerald-500/30'
            : 'bg-slate-950/50 border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
          <span>{isActive ? 'Current Session' : 'Last Session'}</span>
          <span className="text-slate-500">Today: {formatHoursAndMins(member.todayTotalSeconds)}</span>
        </div>
        <div
          className={`font-mono text-xl sm:text-2xl font-black tracking-tight ${
            isActive ? 'text-emerald-400 drop-shadow-sm' : 'text-slate-400'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {isActive ? formatSeconds(member.activeTimerSeconds) : '00:00:00'}
        </div>
      </div>

      {/* Bottom Cheer Button & Emoji Selector */}
      {!isCurrentUser && (
        <div className="mt-3 relative z-20">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowCheerPicker(!showCheerPicker)}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Send Cheer</span>
            </button>
          </div>

          {/* Cheer picker popup */}
          {showCheerPicker && (
            <div className="absolute bottom-10 left-0 right-0 p-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl flex items-center justify-around gap-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              {QUICK_CHEERS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleSendCheer(emoji)}
                  className="text-lg p-1.5 hover:scale-130 transition-transform rounded-lg hover:bg-slate-800"
                  title={`Cheer with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
