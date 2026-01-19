'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DeletedTenantsList from '@/components/tenants/DeletedTenantsList';

export default function DeletedTenantsPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/tenants')} className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div className="flex-1 w-full">
                    <h1 className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            <span className="wrap-break-word">Lưu trữ người thuê (Đã xóa)</span>
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1">Quản lý và khôi phục các hồ sơ đã xóa tạm thời</p>
                </div>
            </div>

            <DeletedTenantsList />
        </div>
    );
}
