import { NextRequest, NextResponse } from 'next/server';
import { getSentenceProgress, setSentenceProgress } from '@/lib/db';
import { SentenceProgress } from '@/lib/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await getSentenceProgress(userId);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = (await req.json()) as SentenceProgress[];
  await setSentenceProgress(userId, data);
  return NextResponse.json({ ok: true });
}
