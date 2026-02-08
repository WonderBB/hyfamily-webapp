'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

export default function Home() {
  /* ======================
     hydration 방지
  ====================== */
  const [mounted, setMounted] = useState(false);

  /* ======================
     상태들 (모두 최상단)
  ====================== */
  const [members, setMembers] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [weekSchedules, setWeekSchedules] = useState<any[]>([]);

  /* ===== 할 일 ===== */
  const [todo, setTodo] = useState('');
  const [editingTodo, setEditingTodo] = useState(false);

  /* ======================
     mounted 체크
  ====================== */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ======================
     가족 구성원
  ====================== */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');

    setMembers(data ?? []);
  };

  /* ======================
     오늘의 공지
  ====================== */
  const fetchNotices = async () => {
    const { data } = await supabase
      .from('home_notices')
      .select('author_id, content');

    const map: Record<string, string> = {};
    (data ?? []).forEach((n) => {
      map[n.author_id] = n.content;
    });

    setNotices(map);
  };

  const saveNotice = async (authorId: string) => {
    const content = notices[authorId] ?? '';

    await supabase
      .from('home_notices')
      .upsert(
        { author_id: authorId, content },
        { onConflict: 'author_id' }
      );

    setEditing((prev) => ({ ...prev, [authorId]: false }));
    fetchNotices();
  };

  /* ======================
     할 일 (공동 메모)
  ====================== */
  const fetchTodo = async () => {
    const { data } = await supabase
      .from('home_todos')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(1);

    setTodo(data?.[0]?.content ?? '');
  };

  const saveTodo = async () => {
    if (!todo.trim()) {
      setEditingTodo(false);
      return;
    }

    const { error } = await supabase
      .from('home_todos')
      .insert({ content: todo });

    if (error) {
      alert('할 일 저장 중 오류가 발생했습니다.');
      console.error(error);
      return;
    }

    setEditingTodo(false);
    fetchTodo();
  };

  /* ======================
     최근 게시글
  ====================== */
  const fetchRecentPosts = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('id, title, created_at, author_id')
      .order('created_at', { ascending: false })
      .limit(3);

    setRecentPosts(data ?? []);
  };

  /* ======================
     이번 주 일정
  ====================== */
  const fetchWeekSchedules = async () => {
    const today = new Date();
    const day = today.getDay(); // 0=일
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

    const { data } = await supabase
      .from('family_schedules')
      .select('id, title, schedule_date, author_id')
      .gte('schedule_date', format(monday))
      .lte('schedule_date', format(sunday))
      .order('schedule_date');

    setWeekSchedules(data ?? []);
  };

  /* ======================
     초기 로딩
  ====================== */
  useEffect(() => {
    fetchMembers();
    fetchNotices();
    fetchTodo();
    fetchRecentPosts();
    fetchWeekSchedules();
  }, []);

  if (!mounted) return null;

  /* ======================
     유틸
  ====================== */
  const isToday = (dateStr: string) => {
    const t = new Date();
    const d = new Date(dateStr);
    return (
      t.getFullYear() === d.getFullYear() &&
      t.getMonth() === d.getMonth() &&
      t.getDate() === d.getDate()
    );
  };

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  /* ======================
     렌더
  ====================== */
  return (
    <main className="page-container">
      <div style={{ display: 'grid', gap: '12px' }}>
        {/* 📢 오늘의 공지 */}
        <section className="card">
          <h2>📢 오늘의 공지</h2>

          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <strong style={{ width: '56px', flexShrink: 0 }}>
                {m.name}
              </strong>

              <input
                value={notices[m.id] ?? ''}
                disabled={!editing[m.id]}
                onChange={(e) =>
                  setNotices((prev) => ({
                    ...prev,
                    [m.id]: e.target.value,
                  }))
                }
                style={{ flex: 1, minWidth: 0 }}
              />

              <button
                style={{ width: '44px' }}
                onClick={() =>
                  editing[m.id]
                    ? saveNotice(m.id)
                    : setEditing((p) => ({ ...p, [m.id]: true }))
                }
              >
                {editing[m.id] ? '저장' : '수정'}
              </button>
            </div>
          ))}
        </section>

        {/* 📝 할 일 */}
        <section className="card">
          <h2>📝 할 일</h2>

          <div style={{ display: 'flex', gap: '6px' }}>
            <textarea
              value={todo}
              disabled={!editingTodo}
              onChange={(e) => setTodo(e.target.value)}
              placeholder="오늘 할 일을 적어보세요"
              rows={5}
              style={{
                flex: 1,
                resize: 'none',
                overflowY: 'auto',
              }}
            />

            <button
              style={{ width: '44px', alignSelf: 'flex-start' }}
              onClick={() =>
                editingTodo ? saveTodo() : setEditingTodo(true)
              }
            >
              {editingTodo ? '저장' : '수정'}
            </button>
          </div>
        </section>

        {/* 📅 가족 일정 */}
        <section className="card">
          <h2>📅 가족 일정 (이번 주)</h2>

          {weekSchedules.length === 0 && (
            <p>이번 주 일정이 없습니다.</p>
          )}

          <ul>
            {weekSchedules.map((s) => (
              <li key={s.id}>
                <strong>
                  {new Date(s.schedule_date).getDate()}일
                </strong>
                {' - '}
                {s.title}
                {isToday(s.schedule_date) && ' 🔴'}
              </li>
            ))}
          </ul>

          <a href="/schedule">전체 일정 보기 →</a>
        </section>

        {/* 📝 게시판 */}
        <section className="card">
          <h2>📝 게시판</h2>

          {recentPosts.length === 0 && (
            <p style={{ fontSize: '14px', color: '#666' }}>
              아직 게시글이 없습니다.
            </p>
          )}

          <ul>
            {recentPosts.map((p) => (
              <li key={p.id} style={{ marginBottom: '6px' }}>
                <a href={`/board/${p.id}`}>
                  <strong>{p.title}</strong>
                </a>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {getNameById(p.author_id)} ·{' '}
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>

          <a href="/board">게시판으로 이동 →</a>
        </section>

        {/* 🔗 바로가기 */}
        <section className="card">
          <h2>🔗 바로가기</h2>
          <ul>
            <li><a href="/cards">카드 혜택</a></li>
            <li><a href="/company-benefits">회사 복지</a></li>
            <li>
              <a
                href="https://wonderbb.github.io/hyrecipes/"
                target="_blank"
                rel="noreferrer"
              >
                요리 레시피
              </a>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}