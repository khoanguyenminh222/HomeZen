import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to protect routes
 * Redirects unauthenticated users to /login
 */
export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // If user is authenticated and tries to access login page, redirect to dashboard
  if (token && pathname.startsWith('/login')) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow access to login page and auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Matcher configuration
 * Protect all routes except:
 * - /login (auth page)
 * - /api/auth/* (NextAuth.js routes)
 * - /_next/* (Next.js internals)
 * - /favicon.ico, /public files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth/*
     * - /_next/static
     * - /_next/image
     * - /favicon.ico
     * - /public files
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
