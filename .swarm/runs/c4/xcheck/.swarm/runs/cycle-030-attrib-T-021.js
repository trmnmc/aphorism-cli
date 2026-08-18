#!/usr/bin/env node
// Cycle 30 — L-029 strict attribution for the four tests added by T-021.
//
// The question a new test must answer is what it catches that NOTHING ELSE
// does. The README on disk has exactly one qualifying heading, so a regression
// of the locator back to FIRST-MATCH-WINS (the shape rejected at cycle 28) is
// invisible to every README-driven test in this repo. If that is true, the four
// synthetic-document tests are the sole protection against re-introducing the
// silent hole, and that is precisely their value.
//
// Cells (mutation = revert the ambiguity assert to first-match-wins, pristine
// README throughout):
//   M1  mutation applied, all tests present  -> must be RED, naming a new test
//   M2  mutation applied, 4 new tests filtered -> must be GREEN at the 74-test
//                                                 pre-cycle baseline
//   C1  DENOMINATOR control: no mutation, 4 new tests filtered -> 74/74/0
//   C2  SKIP-SANITY: an unrelated breaking mutation under the SAME filter must
//       still fail, so a vacuous filter cannot manufacture M2's green.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const GUARD = 'test/readme-tags.test.js';

const NEW_TESTS = [
  'getListBehaviourSection tolerates a reformatted',
  'getListBehaviourSection still fails on a SEPARATOR MISMATCH',
  'getListBehaviourSection reports ambiguity loudly',
  'getListBehaviourSection does not let',
];
// One pattern matching exactly the four tests added this cycle.
const SKIP_PATTERN = 'getListBehaviourSection';

function copyRepo(label) {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'c030a-' + label + '-'));
  execFileSync('bash', ['-c', `cd ${TARGET} && tar --exclude=.git -cf - . | tar -xf - -C ${dest}`]);
  return dest;
}

function runSuite(dir, skip) {
  const flag = skip ? `--test-skip-pattern="${SKIP_PATTERN}"` : '';
  const r = spawnSync('bash', ['-c',
    `cd ${dir} && node --test --test-reporter=tap ${flag} test/*.test.js 2>&1`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const failing = [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1].trim());
  const tests = num(/^# tests (\d+)/m), pass = num(/^# pass (\d+)/m), fail = num(/^# fail (\d+)/m);
  return {
    tests, pass, fail, failing,
    sig: (tests === null) ? 'UNPARSEABLE' : `${tests}/${pass}/${fail}`,
  };
}

// MUTATION: replace the ambiguity assert with first-match-wins — the exact
// shape cycle 28 measured into a silent hole.
function applyFirstMatchMutation(dir) {
  const p = path.join(dir, GUARD);
  const src = fs.readFileSync(p, 'utf8');
  const start = src.indexOf('  assert.equal(\n    candidates.length,\n    1,');
  if (start === -1) throw new Error('mutation anchor not found — harness is stale');
  const end = src.indexOf('  );', src.indexOf("refusing to silently pick one"));
  if (end === -1) throw new Error('mutation end anchor not found');
  const mutated = src.slice(0, start) + '  // MUTATED: first-match-wins\n' + src.slice(end + 5);
  if (mutated === src) throw new Error('mutation did not apply');
  fs.writeFileSync(p, mutated);
  return true;
}

// SKIP-SANITY breaking mutation: make the format-literal comparison compare
// against a wrong separator, which a PRE-EXISTING test owns.
function applyBreakingMutation(dir) {
  const p = path.join(dir, GUARD);
  const src = fs.readFileSync(p, 'utf8');
  const mutated = src.replace(
    'const expectedLines = corpus.map((entry) => `${entry.text}${separator}${entry.author}`);',
    'const expectedLines = corpus.map((entry) => `${entry.text} ~~ ${entry.author}`);'
  );
  if (mutated === src) throw new Error('breaking mutation did not apply');
  fs.writeFileSync(p, mutated);
}

const lines = [];
const log = (s) => { lines.push(s); console.log(s); };

log('CYCLE 30 — L-029 STRICT ATTRIBUTION for the four T-021 tests');
log('skip pattern: ' + SKIP_PATTERN);
log('');

const results = {};

// M1
let d = copyRepo('M1'); applyFirstMatchMutation(d);
results.M1 = runSuite(d, false); fs.rmSync(d, { recursive: true, force: true });

// M2
d = copyRepo('M2'); applyFirstMatchMutation(d);
results.M2 = runSuite(d, true); fs.rmSync(d, { recursive: true, force: true });

// C1 denominator
d = copyRepo('C1');
results.C1 = runSuite(d, true); fs.rmSync(d, { recursive: true, force: true });

// C2 skip-sanity
d = copyRepo('C2'); applyBreakingMutation(d);
results.C2 = runSuite(d, true); fs.rmSync(d, { recursive: true, force: true });

for (const [k, r] of Object.entries(results)) {
  log(`${k}  ${r.sig}`);
  log(`    failing: ${r.failing.length ? r.failing.map((f) => '\n      - ' + f).join('') : '(none)'}`);
}
log('');

const namesANewTest = results.M1.failing.some((f) => NEW_TESTS.some((n) => f.includes(n)));
const checks = [
  ['M1 RED', results.M1.fail > 0],
  ['M1 names a test added this cycle', namesANewTest],
  ['M1 failures are ONLY new tests (no pre-existing test also catches it)',
    results.M1.failing.every((f) => NEW_TESTS.some((n) => f.includes(n)))],
  ['M2 GREEN (mutation survives everything that pre-dates this cycle)', results.M2.fail === 0],
  ['M2 lands exactly on the 74-test pre-cycle baseline', results.M2.sig === '74/74/0'],
  ['C1 DENOMINATOR: filter removes exactly the 4 new tests, rest green', results.C1.sig === '74/74/0'],
  ['C2 SKIP-SANITY: filter does not disable the run', results.C2.fail > 0],
];

let pass = 0, fail = 0;
log('--- checks -----------------------------------------------------------');
for (const [name, ok] of checks) {
  log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (ok) pass++; else fail++;
}
log('');
log(`attribution checks: ${pass} pass / ${fail} fail`);
log('');
log('READING: M1 red + M2 green at exactly the pre-cycle baseline is the strict');
log('form -- the first-match regression survives every test that existed before');
log('this cycle, and is caught only by the tests added this cycle.');

fs.writeFileSync(path.join(TARGET, '.swarm/runs/cycle-030-attrib-T-021.txt'), lines.join('\n') + '\n');
process.exit(fail === 0 ? 0 : 1);
