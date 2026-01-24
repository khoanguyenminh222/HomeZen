import NotificationLogsList from '@/components/settings/NotificationLogsList';

/**
 * Notification Logs Page
 * Trang riêng để xem lịch sử thông báo
 * Requirements: 7.2
 */
export default function NotificationsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <NotificationLogsList />
    </div>
  );
}
