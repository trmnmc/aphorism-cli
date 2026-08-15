'use strict';
// Addendum to cycle-023-verify-T-017.js: the TRACKS.CORPUS probe, re-run with a
// NON-VACUITY control.
//
// v2's TRACKS check asserted `pass === 1` under --test-name-pattern=T-017 and got
// 4/4/0. The count was the harness's error, not the item's: node's name-pattern
// filter still emits a top-level TAP entry per FILE, so the denominator is 4 files
// that contain (or bound) a match, not 1 test. The substantive claim -- fail === 0
// -- held. But "0 failures under a name filter" is a PASS-shaped result and would
// look identical if the filter had selected nothing at all, so it is not evidence
// until the filter is shown to be live. That is what SELECTS-LIVE below proves.

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const TOKEN = 'T-017';
let pass = 0, fail = 0;
function record(ok, name, detail) {
  (ok ? pass++ : fail++);
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + name.padEnd(16) + ' ' + detail);
}

function mkTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c23-tracks-'));
  execFileSync('cp', ['-a', REPO + '/.', dir]);
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
  fs.rmSync(path.join(dir, '.swarm'), { recursive: true, force: true });
  return dir;
}
function runOnlyT017(dir) {
  const argv = ['--test', '--test-reporter=tap', '--test-name-pattern=' + TOKEN];
  for (const f of fs.readdirSync(path.join(dir, 'test')).filter(f => f.endsWith('.test.js'))) {
    argv.push(path.join('test', f));
  }
  const r = spawnSync(process.execPath, argv, { cwd: dir, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const num = (re) => { const m = out.match(re); return m === null ? null : parseInt(m[1], 10); };
  const failed = [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map(m => m[1].trim());
  return { tests: num(/^# tests (\d+)$/m), pass: num(/^# pass (\d+)$/m), fail: num(/^# fail (\d+)$/m), failed };
}
function sub(dir, rel, from, to) {
  const p = path.join(dir, rel);
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error('anchor missing in ' + rel);
  fs.writeFileSync(p, s.replace(from, to));
}
const LIT = '`<text> — <author>`';

// 1. Baseline under the same filter.
{
  const r = runOnlyT017(mkTree());
  record(r.fail === 0, 'ONLY.PRISTINE', `name-filtered pristine run: ${r.tests}/${r.pass}/${r.fail}`);
}
// 2. NON-VACUITY: the same filter must be able to FAIL. If the filter selected
//    nothing, this run would be green too.
{
  const d = mkTree();
  sub(d, 'README.md', LIT, '`<text> | <author>`');
  const r = runOnlyT017(d);
  record(r.fail === 1 && r.failed.some(n => n.includes(TOKEN)), 'ONLY.SELECTS-LIVE',
    `same filter, README literal mutated: ${r.tests}/${r.pass}/${r.fail} failing=${JSON.stringify(r.failed)}`);
}
// 3. TRACKS: a CONSISTENT corpus change -- the binary's output and the test's
//    expectation both derive from it -- must leave T-017 GREEN. A guard that had
//    frozen today's 50 lines as a transcript would fail here.
{
  const d = mkTree();
  const cp = path.join(d, 'src/corpus.js');
  const s = fs.readFileSync(cp, 'utf8');
  const m = s.match(/text: '([^']+)'/);
  fs.writeFileSync(cp, s.replace(m[0], "text: 'MUTATED CORPUS TEXT FOR THE C23 PROBE'"));
  const r = runOnlyT017(d);
  record(r.fail === 0, 'TRACKS.CORPUS',
    `corpus text changed, binary + expectation both follow: ${r.tests}/${r.pass}/${r.fail}`);
}
// 4. STALE half of the pair: change the corpus AND make the binary stop reflecting
//    it. The consistent change above must not be passing merely because the test
//    ignores content.
{
  const d = mkTree();
  const cp = path.join(d, 'src/corpus.js');
  const s = fs.readFileSync(cp, 'utf8');
  const m = s.match(/text: '([^']+)'/);
  fs.writeFileSync(cp, s.replace(m[0], "text: 'MUTATED CORPUS TEXT FOR THE C23 PROBE'"));
  sub(d, 'bin/aphorism.js', '`${e.text} — ${e.author}`', '`${e.text.toUpperCase()} — ${e.author}`');
  const r = runOnlyT017(d);
  record(r.fail === 1 && r.failed.some(n => n.includes(TOKEN)), 'TRACKS.STALE',
    `same corpus change + binary upper-cases the text: ${r.tests}/${r.pass}/${r.fail} failing=${JSON.stringify(r.failed)}`);
}

console.log(`\n  === ${pass} pass / ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
