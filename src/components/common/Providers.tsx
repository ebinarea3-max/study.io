'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { StudyProvider } from '../../context/StudyContext';
import { RoomProvider } from '../../context/RoomContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StudyProvider>
        <RoomProvider>
          {children}
          <Toaster position="top-center" />
        </RoomProvider>
      </StudyProvider>
    </AuthProvider>
  );
}
