// cycle 52 — VERIFICATION GATE for T-044 (the --json composition clause).
//
// Authored by the conductor AT VERIFICATION TIME, after the tests were written.
// Agent returns are claims; this is where the claim becomes a fact.
//
// The claim: two tests added to test/cli.test.js close the J3 and J3b holes the
// cycle-52 sweep measured, and close nothing else by accident.
//
// L-029 requires a kill be proven BOTH ways — the test must fail against its
// specific mutation, AND removing the test must let that mutation survive. A
// green suite on a mutated tree proves nothing on its own; a red one might be red
// for an unrelated reason. So each mutant is run twice, with and without the new
// tests, and the pair is what carries the result.
//
// Gate cells:
//   A   pristine live tree, full test_cmd            -> GREEN, 84 tests
//   B   J3 mutant,  new tests PRESENT                -> RED   (kill)
//   C   J3 mutant,  new tests REMOVED                -> GREEN (attribution: only these catch it)
//   D   J3b mutant, new tests PRESENT                -> RED   (kill)
//   E   J3b mutant, new tests REMOVED                -> GREEN (attribution)
//   F   the failing test NAMES in B and D are the new tests, not collateral
//   G   NEGATIVE CONTROL: the other two measured holes (L5, L7) must STILL
//       survive. A test that silently swallowed them would mean the kills above
//       are not attributable to what this item claims to have closed.
//   H   FLAKE CONTROL: the pristine suite is green on 3 consecutive runs. The new
//       tests spawn 46 processes and sweep seeds; a probabilistic test that fails
//       1 run in 10 is worse than no test.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIVE = '/opt/targets/aphorism-cli';
const MARK = '// --- T-044: the "--json composes with the filter and seed flags" clause ------';

const MUT = {
  J3: { file: 'src/select.js', from: null, // planted in bin/aphorism.js, see below
    binFrom: '  const chosen = pick(candidates, opts.seed);',
    binTo: '  const chosen = pick(candidates, opts.json ? undefined : opts.seed);',
    desc: '--json silently drops the seed and picks at random' },
  J3b: { binFrom: '  const chosen = pick(candidates, opts.seed);',
    binTo: '  const chosen = pick(opts.json ? corpus : candidates, opts.seed);',
    desc: '--json ignores the filters and picks from the whole corpus' },
};
// The other two holes the sweep measured, used as the negative control.
const OTHER = {
  L5: { file: 'bin/aphorism.js', from: '  if (opts.list) {', to: '  if (opts.list && opts.seed === undefined) {',
    desc: '--list --seed stops listing and does a single seeded pick' },
  L7: { file: 'bin/aphorism.js', from: '  if (opts.error) {', to: "  if (opts.error && !argv.includes('--list')) {",
    desc: '--list swallows every usage error, including an unparseable seed' },
};

function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c52v-'));
  for (const e of fs.readdirSync(LIVE)) {
    if (e === '.git' || e === '.swarm') continue;
    fs.cpSync(path.join(LIVE, e), path.join(dir, e), { recursive: true });
  }
  return dir;
}
function suite(dir) {
  const files = fs.readdirSync(path.join(dir, 'test'))
    .filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
  const r = spawnSync(process.execPath, ['--test', ...files], { cwd: dir, encoding: 'utf8' });
  const out = r.stdout ?? '';
  const failed = [...new Set([...out.matchAll(/^✖ (.+?) \(\d+(?:\.\d+)?ms\)$/gm)].map((m) => m[1].trim()))];
  return {
    pass: Number(/^. pass (\d+)$/m.exec(out)?.[1]),
    fail: Number(/^. fail (\d+)$/m.exec(out)?.[1]),
    total: Number(/^. tests (\d+)$/m.exec(out)?.[1]),
    failed,
  };
}
// Excise the T-044 block (marker to end of file) — the "test removed" arm.
function stripNewTests(dir) {
  const p = path.join(dir, 'test/cli.test.js');
  const src = fs.readFileSync(p, 'utf8');
  const i = src.indexOf(MARK);
  if (i === -1) throw new Error('T-044 marker not found — cannot run the removal arm');
  fs.writeFileSync(p, src.slice(0, i));
  return true;
}
function plant(dir, file, from, to) {
  const p = path.join(dir, file);
  const src = fs.readFileSync(p, 'utf8');
  const hits = src.split(from).length - 1;
  if (hits !== 1) throw new Error(`anchor occurs ${hits}x in ${file}`);
  fs.writeFileSync(p, src.replace(from, to));
}

const results = [];
const cell = (id, want, got, note) => {
  const ok = want === got;
  results.push({ id, ok, note });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(4)} want ${String(want).padEnd(5)} got ${String(got).padEnd(5)}  ${note}`);
  return ok;
};

// --- A: pristine ------------------------------------------------------------
const aDir = copyTree();
const a = suite(aDir);
fs.rmSync(aDir, { recursive: true, force: true });
cell('A', true, a.fail === 0 && a.pass === a.total, `pristine suite ${a.pass} pass / ${a.fail} fail (${a.total} tests)`);
cell('A2', true, a.total === 84, `test count is 84 (82 before + the 2 added) — actual ${a.total}`);

// --- B..E: each mutant, with and without the new tests ----------------------
for (const [id, m] of Object.entries(MUT)) {
  // WITH the new tests -> must be RED
  const withDir = copyTree();
  plant(withDir, 'bin/aphorism.js', m.binFrom, m.binTo);
  const w = suite(withDir);
  fs.rmSync(withDir, { recursive: true, force: true });

  // WITHOUT them -> must be GREEN (that is what "this test is what caught it" means)
  const woDir = copyTree();
  stripNewTests(woDir);
  plant(woDir, 'bin/aphorism.js', m.binFrom, m.binTo);
  const o = suite(woDir);
  fs.rmSync(woDir, { recursive: true, force: true });

  cell(`${id}-kill`, true, w.fail > 0, `${m.desc} -> suite ${w.pass}p/${w.fail}f WITH the new tests`);
  cell(`${id}-attr`, true, o.fail === 0, `same mutant with the new tests REMOVED -> ${o.pass}p/${o.fail}f (survives, so the kill is theirs)`);

  // F: the kill must come from the new tests, not from collateral damage
  const newOnly = w.failed.every((n) => /^--json composes with/.test(n));
  cell(`${id}-names`, true, newOnly && w.failed.length > 0,
    `failing: ${w.failed.join(' | ') || '(none)'}`);
}

// --- G: negative control — the other two measured holes must STILL survive ---
for (const [id, m] of Object.entries(OTHER)) {
  const dir = copyTree();
  plant(dir, m.file, m.from, m.to);
  const s = suite(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  cell(`G-${id}`, true, s.fail === 0,
    `${m.desc} -> ${s.pass}p/${s.fail}f — still an OPEN hole, not silently closed`);
}

// --- H: flake control --------------------------------------------------------
let greens = 0;
for (let i = 0; i < 3; i++) {
  const d = copyTree();
  const s = suite(d);
  fs.rmSync(d, { recursive: true, force: true });
  if (s.fail === 0 && s.total === 84) greens++;
}
cell('H', true, greens === 3, `pristine suite green on ${greens}/3 consecutive runs (the new tests spawn 46 processes)`);

const passed = results.filter((r) => r.ok).length;
console.log(`\nGATE ${passed}/${results.length}`);
if (passed !== results.length) {
  console.log('GATE FAILED — T-044 does not close on this evidence.');
  process.exit(1);
}
console.log('GATE PASSED — the two tests kill J3 and J3b, the kills are attributable to them,');
console.log('they close nothing else by accident, and the suite is not flaky.');
