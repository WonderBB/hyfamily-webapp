'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 상단 바 */}
      <header style={headerStyle}>
        <button onClick={() => setOpen(!open)} style={buttonStyle}>
          ☰
        </button>
      </header>

      {/* 메뉴 */}
      {open && (
        <nav style={menuStyle}>
          <Link href="/" onClick={() => setOpen(false)}>🏠 홈</Link>
          <Link href="/schedules" onClick={() => setOpen(false)}>📅 가족 일정</Link>
          <Link href="/board" onClick={() => setOpen(false)}>📝 게시판</Link>
          <Link href="/cards" onClick={() => setOpen(false)}>💳 카드 혜택</Link>
          <Link href="/company-benefits" onClick={() => setOpen(false)}>🏢 회사 복지</Link>
          <a
            href="https://wonderbb.github.io/hyrecipes/"
            target="_blank"
            rel="noreferrer"
          >
            🍳 요리 레시피
          </a>
        </nav>
      )}
    </>
  );
}

/* ===== 스타일 ===== */

const headerStyle = {
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  borderBottom: '1px solid #eee',
};

const buttonStyle = {
  fontSize: '20px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

const menuStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '220px',
  height: '100vh',
  background: '#fff',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
  boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
  zIndex: 1000,
};
