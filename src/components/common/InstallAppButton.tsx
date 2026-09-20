'use client';

import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, Loader2 } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface InstallAppButtonProps {
  variant?: 'nav' | 'settings' | 'banner';
  className?: string;
}

export function InstallAppButton({ variant = 'nav', className = '' }: InstallAppButtonProps) {
  const { canInstall, isInstalled, isPrompting, triggerInstall } = usePwaInstall();
  const [justInstalled, setJustInstalled] = useState(false);

  const handleInstallClick = async () => {
    const outcome = await triggerInstall();
    if (outcome === 'accepted') {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 4000);
    }
  };

  // Nav variant: subtle, clean, only visible when browser prompt is available
  if (variant === 'nav') {
    if (!canInstall) return null;

    return (
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isPrompting}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-all hover:scale-105 active:scale-95 shadow-sm shadow-emerald-500/10 cursor-pointer ${className}`}
        title="Install study.io on your device"
        aria-label="Install study.io application"
      >
        {isPrompting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // Settings variant: shown inside settings modal with detailed feedback
  if (variant === 'settings') {
    if (isInstalled || justInstalled) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Installed as Standalone App</span>
        </div>
      );
    }

    if (!canInstall) {
      return (
        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
          <span>To install, use &quot;Add to Home Screen&quot; in your browser menu.</span>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isPrompting}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
      >
        {isPrompting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>Install App</span>
      </button>
    );
  }

  return null;
}
