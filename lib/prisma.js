/**
 * Prisma Client Instance
 * 
 * Singleton pattern để tránh tạo nhiều instance trong development mode.
 * Trong production, mỗi serverless function sẽ có instance riêng.
 */

import { PrismaClient } from '@prisma/client';

/**
 * @type {PrismaClient}
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Trong development, sử dụng global variable để tránh tạo nhiều instance
  // khi Next.js hot-reload
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

export default prisma;
