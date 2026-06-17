import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/server-storage';

export async function GET() {
  const data = await readJson('vocab.json', []);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  await writeJson('vocab.json', data);
  return NextResponse.json({ ok: true });
}
