'use client';

import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle2, Sparkles, X } from 'lucide-react';

export interface XpNotificationItem {
  id: string;
  amount: number;
  reason: string;
  type?: 'focus' | 'todo' | 'streak' | 'general';
}

interface XpFloatingNotificationProps {
  notification: XpNotificationItem | null;
  onDismiss: () => void;
}

export function XpFloatingNotification({
  notification,
  onDismiss,
}: XpFloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notification) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 3800);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification || !isVisible) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 pointer-events-auto transition-all duration-300 ease-out animate-in slide-in-from-top-4 fade-in">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/40 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 max-w-sm">
        {/* Animated icon badge */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/30 flex-shrink-0 animate-pulse">
          {notification.type === 'todo' ? (
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Zap className="w-5 h-5 stroke-[2.5] fill-current" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-emerald-400 font-mono tracking-tight">
              +{notification.amount} XP
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate">
            {notification.reason}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 200);
          }}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
