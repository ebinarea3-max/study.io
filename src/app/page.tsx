'use client';

import React, { useState, useEffect } from 'react';
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

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
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

  // Navigation tabs: Rooms removed, strictly Home (timer) and Analytics
  const [activeTab, setActiveTab] = useState<'timer' | 'analytics'>('timer');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center text-slate-100 relative">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] z-0" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-2xl text-slate-950 shadow-xl shadow-emerald-500/25 animate-pulse mb-4">
            ⚡
          </div>
          <div className="text-sm font-bold text-slate-400 tracking-wide">Loading study.io...</div>
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
    <div className="min-h-screen bg-[#090A0C] text-slate-100 flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle Developer-grade Dot Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      {/* Floating Animated Cheers */}
      <FloatingReactions />

      {/* Floating XP Celebrations Toast */}
      <XpFloatingNotification
        notification={lastXpEarned}
        onDismiss={dismissXpNotification}
      />

      {/* Top Navigation Bar (Rooms removed) */}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {activeTab === 'timer' && <StudyTimer />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Modals & Celebrations */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <FocusModeModal />

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
    </div>
  );
}
