import { NextRequest, NextResponse } from 'next/server';
import { getArticle, setArticle } from '@/lib/db';
import { ArticleRecord } from '@/lib/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await getArticle(userId);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = (await req.json()) as ArticleRecord[];
  await setArticle(userId, data);
  return NextResponse.json({ ok: true });
}
