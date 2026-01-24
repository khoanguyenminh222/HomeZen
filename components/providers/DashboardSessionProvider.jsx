'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * Dashboard Session Provider
 * Wraps dashboard with session from server
 */
export default function DashboardSessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
