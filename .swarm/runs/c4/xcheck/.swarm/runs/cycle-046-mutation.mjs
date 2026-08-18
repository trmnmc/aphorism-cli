// cycle 46 — mutation proof for the rewritten `--tag matches membership, not
// substring containment` probe in test/cli.test.js.
//
// Two cells, per the standing builder/qa directive: the test must (1) FAIL
// against the specific mutation it claims to guard, and (2) be ATTRIBUTABLE —
// with the test removed, that same mutation must SURVIVE the rest of the
// suite. A kill you cannot attribute is not evidence.
//
// The mutation: src/select.js whole-tag equality -> substring containment,
// i.e. exactly the implementation the test's name says it forbids.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SELECT = path.join(ROOT, 'src', 'select.js');
const CLITEST = path.join(ROOT, 'test', 'cli.test.js');

const ORIG_SELECT = fs.readFileSync(SELECT, 'utf8');
const ORIG_CLITEST = fs.readFileSync(CLITEST, 'utf8');

const WHOLE = "entry.tags.some((t) => t.toLowerCase() === needle)";
const SUBSTR = "entry.tags.some((t) => t.toLowerCase().includes(needle))";
if (!ORIG_SELECT.includes(WHOLE)) {
  console.log('FATAL: could not locate the whole-tag match expression to mutate');
  process.exit(1);
}

const TESTNAME = '--tag matches membership, not substring containment';

// Invoke the runner exactly as the spec's test_cmd does -- `node --test
// test/*.test.js` -- with the glob expanded here rather than by a shell.
// (An earlier revision of this harness passed the test DIRECTORY instead;
// node then reported a single directory-level failure and every cell read
// FAIL, including the unmutated baseline. The baseline cell is what caught
// it: a harness whose control cell fails is measuring itself, not the code.)
const TEST_FILES = fs
  .readdirSync(path.join(ROOT, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join('test', f));

function runSuite() {
  const r = spawnSync(process.execPath, ['--test', ...TEST_FILES], {
    encoding: 'utf8',
    cwd: ROOT,
  });
  const out = r.stdout + r.stderr;
  const failLine = out.match(/^ℹ fail (\d+)$/m);
  const fails = failLine ? parseInt(failLine[1], 10) : -1;
  const failedNames = [...out.matchAll(/^✖ (.+?) \(\d/gm)].map((m) => m[1]);
  // node prints the failing set twice (inline + summary); dedupe
  return { fails, failed: [...new Set(failedNames)] };
}

const results = {};
try {
  // ---- cell 1: mutation live, test present -> the test must KILL it
  fs.writeFileSync(SELECT, ORIG_SELECT.replace(WHOLE, SUBSTR));
  const c1 = runSuite();
  results.c1 = c1;
  console.log(`cell 1  mutation ON, test PRESENT   -> fails=${c1.fails}`);
  console.log(`        failing: ${JSON.stringify(c1.failed)}`);
  const killed = c1.failed.includes(TESTNAME);
  console.log(`        ${killed ? 'PASS' : 'FAIL'}  the probe fails against the substring mutation`);

  // ---- cell 2: mutation live, test REMOVED -> the mutation must SURVIVE
  const skipped = ORIG_CLITEST.replace(
    `test('${TESTNAME}'`,
    `test.skip('${TESTNAME}'`
  );
  if (skipped === ORIG_CLITEST) throw new Error('could not skip the probe by name');
  fs.writeFileSync(CLITEST, skipped);
  const c2 = runSuite();
  results.c2 = c2;
  console.log(`cell 2  mutation ON, test REMOVED   -> fails=${c2.fails}`);
  console.log(`        failing: ${JSON.stringify(c2.failed)}`);
  const survived = c2.fails === 0;
  console.log(`        ${survived ? 'PASS' : 'FAIL'}  the mutation survives without the probe ` +
    `(kill is attributable to it alone)`);

  // ---- cell 3: mutation reverted, test present -> baseline green
  fs.writeFileSync(SELECT, ORIG_SELECT);
  fs.writeFileSync(CLITEST, ORIG_CLITEST);
  const c3 = runSuite();
  results.c3 = c3;
  console.log(`cell 3  mutation OFF, test PRESENT  -> fails=${c3.fails}`);
  console.log(`        ${c3.fails === 0 ? 'PASS' : 'FAIL'}  baseline is green (no false positive)`);

  const ok = killed && survived && c3.fails === 0;
  console.log(`\n${ok ? 'MUTATION PROOF COMPLETE' : 'MUTATION PROOF INCOMPLETE'}`);
  process.exitCode = ok ? 0 : 1;
} finally {
  // restore unconditionally — a crashed harness must not leave a mutant on disk
  fs.writeFileSync(SELECT, ORIG_SELECT);
  fs.writeFileSync(CLITEST, ORIG_CLITEST);
  const restored =
    fs.readFileSync(SELECT, 'utf8') === ORIG_SELECT &&
    fs.readFileSync(CLITEST, 'utf8') === ORIG_CLITEST;
  console.log(`restore: ${restored ? 'both files byte-identical to pre-harness' : 'RESTORE FAILED'}`);
}
