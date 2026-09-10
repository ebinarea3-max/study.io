'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { AuthModal } from '../components/common/AuthModal';
import { ProfileModal } from '../components/common/ProfileModal';
import { SettingsModal } from '../components/common/SettingsModal';
import { FloatingReactions } from '../components/common/FloatingReactions';
import { StudyTimer } from '../components/timer/StudyTimer';
import { FocusModeModal } from '../components/timer/FocusModeModal';
import { StudyRoomGrid } from '../components/rooms/StudyRoomGrid';
import { DailyTodoList } from '../components/todo/DailyTodoList';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { IntroductionAndLogin } from '../components/common/IntroductionAndLogin';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'timer' | 'room' | 'todo' | 'analytics'>('timer');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Loading state while verifying stored session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C15] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-2xl text-slate-950 shadow-xl shadow-emerald-500/25 animate-pulse mb-4">
          ⚡
        </div>
        <div className="text-sm font-bold text-slate-400 tracking-wide">Loading study.io...</div>
      </div>
    );
  }

  // Not authenticated: App cannot be used without logging in!
  if (!isAuthenticated) {
    return <IntroductionAndLogin />;
  }

  // Authenticated: Full StudyPulse focus dashboard
  return (
    <div className="min-h-screen bg-[#080C15] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Floating Animated Cheers */}
      <FloatingReactions />

      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'timer' && <StudyTimer />}
        {activeTab === 'room' && <StudyRoomGrid />}
        {activeTab === 'todo' && <DailyTodoList />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <FocusModeModal />
    </div>
  );
}
