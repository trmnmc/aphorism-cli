#!/usr/bin/env node
// run #4 cycle 6 — gate for Q-4: "the notify helper is denied" is a MISDIAGNOSIS.
//
// Claims under test (all NEGATIVE claims the run accepted without evidence):
//   cycle 4 journal: "swarm-notify.sh poll was DENIED ... (denial #32)"
//   cycle 4 addendum: "swarm-notify.sh send is denied too (denial #33)"
//   cycle 4 addendum: "every push this run has claimed to emit since the allowlist gap
//                      opened has silently not been delivered"
//   cycle 5 journal: "swarm-notify.sh poll DENIED by the harness allowlist again (#34)"
//
// This gate does NOT test whether a denial EVENT occurred (it did — the harness refused).
// It tests the CAUSE those cycles attached to it: that the script is not allowlisted and
// its pushes are undelivered. Both are falsifiable from files that were on disk the whole
// time.
//
// Usage: node run4-cycle-006-gate.mjs [--only ID]

import { readFileSync } from 'node:fs';

const SETTINGS = '/opt/swarm/.claude/settings.json';
const NOTIFYLOG = '/opt/swarm/runs/notify.log';
const RUNFILE = '/opt/swarm/runs/current.json';

const only = (() => {
  const i = process.argv.indexOf('--only');
  return i === -1 ? null : process.argv[i + 1];
})();

// ---- inputs read ONCE, so every cell and control sees the same bytes ----------------
const settingsRaw = readFileSync(SETTINGS, 'utf8');
const allow = JSON.parse(settingsRaw).permissions.allow;
const logRaw = readFileSync(NOTIFYLOG, 'utf8');
const runStartedAt = JSON.parse(
  readFileSync('/opt/targets/aphorism-cli/.swarm/state.json', 'utf8'),
).run_started_at; // 2026-08-19T14:05:17Z

// Parse the notify log into records. Format: <iso> <verb> <topic-or-status> <rest>
// Deliberately structural (split on whitespace), not a prose regex — L-044.
function parseLog(text) {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      const parts = l.split(/\s+/);
      return { ts: parts[0], verb: parts[1], rest: parts.slice(2).join(' '), raw: l };
    });
}
const log = parseLog(logRaw);

// An entry counts as "during run #4" if its timestamp is at/after run_started_at.
const runStart = Date.parse(runStartedAt);
const during = (r) => Date.parse(r.ts.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')) >= runStart;

// ---- cells: lazy thunks. Eager evaluation is how the cycle-5 gate recursed forever ----
const cells = [];
const cell = (id, desc, fn) => cells.push({ id, desc, fn });

cell('A1', 'swarm-notify.sh IS allowlisted, absolute form', () => {
  const hit = allow.filter((a) => a.includes('swarm-notify.sh'));
  return {
    ok: hit.some((a) => a === 'Bash(/opt/swarm/bin/swarm-notify.sh:*)'),
    note: `${hit.length} entries: ${hit.join(' ')}`,
  };
});

cell('A2', 'swarm-playbook.sh is NOT allowlisted in ANY form (the REAL gap)', () => {
  const hit = allow.filter((a) => a.includes('swarm-playbook'));
  return { ok: hit.length === 0, note: `entries=${hit.length}` };
});

cell('A3', 'notify.log records >=1 SUCCESSFUL send DURING run #4', () => {
  const sends = log.filter((r) => r.verb === 'send' && during(r));
  const ok = sends.filter((r) => / ok\b/.test(r.rest));
  return {
    ok: ok.length >= 1,
    note: `${ok.length}/${sends.length} sends ok in-run; first=${ok[0]?.ts ?? 'none'}`,
  };
});

cell('A4', 'notify.log contains ZERO failure lines, all time', () => {
  const bad = log.filter((r) => !/ ok\b/.test(r.raw));
  return { ok: bad.length === 0, note: `${log.length} entries, ${bad.length} non-ok` };
});

cell('A5', 'the cycle 4-5 window is a SILENT GAP, not a failure record', () => {
  // If the helper had RUN and failed, there would be entries. There are none: the
  // refusal happened at the harness layer, above the script. This is what makes the
  // event real and the diagnosis wrong.
  const c4c5 = log.filter(
    (r) => r.ts > '2026-08-19T15:11:50' && r.ts < '2026-08-19T17:13:00',
  );
  return { ok: c4c5.length === 0, note: `entries in window = ${c4c5.length}` };
});

cell('A6', 'the owed cycle-5 phase-change push was DELIVERED this cycle', () => {
  const late = log.filter(
    (r) => r.verb === 'send' && r.ts > '2026-08-19T17:14:00' && /phase-change/.test(r.rest),
  );
  return { ok: late.length === 1 && / ok\b/.test(late[0].rest), note: late[0]?.raw ?? 'absent' };
});

// ---- controls: the cells that prove the cells above can fail --------------------------
// Run #4 cycle 5 shipped a control that went SILENT (its mutation was a no-op). Each
// control below therefore asserts on a MUTATED COPY and states the delta it applied.

cell('C1', 'CONTROL A1 can die: strip the entry, A1 must FAIL', () => {
  const mutated = allow.filter((a) => a !== 'Bash(/opt/swarm/bin/swarm-notify.sh:*)');
  const removed = allow.length - mutated.length;
  const wouldPass = mutated.some((a) => a === 'Bash(/opt/swarm/bin/swarm-notify.sh:*)');
  return { ok: removed === 1 && wouldPass === false, note: `removed=${removed}` };
});

cell('C2', 'CONTROL A3 can die: drop in-run sends, A3 must FAIL', () => {
  const mutated = log.filter((r) => !(r.verb === 'send' && during(r)));
  const removed = log.length - mutated.length;
  const wouldPass = mutated.filter((r) => r.verb === 'send' && during(r) && / ok\b/.test(r.rest)).length >= 1;
  return { ok: removed >= 1 && wouldPass === false, note: `removed=${removed} sends` };
});

cell('C3', 'CONTROL A4 can die: inject one failure line, A4 must FAIL', () => {
  const mutated = parseLog(logRaw + '\n2026-08-19T99:99:99+0000 send phase-change FAILED');
  const bad = mutated.filter((r) => !/ ok\b/.test(r.raw));
  return { ok: bad.length === 1, note: `injected 1, detected ${bad.length}` };
});

cell('C4', 'SILENCE CONTROL: a benign extra POLL must leave A3 and A4 GREEN', () => {
  // The failure mode C4 is guarding against is a check that dies on any edit at all.
  const mutated = parseLog(logRaw + '\n2026-08-19T17:20:00+0000 poll ok merged=0');
  const a3 = mutated.filter((r) => r.verb === 'send' && during(r) && / ok\b/.test(r.rest)).length >= 1;
  const a4 = mutated.filter((r) => !/ ok\b/.test(r.raw)).length === 0;
  return { ok: a3 && a4, note: `A3=${a3} A4=${a4} (both must be true)` };
});

cell('C5', 'SILENCE CONTROL: A2 must not fire on an unrelated allowlist entry', () => {
  const mutated = [...allow, 'Bash(/opt/swarm/bin/swarm-health.sh:*)'];
  const hit = mutated.filter((a) => a.includes('swarm-playbook'));
  return { ok: hit.length === 0, note: `playbook entries still ${hit.length}` };
});

// ---- run -----------------------------------------------------------------------------
let pass = 0,
  fail = 0;
for (const c of cells) {
  if (only && c.id !== only) continue;
  let r;
  try {
    r = c.fn();
  } catch (e) {
    r = { ok: false, note: `THREW: ${e.message}` };
  }
  // A cell that throws is a gate that cannot report — never silently a FAIL (cycle-4 C3).
  r.ok ? pass++ : fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${c.id.padEnd(3)} ${c.desc}\n       ${r.note}`);
}
console.log(`\n${pass} PASS / ${fail} FAIL of ${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
