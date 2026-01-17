'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import RoomList from '@/components/rooms/RoomList';
import RoomForm from '@/components/rooms/RoomForm';
import RoomFilters from '@/components/rooms/RoomFilters';
import DeleteConfirmDialog from '@/components/rooms/DeleteConfirmDialog';
import { useToast } from '@/hooks/use-toast';

/**
 * Trang quản lý phòng
 * Requirements: 2.5, 2.10, 2.11
 */
export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ empty: 0, occupied: 0 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, room: null });
  const { toast } = useToast();

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
      setFilteredRooms(data);
      
      // Calculate stats (Requirements: 2.10)
      const empty = data.filter(r => r.status === 'EMPTY').length;
      const occupied = data.filter(r => r.status === 'OCCUPIED').length;
      setStats({ empty, occupied });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Lỗi khi tải danh sách phòng',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Apply filters (Requirements: 2.11)
  useEffect(() => {
    let filtered = [...rooms];

    if (filters.status) {
      filtered = filtered.filter(room => room.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        room =>
          room.code.toLowerCase().includes(searchLower) ||
          room.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRooms(filtered);
  }, [filters, rooms]);

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setIsFormOpen(true);
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDeleteRoom = (room) => {
    setDeleteDialog({ open: true, room });
  };

  const confirmDelete = async () => {
    const room = deleteDialog.room;
    if (!room) return;

    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }

      toast({
        variant: 'success',
        title: 'Thành công',
        description: 'Xóa phòng thành công',
      });
      setDeleteDialog({ open: false, room: null });
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.message,
      });
    }
  };

  const handleFormSuccess = () => {
    fetchRooms();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Phòng</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tổng số: {rooms.length} phòng | Trống: {stats.empty} | Đã thuê: {stats.occupied}
          </p>
        </div>
        <Button
          onClick={handleCreateRoom}
          size="lg"
          className="h-12 text-base min-w-[160px]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo Phòng Mới
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <RoomFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Room List */}
      <RoomList
        rooms={filteredRooms}
        onEdit={handleEditRoom}
        onDelete={handleDeleteRoom}
      />

      {/* Room Form Dialog */}
      <RoomForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        room={selectedRoom}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, room: null })}
        onConfirm={confirmDelete}
        room={deleteDialog.room}
      />
    </div>
  );
}
