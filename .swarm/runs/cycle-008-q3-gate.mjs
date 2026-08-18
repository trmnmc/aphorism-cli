#!/usr/bin/env node
// Cycle-8 verification gate for Q-3 — authored by the CONDUCTOR before dispatch and kept
// OUTSIDE the target repo (hard rule 5 fence: builder agents receive target paths only,
// never SWARM paths), so the builder provably could not code to this check.
//
// Q-3 acceptance, restated as measurable clauses:
//   (a1) a broken stderr pipe does not alter the exit code the run had earned;
//   (a2) a broken stderr pipe produces no raw Node stack trace;
//   (b)  a NON-EPIPE stderr write failure does not silently succeed.
//   CONTROLS: open-stderr usage path still exits 2; no-match path still exits 1; normal
//   path exits 0 and still prints; stdout EPIPE behaviour (Q-1) unchanged; --json still
//   parses; full suite green.
//
// Exit 0 iff every clause passes.
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';

const TARGET = process.argv[2] || '/opt/targets/aphorism-cli';
process.chdir(TARGET);

let fails = 0;
const ok = (id, what, obs) => console.log(`PASS  ${id}  ${what}  (${obs})`);
const bad = (id, what, obs) => { fails++; console.log(`FAIL  ${id}  ${what}  (${obs})`); };

const head = execSync('git rev-parse --short HEAD').toString().trim();
console.log(`=== Q-3 GATE — ${new Date().toISOString()} — tree ${head} ===`);

// sh() runs a pipeline and returns the exit status of the FIRST element (PIPESTATUS[0]).
const sh = (cmd) =>
  spawnSync('bash', ['-c', `${cmd}; echo "PS=\${PIPESTATUS[0]}"`], { encoding: 'utf8' });
const ps = (r) => {
  const m = /PS=(\d+)/.exec(r.stdout || '');
  return m ? Number(m[1]) : null;
};

// ------------------------------------------------------------------ clause a1
// THE DISCRIMINATOR. Same command, same args; the ONLY thing that varies is whether the
// stderr reader stays open. "Ordinary argument handling" predicts the two are ALIKE;
// "unhandled stderr error" predicts them OPPOSITE. Post-fix they must be alike AND equal
// to 2 — the code the run earned — not alike at 1.
const openCode = ps(sh('node bin/aphorism.js --bogus-flag 2>&1 >/dev/null | cat >/dev/null'));
const shutCode = ps(sh('node bin/aphorism.js --bogus-flag 2>&1 >/dev/null | true'));
if (openCode === 2 && shutCode === 2)
  ok('a1', 'stderr-EPIPE preserves the earned exit code', `open=${openCode} shut=${shutCode}`);
else
  bad('a1', 'stderr-EPIPE preserves the earned exit code', `open=${openCode} shut=${shutCode} (want 2/2)`);

// ------------------------------------------------------------------ clause a2
// No raw Node stack trace when the stderr reader hangs up. Capture everything any
// surviving stream emits and look for frame markers.
const traceRun = spawnSync('bash',
  ['-c', 'node bin/aphorism.js --bogus-flag 2>&1 >/dev/null | head -0'],
  { encoding: 'utf8' });
const traceText = `${traceRun.stdout || ''}${traceRun.stderr || ''}`;
if (/^\s+at |Error: .*EPIPE|ERR_STREAM|Uncaught|throw er;/m.test(traceText))
  bad('a2', 'no raw Node stack trace on broken stderr',
      `saw: ${traceText.split('\n').slice(0, 3).join(' | ').slice(0, 160)}`);
else
  ok('a2', 'no raw Node stack trace on broken stderr', 'clean');

// ------------------------------------------------------------------- clause b
// A NON-EPIPE stderr write failure must not silently succeed. Hand the child a stderr fd
// opened O_RDONLY: writes to it fail EBADF — a genuine fault, not a reader hanging up.
// Exit 0 ("all fine") and exit 1 ("no aphorism matched") are both lies here.
const ro = fs.openSync('/dev/null', 'r');
const bRun = spawnSync(process.execPath, ['bin/aphorism.js', '--bogus-flag'],
  { stdio: ['ignore', 'ignore', ro] });
fs.closeSync(ro);
const bObs = `status=${bRun.status} signal=${bRun.signal}`;
if (bRun.status === 0 || bRun.status === 1)
  bad('b ', 'non-EPIPE stderr failure is not silently swallowed', `${bObs} — 0 and 1 both lie`);
else
  ok('b ', 'non-EPIPE stderr failure is not silently swallowed', bObs);

// ------------------------------------------------------------------ controls
const run = (args, opts = {}) =>
  spawnSync(process.execPath, ['bin/aphorism.js', ...args], { encoding: 'utf8', ...opts });

const c1 = run(['--bogus-flag']);
c1.status === 2 ? ok('c1', 'open-stderr usage path exits 2', c1.status)
                : bad('c1', 'open-stderr usage path exits 2', c1.status);

const c2 = run(['--author', 'no-such-person-xyz']);
c2.status === 1 ? ok('c2', 'no-match path exits 1', c2.status)
                : bad('c2', 'no-match path exits 1', c2.status);

const c3 = run(['--seed', '42']);
c3.status === 0 ? ok('c3', 'normal path exits 0', c3.status)
                : bad('c3', 'normal path exits 0', c3.status);
(c3.stdout || '').trim()
  ? ok('c4', 'normal path still prints an aphorism', `${(c3.stdout || '').split('\n')[0].slice(0, 46)}…`)
  : bad('c4', 'normal path still prints an aphorism', 'empty');

// stdout EPIPE (the Q-1 behaviour) must be UNCHANGED by this fix.
const c5 = ps(sh('node bin/aphorism.js --seed 42 | true'));
c5 === 0 ? ok('c5', 'stdout EPIPE still quiet, code preserved', c5)
         : bad('c5', 'stdout EPIPE still quiet, code preserved', c5);

const c6 = run(['--json', '--seed', '7']);
try { JSON.parse((c6.stdout || '').trim()); ok('c6', '--json still emits parseable JSON', 'ok'); }
catch { bad('c6', '--json still emits parseable JSON', 'unparseable'); }

// -------------------------------------------------------------------- suite
console.log('--- full suite ---');
const suite = spawnSync('bash', ['-c', 'node --test test/*.test.js 2>&1'], { encoding: 'utf8' });
console.log((suite.stdout || '').split('\n').slice(-10).join('\n').trim());
suite.status === 0 ? ok('s ', 'full suite green', 'exit 0')
                   : bad('s ', 'full suite green', `exit ${suite.status}`);

console.log(`=== FAILED CLAUSES: ${fails} ===`);
process.exit(fails > 0 ? 1 : 0);
