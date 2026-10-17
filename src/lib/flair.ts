import { getSupabase } from './supabase';

export type FlairFrame = 'gold' | 'aurora' | 'ember';

export interface FlairConfig {
  id: FlairFrame;
  name: string;
  gradient: string;
  ringBorder: string;
  crownColor: string;
  starColor: string;
  glowColor: string;
  description: string;
}

export const FLAIR_FRAMES: Record<FlairFrame, FlairConfig> = {
  gold: {
    id: 'gold',
    name: 'Imperial Gold',
    gradient: 'linear-gradient(135deg, #F5E6A8 0%, #E6C15A 50%, #B8892B 100%)',
    ringBorder: '#E6C15A',
    crownColor: '#E6C15A',
    starColor: '#E6C15A',
    glowColor: 'rgba(230, 193, 90, 0.35)',
    description: 'Prestige gold gradient inspired by Free Fire Grandmaster accolades.',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Teal',
    gradient: 'linear-gradient(135deg, #2DD4BF 0%, #06B6D4 50%, #3B82F6 100%)',
    ringBorder: '#2DD4BF',
    crownColor: '#2DD4BF',
    starColor: '#2DD4BF',
    glowColor: 'rgba(45, 212, 191, 0.35)',
    description: 'Vibrant celestial teal and electric cyan glow.',
  },
  ember: {
    id: 'ember',
    name: 'Ember Orange',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #B91C1C 100%)',
    ringBorder: '#F97316',
    crownColor: '#F97316',
    starColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    description: 'Blazing thermal fire gradient for intense focus champions.',
  },
};

/**
 * Fetch flair frames for an array of user IDs via security definer RPC get_flair.
 * Never throws — returns empty map on any error or offline state.
 */
export async function fetchFlairMap(userIds: string[]): Promise<Record<string, FlairFrame>> {
  if (!userIds || userIds.length === 0) return {};

  try {
    const supabase = getSupabase();
    if (!supabase) return {};

    const isUuid = (id: string) =>
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const validUids = Array.from(new Set(userIds.filter(isUuid))).slice(0, 100);
    if (validUids.length === 0) return {};

    const { data, error } = await supabase.rpc('get_flair', { p_user_ids: validUids });

    if (error || !Array.isArray(data)) {
      if (error) console.warn('[Flair] get_flair notice:', error.message);
      return {};
    }

    const map: Record<string, FlairFrame> = {};
    for (const row of data) {
      if (row?.user_id) {
        map[row.user_id] = (row.frame as FlairFrame) || 'gold';
      }
    }
    return map;
  } catch (err) {
    console.warn('[Flair] fetchFlairMap error:', err);
    return {};
  }
}

/**
 * Read the current user's own profile_flair configuration. Defaults to 'gold'.
 */
export async function getMyFlair(userId: string): Promise<{ frame: FlairFrame; showBadge: boolean } | null> {
  if (!userId) return null;

  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profile_flair')
      .select('frame, show_badge')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Flair] getMyFlair notice:', error.message);
      return { frame: 'gold', showBadge: true };
    }

    if (data) {
      return {
        frame: (data.frame as FlairFrame) || 'gold',
        showBadge: data.show_badge ?? true,
      };
    }

    return { frame: 'gold', showBadge: true };
  } catch (err) {
    console.warn('[Flair] getMyFlair exception:', err);
    return { frame: 'gold', showBadge: true };
  }
}

/**
 * Save the current user's profile_flair configuration.
 */
export async function saveMyFlair(
  userId: string,
  frame: FlairFrame,
  showBadge: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated' };

  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client unavailable' };

    const { error } = await supabase.from('profile_flair').upsert(
      {
        user_id: userId,
        frame,
        show_badge: showBadge,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update flair' };
  }
}
