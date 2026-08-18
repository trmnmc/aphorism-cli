#!/usr/bin/env node
// cycle-040 ADDENDUM — close the one soft spot in the main probe.
//
// Main-probe cell A1 inserted "Of those, 3 HIGH entries name a primary source."
// That sentence's TRUTH depends on a fact about the triage doc's Signal column
// that this run has no way to settle, so calling A1 a FALSE rejection would
// have rested on an unverified premise. These cells remove the premise: each
// inserted sentence is true by ARITHMETIC from a figure the README already
// states AND that the suite independently derives from source (50 entries,
// 8 HIGH). If the guard fires on these, the rejection is false beyond dispute.
//
// A5/A6 are the paired FAILABLE controls in the same wording shape: identical
// sentence frame, a digit that makes the sentence FALSE. They must fire too --
// that is what proves the guard is not simply blind to this frame.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const README = path.join(REPO, 'README.md');
const PRISTINE = execFileSync('git', ['-C', REPO, 'show', 'HEAD:README.md'], { encoding: 'utf8', maxBuffer: 1 << 24 });

if (fs.readFileSync(README, 'utf8') !== PRISTINE) {
  console.error('ABORT: README.md differs from HEAD before the probe started.');
  process.exit(9);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const T_C1 = 'README Attribution section corpus-size claim must match corpus.length (C1)';
const T_C2 = 'README Attribution section HIGH-risk count must match the triage doc table (C2)';

function runSuite(pattern) {
  const args = ['--test', '--test-reporter=tap'];
  if (pattern) args.push('--test-name-pattern=' + pattern);
  args.push('test/args.test.js', 'test/cli.test.js', 'test/readme-tags.test.js', 'test/select.test.js');
  let out;
  try {
    out = execFileSync('node', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const mPass = out.match(/^# pass (\d+)$/m);
  const mFail = out.match(/^# fail (\d+)$/m);
  if (!mPass || !mFail) return { pass: null, fail: null, failed: [], unparseable: true };
  const failed = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^not ok \d+ - (.*)$/);
    if (m) failed.push(m[1].trim());
  }
  return { pass: parseInt(mPass[1], 10), fail: parseInt(mFail[1], 10), failed, unparseable: false };
}

const ANCHOR = 'would settle each one. Nothing in that list has been resolved yet.';
const insert = (sentence) => 'would settle each one. ' + sentence + ' Nothing in that list has been resolved yet.';

const cells = [
  { id: 'A3', truth: 'TRUE  (8 < 9, and the suite itself derives 8 from the triage doc)',
    sentence: 'Fewer than 9 are rated HIGH.', guard: T_C2, predict: 'FIRES = false rejection' },
  { id: 'A4', truth: 'TRUE  (50 < 51, and the suite itself derives 50 from corpus.length)',
    sentence: 'Fewer than 51 entries are listed.', guard: T_C1, predict: 'FIRES = false rejection' },
  { id: 'A5', truth: 'FALSE (8 is not < 7)  -- FAILABLE control, same frame',
    sentence: 'Fewer than 7 are rated HIGH.', guard: T_C2, predict: 'must FIRE' },
  { id: 'A6', truth: 'FALSE (50 is not < 49) -- FAILABLE control, same frame',
    sentence: 'Fewer than 49 entries are listed.', guard: T_C1, predict: 'must FIRE' },
];

console.log('=== cycle 040 addendum — arithmetically-true insertions into the Attribution section ===\n');
const base = runSuite(null);
console.log('PRISTINE full suite: pass=' + base.pass + ' fail=' + base.fail + '\n');

console.log('cell sentence                              truth   guard isolated       full   verdict');
console.log('---- ------------------------------------- ------- ----- -------------- ------ -------');
const results = [];
let restoreOk = true;
for (const c of cells) {
  fs.writeFileSync(README, PRISTINE.replace(ANCHOR, insert(c.sentence)));
  const iso = runSuite(esc(c.guard));
  const full = runSuite(null);
  fs.writeFileSync(README, PRISTINE);
  const ok = fs.readFileSync(README, 'utf8') === PRISTINE;
  if (!ok) restoreOk = false;
  const verdict = iso.unparseable ? 'UNPARSEABLE' : iso.fail > 0 ? 'FIRES' : 'SILENT';
  console.log(
    c.id.padEnd(4) + ' ' + ('"' + c.sentence + '"').padEnd(37) + ' ' +
    c.truth.slice(0, 5).padEnd(7) + ' ' + (c.guard === T_C1 ? 'C1' : 'C2').padEnd(5) + ' ' +
    ('pass=' + iso.pass + ' fail=' + iso.fail).padEnd(14) + ' ' +
    (full.pass + '/' + full.fail).padEnd(6) + ' ' + verdict
  );
  results.push({ ...c, iso, full, restored: ok });
}

console.log('\n--- truth basis + full-suite failing names ---');
for (const r of results) {
  console.log('  ' + r.id + '  ' + r.truth);
  console.log('      predicted: ' + r.predict);
  console.log('      full-suite fail=' + r.full.fail + (r.full.failed.length ? ':\n        ' + r.full.failed.join('\n        ') : ' (none)'));
}

const denomBad = results.filter(r => r.iso.unparseable || (r.iso.pass + r.iso.fail) < 1);
console.log('\n--- controls ---');
console.log('  DENOMINATOR (every isolated run executed >= 1 test): ' + (denomBad.length === 0 ? 'OK' : 'VACUOUS — no verdict valid'));
console.log('  PRISTINE baseline green: ' + (base.fail === 0 ? 'yes (' + base.pass + '/0)' : 'NO'));
console.log('  RESTORE byte-identical after every cell: ' + (restoreOk ? 'yes' : 'NO'));
console.log('  final on-disk README byte-identical to HEAD: ' + (fs.readFileSync(README, 'utf8') === PRISTINE ? 'yes' : 'NO'));

fs.writeFileSync(path.join(__dirname, 'cycle-040-addendum-raw.json'), JSON.stringify(results, null, 1));
process.exit(restoreOk && denomBad.length === 0 && base.fail === 0 ? 0 : 1);
