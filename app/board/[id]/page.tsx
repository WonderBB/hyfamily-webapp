'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import supabase from '../../../Lib/supabase';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  /* ======================
     상태
  ====================== */
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [authorId, setAuthorId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);

  /* ======================
     게시글 조회
  ====================== */
  const fetchPost = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select(`
        id,
        title,
        content,
        created_at,
        family_members ( name )
      `)
      .eq('id', postId)
      .single();

    setPost(data);
  };

  /* ======================
     댓글 조회 (JOIN ❌)
  ====================== */
  const fetchComments = async () => {
    const { data } = await supabase
      .from('board_comments')
      .select(`
        id,
        content,
        created_at,
        author_id
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    setComments(data ?? []);
  };

  /* ======================
     가족 구성원 조회
  ====================== */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');

    setMembers(data ?? []);
  };

  /* ======================
     초기 로딩
  ====================== */
  useEffect(() => {
    if (!postId) return;
    fetchPost();
    fetchComments();
    fetchMembers();
  }, [postId]);

  /* ======================
     댓글 작성
  ====================== */
  const handleCommentSubmit = async () => {
    if (!authorId || !commentText.trim()) {
      setError('작성자와 댓글 내용을 입력하세요.');
      return;
    }

    setError(null);

    const { error } = await supabase.from('board_comments').insert({
      post_id: postId,
      author_id: authorId,
      content: commentText,
    });

    if (!error) {
      setCommentText('');
      fetchComments();
    }
  };

  /* ======================
     댓글 삭제
  ====================== */
  const handleDeleteComment = async (commentId: string) => {
    const ok = confirm('이 댓글을 삭제할까요?');
    if (!ok) return;

    const { error } = await supabase
      .from('board_comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      fetchComments();
    }
  };

  return (
    <main style={{ padding: '16px' }}>
      <h1>게시글 상세</h1>
      <button
        onClick={() => router.push('/board')}
        style={{
          marginBottom: '12px',
          background: 'none',
          border: 'none',
          color: '#0070f3',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ← 게시글 목록으로
      </button>
      {/* 게시글 */}
      {post && (
        <section style={{ marginTop: '16px' }}>
          <h2>{post.title}</h2>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {post.family_members?.name} ·{' '}
            {new Date(post.created_at).toLocaleString()}
          </div>
          <p style={{ marginTop: '12px' }}>{post.content}</p>
        </section>
      )}

      {/* 댓글 */}
      <section style={{ marginTop: '32px' }}>
        <h3>댓글</h3>

        {comments.length === 0 && (
          <p style={{ color: '#666' }}>아직 댓글이 없습니다.</p>
        )}

        <ul>
          {comments.map((c) => {
            const author = members.find((m) => m.id === c.author_id);

            return (
              <li key={c.id} style={{ marginBottom: '8px' }}>
                <strong>{author?.name ?? '알 수 없음'}</strong> : {c.content}
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  style={{ marginLeft: '8px', color: 'red' }}
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>

        {/* 작성자 선택 */}
        <select
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          style={{ width: '100%', marginTop: '12px' }}
        >
          <option value="">작성자 선택</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* 댓글 입력 */}
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          placeholder="댓글을 입력하세요"
          style={{ width: '100%', marginTop: '8px' }}
        />

        <button onClick={handleCommentSubmit} style={{ marginTop: '8px' }}>
          댓글 등록
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>
    </main>
  );
}
