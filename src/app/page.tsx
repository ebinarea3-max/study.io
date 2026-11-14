'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabase';
import { useStudy } from '../context/StudyContext';
import { Navbar } from '../components/common/Navbar';
import { AuthModal } from '../components/common/AuthModal';
import { ProfileModal } from '../components/common/ProfileModal';
import { SettingsModal } from '../components/common/SettingsModal';
import { StudyTimer } from '../components/timer/StudyTimer';
import { FocusModeModal } from '../components/timer/FocusModeModal';
import { IdleCheckModal } from '../components/timer/IdleCheckModal';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { IntroductionAndLogin } from '../components/common/IntroductionAndLogin';
import { LevelUpModal } from '../components/gamification/LevelUpModal';
import { XpFloatingNotification } from '../components/gamification/XpFloatingNotification';
import { RankSettlementModal } from '../components/RankSettlementModal';
import { SeasonRecapBanner } from '../components/gamification/SeasonRecapBanner';
import { SeasonResetAlertModal } from '../components/gamification/SeasonResetAlertModal';
import { TasksOverview } from '../components/todo/TasksOverview';
import { DailyBoostModal } from '../components/common/DailyBoostModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Logo } from '../components/Logo';
import { NavTabType } from '../components/common/Navbar';
import { SwipeTabContainer } from '../components/common/SwipeTabContainer';
import { SettingsTabContent } from '../components/common/SettingsTabContent';
import { MonthlyLeaderboard } from '../components/leaderboard/MonthlyLeaderboard';
import StudyRoomsTab from '../components/rooms/StudyRoomsTab';
import { useRankTheme } from '../hooks/useRankTheme';
import { DevRankSwitcher } from '../components/common/DevRankSwitcher';
import { useStudyMode } from '../context/StudyModeContext';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { needsOnboarding } = useStudyMode();
  const [isNativeApp, setIsNativeApp] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        Capacitor.isNativePlatform() ||
        Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
        Boolean(navigator?.userAgent && (
          navigator.userAgent.includes('StudyIoNativeApp') ||
          /StudyIoNativeApp/i.test(navigator.userAgent)
        ))
      );
    }
    return false;
  });
  useRankTheme(); // Hydrate CSS custom properties globally for current session

  // Detect Capacitor native app user agent or runtime
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNativeApp(
        Capacitor.isNativePlatform() ||
        Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
        Boolean(navigator?.userAgent && (
          navigator.userAgent.includes('StudyIoNativeApp') ||
          /StudyIoNativeApp/i.test(navigator.userAgent)
        ))
      );
    }
  }, []);

  // Supabase session and auth state change listener: automatically redirect to /dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && !pathname.startsWith('/dashboard')) {
      router.push('/dashboard');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !pathname.startsWith('/dashboard')) {
        router.push('/dashboard');
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || session) && !pathname.startsWith('/dashboard')) {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated, isLoading, pathname, router]);

  const {
    refetchSessions,
    levelUpData,
    dismissLevelUpModal,
    lastXpEarned,
    dismissXpNotification,
    settlementData,
    dismissRankSettlement,
    seasonRecap,
    dismissSeasonRecap,
    seasonResetAlert,
    dismissSeasonResetAlert,
    isFocusModeOpen,
  } = useStudy();

  // Navigation tabs: Timer, Tasks, Analytics, Leaderboard, Rooms, Settings
  const [activeTab, setActiveTab] = useState<NavTabType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab');
        if (t && ['timer', 'tasks', 'analytics', 'leaderboard', 'settings', 'rooms'].includes(t)) {
          return t as NavTabType;
        }
      } catch {}
    }
    return 'timer';
  });

  const handleTabChange = useCallback((newTab: NavTabType) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newTab);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  }, []);

  const lastTabRefetchRef = useRef<number>(Date.now());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkTab = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab');
        if (t && ['timer', 'tasks', 'analytics', 'leaderboard', 'settings', 'rooms'].includes(t)) {
          setActiveTab(t as NavTabType);
        }
      } catch {}
    };
    checkTab();
    window.addEventListener('popstate', checkTab);
    return () => window.removeEventListener('popstate', checkTab);
  }, []);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDailyBoost, setShowDailyBoost] = useState(false);
  const hasTriggeredBoostRef = useRef(false);

  // Today's Boost Welcome Modal (Trigger on every session / sign-in)
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      hasTriggeredBoostRef.current = false;
      return;
    }

    if (isAuthenticated && !hasTriggeredBoostRef.current) {
      hasTriggeredBoostRef.current = true;
      if (user && user.is_onboarded !== true) {
        setIsProfileOpen(true);
      } else {
        setShowDailyBoost(true);
      }
      try {
        localStorage.removeItem('last_daily_boost_date');
      } catch { }
    }
  }, [isLoading, isAuthenticated, user]);

  const handleDismissDailyBoost = useCallback(() => {
    setShowDailyBoost(false);
    setActiveTab('timer');
  }, []);

  // Re-fetch sessions automatically whenever the user navigates back to Dashboard or switches tabs (throttled)
  useEffect(() => {
    if (isAuthenticated) {
      const now = Date.now();
      if (now - lastTabRefetchRef.current > 30000) {
        lastTabRefetchRef.current = now;
        refetchSessions();
      }
    }
  }, [activeTab, isAuthenticated, refetchSessions]);

  // Re-fetch sessions when window or tab gains focus
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      refetchSessions();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchSessions();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail as NavTabType);
      }
    };
    window.addEventListener('switch_tab', handleSwitchTab);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('switch_tab', handleSwitchTab);
    };
  }, [isAuthenticated, refetchSessions]);

  // Track if initial boot has finished so we don't show the full-screen loader on re-fetches
  const hasInitialBootCompletedRef = useRef(false);
  if (!isLoading) {
    hasInitialBootCompletedRef.current = true;
  }

  // Loading state while verifying stored session
  if (isLoading && !hasInitialBootCompletedRef.current) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-slate-100 relative">
        <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
        <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 animate-pulse">
            <Logo className="w-14 h-14" />
          </div>
          <div className="text-sm font-hud font-bold text-slate-400 tracking-widest uppercase">
            INITIALIZING STUDY.IO TELEMETRY...
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: App cannot be used without logging in!
  if (!isAuthenticated) {
    return <IntroductionAndLogin />;
  }

  // Authenticated: Full StudyPulse focus dashboard
  return (
    <div className={`w-full bg-[var(--bg)] bg-dot-grid text-[var(--text)] flex flex-col relative selection:bg-[var(--accent)]/30 selection:text-[var(--accent)] ${
      activeTab === "timer"
        ? "h-[100dvh] overflow-hidden pb-0"
        : activeTab === "rooms"
        ? "h-[100dvh] md:h-screen overflow-hidden pb-0 md:pb-0"
        : "min-h-screen pb-28 md:pb-28"
    }`}>
      {/* Subtle Background Dot Grid Texture */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />

      {/* Drifting Ambient HUD Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />

      {/* 4-Hour Idle Alarm Check */}
      <IdleCheckModal />

      {/* Floating XP Celebrations Toast */}
      <XpFloatingNotification
        notification={lastXpEarned}
        onDismiss={dismissXpNotification}
      />

      {/* Full Dashboard Content (hidden during Focus Mode for zero background jank) */}
      <div
        className={`w-full flex flex-col items-center flex-1 ${
          activeTab === 'rooms'
            ? 'h-full min-h-0 overflow-hidden'
            : activeTab === 'timer'
            ? 'h-full min-h-0 overflow-hidden'
            : ''
        }`}
        style={{ display: isFocusModeOpen ? 'none' : undefined }}
      >
        {/* Top Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Monthly Season Settlement Recap Banner */}
        {seasonRecap && (
          <SeasonRecapBanner
            recap={seasonRecap}
            onDismiss={dismissSeasonRecap}
          />
        )}

        {/* Main Content Area with Mobile Swipe Navigation */}
        <main className={`w-full flex flex-col items-center relative z-10 px-0 md:px-8 ${
          activeTab === "timer" 
            ? "flex-1 h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] overflow-hidden flex flex-col items-center justify-center pt-1 md:pt-2 px-3 sm:px-4 md:px-0 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-2" 
            : activeTab === "rooms"
            ? "flex-1 min-h-0 w-full overflow-hidden pt-0 px-0 h-full"
            : "min-h-screen pt-3.5 px-3 sm:px-4 md:px-0"
        }`}>
          <SwipeTabContainer activeTab={activeTab} onChangeTab={handleTabChange}>
            {{
              timer: (
                <ErrorBoundary fallbackTitle="Focus Timer">
                  <StudyTimer />
                </ErrorBoundary>
              ),
              tasks: (
                <ErrorBoundary fallbackTitle="Tasks Overview">
                  <TasksOverview />
                </ErrorBoundary>
              ),
              analytics: (
                <ErrorBoundary fallbackTitle="Analytics Dashboard">
                  <AnalyticsDashboard
                    onStartSession={() => setActiveTab('timer')}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                </ErrorBoundary>
              ),
              leaderboard: (
                <ErrorBoundary fallbackTitle="Monthly Leaderboard">
                  <MonthlyLeaderboard isEmbedded isActiveTab={activeTab === 'leaderboard'} />
                </ErrorBoundary>
              ),
              rooms: (
                <ErrorBoundary fallbackTitle="Study Rooms">
                  <StudyRoomsTab onBackToDashboard={() => setActiveTab('timer')} isActiveTab={activeTab === 'rooms'} />
                </ErrorBoundary>
              ),
              settings: (
                <ErrorBoundary fallbackTitle="Settings & Preferences">
                  <SettingsTabContent />
                </ErrorBoundary>
              ),
            }}
          </SwipeTabContainer>
        </main>
      </div>

      {/* Modals & Celebrations */}
      <ErrorBoundary fallbackTitle="Authentication">
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Profile">
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Settings">
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Focus Mode">
        <FocusModeModal />
      </ErrorBoundary>

      {/* Onboarding Flow (Study Mode Selection -> Welcome Intro Walkthrough) */}
      {!isProfileOpen && (
        <OnboardingFlow />
      )}

      {/* Free Fire Post-Match Rank Settlement Fullscreen Screen */}
      <RankSettlementModal
        isOpen={Boolean(settlementData)}
        data={settlementData}
        onContinue={dismissRankSettlement}
      />

      {/* Level Up Celebratory Modal */}
      {levelUpData && !settlementData && (
        <LevelUpModal
          isOpen={Boolean(levelUpData)}
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          title={levelUpData.title}
          onClose={dismissLevelUpModal}
        />
      )}

      {/* Daily Boost Welcome Modal (Once per day) */}
      <DailyBoostModal
        isOpen={showDailyBoost}
        onClose={handleDismissDailyBoost}
        onStartFocusing={handleDismissDailyBoost}
        streakDays={user?.streakDays ?? 0}
        dailyGoalHours={user?.dailyGoalHours ?? 3}
      />

      {/* Monthly Season Soft-Reset Alert Card Modal */}
      <SeasonResetAlertModal
        isOpen={Boolean(seasonResetAlert)}
        data={seasonResetAlert}
        onDismiss={dismissSeasonResetAlert}
      />

      {/* Development Rank Preview Floating HUD */}
      {process.env.NODE_ENV !== 'production' && <DevRankSwitcher />}
    </div>
  );
}



