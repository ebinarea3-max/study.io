import { getSupabase } from './supabase';
import { Subject } from '../types';

export const DEFAULT_SUBJECT_NAME = 'General Focus';
export const DEFAULT_SUBJECT_COLOR = '#5A6B6A';

// In-memory cache mapping userId -> default subject UUID string
const defaultSubjectCache = new Map<string, string>();

/**
 * Resolves the default subject ID for the current user.
 * Calls get_or_create_default_subject RPC once and caches it in memory.
 * Idempotent and thread-safe.
 */
export async function resolveDefaultSubjectId(
  userId?: string,
  existingSubjects: Subject[] = []
): Promise<string> {
  const uid = userId || 'guest';

  // 1. Return from in-memory cache if already resolved in this session
  if (defaultSubjectCache.has(uid)) {
    return defaultSubjectCache.get(uid)!;
  }

  // 2. Check if an active "General Focus" subject already exists in the provided subject list
  const existing = existingSubjects.find(
    s =>
      s &&
      s.name &&
      s.name.trim().toLowerCase() === DEFAULT_SUBJECT_NAME.toLowerCase() &&
      !s.is_archived
  );
  if (existing?.id) {
    defaultSubjectCache.set(uid, existing.id);
    return existing.id;
  }

  // 3. If real authenticated user, call the Supabase security-definer RPC
  const isRealUser = Boolean(
    userId && !userId.startsWith('user-scholar') && !userId.startsWith('guest')
  );
  const supabase = getSupabase();

  if (supabase && isRealUser) {
    try {
      const { data, error } = await supabase.rpc('get_or_create_default_subject');
      if (data && !error) {
        const resolvedId = String(data);
        defaultSubjectCache.set(uid, resolvedId);
        return resolvedId;
      }
      if (error) {
        console.warn('[defaultSubjectResolver] RPC returned notice/error:', error.message);
      }
    } catch (err) {
      console.warn('[defaultSubjectResolver] Failed to invoke get_or_create_default_subject:', err);
    }
  }

  // 4. Fallback ID for guest / local offline preview before migration is applied
  const fallbackId = `sub-general-focus-${uid}`;
  defaultSubjectCache.set(uid, fallbackId);
  return fallbackId;
}

/**
 * Returns the cached default subject ID synchronously if available.
 */
export function getCachedDefaultSubjectId(userId?: string): string | null {
  const uid = userId || 'guest';
  return defaultSubjectCache.get(uid) || null;
}

/**
 * Clears the default subject cache (e.g. on user logout).
 */
export function clearDefaultSubjectCache(): void {
  defaultSubjectCache.clear();
}

