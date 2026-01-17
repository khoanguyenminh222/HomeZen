'use client';

import RoomCard from './RoomCard';

/**
 * RoomList - Danh sách phòng với status badges
 * Requirements: 2.5, 2.10
 */
export default function RoomList({ rooms, onEdit, onDelete }) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Chưa có phòng nào
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Nhấn nút "Tạo Phòng Mới" để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
