'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { StudyProvider } from '../../context/StudyContext';
import { RoomProvider } from '../../context/RoomContext';
import { Toaster } from 'react-hot-toast';
import { TimerSWBridge } from './TimerSWBridge';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StudyProvider>
        <RoomProvider>
          {/* Bridge timer state → Service Worker for background tracking & notifications */}
          <TimerSWBridge />
          {children}
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                background: '#0F172A', // Slate 900
                color: '#F8FAFC', // Slate 50
                border: '1px solid #1E293B', // Slate 800
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                letterSpacing: '0.02em',
              },
              success: {
                iconTheme: {
                  primary: '#10B981', // Emerald 500
                  secondary: '#0F172A',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444', // Red 500
                  secondary: '#0F172A',
                },
              },
            }}
          />
        </RoomProvider>
      </StudyProvider>
    </AuthProvider>
  );
}

