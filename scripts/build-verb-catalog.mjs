// Append every verb that has an authored present-tense conjugation in
// public/vocab-examples.json into lib/verb-catalog.ts with full present /
// preterite (indefinido) / future (futuro). Preterite & future are derived from
// the infinitive by a rule engine that handles the irregular patterns present in
// this set; a few edge verbs are overridden explicitly. Run with --print to
// preview without writing. Run: node scripts/build-verb-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'lib', 'verb-catalog.ts');
const PRINT = process.argv.includes('--print');

function normWord(s) {
  return s.toLowerCase().trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|der|die|das|ein|eine|einen|einem|einer)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '').trim();
}
const deaccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// ── conjugation rules ──────────────────────────────────────────────────────
const REFLEX = ['me', 'te', 'se', 'nos', 'os', 'se'];
// Irregular "grave" preterite stems (suffix-matched so compounds work).
const GRAVE = { estar: 'estuv', andar: 'anduv', tener: 'tuv', poder: 'pud', poner: 'pus', saber: 'sup', querer: 'quis', venir: 'vin', caber: 'cup', haber: 'hub', hacer: 'hic' };
// Irregular future stems (suffix-matched).
const FUT = { poner: 'pondr', tener: 'tendr', venir: 'vendr', salir: 'saldr', poder: 'podr', querer: 'querr', saber: 'sabr', haber: 'habr', caber: 'cabr', valer: 'valdr', hacer: 'har', decir: 'dir' };
// -ir verbs that change stem vowel in 3rd person (e→i / o→u).
const STEM_IR = { despedir: 'e', advertir: 'e', asentir: 'e', servir: 'e', convertir: 'e', conseguir: 'e', dormir: 'o' };
// Fully explicit overrides (infinitive without reflexive -se).
const OVERRIDE = {
  ir:        { indefinido: ['fui','fuiste','fue','fuimos','fuisteis','fueron'], futuro: ['iré','irás','irá','iremos','iréis','irán'] },
  freír:     { indefinido: ['freí','freíste','frió','freímos','freísteis','frieron'], futuro: ['freiré','freirás','freirá','freiremos','freiréis','freirán'] },
  averiguar: { indefinido: ['averigüé','averiguaste','averiguó','averiguamos','averiguasteis','averiguaron'], futuro: ['averiguaré','averiguarás','averiguará','averiguaremos','averiguaréis','averiguarán'] },
};

function futureStem(base) {
  for (const k of Object.keys(FUT)) if (base.endsWith(k)) return base.slice(0, -k.length) + FUT[k];
  return base; // regular: full infinitive
}
function lastVowelSwap(stem, from, to) {
  const i = stem.lastIndexOf(from);
  return i < 0 ? stem : stem.slice(0, i) + to + stem.slice(i + 1);
}
function preterite(base) {
  // grave (u/i) stems
  for (const k of Object.keys(GRAVE)) {
    if (base.endsWith(k)) {
      const pre = base.slice(0, -k.length), st = pre + GRAVE[k];
      const third = k === 'hacer' ? pre + 'hizo' : st + 'o';
      return [st + 'e', st + 'iste', third, st + 'imos', st + 'isteis', st + 'ieron'];
    }
  }
  // j-stems: decir / -ducir
  for (const k of ['decir', 'ducir']) {
    if (base.endsWith(k)) {
      const pre = base.slice(0, -k.length), st = pre + (k === 'decir' ? 'dij' : 'duj');
      return [st + 'e', st + 'iste', st + 'o', st + 'imos', st + 'isteis', st + 'eron'];
    }
  }
  const end = deaccent(base).slice(-2);
  const stem = base.slice(0, -2);
  if (end === 'ar') {
    let yo = stem + 'é';
    if (base.endsWith('car')) yo = stem.slice(0, -1) + 'qué';
    else if (base.endsWith('gar')) yo = stem.slice(0, -1) + 'gué';
    else if (base.endsWith('zar')) yo = stem.slice(0, -1) + 'cé';
    return [yo, stem + 'aste', stem + 'ó', stem + 'amos', stem + 'asteis', stem + 'aron'];
  }
  // -er / -ir
  const yMid = (/[aeo]$/.test(stem)) || (base.endsWith('uir') && !base.endsWith('guir') && !base.endsWith('quir'));
  let stem3 = stem;
  const sc = STEM_IR[base];
  if (sc === 'e') stem3 = lastVowelSwap(stem, 'e', 'i');
  else if (sc === 'o') stem3 = lastVowelSwap(stem, 'o', 'u');
  const third = stem3 + (yMid ? 'yó' : 'ió');
  const thirdPl = stem3 + (yMid ? 'yeron' : 'ieron');
  return [stem + 'í', stem + 'iste', third, stem + 'imos', stem + 'isteis', thirdPl];
}
function conjugate(inf) {
  let reflexive = false, base = inf;
  if (/(ar|er|ir|ír)se$/.test(inf)) { reflexive = true; base = inf.slice(0, -2); }
  const ov = OVERRIDE[base];
  let indefinido = ov ? ov.indefinido.slice() : preterite(base);
  const fEnd = ['é', 'ás', 'á', 'emos', 'éis', 'án'];
  let futuro = ov ? ov.futuro.slice() : fEnd.map(e => futureStem(base) + e);
  if (reflexive) {
    indefinido = indefinido.map((f, i) => `${REFLEX[i]} ${f}`);
    futuro = futuro.map((f, i) => `${REFLEX[i]} ${f}`);
  }
  return { indefinido, futuro };
}

// ── gloss map from the vocab catalog ───────────────────────────────────────
function glossMap() {
  const map = new Map();
  for (const file of ['vocab-catalog.ts', 'vocab-starter.ts']) {
    const txt = fs.readFileSync(path.join(root, 'lib', file), 'utf8');
    for (const m of txt.matchAll(/de:\s*'((?:[^'\\]|\\.)*)',\s*es:\s*'((?:[^'\\]|\\.)*)'/g)) {
      const k = normWord(m[2].replace(/\\'/g, "'"));
      if (!map.has(k)) map.set(k, m[1].replace(/\\'/g, "'"));
    }
  }
  return map;
}

let catalogSrc = fs.readFileSync(catalogPath, 'utf8');
// Idempotent re-sync: strip any previously generated block so we can regenerate.
catalogSrc = catalogSrc.replace(
  /(\r?\n)  \/\/ ── Frequency-sourced verbs \(auto-generated[\s\S]*?(\r?\n\];\r?\n\r?\nexport function verbToExercise)/,
  '$2',
);
const existing = new Set([...catalogSrc.matchAll(/infinitive:\s*'([^']+)'/g)].map(m => m[1].toLowerCase()));
const examples = JSON.parse(fs.readFileSync(path.join(root, 'public', 'vocab-examples.json'), 'utf8'));
const gloss = glossMap();
const esc = s => s.replace(/'/g, "\\'");
const arr = a => '[' + a.map(f => `'${esc(f)}'`).join(', ') + ']';

const lines = [];
let skipped = 0;
for (const [key, v] of Object.entries(examples)) {
  if (!Array.isArray(v.conj) || v.conj.length !== 6) continue;
  if (existing.has(key.toLowerCase())) continue;
  const de = gloss.get(key);
  if (!de) { skipped++; continue; }
  const { indefinido, futuro } = conjugate(key);
  if (PRINT) { console.log(`${key} | pret: ${indefinido.join(', ')} | fut: ${futuro.join(', ')}`); continue; }
  lines.push(`  { infinitive: '${esc(key)}', de: '${esc(de)}', presente: ${arr(v.conj)}, indefinido: ${arr(indefinido)}, futuro: ${arr(futuro)} },`);
}
if (PRINT) { console.log(`\n(${lines.length === 0 ? 'preview' : ''} skipped no-gloss: ${skipped})`); process.exit(0); }

const header =
  '\n  // ── Frequency-sourced verbs (auto-generated by scripts/build-verb-catalog.mjs) ──\n' +
  '  // Present forms authored in public/vocab-examples.json; preterite & future\n' +
  '  // derived by rule from the infinitive.\n';
const anchor = /(\r?\n)\];(\r?\n\r?\nexport function verbToExercise)/;
if (!anchor.test(catalogSrc)) { console.error('Insertion anchor not found'); process.exit(1); }
const out = catalogSrc.replace(anchor, (_, a, b) => a + header + lines.join('\n') + '\n];' + b);
fs.writeFileSync(catalogPath, out, 'utf8');
console.log(`Appended ${lines.length} verbs (3 tenses). Skipped no-gloss: ${skipped}`);
