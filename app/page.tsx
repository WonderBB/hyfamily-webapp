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
     상태들
  ====================== */
  const [members, setMembers] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [weekSchedules, setWeekSchedules] = useState<any[]>([]);

  const [todo, setTodo] = useState('');
  const [editingTodo, setEditingTodo] = useState(false);

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
     할 일 (단일 row 유지 - key 기반)
  ====================== */
  const fetchTodo = async () => {
    const { data, error } = await supabase
      .from('home_todos')
      .select('content')
      .eq('key', 'main')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
      return;
    }

    setTodo(data?.content ?? '');
  };

  const saveTodo = async () => {
    if (!todo.trim()) {
      setEditingTodo(false);
      return;
    }

    const { error } = await supabase
      .from('home_todos')
      .upsert(
        {
          key: 'main',
          content: todo,
        },
        {
          onConflict: 'key',
        }
      );

    if (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
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
     이번 주 일정 (시간 포함 + 정렬)
  ====================== */
  const fetchWeekSchedules = async () => {
    const today = new Date();
    const day = today.getDay();
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
      .select('id, title, schedule_date, schedule_time, author_id')
      .gte('schedule_date', format(monday))
      .lte('schedule_date', format(sunday));

    const sorted =
      data?.sort((a, b) => {
        if (a.schedule_date !== b.schedule_date) {
          return a.schedule_date.localeCompare(b.schedule_date);
        }

        if (a.schedule_time === 'ALL_DAY') return -1;
        if (b.schedule_time === 'ALL_DAY') return 1;

        return (a.schedule_time ?? '').localeCompare(b.schedule_time ?? '');
      }) ?? [];

    setWeekSchedules(sorted);
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
  const getDateWithDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getDate()}일 (${days[d.getDay()]})`;
  };

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
    <main className="page-container" style={{ paddingTop: '8px' }}>
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
              <strong className="notice-member-name">
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <h2 style={{ margin: 0 }}>📝 할 일</h2>

            <button
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                height: '28px',
              }}
              onClick={() =>
                editingTodo ? saveTodo() : setEditingTodo(true)
              }
            >
              {editingTodo ? '저장' : '수정'}
            </button>
          </div>

          <textarea
            value={todo}
            disabled={!editingTodo}
            onChange={(e) => setTodo(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              resize: 'none',
              overflowY: 'auto',
            }}
          />
        </section>

        {/* 📅 가족 일정 */}
        <section className="card">
          <h2>📅 가족 일정 (이번 주)</h2>

          {weekSchedules.length === 0 && (
            <p>이번 주 일정이 없습니다.</p>
          )}

          <ul>
            {weekSchedules.map((s) => (
              <li key={s.id} style={{ marginBottom: '6px' }}>
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  <strong>
                    {getDateWithDay(s.schedule_date)}
                  </strong>
                  {' - '}
                  {s.schedule_time && s.schedule_time !== 'ALL_DAY' && (
                    <span>{s.schedule_time} </span>
                  )}
                  {s.title}

                  {isToday(s.schedule_date) && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '-8px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#ff6b6b',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </span>
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