import { NextRequest, NextResponse } from 'next/server';
import { getConjugation, setConjugation } from '@/lib/db';
import { ConjugationRecord } from '@/lib/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await getConjugation(userId);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = (await req.json()) as ConjugationRecord[];
  await setConjugation(userId, data);
  return NextResponse.json({ ok: true });
}
