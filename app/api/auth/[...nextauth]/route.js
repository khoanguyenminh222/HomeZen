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
          // Return null và throw error với message để NextAuth có thể xử lý
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

        // Verify password FIRST - để bảo mật, không tiết lộ trạng thái tài khoản nếu mật khẩu sai
        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          // Nếu mật khẩu sai, luôn trả về lỗi mật khẩu (không tiết lộ trạng thái tài khoản)
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        // Chỉ kiểm tra trạng thái tài khoản SAU KHI mật khẩu đã đúng
        if (!user.isActive) {
          throw new Error('Tài khoản đã bị vô hiệu hóa');
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
