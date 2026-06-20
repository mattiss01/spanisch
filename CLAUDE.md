@AGENTS.md

# Spanisch — language-learning web app

A small, personal Spanish/German learning app used by a handful of friends. German
speakers learning Spanish (and one Spanish speaker learning German). Plain, mobile-first
UI in English with German/Spanish content.

## Stack & environment

- **Next.js 16.2.9 (App Router, Turbopack)**, React 19, TypeScript, **Tailwind CSS v4**.
- **Supabase** (Postgres) for all persistence, via `@supabase/supabase-js` (service-role key,
  server-side only).
- **Groq** (`llama-3.3-70b-versatile`) for LLM generation (article exercises, vocab sets, chat).
- Deployed on **Vercel**. No test framework. Dev on **Windows / PowerShell**.
- Commands: `npm run dev`, `npm run build`, `npx tsc --noEmit`, `npm run lint`.

### Env vars
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` — required for
  all persistence; reads/writes throw if missing. `dbConfigured()` guards optional paths.
- `GROQ_API_KEY` — required for the generation routes only.
- Set these in Vercel project env. Local `.env.local` only carries a Vercel OIDC token (no DB keys),
  so the DB can't be queried from a local shell without `vercel env pull`.

## Profiles & multi-user model (important)

There is **no auth**. A "profile" is just an entry in `lib/profiles.ts`; the chosen profile id is
stored in `localStorage['spanisch_profile']` and sent as the **`x-user-id` header** on every API
call. That header becomes the Supabase **`user_id`**, which isolates each person's data. Adding a
learner = one entry in `PROFILES` (no DB change).

- Fields: `direction` (`de_to_es` | `es_to_de`), `nativeLang`, `targetLang`, optional `level`
  (`'A1'` | `'B1'`; absent ⇒ B1). `isBeginner(profile)` ⇒ `level === 'A1'`.
- Current: `mattis` (de→es, B1), `marina` (es→de), `emmi` (de→es, **A1**), `jakob`, `robert` (de→es, B1).
- `useProfile()` (`lib/use-profile.ts`) reads/sets the active profile and syncs across tabs.

## Data flow

Client component → `lib/storage.ts` (fetch with `x-user-id`) → `app/api/data/*` route → `lib/db.ts`
(Supabase). `storage.ts` reads are tolerant (return fallback) for display, but **strict** before any
read-modify-write so a failed read can't overwrite real data with an empty list. Per-row writes
(vocab) avoid clobbering the whole list; JSONB-blob writes (conjugation/article/race) are read-modify-write.

### Supabase tables
- `vocab` — one row per user+word (SRS: `level` 1–5, `next_review`, `last_reviewed`, `review_count`).
- `stats` — one row per user. Cumulative totals + `streak` + **`daily` jsonb** (Berlin-date → activity count).
- `conjugation`, `article`, `article_topics` — one JSONB row per user (arrays of records).
- `race` — **one global row** `id='global'` holding `{ points, dailyCounts, settledDates, highscores }`.

### ⚠️ Manual SQL migrations (no migrations dir — tables are created by hand)
Two things must exist in Supabase or features silently break:
```sql
create table if not exists race ( id text primary key, data jsonb not null default '{}'::jsonb );
alter table stats add column if not exists daily jsonb not null default '{}'::jsonb;
```

## Features / pages

- `/vokabeln` — Vocabulary: SRS flashcards (one at a time), **Learn in rounds of 20**, Review
  (shuffled), Words list. Daily goal banner. Beginners (A1) learn an ordered starter set first
  (`lib/vocab-starter.ts`) then flow into the full `lib/vocab-catalog.ts` (~2966 words).
- `/konjugation` — Verb conjugation practice from **static catalogs** (`lib/verb-catalog.ts` ES,
  `lib/verb-catalog-de.ts` DE) — *not* LLM. A1 profiles drill present tense only. Answer checking is
  **accent-insensitive**; Check works with blank fields.
- `/artikel` — German declension practice (es→de only); LLM-generated topics saved per user.
- `/grammar` — "Grundlagen" first-steps lessons (A1 only, `lib/grammar-lessons.ts`).
- `/race` — **THE RACE**: global competitive leaderboard (see below).
- `/help`, `/profile`. Nav in `components/Navigation.tsx` (filters items by `onlyDirection`/`onlyLevel`).

## THE RACE (scoring model)

Global standings everyone sees; cars race to **100 points**.
- **Daily activity** per user = every vocab flashcard (+1) + every conjugated form (**half credit**,
  `round(total/2)`), repeats included. Tracked in `stats.daily` (incremented in `recordExercise`),
  keyed by **Europe/Berlin date**.
- Each finished day awards **5/4/3/2/1** to the top daily scorers; **ties split the tiers evenly**;
  0 activity earns nothing. Logic is pure in `lib/race.ts` (`awardPoints`, `berlinDayStart`/`berlinToday`).
- `GET /api/race` is read-and-self-heal: it snapshots today's live count and **settles** finished days
  into cumulative `points` lazily (idempotent via `settledDates`) — no cron. It also keeps the top-5
  single-day records (`highscores`).

## Conventions & workflow

- **Day boundary is Europe/Berlin everywhere** (goal, daily counter, race settlement) — use
  `berlinToday()` / `berlinDayStart()` from `lib/race.ts`, not local time.
- Always `npx tsc --noEmit` and `npm run build` before committing.
- The user typically wants changes **committed and pushed to `main`** when done; **pushing to `main`
  auto-deploys to production** on Vercel. Branch off main if not told otherwise.
- Commit messages end with the Co-Authored-By trailer.
