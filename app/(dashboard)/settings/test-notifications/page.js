'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Send, CheckCircle2, XCircle, AlertCircle, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Test Notifications Page (Property Owner)
 * Trang test để gửi thông báo chốt sổ phòng cho Property Owner
 */
export default function TestNotificationsPage() {
  const [daysBefore, setDaysBefore] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!daysBefore || daysBefore < 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập số ngày hợp lệ (>= 0)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/notifications/room-closure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysBefore: parseInt(daysBefore) }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast({
          title: 'Thành công',
          description: data.message || 'Đã gửi thông báo thành công!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Có lỗi xảy ra khi gửi thông báo',
          variant: 'destructive',
        });
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('Test room closure notification error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="wrap-break-word">Test Thông Báo Chốt Sổ</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Gửi thông báo test cho các phòng của bạn sắp đến ngày chốt sổ. Hệ thống sẽ tìm các phòng có ngày chốt sổ cách đúng số ngày bạn chỉ định và gửi thông báo đến Telegram của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-5 sm:space-y-6">
              {/* Input Days Before */}
              <div className="space-y-2">
                <Label htmlFor="daysBefore" className="text-sm sm:text-base font-semibold">
                  Số ngày trước ngày chốt sổ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="daysBefore"
                  type="number"
                  min="0"
                  value={daysBefore}
                  onChange={(e) => setDaysBefore(e.target.value)}
                  placeholder="VD: 1 (1 ngày trước ngày chốt sổ)"
                  className="h-11 sm:h-10 text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nhập số ngày còn lại đến ngày chốt sổ để gửi thông báo. 
                  <span className="block mt-1">
                    💡 <strong>Ví dụ:</strong> Nếu ngày chốt sổ là 20, hôm nay là 24, thì ngày chốt sổ tiếp theo là 20 tháng sau (khoảng 27 ngày nữa). Để test, nhập số ngày còn lại (ví dụ: 27).
                  </span>
                  <span className="block mt-1">
                    💡 <strong>Lưu ý:</strong> 0 = gửi vào đúng ngày chốt sổ, 1 = gửi khi còn 1 ngày nữa đến ngày chốt sổ.
                  </span>
                </p>
              </div>

              {/* Test Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleTest}
                  disabled={isLoading}
                  className="flex-1 h-11 sm:h-10 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full mr-2" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span>Gửi Thông Báo Test</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                {result.error ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                <span>Kết Quả</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {result.error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm sm:text-base text-red-600 dark:text-red-400">
                    <strong>Lỗi:</strong> {result.error}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-semibold">
                      {result.message}
                    </p>
                  </div>

                  {result.data && (
                    <div className="space-y-3">
                      {result.data.totalUsers > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-semibold">Trạng thái:</span>
                            <Badge variant="default" className="text-sm">
                              Đã gửi thông báo
                            </Badge>
                          </div>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            Thông báo đã được gửi đến Telegram của bạn. Vui lòng kiểm tra tin nhắn.
                          </p>
                        </>
                      ) : (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                              Không có phòng nào của bạn sắp đến ngày chốt sổ trong {daysBefore} ngày tới.
                            </p>
                          </div>
                        </div>
                      )}

                      {result.data.results && result.data.results.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm sm:text-base font-semibold">Chi tiết:</p>
                          <div className="space-y-2">
                            {result.data.results.map((item, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border ${
                                  item.success
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {item.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium">
                                      Số phòng: {item.roomsCount}
                                    </p>
                                    {item.error && (
                                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                                        Lỗi: {item.error}
                                      </p>
                                    )}
                                    {item.success && (
                                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                                        ✓ Thông báo đã được gửi thành công
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
