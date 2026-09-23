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
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { IntroductionAndLogin } from '../components/common/IntroductionAndLogin';
import { LevelUpModal } from '../components/gamification/LevelUpModal';
import { XpFloatingNotification } from '../components/gamification/XpFloatingNotification';
import { RankSettlementModal } from '../components/RankSettlementModal';
import { SeasonRecapBanner } from '../components/gamification/SeasonRecapBanner';
import { TasksOverview } from '../components/todo/TasksOverview';
import { DailyBoostModal } from '../components/common/DailyBoostModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Logo } from '../components/Logo';
import { NavTabType } from '../components/common/Navbar';
import { SwipeTabContainer } from '../components/common/SwipeTabContainer';
import { SettingsTabContent } from '../components/common/SettingsTabContent';
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
      setShowDailyBoost(true);
      try {
        localStorage.removeItem('last_daily_boost_date');
      } catch {}
    }
  }, [isLoading, isAuthenticated]);

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
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refetchSessions]);

  // Loading state while verifying stored session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-slate-100 relative">
        <div className="fixed inset-0 pointer-events-none bg-hud-grid z-0" />
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
    <div className="max-md:h-[100dvh] max-md:overflow-hidden md:min-h-screen w-full md:overflow-y-auto bg-[var(--bg)] text-slate-100 flex flex-col relative selection:bg-[var(--tier-accent)]/30 selection:text-[var(--tier-text-accent)]">
      {/* Drifting Ambient HUD Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-hud-grid z-0" />

      {/* Floating Animated Cheers */}
      <FloatingReactions />

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
      <main
        className={`flex-1 max-w-7xl w-full mx-auto relative z-10 flex flex-col max-md:overflow-hidden md:overflow-visible ${
          activeTab === 'timer'
            ? 'p-0 md:px-6 md:py-4 pb-0 md:pb-4 max-md:overflow-hidden md:overflow-visible'
            : 'px-3.5 sm:px-6 py-5 sm:py-8 pb-24 md:pb-12 overflow-y-auto overscroll-contain'
        }`}
      >
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
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
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

      {/* Level Up Celebratory Modal */}
      {levelUpData && (
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
    </div>
  );
}
