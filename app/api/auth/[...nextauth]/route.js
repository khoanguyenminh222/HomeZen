import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
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

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Tài khoản đã bị vô hiệu hóa');
        }

        // Verify password
        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        // Return user object (without password)
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
