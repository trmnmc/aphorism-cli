#!/usr/bin/env node
'use strict';
// cycle-007 verification gate for Q-2 (missing acute accent on a corpus attribution).
// Conductor-authored. Cells are checked by CODEPOINT, never by eye (the item's own
// acceptance requires that), plus position/shape controls that a sloppy edit would break.
const { spawnSync } = require('child_process');
const fs = require('fs');
const T = process.argv[2] || '/opt/targets/aphorism-cli';
const sh = (s) => spawnSync('/bin/bash', ['-c', s], { cwd: T, encoding: 'utf8', timeout: 180000, maxBuffer: 1 << 24 });

const out = sh('node bin/aphorism.js --list').stdout;
const lines = out.replace(/\n$/, '').split('\n');
const idx = lines.findIndex((l) => /Saint-Exup/.test(l));
const author = idx >= 0 ? lines[idx].split(' — ').pop() : '(NOT FOUND)';
const cps = [...author].map((c) => c.codePointAt(0).toString(16).padStart(4, '0')).join(' ');

console.log(`CELL Q2-a position ${idx} of ${lines.length}          (pre-state: 41 of 50 — must be unchanged)`);
console.log(`CELL Q2-b author ${JSON.stringify(author)}`);
console.log(`CELL Q2-c codepoints ${cps}`);
console.log(`CELL Q2-d has-U+00E9 ${[...author].some((c) => c.codePointAt(0) === 0x00e9)}`);
console.log(`CELL Q2-e no-ascii-ery ${/Exupéry$/.test(author) && !/Exupery/.test(author)}`);
console.log(`CELL Q2-f emdash-count ${(out.match(/—/g) || []).length}        (pre-state: 50 — transport control)`);
console.log(`CELL Q2-g corpus-U+00E9-count ${(fs.readFileSync(`${T}/src/corpus.js`, 'utf8').match(/é/g) || []).length}   (pre-state: 0)`);
console.log(`CELL Q2-h list-lines ${lines.length}              (pre-state: 50 — no expansion; expansion is a run non-goal)`);

const j = sh('node bin/aphorism.js --list --json').stdout.split('\n').filter((l) => /Saint-Exup/.test(l))[0] || '';
console.log(`CELL Q2-i json ${j}`);
try {
  const o = JSON.parse(j);
  console.log(`CELL Q2-j json-author-cp ${[...o.author].map((c) => c.codePointAt(0).toString(16)).join(' ')}`);
  console.log(`CELL Q2-k tags ${JSON.stringify(o.tags)}      (pre-state: ["simplicity","design"])`);
  console.log(`CELL Q2-l text-unchanged ${o.text.startsWith('Perfection is achieved') && o.text.endsWith('take away.')}`);
} catch (e) {
  console.log(`CELL Q2-j JSON-PARSE-FAILED ${e.message}`);
}

// Control: a seeded draw that is NOT this entry must be byte-identical to pre-state.
const d4 = sh('node bin/aphorism.js --seed 42 2>/dev/null | sha256sum | cut -c1-16');
console.log(`CELL Q2-m seed42-sha ${d4.stdout.trim()}   (pre-state: 6cab75ad66518c18 — unrelated draws unchanged)`);

const s = sh('node --test test/*.test.js');
const tail = ((s.stdout || '') + (s.stderr || '')).trim().split('\n').slice(-9).join('\n');
console.log('=== SUITE ===');
console.log(tail.split('\n').map((l) => `SUITE ${l}`).join('\n'));
console.log(`CELL SUITE-rc ${s.status}`);
