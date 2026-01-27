'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

// 🇰🇷 한국 공휴일
const HOLIDAYS: string[] = [
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

  /* 가족 구성원 */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');

    setMembers(data ?? []);
  };

  /* 월별 일정 */
  const fetchSchedules = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    const { data } = await supabase
      .from('family_schedules')
      .select('*')
      .gte('schedule_date', start)
      .lte('schedule_date', end)
      .order('schedule_date');

    setSchedules(data ?? []);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [currentMonth]);

  /* 일정 추가 */
  const addSchedule = async () => {
    if (!selectedDate || !authorId || !title.trim()) return;

    await supabase.from('family_schedules').insert({
      author_id: authorId,
      title,
      schedule_date: selectedDate,
    });

    const d = new Date(selectedDate);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));

    setTitle('');
    fetchSchedules();
  };

  /* 일정 수정 / 삭제 */
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

  /* 캘린더 계산 */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const hasSchedule = (date: string) =>
    schedules.some((s) => s.schedule_date === date);

  return (
    <main>
      <div className="page-container">
        <h1>📅 가족 일정</h1>

        {/* 월 이동 */}
        <div style={{ marginBottom: '12px' }}>
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            ←
          </button>
          <strong style={{ margin: '0 12px' }}>
            {year}년 {month + 1}월
          </strong>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            →
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
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              day
            ).padStart(2, '0')}`;

            const dow = new Date(year, month, day).getDay();

            let color = '#000';
            if (dow === 0 || isHoliday(dateStr)) color = 'red';
            if (dow === 6) color = 'blue';

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
                  background:
                    dateStr === selectedDate
                      ? '#bbdefb'
                      : hasSchedule(dateStr)
                      ? '#e3f2fd'
                      : '#fff',
                }}
              >
                {hasSchedule(dateStr) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '6px',
                      width: '6px',
                      height: '6px',
                      background: 'red',
                      borderRadius: '50%',
                    }}
                  />
                )}
                {day}
              </div>
            );
          })}
        </div>

        {/* 일정 상세 */}
        {selectedDate && (
          <section className="card" style={{ marginTop: '16px' }}>
            <h3>{selectedDate} 일정</h3>

            <ul>
              {schedules
                .filter((s) => s.schedule_date === selectedDate)
                .map((s) => (
                  <li key={s.id}>
                    <strong>
                      {members.find((m) => m.id === s.author_id)?.name}
                    </strong>{' '}
                    :
                    {editingId === s.id ? (
                      <>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <button onClick={() => saveEdit(s.id)}>저장</button>
                      </>
                    ) : (
                      <>
                        {s.title}
                        <button onClick={() => setEditingId(s.id)}>수정</button>
                      </>
                    )}
                    <button onClick={() => deleteSchedule(s.id)}>삭제</button>
                  </li>
                ))}
            </ul>

            {/* 일정 추가 */}
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
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
            />

            <button onClick={addSchedule}>일정 추가</button>
          </section>
        )}
      </div>
    </main>
  );
}