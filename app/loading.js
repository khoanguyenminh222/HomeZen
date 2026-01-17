import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-card-foreground">
            Đang tải...
          </h2>
          <p className="text-muted-foreground">
            Vui lòng đợi trong giây lát
          </p>
        </div>
      </div>
    </div>
  );
}