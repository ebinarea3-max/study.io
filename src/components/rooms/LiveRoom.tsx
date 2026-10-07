"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { useStudy } from '../../context/StudyContext';
import { StudyTimer } from '../../components/timer/StudyTimer';
import { Logo } from '../../components/Logo';
import Link from 'next/link';
import { Send, Users, ChevronLeft, MessageSquare, User, Flame, Coffee } from 'lucide-react';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  text: string;
  timestamp: number;
}

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

  // Realtime Subscriptions
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
        // Flatten the presence state array
        const users = Object.values(state).map((presenceArr: any) => presenceArr[0]);
        setPresentUsers(users as PresenceUser[]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: user.id,
            username: user.username || user.displayName || 'Unknown Scholar',
            avatar_url: user.avatarUrl || user.user_metadata?.avatar_url || '',
            timer_start_at: isRunning ? Date.now() - (elapsedSeconds * 1000) : null
          });
        }
      });

    channelRef.current = roomChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  // Update Presence on Timer State Change
  useEffect(() => {
    if (!channelRef.current || !user || !roomId) return;
    
    // Check if channel is joined and track is available
    if (channelRef.current.state === 'joined') {
      channelRef.current.track({
        user_id: user.id,
        username: user.username || user.displayName || 'Unknown Scholar',
        avatar_url: user.avatarUrl || user.user_metadata?.avatar_url || '',
        timer_start_at: isRunning ? Date.now() - (elapsedSeconds * 1000) : null
      }).catch((err: any) => console.error('Failed to update presence:', err));
    }
  }, [isRunning, user, roomId, elapsedSeconds]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Ambience matches the app */}
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
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-12 relative z-10 flex flex-col items-center justify-center">
        
        {presentUsers.length === 0 ? (
          <div className="flex flex-col items-center opacity-50">
             <Users className="w-12 h-12 mb-4" />
             <p className="font-mono text-sm tracking-widest uppercase">Waiting for scholars...</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 justify-center items-center w-full">
            {presentUsers.map((pUser, idx) => (
              <LiveUserIcon key={`${pUser.user_id}-${idx}`} user={pUser} />
            ))}
          </div>
        )}
        
      </main>
    </div>
  );
}

const LiveUserIcon = ({ user }: { user: PresenceUser }) => {
  const [displayTime, setDisplayTime] = useState('00:00:00');

  useEffect(() => {
    if (!user.timer_start_at) return;

    const update = () => {
      const ms = Date.now() - user.timer_start_at!;
      const totalSeconds = Math.floor(ms / 1000);
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
  }, [user.timer_start_at]);

  return (
    <div className="flex flex-col items-center gap-3 bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm transition-transform hover:scale-105">
      <div className="w-20 h-20 rounded-full border-[3px] border-amber-500/50 flex items-center justify-center bg-slate-800 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.2)] relative">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <User className="w-10 h-10 text-slate-400" />
        )}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-white mb-1.5">{user.username}</span>
        {user.timer_start_at ? (
          <span className="text-sm font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            {displayTime}
          </span>
        ) : (
          <span className="text-sm font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
            Paused
          </span>
        )}
      </div>
    </div>
  );
};
