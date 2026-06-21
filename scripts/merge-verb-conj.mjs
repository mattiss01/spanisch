// One-time/idempotent: fill `conj` (present tense) into public/vocab-examples.json
// for every verb already curated in lib/verb-catalog.ts (135 verbs, irregulars
// correct). Preserves any existing es/de example text. Run: node scripts/merge-verb-conj.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'public', 'vocab-examples.json');

function normWord(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|der|die|das|ein|eine|einen|einem|einer)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

// Write one entry per line so incremental git diffs stay readable.
function writeJson(obj) {
  const body = Object.keys(obj)
    .map(k => `${JSON.stringify(k)}:${JSON.stringify(obj[k])}`)
    .join(',\n');
  fs.writeFileSync(jsonPath, `{\n${body}\n}\n`, 'utf8');
}

const tei = fs.readFileSync(path.join(root, 'lib', 'verb-catalog.ts'), 'utf8');
const obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let filled = 0;
const re = /infinitive:\s*'([^']+)'[\s\S]*?presente:\s*\[([^\]]+)\]/g;
let m;
while ((m = re.exec(tei))) {
  const inf = m[1];
  const forms = m[2].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
  if (forms.length !== 6) continue;
  const key = normWord(inf);
  const cur = obj[key] ?? { es: '', de: '' };
  cur.conj = forms;
  obj[key] = cur;
  filled++;
}

writeJson(obj);
console.log(`Filled conj for ${filled} verbs. Total entries: ${Object.keys(obj).length}`);
