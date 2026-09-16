'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import {
  Timer,
  BarChart3,
  Maximize2,
  Settings,
  Flame,
  User,
  LogIn,
  LogOut,
  Zap,
  CheckCircle2,
  Trophy,
  Shield,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getRankTier } from '../../lib/rankedSystem';

interface NavbarProps {
  activeTab: 'timer' | 'analytics';
  setActiveTab: (tab: 'timer' | 'analytics') => void;
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
  const { user, isAuthenticated, logout } = useAuth();
  const { isStudying, setIsFocusModeOpen, gamification } = useStudy();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Memoize user session avatar & display name extraction to prevent flickering
  const avatarUrl = useMemo(() => {
    return (
      user?.user_metadata?.avatar_url ||
      (user as any)?.user_metadata?.picture ||
      user?.avatarUrl ||
      ''
    );
  }, [user?.user_metadata?.avatar_url, (user as any)?.user_metadata?.picture, user?.avatarUrl]);

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      (user as any)?.user_metadata?.name ||
      (user as any)?.user_metadata?.display_name ||
      user?.displayName ||
      'Focus Scholar'
    );
  }, [
    user?.user_metadata?.full_name,
    (user as any)?.user_metadata?.name,
    (user as any)?.user_metadata?.display_name,
    user?.displayName,
  ]);

  const userRank = useMemo(() => getRankTier(user?.seasonRp || 0), [user?.seasonRp]);

  // SVG Progress Ring calculations (radius 18, circumference 113.1)
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gamification.progressPercent / 100) * circumference;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090A0C]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('timer')}>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-sm shadow-amber-500/10">
              ⚡
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>study.io</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  Focus
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5">Focus & Habit Tracking</div>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Rooms tab cleanly removed, keeping Home and Analytics */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'timer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sign In Button (if not authenticated) */}
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          ) : (
            <>
              {/* Free Fire Rank Badge Pill */}
              <div
                onClick={onOpenProfile}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/[0.08] hover:border-amber-500/40 text-slate-200 cursor-pointer select-none shadow-sm transition-all hover:scale-105"
                title={`Ranked Season RP: ${userRank.rp.toLocaleString()} RP (${userRank.fullTitle}) · Click to view`}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: userRank.config.badgeAccent }}
                />
                <span
                  className="text-xs font-black italic tracking-wider uppercase"
                  style={{ color: userRank.config.badgeAccent }}
                >
                  {userRank.fullTitle}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  {userRank.rp.toLocaleString()} RP
                </span>
              </div>

              {/* Static streak badge when authenticated */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 border border-white/[0.08] text-neutral-300 cursor-default select-none shadow-sm"
                title={user.streakDays > 0 ? `${user.streakDays} Day Study Streak (+${user.streakDays * 50} XP bonus)` : 'Start your streak today'}
              >
                {user.streakDays > 0 ? (
                  <>
                    <Flame className="w-4 h-4 text-[#f97316] fill-[#f97316]" />
                    <span className="text-xs font-bold font-mono tabular-nums text-orange-400">{user.streakDays}d</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-[#8FA3A1]">Start streak</span>
                )}
              </div>
            </>
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

          {/* User Profile Pill with Dynamic Level & Circular Progress Ring */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all active:scale-[0.98]"
              title={`Level ${gamification.level} (${gamification.title}) · ${gamification.totalXP} Total XP`}
            >
              {/* Avatar with SVG Circular XP Progress Ring */}
              <div className="relative flex items-center justify-center w-10 h-10">
                <svg className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none" viewBox="0 0 38 38">
                  {/* Background track circle */}
                  <circle
                    cx="19"
                    cy="19"
                    r={radius}
                    className="stroke-slate-800/80 fill-none"
                    strokeWidth="2.5"
                  />
                  {/* Dynamic XP Progress Stroke */}
                  <circle
                    cx="19"
                    cy="19"
                    r={radius}
                    className="stroke-emerald-400 fill-none transition-all duration-500 ease-out"
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Avatar */}
                <UserAvatar
                  src={avatarUrl}
                  name={displayName}
                  size={30}
                  className="w-[30px] h-[30px] rounded-full shadow-inner"
                />

                {/* Online/Studying status pulse */}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                    isStudying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
              </div>

              {/* User Identity & Level Display */}
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                  {displayName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold text-emerald-400 font-mono leading-none">
                    Lv. {gamification.level}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 font-medium leading-tight">
                    {gamification.tierBadge.icon} {gamification.title}
                  </span>
                </div>
              </div>
            </button>

            {/* Interactive User Account Dropdown with Full Gamification Dashboard */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Header */}
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white truncate max-w-[180px]">{displayName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{user.email}</div>
                    </div>
                    <span className="text-base">{gamification.tierBadge.icon}</span>
                  </div>

                  {/* Level & Title Pill */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${gamification.tierBadge.badgeClass}`}>
                      Lv. {gamification.level} · {gamification.title}
                    </span>
                    <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {user.streakDays}d
                    </span>
                  </div>
                </div>

                {/* Gamification Progress Card */}
                <div className="my-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>Total XP</span>
                    </span>
                    <span className="text-white font-extrabold font-mono">
                      {gamification.totalXP.toLocaleString()} XP
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${gamification.progressPercent}%` }}
                    />
                  </div>

                  {/* XP Footnote */}
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{gamification.xpInCurrentLevel} / {gamification.xpNeededForNextLevel} XP</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {gamification.xpRemaining} XP to Lv. {gamification.level + 1}
                    </span>
                  </div>

                  {/* XP Sources Breakdown */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-1 text-[9px] text-center">
                    <div className="p-1 rounded bg-slate-900/60">
                      <div className="text-slate-400">Focus</div>
                      <div className="text-emerald-400 font-bold font-mono">+{gamification.focusXP}</div>
                    </div>
                    <div className="p-1 rounded bg-slate-900/60">
                      <div className="text-slate-400">Tasks</div>
                      <div className="text-cyan-400 font-bold font-mono">+{gamification.todoXP}</div>
                    </div>
                    <div className="p-1 rounded bg-slate-900/60">
                      <div className="text-slate-400">Streak</div>
                      <div className="text-amber-400 font-bold font-mono">+{gamification.streakXP}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => { onOpenProfile(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2.5"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Profile & Goals</span>
                  </button>

                  <button
                    onClick={() => { onOpenSettings(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings & Preferences</span>
                  </button>

                  {!isAuthenticated ? (
                    <button
                      onClick={() => { onOpenAuth(); setShowPersonaMenu(false); }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In / Switch Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { logout(); setShowPersonaMenu(false); }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
