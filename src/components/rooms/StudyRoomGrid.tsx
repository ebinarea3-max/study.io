'use client';

import React, { useState, useMemo } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { RoomDirectory } from './RoomDirectory';
import { StudyPodDesk } from './StudyPodDesk';
import { GroupChatModal } from './GroupChatModal';
import {
  Users,
  ArrowLeft,
  MessageSquare,
  Lock,
  Globe,
  Coffee,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export function StudyRoomGrid() {
  const { user } = useAuth();
  const {
    activeRoomId,
    currentRoom,
    roomMembers,
    activeStudierCount,
    restingMemberCount,
    leaveRoom,
    messages,
  } = useRoom();

  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);

  // Sort members: Active studiers first, then sorted by today's total time
  const sortedMembers = useMemo(() => {
    return [...roomMembers].sort((a, b) => {
      // Active studiers first
      if (a.status === 'studying' && b.status !== 'studying') return -1;
      if (a.status !== 'studying' && b.status === 'studying') return 1;
      // Then by today's total study time
      return b.todayTotalSeconds - a.todayTotalSeconds;
    });
  }, [roomMembers]);

  // If no room is actively joined, show the clean Room Directory lobby
  if (!activeRoomId) {
    return <RoomDirectory />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Hidden Group Chat Modal - only visible when clicked */}
      <GroupChatModal
        isOpen={isGroupChatOpen}
        onClose={() => setIsGroupChatOpen(false)}
      />

      {/* Top Navigation & Room Information Card */}
      <div className="relative rounded-3xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-xl p-5 sm:p-7 shadow-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button & Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
          <button
            onClick={leaveRoom}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition-all group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-emerald-400" />
            <span>Back to Rooms</span>
          </button>

          {/* Group Chat Button - Distraction-free (only opens when clicked) */}
          <button
            onClick={() => setIsGroupChatOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-extrabold transition-all shadow-md group"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Group Chat</span>
            {messages.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Room Header Info */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>

              {currentRoom.isPrivate ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Lock className="w-3 h-3" />
                  Password Protected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Globe className="w-3 h-3" />
                  Public Room
                </span>
              )}

              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">Distraction-Free Focus</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{currentRoom.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {currentRoom.description}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeStudierCount} Focusing Now</span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-2 text-xs font-medium">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>{restingMemberCount} Resting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus Floor: Study Desks Grid (No chat sidebar to avoid distraction) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white tracking-wide">
              Live Study Desks ({sortedMembers.length} {sortedMembers.length === 1 ? 'Person' : 'People'})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Live ticking stopwatch</span>
        </div>

        {/* Study Pods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {sortedMembers.map(member => (
            <StudyPodDesk
              key={member.id}
              member={member}
              isCurrentUser={member.userId === user.id}
            />
          ))}

          {/* Single-user notice card */}
          {sortedMembers.length === 1 && (
            <div className="rounded-3xl p-6 border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-200">Focus Desk Ready</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                You&apos;re currently holding down this room. Switch to the Timer tab to start your session, or open another browser window to study together!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
