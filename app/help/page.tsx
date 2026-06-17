'use client';

export default function HelpPage() {
  return (
    <main className="md:ml-56 min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-xl mx-auto p-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">How it works</h1>
          <p className="text-gray-400 text-sm mt-0.5">A quick guide to the app</p>
        </div>

        {/* Vocabulary */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <span>📖</span> Vocabulary
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The app teaches you words using <strong>spaced repetition</strong>: the more confidently you know a word,
            the longer before it appears again. Each word has a phase (1–5). Level 5 means you know it.
          </p>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Learning phases</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Phase 1', color: 'bg-red-100 text-red-700', desc: 'New — review again tomorrow' },
                { label: 'Phase 2', color: 'bg-orange-100 text-orange-700', desc: 'Review in 3 days' },
                { label: 'Phase 3', color: 'bg-amber-100 text-amber-700', desc: 'Review in 7 days' },
                { label: 'Phase 4', color: 'bg-blue-100 text-blue-700', desc: 'Review in 14 days' },
                { label: 'Known', color: 'bg-green-100 text-green-700', desc: 'No more reviews needed' },
              ].map(({ label, color, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold shrink-0 ${color}`}>{label}</span>
                  <span className="text-sm text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">After checking answers</h3>
            <div className="space-y-1.5 text-sm text-gray-600">
              <p><span className="font-semibold text-amber-700">Unsure</span> — you got it right but weren&apos;t confident. Review again tomorrow.</p>
              <p><span className="font-semibold text-green-700">Sure</span> — confident. Move to the next phase.</p>
              <p><span className="font-semibold text-green-800">Known ✓</span> — you know it perfectly. Skip directly to level 5.</p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <span>🗂</span> Vocabulary tabs
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-800">Learn</p>
              <p>Introduces 20 new words you haven&apos;t seen yet. Start here every day.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Review</p>
              <p>Words that are due for review today. Do this before learning new words.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Words</p>
              <p>All words you&apos;ve ever seen, with their current phase and next review date. Use it to track your progress.</p>
            </div>
          </div>
        </section>

        {/* Verbs */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <span>🔤</span> Verbs
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Practice conjugations. Each session shows a verb and asks you to fill in all forms for the relevant tenses.
            Your accuracy is tracked per verb and per tense. Verbs with recent mistakes are shown in the <strong>Errors</strong> tab.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold">Mattis</span> practices Spanish verbs (present, preterite, future).
            <br />
            <span className="font-semibold">Marina</span> practices German verbs (present tense).
          </p>
        </section>

        {/* Profiles */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <span>👤</span> Profiles
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Each profile has its own progress stored separately. Tap <strong>Switch Profile</strong> in the sidebar (or the 👤 tab on mobile) to change who is using the app.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Progress is saved to the cloud, so it syncs across all your devices automatically.
          </p>
        </section>
      </div>
    </main>
  );
}
