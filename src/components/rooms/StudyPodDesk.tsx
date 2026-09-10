'use client';

import React, { useState } from 'react';
import { RoomMember } from '../../types';
import { formatSeconds, formatHoursAndMins } from '../../lib/utils';
import { useRoom } from '../../context/RoomContext';
import { Flame, Coffee, BookOpen, Sparkles, Zap, Laptop, Brain, Target, Heart } from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from '../common/UserAvatar';

interface StudyPodDeskProps {
  member: RoomMember;
  isCurrentUser?: boolean;
}

const QUICK_CHEERS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '⚡', label: 'Energy' },
  { emoji: '☕', label: 'Coffee' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🎯', label: 'Focus' },
  { emoji: '💪', label: 'Strength' },
];

export function StudyPodDesk({ member, isCurrentUser }: StudyPodDeskProps) {
  const { sendCheer } = useRoom();
  const [showCheerPicker, setShowCheerPicker] = useState(false);

  const isActive = member.status === 'studying';
  const subjectColor = member.currentSubjectColor || '#10B981';

  const handleSendCheer = (emoji: string) => {
    sendCheer(member.displayName, emoji);
    setShowCheerPicker(false);
  };

  // Dynamic study icon based on subject / activity
  const renderStudyIcon = () => {
    if (!isActive) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
          <Coffee className="w-4 h-4" />
        </div>
      );
    }

    const subName = (member.currentSubjectName || '').toLowerCase();
    let IconComponent = Zap;
    if (subName.includes('read') || subName.includes('book')) {
      IconComponent = BookOpen;
    } else if (subName.includes('code') || subName.includes('hack') || subName.includes('dev')) {
      IconComponent = Laptop;
    } else if (subName.includes('math') || subName.includes('brain') || subName.includes('research')) {
      IconComponent = Brain;
    } else if (subName.includes('target') || subName.includes('goal')) {
      IconComponent = Target;
    }

    return (
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg relative animate-pulse"
        style={{
          backgroundColor: `${subjectColor}25`,
          border: `1.5px solid ${subjectColor}60`,
          color: subjectColor,
        }}
      >
        <IconComponent className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden group backdrop-blur-xl ${
        isActive
          ? 'bg-slate-900/90 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 hover:border-emerald-400 hover:shadow-emerald-500/20'
          : 'bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Background Accent Aura */}
      {isActive && (
        <div
          className="absolute -top-14 -right-14 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity"
          style={{ backgroundColor: subjectColor }}
        />
      )}

      {/* Top Pod Header: Member Avatar with Glowing Study Halo + Study Icon */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Avatar with dynamic breathing ring */}
          <div className="relative">
            <div
              className={`p-0.5 rounded-2xl transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800'
              }`}
            >
              <UserAvatar
                src={member.avatarUrl}
                name={member.displayName}
                size={48}
                className="w-12 h-12 rounded-[14px]"
              />
            </div>

            {/* Active Live Status Dot */}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                isActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            >
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
              )}
            </span>
          </div>

          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-1.5 leading-tight">
              <span className="truncate max-w-[120px] sm:max-w-[140px]">{member.displayName}</span>
              {isCurrentUser && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
                  You
                </span>
              )}
            </div>

            {/* Streak & Status */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{member.streakDays}d streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Icon Glyph on the right (YPT-inspired unique desk icon) */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {renderStudyIcon()}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isActive ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {isActive ? 'Focusing' : 'Resting'}
          </span>
        </div>
      </div>

      {/* Subject Focus Badge */}
      <div className="my-3.5 relative z-10">
        {isActive ? (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border max-w-full truncate shadow-sm"
            style={{
              backgroundColor: `${subjectColor}15`,
              borderColor: `${subjectColor}40`,
              color: subjectColor,
            }}
          >
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.currentSubjectName || 'Studying'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-1">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Taking a mindful break</span>
          </div>
        )}
      </div>

      {/* Live Ticking Timer Pod Display */}
      <div
        className={`p-3.5 rounded-2xl border relative z-10 transition-colors ${
          isActive
            ? 'bg-slate-950/80 border-emerald-500/30 shadow-inner'
            : 'bg-slate-950/40 border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
          <span>{isActive ? 'Session Elapsed' : 'Session Paused'}</span>
          <span className="text-slate-500">Today: {formatHoursAndMins(member.todayTotalSeconds)}</span>
        </div>
        <div
          className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${
            isActive ? 'text-emerald-400 drop-shadow-sm' : 'text-slate-500'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {isActive ? formatSeconds(member.activeTimerSeconds) : '00:00:00'}
        </div>
      </div>

      {/* Cheer Button & Interactive Picker (for peers) */}
      {!isCurrentUser && (
        <div className="mt-3.5 relative z-20">
          <button
            onClick={() => setShowCheerPicker(!showCheerPicker)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Send Cheer</span>
          </button>

          {showCheerPicker && (
            <div className="absolute bottom-11 left-0 right-0 p-2 bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl flex items-center justify-around gap-1 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              {QUICK_CHEERS.map(c => (
                <button
                  key={c.emoji}
                  onClick={() => handleSendCheer(c.emoji)}
                  className="text-lg p-1.5 hover:scale-135 transition-transform rounded-xl hover:bg-slate-800"
                  title={`Cheer with ${c.label}`}
                >
                  {c.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
