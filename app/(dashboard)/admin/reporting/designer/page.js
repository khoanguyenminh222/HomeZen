"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TemplateDesigner } from '@/components/admin/reporting/TemplateDesigner';
import { Loader2 } from 'lucide-react';

function DesignerPageContent() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get('id');

    return (
        <div className="h-screen flex flex-col">
            <TemplateDesigner templateId={templateId} />
        </div>
    );
}

export default function TemplateDesignerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <DesignerPageContent />
        </Suspense>
    );
}
