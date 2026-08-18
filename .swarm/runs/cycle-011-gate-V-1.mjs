#!/usr/bin/env node
// Gate for cycle 11 / V-1 — REPORT.md executive-summary count claims.
//
// SEALED BEFORE THE EDIT. Run once against the UNFIXED tree first: assertions
// A1 and A2 must FAIL and every other assertion must PASS. A gate that passes on
// the broken tree proves nothing; a gate that fails everywhere proves nothing either.
//
// K-4 (SPEC.md, this run's must-haves): REPORT.md answers what shipped / what is
// machine-verified / what is open in its FIRST SCREEN, "nothing deleted, no citation
// lost, no cycle number orphaned. No count claim in README.md, REPORT.md or docs/ is
// false." A1/A2 are the count-truth half; A4-A7 are the nothing-deleted half — the
// document's own convention is that DATED HISTORY ROWS stay as written and are
// reconciled below, never retro-edited (REPORT.md:57-63, 193-199, 528-533).

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const report = readFileSync(`${ROOT}/REPORT.md`, 'utf8');
const readme = readFileSync(`${ROOT}/README.md`, 'utf8');

const results = [];
const check = (id, desc, fn) => {
  let ok, detail;
  try { [ok, detail] = fn(); } catch (e) { ok = false; detail = `threw: ${e.message}`; }
  results.push({ id, desc, ok, detail });
};

// --- ground truth, measured here, not taken from any note ---------------------
const testFiles = readdirSync(`${ROOT}/test`).filter((f) => f.endsWith('.test.js'));
let suiteOut;
try {
  suiteOut = execFileSync('node', ['--test', ...testFiles.map((f) => `test/${f}`)],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  suiteOut = `${e.stdout || ''}${e.stderr || ''}`;
}
// node --test here uses the SPEC reporter ("i tests 118"), not TAP ("# tests 118").
// Cycle 10 measured this the hard way: a TAP-only regex read a green suite as not-green.
const grab = (label) => {
  const m = suiteOut.match(new RegExp(`^[^\\n]*?${label}\\s+(\\d+)\\s*$`, 'm'));
  return m ? Number(m[1]) : null;
};
const liveTests = grab('tests');
const liveFail = grab('fail');
const liveFiles = testFiles.length;

// --- A1/A2: the two claims this cycle repairs --------------------------------
check('A1', 'REPORT exec-summary test count equals the live suite count', () => {
  const m = report.match(/^- Test suite: (\d+) tests pass, (\d+) fail/m);
  if (!m) return [false, 'exec-summary "Test suite:" line not found'];
  const claimed = Number(m[1]);
  return [claimed === liveTests && Number(m[2]) === liveFail,
    `claims ${claimed} tests / ${m[2]} fail; live ${liveTests} tests / ${liveFail} fail`];
});

check('A2', 'REPORT "What ships" test-file count equals the real file count', () => {
  const m = report.match(/(\d+) test files in `test\/`/);
  if (!m) return [false, '"N test files in `test/`" not found'];
  return [Number(m[1]) === liveFiles,
    `claims ${m[1]} test files; real ${liveFiles} (${testFiles.join(', ')})`];
});

// --- A3: the product floor -----------------------------------------------------
check('A3', 'suite is green', () =>
  [liveFail === 0 && liveTests > 0, `tests ${liveTests}, fail ${liveFail}`]);

// --- A4-A6: nothing deleted, no history retro-edited ---------------------------
const BASELINE_LINES = report.split('\n').length;
check('A4', 'REPORT.md is not shortened by the edit', () => {
  const n = readFileSync(`${ROOT}/REPORT.md`, 'utf8').split('\n').length;
  return [n >= BASELINE_LINES, `${n} lines (baseline floor ${BASELINE_LINES})`];
});

check('A5', 'dated run-history rows are left as written (48 tests / 80 tests)', () => {
  const a = report.includes('product shipped, 5/5 must-haves, 48 tests');
  const b = report.includes('11/11 improvement must-haves closed, 80 tests');
  return [a && b, `48-tests row ${a}, 80-tests row ${b}`];
});

check('A6', 'run-#1 frozen-body figures are not retro-edited', () => {
  const hits = (report.match(/\*\*80 pass \/ 0 fail\*\*/g) || []).length;
  return [hits >= 2, `${hits} occurrences of the frozen "80 pass / 0 fail" figure (expect >= 2)`];
});

// --- A7: README makes no test-count claim, and must not acquire one -------------
check('A7', 'README.md asserts no test count', () => {
  const m = readme.match(/(\d+)\s+tests?\b/i);
  return [m === null, m ? `README now claims "${m[0]}"` : 'no test-count claim'];
});

// --- report ---------------------------------------------------------------------
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}  ${r.desc}\n        ${r.detail}`);
}
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed ? 1 : 0);
