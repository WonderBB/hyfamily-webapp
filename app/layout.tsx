// app/layout.tsx
import './globals.css';
import HamburgerMenu from './components/HamburgerMenu';
import type { Metadata } from 'next';

/* ✅ PWA + 기본 메타데이터 */
export const metadata: Metadata = {
  title: 'HY Family',
  description: '우리 가족을 위한 홈 대시보드',
  manifest: '/manifest.json',
  themeColor: '#121212',

  /* 🔥 추가: 모바일 화면 정상 비율 */
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HY',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 🔥 햄버거 메뉴 + 상단 헤더 (단 1번만!) */}
        <HamburgerMenu />

        {/* 🔥 모든 페이지 공통 컨테이너 */}
        <div className="page-container">
          {children}
        </div>
      </body>
    </html>
  );
}