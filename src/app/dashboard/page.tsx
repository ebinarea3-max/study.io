'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Home from '../page';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect once auth loading has settled and confirmed unauthenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Prevent premature bounce: show branded loading screen while session is being verified/restored
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

  if (!isAuthenticated) {
    return null;
  }

  return <Home />;
}
