'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Users,
  Crown,
} from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import {
  PREMIUM_GOLD_GRADIENT,
  PREMIUM_GOLD_BORDER,
  PREMIUM_GOLD_GLOW,
} from '../../lib/premium';

import { Logo } from '../Logo';
import { getRankTier } from '../../lib/ranks';
import { getTierBadge, getLevelTitle } from '../../lib/gamification';
import { useRankTheme } from '../../hooks/useRankTheme';
import { TierIcon } from './TierIcon';
import { RankCrestBadge } from './RankCrestBadge';
import Image from 'next/image';
import { getRankIconPath } from '../../utils/rankIcons';
import { FacetedTrophyIcon, FacetedGearIcon } from './GeometricIcons';

export type NavTabType = 'timer' | 'tasks' | 'analytics' | 'leaderboard' | 'settings' | 'rooms';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { isStudying, setIsFocusModeOpen, gamification, sessions } = useStudy();
  const { theme, userRank, totalRP } = useRankTheme();
  const { isPremium } = usePremium();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPersonaMenu(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowPersonaMenu(false);
      }
    }

    if (showPersonaMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPersonaMenu]);

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

  const effectiveAvatar = useMemo(() => {
    return (
      user?.avatarUrl ||
      user?.user_metadata?.avatar_url ||
      (user as any)?.user_metadata?.picture ||
      ''
    );
  }, [user?.avatarUrl, user?.user_metadata?.avatar_url, (user as any)?.user_metadata?.picture]);

  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    setImageError(false);
  }, [effectiveAvatar]);

  // Prevent UI flickering on window focus/tab switch by caching the resolved database name
  const [cachedName, setCachedName] = useState<string>('');

  useEffect(() => {
    // If we get a valid database profile name (username or name), lock it in.
    if (user?.username || user?.name) {
      setCachedName(user.username || user.name || '');
    }
    // Only use Google metadata if we have NO cached name yet.
    else if (!cachedName && user?.user_metadata?.full_name) {
      const metaName = user.user_metadata.full_name as string;
      setCachedName(metaName.includes('(') ? metaName.split(' (')[0].trim() : metaName);
    } else if (!cachedName && user?.displayName) {
      setCachedName(user.displayName);
    }
  }, [user, cachedName]);

  const displayName = useMemo(() => {
    return (
      cachedName ||
      user?.displayName ||
      user?.user_metadata?.full_name ||
      (user as any)?.user_metadata?.name ||
      (user as any)?.user_metadata?.display_name ||
      (user?.email ? user.email.split('@')[0] : 'Focus Scholar')
    );
  }, [
    cachedName,
    user?.displayName,
    user?.user_metadata?.full_name,
    (user as any)?.user_metadata?.name,
    (user as any)?.user_metadata?.display_name,
  ]);

  // Prevent level/title flicker by falling back to stored user_metadata / user profile
  const effectiveLevel = gamification.level || (user?.user_metadata as any)?.level || user?.level || 1;
  const effectiveTitle = gamification.title || (user?.user_metadata as any)?.levelTitle || user?.levelTitle || getLevelTitle(effectiveLevel);
  const effectiveTierBadge = gamification.tierBadge || getTierBadge(effectiveLevel);

  // SVG Progress Ring calculations (radius 18, circumference 113.1)
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gamification.progressPercent / 100) * circumference;

  const { liveSeasonRp, liveRank } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const currentMonthSeconds = (sessions || [])
      .filter((s: any) => {
        const sessionDate = new Date(s.startTime || s.started_at || s.created_at || s.date).getTime();
        return sessionDate >= startOfMonth;
      })
      .reduce((total: number, s: any) => total + (s.duration || s.durationSeconds || s.duration_seconds || 0), 0);

    const carryoverRp = (user as any)?.carryover_rp || (user as any)?.carryoverRp || 0;
    const computedRp = carryoverRp + Math.floor(currentMonthSeconds / 60);
    return { liveSeasonRp: computedRp, liveRank: getRankTier(computedRp) };
  }, [sessions, (user as any)?.carryover_rp, (user as any)?.carryoverRp]);

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer select-none group" onClick={() => setActiveTab('timer')}>
            <Logo className="w-7 h-7 transition-transform group-hover:scale-105" />
            <div className="flex flex-col justify-center">
              <div className="text-sm sm:text-base font-hud font-extrabold tracking-wider text-[var(--text)] flex items-center gap-1.5 leading-none">
                <span>STUDY.IO</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Desktop HUD strip */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all cursor-pointer ${
                activeTab === 'timer'
                  ? 'bg-fg/[0.08] [[data-theme="paper"]_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme="paper"]_&]:border-[var(--border-strong)] text-[var(--text)] font-semibold shadow-card'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.04] border border-transparent'
              }`}
            >
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>TIMER</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-fg/[0.08] [[data-theme="paper"]_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme="paper"]_&]:border-[var(--border-strong)] text-[var(--text)] font-semibold shadow-card'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.04] border border-transparent'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>TASKS</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-fg/[0.08] [[data-theme="paper"]_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme="paper"]_&]:border-[var(--border-strong)] text-[var(--text)] font-semibold shadow-card'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.04] border border-transparent'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>STATS</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-fg/[0.08] [[data-theme="paper"]_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme="paper"]_&]:border-[var(--border-strong)] text-[var(--text)] font-semibold shadow-card'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.04] border border-transparent'
              }`}
            >
              <FacetedTrophyIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>LEADERBOARD</span>
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-fg/[0.08] [[data-theme="paper"]_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme="paper"]_&]:border-[var(--border-strong)] text-[var(--text)] font-semibold shadow-card'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/[0.04] border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>ROOMS</span>
            </button>

          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          {/* Premium Header Star Link (Free users) or Star Badge (Premium users) */}
          {!isPremium ? (
            <Link
              href="/premium"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider uppercase text-[#1A1405] hover:opacity-95 active:scale-95 transition-all shadow-sm select-none flex-shrink-0"
              style={{
                background: PREMIUM_GOLD_GRADIENT,
                boxShadow: `0 0 10px ${PREMIUM_GOLD_GLOW}`,
              }}
              title="See everything in Premium"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">PREMIUM</span>
            </Link>
          ) : (
            <Link
              href="/premium"
              className="inline-flex items-center justify-center h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 select-none flex-shrink-0"
              style={{
                background: 'rgba(230, 193, 90, 0.12)',
                borderColor: PREMIUM_GOLD_BORDER,
                boxShadow: `0 0 8px ${PREMIUM_GOLD_GLOW}`,
              }}
              title="Premium Active — Click to view membership status"
              aria-label="Premium Active"
            >
              <Crown className="w-3.5 h-3.5 text-[#E6C15A] fill-[#E6C15A]" />
              <span className="hidden md:inline text-[10px] font-hud font-bold tracking-wider text-[#E6C15A] ml-1 uppercase">
                PRO
              </span>
            </Link>
          )}

          {/* Sign In Button (if not authenticated) */}
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-[var(--accent-contrast)] font-bold text-xs transition-all hover:scale-105 active:scale-95 flex-shrink-0 font-hud tracking-wider"
              style={{ background: 'var(--accent)', boxShadow: `0 0 14px ${theme.glow}` }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              {/* Streak Pill */}
              <div
                className="flex items-center h-8 sm:h-9 px-2 sm:px-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-card cursor-default select-none rounded-xl gap-1 sm:gap-1.5"
                title={`${user?.streakDays || 0} Day Streak`}
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-xs font-bold font-mono text-[var(--text)]">{user?.streakDays || 0}</span>
              </div>

              {/* Rank Status Pill */}
              {isLoading && (!user || user.id.startsWith('user-scholar') || user.id === 'guest') ? (
                <div className="relative flex items-center h-8 sm:h-9 w-24 sm:w-28 bg-[var(--surface)] border border-[var(--border)] shadow-card rounded-xl animate-pulse overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-fg/10 ml-1.5"></div>
                  <div className="w-10 h-3 bg-fg/10 ml-2 rounded"></div>
                </div>
              ) : (
                <div
                  className="relative flex items-center h-8 sm:h-9 pl-1 pr-3 sm:pr-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-card cursor-default select-none rounded-xl"
                  title={`Ranked Season RP: ${liveSeasonRp.toLocaleString()} RP (${liveRank.name.toUpperCase()})`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <RankCrestBadge
                      tier={liveRank.tier}
                      division={liveRank.division}
                      size={36}
                      className="-ml-3"
                    />
                    <span
                      className="text-xs font-bold tracking-wider font-hud uppercase truncate max-w-[85px] sm:max-w-none"
                      style={{ color: 'var(--tier-accent-text)' }}
                    >
                      {liveRank.name.toUpperCase()}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-[var(--text-dim)] font-mono ml-1">
                      {liveSeasonRp.toLocaleString()} RP
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Native Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-dim)] hover:text-[var(--text)] shadow-card transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* User Profile Pill with Dynamic Level & Circular Progress Ring */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-fg/5 border border-[var(--border)] shadow-card transition-all active:scale-[0.98]"
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
                    stroke="rgb(var(--fg) / 0.14)"
                    fill="none"
                    strokeWidth="2.5"
                  />
                  {/* Dynamic XP Progress Stroke */}
                  <circle
                    cx="19"
                    cy="19"
                    r={radius}
                    className="fill-none transition-all duration-500 ease-out"
                    stroke="var(--tier-accent)"
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Avatar */}
                <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex items-center justify-center relative shadow-inner bg-[var(--surface-2)] z-10">
                  {effectiveAvatar && !imageError ? (
                    <img
                      src={effectiveAvatar}
                      alt={displayName || 'User Avatar'}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px] uppercase">
                      {(displayName || user?.email || 'U').charAt(0)}
                    </div>
                  )}
                </div>

                {/* Online/Studying status pulse */}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)] ${
                    isStudying ? 'bg-primary animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                />
              </div>

              {/* User Identity & Level Display */}
              <div className="text-left hidden lg:flex lg:flex-col lg:justify-center">
                <div className="flex items-baseline gap-1.5">
                  <div className="text-[13px] font-bold text-[var(--text)] leading-tight truncate block max-w-[130px]">
                    {displayName}
                  </div>
                  {isPremium && (
                    <span title="Premium Scholar" className="flex items-center self-center flex-shrink-0">
                      <Crown
                        className="w-3 h-3 text-[#E6C15A] fill-[#E6C15A]"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                  {user?.username && (
                    <div className="text-[10px] text-[var(--text-dim)] font-mono truncate max-w-[80px]">
                      @{user.username}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold font-mono leading-none" style={{ color: 'var(--tier-accent-text)' }}>
                    Lv. {effectiveLevel}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-dim)] font-medium leading-tight border border-[var(--border)]">
                    {effectiveTierBadge.icon} {effectiveTitle}
                  </span>
                </div>
              </div>
            </button>

            {/* Interactive User Account Dropdown with Full Gamification Dashboard */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-[var(--surface)] backdrop-blur-2xl border border-[var(--border)] shadow-card p-4 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Subtle ambient accent glow */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
                  style={{ backgroundColor: 'var(--accent)' }}
                />

                {/* User Header */}
                <div className="pb-3 border-b border-fg/[0.08] relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-sm text-[var(--text)] truncate flex items-center gap-1.5">
                        <span className="truncate">{displayName}</span>
                        {isPremium && (
                          <span title="Premium Scholar" className="flex items-center flex-shrink-0">
                            <Crown
                              className="w-3.5 h-3.5 text-[#E6C15A] fill-[#E6C15A]"
                              aria-hidden="true"
                            />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-dim)] truncate mt-0.5">
                        {user?.username ? `@${user.username} • ` : ''}{user?.email}
                      </div>
                    </div>
                    <span className="text-base flex-shrink-0">{effectiveTierBadge.icon}</span>
                  </div>

                  {/* Level & Title Pill + Streak */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-hud font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dim)]">
                      Lv. {effectiveLevel} · {effectiveTitle}
                    </span>
                    <span className="text-amber-400 font-mono font-bold text-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {user.streakDays}d
                    </span>
                  </div>
                </div>

                {/* Gamification Progress Card */}
                <div className="my-3 p-3 rounded-xl bg-fg/[0.03] backdrop-blur-md border border-fg/[0.08] relative z-10">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[var(--text-dim)] font-hud text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Total XP</span>
                    </span>
                    <span className="text-[var(--text)] font-extrabold font-mono text-xs">
                      {gamification.totalXP.toLocaleString()} XP
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-fg/[0.08] overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ background: 'var(--tier-gradient)', width: `${gamification.progressPercent}%` }}
                    />
                  </div>

                  {/* XP Footnote */}
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[var(--text-dim)]">
                    <span>{gamification.xpInCurrentLevel} / {gamification.xpNeededForNextLevel} XP</span>
                    <span className="font-semibold font-mono" style={{ color: theme.accent }}>
                      {gamification.xpRemaining} XP to Lv. {gamification.level + 1}
                    </span>
                  </div>

                  {/* XP Sources Breakdown */}
                  <div className="mt-2.5 pt-2 border-t border-fg/[0.06] grid grid-cols-3 gap-1.5 text-[9px] text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-fg/[0.02] border border-fg/[0.05]">
                      <div className="text-[var(--text-dim)] text-[10px]">Focus</div>
                      <div className="font-bold mt-0.5" style={{ color: theme.accent }}>+{gamification.focusXP}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-fg/[0.02] border border-fg/[0.05]">
                      <div className="text-[var(--text-dim)] text-[10px]">Tasks</div>
                      <div className="text-cyan-400 font-bold mt-0.5">+{gamification.todoXP}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-fg/[0.02] border border-fg/[0.05]">
                      <div className="text-[var(--text-dim)] text-[10px]">Streak</div>
                      <div className="text-amber-400 font-bold mt-0.5">+{gamification.streakXP}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1 relative z-10">
                  <button
                    onClick={() => { onOpenProfile(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-hud font-semibold tracking-wider text-[var(--text)] hover:bg-fg/[0.06] border border-transparent hover:border-fg/10 transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99]"
                  >
                    <User className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                    <span>EDIT PROFILE &amp; GOALS</span>
                  </button>

                  <button
                    onClick={() => { onOpenSettings(); setShowPersonaMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-hud font-semibold tracking-wider text-[var(--text)] hover:bg-fg/[0.06] border border-transparent hover:border-fg/10 transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99]"
                  >
                    <FacetedGearIcon className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                    <span>SETTINGS &amp; PREFERENCES</span>
                  </button>

                  <Link
                    href="/premium"
                    onClick={() => setShowPersonaMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-hud font-semibold tracking-wider text-[#E6C15A] hover:bg-[#E6C15A]/10 border border-transparent hover:border-[#E6C15A]/20 transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99]"
                  >
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>{isPremium ? 'PREMIUM MEMBERSHIP' : 'EXPLORE PREMIUM'}</span>
                  </Link>

                  {!isAuthenticated ? (
                    <button
                      onClick={() => { onOpenAuth(); setShowPersonaMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-hud font-semibold tracking-wider text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>SIGN IN / SWITCH ACCOUNT</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { logout(); setShowPersonaMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-hud font-semibold tracking-wider text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>SIGN OUT</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Floating Dock Navigation: Full-width Pill with Sliding Tier Indicator */}
    <div className="fixed bottom-5 sm:bottom-6 left-0 right-0 z-50 md:hidden flex justify-center px-3 pb-[env(safe-area-inset-bottom,0px)] pointer-events-none">
      <nav
        aria-label="Mobile Floating Dock Navigation"
        className="w-full max-w-md bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-full p-1 shadow-card transition-all pointer-events-auto"
      >
      <div className="relative flex items-center justify-between w-full">
        {/* Sliding active indicator pill in Tier Accent */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-fg/[0.14] border border-fg/20 shadow-sm"
          style={{
            width: '20%',
            transform: `translateX(${activeTab === 'timer' ? '0%' : activeTab === 'tasks' ? '100%' : activeTab === 'analytics' ? '200%' : activeTab === 'leaderboard' ? '300%' : '400%' })`
          }}
        />

        {/* Tab 1: Timer */}
        <button
          onClick={() => setActiveTab('timer')}
          className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'timer'
              ? 'text-[var(--text)] font-bold drop-shadow-sm'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          aria-label="Timer"
        >
          <Timer className="w-4 h-4" />
          <span className="text-[8.5px] font-hud font-bold tracking-wider uppercase mt-0.5">Timer</span>
        </button>

        {/* Tab 2: Tasks */}
        <button
          onClick={() => setActiveTab('tasks')}
          className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'tasks'
              ? 'text-[var(--text)] font-bold drop-shadow-sm'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          aria-label="Tasks"
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-[8.5px] font-hud font-bold tracking-wider uppercase mt-0.5">Tasks</span>
        </button>

        {/* Tab 3: Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-[var(--text)] font-bold drop-shadow-sm'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          aria-label="Analytics"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[8.5px] font-hud font-bold tracking-wider uppercase mt-0.5">Stats</span>
        </button>

        {/* Tab 4: Leaderboard */}
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'text-[var(--text)] font-bold drop-shadow-sm'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          aria-label="Leaderboard"
        >
          <FacetedTrophyIcon className="w-4 h-4" />
          <span className="text-[8.5px] font-hud font-bold tracking-wider uppercase mt-0.5">Rankings</span>
        </button>

        {/* Tab 5: Rooms */}
        <button
          onClick={() => setActiveTab('rooms')}
          className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 rounded-full transition-all active:scale-95 cursor-pointer ${
            activeTab === 'rooms'
              ? 'text-[var(--text)] font-bold drop-shadow-sm'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          aria-label="Rooms"
        >
          <Users className="w-4 h-4" />
          <span className="text-[8.5px] font-hud font-bold tracking-wider uppercase mt-0.5">Rooms</span>
        </button>
      </div>
      </nav>
    </div>
    </>
  );
}

