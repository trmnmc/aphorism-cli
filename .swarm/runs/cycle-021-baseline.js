#!/usr/bin/env node
// Cycle 21 PRE-DISPATCH baseline: measure which Tag-vocabulary numeric claims can
// go false against the CURRENT suite (HEAD). Conductor-authored; the builder never
// sees this file. Whole-repo-minus-.git scratch copies per L-030.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const SCRATCH = path.join(TARGET, '.swarm', 'scratch-c21-baseline');

function freshCopy(name) {
  const dest = path.join(SCRATCH, name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  execFileSync('bash', ['-c',
    'cd ' + JSON.stringify(TARGET) + ' && tar --exclude=.git --exclude=.swarm -cf - . | tar -xf - -C ' + JSON.stringify(dest)]);
  return dest;
}

// node --test with the TAP reporter so parsing is deterministic (cycle-19 lesson:
// the default spec reporter silently defeated regex parsing and manufactured verdicts).
function runSuite(dir) {
  const r = spawnSync('bash', ['-c', 'cd ' + JSON.stringify(dir) + ' && node --test --test-reporter=tap test/*.test.js 2>&1'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const tests = /^# tests (\d+)$/m.exec(out);
  const pass = /^# pass (\d+)$/m.exec(out);
  const fail = /^# fail (\d+)$/m.exec(out);
  if (!tests || !pass || !fail) return { parsed: false, raw: out.slice(-2000) };
  return { parsed: true, tests: +tests[1], pass: +pass[1], fail: +fail[1] };
}

// Each mutation makes a TRUE README claim FALSE without touching anything else.
const MUTATIONS = [
  { id: 'A9',  desc: 'line 55: "16 tags appear on 2 or more entries" -> 15',
    from: '16 tags appear on 2 or more entries', to: '15 tags appear on 2 or more entries' },
  { id: 'V6',  desc: 'line 55: "the remaining 21 appear on exactly one entry" -> 22',
    from: 'the remaining 21 appear on exactly one entry', to: 'the remaining 22 appear on exactly one entry' },
  { id: 'A10', desc: 'line 57: "4 tags have a robust pool (5+ entries)" -> 6',
    from: '4 tags have a robust pool (5+ entries)', to: '6 tags have a robust pool (5+ entries)' },
  { id: 'A11', desc: 'line 65: "12 tags appear 2–4 times" -> 11',
    from: '12 tags appear 2–4 times', to: '11 tags appear 2–4 times' },
  // Control: the ALREADY-GUARDED phrasing of the same single-entry number.
  { id: 'V6b', desc: 'CONTROL line 81: "The remaining 21 tags appear exactly once" -> 22 (expected KILLED)',
    from: 'The remaining 21 tags appear exactly once', to: 'The remaining 22 tags appear exactly once' },
  // Control: the already-guarded distinct-tag total.
  { id: 'C0',  desc: 'CONTROL line 55: "37 distinct tags" -> 38 (expected KILLED)',
    from: 'contains 37 distinct tags', to: 'contains 38 distinct tags' },
];

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

say('CYCLE 21 PRE-DISPATCH BASELINE — blindness of HEAD to Tag-vocabulary numeric claims');
say('target: ' + TARGET);
say('');

// PRISTINE control first (cycle-19 lesson: an unmutated copy must report the real baseline,
// or every downstream verdict is manufactured).
const pris = freshCopy('pristine');
const pr = runSuite(pris);
say('CTRL-PRISTINE  parsed=' + pr.parsed + '  tests=' + pr.tests + ' pass=' + pr.pass + ' fail=' + pr.fail);
if (!pr.parsed) { say('UNPARSEABLE — aborting, no verdicts may be derived'); fs.writeFileSync(path.join(TARGET, '.swarm/runs/cycle-021-baseline.txt'), lines.join('\n')); process.exit(2); }
const BASE = pr.tests;
say('');

for (const m of MUTATIONS) {
  const dir = freshCopy(m.id);
  const rp = path.join(dir, 'README.md');
  const before = fs.readFileSync(rp, 'utf8');
  if (!before.includes(m.from)) { say(m.id + '  NOT-APPLIED (anchor absent) — no verdict'); continue; }
  const after = before.replace(m.from, m.to);
  if (after === before) { say(m.id + '  NOT-APPLIED (no change) — no verdict'); continue; }
  fs.writeFileSync(rp, after);
  const r = runSuite(dir);
  if (!r.parsed) { say(m.id + '  UNPARSEABLE — no verdict'); continue; }
  const verdict = r.fail > 0 ? 'KILLED' : 'SURVIVED';
  say(m.id.padEnd(5) + ' ' + verdict.padEnd(9) + ' tests=' + r.tests + ' pass=' + r.pass + ' fail=' + r.fail + '  :: ' + m.desc);
}

say('');
say('baseline test count: ' + BASE);
fs.writeFileSync(path.join(TARGET, '.swarm/runs/cycle-021-baseline.txt'), lines.join('\n') + '\n');
fs.rmSync(SCRATCH, { recursive: true, force: true });
say('scratch removed: ' + !fs.existsSync(SCRATCH));
