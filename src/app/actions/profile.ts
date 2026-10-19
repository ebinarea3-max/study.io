'use server';

import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

export async function updateScholarProfile(formData: {
  name: string;
  username: string;
  avatar_url: string;
  daily_goal_minutes: number;
}) {
  try {
    const supabase = await createClient();

    // Read user session from cookies on the server
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Session expired or not found. Please log in again.' };
    }

    // Fetch the user's existing profile to check if username is changing and verify cooldown
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('username, username_updated_at')
      .eq('id', user.id)
      .single();

    const cleanHandle = formData.username.trim().toLowerCase();
    const isUsernameChanging = currentProfile && currentProfile.username !== cleanHandle;
    const updatePayload: any = {
      name: formData.name.trim(),
      username: cleanHandle,
      avatar_url: formData.avatar_url,
      daily_goal_minutes: formData.daily_goal_minutes,
      is_onboarded: true,
    };

    if (isUsernameChanging) {
      if (currentProfile?.username_updated_at) {
        const daysSinceUpdate = (Date.now() - new Date(currentProfile.username_updated_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) {
          const daysLeft = Math.ceil(30 - daysSinceUpdate);
          return { success: false, error: `Cooldown active: Editable in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.` };
        }
      }

      // Check username uniqueness against other scholars
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanHandle)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Handle already claimed. Try another.' };
      }

      updatePayload.username_updated_at = new Date().toISOString();
    }

    // Update the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server error while saving profile.' };
  }
}

export async function updateStudyRoomIdentityAction(formData: {
  custom_title: string;
  custom_badge: string;
}) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Session expired or not found. Please log in again.' };
    }

    // 2. Validate input lengths
    const cleanTitle = (formData.custom_title || '').trim();
    const cleanBadge = (formData.custom_badge || '').trim();

    if (cleanTitle.length > 20) {
      return { success: false, error: 'Custom title must be at most 20 characters.' };
    }
    if (cleanBadge.length > 15) {
      return { success: false, error: 'Badge tag must be at most 15 characters.' };
    }

    // 3. Verify active premium subscription
    let isPremium = false;
    try {
      const { data: entitlementRows } = await supabase.rpc('get_my_entitlements');
      const row = Array.isArray(entitlementRows) ? entitlementRows[0] : entitlementRows;
      if (row?.is_premium) {
        isPremium = true;
      }
    } catch {
      // fallback
    }

    if (!isPremium) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('premium_until, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sub && sub.premium_until && new Date(sub.premium_until).getTime() > Date.now()) {
        isPremium = true;
      }
    }

    // If attempting to set non-empty values without premium, reject
    if ((cleanTitle.length > 0 || cleanBadge.length > 0) && !isPremium) {
      return {
        success: false,
        error: 'Active Study.io Premium subscription required to set custom titles and study room badges.',
      };
    }

    // 4. Update the profiles table
    const updatePayload = {
      custom_title: cleanTitle.length > 0 ? cleanTitle : null,
      custom_badge: cleanBadge.length > 0 ? cleanBadge : null,
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      custom_title: updatePayload.custom_title,
      custom_badge: updatePayload.custom_badge,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server error while saving study room identity.' };
  }
}

