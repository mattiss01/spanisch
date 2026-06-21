// One-off generator that expands lib/vocab-catalog.ts toward ~10k words.
//
// Sources (both freely redistributable):
//   - Spanish frequency list: hermitdave/FrequencyWords (OpenSubtitles 2018), MIT.
//       scripts/data/es_50k.txt   ("word count" per line, frequency-ranked)
//   - DE<-ES dictionary: FreeDict spa-deu 0.1 (TEI), GPLv2 / CC-BY-SA / GFDL.
//       scripts/data/spa-deu/spa-deu.tei   (21353 headwords, with gender)
//
// Strategy: walk the frequency list top-down, keep words that are real FreeDict
// headwords (inflected forms don't match a lemma headword -> skipped naturally),
// translate to German with correct articles from gender tags, dedup against the
// existing catalog using the SAME norm() key the app uses, and emit frequency-
// ordered TS lines. Quality first: drop anything we can't translate cleanly.
//
// Run:  node scripts/build-vocab.mjs
// Output: scripts/data/new-entries.txt  (formatted TS lines, ready to append)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');
const repoRoot = path.join(here, '..');

// ── norm(): copied verbatim from app/vokabeln/page.tsx so dedup matches runtime ──
function norm(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|der|die|das|ein|eine|einen|einem|einer)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

const TARGET_TOTAL = 10000; // aim; stops early if coverage thins out

// Standard Spanish stopwords (NLTK list). The frequency list's top ranks are
// dominated by these function words and verb-form homonyms (era, nada, todo,
// fue…) that a single dictionary sense translates misleadingly — and they're
// already covered by the curated catalog. Skip them entirely.
const STOPWORDS = new Set(
  `de la que el en y a los del se las por un para con no una su al lo como mas
   pero sus le ya o este si porque esta entre cuando muy sin sobre tambien me
   hasta hay donde quien desde todo nos durante todos uno les ni contra otros
   ese eso ante ellos e esto mi antes algunos que unos yo otro otras otra el
   tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas
   algo nosotros mi mis tu te ti tu tus ellas nosotras vosotros vosotras os mio
   mia mios mias tuyo tuya tuyos tuyas suyo suya suyos suyas nuestro nuestra
   nuestros nuestras vuestro vuestra vuestros vuestras esos esas estoy estas
   esta estamos estais estan este estes estemos esteis esten fui fue fuimos
   fueron sea seas seamos sean era eras eramos eran soy eres es somos sois son
   tengo tienes tiene tenemos teneis tienen mismo mismos misma mismas ademas
   asi aqui ahi alli aun aunque cada cual cuanto entonces hacia luego pues
   segun siempre tras vez bien
   solo tan usted ustedes`
    .split(/\s+/)
    .filter(Boolean),
);
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// ── 1. Existing catalog: collect norm() keys to dedup against (append-only) ──
const catalogPath = path.join(repoRoot, 'lib', 'vocab-catalog.ts');
const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
const existingEs = [...catalogSrc.matchAll(/\bes:\s*'((?:[^'\\]|\\.)*)'/g)].map(m =>
  m[1].replace(/\\'/g, "'"),
);
const existingCount = existingEs.length;
const seenKeys = new Set(existingEs.map(norm));

// ── 2. Parse FreeDict TEI into a map: lowercased Spanish orth -> translation ──
const tei = fs.readFileSync(path.join(dataDir, 'spa-deu', 'spa-deu.tei'), 'utf8');
const body = tei.slice(tei.indexOf('<body>'));
const entries = body.split('<entry>').slice(1);

const ESP_ART = { m: 'el', f: 'la' };
const DEU_ART = { m: 'der', f: 'die', n: 'das' };

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}
function cleanGerman(q) {
  // drop parenthetical glosses like "aufheben (ein Gesetz)" / "(Schiffe)"
  return decode(q).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

const dict = new Map(); // key: lowercased spanish orth -> { es, de }
for (const block of entries) {
  const orthM = block.match(/<orth>([^<]+)<\/orth>/);
  if (!orthM) continue;
  const esRaw = decode(orthM[1]);
  if (!esRaw || esRaw.includes(' ')) continue; // single-word lemmas only
  if (/[^a-záéíóúñü]/i.test(esRaw)) continue; // skip punctuation/abbrev/proper noise
  const key = esRaw.toLowerCase();
  if (dict.has(key)) continue; // keep first entry per headword

  const senseIdx = block.indexOf('<sense>');
  const head = senseIdx >= 0 ? block.slice(0, senseIdx) : block;
  const sense = senseIdx >= 0 ? block.slice(senseIdx) : '';

  const esPos = (head.match(/<pos>([^<]+)<\/pos>/) || [])[1];
  const esGen = (head.match(/<gen>([^<]+)<\/gen>/) || [])[1];
  // Skip highly polysemous function words (one dict sense misleads); the curated
  // catalog already covers prepositions/conjunctions/pronouns properly.
  if (esPos === 'pron' || esPos === 'prep' || esPos === 'conj') continue;
  if (esRaw.length < 3) continue;
  const quoteM = sense.match(/<quote>([^<]+)<\/quote>/);
  if (!quoteM) continue;
  const deGen = (sense.match(/<gen>([^<]+)<\/gen>/) || [])[1];
  const de0 = cleanGerman(quoteM[1]);
  if (!de0 || /[^a-zäöüß .\-]/i.test(de0)) continue; // clean German only
  if (/-$/.test(de0)) continue; // skip awkward combining-form glosses ("Mittelmeer-")
  // reject conjugated-verb glosses like "ich sagte" / "er ging"
  if (/^(ich|du|er|sie|es|wir|ihr)\s/i.test(de0)) continue;

  // Build es side with Spanish article for nouns
  let es = esRaw;
  if (esPos === 'n') {
    if (!ESP_ART[esGen]) continue; // need gender for a clean article
    es = `${ESP_ART[esGen]} ${esRaw}`;
  }
  // Build de side with German article for nouns
  let de = de0;
  if (esPos === 'n') {
    if (de0.includes(' ')) continue; // ambiguous multi-word noun translation
    if (!DEU_ART[deGen]) continue;
    de = `${DEU_ART[deGen]} ${de0}`;
  } else {
    // verbs/adjectives/adverbs: lowercase bare form, single concept preferred
    de = de0;
  }
  dict.set(key, { es, de });
}

// ── 3. Walk frequency list, select in order, dedup, stop at target ──
const freq = fs
  .readFileSync(path.join(dataDir, 'es_50k.txt'), 'utf8')
  .split('\n')
  .map(l => l.split(' ')[0])
  .filter(Boolean);

const picked = [];
let scanned = 0;
for (const word of freq) {
  if (existingCount + picked.length >= TARGET_TOTAL) break;
  const w = word.toLowerCase();
  scanned++;
  if (STOPWORDS.has(stripAccents(w))) continue;
  const hit = dict.get(w);
  if (!hit) continue;
  const k = norm(hit.es);
  if (seenKeys.has(k)) continue;
  seenKeys.add(k);
  picked.push(hit);
}

// ── 4. Emit formatted TS lines ──
const esc = s => s.replace(/'/g, "\\'");
const lines = picked.map(p => `  { de: '${esc(p.de)}', es: '${esc(p.es)}' },`).join('\n');
const outPath = path.join(dataDir, 'new-entries.txt');
fs.writeFileSync(outPath, lines + '\n', 'utf8');

console.log(`Existing catalog entries: ${existingCount}`);
console.log(`Dictionary headwords parsed: ${dict.size}`);
console.log(`Frequency words scanned: ${scanned}`);
console.log(`New entries picked: ${picked.length}`);
console.log(`Projected catalog total: ${existingCount + picked.length}`);
console.log(`Wrote: ${path.relative(repoRoot, outPath)}`);
console.log('\nSample (first 20):');
for (const p of picked.slice(0, 20)) console.log(`  ${p.es}  ->  ${p.de}`);
