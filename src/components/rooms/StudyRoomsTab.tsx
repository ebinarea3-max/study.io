import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { Users, Lock, ChevronLeft, Plus, Search, User } from 'lucide-react';

export default function StudyRoomsTab({ onBackToDashboard }: { onBackToDashboard: () => void }) {
  const { user } = useAuth();
  const [view, setView] = useState<'my_groups' | 'explorer'>('my_groups');
  
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [explorerRooms, setExplorerRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
  }, [user]);

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
  }, [view, fetchMyGroups, fetchExplorerRooms]);

  return (
    <div className="w-full h-full bg-[#07090e] flex flex-col relative text-slate-200">
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
              <div key={room.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 transition-colors cursor-pointer group">
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
              </div>
            ))
          )
        ) : (
          <>
            <button className="w-full py-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 font-bold transition-all flex items-center justify-center gap-2 mb-4">
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
                  <button className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors">
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
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg shadow-amber-500/20 transition-transform active:scale-95 z-10"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}
