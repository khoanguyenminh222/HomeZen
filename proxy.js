import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

// Create Prisma client for proxy
const prisma = new PrismaClient();

/**
 * Validate user exists and is active in database
 * @param {string} userId - User ID from token
 * @returns {Promise<{isValid: boolean, user?: Object, reason?: string}>}
 */
async function validateUserInDatabase(userId) {
  if (!userId) {
    return { isValid: false, reason: 'No user ID provided' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return { isValid: false, reason: 'User not found in database' };
    }

    if (!user.isActive) {
      return { isValid: false, reason: 'User account is deactivated' };
    }

    return { isValid: true, user };
  } catch (error) {
    console.error('Error validating user in proxy:', error);
    return { isValid: false, reason: 'Database error during validation' };
  }
}

/**
 * Proxy to protect routes with role-based access control and user validation
 * Requirements: 4.3, 7.1, 7.2, 7.4, 7.5
 */
export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/api/auth'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If user is authenticated and tries to access login/forgot-password/reset-password page, redirect to appropriate dashboard
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password'))) {
      // Validate user still exists before redirecting
      const validation = await validateUserInDatabase(token.id);
      if (!validation.isValid) {
        // User doesn't exist, allow access to auth pages
        return NextResponse.next();
      }
      
      const dashboardUrl = new URL(validation.user.role === 'SUPER_ADMIN' ? '/admin' : '/', request.url);
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

  // Validate user still exists and is active in database
  const validation = await validateUserInDatabase(token.id);
  if (!validation.isValid) {
    console.log(`User validation failed: ${validation.reason} for user ${token.id}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', validation.reason === 'User not found in database' ? 'User not found' : 'Account deactivated');
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

  // Use current user role from database (not from token)
  const userRole = validation.user.role;

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
    '/((?!login|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
