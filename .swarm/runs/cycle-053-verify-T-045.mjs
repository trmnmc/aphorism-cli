// Conductor verification gate for T-045 (cycle 53).
//
// Authored at verification time by the conductor, not copied from the backlog and not
// taken from any builder's notes. The two mutants below are PRE-REGISTERED: their text
// is copied verbatim from the cycle-52 full-spec coverage sweep
// (.swarm/runs/cycle-052-rule-coverage.mjs, cells L5 and L7), where both were measured
// as survivors of the whole 84-test suite BEFORE this cycle's test was conceived.
//
// INSTRUMENT NOTE (cycle 19 / 23 / 52 all lost time to this): `node --test` in this
// environment defaults to the SPEC reporter, not TAP. Every run below forces
// --test-reporter=tap, and an unparseable run reports UNPARSEABLE explicitly rather
// than falling through into a verdict.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const TEST_NAME_FRAGMENT = 'IGNORES it';
const SKIP_PATTERN = 'IGNORES it';

const L5 = {
  id: 'L5',
  file: 'bin/aphorism.js',
  from: 'if (opts.list) {',
  to: 'if (opts.list && opts.seed === undefined) {',
  gloss: '--list --seed does a single seeded pick instead of listing',
};
const L7 = {
  id: 'L7',
  file: 'bin/aphorism.js',
  from: 'if (opts.error) {',
  to: "if (opts.error && !argv.includes('--list')) {",
  gloss: '--list swallows every usage error',
};

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c53-'));
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

const results = [];
const check = (id, ok, detail) => {
  results.push({ id, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}   ${detail}`);
};

// --- CTRL-PRISTINE: an unmutated copy must be green. This control exists because
// cycle 19's harness silently manufactured a KILLED verdict for every mutant,
// including the unmutated one, when its parser returned null.
const pristine = freshCopy();
const P = runSuite(pristine);
if (P.unparseable) {
  check('CTRL-PRISTINE', false, `UNPARSEABLE suite output — harness cannot judge anything. tail:\n${P.raw}`);
} else {
  check('CTRL-PRISTINE', P.fail === 0 && P.pass === P.tests, `unmutated copy ${P.pass} pass / ${P.fail} fail (${P.tests} tests)`);
}
const EXPECTED = P.unparseable ? null : P.tests;

// --- A: the live tree's own test_cmd, run by the conductor.
const live = spawnSync('sh', ['-c', 'node --test test/*.test.js'], { cwd: TARGET, encoding: 'utf8', timeout: 300000 });
const liveOut = `${live.stdout || ''}${live.stderr || ''}`;
const lm = liveOut.match(/ℹ tests (\d+)[\s\S]*?ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)/);
check('A', !!lm && lm[3] === '0', lm ? `live tree test_cmd: ${lm[2]} pass / ${lm[3]} fail (${lm[1]} tests)` : 'live test_cmd output UNPARSEABLE');

// --- A2: the suite grew by exactly the one test this cycle adds (84 -> 85).
check('A2', EXPECTED === 85, `test count is ${EXPECTED}, expected 85 (84 at cycle 52 + 1)`);

// --- DENOM: the skip pattern must remove EXACTLY the new test and nothing else.
// Cycle 6 established that --test-skip-pattern FILTERS matched tests out of the run
// (the count drops; node's "skipped" counter stays 0), so the count is the measurement.
const D = runSuite(pristine, { skip: SKIP_PATTERN });
check('DENOM', !D.unparseable && D.fail === 0 && D.tests === EXPECTED - 1,
  D.unparseable ? 'UNPARSEABLE' : `pristine + skip-pattern: ${D.tests} tests (${EXPECTED} - 1 expected), ${D.fail} fail`);

// --- L5-KILL: the pre-registered mutant must fail the suite, BY NAME.
const k5 = freshCopy();
mutate(k5, L5);
const K = runSuite(k5);
check('L5-KILL', !K.unparseable && K.fail >= 1, K.unparseable ? 'UNPARSEABLE' : `${L5.gloss} -> ${K.pass}p/${K.fail}f`);
check('L5-NAMES', !K.unparseable && K.failing.some((n) => n.includes(TEST_NAME_FRAGMENT)),
  K.unparseable ? 'UNPARSEABLE' : `failing: ${(K.failing || []).join(' | ').slice(0, 160)}`);

// --- L5-ATTR: the SAME mutant, with the new test filtered out, must SURVIVE.
// This is the arm whose outcome the author does not control: if anything else in the
// suite already caught L5, the kill above is not this test's to claim.
const a5 = freshCopy();
mutate(a5, L5);
const A5 = runSuite(a5, { skip: SKIP_PATTERN });
check('L5-ATTR', !A5.unparseable && A5.fail === 0 && A5.tests === EXPECTED - 1,
  A5.unparseable ? 'UNPARSEABLE' : `same mutant, new test removed -> ${A5.pass}p/${A5.fail}f (survives, so the kill is the new test's)`);

// --- NEG-L7: the OTHER measured hole must still be open. A new test that had quietly
// swallowed L7 would mean the coverage map is wrong about what remains unprotected.
const n7 = freshCopy();
mutate(n7, L7);
const N = runSuite(n7);
check('NEG-L7', !N.unparseable && N.fail === 0 && N.tests === EXPECTED,
  N.unparseable ? 'UNPARSEABLE' : `${L7.gloss} -> ${N.pass}p/${N.fail}f — still an OPEN hole (T-046)`);

// --- H: flake control. The new test spawns 8 more processes; a suite that is only
// sometimes green is not green.
let stable = true;
for (let i = 0; i < 2; i += 1) {
  const R = runSuite(pristine);
  if (R.unparseable || R.fail !== 0) stable = false;
}
check('H', stable, `pristine copy green on 3/3 consecutive runs`);

const passed = results.filter((r) => r.ok).length;
console.log(`GATE ${passed}/${results.length}`);
process.exitCode = passed === results.length ? 0 : 1;
