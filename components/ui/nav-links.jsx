'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  CreditCard
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
      'group flex flex-1 list-none items-center justify-center space-x-1',
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
      'left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto',
      className
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div className={cn('absolute left-0 top-full flex justify-center')}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        'origin-top-center relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-(--radix-navigation-menu-viewport-width)',
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

// Cấu trúc menu với hỗ trợ menu cha-con
const navItems = [
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
  const isActive = (item.href && (
    pathname === item.href ||
    (item.href !== '/' && pathname?.startsWith(item.href))
  )) || isChildActive;

  if (hasChildren) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger
          className={cn(
            'h-10 gap-2.5 px-4 text-sm font-medium',
            isActive && 'text-primary bg-primary/10'
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
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
            'group inline-flex h-10 w-max items-center justify-center gap-2.5 rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors',
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
  const isActive = (item.href && (
    pathname === item.href ||
    (item.href !== '/' && pathname?.startsWith(item.href))
  )) || isChildActive;

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
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
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
      <div className="flex md:hidden items-center">
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
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList className="gap-1">
          {navItems.map((item) => (
            <DesktopNavItem key={item.label || item.href} item={item} pathname={pathname} />
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Menu Overlay */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-100 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
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
              {/* Header với gradient */}
              <div className="relative flex items-center justify-between px-6 py-5 border-b border-border/50 bg-card shrink-0">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-foreground">Menu</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Điều hướng</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                  className="h-10 w-10 rounded-xl hover:bg-accent/60 active:scale-95 transition-all relative z-10"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
                {/* Gradient background decoration */}
                <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent pointer-events-none" />
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

              {/* Bottom padding instead of gradient fade to ensure no transparency */}
              <div className="h-10 bg-card shrink-0" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
