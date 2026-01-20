'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BillForm from '@/components/bills/BillForm';
import { Loading } from '@/components/ui/loading';

/**
 * Trang tạo hóa đơn mới
 * Có thể nhận roomId từ query params
 */
export default function CreateBillPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('roomId');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSuccess = () => {
    router.push('/bills');
  };

  const handleClose = () => {
    router.push('/bills');
  };

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4">
      <BillForm
        open={true}
        onClose={handleClose}
        bill={null}
        onSuccess={handleSuccess}
        roomId={roomId}
      />
    </div>
  );
}
