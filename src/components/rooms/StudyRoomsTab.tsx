import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users, Trash2 } from 'lucide-react';
import LiveRoom from './LiveRoom';

interface StudyRoom {
  id: string;
  name: string;
  is_private: boolean;
  created_at: string;
  host_id: string;
  short_code?: string;
  max_capacity?: number;
  password?: string;
}

export default function StudyRoomsTab({ onBackToDashboard }: { onBackToDashboard?: () => void }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [unlockedRooms, setUnlockedRooms] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('unlocked_rooms') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [error, setError] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joiningRoom, setJoiningRoom] = useState<StudyRoom | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');

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
    if (!newRoomName || !newRoomName.trim()) return;
    setError('');

    const supabase = getSupabase();
    if (!supabase) return;

    const { error: insertError } = await supabase
      .from('study_rooms')
      .insert([{ 
        name: newRoomName.trim(), 
        host_id: user.id,
        is_private: isPrivate,
        password: isPrivate ? password : null,
        max_capacity: maxCapacity
      }]);

    if (insertError) {
      console.error('Failed to create room:', insertError);
      setError(insertError.message);
    } else {
      setIsModalOpen(false);
      setNewRoomName('');
      setIsPrivate(false);
      setPassword('');
      setMaxCapacity(4);
      fetchRooms(); // Immediately re-fetch
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    // Delete related messages first, then the room
    await supabase.from('room_messages').delete().eq('room_id', roomId);
    const { error: deleteError } = await supabase.from('study_rooms').delete().eq('id', roomId).eq('host_id', user.id);
    
    if (!deleteError) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  const handleInitiateJoin = (room: StudyRoom) => {
    const isHost = room.host_id === user?.id;
    const hasKey = unlockedRooms.includes(room.id);
    
    if (!room.is_private || isHost || hasKey) {
      setActiveRoomId(room.id);
      return;
    }
    
    setJoiningRoom(room);
    setJoinPassword('');
    setJoinError('');
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const room = rooms.find(r => r.short_code?.toLowerCase() === joinCode.trim().toLowerCase());
    if (room) {
      handleInitiateJoin(room);
      setJoinCode('');
    } else {
      alert('Room not found. Please check the ID and try again.');
    }
  };

  const handleConfirmJoin = () => {
    if (!joiningRoom) return;
    if (joiningRoom.password && joiningRoom.password !== joinPassword) {
      setJoinError('Incorrect password. Please try again.');
      return;
    }
    
    // Add to keychain
    const newUnlocked = [...unlockedRooms, joiningRoom.id];
    setUnlockedRooms(newUnlocked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('unlocked_rooms', JSON.stringify(newUnlocked));
    }
    
    setActiveRoomId(joiningRoom.id);
    setJoiningRoom(null);
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
        <div className="flex flex-col gap-4 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-hud font-black tracking-widest text-white mb-1 uppercase">Active Study Rooms</h2>
              <p className="text-sm text-slate-400">Join a live session or start your own grind.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <form onSubmit={handleJoinByCode} className="relative">
                <input
                  type="text"
                  placeholder="Join by Room ID..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full sm:w-48 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500">
                  <span className="sr-only">Join</span>
                  &rarr;
                </button>
              </form>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-hud font-bold tracking-wider rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <Plus className="w-5 h-5" />
                <span>CREATE ROOM</span>
              </button>
            </div>
          </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-100 font-hud tracking-wide uppercase truncate" title={room.name}>
                      {room.name}
                    </h3>
                    {room.is_private && <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md font-hud tracking-wider">PRIVATE</span>}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 text-xs text-slate-400 font-mono mb-6">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 text-[10px]">ID</span>
                      <span className="text-amber-500/80 font-bold tracking-wider">{room.short_code || '------'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>1 / {room.max_capacity || 4} Users</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleInitiateJoin(room)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-hud tracking-widest text-sm font-bold transition-colors cursor-pointer text-center"
                  >
                    JOIN ROOM
                  </button>
                  {room.host_id === user?.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {isModalOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#07090e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Create Study Room</h3>
            
            {error && <div className="text-red-500 text-sm mb-4 font-mono bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</div>}

            <div className="mb-4">
              <label className="block text-xs font-hud font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Room Name</label>
              <input 
                type="text" 
                placeholder="e.g. Late Night Grind..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />
            </div>
            
            <div className="mb-4 flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
              <div>
                <label className="block text-xs font-hud font-bold text-slate-300 uppercase tracking-wider">Private Room</label>
                <p className="text-[10px] text-slate-500">Require a password to join</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {isPrivate && (
              <div className="mb-4">
                <label className="block text-xs font-hud font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  placeholder="Enter a secure password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-hud font-bold text-slate-400 mb-2 uppercase tracking-wider">Max Capacity</label>
              <div className="flex gap-2">
                {[2, 4, 6, 10].map((cap) => (
                  <button
                    key={cap}
                    onClick={() => setMaxCapacity(cap)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                      maxCapacity === cap 
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' 
                        : 'bg-black/50 text-slate-400 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
              <button 
                onClick={() => { 
                  setIsModalOpen(false); 
                  setNewRoomName(''); 
                  setIsPrivate(false);
                  setPassword('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
                className="px-6 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Launch Room
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {joiningRoom && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#07090e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Private Room</h3>
            <p className="text-sm text-slate-400 mb-4">Enter the password for <span className="text-amber-500 font-bold">{joiningRoom.name}</span></p>
            
            {joinError && <div className="text-red-500 text-xs mb-3 font-mono bg-red-500/10 p-2 rounded-lg border border-red-500/20">{joinError}</div>}

            <input 
              type="password" 
              placeholder="Password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmJoin()}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors mb-6"
              autoFocus
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setJoiningRoom(null); setJoinPassword(''); setJoinError(''); }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmJoin}
                disabled={!joinPassword}
                className="px-6 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
