'use strict';
// Cycle 22 backlog update: close T-016, file residual T-020.
const fs = require('fs');
const p = '/opt/targets/aphorism-cli/.swarm/backlog.json';
const b = JSON.parse(fs.readFileSync(p, 'utf8'));

const t = b.items.find(i => i.id === 'T-016');
t.status = 'done';
t.verified_cycle = 22;
t.notes += ' || VERIFIED cycle 22, 23/23 conductor gate checks (.swarm/runs/cycle-022-verify-T-016.txt), zero failures. All three claims stayed in scope and none was dropped: C2 proved machine-parseable (the triage table holds 50 rows, ids 0-49 distinct, HIGH 8 / MEDIUM 16 / LOW 26), so the item’s standing permission to drop C2 honestly was not needed and dropping it would have needed a reason I did not have. PRE-DISPATCH BASELINE (.swarm/runs/cycle-022-baseline.txt) MEASURED the blindness rather than inheriting cycle 19’s survivor list: C1, C2 and C6 all SURVIVED at 68/68/0 while the paired control C0 (37 distinct tags -> 38, a claim the suite provably DOES guard) KILLED at 68/67/1 -- so the existing suite was provably live and provably blind to exactly these three. Three tests added, 186 insertions / 0 deletions, suite 68 -> 71. All three proven twice per L-029 using conductor mutations the builder never saw, deliberately in the opposite direction or on a different target: 50->51 (UP, where the builder used 49 DOWN), 8->7 (DOWN, where the builder used 9 UP), and bin/aphorism.js plus the test/ directory entry (where the builder used src/select.js). Every FAILABLE run names the matching new test; every ATTRIBUTABLE run returns exactly 68/68/0, the pre-cycle baseline. The decisive checks are the three R2 TRACKS/STALE pairs, which no acceptance clause asked for and which are the only form that separates a guard derived from the real artifact from one hardcoding today’s numbers: adding a 51st corpus entry AND updating the README consistently stays GREEN at 71/71 while the stale half fails naming C1; flipping a triage row MEDIUM->HIGH AND updating the README stays GREEN while the stale half fails naming C2; creating a real new file AND adding its Layout line stays GREEN while a Layout line for a file that was never created fails naming C6. A hardcoded guard fails all three TRACKS halves. R1 (the T-012 prose-keying hazard) measured clean in both directions: prose reworded with digits and paths intact stays green, and reworded prose plus a wrong number still kills naming C1. R5 confirms a parse miss is LOUD, never a silent pass -- deleting the whole Attribution section fails 2 tests by name, and replacing the Layout fence with prose fails C6. Residual filed as T-020.';

b.items.push({
  id: 'T-020',
  title: 'Make the Attribution count extraction robust to digits reordered within one clause',
  kind: 'test',
  priority: 7,
  value: 'L',
  effort: 'S',
  status: 'todo',
  deps: ['T-016'],
  files_hint: ['test/readme-tags.test.js'],
  packages: [],
  model: 'sonnet',
  attempts: 0,
  acceptance: 'Rewording the Attribution sentence so that a different CORRECT digit sits nearer the HIGH marker than the HIGH count itself -- e.g. `8 of the 50 entries carry a rating of HIGH` -- leaves the suite GREEN, while the same reworded prose carrying a WRONG HIGH count still fails. Proven twice per L-029.',
  notes: 'Source: conductor probe N1, cycle 22 -- .swarm/runs/cycle-022-verify-T-016.txt. MEASURED, not suspected: rewriting the Attribution aside as `covers every entry. 8 of the 50 entries carry a rating of HIGH, and it says what would settle each one.` -- with every number still TRUE -- fails the suite at 71/70/1, naming the C2 test. Cause: extractNearestPrecedingCount splits the section on em/en dashes and then takes the digit run NEAREST BEFORE the marker within that clause; with the dashes gone the whole paragraph collapses into one clause, and in that word order 50 sits nearer to HIGH than 8 does. The builder flagged exactly this edge case in its own report rather than hiding it, which is the only reason it was probed -- an honest uncertainty report converted directly into a measured backlog item. IMPORTANT, and the reason this is LOW value rather than a repeat of T-012: the guard does NOT go quiet. It fails LOUD and names the claim, so a maintainer who trips it is told exactly what happened. This is a false REJECTION of an honest edit -- the safe direction -- and it gets the same classification T-018 got at cycle 20 for the same reason. Fix shape: bind the digit to its marker by proximity in BOTH directions within the clause, or match the two claims as a pair (`N ... entries` and `M ... HIGH`), rather than assuming the README will keep using dash-delimited asides. Whatever is chosen must still fail LOUD on a genuine parse miss (R5, verified this cycle) and must not be keyed to lead-in prose (the standing T-012 hazard).',
});

fs.writeFileSync(p + '.tmp', JSON.stringify(b, null, 2));
fs.renameSync(p + '.tmp', p);

const c = {};
b.items.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
console.log('backlog items', b.items.length, JSON.stringify(c));
