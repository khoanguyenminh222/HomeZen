'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * Session Provider wrapper component
 * Wraps the app with NextAuth SessionProvider
 */
export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
