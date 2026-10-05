'use client';

import { useEffect, useRef, useCallback } from 'react';

export type SWMessage =
  | { type: 'TIMER_START';  startTime: number; elapsed?: number; subject?: string; mode?: string; target?: number | null; hidden?: boolean }
  | { type: 'TIMER_RESUME'; startTime: number; elapsed?: number; subject?: string; hidden?: boolean }
  | { type: 'TIMER_PAUSE';  elapsed: number }
  | { type: 'TIMER_STOP' }
  | { type: 'TIMER_TICK';   startTime?: number; elapsed: number; subject?: string }
  | { type: 'APP_HIDDEN' }
  | { type: 'APP_VISIBLE' }
  | { type: 'PING' };

type SWCallback = (msg: MessageEvent) => void;

/**
 * Registers /sw.js and provides:
 * - `postToSW(msg)` — send a typed message to the service worker
 * - `requestNotificationPermission()` — request notification permission
 * - `notificationPermission` ref value
 */
export function useServiceWorker(onMessage?: SWCallback) {
  const swReadyRef = useRef(false);

  // Register SW
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        swReadyRef.current = true;
        console.log('[SW] Registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });

    // Listen for messages from SW (e.g. SW_PAUSE_TIMER)
    const handler = (event: MessageEvent) => {
      onMessage?.(event);
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const postToSW = useCallback((msg: SWMessage) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage(msg);
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  return { postToSW, requestNotificationPermission };
}
