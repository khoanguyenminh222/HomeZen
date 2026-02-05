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

  // 1. Exclude all static assets and Next.js internals early
  const isStaticFile =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/reports/') ||
    pathname.match(/\.(?:ico|png|svg|jpg|jpeg|gif|webp|css|js|woff2?|map|json|xlsx)$/i);

  if (isStaticFile) {
    return NextResponse.next();
  }

  // 2. Define Public Routes (accessible without login)
  // Include root '/' if it should be public
  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/api/auth'];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );

  if (isPublicRoute) {
    // If user is already authenticated and tries to access auth pages, redirect to dashboard
    const authPages = ['/login', '/forgot-password', '/reset-password'];
    if (token && authPages.some(page => pathname.startsWith(page))) {
      const validation = await validateUserInDatabase(token.id);
      if (validation.isValid) {
        const dashboardUrl = new URL(validation.user.role === 'SUPER_ADMIN' ? '/admin' : '/', request.url);
        // Important: Use '/' as dashboard for Property Owners
        return NextResponse.redirect(dashboardUrl);
      }
    }
    return NextResponse.next();
  }

  // 3. API routes are protected by their own auth checks in route handlers
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 4. Redirect to login if no session token for protected routes
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Validate authenticated user still exists and is active
  const validation = await validateUserInDatabase(token.id);
  if (!validation.isValid) {
    console.log(`User validation failed: ${validation.reason} for user ${token.id}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', validation.reason === 'User not found in database' ? 'User not found' : 'Account deactivated');
    return NextResponse.redirect(loginUrl);
  }

  // 6. Check token expiry
  if (token.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now > token.exp) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Session expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  const userRole = validation.user.role;

  // 7. Role-based Authorization
  // Protect Super Admin dashboard
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Custom logic: Force Super Admin to Admin dashboard if they try to access property owner routes
  // But allow them to see the landing page '/'
  if (userRole === 'SUPER_ADMIN' && pathname !== '/' && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

/**
 * Matcher configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones omitted in the proxy function 
     * but we keep it broad for the proxy function to handle accurately.
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
