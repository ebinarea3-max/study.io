import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, Flame, BookOpen, Moon, Coffee, User as UserIcon, Send } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';

interface ActiveRoomProps {
  roomId: string;
  onBack: () => void;
}

export default function ActiveRoom({ roomId, onBack }: ActiveRoomProps) {
  const { user } = useAuth();
  const { isRunning, elapsedSeconds } = useStudy();
  
  const [roomName, setRoomName] = useState<string>('Loading...');
  const [roomTab, setRoomTab] = useState<'home' | 'chat'>('home');
  const [presentUsers, setPresentUsers] = useState<any[]>([]);
  
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

  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Room Details
  useEffect(() => {
    const fetchRoom = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase.from('study_rooms').select('name').eq('id', roomId).single();
      if (data) setRoomName(data.name);
    };
    fetchRoom();
  }, [roomId]);

  // 1. Establish the Realtime channels (Presence and Chat isolated)
  useEffect(() => {
    if (!user?.id) {
      console.log("[Realtime] No user ID yet, waiting...");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    // Channel 1 (Avatars/Presence):
    console.log("[Realtime] Connecting to presence channel:", `presence_room_${roomId}`);
    const presenceChannel = supabase.channel(`presence_room_${roomId}`, {
      config: { presence: { key: user.id } }
    });
    channelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeUsers = Object.values(state).flat();
        console.log("[Realtime] Presence Sync triggered. Users online:", activeUsers.length);
        setPresentUsers(activeUsers);
      })
      .subscribe(async (status, err) => {
        console.log("[Realtime Presence] Status:", status);
        if (err) console.error("[Realtime Presence] Error:", err);
        
        if (status === 'SUBSCRIBED') {
          console.log("[Realtime Presence] Subscribed! Tracking presence...");
          const trackStatus = await presenceChannel.track({
            user_id: user.id,
            username: profile?.username || user?.email || 'Scholar',
            avatar_url: profile?.avatar_url || null,
            is_studying: isTimerRunning,
            session_start_time: isTimerRunning ? Date.now() : null
          });
          console.log("[Realtime Presence] Track response:", trackStatus);
        }
      });

    // Channel 2 (Chat Messages):
    console.log("[Realtime] Connecting to chat channel:", `chat_room_${roomId}`);
    const chatChannel = supabase.channel(`chat_room_${roomId}`);

    chatChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const fetchNewMsg = async () => {
          const { data } = await supabase
            .from('room_messages')
            .select(`
              id, content, created_at, user_id,
              profiles ( username, avatar_url )
            `)
            .eq('id', payload.new.id)
            .single();
          if (data) setMessages(prev => [...prev, data]);
        };
        fetchNewMsg();
      })
      .subscribe((status, err) => {
        console.log("[Realtime Chat] Status:", status);
        if (err) console.warn("[Realtime Chat] Non-fatal chat channel error:", err);
      });

    // Clean up both channels on unmount
    return () => {
      console.log("[Realtime] Cleaning up presence and chat channels");
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(chatChannel);
      channelRef.current = null;
    };
  }, [roomId, user?.id]); // DO NOT depend on profile here.

  // 2. Update tracking state WITHOUT destroying the channel
  useEffect(() => {
    if (channelRef.current && user?.id) {
      channelRef.current.track({
        user_id: user.id,
        username: profile?.username || user?.email || 'Scholar',
        avatar_url: profile?.avatar_url || null,
        is_studying: isTimerRunning,
        session_start_time: isTimerRunning ? Date.now() : null
      });
    }
  }, [isTimerRunning]); 
  // ^ This hook safely broadcasts status changes without disconnecting.

  // Fetch Chat History
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

    const { error } = await supabase.from('room_messages').insert({
      room_id: roomId,
      user_id: user.id,
      content: newMessage.trim()
    });
    
    if (error) {
      console.error(error);
      alert("Failed to send message.");
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const getLiveDuration = (timerStartAt: number | null) => {
    if (!timerStartAt) return 'Paused';
    const elapsed = Math.floor((Date.now() - timerStartAt) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

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
          <h1 className="text-xl font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-[300px]">
            {roomName}
          </h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setRoomTab('home')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${roomTab === 'home' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Home
          </button>
          <button
            onClick={() => setRoomTab('chat')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${roomTab === 'chat' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Chat
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {roomTab === 'home' ? (
          <div className="flex flex-wrap gap-8 justify-center mt-8">
            {presentUsers.map((u, i) => {
              const isStudying = Boolean(u.is_studying ?? (u.status === 'studying'));
              const startTime = u.session_start_time ?? u.timer_start_at ?? null;
              return (
                <div key={`${u.user_id}-${i}`} className="flex flex-col items-center gap-2 group relative">
                  <div className="relative">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username || 'Scholar'} className={`w-16 h-16 rounded-full object-cover border-2 transition-colors ${isStudying ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-slate-600 opacity-70'}`} />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${isStudying ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] bg-amber-500/10' : 'border-slate-600 bg-slate-800 opacity-70'}`}>
                        <UserIcon className={`w-8 h-8 ${isStudying ? 'text-amber-500' : 'text-slate-500'}`} />
                      </div>
                    )}
                    
                    {/* Status Icon Badge */}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#07090e] ${isStudying ? 'bg-amber-500' : 'bg-slate-700'}`}>
                      {isStudying ? (
                        <Flame className="w-3.5 h-3.5 text-slate-900" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center mt-1">
                    <p className="text-sm font-bold text-slate-200">{u.username || 'Scholar'}</p>
                    <p className={`text-xs font-mono mt-0.5 ${isStudying ? 'text-amber-400' : 'text-slate-500'}`}>
                      {getLiveDuration(startTime)}
                    </p>
                  </div>
                </div>
              );
            })}
            {presentUsers.length === 0 && (
              <div className="text-slate-500 text-center w-full mt-10">Waiting for scholars to join...</div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">No messages yet. Say hi!</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    {msg.profiles?.avatar_url ? (
                      <img src={msg.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className={`flex flex-col max-w-[75%] ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-slate-400 mb-1">{msg.profiles?.username || 'Scholar'}</span>
                      <div className={`px-4 py-2 rounded-2xl text-sm ${msg.user_id === user?.id ? 'bg-amber-500 text-slate-900 rounded-tr-sm' : 'bg-white/10 text-slate-200 rounded-tl-sm'}`}>
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
                onChange={e => setNewMessage(e.target.value)}
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
