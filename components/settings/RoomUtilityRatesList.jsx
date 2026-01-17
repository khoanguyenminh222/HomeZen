'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import RoomUtilityRateForm from './RoomUtilityRateForm';
import { Loading } from '@/components/ui/loading';
import { Home, Zap, Droplets, Search, Settings } from 'lucide-react';

export default function RoomUtilityRatesList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch tất cả phòng và thông tin đơn giá
  const fetchRoomsWithUtilityRates = async () => {
    setLoading(true);
    try {
      // Lấy danh sách tất cả phòng
      const roomsResponse = await fetch('/api/rooms');
      if (!roomsResponse.ok) {
        throw new Error('Không thể tải danh sách phòng');
      }
      const roomsData = await roomsResponse.json();

      // Lấy thông tin đơn giá riêng cho từng phòng
      const roomsWithRates = await Promise.all(
        roomsData.map(async (room) => {
          try {
            const rateResponse = await fetch(`/api/rooms/${room.id}/utility-rates`);
            if (rateResponse.ok) {
              const rateData = await rateResponse.json();
              return {
                ...room,
                hasCustomRates: !!rateData,
                customRates: rateData,
                hasElectricityRate: !!rateData,
                hasWaterRate: !!rateData,
              };
            }
            return {
              ...room,
              hasCustomRates: false,
              customRates: null,
              hasElectricityRate: false,
              hasWaterRate: false,
            };
          } catch (error) {
            console.error(`Error fetching rates for room ${room.id}:`, error);
            return {
              ...room,
              hasCustomRates: false,
              customRates: null,
              hasElectricityRate: false,
              hasWaterRate: false,
            };
          }
        })
      );

      setRooms(roomsWithRates);
    } catch (error) {
      console.error('Error fetching rooms with utility rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsWithUtilityRates();
  }, []);

  // Lọc phòng theo từ khóa tìm kiếm
  const filteredRooms = rooms.filter(room => 
    room.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Phân loại phòng
  const roomsWithCustomRates = filteredRooms.filter(room => room.hasCustomRates);
  const roomsWithGlobalRates = filteredRooms.filter(room => !room.hasCustomRates);

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    // Refresh danh sách phòng sau khi cập nhật
    fetchRoomsWithUtilityRates();
  };

  const RoomCard = ({ room }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${room.hasCustomRates ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Home className={`h-4 w-4 ${room.hasCustomRates ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <h3 className="font-medium">{room.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Mã: {room.code}</span>
            <span>•</span>
            <span>Giá: {room.price?.toLocaleString('vi-VN')} VNĐ</span>
            <span>•</span>
            <Badge variant={room.status === 'EMPTY' ? 'outline' : 'secondary'}>
              {room.status === 'EMPTY' ? 'Trống' : 'Đã thuê'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {room.hasCustomRates ? (
          <>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              <Settings className="h-3 w-3 mr-1" />
              Đơn giá riêng
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditRoom(room)}
            >
              Chỉnh sửa
            </Button>
          </>
        ) : (
          <>
            <Badge variant="outline" className="text-gray-600 border-gray-300">
              Đơn giá chung
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditRoom(room)}
            >
              Thiết lập riêng
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Quản Lý Đơn Giá Theo Phòng</span>
          </CardTitle>
          <CardDescription>
            Xem và quản lý đơn giá điện nước cho từng phòng. Phòng có thể sử dụng đơn giá chung hoặc đơn giá riêng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tìm kiếm */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm phòng theo mã hoặc tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <Loading text="Đang tải danh sách phòng..." />
          ) : (
            <div className="space-y-6">
              {/* Thống kê */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600">Đơn giá riêng</p>
                        <p className="text-2xl font-bold text-blue-700">{roomsWithCustomRates.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Home className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Đơn giá chung</p>
                        <p className="text-2xl font-bold text-gray-700">{roomsWithGlobalRates.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Home className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600">Tổng phòng</p>
                        <p className="text-2xl font-bold text-green-700">{filteredRooms.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Phòng có đơn giá riêng */}
              {roomsWithCustomRates.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span>Phòng Có Đơn Giá Riêng ({roomsWithCustomRates.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {roomsWithCustomRates.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}

              {/* Phòng dùng đơn giá chung */}
              {roomsWithGlobalRates.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center space-x-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    <span>Phòng Dùng Đơn Giá Chung ({roomsWithGlobalRates.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {roomsWithGlobalRates.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}

              {filteredRooms.length === 0 && !loading && (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-2">
                      {searchTerm ? 'Không tìm thấy phòng nào' : 'Chưa có phòng nào'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchTerm 
                        ? 'Thử thay đổi từ khóa tìm kiếm'
                        : 'Hãy tạo phòng mới trong trang quản lý phòng'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form chỉnh sửa đơn giá riêng */}
      <RoomUtilityRateForm
        room={selectedRoom}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRoom(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}