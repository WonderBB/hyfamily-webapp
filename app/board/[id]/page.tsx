'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

const NEW_HOURS = 24;

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
     댓글 관련
  ====================== */
  const [comments, setComments] = useState<any[]>([]);
  const [commentAuthorId, setCommentAuthorId] = useState('');
  const [commentContent, setCommentContent] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());

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
     댓글 조회
  ====================== */
  const fetchComments = async () => {
    const { data } = await supabase
      .from('board_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    setComments(data ?? []);
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
      .update({ title, content })
      .eq('id', postId);

    if (error) return;

    setEditing(false);
    fetchPost();
  };

  /* ======================
     게시글 삭제
  ====================== */
  const deletePost = async () => {
    if (!confirm('이 게시글을 삭제할까요?')) return;

    await supabase.from('board_posts').delete().eq('id', postId);
    router.push('/board');
  };

  /* ======================
     댓글 추가
  ====================== */
  const addComment = async () => {
    if (!commentAuthorId || !commentContent.trim()) return;

    await supabase.from('board_comments').insert({
      post_id: postId,
      author_id: commentAuthorId,
      content: commentContent,
    });

    setCommentContent('');
    fetchComments();
  };

  /* ======================
     댓글 수정
  ====================== */
  const startEditComment = (c: any) => {
    setEditingCommentId(c.id);
    setEditingCommentContent(c.content);
  };

  const saveEditComment = async (id: string) => {
    if (!editingCommentContent.trim()) return;

    await supabase
      .from('board_comments')
      .update({ content: editingCommentContent })
      .eq('id', id);

    setEditingCommentId(null);
    setEditingCommentContent('');
    fetchComments();
  };

  /* ======================
     댓글 삭제
  ====================== */
  const deleteComment = async (id: string) => {
    if (!confirm('이 댓글을 삭제할까요?')) return;

    await supabase.from('board_comments').delete().eq('id', id);
    fetchComments();
  };

  /* ======================
     NEW 댓글 계산
  ====================== */
  useEffect(() => {
    const set = new Set<string>();
    const now = Date.now();

    comments.forEach((c) => {
      const created = new Date(c.created_at).getTime();
      const diffHours = (now - created) / (1000 * 60 * 60);
      if (diffHours <= NEW_HOURS) set.add(c.id);
    });

    setNewCommentIds(set);
  }, [comments]);

  useEffect(() => {
    fetchMembers();
    fetchPost();
    fetchComments();
  }, []);

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  if (!post) return null;

  return (
    <main>
      <div className="page-container">
        <h1>게시글 상세</h1>

        <div className="card">
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
              <h2>{post.title}</h2>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                {getNameById(post.author_id)} ·{' '}
                {new Date(post.created_at).toLocaleString()}
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
              <div style={{ marginTop: '16px' }}>
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
        </div>

        {/* 댓글 영역 */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>댓글</h3>

          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                borderBottom: '1px solid #333',
                padding: '8px 0',
              }}
            >
              <strong>{getNameById(c.author_id)}</strong>

              {newCommentIds.has(c.id) && (
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '10px',
                    color: '#fff',
                    background: '#e53935',
                    padding: '2px 6px',
                    borderRadius: '8px',
                  }}
                >
                  NEW
                </span>
              )}

              {editingCommentId === c.id ? (
                <>
                  <textarea
                    value={editingCommentContent}
                    onChange={(e) =>
                      setEditingCommentContent(e.target.value)
                    }
                    rows={2}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                  <button onClick={() => saveEditComment(c.id)}>저장</button>
                  <button
                    onClick={() => setEditingCommentId(null)}
                    style={{ marginLeft: '6px' }}
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginTop: '4px', fontSize: '14px' }}>
                    {c.content}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                  <button
                    onClick={() => startEditComment(c)}
                    style={{ marginRight: '6px' }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    style={{ color: 'red' }}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          ))}

          {/* 댓글 작성 */}
          <div style={{ marginTop: '16px' }}>
            <select
              value={commentAuthorId}
              onChange={(e) => setCommentAuthorId(e.target.value)}
              style={{ width: '100%', marginBottom: '8px' }}
            >
              <option value="">작성자 선택</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
              placeholder="댓글을 입력하세요"
              style={{ width: '100%', marginBottom: '8px' }}
            />

            <button onClick={addComment}>댓글 등록</button>
          </div>
        </div>
      </div>
    </main>
  );
}