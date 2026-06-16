import { NextRequest, NextResponse } from 'next/server';
import { getPrompt } from '@/lib/prompts';
import { ExerciseType, Difficulty } from '@/lib/types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
  const { type, topic, difficulty } = (await req.json()) as {
    type: ExerciseType;
    topic: string;
    difficulty: Difficulty;
  };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return NextResponse.json(
      { error: 'Kein API-Schlüssel konfiguriert. Bitte GROQ_API_KEY in .env.local eintragen.' },
      { status: 500 }
    );
  }

  const userPrompt = getPrompt(type, topic ?? '', difficulty ?? 'B1');

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein erfahrener Spanisch-Lehrer für deutschsprachige Lernende. Antworte IMMER NUR mit einem gültigen JSON-Objekt. Kein Markdown, keine Erklärungen, keine Codeblöcke – nur reines JSON.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return NextResponse.json({ error: 'Groq API Fehler', details: err }, { status: 500 });
  }

  const data = await groqRes.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  try {
    const exercise = JSON.parse(content);
    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON von der KI', raw: content }, { status: 500 });
  }
}
