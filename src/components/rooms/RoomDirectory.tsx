'use client';

import React, { useState, useMemo } from 'react';
import { useRoom } from '../../context/RoomContext';
import { StudyRoom } from '../../types';
import { CreateRoomModal } from './CreateRoomModal';
import { PasswordPromptModal } from './PasswordPromptModal';
import { Search, Plus, Lock, Globe, ArrowRight, X, Sparkles, ShieldCheck } from 'lucide-react';

export function RoomDirectory() {
  const { rooms, enterRoom, unlockedRoomIds } = useRoom();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLockedRoom, setSelectedLockedRoom] = useState<StudyRoom | null>(null);

  // Filter rooms by name
  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter(room => room.name.toLowerCase().includes(query));
  }, [rooms, searchQuery]);

  const handleRoomClick = (room: StudyRoom) => {
    if (!room.isPrivate || !room.passcode || unlockedRoomIds.includes(room.id)) {
      enterRoom(room.id);
    } else {
      setSelectedLockedRoom(room);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Modals */}
      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <PasswordPromptModal
        room={selectedLockedRoom}
        isOpen={!!selectedLockedRoom}
        onClose={() => setSelectedLockedRoom(null)}
      />

      {/* Directory Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Study Rooms</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
              {rooms.length} Available
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose a study room or create your own focus space with optional password protection.
          </p>
        </div>

        {/* Create Room Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Room</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search rooms by name..."
          className="w-full pl-12 pr-10 py-3.5 bg-slate-900/90 border border-slate-800 focus:border-emerald-500/60 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xl backdrop-blur-xl transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Room Names List */}
      <div className="space-y-3">
        {filteredRooms.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">No rooms found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No study room matching &ldquo;{searchQuery}&rdquo;. You can create a new public or password-protected room now!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create &ldquo;{searchQuery}&rdquo;</span>
            </button>
          </div>
        ) : (
          filteredRooms.map(room => {
            const isUnlocked = unlockedRoomIds.includes(room.id);
            const isLocked = room.isPrivate && room.passcode && !isUnlocked;

            return (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className="group relative p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex items-center justify-between gap-4 backdrop-blur-xl"
              >
                {/* Left: Room Name + Privacy Badge */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isLocked
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        : isUnlocked && room.isPrivate
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : isUnlocked && room.isPrivate ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-300 transition-colors truncate">
                      {room.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {room.isPrivate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <Lock className="w-3 h-3" />
                          {isUnlocked ? 'Unlocked' : 'Password Protected'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <Globe className="w-3 h-3" />
                          Public Room
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Join Action Indicator */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <span>{isLocked ? 'Enter Passcode' : 'Join Room'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="sm:hidden p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
