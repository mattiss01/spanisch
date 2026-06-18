import { NextRequest, NextResponse } from 'next/server';
import { ArticleItem } from '@/lib/types';
import { getArticleFocus } from '@/lib/article-catalog';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Keep only items the UI can render and grade: a non-empty answer whose options
// (deduped, case-insensitive) include the answer. Salvages a missing answer by
// inserting it into the options list rather than dropping the item.
function sanitizeItem(raw: unknown): ArticleItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const answer = String(r.answer ?? '').trim();
  if (!answer) return null;

  const before = String(r.before ?? '');
  const after = String(r.after ?? '');
  // The model occasionally leaves the blank as underscores inside the text.
  if (/_{2,}/.test(before) || /_{2,}/.test(after)) return null;

  const rawOptions = Array.isArray(r.options) ? r.options.map(o => String(o).trim()).filter(Boolean) : [];
  const seen = new Set<string>();
  const options: string[] = [];
  for (const o of [answer, ...rawOptions]) {
    const key = o.toLowerCase();
    if (!seen.has(key)) { seen.add(key); options.push(o); }
  }
  if (options.length < 2) return null;

  return {
    before,
    answer,
    after,
    options: options.slice(0, 4),
    hint_es: String(r.hint_es ?? '').trim(),
  };
}

export async function POST(req: NextRequest) {
  const { focusId, theme, level } = (await req.json()) as {
    focusId?: string;
    theme?: string;
    level?: string;
  };

  const focus = getArticleFocus(focusId ?? 'mixed') ?? getArticleFocus('mixed')!;
  const lvl = (level ?? 'A2').toUpperCase();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return NextResponse.json(
      { error: 'Kein API-Schlüssel konfiguriert. Bitte GROQ_API_KEY in den Umgebungsvariablen setzen.' },
      { status: 500 }
    );
  }

  const prompt = `Create a German grammar fill-in-the-blank exercise for a Spanish-speaking learner (level ${lvl}).
Grammar focus: ${focus.grammar_en}.
${theme ? `Theme/context for the sentences: "${theme}".` : ''}

Produce EXACTLY 6 short German sentences. In each sentence, exactly ONE word — the target word for the grammar focus — is removed and becomes the blank. Choose sentences where the context makes a SINGLE answer clearly correct (no ambiguity).

Respond with ONLY this JSON object (no markdown, no extra text):
{
  "title": "<short German topic name>",
  "title_es": "<the same topic name in Spanish>",
  "instruction": "<one short instruction in SPANISH>",
  "explanation_es": "<2-3 sentence grammar explanation in SPANISH>",
  "items": [
    {
      "before": "<German sentence text BEFORE the blank, with a trailing space>",
      "answer": "<the correct German word that fills the blank>",
      "after": "<German sentence text AFTER the blank, e.g. ' Mann.'>",
      "options": ["<answer>", "<distractor>", "<distractor>", "<distractor>"],
      "hint_es": "<short SPANISH reason: case + gender, e.g. 'Dativo (objeto indirecto), masculino'>"
    }
  ]
}

Rules:
- "before" + "answer" + "after" must read as one natural, grammatically correct German sentence. Never put underscores or the answer itself inside "before" or "after".
- "options" must be 3-4 plausible German forms of the SAME word type and MUST include the exact "answer". Use lowercase unless the word begins the sentence.
- "instruction", "explanation_es" and every "hint_es" must be written in SPANISH.
- Use vocabulary appropriate for level ${lvl}.
- Exactly 6 items.`;

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a meticulous German teacher creating exercises for Spanish speakers. Respond ONLY with a valid JSON object. No markdown, no explanations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return NextResponse.json({ error: 'Groq API Fehler', details: err }, { status: 500 });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as Record<string, unknown>;

    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map(sanitizeItem)
      .filter((x): x is ArticleItem => x !== null);

    if (items.length < 3) {
      return NextResponse.json(
        { error: 'El modelo no devolvió suficientes ejercicios válidos. Inténtalo de nuevo.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title: String(parsed.title ?? focus.label_es),
      title_es: String(parsed.title_es ?? focus.label_es),
      instruction: String(parsed.instruction ?? 'Completa con la forma correcta.'),
      explanation_es: String(parsed.explanation_es ?? ''),
      items,
    });
  } catch {
    return NextResponse.json({ error: 'Verbindungsfehler' }, { status: 500 });
  }
}
