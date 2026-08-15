#!/usr/bin/env node
// Cycle 30 PRE-DISPATCH baseline for T-021 (attempt 2).
//
// Purpose: re-measure the defect and the cycle-28 hazard against the CURRENT
// 74-test suite before any builder is dispatched, so the acceptance clause is
// judged against today's tree rather than cycle 23/28 numbers.
//
// Cells:
//   B0  PRISTINE control                                  -> expect 74/74/0
//   B1  heading backticks dropped (honest reformat)        -> expect RED
//   B2  B1 + format literal separator mutated to a hyphen  -> expect RED
//   B3  format literal separator mutated only              -> expect RED
//   P3  decoy '### ' heading (both tokens) carrying a
//       plausible literal, REAL section literal mutated    -> HEAD must catch (RED)
//
// Every cell runs in its own whole-repo-minus-.git copy under os.tmpdir()
// (never inside SWARM; KI-7).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const README = 'README.md';

const MARKERS = [
  ['HEADING-PARSE', 'behaviour" section'],
  ['LITERAL-PARSE', 'format literal in the'],
  ['SEPARATOR-MISMATCH', 'does not match the README'],
  ['LINECOUNT-MISMATCH', 'output lines (one per corpus entry'],
];

function copyRepo(label) {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'c030-' + label + '-'));
  execFileSync('bash', ['-c', `cd ${TARGET} && tar --exclude=.git -cf - . | tar -xf - -C ${dest}`]);
  return dest;
}

function runSuite(dir) {
  const r = spawnSync('bash', ['-c',
    `cd ${dir} && node --test --test-reporter=tap test/*.test.js 2>&1`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const failing = [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1].trim());
  const reasons = MARKERS.filter(([, needle]) => out.includes(needle)).map(([name]) => name);
  return {
    tests: num(/^# tests (\d+)/m),
    pass: num(/^# pass (\d+)/m),
    fail: num(/^# fail (\d+)/m),
    failing,
    reasons,
    raw: out,
  };
}

function sig(r) {
  if (r.tests === null || r.pass === null || r.fail === null) return 'UNPARSEABLE';
  return `${r.tests}/${r.pass}/${r.fail}`;
}

// --- mutations -------------------------------------------------------------

const dropBackticks = (s) =>
  s.replace('### `--list` behaviour', '### --list behaviour');

const mutateLiteral = (s) =>
  s.replace('`<text> — <author>`', '`<text> - <author>`');

// A decoy '### ' heading that carries BOTH the --list token and the word
// 'behaviour', placed BEFORE the real section, whose own body holds a
// correct-looking format literal. This is the cycle-28 P3 shape.
const addDecoy = (s) =>
  s.replace(
    '### `--list` behaviour',
    '### Notes on `--list` behaviour\n\n' +
    'Historically `--list` printed each entry as `<text> — <author>`.\n\n' +
    '### `--list` behaviour'
  );

const CELLS = [
  ['B0', 'PRISTINE control', (s) => s],
  ['B1', 'heading backticks dropped', dropBackticks],
  ['B2', 'backticks dropped + literal mutated', (s) => mutateLiteral(dropBackticks(s))],
  ['B3', 'literal mutated only', mutateLiteral],
  // ORDER IS LOAD-BEARING: mutate the REAL section's literal FIRST, then insert
  // the decoy (which carries a correct-looking literal). Composing the other way
  // round mutates the decoy's literal and leaves the real section correct, which
  // is a vacuous cell that reads GREEN for the wrong reason. Caught on the first
  // run of this harness; see cycle-030 journal.
  ['P3', 'decoy heading w/ plausible literal + real literal mutated',
    (s) => addDecoy(mutateLiteral(s))],
];

const lines = [];
const log = (s) => { lines.push(s); console.log(s); };

log('CYCLE 30 PRE-DISPATCH BASELINE — T-021 attempt 2');
log('target: ' + TARGET);
log('');

const results = {};
for (const [id, desc, mutate] of CELLS) {
  const dir = copyRepo(id);
  const p = path.join(dir, README);
  const before = fs.readFileSync(p, 'utf8');
  const after = mutate(before);
  if (id !== 'B0' && after === before) {
    log(`${id}  ${desc}\n    MUTATION DID NOT APPLY — cell is vacuous, aborting`);
    process.exit(3);
  }
  // Postcondition beyond "the bytes changed": for the cells that mutate the
  // REAL section's format literal, prove the mutation landed in the section the
  // test under study actually reads (the text following the LAST heading whose
  // line carries both the --list token and the word 'behaviour'). A byte-diff
  // alone passes when the edit lands in a decoy.
  if (id === 'B2' || id === 'B3' || id === 'P3') {
    const idx = after.lastIndexOf('--list` behaviour') >= 0
      ? Math.max(after.lastIndexOf('--list` behaviour'), after.lastIndexOf('--list behaviour'))
      : after.lastIndexOf('--list behaviour');
    const realSection = after.slice(idx);
    if (!realSection.includes('`<text> - <author>`')) {
      log(`${id}  ${desc}\n    MUTATION LANDED OUTSIDE THE REAL SECTION — vacuous cell, aborting`);
      process.exit(4);
    }
  }
  fs.writeFileSync(p, after);
  const r = runSuite(dir);
  results[id] = r;
  log(`${id}  ${desc}`);
  log(`    signature  ${sig(r)}   (tests/pass/fail)`);
  log(`    reasons    ${r.reasons.length ? r.reasons.join(', ') : '(none)'}`);
  log(`    failing    ${r.failing.length ? r.failing.map((f) => '\n                 - ' + f).join('') : '(none)'}`);
  log('');
  fs.rmSync(dir, { recursive: true, force: true });
}

log('--- readings ---------------------------------------------------------');
log('B0 must be 74/74/0 for any other cell to mean anything: ' +
  (sig(results.B0) === '74/74/0' ? 'OK' : 'CONTROL FAILED'));
log('B1 vs B2 identical signature => heading parse MASKS the literal mutation, ' +
  'so "still fails" is satisfiable without restoring detection: ' +
  (sig(results.B1) === sig(results.B2) ? 'CONFIRMED (masked)' : 'NOT masked'));
log('B3 reason must be SEPARATOR-MISMATCH (the detection that must survive a fix): ' +
  (results.B3.reasons.includes('SEPARATOR-MISMATCH') ? 'CONFIRMED' : 'NOT SEEN'));
log('P3 must be RED at HEAD (the case a first-match fix turned silent at cycle 28): ' +
  (results.P3.fail > 0 ? 'RED — HEAD catches it' : 'GREEN — HEAD does NOT catch it'));

fs.writeFileSync(
  path.join(TARGET, '.swarm/runs/cycle-030-baseline.txt'),
  lines.join('\n') + '\n'
);
