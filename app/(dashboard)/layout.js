import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Hệ Thống Quản Lý Phòng Trọ
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Xin chào, {session.user?.username || 'Admin'}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Đăng Xuất
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Menu */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/rooms" 
              className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              Phòng
            </Link>
            <Link 
              href="/settings/property" 
              className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              Cài Đặt
            </Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
