import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, Flame, Moon, User as UserIcon, Send, Play, Pause } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';

interface ActiveRoomProps {
  roomId: string;
  onBack: () => void;
}

interface RoomMemberInfo {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_host: boolean;
  is_studying: boolean;
  timer_start_at: number | null;
  accumulated_seconds?: number;
  today_seconds: number;
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

export default function ActiveRoom({ roomId, onBack }: ActiveRoomProps) {
  const { user } = useAuth();
  const { isRunning, elapsedSeconds, startTimer, pauseTimer, getTodayTotalSeconds } = useStudy();

  const [roomName, setRoomName] = useState<string>('Loading...');
  const [roomTab, setRoomTab] = useState<'home' | 'chat'>('home');
  const [dbMembers, setDbMembers] = useState<RoomMemberInfo[]>([]);
  const [presentUsers, setPresentUsers] = useState<any[]>([]);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isTimerRunning = isRunning;

  const profile = useMemo(() => {
    if (!user) return null;
    return {
      username: (user as any).username || user.displayName || 'Scholar',
      avatar_url: user.avatarUrl || (user as any).avatar_url || (user as any).user_metadata?.avatar_url || (user as any).user_metadata?.picture || null,
    };
  }, [user?.id, (user as any)?.username, user?.displayName, user?.avatarUrl, (user as any)?.avatar_url, (user as any)?.user_metadata?.avatar_url, (user as any)?.user_metadata?.picture]);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const channelRef = useRef<any>(null);
  const chatChannelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientIdRef = useRef(Math.random().toString(36).substring(2, 7));

  // Ticker to smoothly update live study timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all registered members of this room + their active sessions and total study time today
  const fetchRoomMembers = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId) return;

    try {
      // 1. Fetch room details
      const { data: roomData } = await supabase
        .from('study_rooms')
        .select('id, name, host_id')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData?.name) {
        setRoomName(roomData.name);
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

        let todaySec = userTodayMap.get(uid) || 0;
        if (uid === user?.id && getTodayTotalSeconds) {
          todaySec = Math.max(todaySec, getTodayTotalSeconds());
        }

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
          today_seconds: todaySec,
          is_online: false,
        };
      });

      setDbMembers(membersList);
    } catch (err) {
      console.error('Error fetching room members:', err);
    }
  }, [roomId, user?.id, getTodayTotalSeconds]);

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
      .subscribe();

    return () => {
      supabase.removeChannel(hubChannel);
    };
  }, [roomId, fetchRoomMembers]);

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
            await presenceChannel.track({
              user_id: user.id,
              client_id: clientIdRef.current,
              username: profileRef.current?.username || user?.email || 'Scholar',
              avatar_url: profileRef.current?.avatar_url || null,
              is_studying: isTimerRunning,
              session_start_time: isTimerRunning ? Date.now() - (elapsedSeconds * 1000) : null,
              elapsed_seconds: elapsedSeconds,
              today_seconds: getTodayTotalSeconds ? getTodayTotalSeconds() : 0,
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
          return [...prev, payload.payload];
        });
      })
      .subscribe();

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(chatChannel);
      channelRef.current = null;
      chatChannelRef.current = null;
    };
  }, [roomId, user?.id]);

  // Update presence status live when timer starts or stops
  useEffect(() => {
    if (channelRef.current && user?.id && isSubscribedRef.current) {
      try {
        channelRef.current.track({
          user_id: user.id,
          client_id: clientIdRef.current,
          username: profile?.username || user?.email || 'Scholar',
          avatar_url: profile?.avatar_url || null,
          is_studying: isTimerRunning,
          session_start_time: isTimerRunning ? Date.now() - (elapsedSeconds * 1000) : null,
          elapsed_seconds: elapsedSeconds,
          today_seconds: getTodayTotalSeconds ? getTodayTotalSeconds() : 0,
        });
      } catch (err) {
        console.error('Tracking error:', err);
      }
    }
  }, [isTimerRunning, user?.id, profile?.username, profile?.avatar_url, getTodayTotalSeconds]);

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
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
        chatChannelRef.current
          .send({
            type: 'broadcast',
            event: 'new_message',
            payload: data,
          })
          .catch(console.error);
      }
    }
    setIsSending(false);
  };

  // Merge DB registered members with live Realtime presence
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

      let isStudying = false;
      let isOnline = false;
      let sessionSeconds = 0;
      let todaySec = member.today_seconds || 0;

      if (isCurrentUser) {
        isStudying = isTimerRunning;
        sessionSeconds = elapsedSeconds;
        isOnline = true;
        if (getTodayTotalSeconds) {
          todaySec = Math.max(todaySec, getTodayTotalSeconds());
        }
      } else if (pu) {
        isOnline = true;
        isStudying = Boolean(pu.is_studying);
        const startTime = pu.session_start_time ?? member.timer_start_at;
        if (startTime) {
          sessionSeconds = Math.max(0, Math.floor((nowTick - startTime) / 1000));
        }
        if (pu.today_seconds) {
          todaySec = Math.max(todaySec, pu.today_seconds);
        }
      } else {
        isOnline = false;
        isStudying = member.is_studying;
        const startTime = member.timer_start_at;
        if (startTime) {
          sessionSeconds = Math.max(
            0,
            Math.floor((nowTick - startTime) / 1000) + (member.accumulated_seconds || 0)
          );
        }
      }

      result.push({
        ...member,
        username: (isCurrentUser ? profile?.username : null) || member.username || pu?.username || 'Scholar',
        avatar_url: (isCurrentUser ? profile?.avatar_url : null) || member.avatar_url || pu?.avatar_url || null,
        is_studying: isStudying,
        session_seconds: sessionSeconds,
        today_seconds: todaySec,
        is_online: isOnline,
        is_current_user: isCurrentUser,
      });
    }

    // Ensure current user is always included even before dbMembers load
    if (user?.id && !seenUserIds.has(user.id)) {
      const todaySec = getTodayTotalSeconds ? getTodayTotalSeconds() : 0;
      result.unshift({
        user_id: user.id,
        username: profile?.username || 'Scholar',
        avatar_url: profile?.avatar_url || null,
        is_host: false,
        is_studying: isTimerRunning,
        session_seconds: elapsedSeconds,
        today_seconds: todaySec,
        is_online: true,
        is_current_user: true,
      });
      seenUserIds.add(user.id);
    }

    // Include any active presence users not in dbMembers
    for (const pu of presentUsers) {
      if (pu?.user_id && !seenUserIds.has(pu.user_id)) {
        seenUserIds.add(pu.user_id);
        const startTime = pu.session_start_time;
        const sessionSeconds = startTime ? Math.max(0, Math.floor((nowTick - startTime) / 1000)) : 0;
        result.push({
          user_id: pu.user_id,
          username: pu.username || 'Scholar',
          avatar_url: pu.avatar_url || null,
          is_host: false,
          is_studying: Boolean(pu.is_studying),
          session_seconds: sessionSeconds,
          today_seconds: pu.today_seconds || 0,
          is_online: true,
          is_current_user: false,
        });
      }
    }

    return result;
  }, [
    dbMembers,
    presentUsers,
    user?.id,
    profile?.username,
    profile?.avatar_url,
    isTimerRunning,
    elapsedSeconds,
    nowTick,
    getTodayTotalSeconds,
  ]);

  return (
    <div className="w-full h-full min-h-[80vh] bg-[#07090e] flex flex-col relative text-slate-200">
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors flex items-center"
          >
            <ChevronLeft className="w-6 h-6 text-slate-300" />
            <span className="font-bold text-slate-300 hidden sm:inline ml-1">Leave</span>
          </button>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-[240px]">
              {roomName}
            </h1>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {displayUsers.length} {displayUsers.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick study timer control directly from the room */}
          <button
            onClick={() => {
              if (isTimerRunning) {
                pauseTimer();
              } else {
                startTimer();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isTimerRunning
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
            }`}
            title={isTimerRunning ? 'Pause Study Session' : 'Start Study Session'}
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-amber-400" />
                <span>Pause ({formatSeconds(elapsedSeconds)})</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Start Timer</span>
              </>
            )}
          </button>

          <div className="flex bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setRoomTab('home')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                roomTab === 'home'
                  ? 'bg-amber-500 text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setRoomTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                roomTab === 'chat'
                  ? 'bg-amber-500 text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {roomTab === 'home' ? (
          <div className="flex flex-wrap gap-8 justify-center items-start mt-8">
            {displayUsers.map((u, i) => {
              const isStudying = u.is_studying;
              const sessionSec = u.session_seconds || 0;
              const todaySec = u.today_seconds || 0;

              return (
                <div
                  key={`${u.user_id}-${i}`}
                  className="flex flex-col items-center gap-2 group relative"
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

                    {/* Status Badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#07090e] shadow-md transition-colors ${
                        isStudying
                          ? 'bg-amber-500'
                          : u.is_online
                          ? 'bg-slate-700'
                          : 'bg-slate-800'
                      }`}
                    >
                      {isStudying ? (
                        <Flame className="w-3.5 h-3.5 text-slate-900 fill-slate-900 animate-pulse" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  </div>

                  {/* Member Name, Live Timer / Total Time Studied Today */}
                  <div className="text-center mt-1 flex flex-col items-center max-w-[130px]">
                    <div className="flex items-center gap-1.5 justify-center">
                      <p className="text-sm font-bold text-slate-200 truncate max-w-[100px]" title={u.username}>
                        {u.username}
                      </p>
                      {u.is_host && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold uppercase tracking-wider flex-shrink-0">
                          Host
                        </span>
                      )}
                    </div>

                    {/* Displays live session timer with seconds when studying, or total time studied today when paused/offline */}
                    <p
                      className={`text-sm font-mono mt-1 font-bold tracking-wider transition-colors ${
                        isStudying
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatSeconds(isStudying ? sessionSec : todaySec)}
                    </p>

                    {/* Subtitle explaining state */}
                    <span
                      className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                        isStudying
                          ? 'text-amber-400/90 font-semibold flex items-center gap-1'
                          : u.is_online
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {isStudying ? (
                        <span>Studying</span>
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
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.profiles?.avatar_url ? (
                      <img
                        src={msg.profiles.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div
                      className={`flex flex-col max-w-[75%] ${
                        msg.user_id === user?.id ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-xs text-slate-400 mb-1">
                        {msg.profiles?.username || 'Scholar'}
                      </span>
                      <div
                        className={`px-4 py-2 rounded-2xl text-sm ${
                          msg.user_id === user?.id
                            ? 'bg-amber-500 text-slate-900 rounded-tr-sm'
                            : 'bg-white/10 text-slate-200 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="relative mt-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message the room..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}