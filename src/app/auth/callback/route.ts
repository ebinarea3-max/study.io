import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getMobileOAuthBounceHtml } from '../../../lib/mobileOAuthBounce';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const userAgent = request.headers.get('user-agent') || '';
  const isNativeApp = userAgent.includes('StudyIoNativeApp') || /StudyIoNativeApp/i.test(userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  // If OAuth callback hits mobile browser outside the native Capacitor app,
  // do NOT exchange the PKCE code on server. Immediately bounce into native app.
  if (code && isMobile && !isNativeApp) {
    const deepLinkUrl = `com.studyio.app://auth?code=${encodeURIComponent(code)}`;
    return new Response(getMobileOAuthBounceHtml(deepLinkUrl), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect('https://studyio-web.vercel.app/dashboard');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }

      console.error('Supabase auth code exchange error:', error.message);
    }
  }

  // If code exchange fails or there is no code, redirect to error URL
  return NextResponse.redirect('https://studyio-web.vercel.app/?error=auth_failed');
}
