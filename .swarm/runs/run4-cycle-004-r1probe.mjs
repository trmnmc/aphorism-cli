#!/usr/bin/env node
// run4 cycle 4 — R-1 disposition probe.
//
// QUESTION: R-1 asks for a structural reshape of the token co-occurrence guard so that
// the D4a/D4b hole (acknowledgement stripped, in-section decoy left behind -> guard
// SILENT) is closed. The recorded cycle-39 measurement isolated that guard deliberately,
// via --test-name-pattern, so "the neighbouring count guards can neither supply nor mask
// the verdict". That isolation answers "is the guard broken" (yes) but NOT "is the
// PROPERTY unprotected", which is what R-1's value depends on.
//
// This probe measures the suite-level question, with attribution controls.
//
// Arms are built by `git archive <SHA>` into a scratch tree — never by copying the live
// tree (L-042). The live target repo is not touched by this script at all.

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const SCRATCH = '/opt/swarm/runs/r1probe';
const SHA = process.argv[2];
if (!SHA) { console.error('usage: run4-cycle-004-r1probe.mjs <sha>'); process.exit(64); }

const GUARD_PATTERN = 'token co-occurrence guard';

// The pristine Tag-vocabulary prose sentence the arms mutate.
const ORIG = 'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';

// Acknowledgement STRIPPED; the distinct-tag and multi-entry claims deliberately kept so
// the other count guards are not tripped by collateral damage.
const STRIPPED = 'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries.';

const ARMS = {
  // C0 — pristine.
  A_baseline: (r) => r,
  // D4a — recorded decoy 1: pairs "tag" + "entry" + the "one entry" marker.
  B_d4a: (r) => r.replace(ORIG, STRIPPED + ' Tags are listed in alphabetical order, one entry per line.'),
  // D4b — recorded decoy 2: pairs "tag" + "entry" + the "single-entry" marker.
  C_d4b: (r) => r.replace(ORIG, STRIPPED + ' A tag name is a single-entry token with no spaces.'),
  // CONTROL — benign reword. Numbers untouched, acknowledgement intact, guard vocabulary
  // untouched. The suite MUST stay green, or a red arm above proves nothing.
  F_benign: (r) => r.replace('The distribution is uneven,', 'The distribution is lopsided,'),
};

function buildArm(name, mutate) {
  const dir = path.join(SCRATCH, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  execSync(`git -C ${TARGET} archive ${SHA} | tar -x -C ${dir}`, { stdio: 'pipe' });
  const rp = path.join(dir, 'README.md');
  const before = fs.readFileSync(rp, 'utf8');
  const after = mutate(before);
  if (name !== 'A_baseline' && after === before) {
    throw new Error(`ARM ${name} IS INERT — its mutation matched nothing. Not a result.`);
  }
  fs.writeFileSync(rp, after);
  return dir;
}

// TAP reporter, not the spec reporter: this repo has already paid twice for parsing the
// spec reporter's glyph (run #4 cycle 1 C4, cycle 3 suite parser). TAP's `not ok` lines
// are machine-owned structure. Exit code is the primary verdict; names are for reading.
function runSuite(dir, namePattern) {
  const args = ['--test', '--test-reporter=tap'];
  if (namePattern) args.push(`--test-name-pattern=${namePattern}`);
  args.push('test/args.test.js', 'test/cli.test.js', 'test/pipe.test.js',
            'test/readme-tags.test.js', 'test/select.test.js');
  let out = '', code = 0;
  try {
    out = execFileSync('node', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout: 180000 });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    code = e.status === undefined ? -1 : e.status;
  }
  const failures = [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1].trim())
    .filter((n) => !/^test\/.*\.test\.js$/.test(n)); // drop file-level roll-ups
  const m = (k) => { const r = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')); return r ? +r[1] : null; };
  return { code, green: code === 0, failures, tests: m('tests'), pass: m('pass'), fail: m('fail') };
}

const rows = [];
const results = {};
for (const [name, mutate] of Object.entries(ARMS)) {
  const dir = buildArm(name, mutate);
  const full = runSuite(dir, null);
  const guard = runSuite(dir, GUARD_PATTERN);
  results[name] = { full, guard };
  rows.push({ arm: name, full, guard });
}

console.log('=== R-1 SUITE-LEVEL PROBE ===');
console.log(`arms built by git archive ${SHA}\n`);
for (const r of rows) {
  console.log(`${r.arm}`);
  console.log(`   full suite : ${r.full.green ? 'GREEN' : 'RED  '}  tests=${r.full.tests} pass=${r.full.pass} fail=${r.full.fail} exit=${r.full.code}`);
  for (const f of r.full.failures) console.log(`                - ${f}`);
  console.log(`   guard alone: ${r.guard.green ? 'SILENT' : 'FIRES '}  tests=${r.guard.tests} pass=${r.guard.pass} fail=${r.guard.fail}`);
  console.log('');
}

// ---- Verdict cells -------------------------------------------------------------------
const cells = [
  ['P1  baseline full suite GREEN', results.A_baseline.full.green && results.A_baseline.full.tests >= 118],
  ['P2  baseline guard SILENT', results.A_baseline.guard.green],
  ['P3  D4a guard SILENT (reproduces the recorded miss)', results.B_d4a.guard.green],
  ['P4  D4b guard SILENT (reproduces the recorded miss)', results.C_d4b.guard.green],
  ['P5  D4a full suite RED (suite catches what the guard misses)', !results.B_d4a.full.green],
  ['P6  D4b full suite RED (suite catches what the guard misses)', !results.C_d4b.full.green],
  ['P7  CONTROL benign reword leaves the suite GREEN', results.F_benign.full.green],
];
console.log('--- cells ---');
let pass = 0;
for (const [label, ok] of cells) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (ok) pass++; }
console.log(`${pass} PASS / ${cells.length - pass} FAIL of ${cells.length}`);

fs.writeFileSync(path.join(SCRATCH, 'catchers.json'),
  JSON.stringify({ d4a: results.B_d4a.full.failures, d4b: results.C_d4b.full.failures }, null, 2));
console.log('\ncatching tests written to', path.join(SCRATCH, 'catchers.json'));
