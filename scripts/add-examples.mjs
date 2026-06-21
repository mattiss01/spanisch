// Merge an authored batch into public/vocab-examples.json.
// Usage: node scripts/add-examples.mjs <batch.json>
// Batch shape: { "<normEs>": { "es": "...", "de": "...", "conj"?: [...] }, ... }
// Per key, provided fields overwrite; fields not provided (e.g. conj) are preserved.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'public', 'vocab-examples.json');

function writeJson(obj) {
  const body = Object.keys(obj)
    .map(k => `${JSON.stringify(k)}:${JSON.stringify(obj[k])}`)
    .join(',\n');
  fs.writeFileSync(jsonPath, `{\n${body}\n}\n`, 'utf8');
}

const batchPath = process.argv[2];
if (!batchPath) {
  console.error('Usage: node scripts/add-examples.mjs <batch.json>');
  process.exit(1);
}

const obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

let added = 0;
for (const [k, v] of Object.entries(batch)) {
  obj[k] = { ...(obj[k] ?? {}), ...v };
  added++;
}

writeJson(obj);
const withEx = Object.values(obj).filter(v => v.es).length;
console.log(`Merged ${added} entries. Total: ${Object.keys(obj).length} | with example: ${withEx}`);
