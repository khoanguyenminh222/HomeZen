'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Building2, Zap, Settings, DollarSign, Send, Bell } from 'lucide-react';

const settingsNavItems = [
  {
    href: '/settings/property',
    label: 'Thông Tin Nhà Trọ',
    icon: Building2,
    description: 'Tên, địa chỉ, logo nhà trọ'
  },
  {
    href: '/settings/utility-rates',
    label: 'Đơn Giá Điện Nước',
    icon: Zap,
    description: 'Cấu hình giá điện, nước, bậc thang'
  },
  {
    href: '/settings/fees',
    label: 'Quản Lý Phí',
    icon: DollarSign,
    description: 'Quản lý loại phí và phí của phòng'
  },
  {
    href: '/settings/telegram',
    label: 'Cấu Hình Telegram',
    icon: Send,
    description: 'Cấu hình Chat ID để nhận thông báo'
  },
];

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start sm:items-center space-x-3 mb-6 sm:mb-8">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Cài Đặt Hệ Thống</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Cấu hình thông tin và tham số cho hệ thống quản lý phòng trọ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-start space-x-3 p-3 sm:p-4 rounded-lg border transition-all duration-200',
                    'hover:bg-accent/50 hover:border-primary/20',
                    isActive
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white border-gray-200 text-gray-700 hover:text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 mt-0.5 shrink-0',
                    isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'font-medium text-sm wrap-break-word',
                      isActive ? 'text-primary' : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {item.label}
                    </h3>
                    <p className={cn(
                      'text-xs mt-1 wrap-break-word',
                      isActive ? 'text-primary/70' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}