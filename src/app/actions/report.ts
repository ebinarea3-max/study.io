'use server';

import { createClient } from '@/lib/supabaseServer';

export async function submitReport(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const category = formData.get('category') as string;
    const message = formData.get('message') as string;

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

    // Save to Supabase
    try {
      const { error: dbError } = await supabase.from('reports').insert({
        user_id: user?.id || null,
        username,
        category,
        message,
        created_at: new Date().toISOString()
      });
      if (dbError) {
        console.warn('Database insert error:', dbError);
      }
    } catch (e) {
      console.error('Database exception:', e);
    }

    // Forward directly to Gmail via Web3Forms endpoint
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_ACCESS_KEY || 'YOUR_ACCESS_KEY',
          subject: `[Study-io Bug Report] ${category} from @${username}`,
          from_name: 'Study-io Reports',
          to: 'ebtypinged@gmail.com',
          message: `Category: ${category}\nUser: @${username}\n\nIssue:\n${message}`,
        })
      });
    } catch (e) {
      console.error('Email dispatch error:', e);
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error submitting report:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
