import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns an initialized Supabase Client if credentials are available via environment variables
 * or local app settings. Returns null if credentials are not yet configured.
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (supabaseClient) return supabaseClient;

  // Check env vars first, then localStorage config
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let localUrl = '';
  let localKey = '';

  try {
    const savedConfig = localStorage.getItem('studypulse_supabase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      localUrl = parsed.url || '';
      localKey = parsed.key || '';
    }
  } catch {
    // ignore
  }

  const url = (envUrl && !envUrl.includes('your-project-id')) ? envUrl : localUrl;
  const key = (envKey && !envKey.includes('your-supabase-anon-key')) ? envKey : localKey;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createBrowserClient(url, key);
      return supabaseClient;
    } catch {
      try {
        supabaseClient = createClient(url, key);
        return supabaseClient;
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('studypulse_supabase_config', JSON.stringify({ url, key }));
  supabaseClient = null; // force reload with new credentials
}

// Multi-tab BroadcastChannel fallback for instant real-time sync across browser tabs
export const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('studypulse_realtime_sync')
  : null;
