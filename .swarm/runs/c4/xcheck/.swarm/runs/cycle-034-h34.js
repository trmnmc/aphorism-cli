#!/usr/bin/env node
// Cycle 34 conductor harness for T-029 (the SILENT HOLE in the Attribution
// count extraction). Copies the repo to a temp dir, applies a README mutation
// (a "cell"), optionally applies a candidate test-file ARM, runs the suite
// under the TAP reporter, and reports pass/fail plus the NAMES and MESSAGES of
// failing tests.
//
// Design notes, per this run's standing rules:
//  - TAP reporter is forced (cycle 19: the default reporter breaks parsing and
//    silently manufactured a KILLED verdict for every mutant).
//  - An unparseable run reports UNPARSEABLE explicitly; it never falls through
//    into a verdict (cycle 19).
//  - Failure attribution is by TEST NAME **and** by ASSERTION MESSAGE
//    (cycle 23 / cycle 28): "the suite failed" is not evidence about which
//    guard fired, and T-029's acceptance demands the message name the WRONG
//    number.
//  - Scratch lives under os.tmpdir(), never under /opt/swarm (KI-7).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
const README = 'README.md';

// --- the two anchors every cell edits -------------------------------------
const HIGH_CLAUSE = '— 8 are rated HIGH —';
const TAIL = 'Nothing in that list has been resolved yet.';

function copyRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph34-'));
  execFileSync('cp', ['-R', SRC + '/.', dir]);
  execFileSync('rm', ['-rf', path.join(dir, '.git')]);
  return dir;
}

// --- README cells ----------------------------------------------------------
// Each returns a mutated README string. `expect` documents what the PRISTINE
// (HEAD) implementation is predicted to do; the harness records the actual.
const CELLS = {
  // Control: untouched README.
  B0: r => r,

  // The cycle-32 H7 shape: a TRUE bound claim (8) followed by a second,
  // CONTRADICTORY bound claim (9) later in the same section.
  B1: r => r.replace(TAIL,
    'A later audit note records that 9 are rated HIGH overall. ' + TAIL),

  // MIRROR of B1: the FALSE claim first (9), the TRUE one (8) second.
  // This is the cell that disqualifies a "take the last match" fix -- such a
  // fix would bind 8, agree with the truth, and pass a self-contradicting
  // README silently, which is B1's defect wearing the opposite coat.
  B2: r => r.replace(HIGH_CLAUSE, '— 9 are rated HIGH —')
            .replace(TAIL, 'A later audit note records that 8 are rated HIGH overall. ' + TAIL),

  // Within-CLAUSE repetition: two bound claims with no dash between them.
  // "Every binding the section offers" has to mean every marker OCCURRENCE,
  // not merely one per dash-delimited clause.
  B3: r => r.replace(HIGH_CLAUSE, '— 8 are rated HIGH and 9 are rated HIGH —'),

  // Plain single FALSE claim. This is an existing kill and must stay one.
  B4: r => r.replace(HIGH_CLAUSE, '— 9 are rated HIGH —'),

  // Parse miss: no HIGH marker anywhere in the section. Must fail LOUD with
  // the "could not find" message, never pass.
  B5: r => r.replace(HIGH_CLAUSE, '— and the list is thorough —'),

  // The SAME defect on the sibling C1 (`entries`) extraction, which shares the
  // helper: TRUE 50 first, contradictory 51 second.
  B6: r => r.replace(TAIL,
    'A later note says the triage doc lists 51 entries in total. ' + TAIL),

  // C1 single-false control: must stay a kill.
  B7: r => r.replace('ranks all 50\nentries', 'ranks all 51\nentries'),
};

// --- arms ------------------------------------------------------------------
// An arm is a transform applied to test/readme-tags.test.js. HEAD = identity.
function armHEAD(t) { return t; }

function runCell(cellName, armName, armFn) {
  const dir = copyRepo();
  const readmePath = path.join(dir, README);
  const testPath = path.join(dir, TESTFILE);

  const before = fs.readFileSync(readmePath, 'utf8');
  const after = CELLS[cellName](before);
  if (cellName !== 'B0' && after === before) {
    throw new Error('cell ' + cellName + ' changed nothing -- anchor drift, refusing to report a verdict');
  }
  fs.writeFileSync(readmePath, after);

  const t0 = fs.readFileSync(testPath, 'utf8');
  const t1 = armFn(t0);
  if (armName !== 'HEAD' && t1 === t0) {
    throw new Error('arm ' + armName + ' changed nothing -- refusing to report a verdict');
  }
  fs.writeFileSync(testPath, t1);

  let out;
  try {
    out = execFileSync('node',
      ['--test', '--test-reporter=tap', 'test/args.test.js', 'test/cli.test.js',
       'test/corpus.test.js', 'test/readme-tags.test.js', 'test/select.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }

  const tests = /^# tests (\d+)$/m.exec(out);
  const pass = /^# pass (\d+)$/m.exec(out);
  const fail = /^# fail (\d+)$/m.exec(out);
  if (!tests || !pass || !fail) {
    execFileSync('rm', ['-rf', dir]);
    return { cell: cellName, arm: armName, verdict: 'UNPARSEABLE', raw: out.slice(-400) };
  }

  // Failing test names + the assertion message each carried.
  const failing = [];
  const lines = out.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^not ok \d+ - (.*)$/.exec(lines[i]);
    if (!m) continue;
    let msg = '';
    for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
      const mm = /^\s*error:\s*'?(.*?)'?\s*$/.exec(lines[j]);
      if (mm) { msg = mm[1]; break; }
      if (/^not ok |^ok /.test(lines[j])) break;
    }
    failing.push({ name: m[1].trim(), message: msg });
  }

  execFileSync('rm', ['-rf', dir]);
  return {
    cell: cellName, arm: armName,
    tests: +tests[1], pass: +pass[1], fail: +fail[1],
    verdict: +fail[1] === 0 ? 'GREEN' : 'RED',
    failing,
  };
}

// --- main ------------------------------------------------------------------
const arms = { HEAD: armHEAD };
const armName = process.argv[2] || 'HEAD';
const only = process.argv[3];
const armFn = arms[armName];
if (!armFn) { console.error('unknown arm ' + armName); process.exit(2); }

const cells = only ? [only] : Object.keys(CELLS);
const results = [];
for (const c of cells) {
  let r;
  try { r = runCell(c, armName, armFn); }
  catch (e) { r = { cell: c, arm: armName, verdict: 'HARNESS-ERROR', error: e.message }; }
  results.push(r);
  const head = [r.cell + ':' + r.arm, r.verdict,
    r.tests !== undefined ? r.pass + '/' + r.tests + ' fail=' + r.fail : (r.error || '')].join('  ');
  console.log(head);
  for (const f of (r.failing || [])) {
    console.log('      - ' + f.name);
    if (f.message) console.log('        msg: ' + f.message.slice(0, 200));
  }
}
fs.writeFileSync('/opt/targets/aphorism-cli/.swarm/runs/cycle-034-' + armName + '.json',
  JSON.stringify(results, null, 1));
