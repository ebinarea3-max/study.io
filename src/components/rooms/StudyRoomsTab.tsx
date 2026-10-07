import React, { useState, useEffect } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users } from 'lucide-react';
import LiveRoom from './LiveRoom';

interface StudyRoom {
  id: string;
  name: string;
  is_private: boolean;
  created_at: string;
  host_id: string;
}

export default function StudyRoomsTab({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase
      .from('study_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setRooms(data as StudyRoom[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!user) return;
    const roomName = window.prompt("Enter Room Name:");
    if (!roomName || !roomName.trim()) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('study_rooms')
      .insert([{ name: roomName.trim(), host_id: user.id }]);

    if (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } else {
      fetchRooms(); // Immediately re-fetch
    }
  };

  if (activeRoomId) {
    return <LiveRoom roomId={activeRoomId} onLeaveRoom={() => setActiveRoomId(null)} />;
  }

  return (
    <div className="w-full flex flex-col relative min-h-screen">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      
      {/* Lobby Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
          <div>
            <h2 className="text-2xl font-hud font-black tracking-widest text-white mb-1 uppercase">Active Study Rooms</h2>
            <p className="text-sm text-slate-400">Join a live session or start your own grind.</p>
          </div>
          <button
            onClick={handleCreateRoom}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-hud font-bold tracking-wider rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Plus className="w-5 h-5" />
            <span>CREATE ROOM</span>
          </button>
        </div>

        {/* Grid Section */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-sm">
            <Users className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-300 font-hud tracking-widest uppercase mb-2">No Active Rooms</h3>
            <p className="text-slate-500 text-center max-w-sm">Be the first to start a grind session! Create a room above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
            {rooms.map((room) => (
              <div 
                key={room.id}
                className="flex flex-col p-6 bg-[#07090e] border border-white/[0.08] hover:border-amber-500/30 rounded-2xl transition-all duration-300 group hover:shadow-[0_8px_30px_rgba(245,158,11,0.05)] relative overflow-hidden"
              >
                {/* Subtle gradient hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-bold text-slate-100 font-hud tracking-wide uppercase mb-2 truncate" title={room.name}>
                    {room.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-6">
                    <Users className="w-3.5 h-3.5" />
                    <span>Live Session</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveRoomId(room.id)}
                  className="relative z-10 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-hud tracking-widest text-sm font-bold transition-colors cursor-pointer text-center"
                >
                  JOIN ROOM
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
