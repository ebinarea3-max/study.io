'use client';

import React, { useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { soundFx } from '../../lib/audio';
import { AlertTriangle } from 'lucide-react';

export function IdleCheckModal() {
  const { isIdleCheckActive, confirmIdleCheck } = useStudy();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isIdleCheckActive) {
      // Play alarm immediately and repeat every 5 seconds until confirmed or paused
      soundFx.playAlarm?.();
      interval = setInterval(() => {
        soundFx.playAlarm?.();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIdleCheckActive]);

  if (!isIdleCheckActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#12161f] border border-amber-500/30 p-6 md:p-8 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Still Studying?</h2>
        <p className="text-slate-400 mb-6 text-sm">
          You've been studying for 4 hours straight! Please confirm you're still here, otherwise the timer will auto-pause in 20 seconds.
        </p>
        
        <button
          onClick={confirmIdleCheck}
          className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-amber-500 hover:bg-amber-400 transition-colors shadow-amber-500/20 active:scale-95"
        >
          Yes, I'm still studying!
        </button>
      </div>
    </div>
  );
}
