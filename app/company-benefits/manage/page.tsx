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

export default function CompanyBenefitsManagePage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [benefits, setBenefits] = useState<Record<string, string>>({});

  /* ======================
     회사 목록
  ====================== */
  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, company_name');

    setCompanies(data ?? []);
  };

  /* ======================
     선택 회사 복지
  ====================== */
  const fetchBenefits = async (companyId: string) => {
    if (!companyId) {
      setBenefits({});
      return;
    }

    const { data } = await supabase
      .from('company_benefits')
      .select('category, content')
      .eq('company_id', companyId);

    const map: Record<string, string> = {};
    (data ?? []).forEach((b) => {
      map[b.category] = b.content;
    });

    setBenefits(map);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await fetchCompanies();
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;

    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await fetchBenefits(selectedCompanyId);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [selectedCompanyId]);

  /* ======================
     저장
  ====================== */
  const saveBenefits = async () => {
    if (!selectedCompanyId) {
      alert('회사를 선택하세요.');
      return;
    }

    await supabase
      .from('company_benefits')
      .delete()
      .eq('company_id', selectedCompanyId);

    const rows = Object.entries(benefits)
      .filter(([, v]) => v.trim())
      .map(([category, content]) => ({
        company_id: selectedCompanyId,
        category,
        content,
      }));

    if (rows.length > 0) {
      await supabase.from('company_benefits').insert(rows);
    }

    alert('저장되었습니다.');
  };

  /* ======================
     렌더
  ====================== */
  return (
    <main>
      <div className="page-container">
        <h1>🏢 회사 복지 관리</h1>

        {/* 회사 선택 */}
        <section className="card">
          <h2>회사 선택</h2>

          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          >
            <option value="">회사 선택</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </section>

        {/* 복지 입력 */}
        {selectedCompanyId && (
          <section className="card">
            <h2>복지 입력 / 수정</h2>

            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ marginBottom: '8px' }}>
                <strong>{cat}</strong>
                <input
                  value={benefits[cat] ?? ''}
                  onChange={(e) =>
                    setBenefits((prev) => ({
                      ...prev,
                      [cat]: e.target.value,
                    }))
                  }
                  placeholder="복지 내용을 입력하세요"
                  style={{
                    width: '100%',
                    padding: '6px',
                    marginTop: '4px',
                  }}
                />
              </div>
            ))}

            <button style={{ marginTop: '8px' }} onClick={saveBenefits}>
              저장
            </button>
          </section>
        )}
      </div>
    </main>
  );
}