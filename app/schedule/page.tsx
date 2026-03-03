'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

export default function SchedulePage() {

  /* ====================== 유틸 ====================== */
  function formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const today = new Date();
  const todayStr = formatDate(today);

  /* ====================== 상태 ====================== */
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  const [members, setMembers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // 🔴 공휴일 객체 배열 (API와 일치)
  const [holidays, setHolidays] = useState<
    { date: string; name: string }[]
  >([]);

  const [authorId, setAuthorId] = useState('');
  const [title, setTitle] = useState('');

  const [hour, setHour] = useState('ALL_DAY');
  const [minute, setMinute] = useState('00');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHour, setEditHour] = useState('ALL_DAY');
  const [editMinute, setEditMinute] = useState('00');

  /* ====================== 공휴일 헬퍼 ====================== */
  const isHoliday = (dateStr: string) =>
    holidays.some(h => h.date === dateStr);

  const getHolidayName = (dateStr: string) =>
    holidays.find(h => h.date === dateStr)?.name ?? null;

  /* ====================== 공휴일 fetch ====================== */
  const fetchHolidays = async () => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');

    try {
      const res = await fetch(`/api/holidays?year=${year}&month=${month}`);
      if (!res.ok) {
        setHolidays([]);
        return;
      }

      const data = await res.json();

      // 🔴 안전 가공 (혹시 string[] 오더라도 방어)
      const normalized = Array.isArray(data)
        ? data.map((d: any) =>
            typeof d === 'string'
              ? { date: d, name: '' }
              : { date: d.date, name: d.name }
          )
        : [];

      setHolidays(normalized);

    } catch {
      setHolidays([]);
    }
  };

  /* ====================== 멤버 fetch ====================== */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');
    setMembers(data ?? []);
  };

  /* ====================== 일정 fetch ====================== */
  const fetchSchedules = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const start = formatDate(new Date(year, month, 1));
    const end = formatDate(new Date(year, month + 1, 0));

    const { data } = await supabase
      .from('family_schedules')
      .select('*')
      .gte('schedule_date', start)
      .lte('schedule_date', end);

    const sorted =
      data?.sort((a, b) => {
        if (a.schedule_date !== b.schedule_date)
          return a.schedule_date.localeCompare(b.schedule_date);

        if (a.schedule_time === 'ALL_DAY') return -1;
        if (b.schedule_time === 'ALL_DAY') return 1;
        return a.schedule_time.localeCompare(b.schedule_time);
      }) ?? [];

    setSchedules(sorted);
  };

  useEffect(() => { fetchMembers(); }, []);
  useEffect(() => {
    fetchSchedules();
    fetchHolidays();
  }, [currentMonth]);

  /* ====================== 일정 추가 ====================== */
  const addSchedule = async () => {
    if (!selectedDate || !authorId || !title.trim()) return;

    let finalTime = 'ALL_DAY';
    if (hour !== 'ALL_DAY')
      finalTime = `${hour}:${minute}`;

    await supabase.from('family_schedules').insert({
      author_id: authorId,
      title,
      schedule_date: selectedDate,
      schedule_time: finalTime,
    });

    setTitle('');
    setHour('ALL_DAY');
    setMinute('00');
    fetchSchedules();
  };

  /* ====================== 수정 시작 ====================== */
  const startEdit = (s: any) => {
    setEditingId(s.id);
    setEditTitle(s.title);

    if (s.schedule_time === 'ALL_DAY') {
      setEditHour('ALL_DAY');
      setEditMinute('00');
    } else {
      const [h, m] = s.schedule_time.split(':');
      setEditHour(h);
      setEditMinute(m);
    }
  };

  /* ====================== 수정 저장 ====================== */
  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;

    let finalTime = 'ALL_DAY';
    if (editHour !== 'ALL_DAY')
      finalTime = `${editHour}:${editMinute}`;

    await supabase
      .from('family_schedules')
      .update({
        title: editTitle,
        schedule_time: finalTime
      })
      .eq('id', id);

    setEditingId(null);
    fetchSchedules();
  };

  /* ====================== 삭제 ====================== */
  const deleteSchedule = async (id: string) => {
    if (!confirm('이 일정을 삭제할까요?')) return;
    await supabase.from('family_schedules').delete().eq('id', id);
    fetchSchedules();
  };

  /* ====================== 달력 계산 ====================== */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const hasSchedule = (date: string) =>
    schedules.some((s) => s.schedule_date === date);

  const monthLabel = `${year}년 ${month + 1}월`;

  /* ====================== 렌더 ====================== */
  return (
    <main className="page-container">
      <h1>📅 가족 일정</h1>

      <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>←</button>
        <strong>{monthLabel}</strong>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>→</button>
        <button
          style={{ marginLeft:'auto', fontSize:'12px' }}
          onClick={()=>{
            setCurrentMonth(new Date(today.getFullYear(), today.getMonth(),1));
            setSelectedDate(todayStr);
          }}
        >
          오늘
        </button>
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(7,1fr)',
        textAlign:'center',
        fontWeight:600,
        marginBottom:'6px'
      }}>
        <span style={{color:'#ef4444'}}>일</span>
        <span>월</span><span>화</span><span>수</span>
        <span>목</span><span>금</span>
        <span style={{color:'#3b82f6'}}>토</span>
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(7,1fr)',
        gap:'6px'
      }}>
        {Array.from({length:firstDay}).map((_,i)=>
          <div key={`empty-${i}`} />
        )}

        {Array.from({length:daysInMonth}).map((_,i)=>{
          const day=i+1;
          const dateObj = new Date(year,month,day);
          const dateStr=formatDate(dateObj);
          const dayOfWeek=dateObj.getDay();

          const isToday=dateStr===todayStr;
          const isSelected=dateStr===selectedDate;
          const holiday=isHoliday(dateStr);

          let textColor='#eaeaea';
          if(holiday || dayOfWeek===0) textColor='#ef4444';
          else if(dayOfWeek===6) textColor='#3b82f6';

          return(
            <div
              key={day}
              onClick={()=>setSelectedDate(dateStr)}
              style={{
                padding:'6px',
                border:'1px solid #3a3a3a',
                textAlign:'center',
                cursor:'pointer',
                background:isSelected?'#334155':'#1e1e1e',
                borderRadius:'8px'
              }}
            >
              <div style={{
                width:'30px',
                height:'30px',
                margin:'0 auto',
                lineHeight:'30px',
                borderRadius:'50%',
                backgroundColor:isToday?'#2563eb':'transparent',
                color:isToday?'#fff':textColor
              }}>
                {day}
              </div>

              {hasSchedule(dateStr)&&(
                <div style={{
                  width:'6px',
                  height:'6px',
                  background:'#dc2626',
                  borderRadius:'50%',
                  margin:'4px auto 0'
                }}/>
              )}
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <section style={{marginTop:'20px'}}>
          <h3>{selectedDate} 일정</h3>

          {getHolidayName(selectedDate) && (
            <div style={{
              color:'#ffffff',
              marginBottom:'8px'
            }}>
              {getHolidayName(selectedDate)}
            </div>
          )}

          <ul>
            {schedules
              .filter(s=>s.schedule_date===selectedDate)
              .map(s=>(
                <li key={s.id} style={{marginBottom:'6px'}}>
                  <strong>
                    {members.find(m=>m.id===s.author_id)?.name}
                  </strong>{' : '}
                  {s.schedule_time!=='ALL_DAY' && `${s.schedule_time} `}
                  {s.title}
                  <button onClick={()=>startEdit(s)} style={{marginLeft:'6px'}}>수정</button>
                  <button
                    onClick={()=>deleteSchedule(s.id)}
                    style={{marginLeft:'6px',color:'#ff6b6b'}}
                  >
                    삭제
                  </button>
                </li>
              ))}
          </ul>

          <select value={authorId}
            onChange={e=>setAuthorId(e.target.value)}
            style={{width:'100%',marginTop:'8px'}}
          >
            <option value="">작성자 선택</option>
            {members.map(m=>(
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select value={hour}
            onChange={e=>setHour(e.target.value)}
            style={{width:'100%',marginTop:'8px'}}
          >
            <option value="ALL_DAY">종일</option>
            {Array.from({length:24}).map((_,i)=>{
              const hh=String(i).padStart(2,'0');
              return <option key={hh} value={hh}>{hh}시</option>
            })}
          </select>

          {hour!=='ALL_DAY'&&(
            <select value={minute}
              onChange={e=>setMinute(e.target.value)}
              style={{width:'100%',marginTop:'6px'}}
            >
              {['00','10','20','30','40','50'].map(m=>
                <option key={m} value={m}>{m}분</option>
              )}
            </select>
          )}

          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="일정 내용"
            style={{width:'100%',marginTop:'8px'}}
          />

          <button onClick={addSchedule} style={{marginTop:'8px'}}>
            일정 추가
          </button>
        </section>
      )}
    </main>
  );
}