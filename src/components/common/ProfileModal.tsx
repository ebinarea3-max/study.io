'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Target, Award, Flame, Check, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from './UserAvatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [bio, setBio] = useState(user.bio || '');
  const [dailyGoalHours, setDailyGoalHours] = useState(user.dailyGoalHours);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName,
      avatarUrl,
      bio,
      dailyGoalHours: Number(dailyGoalHours),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Edit Profile & Goals</h3>
              <p className="text-xs text-slate-400">Customize your study persona & daily target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User stats banner */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar
                src={avatarUrl}
                name={displayName}
                size={56}
                className="w-14 h-14 rounded-full border-2 border-emerald-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                <Flame className="w-2.5 h-2.5 fill-current" />
                {user.streakDays}d
              </span>
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{displayName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Lv. {user.level}
                </span>
              </div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Daily Target</div>
            <div className="text-base font-black text-emerald-400">{dailyGoalHours}h / day</div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Avatar Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(url)}
                  className={`relative p-1 rounded-xl border transition-all ${
                    avatarUrl === url
                      ? 'border-emerald-500 bg-emerald-500/20 scale-105'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-800'
                  }`}
                >
                  <UserAvatar
                    src={url}
                    name={`Scholar ${idx + 1}`}
                    size={40}
                    className="w-10 h-10 rounded-lg mx-auto"
                  />
                  {avatarUrl === url && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Avatar URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Or Custom Image URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Bio / Motivation */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Status / Focus Goal</label>
            <input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. Preparing for finals / MCAT 🎯"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Daily Goal Target (Hours) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Study Goal: {dailyGoalHours} Hours</span>
              </label>
              <span className="text-xs text-emerald-400 font-bold">{Math.round(dailyGoalHours * 60)} mins</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              step="0.5"
              value={dailyGoalHours}
              onChange={e => setDailyGoalHours(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1h Light</span>
              <span>4h Moderate</span>
              <span>6h Dedicated</span>
              <span>10h+ Hardcore</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
