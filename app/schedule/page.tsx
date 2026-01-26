'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

// 🇰🇷 한국 공휴일 (필요한 연도만 추가)
const HOLIDAYS: string[] = [
  // 2026년
  '2026-01-01', // 신정
  '2026-02-16', // 설날
  '2026-02-17',
  '2026-02-18',
  '2026-03-01', // 삼일절
  '2026-05-05', // 어린이날
  '2026-06-06', // 현충일
  '2026-08-15', // 광복절
  '2026-10-05', // 추석
  '2026-10-06',
  '2026-10-07',
  '2026-10-09', // 한글날
  '2026-12-25', // 성탄절
];

export default function SchedulePage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  const [members, setMembers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  const [authorId, setAuthorId] = useState('');
  const [title, setTitle] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

const isHoliday = (dateStr: string) => HOLIDAYS.includes(dateStr);

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
     월별 일정 조회
  ====================== */
const fetchSchedules = async () => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // ✅ 핵심

  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('family_schedules')
    .select('*')
    .gte('schedule_date', start)
    .lte('schedule_date', end)
    .order('schedule_date');

  if (error) {
    console.error('일정 조회 오류', error);
    return;
  }

  setSchedules(data ?? []);
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
  if (!currentMonth) return;

  let mounted = true;

  const load = async () => {
    if (!mounted) return;
    await fetchSchedules();
  };

  load();

  return () => {
    mounted = false;
  };
}, [currentMonth]);
  /* ======================
     일정 추가
  ====================== */
const addSchedule = async () => {
  if (!selectedDate || !authorId || !title.trim()) return;

  const { error } = await supabase.from('family_schedules').insert({
    author_id: authorId,
    title,
    schedule_date: selectedDate,
  });

  if (error) {
    console.error(error);
    alert('일정 추가 중 오류가 발생했습니다.');
    return;
  }

  // ✅ 핵심: 추가한 날짜 기준으로 월 이동
  const d = new Date(selectedDate);
  setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));

  setTitle('');
  fetchSchedules();
};

  /* ======================
     일정 수정 / 삭제
  ====================== */
  const startEdit = (s: any) => {
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;

    await supabase
      .from('family_schedules')
      .update({ title: editTitle })
      .eq('id', id);

    setEditingId(null);
    setEditTitle('');
    fetchSchedules();
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('이 일정을 삭제할까요?')) return;

    await supabase.from('family_schedules').delete().eq('id', id);
    fetchSchedules();
  };

  /* ======================
     캘린더 계산
  ====================== */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const hasSchedule = (date: string) =>
    schedules.some((s) => s.schedule_date === date);

  const monthLabel = `${year}년 ${month + 1}월`;

  /* ======================
     렌더
  ====================== */
  return (
    <main style={{ padding: '16px' }}>
      <h1>📅 가족 일정</h1>

      {/* 월 이동 */}
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
          ←
        </button>
        <strong style={{ margin: '0 12px' }}>{monthLabel}</strong>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
          →
        </button>
      </div>

      {/* 요일 헤더 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontWeight: 600,
          marginBottom: '6px',
        }}
      >
        <span style={{ color: 'red' }}>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span style={{ color: 'blue' }}>토</span>
      </div>

      {/* 캘린더 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}
      >
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dayOfWeek = date.getDay();

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            day
          ).padStart(2, '0')}`;

        let color = '#000';

if (dayOfWeek === 0 || isHoliday(dateStr)) {
  color = 'red'; // 일요일 또는 공휴일
}

if (dayOfWeek === 6) {
  color = 'blue'; // 토요일
}

          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                position: 'relative',
                padding: '6px',
                border: '1px solid #ddd',
                textAlign: 'center',
                cursor: 'pointer',
                color,
                background: isSelected
                  ? '#bbdefb'
                  : hasSchedule(dateStr)
                  ? '#e3f2fd'
                  : '#fff',
              }}
            >
              {/* 일정 있는 날 빨간 점 */}
              {hasSchedule(dateStr) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '6px',
                    width: '6px',
                    height: '6px',
                    backgroundColor: 'red',
                    borderRadius: '50%',
                  }}
                />
              )}

              {/* 날짜 숫자 */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  margin: '0 auto',
                  lineHeight: '28px',
                  borderRadius: '50%',
                  border: isToday ? '2px solid #1976d2' : 'none',
                }}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택 날짜 상세 */}
      {selectedDate && (
        <section style={{ marginTop: '20px' }}>
          <h3>{selectedDate} 일정</h3>

          <ul>
            {schedules
              .filter((s) => s.schedule_date === selectedDate)
              .map((s) => (
                <li key={s.id} style={{ marginBottom: '6px' }}>
                  <strong>
                    {members.find((m) => m.id === s.author_id)?.name}
                  </strong>{' '}
                  :
                  {editingId === s.id ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ marginLeft: '6px' }}
                      />
                      <button onClick={() => saveEdit(s.id)}>저장</button>
                    </>
                  ) : (
                    <>
                      {' '}
                      {s.title}
                      <button onClick={() => startEdit(s)} style={{ marginLeft: '6px' }}>
                        수정
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    style={{ marginLeft: '6px', color: 'red' }}
                  >
                    삭제
                  </button>
                </li>
              ))}
          </ul>

          {/* 일정 추가 */}
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <option value="">작성자 선택</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 내용"
            style={{ width: '100%', marginTop: '8px' }}
          />

          <button onClick={addSchedule} style={{ marginTop: '8px' }}>
            일정 추가
          </button>
        </section>
      )}
    </main>
  );
}
