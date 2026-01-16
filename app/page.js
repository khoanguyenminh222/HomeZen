import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function Home() {
  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-bill-unpaid">Hệ Thống Quản Lý Phòng Trọ</h1>
          <p className="text-lg text-gray-600">
            Tailwind CSS 4 - <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">Zero-JS Config</span>
          </p>
          <div className="flex justify-center gap-2">
            <span className="status-badge-empty rounded-full">
              v4 Active
            </span>
          </div>
        </div>

        {/* Color System Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Hệ Thống Màu Sắc</CardTitle>
            <CardDescription>
              Màu sắc rõ ràng để phân biệt trạng thái (Requirements 12.6)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-24 bg-room-empty rounded-lg flex items-center justify-center text-white font-semibold">
                Phòng Trống
              </div>
              <p className="text-sm text-center">#10b981</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-room-debt rounded-lg flex items-center justify-center text-white font-semibold">
                Phòng Nợ
              </div>
              <p className="text-sm text-center">#ef4444</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-meter-rollover rounded-lg flex items-center justify-center text-white font-semibold">
                Đồng Hồ Xoay Vòng
              </div>
              <p className="text-sm text-center">#f59e0b</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-bill-paid rounded-lg flex items-center justify-center text-white font-semibold">
                Đã Thanh Toán
              </div>
              <p className="text-sm text-center">#3b82f6</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-bill-unpaid rounded-lg flex items-center justify-center text-white font-semibold">
                Chưa Thanh Toán
              </div>
              <p className="text-sm text-center">#f97316</p>
            </div>
          </CardContent>
        </Card>

        {/* Button Components Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Nút Bấm (Minimum 44x44px)</CardTitle>
            <CardDescription>
              Kích thước tối thiểu 44x44px cho dễ bấm trên mobile (Requirements 12.3)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Nút Mặc Định</Button>
            <Button variant="secondary">Nút Phụ</Button>
            <Button variant="destructive">Nút Xóa</Button>
            <Button variant="outline">Nút Viền</Button>
            <Button variant="ghost">Nút Trong Suốt</Button>
            <Button className="bg-bill-paid hover:bg-bill-paid/90 text-white gap-2 border-none">
              Nút Sửa
            </Button>
            <Button size="lg">Nút Lớn</Button>
            <Button size="sm">Nút Nhỏ</Button>
          </CardContent>
        </Card>

        {/* Form Components Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>
              Input, Card, Dialog components từ shadcn/ui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="room-name" className="text-base font-medium">
                Tên Phòng
              </label>
              <Input
                id="room-name"
                placeholder="Nhập tên phòng..."
                className="text-base min-h-touch"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="room-price" className="text-base font-medium">
                Giá Phòng (VNĐ)
              </label>
              <Input
                id="room-price"
                type="number"
                placeholder="2,500,000"
                className="text-base min-h-touch"
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>
              Font size tối thiểu 16px cho nội dung, 20px cho tiêu đề (Requirements 12.4)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1>Heading 1 - 36px</h1>
            <h2>Heading 2 - 30px</h2>
            <h3>Heading 3 - 24px</h3>
            <h4>Heading 4 - 20px</h4>
            <p className="text-base">
              Nội dung văn bản với font size 16px. Đây là kích thước tối thiểu
              để đảm bảo dễ đọc trên mọi thiết bị, đặc biệt là mobile.
            </p>
            <p className="text-lg">
              Văn bản lớn hơn với font size 18px cho các đoạn quan trọng.
            </p>
          </CardContent>
        </Card>

        {/* Mobile-First Responsive Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Mobile-First Responsive</CardTitle>
            <CardDescription>
              Thiết kế ưu tiên mobile với breakpoints: xs(375px), sm(640px), md(768px), lg(1024px)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="bg-gray-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold">Phòng {item}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Responsive Grid
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
