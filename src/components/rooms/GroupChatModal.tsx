'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, X, Users, Sparkles, Smile } from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from '../common/UserAvatar';

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_REACTION_BAR = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '⚡', label: 'Power' },
  { emoji: '☕', label: 'Coffee' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '💪', label: 'Strong' },
];

export function GroupChatModal({ isOpen, onClose }: GroupChatModalProps) {
  const { user } = useAuth();
  const { messages, sendMessage, sendCheer, currentRoom, activeStudierCount } = useRoom();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full sm:h-[620px] sm:max-w-md bg-slate-900 border border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <span>Group Chat</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {activeStudierCount} Active
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {currentRoom?.name || 'Study Lounge'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Close Group Chat and resume studying"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Distraction-free notice */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Chat is hidden during study sessions</span>
          <span className="text-emerald-400 font-medium">Distraction-free</span>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
              <div className="font-bold text-slate-300">No messages yet</div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Say hello or send a quick cheer to start the conversation with your study group!
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.userId === user.id;

              if (msg.type === 'cheer') {
                return (
                  <div
                    key={msg.id}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2.5"
                  >
                    <span className="text-xl">{msg.cheerEmoji || '🔥'}</span>
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
                    <div className="text-[10px] text-slate-400 mb-0.5 font-semibold px-1">
                      {msg.userName}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-500 text-slate-950 font-bold rounded-tr-none shadow-md shadow-emerald-500/10'
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

        {/* Quick Reaction Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Cheer:
          </span>
          <div className="flex items-center gap-1.5 flex-1 justify-around">
            {QUICK_REACTION_BAR.map(r => (
              <button
                key={r.emoji}
                onClick={() => handleQuickCheer(r.emoji)}
                className="text-base p-1.5 rounded-lg hover:bg-slate-800 hover:scale-130 transition-transform"
                title={`Send ${r.label}`}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type a group message..."
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
