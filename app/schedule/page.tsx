'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

// 🇰🇷 공휴일 (필요한 연도만 추가)
const HOLIDAYS = [
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-03-01',
  '2026-05-05',
  '2026-06-06',
  '2026-08-15',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-09',
  '2026-12-25',
];

export default function SchedulePage() {
  const today = new Date();
  const todayStr = formatDate(today);

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

  /* ======================
     유틸
  ====================== */
  function formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const isHoliday = (date: string) => HOLIDAYS.includes(date);

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

    const start = formatDate(new Date(year, month, 1));
    const end = formatDate(new Date(year, month + 1, 0));

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
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchSchedules();
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
      alert('일정 추가 실패');
      return;
    }

    setTitle('');
    fetchSchedules();
  };

  /* ======================
     일정 수정 / 삭제
  ====================== */
  const startEdit = (s: any) => {
    setEditingId(s.id);
    setEditTitle(s.title); // ✅ 핵심 수정
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

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const hasSchedule = (date: string) =>
    schedules.some((s) => s.schedule_date === date);

  const monthLabel = `${year}년 ${month + 1}월`;

  /* ======================
     렌더
  ====================== */
  return (
    <main className="page-container">
      <h1>📅 가족 일정</h1>

      {/* 월 이동 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
          ←
        </button>

        <strong>{monthLabel}</strong>

        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
          →
        </button>

        {/* ✅ 오늘로 */}
        <button
          style={{ marginLeft: 'auto', fontSize: '12px' }}
          onClick={() => {
            setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(todayStr);
          }}
        >
          오늘
        </button>
      </div>

      {/* 요일 */}
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
          <div key={i} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDate(new Date(year, month, day));
          const dayOfWeek = new Date(year, month, day).getDay();

          let color = '#000';
          if (dayOfWeek === 0 || isHoliday(dateStr)) color = 'red';
          if (dayOfWeek === 6) color = 'blue';

          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                padding: '6px',
                border: '1px solid #ddd',
                textAlign: 'center',
                cursor: 'pointer',
                background: isSelected ? '#bbdefb' : '#fff',
              }}
            >
              {/* 날짜 */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  margin: '0 auto',
                  lineHeight: '28px',
                  borderRadius: '50%',
                  backgroundColor: isToday ? '#1976d2' : 'transparent',
                  color: isToday ? '#fff' : color,
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {day}
              </div>

              {/* 일정 점 */}
              {hasSchedule(dateStr) && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    background: 'red',
                    borderRadius: '50%',
                    margin: '4px auto 0',
                  }}
                />
              )}
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
                      {s.title}
                      <button
                        onClick={() => startEdit(s)}
                        style={{ marginLeft: '6px' }}
                      >
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