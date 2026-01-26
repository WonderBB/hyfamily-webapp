'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase';

const NEW_HOURS = 24;

export default function BoardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>(
    {}
  );
  const [members, setMembers] = useState<any[]>([]);

  // ✅ NEW 표시용 (빌드 안전)
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());

  /* ======================
     데이터 로딩 함수들
  ====================== */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');

    setMembers(data ?? []);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('id, title, created_at, author_id')
      .order('created_at', { ascending: false });

    setPosts(data ?? []);
  };

  const fetchCommentCounts = async () => {
    const { data } = await supabase
      .from('board_comments')
      .select('post_id');

    const map: Record<string, number> = {};
    (data ?? []).forEach((c) => {
      map[c.post_id] = (map[c.post_id] ?? 0) + 1;
    });

    setCommentCountMap(map);
  };

  /* ======================
     최초 로딩
  ====================== */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;

      await fetchMembers();
      await fetchPosts();
      await fetchCommentCounts();
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* ======================
     NEW 게시글 계산 (🔥 핵심 수정)
  ====================== */
  useEffect(() => {
    const set = new Set<string>();
    const now = Date.now();

    posts.forEach((post) => {
      const created = new Date(post.created_at).getTime();
      const diffHours = (now - created) / (1000 * 60 * 60);

      if (diffHours <= NEW_HOURS) {
        set.add(post.id);
      }
    });

    setNewPostIds(set);
  }, [posts]);

  /* ======================
     유틸
  ====================== */
  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  /* ======================
     렌더
  ====================== */
  return (
    <main style={{ padding: '16px' }}>
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
        }}
      >
        {/* 고정 헤더 */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#fff',
            padding: '12px 0',
            borderBottom: '1px solid #eee',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1 style={{ margin: 0 }}>📝 게시판</h1>

            <Link
              href="/board/new"
              style={{
                fontSize: '14px',
                padding: '6px 10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#333',
                whiteSpace: 'nowrap',
              }}
            >
              글쓰기
            </Link>
          </div>
        </div>

        {/* 게시글 목록 */}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <Link href={`/board/${post.id}`}>
                <strong>{post.title}</strong>

                {/* ✅ NEW 표시 (빌드 안전) */}
                {newPostIds.has(post.id) && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '12px',
                      color: 'white',
                      background: '#e53935',
                      padding: '2px 6px',
                      borderRadius: '8px',
                    }}
                  >
                    NEW
                  </span>
                )}

                <span style={{ marginLeft: '6px', color: '#666' }}>
                  ({commentCountMap[post.id] ?? 0})
                </span>
              </Link>

              <div style={{ fontSize: '13px', color: '#666' }}>
                {getNameById(post.author_id)} ·{' '}
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}