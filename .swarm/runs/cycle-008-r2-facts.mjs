// cycle 8 — corpus facts needed to author gate cells whose truth is MEASURED, not guessed.
import { createRequire } from 'node:module';
const require = createRequire('/opt/targets/aphorism-cli/');
const corpus = require('/opt/targets/aphorism-cli/src/corpus.js');
const entries = Array.isArray(corpus) ? corpus : corpus.corpus || corpus.default;
const counts = new Map();
for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) || 0) + 1);
const vals = [...counts.entries()].sort((a, b) => b[1] - a[1]);
console.log('entries:', entries.length);
console.log('distinct tags:', counts.size);
console.log('tags on >=2 entries:', vals.filter((v) => v[1] >= 2).length);
console.log('tags on exactly 1 entry:', vals.filter((v) => v[1] === 1).length);
console.log('tags on >=5 entries:', vals.filter((v) => v[1] >= 5).length);
console.log('tags on >=3 entries:', vals.filter((v) => v[1] >= 3).length);
console.log('tags on 3-4 entries:', vals.filter((v) => v[1] >= 3 && v[1] <= 4).length);
console.log('tags on >=10 entries:', vals.filter((v) => v[1] >= 10).length);
console.log('full:', JSON.stringify(vals));
