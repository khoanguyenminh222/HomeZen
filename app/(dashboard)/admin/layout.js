import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

/**
 * Admin Layout - Protects admin routes
 * Requirements: 4.3, 7.1, 7.2
 */
export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Only Super Admin can access admin routes
  if (session.user?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return <>{children}</>;
}
