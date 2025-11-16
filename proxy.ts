// proxy.ts - Next.js 16 (replaces middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow all public routes and API routes
  const publicPaths = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/images',
    '/public',
    '/',
    '/login',
    '/signup',
    '/invite'
  ];
  
  // Check if path starts with any public path
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // For all other routes, let the layouts handle authentication
  // Don't block here - the [org]/layout.tsx will check session
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
