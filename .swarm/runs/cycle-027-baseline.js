#!/usr/bin/env node
// Cycle 27 PRE-DISPATCH BASELINE for T-018.
// Re-measures the defect against the CURRENT 73-test suite rather than
// inheriting cycle 20's figure (cycle-24 precedent). Authored by the
// conductor; the builder never sees this file.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';

function copyRepo(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c27-' + label + '-'));
  const dest = path.join(dir, 'repo');
  fs.cpSync(TARGET, dest, {
    recursive: true,
    filter: (src) => !src.includes('/.git/') && path.basename(src) !== '.git',
  });
  return dest;
}

function runSuite(repo) {
  const files = fs
    .readdirSync(path.join(repo, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => path.join('test', f));
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap', ...files], {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const m = (re) => {
    const r = out.match(re);
    return r ? parseInt(r[1], 10) : null;
  };
  const tests = m(/^# tests (\d+)$/m);
  const pass = m(/^# pass (\d+)$/m);
  const fail = m(/^# fail (\d+)$/m);
  if (tests === null || pass === null || fail === null) {
    return { parsed: false, out };
  }
  // Failing test names, from TAP "not ok N - <name>" lines.
  const names = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((x) => x[1].trim());
  return { parsed: true, tests, pass, fail, names, out };
}

const results = [];
function record(id, desc, r, note) {
  results.push({ id, desc, r, note });
  const head = r.parsed
    ? `tests ${r.tests} pass ${r.pass} fail ${r.fail}`
    : 'UNPARSEABLE';
  console.log(`\n[${id}] ${desc}\n    ${head}`);
  if (r.parsed && r.names.length) {
    for (const n of r.names) console.log(`    FAILING: ${n}`);
  }
  if (!r.parsed) console.log(r.out.slice(0, 1200));
  if (note) console.log(`    note: ${note}`);
}

// B0 -- PRISTINE control. An unmutated whole-repo copy must be fully green.
// If this fires, every verdict below is worthless (cycle-19 precedent).
{
  const repo = copyRepo('pristine');
  record('B0.PRISTINE', 'unmutated copy must be green', runSuite(repo),
    'control: a red pristine invalidates everything below');
}

// B1 -- the defect itself, at the 5+ heading.
{
  const repo = copyRepo('blank5plus');
  const p = path.join(repo, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  const before = t;
  t = t.replace('4 tags have a robust pool (5+ entries):\n| Tag | Count |',
                '4 tags have a robust pool (5+ entries):\n\n| Tag | Count |');
  if (t === before) throw new Error('B1 mutation did not apply');
  fs.writeFileSync(p, t);
  record('B1.DEFECT-5PLUS', 'blank line between the 5+ heading and its table (every claim still TRUE)',
    runSuite(repo), 'expected RED today; this is the false rejection T-018 exists to remove');
}

// B2 -- the same defect at the 2-4 heading.
{
  const repo = copyRepo('blank24');
  const p = path.join(repo, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  const before = t;
  t = t.replace('12 tags appear 2–4 times:\n| Tag | Count |',
                '12 tags appear 2–4 times:\n\n| Tag | Count |');
  if (t === before) throw new Error('B2 mutation did not apply');
  fs.writeFileSync(p, t);
  record('B2.DEFECT-2-4', 'blank line between the 2-4 heading and its table',
    runSuite(repo), 'expected RED today');
}

// B3 -- BOTH headings reformatted. Records whether the zero-band sanity
// assertion is what fires when no band parses at all (cycle-24 found the
// analogous all-or-nothing behaviour for T-019).
{
  const repo = copyRepo('blankboth');
  const p = path.join(repo, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace('4 tags have a robust pool (5+ entries):\n| Tag | Count |',
                '4 tags have a robust pool (5+ entries):\n\n| Tag | Count |');
  t = t.replace('12 tags appear 2–4 times:\n| Tag | Count |',
                '12 tags appear 2–4 times:\n\n| Tag | Count |');
  fs.writeFileSync(p, t);
  record('B3.DEFECT-BOTH', 'blank line before BOTH band tables', runSuite(repo),
    'records which assertion fires when zero bands parse');
}

// B4 -- ROW DELETION under a reformatted heading. This is the half that must
// STILL be killed after the fix; measured now so the after-state is comparable.
{
  const repo = copyRepo('blankrowdel');
  const p = path.join(repo, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace('4 tags have a robust pool (5+ entries):\n| Tag | Count |',
                '4 tags have a robust pool (5+ entries):\n\n| Tag | Count |');
  const before = t;
  t = t.replace('| `debugging` | 5 |\n', '');
  if (t === before) throw new Error('B4 row deletion did not apply');
  fs.writeFileSync(p, t);
  record('B4.REFORMAT+ROWDEL', 'blank line AND a real row deleted under that heading',
    runSuite(repo), 'must be RED both before and after the fix');
}

// B5 -- row deletion WITHOUT the reformat, for contrast.
{
  const repo = copyRepo('rowdel');
  const p = path.join(repo, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  const before = t;
  t = t.replace('| `debugging` | 5 |\n', '');
  if (t === before) throw new Error('B5 row deletion did not apply');
  fs.writeFileSync(p, t);
  record('B5.ROWDEL-ONLY', 'a real row deleted, heading adjacency untouched', runSuite(repo),
    'the guard working as intended today');
}

console.log('\n=== BASELINE SUMMARY (cycle 27, pre-dispatch) ===');
for (const { id, r } of results) {
  console.log(
    `${id.padEnd(22)} ${r.parsed ? `${r.tests}/${r.pass}/${r.fail}` : 'UNPARSEABLE'}` +
      (r.parsed && r.names.length ? `  <- ${r.names.join(' ; ')}` : '')
  );
}
