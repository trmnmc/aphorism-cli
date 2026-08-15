#!/usr/bin/env node
// Cycle 27 residual probe: attribute the A9 gate failure.
// A9 asserted that a wrong ROW COUNT under a reformatted heading fails and
// that the failing test is the band-contents assertion. It failed LOUD but
// named a DIFFERENT guard ("README tag counts must match corpus"). This probe
// asks the question that decides whether A9's red is about T-018 at all:
// does the identical mutation behave identically against git HEAD's parser
// (which has no blank-line tolerance) and with no reformat at all?
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
const H24 = '12 tags appear 2–4 times:\n| Tag | Count |';

function copyRepo(l) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'p27-' + l + '-'));
  const dest = path.join(d, 'repo');
  fs.cpSync(TARGET, dest, { recursive: true,
    filter: (s) => !s.includes('/.git/') && path.basename(s) !== '.git' });
  return dest;
}
function runSuite(repo) {
  const files = fs.readdirSync(path.join(repo, 'test'))
    .filter((f) => f.endsWith('.test.js')).map((f) => path.join('test', f));
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap', ...files],
      { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const n = (re) => { const r = out.match(re); return r ? parseInt(r[1], 10) : null; };
  const t = n(/^# tests (\d+)$/m), p = n(/^# pass (\d+)$/m), f = n(/^# fail (\d+)$/m);
  if (t === null) return { sig: 'UNPARSEABLE', names: [] };
  return { sig: `${t}/${p}/${f}`,
    names: [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((x) => x[1].trim()) };
}
const WRONG = (t) => t.replace('| `performance` | 4 |', '| `performance` | 7 |');
const REFMT = (t) => t.replace(H24, H24.replace('\n|', '\n\n|'));

function scenario(label, fn, revertHead) {
  const repo = copyRepo(label);
  const p = path.join(repo, 'README.md');
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
  if (revertHead) {
    fs.writeFileSync(path.join(repo, TESTFILE),
      execFileSync('git', ['show', 'HEAD:' + TESTFILE], { cwd: TARGET, encoding: 'utf8' }));
  }
  const r = runSuite(repo);
  console.log(`\n[${label}]${revertHead ? ' (HEAD parser)' : ' (fixed parser)'}\n  ${r.sig}`);
  for (const n of r.names) console.log(`  FAILING: ${n}`);
  return r;
}

console.log('=== A9 residual probe ===');
const p1 = scenario('wrongcount-only', WRONG, false);
const p2 = scenario('wrongcount+reformat', (t) => WRONG(REFMT(t)), false);
const p3 = scenario('wrongcount-only-HEAD', WRONG, true);
const p4 = scenario('wrongcount+reformat-HEAD', (t) => WRONG(REFMT(t)), true);

console.log('\n=== VERDICT INPUTS ===');
console.log(`fixed parser: no-reformat ${p1.sig} | reformat ${p2.sig}`);
console.log(`HEAD  parser: no-reformat ${p3.sig} | reformat ${p4.sig}`);
console.log(`same-under-fix (reformat is not what changed it): ${p1.sig === p2.sig &&
  JSON.stringify(p1.names.sort()) === JSON.stringify(p2.names.sort())}`);
console.log(`identical at HEAD without reformat (pre-existing behaviour): ${p1.sig === p3.sig &&
  JSON.stringify(p1.names.sort()) === JSON.stringify(p3.names.sort())}`);
