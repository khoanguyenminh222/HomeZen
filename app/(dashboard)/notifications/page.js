import NotificationLogsList from '@/components/settings/NotificationLogsList';

/**
 * Notification Logs Page
 * Trang riêng để xem lịch sử thông báo
 * Requirements: 7.2
 */
export default function NotificationsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <NotificationLogsList />
    </div>
  );
}
