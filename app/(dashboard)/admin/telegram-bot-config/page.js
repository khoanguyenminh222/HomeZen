import TelegramBotConfigForm from '@/components/admin/TelegramBotConfigForm';

/**
 * Telegram Bot Config Page (Super Admin only)
 */
export default function TelegramBotConfigPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <TelegramBotConfigForm />
    </div>
  );
}
