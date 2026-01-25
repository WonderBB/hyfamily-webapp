'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

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

    await supabase
      .from('home_notices')
      .upsert({
        author_id: authorId,
        content,
        updated_at: new Date().toISOString(),
      });

    setEditing((prev) => ({ ...prev, [authorId]: false }));
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
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const start = sunday.toISOString().slice(0, 10);
    const end = saturday.toISOString().slice(0, 10);

    const { data } = await supabase
      .from('family_schedules')
      .select('id, title, schedule_date, author_id')
      .gte('schedule_date', start)
      .lte('schedule_date', end)
      .order('schedule_date');

    setWeekSchedules(data ?? []);
  };

  useEffect(() => {
    fetchMembers();
    fetchNotices();
    fetchRecentPosts();
    fetchWeekSchedules();
  }, []);

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  return (
    <main style={{ padding: '16px' }}>
      {/* <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>
        가족 웹앱
      </h1> */}

      <div style={{ display: 'grid', gap: '12px' }}>
        {/* 📢 공지 */}
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

        {/* 📅 가족 일정 (이번 주 요약 추가됨) */}
        <section style={cardStyle}>
          <h2>📅 가족 일정 (이번 주)</h2>

          {weekSchedules.length === 0 && (
            <p>이번 주 일정이 없습니다.</p>
          )}

          <ul style={{ paddingLeft: '16px' }}>
            {weekSchedules.map((s) => (
              <li key={s.id} style={{ marginBottom: '4px' }}>
                <strong>
                  {new Date(s.schedule_date).getDate()}일
                </strong>{' '}
                - {getNameById(s.author_id)} : {s.title}
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
                  {new Date(
                    post.created_at
                  ).toLocaleDateString()}
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
            <li>
              <a href="/cards">카드 혜택</a>
            </li>
            <li>
              <a href="/company-benefits">회사 복지</a>
            </li>
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
