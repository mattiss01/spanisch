import { NextRequest, NextResponse } from 'next/server';
import { readJson } from '@/lib/server-storage';
import { upsertVocabWord, setStats, setConjugation } from '@/lib/db';
import { VocabEntry, ProgressStats, ConjugationRecord } from '@/lib/types';

// TEMPORARY one-time migration: copy each user's data from Vercel Blob into
// Supabase. Gated by ?key=<MIGRATE_SECRET>. Delete this route after running.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')?.trim();
  const secret = process.env.MIGRATE_SECRET?.trim();
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const users = ['mattis', 'marina', 'default'];
  const summary: Record<string, unknown> = {};

  for (const userId of users) {
    const vocab = await readJson<VocabEntry[]>('vocab.json', [], userId);
    let migrated = 0;
    for (const entry of vocab) {
      if (!entry?.word || !entry?.translation) continue;
      await upsertVocabWord(userId, entry);
      migrated++;
    }

    const stats = await readJson<ProgressStats | null>('stats.json', null, userId);
    if (stats) await setStats(userId, stats);

    const conj = await readJson<ConjugationRecord[]>('conjugation.json', [], userId);
    if (Array.isArray(conj) && conj.length) await setConjugation(userId, conj);

    summary[userId] = {
      vocabRead: vocab.length,
      vocabMigrated: migrated,
      stats: Boolean(stats),
      conjugation: Array.isArray(conj) ? conj.length : 0,
    };
  }

  return NextResponse.json({ ok: true, summary });
}
