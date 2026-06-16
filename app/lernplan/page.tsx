import Link from 'next/link';

interface Phase {
  number: number;
  title: string;
  duration: string;
  color: string;
  topics: { name: string; desc: string }[];
  goal: string;
  exercises: string[];
}

const phases: Phase[] = [
  {
    number: 1,
    title: 'Grammatik-Fundament',
    duration: 'Monate 1–2',
    color: 'border-red-400',
    topics: [
      { name: 'Pretérito Indefinido vs. Imperfecto', desc: 'Die zwei Vergangenheiten korrekt unterscheiden' },
      { name: 'Ser vs. Estar', desc: 'Permanente vs. temporäre Eigenschaften' },
      { name: 'Por vs. Para', desc: 'Präpositionen richtig einsetzen' },
      { name: 'Futuro Simple', desc: 'Zukunftspläne und Vorhersagen' },
      { name: 'Condicional Simple', desc: 'Hypothetische Situationen ausdrücken' },
    ],
    goal: 'Du kannst über Vergangenheit, Gegenwart und Zukunft korrekt sprechen und typische B1-Fehler vermeiden.',
    exercises: ['fill_blank', 'conjugation', 'error_correction'],
  },
  {
    number: 2,
    title: 'Subjuntivo & Komplexe Strukturen',
    duration: 'Monate 3–4',
    color: 'border-amber-400',
    topics: [
      { name: 'Subjuntivo Presente', desc: 'Wünsche, Meinungen, Zweifel ausdrücken' },
      { name: 'Relativsätze', desc: 'que, quien, donde, el que...' },
      { name: 'Passiv (se-Konstruktionen)', desc: 'Se vende, se habla español...' },
      { name: 'Pretérito Perfecto Compuesto', desc: 'Zusammengesetztes Perfekt mit haber' },
      { name: 'Indirekte Rede', desc: 'Dijo que... / Me preguntó si...' },
    ],
    goal: 'Du kannst den Subjunktiv korrekt verwenden und komplexere Satzstrukturen bilden.',
    exercises: ['fill_blank', 'multiple_choice', 'translation'],
  },
  {
    number: 3,
    title: 'Fortgeschrittene Grammatik',
    duration: 'Monate 5–6',
    color: 'border-green-400',
    topics: [
      { name: 'Subjuntivo Imperfecto', desc: 'Si yo fuera... / Ojalá pudiera...' },
      { name: 'Pretérito Pluscuamperfecto', desc: 'Había llegado cuando...' },
      { name: 'Imperativo', desc: 'Befehle und Aufforderungen' },
      { name: 'Gerundio & Partizipien', desc: 'Hablando / hablado richtig einsetzen' },
      { name: 'Verbale Periphrasen', desc: 'Ir a, estar + gerundio, acabar de...' },
    ],
    goal: 'Du beherrschst alle wichtigen B2-Zeitformen und kannst hypothetische Situationen ausdrücken.',
    exercises: ['conjugation', 'fill_blank', 'error_correction'],
  },
  {
    number: 4,
    title: 'Vokabular & Idiome',
    duration: 'Monate 7–8',
    color: 'border-blue-400',
    topics: [
      { name: 'Thematischer Wortschatz', desc: 'Arbeit, Umwelt, Politik, Medien, Gesundheit' },
      { name: 'Modismos & Redewendungen', desc: 'No hay mal que por bien no venga...' },
      { name: 'Formelle vs. informelle Sprache', desc: 'Register wechseln können' },
      { name: 'Conectores discursivos', desc: 'Sin embargo, no obstante, a pesar de...' },
      { name: 'Kollokationen', desc: 'Typische Wortverbindungen auf Spanisch' },
    ],
    goal: 'Dein aktiver Wortschatz umfasst 3.000–4.000 Wörter. Du kannst idiomatisch sprechen.',
    exercises: ['vocabulary', 'translation', 'reading'],
  },
  {
    number: 5,
    title: 'Konversation & Flüssigkeit',
    duration: 'Monate 9–10',
    color: 'border-purple-400',
    topics: [
      { name: 'Meinungen ausdrücken', desc: 'Desde mi punto de vista... / En cuanto a...' },
      { name: 'Diskussionen führen', desc: 'Zustimmen, widersprechen, argumentieren' },
      { name: 'Erzähltechniken', desc: 'Geschichten strukturiert erzählen' },
      { name: 'Präsentationen', desc: 'Formelle mündliche Beiträge leisten' },
      { name: 'Spontansprache', desc: 'Ohne Vorbereitung flüssig antworten' },
    ],
    goal: 'Du kannst spontan und flüssig über komplexe Themen diskutieren.',
    exercises: ['conversation', 'reading'],
  },
];

const dailyPlan = [
  { time: '10–15 Min', activity: 'Vokabeln wiederholen', icon: '📖' },
  { time: '20–30 Min', activity: 'Grammatikübung oder Lückentext', icon: '✏️' },
  { time: '10 Min', activity: 'Fehler analysieren & Notizen', icon: '📝' },
];

const weeklyPlan = [
  { day: 'Mo–Fr', activity: 'Tägliches Programm (40–55 Min)', icon: '📅' },
  { day: 'Samstag', activity: 'Leseverständnis + Konversationsübung', icon: '💬' },
  { day: 'Sonntag', activity: 'Wochenrückblick + Vokabeln vertiefen', icon: '🔄' },
];

export default function Lernplan() {
  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto p-5 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lernplan B1 → B2</h1>
          <p className="text-gray-500 text-sm mt-1">
            10 Monate strukturiertes Lernen – ca. 40–55 Minuten täglich
          </p>
        </div>

        {/* Daily & Weekly plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Tagesplan</h2>
            <div className="space-y-2.5">
              {dailyPlan.map(({ time, activity, icon }) => (
                <div key={activity} className="flex items-start gap-2.5">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-400">{time}</p>
                    <p className="text-sm text-gray-700">{activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Wochenplan</h2>
            <div className="space-y-2.5">
              {weeklyPlan.map(({ day, activity, icon }) => (
                <div key={day} className="flex items-start gap-2.5">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-400">{day}</p>
                    <p className="text-sm text-gray-700">{activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-6">
          <h2 className="font-semibold text-gray-800">Lernphasen</h2>
          {phases.map(phase => (
            <div
              key={phase.number}
              className={`bg-white rounded-xl border-l-4 ${phase.color} border border-gray-100 shadow-sm p-5 space-y-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Phase {phase.number}
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{phase.duration}</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{phase.title}</h3>
                </div>
              </div>

              <div className="space-y-2">
                {phase.topics.map(topic => (
                  <div key={topic.name} className="flex gap-3">
                    <span className="text-gray-200 mt-1.5">•</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{topic.name}</p>
                      <p className="text-xs text-gray-400">{topic.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <strong className="text-gray-700">Ziel:</strong> {phase.goal}
              </div>

              <div className="flex flex-wrap gap-2">
                {phase.exercises.map(id => (
                  <Link
                    key={id}
                    href={`/uebungen?type=${id}`}
                    className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    {id === 'fill_blank' && '✏️ Lückentext'}
                    {id === 'conjugation' && '🔤 Konjugation'}
                    {id === 'error_correction' && '🔍 Fehlerkorrektur'}
                    {id === 'multiple_choice' && '☑️ Multiple Choice'}
                    {id === 'translation' && '🔄 Übersetzung'}
                    {id === 'vocabulary' && '📝 Vokabeln'}
                    {id === 'reading' && '📖 Leseverständnis'}
                    {id === 'conversation' && '💬 Konversation'}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 space-y-3">
          <h2 className="font-semibold text-amber-800">💡 Lerntipps</h2>
          <ul className="space-y-2 text-sm text-amber-700">
            <li>• <strong>Regelmäßigkeit schlägt Intensität:</strong> 40 Min täglich ist effektiver als 5 Stunden am Wochenende.</li>
            <li>• <strong>Aktiv sprechen:</strong> Nutze die Konversationsübung so oft wie möglich – Fehler machen ist normal und wichtig.</li>
            <li>• <strong>Vokabeln im Kontext:</strong> Lerne Wörter nie isoliert, sondern immer mit Beispielsatz.</li>
            <li>• <strong>Fehler analysieren:</strong> Notiere deine häufigsten Fehler und übe gezielt diese Strukturen.</li>
            <li>• <strong>Echtes Spanisch:</strong> Ergänze mit spanischen Serien, Podcasts oder Büchern.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
