import { ExerciseType, Difficulty } from './types';

export function getPrompt(type: ExerciseType, topic: string, difficulty: Difficulty): string {
  switch (type) {
    case 'fill_blank':
      return fillBlankPrompt(topic, difficulty);
    case 'translation':
      return translationPrompt(topic, difficulty);
    case 'multiple_choice':
      return multipleChoicePrompt(topic, difficulty);
    case 'error_correction':
      return errorCorrectionPrompt(topic, difficulty);
    case 'conjugation':
      return conjugationPrompt(topic, difficulty);
    case 'reading':
      return readingPrompt(topic, difficulty);
    case 'vocabulary':
      return vocabularyPrompt(topic, difficulty);
    case 'conversation':
      return conversationPrompt(topic, difficulty);
  }
}

function fillBlankPrompt(topic: string, difficulty: Difficulty): string {
  const focus =
    difficulty === 'B1'
      ? 'Ser/Estar, Präpositionen (por/para), Imperfecto vs. Indefinido, Futuro'
      : 'Subjuntivo Presente, Condicional, Relativsätze, komplexe Zeitformen';
  return `Erstelle eine Lückentext-Übung auf Spanisch für deutschsprachige Lernende auf Niveau ${difficulty}.
Thema: ${topic || 'alltägliche Situationen'}
Grammatik-Fokus: ${focus}

Antworte NUR mit diesem JSON (kein Markdown, kein erklärender Text):
{
  "type": "fill_blank",
  "title": "Deutsch-Titel der Übung",
  "topic": "${topic || 'Alltag'}",
  "instruction": "Kurze Anweisung auf Deutsch",
  "items": [
    {
      "before": "spanischer Text vor der Lücke",
      "answer": "korrekte Antwort (1-3 Wörter)",
      "after": "spanischer Text nach der Lücke",
      "hint": "kurzer Hinweis auf Deutsch"
    }
  ],
  "explanation": "Grammatik-Erklärung auf Deutsch (3-5 Sätze)"
}

Erstelle genau 6 Sätze. Die Sätze sollen natürliches, authentisches Spanisch sein.`;
}

function translationPrompt(topic: string, difficulty: Difficulty): string {
  const direction = Math.random() > 0.5 ? 'de_to_es' : 'es_to_de';
  const dirLabel = direction === 'de_to_es' ? 'Deutsch → Spanisch' : 'Spanisch → Deutsch';
  return `Erstelle eine Übersetzungsübung für deutschsprachige Spanisch-Lernende (${difficulty}).
Richtung: ${dirLabel}
Thema: ${topic || 'alltägliche Kommunikation'}

Antworte NUR mit diesem JSON:
{
  "type": "translation",
  "title": "Deutsch-Titel",
  "direction": "${direction}",
  "instruction": "Kurze Anweisung auf Deutsch",
  "items": [
    {
      "source": "Ausgangstext",
      "answer": "Korrekte Übersetzung",
      "alternatives": ["optionale alternative Übersetzung"]
    }
  ],
  "tips": "Übersetzungstipps und typische Fehler auf Deutsch (2-3 Sätze)"
}

Erstelle 5 Sätze, vom leichteren zum schwereren. Fokus auf natürliche Sprache, nicht Wort-für-Wort.`;
}

function multipleChoicePrompt(topic: string, difficulty: Difficulty): string {
  return `Erstelle eine Multiple-Choice-Grammatikübung für deutschsprachige Spanisch-Lernende (${difficulty}).
Thema: ${topic || 'spanische Grammatik'}

Antworte NUR mit diesem JSON:
{
  "type": "multiple_choice",
  "title": "Deutsch-Titel",
  "instruction": "Anweisung auf Deutsch",
  "items": [
    {
      "question": "Spanischer Satz mit ___ als Lücke oder direkte Frage",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Erklärung auf Deutsch warum diese Antwort richtig ist"
    }
  ]
}

Erstelle genau 6 Fragen. Mix aus: ser/estar, por/para, Zeitformen, Subjuntivo. correctIndex muss 0, 1, 2 oder 3 sein. Alle 4 Optionen sollen plausibel klingen.`;
}

function errorCorrectionPrompt(topic: string, difficulty: Difficulty): string {
  return `Erstelle eine Fehlerkorrektur-Übung für deutschsprachige Spanisch-Lernende (${difficulty}).
Thema: ${topic || 'typische Fehler von Deutschsprachigen'}

Antworte NUR mit diesem JSON:
{
  "type": "error_correction",
  "title": "Deutsch-Titel",
  "instruction": "Anweisung auf Deutsch",
  "items": [
    {
      "incorrect": "Spanischer Satz MIT einem Fehler",
      "correct": "Korrekter spanischer Satz",
      "errorType": "Fehlertyp auf Deutsch (z.B. 'Falsches Genus', 'Ser statt Estar')",
      "explanation": "Kurze Erklärung auf Deutsch"
    }
  ]
}

Erstelle 5 Sätze. Genau ein Fehler pro Satz. Fehlertypen variieren: Genus, Verbform, Ser/Estar, Präposition, Reflexivverb, Pluralbildung.`;
}

function conjugationPrompt(topic: string, difficulty: Difficulty): string {
  const b1Tenses = ['presente', 'pretérito indefinido', 'pretérito imperfecto', 'futuro simple', 'condicional simple'];
  const b2Tenses = ['subjuntivo presente', 'subjuntivo imperfecto', 'pretérito perfecto compuesto', 'pretérito pluscuamperfecto', 'imperativo afirmativo'];
  const tenses = difficulty === 'B1' ? b1Tenses : b2Tenses;
  const tense = tenses[Math.floor(Math.random() * tenses.length)];

  return `Erstelle eine Konjugationsübung für Spanisch-Lernende (${difficulty}).
Zeitform: ${tense}
${topic ? `Themenkontext / Verb-Präferenz: ${topic}` : 'Wähle ein häufiges, nützliches Verb'}

Antworte NUR mit diesem JSON:
{
  "type": "conjugation",
  "title": "Deutsch-Titel (z.B. 'Konjugation: hablar im Presente')",
  "verb": "Infinitiv",
  "tense": "${tense}",
  "tenseName_de": "Zeitform auf Deutsch (z.B. 'Präsens', 'Einfache Vergangenheit')",
  "instruction": "Anweisung auf Deutsch",
  "pronouns": ["yo", "tú", "él/ella/usted", "nosotros/as", "vosotros/as", "ellos/ellas/ustedes"],
  "answers": ["yo-Form", "tú-Form", "él-Form", "nosotros-Form", "vosotros-Form", "ellos-Form"],
  "notes": "Hinweis auf Unregelmäßigkeiten auf Deutsch"
}

Wähle ein für B1/B2 relevantes Verb. Die 6 Formen in answers müssen zur Zeitform ${tense} passen.`;
}

function readingPrompt(topic: string, difficulty: Difficulty): string {
  return `Erstelle eine Leseverständnis-Übung auf Spanisch für deutschsprachige Lernende (${difficulty}).
Thema: ${topic || 'spanische Kultur, Reisen oder Alltag'}

Antworte NUR mit diesem JSON:
{
  "type": "reading",
  "title": "Deutsch-Titel",
  "text": "Spanischer Text (180-250 Wörter, natürlich und authentisch, ${difficulty}-Niveau)",
  "instruction": "Lies den Text und beantworte die Fragen auf Deutsch.",
  "questions": [
    {
      "question": "Frage auf Deutsch",
      "answer": "Musterantwort auf Deutsch",
      "type": "open"
    }
  ]
}

Erstelle 4 Fragen: 2 zum direkten Textverständnis, 1 zur Schlussfolgerung, 1 zur persönlichen Meinung. Der Text soll interessant und lehrreich sein.`;
}

function vocabularyPrompt(topic: string, difficulty: Difficulty): string {
  return `Erstelle eine Vokabelübung für deutschsprachige Spanisch-Lernende (${difficulty}).
Thema: ${topic || 'nützliche Alltagsvokabeln'}

Antworte NUR mit diesem JSON:
{
  "type": "vocabulary",
  "title": "Deutsch-Titel",
  "topic": "Thema auf Deutsch",
  "instruction": "Lerne die folgenden Vokabeln und ihre Verwendung im Kontext.",
  "items": [
    {
      "word": "spanisches Wort",
      "gender": "m oder f (NUR bei Nomen, sonst weglassen)",
      "plural": "Pluralform (NUR bei Nomen, sonst weglassen)",
      "translation": "deutsche Übersetzung",
      "example_es": "natürlicher Beispielsatz auf Spanisch",
      "example_de": "deutsche Übersetzung des Beispiels",
      "partOfSpeech": "noun oder verb oder adjective oder expression oder adverb"
    }
  ]
}

Erstelle 8 Vokabeln. Mix: 3 Nomen, 2 Verben, 2 Adjektive, 1 Ausdruck. Alle auf ${difficulty}-Niveau.`;
}

function conversationPrompt(topic: string, difficulty: Difficulty): string {
  return `Erstelle eine Konversationsübung für deutschsprachige Spanisch-Lernende (${difficulty}).
Situation: ${topic || 'alltägliche spanische Situation (Restaurant, Einkaufen, Reise, Bewerbungsgespräch)'}

Antworte NUR mit diesem JSON:
{
  "type": "conversation",
  "title": "Deutsch-Titel",
  "scenario": "Situation auf Spanisch (1-2 Sätze)",
  "scenario_de": "Situation auf Deutsch (1-2 Sätze)",
  "userRole": "Rolle des Lernenden auf Deutsch",
  "assistantRole": "Rolle des KI-Gesprächspartners auf Deutsch",
  "openingMessage": "Erste Nachricht des KI-Gesprächspartners auf Spanisch (natürlicher Gesprächseinstieg)",
  "vocabularyHints": [
    { "word": "spanisches Wort/Ausdruck", "translation": "deutsche Bedeutung" }
  ]
}

Die Situation soll realistisch und für ${difficulty} geeignet sein. Gib 6 hilfreiche Vokabeln. openingMessage soll natürlich und freundlich sein.`;
}
