import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomTabBar from '@/components/BottomTabBar';

export const metadata: Metadata = {
  title: 'ISU 校園通',
  description: '義守大學現代化校園系統 — 非官方',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4EFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen">
        <div className="max-w-sm mx-auto min-h-screen relative">
          {children}
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
