import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const SERVICE_KEY = process.env.HOLIDAY_KEY;

  if (!year || !month || !SERVICE_KEY) {
    return NextResponse.json([], { status: 400 });
  }

  const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${SERVICE_KEY}&solYear=${year}&solMonth=${month}&_type=json`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    const items = json?.response?.body?.items?.item;

    if (!items) {
      return NextResponse.json([]);
    }

    const list = Array.isArray(items) ? items : [items];

    const formatted = list.map((h: any) => {
      const d = String(h.locdate);
      return {
        date: `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`,
        name: h.dateName
      };
    });

    return NextResponse.json(formatted);

  } catch (error) {
    return NextResponse.json([]);
  }
}