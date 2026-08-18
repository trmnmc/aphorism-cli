#!/usr/bin/env node
'use strict';
// cycle-007 SEALED verification gate for Q-1 (stdout write-error handling).
// Authored by the CONDUCTOR before dispatch; sealed by sha256 and the plaintext deleted
// for the whole dispatch window (KI-8 commit-reveal). Builders never saw this file.
//
//   node cycle-007-gate-Q1.js [target-root]
//
// Every cell prints as `CELL <id> <k=v ...>`. Verdicts are adjudicated by the conductor
// against the sealed baseline, not by this script — the script only measures.

const { execFileSync } = require('child_process');
const path = require('path');
const T = process.argv[2] || '/opt/targets/aphorism-cli';
const A = 'node bin/aphorism.js';

function sh(script) {
  // bash so PIPESTATUS is available; never throws — a non-zero rc is data, not an error.
  const r = require('child_process').spawnSync('/bin/bash', ['-c', script], {
    cwd: T, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
  });
  return { rc: r.status, out: r.stdout || '', err: r.stderr || '' };
}

function pipeCell(id, pipeline) {
  // aphorism's OWN exit status, not the pipeline's: ${PIPESTATUS[0]}
  const r = sh(`${pipeline} >/dev/null; exit \${PIPESTATUS[0]}`);
  const first = (r.err.split('\n')[0] || '').slice(0, 110);
  console.log(
    `CELL ${id} rc=${r.rc} errbytes=${Buffer.byteLength(r.err)} ` +
    `stack=${/\n\s+at |node:internal/.test(r.err) ? 'YES' : 'no'} err1=${JSON.stringify(first)}`
  );
}

console.log('=== A. CRASH TRIGGERS — acceptance (1): must end at errbytes=0, stack=no ===');
pipeCell('M1', `${A} --list | true`);
pipeCell('M2', `${A} | true`);
pipeCell('M3', `${A} --list | head -0`);
pipeCell('M4', `${A} --list | /nonexistent-cmd-xyz`);

console.log('=== B. CLEAN-PIPE CONTROLS — acceptance (3): must STAY errbytes=0 ===');
pipeCell('C1', `${A} --list | head -1`);
pipeCell('C2', `${A} --list | head -5`);
pipeCell('C3', `${A} --list | sed 1q`);
pipeCell('C4', `${A} --list | grep -q .`);
pipeCell('C5', `${A} | wc -l`);
pipeCell('C6', `${A} --list --json | head -2`);

console.log('=== C. NON-EPIPE WRITE FAILURE (/dev/full) — acceptance (2) ===');
{
  const r = sh(`${A} > /dev/full`);
  const e = r.err;
  console.log(`CELL F1 rc=${r.rc} errbytes=${Buffer.byteLength(e)}`);
  console.log(`CELL F1-text ${JSON.stringify(e.slice(0, 300))}`);
  console.log(`CELL F1-stack ${/\n\s+at |node:internal/.test(e) ? 'YES(bad)' : 'no(good)'}`);
  console.log(`CELL F1-lines ${e === '' ? 0 : e.replace(/\n$/, '').split('\n').length}`);
  console.log(`CELL F1-convention ${/^aphorism: /m.test(e) ? 'YES' : 'no'}`);
  console.log(`CELL F1-not-exit-1 ${r.rc !== 1 ? 'YES' : 'NO(fails acceptance 2)'}`);
  console.log(`CELL F1-nonzero ${r.rc !== 0 ? 'YES' : 'NO'}`);
}

console.log('=== D. EXIT-CODE + MESSAGE CONTROLS — 0/1/2 unchanged ===');
{
  const e0 = sh(`${A} >/dev/null 2>/dev/null`);
  console.log(`CELL E0 rc=${e0.rc} (expect 0)`);
  const e1 = sh(`${A} --author nobody-xyz-qqq >/dev/null`);
  console.log(`CELL E1 rc=${e1.rc} (expect 1) msg=${JSON.stringify(e1.err.trim())}`);
  const e2 = sh(`${A} --bogus-flag >/dev/null`);
  console.log(`CELL E2 rc=${e2.rc} (expect 2) msg=${JSON.stringify(e2.err.trim().slice(0, 90))}`);
  const eh = sh(`${A} --help`);
  console.log(`CELL E3-help rc=${eh.rc} outbytes=${Buffer.byteLength(eh.out)} errbytes=${Buffer.byteLength(eh.err)}`);
}

console.log('=== E. DISCRIMINATORS — a degenerate fix cannot produce these ===');
{
  // D3: silencing output would also "fix" the crash. head -1 must still yield a real line.
  const d3 = sh(`${A} --list 2>/dev/null | head -1 | wc -c`);
  console.log(`CELL D3-head1-bytes ${d3.out.trim()}`);
  // D4/D5: stdout must be byte-identical to the sealed pre-dispatch reading.
  const d4 = sh(`${A} --seed 42 2>/dev/null | sha256sum | cut -c1-16`);
  console.log(`CELL D4-seed42-sha ${d4.out.trim()}`);
  const d5 = sh(`${A} --list 2>/dev/null | sha256sum | cut -c1-16`);
  console.log(`CELL D5-list-sha ${d5.out.trim()}`);
  const d7 = sh(`${A} --list 2>/dev/null | wc -l`);
  console.log(`CELL D7-list-lines ${d7.out.trim()}`);
  // D8: an exit-code-only fix (process.exit on EPIPE) leaves the banner on stderr; the
  //     banner text itself is what M1..M4 count, so D8 records WHICH mechanism was used.
  const d8 = sh(`${A} --list | true 2>&1; echo "rc=\${PIPESTATUS[0]}"`);
  console.log(`CELL D8-mechanism ${JSON.stringify(d8.out.trim().slice(-40))}`);
  // D9: process.exitCode must survive — a fix that hard-exits early can truncate stdout
  //     on a SLOW consumer. Large output through a slow reader must still be complete.
  const d9 = sh(`${A} --list 2>/dev/null | { sleep 0.2; cat; } | wc -l`);
  console.log(`CELL D9-slow-consumer-lines ${d9.out.trim()}`);
}

console.log('=== F. SUITE (conductor-run test_cmd) ===');
{
  const s = sh('node --test test/*.test.js');
  const tail = (s.out + s.err).trim().split('\n').slice(-11).join('\n');
  console.log(tail.split('\n').map((l) => `SUITE ${l}`).join('\n'));
  console.log(`CELL SUITE-rc ${s.rc}`);
}
