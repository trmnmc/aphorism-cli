#!/usr/bin/env node
// Conductor gate for T-024a attempt 2, cycle 32. AUTHORED POST-DISPATCH.
//
// The builder disclosed (report §6) that it read .swarm/runs/cycle-031-verify-T-024a.js,
// i.e. the ENTIRE cycle-31 discriminator set D1-D4 and gate cells G1-G6. Those cells are
// therefore CONTAMINATED as discriminators this cycle -- the builder could have coded to
// them. Every H-cell below is new and was authored after the builder returned.
//
// The question this gate exists to answer is the SAME question that rejected attempt 1:
//   did the set of naturally-written, entirely-TRUE READMEs that this guard falsely
//   rejects actually SHRINK, or did its membership merely move again?
// Attempt 1 was a perfect 2/4 <-> 2/4 swap. A second lateral move is a second rejection.
//
// Truth in this repo: corpus.length = 50, HIGH rows in the triage table = 8.
//
// Each cell replaces the whole ## Attribution section and is run on BOTH arms:
//   FIXED = the working-tree test/readme-tags.test.js
//   HEAD  = git show HEAD:test/readme-tags.test.js
// Both files are restored unconditionally in a finally block.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const README = path.join(ROOT, 'README.md');
const TESTFILE = path.join(ROOT, 'test', 'readme-tags.test.js');

const readmeOrig = fs.readFileSync(README, 'utf8');
const testFixed = fs.readFileSync(TESTFILE, 'utf8');
const testHead = execFileSync('git', ['show', 'HEAD:test/readme-tags.test.js'], {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 8 << 20,
});

const HEADER = `## Attribution

The author printed with each aphorism is who the line is **commonly credited to**, not an
author checked against a primary source. Programming aphorisms are widely misattributed.
`;
const TAIL = `Nothing in that list has been resolved yet.
`;
const LINK = '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md)';

function section(body) { return HEADER + body + '\n' + TAIL; }

// ---------------------------------------------------------------------------
// Cells. `truth` = whether every number in this README is TRUE. A guard is
// CORRECT on a truth:true cell iff GREEN, and on a truth:false cell iff RED
// while naming the wrong number.
// ---------------------------------------------------------------------------
const CELLS = [
  {
    id: 'H0', truth: true,
    what: 'control: shipped README, untouched',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what
would settle each one.`,
  },
  {
    id: 'H1', truth: true,
    what: 'TRUE, natural rewording of the HIGH aside without the word "rated" ("fall into the HIGH band")',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 8 fall into the HIGH band — and says what
would settle each one.`,
  },
  {
    id: 'H2', truth: true,
    what: 'TRUE, a noun between the count and the predicate ("8 entries are rated HIGH")',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 8 entries are rated HIGH — and says what
would settle each one.`,
  },
  {
    id: 'H3', truth: true,
    what: 'TRUE, an adjective between the count and the "entries" marker ("50 corpus entries") — C1 under test',
    body: `${LINK} ranks all 50 corpus
entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what
would settle each one.`,
  },
  {
    id: 'H4', truth: true,
    what: 'TRUE, subject-first partitive ("8 of the 50 entries are rated HIGH")',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 8 of the 50 entries are rated HIGH — and says what
would settle each one.`,
  },
  {
    id: 'H5', truth: false, wrong: 9,
    what: 'WRONG HIGH (9) in the same natural non-"rated" wording as H1',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 9 fall into the HIGH band — and says what
would settle each one.`,
  },
  {
    id: 'H6', truth: false, wrong: 9,
    what: 'WRONG HIGH (9) in template shape, with a TRUE bystander 8 later in the same clause',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 9 are rated HIGH, though only 8 of them
carry a public dispute — and says what would settle each one.`,
  },
  {
    id: 'H7', truth: false, wrong: 9,
    what: 'SILENT-HOLE PROBE (the converse cycle 31 said still needed authoring): TWO bound HIGH claims, one TRUE (8) and one FALSE (9)',
    body: `${LINK} ranks all 50
entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what
would settle each one. A later audit note records that 9 are rated HIGH overall.`,
  },
  {
    id: 'H8', truth: false, wrong: 51,
    what: 'control kill: WRONG entries count (51), shipped shape',
    body: `${LINK} ranks all 51
entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what
would settle each one.`,
  },
];

// ---------------------------------------------------------------------------

function replaceAttribution(orig, newSection) {
  const start = orig.indexOf('## Attribution');
  const end = orig.indexOf('\n## ', start + 1);
  if (start === -1) throw new Error('no ## Attribution in README');
  return orig.slice(0, start) + newSection + (end > -1 ? orig.slice(end) : '');
}

// Classify one test's outcome from node --test output.
function classify(out, testNamePart, kind) {
  const lines = out.split('\n');
  const hit = lines.find(l => l.includes(testNamePart));
  if (!hit) return 'ABSENT';
  if (hit.trimStart().startsWith('✔')) return 'GREEN';
  // Red -- work out why, and which number it named.
  if (kind === 'C2') {
    if (/could not find a "<N> are rated HIGH" claim/.test(out)) return 'PARSE-MISS';
    const m = out.match(/section states (\d+) entries are rated HIGH/);
    if (m) return `MISMATCH(read ${m[1]})`;
  } else {
    if (/could not find a "<N> entries" claim/.test(out)) return 'PARSE-MISS';
    const m = out.match(/triage doc ranks (\d+)\s*\n?\s*entries/);
    if (m) return `MISMATCH(read ${m[1]})`;
  }
  return 'RED(other)';
}

function runOnce() {
  let out;
  try {
    out = execFileSync('node', ['--test', 'test/readme-tags.test.js'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const tot = (out.match(/^ℹ tests (\d+)/m) || [])[1];
  const pass = (out.match(/^ℹ pass (\d+)/m) || [])[1];
  const fail = (out.match(/^ℹ fail (\d+)/m) || [])[1];
  return {
    counts: `${tot}/${pass}/${fail}`,
    C1: classify(out, 'corpus-size claim must match corpus.length (C1)', 'C1'),
    C2: classify(out, 'HIGH-risk count must match the triage doc table (C2)', 'C2'),
  };
}

const results = [];
try {
  for (const cell of CELLS) {
    fs.writeFileSync(README, replaceAttribution(readmeOrig, section(cell.body)));
    fs.writeFileSync(TESTFILE, testFixed);
    const fixed = runOnce();
    fs.writeFileSync(TESTFILE, testHead);
    const head = runOnce();
    results.push({ cell, fixed, head });
  }
} finally {
  fs.writeFileSync(README, readmeOrig);
  fs.writeFileSync(TESTFILE, testFixed);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
console.log('CONDUCTOR GATE — T-024a attempt 2 — cycle 32');
console.log('truth: corpus.length=50, HIGH rows=8. FIXED = working tree, HEAD = git show HEAD.\n');
console.log(pad('cell', 5) + pad('truth', 7) + pad('FIXED C1', 18) + pad('FIXED C2', 20) +
            pad('HEAD C1', 18) + pad('HEAD C2', 20) + 'verdict');
console.log('-'.repeat(120));

// A guard is CORRECT on a cell iff: truth:true -> both GREEN;
// truth:false -> the offending test RED, and if it names a number it must name `wrong`.
function correct(cell, arm) {
  if (cell.truth) return arm.C1 === 'GREEN' && arm.C2 === 'GREEN';
  const target = cell.wrong === 51 ? arm.C1 : arm.C2;
  if (target === 'GREEN') return false;              // silent hole
  const m = target.match(/MISMATCH\((?:read )?(\d+)\)/);
  if (m) return Number(m[1]) === cell.wrong;         // named the right wrong number
  return true;                                        // parse-miss: loud, but unnamed
}
function names(cell, arm) {
  if (cell.truth) return '';
  const target = cell.wrong === 51 ? arm.C1 : arm.C2;
  return /PARSE-MISS/.test(target) ? ' (loud, unnamed)' : '';
}

let fixedScore = 0, headScore = 0;
for (const { cell, fixed, head } of results) {
  const fOK = correct(cell, fixed), hOK = correct(cell, head);
  if (fOK) fixedScore++;
  if (hOK) headScore++;
  const verdict = fOK && hOK ? 'both correct'
    : fOK ? 'FIXED correct, HEAD wrong  <-- improvement'
    : hOK ? 'HEAD correct, FIXED wrong  <-- REGRESSION'
    : 'both wrong';
  console.log(pad(cell.id, 5) + pad(cell.truth ? 'TRUE' : `WRONG(${cell.wrong})`, 7) +
    pad(fixed.C1, 18) + pad(fixed.C2 + names(cell, fixed), 20) +
    pad(head.C1, 18) + pad(head.C2 + names(cell, head), 20) + verdict);
}
console.log('-'.repeat(120));
console.log(`SCORE   FIXED ${fixedScore}/${CELLS.length}   HEAD ${headScore}/${CELLS.length}\n`);
for (const { cell } of results) console.log(`  ${cell.id}  ${cell.what}`);
