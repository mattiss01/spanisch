import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/server-storage';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await readJson('vocab.json', [], userId);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await req.json();
  await writeJson('vocab.json', data, userId);
  return NextResponse.json({ ok: true });
}
