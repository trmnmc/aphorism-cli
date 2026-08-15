#!/usr/bin/env node
'use strict';
// Cycle 24 PRE-DISPATCH BASELINE for T-019.
// Question: is the CURRENT suite (72 tests) blind to an entire band table
// disappearing from the README Tag vocabulary section?
// Measured, not inherited from cycle 21's 68-test measurement.
//
// Each mutation runs in its own whole-repo-minus-.git copy under os.tmpdir().
// Controls: PRISTINE (unmutated copy must be 72/72) and APPLIED (a mutation
// that silently fails to apply makes SURVIVED vacuous).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c24-base-'));

function copyRepo(label) {
  const dst = path.join(root, label);
  fs.mkdirSync(dst, { recursive: true });
  execSync(`tar -C ${SRC} --exclude=.git --exclude=.swarm -cf - . | tar -C ${dst} -xf -`);
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
  return { parsed: true, tests, pass, fail, names };
}

const results = [];
function record(id, desc, r, expect) {
  const verdict = !r.parsed ? 'UNPARSEABLE'
    : r.fail > 0 ? 'KILLED' : 'SURVIVED';
  const ok = verdict === expect;
  results.push({ id, desc, verdict, expect, ok, r });
  const line = r.parsed ? `tests ${r.tests} pass ${r.pass} fail ${r.fail}` : 'UNPARSEABLE';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${verdict} (expected ${expect})  ${line}`);
  if (r.parsed && r.names.length) {
    for (const n of r.names) console.log(`         failing: ${n}`);
  }
  if (!r.parsed) console.log(r.raw);
}

// ---- CONTROL: PRISTINE ----
{
  const d = copyRepo('pristine');
  const r = runSuite(d);
  record('CTRL-PRISTINE', 'unmutated whole-repo copy', r, 'SURVIVED');
  if (!(r.parsed && r.tests === 72)) {
    console.log(`         !! expected 72 tests on the pristine copy, got ${r.tests}`);
  }
}

// ---- B1: delete the entire "12 tags appear 2-4 times" band (heading + table) ----
{
  const d = copyRepo('b1');
  const p = path.join(d, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const lines = before.split('\n');
  const start = lines.findIndex((l) => /^12 tags appear 2–4 times:$/.test(l));
  if (start < 0) throw new Error('B1: band heading not found');
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  // also swallow the trailing blank line
  if (lines[end] === '') end++;
  const after = lines.slice(0, start).concat(lines.slice(end)).join('\n');
  fs.writeFileSync(p, after);
  const applied = after !== before
    && !/12 tags appear 2–4 times/.test(after)
    && !/\| `performance` \| 4 \|/.test(after)
    && /4 tags have a robust pool/.test(after);
  console.log(`APPLIED B1: ${applied} (removed ${end - start} lines)`);
  if (!applied) throw new Error('B1 mutation did not apply as intended');
  record('B1', 'entire 2-4 band table deleted (heading + 12 rows)', runSuite(d), 'SURVIVED');
}

// ---- B1b PAIRED CONTROL: wrong count inside that same band table ----
{
  const d = copyRepo('b1b');
  const p = path.join(d, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace('| `performance` | 4 |', '| `performance` | 9 |');
  fs.writeFileSync(p, after);
  console.log(`APPLIED B1b: ${after !== before}`);
  if (after === before) throw new Error('B1b mutation did not apply');
  record('B1b', 'one wrong count inside the SAME band table', runSuite(d), 'KILLED');
}

// ---- B2: delete the entire "4 tags have a robust pool (5+ entries)" band ----
{
  const d = copyRepo('b2');
  const p = path.join(d, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const lines = before.split('\n');
  const start = lines.findIndex((l) => /^4 tags have a robust pool \(5\+ entries\):$/.test(l));
  if (start < 0) throw new Error('B2: band heading not found');
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  if (lines[end] === '') end++;
  const after = lines.slice(0, start).concat(lines.slice(end)).join('\n');
  fs.writeFileSync(p, after);
  const applied = !/robust pool/.test(after) && !/\| `design` \| 13 \|/.test(after)
    && /12 tags appear 2–4 times/.test(after);
  console.log(`APPLIED B2: ${applied} (removed ${end - start} lines)`);
  if (!applied) throw new Error('B2 mutation did not apply as intended');
  record('B2', 'entire 5+ band table deleted (heading + 4 rows)', runSuite(d), 'SURVIVED');
}

// ---- B3: delete BOTH band tables ----
{
  const d = copyRepo('b3');
  const p = path.join(d, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  let lines = before.split('\n');
  for (const re of [/^12 tags appear 2–4 times:$/, /^4 tags have a robust pool \(5\+ entries\):$/]) {
    const start = lines.findIndex((l) => re.test(l));
    if (start < 0) throw new Error('B3: heading not found: ' + re);
    let end = start + 1;
    while (end < lines.length && lines[end].startsWith('|')) end++;
    if (lines[end] === '') end++;
    lines = lines.slice(0, start).concat(lines.slice(end));
  }
  const after = lines.join('\n');
  fs.writeFileSync(p, after);
  const applied = !/robust pool/.test(after) && !/2–4 times/.test(after)
    && /The remaining 21 tags appear exactly once/.test(after);
  console.log(`APPLIED B3: ${applied}`);
  if (!applied) throw new Error('B3 mutation did not apply as intended');
  record('B3', 'BOTH band tables deleted — README goes silent about all 16 multi-entry tags',
    runSuite(d), 'SURVIVED');
}

console.log('');
console.log(`root: ${root}`);
const bad = results.filter((r) => !r.ok);
console.log(`BASELINE: ${results.length - bad.length}/${results.length} as expected`);
process.exit(bad.length ? 1 : 0);
