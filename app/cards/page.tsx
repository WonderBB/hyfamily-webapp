'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

const CATEGORIES = [
  '주유',
  '쇼핑',
  '대중교통',
  '대형마트',
  '편의점',
  '외식',
  '카페/베이커리',
  '영화',
  '관리비',
  '통신',
  '교육',
  '의료',
  '육아',
  '문화',
  '뷰티',
  '생활',
];

type BenefitRow = {
  card_id: string;
  category: string;
  benefit_description: string;
  cards: {
    card_name: string;
    owner_id: string;
    monthly_requirement: string | null;
  };
};

export default function CardBenefitsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);

  /* 가족 구성원 */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');

    setMembers(data ?? []);
  };

  /* 카테고리별 혜택 조회 */
  const fetchBenefitsByCategory = async (category: string) => {
    if (!category) {
      setBenefits([]);
      return;
    }

    const { data, error } = await supabase
      .from('card_benefits')
      .select(`
        card_id,
        category,
        benefit_description,
        cards (
          card_name,
          owner_id,
          monthly_requirement
        )
      `)
      .eq('category', category);

    if (error) {
      console.error(error);
      return;
    }

    setBenefits(data ?? []);
  };

useEffect(() => {
  let mounted = true;

  const load = async () => {
    if (!mounted) return;
    await fetchMembers();
  };

  load();

  return () => {
    mounted = false;
  };
}, []);

useEffect(() => {
  if (!selectedCategory) return;

  let mounted = true;

  const load = async () => {
    if (!mounted) return;
    await fetchBenefitsByCategory(selectedCategory);
  };

  load();

  return () => {
    mounted = false;
  };
}, [selectedCategory]);

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  return (
    <main style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>
      <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  }}
>
  <h1 style={{ margin: 0 }}>💳 카드 혜택 조회</h1>

  <a
    href="/cards/manage"
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
    카드 등록
  </a>
</div>

      {/* 카테고리 선택 */}
      <section style={cardStyle}>
        <h2>카테고리 선택</h2>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={inputStyle}
        >
          <option value="">선택하세요</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      {/* 혜택 목록 */}
      <section style={cardStyle}>
        <h2>
          {selectedCategory
            ? `📌 ${selectedCategory} 혜택`
            : '카테고리를 선택하세요'}
        </h2>

        {selectedCategory && benefits.length === 0 && (
          <p style={{ color: '#666' }}>
            해당 카테고리에 등록된 카드 혜택이 없습니다.
          </p>
        )}

        <ul style={{ padding: 0, listStyle: 'none' }}>
          {benefits.map((b, idx) => (
            <li
              key={idx}
              style={{
                borderBottom: '1px solid #eee',
                padding: '8px 0',
              }}
            >
              <strong>{b.cards.card_name}</strong>{' '}
              ({getNameById(b.cards.owner_id)})
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                {b.benefit_description}
              </div>
              {b.cards.monthly_requirement && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  전월 실적: {b.cards.monthly_requirement}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '16px',
};

const inputStyle = {
  width: '100%',
  padding: '6px',
};
