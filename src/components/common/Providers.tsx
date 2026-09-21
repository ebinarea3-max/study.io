'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { StudyProvider } from '../../context/StudyContext';
import { RoomProvider } from '../../context/RoomContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StudyProvider>
        <RoomProvider>
          {children}
        </RoomProvider>
      </StudyProvider>
    </AuthProvider>
  );
}
