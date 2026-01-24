import TelegramBotConfigForm from '@/components/admin/TelegramBotConfigForm';

/**
 * Telegram Bot Config Page (Super Admin only)
 */
export default function TelegramBotConfigPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <TelegramBotConfigForm />
    </div>
  );
}
