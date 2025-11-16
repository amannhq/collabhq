// proxy.ts - Next.js 16 (replaces middleware.ts)
// Purpose: Lightweight request filtering for instant navigation
// Heavy auth validation happens in layouts, not here
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicPaths = [
    '/api/auth',     // Better Auth endpoints
    '/_next',        // Next.js internals
    '/favicon.ico',
    '/images',
    '/',
    '/login',
    '/signup',
    '/invite',
  ];
  
  // Allow public paths immediately
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Quick cookie check (non-blocking) - Better Auth session token
  const sessionCookie = request.cookies.get('better-auth.session_token');
  
  // If no session cookie, redirect to login
  // This is a FAST check - no database calls, just cookie presence
  if (!sessionCookie && !pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Cookie exists - proceed and let layouts do detailed validation
  // This keeps navigation instant while maintaining security
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
