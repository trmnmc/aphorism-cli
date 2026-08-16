#!/usr/bin/env node
'use strict';
const fs = require('fs');
const S = '/opt/targets/aphorism-cli/.swarm/state.json';
const st = JSON.parse(fs.readFileSync(S, 'utf8'));
const now = Number(process.argv[2]);

st.cycle = 45;
// phase stays POLISH — no gate transition this cycle.

st.last_cycle = {
  cycle: 45,
  work: 'step-3 backlog hygiene: priority inversion repaired, live schema gap closed — conductor-inline, ZERO AGENTS',
  outcome: '1 verified (board repair, no backlog item — see churn note)',
  ts: now,
  stale_field_note: 'This field read cycle 41 at the start of cycle 45 — cycles 42, 43 and 44 each ' +
    'wrote their journal block and their counters but never updated last_cycle, so the summary ' +
    'field a resume path reads first was three cycles behind the file it lives in. Found by this ' +
    'cycle\'s hygiene pass while orienting, not by a check aimed at it. Repaired here; recorded ' +
    'because it is the same defect class the pass went looking for in the backlog (a bookkeeping ' +
    'field asserting something nothing ever checked against the data).',
};

st.counters.autotune_note_cycle_45 =
  'Wave autotune NOT applied; k_current stays 5, wave_streak stays 0. SEVENTH consecutive ' +
  'zero-agent cycle — no wave dispatched, no agent ran. Autotune measures how much parallel CODE ' +
  'a target can absorb, and a cycle that dispatched nothing measures nothing about that. Same ' +
  'reasoning as cycles 39-44. Inert either way: effective wave size = min(k_current 5, gear cap 1) ' +
  '= 1, and gear 1 is structurally fixed for the rest of the run.';

st.counters.churn_note_cycle_45 =
  'consecutive_no_value stays 0. THIRTEENTH consecutive verified-value cycle, on the honest label ' +
  'cycles 42-44 used: verified-value-with-no-item-landed. NO BACKLOG ITEM LANDED. The caveat that ' +
  'belongs on this one is narrower than its predecessors\' and points the other way: this cycle did ' +
  'not produce a measurement about the PRODUCT at all — it repaired the ORCHESTRATOR\'S OWN ' +
  'bookkeeping. Nothing a user of the CLI can observe changed, and nobody should read the counter ' +
  'as product progress. What is real: the board\'s ordering contradicted the run\'s own measured ' +
  'rulings, and a next-run conductor or a human reading it top-down would have been steered into ' +
  'the guard family cycle 39 decided by measurement to stop working on, before reaching either ' +
  'item with a user-visible defect behind it. That is a defect in the hand-off itself, which is ' +
  'this run\'s remaining deliverable.';

st.decisions.push({
  cycle: 45,
  what: 'The backlog reprioritisation was derived from files_hint — a field EARLIER cycles wrote — rather than from the conductor\'s reading of each item\'s value, and the transformation was held to exactly two measured claims with everything else left stable.',
  why: 'Step 3 licenses "reprioritize" in one word, which is the widest discretion the cycle algorithm hands the conductor anywhere: a reprioritisation is unfalsifiable if its basis is the conductor\'s judgment about value, because the output IS the judgment and reading it back can only confirm it. Keying on files_hint (product path vs test-only) makes the classifier mechanical AND pre-committed — every live item\'s files_hint was written when it was filed, by cycles 14 through 40, so it cannot have been shaped to this cycle\'s preferred answer, and the partition it produces (3 product / 5 test-only) exactly reproduces the split cycle 44 measured by an unrelated route. The second claim (the T-024 umbrella above the three items that name it) is likewise read off the items\' own text, re-measured this cycle rather than inherited from cycle 44 gate S8c. Everything else is STABLE by construction: existing relative order and ties preserved, so the pass makes two claims and no more. The tempting alternative — re-rank the board by what I think matters — would have produced the same top-two ordering and proven nothing. Both ordering checks carry a negative control that re-runs the identical predicate against the pre-edit snapshot and requires it to go RED (A2n, A3n), which is what separates a repair from a restatement.',
});

st.decisions.push({
  cycle: 45,
  what: 'T-008 was moved to the top of the unblocked-status queue while its dep on the permanently-human-blocked T-006 was LEFT EXACTLY AS FILED, and the resulting unreachability was recorded on the item instead of being resolved.',
  why: 'T-008 is the item cycle 44 measured as the sole reason this target is not DONE, and it is unpickable by any autonomous run: deps=["T-006"], and T-006 needs sources no swarm cycle here can reach. Two edits were available and both are worse than the one taken. Dropping the dep would silently reverse cycle 14\'s named judgment — that adding ~70 unaudited attributions makes the open HIGH-severity KI-2 worse in precisely the dimension a human already holds a queue for — and a hygiene pass does not get to overturn a recorded decision by editing a field. Leaving the item at p9 would have kept the constraint buried under four test-only guard items where no morning reader would find it. The item\'s own notes name a SECOND acceptable path (ship the added entries with their own triage in the same change) that `deps` structurally cannot express, so the board can only ever encode the branch that never completes. Raising the item and writing the reachability fact onto it puts the human decision at the TOP of the queue, which is where a decision only a human can make belongs — the constraint is now visible rather than resolved, and that distinction is the point.',
});

fs.writeFileSync(S + '.tmp', JSON.stringify(st, null, 2));
fs.renameSync(S + '.tmp', S);
console.log('state.json: cycle 45, phase ' + st.phase + ', last_cycle repaired (was stale at 41), 2 decisions appended, 2 counter notes');
