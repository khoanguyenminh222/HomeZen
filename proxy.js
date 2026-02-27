import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Proxy to protect routes with role-based access control
 * Edge Runtime compatible (No Prisma)
 */
export async function proxy(request) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  const token = await getToken({
    req: request,
    secret: secret,
  });

  const { pathname } = request.nextUrl;

  // 1. Exclude static assets
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

  // 2. Public Routes
  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );

  if (isPublicRoute) {
    const authPages = ['/login', '/forgot-password', '/reset-password'];
    if (token && authPages.some(page => pathname.startsWith(page))) {
      const userRole = token.vai_tro;
      const dashboardUrl = new URL(userRole === 'SIEU_QUAN_TRI' ? '/admin' : '/', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // 3. API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 4. Redirect to login if no session token
  if (!token) {
    // Log for Vercel troubleshooting
    console.log(`[PROXY] No token found for ${pathname}. Redirecting to login.`);
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
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SIEU_QUAN_TRI') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (userRole === 'SIEU_QUAN_TRI' && pathname !== '/' && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

/**
 * Matcher configuration for Next.js 16 Proxy
 */
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
