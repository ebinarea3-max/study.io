'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Flame, MessageSquare, Sparkles, Smile, Users } from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from '../common/UserAvatar';
import { CheerIcon } from '../common/CheerIcon';

const QUICK_REACTION_BAR = [
  { id: 'flame', label: 'Fire' },
  { id: 'power', label: 'Power' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'clap', label: 'Clap' },
  { id: 'target', label: 'Target' },
  { id: 'muscle', label: 'Strong' },
];

export function RoomChatAndReactions() {
  const { user } = useAuth();
  const { messages, sendMessage, sendCheer, currentRoom, activeStudierCount } = useRoom();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleQuickCheer = (emoji: string) => {
    sendCheer('Room', emoji);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800/80 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-sm text-white">Live Study Chat</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{activeStudierCount} Active</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[320px] max-h-[460px]">
        {messages.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
            <div className="font-semibold text-slate-400">No messages yet in this lounge</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Send a cheer or post a study note to start the room chat!
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === user.id;

            if (msg.type === 'cheer') {
              return (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2"
                >
                  <CheerIcon id={msg.cheerEmoji || 'flame'} className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="font-bold text-amber-300">{msg.userName}</span>{' '}
                    <span className="text-slate-300">{msg.message}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <UserAvatar
                  src={msg.userAvatar}
                  name={msg.userName}
                  size={28}
                  className="w-7 h-7 rounded-lg border border-slate-700 mt-0.5 flex-shrink-0"
                />
                <div className={`max-w-[80%] ${isMe ? 'items-end text-right' : ''}`}>
                  <div className="text-[10px] text-slate-400 mb-0.5 font-medium px-1">
                    {msg.userName}
                  </div>
                  <div
                    className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Cheer Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">
          Cheer:
        </span>
        <div className="flex items-center gap-1.5 flex-1 justify-around">
          {QUICK_REACTION_BAR.map(r => (
            <button
              key={r.id}
              onClick={() => handleQuickCheer(r.id)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:scale-110 transition-transform text-slate-400 hover:text-white"
              title={`Send ${r.label} to room`}
            >
              <CheerIcon id={r.id} className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Send encouragement to room..."
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          disabled={!inputText.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
