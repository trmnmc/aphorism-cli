#!/usr/bin/env node
// Conductor's independent adjudication of the builder's ONE out-of-scope change:
// it deleted J-5's prose allowlist (RECOGNISED_TAG_COUNT_CLAIM_PATTERNS) and
// claimed that allowlist was a LIVE SILENT HOLE after Q-4 — i.e. it permitted a
// prose count that, once the three prose readers were retired, no guard verified.
//
// That is a claim, not a fact. Both arms are measured here against the same
// injected sentence: the UNFIXED baseline (worktree at 23eaf9b, allowlist still
// present, prose readers still live) and the FIXED tree.
//
// Usage: node cycle-002-j5-probe.mjs <tree-dir> <label>

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const target = process.argv[2];
const label = process.argv[3] || target;
const README = path.join(target, 'README.md');

// A FALSE count (the corpus has 12 distinct tags, not 9) stated in prose inside
// the Tag vocabulary section. If any guard reads this section's prose counts,
// this must turn the suite red. If the suite stays green, the sentence is
// unverified by anything — a silent hole.
const INJECTED = process.argv[4] || 'The corpus contains 9 distinct tags.';

const pristine = fs.readFileSync(README, 'utf8');
try {
  const at = pristine.indexOf('## Tag vocabulary');
  if (at === -1) throw new Error('no "## Tag vocabulary" heading');
  const eol = pristine.indexOf('\n', at);
  const mutated = pristine.slice(0, eol + 1) + '\n' + INJECTED + '\n' + pristine.slice(eol + 1);
  fs.writeFileSync(README, mutated);

  let verdict, detail = '';
  try {
    execFileSync(process.execPath, ['--test', '--test-reporter=tap', 'test/readme-tags.test.js'],
      { cwd: target, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    verdict = 'SILENT';
  } catch (err) {
    verdict = 'FIRES';
    const out = String(err.stdout || '') + String(err.stderr || '');
    const m = out.match(/^# fail (\d+)/m);
    const n = out.split('\n').filter((l) => /^not ok \d+ - /.test(l.trim()))
      .map((l) => l.trim().replace(/^not ok \d+ - /, ''));
    detail = (m ? 'fail=' + m[1] + ' ' : '') + (n[0] || '').slice(0, 100);
  }
  console.log(label.padEnd(22) + verdict.padEnd(8) + detail);
  console.log('  injected: ' + JSON.stringify(INJECTED) + '  (true count is 12)');
} finally {
  fs.writeFileSync(README, pristine);
  if (fs.readFileSync(README, 'utf8') !== pristine) {
    console.error('FATAL: README not restored in ' + target);
    process.exit(3);
  }
  console.log('  README restored byte-identical: yes');
}
