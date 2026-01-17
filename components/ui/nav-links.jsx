'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/rooms',
    label: 'Phòng',
    icon: Home,
  },
  {
    href: '/settings/property',
    label: 'Cài Đặt',
    icon: Settings,
  },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex space-x-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname?.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              'hover:bg-accent/50',
              isActive
                ? 'text-primary bg-primary/10 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn(
              'h-4 w-4 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )} />
            <span>{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
