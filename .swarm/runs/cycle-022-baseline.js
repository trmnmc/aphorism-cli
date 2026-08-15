#!/usr/bin/env node
'use strict';
// Cycle 22 PRE-DISPATCH BASELINE for T-016.
// Measures whether the three README claims C1/C2/C6 are actually unprotected
// by the CURRENT suite, rather than inheriting cycle 19's survivor list.
// Every mutant runs in its own whole-repo-minus-.git copy under os.tmpdir().
// Parse failures are reported UNPARSEABLE, never allowed to fall through into
// a verdict (cycle-19 harness lesson).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';

function copyRepo(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c22-' + label + '-'));
  execFileSync('bash', ['-c',
    'cd ' + JSON.stringify(TARGET) + ' && tar --exclude=.git -cf - . | tar -xf - -C ' + JSON.stringify(dir)]);
  return dir;
}

function runTests(dir) {
  // node --test with the project's documented glob, forced to TAP so the
  // counters are machine-readable. A shell is needed for the glob.
  const r = spawnSync('bash', ['-c', 'node --test --test-reporter=tap test/*.test.js 2>&1'], {
    cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  const out = r.stdout || '';
  const m = {
    tests: /^# tests (\d+)$/m.exec(out),
    pass: /^# pass (\d+)$/m.exec(out),
    fail: /^# fail (\d+)$/m.exec(out),
  };
  if (!m.tests || !m.pass || !m.fail) {
    return { unparseable: true, raw: out.slice(0, 2000) };
  }
  const failingNames = [];
  const re = /^not ok \d+ - (.+)$/gm;
  let x;
  while ((x = re.exec(out)) !== null) failingNames.push(x[1].trim());
  return {
    unparseable: false,
    tests: +m.tests[1], pass: +m.pass[1], fail: +m.fail[1],
    failingNames,
  };
}

function mutate(dir, file, from, to) {
  const p = path.join(dir, file);
  const before = fs.readFileSync(p, 'utf8');
  if (!before.includes(from)) return { applied: false, reason: 'literal not found: ' + JSON.stringify(from) };
  const after = before.split(from).join(to);
  if (after === before) return { applied: false, reason: 'no-op replacement' };
  fs.writeFileSync(p, after);
  return { applied: true, occurrences: before.split(from).length - 1 };
}

const MUTANTS = [
  { id: 'C1', expect: 'SURVIVED', file: 'README.md',
    from: 'ranks all 50\nentries', to: 'ranks all 49\nentries',
    desc: 'Attribution section corpus-size figure 50 -> 49 (corpus.length is 50)' },
  { id: 'C2', expect: 'SURVIVED', file: 'README.md',
    from: '8 are rated HIGH', to: '9 are rated HIGH',
    desc: 'Attribution section HIGH-risk count 8 -> 9 (triage doc rates 8 HIGH)' },
  { id: 'C6', expect: 'SURVIVED', file: 'README.md',
    from: 'src/select.js      pure filtering', to: 'src/selektor.js    pure filtering',
    desc: 'Layout block names a path that does not exist on disk' },
  { id: 'C0', expect: 'KILLED', file: 'README.md',
    from: '37 distinct tags', to: '38 distinct tags',
    desc: 'CONTROL: a claim the suite provably DOES guard (proves pipeline + suite are live)' },
];

// ---- PRISTINE control -------------------------------------------------------
const results = [];
{
  const dir = copyRepo('pristine');
  const r = runTests(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.unparseable) {
    console.log('CTRL-PRISTINE  UNPARSEABLE — harness cannot read the reporter. ABORT.');
    console.log(r.raw);
    process.exit(3);
  }
  const ok = r.fail === 0 && r.tests === r.pass;
  console.log('CTRL-PRISTINE  ' + (ok ? 'OK' : 'BROKEN') +
    '  tests=' + r.tests + ' pass=' + r.pass + ' fail=' + r.fail);
  if (!ok) { console.log('baseline tree is not green — abort'); process.exit(3); }
  results.push({ id: 'CTRL-PRISTINE', tests: r.tests, pass: r.pass, fail: r.fail });
}

// ---- mutants ---------------------------------------------------------------
let disagreements = 0;
for (const m of MUTANTS) {
  const dir = copyRepo(m.id);
  const app = mutate(dir, m.file, m.from, m.to);
  if (!app.applied) {
    console.log(m.id.padEnd(6) + 'NOT-APPLIED  ' + app.reason);
    fs.rmSync(dir, { recursive: true, force: true });
    disagreements++;
    continue;
  }
  const r = runTests(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.unparseable) {
    console.log(m.id.padEnd(6) + 'UNPARSEABLE  (no verdict manufactured)');
    disagreements++;
    continue;
  }
  const verdict = r.fail === 0 ? 'SURVIVED' : 'KILLED';
  const agree = verdict === m.expect;
  if (!agree) disagreements++;
  console.log(
    m.id.padEnd(6) + verdict.padEnd(10) +
    'tests=' + r.tests + ' pass=' + r.pass + ' fail=' + r.fail +
    '  [expect ' + m.expect + (agree ? '' : '  <<< DISAGREES') + ']' +
    '  :: ' + m.desc +
    (r.failingNames.length ? '\n            failing: ' + r.failingNames.join(' | ') : '')
  );
}

console.log('\n=== disagreements with expectation: ' + disagreements + ' ===');
process.exit(disagreements === 0 ? 0 : 1);
