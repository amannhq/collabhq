// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow landing page and public routes
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // Check if route is protected - organization routes like /[org]/...
  const isProtectedRoute = pathname.match(/^\/[^/]+\/(projects|creators|analytics|settings|posts)/);
  
  // Get session token from cookie
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !sessionToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // For auth routes with active session, only redirect login (not signup)
  // Signup might be needed if user has no organization
  if (pathname.startsWith('/login') && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
