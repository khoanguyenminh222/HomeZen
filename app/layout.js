import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { WebsiteConfigProvider } from "@/contexts/WebsiteConfigContext";
import { DynamicMetadata } from "@/components/ui/DynamicMetadata";
import { Toaster } from "@/components/ui/toaster";
import { getWebsiteConfigurationService } from "@/lib/services/website-configuration.service";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Generate metadata dynamically from website configuration
 * This ensures the title is set correctly from the start
 */
export async function generateMetadata() {
  try {
    const websiteConfigService = getWebsiteConfigurationService();
    const config = await websiteConfigService.getCurrentConfiguration();
    
    return {
      title: config.websiteTitle || "HomeZen - Ứng dụng quản lý nhà trọ",
      description: config.websiteDescription || "Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại",
      icons: {
        icon: [
          { url: config.faviconUrl || '/images/favicon.ico', type: 'image/x-icon' },
        ],
        shortcut: config.faviconUrl || '/images/favicon.ico',
        apple: config.faviconUrl || '/images/favicon.ico',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    // Fallback to default metadata
    return {
      title: "HomeZen - Ứng dụng quản lý nhà trọ",
      description: "Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại",
      icons: {
        icon: [
          { url: '/images/favicon.ico', type: 'image/x-icon' },
        ],
        shortcut: '/images/favicon.ico',
        apple: '/images/favicon.ico',
      },
    };
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body
        className={`${beVietnamPro.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProvider session={null}>
            <WebsiteConfigProvider>
              <DynamicMetadata />
              {children}
              <Toaster />
            </WebsiteConfigProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
