'use server';

import { createClient } from '@/lib/supabaseServer';

export async function submitReport(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to report a problem.' };
    }

    const category = formData.get('category') as string;
    const message = formData.get('message') as string;

    if (!category || !message) {
      return { success: false, error: 'Category and message are required.' };
    }

    // Attempt to get user profile for username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const username = profile?.username || user.user_metadata?.username || user.user_metadata?.full_name || 'Anonymous';
    const sender_email = user.email || 'No email provided';

    // Store in Supabase 'reports' table if it exists
    try {
      await supabase.from('reports').insert([
        {
          user_id: user.id,
          username,
          sender_email,
          category,
          message,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {
      console.warn('Failed to insert into reports table (it may not exist)', e);
    }

    // Send email
    const emailSubject = `[Study-io Bug Report] ${category} from @${username}`;
    const emailBody = `Scholar: @${username} (${sender_email})\nCategory: ${category}\nTimestamp: ${new Date().toLocaleString()}\n\nReport Details:\n${message}`;

    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Study.io <onboarding@resend.dev>',
          to: 'ebtypinged@gmail.com',
          subject: emailSubject,
          text: emailBody,
        })
      });

      if (!res.ok) {
        console.error('Failed to send email via Resend:', await res.text());
        return { success: false, error: 'Failed to dispatch email report.' };
      }
    } else {
      // Fallback to Web3Forms if key exists, otherwise mock
      if (process.env.WEB3FORMS_ACCESS_KEY) {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: process.env.WEB3FORMS_ACCESS_KEY,
            subject: emailSubject,
            email: sender_email,
            message: emailBody,
          })
        });

        if (!res.ok) {
          console.error('Failed to send email via Web3Forms:', await res.text());
          return { success: false, error: 'Failed to dispatch email report.' };
        }
      } else {
        console.warn('No email service configured. Would have sent:', { emailSubject, emailBody });
        // Simulating success when no provider is configured
      }
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error submitting report:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
