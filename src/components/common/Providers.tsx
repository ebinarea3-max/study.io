'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { StudyProvider } from '../../context/StudyContext';
import { RoomProvider } from '../../context/RoomContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudyProvider>
          <RoomProvider>
            {children}
          </RoomProvider>
        </StudyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
