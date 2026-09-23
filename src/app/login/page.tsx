'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { IntroductionAndLogin } from '../../components/common/IntroductionAndLogin';
import { Logo } from '../../components/Logo';

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
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-slate-100">
        <div className="mb-4 animate-pulse">
          <Logo className="w-14 h-14" />
        </div>
        <div className="text-sm font-bold text-slate-400">Loading study.io...</div>
      </div>
    );
  }

  return <IntroductionAndLogin />;
}
