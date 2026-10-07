"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getSupabase } from '../../../lib/supabase';
import { StudyTimer } from '../../../components/timer/StudyTimer';
import { Logo } from '../../../components/Logo';
import Link from 'next/link';
import { Send, Users, ChevronLeft, MessageSquare, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  text: string;
  timestamp: number;
}

interface PresenceUser {
  user_id: string;
  username: string;
  avatar_url?: string;
  rank_title: string;
}

export default function LiveRoomPage() {
  const params = useParams();
  const roomId = params?.id as string;
  const router = useRouter();
  
  const { user } = useAuth();
  
  const [roomName, setRoomName] = useState<string>('Loading Room...');
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Room Info
  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('study_rooms')
        .select('name')
        .eq('id', roomId)
        .single();
        
      if (data) {
        setRoomName(data.name);
      } else if (error) {
        setRoomName('Unknown Room');
      }
    };
    fetchRoom();
  }, [roomId]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!roomId || !user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        // Flatten the presence state array
        const users = Object.values(state).map((presenceArr: any) => presenceArr[0]);
        setPresentUsers(users as PresenceUser[]);
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        setMessages(prev => [...prev, payload.payload]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: user.id,
            username: user.username || user.displayName || 'Unknown Scholar',
            avatar_url: user.avatarUrl || user.user_metadata?.avatar_url || '',
            rank_title: user.rank_title || 'Unranked'
          });
        }
      });

    channelRef.current = roomChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !channelRef.current || !user) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      user_id: user.id,
      username: user.username || user.displayName || 'Unknown',
      text: chatInput.trim(),
      timestamp: Date.now()
    };

    // Optimistically add to our own UI
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Broadcast to others
    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: newMessage
    });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Ambience matches the app */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between p-4 md:p-6 relative z-20 border-b border-white/[0.05] bg-black/20 backdrop-blur-md">
        <Link href="/rooms" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-hud tracking-widest text-sm font-bold mt-0.5">LEAVE ROOM</span>
        </Link>
        <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-black font-hud tracking-widest uppercase text-white drop-shadow-md">
            {roomName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 relative z-10 flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)]">
        
        {/* Left Column: Personal Timer (70%) */}
        <div className="w-full lg:w-[70%] h-full flex flex-col rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 scale-[0.85] origin-top md:scale-100">
             <StudyTimer />
          </div>
        </div>

        {/* Right Column: Multiplayer Panel (30%) */}
        <div className="w-full lg:w-[30%] h-full flex flex-col bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          
          {/* Active Users Section */}
          <div className="p-4 border-b border-white/[0.05] bg-black/20">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-hud tracking-widest font-bold uppercase text-slate-300">
                Active Scholars ({presentUsers.length})
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
              {presentUsers.map((pUser, idx) => (
                <div key={`${pUser.user_id}-${idx}`} className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-full pl-1 pr-3 py-1">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {pUser.avatar_url ? (
                        <img src={pUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    {/* Pulsing Green Online Dot */}
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-[#12161f] animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                    {pUser.username}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0 bg-black/10">
            <div className="flex items-center gap-2 p-4 border-b border-white/[0.05]">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-hud tracking-widest font-bold uppercase text-slate-400">
                Live Chat
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-mono">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-mono text-slate-500 mb-1 px-1">
                        {msg.username}
                      </span>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] break-words shadow-md ${
                        isMe 
                          ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-br-sm' 
                          : 'bg-white/[0.05] text-slate-200 border border-white/[0.1] rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-white/[0.05]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message..."
                  maxLength={200}
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-2 p-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
          
        </div>

      </main>
    </div>
  );
}
