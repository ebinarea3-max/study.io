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
  Minus,
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
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { updateRoomSettingsAction } from '../../app/actions/rooms';
import ActiveRoom from './ActiveRoom';

interface StudyRoomsTabProps {
  onBackToDashboard: () => void;
  isActiveTab?: boolean;
}

export default function StudyRoomsTab({ onBackToDashboard, isActiveTab }: StudyRoomsTabProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'my_groups' | 'explorer'>('explorer');

  useEffect(() => {
    setMounted(true);
  }, []);

  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [explorerRooms, setExplorerRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomInitialTab, setActiveRoomInitialTab] = useState<'home' | 'chat' | 'settings'>('home');

  // Search & Filter state for Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');

  // Copy code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Room Settings Modal State (Host only)
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editMaxCapacity, setEditMaxCapacity] = useState(4);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [copiedEditPassword, setCopiedEditPassword] = useState(false);
  const [editRoomError, setEditRoomError] = useState('');
  const [rlsBlocked, setRlsBlocked] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);

  const ROOMS_RLS_SQL = `-- Run this in your Supabase Dashboard -> SQL Editor:
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can update their own study rooms" ON public.study_rooms;
CREATE POLICY "Hosts can update their own study rooms"
  ON public.study_rooms FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);`;

  const handleCopyRlsSql = () => {
    navigator.clipboard.writeText(ROOMS_RLS_SQL);
    setCopiedRlsSql(true);
    toast.success('SQL policy copied to clipboard!');
    setTimeout(() => setCopiedRlsSql(false), 2500);
  };

  // Modal states
  const [roomToDelete, setRoomToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRoomData, setCreateRoomData] = useState({ name: '', password: '', max_capacity: 4 });
  const [isCreating, setIsCreating] = useState(false);

  const [selectedRoomToJoin, setSelectedRoomToJoin] = useState<any | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

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
      const channel = supabase.channel('study_rooms_lobby_hub');
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

    const channel = supabase.channel('study_rooms_lobby_hub');
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

  const handleCopyEditPassword = () => {
    if (!editPassword) return;
    navigator.clipboard.writeText(editPassword);
    setCopiedEditPassword(true);
    toast.success('Room password copied to clipboard!');
    setTimeout(() => setCopiedEditPassword(false), 2000);
  };

  const handleSaveRoomSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !user) return;

    if (!editRoomName.trim()) {
      setEditRoomError('Room name cannot be empty.');
      return;
    }

    const currentMemberCount = editingRoom.room_members?.[0]?.count || 1;
    if (editMaxCapacity < Math.max(2, currentMemberCount)) {
      setEditRoomError(`Max capacity cannot be lower than current members (${currentMemberCount}).`);
      return;
    }

    if (editIsPrivate && !editPassword.trim()) {
      setEditRoomError('Please specify a password for private room, or switch to Public.');
      return;
    }

    setIsUpdatingRoom(true);
    setEditRoomError('');
    setRlsBlocked(false);

    try {
      const willBePrivate = editIsPrivate && editPassword.trim().length > 0;
      const trimmedPass = editPassword.trim();
      const trimmedName = editRoomName.trim();
      const capacity = editMaxCapacity;

      let savedRoom: any = null;

      // 1. Attempt Server Action first
      try {
        const actionRes = await updateRoomSettingsAction({
          roomId: editingRoom.id,
          name: trimmedName,
          password: willBePrivate ? trimmedPass : null,
          is_private: willBePrivate,
          max_capacity: capacity,
        });

        if (actionRes.success && actionRes.room) {
          savedRoom = actionRes.room;
        }
      } catch (actionErr) {
        console.warn('Server action room update note (modal):', actionErr);
      }

      // 2. Client-side update fallback with user auth session
      if (!savedRoom) {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client is not available');
        }

        const { data, error } = await supabase
          .from('study_rooms')
          .update({
            name: trimmedName,
            password: willBePrivate ? trimmedPass : null,
            is_private: willBePrivate,
            max_capacity: capacity,
          })
          .eq('id', editingRoom.id)
          .select();

        if (error) {
          setEditRoomError('Failed to update room: ' + error.message);
          return;
        }

        if (!data || data.length === 0) {
          // Zero rows updated -> PostgreSQL RLS blocked the update!
          console.warn('RLS blocked room update from modal: 0 rows modified.');
          setRlsBlocked(true);
          setEditRoomError('Supabase Row-Level Security policy required: public.study_rooms lacks an UPDATE policy for hosts.');
          return;
        }

        savedRoom = data[0];
      }

      // 3. Propagation and refresh
      broadcastRoomChange();
      await fetchMyGroups();
      await fetchExplorerRooms();
      toast.success('Room settings updated! 🎉');
      setEditingRoom(null);
    } catch (err: any) {
      setEditRoomError(err.message || 'An unexpected error occurred');
    } finally {
      setIsUpdatingRoom(false);
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
      // 0. Verify if user is banned from this room
      const { data: banRecords } = await supabase
        .from('room_messages')
        .select('content, created_at')
        .eq('room_id', roomId)
        .ilike('content', '%[SYSTEM_%')
        .order('created_at', { ascending: true });

      if (banRecords && banRecords.length > 0) {
        let isUserBanned = false;
        for (const record of banRecords) {
          if (record.content.startsWith('[SYSTEM_BAN]:')) {
            try {
              const parsed = JSON.parse(record.content.replace('[SYSTEM_BAN]:', ''));
              if (parsed.userId === user.id) isUserBanned = true;
            } catch {}
          } else if (record.content.startsWith('[SYSTEM_UNBAN]:')) {
            try {
              const parsed = JSON.parse(record.content.replace('[SYSTEM_UNBAN]:', ''));
              if (parsed.userId === user.id) isUserBanned = false;
            } catch {}
          }
        }

        if (isUserBanned) {
          setJoinError('You have been banned from this study room by the host.');
          toast.error('You are banned from this room by the host.');
          setIsJoining(false);
          return;
        }
      }

      // 1. Check if already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        setSelectedRoomToJoin(null);
        setJoinPassword('');
        setActiveRoomId(roomId);
        setIsJoining(false);
        return;
      }

      // 2. Validate Password
      if (passwordAttempt !== null && selectedRoomToJoin) {
        const { data: roomData, error: roomError } = await supabase
          .from('study_rooms')
          .select('password')
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) {
          setJoinError('Could not verify room password.');
          setIsJoining(false);
          return;
        }

        if (roomData.password !== passwordAttempt.trim()) {
          setJoinError('Incorrect password. Please try again.');
          setIsJoining(false);
          return;
        }
      }

      // 3. Enforce Max Capacity
      const { data: capacityData, error: capacityError } = await supabase
        .from('study_rooms')
        .select('max_capacity, room_members(count)')
        .eq('id', roomId)
        .single();

      if (capacityError || !capacityData) {
        setJoinError('Could not verify room capacity.');
        setIsJoining(false);
        return;
      }

      const currentCount = (capacityData.room_members as any)?.[0]?.count || 0;
      if (capacityData.max_capacity && currentCount >= capacityData.max_capacity) {
        setJoinError('This room has reached its maximum capacity.');
        setIsJoining(false);
        return;
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
          setJoinError('Failed to join room: ' + error.message);
        }
      } else {
        setSelectedRoomToJoin(null);
        setJoinPassword('');
        broadcastRoomChange();
        await fetchMyGroups();
        setActiveRoomId(roomId);
      }
    } catch (err: any) {
      setJoinError('Error joining room: ' + err.message);
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
    return (
      <ActiveRoom
        roomId={activeRoomId}
        initialTab={activeRoomInitialTab}
        onBack={() => {
          setActiveRoomId(null);
          setActiveRoomInitialTab('home');
          refreshAll();
        }}
      />
    );
  }

  const filterOptions: { key: 'all' | 'public' | 'private'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: explorerRooms.length },
    { key: 'public', label: 'Public', count: explorerRooms.filter((r) => !r.is_private).length },
    { key: 'private', label: 'Protected', count: explorerRooms.filter((r) => r.is_private).length },
  ];

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative text-slate-200">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-28"
      >
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 -ml-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer active:scale-[0.98]"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Study rooms</h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">Join a room to study alongside others.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => refreshAll()}
              disabled={isLoading}
              className="p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40"
              title="Refresh room list"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-white/80' : ''}`} />
            </button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--tier-accent)] hover:opacity-95 text-slate-950 font-medium text-xs sm:text-sm transition-opacity cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create group</span>
            </motion.button>
          </div>
        </div>

        {/* Search input and neutral segmented filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms…"
              className="w-full pl-10 pr-9 py-2 bg-white/[0.04] border border-white/[0.08] focus:border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08] self-start sm:self-auto">
            {filterOptions.map((opt) => {
              const isActive = filterType === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilterType(opt.key)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
                    isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="rooms-filter-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.1] border border-white/[0.15] shadow-sm"
                      transition={{ type: 'tween', duration: 0.15 }}
                    />
                  )}
                  <span className="relative z-10">
                    {opt.label} {opt.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && filteredExplorerRooms.length === 0 && (
          <div className="flex items-center justify-center py-16 text-white/40 gap-2 text-xs">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing rooms…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredExplorerRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-[#0c0e14]/40 border border-white/[0.08] rounded-2xl">
            <Users className="w-8 h-8 text-white/30 mb-3" />
            <p className="text-sm text-white/60">
              No rooms found. Try another search or create one.
            </p>
          </div>
        )}

        {/* Responsive card grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        {filteredExplorerRooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExplorerRooms.map((room, index) => {
              const isMember = myGroups.some((g) => g.id === room.id) || room.host_id === user?.id;
              const isHost = room.host_id === user?.id;
              const shortCode = room.short_code || room.id.slice(0, 6).toUpperCase();
              const memberCount = room.room_members?.[0]?.count || 1;
              const maxCap = room.max_capacity || 10;
              const occupancyPct = Math.min(100, Math.round((memberCount / maxCap) * 100));

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'tween',
                    duration: 0.25,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  onClick={() => handleJoinClick(room)}
                  className="group relative bg-[#0c0e14]/70 border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer"
                >
                  <div>
                    {/* Top row: Icon tile, title, lock indicator, code chip */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/70 group-hover:text-white shrink-0 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-white/90 group-hover:text-white truncate">
                            {room.name}
                          </h3>
                          {room.is_private && (
                            <span title="Password protected" className="inline-flex">
                              <Lock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(shortCode, room.id, e)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/[0.06] transition-colors"
                            title="Copy room code"
                          >
                            <span>#{shortCode}</span>
                            {copiedCodeId === room.id ? (
                              <Check className="w-3 h-3 text-[var(--tier-accent)]" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                          {isHost && (
                            <span className="text-[10px] text-white/40 border border-white/[0.08] px-1.5 py-0.2 rounded-full">
                              Host
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quiet host settings / leave action */}
                      {isHost ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRoom(room);
                            setEditRoomName(room.name);
                            setEditIsPrivate(room.is_private);
                            setEditPassword(room.password || '');
                            setEditMaxCapacity(room.max_capacity || 4);
                            setEditRoomError('');
                            setRlsBlocked(false);
                          }}
                          className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Room settings"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      ) : isMember ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoomToDelete(room);
                          }}
                          className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Leave room"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>

                    {/* Occupancy "6 of 10" with a thin bar */}
                    <div className="mt-4 mb-4">
                      <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                        <span>Occupancy</span>
                        <span className="font-hud text-xs text-white/80">
                          {room.max_capacity ? `${memberCount} of ${room.max_capacity}` : `${memberCount}`}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/40 rounded-full transition-all duration-300"
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card bottom: status & outline Join button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <User className="w-3.5 h-3.5" />
                      <span>{memberCount === 1 ? '1 active' : `${memberCount} active`}</span>
                    </div>

                    {isMember ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoomId(room.id);
                        }}
                        className="border border-white/20 hover:border-white/40 text-white/90 hover:text-white bg-transparent rounded-full px-3.5 py-1 text-xs font-medium transition-all active:scale-[0.98]"
                      >
                        Enter
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinClick(room);
                        }}
                        className="border border-white/20 hover:border-white/40 text-white/90 hover:text-white bg-transparent rounded-full px-3.5 py-1 text-xs font-medium transition-all active:scale-[0.98]"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

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
          <div className="bg-[#0c0e14] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => { setIsJoinCodeModalOpen(false); setCodeLookupError(''); }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5 text-white/70" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Enter room code</h2>
            <p className="text-xs text-white/50 mb-5 leading-relaxed">
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
                <label className="block text-xs text-white/50 mb-1.5">
                  Room code
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white font-mono tracking-widest text-base uppercase focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30 placeholder:font-sans placeholder:text-sm"
                  placeholder="e.g. AC9324"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || !joinCodeInput.trim()}
                className="w-full mt-4 bg-[var(--tier-accent)] hover:opacity-95 text-slate-950 font-medium py-2.5 rounded-full transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                {isJoining ? 'Locating…' : 'Join room'}
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
          <div className="bg-[#0c0e14] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white/70" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Create study group</h2>
            <p className="text-xs text-white/50 mb-5">
              Study with others for accountability and shared focus.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Group name
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={createRoomData.name}
                  onChange={(e) => setCreateRoomData({ ...createRoomData, name: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30 text-sm"
                  placeholder="e.g. Deep Work Grind"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-white/40 font-normal">(optional for public)</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={createRoomData.password}
                  onChange={(e) => setCreateRoomData({ ...createRoomData, password: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30 text-sm"
                  placeholder="Leave empty for open public access"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Max capacity
                </label>
                <select
                  value={createRoomData.max_capacity}
                  onChange={(e) =>
                    setCreateRoomData({ ...createRoomData, max_capacity: Number(e.target.value) })
                  }
                  className="w-full bg-[#141724] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/30 transition-colors text-sm"
                >
                  <option value={2}>2 people</option>
                  <option value={4}>4 people</option>
                  <option value={10}>10 people</option>
                  <option value={50}>50 people</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating || !createRoomData.name.trim()}
                className="w-full mt-6 bg-[var(--tier-accent)] hover:opacity-95 text-slate-950 font-medium py-2.5 rounded-full transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isCreating ? 'Creating group…' : 'Create room'}
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
          <div className="bg-[#0c0e14] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedRoomToJoin(null);
                setJoinPassword('');
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-white/70" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Enter password</h2>
            <p className="text-sm text-white/50 mb-6">
              "{selectedRoomToJoin.name}" requires a password to join.
            </p>

            {joinError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-in fade-in slide-in-from-bottom-2">
                {joinError}
              </div>
            )}

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
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/30 transition-colors text-sm"
                placeholder="Room password"
                autoFocus
                required
              />

              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-4 bg-[var(--tier-accent)] hover:opacity-95 text-slate-950 font-medium py-2.5 rounded-full transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isJoining ? 'Verifying…' : 'Unlock & join'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Standalone Join Error Modal */}
      {mounted && typeof document !== 'undefined' && joinError && !selectedRoomToJoin && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setJoinError('');
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0c0e14] border border-red-500/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative flex flex-col items-center text-center">
            <button
              onClick={() => setJoinError('')}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Access denied</h2>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              {joinError}
            </p>
            <button
              onClick={() => setJoinError('')}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-medium py-2.5 rounded-full transition-colors cursor-pointer"
            >
              Dismiss
            </button>
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
          <div className="bg-[#0c0e14] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setRoomToDelete(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white mb-2">
              {roomToDelete.host_id === user?.id ? 'Delete study room?' : 'Leave group?'}
            </h2>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              {roomToDelete.host_id === user?.id
                ? `Are you sure you want to delete "${roomToDelete.name}"? This action cannot be undone and all members will be disconnected.`
                : `Are you sure you want to leave "${roomToDelete.name}"? You can rejoin anytime from the explorer.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full font-medium text-xs text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-full font-medium text-xs text-red-400 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Room Settings Modal (Host Only) */}
      {mounted && typeof document !== 'undefined' && editingRoom && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingRoom) {
              setEditingRoom(null);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="bg-[#0c0e14] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingRoom(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
              disabled={isUpdatingRoom}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white leading-tight">Room settings</h2>
                <p className="text-xs text-white/50">
                  Host controls for #{editingRoom.short_code || editingRoom.id.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            {editRoomError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in fade-in flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editRoomError}</span>
              </div>
            )}

            {rlsBlocked && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-300 text-sm">Supabase permission setup required</p>
                    <p className="text-white/70 mt-1 leading-relaxed">
                      PostgreSQL Row-Level Security (RLS) is blocking saves because <code className="text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded font-mono">public.study_rooms</code> has no <code className="text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded font-mono">UPDATE</code> policy for room hosts.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-white/70 overflow-x-auto select-all">
                  <pre>{ROOMS_RLS_SQL}</pre>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyRlsSql}
                    className="px-3 py-1.5 rounded-full bg-[var(--tier-accent)] hover:opacity-95 text-slate-950 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRlsSql ? 'Copied' : 'Copy SQL fix'}</span>
                  </button>
                  <span className="text-[11px] text-white/40">
                    Paste into Supabase Dashboard &rarr; SQL Editor &rarr; Run
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveRoomSettings} className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Room name
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/30 transition-colors text-sm font-medium"
                  placeholder="e.g. Deep Work Grind"
                  required
                />
              </div>

              {/* Security & Password */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-white/40" />
                    <span>Password & privacy</span>
                  </label>
                  <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-full border border-white/[0.08]">
                    {editIsPrivate ? 'Private' : 'Public'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsPrivate(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      !editIsPrivate
                        ? 'bg-white/[0.1] border-white/[0.15] text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:text-white'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsPrivate(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      editIsPrivate
                        ? 'bg-white/[0.1] border-white/[0.15] text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:text-white'
                    }`}
                  >
                    Private (password)
                  </button>
                </div>

                {editIsPrivate ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="relative flex items-center">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        maxLength={30}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Enter room password…"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-4 pr-20 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors text-sm font-mono"
                        required={editIsPrivate}
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title={showEditPassword ? 'Hide password' : 'See password'}
                        >
                          {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={!editPassword.trim()}
                          onClick={handleCopyEditPassword}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-30"
                          title="Copy password"
                        >
                          {copiedEditPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40">
                    Anyone can enter this room without typing a password.
                  </p>
                )}
              </div>

              {/* Room Member Capacity */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-white/40" />
                    <span>Member capacity</span>
                  </label>
                  <span className="text-xs font-hud text-white/80">
                    {editingRoom.room_members?.[0]?.count || 1} / {editMaxCapacity}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <span className="text-xs text-white/60">Capacity</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={editMaxCapacity <= Math.max(2, editingRoom.room_members?.[0]?.count || 1)}
                      onClick={() => setEditMaxCapacity((prev) => Math.max(Math.max(2, editingRoom.room_members?.[0]?.count || 1), prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 border border-white/[0.08] text-white flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="min-w-[40px] text-center font-hud text-white text-base">
                      {editMaxCapacity}
                    </span>

                    <button
                      type="button"
                      disabled={editMaxCapacity >= 100}
                      onClick={() => setEditMaxCapacity((prev) => Math.min(100, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 border border-white/[0.08] text-white flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[4, 8, 12, 25, 50].map((num) => {
                    const currentCount = editingRoom.room_members?.[0]?.count || 1;
                    const isDisabled = num < currentCount;
                    const isSelected = editMaxCapacity === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setEditMaxCapacity(num)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.1] text-white border-white/[0.15]'
                            : isDisabled
                            ? 'opacity-30 bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/50 border-white/[0.06]'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isUpdatingRoom}
                  className="flex-1 py-2.5 px-4 rounded-full bg-[var(--tier-accent)] hover:opacity-95 text-slate-950 font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isUpdatingRoom ? 'Saving…' : 'Save settings'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = editingRoom.id;
                    setEditingRoom(null);
                    setActiveRoomInitialTab('settings');
                    setActiveRoomId(id);
                  }}
                  className="py-2.5 px-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Open full settings inside room"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Open in room</span>
                </button>
              </div>

              {/* Danger Zone: Delete Room */}
              <div className="pt-4 mt-1 border-t border-white/[0.06]">
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                  <div className="flex flex-col pr-2">
                    <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete room
                    </span>
                    <span className="text-[11px] text-white/40 leading-tight mt-0.5">
                      Permanently delete this group and disconnect all scholars
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingRoom}
                    onClick={() => {
                      const room = editingRoom;
                      setEditingRoom(null);
                      setRoomToDelete(room);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    title="Delete this study room"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
