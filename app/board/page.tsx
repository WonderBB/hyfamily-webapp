'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '../../lib/supabase';

const NEW_HOURS = 24;

export default function BoardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>(
    {}
  );
  const [members, setMembers] = useState<any[]>([]);

  /* 가족 구성원 */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');

    setMembers(data ?? []);
  };

  /* 게시글 목록 */
  const fetchPosts = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('id, title, created_at, author_id')
      .order('created_at', { ascending: false });

    setPosts(data ?? []);
  };

  /* 댓글 수 */
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

  useEffect(() => {
    fetchMembers();
    fetchPosts();
    fetchCommentCounts();
  }, []);

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  const isNewPost = (createdAt: string) => {
    const diff =
      (Date.now() - new Date(createdAt).getTime()) /
      (1000 * 60 * 60);
    return diff <= NEW_HOURS;
  };

  return (
    <main style={{ padding: '16px' }}>
      {/* ✅ 폭 제어 컨테이너 */}
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
        }}
      >
        {/* ✅ 고정 헤더 */}
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

                {isNewPost(post.created_at) && (
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
