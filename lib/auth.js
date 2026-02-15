import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * NextAuth.js configuration with role-based authentication
 * Requirements: 4.1, 4.2, 4.4
 */
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 3 * 24 * 60 * 60, // 3 days in seconds
    updateAge: 24 * 60 * 60, // Update session every 24 hours to refresh expiry
  },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.tai_khoan = user.tai_khoan;
        token.vai_tro = user.vai_tro;
        token.trang_thai = user.trang_thai;
        token.iat = Math.floor(Date.now() / 1000); // Issued at time
        token.exp = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60); // Expires in 3 days
      }

      // Check if token is expired
      if (token.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (now > token.exp) {
          // Token expired, return null to force re-authentication
          return null;
        }
      }

      // Validate user still exists and is active in database
      // This prevents deleted/deactivated users from maintaining valid sessions
      if (token.id) {
        try {
          const dbUser = await prisma.uSR_NGUOI_DUNG.findUnique({
            where: { id: token.id },
            select: { id: true, trang_thai: true, vai_tro: true }
          });

          // If user doesn't exist or is inactive, invalidate token
          if (!dbUser || !dbUser.trang_thai) {
            console.log(`User ${token.id} not found or inactive, invalidating session`);
            return null;
          }

          // Update token with current user status
          token.trang_thai = dbUser.trang_thai;
          token.vai_tro = dbUser.vai_tro;
        } catch (error) {
          console.error('Error validating user in JWT callback:', error);
          // On database error, invalidate session for security
          return null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // If token is null or expired, return null to force re-authentication
      if (!token || (token.exp && Math.floor(Date.now() / 1000) > token.exp)) {
        return null;
      }

      if (token) {
        session.user.id = token.id;
        session.user.tai_khoan = token.tai_khoan;
        session.user.vai_tro = token.vai_tro;
        session.user.trang_thai = token.trang_thai;
      }
      return session;
    },
  },
};
