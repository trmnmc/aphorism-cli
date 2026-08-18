#!/usr/bin/env node
// cycle-31 PRE-DISPATCH conductor baseline for T-024a (Attribution count extraction).
// Measures HEAD's behaviour on the cases the fix must move and the cases it must NOT move.
// Run BEFORE dispatch to seal a pre-commitment; the verification gate is authored separately
// at verification time (hard rule 2).
//
// Usage: node cycle-031-baseline-T-024a.js
// Restores README.md unconditionally on exit.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..', '..');
const README = path.join(REPO, 'README.md');
const ORIGINAL = fs.readFileSync(README, 'utf8');

// The Attribution paragraph exactly as it ships (dash-delimited aside).
const SHIPPED =
  '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50\n' +
  'entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what\n' +
  'would settle each one.';

if (!ORIGINAL.includes(SHIPPED)) {
  console.error('FATAL: shipped Attribution paragraph not found verbatim -- probe is stale, refusing to run');
  process.exit(3);
}

// Every variant keeps the triage doc untouched; only README prose moves.
const VARIANTS = {
  // B0 control: untouched tree.
  B0: SHIPPED,

  // B1 -- the T-020 case. Dashes removed, EVERY number still TRUE.
  B1:
    '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50\n' +
    'entries by how likely the attribution is to be wrong. 8 of the 50 entries are rated HIGH,\n' +
    'and it says what would settle each one.',

  // B2 -- kill in the SHIPPED shape: wrong HIGH count.
  B2: SHIPPED.replace('8 are rated HIGH', '9 are rated HIGH'),

  // B3 -- kill in the SHIPPED shape: wrong corpus size.
  B3: SHIPPED.replace('ranks all 50', 'ranks all 51'),

  // B4 -- kill in the REWORDED shape: wrong HIGH count under B1's wording.
  //       This is the cell that decides whether a fix restores detection or merely
  //       leaves the case still-red for the pre-existing reason.
  B4:
    '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50\n' +
    'entries by how likely the attribution is to be wrong. 9 of the 50 entries are rated HIGH,\n' +
    'and it says what would settle each one.',

  // B5 -- kill in the REWORDED shape: wrong corpus size under B1's wording.
  B5:
    '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 51\n' +
    'entries by how likely the attribution is to be wrong. 8 of the 51 entries are rated HIGH,\n' +
    'and it says what would settle each one.',

  // B6 -- parse miss: the HIGH marker is gone entirely. Must fail LOUD, never pass.
  B6:
    '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50\n' +
    'entries by how likely the attribution is to be wrong, and says what would settle each one.',
};

// Classify a C1/C2 failure by REASON, not by "did it fail". Precedence matters
// (cycle-30 lesson): the could-not-find phrasing is unique to the parse-miss
// assert, so test it FIRST and require its exact opening words.
function classify(out, which) {
  // Key on the test's own (C1)/(C2) tag -- the only token in the name that is
  // guaranteed stable and unique. Anchoring to prose inside the test title is
  // exactly the anchoring mistake this item exists to remove.
  const marker = which === 'C1' ? '\\(C1\\)' : '\\(C2\\)';
  const failed = new RegExp('^not ok .*' + marker, 'm').test(out);
  if (!failed) return 'GREEN';
  if (which === 'C1') {
    if (/could not find a "<N> entries" claim/.test(out)) return 'PARSE-MISS';
    const m = out.match(/states the triage doc ranks (\d+) entries/);
    if (m) return 'MISMATCH(read ' + m[1] + ')';
    return 'RED-UNCLASSIFIED';
  }
  if (/could not find a "<N> are rated HIGH" claim/.test(out)) return 'PARSE-MISS';
  const m = out.match(/section states (\d+) entries are rated HIGH/);
  if (m) return 'MISMATCH(read ' + m[1] + ')';
  return 'RED-UNCLASSIFIED';
}

function runOnce() {
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap', 'test/readme-tags.test.js'], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const pass = Number((out.match(/^# pass (\d+)/m) || [, '?'])[1]);
  const fail = Number((out.match(/^# fail (\d+)/m) || [, '?'])[1]);
  const tests = Number((out.match(/^# tests (\d+)/m) || [, '?'])[1]);
  return { tests, pass, fail, c1: classify(out, 'C1'), c2: classify(out, 'C2'), raw: out };
}

const results = [];
try {
  for (const [name, para] of Object.entries(VARIANTS)) {
    fs.writeFileSync(README, ORIGINAL.replace(SHIPPED, para));
    const r = runOnce();
    results.push([name, r]);
    console.log(
      name.padEnd(3) + ' ' + String(r.tests) + '/' + String(r.pass) + '/' + String(r.fail) +
      '   C1=' + r.c1.padEnd(18) + ' C2=' + r.c2
    );
  }
} finally {
  fs.writeFileSync(README, ORIGINAL);
}

const restored = fs.readFileSync(README, 'utf8') === ORIGINAL;
console.log('\nREADME restored byte-identical: ' + restored);
if (!restored) process.exit(2);
