'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { Navbar } from '../components/common/Navbar';
import { AuthModal } from '../components/common/AuthModal';
import { ProfileModal } from '../components/common/ProfileModal';
import { SettingsModal } from '../components/common/SettingsModal';
import { FloatingReactions } from '../components/common/FloatingReactions';
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
import { UpdateBannerModal } from '../components/common/UpdateBannerModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Logo } from '../components/Logo';
import { NavTabType } from '../components/common/Navbar';
import { SwipeTabContainer } from '../components/common/SwipeTabContainer';
import { SettingsTabContent } from '../components/common/SettingsTabContent';
import { MonthlyLeaderboard } from '../components/leaderboard/MonthlyLeaderboard';
import { useRankTheme } from '../hooks/useRankTheme';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  useRankTheme(); // Hydrate CSS custom properties globally for current session

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
  } = useStudy();

  // Navigation tabs: Timer, Tasks, Analytics, and Settings
  const [activeTab, setActiveTab] = useState<NavTabType>('timer');
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

  // Re-fetch sessions automatically whenever the user navigates back to Dashboard or switches tabs
  useEffect(() => {
    if (isAuthenticated) {
      refetchSessions();
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
    <div className={`w-full bg-[#07090e] bg-dot-grid text-slate-100 flex flex-col relative selection:bg-amber-500/30 selection:text-amber-400 px-4 md:px-8 ${activeTab === "timer" ? "h-[100dvh] overflow-hidden md:min-h-screen md:h-auto md:overflow-y-auto pb-28" : "min-h-screen overflow-y-auto pb-28"}`}>
      {/* Subtle Background Dot Grid Texture */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />

      {/* Drifting Ambient HUD Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />

      {/* Floating Animated Cheers */}
      <FloatingReactions />

      {/* 4-Hour Idle Alarm Check */}
      <IdleCheckModal />

      {/* Floating XP Celebrations Toast */}
      <XpFloatingNotification
        notification={lastXpEarned}
        onDismiss={dismissXpNotification}
      />

      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
      <main className={`w-full flex flex-col items-center pt-3.5 px-4 md:px-8 relative z-10 ${activeTab === "timer" ? "h-full md:min-h-screen" : "min-h-screen"}`}>
        <SwipeTabContainer activeTab={activeTab} onChangeTab={setActiveTab}>
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
                <AnalyticsDashboard onStartSession={() => setActiveTab('timer')} />
              </ErrorBoundary>
            ),
            leaderboard: (
              <ErrorBoundary fallbackTitle="Monthly Leaderboard">
                <MonthlyLeaderboard isEmbedded isActiveTab={activeTab === 'leaderboard'} />
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

      {/* Free Fire Post-Match Rank Settlement Fullscreen Screen */}
      <RankSettlementModal
        isOpen={Boolean(settlementData)}
        data={settlementData}
        onContinue={dismissRankSettlement}
      />

      {/* Update Notification Banner */}
      <UpdateBannerModal />

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
    </div>
  );
}



