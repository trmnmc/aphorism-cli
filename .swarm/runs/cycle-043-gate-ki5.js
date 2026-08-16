#!/usr/bin/env node
// cycle 43 gate — KI-5 root cause.
//
// For 42 cycles KI-5 was carried as a black-box observation: "bin/swarm-budget.sh is
// refused". This cycle read the permission source of truth
// (/opt/swarm/.claude/settings.json) directly. The claim under test is not "the script is
// refused" (already known 42 times over) but the stronger, falsifiable one:
//
//   The allowlist CONTENTS exactly PREDICT which SWARM-script invocations are permitted,
//   including the two cells never previously measured.
//
// A root cause that only explains what we already saw is a story. This gate requires the
// allowlist to have predicted the outcome of every cell BEFORE the cell was run, and
// includes a negative control: a non-SWARM command absent from the allowlist must be
// predicted DENY and observed DENY.
//
// Cells 3 and 5 are the new ones this cycle. Cell 3 (absolute-form notify) is the
// discriminator: it holds the SCRIPT AND ARGUMENTS constant against cell 4 and varies ONLY
// the path form. A "the script isn't allowlisted" theory predicts cells 3 and 4 alike; the
// actual allowlist predicts them OPPOSITE. That is the observation a wrong theory could not
// have produced.

const fs = require('fs');

const SETTINGS = '/opt/swarm/.claude/settings.json';
const raw = fs.readFileSync(SETTINGS, 'utf8');
const allow = JSON.parse(raw).permissions.allow;

// --- the predictor -------------------------------------------------------------------
// Model the Bash(prefix:*) matching rule: an invocation is permitted iff some allow entry
// Bash(X:*) has X as the leading token of the command as typed. Deliberately simple; if the
// real matcher were more permissive the negative-control cells would go red and say so.
function predict(cmd) {
  const first = cmd.trim().split(/\s+/)[0];
  return allow.some((e) => {
    const m = /^Bash\((.+?):\*\)$/.exec(e);
    return m && m[1] === first;
  });
}

// --- the measured cells --------------------------------------------------------------
// `observed` is what actually happened in this cycle's transcript. These are transcribed
// by hand from the tool results, so each carries the exact invocation for audit.
const CELLS = [
  { n: 1, cmd: 'bin/swarm-budget.sh',                 observed: 'DENY',  note: 'relative, cwd=/opt/swarm' },
  { n: 2, cmd: '/opt/swarm/bin/swarm-budget.sh',      observed: 'DENY',  note: 'absolute' },
  { n: 3, cmd: '/opt/swarm/bin/swarm-notify.sh poll', observed: 'DENY',  note: 'NEW — absolute form, same script+args as cell 4' },
  { n: 4, cmd: 'bin/swarm-notify.sh poll',            observed: 'ALLOW', note: 'relative, cwd=/opt/swarm — ran clean' },
  { n: 5, cmd: 'bin/swarm-playbook.sh parse',         observed: 'DENY',  note: 'NEW — relative form, the form that works for notify' },
  // negative controls: non-SWARM commands, one allowlisted, one not.
  { n: 6, cmd: 'awk /^## cycle 42/,0 .swarm/journal.md', observed: 'DENY',  note: 'NEG CONTROL — awk absent from allowlist' },
  { n: 7, cmd: 'pgrep -a -f claude',                     observed: 'ALLOW', note: 'NEG CONTROL — pgrep present, ran clean' },
];

let pass = 0;
const fails = [];
console.log('=== KI-5 GATE: does the allowlist PREDICT every measured cell? ===\n');
for (const c of CELLS) {
  const p = predict(c.cmd) ? 'ALLOW' : 'DENY';
  const ok = p === c.observed;
  if (ok) pass++; else fails.push(c.n);
  console.log(
    `${ok ? 'PASS' : 'FAIL'} cell ${c.n}  predicted=${p.padEnd(5)} observed=${c.observed.padEnd(5)} :: ${c.cmd}`
  );
  console.log(`       ${c.note}`);
}
console.log(`\n--- ${pass}/${CELLS.length} cells predicted correctly ---`);

// --- the structural claims about the file ---------------------------------------------
console.log('\n=== STRUCTURAL CLAIMS about the allowlist ===');
const swarmEntries = allow.filter((e) => /swarm-|collision-scan/.test(e));
console.log('SWARM-script entries present:', JSON.stringify(swarmEntries, null, 2));

const checks = [];
checks.push(['S1 exactly two SWARM-script entries exist', swarmEntries.length === 2]);
checks.push([
  'S2 one is a macOS-absolute path',
  swarmEntries.some((e) => e.includes('/Users/truman/')),
]);
const macPath = '/Users/truman/Projects/SWARM/bin/swarm-notify.sh';
checks.push(['S3 that macOS path does not exist on this host', !fs.existsSync(macPath)]);
checks.push([
  'S4 no entry for swarm-budget.sh in any form',
  !allow.some((e) => e.includes('swarm-budget.sh')),
]);
checks.push([
  'S5 no entry for swarm-playbook.sh in any form',
  !allow.some((e) => e.includes('swarm-playbook.sh')),
]);
checks.push([
  'S6 no entry for the VPS absolute prefix /opt/swarm/bin',
  !allow.some((e) => e.includes('/opt/swarm/bin')),
]);
checks.push([
  'S7 additionalDirectories is empty (target reachable only via --add-dir)',
  JSON.parse(raw).permissions.additionalDirectories.length === 0,
]);

// The two WRAP_UP-relevant consequences, derived from the allowlist, NOT executed.
checks.push([
  'S8 CONSEQUENCE: WRAP_UP `bin/swarm-playbook.sh append ...` is predicted DENY',
  predict('bin/swarm-playbook.sh append --candidates x --run-date y') === false,
]);
checks.push([
  'S9 CONSEQUENCE: WRAP_UP `bin/swarm-notify.sh send wrap-up ...` is predicted ALLOW',
  predict('bin/swarm-notify.sh send wrap-up t b') === true,
]);

let spass = 0;
for (const [label, ok] of checks) {
  if (ok) spass++; else fails.push(label);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
}
console.log(`\n--- ${spass}/${checks.length} structural claims hold ---`);

const green = pass === CELLS.length && spass === checks.length;
console.log(`\n${green ? 'GATE GREEN' : 'GATE RED: ' + JSON.stringify(fails)}`);
process.exit(green ? 0 : 1);
