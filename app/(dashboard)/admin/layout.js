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

  // Only SIEU_QUAN_TRI can access admin routes
  if (session.user?.vai_tro !== 'SIEU_QUAN_TRI') {
    redirect('/');
  }

  return <>{children}</>;
}
