import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">Chào mừng đến với Hệ Thống Quản Lý Phòng Trọ</h2>
        <p className="text-muted-foreground mb-4">
          Đăng nhập thành công! Hệ thống xác thực đã hoạt động.
        </p>
        <div className="bg-accent border border-primary/20 rounded-lg p-4">
          <p className="text-accent-foreground mb-2">
            <strong>Bước tiếp theo:</strong> Cấu hình thông tin nhà trọ của bạn
          </p>
          <Link 
            href="/settings/property"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Đi đến Cài Đặt →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow p-6 border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Phòng Trống</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-card rounded-lg shadow p-6 border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Phòng Đã Thuê</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
        </div>
        <div className="bg-card rounded-lg shadow p-6 border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Hóa Đơn Chưa Thanh Toán</h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">0</p>
        </div>
      </div>
    </div>
  );
}
