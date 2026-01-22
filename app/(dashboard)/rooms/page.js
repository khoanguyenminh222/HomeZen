'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import RoomList from '@/components/rooms/RoomList';
import RoomForm from '@/components/rooms/RoomForm';
import RoomFilters from '@/components/rooms/RoomFilters';
import DeleteConfirmDialog from '@/components/rooms/DeleteConfirmDialog';
import RoomUtilityRateForm from '@/components/settings/RoomUtilityRateForm';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';

/**
 * Trang quản lý phòng
 * Requirements: 2.5, 2.10, 2.11
 */
export default function RoomsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ empty: 0, occupied: 0 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, room: null });
  const [utilityRateDialog, setUtilityRateDialog] = useState({ open: false, room: null });
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

  // Handle edit query parameter
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;

    const handleEditRoom = async () => {
      // First, try to find room in current rooms list
      const roomToEdit = rooms.find(r => r.id === editId);
      if (roomToEdit) {
        setSelectedRoom(roomToEdit);
        setIsFormOpen(true);
        // Remove query parameter from URL
        router.replace('/rooms', { scroll: false });
        return;
      }

      // If room not found in list, fetch it from API
      try {
        const response = await fetch(`/api/rooms/${editId}`);
        if (!response.ok) throw new Error('Failed to fetch room');
        const roomData = await response.json();
        setSelectedRoom(roomData);
        setIsFormOpen(true);
        // Remove query parameter from URL
        router.replace('/rooms', { scroll: false });
      } catch (error) {
        console.error('Error fetching room:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không tìm thấy phòng cần chỉnh sửa',
        });
        // Remove query parameter from URL
        router.replace('/rooms', { scroll: false });
      }
    };

    handleEditRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const handleConfigureUtilityRates = (room) => {
    setUtilityRateDialog({ open: true, room });
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
    setSelectedRoom(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedRoom(null);
    // Remove query parameter if exists
    if (searchParams.get('edit')) {
      router.replace('/rooms', { scroll: false });
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Quản Lý Phòng</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 wrap-break-word">
            Tổng số: {rooms.length} phòng | Trống: {stats.empty} | Đã thuê: {stats.occupied}
          </p>
        </div>
        <Button
          onClick={handleCreateRoom}
          size="lg"
          className="w-full sm:w-auto h-12 text-base min-w-[160px]"
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
        onConfigureUtilityRates={handleConfigureUtilityRates}
      />

      {/* Room Form Dialog */}
      <RoomForm
        open={isFormOpen}
        onClose={handleFormClose}
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

      {/* Utility Rate Configuration Dialog */}
      <RoomUtilityRateForm
        room={utilityRateDialog.room}
        isOpen={utilityRateDialog.open}
        onClose={() => setUtilityRateDialog({ open: false, room: null })}
        onSuccess={() => {
          // Có thể refresh rooms nếu cần hiển thị trạng thái đơn giá
          // fetchRooms();
        }}
      />
    </div>
  );
}
