'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { useRoom } from '../../context/RoomContext';
import { formatSeconds } from '../../lib/utils';
import {
  Timer,
  Users,
  CheckSquare,
  BarChart3,
  Maximize2,
  Settings,
  Flame,
  User,
  Radio,
  RotateCcw,
  LogIn,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  activeTab: 'timer' | 'room' | 'todo' | 'analytics';
  setActiveTab: (tab: 'timer' | 'room' | 'todo' | 'analytics') => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenProfile,
  onOpenSettings,
}: NavbarProps) {
  const { user, resetAllData, isAuthenticated, logout } = useAuth();
  const { isStudying, getTodayTotalSeconds, setIsFocusModeOpen } = useStudy();
  const { currentRoom, activeStudierCount } = useRoom();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const todayTotal = getTodayTotalSeconds();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('timer')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>study.io</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Focus
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5">Collaborative Focus & Tracking</div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'timer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('room')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'room'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rooms</span>
              {activeStudierCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('todo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'todo'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Planner</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sign In with Google Button (if not authenticated) */}
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign In</span>
            </Link>
          ) : (
            /* Streak badge when authenticated */
            <div
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 text-amber-400 cursor-pointer transition-colors shadow-sm"
              title={`${user.streakDays} Day Study Streak`}
            >
              <Flame className="w-4 h-4 fill-amber-400" />
              <span className="text-xs font-black font-mono">{user.streakDays}d</span>
            </div>
          )}

          {/* Fullscreen Zen Mode Button */}
          <button
            onClick={() => setIsFocusModeOpen(true)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors shadow-sm hidden sm:flex items-center justify-center"
            title="Open Fullscreen Zen Focus Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors shadow-sm"
            title="App Settings & Database"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            >
              <div className="relative">
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.displayName}
                  size={34}
                  className="w-8.5 h-8.5 rounded-xl border border-slate-700"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                    isStudying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
              </div>
              <div className="text-left hidden xl:block">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[90px]">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-emerald-400 leading-none">Lv. {user.level}</div>
              </div>
            </button>

            {/* User Account Dropdown Menu */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-800 mb-1">
                  <div className="font-bold text-xs text-white">{user.displayName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold">Level {user.level} Scholar</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      {user.streakDays}d Streak
                    </span>
                  </div>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    onClick={() => { onOpenProfile(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Profile & Goals</span>
                  </button>

                  <Link
                    href="/login"
                    onClick={() => setShowPersonaMenu(false)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login / Google Sign-In</span>
                  </Link>

                  <button
                    onClick={() => { onOpenSettings(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings & Cloud Sync</span>
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={() => { logout(); setShowPersonaMenu(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-800 mt-1">
                  <button
                    onClick={() => {
                      if (confirm('Reset all study sessions, tasks, and start completely fresh?')) {
                        resetAllData();
                      }
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Fresh State</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
