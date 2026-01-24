import TelegramConfigForm from '@/components/settings/TelegramConfigForm';

/**
 * Telegram Configuration Page (Property Owner)
 * Requirements: 2.1, 2.3
 */
export default function TelegramConfigPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <TelegramConfigForm />
    </div>
  );
}
