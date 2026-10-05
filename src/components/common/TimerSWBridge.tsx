'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useServiceWorker } from '../../hooks/useServiceWorker';

/**
 * Detect touchscreen/mobile devices via the `pointer: coarse` media query.
 * Returns true on phones/tablets, false on laptops/desktops with a mouse.
 * Evaluated once at module load — device type doesn't change at runtime.
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

const IS_MOBILE = isMobileDevice();

/**
 * TimerSWBridge — invisible component that bridges StudyContext timer state
 * to the Service Worker for background tracking and push notifications.
 *
 * Notifications are ONLY sent on mobile/touchscreen devices (pointer: coarse).
 * On laptops/desktops the SW is still registered (for offline caching) but
 * no notification messages are dispatched — zero popups on desktop.
 *
 * Mount this once inside StudyProvider (via Providers).
 */
export function TimerSWBridge() {
  const {
    isStudying,
    isPaused,
    isRunning,
    elapsedSeconds,
    selectedSubject,
    timerMode,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    pomodoroPhase,
    startTimeRef,
    pauseTimer,
    resumeTimer,
  } = useStudy();

  // Handle SW → page messages (Pause / Resume buttons in notification)
  const handleSWMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'SW_PAUSE_TIMER') {
      pauseTimer();
    } else if (event.data?.type === 'SW_RESUME_TIMER') {
      resumeTimer();
    }
  }, [pauseTimer, resumeTimer]);

  const { postToSW, requestNotificationPermission } = useServiceWorker(handleSWMessage);

  // Track previous running state to detect transitions
  const prevRunningRef = useRef(false);
  const prevStudyingRef = useRef(false);
  const prevPausedRef = useRef(false);
  const permissionRequestedRef = useRef(false);

  // Request notification permission on first timer start — mobile only
  useEffect(() => {
    if (!IS_MOBILE) return;
    if (isStudying && !permissionRequestedRef.current) {
      permissionRequestedRef.current = true;
      requestNotificationPermission().then((perm) => {
        console.log('[SW Bridge] Notification permission:', perm);
      });
    }
  }, [isStudying, requestNotificationPermission]);

  // Helper to get the current target (for countdown/pomodoro)
  const getTarget = useCallback((): number | null => {
    if (timerMode === 'pomodoro') {
      return pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    }
    return null;
  }, [timerMode, pomodoroPhase, pomodoroWorkDuration, pomodoroBreakDuration]);

  // Sync timer state transitions to SW — mobile only
  useEffect(() => {
    const wasRunning = prevRunningRef.current;
    const wasStudying = prevStudyingRef.current;
    const wasPaused = prevPausedRef.current;

    prevRunningRef.current = isRunning;
    prevStudyingRef.current = isStudying;
    prevPausedRef.current = isPaused;

    // Skip all notification messages on laptops / desktops
    if (!IS_MOBILE) return;

    const subjectName = selectedSubject?.name || '';
    const hidden = typeof document !== 'undefined' && document.hidden;

    if (isRunning && !wasRunning) {
      const isResume = wasStudying && wasPaused;
      if (isResume) {
        postToSW({
          type: 'TIMER_RESUME',
          startTime: startTimeRef?.current ?? Date.now(),
          elapsed: elapsedSeconds,
          subject: subjectName,
          hidden,
        });
      } else {
        postToSW({
          type: 'TIMER_START',
          startTime: startTimeRef?.current ?? Date.now(),
          elapsed: elapsedSeconds,
          subject: subjectName,
          mode: timerMode,
          target: getTarget(),
          hidden,
        });
      }
    } else if (!isRunning && wasRunning && isStudying && isPaused) {
      postToSW({ type: 'TIMER_PAUSE', elapsed: elapsedSeconds });
    } else if (!isStudying && wasStudying) {
      postToSW({ type: 'TIMER_STOP' });
    }
  }, [isRunning, isStudying, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send TIMER_TICK to SW every 10s while running — mobile only
  useEffect(() => {
    if (!IS_MOBILE || !isRunning) return;
    const id = setInterval(() => {
      postToSW({
        type: 'TIMER_TICK',
        startTime: startTimeRef?.current ?? undefined,
        elapsed: elapsedSeconds,
        subject: selectedSubject?.name || '',
      });
    }, 10000);
    return () => clearInterval(id);
  }, [isRunning, elapsedSeconds, selectedSubject?.name, postToSW]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visibility change — mobile only
  useEffect(() => {
    if (!IS_MOBILE) return;
    const handleVisibility = () => {
      if (document.hidden) {
        postToSW({ type: 'APP_HIDDEN' });
      } else {
        postToSW({ type: 'APP_VISIBLE' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [postToSW]);

  return null; // no UI
}
