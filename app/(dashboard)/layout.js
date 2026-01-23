import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NavLinks } from '@/components/ui/nav-links';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { User, Shield } from 'lucide-react';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Check if user is active
  if (!session.user?.isActive) {
    redirect('/login?error=Account is deactivated');
  }

  const isSuperAdmin = session.user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile Menu Trigger */}
              <div className="md:hidden mr-1">
                <NavLinks />
              </div>

              <div className="flex items-center justify-center shrink-0">
                <Image
                  src="/images/home-zen-logo.png"
                  alt="HomeZen Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <h1 className="text-xl font-bold text-card-foreground hidden xs:block">
                HomeZen
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-muted/50">
                {isSuperAdmin && <Shield className="h-4 w-4 text-primary" />}
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {session.user?.username || 'Admin'}
                </span>
                {isSuperAdmin && (
                  <span className="text-xs text-primary font-semibold hidden sm:inline">
                    (Admin)
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu - Desktop Only */}
      <nav className="hidden md:block sticky top-16 z-40 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center">
            <NavLinks />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
