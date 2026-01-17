import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-card-foreground">
              Hệ Thống Quản Lý Phòng Trọ
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                Xin chào, {session.user?.username || 'Admin'}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90"
                >
                  Đăng Xuất
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Menu */}
      <nav className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/rooms" 
              className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium"
            >
              Phòng
            </Link>
            <Link 
              href="/settings/property" 
              className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium"
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
