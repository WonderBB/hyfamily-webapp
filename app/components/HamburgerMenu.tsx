'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 메뉴 자동 닫힘
  if (open && pathname) {
    // pathname 변경 감지용
  }

  return (
    <>
      {/* ☰ 버튼 */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          top: '12px',
          left: '12px',
          zIndex: 1001,
          fontSize: '20px',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '6px 10px',
          cursor: 'pointer',
        }}
        aria-label="메뉴"
      >
        ☰
      </button>

      {/* 메뉴 패널 */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '220px',
            height: '100vh',
            background: 'white',
            borderRight: '1px solid #ddd',
            padding: '60px 16px 16px',
            zIndex: 1000,
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/" onClick={() => setOpen(false)}>🏠 홈</Link>
            <Link href="/schedule" onClick={() => setOpen(false)}>📅 가족 일정</Link>
            <Link href="/board" onClick={() => setOpen(false)}>📝 게시판</Link>
            <Link href="/cards" onClick={() => setOpen(false)}>💳 카드 혜택</Link>
            <Link href="/company-benefits" onClick={() => setOpen(false)}>🏢 회사 복지</Link>
            <a
              href="https://wonderbb.github.io/hyrecipes/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              🍳 요리 레시피
            </a>
          </nav>
        </div>
      )}
    </>
  );
}