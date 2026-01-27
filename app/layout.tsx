// app/layout.tsx
import './globals.css';
import HamburgerMenu from './components/HamburgerMenu';

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