"use client";

import { UserReportGenerator } from "@/components/user/UserReportGenerator";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Báo Cáo</h2>
                <p className="text-muted-foreground">
                    Tạo và tải xuống các báo cáo quản lý
                </p>
            </div>

            <UserReportGenerator />
        </div>
    );
}
