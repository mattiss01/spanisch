// Lists the next catalog/starter words that still have NO example sentence in
// public/vocab-examples.json, in catalog order (common/curated words first), so
// authoring is resumable. Usage: node scripts/examples-todo.mjs [count]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const N = Number(process.argv[2] || 50);

function normWord(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|der|die|das|ein|eine|einen|einem|einer)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

function pairs(file) {
  const txt = fs.readFileSync(path.join(root, 'lib', file), 'utf8');
  return [...txt.matchAll(/de:\s*'((?:[^'\\]|\\.)*)',\s*es:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => ({
    de: m[1].replace(/\\'/g, "'"),
    es: m[2].replace(/\\'/g, "'"),
  }));
}

// Starter first (beginners), then the catalog; dedupe by normalized Spanish.
const all = [...pairs('vocab-starter.ts'), ...pairs('vocab-catalog.ts')];
const seen = new Set();
const unique = [];
for (const p of all) {
  const k = normWord(p.es);
  if (seen.has(k)) continue;
  seen.add(k);
  unique.push({ ...p, key: k });
}

const obj = JSON.parse(fs.readFileSync(path.join(root, 'public', 'vocab-examples.json'), 'utf8'));
const hasExample = k => obj[k] && obj[k].es; // conj-only counts as "todo" for a sentence
const todo = unique.filter(u => !hasExample(u.key));

console.log(`Unique words: ${unique.length} | with example: ${unique.length - todo.length} | remaining: ${todo.length}\n`);
console.log(`Next ${Math.min(N, todo.length)} to author:\n`);
for (const u of todo.slice(0, N)) {
  console.log(`${u.key}\t${u.es}\t${u.de}${obj[u.key]?.conj ? '\t[verb]' : ''}`);
}
