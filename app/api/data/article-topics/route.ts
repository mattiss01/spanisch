import { NextRequest, NextResponse } from 'next/server';
import { getArticleTopics, setArticleTopics } from '@/lib/db';
import { ArticleTopic } from '@/lib/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = await getArticleTopics(userId);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'default';
  const data = (await req.json()) as ArticleTopic[];
  await setArticleTopics(userId, data);
  return NextResponse.json({ ok: true });
}
