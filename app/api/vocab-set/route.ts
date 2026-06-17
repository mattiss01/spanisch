import { NextRequest, NextResponse } from 'next/server';
import { Difficulty } from '@/lib/types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
  const { topic, difficulty, knownWords, count } = (await req.json()) as {
    topic?: string;
    difficulty?: Difficulty;
    knownWords?: string[];
    count?: number;
  };
  const num = Math.min(Math.max(count ?? 20, 1), 20);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return NextResponse.json(
      { error: 'Kein API-Schlüssel konfiguriert. Bitte GROQ_API_KEY in .env.local eintragen.' },
      { status: 500 }
    );
  }

  const avoidLine =
    knownWords && knownWords.length > 0
      ? `Verwende KEINE dieser bereits gelernten Wörter (Spanisch): ${knownWords.slice(0, 60).join(', ')}.`
      : '';

  const lvl = difficulty ?? 'B1';
  const prompt = `Erstelle einen Vokabelsatz mit genau ${num} deutschen Wörtern für deutschsprachige Spanisch-Lernende auf ${lvl}-Niveau.
${topic ? `Thema: ${topic}` : 'Thema: alltäglicher Wortschatz, nützliche Verben und Nomen'}
${avoidLine}

Antworte NUR mit diesem JSON:
{
  "items": [
    {
      "de": "deutsches Wort mit Artikel bei Nomen, z.B. 'die Reise'",
      "es": "spanische Übersetzung mit Artikel bei Nomen, z.B. 'el viaje'",
      "example": "kurzer natürlicher Beispielsatz auf Spanisch"
    }
  ]
}

Exakt ${num} Items. Mix aus Nomen, Verben, Adjektiven. Alltagsrelevant für ${lvl}-Niveau. Nur häufig verwendete Wörter.`;

  try {
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
              'Du bist ein Spanisch-Lehrer. Antworte NUR mit einem gültigen JSON-Objekt. Kein Markdown, kein erklärender Text.',
          },
          { role: 'user', content: prompt },
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
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: 'Verbindungsfehler' }, { status: 500 });
  }
}
