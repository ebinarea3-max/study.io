'use client';

import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, Loader2, HelpCircle } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { InstallInstructionModal } from './InstallInstructionModal';

interface InstallAppButtonProps {
  variant?: 'nav' | 'settings' | 'banner';
  className?: string;
}

export function InstallAppButton({ variant = 'nav', className = '' }: InstallAppButtonProps) {
  const { canInstall, isInstalled, isPrompting, deferredPrompt, triggerInstall } = usePwaInstall();
  const [justInstalled, setJustInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstallClick = async () => {
    // If deferredPrompt is available, trigger native prompt
    if (deferredPrompt || canInstall) {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      // If deferredPrompt is NOT available (e.g. iOS Safari, desktop before event fires), open fallback modal
      setShowInstructions(true);
    }
  };

  // Nav variant: subtle, clean, only visible when browser prompt is available
  if (variant === 'nav') {
    if (!canInstall) return null;

    return (
      <>
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

        <InstallInstructionModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
        />
      </>
    );
  }

  // Settings variant: shown inside settings modal with detailed feedback
  if (variant === 'settings') {
    return (
      <>
        {isInstalled || justInstalled ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Installed</span>
          </div>
        ) : canInstall ? (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isPrompting}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {isPrompting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Install App</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-[var(--border)] text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="View manual install instructions"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add to Home Screen</span>
          </button>
        )}

        <InstallInstructionModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
        />
      </>
    );
  }

  return null;
}
