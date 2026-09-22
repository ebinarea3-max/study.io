/**
 * Tab / Device Identifier Generator
 * Generates and caches a unique device_id per browser tab in sessionStorage.
 * This ensures that multiple tabs on the same device act as independent clients
 * for loop-prevention and echo-filtering while remaining stable across page navigation.
 */

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-side';

  try {
    const STORAGE_KEY = 'studypulse_tab_device_id';
    let id = sessionStorage.getItem(STORAGE_KEY);

    if (!id) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      sessionStorage.setItem(STORAGE_KEY, id);
    }

    return id;
  } catch {
    return 'fallback-tab-id';
  }
}
