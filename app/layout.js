import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HomeZen - Ứng dụng quản lý nhà trọ",
  description: "Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body
        className={`${beVietnamPro.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProvider session={null}>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
