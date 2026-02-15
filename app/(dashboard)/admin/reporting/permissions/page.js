"use client";

import { ReportPermissionManager } from "@/components/admin/reporting/ReportPermissionManager";

export default function ReportPermissionsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Phân Quyền Báo Cáo</h2>
                <p className="text-muted-foreground">
                    Quản lý quyền truy cập báo cáo cho từng người dùng
                </p>
            </div>

            <ReportPermissionManager />
        </div>
    );
}
