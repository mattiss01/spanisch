import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
  const { messages, scenario, assistantRole, userRole } = (await req.json()) as {
    messages: ChatMessage[];
    scenario: string;
    assistantRole: string;
    userRole: string;
  };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return NextResponse.json({ error: 'Kein API-Schlüssel konfiguriert.' }, { status: 500 });
  }

  const systemPrompt = `Du führst ein Gespräch auf Spanisch mit einem Lernenden auf B1/B2-Niveau.
Szenario: ${scenario}
Deine Rolle: ${assistantRole}
Rolle des Lernenden: ${userRole}

Regeln:
- Antworte immer auf Spanisch
- Bleibe in deiner Rolle und im Szenario
- Wenn der Lernende einen Fehler macht, korrigiere ihn sanft, indem du die richtige Form in deiner Antwort natürlich einbaust
- Halte Antworten kurz und gesprächig (2-4 Sätze)
- Falls der Lernende auf Deutsch schreibt, bitte ihn freundlich auf Spanisch zu antworten`;

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.9,
      max_tokens: 300,
    }),
  });

  if (!groqRes.ok) {
    return NextResponse.json({ error: 'Groq API Fehler' }, { status: 500 });
  }

  const data = await groqRes.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return NextResponse.json({ content });
}
