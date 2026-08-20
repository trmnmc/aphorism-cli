// cycle-006 SEALED VERIFICATION GATE — review-fix FINDING 2
//
// Held OUTSIDE the target repo for the whole dispatch window (the run #3
// cycle-14 practice): hard rule 5 gives workflow agents target paths only and
// never SWARM paths, so a gate under SWARM/runs/ is STRUCTURALLY unreachable
// to the fixer rather than merely forbidden to it by a prompt line.
//
// WHAT IS BEING VERIFIED — the acceptance clause, restated independently:
//   (a) an AMBIGUOUS section (more than one backtick `git diff <hex>..<ref> --
//       <paths>` command) must FAIL loudly, not silently pick one;
//   (b) an unreachable cited base must SKIP only on a genuinely SHALLOW
//       checkout; on a full clone it must FAIL;
//   (c) everything that worked before still works: pristine PASSes, a real
//       stale citation FAILs, a real depth-1 clone SKIPs;
//   (d) blast radius of one file, suite still green.
//
// The gate does NOT read the fixer's diff or its notes. Every arm is rebuilt
// from scratch against the live working tree.
//
// DISCRIMINATING BASELINE: run this BEFORE the fix exists. Cells B3, B4, B5 and
// B8 MUST be RED at baseline — they encode the defect. A baseline in which they
// pass is a gate measuring nothing, and this repo has shipped exactly that
// mistake before (a cell that passed vacuously because the world never handed
// it data).
//
// Usage: node cycle-006-gate-F2.mjs [--baseline]

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/opt/targets/aphorism-cli';
const SCRATCH = path.join(REPO, '.scratch-c006-gate');
const GUARD = 'test/node-support-citation.test.js';
const HEADING = '### Node support';
const BASELINE = process.argv.includes('--baseline');

const cells = [];
function cell(id, expected, actual, describe, note) {
  const ok = expected === actual;
  cells.push({ id, expected, actual, ok, describe, note });
}

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 5e7 });
}

// Build a full-history clone, then overlay the LIVE WORKING TREE copies of the
// two files that matter. `git clone` would otherwise give us committed HEAD and
// silently test the OLD guard — the exact "measured something other than what
// its name claims" species this repo has filed repeatedly.
function makeArm(shallow = false) {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
  const dir = path.join(SCRATCH, 'arm');
  if (shallow) {
    sh('git', ['clone', '--quiet', '--depth', '1', 'file://' + REPO, dir], SCRATCH);
  } else {
    sh('git', ['clone', '--quiet', REPO, dir], SCRATCH);
  }
  for (const f of ['README.md', GUARD]) {
    fs.copyFileSync(path.join(REPO, f), path.join(dir, f));
  }
  return dir;
}

function runGuard(dir) {
  const r = spawnSync('node', ['--test', '--test-reporter=tap', GUARD], {
    cwd: dir, encoding: 'utf8', maxBuffer: 5e7,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const line = out.split('\n').find((l) => /^(ok|not ok) 1 /.test(l)) || '';
  if (/^not ok 1 /.test(line)) return 'FAIL';
  if (/# SKIP/i.test(line)) return 'SKIP';
  if (/^ok 1 /.test(line)) return 'PASS';
  return 'UNKNOWN';
}

const rd = (d) => fs.readFileSync(path.join(d, 'README.md'), 'utf8');
const wr = (d, t) => fs.writeFileSync(path.join(d, 'README.md'), t);

function makeStale(text, base) {
  const out = text.replace(
    /`git diff ([0-9a-fA-F]+)\.\.HEAD -- src bin test \.github`/,
    '`git diff ' + base + '..HEAD -- src bin test .github`');
  if (out === text) throw new Error('citation not found');
  return out;
}
function before(text, s) {
  const i = text.indexOf(HEADING);
  return text.slice(0, i + HEADING.length) + '\n\n' + s + text.slice(i + HEADING.length);
}
function after(text, s) {
  const m = text.match(/`git diff [0-9a-fA-F]+\.\.HEAD -- src bin test \.github`/);
  const cut = text.indexOf('\n', m.index + m[0].length);
  return text.slice(0, cut) + '\n\n' + s + text.slice(cut);
}

const HEAD = sh('git', ['rev-parse', '--short', 'HEAD'], REPO).trim();
const STALE = '81b0958';
const DECOY_OK = '(Note: nothing here runs `git diff ' + HEAD + '..HEAD -- src bin test .github`.)\n';
const DECOY_BAD = '(Historical note: an earlier revision cited `git diff decade5..HEAD -- src bin`.)\n';
const BENIGN = 'This section is checked by a standing guard rather than by anyone remembering to look.\n';

// ------------------------------------------------------------------- cells

let d;

d = makeArm();
cell('B1', 'PASS', runGuard(d), 'pristine full clone, untouched citation',
  'REGRESSION FLOOR: the fix must not cost the behaviour that already worked');

d = makeArm(); wr(d, makeStale(rd(d), STALE));
cell('B2', 'FAIL', runGuard(d), 'genuinely stale citation, no decoy',
  'REGRESSION FLOOR: the guard must still catch the thing it exists to catch');

d = makeArm(); wr(d, before(makeStale(rd(d), STALE), DECOY_OK));
cell('B3', 'FAIL', runGuard(d), 'stale citation + empty-diff decoy BEFORE it',
  'MUST BE RED AT BASELINE — this is the false-PASS. Pre-fix the decoy is parsed and the stale citation reads green');

d = makeArm(); wr(d, before(rd(d), DECOY_BAD));
cell('B4', 'FAIL', runGuard(d), 'correct citation + unreachable-base decoy BEFORE it, FULL clone',
  'MUST BE RED AT BASELINE — this is the false-SKIP: green, never ran, and blaming a shallow clone that does not exist');

d = makeArm(); wr(d, makeStale(rd(d), 'decade5'));
cell('B5', 'FAIL', runGuard(d), 'the ONLY citation names an unreachable base, FULL clone',
  'MUST BE RED AT BASELINE — on a full clone an unresolvable base is a bogus citation, not an environment limit');

d = makeArm(true);
cell('B6', 'SKIP', runGuard(d), 'genuine `git clone --depth 1` shallow checkout',
  'MUST-NOT-OVERREACH: this is the CI case. README states making it fail would redden CI for the wrong reason, so the fix must not buy B4/B5 by breaking this');

d = makeArm(); wr(d, before(rd(d), BENIGN));
cell('B7', 'PASS', runGuard(d), 'benign sentence (no git-diff token) inserted before the citation',
  'MUST-NOT-OVERREACH: the fix must reject AMBIGUITY, not any edit to the section');

d = makeArm(); wr(d, after(rd(d), DECOY_OK));
cell('B8', 'FAIL', runGuard(d), 'correct citation + a second git-diff command AFTER it',
  'MUST BE RED AT BASELINE — ambiguity is position-independent; pre-fix first-match-wins reads this as green');

fs.rmSync(SCRATCH, { recursive: true, force: true });

// Blast radius + suite, measured against the live tree.
const changed = sh('git', ['status', '--porcelain'], REPO)
  .split('\n').map((l) => l.slice(3).trim()).filter(Boolean)
  .filter((f) => !f.startsWith('.swarm/'));
cell('B9', 'true', String(changed.length <= 1 && (changed.length === 0 || changed[0] === GUARD)),
  'outside .swarm/, the only changed tracked path is ' + GUARD + ' (saw: ' + (changed.join(', ') || 'none') + ')',
  'BLAST RADIUS: a fix that edits README.md to suit itself would be editing the document to satisfy the test');

let suite = 'UNKNOWN';
try {
  const out = sh('bash', ['-c', 'node --test test/*.test.js'], REPO);
  const t = (out.match(/[#ℹ]\s*tests (\d+)/) || [])[1];
  const p = (out.match(/[#ℹ]\s*pass (\d+)/) || [])[1];
  const f = (out.match(/[#ℹ]\s*fail (\d+)/) || [])[1];
  suite = t && f === '0' && Number(t) >= 120 && p === t ? 'GREEN' : 'tests=' + t + ' pass=' + p + ' fail=' + f;
} catch (e) {
  const out = ((e.stdout || '') + (e.stderr || '')).toString();
  const t = (out.match(/[#ℹ]\s*tests (\d+)/) || [])[1];
  const p = (out.match(/[#ℹ]\s*pass (\d+)/) || [])[1];
  const f = (out.match(/[#ℹ]\s*fail (\d+)/) || [])[1];
  suite = 'tests=' + t + ' pass=' + p + ' fail=' + f;
}
cell('B10', 'GREEN', suite, 'full suite on the live tree, >=120 tests, 0 fail, 0 non-skip losses',
  'the fix must not be bought by breaking or quieting the rest of the suite');

// ------------------------------------------------------------------ report

const mustBeRedAtBaseline = ['B3', 'B4', 'B5', 'B8'];
console.log('cycle-6 gate — FINDING 2 (guard steerable by a decoy citation)   ' +
  (BASELINE ? '[PRE-DISPATCH BASELINE]' : '[POST-FIX SCORING]'));
console.log('');
for (const c of cells) {
  console.log('  ' + (c.ok ? 'PASS' : 'FAIL') + ' ' + c.id +
    '  expected ' + c.expected + ' / actual ' + c.actual);
  console.log('       ' + c.describe);
  console.log('       ' + c.note);
}
const passed = cells.filter((c) => c.ok).length;
console.log('');
console.log('  ' + passed + ' PASS / ' + (cells.length - passed) + ' FAIL');

if (BASELINE) {
  const wrong = mustBeRedAtBaseline.filter((id) => cells.find((c) => c.id === id).ok);
  console.log('');
  console.log('  BASELINE DISCRIMINATION CHECK — ' + mustBeRedAtBaseline.join(', ') +
    ' must be RED before the fix exists.');
  console.log('  ' + (wrong.length === 0
    ? 'SOUND: all four are red, so each encodes the defect rather than asserting nothing.'
    : 'UNSOUND: ' + wrong.join(', ') + ' passed at baseline — those cells measure nothing. Fix the gate before dispatching.'));
  process.exit(wrong.length === 0 ? 0 : 2);
}
process.exit(passed === cells.length ? 0 : 1);
