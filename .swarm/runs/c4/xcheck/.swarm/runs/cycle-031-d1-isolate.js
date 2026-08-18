#!/usr/bin/env node
// Isolates the D1/D2 finding at the helper itself, independent of the suite,
// by extracting each arm's extractNearestPrecedingCount body and calling it
// directly on the same four one-clause strings. TRUTH: 50 entries, 8 HIGH.
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const REPO = path.join(__dirname, '..', '..');

function loadArm(src) {
  const start = src.indexOf('function extractNearestPrecedingCount');
  const tail = src.slice(start);
  const end = tail.indexOf('\n}\n') + 3;
  return new Function('return (' + tail.slice(0, end) + ')')();
}

const fixed = loadArm(fs.readFileSync(path.join(REPO, 'test', 'readme-tags.test.js'), 'utf8'));
const head = loadArm(execFileSync('git', ['show', 'HEAD:test/readme-tags.test.js'], { cwd: REPO, encoding: 'utf8' }));

const CASES = [
  ['subject-first  "8 of the 50 entries are rated HIGH"',      '8 of the 50 entries are rated HIGH', 8],
  ['subject-last   "Of the 50 entries, 8 are rated HIGH"',     'Of the 50 entries, 8 are rated HIGH', 8],
  ['subject-first, wrong claim (9)',                            '9 of the 50 entries are rated HIGH', 9],
  ['subject-last,  wrong claim (9)',                            'Of the 50 entries, 9 are rated HIGH', 9],
];

console.log('marker /\\bHIGH\\b/ -- "want" is the number the sentence actually states\n');
console.log('case'.padEnd(48) + 'want  FIXED  HEAD');
for (const [label, text, want] of CASES) {
  const f = fixed(text, /\bHIGH\b/);
  const h = head(text, /\bHIGH\b/);
  const mark = v => (v === want ? String(v) : String(v) + ' X');
  console.log(label.padEnd(48) + String(want).padEnd(6) + mark(f).padEnd(7) + mark(h));
}
