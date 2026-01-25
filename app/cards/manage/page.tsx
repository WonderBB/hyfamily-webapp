'use client';

import { useEffect, useState } from 'react';
import supabase from '../../../lib/supabase';

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

export default function CardManagerPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [cardName, setCardName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [monthlyRequirement, setMonthlyRequirement] = useState('');
  const [benefits, setBenefits] = useState<Record<string, string>>({});

  /* ======================
     데이터 로딩
  ====================== */
  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('family_members')
      .select('id, name');

    if (error) {
      console.error('members error', error);
      return;
    }

    setMembers(data ?? []);
  };

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('id, card_name, owner_id, monthly_requirement');

    if (error) {
      console.error('cards error', error);
      return;
    }

    setCards(data ?? []);
  };

  const fetchBenefits = async (cardId: string) => {
    const { data } = await supabase
      .from('card_benefits')
      .select('category, benefit_description')
      .eq('card_id', cardId);

    const map: Record<string, string> = {};
    (data ?? []).forEach((b) => {
      map[b.category] = b.benefit_description;
    });
    setBenefits(map);
  };

  useEffect(() => {
    fetchMembers();
    fetchCards();
  }, []);

  /* ======================
     저장
  ====================== */
  const saveCard = async () => {
    if (!cardName.trim() || !ownerId) {
      alert('카드 이름과 소유자는 필수입니다.');
      return;
    }

    let cardId = editingId;

    if (!editingId) {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          card_name: cardName,
          owner_id: ownerId,
          monthly_requirement: monthlyRequirement,
        })
        .select()
        .single();

      if (error) {
        console.error('insert error', error);
        return;
      }

      cardId = data.id;
    } else {
      await supabase
        .from('cards')
        .update({
          card_name: cardName,
          owner_id: ownerId,
          monthly_requirement: monthlyRequirement,
        })
        .eq('id', editingId);

      await supabase
        .from('card_benefits')
        .delete()
        .eq('card_id', editingId);
    }

    const rows = Object.entries(benefits)
      .filter(([, v]) => v.trim())
      .map(([category, benefit]) => ({
        card_id: cardId,
        category,
        benefit_description: benefit,
      }));

    if (rows.length > 0) {
      await supabase.from('card_benefits').insert(rows);
    }

    resetForm();
    fetchCards();
  };

const deleteCard = async (cardId: string) => {
  const ok = confirm('이 카드를 삭제할까요?\n(혜택도 함께 삭제됩니다)');
  if (!ok) return;

  // 1️⃣ 혜택 먼저 삭제
  const { error: benefitError } = await supabase
    .from('card_benefits')
    .delete()
    .eq('card_id', cardId);

  if (benefitError) {
    console.error('혜택 삭제 실패', benefitError);
    alert('카드 혜택 삭제 중 오류가 발생했습니다.');
    return;
  }

  // 2️⃣ 카드 삭제
  const { error: cardError } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);

  if (cardError) {
    console.error('카드 삭제 실패', cardError);
    alert('카드 삭제 중 오류가 발생했습니다.');
    return;
  }

  // 3️⃣ 화면 갱신
  fetchCards();
  resetForm();
};



  const resetForm = () => {
    setEditingId(null);
    setCardName('');
    setOwnerId('');
    setMonthlyRequirement('');
    setBenefits({});
  };

  const startEdit = async (card: any) => {
    setEditingId(card.id);
    setCardName(card.card_name);
    setOwnerId(card.owner_id);
    setMonthlyRequirement(card.monthly_requirement ?? '');
    await fetchBenefits(card.id);
  };

  const getNameById = (id: string) =>
    members.find((m) => m.id === id)?.name ?? '알 수 없음';

  return (
    <main style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>
      <h1>💳 카드 관리</h1>

      <section style={cardStyle}>
        <h2>{editingId ? '카드 수정' : '카드 등록'}</h2>

        <input
          placeholder="카드 이름 *"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          style={inputStyle}
        />

        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          style={inputStyle}
        >
          <option value="">소유자 선택 *</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <input
          placeholder="전월 실적 (선택)"
          value={monthlyRequirement}
          onChange={(e) => setMonthlyRequirement(e.target.value)}
          style={inputStyle}
        />

        <h3>혜택</h3>

        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: '6px' }}>
            <strong>{cat} :</strong>{' '}
            <input
              value={benefits[cat] ?? ''}
              onChange={(e) =>
                setBenefits((prev) => ({
                  ...prev,
                  [cat]: e.target.value,
                }))
              }
              style={{ width: '70%' }}
            />
          </div>
        ))}

        <button onClick={saveCard}>
          {editingId ? '저장' : '등록'}
        </button>
        {editingId && (
          <button onClick={resetForm} style={{ marginLeft: '8px' }}>
            취소
          </button>
        )}
      </section>

      <section style={cardStyle}>
        <h2>📄 등록된 카드</h2>

        <ul>
          {cards.map((c) => (
            <li key={c.id} style={{ marginBottom: '8px' }}>
              <strong>{c.card_name}</strong> ({getNameById(c.owner_id)})
              <button
                onClick={() => startEdit(c)}
                style={{ marginLeft: '8px' }}
              >
                수정
              </button>

              <button
                onClick={() => deleteCard(c.id)}
                style={{ marginLeft: '6px', color: 'red',}}
              >
                삭제
              </button>
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
  marginBottom: '8px',
};
