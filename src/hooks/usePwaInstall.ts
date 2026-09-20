'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level cache so the captured beforeinstallprompt event is never missed
// when components mount, unmount, or open modals later in the session.
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error notifying PWA install listener:', err);
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent standard mini-infobar prompt to allow custom UI trigger
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    notifyListeners();
  });
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(() => Boolean(globalDeferredPrompt));
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isPrompting, setIsPrompting] = useState<boolean>(false);

  useEffect(() => {
    const updateState = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsInstalled(Boolean(isStandalone));
      setCanInstall(Boolean(globalDeferredPrompt) && !isStandalone);
    };

    updateState();

    listeners.add(updateState);
    return () => {
      listeners.delete(updateState);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!globalDeferredPrompt) {
      return 'unavailable';
    }

    setIsPrompting(true);
    try {
      const promptEvent = globalDeferredPrompt;
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;

      if (choiceResult.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setIsInstalled(true);
        notifyListeners();
      }

      return choiceResult.outcome;
    } catch (err) {
      console.warn('PWA install prompt encountered an error:', err);
      return 'dismissed';
    } finally {
      setIsPrompting(false);
    }
  }, []);

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    isPrompting,
    deferredPrompt: globalDeferredPrompt,
    triggerInstall,
  };
}
