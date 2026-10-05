'use server';

import { createClient } from '@/lib/supabaseServer';

export async function submitReport(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const category = formData.get('category') as string;
    const message = formData.get('message') as string;
    const imageUrl = formData.get('imageUrl') as string | null;

    if (!category || !message) {
      return { success: false, error: 'Category and message are required.' };
    }

    let username = 'Anonymous';

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      username = profile?.username || user.user_metadata?.username || user.user_metadata?.full_name || 'Anonymous';
    }

    // Save strictly to Supabase reports table
    const { error: dbError } = await supabase.from('reports').insert({
      user_id: user?.id || null,
      username,
      category,
      message,
      image_url: imageUrl || null,
      created_at: new Date().toISOString()
    });

    if (dbError) {
      console.warn('Database insert error:', dbError);
      return { success: false, error: 'Failed to save the report to database.' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error submitting report:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
