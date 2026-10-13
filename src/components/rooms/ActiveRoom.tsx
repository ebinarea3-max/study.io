import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  Flame,
  Moon,
  User as UserIcon,
  Send,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Check,
  Users,
  Plus,
  Minus,
  Save,
  AlertCircle,
  AlertTriangle,
  Hash,
  Crown,
  Globe,
  Trash2,
  X,
  MessageSquare,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UserAvatar } from '../common/UserAvatar';
import { getSupabase, broadcast } from '../../lib/supabase';
import { updateRoomSettingsAction } from '../../app/actions/rooms';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';

interface ActiveRoomProps {
  roomId: string;
  onBack: () => void;
  initialTab?: 'home' | 'chat' | 'settings';
}

interface RoomDetails {
  id: string;
  name: string;
  host_id: string;
  password?: string | null;
  is_private?: boolean;
  max_capacity?: number;
  short_code?: string;
}

interface RoomMemberInfo {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_host: boolean;
  is_studying: boolean;
  timer_start_at: number | null;
  accumulated_seconds?: number;
  base_today_seconds?: number;
  today_seconds: number;
  session_seconds?: number;
  total_focus_seconds?: number;
  is_online: boolean;
  is_current_user?: boolean;
}

// Formats total seconds to HH:MM:SS with 2-digit zero-padding
export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

export default function ActiveRoom({ roomId, onBack, initialTab }: ActiveRoomProps) {
  const { user } = useAuth();
  const { isRunning, elapsedSeconds, getTodayTotalSeconds } = useStudy();

  const [roomName, setRoomName] = useState<string>('Loading...');
  const [roomTab, setRoomTab] = useState<'home' | 'chat' | 'settings'>(initialTab || 'home');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const roomTabRef = useRef(roomTab);

  // Room details & Host configuration
  const [roomInfo, setRoomInfo] = useState<RoomDetails | null>(null);
  const isHost = Boolean(user?.id && roomInfo?.host_id === user.id);

  // Host Settings Form State
  const [editName, setEditName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editMaxCapacity, setEditMaxCapacity] = useState(4);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [rlsBlocked, setRlsBlocked] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isFormDirtyRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteRoom = async () => {
    if (!user || !isHost || !roomId) return;
    setIsDeletingRoom(true);
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('room_members').delete().eq('room_id', roomId);
        const { error } = await supabase.from('study_rooms').delete().eq('id', roomId);
        if (error) {
          toast.error('Failed to delete room: ' + error.message);
          return;
        }

        try {
          const lobbyChannel = supabase.channel('study_rooms_lobby_hub');
          lobbyChannel.send({
            type: 'broadcast',
            event: 'lobby_update',
            payload: { timestamp: Date.now() },
          });

          const roomChannel = supabase.channel(`room_members_hub_${roomId}`);
          roomChannel.send({
            type: 'broadcast',
            event: 'room_deleted',
            payload: { timestamp: Date.now() },
          });
        } catch {}

        if (broadcast) {
          broadcast.postMessage({ type: 'lobby_update', timestamp: Date.now() });
        }
      }
      toast.success('Study room deleted');
      onBack();
    } catch (err: any) {
      toast.error('Error deleting room: ' + err.message);
    } finally {
      setIsDeletingRoom(false);
      setShowDeleteConfirm(false);
    }
  };

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

  useEffect(() => {
    roomTabRef.current = roomTab;
    if (roomTab === 'chat') {
      setUnreadCount(0);
    }
  }, [roomTab]);

  const [dbMembers, setDbMembers] = useState<RoomMemberInfo[]>([]);
  const [presentUsers, setPresentUsers] = useState<any[]>([]);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Real-time peer-to-peer focus telemetry map
  const [liveFocusMap, setLiveFocusMap] = useState<
    Record<
      string,
      {
        is_studying: boolean;
        session_start_time: number | null;
        base_today_seconds?: number;
        today_seconds: number;
        session_seconds: number;
        last_seen: number;
      }
    >
  >({});

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isTimerRunning = isRunning;

  const profile = useMemo(() => {
    if (!user) return null;
    return {
      username: (user as any).username || user.displayName || 'Scholar',
      avatar_url:
        user.avatarUrl ||
        (user as any).avatar_url ||
        (user as any).user_metadata?.avatar_url ||
        (user as any).user_metadata?.picture ||
        null,
    };
  }, [
    user?.id,
    (user as any)?.username,
    user?.displayName,
    user?.avatarUrl,
    (user as any)?.avatar_url,
    (user as any)?.user_metadata?.avatar_url,
    (user as any)?.user_metadata?.picture,
  ]);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const channelRef = useRef<any>(null);
  const chatChannelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientIdRef = useRef(Math.random().toString(36).substring(2, 7));

  // Refs for frequently changing values to prevent effect re-runs
  const getTodayTotalSecondsRef = useRef(getTodayTotalSeconds);
  const isTimerRunningRef = useRef(isTimerRunning);
  const elapsedSecondsRef = useRef(elapsedSeconds);

  useEffect(() => {
    getTodayTotalSecondsRef.current = getTodayTotalSeconds;
    isTimerRunningRef.current = isTimerRunning;
    elapsedSecondsRef.current = elapsedSeconds;
  }, [getTodayTotalSeconds, isTimerRunning, elapsedSeconds]);

  // Ticker to smoothly update live study timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle incoming focus broadcast from another peer
  const handleFocusUpdate = useCallback(
    (payload: any) => {
      if (!payload || !payload.user_id) return;
      if (payload.user_id === user?.id) return;

      const isStudying = Boolean(payload.is_studying);
      const sessionSeconds = Number(payload.session_seconds || 0);
      const todayTotal = Number(payload.today_seconds || 0);
      const baseToday = payload.base_today_seconds !== undefined
        ? Number(payload.base_today_seconds)
        : Math.max(0, todayTotal - (isStudying ? sessionSeconds : 0));

      setLiveFocusMap((prev) => ({
        ...prev,
        [payload.user_id]: {
          is_studying: isStudying,
          session_start_time:
            payload.session_start_time ?? (isStudying ? Date.now() - (sessionSeconds * 1000) : null),
          base_today_seconds: baseToday,
          today_seconds: todayTotal,
          session_seconds: sessionSeconds,
          last_seen: Date.now(),
        },
      }));
    },
    [user?.id]
  );

  // Broadcast current focus telemetry over room chat and global study hub
  const sendFocusBroadcast = useCallback(() => {
    if (!user?.id) return;
    const isRunning = isTimerRunningRef.current;
    const elapsed = elapsedSecondsRef.current;
    const todayTotal = getTodayTotalSecondsRef.current ? getTodayTotalSecondsRef.current() : 0;
    const baseToday = Math.max(0, todayTotal - (isRunning ? elapsed : 0));
    
    const payload = {
      user_id: user.id,
      is_studying: isRunning,
      session_start_time: isRunning ? Date.now() - (elapsed * 1000) : null,
      session_seconds: elapsed,
      base_today_seconds: baseToday,
      today_seconds: todayTotal,
      timestamp: Date.now(),
    };

    if (chatChannelRef.current) {
      try {
        chatChannelRef.current
          .send({
            type: 'broadcast',
            event: 'focus_status_update',
            payload,
          })
          .catch(() => {});
      } catch (err) {
        // Channel might not be fully joined yet
      }
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const hub = supabase.channel('study_rooms_realtime_hub');
        hub
          .send({
            type: 'broadcast',
            event: 'focus_status_update',
            payload,
          })
          .catch(() => {});
      } catch {}
    }
  }, [user?.id]);

  // Periodic heartbeat broadcast while studying so all peers see live progress
  useEffect(() => {
    sendFocusBroadcast();
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      sendFocusBroadcast();
    }, 3000);

    return () => clearInterval(interval);
  }, [isTimerRunning, sendFocusBroadcast]);

  // On mount, ask other peers for their active focus status
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatChannelRef.current) {
        try {
          chatChannelRef.current
            .send({
              type: 'broadcast',
              event: 'ping_focus_status',
              payload: { requester_id: user?.id },
            })
            .catch(() => {});
        } catch (err) {
          // Channel not fully joined
        }
      }
      const supabase = getSupabase();
      if (supabase) {
        try {
          const hub = supabase.channel('study_rooms_realtime_hub');
          hub
            .send({
              type: 'broadcast',
              event: 'ping_focus_status',
              payload: { requester_id: user?.id },
            })
            .catch(() => {});
        } catch {}
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [user?.id]);

  // Fetch all registered members of this room + their active sessions and total study time today
  const fetchRoomMembers = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId) return;

    try {
      // 1. Fetch room details
      const { data: roomData } = await supabase
        .from('study_rooms')
        .select('id, name, host_id, password, is_private, max_capacity, short_code')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData) {
        setRoomInfo(roomData);
        if (roomData.name) {
          setRoomName(roomData.name);
        }
        if (!isFormDirtyRef.current) {
          setEditName(roomData.name || '');
          setIsPrivate(Boolean(roomData.is_private));
          setEditPassword(roomData.password || '');
          setEditMaxCapacity(roomData.max_capacity || 4);
        }
      }

      // 2. Fetch all registered room members
      const { data: membersData } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId);

      const hostId = roomData?.host_id;
      const allUserIds = Array.from(
        new Set([
          ...(membersData?.map((m: any) => m.user_id) || []),
          ...(hostId ? [hostId] : []),
        ])
      ).filter(Boolean);

      if (allUserIds.length === 0) return;

      // 3. Fetch user profiles for all members
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url')
        .in('id', allUserIds);

      // 4. Fetch active study sessions for all members
      const { data: activeSessionsData } = await supabase
        .from('active_sessions')
        .select('user_id, status, started_at, accumulated_seconds')
        .in('user_id', allUserIds);

      // 5. Fetch study sessions today for all members
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const queryIso = new Date(startOfDay.getTime() - 12 * 3600 * 1000).toISOString();

      const { data: todaySessionsData } = await supabase
        .from('study_sessions')
        .select('user_id, duration_seconds, started_at')
        .in('user_id', allUserIds)
        .gte('started_at', queryIso);

      const userTodayMap = new Map<string, number>();
      (todaySessionsData || []).forEach((s: any) => {
        const time = new Date(s.started_at).getTime();
        if (time >= startOfDay.getTime()) {
          const sec = Number(s.duration_seconds || 0);
          userTodayMap.set(s.user_id, (userTodayMap.get(s.user_id) || 0) + sec);
        }
      });

      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const sessionsMap = new Map((activeSessionsData || []).map((s: any) => [s.user_id, s]));

      const membersList: RoomMemberInfo[] = allUserIds.map((uid) => {
        const prof = profilesMap.get(uid);
        const sess = sessionsMap.get(uid);
        const isHost = uid === hostId;
        const isSessionRunning = sess?.status === 'running';
        const startTime = sess?.started_at ? new Date(sess.started_at).getTime() : null;

        const baseToday = userTodayMap.get(uid) || 0;

        return {
          user_id: uid,
          username:
            prof?.username ||
            prof?.name ||
            (uid === user?.id ? (profileRef.current?.username || 'Scholar') : 'Scholar'),
          avatar_url:
            prof?.avatar_url ||
            (uid === user?.id ? profileRef.current?.avatar_url : null),
          is_host: isHost,
          is_studying: isSessionRunning,
          timer_start_at: startTime,
          accumulated_seconds: Number(sess?.accumulated_seconds || 0),
          base_today_seconds: baseToday,
          today_seconds: baseToday,
          is_online: false,
        };
      });

      setDbMembers(membersList);
    } catch (err) {
      console.error('Error fetching room members:', err);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    fetchRoomMembers();

    // 10-second polling interval to keep active sessions and member changes in sync
    const interval = setInterval(() => {
      fetchRoomMembers();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRoomMembers]);

  // Real-time listener for room member changes and study room updates
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !roomId) return;

    const hubChannel = supabase.channel(`room_members_hub_${roomId}`);
    hubChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => {
          fetchRoomMembers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        () => {
          fetchRoomMembers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions' },
        () => {
          fetchRoomMembers();
        }
      )
      .on('broadcast', { event: 'room_changed' }, () => {
        fetchRoomMembers();
      })
      .on('broadcast', { event: 'focus_status_update' }, (payload) => {
        handleFocusUpdate(payload.payload);
      })
      .on('broadcast', { event: 'ping_focus_status' }, () => {
        if (isTimerRunningRef.current) {
          sendFocusBroadcast();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(hubChannel);
    };
  }, [roomId, fetchRoomMembers, handleFocusUpdate, sendFocusBroadcast]);

  // Realtime Presence Channel
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabase();
    if (!supabase) return;

    isSubscribedRef.current = false;

    const presenceChannel = supabase.channel(`presence_room_${roomId}`, {
      config: { presence: { key: `${user.id}_${clientIdRef.current}` } },
    });
    channelRef.current = presenceChannel;

    const syncPresence = () => {
      if (!channelRef.current) return;
      const state = channelRef.current.presenceState();
      const flat = Object.values(state).flat();
      setPresentUsers(flat);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          try {
            const isRunning = isTimerRunningRef.current;
            const elapsed = elapsedSecondsRef.current;
            const todayTotal = getTodayTotalSeconds ? getTodayTotalSeconds() : 0;
            const baseToday = Math.max(0, todayTotal - (isRunning ? elapsed : 0));

            await presenceChannel.track({
              user_id: user.id,
              client_id: clientIdRef.current,
              username: profileRef.current?.username || user?.email || 'Scholar',
              avatar_url: profileRef.current?.avatar_url || null,
              is_studying: isRunning,
              session_start_time: isRunning ? Date.now() - (elapsed * 1000) : null,
              elapsed_seconds: elapsed,
              base_today_seconds: baseToday,
              today_seconds: todayTotal,
            });
          } catch (err) {
            console.error('Initial presence track error:', err);
          }
        }
      });

    // Switched to Broadcast to bypass RLS streaming blocks
    const chatChannel = supabase.channel(`chat_room_${roomId}`);
    chatChannelRef.current = chatChannel;

    chatChannel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.payload.id)) return prev;
          
          if (roomTabRef.current !== 'chat' && payload.payload.user_id !== user?.id) {
            setUnreadCount((c) => c + 1);
          }

          return [...prev, payload.payload];
        });
      })
      .on('broadcast', { event: 'focus_status_update' }, (payload) => {
        handleFocusUpdate(payload.payload);
      })
      .on('broadcast', { event: 'ping_focus_status' }, () => {
        if (isTimerRunningRef.current) {
          sendFocusBroadcast();
        }
      })
      .subscribe();

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(chatChannel);
      channelRef.current = null;
      chatChannelRef.current = null;
    };
  }, [roomId, user?.id, handleFocusUpdate, sendFocusBroadcast]);

  // Update presence status live when timer starts or stops
  useEffect(() => {
    if (channelRef.current && user?.id && isSubscribedRef.current) {
      try {
        const isRunning = isTimerRunning;
        const elapsed = elapsedSeconds;
        const todayTotal = getTodayTotalSeconds ? getTodayTotalSeconds() : 0;
        const baseToday = Math.max(0, todayTotal - (isRunning ? elapsed : 0));

        channelRef.current.track({
          user_id: user.id,
          client_id: clientIdRef.current,
          username: profile?.username || user?.email || 'Scholar',
          avatar_url: profile?.avatar_url || null,
          is_studying: isRunning,
          session_start_time: isRunning ? Date.now() - (elapsed * 1000) : null,
          elapsed_seconds: elapsed,
          base_today_seconds: baseToday,
          today_seconds: todayTotal,
        });
      } catch (err) {
        console.error('Tracking error:', err);
      }
    }
    sendFocusBroadcast();
  }, [
    isTimerRunning,
    elapsedSeconds,
    user?.id,
    profile?.username,
    profile?.avatar_url,
    getTodayTotalSeconds,
    sendFocusBroadcast,
  ]);

  // Fetch chat messages
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          id, content, created_at, user_id,
          profiles ( username, avatar_url )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) setMessages(data);
    };

    fetchMessages();
  }, [roomId, user]);

  useEffect(() => {
    if (roomTab === 'chat' && messagesEndRef.current) {
      const el = messagesEndRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, roomTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim(),
      })
      .select(`
        id, content, created_at, user_id,
        profiles ( username, avatar_url )
      `)
      .single();

    if (error) {
      console.error(error);
      alert('Failed to send message.');
    } else if (data) {
      setNewMessage('');
      setMessages((prev) => [...prev, data]);

      if (chatChannelRef.current) {
        try {
          chatChannelRef.current
            .send({
              type: 'broadcast',
              event: 'new_message',
              payload: data,
            })
            .catch(console.error);
        } catch (err) {
          console.warn('Failed to broadcast message locally', err);
        }
      }
    }
    setIsSending(false);
  };

  // Merge DB registered members with live Realtime presence & broadcast focus telemetry
  const displayUsers = useMemo(() => {
    const presentMap = new Map<string, any>();
    presentUsers.forEach((pu) => {
      if (pu?.user_id) {
        presentMap.set(pu.user_id, pu);
      }
    });

    const result: any[] = [];
    const seenUserIds = new Set<string>();

    for (const member of dbMembers) {
      seenUserIds.add(member.user_id);
      const isCurrentUser = member.user_id === user?.id;
      const pu = presentMap.get(member.user_id);
      const liveFocus = liveFocusMap[member.user_id];

      let isStudying = false;
      let isOnline = false;
      let sessionSeconds = 0;
      let baseToday = member.base_today_seconds ?? member.today_seconds ?? 0;
      let totalFocusSeconds = baseToday;

      if (isCurrentUser) {
        isStudying = isTimerRunning;
        sessionSeconds = isTimerRunning ? elapsedSeconds : 0;
        isOnline = true;
        totalFocusSeconds = getTodayTotalSeconds ? getTodayTotalSeconds() : sessionSeconds;
        baseToday = Math.max(0, totalFocusSeconds - sessionSeconds);
      } else if (liveFocus && Date.now() - liveFocus.last_seen < 60000) {
        // High-priority peer-to-peer broadcast telemetry
        isOnline = true;
        isStudying = liveFocus.is_studying;
        if (isStudying) {
          const start = liveFocus.session_start_time;
          sessionSeconds = start
            ? Math.max(0, Math.floor((nowTick - start) / 1000))
            : (liveFocus.session_seconds || 0);
          const peerBase = liveFocus.base_today_seconds !== undefined
            ? liveFocus.base_today_seconds
            : Math.max(0, (liveFocus.today_seconds || 0) - (liveFocus.session_seconds || 0));
          baseToday = Math.max(baseToday, peerBase);
          totalFocusSeconds = baseToday + sessionSeconds;
        } else {
          sessionSeconds = 0;
          baseToday = Math.max(baseToday, liveFocus.base_today_seconds ?? liveFocus.today_seconds ?? 0);
          totalFocusSeconds = baseToday;
        }
      } else if (pu) {
        // Realtime presence state
        isOnline = true;
        isStudying = Boolean(pu.is_studying);
        if (isStudying) {
          const startTime = pu.session_start_time ?? member.timer_start_at;
          sessionSeconds = startTime
            ? Math.max(0, Math.floor((nowTick - startTime) / 1000))
            : (pu.elapsed_seconds || 0);
          const peerBase = pu.base_today_seconds !== undefined
            ? pu.base_today_seconds
            : Math.max(0, (pu.today_seconds || 0) - (pu.elapsed_seconds || 0));
          baseToday = Math.max(baseToday, peerBase);
          totalFocusSeconds = baseToday + sessionSeconds;
        } else {
          sessionSeconds = 0;
          baseToday = Math.max(baseToday, pu.base_today_seconds ?? pu.today_seconds ?? 0);
          totalFocusSeconds = baseToday;
        }
      } else {
        // Database active_sessions fallback
        isOnline = false;
        isStudying = member.is_studying;
        if (isStudying && member.timer_start_at) {
          sessionSeconds = Math.max(
            0,
            Math.floor((nowTick - member.timer_start_at) / 1000) + (member.accumulated_seconds || 0)
          );
          totalFocusSeconds = baseToday + sessionSeconds;
        } else {
          sessionSeconds = 0;
          totalFocusSeconds = baseToday;
        }
      }

      result.push({
        ...member,
        username:
          (isCurrentUser ? profile?.username : null) ||
          member.username ||
          pu?.username ||
          'Scholar',
        avatar_url:
          (isCurrentUser ? profile?.avatar_url : null) ||
          member.avatar_url ||
          pu?.avatar_url ||
          null,
        is_studying: isStudying,
        session_seconds: sessionSeconds,
        today_seconds: baseToday,
        total_focus_seconds: totalFocusSeconds,
        is_online: isOnline,
        is_current_user: isCurrentUser,
      });
    }

    // Ensure current user is always included even before dbMembers load
    if (user?.id && !seenUserIds.has(user.id)) {
      const sessionSeconds = isTimerRunning ? elapsedSeconds : 0;
      const totalFocus = getTodayTotalSeconds ? getTodayTotalSeconds() : sessionSeconds;
      const baseToday = Math.max(0, totalFocus - sessionSeconds);
      result.unshift({
        user_id: user.id,
        username: profile?.username || 'Scholar',
        avatar_url: profile?.avatar_url || null,
        is_host: Boolean(user?.id && roomInfo?.host_id === user.id),
        is_studying: isTimerRunning,
        session_seconds: sessionSeconds,
        today_seconds: baseToday,
        total_focus_seconds: totalFocus,
        is_online: true,
        is_current_user: true,
      });
      seenUserIds.add(user.id);
    }

    // Include any active presence users not in dbMembers
    for (const pu of presentUsers) {
      if (pu?.user_id && !seenUserIds.has(pu.user_id)) {
        seenUserIds.add(pu.user_id);
        const isStudying = Boolean(pu.is_studying);
        const startTime = pu.session_start_time;
        const sessionSeconds =
          startTime && isStudying
            ? Math.max(0, Math.floor((nowTick - startTime) / 1000))
            : (pu.elapsed_seconds || 0);
        const baseToday = pu.base_today_seconds !== undefined
          ? pu.base_today_seconds
          : Math.max(0, (pu.today_seconds || 0) - (pu.elapsed_seconds || 0));
        const totalFocus = isStudying ? baseToday + sessionSeconds : baseToday;

        result.push({
          user_id: pu.user_id,
          username: pu.username || 'Scholar',
          avatar_url: pu.avatar_url || null,
          is_host: Boolean(pu.user_id && roomInfo?.host_id === pu.user_id),
          is_studying: isStudying,
          session_seconds: sessionSeconds,
          today_seconds: baseToday,
          total_focus_seconds: totalFocus,
          is_online: true,
          is_current_user: false,
        });
      }
    }

    // Sort group members based on study time: person who studied the most is first, least is last
    result.sort((a, b) => {
      const aTime = a.total_focus_seconds ?? 0;
      const bTime = b.total_focus_seconds ?? 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      if (a.is_studying !== b.is_studying) {
        return a.is_studying ? -1 : 1;
      }
      if (a.is_online !== b.is_online) {
        return a.is_online ? -1 : 1;
      }
      if (a.is_host !== b.is_host) {
        return a.is_host ? -1 : 1;
      }
      return (a.username || '').localeCompare(b.username || '');
    });

    return result;
  }, [
    dbMembers,
    presentUsers,
    liveFocusMap,
    user?.id,
    profile?.username,
    profile?.avatar_url,
    isTimerRunning,
    elapsedSeconds,
    nowTick,
    getTodayTotalSeconds,
    roomInfo?.host_id,
  ]);

  const handleCopyPassword = () => {
    if (!editPassword) return;
    navigator.clipboard.writeText(editPassword);
    setCopiedPassword(true);
    toast.success('Room password copied to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !isHost || !roomId) return;

    if (!editName.trim()) {
      toast.error('Room name cannot be empty');
      return;
    }

    const minCap = Math.max(2, dbMembers.length);
    if (editMaxCapacity < minCap) {
      toast.error(`Capacity cannot be lower than current members (${dbMembers.length})`);
      return;
    }

    if (isPrivate && !editPassword.trim()) {
      toast.error('Please enter a password for private room, or switch to Public');
      return;
    }

    setIsSaving(true);
    setSettingsError('');
    setRlsBlocked(false);

    try {
      const trimmedPass = editPassword.trim();
      const willBePrivate = isPrivate && trimmedPass.length > 0;
      const trimmedName = editName.trim();
      const capacity = editMaxCapacity;

      let savedRoom: any = null;

      // 1. Attempt Server Action first (can bypass RLS with service role if configured)
      try {
        const actionRes = await updateRoomSettingsAction({
          roomId,
          name: trimmedName,
          password: willBePrivate ? trimmedPass : null,
          is_private: willBePrivate,
          max_capacity: capacity,
        });

        if (actionRes.success && actionRes.room) {
          savedRoom = actionRes.room;
        }
      } catch (actionErr) {
        console.warn('Server action room update note:', actionErr);
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
          .eq('id', roomId)
          .select();

        if (error) {
          console.error('Error updating room settings:', error);
          setSettingsError(error.message || 'Failed to update settings');
          toast.error('Failed to update room settings: ' + error.message);
          return;
        }

        if (!data || data.length === 0) {
          // Zero rows updated -> PostgreSQL RLS is blocking the UPDATE!
          console.warn('RLS blocked room update: 0 rows modified.');
          setRlsBlocked(true);
          setSettingsError('Supabase Row-Level Security policy required: public.study_rooms lacks an UPDATE policy for hosts.');
          toast.error('Database permission blocked: RLS UPDATE policy required.');
          return;
        }

        savedRoom = data[0];
      }

      // 3. Update local state and propagate changes
      isFormDirtyRef.current = false;
      setRoomInfo(savedRoom);
      setRoomName(savedRoom.name);
      setEditName(savedRoom.name);
      setIsPrivate(Boolean(savedRoom.is_private));
      setEditPassword(savedRoom.password || '');
      setEditMaxCapacity(savedRoom.max_capacity || capacity);

      // Refresh members and details
      await fetchRoomMembers();

      // Broadcast changes so all other clients in lobby & room refresh
      try {
        const supabase = getSupabase();
        if (supabase) {
          const lobbyChannel = supabase.channel('study_rooms_lobby_hub');
          lobbyChannel.send({
            type: 'broadcast',
            event: 'lobby_update',
            payload: { timestamp: Date.now() },
          });

          const roomChannel = supabase.channel(`room_members_hub_${roomId}`);
          roomChannel.send({
            type: 'broadcast',
            event: 'room_changed',
            payload: { timestamp: Date.now() },
          });
        }
        if (broadcast) {
          broadcast.postMessage({ type: 'lobby_update', timestamp: Date.now() });
          broadcast.postMessage({ type: 'room_changed', roomId, timestamp: Date.now() });
        }
      } catch (err) {
        console.warn('Broadcast room update error:', err);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Room settings updated successfully! 🎉');
    } catch (err: any) {
      console.error('Save room settings exception:', err);
      setSettingsError(err.message || 'An unexpected error occurred');
      toast.error('Error saving settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 bg-[#07090e] flex flex-col relative text-slate-200">
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 mx-2 sm:mx-4 mt-2 sm:mt-3 rounded-2xl bg-[#0b0e14]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onBack}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-hud font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">LEAVE</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-hud font-bold text-white tracking-wide uppercase truncate max-w-[140px] sm:max-w-[260px]">
              {roomName}
            </h1>
            <span className="text-[10px] font-hud-mono text-neutral-400 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-neutral-400" />
              {displayUsers.length} {displayUsers.length === 1 ? 'MEMBER' : 'MEMBERS'}
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl shadow-inner backdrop-blur-md gap-1">
            <button
              onClick={() => setRoomTab('home')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer ${
                roomTab === 'home'
                  ? 'bg-white/[0.1] border border-white/20 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>HOME</span>
            </button>
            <button
              onClick={() => {
                setRoomTab('chat');
                setUnreadCount(0);
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                roomTab === 'chat'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>CHAT</span>
              {unreadCount > 0 && (
                <span className="ml-0.5 bg-amber-500 text-slate-950 text-[10px] font-hud-mono font-bold px-1.5 py-0.2 rounded-full border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-in zoom-in duration-200">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isHost && (
              <button
                onClick={() => setRoomTab('settings')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  roomTab === 'settings'
                    ? 'bg-white/[0.1] border border-white/20 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>SETTINGS</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`flex-1 min-h-0 w-full overflow-x-hidden ${roomTab === 'chat' ? 'p-4 flex flex-col' : 'overflow-y-auto p-4 overscroll-contain scrollbar-thin'}`}>
        {roomTab === 'home' && (
          <div className="flex flex-wrap gap-8 justify-center items-start mt-8">
            {displayUsers.map((u, i) => {
              const isStudying = u.is_studying;
              const sessionSec = u.session_seconds || 0;
              const todaySec = u.today_seconds || 0;
              const totalFocusSec = u.total_focus_seconds ?? (isStudying ? todaySec + sessionSec : todaySec);

              return (
                <div
                  key={u.user_id}
                  className="flex flex-col items-center gap-2 group relative transition-all duration-300"
                >
                  <div className="relative">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.username || 'Scholar'}
                        className={`w-16 h-16 rounded-full object-cover border-2 transition-all duration-300 ${
                          isStudying
                            ? 'border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.55)] scale-105'
                            : u.is_online
                            ? 'border-slate-500 opacity-90'
                            : 'border-slate-700/80 opacity-60'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isStudying
                            ? 'border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.55)] bg-amber-500/10 scale-105'
                            : u.is_online
                            ? 'border-slate-500 bg-slate-800 opacity-90'
                            : 'border-slate-700/80 bg-slate-900 opacity-60'
                        }`}
                      >
                        <UserIcon
                          className={`w-8 h-8 ${isStudying ? 'text-amber-500' : 'text-slate-500'}`}
                        />
                      </div>
                    )}

                    {/* Status Badge (only when resting/offline; fire icon removed when studying) */}
                    {!isStudying && (
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#07090e] shadow-md transition-colors ${
                          u.is_online ? 'bg-slate-700' : 'bg-slate-800'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Member Name, Total Time Studied Today (Adds up live when focusing) */}
                  <div className="text-center mt-1 flex flex-col items-center max-w-[130px]">
                    <div className="flex items-center gap-1.5 justify-center">
                      <p
                        className="text-sm font-bold text-slate-200 truncate max-w-[100px]"
                        title={u.username}
                      >
                        {u.username}
                      </p>
                      {u.is_host && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold uppercase tracking-wider flex-shrink-0">
                          Host
                        </span>
                      )}
                    </div>

                    {/* Displays Total Focus Time Today with live seconds ticking up from today's total */}
                    <p
                      className={`text-sm font-mono mt-1 font-bold tracking-wider transition-colors ${
                        isStudying
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatSeconds(totalFocusSec)}
                    </p>

                    {/* Subtitle explaining state and session progress */}
                    <span
                      className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                        isStudying
                          ? 'text-amber-400/90 font-semibold'
                          : u.is_online
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {isStudying ? (
                        <span>Studying ({formatSeconds(sessionSec)})</span>
                      ) : (
                        <span>Today • {u.is_online ? 'Paused' : 'Offline'}</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            {displayUsers.length === 0 && (
              <div className="text-slate-500 text-center w-full mt-10">
                Waiting for scholars to join...
              </div>
            )}
          </div>
        )}

        {roomTab === 'chat' && (
          <div className="max-w-4xl w-full mx-auto flex-1 min-h-0 flex flex-col bg-[#0b0e14]/90 border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden h-full">
            {/* Angular Targeting Reticle Corner Brackets */}
            <div className="hidden sm:block hud-corner-bracket hud-corner-tl" />
            <div className="hidden sm:block hud-corner-bracket hud-corner-tr" />
            <div className="hidden sm:block hud-corner-bracket hud-corner-bl" />
            <div className="hidden sm:block hud-corner-bracket hud-corner-br" />

            {/* Terminal Header Bar */}
            <div className="px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                <span className="font-hud text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                  ROOM COMMS // {roomName}
                </span>
                <span className="text-[9px] font-hud-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold hidden md:inline shrink-0">
                  LIVE SYNC
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-hud-mono shrink-0">
                {displayUsers.filter(u => u.is_studying).length > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase">
                    <Flame className="w-3 h-3 fill-amber-400" />
                    <span>{displayUsers.filter(u => u.is_studying).length} Focusing</span>
                  </span>
                )}
                <span className="text-neutral-500 hidden sm:inline">•</span>
                <span className="text-neutral-400 text-[11px] font-mono hidden sm:inline">
                  {displayUsers.length} {displayUsers.length === 1 ? 'Scholar' : 'Scholars'}
                </span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div ref={messagesEndRef} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto min-h-[220px]">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
                    <MessageSquare className="w-6 h-6 opacity-80" />
                  </div>
                  <div className="text-sm font-hud font-bold text-white tracking-wide uppercase">
                    ROOM COMMS STANDBY
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xs font-mono">
                    No transmissions logged yet. Connect with fellow scholars or broadcast your study target.
                  </p>
                </div>
              ) : (
                messages.reduce((groups, msg) => {
                  const lastGroup = groups[groups.length - 1];
                  if (lastGroup && lastGroup[0].user_id === msg.user_id) {
                    lastGroup.push(msg);
                  } else {
                    groups.push([msg]);
                  }
                  return groups;
                }, [] as typeof messages[]).map((group: typeof messages) => {
                  const firstMsg = group[0];
                  const lastMsg = group[group.length - 1];
                  const isMe = firstMsg.user_id === user?.id;
                  const senderMember = displayUsers.find(u => u.user_id === firstMsg.user_id);
                  const isStudying = senderMember?.is_studying;
                  const isHostUser = senderMember?.is_host;
                  const timeString = new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const username = firstMsg.profiles?.username || senderMember?.username || 'Scholar';
                  const avatarUrl = firstMsg.profiles?.avatar_url || senderMember?.avatar_url;

                  return (
                    <div
                      key={`group-${firstMsg.id}`}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Meta header: name, host badge, focusing status, timestamp */}
                      <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                        <span className={`text-xs font-hud font-bold tracking-tight ${isMe ? 'text-amber-400' : 'text-slate-200'}`}>
                          {isMe ? 'YOU' : username}
                        </span>
                        {isHostUser && (
                          <span className="text-[9px] font-hud font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                            HOST
                          </span>
                        )}
                        {isStudying && (
                          <span className="text-[9px] font-hud px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 uppercase font-semibold">
                            <Flame className="w-2.5 h-2.5 fill-amber-400" /> FOCUSING
                          </span>
                        )}
                        <span className="text-[10px] font-hud-mono text-neutral-500">
                          {timeString}
                        </span>
                      </div>

                      {/* Avatar and Bubble Row */}
                      <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} items-end max-w-[88%] sm:max-w-[75%]`}>
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <UserAvatar
                            src={avatarUrl}
                            name={username}
                            size={32}
                            className={`rounded-full border transition-all ${
                              isStudying
                                ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                : 'border-white/10'
                            }`}
                          />
                        </div>

                        {/* Bubble Stack */}
                        <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          {group.map((msg: any, idx: number) => {
                            const isFirst = idx === 0;
                            const isLast = idx === group.length - 1;
                            return (
                              <div
                                key={msg.id}
                                className={`px-4 py-2.5 text-sm leading-relaxed transition-all break-words ${
                                  isMe
                                    ? 'bg-gradient-to-br from-amber-500/25 via-amber-500/15 to-amber-600/10 border border-amber-500/35 text-amber-50 shadow-[0_2px_12px_rgba(245,158,11,0.1)]'
                                    : 'bg-white/[0.05] border border-white/[0.1] text-slate-100 shadow-md hover:border-white/20'
                                } ${
                                  isMe
                                    ? `rounded-2xl ${isFirst ? 'rounded-tr-md' : 'rounded-tr-md'} ${isLast ? 'rounded-br-2xl' : 'rounded-br-md'}`
                                    : `rounded-2xl ${isFirst ? 'rounded-tl-md' : 'rounded-tl-md'} ${isLast ? 'rounded-bl-2xl' : 'rounded-bl-md'}`
                                }`}
                              >
                                {msg.content}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Comms Chips */}
            <div className="px-4 sm:px-6 pt-2 pb-1 border-t border-white/[0.05] bg-white/[0.01] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[10px] font-hud-mono uppercase text-neutral-500 tracking-wider hidden sm:inline">
                QUICK TRANSMIT:
              </span>
              {[
                '🔥 Locked in',
                '☕ Taking 5',
                '🎯 Goal crushed',
                '💪 Keep pushing',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setNewMessage(chip)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-amber-500/30 text-[11px] font-medium text-neutral-300 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form Dock */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-[#07090e]/80 border-t border-white/[0.08] backdrop-blur-md shrink-0">
              <div className="bg-black/60 border border-white/10 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl p-1.5 pl-4 flex items-center gap-2 transition-all shadow-inner">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Transmit message to room..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 py-2 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">SEND</span>
                </button>
              </div>
            </form>
          </div>
        )}


        {roomTab === 'settings' && (
          <div className="max-w-2xl mx-auto w-full py-4 sm:py-6 space-y-6 animate-in fade-in duration-200 pb-36">
            {/* Host Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/20 p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-wide">Room Host Controls</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Host Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure room password security, member capacity, and study hall details.
                    </p>
                  </div>
                </div>

                {roomInfo?.short_code && (
                  <button
                    type="button"
                    onClick={() => handleCopyCode(roomInfo.short_code!)}
                    className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group"
                    title="Click to copy room code"
                  >
                    <Hash className="w-3.5 h-3.5 text-amber-400 opacity-80" />
                    <span className="font-bold tracking-wider">{roomInfo.short_code}</span>
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 ml-1" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {settingsError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            {rlsBlocked && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300 text-sm">Supabase Permission Setup Required</p>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      PostgreSQL Row-Level Security (RLS) is blocking saves because <code className="text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded font-mono">public.study_rooms</code> has no <code className="text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded font-mono">UPDATE</code> policy for room hosts.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto select-all">
                  <pre>{ROOMS_RLS_SQL}</pre>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyRlsSql}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRlsSql ? 'Copied to Clipboard!' : 'Copy SQL Fix'}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Paste into Supabase Dashboard &rarr; SQL Editor &rarr; Run, then click Save again.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Room Name */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Room Name
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={editName}
                  onChange={(e) => {
                    isFormDirtyRef.current = true;
                    setEditName(e.target.value);
                  }}
                  placeholder="e.g., Deep Work Grind"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-medium"
                  required
                />
              </div>

              {/* Security & Password */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Password & Room Privacy
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isPrivate
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isPrivate ? 'Protected' : 'Public Access'}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Control whether other scholars need a password to enter this room. As the host, you can view, change, or remove the password at any time.
                </p>

                {/* Privacy Mode Selector */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      isFormDirtyRef.current = true;
                      setIsPrivate(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      !isPrivate
                        ? 'bg-white/10 border-amber-500 text-white shadow-md'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Public (No Password)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      isFormDirtyRef.current = true;
                      setIsPrivate(true);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isPrivate
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-md'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Private (Password)</span>
                  </button>
                </div>

                {/* Password field */}
                {isPrivate ? (
                  <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Current Room Password
                      </label>
                      {editPassword && (
                        <span className="text-[11px] text-slate-400">
                          {showPassword ? 'Password Revealed' : 'Password Masked'}
                        </span>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        maxLength={30}
                        value={editPassword}
                        onChange={(e) => {
                          isFormDirtyRef.current = true;
                          setEditPassword(e.target.value);
                        }}
                        placeholder="Enter room password..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-24 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-mono tracking-wider"
                        required={isPrivate}
                      />

                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title={showPassword ? 'Hide password' : 'See password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={!editPassword.trim()}
                          onClick={handleCopyPassword}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                          title="Copy password to clipboard"
                        >
                          {copiedPassword ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Scholars who enter via the explorer or short code will be asked for this password. Use the eye icon to see it or the copy button to share it.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-slate-400 text-xs flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      This room is currently open for any scholar to join without entering a password.
                    </span>
                  </div>
                )}
              </div>

              {/* Room Capacity */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Room Member Capacity
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {dbMembers.length} / {editMaxCapacity} Members
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Increase or adjust the maximum number of scholars who can be enrolled in this focus group at the same time.
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        dbMembers.length >= editMaxCapacity
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((dbMembers.length / Math.max(1, editMaxCapacity)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{dbMembers.length} currently enrolled</span>
                    <span>
                      {editMaxCapacity - dbMembers.length <= 0
                        ? 'Squad is at max capacity'
                        : `${editMaxCapacity - dbMembers.length} spots remaining`}
                    </span>
                  </div>
                </div>

                {/* Interactive Capacity Stepper */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">Max Member Limit</span>
                    <span className="text-[11px] text-slate-500">Min {Math.max(2, dbMembers.length)} • Max 100</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={editMaxCapacity <= Math.max(2, dbMembers.length)}
                      onClick={() => {
                        isFormDirtyRef.current = true;
                        setEditMaxCapacity((prev) => Math.max(Math.max(2, dbMembers.length), prev - 1));
                      }}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer font-bold text-lg"
                      title="Decrease capacity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="min-w-[70px] text-center">
                      <span className="text-2xl font-mono font-bold text-white">
                        {editMaxCapacity}
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                        Members
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={editMaxCapacity >= 100}
                      onClick={() => {
                        isFormDirtyRef.current = true;
                        setEditMaxCapacity((prev) => Math.min(100, prev + 1));
                      }}
                      className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 border border-amber-400/40 text-slate-950 flex items-center justify-center transition-all cursor-pointer font-bold text-lg shadow-md shadow-amber-500/20"
                      title="Increase capacity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Capacity Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { count: 4, label: '4 (Squad)' },
                      { count: 8, label: '8 (Group)' },
                      { count: 12, label: '12 (Circle)' },
                      { count: 25, label: '25 (Hall)' },
                      { count: 50, label: '50 (Lecture)' },
                    ].map((preset) => {
                      const isSelected = editMaxCapacity === preset.count;
                      const isDisabled = preset.count < dbMembers.length;

                      return (
                        <button
                          key={preset.count}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            isFormDirtyRef.current = true;
                            setEditMaxCapacity(preset.count);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                              : isDisabled
                              ? 'opacity-30 bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving Settings...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Settings Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>Save Room Changes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (roomInfo) {
                      isFormDirtyRef.current = false;
                      setEditName(roomInfo.name || '');
                      setIsPrivate(Boolean(roomInfo.is_private));
                      setEditPassword(roomInfo.password || '');
                      setEditMaxCapacity(roomInfo.max_capacity || 4);
                      toast('Changes reset to current settings', { icon: '🔄' });
                    }
                  }}
                  className="py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 font-bold text-sm transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Danger Zone: Delete Room */}
              <div className="pt-6 border-t border-white/5">
                <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Study Room
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Permanently delete this focus group. All enrolled scholars will be disconnected immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving || isDeletingRoom}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white border border-red-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Room</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {mounted && typeof document !== 'undefined' && showDeleteConfirm && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingRoom) {
              setShowDeleteConfirm(false);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              disabled={isDeletingRoom}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">
              Delete Study Room?
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Are you sure you want to delete &ldquo;{roomName}&rdquo;? This action cannot be undone and all active members will be removed.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingRoom}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={isDeletingRoom}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingRoom ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}