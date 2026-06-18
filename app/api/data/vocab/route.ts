import { NextRequest, NextResponse } from 'next/server';
import { getVocab, upsertVocabWord } from '@/lib/db';
import { VocabEntry } from '@/lib/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await getVocab(userId);
  return NextResponse.json(data);
}

// Upsert a single word (per-row). Never rewrites the whole list.
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const entry = (await req.json()) as VocabEntry;
  await upsertVocabWord(userId, entry);
  return NextResponse.json({ ok: true });
}
