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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 가족 구성원 불러오기
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

  // 게시글 등록
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
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push(`/board/${data.id}`);
    }
  };

  return (
    <main style={{ padding: '16px' }}>
      <h1>게시글 작성</h1>

      {/* 작성자 선택 */}
      <div style={{ marginTop: '12px' }}>
        <select
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">작성자 선택</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '12px' }}>
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginTop: '12px' }}>
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ marginTop: '12px' }}
      >
        {loading ? '저장 중...' : '등록'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}
