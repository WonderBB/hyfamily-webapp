'use client';

import { useEffect, useState } from 'react';
import supabase from '../lib/supabase';

export default function Home() {
  const [members, setMembers] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [weekSchedules, setWeekSchedules] = useState<any[]>([]);

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
     사용자별 공지
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

    const { error } = await supabase
      .from('home_notices')
      .upsert(
        {
          author_id: authorId,
          content,
        },
        { onConflict: 'author_id' }
      );

    if (error) {
      console.error('공지 저장 실패', error);
      alert('공지 저장 중 오류가 발생했습니다.');
      return;
    }

    setEditing((prev) => ({ ...prev, [authorId]: false }));
    fetchNotices(); // ✅ 저장 후 다시 불러오기
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
     이번 주 일정 (월요일 ~ 일요일 기준)
  ====================== */
const fetchWeekSchedules = async () => {
  const today = new Date();
  const day = today.getDay(); // 0=일, 1=월 ...

  // 월요일 기준
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // ✅ 로컬 날짜 문자열 생성 (중요)
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const start = formatDate(monday);
  const end = formatDate(sunday);

  const { data, error } = await supabase
    .from('family_schedules')
    .select('id, title, schedule_date, author_id')
    .gte('schedule_date', start)
    .lte('schedule_date', end)
    .order('schedule_date');

  if (error) {
    console.error('주간 일정 조회 실패', error);
    return;
  }

  setWeekSchedules(data ?? []);
};

  useEffect(() => {
    fetchMembers();
    fetchNotices();
    fetchRecentPosts();
    fetchWeekSchedules();
  }, []);


const isToday = (dateStr: string) => {
  const today = new Date();
  const d = new Date(dateStr);

  return (
    today.getFullYear() === d.getFullYear() &&
    today.getMonth() === d.getMonth() &&
    today.getDate() === d.getDate()
  );
};

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  return (
    <main style={{ padding: '16px' }}>
      <div style={{ display: 'grid', gap: '12px' }}>
        {/* 📢 오늘의 공지 */}
        <section style={cardStyle}>
          <h2>📢 오늘의 공지</h2>

          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                gap: '8px',
              }}
            >
              <strong style={{ minWidth: '60px' }}>
                {m.name}:
              </strong>

              <input
                type="text"
                value={notices[m.id] ?? ''}
                disabled={!editing[m.id]}
                onChange={(e) =>
                  setNotices((prev) => ({
                    ...prev,
                    [m.id]: e.target.value,
                  }))
                }
                style={{ flex: 1 }}
              />

              {!editing[m.id] && (
                <button
                  onClick={() =>
                    setEditing((prev) => ({
                      ...prev,
                      [m.id]: true,
                    }))
                  }
                >
                  수정
                </button>
              )}

              {editing[m.id] && (
                <button onClick={() => saveNotice(m.id)}>
                  저장
                </button>
              )}
            </div>
          ))}
        </section>

        {/* 📅 가족 일정 (이번 주) */}
        <section style={cardStyle}>
          <h2>📅 가족 일정 (이번 주)</h2>

          {weekSchedules.length === 0 && (
            <p>이번 주 일정이 없습니다.</p>
          )}

          <ul style={{ paddingLeft: '16px' }}>
            {weekSchedules.map((s) => (
           <li
  key={s.id}
  style={{
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }}
>
  {/* 날짜 + 빨간 점 */}
  <span style={{ position: 'relative', display: 'inline-block' }}>
    <strong>
      {new Date(s.schedule_date).getDate()}일
    </strong>

    {isToday(s.schedule_date) && (
      <span
        style={{
          position: 'absolute',
          top: '-2px',
          right: '-6px',
          width: '6px',
          height: '6px',
          backgroundColor: '#e53935',
          borderRadius: '50%',
        }}
      />
    )}
  </span>

  <span>- {s.title}</span>
</li>
            ))}
          </ul>

          <a
            href="/schedule"
            style={{ display: 'inline-block', marginTop: '8px' }}
          >
            전체 일정 보기 →
          </a>
        </section>

        {/* 📝 게시판 */}
        <section style={cardStyle}>
          <h2>📝 게시판</h2>

          {recentPosts.length === 0 && (
            <p style={{ fontSize: '14px', color: '#666' }}>
              아직 게시글이 없습니다.
            </p>
          )}

          <ul style={{ paddingLeft: '16px', marginTop: '8px' }}>
            {recentPosts.map((post) => (
              <li key={post.id} style={{ marginBottom: '6px' }}>
                <a href={`/board/${post.id}`}>
                  <strong>{post.title}</strong>
                </a>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {getNameById(post.author_id)} ·{' '}
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>

          <a
            href="/board"
            style={{ display: 'inline-block', marginTop: '8px' }}
          >
            게시판으로 이동 →
          </a>
        </section>

        {/* 🔗 바로가기 */}
        <section style={cardStyle}>
          <h2>🔗 바로가기</h2>
          <ul>
            <li><a href="/cards">카드 혜택</a></li>
            <li><a href="/company-benefits">회사 복지</a></li>
            <li>
              요리 레시피 (
              <a
                href="https://wonderbb.github.io/hyrecipes/"
                target="_blank"
                rel="noreferrer"
              >
                바로가기
              </a>
              )
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px',
};