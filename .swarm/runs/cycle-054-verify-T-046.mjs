// Conductor verification gate for T-046 (cycle 54).
//
// Authored at verification time by the conductor, not copied from the backlog and not
// taken from the builder's notes. The mutant under test is PRE-REGISTERED: its text is
// copied verbatim from the cycle-52 full-spec coverage sweep
// (.swarm/runs/cycle-052-rule-coverage.mjs, cell L7), where it was measured as a
// survivor of the whole 82-test suite long before this cycle's tests were conceived.
// L5 — closed at cycle 53 by T-045 — is re-run here as a POSITIVE control: cycle 53's
// test must still be doing its job.
//
// INSTRUMENT NOTE (cycles 19 / 23 / 52 all lost time to this): `node --test` in this
// environment defaults to the SPEC reporter, not TAP. Every suite run below forces
// --test-reporter=tap, and an unparseable run reports UNPARSEABLE explicitly rather
// than falling through into a verdict.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
// Every one of the six tests T-046 adds carries this fragment; no pre-existing test
// does (the DENOM cell below is what actually proves that, by counting).
const SKIP_PATTERN = 'stdout empty';
const EXPECTED_TOTAL = 91; // 85 at cycle 53 + 6 this cycle
const NEW_TESTS = 6;

const L7 = {
  id: 'L7',
  file: 'bin/aphorism.js',
  from: 'if (opts.error) {',
  to: "if (opts.error && !argv.includes('--list')) {",
  gloss: '--list swallows every usage error',
};
const L5 = {
  id: 'L5',
  file: 'bin/aphorism.js',
  from: 'if (opts.list) {',
  to: 'if (opts.list && opts.seed === undefined) {',
  gloss: '--list --seed does a single seeded pick instead of listing',
};

function freshCopy(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `aph-c54-${tag}-`));
  fs.cpSync(TARGET, dir, {
    recursive: true,
    filter: (src) => !/(^|\/)(\.git|\.swarm|node_modules)$/.test(src),
  });
  return dir;
}

function mutate(dir, m) {
  const p = path.join(dir, m.file);
  const src = fs.readFileSync(p, 'utf8');
  const n = src.split(m.from).length - 1;
  if (n !== 1) throw new Error(`${m.id}: anchor "${m.from}" matched ${n} times, expected 1`);
  fs.writeFileSync(p, src.replace(m.from, m.to));
}

// Runs the project's OWN test_cmd (node --test test/*.test.js) with TAP forced on.
function runSuite(dir, { skip } = {}) {
  const args = ['--test', '--test-reporter=tap'];
  if (skip) args.push(`--test-skip-pattern=${skip}`);
  args.push('test/cli.test.js', 'test/args.test.js', 'test/select.test.js', 'test/readme-tags.test.js');
  const r = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8', timeout: 300000 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const num = (k) => {
    const m = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm'));
    return m ? Number(m[1]) : null;
  };
  const tests = num('tests');
  const pass = num('pass');
  const fail = num('fail');
  if (tests === null || pass === null || fail === null) {
    return { unparseable: true, raw: out.slice(-1500) };
  }
  const failing = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  return { unparseable: false, tests, pass, fail, failing, raw: out };
}

// Runs the CLI binary itself in a given tree — the behavioural witness.
function cli(dir, argv) {
  const r = spawnSync(process.execPath, ['bin/aphorism.js', ...argv], {
    cwd: dir, encoding: 'utf8', timeout: 30000,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const results = [];
const check = (id, ok, detail) => {
  results.push({ id, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}   ${detail}`);
};

// --- CTRL-PRISTINE: an unmutated copy must be green. This control exists because
// cycle 19's harness silently manufactured a KILLED verdict for every mutant,
// including the unmutated one, when its parser returned null.
const pristine = freshCopy('pristine');
const P = runSuite(pristine);
if (P.unparseable) {
  check('CTRL-PRISTINE', false, `UNPARSEABLE suite output — harness cannot judge anything. tail:\n${P.raw}`);
} else {
  check('CTRL-PRISTINE', P.fail === 0 && P.pass === P.tests,
    `unmutated copy ${P.pass} pass / ${P.fail} fail (${P.tests} tests)`);
}
const EXPECTED = P.unparseable ? null : P.tests;

// --- A: the live tree's own test_cmd, run by the conductor, exactly as state.json spells it.
const live = spawnSync('sh', ['-c', 'node --test test/*.test.js'], { cwd: TARGET, encoding: 'utf8', timeout: 300000 });
const liveOut = `${live.stdout || ''}${live.stderr || ''}`;
const lm = liveOut.match(/ℹ tests (\d+)[\s\S]*?ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)/);
check('A', !!lm && lm[3] === '0',
  lm ? `live tree test_cmd: ${lm[2]} pass / ${lm[3]} fail (${lm[1]} tests)` : 'live test_cmd output UNPARSEABLE');

// --- A2: the suite grew by exactly the six tests this cycle adds (85 -> 91).
check('A2', EXPECTED === EXPECTED_TOTAL, `test count is ${EXPECTED}, expected ${EXPECTED_TOTAL} (85 at cycle 53 + ${NEW_TESTS})`);

// --- WITNESS: the L7 mutation must actually change USER-FACING behaviour, or a
// SURVIVED/KILLED verdict about it means nothing (cycle 52 lesson: every mutant needs
// its own behavioural witness). Pristine: exit 2, empty stdout. Mutated: exit 0 and the
// corpus on stdout. Checked on BOTH error shapes, since the mutant swallows all of them.
const w7 = freshCopy('witness');
mutate(w7, L7);
const wCases = [['--list', '--seed', 'abc'], ['--list', '--nosuchflag']];
const wDetail = [];
let wOk = true;
for (const c of wCases) {
  const pre = cli(pristine, c);
  const mut = cli(w7, c);
  const good = pre.status === 2 && pre.stdout === '' && mut.status === 0 && mut.stdout.length > 0;
  if (!good) wOk = false;
  wDetail.push(`${c.join(' ')}: pristine exit ${pre.status}/${pre.stdout.length}B stdout -> mutant exit ${mut.status}/${mut.stdout.length}B stdout`);
}
check('WITNESS-L7', wOk, wDetail.join(' ;; '));

// --- DENOM: the skip pattern must remove EXACTLY the six new tests and nothing else.
// Cycle 6 established that --test-skip-pattern FILTERS matched tests out of the run
// (the count drops; node's "skipped" counter stays 0), so the count is the measurement.
// This is also what proves no PRE-EXISTING test name carries the fragment.
const D = runSuite(pristine, { skip: SKIP_PATTERN });
check('DENOM', !D.unparseable && D.fail === 0 && D.tests === EXPECTED - NEW_TESTS,
  D.unparseable ? 'UNPARSEABLE' : `pristine + skip-pattern: ${D.tests} tests (${EXPECTED} - ${NEW_TESTS} expected), ${D.fail} fail`);

// --- L7-KILL: the pre-registered mutant must fail the suite, BY NAME.
const k7 = freshCopy('kill');
mutate(k7, L7);
const K = runSuite(k7);
check('L7-KILL', !K.unparseable && K.fail >= 1,
  K.unparseable ? 'UNPARSEABLE' : `${L7.gloss} -> ${K.pass}p/${K.fail}f`);
// Both error shapes must be named among the failures — not just the seed one the spec
// carve-out mentions. A test set that only caught the seed case would leave the mutant's
// unknown-flag half unprotected.
const namedSeed = !K.unparseable && K.failing.some((n) => n.includes('--list --seed abc'));
const namedFlag = !K.unparseable && K.failing.some((n) => n.includes('--list --nosuchflag'));
check('L7-NAMES', namedSeed && namedFlag,
  K.unparseable ? 'UNPARSEABLE' : `${(K.failing || []).length} failing; seed-case named=${namedSeed} flag-case named=${namedFlag}`);

// --- L7-ATTR: the SAME mutant, with the six new tests filtered out, must SURVIVE.
// This is the arm whose outcome the author does not control: if anything else in the
// suite already caught L7, the kill above is not these tests' to claim.
const a7 = freshCopy('attr');
mutate(a7, L7);
const A7 = runSuite(a7, { skip: SKIP_PATTERN });
check('L7-ATTR', !A7.unparseable && A7.fail === 0 && A7.tests === EXPECTED - NEW_TESTS,
  A7.unparseable ? 'UNPARSEABLE' : `same mutant, new tests removed -> ${A7.pass}p/${A7.fail}f (survives, so the kill is the new tests')`);

// --- POS-L5: cycle 53's test must still kill L5. A regression control: the coverage map
// claims 29/29 after this cycle, which is false if closing L7 broke the L5 protection.
const p5 = freshCopy('l5');
mutate(p5, L5);
const P5 = runSuite(p5);
check('POS-L5', !P5.unparseable && P5.fail >= 1,
  P5.unparseable ? 'UNPARSEABLE' : `${L5.gloss} -> ${P5.pass}p/${P5.fail}f (cycle 53's T-045 test still holds)`);

// --- H: flake control. The six new tests spawn six more processes; a suite that is only
// sometimes green is not green.
let stable = true;
for (let i = 0; i < 2; i += 1) {
  const R = runSuite(pristine);
  if (R.unparseable || R.fail !== 0) stable = false;
}
check('H', stable, 'pristine copy green on 3/3 consecutive runs');

const passed = results.filter((r) => r.ok).length;
console.log(`GATE ${passed}/${results.length}`);
process.exitCode = passed === results.length ? 0 : 1;
