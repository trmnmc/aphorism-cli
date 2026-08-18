#!/usr/bin/env node
// cycle 45 — step-3 backlog hygiene, THE EDIT.
//
// The transformation makes exactly TWO claims, each measured in cycle-045-pre.js,
// and is otherwise STABLE — existing relative order and ties are preserved. Stability
// is deliberate: it keeps the pass from smuggling in a re-ranking by conductor taste
// under cover of a repair. Every number that moves, moves because one of these two
// measured facts says it must.
//
//   CLAIM 1 (from P3/P4): a live item whose files_hint touches shipped product ranks
//           above a live item whose files_hint is test-only. The classifier reads a
//           field earlier cycles wrote, so it cannot have been shaped to this answer.
//   CLAIM 2 (from P9): within the test-only group, T-024 — the instrument all three
//           S-effort todos name as their unblocker — ranks above the three it unblocks.
//           Ranking a blocker below the things it blocks is a plain ordering error.
'use strict';
const fs = require('fs');
const path = require('path');

const T = '/opt/targets/aphorism-cli';
const BL = path.join(T, '.swarm/backlog.json');
const b = JSON.parse(fs.readFileSync(BL, 'utf8'));
const byId = Object.fromEntries(b.items.map(i => [i.id, i]));

const NEW_PRIORITY = {
  'T-006': 2,   // unchanged — already correct
  'T-007': 3,   // was 8
  'T-008': 4,   // was 9
  'T-024a': 5,  // was 4 (blocked; rank inert, moved only to keep the groups contiguous)
  'T-024': 6,   // unchanged — the umbrella, now above what it unblocks
  'T-032': 7,   // was 5
  'T-024b': 8,  // was 6
  'T-039': 8,   // was 6
};

const HYGIENE = (from, to) =>
  `\n\n|| CYCLE 45 STEP-3 HYGIENE — priority ${from} -> ${to}. The live board's ordering ` +
  `contradicted the run's own measurements: the four test-only guard items outranked both ` +
  `product-touching todos, so a next-run conductor or human reading the board top-down ` +
  `would reach the prose-anchor family — which cycle 39 decided by measurement to stop ` +
  `narrowing — before reaching either item with a user-visible defect behind it. ` +
  `Re-ranked on two measured claims only (product-touching above test-only; the T-024 ` +
  `umbrella above the three items that name it as their instrument), stable otherwise. ` +
  `Evidence: .swarm/runs/cycle-045-verify-hygiene.txt. No item's scope, acceptance, ` +
  `status, effort or deps was touched.`;

const log = [];
for (const [id, p] of Object.entries(NEW_PRIORITY)) {
  const it = byId[id];
  const from = it.priority;
  if (from !== p) {
    it.priority = p;
    it.notes = (it.notes || '') + HYGIENE(from, p);
    log.push(`${id}: p${from} -> p${p}`);
  } else {
    log.push(`${id}: p${from} unchanged`);
  }
}

// --- schema repair: T-039 is live and carries no `value`, so step-4's
//     (value x alignment) / effort score cannot be computed for it at all.
const t39 = byId['T-039'];
t39.value = 'M';
t39.notes += `\n\n|| CYCLE 45 SCHEMA REPAIR — \`value\` was ABSENT on this live item, so ` +
  `cycle.md step-4 value scoring could not run on it. Set to "M" on SIBLING PARITY, and ` +
  `that basis is stated rather than dressed up as a valuation: T-024b and T-032 are the ` +
  `same effort (S), the same file, the same guard family and the same filing shape, and ` +
  `both carry M. No measurement in this run distinguishes T-039's value from theirs. ` +
  `Whoever picks it up should re-derive rather than inherit this number. (T-029, T-037 ` +
  `and T-038 also lack \`value\`; all three are done, so the omission is inert and was ` +
  `left alone rather than backfilled with a number nobody measured.)`;
log.push('T-039: value undefined -> "M" (sibling parity, basis recorded)');

// --- prose/state divergence: both product-touching todos assert a rank they do not hold
const FALSE_CLAIM = 'Left todo at full priority for the next run.';
for (const id of ['T-007', 'T-008']) {
  const it = byId[id];
  if (!it.notes.includes(FALSE_CLAIM)) throw new Error('expected claim missing on ' + id);
  it.notes = it.notes.replace(FALSE_CLAIM,
    `Left todo for the next run. (CYCLE 45 CORRECTION: this sentence previously read ` +
    `"at full priority", which was measurably false — the item sat at p${id === 'T-007' ? 8 : 9}, ` +
    `the ${id === 'T-007' ? 'second-lowest' : 'lowest'}-urgency live priority on the board, ` +
    `below four test-only guard items. Now p${NEW_PRIORITY[id]}. The claim was written at ` +
    `cycle-25 hygiene and was true of the INTENT; nothing ever checked it against the field.)`);
  log.push(`${id}: false "at full priority" claim corrected in notes`);
}

// --- T-008 reachability: record the fact, do NOT reverse the cycle-14 decision
byId['T-008'].notes += `\n\n|| CYCLE 45 REACHABILITY NOTE — read before picking this up. ` +
  `T-008 is now the highest-priority UNBLOCKED-status item on the board, and it is still ` +
  `not pickable by an autonomous run: deps=["T-006"], and T-006 is blocked on a human ` +
  `permanently (attributions cannot be confirmed without sources this run has no access ` +
  `to). The item's own notes above name a SECOND acceptable path — ship the added entries ` +
  `with their own triage in the same change — but \`deps\` can express only the first, so ` +
  `the board encodes the one branch that can never complete on its own. The dep is ` +
  `deliberately LEFT AS FILED: cycle 14 set it as a named judgment (adding ~70 unaudited ` +
  `attributions makes KI-2 worse in exactly the dimension a human already holds a queue ` +
  `for), and a hygiene pass does not get to silently reverse a recorded decision. What ` +
  `changed is that the constraint is now visible at the TOP of the queue instead of buried ` +
  `at the bottom, which is where a human decision belongs.`;
log.push('T-008: unsatisfiable-dep fact recorded; deps LEFT AS FILED (cycle-14 decision not reversed)');

fs.writeFileSync(BL + '.tmp', JSON.stringify(b, null, 2));
fs.renameSync(BL + '.tmp', BL);
console.log(log.join('\n'));
