'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const handleLogout = async () => {
        await signOut({
            callbackUrl: '/login',
            redirect: true
        });
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors shadow-sm"
        >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng Xuất</span>
        </button>
    );
}
