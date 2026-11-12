import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Authentication callback bypass:
  // If the request matches an auth route (/auth, /api/auth, or Supabase OAuth callback route)
  // or an API route, allow it to pass through immediately before evaluating User-Agent.
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/.well-known')
  ) {
    return NextResponse.next();
  }

  // 2. Mobile detection and native app bypass check:
  // Read user-agent header. Check for 'StudyIoNativeApp' (Capacitor native app)
  const userAgent = request.headers.get('user-agent') || '';
  const isNativeApp = userAgent.includes('StudyIoNativeApp') || /StudyIoNativeApp/i.test(userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  // If user agent includes 'StudyIoNativeApp', it MUST bypass the mobile block completely.
  // If navigating to /mobile-restricted while in the native app, immediately redirect to /dashboard
  if (pathname === '/mobile-restricted') {
    if (isNativeApp) {
      return NextResponse.redirect('https://studyio-web.vercel.app/dashboard');
    }
    return NextResponse.next();
  }

  // 3. Mobile web restriction check:
  // Standard mobile web browsers without 'StudyIoNativeApp' are blocked and redirected to /mobile-restricted
  if (isMobile && !isNativeApp) {
    return NextResponse.redirect('https://studyio-web.vercel.app/mobile-restricted');
  }

  // 4. Normal web / native app auth session flow
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If unauthenticated user tries to directly access /dashboard, redirect to /login
  // Never redirect while on /auth/callback, /login, or /
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect('https://studyio-web.vercel.app/login');
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, audio, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg)$).*)',
  ],
};
