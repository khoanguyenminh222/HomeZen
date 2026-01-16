import PropertyInfoForm from '@/components/settings/PropertyInfoForm';

/**
 * Trang cấu hình thông tin nhà trọ
 * Validates: Requirements 4.1-4.11
 */
export const metadata = {
  title: 'Thông Tin Nhà Trọ - Cài Đặt',
  description: 'Cấu hình thông tin nhà trọ',
};

export default function PropertySettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <PropertyInfoForm />
    </div>
  );
}
