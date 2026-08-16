// cycle 51 — verification gate for T-043 (the uniformity Domain rule had no test).
//
// Reuses the cycle-050-suite-survivors.mjs copy machinery rather than writing a third
// harness. What is new here: TAP-reporter failure attribution BY TEST NAME (cycle-23
// method), the cycle-5 STRICT attribution arm (mutate + filter the new tests out; the
// suite must return to its pre-cycle baseline), the cycle-6 DENOMINATOR control (prove
// the filter removes exactly the two new tests and nothing else), and a
// FALSE-REJECTION probe no acceptance clause asked for.
//
// HONESTY NOTE, stated up front because it changes how this evidence should be weighed:
// the allocator authorises ZERO agent burn, so the conductor wrote BOTH the test and
// this gate. The usual protection -- "the builder never saw the check, so it cannot have
// coded to the check" -- DOES NOT APPLY to this item. What does the work instead: the
// two mutants are PRE-REGISTERED from cycle 50 (they were measured as survivors before
// the test existed, and their text is copied verbatim from that harness), and the
// attribution arms are measurements rather than opinions.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIVE = '/opt/targets/aphorism-cli';

// The two tests added this cycle. Named once, used by both the strict-attribution arm
// and the denominator control.
const NEW_TESTS = [
  'pick: every candidate is REACHABLE by an unseeded draw',
  'pick: unseeded draws split the interval EQUALLY across candidates (uniform)',
];
const SKIP_PATTERN = 'pick: (every candidate is REACHABLE|unseeded draws split)';

const ANCHOR = 'index = Math.floor(Math.random() * candidates.length);';

// M1 and M3 are copied VERBATIM from .swarm/runs/cycle-050-suite-survivors.mjs, where
// both were measured to survive the whole 80-test suite before this test existed.
const M1 = {
  id: 'M1',
  to: 'index = Math.floor(Math.random() * (candidates.length - 1));',
  desc: 'unseeded off-by-one — the last candidate is unreachable forever',
};
const M3 = {
  id: 'M3',
  to: 'index = Math.floor(Math.random() ** 2 * candidates.length);',
  desc: 'unseeded selection heavily biased toward the front of the corpus',
};
// NOT a defect: a reversed-but-still-uniform mapping. The Domain rule promises
// uniformity, not a particular u -> index mapping, so this MUST stay green. This is the
// check that separates a guard measuring uniformity from one that froze today's
// arithmetic; every acceptance-shaped check above passes under both readings.
const R_UNIFORM = {
  id: 'RU',
  to: 'index = candidates.length - 1 - Math.floor(Math.random() * candidates.length);',
  desc: 'reversed but STILL UNIFORM — an honest rewrite that must not be rejected',
};

function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c51-'));
  for (const e of fs.readdirSync(LIVE)) {
    if (e === '.git' || e === '.swarm') continue;
    fs.cpSync(path.join(LIVE, e), path.join(dir, e), { recursive: true });
  }
  return dir;
}

// TAP reporter, so a failure can be attributed to a test BY NAME. Cycle 19 and cycle 23
// both shipped a harness that parsed the DEFAULT reporter's output and silently
// manufactured verdicts; an unparseable run is reported UNPARSEABLE here, never as a
// verdict.
function suite(dir, skipPattern) {
  const files = fs
    .readdirSync(path.join(dir, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => 'test/' + f);
  const args = ['--test', '--test-reporter=tap'];
  if (skipPattern) args.push('--test-skip-pattern=' + skipPattern);
  const r = spawnSync(process.execPath, [...args, ...files], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const pass = /^# pass (\d+)$/m.exec(r.stdout)?.[1];
  const fail = /^# fail (\d+)$/m.exec(r.stdout)?.[1];
  if (pass === undefined || fail === undefined) {
    return { unparseable: true, raw: r.stdout.slice(0, 400) };
  }
  const failedNames = [];
  for (const line of r.stdout.split('\n')) {
    const m = /^not ok \d+ - (.*)$/.exec(line.trim());
    if (m) failedNames.push(m[1].trim());
  }
  return { pass: Number(pass), fail: Number(fail), failedNames };
}

function plant(dir, to) {
  const p = path.join(dir, 'src/select.js');
  const src = fs.readFileSync(p, 'utf8');
  const hits = src.split(ANCHOR).length - 1;
  if (hits !== 1) throw new Error(`anchor not unique (${hits} hits)`);
  fs.writeFileSync(p, src.replace(ANCHOR, to));
}

function run(mutation, skipPattern) {
  const dir = copyTree();
  try {
    if (mutation) plant(dir, mutation);
    return suite(dir, skipPattern);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const cells = [];
function cell(id, what, ok, detail) {
  cells.push({ id, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${what}`);
  if (detail) console.log(`        ${detail}`);
}

// --- P0: the copy machinery must produce a green tree, or every verdict is void.
const p0 = run(null, null);
if (p0.unparseable) {
  console.log('P0 UNPARSEABLE — no verdict drawn. raw:', p0.raw);
  process.exit(2);
}
const BASELINE_WITH_NEW = p0.pass;
cell(
  'P0',
  'unmutated copy of the LIVE tree is green',
  p0.fail === 0 && p0.pass > 0,
  `${p0.pass} pass / ${p0.fail} fail  (this is the new baseline: 80 + ${BASELINE_WITH_NEW - 80} added this cycle)`
);

// --- A1/A2: each pre-registered survivor must now FAIL, attributable BY NAME.
for (const m of [M1, M3]) {
  const s = run(m.to, null);
  if (s.unparseable) {
    cell(`A.${m.id}`, 'suite run parseable', false, 'UNPARSEABLE — no verdict');
    continue;
  }
  const byNewTest = s.failedNames.filter((n) => NEW_TESTS.includes(n));
  const byOther = s.failedNames.filter((n) => !NEW_TESTS.includes(n));
  cell(
    `A.${m.id}`,
    `${m.id} is now KILLED and the kill is attributed by name`,
    s.fail > 0 && byNewTest.length > 0,
    `${s.pass} pass / ${s.fail} fail — killed by: ${byNewTest.join(' | ') || '(none of the new tests!)'}` +
      (byOther.length ? `; other failures: ${byOther.join(' | ')}` : '; no other test failed') +
      `\n        ${m.desc}`
  );
}

// --- R1: STRICT attribution (cycle-5 form). Mutate AND filter the two new tests out;
// the suite must return to exactly the pre-cycle baseline of 80. If it does not, the
// kill above was not bought by this cycle's work.
for (const m of [M1, M3]) {
  const s = run(m.to, SKIP_PATTERN);
  if (s.unparseable) {
    cell(`R1.${m.id}`, 'strict-attribution run parseable', false, 'UNPARSEABLE');
    continue;
  }
  cell(
    `R1.${m.id}`,
    `with the new tests removed, ${m.id} SURVIVES again at the pre-cycle baseline`,
    s.fail === 0 && s.pass === 80,
    `${s.pass} pass / ${s.fail} fail (want 80 / 0 — the cycle-50 measured baseline)`
  );
}

// --- R2: DENOMINATOR control (cycle-6 form). The skip pattern must remove EXACTLY the
// two tests added this cycle, against PRISTINE source. Without this, R1 could be green
// because the pattern silently filtered out half the suite.
const den = run(null, SKIP_PATTERN);
cell(
  'R2',
  'the skip pattern removes exactly the 2 tests added this cycle, and nothing else',
  !den.unparseable &&
    den.fail === 0 &&
    den.pass === 80 &&
    BASELINE_WITH_NEW - den.pass === 2,
  `pristine ${BASELINE_WITH_NEW} pass -> filtered ${den.pass} pass / ${den.fail} fail (want a drop of exactly 2, to 80)`
);

// --- D: the decisive check no acceptance clause asked for. A reversed-but-uniform
// implementation must stay GREEN. A guard that pinned today's u -> index mapping passes
// every check above and FAILS here.
const ru = run(R_UNIFORM.to, null);
cell(
  'D',
  'a reversed but STILL-UNIFORM rewrite is NOT rejected',
  !ru.unparseable && ru.fail === 0 && ru.pass === BASELINE_WITH_NEW,
  `${ru.pass} pass / ${ru.fail} fail (want ${BASELINE_WITH_NEW} / 0)` +
    (ru.fail ? ` — rejected by: ${ru.failedNames.join(' | ')}` : '') +
    `\n        ${R_UNIFORM.desc}`
);

console.log('');
const passed = cells.filter((c) => c.ok).length;
console.log(`GATE ${passed}/${cells.length}`);
for (const c of cells.filter((c) => !c.ok)) console.log(`  FAILED: ${c.id}`);
process.exit(passed === cells.length ? 0 : 1);
