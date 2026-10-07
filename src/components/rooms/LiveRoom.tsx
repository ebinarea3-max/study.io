"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { useStudy } from '../../context/StudyContext';
import { Logo } from '../../components/Logo';
import { Users, ChevronLeft, Flame, Coffee, Laptop } from 'lucide-react';

interface PresenceUser {
  user_id: string;
  username: string;
  avatar_url?: string;
  timer_start_at: number | null;
}

interface LiveRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

export default function LiveRoom({ roomId, onLeaveRoom }: LiveRoomProps) {
  const { user } = useAuth();
  const { isRunning, elapsedSeconds } = useStudy();
  
  const [roomName, setRoomName] = useState<string>('Loading Room...');
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
  
  const channelRef = useRef<any>(null);
  // Use refs to always have the latest timer values without re-creating the channel
  const isRunningRef = useRef(isRunning);
  const elapsedSecondsRef = useRef(elapsedSeconds);

  useEffect(() => {
    isRunningRef.current = isRunning;
    elapsedSecondsRef.current = elapsedSeconds;
  }, [isRunning, elapsedSeconds]);

  // Fetch Room Info
  useEffect(() => {
    if (!roomId) return;
    const fetchData = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: roomData, error: roomError } = await supabase
        .from('study_rooms')
        .select('name')
        .eq('id', roomId)
        .single();
        
      if (roomData) {
        setRoomName(roomData.name);
      } else if (roomError) {
        setRoomName('Unknown Room');
      }
    };
    fetchData();
  }, [roomId]);

  // Helper to build the presence payload using refs for freshness
  const buildPresencePayload = useCallback(() => {
    if (!user) return null;
    return {
      user_id: user.id,
      username: user.username || user.displayName || 'Unknown Scholar',
      avatar_url: user.avatarUrl || user.user_metadata?.avatar_url || '',
      timer_start_at: isRunningRef.current ? Date.now() - (elapsedSecondsRef.current * 1000) : null
    };
  }, [user]);

  // Realtime Subscriptions — only re-run when roomId or user identity changes
  useEffect(() => {
    if (!roomId || !user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const users = Object.values(state).map((presenceArr: any) => presenceArr[0]);
        setPresentUsers(users as PresenceUser[]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const payload = buildPresencePayload();
          if (payload) {
            await roomChannel.track(payload);
          }
        }
      });

    channelRef.current = roomChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, user, buildPresencePayload]);

  // Update Presence on Timer State Change — only fires when isRunning toggles
  useEffect(() => {
    if (!channelRef.current || !user || !roomId) return;
    
    const channel = channelRef.current;
    if (channel.state === 'joined') {
      const payload = buildPresencePayload();
      if (payload) {
        channel.track(payload).catch((err: any) => console.error('Failed to update presence:', err));
      }
    }
  }, [isRunning, user, roomId, buildPresencePayload]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between p-4 md:p-6 relative z-20 border-b border-white/[0.05] bg-black/20 backdrop-blur-md">
        <button onClick={onLeaveRoom} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-hud tracking-widest text-sm font-bold mt-0.5">LEAVE ROOM</span>
        </button>
        <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-black font-hud tracking-widest uppercase text-white drop-shadow-md">
            {roomName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-mono text-amber-500 font-bold">{presentUsers.length}</span>
          <Logo className="w-8 h-8 ml-2" />
        </div>
      </header>

      {/* Main Layout — Centered Grid */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-12 relative z-10 flex flex-col items-center justify-center">
        
        {presentUsers.length === 0 ? (
          <div className="flex flex-col items-center opacity-50">
             <Users className="w-12 h-12 mb-4" />
             <p className="font-mono text-sm tracking-widest uppercase">Waiting for scholars...</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 sm:gap-8 justify-center items-start w-full">
            {presentUsers.map((pUser, idx) => (
              <LiveUserIcon key={`${pUser.user_id}-${idx}`} pUser={pUser} />
            ))}
          </div>
        )}
        
      </main>
    </div>
  );
}

// ─── Minimalist User Icon with Live Ticking Timer ─────────────────────────────
const LiveUserIcon = ({ pUser }: { pUser: PresenceUser }) => {
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const isStudying = pUser.timer_start_at !== null;

  useEffect(() => {
    if (!pUser.timer_start_at) {
      setDisplayTime('00:00:00');
      return;
    }

    const update = () => {
      const ms = Date.now() - pUser.timer_start_at!;
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setDisplayTime(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pUser.timer_start_at]);

  return (
    <div className={`flex flex-col items-center gap-2 p-3 w-28 sm:w-32 transition-all duration-300 ${!isStudying ? 'opacity-50 hover:opacity-80' : ''}`}>
      {/* Icon */}
      <div className="relative flex items-center justify-center w-16 h-16 mb-1">
        {isStudying ? (
          <>
            <Laptop className="w-12 h-12 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" strokeWidth={1.2} />
            <Flame className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]" strokeWidth={2} fill="currentColor" />
          </>
        ) : (
          <Coffee className="w-12 h-12 text-slate-600" strokeWidth={1.2} />
        )}
      </div>
      {/* Name + Time */}
      <div className="flex flex-col items-center w-full">
        <span className={`text-[13px] font-bold truncate w-full text-center ${isStudying ? 'text-amber-500' : 'text-slate-500'}`}>
          {pUser.username}
        </span>
        <span className={`text-[13px] font-mono tracking-wider mt-0.5 ${isStudying ? 'text-amber-400' : 'text-slate-600'}`}>
          {isStudying ? displayTime : 'Idle'}
        </span>
      </div>
    </div>
  );
};
