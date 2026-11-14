'use client';

import React, { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { PremiumProvider } from '../../context/PremiumContext';
import { StudyModeProvider } from '../../context/StudyModeContext';
import { IntroProvider } from '../../context/IntroContext';
import { StudyProvider } from '../../context/StudyContext';
import { FocusGoalProvider } from '../../context/FocusGoalContext';
import { TimetableProvider } from '../../context/TimetableContext';
import { Toaster } from 'react-hot-toast';
import { TimerSWBridge } from './TimerSWBridge';
import { RankBadgePreloader } from './RankBadgePreloader';
import { NativeFeelBridge } from './NativeFeelBridge';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <PremiumProvider>
          <ThemeProvider>
            <StudyModeProvider>
              <IntroProvider>
                <StudyProvider>
                  <FocusGoalProvider>
                    <TimetableProvider>
                      {/* Bridge timer state → Service Worker for background tracking & notifications */}
                      <TimerSWBridge />
                      {/* Asset preloading for instant rank badge rendering */}
                      <RankBadgePreloader />
                      {/* Native Android StatusBar, back button & touch bridge */}
                      <NativeFeelBridge />
                      {children}
                    </TimetableProvider>
                  </FocusGoalProvider>
                  <Toaster 
                  position="top-center" 
                  toastOptions={{
                    style: {
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                      fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '500',
                      letterSpacing: '0.02em',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10B981',
                        secondary: 'var(--surface)',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: 'var(--surface)',
                      },
                    },
                  }}
                />
              </StudyProvider>
            </IntroProvider>
          </StudyModeProvider>
          </ThemeProvider>
        </PremiumProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

