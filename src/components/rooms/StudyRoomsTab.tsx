'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import {
  Users,
  Lock,
  Globe,
  ChevronLeft,
  Plus,
  Search,
  User,
  X,
  Trash2,
  LogOut,
  RotateCw,
  Copy,
  Check,
  KeyRound,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import ActiveRoom from './ActiveRoom';

interface StudyRoomsTabProps {
  onBackToDashboard: () => void;
  isActiveTab?: boolean;
}

export default function StudyRoomsTab({ onBackToDashboard, isActiveTab }: StudyRoomsTabProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'my_groups' | 'explorer'>('my_groups');

  useEffect(() => {
    setMounted(true);
  }, []);

  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [explorerRooms, setExplorerRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Search & Filter state for Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');

  // Copy code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modal states
  const [roomToDelete, setRoomToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRoomData, setCreateRoomData] = useState({ name: '', password: '', max_capacity: 4 });
  const [isCreating, setIsCreating] = useState(false);

  const [selectedRoomToJoin, setSelectedRoomToJoin] = useState<any | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Direct Join by Code Modal
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [codeLookupError, setCodeLookupError] = useState('');

  const realtimeChannelRef = useRef<any>(null);

  // Helper to copy room code
  const handleCopyCode = (code: string, roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(roomId);
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2000);
  };

  // Broadcast helper so all devices/tabs update immediately
  const broadcastRoomChange = useCallback(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const channel = supabase.channel('study_rooms_realtime_hub');
      channel.send({
        type: 'broadcast',
        event: 'room_changed',
        payload: { timestamp: Date.now() },
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const fetchMyGroups = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch rooms where user is member
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      let roomIds: string[] = [];
      if (!memberError && memberData) {
        roomIds = memberData.map((m: any) => m.room_id);
      }

      // Fetch rooms hosted by user
      const { data: hostedRooms, error: hostedError } = await supabase
        .from('study_rooms')
        .select('*, room_members(count)')
        .eq('host_id', user.id);

      if (hostedError) {
        console.warn('Error fetching hosted rooms:', hostedError);
      }

      // Fetch rooms joined by user
      const { data: joinedRooms, error: joinedError } = roomIds.length > 0
        ? await supabase
            .from('study_rooms')
            .select('*, room_members(count)')
            .in('id', roomIds)
        : { data: [], error: null };

      if (joinedError) {
        console.warn('Error fetching joined rooms:', joinedError);
      }

      const combined = [...(hostedRooms || []), ...(joinedRooms || [])];

      // Deduplicate by room id
      const uniqueRooms = Array.from(new Map(combined.map((item: any) => [item.id, item])).values());
      setMyGroups(uniqueRooms);
    } catch (err) {
      console.error('fetchMyGroups error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchExplorerRooms = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch ALL rooms (both public and private) so other accounts and devices can discover and join
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*, room_members(count)')
        .order('created_at', { ascending: false })
        .limit(60);

      if (!error && data) {
        setExplorerRooms(data);
      } else if (error) {
        console.warn('Error fetching explorer rooms:', error);
      }
    } catch (err) {
      console.error('fetchExplorerRooms error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMyGroups(), fetchExplorerRooms()]);
  }, [fetchMyGroups, fetchExplorerRooms]);

  // Initial and view-based data fetching
  useEffect(() => {
    if (view === 'my_groups') {
      fetchMyGroups();
    } else {
      fetchExplorerRooms();
    }
  }, [view, user?.id, fetchMyGroups, fetchExplorerRooms]);

  // Auto-refresh when tab becomes active in SPA
  useEffect(() => {
    if (isActiveTab) {
      refreshAll();
    }
  }, [isActiveTab, refreshAll]);

  // Auto-refresh when window or browser tab gains focus (cross-device/tab synchronization)
  useEffect(() => {
    const handleFocus = () => {
      refreshAll();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshAll]);

  // Supabase Real-Time Subscriptions & Broadcast listener
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel('study_rooms_realtime_hub');
    realtimeChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_rooms' },
        () => {
          refreshAll();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members' },
        () => {
          refreshAll();
        }
      )
      .on('broadcast', { event: 'room_changed' }, () => {
        refreshAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [refreshAll]);

  const confirmDeleteRoom = async () => {
    if (!user || !roomToDelete) return;
    const supabase = getSupabase();
    if (!supabase) return;

    setIsDeleting(true);

    try {
      if (roomToDelete.host_id === user.id) {
        // Explicitly delete members first to avoid cascade constraint blocks
        await supabase.from('room_members').delete().eq('room_id', roomToDelete.id);
        const { error } = await supabase.from('study_rooms').delete().eq('id', roomToDelete.id);
        if (error) {
          console.error('Failed to delete room:', error);
          alert('Failed to delete room: ' + error.message);
        } else {
          setMyGroups((prev) => prev.filter((r) => r.id !== roomToDelete.id));
          setExplorerRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
          setRoomToDelete(null);
          broadcastRoomChange();
        }
      } else {
        const { error } = await supabase
          .from('room_members')
          .delete()
          .match({ room_id: roomToDelete.id, user_id: user.id });
        if (error) {
          console.error('Failed to leave room:', error);
          alert('Failed to leave room: ' + error.message);
        } else {
          setMyGroups((prev) => prev.filter((r) => r.id !== roomToDelete.id));
          setRoomToDelete(null);
          broadcastRoomChange();
        }
      }
    } finally {
      setIsDeleting(false);
      refreshAll();
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !createRoomData.name.trim()) return;
    setIsCreating(true);

    const supabase = getSupabase();
    if (!supabase) {
      setIsCreating(false);
      return;
    }

    const is_private = createRoomData.password.trim().length > 0;
    // Generate an easily sharable 6-character short code for cross-device sharing
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data: newRoom, error } = await supabase
        .from('study_rooms')
        .insert([
          {
            name: createRoomData.name.trim(),
            host_id: user.id,
            password: is_private ? createRoomData.password.trim() : null,
            is_private,
            max_capacity: createRoomData.max_capacity,
            short_code: generatedCode,
          },
        ])
        .select()
        .single();

      if (error) {
        alert('Failed to create room: ' + error.message);
        setIsCreating(false);
        return;
      }

      if (newRoom) {
        await supabase.from('room_members').insert([
          {
            room_id: newRoom.id,
            user_id: user.id,
          },
        ]);

        broadcastRoomChange();
        await fetchMyGroups();
        await fetchExplorerRooms();
        setIsCreateModalOpen(false);
        setCreateRoomData({ name: '', password: '', max_capacity: 4 });
        // Automatically enter the newly created room for instant gratification
        setActiveRoomId(newRoom.id);
      }
    } catch (err: any) {
      alert('Error creating group: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinClick = (room: any) => {
    if (!user) return;
    const isMember = myGroups.some((g) => g.id === room.id) || room.host_id === user.id;
    if (isMember) {
      // If already a member or host, directly enter the room
      setActiveRoomId(room.id);
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
    if (!supabase) {
      setIsJoining(false);
      return;
    }

    try {
      if (passwordAttempt !== null && selectedRoomToJoin) {
        // Validate password against room
        const { data: roomData, error: roomError } = await supabase
          .from('study_rooms')
          .select('password')
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) {
          alert('Could not verify room password.');
          setIsJoining(false);
          return;
        }

        if (roomData.password !== passwordAttempt.trim()) {
          alert('Incorrect password. Please try again.');
          setIsJoining(false);
          return;
        }
      }

      const { error } = await supabase.from('room_members').insert([
        {
          room_id: roomId,
          user_id: user.id,
        },
      ]);

      if (error) {
        // If error is duplicate key, the user was already a member
        if (error.code === '23505') {
          setSelectedRoomToJoin(null);
          setJoinPassword('');
          setActiveRoomId(roomId);
        } else {
          alert('Failed to join room: ' + error.message);
        }
      } else {
        setSelectedRoomToJoin(null);
        setJoinPassword('');
        broadcastRoomChange();
        await fetchMyGroups();
        setActiveRoomId(roomId);
      }
    } catch (err: any) {
      alert('Error joining room: ' + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Lookup room by short code or UUID
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code || !user) return;

    setCodeLookupError('');
    const supabase = getSupabase();
    if (!supabase) return;

    setIsJoining(true);

    try {
      // Find by short_code first, then check by ID substring
      let { data: foundRoom, error } = await supabase
        .from('study_rooms')
        .select('*')
        .ilike('short_code', code)
        .maybeSingle();

      if (!foundRoom && code.length >= 6) {
        const { data: foundById } = await supabase
          .from('study_rooms')
          .select('*')
          .ilike('id', `${code.toLowerCase()}%`)
          .maybeSingle();
        foundRoom = foundById;
      }

      if (!foundRoom) {
        setCodeLookupError(`No study room found matching code "${code}". Please check the code.`);
        setIsJoining(false);
        return;
      }

      setIsJoinCodeModalOpen(false);
      setJoinCodeInput('');

      // If already a member or host, enter directly
      const isMember = myGroups.some((g) => g.id === foundRoom.id) || foundRoom.host_id === user.id;
      if (isMember) {
        setActiveRoomId(foundRoom.id);
        return;
      }

      if (foundRoom.is_private) {
        setSelectedRoomToJoin(foundRoom);
        setJoinPassword('');
      } else {
        await joinRoom(foundRoom.id, null);
      }
    } catch (err: any) {
      setCodeLookupError('Search failed: ' + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Filtered explorer rooms based on search query and privacy filter
  const filteredExplorerRooms = explorerRooms.filter((room) => {
    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'public'
        ? !room.is_private
        : room.is_private;

    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    const matchesName = room.name?.toLowerCase().includes(query);
    const matchesCode = room.short_code?.toLowerCase().includes(query);
    return matchesName || matchesCode;
  });

  if (activeRoomId) {
    return <ActiveRoom roomId={activeRoomId} onBack={() => { setActiveRoomId(null); refreshAll(); }} />;
  }

  return (
    <div className="w-full h-full min-h-[85vh] bg-[#07090e] flex flex-col relative text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02] sticky top-0 z-20 backdrop-blur-md">
        {view === 'explorer' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('my_groups'); fetchMyGroups(); }}
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Back to My Groups"
            >
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Study Groups Lobby</h1>
              <p className="text-xs text-slate-400">Discover and join active study halls</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">My Groups</h1>
            <p className="text-xs text-slate-400">Your joined and hosted focus rooms</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Refresh button with sync animation */}
          <button
            onClick={() => refreshAll()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh room list"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>


          {view === 'my_groups' && (
            <button
              onClick={() => { setView('explorer'); fetchExplorerRooms(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore All</span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {view === 'explorer' && (
          <div className="space-y-3 mb-2">
            {/* Create Room Banner & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms by name or 6-digit code..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 pt-1 text-xs font-semibold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Filter:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                All ({explorerRooms.length})
              </button>
              <button
                onClick={() => setFilterType('public')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterType === 'public'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Globe className="w-3 h-3" />
                Public ({explorerRooms.filter((r) => !r.is_private).length})
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterType === 'private'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Lock className="w-3 h-3" />
                Password Protected ({explorerRooms.filter((r) => r.is_private).length})
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-slate-400 gap-2 text-sm">
            <RotateCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Syncing study groups...</span>
          </div>
        )}

        {/* MY GROUPS VIEW */}
        {!isLoading && view === 'my_groups' && (
          <>
            {myGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 text-slate-400 bg-white/[0.02] border border-white/5 rounded-3xl mt-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-amber-400 opacity-80" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No Joined Groups Yet</h3>
                <p className="text-sm text-slate-400 max-w-sm mb-6">
                  You haven't created or joined any study groups yet. Create your own group or browse existing groups.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </button>
                  <button
                    onClick={() => { setView('explorer'); fetchExplorerRooms(); }}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    Explore Groups
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myGroups.map((room) => {
                  const isHost = room.host_id === user?.id;
                  const shortCode = room.short_code || room.id.slice(0, 6).toUpperCase();
                  const memberCount = room.room_members?.[0]?.count || 1;

                  return (
                    <div
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
                          <Users className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors truncate">
                              {room.name}
                            </h3>
                            {room.is_private ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                <Globe className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>{room.max_capacity ? `${memberCount} / ${room.max_capacity}` : `${memberCount} Scholars`}</span>
                            </span>

                            {isHost ? (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Host
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Member
                              </span>
                            )}

                            {/* Sharable Code pill with 1-click copy */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(shortCode, room.id, e)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition-colors"
                              title="Copy Room Code to share with friends"
                            >
                              <span>#{shortCode}</span>
                              {copiedCodeId === room.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoomToDelete(room);
                          }}
                          className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                          title={isHost ? 'Delete Group' : 'Leave Group'}
                        >
                          {isHost ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* EXPLORER / LOBBY VIEW */}
        {!isLoading && view === 'explorer' && (
          <div className="space-y-3">
            {filteredExplorerRooms.length === 0 ? (
              <div className="text-center p-12 text-slate-400 bg-white/[0.02] border border-white/5 rounded-3xl">
                <Users className="w-12 h-12 mb-3 mx-auto opacity-40 text-slate-400" />
                <h3 className="text-base font-bold text-white mb-1">No Study Groups Found</h3>
                <p className="text-sm text-slate-400 mb-6">
                  {searchQuery
                    ? `No rooms matched "${searchQuery}". Try a different keyword or room code.`
                    : 'No groups currently active in this category. Be the first to create one!'}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Create a New Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredExplorerRooms.map((room) => {
                  const isMember = myGroups.some((g) => g.id === room.id) || room.host_id === user?.id;
                  const isHost = room.host_id === user?.id;
                  const shortCode = room.short_code || room.id.slice(0, 6).toUpperCase();
                  const memberCount = room.room_members?.[0]?.count || 1;

                  return (
                    <div
                      key={room.id}
                      onClick={() => handleJoinClick(room)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                            room.is_private
                              ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/30'
                              : 'bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border-indigo-500/30'
                          }`}
                        >
                          <Users
                            className={`w-6 h-6 ${room.is_private ? 'text-amber-400' : 'text-indigo-400'}`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors truncate">
                              {room.name}
                            </h3>
                            {room.is_private ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Protected</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Globe className="w-2.5 h-2.5" />
                                <span>Public</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>{room.max_capacity ? `${memberCount} / ${room.max_capacity}` : `${memberCount} Active`}</span>
                            </span>

                            {/* Sharable Code pill with 1-click copy */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(shortCode, room.id, e)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition-colors"
                              title="Copy Room Code"
                            >
                              <span>#{shortCode}</span>
                              {copiedCodeId === room.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        {isMember ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveRoomId(room.id);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>Enter</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinClick(room);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              room.is_private
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {room.is_private && <Lock className="w-3 h-3" />}
                            <span>Join</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>



      {/* Direct Join by Code Modal */}
      {mounted && typeof document !== 'undefined' && isJoinCodeModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsJoinCodeModalOpen(false);
              setCodeLookupError('');
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => { setIsJoinCodeModalOpen(false); setCodeLookupError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Enter Room Code</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Enter the 6-character room code shared by your friend or host (e.g., AC9324).
            </p>

            {codeLookupError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{codeLookupError}</span>
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-lg uppercase focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-slate-600 placeholder:font-sans placeholder:text-sm"
                  placeholder="e.g. AC9324"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || !joinCodeInput.trim()}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                {isJoining ? 'Locating...' : 'Find & Join Room'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create Group Modal */}
      {mounted && typeof document !== 'undefined' && isCreateModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreating) {
              setIsCreateModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Create Study Group</h2>
            <p className="text-xs text-slate-400 mb-5">
              Host a synchronized focus hall for accountability and shared timer telemetry.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Group Name
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={createRoomData.name}
                  onChange={(e) => setCreateRoomData({ ...createRoomData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-slate-600 text-sm"
                  placeholder="e.g., Deep Work Grind"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-slate-500 font-normal lowercase">(optional for public)</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={createRoomData.password}
                  onChange={(e) => setCreateRoomData({ ...createRoomData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-slate-600 text-sm"
                  placeholder="Leave empty for open public access"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Max Capacity
                </label>
                <select
                  value={createRoomData.max_capacity}
                  onChange={(e) =>
                    setCreateRoomData({ ...createRoomData, max_capacity: Number(e.target.value) })
                  }
                  className="w-full bg-[#141724] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                >
                  <option value={2}>2 Scholars (Duo Focus)</option>
                  <option value={4}>4 Scholars (Small Squad)</option>
                  <option value={10}>10 Scholars (Study Group)</option>
                  <option value={50}>50 Scholars (Open Hall)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating || !createRoomData.name.trim()}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/25"
              >
                {isCreating ? 'Creating Group...' : 'Launch Room'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Join Password Modal */}
      {mounted && typeof document !== 'undefined' && selectedRoomToJoin && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isJoining) {
              setSelectedRoomToJoin(null);
              setJoinPassword('');
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedRoomToJoin(null);
                setJoinPassword('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Enter Password</h2>
            <p className="text-sm text-slate-400 mb-6">
              "{selectedRoomToJoin.name}" requires a password to join.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinRoom(selectedRoomToJoin.id, joinPassword);
              }}
              className="space-y-4"
            >
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                placeholder="Room Password"
                autoFocus
                required
              />

              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/25"
              >
                {isJoining ? 'Verifying...' : 'Unlock & Join Room'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete / Leave Group Modal */}
      {mounted && typeof document !== 'undefined' && roomToDelete && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setRoomToDelete(null);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setRoomToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">
              {roomToDelete.host_id === user?.id ? 'Delete Study Room?' : 'Leave Group?'}
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              {roomToDelete.host_id === user?.id
                ? `Are you sure you want to delete "${roomToDelete.name}"? This action cannot be undone and all members will be disconnected.`
                : `Are you sure you want to leave "${roomToDelete.name}"? You can rejoin anytime from the explorer.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
