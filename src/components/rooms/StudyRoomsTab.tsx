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
import { updateRoomSettingsAction } from '../../app/actions/rooms';
import ActiveRoom from './ActiveRoom';

function parseHoursMinutes(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return {
    h: String(hours),
    m: String(minutes).padStart(2, '0'),
    hNum: hours,
    mNum: minutes,
  };
}

function formatRoomFocusTime(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const { h, m } = parseHoursMinutes(seconds);
  return `${h}h ${m}m`;
}

interface StudyRoomsTabProps {
  onBackToDashboard: () => void;
  isActiveTab?: boolean;
}

export default function StudyRoomsTab({ onBackToDashboard, isActiveTab }: StudyRoomsTabProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

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
  const [isPrivateCreate, setIsPrivateCreate] = useState(false);
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

  // Initial data fetching
  useEffect(() => {
    refreshAll();
  }, [user?.id, refreshAll]);

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
    if (isPrivateCreate && !createRoomData.password.trim()) {
      alert('Please enter a password for this restricted room.');
      return;
    }
    setIsCreating(true);

    const supabase = getSupabase();
    if (!supabase) {
      setIsCreating(false);
      return;
    }

    const is_private = Boolean(isPrivateCreate && createRoomData.password.trim().length > 0);
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
        setIsPrivateCreate(false);
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

  return (
    <div className="w-full h-full flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-28 scrollbar-thin text-[var(--text)]">
      <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-6 relative">
        {/* ══════════════════════════════════════════════════════════ */}
        {/* PAGE HEADER & CONTROLS (Leaderboard Pattern)               */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)] font-sans">
              Rooms
            </h1>
            <p className="text-sm text-[var(--text-dim)] mt-1 font-mono">
              Your joined and hosted focus rooms
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh icon button */}
            <button
              type="button"
              onClick={() => refreshAll()}
              disabled={isLoading}
              className="p-2 rounded-lg bg-fg/[0.04] hover:bg-fg/[0.08] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh room telemetry"
              aria-label="Refresh room telemetry"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Create Room Button (Plus icon only) */}
            <button
              type="button"
              onClick={() => {
                setIsPrivateCreate(false);
                setCreateRoomData({ name: '', password: '', max_capacity: 4 });
                setIsCreateModalOpen(true);
              }}
              className="p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 shadow-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
              title="Create Room"
              aria-label="Create Room"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-4 text-neutral-400 gap-2 text-xs font-hud-mono uppercase tracking-wider">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span>SYNCING TELEMETRY...</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* EXPLORE ROOMS                                               */}
        {/* ══════════════════════════════════════════════════════════ */}
        {!isLoading && (
          <div className="space-y-4">
            {/* Search & Filter Bar (Tasks Quick Add Style) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all relative z-10">
              <div className="flex-1 flex items-center gap-3 px-1">
                <Search className="w-5 h-5 text-[var(--text-dim)] flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search focus rooms by title or 6-digit access code..."
                  className="w-full bg-transparent text-sm sm:text-base text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none font-sans py-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[var(--text-dim)] hover:text-[var(--text)] p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pl-2 sm:pl-0 sm:border-l sm:border-[var(--border)] pt-2 sm:pt-0 border-t border-[var(--border)] sm:border-t-0">
                {(['all', 'public', 'private'] as const).map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFilterType(ft)}
                    className={`px-2.5 py-1.5 rounded-lg font-hud-mono text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      filterType === ft
                        ? 'shadow-sm'
                        : 'bg-fg/[0.04] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.08]'
                    }`}
                    style={filterType === ft ? { backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' } : undefined}
                  >
                    {ft === 'all'
                      ? `All (${explorerRooms.length})`
                      : ft === 'public'
                      ? `Public (${explorerRooms.filter((r) => !r.is_private).length})`
                      : `Protected (${explorerRooms.filter((r) => r.is_private).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Rooms List */}
            {filteredExplorerRooms.length === 0 ? (
              /* Telemetry Empty State */
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-3">
                <svg
                  className="w-14 h-14 mx-auto text-neutral-600 opacity-60"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <path
                    d="M32 8L52 19.5V42.5L32 54L12 42.5V19.5L32 8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M32 8V31M52 19.5L32 31M12 19.5L32 31M32 31V54"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="font-hud-mono text-xs font-bold text-neutral-400 tracking-widest uppercase">
                  NO MATCHING ROOMS FOUND
                </div>
                <p className="text-xs text-neutral-500 max-w-sm font-mono">
                  {searchQuery
                    ? `No telemetry records match query "${searchQuery}".`
                    : 'No active focus rooms logged for this sector.'}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrivateCreate(false);
                      setCreateRoomData({ name: '', password: '', max_capacity: 4 });
                      setIsCreateModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:brightness-110 text-slate-950 font-hud-mono text-xs font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    CREATE ROOM
                  </button>
                </div>
              </div>
            ) : (
              /* Table Layout */
              <div className="w-full bg-[var(--surface)] border border-[var(--border)] shadow-card rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                {/* Column Headers */}
                <div className="px-4 sm:px-6 py-3 bg-[var(--surface-2)] text-[11px] sm:text-xs text-[var(--text-dim)] font-hud-mono uppercase tracking-wider flex items-center justify-between border-b border-[var(--border)] select-none">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <span className="w-7 text-center">#</span>
                    <span>Room // Host</span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 md:gap-8 shrink-0">
                    <span className="w-16 sm:w-24 text-center sm:text-left">Members</span>
                    <span className="w-16 sm:w-20 text-center">Status</span>
                    <span className="w-20 sm:w-28 text-right hidden md:inline">Focus Time</span>
                    <span className="w-24 sm:w-32 text-right">Action</span>
                  </div>
                </div>

                {/* Rows */}
                {filteredExplorerRooms.map((room, idx) => {
                  const isMember = myGroups.some((g) => g.id === room.id) || room.host_id === user?.id;
                  const isHost = room.host_id === user?.id;
                  const shortCode = room.short_code || room.id.slice(0, 6).toUpperCase();
                  const memberCount = room.room_members?.[0]?.count || 1;
                  const initial = (room.name || 'R').trim().charAt(0).toUpperCase();
                  const formattedTime = formatRoomFocusTime(room.total_focus_time);

                  return (
                    <div
                      key={room.id}
                      onClick={() => handleJoinClick(room)}
                      className={`relative w-full overflow-hidden transition-colors duration-150 flex items-center justify-between px-4 sm:px-6 cursor-pointer border-l-2 min-h-[60px] py-2.5 ${
                        isHost
                          ? 'border-l-amber-400 bg-fg/[0.04] hover:bg-fg/[0.06]'
                          : 'border-l-transparent hover:bg-fg/[0.02]'
                      }`}
                    >
                      {/* Left: Index + Avatar + Title & Meta */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <span className="w-7 text-center font-mono text-xs text-[var(--text-dim)] font-semibold shrink-0">
                          {idx + 1}
                        </span>

                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs text-amber-400 bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-md">
                          {initial}
                        </div>

                        <div className="min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm sm:text-base text-[var(--text)] tracking-tight truncate">
                              {room.name}
                            </span>
                            {room.is_private ? (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-hud-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                <span className="hidden sm:inline">PROTECTED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-hud-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                <Globe className="w-2.5 h-2.5" />
                                <span className="hidden sm:inline">PUBLIC</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-dim)] font-mono">
                            {isHost ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" />
                                YOU (HOST)
                              </span>
                            ) : (
                              <span className="text-[var(--text-dim)] truncate">
                                @{room.host_id ? String(room.host_id).slice(0, 6) : 'host'}
                              </span>
                            )}
                            <span className="text-neutral-600">·</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(shortCode, room.id, e)}
                              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-dim)] hover:text-[var(--text)] bg-fg/[0.04] hover:bg-fg/[0.08] px-1.5 py-0.5 rounded border border-[var(--border)] transition-colors cursor-pointer"
                              title="Copy room code"
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

                      {/* Right Columns: Members, Status, Time, Action */}
                      <div className="flex items-center gap-4 sm:gap-6 md:gap-8 shrink-0">
                        {/* Members */}
                        <div className="w-16 sm:w-24 flex items-center justify-center sm:justify-start gap-1.5 font-mono text-xs sm:text-sm text-[var(--text)]">
                          <Users className="w-3.5 h-3.5 text-neutral-500 hidden sm:inline shrink-0" />
                          <span>{memberCount}</span>
                          <span className="text-neutral-600">/</span>
                          <span className="text-neutral-500">{room.max_capacity || 4}</span>
                        </div>

                        {/* Status */}
                        <div className="w-16 sm:w-20 flex items-center justify-center gap-1.5 font-hud-mono text-[10px] sm:text-xs font-bold tracking-wider">
                          {memberCount > 0 ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-emerald-400">LIVE</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                              <span className="text-neutral-500">IDLE</span>
                            </>
                          )}
                        </div>

                        {/* Focus Time */}
                        <div className="w-20 sm:w-28 text-right hidden md:block font-hud-mono text-xs sm:text-sm text-neutral-200 tabular-nums">
                          {formattedTime ? (
                            <span>{formattedTime}</span>
                          ) : (
                            <span className="text-neutral-600 font-mono">--</span>
                          )}
                        </div>

                        {/* Action */}
                        <div className="w-24 sm:w-32 flex items-center justify-end gap-1.5">
                          {isMember ? (
                            <>
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
                                  }}
                                  className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.08] transition-colors cursor-pointer"
                                  title="Room Settings"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRoomToDelete(room);
                                  }}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Leave Room"
                                >
                                  <LogOut className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRoomId(room.id);
                                }}
                                className="px-3 py-1.5 rounded-lg font-hud-mono text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>OPEN</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinClick(room);
                              }}
                              className="px-3 py-1.5 rounded-lg font-hud-mono text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                            >
                              {room.is_private && <Lock className="w-3 h-3" />}
                              <span>JOIN</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 1: DIRECT JOIN BY CODE                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && isJoinCodeModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsJoinCodeModalOpen(false);
              setCodeLookupError('');
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6 shadow-card relative text-[var(--text)]">
            <button
              type="button"
              onClick={() => { setIsJoinCodeModalOpen(false); setCodeLookupError(''); }}
              className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-fg/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-hud font-bold text-lg text-[var(--text)] uppercase tracking-wider">
                ENTER ROOM CODE
              </h2>
              <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
                Enter the 6-character room code shared by your squad (e.g. AC9324).
              </p>
            </div>

            <div className="h-px w-full bg-[var(--border)] my-4" />

            {codeLookupError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2 font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{codeLookupError}</span>
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                  ACCESS CODE
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] font-mono tracking-widest text-base uppercase focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-[var(--text-dim)] placeholder:font-sans placeholder:text-xs"
                  placeholder="e.g. AC9324"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => { setIsJoinCodeModalOpen(false); setCodeLookupError(''); }}
                  className="px-3.5 py-2 text-xs font-hud-mono font-bold text-[var(--text-dim)] hover:text-[var(--text)] bg-fg/[0.04] border border-[var(--border)] rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="px-5 py-2 text-xs font-hud-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:brightness-110 active:scale-95 uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                  {isJoining ? 'LOCATING...' : 'JOIN ROOM'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 2: CREATE GROUP                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && isCreateModalOpen && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreating) {
              setIsCreateModalOpen(false);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-card relative text-[var(--text)]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-fg/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-hud font-bold text-lg sm:text-xl text-[var(--text)] uppercase tracking-wider">
                CREATE FOCUS ROOM
              </h2>
              <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
                Synchronized focus hall for shared telemetry and accountability.
              </p>
            </div>

            <div className="h-px w-full bg-[var(--border)] my-4" />

            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Room Name */}
              <div className="space-y-1.5">
                <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                  ROOM NAME // DESIGNATION
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={createRoomData.name}
                  onChange={(e) => setCreateRoomData({ ...createRoomData, name: e.target.value })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-sans"
                  placeholder="e.g. Deep Work Chamber"
                  required
                  autoFocus
                />
              </div>

              {/* Access Protocol Toggle */}
              <div className="space-y-1.5">
                <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                  ACCESS PROTOCOL
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrivateCreate(false);
                      setCreateRoomData(prev => ({ ...prev, password: '' }));
                    }}
                    className={`px-3 py-1.5 rounded-lg font-hud-mono text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      !isPrivateCreate
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-fg/[0.04] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.08]'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${!isPrivateCreate ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                    PUBLIC // OPEN
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivateCreate(true)}
                    className={`px-3 py-1.5 rounded-lg font-hud-mono text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isPrivateCreate
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-fg/[0.04] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.08]'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isPrivateCreate ? 'bg-amber-400' : 'bg-neutral-500'}`} />
                    RESTRICTED // PASSWORD
                  </button>
                </div>
              </div>

              {/* Password Input if Private */}
              {isPrivateCreate && (
                <div className="space-y-1.5 pt-0.5">
                  <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                    ACCESS KEY // PASSWORD
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={createRoomData.password}
                    onChange={(e) => setCreateRoomData({ ...createRoomData, password: e.target.value })}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] font-mono placeholder:text-[var(--text-dim)] focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                    placeholder="Enter authorization key..."
                    required={isPrivateCreate}
                    autoFocus
                  />
                </div>
              )}

              {/* Capacity */}
              <div className="space-y-1.5">
                <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                  CAPACITY // SCHOLARS
                </label>
                <select
                  value={createRoomData.max_capacity}
                  onChange={(e) =>
                    setCreateRoomData({ ...createRoomData, max_capacity: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs font-hud-mono uppercase tracking-wider focus:outline-none focus:border-amber-500/50 cursor-pointer"
                >
                  <option value={2} className="bg-[var(--surface)] text-[var(--text)]">2 Scholars // Duo Focus</option>
                  <option value={4} className="bg-[var(--surface)] text-[var(--text)]">4 Scholars // Strike Team</option>
                  <option value={10} className="bg-[var(--surface)] text-[var(--text)]">10 Scholars // Study Squad</option>
                  <option value={50} className="bg-[var(--surface)] text-[var(--text)]">50 Scholars // Open Hall</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-hud-mono font-bold text-[var(--text-dim)] hover:text-[var(--text)] bg-fg/[0.04] border border-[var(--border)] rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createRoomData.name.trim() || (isPrivateCreate && !createRoomData.password.trim())}
                  className="px-5 py-2 text-xs font-hud-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:brightness-110 active:scale-95 uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                  {isCreating ? 'INITIALIZING...' : 'LAUNCH ROOM'} <span className="font-sans text-[10px] opacity-70">⏎</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 3: JOIN PASSWORD (AUTHORIZATION)                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && selectedRoomToJoin && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isJoining) {
              setSelectedRoomToJoin(null);
              setJoinPassword('');
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6 shadow-card relative text-[var(--text)]">
            <button
              type="button"
              onClick={() => {
                setSelectedRoomToJoin(null);
                setJoinPassword('');
              }}
              className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-fg/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-hud font-bold text-lg text-[var(--text)] uppercase tracking-wider">
                AUTHORIZATION REQUIRED
              </h2>
              <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
                "{selectedRoomToJoin.name}" requires an access key to enter.
              </p>
            </div>

            <div className="h-px w-full bg-[var(--border)] my-4" />

            {joinError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold text-center animate-in fade-in">
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
              <div className="space-y-1.5">
                <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                  ROOM PASSWORD
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] font-mono focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                  placeholder="Enter access key..."
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoomToJoin(null);
                    setJoinPassword('');
                  }}
                  className="px-3.5 py-2 text-xs font-hud-mono font-bold text-[var(--text-dim)] hover:text-[var(--text)] bg-fg/[0.04] border border-[var(--border)] rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-5 py-2 text-xs font-hud-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:brightness-110 active:scale-95 uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                  {isJoining ? 'VERIFYING...' : 'UNLOCK & JOIN'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 4: STANDALONE ACCESS ERROR                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && joinError && !selectedRoomToJoin && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setJoinError('');
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-card relative flex flex-col items-center text-center text-[var(--text)]">
            <button
              type="button"
              onClick={() => setJoinError('')}
              className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-fg/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="font-hud font-bold text-lg text-[var(--text)] uppercase tracking-wider mb-1">
              ACCESS DENIED
            </h2>
            <p className="text-xs text-[var(--text-dim)] font-mono mb-6 leading-relaxed">
              {joinError}
            </p>
            <button
              type="button"
              onClick={() => setJoinError('')}
              className="w-full bg-fg/[0.05] hover:bg-fg/[0.1] border border-[var(--border)] text-[var(--text)] font-hud-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 5: DELETE / LEAVE GROUP                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && roomToDelete && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setRoomToDelete(null);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6 shadow-card relative text-[var(--text)]">
            <button
              type="button"
              onClick={() => setRoomToDelete(null)}
              className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-fg/[0.06]"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-hud font-bold text-lg text-[var(--text)] uppercase tracking-wider mb-1">
              {roomToDelete.host_id === user?.id ? 'TERMINATE FOCUS ROOM?' : 'DISCONNECT FROM ROOM?'}
            </h2>
            <p className="text-xs text-[var(--text-dim)] font-mono mb-6 leading-relaxed">
              {roomToDelete.host_id === user?.id
                ? `Are you sure you want to delete "${roomToDelete.name}"? This operation cannot be undone and all active members will be disconnected.`
                : `Are you sure you want to leave "${roomToDelete.name}"? You can rejoin anytime from the explorer.`}
            </p>

            <div className="flex gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg font-hud-mono text-xs font-bold tracking-wider uppercase text-[var(--text-dim)] bg-fg/[0.04] border border-[var(--border)] hover:bg-fg/[0.08] transition-colors disabled:opacity-50 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDeleteRoom}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg font-hud-mono text-xs font-bold tracking-wider uppercase text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'PROCESSING...' : roomToDelete.host_id === user?.id ? 'TERMINATE' : 'LEAVE'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 6: ROOM SETTINGS (HOST ONLY)                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && editingRoom && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingRoom) {
              setEditingRoom(null);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-card relative max-h-[90vh] overflow-y-auto text-[var(--text)]">
            <button
              type="button"
              onClick={() => setEditingRoom(null)}
              className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-fg/[0.06]"
              disabled={isUpdatingRoom}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-hud font-bold text-lg text-[var(--text)] uppercase tracking-wider">
                ROOM SETTINGS // CONTROLS
              </h2>
              <p className="text-xs text-[var(--text-dim)] font-mono mt-1">
                Host management for #{editingRoom.short_code || editingRoom.id.slice(0, 6).toUpperCase()}
              </p>
            </div>

            <div className="h-px w-full bg-[var(--border)] my-4" />

            {editRoomError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold animate-in fade-in flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editRoomError}</span>
              </div>
            )}

            {rlsBlocked && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in font-mono">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300 text-sm">Supabase RLS Policy Required</p>
                    <p className="text-slate-300 mt-1 leading-relaxed text-xs">
                      PostgreSQL Row-Level Security is blocking updates because <code className="text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded">public.study_rooms</code> lacks an <code className="text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded">UPDATE</code> policy.
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--surface-2)] p-3 rounded-lg border border-[var(--border)] text-[11px] text-[var(--text-dim)] overflow-x-auto select-all">
                  <pre>{ROOMS_RLS_SQL}</pre>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyRlsSql}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRlsSql ? 'COPIED TO CLIPBOARD' : 'COPY SQL FIX'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveRoomSettings} className="space-y-4">
              {/* Room Name */}
              <div className="space-y-1.5">
                <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                  ROOM NAME
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-sans"
                  placeholder="e.g. Deep Work Chamber"
                  required
                />
              </div>

              {/* Password & Privacy */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                    PASSWORD & PRIVACY
                  </label>
                  <span className={`text-[10px] font-hud-mono font-bold px-2 py-0.5 rounded-full border ${
                    editIsPrivate
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {editIsPrivate ? 'RESTRICTED' : 'PUBLIC'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsPrivate(false)}
                    className={`py-2 px-3 rounded-lg border font-hud-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      !editIsPrivate
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-fg/[0.04] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'
                    }`}
                  >
                    Public (Open)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsPrivate(true)}
                    className={`py-2 px-3 rounded-lg border font-hud-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      editIsPrivate
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-fg/[0.04] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'
                    }`}
                  >
                    Private (Password)
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
                        placeholder="Enter room password..."
                        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl pl-4 pr-20 py-2.5 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-mono"
                        required={editIsPrivate}
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title={showEditPassword ? 'Hide password' : 'Show password'}
                        >
                          {showEditPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={!editPassword.trim()}
                          onClick={handleCopyEditPassword}
                          className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer disabled:opacity-30"
                          title="Copy password"
                        >
                          {copiedEditPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-dim)] font-mono">
                    Anyone can enter this room without typing a password.
                  </p>
                )}
              </div>

              {/* Room Member Capacity */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-hud-mono text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest block">
                    MEMBER CAPACITY
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {editingRoom.room_members?.[0]?.count || 1} / {editMaxCapacity}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-xs text-[var(--text-dim)] font-mono">Max Scholars</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={editMaxCapacity <= Math.max(2, editingRoom.room_members?.[0]?.count || 1)}
                      onClick={() => setEditMaxCapacity((prev) => Math.max(Math.max(2, editingRoom.room_members?.[0]?.count || 1), prev - 1))}
                      className="w-8 h-8 rounded-lg bg-fg/[0.04] hover:bg-fg/[0.08] disabled:opacity-30 border border-[var(--border)] text-[var(--text)] flex items-center justify-center cursor-pointer font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="min-w-[40px] text-center font-mono font-bold text-[var(--text)] text-base">
                      {editMaxCapacity}
                    </span>

                    <button
                      type="button"
                      disabled={editMaxCapacity >= 100}
                      onClick={() => setEditMaxCapacity((prev) => Math.min(100, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 border border-amber-400 text-slate-950 flex items-center justify-center cursor-pointer font-bold"
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
                        className={`px-2.5 py-1 rounded-lg font-hud-mono text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isDisabled
                            ? 'opacity-30 bg-fg/[0.02] border-[var(--border)] text-[var(--text-faint)] cursor-not-allowed'
                            : 'bg-fg/[0.04] hover:bg-fg/[0.08] text-[var(--text-dim)] border border-[var(--border)]'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="submit"
                  disabled={isUpdatingRoom}
                  className="flex-1 py-2.5 px-4 rounded-lg text-slate-950 font-hud-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                  {isUpdatingRoom ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = editingRoom.id;
                    setEditingRoom(null);
                    setActiveRoomInitialTab('settings');
                    setActiveRoomId(id);
                  }}
                  className="py-2.5 px-4 rounded-lg bg-fg/[0.04] hover:bg-fg/[0.08] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] font-hud-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Open full controls inside room"
                >
                  <span>OPEN IN ROOM</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Danger Zone: Delete Room */}
              <div className="pt-3 mt-1 border-t border-[var(--border)]">
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                  <div className="flex flex-col pr-2">
                    <span className="text-xs font-hud-mono font-bold text-red-400 flex items-center gap-1.5 uppercase">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Room
                    </span>
                    <span className="text-[11px] text-[var(--text-dim)] leading-tight mt-0.5 font-mono">
                      Permanently terminate this room and disconnect all scholars.
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
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-hud-mono font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 uppercase"
                    title="Delete this study room"
                  >
                    <span>TERMINATE</span>
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
