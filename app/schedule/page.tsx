'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

/* ======================
   🇰🇷 공휴일
====================== */
const HOLIDAYS_MMDD = [
  '01-01','03-01','05-05','06-06',
  '08-15','10-03','10-09','12-25',
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

  const [hour, setHour] = useState('ALL_DAY');
  const [minute, setMinute] = useState('00');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHour, setEditHour] = useState('ALL_DAY');
  const [editMinute, setEditMinute] = useState('00');

  /* ====================== */
  function formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const isHoliday = (dateStr: string) => {
    return HOLIDAYS_MMDD.includes(dateStr.slice(5));
  };

  /* ====================== */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('id, name');
    setMembers(data ?? []);
  };

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
        if (a.schedule_date !== b.schedule_date) {
          return a.schedule_date.localeCompare(b.schedule_date);
        }
        if (a.schedule_time === 'ALL_DAY') return -1;
        if (b.schedule_time === 'ALL_DAY') return 1;
        return a.schedule_time.localeCompare(b.schedule_time);
      }) ?? [];

    setSchedules(sorted);
  };

  useEffect(() => { fetchMembers(); }, []);
  useEffect(() => { fetchSchedules(); }, [currentMonth]);

  /* ====================== */
  const addSchedule = async () => {
    if (!selectedDate || !authorId || !title.trim()) return;

    let finalTime = 'ALL_DAY';
    if (hour !== 'ALL_DAY') finalTime = `${hour}:${minute}`;

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

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;

    let finalTime = 'ALL_DAY';
    if (editHour !== 'ALL_DAY')
      finalTime = `${editHour}:${editMinute}`;

    await supabase
      .from('family_schedules')
      .update({ title: editTitle, schedule_time: finalTime })
      .eq('id', id);

    setEditingId(null);
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

  /* ====================== */
  return (
    <main className="page-container">
      <h1>📅 가족 일정</h1>

      {/* 월 이동 */}
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

      {/* 요일 */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(7,1fr)',
        textAlign:'center',
        fontWeight:600,
        marginBottom:'6px'
      }}>
        <span style={{color:'#ff6b6b'}}>일</span>
        <span>월</span><span>화</span><span>수</span>
        <span>목</span><span>금</span>
        <span style={{color:'#7aa2ff'}}>토</span>
      </div>

      {/* 달력 */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(7,1fr)',
        gap:'6px'
      }}>
        {Array.from({length:firstDay}).map((_,i)=><div key={i}/> )}

        {Array.from({length:daysInMonth}).map((_,i)=>{
          const day=i+1;
          const dateStr=formatDate(new Date(year,month,day));
          const dayOfWeek=new Date(year,month,day).getDay();

          let color='#eaeaea';
          if(dayOfWeek===0||isHoliday(dateStr)) color='#ff6b6b';
          if(dayOfWeek===6) color='#7aa2ff';

          const isToday=dateStr===todayStr;
          const isSelected=dateStr===selectedDate;

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
                width:'30px',height:'30px',
                margin:'0 auto',
                lineHeight:'30px',
                borderRadius:'50%',
                backgroundColor:isToday?'#2563eb':'transparent',
                color:isToday?'#fff':color,
                fontWeight:isToday?700:400
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

      {/* 선택 날짜 상세 */}
      {selectedDate && (
        <section style={{marginTop:'20px'}}>
          <h3>{selectedDate} 일정</h3>

          <ul>
            {schedules
              .filter(s=>s.schedule_date===selectedDate)
              .map(s=>(
                <li key={s.id} style={{marginBottom:'6px'}}>
                  <strong>
                    {members.find(m=>m.id===s.author_id)?.name}
                  </strong>{' : '}

                  {editingId===s.id?(
                    <>
                      <select value={editHour} onChange={e=>setEditHour(e.target.value)}>
                        <option value="ALL_DAY">종일</option>
                        {Array.from({length:24}).map((_,i)=>{
                          const hh=String(i).padStart(2,'0');
                          return <option key={hh} value={hh}>{hh}시</option>
                        })}
                      </select>

                      {editHour!=='ALL_DAY'&&(
                        <select value={editMinute} onChange={e=>setEditMinute(e.target.value)}>
                          {['00','10','20','30','40','50'].map(m=>
                            <option key={m} value={m}>{m}분</option>
                          )}
                        </select>
                      )}

                      <input value={editTitle}
                        onChange={e=>setEditTitle(e.target.value)}
                      />

                      <button onClick={()=>saveEdit(s.id)}>저장</button>
                    </>
                  ):(
                    <>
                      {s.schedule_time!=='ALL_DAY' && `${s.schedule_time} `}
                      {s.title}
                      <button onClick={()=>startEdit(s)} style={{marginLeft:'6px'}}>수정</button>
                    </>
                  )}

                  <button
                    onClick={()=>deleteSchedule(s.id)}
                    style={{marginLeft:'6px',color:'#ff6b6b'}}
                  >
                    삭제
                  </button>
                </li>
              ))}
          </ul>

          {/* 작성자 */}
          <select value={authorId}
            onChange={e=>setAuthorId(e.target.value)}
            style={{width:'100%',marginTop:'8px'}}
          >
            <option value="">작성자 선택</option>
            {members.map(m=>(
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* 시간 선택 */}
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