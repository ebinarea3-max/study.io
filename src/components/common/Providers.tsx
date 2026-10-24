'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { PremiumProvider } from '../../context/PremiumContext';
import { StudyProvider } from '../../context/StudyContext';
import { FocusGoalProvider } from '../../context/FocusGoalContext';
import { Toaster } from 'react-hot-toast';
import { TimerSWBridge } from './TimerSWBridge';
import { RankBadgePreloader } from './RankBadgePreloader';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PremiumProvider>
        <ThemeProvider>
          <StudyProvider>
            <FocusGoalProvider>
              {/* Bridge timer state → Service Worker for background tracking & notifications */}
              <TimerSWBridge />
              {/* Asset preloading for instant rank badge rendering */}
              <RankBadgePreloader />
              {children}
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
        </ThemeProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}

