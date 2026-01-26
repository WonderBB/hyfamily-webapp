'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';

const CATEGORIES = [
  '경조사',
  '의료비',
  '건강검진',
  '교육비',
  '자녀학자금',
  '휴가/휴무',
  '자기계발',
  '문화/여가',
  '기타',
];

export default function CompanyBenefitsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);

  /* 회사 목록 */
  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, company_name');

    setCompanies(data ?? []);
  };

  /* 복지 데이터 */
  const fetchBenefits = async () => {
    const { data } = await supabase
      .from('company_benefits')
      .select('company_id, category, content');

    setBenefits(data ?? []);
  };

useEffect(() => {
  let mounted = true;

  const load = async () => {
    if (!mounted) return;

    await fetchCompanies();
    await fetchBenefits();
   
  };

  load();

  return () => {
    mounted = false;
  };
}, []);
  const getBenefit = (companyId: string, category: string) =>
    benefits.find(
      (b) =>
        b.company_id === companyId && b.category === category
    )?.content ?? '-';

  return (
    <main style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  }}
>
  <h1 style={{ margin: 0 }}>🏢 회사 복지</h1>

  <a
    href="/company-benefits/manage"
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
    복지 관리
  </a>
</div>


      <section style={cardStyle}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>카테고리</th>
              {companies.map((c) => (
                <th key={c.id} style={thStyle}>
                  {c.company_name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {CATEGORIES.map((cat) => (
              <tr key={cat}>
                <td style={tdStyle}>
                  <strong>{cat}</strong>
                </td>

                {companies.map((c) => (
                  <td key={c.id} style={tdStyle}>
                    {getBenefit(c.id, cat)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px',
};

const thStyle = {
  borderBottom: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left' as const,
};

const tdStyle = {
  borderBottom: '1px solid #eee',
  padding: '8px',
};
