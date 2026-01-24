import EmailConfigForm from '@/components/admin/EmailConfigForm';

/**
 * Email Configuration Page (Super Admin only)
 * Requirements: 1.1, 1.3
 */
export default function EmailConfigPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <EmailConfigForm />
    </div>
  );
}
