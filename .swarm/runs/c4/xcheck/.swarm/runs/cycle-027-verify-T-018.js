#!/usr/bin/env node
// Cycle 27 CONDUCTOR GATE for T-018.
// Authored at verification time. The builder never saw this file and could
// not have coded to it. Trust nothing in the builder's report; every claim
// below is re-measured from the real tree and from git HEAD.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';

const H5 = '4 tags have a robust pool (5+ entries):\n| Tag | Count |';
const H24 = '12 tags appear 2–4 times:\n| Tag | Count |';

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd: cwd || TARGET, encoding: 'utf8' });
}

function copyRepo(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g27-' + label + '-'));
  const dest = path.join(dir, 'repo');
  fs.cpSync(TARGET, dest, {
    recursive: true,
    filter: (src) => !src.includes('/.git/') && path.basename(src) !== '.git',
  });
  return dest;
}

// Replace the copy's test file with git HEAD's version -- the pre-fix parser.
// This is how attribution is done when the test COUNT does not change
// (cycle-25 method): --test-skip-pattern has nothing to filter.
function revertTestFileToHead(repo) {
  const head = sh('git', ['show', 'HEAD:' + TESTFILE]);
  fs.writeFileSync(path.join(repo, TESTFILE), head);
}

function runSuite(repo) {
  const files = fs.readdirSync(path.join(repo, 'test'))
    .filter((f) => f.endsWith('.test.js')).map((f) => path.join('test', f));
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap', ...files],
      { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const num = (re) => { const r = out.match(re); return r ? parseInt(r[1], 10) : null; };
  const tests = num(/^# tests (\d+)$/m), pass = num(/^# pass (\d+)$/m), fail = num(/^# fail (\d+)$/m);
  if (tests === null || pass === null || fail === null) return { parsed: false, out };
  const names = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((x) => x[1].trim());
  return { parsed: true, tests, pass, fail, names, sig: `${tests}/${pass}/${fail}`, out };
}

function edit(repo, fn) {
  const p = path.join(repo, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) throw new Error('MUTATION-APPLIED control: edit was a no-op');
  fs.writeFileSync(p, after);
}

let pass = 0, failn = 0;
const rows = [];
function check(id, desc, ok, detail) {
  if (ok) pass++; else failn++;
  rows.push({ id, ok, desc, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(20)} ${desc}`);
  if (detail) console.log(`        ${detail}`);
}

// ---------------------------------------------------------------- controls
{
  const r = runSuite(copyRepo('pristine'));
  check('C1.PRISTINE', 'unmutated copy of the WORKING tree is green',
    r.parsed && r.sig === '73/73/0', `observed ${r.parsed ? r.sig : 'UNPARSEABLE'}`);
}
{
  // The harness must be capable of producing a RED, or every green below is
  // uninformative. A wrong stated count is an unambiguous defect.
  const repo = copyRepo('negctl');
  edit(repo, (t) => t.replace('4 tags have a robust pool (5+ entries):',
                              '9 tags have a robust pool (5+ entries):'));
  const r = runSuite(repo);
  check('C2.NEGATIVE', 'harness can produce a RED (wrong stated band count)',
    r.parsed && r.fail > 0, `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}
{
  // Prove the HEAD-reversion mechanism itself works: HEAD's test file on an
  // unmutated README must still be green. If this were red, every A8-family
  // attribution below would be measuring the reversion, not the fix.
  const repo = copyRepo('headctl');
  revertTestFileToHead(repo);
  const r = runSuite(repo);
  check('C3.HEAD-BASE', "git HEAD's test file on an unmutated README is green",
    r.parsed && r.sig === '73/73/0', `observed ${r.parsed ? r.sig : 'UNPARSEABLE'}`);
}

// ------------------------------------------------- acceptance: GREEN half
const greenCases = [
  ['A1.BLANK-5PLUS', 'blank line before the 5+ table', (t) => t.replace(H5, H5.replace('\n|', '\n\n|'))],
  ['A2.BLANK-2-4', 'blank line before the 2-4 table', (t) => t.replace(H24, H24.replace('\n|', '\n\n|'))],
  ['A3.BLANK-BOTH', 'blank line before BOTH tables',
    (t) => t.replace(H5, H5.replace('\n|', '\n\n|')).replace(H24, H24.replace('\n|', '\n\n|'))],
  // Cases 4-6 are ones the builder explicitly reported as NOT executed.
  ['A4.BLANK-x3', 'THREE blank lines before the 5+ table', (t) => t.replace(H5, H5.replace('\n|', '\n\n\n\n|'))],
  ['A5.WS-ONLY', 'a whitespace-only line (2 spaces) before the 5+ table',
    (t) => t.replace(H5, H5.replace('\n|', '\n  \n|'))],
  ['A6.TABS', 'a tab-only line before the 2-4 table', (t) => t.replace(H24, H24.replace('\n|', '\n\t\n|'))],
];
for (const [id, desc, fn] of greenCases) {
  const repo = copyRepo(id.toLowerCase().replace(/[^a-z0-9]/g, ''));
  edit(repo, fn);
  const r = runSuite(repo);
  check(id, desc + ' -> suite GREEN', r.parsed && r.sig === '73/73/0',
    `observed ${r.parsed ? r.sig : 'UNPARSEABLE'}` + (r.parsed && r.names.length ? ` <- ${r.names.join(' ; ')}` : ''));
}

// ------------------------------- attribution for the GREEN half (cycle-25)
for (const [id, desc, fn] of greenCases.slice(0, 3)) {
  const repo = copyRepo('head-' + id.toLowerCase().replace(/[^a-z0-9]/g, ''));
  edit(repo, fn);
  revertTestFileToHead(repo);
  const r = runSuite(repo);
  check(id.replace(/^A(\d)/, 'A$1b') + '.ATTRIB',
    `${desc} is REJECTED by HEAD's parser (so the fix is what changed it)`,
    r.parsed && r.fail > 0, `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}

// --------------------------------------------------- acceptance: RED half
// THE DECISIVE CHECK. The baseline (.swarm/runs/cycle-027-baseline.txt, B4)
// measured that TODAY a reformat + row deletion fails with the IDENTICAL
// signature as a reformat alone: 73/72/1 naming only the T-019 union test.
// The deleted row is MASKED -- the whole band is invisible, so the guard is
// not detecting the deletion, it is detecting the parse failure. A fix that
// merely made the reformat green while leaving detection broken would still
// satisfy the acceptance clause as literally written. It must not.
// The requirement is therefore: under a reformatted heading, a row deletion
// must produce the SAME signature as a row deletion with no reformat at all.
const BAND_CONTENTS = 'every band table in README Tag vocabulary contains exactly the corpus tags whose count fits that band';
let refSig = null, refNames = null;
{
  const repo = copyRepo('rowdel-plain');
  edit(repo, (t) => t.replace('| `debugging` | 5 |\n', ''));
  const r = runSuite(repo);
  refSig = r.sig; refNames = r.names.slice().sort();
  check('A7.ROWDEL-PLAIN', 'row deletion with NO reformat still fails (reference signature)',
    r.parsed && r.fail > 0 && r.names.includes(BAND_CONTENTS),
    `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}
{
  const repo = copyRepo('rowdel-reformat');
  edit(repo, (t) => t.replace(H5, H5.replace('\n|', '\n\n|')).replace('| `debugging` | 5 |\n', ''));
  const r = runSuite(repo);
  const sameSig = r.parsed && r.sig === refSig;
  const sameNames = r.parsed && JSON.stringify(r.names.slice().sort()) === JSON.stringify(refNames);
  check('A8.ROWDEL-REFORMAT', 'row deletion UNDER a reformatted heading fails IDENTICALLY to A7',
    sameSig && sameNames && r.names.includes(BAND_CONTENTS),
    `observed ${r.sig} <- ${r.names.join(' ; ')} | reference ${refSig} <- ${refNames.join(' ; ')}`);
}
{
  // Same question for the other band, and for a row MOVED rather than deleted
  // (a row whose count is edited so it no longer fits its band).
  const repo = copyRepo('rowmove-reformat');
  edit(repo, (t) => t.replace(H24, H24.replace('\n|', '\n\n|'))
                     .replace('| `performance` | 4 |', '| `performance` | 7 |'));
  const r = runSuite(repo);
  check('A9.WRONGCOUNT-REFORMAT', 'a wrong row count under a reformatted 2-4 heading still fails LOUD',
    r.parsed && r.fail > 0 && r.names.includes(BAND_CONTENTS),
    `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}
{
  // Wrong STATED band count under a reformatted heading -- the T-022 guard
  // must still bite through the new blank-line tolerance.
  const repo = copyRepo('statedcount-reformat');
  edit(repo, (t) => t.replace(H5, H5.replace('\n|', '\n\n|'))
                     .replace('4 tags have a robust pool', '6 tags have a robust pool'));
  const r = runSuite(repo);
  check('A10.STATEDCOUNT', 'a wrong STATED count under a reformatted heading still fails LOUD',
    r.parsed && r.fail > 0, `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}

// ------------------------------------------- constraint 6: mis-attachment
{
  // The builder reported this scenario as reasoned-but-NOT-executed.
  // A prose line carrying a band-shaped digit token, then blank lines, then
  // the real heading and its table. The table must attach to the REAL
  // heading, not to the decoy. If it mis-attached, the decoy's bounds would
  // be checked against the 2-4 table's rows and the suite would go red.
  const repo = copyRepo('decoy');
  edit(repo, (t) => t.replace('12 tags appear 2–4 times:',
    'Tags below are listed 2–4 per row in some other document.\n\n12 tags appear 2–4 times:'));
  const r = runSuite(repo);
  check('A11.DECOY-HEADING', 'a decoy line with a band token + blank lines does not steal the table',
    r.parsed && r.sig === '73/73/0', `observed ${r.parsed ? r.sig : 'UNPARSEABLE'}`);
}
{
  // A heading followed by blank lines and then NON-table prose must not
  // scan onward to find a later table.
  const repo = copyRepo('nontable');
  edit(repo, (t) => t.replace(H5, '4 tags have a robust pool (5+ entries):\n\nSee the table below.\n\n| Tag | Count |'));
  const r = runSuite(repo);
  check('A12.NONTABLE-GAP', 'heading + blank + PROSE + blank + table does NOT parse as a band (fails loud, not silent)',
    r.parsed && r.fail > 0, `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}
{
  // Zero-band sanity must still be reachable: gut the section's tables
  // entirely and the guard must fail, not pass vacuously.
  const repo = copyRepo('notables');
  edit(repo, (t) => t.replace(/\| Tag \| Count \|/g, '| Label | Number |'));
  const r = runSuite(repo);
  check('A13.ZERO-BAND', 'the zero-band sanity assertion is still reachable',
    r.parsed && r.fail > 0, `observed ${r.sig} <- ${r.names.join(' ; ')}`);
}

// --------------------------------------------------------------- scope
{
  const changed = sh('git', ['diff', '--name-only', 'HEAD']).trim().split('\n').filter(Boolean);
  check('S1.SCOPE', 'exactly one tracked file modified, and it is the test file',
    changed.length === 1 && changed[0] === TESTFILE, `git diff --name-only HEAD = ${JSON.stringify(changed)}`);
}
{
  const readmeHead = sh('git', ['show', 'HEAD:README.md']);
  const readmeNow = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8');
  check('S2.README', 'README.md is byte-identical to HEAD', readmeHead === readmeNow,
    `HEAD ${readmeHead.length} B vs working ${readmeNow.length} B`);
}
{
  const prod = ['src/corpus.js', 'src/select.js', 'src/args.js', 'bin/aphorism.js'];
  const diffs = prod.filter((f) => sh('git', ['show', 'HEAD:' + f]) !== fs.readFileSync(path.join(TARGET, f), 'utf8'));
  check('S3.PRODUCT', 'no product file touched', diffs.length === 0, `differing: ${JSON.stringify(diffs)}`);
}
{
  const before = sh('git', ['show', 'HEAD:' + TESTFILE]);
  const now = fs.readFileSync(path.join(TARGET, TESTFILE), 'utf8');
  check('S4.NOT-A-NOOP', 'the test file actually changed', before !== now,
    `HEAD ${before.length} B vs working ${now.length} B`);
}
{
  // No assertion may have been deleted to open the gate.
  const before = sh('git', ['show', 'HEAD:' + TESTFILE]);
  const now = fs.readFileSync(path.join(TARGET, TESTFILE), 'utf8');
  const count = (s, re) => (s.match(re) || []).length;
  const okTests = count(now, /^test\(/gm) >= count(before, /^test\(/gm);
  const okAsserts = count(now, /\bassert\(/g) >= count(before, /\bassert\(/g);
  const noSkip = !/\.skip\(|\bt\.skip\b|todo:\s*true/.test(now);
  check('S5.NO-WEAKENING', 'no test or assert removed, no skip introduced',
    okTests && okAsserts && noSkip,
    `tests ${count(before, /^test\(/gm)}->${count(now, /^test\(/gm)}, ` +
    `asserts ${count(before, /\bassert\(/g)}->${count(now, /\bassert\(/g)}, skip=${!noSkip}`);
}
{
  // KI-7 standing control.
  check('S6.SCRATCH', 'no .swarm/scratch directory left behind',
    !fs.existsSync(path.join(TARGET, '.swarm', 'scratch')), 'checked /opt/targets/aphorism-cli/.swarm/scratch');
}

console.log(`\n=== GATE SUMMARY: ${pass} pass / ${failn} fail (of ${pass + failn}) ===`);
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}`);
