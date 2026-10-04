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

    const cleanHandle = formData.username.trim().toLowerCase();

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

    // Update the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: formData.name.trim(),
        username: cleanHandle,
        avatar_url: formData.avatar_url,
        daily_goal_minutes: formData.daily_goal_minutes,
        is_onboarded: true,
      })
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
