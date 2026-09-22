'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import {
  Timer,
  BarChart3,
  Maximize2,
  Minimize2,
  Settings,
  Flame,
  User,
  LogIn,
  LogOut,
  Trophy,
  CheckSquare,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getRankTier } from '../../lib/rankedSystem';
import { getTierBadge, getLevelTitle } from '../../lib/gamification';

interface NavbarProps {
  activeTab: 'timer' | 'tasks' | 'analytics';
  setActiveTab: (tab: 'timer' | 'tasks' | 'analytics') => void;
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
  const { isStudying, setIsFocusModeOpen, gamification, sessions } = useStudy();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with document fullscreenchange events & vendor fallbacks
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof document === 'undefined') return;
      const doc = document as any;
      setIsFullscreen(
        Boolean(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Native fullscreen toggle with cross-browser / vendor prefix safety
  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const doc = document as any;
    const docEl = document.documentElement as any;

    try {
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isFs) {
        const requestFs =
          docEl.requestFullscreen ||
          docEl.webkitRequestFullscreen ||
          docEl.mozRequestFullScreen ||
          docEl.msRequestFullscreen;

        if (requestFs) {
          const promise = requestFs.call(docEl);
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => console.warn('Fullscreen request failed:', err));
          }
        }
      } else {
        const exitFs =
          doc.exitFullscreen ||
          doc.webkitExitFullscreen ||
          doc.mozCancelFullScreen ||
          doc.msExitFullscreen;

        if (exitFs) {
          const promise = exitFs.call(doc);
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => console.warn('Exit fullscreen failed:', err));
          }
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }, []);

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

  // Derive total RP and Level directly from the single source of truth for total study seconds
  const totalSeconds = useMemo(() => {
    return (sessions || []).reduce(
      (sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0),
      0
    );
  }, [sessions]);

  const totalRP = useMemo(() => {
    const focusRP = Math.floor(totalSeconds / 60) * 10;
    const profileRP = Number((user as any)?.rp ?? user?.seasonRp ?? 0);
    return Math.max(focusRP, profileRP);
  }, [totalSeconds, (user as any)?.rp, user?.seasonRp]);

  const userRank = useMemo(
    () => getRankTier(totalRP),
    [totalRP]
  );

  // Prevent level/title flicker by falling back to stored user_metadata / user profile
  const effectiveLevel = gamification.level || (user?.user_metadata as any)?.level || user?.level || 1;
  const effectiveTitle = gamification.title || (user?.user_metadata as any)?.levelTitle || user?.levelTitle || getLevelTitle(effectiveLevel);
  const effectiveTierBadge = gamification.tierBadge || getTierBadge(effectiveLevel);

  // SVG Progress Ring calculations (radius 18, circumference 113.1)
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gamification.progressPercent / 100) * circumference;

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090A0C]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer" onClick={() => setActiveTab('timer')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 font-bold shadow-sm shadow-amber-500/10 flex-shrink-0">
              ⚡
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
                <span>study.io</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-slate-900 dark:text-amber-300 border border-amber-500/30">
                  Focus
                </span>
              </div>
              <div className="hidden sm:block text-[10px] text-slate-600 dark:text-slate-400 font-medium -mt-0.5">Focus & Habit Tracking</div>
            </div>
          </div>

          {/* Navigation Tabs - Hidden on mobile, handled by bottom navigation */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] sm:text-xs">Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] sm:text-xs">Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] sm:text-xs">Analytics</span>
            </button>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-3">

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
              {/* Free Fire Rank Badge Pill - Visible on mobile & desktop */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 cursor-default select-none shadow-sm"
                title={`Ranked Season RP: ${userRank.rp.toLocaleString()} RP (${userRank.fullTitle})`}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                  style={{ backgroundColor: userRank.config.badgeAccent }}
                />
                <span
                  className="text-[10px] sm:text-xs font-black italic tracking-wider uppercase truncate max-w-[75px] sm:max-w-none text-amber-800 dark:text-amber-400"
                >
                  {userRank.fullTitle}
                </span>
                <span className="hidden sm:inline text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                  {userRank.rp.toLocaleString()} RP
                </span>
              </div>

              {/* Streak Badge - Rendered only if streak > 0 */}
              {user.streakDays > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-orange-50 dark:bg-neutral-900/60 border border-orange-200 dark:border-white/[0.08] text-slate-800 dark:text-neutral-300 cursor-default select-none shadow-sm"
                  title={`${user.streakDays} Day Study Streak (+${user.streakDays * 50} XP bonus)`}
                >
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f97316] fill-[#f97316]" />
                  <span className="text-[11px] sm:text-xs font-bold font-mono tabular-nums text-orange-700 dark:text-orange-400">{user.streakDays}d</span>
                </div>
              )}
            </>
          )}

          {/* Native Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm hidden sm:flex items-center justify-center cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors shadow-sm cursor-pointer"
            title="App Settings & Database"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Pill with Dynamic Level & Circular Progress Ring */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all active:scale-[0.98]"
              title={`Level ${effectiveLevel} (${effectiveTitle}) · ${gamification.totalXP} Total XP`}
            >
              {/* Avatar with SVG Circular XP Progress Ring */}
              <div className="relative flex items-center justify-center w-10 h-10">
                <svg className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none" viewBox="0 0 38 38">
                  {/* Background track circle */}
                  <circle
                    cx="19"
                    cy="19"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-800/80 fill-none"
                    strokeWidth="2.5"
                  />
                  {/* Dynamic XP Progress Stroke */}
                  <circle
                    cx="19"
                    cy="19"
                    r={radius}
                    className="stroke-emerald-500 fill-none transition-all duration-500 ease-out"
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
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 ${
                    isStudying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                />
              </div>

              {/* User Identity & Level Display */}
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">
                  {displayName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 font-mono leading-none">
                    Lv. {effectiveLevel}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium leading-tight border border-slate-200 dark:border-transparent">
                    {effectiveTierBadge.icon} {effectiveTitle}
                  </span>
                </div>
              </div>
            </button>

            {/* Interactive User Account Dropdown with Full Gamification Dashboard */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* User Header */}
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[180px]">{displayName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{user.email}</div>
                    </div>
                    <span className="text-base">{effectiveTierBadge.icon}</span>
                  </div>

                  {/* Level & Title Pill */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${effectiveTierBadge.badgeClass}`}>
                      Lv. {effectiveLevel} · {effectiveTitle}
                    </span>
                    <span className="text-amber-500 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                      {user.streakDays}d
                    </span>
                  </div>
                </div>

                {/* Gamification Progress Card */}
                <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      <span>Total XP</span>
                    </span>
                    <span className="text-slate-900 dark:text-white font-extrabold font-mono">
                      {gamification.totalXP.toLocaleString()} XP
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${gamification.progressPercent}%` }}
                    />
                  </div>

                  {/* XP Footnote */}
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{gamification.xpInCurrentLevel} / {gamification.xpNeededForNextLevel} XP</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      {gamification.xpRemaining} XP to Lv. {gamification.level + 1}
                    </span>
                  </div>

                  {/* XP Sources Breakdown */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/60 grid grid-cols-3 gap-1 text-[9px] text-center">
                    <div className="p-1 rounded bg-slate-100 dark:bg-slate-900/60">
                      <div className="text-slate-500 dark:text-slate-400">Focus</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">+{gamification.focusXP}</div>
                    </div>
                    <div className="p-1 rounded bg-slate-100 dark:bg-slate-900/60">
                      <div className="text-slate-500 dark:text-slate-400">Tasks</div>
                      <div className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">+{gamification.todoXP}</div>
                    </div>
                    <div className="p-1 rounded bg-slate-100 dark:bg-slate-900/60">
                      <div className="text-slate-500 dark:text-slate-400">Streak</div>
                      <div className="text-amber-600 dark:text-amber-400 font-bold font-mono">+{gamification.streakXP}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => { onOpenProfile(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Edit Profile & Goals</span>
                  </button>

                  <button
                    onClick={() => { onOpenSettings(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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

    {/* Mobile Sticky Bottom Navigation Bar: 4 Dedicated Tabs */}
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 md:hidden flex justify-around items-center py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 shadow-2xl"
    >
      {/* Tab 1: Timer */}
      <button
        onClick={() => setActiveTab('timer')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-95 cursor-pointer ${
          activeTab === 'timer'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'timer'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Timer className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">Timer</span>
      </button>

      {/* Tab 2: Tasks */}
      <button
        onClick={() => setActiveTab('tasks')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-95 cursor-pointer ${
          activeTab === 'tasks'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'tasks'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">Tasks</span>
      </button>

      {/* Tab 3: Analytics */}
      <button
        onClick={() => setActiveTab('analytics')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all active:scale-95 cursor-pointer ${
          activeTab === 'analytics'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">Analytics</span>
      </button>

      {/* Tab 4: Settings */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
      >
        <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <Settings className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">Settings</span>
      </button>
    </nav>
    </>
  );
}
