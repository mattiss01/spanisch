import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/server-storage';

export async function GET() {
  const data = await readJson('stats.json', null);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  await writeJson('stats.json', data);
  return NextResponse.json({ ok: true });
}
