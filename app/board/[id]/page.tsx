'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabase from '../../../lib/supabase';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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
     게시글 상세
  ====================== */
  const fetchPost = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('*')
      .eq('id', postId)
      .single();

    setPost(data);
    setTitle(data?.title ?? '');
    setContent(data?.content ?? '');
  };

  /* ======================
     게시글 수정
  ====================== */
  const updatePost = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력하세요.');
      return;
    }

    const { error } = await supabase
      .from('board_posts')
      .update({
        title,
        content,
      })
      .eq('id', postId);

    if (error) {
      alert('수정 중 오류가 발생했습니다.');
      console.error(error);
      return;
    }

    setEditing(false);
    fetchPost();
  };

  /* ======================
     게시글 삭제
  ====================== */
  const deletePost = async () => {
    const ok = confirm('이 게시글을 삭제할까요?');
    if (!ok) return;

    const { error } = await supabase
      .from('board_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      alert('삭제 중 오류가 발생했습니다.');
      console.error(error);
      return;
    }

    router.push('/board');
  };

useEffect(() => {
  let mounted = true;

  const load = async () => {
    if (!mounted) return;

    await fetchMembers();
    await fetchPosts();
    
  };

  load();

  return () => {
    mounted = false;
  };
}, []);

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  if (!post) return null;

  return (
    <main style={{ padding: '16px' }}>
      <h1>게시글 상세</h1>

      {/* ===== 수정 모드 ===== */}
      {editing ? (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            style={{ width: '100%' }}
          />

          <div style={{ marginTop: '12px' }}>
            <button onClick={updatePost}>저장</button>
            <button
              onClick={() => setEditing(false)}
              style={{ marginLeft: '8px' }}
            >
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ===== 보기 모드 ===== */}
          <h2 style={{ marginTop: '16px' }}>{post.title}</h2>

          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            {getNameById(post.author_id)} ·{' '}
            {new Date(post.created_at).toLocaleString()}
          </div>

          <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

          <div style={{ marginTop: '24px' }}>
            <button onClick={() => router.push('/board')}>
              목록으로
            </button>

            <button
              onClick={() => setEditing(true)}
              style={{ marginLeft: '8px' }}
            >
              수정
            </button>

            <button
              onClick={deletePost}
              style={{ marginLeft: '8px', color: 'red' }}
            >
              삭제
            </button>
          </div>
        </>
      )}
    </main>
  );
}