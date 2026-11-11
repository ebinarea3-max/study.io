import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Never intercept or redirect auth callback or API routes
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // 2. Mobile web restriction check:
  // Read user-agent header. If user-agent indicates a mobile device (Android, iPhone, iPad, etc.)
  // BUT does NOT include 'StudyIoNativeApp', redirect them to /mobile-restricted.
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  const isNativeApp = userAgent.includes('StudyIoNativeApp');

  // Allow direct access to the restriction page itself without redirect loops
  if (pathname === '/mobile-restricted') {
    return NextResponse.next();
  }

  if (isMobile && !isNativeApp) {
    const url = request.nextUrl.clone();
    url.pathname = '/mobile-restricted';
    return NextResponse.redirect(url);
  }

  // 3. Normal web / native app auth session flow
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
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
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
