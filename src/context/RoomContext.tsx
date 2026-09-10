'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { StudyRoom, RoomMember, RoomChatMessage, CheerReaction } from '../types';
import { INITIAL_ROOMS, cleanupLegacyDemoData } from '../lib/mockData';
import { useAuth } from './AuthContext';
import { useStudy } from './StudyContext';
import { soundFx } from '../lib/audio';
import { getSupabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface RoomContextType {
  rooms: StudyRoom[];
  currentRoom: StudyRoom;
  currentRoomId: string;
  activeRoomId: string | null;
  roomMembers: RoomMember[];
  messages: RoomChatMessage[];
  floatingReactions: CheerReaction[];
  activeStudierCount: number;
  restingMemberCount: number;
  switchRoom: (roomId: string) => void;
  enterRoom: (roomId: string, passcode?: string) => { success: boolean; error?: string };
  leaveRoom: () => void;
  createRoom: (room: Omit<StudyRoom, 'id' | 'memberCount' | 'createdAt'>) => StudyRoom;
  sendCheer: (toMemberName: string, emoji: string) => void;
  sendMessage: (text: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  subjectFilter: string;
  setSubjectFilter: (filter: string) => void;
  unlockedRoomIds: string[];
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

type RoomBroadcastMessage =
  | { type: 'HEARTBEAT'; member: RoomMember }
  | { type: 'CHEER'; fromName: string; toName: string; emoji: string }
  | { type: 'CHAT'; message: RoomChatMessage };

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isStudying, elapsedSeconds, selectedSubject, getTodayTotalSeconds } = useStudy();

  const [rooms, setRooms] = useState<StudyRoom[]>(INITIAL_ROOMS);
  const [currentRoomId, setCurrentRoomId] = useState<string>('room-global');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [unlockedRoomIds, setUnlockedRoomIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('studypulse_unlocked_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [remoteMembers, setRemoteMembers] = useState<Record<string, { member: RoomMember; lastSeen: number }>>({});
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<CheerReaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize rooms and merge sample rooms if needed
  useEffect(() => {
    try {
      cleanupLegacyDemoData();
      const savedRooms = localStorage.getItem('studypulse_rooms');
      if (savedRooms) {
        const parsed: StudyRoom[] = JSON.parse(savedRooms);
        const existingIds = new Set(parsed.map(r => r.id));
        const merged = [...parsed];
        for (const initRoom of INITIAL_ROOMS) {
          if (!existingIds.has(initRoom.id)) {
            merged.push(initRoom);
          }
        }
        setRooms(merged);
      } else {
        setRooms(INITIAL_ROOMS);
      }

      const activeId = currentRoomId;
      const savedMessages = localStorage.getItem(`studypulse_messages_${activeId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } catch {
      // fallback
    }
  }, [currentRoomId]);

  const currentRoom = rooms.find(r => r.id === (activeRoomId || currentRoomId)) || rooms[0];

  // Trigger floating reaction emoji
  const triggerReaction = useCallback((fromName: string, toName: string, emoji: string) => {
    soundFx.playReactionPop();
    const newReaction: CheerReaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      fromName,
      toName,
      emoji,
      x: 20 + Math.random() * 60, // 20% to 80% screen width
      y: 70 + Math.random() * 20,
      timestamp: Date.now(),
    };

    setFloatingReactions(prev => [...prev, newReaction]);

    // Clean up after 3 seconds
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  }, []);

  // Multi-tab / Peer Realtime Sync via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('studypulse_rooms_channel');
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<RoomBroadcastMessage>) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'HEARTBEAT') {
        const { member } = data;
        // Don't duplicate self
        if (member.userId === user.id) return;

        setRemoteMembers(prev => ({
          ...prev,
          [member.userId]: {
            member,
            lastSeen: Date.now(),
          },
        }));
      } else if (data.type === 'CHEER') {
        triggerReaction(data.fromName, data.toName, data.emoji);
      } else if (data.type === 'CHAT') {
        if (data.message.roomId === currentRoomId) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            const updated = [...prev.slice(-40), data.message];
            try {
              localStorage.setItem(`studypulse_messages_${currentRoomId}`, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }
      }
    };

    // Cleanup stale remote members every 3 seconds
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemoteMembers(prev => {
        let changed = false;
        const next: Record<string, { member: RoomMember; lastSeen: number }> = {};
        Object.entries(prev).forEach(([key, val]) => {
          if (now - val.lastSeen < 6000) {
            next[key] = val;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 3000);

    return () => {
      channel.close();
      clearInterval(cleanupInterval);
    };
  }, [user.id, currentRoomId, triggerReaction]);

  // Current user's member object
  const todayTotal = getTodayTotalSeconds();
  const currentUserMember: RoomMember = {
    id: `mem-user-${user.id}`,
    roomId: activeRoomId || currentRoomId,
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: isStudying ? 'studying' : 'resting',
    currentSubjectName: isStudying ? selectedSubject?.name : undefined,
    currentSubjectColor: isStudying ? selectedSubject?.color : undefined,
    activeTimerSeconds: isStudying ? elapsedSeconds : 0,
    todayTotalSeconds: todayTotal,
    streakDays: user.streakDays || 0,
    isBot: false,
    lastActive: new Date().toISOString(),
  };

  // Broadcast current user's heartbeat every 2 seconds if inside an active room
  useEffect(() => {
    if (!channelRef.current || !activeRoomId) return;

    const sendHeartbeat = () => {
      try {
        channelRef.current?.postMessage({
          type: 'HEARTBEAT',
          member: currentUserMember,
        });
      } catch {
        // ignore
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 2000);
    return () => clearInterval(interval);
  }, [currentUserMember, activeRoomId]);

  // Supabase Realtime room presence synchronization
  useEffect(() => {
    if (!activeRoomId) return;

    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Fetch current active presence rows from Supabase
    supabase
      .from('room_presence')
      .select('*')
      .eq('room_id', activeRoomId)
      .then(({ data }) => {
        if (data) {
          const now = Date.now();
          data.forEach((row: { user_id: string; room_id: string; session_start_time?: string; is_studying?: boolean; subject_name?: string; updated_at: string }) => {
            if (row.user_id !== user.id) {
              const startMs = row.session_start_time ? new Date(row.session_start_time).getTime() : 0;
              const activeTimerSec = row.is_studying && startMs ? Math.max(0, Math.floor((now - startMs) / 1000)) : 0;
              setRemoteMembers(prev => ({
                ...prev,
                [row.user_id]: {
                  member: {
                    id: `mem-${row.user_id}`,
                    roomId: row.room_id,
                    userId: row.user_id,
                    displayName: row.subject_name ? `Peer (${row.subject_name})` : 'Peer Studier',
                    avatarUrl: '',
                    status: row.is_studying ? 'studying' : 'resting',
                    currentSubjectName: row.subject_name || undefined,
                    activeTimerSeconds: activeTimerSec,
                    todayTotalSeconds: activeTimerSec,
                    streakDays: 1,
                    lastActive: row.updated_at,
                  },
                  lastSeen: now,
                },
              }));
            }
          });
        }
      });

    // 2. Subscribe to Realtime postgres changes
    const channel = supabase
      .channel(`room_presence_${activeRoomId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'room_presence',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload: { new?: { user_id: string; room_id: string; session_start_time?: string; is_studying?: boolean; subject_name?: string; updated_at: string } }) => {
          const row = payload.new;
          if (!row || row.user_id === user.id) return;
          const now = Date.now();
          const startMs = row.session_start_time ? new Date(row.session_start_time).getTime() : 0;
          const activeTimerSec = row.is_studying && startMs ? Math.max(0, Math.floor((now - startMs) / 1000)) : 0;
          setRemoteMembers(prev => ({
            ...prev,
            [row.user_id]: {
              member: {
                id: `mem-${row.user_id}`,
                roomId: row.room_id,
                userId: row.user_id,
                displayName: row.subject_name ? `Peer (${row.subject_name})` : 'Peer Studier',
                avatarUrl: '',
                status: row.is_studying ? 'studying' : 'resting',
                currentSubjectName: row.subject_name || undefined,
                activeTimerSeconds: activeTimerSec,
                todayTotalSeconds: activeTimerSec,
                streakDays: 1,
                lastActive: row.updated_at,
              },
              lastSeen: now,
            },
          }));
        }
      )
      .subscribe();

    // 3. Upsert current user's live presence
    if (user.id && !user.id.startsWith('user-scholar-')) {
      supabase.from('room_presence').upsert({
        user_id: user.id,
        room_id: activeRoomId,
        is_studying: isStudying,
        subject_name: isStudying ? selectedSubject?.name : null,
        session_start_time: isStudying ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,room_id' }).then();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, isStudying, selectedSubject?.name, user.id]);

  // Combine current user with active remote peers in the same room
  const effectiveRoomId = activeRoomId || currentRoomId;
  const activeRemoteMembers = Object.values(remoteMembers)
    .map(entry => entry.member)
    .filter(m => m.roomId === effectiveRoomId && m.userId !== user.id);

  const roomMembers = activeRoomId ? [currentUserMember, ...activeRemoteMembers] : [];

  // Send Cheer from current user
  const sendCheer = (toMemberName: string, emoji: string) => {
    triggerReaction(user.displayName, toMemberName, emoji);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 },
    });

    try {
      channelRef.current?.postMessage({
        type: 'CHEER',
        fromName: user.displayName,
        toName: toMemberName,
        emoji,
      });
    } catch {
      // ignore
    }

    const newMsg: RoomChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      roomId: effectiveRoomId,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      message: `cheered ${toMemberName} with ${emoji}`,
      type: 'cheer',
      cheerEmoji: emoji,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [...prev.slice(-40), newMsg];
      try {
        localStorage.setItem(`studypulse_messages_${effectiveRoomId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Send Chat message from user
  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    soundFx.playReactionPop();
    const newMsg: RoomChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      roomId: effectiveRoomId,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      message: text.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    try {
      channelRef.current?.postMessage({
        type: 'CHAT',
        message: newMsg,
      });
    } catch {
      // ignore
    }

    setMessages(prev => {
      const updated = [...prev.slice(-40), newMsg];
      try {
        localStorage.setItem(`studypulse_messages_${effectiveRoomId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Switch Room
  const switchRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setActiveRoomId(roomId);
    try {
      const savedMessages = localStorage.getItem(`studypulse_messages_${roomId}`);
      setMessages(savedMessages ? JSON.parse(savedMessages) : []);
    } catch {
      setMessages([]);
    }
  };

  // Enter Room (handles public rooms and password protection)
  const enterRoom = (roomId: string, passcode?: string): { success: boolean; error?: string } => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) {
      return { success: false, error: 'Room not found.' };
    }

    // If public or unlocked
    if (!targetRoom.isPrivate || !targetRoom.passcode || unlockedRoomIds.includes(roomId)) {
      setCurrentRoomId(roomId);
      setActiveRoomId(roomId);
      try {
        const savedMessages = localStorage.getItem(`studypulse_messages_${roomId}`);
        setMessages(savedMessages ? JSON.parse(savedMessages) : []);
      } catch {
        setMessages([]);
      }
      return { success: true };
    }

    // Verify passcode
    if (passcode && passcode.trim() === targetRoom.passcode.trim()) {
      const nextUnlocked = [...unlockedRoomIds, roomId];
      setUnlockedRoomIds(nextUnlocked);
      try {
        localStorage.setItem('studypulse_unlocked_rooms', JSON.stringify(nextUnlocked));
      } catch {
        // ignore
      }

      setCurrentRoomId(roomId);
      setActiveRoomId(roomId);
      try {
        const savedMessages = localStorage.getItem(`studypulse_messages_${roomId}`);
        setMessages(savedMessages ? JSON.parse(savedMessages) : []);
      } catch {
        setMessages([]);
      }
      return { success: true };
    }

    return { success: false, error: 'Incorrect room password. Please try again.' };
  };

  // Leave active room and return to Room Directory
  const leaveRoom = () => {
    const supabase = getSupabase();
    if (supabase && activeRoomId && user.id && !user.id.startsWith('user-scholar-')) {
      supabase.from('room_presence').delete().match({ user_id: user.id, room_id: activeRoomId }).then();
    }
    setActiveRoomId(null);
  };

  // Create Room
  const createRoom = (newRoom: Omit<StudyRoom, 'id' | 'memberCount' | 'createdAt'>): StudyRoom => {
    const room: StudyRoom = {
      ...newRoom,
      id: `room-${Date.now()}`,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    const updatedRooms = [room, ...rooms];
    setRooms(updatedRooms);
    try {
      localStorage.setItem('studypulse_rooms', JSON.stringify(updatedRooms));
    } catch {
      // ignore
    }

    if (room.isPrivate && room.passcode) {
      const nextUnlocked = [...unlockedRoomIds, room.id];
      setUnlockedRoomIds(nextUnlocked);
      try {
        localStorage.setItem('studypulse_unlocked_rooms', JSON.stringify(nextUnlocked));
      } catch {
        // ignore
      }
    }

    setCurrentRoomId(room.id);
    setActiveRoomId(room.id);
    setMessages([]);
    return room;
  };

  const activeStudierCount = roomMembers.filter(m => m.status === 'studying').length;
  const restingMemberCount = roomMembers.filter(m => m.status === 'resting').length;

  return (
    <RoomContext.Provider
      value={{
        rooms,
        currentRoom,
        currentRoomId,
        activeRoomId,
        roomMembers,
        messages,
        floatingReactions,
        activeStudierCount,
        restingMemberCount,
        switchRoom,
        enterRoom,
        leaveRoom,
        createRoom,
        sendCheer,
        sendMessage,
        searchQuery,
        setSearchQuery,
        subjectFilter,
        setSubjectFilter,
        unlockedRoomIds,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
