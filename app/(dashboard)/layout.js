import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NavLinks } from '@/components/ui/nav-links';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { DynamicLogo } from '@/components/ui/DynamicLogo';
import { User, Shield } from 'lucide-react';
import DashboardSessionProvider from '@/components/providers/DashboardSessionProvider';

export default async function DashboardLayout({ children }) {
  const session = await auth();

  // If path is not root and no session, redirect
  // This is tricky because layout doesn't know pathname.
  // But we can check if it's the root page by some other means or just trust proxy.js for that.
  // Actually, if we are in this layout, we are in a dashboard route.

  if (!session) {
    // If the user wants '/' to be public, we must NOT redirect here for '/'.
    // But how to detect '/' in Server Layout? 
    // Usually via headers 'x-url' or similar if set in middleware.
    redirect('/login');
  }

  // Check if user is active
  if (!session.user?.isActive) {
    redirect('/login?error=Account is deactivated');
  }

  const isSuperAdmin = session.user?.role === 'SUPER_ADMIN';

  // Transform session for client component
  const clientSession = {
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      isActive: session.user.isActive,
    },
    expires: session.expires,
  };

  return (
    <DashboardSessionProvider session={clientSession}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile Menu Trigger */}
                <div className="md:hidden mr-1">
                  <NavLinks />
                </div>

                <DynamicLogo size={32} showText={true} />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg">
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
    </DashboardSessionProvider>
  );
}
