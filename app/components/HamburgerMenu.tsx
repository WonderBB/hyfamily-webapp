'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /* ======================
     오늘 날짜 + 요일
  ====================== */
  const todayLabel = new Date().toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });

  /* ======================
     페이지 이동 시 메뉴 닫기
  ====================== */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ===== 상단 헤더 ===== */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: '#fff',
          borderBottom: '1px solid #ddd',
          zIndex: 1001,
        }}
      >
        {/* ☰ 버튼 */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="메뉴"
          style={{
            fontSize: '20px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '6px 10px',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>

        {/* 오늘 날짜 */}
        <div
          style={{
            fontSize: '13px',
            color: '#666',
            whiteSpace: 'nowrap',
          }}
        >
          {todayLabel}
        </div>
      </header>

      {/* ===== 사이드 메뉴 ===== */}
      {open && (
        <aside
          style={{
            position: 'fixed',
            top: '48px',
            left: 0,
            width: '220px',
            height: 'calc(100vh - 48px)',
            background: '#fff',
            borderRight: '1px solid #ddd',
            padding: '16px',
            zIndex: 1000,
          }}
        >
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Link href="/">🏠 홈</Link>
            <Link href="/schedule">📅 가족 일정</Link>
            <Link href="/board">📝 게시판</Link>
            <Link href="/cards">💳 카드 혜택</Link>
            <Link href="/company-benefits">🏢 회사 복지</Link>
            <a
              href="https://wonderbb.github.io/hyrecipes/"
              target="_blank"
              rel="noreferrer"
            >
              🍳 요리 레시피
            </a>
          </nav>
        </aside>
      )}
    </>
  );
}