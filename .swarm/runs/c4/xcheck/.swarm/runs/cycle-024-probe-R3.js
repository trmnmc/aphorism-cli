#!/usr/bin/env node
'use strict';
// Cycle 24 follow-up probe: is R3.GREEN's failure attributable to T-019, or
// is it a PRE-EXISTING heading-parser fragility?
// The gate showed the reworded lead-ins fail exactly ONE test — the
// pre-existing "README band table headings must state the correct count of
// tags in their band" — and NOT the new T-019 test. This probe measures the
// same rewording against HEAD's test file, which has no T-019 test at all.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c24-r3-'));

function copyRepo(label, useHeadTests) {
  const dst = path.join(root, label);
  fs.mkdirSync(dst, { recursive: true });
  execSync(`tar -C ${SRC} --exclude=.git --exclude=.swarm -cf - . | tar -C ${dst} -xf -`);
  if (useHeadTests) {
    const head = execSync(`git -C ${SRC} show HEAD:test/readme-tags.test.js`, { encoding: 'buffer' });
    fs.writeFileSync(path.join(dst, 'test', 'readme-tags.test.js'), head);
  }
  return dst;
}

function runSuite(dir) {
  let out;
  try {
    out = execFileSync('bash', ['-c', 'node --test --test-reporter=tap test/*.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const names = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^not ok \d+ - (.*)$/);
    if (m) names.push(m[1].trim());
  }
  return { tests: g(/^# tests (\d+)$/m), pass: g(/^# pass (\d+)$/m), fail: g(/^# fail (\d+)$/m), names };
}

function reword(t, which) {
  if (which === 'both' || which === 'plus') {
    t = t.replace('4 tags have a robust pool (5+ entries):', 'Well-populated: 4 tags carry 5+ entries each.');
  }
  if (which === 'both' || which === 'range') {
    t = t.replace('12 tags appear 2–4 times:', 'Mid-range: 12 tags land in the 2–4 band.');
  }
  return t;
}

const rows = [];
for (const useHead of [true, false]) {
  for (const which of ['plus', 'range', 'both']) {
    const label = `${useHead ? 'HEAD' : 'NEW'}-${which}`;
    const d = copyRepo(label, useHead);
    const p = path.join(d, 'README.md');
    const before = fs.readFileSync(p, 'utf8');
    const after = reword(before, which);
    if (after === before) throw new Error('rewording did not apply: ' + label);
    fs.writeFileSync(p, after);
    const r = runSuite(d);
    rows.push({ label, ...r });
    console.log(`${label.padEnd(12)} tests ${r.tests} pass ${r.pass} fail ${r.fail}`);
    for (const nm of r.names) console.log(`             failing: ${nm}`);
  }
}

console.log('');
const headBoth = rows.find((r) => r.label === 'HEAD-both');
const newBoth = rows.find((r) => r.label === 'NEW-both');
const t019Named = newBoth.names.some((x) => x.includes('no band table may be deleted wholesale'));
console.log(`VERDICT: HEAD (no T-019 test) fails ${headBoth.fail} test(s) on the same rewording.`);
console.log(`         T-019 test among the NEW failures: ${t019Named}`);
console.log(headBoth.fail > 0 && !t019Named
  ? '         => PRE-EXISTING fragility. NOT attributable to T-019.'
  : '         => attributable to T-019 — this would be an item defect.');
console.log(`root: ${root}`);
