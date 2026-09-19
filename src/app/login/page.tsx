'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { IntroductionAndLogin } from '../../components/common/IntroductionAndLogin';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C15] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-2xl text-slate-950 shadow-xl shadow-emerald-500/25 animate-pulse mb-4">
          ⚡
        </div>
        <div className="text-sm font-bold text-slate-400">Loading study.io...</div>
      </div>
    );
  }

  return <IntroductionAndLogin />;
}
