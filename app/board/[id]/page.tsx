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

  /* 🔥 공지 상태 추가 */
  const [isNotice, setIsNotice] = useState(false);

  const [attachments, setAttachments] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  /* ======================
     댓글 관련
  ====================== */
  const [comments, setComments] = useState<any[]>([]);
  const [commentAuthorId, setCommentAuthorId] = useState('');
  const [commentContent, setCommentContent] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());

  /* ====================== */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');
    setMembers(data ?? []);
  };

  const fetchPost = async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('*')
      .eq('id', postId)
      .single();

    setPost(data);
    setTitle(data?.title ?? '');
    setContent(data?.content ?? '');
    setIsNotice(data?.is_notice ?? false); // 🔥 추가
  };

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from('board_attachments')
      .select('*')
      .eq('post_id', postId);

    setAttachments(data ?? []);
  };

  const deleteAttachment = async (file: any) => {
    if (!confirm('첨부파일을 삭제할까요?')) return;

    if (file.file_path) {
      await supabase.storage
        .from('board-files')
        .remove([file.file_path]);
    }

    await supabase
      .from('board_attachments')
      .delete()
      .eq('id', file.id);

    fetchAttachments();
  };

  const uploadNewFiles = async () => {
    if (newFiles.length === 0) return;

    for (const file of newFiles) {
      const filePath = `${postId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('board-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('board-files')
        .getPublicUrl(filePath);

      await supabase.from('board_attachments').insert({
        post_id: postId,
        file_name: file.name,
        file_url: data.publicUrl,
        file_path: filePath,
      });
    }

    setNewFiles([]);
    fetchAttachments();
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('board_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    setComments(data ?? []);
  };

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
        is_notice: isNotice, // 🔥 추가
      })
      .eq('id', postId);

    if (error) return;

    await uploadNewFiles();

    setEditing(false);
    fetchPost();
  };

  const deletePost = async () => {
    if (!confirm('이 게시글을 삭제할까요?')) return;
    await supabase.from('board_posts').delete().eq('id', postId);
    router.push('/board');
  };

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

  const deleteComment = async (id: string) => {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    await supabase.from('board_comments').delete().eq('id', id);
    fetchComments();
  };

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
    fetchAttachments();
  }, []);

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  const isImage = (fileName: string) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  if (!post) return null;

  return (
    <main>
      <div className="page-container">
        <h1>게시글 상세</h1>

        <div className="card">
          {editing ? (
            <>
              {/* 🔥 제목 + 공지 체크 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={isNotice}
                    onChange={(e) => setIsNotice(e.target.checked)}
                  />
                  공지
                </label>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                style={{ width: '100%' }}
              />

              {attachments.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4>첨부파일</h4>
                  {attachments.map((file) => (
                    <div key={file.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span>{file.file_name}</span>
                      <button
                        onClick={() => deleteAttachment(file)}
                        style={{ color: 'red', fontSize: '12px' }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setNewFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <button onClick={updatePost}>저장</button>
                <button onClick={() => setEditing(false)} style={{ marginLeft: '8px' }}>
                  취소
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>
                {post.is_notice && (
                  <span style={{ color: 'red', marginRight: '6px' }}>
                    공지
                  </span>
                )}
                {post.title}
              </h2>

              <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                {getNameById(post.author_id)} ·{' '}
                {new Date(post.created_at).toLocaleString()}
              </div>

              <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

              {attachments.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4>첨부파일</h4>
                  {attachments.map((file) => (
                    <div key={file.id} style={{ marginBottom: '8px' }}>
                      {isImage(file.file_name) ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          style={{ maxWidth: '100%', borderRadius: '6px' }}
                        />
                      ) : (
                        <a href={file.file_url} target="_blank" rel="noreferrer">
                          {file.file_name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <button onClick={() => router.push('/board')}>
                  목록으로
                </button>
                <button onClick={() => setEditing(true)} style={{ marginLeft: '8px' }}>
                  수정
                </button>
                <button onClick={deletePost} style={{ marginLeft: '8px', color: 'red' }}>
                  삭제
                </button>
              </div>
            </>
          )}
        </div>

        {/* 댓글 영역 이하 기존 그대로 유지 */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>댓글</h3>
          {comments.map((c) => (
            <div key={c.id} style={{ borderBottom: '1px solid #333', padding: '8px 0' }}>
              <strong>{getNameById(c.author_id)}</strong>
              {newCommentIds.has(c.id) && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '10px',
                  color: '#fff',
                  background: '#e53935',
                  padding: '2px 6px',
                  borderRadius: '8px',
                }}>
                  NEW
                </span>
              )}
              {editingCommentId === c.id ? (
                <>
                  <textarea
                    value={editingCommentContent}
                    onChange={(e) => setEditingCommentContent(e.target.value)}
                    rows={2}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                  <button onClick={() => saveEditComment(c.id)}>저장</button>
                  <button onClick={() => setEditingCommentId(null)} style={{ marginLeft: '6px' }}>
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
                  <button onClick={() => startEditComment(c)} style={{ marginRight: '6px' }}>
                    수정
                  </button>
                  <button onClick={() => deleteComment(c.id)} style={{ color: 'red' }}>
                    삭제
                  </button>
                </>
              )}
            </div>
          ))}

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