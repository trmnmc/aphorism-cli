#!/usr/bin/env node
// run4 cycle 4 — R-1 ATTRIBUTION control for run4-cycle-004-r1probe.mjs.
//
// The probe showed the full suite goes RED on D4a/D4b while the R-1 target guard stays
// SILENT. A kill you cannot attribute is not evidence: this control proves the kill comes
// from the two named count guards and nothing else, by skipping exactly those two and
// re-running the same arms. If the mutation then SURVIVES, the attribution is established.
//
// Reuses the arms the probe already built under /opt/swarm/runs/r1probe.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCRATCH = '/opt/swarm/runs/r1probe';
// Matches 'README must correctly describe single-entry tag count' and
// 'README opening sentence must state correct multi-entry and single-entry tag counts'.
// Deliberately does NOT match the R-1 target guard ('single-entry marker') nor
// 'README must list all single-entry tags'.
const SKIP = 'single-entry tag counts?';

function run(dir, { skip } = {}) {
  const args = ['--test', '--test-reporter=tap'];
  if (skip) args.push(`--test-skip-pattern=${SKIP}`);
  args.push('test/args.test.js', 'test/cli.test.js', 'test/pipe.test.js',
            'test/readme-tags.test.js', 'test/select.test.js');
  let out = '', code = 0;
  try {
    out = execFileSync('node', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe', timeout: 180000 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); code = e.status ?? -1; }
  const n = (k) => { const r = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')); return r ? +r[1] : null; };
  const failures = [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1].trim())
    .filter((x) => !/^test\/.*\.test\.js$/.test(x));
  return { code, green: code === 0, tests: n('tests'), pass: n('pass'), fail: n('fail'), skipped: n('skipped'), failures };
}

const arms = ['A_baseline', 'B_d4a', 'C_d4b'];
const res = {};
for (const a of arms) {
  const dir = path.join(SCRATCH, a);
  if (!fs.existsSync(dir)) { console.error(`arm ${a} missing — run the probe first`); process.exit(70); }
  res[a] = { unskipped: run(dir), skipped: run(dir, { skip: true }) };
}

console.log('=== R-1 ATTRIBUTION CONTROL ===\n');
for (const a of arms) {
  const u = res[a].unskipped, s = res[a].skipped;
  console.log(a);
  console.log(`   all tests        : ${u.green ? 'GREEN' : 'RED  '} pass=${u.pass} fail=${u.fail}`);
  console.log(`   2 counters skipped: ${s.green ? 'GREEN' : 'RED  '} pass=${s.pass} fail=${s.fail} skipped=${s.skipped}`);
  for (const f of s.failures) console.log(`                     - ${f}`);
  console.log('');
}

const cells = [
  ['G1  skip-pattern actually skips exactly 2 tests on the baseline', res.A_baseline.skipped.skipped === 2],
  ['G2  CONTROL baseline stays GREEN with the two skipped (no collateral)', res.A_baseline.skipped.green],
  ['G3  D4a SURVIVES once the two counters are skipped (kill attributed)', res.B_d4a.skipped.green],
  ['G4  D4b SURVIVES once the two counters are skipped (kill attributed)', res.C_d4b.skipped.green],
  ['G5  the same arms are still RED with those two present', !res.B_d4a.unskipped.green && !res.C_d4b.unskipped.green],
];
let p = 0;
for (const [l, ok] of cells) { console.log(`${ok ? 'PASS' : 'FAIL'} ${l}`); if (ok) p++; }
console.log(`${p} PASS / ${cells.length - p} FAIL of ${cells.length}`);
