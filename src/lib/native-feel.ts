'use client';

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Triggers native haptic feedback on mobile devices via Capacitor Haptics,
 * falls back to navigator.vibrate on mobile browsers, and degrades silently on desktop.
 */
export async function triggerHaptic(type: HapticType = 'light'): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (Capacitor.isNativePlatform() || Capacitor.isPluginAvailable('Haptics')) {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'selection':
          await Haptics.selectionChanged();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
      return;
    }

    // Web vibration fallback for Android mobile browsers (Chrome on Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(8);
          break;
        case 'medium':
          navigator.vibrate(18);
          break;
        case 'heavy':
        case 'warning':
        case 'error':
          navigator.vibrate(32);
          break;
        case 'success':
          navigator.vibrate([12, 40, 16]);
          break;
      }
    }
  } catch {
    // Silent degradation on unsupported platforms or permission restrictions
  }
}

/**
 * Updates the native Android Status Bar color to match the current theme.
 */
export async function updateNativeStatusBar(color = '#07090E', isDark = true): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      await StatusBar.setBackgroundColor({ color });
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        // Ignored on edge-to-edge Android releases
      }
    }
  } catch {
    // Graceful fallback
  }
}

/**
 * Registers native Android system bar and hardware back-button listener.
 * - Closes active modals/dialogs first if open.
 * - Navigates browser history if canGoBack is true.
 * - Otherwise exits or minimizes the app cleanly.
 */
export async function initNativeAndroidBridge(defaultColor = '#07090E'): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

  let backListenerHandle: { remove: () => void } | null = null;

  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Initial Status Bar sync
      await updateNativeStatusBar(defaultColor, true);

      // 2. Hardware Back Button handler
      if (Capacitor.isPluginAvailable('App')) {
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          // Check for any open modal / dialog
          const openDialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
          if (openDialog) {
            // Priority: Click existing close button or fire Escape
            const closeBtn = openDialog.querySelector<HTMLElement>(
              'button[aria-label*="close" i], button[title*="close" i], button.modal-close'
            );
            if (closeBtn) {
              closeBtn.click();
              triggerHaptic('light');
              return;
            }
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            triggerHaptic('light');
            return;
          }

          // If history can go back, navigate back
          if (canGoBack && window.history.length > 1) {
            window.history.back();
            triggerHaptic('light');
          } else {
            // Exit app at root view
            App.exitApp();
          }
        });

        backListenerHandle = handle;
      }
    }
  } catch (err) {
    console.warn('Native Android bridge notice:', err);
  }

  return () => {
    if (backListenerHandle) {
      backListenerHandle.remove();
    }
  };
}

