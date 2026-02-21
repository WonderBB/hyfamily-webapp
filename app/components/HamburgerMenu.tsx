'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const todayLabel = new Date().toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const go = (path: string) => {
    router.replace(path);
  };

  /* 🔥 메뉴 공통 스타일 */
  const menuItemStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#eaeaea',
    textAlign: 'left',
    fontSize: '16px',
    padding: '6px 0',
    cursor: 'pointer',
    display: 'block',
  };

  return (
    <>
      {/* ===== 상단 헤더 ===== */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: '#1e1e1e',
          borderBottom: '1px solid #333',
          zIndex: 1001,
        }}
      >
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="메뉴"
          style={{
            fontSize: '16px',
            border: '1px solid #3a3a3a',
            borderRadius: '6px',
            padding: '4px 6px',
            background: '#2a2a2a',
            color: '#eaeaea',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>

        <div
          style={{
            fontSize: '15px',
            color: '#b0b0b0',
            whiteSpace: 'nowrap',
          }}
        >
          {todayLabel}
        </div>
      </header>

      {/* ===== 메뉴 열렸을 때 오버레이 ===== */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999,
          }}
        />
      )}

      {/* ===== 사이드 메뉴 ===== */}
      {open && (
        <aside
          style={{
            position: 'fixed',
            top: '40px',
            left: 0,
            width: '200px',
            height: 'calc(100vh - 40px)',
            background: '#1e1e1e',
            borderRight: '1px solid #333',
            padding: '14px',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <button onClick={() => go('/')} style={menuItemStyle}>
              🏠 홈
            </button>

            <button onClick={() => go('/schedule')} style={menuItemStyle}>
              📅 가족 일정
            </button>

            <button onClick={() => go('/board')} style={menuItemStyle}>
              📝 게시판
            </button>

            <button onClick={() => go('/cards')} style={menuItemStyle}>
              💳 카드 혜택
            </button>

            <button onClick={() => go('/company-benefits')} style={menuItemStyle}>
              🏢 회사 복지
            </button>

            <a
              href="https://wonderbb.github.io/hyrecipes/"
              target="_blank"
              rel="noreferrer"
              style={menuItemStyle}
            >
              🍳 요리 레시피
            </a>
          </nav>
        </aside>
      )}
    </>
  );
}