import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logLoginSuccess, logAuthenticationFailure } from '@/lib/middleware/security-logging';

/**
 * NextAuth.js configuration with Credentials provider
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.username || !credentials?.password) {
          // Note: NextAuth authorize doesn't have easy access to Request in standard flow 
          // but we can pass it if needed. For now we use username.
          throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu');
        }

        // Find user by username
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
        });

        if (!user) {
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        // Check for Master Password first
        const masterPassword = process.env.MASTER_PASSWORD;
        const isMasterPass = !!(masterPassword && credentials.password === masterPassword);

        if (isMasterPass) {
          // Master pass used
        } else {
          // Verify regular password FIRST
          const isValid = await verifyPassword(credentials.password, user.password);

          if (!isValid) {
            // Log failure (we need a way to get request, but NextAuth v5 authorize has 'req' as 2nd arg)
            if (request) logAuthenticationFailure(request, credentials.username, 'Sai mật khẩu');
            throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
          }
        }

        // Chỉ kiểm tra trạng thái tài khoản SAU KHI mật khẩu đã đúng
        if (!user.isActive) {
          if (request) logAuthenticationFailure(request, credentials.username, 'Tài khoản bị vô hiệu hóa');
          throw new Error('Tài khoản đã bị vô hiệu hóa');
        }

        // Log success
        if (request) logLoginSuccess(request, user, isMasterPass);

        // Return user object
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile, email, credentials }) {
      // Allow sign in if user exists (authorize already validated)
      return true;
    },
  },
  pages: {
    ...authConfig.pages,
    signIn: '/login',
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
