'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva } from 'class-variance-authority';
import {
  LayoutDashboard,
  Home,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  FileText,
  Receipt,
  DollarSign,
  Calendar,
  Shield,
  BarChart3,
  Mail,
  Send,
  Bell,
  Lock,
  User,
  LogOut,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Navigation Menu Components (inline để không cần file riêng)
const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      'relative z-10 flex max-w-max flex-1 items-center justify-center',
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      'group flex flex-1 list-none items-center justify-center gap-0.5',
      className
    )}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
);

const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), 'group', className)}
    {...props}
  >
    {children}{' '}
    <ChevronDown
      className="relative top-px ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 lg:absolute lg:w-auto lg:left-0',
      className
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div className={cn('absolute right-0 top-full flex justify-end')}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        'origin-top-right relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 lg:w-(--radix-navigation-menu-viewport-width)',
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

// Menu items cho Property Owner
const propertyOwnerNavItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/rooms',
    label: 'Danh sách phòng',
    icon: Home,
  },
  {
    href: '/tenants',
    label: 'Người Thuê',
    icon: Users,
  },
  {
    href: '/bills',
    label: 'Hóa Đơn',
    icon: Receipt,
  },
  {
    label: 'Lịch Sử',
    icon: Calendar,
    children: [
      {
        href: '/bills/history',
        label: 'Lịch sử hóa đơn',
        icon: History,
      },
      {
        href: '/meter-history',
        label: 'Lịch sử chỉ số',
        icon: Calendar,
      },
      {
        href: '/notifications',
        label: 'Lịch sử thông báo',
        icon: Bell,
      },
    ],
  },
  {
    label: 'Cài Đặt',
    icon: Settings,
    children: [
      {
        href: '/settings/property',
        label: 'Thông tin nhà trọ',
        icon: Building2,
      },
      {
        href: '/settings/utility-rates',
        label: 'Cài đặt đơn giá',
        icon: FileText,
      },
      {
        href: '/settings/fees',
        label: 'Quản lý phí',
        icon: DollarSign,
      },
      {
        href: '/settings/telegram',
        label: 'Cấu hình Telegram',
        icon: Send,
      },
      {
        href: '/settings/test-notifications',
        label: 'Test thông báo chốt sổ',
        icon: Bell,
      },
      {
        href: '/settings/change-password',
        label: 'Đổi mật khẩu',
        icon: Lock,
      }
    ],
  },
];

// Menu items cho Super Admin
const superAdminNavItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/property-owners',
    label: 'Quản lý chủ trọ',
    icon: Users,
  },
  {
    href: '/admin/properties',
    label: 'Quản lý nhà trọ',
    icon: Building2,
  },
  {
    href: '/admin',
    label: 'Cấu hình',
    icon: Settings,
    children: [
      {
        href: '/admin/email-config',
        label: 'Cấu hình Email',
        icon: Mail,
      },
      {
        href: '/admin/telegram-bot-config',
        label: 'Cấu hình Telegram Bot',
        icon: Send,
      },
      {
        href: '/admin/test-room-closure',
        label: 'Test thông báo chốt sổ',
        icon: Bell,
      },
    ],
  },
];

// Component cho menu item desktop
function DesktopNavItem({ item, pathname }) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = item.children?.some(child =>
    pathname === child.href || (child.href !== '/' && pathname?.startsWith(child.href))
  );
  // Nếu menu có children, chỉ active khi có child active
  // Nếu menu không có children, active dựa vào href
  // Đặc biệt: /bills/history không active /bills
  const isActive = hasChildren 
    ? isChildActive 
    : (item.href && (
        pathname === item.href ||
        (item.href !== '/' && item.href !== '/admin' && 
         // Nếu href là /bills, chỉ active khi pathname bắt đầu bằng /bills nhưng không phải /bills/history
         (item.href === '/bills' 
           ? (pathname?.startsWith('/bills') && pathname !== '/bills/history')
           : pathname?.startsWith(item.href))
        )
      ));

  if (hasChildren) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger
          className={cn(
            'h-9 gap-2 px-3 text-sm font-medium',
            isActive && 'text-primary bg-primary/10'
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[400px] gap-3 p-4 lg:w-[500px] lg:grid-cols-2">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const childIsActive = pathname === child.href ||
                (child.href !== '/' && pathname?.startsWith(child.href));

              return (
                <li key={child.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={child.href}
                      className={cn(
                        'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                        childIsActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ChildIcon className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">
                          {child.label}
                        </div>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              );
            })}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link
          href={item.href}
          className={cn(
            'group inline-flex h-9 w-max items-center justify-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none',
            isActive && 'text-primary bg-primary/10 font-semibold'
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

// Component cho menu item mobile với expand/collapse
function MobileNavItem({ item, pathname, onClose }) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const isChildActive = item.children?.some(child =>
    pathname === child.href || (child.href !== '/' && pathname?.startsWith(child.href))
  );
  // Nếu menu có children, chỉ active khi có child active
  // Nếu menu không có children, active dựa vào href
  // Đặc biệt: /bills/history không active /bills
  const isActive = hasChildren 
    ? isChildActive 
    : (item.href && (
        pathname === item.href ||
        (item.href !== '/' && item.href !== '/admin' && 
         // Nếu href là /bills, chỉ active khi pathname bắt đầu bằng /bills nhưng không phải /bills/history
         (item.href === '/bills' 
           ? (pathname?.startsWith('/bills') && pathname !== '/bills/history')
           : pathname?.startsWith(item.href))
        )
      ));

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center justify-between gap-3 px-5 py-4 min-h-[56px]',
            'text-base font-medium rounded-xl',
            'transition-all duration-300 ease-out',
            'active:scale-[0.97] active:bg-accent/80',
            'touch-manipulation', // Better touch handling
            isActive
              ? 'text-primary bg-primary/10 font-semibold shadow-sm'
              : 'text-foreground bg-accent/40 hover:bg-accent/60'
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
              isActive ? 'bg-primary/20 text-primary' : 'bg-background/50 text-muted-foreground'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-medium">{item.label}</span>
          </div>
          <ChevronRight
            className={cn(
              'h-5 w-5 text-muted-foreground transition-all duration-300 ease-out',
              isExpanded && 'rotate-90 text-primary'
            )}
          />
        </button>
        <div className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}>
          <div className="ml-6 mt-2 space-y-2 border-l-2 border-primary/30 pl-4">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const childIsActive = pathname === child.href ||
                (child.href !== '/' && pathname?.startsWith(child.href));

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 min-h-[48px]',
                    'text-sm font-medium rounded-lg',
                    'transition-all duration-200 ease-out',
                    'active:scale-[0.97] active:bg-accent/80',
                    'touch-manipulation',
                    childIsActive
                      ? 'text-primary bg-primary/10 font-semibold shadow-sm'
                      : 'text-foreground/80 bg-accent/30 hover:bg-accent/50'
                  )}
                >
                  <ChildIcon className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    childIsActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span>{child.label}</span>
                  {childIsActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-sm" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-4 px-5 py-4 min-h-[56px]',
        'text-base font-medium rounded-xl',
        'transition-all duration-300 ease-out',
        'active:scale-[0.97] active:bg-accent/80',
        'touch-manipulation',
        isActive
          ? 'text-primary bg-primary/10 font-semibold shadow-sm'
          : 'text-foreground bg-accent/40 hover:bg-accent/60'
      )}
    >
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
        isActive ? 'bg-primary/20 text-primary' : 'bg-background/50 text-muted-foreground'
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="flex-1 font-medium">{item.label}</span>
      {isActive && (
        <div className="w-2 h-2 rounded-full bg-primary shadow-sm" />
      )}
    </Link>
  );
}

export function NavLinks() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if we're in a protected route (dashboard area)
  // Dashboard layout already checks auth, so if we're here, we have a session
  const isInDashboard = pathname && 
    pathname !== '/login' && 
    pathname !== '/forgot-password' && 
    pathname !== '/reset-password' &&
    !pathname.startsWith('/api');

  // Get role-based menu items
  // Default to property owner items if session is not loaded yet
  // Only check role when session is authenticated
  const isSuperAdmin = status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN';
  const navItems = isSuperAdmin ? superAdminNavItems : propertyOwnerNavItems;
  
  // Determine if we should show logout button
  // Show if: authenticated, or if we're in dashboard (which requires auth via layout)
  const shouldShowLogout = status === 'authenticated' || 
    (isInDashboard && status !== 'unauthenticated');
  
  // Determine if we should show user info
  const shouldShowUserInfo = status === 'authenticated' || 
    (isInDashboard && status !== 'unauthenticated');

  useEffect(() => {
    // Use a timeout to avoid synchronous setState in effect
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="flex lg:hidden items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMenu}
          className="relative z-50 hover:bg-accent"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop Navigation */}
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList className="gap-1">
          {navItems.map((item) => (
            <DesktopNavItem key={item.label || item.href} item={item} pathname={pathname} />
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Menu Overlay */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-100 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Backdrop với blur và gradient */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Side Menu với glassmorphism */}
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-[280px] h-screen min-h-screen flex flex-col',
              'bg-card border-r border-border',
              'shadow-2xl shadow-black/40',
              'transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="flex flex-col h-full min-h-full bg-card shadow-none border-none">
              {/* Header với user info */}
              <div className="relative px-6 py-4 border-b border-border/50 bg-card shrink-0">
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeMenu}
                    className="h-9 w-9 rounded-lg hover:bg-accent/60 active:scale-95 transition-all"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Logo và Tên Web */}
                <div className="flex items-center gap-2 mb-4 pr-12">
                  <div className="flex items-center justify-center shrink-0">
                    <Image
                      src="/images/home-zen-logo.png"
                      alt="HomeZen Logo"
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">HomeZen</h2>
                </div>

                {/* User Info Section */}
                {shouldShowUserInfo ? (
                  status === 'authenticated' && session?.user?.username ? (
                    <div className="pr-12">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
                          session.user.role === 'SUPER_ADMIN' 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {session.user.role === 'SUPER_ADMIN' ? (
                            <Shield className="h-6 w-6" />
                          ) : (
                            <User className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {session.user.username}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {session.user.role === 'SUPER_ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-medium">
                                <Shield className="h-2.5 w-2.5" />
                                Super Admin
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Chủ trọ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : status === 'loading' ? (
                    <div className="pr-12">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-muted animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : isInDashboard ? (
                    // Fallback: Show placeholder if we're in dashboard but session not loaded yet
                    <div className="pr-12">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-muted text-muted-foreground">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            Đang tải...
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            Chủ trọ
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null
                ) : null}
              </div>

              {/* Navigation Items với scroll smooth */}
              <nav className="flex-1 flex flex-col px-4 py-6 gap-2 overflow-y-auto overscroll-contain bg-card">
                {navItems.map((item) => (
                  <MobileNavItem
                    key={item.label || item.href}
                    item={item}
                    pathname={pathname}
                    onClose={closeMenu}
                  />
                ))}
              </nav>

              {/* Logout Button */}
              {shouldShowLogout && (
                <div className="px-4 py-4 border-t border-border/50 bg-card shrink-0">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={async () => {
                      try {
                        await signOut({
                          callbackUrl: '/login',
                          redirect: true
                        });
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Fallback: redirect manually if signOut fails
                        window.location.href = '/login';
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Đăng Xuất</span>
                  </Button>
                </div>
              )}

              {/* Bottom padding instead of gradient fade to ensure no transparency */}
              <div className="h-4 bg-card shrink-0" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
