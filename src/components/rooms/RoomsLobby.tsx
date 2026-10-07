"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Users, Shield, ShieldOff, Search, ChevronLeft } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Logo } from '../Logo';

export interface StudyRoom {
  id: string;
  name: string;
  is_private: boolean;
  created_at: string;
  host_id: string;
  host_username: string;
  host_rank: string;
}

interface RoomsLobbyProps {
  initialRooms: StudyRoom[];
  userId: string;
}

export default function RoomsLobby({ initialRooms, userId }: RoomsLobbyProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<StudyRoom[]>(initialRooms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setIsSubmitting(true);
    const supabase = getSupabase();
    if (!supabase) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .insert({
          name: newRoomName.trim(),
          host_id: userId,
          is_private: isPrivate
        })
        .select(`
          id,
          name,
          is_private,
          created_at,
          host_id,
          host:profiles!host_id (
            username,
            rank_title
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        const hostData = Array.isArray(data.host) ? data.host[0] : data.host;
        
        const formattedRoom: StudyRoom = {
          id: data.id,
          name: data.name,
          is_private: data.is_private,
          created_at: data.created_at,
          host_id: data.host_id,
          host_username: (hostData as any)?.username || 'Unknown Host',
          host_rank: (hostData as any)?.rank_title || 'Unranked'
        };

        setRooms(prev => [formattedRoom, ...prev]);
        setIsModalOpen(false);
        setNewRoomName('');
        setIsPrivate(false);
        
        // Navigate straight to the room
        router.push(`/rooms/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/5 via-transparent to-transparent pointer-events-none" />

      <header className="w-full flex items-center justify-between p-6 relative z-20">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-hud tracking-widest text-sm font-bold mt-0.5">DASHBOARD</span>
        </Link>
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 md:py-8 relative z-10 flex flex-col">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black font-hud tracking-widest uppercase text-white drop-shadow-md">
              Study Lobby
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2">
              Join active focus sessions or host your own.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 rounded-xl text-black font-hud font-bold tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            CREATE ROOM
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.05]">
              <Search className="w-12 h-12 text-slate-500 mb-4" />
              <h3 className="text-xl font-bold font-hud tracking-widest text-slate-400 uppercase">No Active Rooms</h3>
              <p className="text-slate-500 mt-2 font-mono text-sm">Be the first to host a session!</p>
            </div>
          ) : (
            rooms.map(room => (
              <div 
                key={room.id}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] hover:border-amber-500/30 rounded-2xl p-6 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.4)] group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold font-hud uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {room.name}
                  </h3>
                  {room.is_private ? (
                    <Shield className="w-5 h-5 text-amber-500/80 shrink-0" />
                  ) : (
                    <ShieldOff className="w-5 h-5 text-slate-500/50 shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">
                      {room.host_username}
                    </div>
                    <div className="text-xs font-mono text-amber-500/80 uppercase">
                      {room.host_rank}
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="block w-full py-3 text-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-hud tracking-widest text-sm transition-colors"
                  >
                    JOIN ROOM
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c0f17] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-800 bg-slate-900/20">
              <h2 className="text-2xl font-black font-hud uppercase tracking-widest text-white">
                Create Study Room
              </h2>
            </div>
            
            <form onSubmit={handleCreateRoom} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                    Room Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g., Deep Work Grind"
                    className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors font-sans"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-amber-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isPrivate ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-mono text-slate-300">
                    Private Room
                  </span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-transparent border border-slate-700 hover:bg-slate-800 text-white rounded-xl font-hud tracking-widest text-sm transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black rounded-xl font-hud font-bold tracking-widest text-sm transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? 'CREATING...' : 'LAUNCH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
