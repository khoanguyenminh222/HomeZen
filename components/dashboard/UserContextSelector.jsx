'use client';

import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users } from 'lucide-react';

export function UserContextSelector({ onUserChange, currentUserId }) {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOwners() {
            try {
                const response = await fetch('/api/admin/property-owners');
                if (response.ok) {
                    const result = await response.json();
                    setOwners(result.data || []);
                }
            } catch (error) {
                console.error('Error fetching property owners:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchOwners();
    }, []);

    if (loading) return <div className="h-10 w-[240px] animate-pulse bg-muted rounded-md" />;

    return (
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select
                value={currentUserId || 'all'}
                onValueChange={(value) => onUserChange(value === 'all' ? null : value)}
            >
                <SelectTrigger className="w-[240px] bg-card">
                    <SelectValue placeholder="Chọn chủ nhà để xem" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toàn bộ hệ thống</SelectItem>
                    {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                            {owner.propertyInfo?.name || owner.username}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
