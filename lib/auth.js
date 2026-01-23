import bcrypt from 'bcrypt';

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
        token.username = user.username;
        token.role = user.role;
        token.isActive = user.isActive;
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
      
      return token;
    },
    async session({ session, token }) {
      // If token is null or expired, return null to force re-authentication
      if (!token || (token.exp && Math.floor(Date.now() / 1000) > token.exp)) {
        return null;
      }
      
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    },
  },
};
