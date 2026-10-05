'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useServiceWorker } from '../../hooks/useServiceWorker';

/**
 * TimerSWBridge — invisible component that bridges StudyContext timer state
 * to the Service Worker for background tracking and push notifications.
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
  } = useStudy();

  // Handle SW → page messages (e.g. "Pause" button in notification)
  const handleSWMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'SW_PAUSE_TIMER') {
      pauseTimer();
    }
  }, [pauseTimer]);

  const { postToSW, requestNotificationPermission } = useServiceWorker(handleSWMessage);

  // Track previous running state to detect transitions
  const prevRunningRef = useRef(false);
  const prevStudyingRef = useRef(false);
  const prevPausedRef = useRef(false);
  const permissionRequestedRef = useRef(false);

  // Request notification permission on first timer start
  useEffect(() => {
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

  // Sync state transitions to SW
  useEffect(() => {
    const wasRunning = prevRunningRef.current;
    const wasStudying = prevStudyingRef.current;
    const wasPaused = prevPausedRef.current;

    const subjectName = selectedSubject?.name || '';
    const hidden = typeof document !== 'undefined' && document.hidden;

    if (isRunning && !wasRunning) {
      // Timer just started or resumed
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
      // Timer paused
      postToSW({ type: 'TIMER_PAUSE', elapsed: elapsedSeconds });
    } else if (!isStudying && wasStudying) {
      // Timer stopped
      postToSW({ type: 'TIMER_STOP' });
    }

    prevRunningRef.current = isRunning;
    prevStudyingRef.current = isStudying;
    prevPausedRef.current = isPaused;
  }, [isRunning, isStudying, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send TIMER_TICK to SW every 30s while running (keeps SW state fresh)
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      postToSW({
        type: 'TIMER_TICK',
        startTime: startTimeRef?.current ?? undefined,
        elapsed: elapsedSeconds,
        subject: selectedSubject?.name || '',
      });
    }, 30000);
    return () => clearInterval(id);
  }, [isRunning, elapsedSeconds, selectedSubject?.name, postToSW]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle app visibility: show/clear notification on hide/show
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // App went to background
        if (isRunning) {
          postToSW({ type: 'APP_HIDDEN' });
        }
      } else {
        // App came back to foreground
        postToSW({ type: 'APP_VISIBLE' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, postToSW]);

  return null; // no UI
}
