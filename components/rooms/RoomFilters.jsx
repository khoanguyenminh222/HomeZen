'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

/**
 * RoomFilters - Filters (status, search)
 * Requirements: 2.11
 */
export default function RoomFilters({ filters, onFilterChange }) {
  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status: status === filters.status ? '' : status });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleClearFilters = () => {
    onFilterChange({ status: '', search: '' });
  };

  const hasActiveFilters = filters.status || filters.search;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Tìm kiếm theo mã phòng hoặc tên..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.status === 'EMPTY' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('EMPTY')}
          className="h-11 text-sm sm:text-base flex-1 sm:flex-none"
        >
          Phòng trống
        </Button>
        <Button
          variant={filters.status === 'OCCUPIED' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('OCCUPIED')}
          className="h-11 text-sm sm:text-base flex-1 sm:flex-none"
        >
          Đã thuê
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="h-11 text-sm sm:text-base w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
