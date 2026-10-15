import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Flame,
  Home,
  MessageCircle,
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
  Radio,
  Ban,
  ShieldAlert,
  UserX,
  UserCheck,
  MoreVertical,
  ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UserAvatar } from '../common/UserAvatar';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { getSupabase, broadcast } from '../../lib/supabase';
import {
  updateRoomSettingsAction,
  banRoomMemberAction,
  unbanRoomMemberAction,
} from '../../app/actions/rooms';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { RankTierName, RankDivision, getRankFromRp, RANKS, RankTier } from '../../lib/ranks';
import { getLevelFromLifetimeXP } from '../../lib/gamification';

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

export function formatChatDateLabel(isoString: string): string {
  try {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'TODAY';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'YESTERDAY';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  } catch {
    return 'MISSION LOG';
  }
}

export function getMemberTierConfig(u: any): { tierConfig: RankTier; level: number; handle: string; formattedTier: string } {
  const totalSecs = Math.max(0, Number(u.total_focus_seconds || u.today_seconds || 0));
  const hoursStudied = totalSecs / 3600;
  let calculatedTierName = 'Bronze I';
  if (hoursStudied >= 10) calculatedTierName = 'Silver I';
  else if (hoursStudied >= 5) calculatedTierName = 'Bronze III';
  else if (hoursStudied >= 2) calculatedTierName = 'Bronze II';

  let tierConfig: RankTier = getRankFromRp(0);
  try {
    const targetName = u.rank_title || calculatedTierName;
    const found = RANKS.find((r) => r.name.toUpperCase() === String(targetName).toUpperCase());
    if (found) {
      tierConfig = found;
    }
  } catch {
    tierConfig = getRankFromRp(0);
  }

  const level = u.level ?? getLevelFromLifetimeXP(totalSecs * 10);
  const handle = u.username ? u.username.toLowerCase().replace(/\s+/g, '') : 'scholar';
  const formattedTier = tierConfig.name;

  return { tierConfig, level, handle, formattedTier };
}

// In-memory module profile cache to immediately hydrate member avatars and usernames
const memoryProfileCache = new Map<string, { username: string; avatar_url: string | null }>();

export function getCachedMemberProfile(userId: string): { username?: string; avatar_url?: string | null } | undefined {
  if (!userId) return undefined;
  if (memoryProfileCache.has(userId)) {
    return memoryProfileCache.get(userId);
  }
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('study_io_profiles_cache') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[userId]) {
        memoryProfileCache.set(userId, parsed[userId]);
        return parsed[userId];
      }
    }
  } catch {}
  return undefined;
}

export function cacheMemberProfiles(
  profiles: { id: string; username?: string; name?: string; avatar_url?: string | null }[]
) {
  if (!profiles || profiles.length === 0) return;
  try {
    let localObj: Record<string, { username: string; avatar_url: string | null }> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('study_io_profiles_cache');
        if (raw) localObj = JSON.parse(raw);
      } catch {}
    }

    profiles.forEach((p) => {
      if (!p || !p.id) return;
      const cleanAvatar =
        typeof p.avatar_url === 'string' && p.avatar_url.trim().length > 0 ? p.avatar_url.trim() : null;
      const item = {
        username: p.username || p.name || 'Scholar',
        avatar_url: cleanAvatar,
      };
      memoryProfileCache.set(p.id, item);
      localObj[p.id] = item;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('study_io_profiles_cache', JSON.stringify(localObj));
    }
  } catch {}
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

  // Ban management state
  const [bannedMembers, setBannedMembers] = useState<{ userId: string; username: string }[]>([]);
  const [memberToBan, setMemberToBan] = useState<{ userId: string; username: string } | null>(null);
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState<string | null>(null);

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

  // Real-time peer-to-peer focus telemetry map (calibrated to local receiver clock to eliminate drift/skew)
  const [liveFocusMap, setLiveFocusMap] = useState<
    Record<
      string,
      {
        is_studying: boolean;
        received_at: number; // Local timestamp (Date.now()) when update arrived
        base_session_seconds: number; // Session elapsed seconds at received_at
        base_today_seconds: number; // Base today seconds (total minus session)
        today_seconds: number;
        last_seen: number;
      }
    >
  >({});

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuUserId(null);
    };
    if (activeMenuUserId) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuUserId]);

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
  const globalHubRef = useRef<any>(null);
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

  // Keep local profile cache seeded with current user profile
  useEffect(() => {
    if (user?.id) {
      const myAvatar =
        profile?.avatar_url ||
        user?.avatarUrl ||
        (user as any)?.avatar_url ||
        (user as any)?.user_metadata?.avatar_url ||
        (user as any)?.user_metadata?.picture ||
        null;
      const myName = profile?.username || user?.displayName || user?.email?.split('@')[0] || 'Scholar';
      cacheMemberProfiles([{ id: user.id, username: myName, avatar_url: myAvatar }]);
    }
  }, [user?.id, profile?.avatar_url, profile?.username, user?.avatarUrl, user?.displayName, user?.email]);


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
      const sessionSeconds = Math.max(0, Number(payload.session_seconds || 0));
      const todayTotal = Math.max(0, Number(payload.today_seconds || 0));
      const baseToday = payload.base_today_seconds !== undefined
        ? Math.max(0, Number(payload.base_today_seconds))
        : Math.max(0, todayTotal - (isStudying ? sessionSeconds : 0));

      const now = Date.now();

      setLiveFocusMap((prev) => {
        const existing = prev[payload.user_id];
        let effectiveBaseSession = sessionSeconds;

        // Monotonic protection: If peer was and is studying, prevent backwards jumps caused by network latency or drift
        if (isStudying && existing && existing.is_studying) {
          const prevElapsedSinceSync = Math.max(0, Math.floor((now - existing.received_at) / 1000));
          const previouslyTicked = existing.base_session_seconds + prevElapsedSinceSync;
          if (sessionSeconds < previouslyTicked) {
            effectiveBaseSession = previouslyTicked;
          }
        }

        return {
          ...prev,
          [payload.user_id]: {
            is_studying: isStudying,
            received_at: now,
            base_session_seconds: effectiveBaseSession,
            base_today_seconds: baseToday,
            today_seconds: todayTotal,
            last_seen: now,
          },
        };
      });
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
      } catch (err) {}
    }

    if (globalHubRef.current) {
      try {
        globalHubRef.current
          .send({
            type: 'broadcast',
            event: 'focus_status_update',
            payload,
          })
          .catch(() => {});
      } catch (err) {}
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

  // Real-time listener on global study rooms hub to capture focus progress across all tabs
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const globalHub = supabase.channel('study_rooms_realtime_hub');
    globalHubRef.current = globalHub;

    globalHub
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
      supabase.removeChannel(globalHub);
      globalHubRef.current = null;
    };
  }, [handleFocusUpdate, sendFocusBroadcast]);

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
        } catch (err) {}
      }
      if (globalHubRef.current) {
        try {
          globalHubRef.current
            .send({
              type: 'broadcast',
              event: 'ping_focus_status',
              payload: { requester_id: user?.id },
            })
            .catch(() => {});
        } catch (err) {}
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

      if (profilesData && profilesData.length > 0) {
        cacheMemberProfiles(profilesData);
      }

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
        const cached = getCachedMemberProfile(uid);
        const sess = sessionsMap.get(uid);
        const isHost = uid === hostId;
        const isSessionRunning = sess?.status === 'running';
        const startTime = sess?.started_at ? new Date(sess.started_at).getTime() : null;

        const baseToday = userTodayMap.get(uid) || 0;

        const resolvedUsername =
          prof?.username ||
          prof?.name ||
          cached?.username ||
          (uid === user?.id ? (profileRef.current?.username || user?.displayName || 'Scholar') : 'Scholar');

        const resolvedAvatar =
          prof?.avatar_url ||
          cached?.avatar_url ||
          (uid === user?.id ? (profileRef.current?.avatar_url || user?.avatarUrl) : null);

        return {
          user_id: uid,
          username: resolvedUsername,
          avatar_url: resolvedAvatar,
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

      // Seed liveFocusMap with active session members from DB if no fresher telemetry exists
      const nowTs = Date.now();
      setLiveFocusMap((prev) => {
        let updated = { ...prev };
        let hasChanges = false;
        for (const m of membersList) {
          if (m.user_id === user?.id) continue;
          const existing = prev[m.user_id];
          if (!existing || nowTs - existing.last_seen > 15000) {
            if (m.is_studying) {
              hasChanges = true;
              const elapsed = m.timer_start_at
                ? Math.max(0, Math.floor((nowTs - m.timer_start_at) / 1000)) + (m.accumulated_seconds || 0)
                : (m.accumulated_seconds || 0);
              updated[m.user_id] = {
                is_studying: true,
                received_at: nowTs,
                base_session_seconds: elapsed,
                base_today_seconds: m.base_today_seconds || 0,
                today_seconds: (m.base_today_seconds || 0) + elapsed,
                last_seen: nowTs,
              };
            }
          }
        }
        return hasChanges ? updated : prev;
      });

      // 6. Fetch banned scholars for this room
      const { data: banRecords } = await supabase
        .from('room_messages')
        .select('content, created_at')
        .eq('room_id', roomId)
        .ilike('content', '%[SYSTEM_%')
        .order('created_at', { ascending: true });

      const banMap = new Map<string, { userId: string; username: string }>();
      if (banRecords) {
        for (const record of banRecords) {
          if (record.content?.startsWith('[SYSTEM_BAN]:')) {
            try {
              const parsed = JSON.parse(record.content.replace('[SYSTEM_BAN]:', ''));
              banMap.set(parsed.userId, { userId: parsed.userId, username: parsed.username });
            } catch {}
          } else if (record.content?.startsWith('[SYSTEM_UNBAN]:')) {
            try {
              const parsed = JSON.parse(record.content.replace('[SYSTEM_UNBAN]:', ''));
              banMap.delete(parsed.userId);
            } catch {}
          }
        }
      }
      setBannedMembers(Array.from(banMap.values()));

      if (user?.id && banMap.has(user.id)) {
        toast.error('You were banned from this room by the host.');
        onBack();
        return;
      }
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
      .on('broadcast', { event: 'member_banned' }, (payload: any) => {
        const bannedId = payload.payload?.userId;
        const bannedName = payload.payload?.username || 'A scholar';
        if (bannedId === user?.id) {
          toast.error('You were banned from this room by the host.');
          onBack();
        } else {
          fetchRoomMembers();
          fetchMessages();
        }
      })
      .on('broadcast', { event: 'member_unbanned' }, () => {
        fetchRoomMembers();
        fetchMessages();
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

      const now = Date.now();
      setLiveFocusMap((prev) => {
        let updated = { ...prev };
        let hasChanges = false;
        for (const p of flat as any[]) {
          if (!p?.user_id || p.user_id === user?.id) continue;
          const existing = prev[p.user_id];
          if (!existing || now - existing.last_seen > 10000) {
            hasChanges = true;
            const isStudying = Boolean(p.is_studying);
            const elapsed = Math.max(0, Number(p.elapsed_seconds || 0));
            const today = Math.max(0, Number(p.today_seconds || 0));
            const baseToday = p.base_today_seconds !== undefined
              ? Math.max(0, Number(p.base_today_seconds))
              : Math.max(0, today - (isStudying ? elapsed : 0));

            updated[p.user_id] = {
              is_studying: isStudying,
              received_at: now,
              base_session_seconds: elapsed,
              base_today_seconds: baseToday,
              today_seconds: today,
              last_seen: now,
            };
          }
        }
        return hasChanges ? updated : prev;
      });
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

            const myAvatar =
              profileRef.current?.avatar_url ||
              user?.avatarUrl ||
              (user as any)?.avatar_url ||
              (user as any)?.user_metadata?.avatar_url ||
              (user as any)?.user_metadata?.picture ||
              getCachedMemberProfile(user.id)?.avatar_url ||
              null;
            const myUsername =
              profileRef.current?.username ||
              user?.displayName ||
              user?.email?.split('@')[0] ||
              getCachedMemberProfile(user.id)?.username ||
              'Scholar';

            await presenceChannel.track({
              user_id: user.id,
              client_id: clientIdRef.current,
              username: myUsername,
              avatar_url: myAvatar,
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

        const myAvatar =
          profile?.avatar_url ||
          user?.avatarUrl ||
          (user as any)?.avatar_url ||
          (user as any)?.user_metadata?.avatar_url ||
          (user as any)?.user_metadata?.picture ||
          getCachedMemberProfile(user.id)?.avatar_url ||
          null;
        const myUsername =
          profile?.username ||
          user?.displayName ||
          user?.email?.split('@')[0] ||
          getCachedMemberProfile(user.id)?.username ||
          'Scholar';

        channelRef.current.track({
          user_id: user.id,
          client_id: clientIdRef.current,
          username: myUsername,
          avatar_url: myAvatar,
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
  const fetchMessages = useCallback(async () => {
    if (!user || !roomId) return;
    const supabase = getSupabase();
    if (!supabase) return;

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
  }, [roomId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleConfirmBan = async () => {
    if (!memberToBan || !user || !roomId || !isHost) return;
    setIsBanning(true);

    try {
      const targetUserId = memberToBan.userId;
      const targetUsername = memberToBan.username;

      // 1. Server action
      let serverActionSuccess = false;
      try {
        const res = await banRoomMemberAction({
          roomId,
          targetUserId,
          targetUsername,
        });
        if (res && res.success) {
          serverActionSuccess = true;
        }
      } catch (e) {
        console.warn('Server action ban error:', e);
      }

      // 2. Client-side fallback
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from('room_members')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', targetUserId);

        await supabase
          .from('room_presence')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', targetUserId);

        if (!serverActionSuccess) {
          const banPayload = JSON.stringify({
            type: 'ban',
            userId: targetUserId,
            username: targetUsername,
            timestamp: Date.now(),
          });

          await supabase
            .from('room_messages')
            .insert({
              room_id: roomId,
              user_id: user.id,
              content: `[SYSTEM_BAN]:${banPayload}`,
            });
        }

        const roomChannel = supabase.channel(`room_members_hub_${roomId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'member_banned',
          payload: { roomId, userId: targetUserId, username: targetUsername, timestamp: Date.now() },
        });

        const lobbyChannel = supabase.channel('study_rooms_lobby_hub');
        lobbyChannel.send({
          type: 'broadcast',
          event: 'lobby_update',
          payload: { timestamp: Date.now() },
        });
      }

      toast.success(`${targetUsername} was banned from the room.`);
      setMemberToBan(null);
      await fetchRoomMembers();
      await fetchMessages();
    } catch (err: any) {
      toast.error('Failed to ban member: ' + (err.message || 'Unknown error'));
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnban = async (targetUserId: string, targetUsername: string) => {
    if (!user || !roomId || !isHost) return;
    setIsUnbanning(targetUserId);

    try {
      // 1. Server action
      let serverActionSuccess = false;
      try {
        const res = await unbanRoomMemberAction({
          roomId,
          targetUserId,
          targetUsername,
        });
        if (res && res.success) {
          serverActionSuccess = true;
        }
      } catch (e) {
        console.warn('Server action unban error:', e);
      }

      // 2. Client-side fallback
      const supabase = getSupabase();
      if (supabase) {
        if (!serverActionSuccess) {
          const unbanPayload = JSON.stringify({
            type: 'unban',
            userId: targetUserId,
            username: targetUsername,
            timestamp: Date.now(),
          });

          await supabase
            .from('room_messages')
            .insert({
              room_id: roomId,
              user_id: user.id,
              content: `[SYSTEM_UNBAN]:${unbanPayload}`,
            });
        }

        const roomChannel = supabase.channel(`room_members_hub_${roomId}`);
        roomChannel.send({
          type: 'broadcast',
          event: 'member_unbanned',
          payload: { roomId, userId: targetUserId, username: targetUsername, timestamp: Date.now() },
        });
      }

      toast.success(`${targetUsername} was unbanned.`);
      await fetchRoomMembers();
      await fetchMessages();
    } catch (err: any) {
      toast.error('Failed to unban: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUnbanning(null);
    }
  };

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
      } else if (liveFocus && (nowTick - liveFocus.last_seen < 60000 || pu)) {
        // High-priority peer-to-peer broadcast telemetry
        isOnline = Boolean(pu || nowTick - liveFocus.last_seen < 60000);
        isStudying = liveFocus.is_studying;
        baseToday = Math.max(baseToday, liveFocus.base_today_seconds ?? 0);

        if (isStudying) {
          const elapsedSinceSync = Math.max(0, Math.floor((nowTick - liveFocus.received_at) / 1000));
          sessionSeconds = (liveFocus.base_session_seconds || 0) + elapsedSinceSync;
          totalFocusSeconds = baseToday + sessionSeconds;
        } else {
          sessionSeconds = liveFocus.base_session_seconds || 0;
          totalFocusSeconds = Math.max(baseToday, liveFocus.today_seconds || baseToday);
        }
      } else if (pu) {
        // Realtime presence state
        isOnline = true;
        isStudying = Boolean(pu.is_studying);
        const puElapsed = Number(pu.elapsed_seconds || 0);
        const puToday = Number(pu.today_seconds || 0);
        const puBase = pu.base_today_seconds !== undefined
          ? Number(pu.base_today_seconds)
          : Math.max(0, puToday - (isStudying ? puElapsed : 0));
        baseToday = Math.max(baseToday, puBase);

        if (isStudying) {
          sessionSeconds = puElapsed;
          totalFocusSeconds = baseToday + sessionSeconds;
        } else {
          sessionSeconds = 0;
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

      const cached = getCachedMemberProfile(member.user_id);
      result.push({
        ...member,
        username:
          (isCurrentUser ? profile?.username : null) ||
          member.username ||
          cached?.username ||
          pu?.username ||
          'Scholar',
        avatar_url:
          (isCurrentUser ? profile?.avatar_url : null) ||
          member.avatar_url ||
          cached?.avatar_url ||
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
      const cached = getCachedMemberProfile(user.id);
      result.unshift({
        user_id: user.id,
        username: profile?.username || user.displayName || cached?.username || 'Scholar',
        avatar_url: profile?.avatar_url || user.avatarUrl || cached?.avatar_url || null,
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
        const liveFocus = liveFocusMap[pu.user_id];
        let isStudying = Boolean(pu.is_studying);
        let sessionSeconds = Number(pu.elapsed_seconds || 0);
        let baseToday = pu.base_today_seconds !== undefined
          ? Number(pu.base_today_seconds)
          : Math.max(0, Number(pu.today_seconds || 0) - (isStudying ? sessionSeconds : 0));
        let totalFocus = baseToday + (isStudying ? sessionSeconds : 0);

        if (liveFocus) {
          isStudying = liveFocus.is_studying;
          baseToday = Math.max(baseToday, liveFocus.base_today_seconds ?? 0);
          if (isStudying) {
            const elapsedSinceSync = Math.max(0, Math.floor((nowTick - liveFocus.received_at) / 1000));
            sessionSeconds = (liveFocus.base_session_seconds || 0) + elapsedSinceSync;
            totalFocus = baseToday + sessionSeconds;
          } else {
            sessionSeconds = liveFocus.base_session_seconds || 0;
            totalFocus = Math.max(baseToday, liveFocus.today_seconds || baseToday);
          }
        }

        const cached = getCachedMemberProfile(pu.user_id);
        result.push({
          user_id: pu.user_id,
          username: pu.username || cached?.username || 'Scholar',
          avatar_url: pu.avatar_url || cached?.avatar_url || null,
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

    // Sort order: focusing first, then paused, then offline
    result.sort((a, b) => {
      if (a.is_studying !== b.is_studying) {
        return a.is_studying ? -1 : 1;
      }
      if (a.is_online !== b.is_online) {
        return a.is_online ? -1 : 1;
      }
      const aTime = a.total_focus_seconds ?? 0;
      const bTime = b.total_focus_seconds ?? 0;
      if (bTime !== aTime) {
        return bTime - aTime;
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

  // Telemetry metrics derived from active member presence
  const telemetryMetrics = useMemo(() => {
    const focusingNow = displayUsers.filter((u) => u.is_studying).length;
    const totalRoomFocusToday = displayUsers.reduce(
      (acc, u) => acc + (u.total_focus_seconds || u.today_seconds || 0),
      0
    );
    const longestSession = displayUsers.reduce(
      (max, u) => Math.max(max, u.session_seconds || 0),
      0
    );
    const onlineCount = displayUsers.filter((u) => u.is_online).length;
    const totalMembers = displayUsers.length;

    return {
      focusingNow,
      totalRoomFocusToday,
      longestSession,
      onlineCount,
      totalMembers,
    };
  }, [displayUsers]);

  const anyStudying = telemetryMetrics.focusingNow > 0;

  const isFormDirty = useMemo(() => {
    if (!roomInfo) return false;
    const nameChanged = editName.trim() !== (roomInfo.name || '').trim();
    const privacyChanged = isPrivate !== Boolean(roomInfo.is_private);
    const passwordChanged = isPrivate && editPassword.trim() !== (roomInfo.password || '').trim();
    const capacityChanged = editMaxCapacity !== (roomInfo.max_capacity || 4);
    return nameChanged || privacyChanged || passwordChanged || capacityChanged;
  }, [roomInfo, editName, isPrivate, editPassword, editMaxCapacity]);

  useEffect(() => {
    isFormDirtyRef.current = isFormDirty;
  }, [isFormDirty]);

  const handleResetSettings = useCallback(() => {
    if (roomInfo) {
      isFormDirtyRef.current = false;
      setEditName(roomInfo.name || '');
      setIsPrivate(Boolean(roomInfo.is_private));
      setEditPassword(roomInfo.password || '');
      setEditMaxCapacity(roomInfo.max_capacity || 4);
      toast('Changes reset to current settings', { icon: '🔄' });
    }
  }, [roomInfo]);

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

  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const handleChatScroll = useCallback(() => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowJumpToLatest(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setShowJumpToLatest(false);
  }, []);

  useEffect(() => {
    if (roomTab === 'chat') {
      const el = chatScrollContainerRef.current;
      if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 180) {
        scrollToBottom(false);
      }
    }
  }, [messages, roomTab, scrollToBottom]);

  return (
    <div className="w-full h-full flex-1 min-h-0 bg-transparent flex flex-col relative text-slate-200">
      {/* 1. SLIM COMMAND BAR SUB-HEADER */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/[0.08] bg-[#07090e]/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* LEAVE Ghost Button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/[0.04] text-neutral-400 hover:text-white font-hud-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95"
            title="Leave Mission Room"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-400" />
            <span className="hidden sm:inline">LEAVE</span>
          </button>

          <div className="h-4 w-px bg-white/[0.08] hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            {/* Live Status LED */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                anyStudying
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : 'bg-neutral-600'
              }`}
              title={anyStudying ? 'Session Active: Operators Focusing' : 'Station Idle'}
            />

            {/* Room Name in display font */}
            <h1 className="text-xs sm:text-sm font-hud font-bold text-white tracking-wider uppercase truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[220px] md:max-w-xs">
              {roomName}
            </h1>

            {/* Member count as 06 / CAP readout */}
            <span className="text-[10px] font-hud-mono text-neutral-400 bg-white/[0.03] border border-white/[0.07] px-2 py-0.5 rounded-md hidden xs:inline-flex items-center gap-1.5 shrink-0">
              <Users className="w-3 h-3 text-neutral-500" />
              <span>
                {String(displayUsers.length).padStart(2, '0')} / {String(roomInfo?.max_capacity || editMaxCapacity || 20).padStart(2, '0')}
              </span>
            </span>

            {/* Compact copyable #CODE chip */}
            {roomInfo?.short_code && (
              <button
                type="button"
                onClick={() => handleCopyCode(roomInfo.short_code!)}
                className="text-[10px] font-hud-mono text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 px-2 py-0.5 rounded-md hidden sm:inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="Click to copy room short code"
              >
                <span className="text-amber-400 font-bold">#</span>
                <span>{roomInfo.short_code}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-500 ml-0.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: HOME / CHAT / SETTINGS segmented pill in Stats style */}
        <div className="flex items-center shrink-0">
          <div className="inline-flex items-center p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setRoomTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hud-mono uppercase tracking-wider transition-all cursor-pointer ${
                roomTab === 'home'
                  ? 'bg-white/[0.08] text-white border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>HOME</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoomTab('chat');
                setUnreadCount(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hud-mono uppercase tracking-wider transition-all cursor-pointer relative ${
                roomTab === 'chat'
                  ? 'bg-white/[0.08] text-white border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>CHAT</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
              )}
            </button>

            {isHost && (
              <button
                type="button"
                onClick={() => setRoomTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hud-mono uppercase tracking-wider transition-all cursor-pointer ${
                  roomTab === 'settings'
                    ? 'bg-white/[0.08] text-white border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>SETTINGS</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. TAB CONTENT VIEWPORT */}
      <div className={`flex-1 min-h-0 w-full overflow-x-hidden ${roomTab === 'chat' ? 'flex flex-col' : 'overflow-y-auto p-4 sm:p-6 overscroll-contain scrollbar-thin'}`}>
        
        {/* ============================================================== */}
        {/* HOME VIEW: Presence & Operators Control Room                     */}
        {/* ============================================================== */}
        {roomTab === 'home' && (
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {/* Thin ROOM TELEMETRY Strip with 4 Stats cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${anyStudying ? 'bg-amber-400 animate-pulse' : 'bg-neutral-500'}`} />
                  <span className="text-[10px] font-hud-mono font-bold uppercase tracking-widest text-neutral-400">
                    ROOM TELEMETRY // REAL-TIME MONITOR
                  </span>
                </div>
                <div className="text-[10px] font-hud-mono text-neutral-500 tracking-wider">
                  STATUS: {anyStudying ? 'ACTIVE SESSIONS LOGGED' : 'STANDBY'}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {/* Metric 1: FOCUSING NOW */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#0b0e14]/90 border border-white/[0.07] flex flex-col justify-between relative overflow-hidden group">
                  <div className="w-5 h-0.5 bg-amber-500 rounded-full mb-1.5" />
                  <span className="text-[10px] sm:text-xs font-hud-mono tracking-wider uppercase text-neutral-400 font-medium truncate">
                    FOCUSING NOW
                  </span>
                  <div className="text-base sm:text-xl font-mono font-bold text-neutral-100 tabular-nums mt-0.5 truncate flex items-baseline gap-1.5">
                    <span className={telemetryMetrics.focusingNow > 0 ? 'text-amber-400' : 'text-neutral-200'}>
                      {telemetryMetrics.focusingNow}
                    </span>
                    <span className="text-xs text-neutral-500 font-normal">
                      / {telemetryMetrics.totalMembers} OPERATORS
                    </span>
                  </div>
                </div>

                {/* Metric 2: TOTAL ROOM FOCUS TODAY */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#0b0e14]/90 border border-white/[0.07] flex flex-col justify-between relative overflow-hidden group">
                  <div className="w-5 h-0.5 bg-amber-500 rounded-full mb-1.5" />
                  <span className="text-[10px] sm:text-xs font-hud-mono tracking-wider uppercase text-neutral-400 font-medium truncate">
                    TOTAL ROOM FOCUS TODAY
                  </span>
                  <div className="text-base sm:text-xl font-mono font-bold text-neutral-100 tabular-nums mt-0.5 truncate">
                    {formatSeconds(telemetryMetrics.totalRoomFocusToday)}
                  </div>
                </div>

                {/* Metric 3: LONGEST SESSION */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#0b0e14]/90 border border-white/[0.07] flex flex-col justify-between relative overflow-hidden group">
                  <div className="w-5 h-0.5 bg-amber-500 rounded-full mb-1.5" />
                  <span className="text-[10px] sm:text-xs font-hud-mono tracking-wider uppercase text-neutral-400 font-medium truncate">
                    LONGEST SESSION
                  </span>
                  <div className="text-base sm:text-xl font-mono font-bold text-neutral-100 tabular-nums mt-0.5 truncate">
                    {formatSeconds(telemetryMetrics.longestSession)}
                  </div>
                </div>

                {/* Metric 4: MEMBERS ONLINE */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-[#0b0e14]/90 border border-white/[0.07] flex flex-col justify-between relative overflow-hidden group">
                  <div className="w-5 h-0.5 bg-amber-500 rounded-full mb-1.5" />
                  <span className="text-[10px] sm:text-xs font-hud-mono tracking-wider uppercase text-neutral-400 font-medium truncate">
                    MEMBERS ONLINE
                  </span>
                  <div className="text-base sm:text-xl font-mono font-bold text-neutral-100 tabular-nums mt-0.5 truncate flex items-baseline gap-1.5">
                    <span className="text-white">
                      {String(telemetryMetrics.onlineCount).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-neutral-500 font-normal">
                      / {String(telemetryMetrics.totalMembers).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operator Roster Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-hud-mono uppercase tracking-widest text-neutral-400">
                  OPERATOR ROSTER ({displayUsers.length})
                </span>
                <span className="text-[10px] font-hud-mono text-neutral-500 tracking-wider">
                  SORT: FOCUSING → PAUSED → OFFLINE
                </span>
              </div>

              {displayUsers.length === 0 ? (
                /* Stats-style TELEMETRY EMPTY Block */
                <div className="hud-surface border border-white/[0.07] rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 my-8">
                  <svg
                    className="w-14 h-14 mx-auto text-neutral-700 opacity-60"
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
                  <div className="font-hud-mono text-xs font-bold text-neutral-400 tracking-wider">
                    TELEMETRY EMPTY
                  </div>
                  <p className="text-[11px] text-neutral-500 max-w-xs font-mono">
                    Waiting for scholars to join the mission room. Transmit room short code to recruit operators.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-28 md:pb-8">
                  {displayUsers.map((u) => {
                    const isStudying = u.is_studying;
                    const isOnline = u.is_online;
                    const sessionSec = u.session_seconds || 0;
                    const todaySec = u.today_seconds || 0;
                    const totalFocusSec = u.total_focus_seconds ?? (isStudying ? todaySec + sessionSec : todaySec);
                    const { tierConfig, level, handle } = getMemberTierConfig(u);

                    // Circular ring calculations:
                    const radius = 26;
                    const circumference = 2 * Math.PI * radius; // ~163.36
                    const targetSec = isStudying ? 3600 : 7200;
                    const progressRatio = Math.min(1, Math.max(0, (isStudying ? sessionSec : totalFocusSec) / targetSec));
                    const strokeDashoffset = circumference * (1 - progressRatio);

                    return (
                      <motion.div
                        layout
                        key={u.user_id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`rounded-xl bg-[#0b0e14]/90 border p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden group transition-all duration-200 ${
                          isStudying
                            ? 'border-amber-500/40 bg-[#0e1219]/90'
                            : 'border-white/[0.07] hover:border-white/15'
                        } ${u.is_host ? 'border-t-2 border-t-amber-500' : ''}`}
                      >
                        {/* Top Bar: Status Badge + Tier Badge + Host Action */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {/* Status Badge */}
                          {isStudying ? (
                            <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-hud-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>FOCUSING</span>
                            </div>
                          ) : isOnline ? (
                            <div className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 text-neutral-400 font-hud-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                              <span>PAUSED</span>
                            </div>
                          ) : (
                            <div className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/5 text-neutral-600 font-hud-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                              <span>OFFLINE</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            {/* Tier Crest Badge from Leaderboard */}
                            <div title={`${tierConfig.name} Tier`}>
                              <RankCrestBadge
                                tier={tierConfig.tier as RankTierName}
                                division={tierConfig.division as RankDivision}
                                size={26}
                              />
                            </div>

                            {/* Host 3-Dots Action Menu */}
                            {isHost && !u.is_host && !u.is_current_user && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuUserId(activeMenuUserId === u.user_id ? null : u.user_id);
                                  }}
                                  className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                  title="Scholar Actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                                {activeMenuUserId === u.user_id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 w-28 bg-[#0c1017] border border-white/15 rounded-lg shadow-2xl p-1 z-30"
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuUserId(null);
                                        setMemberToBan({ userId: u.user_id, username: u.username });
                                      }}
                                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-rose-400 hover:text-white hover:bg-rose-500/20 text-[10px] font-hud font-bold uppercase tracking-wider transition-colors cursor-pointer text-left"
                                    >
                                      <Ban className="w-3 h-3 text-rose-400" />
                                      <span>BAN</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle: Avatar in Circular Progress Ring + Info */}
                        <div className="flex items-center gap-3.5 my-1">
                          {/* Circular Ring around Avatar */}
                          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                            <svg className="w-16 h-16 -rotate-90 pointer-events-none" viewBox="0 0 60 60">
                              <circle
                                cx="30"
                                cy="30"
                                r={radius}
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="2.5"
                                fill="transparent"
                              />
                              {isStudying && (
                                <circle
                                  cx="30"
                                  cy="30"
                                  r={radius}
                                  stroke="#f59e0b"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  fill="transparent"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  className="animate-pulse transition-all duration-500"
                                />
                              )}
                              {!isStudying && isOnline && progressRatio > 0 && (
                                <circle
                                  cx="30"
                                  cy="30"
                                  r={radius}
                                  stroke="rgba(217, 119, 6, 0.45)"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  fill="transparent"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-500"
                                />
                              )}
                            </svg>

                            <div className="absolute inset-0 flex items-center justify-center">
                              <UserAvatar
                                src={u.avatar_url}
                                name={u.username}
                                size={44}
                                className={`rounded-full transition-all ${
                                  isStudying
                                    ? 'ring-1 ring-amber-500/60'
                                    : isOnline
                                    ? 'opacity-90'
                                    : 'grayscale opacity-50'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Scholar Identification */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-hud font-bold text-sm sm:text-base tracking-wide truncate ${
                                  isOnline ? 'text-white' : 'text-neutral-400'
                                }`}
                                title={u.username}
                              >
                                {u.username}
                              </span>
                              {u.is_host && (
                                <span title="Room Host" className="inline-flex items-center">
                                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 font-mono truncate mt-0.5">
                              @{handle}
                              <span className="text-neutral-500"> · Lv. {level}</span>
                            </div>
                            {u.is_current_user && (
                              <span className="inline-block text-[9px] font-hud-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase mt-1">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Large Mono Timer + Subtitles */}
                        <div className="flex items-baseline justify-between pt-3 border-t border-white/[0.06] mt-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-hud-mono text-neutral-500 uppercase tracking-wider">
                              {isStudying ? 'ACTIVE SESSION' : 'TODAY FOCUS'}
                            </span>
                            <div
                              className={`font-mono text-lg sm:text-xl font-bold tracking-wider tabular-nums ${
                                isStudying
                                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]'
                                  : isOnline
                                  ? 'text-neutral-200'
                                  : 'text-neutral-500'
                              }`}
                            >
                              {formatSeconds(isStudying ? sessionSec : totalFocusSec)}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-hud-mono text-neutral-500 uppercase tracking-wider">
                              {isStudying ? 'TOTAL TODAY' : 'PRESENCE'}
                            </span>
                            <span className="font-mono text-xs text-neutral-400 tabular-nums">
                              {isStudying ? formatSeconds(totalFocusSec) : isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CHAT VIEW: Comms Terminal                                       */}
        {/* ============================================================== */}
        {roomTab === 'chat' && (
          <div className="w-full flex-1 min-h-0 flex flex-col h-full relative">
            {/* Messages Scroll Area */}
            <div
              ref={chatScrollContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6 py-4 scrollbar-thin"
            >
              <div className="max-w-3xl w-full mx-auto space-y-3">
                {(() => {
                  const chatMessages = messages.filter(
                    (msg) => !msg.content?.startsWith('[SYSTEM_')
                  );

                  if (chatMessages.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto min-h-[220px]">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-amber-400">
                          <MessageCircle className="w-5 h-5 opacity-80" />
                        </div>
                        <div className="font-hud-mono font-bold text-xs text-neutral-300 tracking-widest uppercase">
                          COMMS TERMINAL STANDBY
                        </div>
                        <p className="text-[11px] text-neutral-500 max-w-xs font-mono">
                          No transmissions logged yet. Connect with fellow scholars or broadcast your study target.
                        </p>
                      </div>
                    );
                  }

                  const elements: React.ReactNode[] = [];
                  let currentGroup: any[] = [];
                  let lastDateStr = '';

                  const flushGroup = () => {
                    if (currentGroup.length === 0) return;
                    const group = [...currentGroup];
                    currentGroup = [];
                    const firstMsg = group[0];
                    const lastMsg = group[group.length - 1];
                    const isMe = firstMsg.user_id === user?.id;
                    const senderMember = displayUsers.find((u) => u.user_id === firstMsg.user_id);
                    const cachedUser = getCachedMemberProfile(firstMsg.user_id);
                    const isStudying = senderMember?.is_studying;
                    const isHostUser = senderMember?.is_host;
                    const timeString = new Date(lastMsg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const username =
                      firstMsg.profiles?.username || senderMember?.username || cachedUser?.username || 'Scholar';
                    const avatarUrl =
                      firstMsg.profiles?.avatar_url || senderMember?.avatar_url || cachedUser?.avatar_url || null;

                    elements.push(
                      <div
                        key={`group-${firstMsg.id}`}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group max-w-full`}
                      >
                        {/* Meta header: name, host badge, focusing status, timestamp, ban action */}
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                          <span
                            className={`text-xs font-hud font-bold tracking-tight ${
                              isMe ? 'text-amber-400' : 'text-neutral-200'
                            }`}
                          >
                            {isMe ? 'YOU' : username}
                          </span>
                          {isHostUser && (
                            <span className="text-[9px] font-hud-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5 text-amber-400" />
                              <span>HOST</span>
                            </span>
                          )}
                          {isStudying && (
                            <span className="text-[9px] font-hud-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 uppercase font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>FOCUSING</span>
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-neutral-500">{timeString}</span>
                          {isHost && !isMe && !isHostUser && (
                            <button
                              type="button"
                              onClick={() => setMemberToBan({ userId: firstMsg.user_id, username })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                              title={`Ban ${username} from room`}
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Avatar and Bubble Row */}
                        <div className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} items-start max-w-[92%] sm:max-w-[80%]`}>
                          <UserAvatar
                            src={avatarUrl}
                            name={username}
                            size={32}
                            className={`rounded-lg border transition-all shrink-0 ${
                              isStudying
                                ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                                : 'border-white/10'
                            }`}
                          />

                          {/* Bubble Stack */}
                          <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            {group.map((msg: any) => (
                              <div
                                key={msg.id}
                                className={`px-3.5 py-2 text-xs sm:text-sm leading-relaxed transition-all break-words border rounded-lg ${
                                  isMe
                                    ? 'bg-amber-500/[0.08] border-amber-500/25 text-neutral-100 rounded-tr-none'
                                    : 'bg-[#0c0f16] border-white/[0.08] text-neutral-200 rounded-tl-none hover:border-white/15'
                                }`}
                              >
                                {msg.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  };

                  for (const msg of messages) {
                    if (msg.content?.startsWith('[SYSTEM_') || msg.is_system) {
                      flushGroup();
                      const cleanText = msg.content.replace(/^\[SYSTEM_[^\]]*\]\s*/, '');
                      elements.push(
                        <div key={`system-${msg.id}`} className="flex items-center justify-center my-3 select-none">
                          <div className="flex-1 h-px bg-white/[0.06]" />
                          <span className="px-3 text-[10px] font-mono text-neutral-500 tracking-wider uppercase">
                            // {cleanText}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                      );
                      continue;
                    }

                    const dateStr = new Date(msg.created_at).toDateString();
                    if (dateStr !== lastDateStr) {
                      flushGroup();
                      lastDateStr = dateStr;
                      elements.push(
                        <div key={`date-${msg.created_at}`} className="flex items-center my-4 select-none">
                          <div className="flex-1 h-px bg-white/[0.08]" />
                          <span className="px-3 text-[10px] font-hud-mono font-bold text-neutral-500 uppercase tracking-widest">
                            {formatChatDateLabel(msg.created_at)}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.08]" />
                        </div>
                      );
                    }

                    if (currentGroup.length > 0 && currentGroup[0].user_id === msg.user_id) {
                      currentGroup.push(msg);
                    } else {
                      flushGroup();
                      currentGroup = [msg];
                    }
                  }
                  flushGroup();

                  return elements;
                })()}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Jump to Latest Floating Pill */}
            {showJumpToLatest && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#0d1117] border border-amber-500/40 text-amber-400 font-hud-mono text-[10px] font-bold uppercase tracking-wider shadow-2xl flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/10 active:scale-95 transition-all z-30"
              >
                <ArrowDown className="w-3 h-3 text-amber-400 animate-bounce" />
                <span>JUMP TO LATEST</span>
              </button>
            )}

            {/* Input Bar pinned to bottom */}
            <form
              onSubmit={handleSendMessage}
              className="px-3 sm:px-4 py-3 border-t border-white/[0.08] bg-[#07090e]/95 backdrop-blur-md shrink-0 z-20 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-3"
            >
              <div className="max-w-3xl w-full mx-auto">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 focus-within:border-amber-500/50 rounded-xl p-1.5 pl-3.5 transition-all">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="TRANSMIT MESSAGE TO ROOM…"
                    className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none font-mono py-1"
                  />
                  <span className="hidden sm:inline text-[10px] font-hud-mono text-neutral-500 pr-1 select-none">
                    ↵ ENTER
                  </span>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 text-xs font-hud-mono font-bold text-slate-950 bg-amber-500 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SEND</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* SETTINGS VIEW: Two-Column Host Controls                         */}
        {/* ============================================================== */}
        {roomTab === 'settings' && (
          <div className="max-w-4xl mx-auto w-full py-4 sm:py-6 space-y-6 pb-36 animate-in fade-in duration-150">
            {/* Host Banner: Compact CLEARANCE: HOST */}
            <div className="bg-[#0b0e14]/90 border border-amber-500/20 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Crown className="w-4 h-4 fill-amber-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-hud-mono font-bold text-xs uppercase tracking-wider text-amber-400">
                      CLEARANCE: HOST
                    </span>
                    <span className="text-[10px] font-hud-mono text-neutral-500">• MISSION CONTROL</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Configure room identity, clearance passwords, capacity quotas, and squad permissions.
                  </p>
                </div>
              </div>

              {roomInfo?.short_code && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(roomInfo.short_code!)}
                  className="self-start sm:self-center px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-hud-mono text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  title="Click to copy room code"
                >
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold tracking-wider">{roomInfo.short_code}</span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                  )}
                </button>
              )}
            </div>

            {settingsError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            {rlsBlocked && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 font-mono">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">Supabase Permission Policy Required</p>
                    <p className="text-neutral-300 mt-1">
                      PostgreSQL Row-Level Security requires an UPDATE policy on public.study_rooms.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-white/5 text-[11px] overflow-x-auto select-all">
                  <pre>{ROOMS_RLS_SQL}</pre>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRlsSql}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer font-hud-mono"
                >
                  {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRlsSql ? 'COPIED' : 'COPY SQL'}</span>
                </button>
              </div>
            )}

            {/* Two-Column Section Layout: Left Sticky Nav, Right Panels */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Sticky Section Index */}
              <aside className="md:col-span-3">
                {/* Desktop Sticky Index */}
                <nav className="hidden md:flex flex-col space-y-1 sticky top-4">
                  {[
                    { id: 'room', label: 'ROOM IDENT' },
                    { id: 'access', label: 'ACCESS CONTROL' },
                    { id: 'capacity', label: 'CAPACITY' },
                    { id: 'scholars', label: 'ROSTER & BANS' },
                    { id: 'danger', label: 'DANGER ZONE', isDanger: true },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`settings-${sec.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-hud-mono uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                        sec.isDanger
                          ? 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{sec.label}</span>
                      {sec.isDanger && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    </button>
                  ))}
                </nav>

                {/* Mobile Horizontal Pill Strip */}
                <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'room', label: 'ROOM' },
                    { id: 'access', label: 'ACCESS' },
                    { id: 'capacity', label: 'CAPACITY' },
                    { id: 'scholars', label: 'ROSTER' },
                    { id: 'danger', label: 'DANGER', isDanger: true },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`settings-${sec.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-hud-mono uppercase tracking-wider whitespace-nowrap border shrink-0 cursor-pointer ${
                        sec.isDanger
                          ? 'border-rose-500/20 bg-rose-500/5 text-rose-400'
                          : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </aside>

              {/* Right Column: Settings Panels */}
              <div className="md:col-span-9 space-y-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {/* Panel 1: Room Identification */}
                  <div id="settings-room" className="bg-[#0b0e14]/90 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                      <span className="text-xs font-hud-mono font-bold text-neutral-300 uppercase tracking-wider">
                        ROOM IDENTIFICATION
                      </span>
                      <span className="text-[10px] font-hud-mono text-neutral-500 uppercase">
                        MAX 40 CHARS
                      </span>
                    </div>
                    <label className="block text-[10px] font-hud-mono uppercase tracking-wider text-neutral-400">
                      ROOM DESIGNATION
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={editName}
                      onChange={(e) => {
                        isFormDirtyRef.current = true;
                        setEditName(e.target.value);
                      }}
                      placeholder="e.g., DEEP WORK CONTROL ROOM"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 text-sm font-mono transition-colors"
                      required
                    />
                  </div>

                  {/* Panel 2: Access & Password */}
                  <div id="settings-access" className="bg-[#0b0e14]/90 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                      <span className="text-xs font-hud-mono font-bold text-neutral-300 uppercase tracking-wider">
                        ACCESS & CLEARANCE CONTROL
                      </span>
                      <span className={`text-[10px] font-hud-mono px-2 py-0.5 rounded border ${
                        isPrivate
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isPrivate ? 'PROTECTED' : 'PUBLIC'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 font-mono">
                      Control whether operators require clearance credentials to access this study hall.
                    </p>

                    {/* Privacy Mode Selector - Stats Pill Style */}
                    <div className="inline-flex p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          isFormDirtyRef.current = true;
                          setIsPrivate(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-hud-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          !isPrivate
                            ? 'bg-white/[0.08] text-white border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                            : 'text-neutral-400 hover:text-white border border-transparent'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>PUBLIC (NO PASSWORD)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          isFormDirtyRef.current = true;
                          setIsPrivate(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-hud-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          isPrivate
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                            : 'text-neutral-400 hover:text-white border border-transparent'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>PRIVATE (PASSWORD)</span>
                      </button>
                    </div>

                    {/* Password Field */}
                    {isPrivate ? (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-hud-mono uppercase tracking-wider text-neutral-400 block">
                          CLEARANCE PASSWORD
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            maxLength={30}
                            value={editPassword}
                            onChange={(e) => {
                              isFormDirtyRef.current = true;
                              setEditPassword(e.target.value);
                            }}
                            placeholder="ENTER ACCESS PASSWORD…"
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-24 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 font-mono text-sm tracking-wider"
                            required={isPrivate}
                          />
                          <div className="absolute right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title={showPassword ? 'Hide password' : 'Show password'}
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
                              className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                              title="Copy password"
                            >
                              {copiedPassword ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-mono mt-1">
                          Operators entering via explorer or short code will be prompted for this clearance credential.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-neutral-400 text-xs font-mono flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Room is open to all scholars without credential verification.</span>
                      </div>
                    )}
                  </div>

                  {/* Panel 3: Room Capacity Quota */}
                  <div id="settings-capacity" className="bg-[#0b0e14]/90 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                      <span className="text-xs font-hud-mono font-bold text-neutral-300 uppercase tracking-wider">
                        OPERATOR CAPACITY QUOTA
                      </span>
                      <span className="text-xs font-hud-mono font-bold text-amber-400">
                        {String(dbMembers.length).padStart(2, '0')} / {String(editMaxCapacity).padStart(2, '0')} SLOTS
                      </span>
                    </div>

                    {/* Segmented Slot Visualization: 20 discrete ticks */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-20 gap-1 my-1">
                        {Array.from({ length: 20 }).map((_, idx) => {
                          const occupiedRatio = dbMembers.length / editMaxCapacity;
                          const isOccupied = idx / 20 < occupiedRatio;
                          return (
                            <div
                              key={idx}
                              className={`h-2 rounded-sm transition-all ${
                                isOccupied ? 'bg-amber-500' : 'bg-white/[0.07]'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                        <span>{dbMembers.length} OPERATORS CURRENTLY ASSIGNED</span>
                        <span>
                          {editMaxCapacity - dbMembers.length <= 0
                            ? 'MAX CAPACITY REACHED'
                            : `${editMaxCapacity - dbMembers.length} SLOTS OPEN`}
                        </span>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                      <div className="flex flex-col">
                        <span className="text-xs font-hud-mono font-bold text-neutral-300 uppercase tracking-wider">
                          MAX OPERATOR QUOTA
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          MIN {Math.max(2, dbMembers.length)} • MAX 100
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={editMaxCapacity <= Math.max(2, dbMembers.length)}
                          onClick={() => {
                            isFormDirtyRef.current = true;
                            setEditMaxCapacity((prev) => Math.max(Math.max(2, dbMembers.length), prev - 1));
                          }}
                          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer font-bold"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-[60px] text-center">
                          <span className="text-xl font-mono font-bold text-white tabular-nums">
                            {String(editMaxCapacity).padStart(2, '0')}
                          </span>
                          <span className="block text-[9px] font-hud-mono text-neutral-500 uppercase">
                            SLOTS
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={editMaxCapacity >= 100}
                          onClick={() => {
                            isFormDirtyRef.current = true;
                            setEditMaxCapacity((prev) => Math.min(100, prev + 1));
                          }}
                          className="w-8 h-8 rounded-lg bg-amber-500 hover:brightness-110 active:scale-95 disabled:opacity-30 text-slate-950 flex items-center justify-center transition-all cursor-pointer font-bold"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-hud-mono uppercase tracking-wider text-neutral-400 block">
                        QUICK CAPACITY PRESETS
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { count: 4, label: '04 SQUAD' },
                          { count: 8, label: '08 GROUP' },
                          { count: 12, label: '12 CIRCLE' },
                          { count: 25, label: '25 HALL' },
                          { count: 50, label: '50 LECTURE' },
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
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-hud-mono font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : isDisabled
                                  ? 'opacity-30 bg-white/[0.02] border-white/5 text-neutral-600 cursor-not-allowed'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border-white/10'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Panel 4: Scholars & Bans */}
                  <div id="settings-scholars" className="bg-[#0b0e14]/90 border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                      <span className="text-xs font-hud-mono font-bold text-neutral-300 uppercase tracking-wider">
                        OPERATOR ROSTER & EXCLUSIONS
                      </span>
                      <span className="text-[10px] font-hud-mono text-neutral-500">
                        {displayUsers.filter((u) => !u.is_host).length} ENROLLED
                      </span>
                    </div>

                    {/* Active members list */}
                    <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                      {displayUsers.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                              src={member.avatar_url}
                              name={member.username}
                              size={28}
                              className="rounded-full border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-hud font-bold text-white truncate max-w-[130px]">
                                  {member.username}
                                </span>
                                {member.is_host && (
                                  <Crown className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400/20" />
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {formatSeconds(member.total_focus_seconds || 0)} focus logged
                              </span>
                            </div>
                          </div>

                          {!member.is_host && (
                            <button
                              type="button"
                              onClick={() =>
                                setMemberToBan({ userId: member.user_id, username: member.username })
                              }
                              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-hud-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Ban className="w-3 h-3" />
                              <span>BAN</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Banned members list */}
                    <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                      <span className="text-[10px] font-hud-mono uppercase tracking-wider text-rose-400 block">
                        BANNED OPERATORS ({bannedMembers.length})
                      </span>
                      {bannedMembers.length === 0 ? (
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center text-[11px] text-neutral-500 font-mono">
                          No operators are currently excluded from this room.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                          {bannedMembers.map((banned) => (
                            <div
                              key={banned.userId}
                              className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5 border border-rose-500/20"
                            >
                              <span className="text-xs font-mono text-neutral-300 truncate">
                                {banned.username}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUnban(banned.userId, banned.username)}
                                disabled={isUnbanning === banned.userId}
                                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-hud-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                {isUnbanning === banned.userId ? 'UNBANNING…' : 'UNBAN'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel 5: Danger Zone */}
                  <div id="settings-danger" className="pt-4 border-t border-white/[0.08]">
                    <div className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-hud-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>TERMINATE ROOM CLEARANCE</span>
                        </span>
                        <p className="text-[11px] text-neutral-400 font-mono mt-1">
                          Permanently decommission this study hall. All operators will be immediately disconnected.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSaving || isDeletingRoom}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 font-hud-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>DELETE ROOM</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Sticky Save Bar (Appears when isFormDirty) */}
            {isFormDirty && (
              <div className="sticky bottom-4 z-30 max-w-xl mx-auto w-full p-2.5 sm:p-3 rounded-xl bg-[#0e121a]/95 border border-amber-500/40 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center gap-2 pl-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-hud-mono font-bold text-amber-300 uppercase tracking-wider">
                    UNSAVED CHANGES
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="px-3 py-1.5 rounded-lg text-xs font-hud-mono uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    DISCARD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg text-xs font-hud-mono font-bold uppercase tracking-wider text-slate-950 bg-amber-500 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>SAVING…</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-slate-950" />
                        <span>SAVE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* CONFIRMATION MODALS (Portal)                                    */}
      {/* ============================================================== */}
      {mounted && typeof document !== 'undefined' && showDeleteConfirm && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingRoom) {
              setShowDeleteConfirm(false);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="bg-[#0b0e14] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              disabled={isDeletingRoom}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-hud font-bold text-sm text-white uppercase tracking-wider">
                  DELETE STUDY ROOM
                </h3>
                <p className="text-[10px] font-mono text-neutral-500">Permanent action</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300 font-mono leading-relaxed">
              Decommission &ldquo;{roomName}&rdquo;? All enrolled operators will be disconnected and room records wiped.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingRoom}
                className="flex-1 py-2 rounded-lg font-hud-mono font-bold text-neutral-300 bg-white/5 hover:bg-white/10 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={isDeletingRoom}
                className="flex-1 py-2 rounded-lg font-hud-mono font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingRoom ? 'DELETING…' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && typeof document !== 'undefined' && memberToBan && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBanning) {
              setMemberToBan(null);
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="bg-[#0b0e14] border border-rose-500/30 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setMemberToBan(null)}
              className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              disabled={isBanning}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-hud font-bold text-sm text-white uppercase tracking-wider">
                  BAN OPERATOR
                </h3>
                <p className="text-[10px] font-mono text-rose-400/80">Permanent exclusion</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300 font-mono leading-relaxed">
              Ban <span className="font-bold text-white font-hud">{memberToBan.username}</span> from this room? They will be immediately removed and barred from reconnecting.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMemberToBan(null)}
                disabled={isBanning}
                className="flex-1 py-2 rounded-lg font-hud-mono font-bold text-neutral-300 bg-white/5 hover:bg-white/10 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={isBanning}
                className="flex-1 py-2 rounded-lg font-hud-mono font-bold text-white bg-rose-600 hover:bg-rose-500 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isBanning ? 'BANNING…' : 'CONFIRM BAN'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}