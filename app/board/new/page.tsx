'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

export default function BoardNewPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [authorId, setAuthorId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  /* 🔥 공지 상태 추가 */
  const [isNotice, setIsNotice] = useState(false);

  /* 🔥 여러 파일 지원 */
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;

      const { data } = await supabase
        .from('family_members')
        .select('id, name');

      if (mounted) {
        setMembers(data ?? []);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* 🔥 다중 파일 업로드 */
  const uploadFiles = async (postId: string) => {
    if (files.length === 0) return;

    for (const file of files) {
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
  };

  const handleSubmit = async () => {
    if (!authorId) {
      setError('작성자를 선택하세요.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력하세요.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('board_posts')
      .insert({
        title,
        content,
        author_id: authorId,
        is_notice: isNotice, // 🔥 추가
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    await uploadFiles(data.id);

    setLoading(false);
    router.push(`/board/${data.id}`);
  };

  return (
    <main>
      <div className="page-container">
        <h1>게시글 작성</h1>

        <div className="card">
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          >
            <option value="">작성자 선택</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          {/* 🔥 제목 + 공지 체크박스 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={isNotice}
                onChange={(e) => setIsNotice(e.target.checked)}
              />
              공지
            </label>
          </div>

          <textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            style={{ width: '100%', padding: '8px' }}
          />

          <input
            type="file"
            multiple
            onChange={(e) =>
              setFiles(e.target.files ? Array.from(e.target.files) : [])
            }
            style={{ marginTop: '8px' }}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: '12px' }}
          >
            {loading ? '저장 중...' : '등록'}
          </button>

          {error && (
            <p style={{ color: 'red', marginTop: '8px' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}