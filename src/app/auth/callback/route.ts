import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';

  // Ensure 'next' is a relative path to prevent open-redirect vulnerabilities
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard';
  }

  if (code) {
    const cookieStore = await cookies();
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    let destinationUrl: string;
    if (isLocalEnv) {
      destinationUrl = `${origin}${next}`;
    } else if (forwardedHost) {
      destinationUrl = `https://${forwardedHost}${next}`;
    } else {
      destinationUrl = `${origin}${next}`;
    }

    const response = NextResponse.redirect(destinationUrl);

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

  // If code exchange fails or no code is present, redirect to /?error=auth-failed
  return NextResponse.redirect(`${origin}/?error=auth-failed`);
}
