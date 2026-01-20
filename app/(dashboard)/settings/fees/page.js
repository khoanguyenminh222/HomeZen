'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FeeTypeList from '@/components/settings/FeeTypeList';
import RoomFeesList from '@/components/settings/RoomFeesList';
import { Loading } from '@/components/ui/loading';

/**
 * Trang quản lý phí
 * Requirements: 6.22-6.24
 */
export default function FeesPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      const room = rooms.find(r => r.id === selectedRoomId);
      setSelectedRoom(room);
    } else {
      setSelectedRoom(null);
    }
  }, [selectedRoomId, rooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Đang tải..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Quản Lý Phí</h1>
        <p className="text-muted-foreground">
          Quản lý các loại phí và gán phí cho từng phòng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quản lý loại phí */}
        <div>
          <FeeTypeList />
        </div>

        {/* Quản lý phí của phòng */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Phí của Phòng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Chọn phòng
                  </label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng để xem/quản lý phí" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.code} - {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoom && (
                  <RoomFeesList
                    roomId={selectedRoom.id}
                    roomCode={selectedRoom.code}
                  />
                )}

                {!selectedRoomId && (
                  <p className="text-center text-muted-foreground py-8">
                    Vui lòng chọn phòng để xem/quản lý phí
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
