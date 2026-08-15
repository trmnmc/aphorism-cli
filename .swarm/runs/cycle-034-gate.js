#!/usr/bin/env node
// Cycle 34 conductor GATE for T-029. Authored at verification time, after the
// builder returned; the builder never saw it.
//
// Four ARMS:
//   HEAD    -- test/readme-tags.test.js as committed (the defect)
//   FIX     -- the working tree (the builder's change)
//   F_FIRST -- FIX with the binding set collapsed to its FIRST element
//   F_LAST  -- FIX with the binding set collapsed to its LAST element
//
// F_FIRST and F_LAST exist because T-029's acceptance DISQUALIFIES both
// positional designs. Building them from FIX (identical comparison machinery,
// only the positional collapse differs) turns that clause from an argument
// into a measurement: whatever cell each one goes silent on is the proof.
//
// Standing rules: TAP reporter forced (c19), unparseable never falls through to
// a verdict (c19), attribution by test NAME and assertion MESSAGE (c23/c28),
// scratch under os.tmpdir() only (KI-7).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
const README = 'README.md';
const TRIAGE = 'docs/corpus-attribution-triage.md';

const HIGH_CLAUSE = '— 8 are rated HIGH —';
const TAIL = 'Nothing in that list has been resolved yet.';

const HEAD_TEST = execFileSync('git', ['-C', SRC, 'show', 'HEAD:' + TESTFILE], { encoding: 'utf8' });

function rd(dir, f) { return fs.readFileSync(path.join(dir, f), 'utf8'); }
function wr(dir, f, s) { fs.writeFileSync(path.join(dir, f), s); }
function mustChange(dir, f, before, label) {
  if (rd(dir, f) === before) throw new Error(label + ': edit to ' + f + ' changed nothing -- anchor drift, refusing to report a verdict');
}

// --- cells: each mutates the temp repo -------------------------------------
const CELLS = {
  G0: () => {},                                                        // pristine control
  G1: d => mut(d, README, r => r.replace(TAIL, 'A later audit note records that 9 are rated HIGH overall. ' + TAIL), 'G1'),
  G2: d => mut(d, README, r => r.replace(HIGH_CLAUSE, '— 9 are rated HIGH —').replace(TAIL, 'A later audit note records that 8 are rated HIGH overall. ' + TAIL), 'G2'),
  G3: d => mut(d, README, r => r.replace(HIGH_CLAUSE, '— 8 are rated HIGH and 9 are rated HIGH —'), 'G3'),
  G4: d => mut(d, README, r => r.replace(HIGH_CLAUSE, '— 9 are rated HIGH —'), 'G4'),
  G5: d => mut(d, README, r => r.replace(HIGH_CLAUSE, '— and the list is thorough —'), 'G5'),
  G6: d => mut(d, README, r => r.replace(TAIL, 'A later note says the triage doc lists 51 entries in total. ' + TAIL), 'G6'),
  G7: d => mut(d, README, r => r.replace('ranks all 50\nentries', 'ranks all 51\nentries'), 'G7'),
  // Neither binding equals the truth (8): 9 then 10.
  G8: d => mut(d, README, r => r.replace(HIGH_CLAUSE, '— 9 are rated HIGH —').replace(TAIL, 'A later audit note records that 10 are rated HIGH overall. ' + TAIL), 'G8'),
  // The predicted NEW FALSE REJECTION: every claim TRUE, second occurrence is
  // about a different quantity.
  G9: d => mut(d, README, r => r.replace(TAIL, 'Of those, 3 HIGH entries name a primary source. ' + TAIL), 'G9'),
  // R2 consistent-change (c21/c22 method): move the real truth AND the README
  // together. A guard that hardcodes 8 fails here; a derived one stays green.
  G10: d => {
    mut(d, TRIAGE, t => t.replace('| MEDIUM |', '| HIGH |'), 'G10-triage');
    mut(d, README, r => r.replace(HIGH_CLAUSE, '— 9 are rated HIGH —'), 'G10-readme');
  },
  // Stale half of R2: truth moves, README does not.
  G11: d => mut(d, TRIAGE, t => t.replace('| MEDIUM |', '| HIGH |'), 'G11'),
  // ADDED AT VERIFICATION TIME (additive: no existing cell was altered), to
  // measure the builder's own volunteered uncertainty rather than file it as a
  // suspicion. A contradictory claim whose DIGIT sits on the far side of a dash
  // from its MARKER yields no binding under the clause-scoped window -- so the
  // section states 9 while only the true 8 is ever examined. If this is GREEN
  // the fix leaves a residual SILENT path of exactly the class T-029 exists to
  // close, which must be filed, not glossed.
  G12: d => mut(d, README, r => r.replace(TAIL, 'A later audit note records 9 — HIGH entries — in total. ' + TAIL), 'G12'),
};

function mut(dir, file, fn, label) {
  const before = rd(dir, file);
  wr(dir, file, fn(before));
  mustChange(dir, file, before, label);
}

// --- arms ------------------------------------------------------------------
const ARMS = {
  FIX: t => t,
  HEAD: () => HEAD_TEST,
  F_FIRST: t => collapse(t, 'bindings.slice(0, 1)'),
  F_LAST: t => collapse(t, 'bindings.slice(-1)'),
};

function collapse(t, expr) {
  const needle = '\n  return bindings;\n}';
  if (!t.includes(needle)) throw new Error('collapse anchor not found -- refusing to build a positional arm that may not be positional');
  return t.replace(needle, '\n  return ' + expr + ';\n}');
}

function runCell(cellName, armName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph34g-'));
  try {
    execFileSync('cp', ['-R', SRC + '/.', dir]);
    execFileSync('rm', ['-rf', path.join(dir, '.git')]);

    const t0 = rd(dir, TESTFILE);
    const t1 = ARMS[armName](t0);
    if (armName !== 'FIX' && t1 === t0) throw new Error('arm ' + armName + ' changed nothing');
    wr(dir, TESTFILE, t1);

    CELLS[cellName](dir);

    let out;
    try {
      out = execFileSync('node',
        ['--test', '--test-reporter=tap', 'test/args.test.js', 'test/cli.test.js',
         'test/corpus.test.js', 'test/readme-tags.test.js', 'test/select.test.js'],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }

    const tests = /^# tests (\d+)$/m.exec(out);
    const pass = /^# pass (\d+)$/m.exec(out);
    const fail = /^# fail (\d+)$/m.exec(out);
    if (!tests || !pass || !fail) return { cell: cellName, arm: armName, verdict: 'UNPARSEABLE', raw: out.slice(-400) };

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
    return { cell: cellName, arm: armName, tests: +tests[1], pass: +pass[1], fail: +fail[1],
             verdict: +fail[1] === 0 ? 'GREEN' : 'RED', failing };
  } finally {
    execFileSync('rm', ['-rf', dir]);
  }
}

const armNames = (process.argv[2] || 'HEAD,FIX,F_FIRST,F_LAST').split(',');
const cellNames = (process.argv[3] || Object.keys(CELLS).join(',')).split(',');
const results = [];
for (const arm of armNames) {
  for (const cell of cellNames) {
    let r;
    try { r = runCell(cell, arm); }
    catch (e) { r = { cell, arm, verdict: 'HARNESS-ERROR', error: e.message }; }
    results.push(r);
    console.log([ (cell + ':' + arm).padEnd(16), r.verdict.padEnd(6),
      r.tests !== undefined ? (r.pass + '/' + r.tests + ' fail=' + r.fail) : (r.error || '') ].join(' '));
    for (const f of (r.failing || [])) {
      console.log('        - ' + f.name);
      if (f.message) console.log('          msg: ' + f.message.slice(0, 260));
    }
  }
}
fs.writeFileSync(SRC + '/.swarm/runs/cycle-034-gate.json', JSON.stringify(results, null, 1));
