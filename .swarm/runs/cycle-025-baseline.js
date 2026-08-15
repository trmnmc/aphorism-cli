#!/usr/bin/env node
'use strict';
// Cycle 25 PRE-DISPATCH BASELINE for T-022.
//
// Question: against the CURRENT suite (73 tests, post-T-019), does a band
// heading reworded so a descriptive phrase PRECEDES the "N tags" count --
// every stated number still TRUE, every table row untouched -- get falsely
// rejected? And is the guard still LIVE on a genuinely wrong count?
//
// Re-MEASURED at the current suite rather than inherited from cycle 24's
// R3.GREEN reading (which was taken at 73 tests but as a side effect of a
// different item's gate, and only for one of the two headings).
//
// Each mutation runs in its own whole-repo-minus-.git copy under os.tmpdir().
// Controls: PRISTINE (unmutated copy must be 73/73) and APPLIED (a mutation
// that silently fails to apply makes any verdict vacuous).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c25-base-'));

const H5 = '4 tags have a robust pool (5+ entries):';
const H24 = '12 tags appear 2–4 times:';   // en dash, as shipped

function copyRepo(label) {
  const dst = path.join(root, label);
  fs.mkdirSync(dst, { recursive: true });
  execSync('tar -C ' + SRC + ' --exclude=.git --exclude=.swarm -cf - . | tar -C ' + dst + ' -xf -');
  return dst;
}

function runSuite(dir) {
  let out;
  try {
    out = execFileSync('bash', ['-c', 'node --test --test-reporter=tap test/*.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const tests = g(/^# tests (\d+)$/m);
  const pass = g(/^# pass (\d+)$/m);
  const fail = g(/^# fail (\d+)$/m);
  if (tests === null || pass === null || fail === null) {
    return { parsed: false, raw: out.slice(-800) };
  }
  const names = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^not ok \d+ - (.*)$/);
    if (m) names.push(m[1].trim());
  }
  // capture the assertion text of the heading-count failure, so we can tell a
  // PARSE-FAILURE rejection apart from a COUNT-MISMATCH rejection
  let why = '';
  if (/could not parse a leading "N tags" count/.test(out)) why = 'PARSE-FAILURE';
  else if (/but the corpus has \d+ tags with count in/.test(out)) why = 'COUNT-MISMATCH';
  return { parsed: true, tests, pass, fail, names, why };
}

const results = [];
function record(id, desc, r, expect, applied) {
  const verdict = !r.parsed ? 'UNPARSEABLE' : r.fail > 0 ? 'KILLED' : 'SURVIVED';
  const ok = verdict === expect && applied !== false;
  results.push({ id, desc, verdict, expect, ok, r });
  const line = r.parsed ? 'tests ' + r.tests + ' pass ' + r.pass + ' fail ' + r.fail : 'UNPARSEABLE';
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + id + '  ' + verdict + ' (expected ' + expect + ')  ' + line +
    (r.why ? '  [' + r.why + ']' : '') + (applied === false ? '  MUTATION DID NOT APPLY' : ''));
  console.log('        ' + desc);
  if (r.parsed && r.names.length) {
    for (const n of r.names) console.log('         failing: ' + n);
  }
}

function mutate(label, desc, from, to, expect) {
  const dir = copyRepo(label);
  const p = path.join(dir, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const applied = before.includes(from);
  if (applied) fs.writeFileSync(p, before.replace(from, to));
  record(label, desc, runSuite(dir), expect, applied);
}

// ---- controls -------------------------------------------------------------
record('CTRL-PRISTINE', 'unmutated copy of HEAD', runSuite(copyRepo('pristine')), 'SURVIVED', true);

// ---- the suspected false rejections (acceptance clause, GREEN half) --------
mutate('B1', 'lead-in before count, 5+ heading; every number still TRUE, rows untouched',
  H5, 'Well-populated: 4 tags carry 5+ entries each.', 'SURVIVED');
mutate('B2', 'lead-in before count, 2-4 heading; every number still TRUE, rows untouched',
  H24, 'Mid-range: 12 tags land in the 2-4 band.', 'SURVIVED');

// ---- the guard must stay LIVE (acceptance clause, RED half) ---------------
mutate('B3', 'WRONG count, heading format UNCHANGED (guard must already catch this)',
  H5, '7 tags have a robust pool (5+ entries):', 'KILLED');
mutate('B4', 'WRONG count UNDER a reworded heading (the case the fix must still catch)',
  H5, 'Well-populated: 7 tags carry 5+ entries each.', 'KILLED');
mutate('B5', 'WRONG count under a reworded 2-4 heading',
  H24, 'Mid-range: 9 tags land in the 2-4 band.', 'KILLED');

console.log('');
console.log('root: ' + root);
const bad = results.filter(r => !r.ok);
console.log('SUMMARY: ' + (results.length - bad.length) + '/' + results.length + ' readings matched expectation');
for (const b of bad) console.log('  MISMATCH ' + b.id + ': got ' + b.verdict + ', expected ' + b.expect);
