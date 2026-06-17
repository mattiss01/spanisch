import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/server-storage';

export async function GET() {
  const data = await readJson('conjugation.json', []);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  await writeJson('conjugation.json', data);
  return NextResponse.json({ ok: true });
}
