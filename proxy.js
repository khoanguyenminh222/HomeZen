import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Proxy to protect routes with role-based access control
 * Removed Prisma dependency for Edge Runtime compatibility on Vercel
 * Requirements: 4.3, 7.1, 7.2, 7.4, 7.5
 */
export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
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
  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/api/auth'];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );

  if (isPublicRoute) {
    // If user is already authenticated and tries to access auth pages, redirect to dashboard
    const authPages = ['/login', '/forgot-password', '/reset-password'];
    if (token && authPages.some(page => pathname.startsWith(page))) {
      const userRole = token.vai_tro;
      const dashboardUrl = new URL(userRole === 'SIEU_QUAN_TRI' ? '/admin' : '/', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // 3. API routes (auth handled in handlers or specific logic)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 4. Redirect to login if no session token for protected routes
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Token expiry check
  if (token.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now > token.exp) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Session expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  const userRole = token.vai_tro;

  // 6. Role-based Authorization
  // Protect Super Admin dashboard
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SIEU_QUAN_TRI') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Custom logic: Force Super Admin to Admin dashboard if they try to access property owner routes
  if (userRole === 'SIEU_QUAN_TRI' && pathname !== '/' && !pathname.startsWith('/admin')) {
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
