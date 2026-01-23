import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Proxy middleware to protect routes with role-based access control
 * Requirements: 4.3, 7.1, 7.2, 7.4, 7.5
 */
export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/api/auth'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If user is authenticated and tries to access login page, redirect to appropriate dashboard
    if (token && pathname.startsWith('/login')) {
      const dashboardUrl = new URL(token.role === 'SUPER_ADMIN' ? '/admin' : '/', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // API routes are protected by their own auth checks in route handlers
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active
  if (token.isActive === false) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'Account is deactivated');
    return NextResponse.redirect(loginUrl);
  }

  // Check token expiry (3 days)
  if (token.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now > token.exp) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Session expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Role-based route protection
  const userRole = token.role;

  // Protect Super Admin routes
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      // Redirect Property Owners to their dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect Super Admin from Property Owner routes to admin dashboard
  if (userRole === 'SUPER_ADMIN') {
    // Allow access to admin routes and root
    if (pathname !== '/' && pathname !== '/admin' && !pathname.startsWith('/admin')) {
      // Redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url));
    }
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
