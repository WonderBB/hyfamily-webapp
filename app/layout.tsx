// app/layout.tsx
import './globals.css';
import HamburgerMenu from './components/HamburgerMenu';
import type { Metadata, Viewport } from 'next';

/* ✅ 기본 메타데이터 */
export const metadata: Metadata = {
  title: 'HY Family',
  description: '우리 가족을 위한 홈 대시보드',
  manifest: '/manifest.json',
  themeColor: '#121212',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HY',
  },
};

/* 🔥 모바일 화면 비율 안정화 (공식 방식) */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/* ✅ 루트 레이아웃 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <HamburgerMenu />
        <div className="page-container">
          {children}
        </div>
      </body>
    </html>
  );
}