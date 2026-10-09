import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { Users, Lock, ChevronLeft, Plus, Search, User, X, Trash2, LogOut } from 'lucide-react';
import ActiveRoom from './ActiveRoom';

export default function StudyRoomsTab({ onBackToDashboard }: { onBackToDashboard: () => void }) {
  const { user } = useAuth();
  const [view, setView] = useState<'my_groups' | 'explorer'>('my_groups');
  
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [explorerRooms, setExplorerRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  
  const [roomToDelete, setRoomToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRoomData, setCreateRoomData] = useState({ name: '', password: '', max_capacity: 4 });
  const [isCreating, setIsCreating] = useState(false);

  const [selectedRoomToJoin, setSelectedRoomToJoin] = useState<any | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const fetchMyGroups = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;

    // Fetch rooms where the user is either the host or a member
    // Since room_members might not be created yet in all environments, we'll try to fetch it,
    // and gracefully fallback if it fails.
    const { data: memberData, error: memberError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', user.id);

    let roomIds: string[] = [];
    if (!memberError && memberData) {
      roomIds = memberData.map(m => m.room_id);
    }

    const { data: hostedRooms } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('host_id', user.id);

    const { data: joinedRooms } = roomIds.length > 0 
      ? await supabase.from('study_rooms').select('*').in('id', roomIds)
      : { data: [] };

    const combined = [...(hostedRooms || []), ...(joinedRooms || [])];
    
    // Deduplicate
    const uniqueRooms = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    setMyGroups(uniqueRooms);
    setIsLoading(false);
  }, [user?.id]);

  const fetchExplorerRooms = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setExplorerRooms(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (view === 'my_groups') {
      fetchMyGroups();
    } else {
      fetchExplorerRooms();
    }
  }, [view, user?.id]); // Removed fetchMyGroups and fetchExplorerRooms to prevent infinite loop
  
  const confirmDeleteRoom = async () => {
    if (!user || !roomToDelete) return;
    const supabase = getSupabase();
    if (!supabase) return;
    
    setIsDeleting(true);
    
    if (roomToDelete.host_id === user.id) {
      // Explicitly delete members first in case cascade is not working
      await supabase.from('room_members').delete().eq('room_id', roomToDelete.id);
      const { error } = await supabase.from('study_rooms').delete().eq('id', roomToDelete.id);
      if (error) {
        console.error("Failed to delete room:", error);
        alert("Failed to delete room: " + error.message);
      } else {
        setMyGroups(prev => prev.filter(r => r.id !== roomToDelete.id));
        setRoomToDelete(null);
      }
    } else {
      const { error } = await supabase.from('room_members').delete().match({ room_id: roomToDelete.id, user_id: user.id });
      if (error) {
        console.error("Failed to leave room:", error);
        alert("Failed to leave room: " + error.message);
      } else {
        setMyGroups(prev => prev.filter(r => r.id !== roomToDelete.id));
        setRoomToDelete(null);
      }
    }
    
    setIsDeleting(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !createRoomData.name.trim()) return;
    setIsCreating(true);
    
    const supabase = getSupabase();
    if (!supabase) return;

    const is_private = createRoomData.password.trim().length > 0;
    
    const { data: newRoom, error } = await supabase.from('study_rooms').insert([{
      name: createRoomData.name,
      host_id: user.id,
      password: is_private ? createRoomData.password : null,
      is_private,
      max_capacity: createRoomData.max_capacity
    }]).select().single();

    if (error) {
      alert("Failed to create room: " + error.message);
      setIsCreating(false);
      return;
    }

    if (newRoom) {
      await supabase.from('room_members').insert([{
        room_id: newRoom.id,
        user_id: user.id
      }]);
    }

    setIsCreating(false);
    setIsCreateModalOpen(false);
    setCreateRoomData({ name: '', password: '', max_capacity: 4 });
    setView('my_groups');
  };

  const handleJoinClick = (room: any) => {
    if (!user) return;
    const alreadyJoined = myGroups.some(g => g.id === room.id);
    if (alreadyJoined) {
      setView('my_groups');
      return;
    }

    if (room.is_private) {
      setSelectedRoomToJoin(room);
      setJoinPassword('');
    } else {
      joinRoom(room.id, null);
    }
  };

  const joinRoom = async (roomId: string, passwordAttempt: string | null) => {
    if (!user) return;
    setIsJoining(true);
    const supabase = getSupabase();
    if (!supabase) return;
    
    if (passwordAttempt !== null && selectedRoomToJoin) {
       // Validate password
       const { data: roomData } = await supabase.from('study_rooms').select('password').eq('id', roomId).single();
       if (roomData?.password !== passwordAttempt) {
         alert("Incorrect password");
         setIsJoining(false);
         return;
       }
    }

    const { error } = await supabase.from('room_members').insert([{
      room_id: roomId,
      user_id: user.id
    }]);

    if (error) {
      alert("Failed to join room: " + error.message);
    } else {
      setSelectedRoomToJoin(null);
      setJoinPassword('');
      setView('my_groups');
    }
    setIsJoining(false);
  };

  if (activeRoomId) {
    return <ActiveRoom roomId={activeRoomId} onBack={() => setActiveRoomId(null)} />;
  }

  return (
    <div className="w-full h-full min-h-[80vh] bg-[#07090e] flex flex-col relative text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        {view === 'explorer' ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('my_groups')}
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-wide">Study group</h1>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-white tracking-wide">My groups</h1>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-slate-500">Loading...</div>
        ) : view === 'my_groups' ? (
          myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">You haven't joined any groups yet.</p>
              <p className="text-xs mt-2 opacity-60">Tap the + button below to discover groups.</p>
            </div>
          ) : (
            myGroups.map(room => (
              <div 
                key={room.id} 
                onClick={() => setActiveRoomId(room.id)}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/20">
                    <Users className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors flex items-center gap-2">
                      {room.name}
                      {room.is_private && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> {room.max_capacity ? `0 / ${room.max_capacity}` : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setRoomToDelete(room); }}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  {room.host_id === user?.id ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                </button>
              </div>
            ))
          )
        ) : (
          <>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 font-bold transition-all flex items-center justify-center gap-2 mb-4"
            >
              <Plus className="w-5 h-5" />
              Create Group
            </button>
            
            {explorerRooms.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">No public groups found.</div>
            ) : (
              explorerRooms.map(room => (
                <div key={room.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 flex items-center justify-center border border-indigo-500/20">
                      <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors flex items-center gap-2">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" /> {room.max_capacity ? `0 / ${room.max_capacity}` : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleJoinClick(room); }}
                    className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* FAB (Floating Action Button) for My Groups view */}
      {view === 'my_groups' && (
        <button 
          onClick={() => setView('explorer')}
          className="absolute bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-2xl"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create new group</h2>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Group Name</label>
                <input 
                  type="text" 
                  value={createRoomData.name}
                  onChange={(e) => setCreateRoomData({...createRoomData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="e.g., Late Night Coders"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password (Optional)</label>
                <input 
                  type="text" 
                  value={createRoomData.password}
                  onChange={(e) => setCreateRoomData({...createRoomData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="Leave blank for public"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Capacity</label>
                <select 
                  value={createRoomData.max_capacity}
                  onChange={(e) => setCreateRoomData({...createRoomData, max_capacity: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors appearance-none"
                >
                  <option value={2} className="bg-[#0f111a]">2 Scholars</option>
                  <option value={4} className="bg-[#0f111a]">4 Scholars</option>
                  <option value={10} className="bg-[#0f111a]">10 Scholars</option>
                  <option value={50} className="bg-[#0f111a]">50 Scholars</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isCreating}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Password Modal */}
      {selectedRoomToJoin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button 
              onClick={() => { setSelectedRoomToJoin(null); setJoinPassword(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Enter Password</h2>
            <p className="text-sm text-slate-400 mb-6">This group requires a password to join.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); joinRoom(selectedRoomToJoin.id, joinPassword); }} className="space-y-4">
              <input 
                type="password" 
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                placeholder="Password"
                required
              />

              <button 
                type="submit"
                disabled={isJoining}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join Group'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Leave Group Modal */}
      {roomToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 fade-in duration-200">
            <button 
              onClick={() => setRoomToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">
              {roomToDelete.host_id === user?.id ? 'Delete Group?' : 'Leave Group?'}
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              {roomToDelete.host_id === user?.id 
                ? `Are you sure you want to delete "${roomToDelete.name}"? This action cannot be undone and all members will be removed.` 
                : `Are you sure you want to leave "${roomToDelete.name}"? You will need to rejoin to access it again.`}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setRoomToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteRoom}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
