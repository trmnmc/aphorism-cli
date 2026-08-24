#!/usr/bin/env node
// ADDENDUM to the cycle-4 W-7 gate: cell C1 only.
//
// WHY THIS FILE EXISTS. The original C1 in gate-c4-w7.mjs read:
//     const porcelain = sh('git', [...,'status','--porcelain']).stdout.trim();
//     ... l.slice(3).trim()
// `git status --porcelain` emits a two-character status column followed by a space, so
// the path starts at index 3. But .trim() had ALREADY eaten the leading space of the
// FIRST line, so that line's path was sliced one character short and C1 reported the
// modified file as "est/readme-tags.test.js". C1 FAILED on the conductor's parser, not
// on the builder's work. Recorded here rather than silently re-run: a gate that
// misreports must be as visible as a build that does. (Same defect shape as D-R8-9.)
//
// This addendum parses the porcelain format correctly (no pre-trim; XY + space + path,
// rename entries split on ' -> ') and additionally checks what the original cell did
// NOT: that no scratch tree from either builder survives into the commit.

import { spawnSync } from 'node:child_process';
const TARGET = '/opt/targets/aphorism-cli';
const GUARDED_FILE = 'test/readme-tags.test.js';

const sh = (a) => spawnSync('git', ['-C', TARGET, ...a], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

// NOTE: no .trim() on stdout. Split on \n, drop only the trailing empty element.
const raw = sh(['status', '--porcelain']).stdout;
const lines = raw.split('\n').filter((l) => l.length > 0);
const entries = lines.map((l) => ({
  xy: l.slice(0, 2),
  path: l.slice(3).split(' -> ').pop(),
}));

const modifiedTracked = entries.filter((e) => e.xy !== '??').map((e) => e.path);
const untracked = entries.filter((e) => e.xy === '??').map((e) => e.path);

// Untracked paths that are legitimate output of this wave vs. scratch that must not ship.
const EXPECTED_UNTRACKED = ['tools/run-all.mjs'];
const scratchSurvivors = untracked.filter((p) => /(^|\/)\.scratch/.test(p));
const unexpectedUntracked = untracked.filter((p) => !EXPECTED_UNTRACKED.includes(p));

const c1a = modifiedTracked.length === 1 && modifiedTracked[0] === GUARDED_FILE;
const c1b = scratchSurvivors.length === 0;
const c1c = unexpectedUntracked.length === 0;

console.log('raw porcelain lines, quoted exactly:');
for (const l of lines) console.log('  ' + JSON.stringify(l));
console.log('');
console.log('modified tracked files: ' + JSON.stringify(modifiedTracked));
console.log('untracked files:        ' + JSON.stringify(untracked));
console.log('');
console.log(`C1a exactly one tracked file modified, and it is ${GUARDED_FILE}: ${c1a}`);
console.log(`C1b no .scratch* tree survives into the commit:                  ${c1b} ${JSON.stringify(scratchSurvivors)}`);
console.log(`C1c no untracked path beyond the wave's declared output:         ${c1c} ${JSON.stringify(unexpectedUntracked)}`);
console.log('');
const pass = c1a && c1b && c1c;
console.log(`C1 (corrected): ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
