const fs = require('fs');
const B = '/opt/targets/aphorism-cli/.swarm/backlog.json';
const S = '/opt/targets/aphorism-cli/.swarm/state.json';
const now = process.argv[2];

const b = JSON.parse(fs.readFileSync(B, 'utf8'));
const t029 = b.items.find(i => i.id === 'T-029');
if (!t029) throw new Error('T-029 missing');
t029.status = 'done';
t029.notes += '\n\nCYCLE 34 -- CLOSED, PASSED. Gate: .swarm/runs/cycle-034-verify-T-029.txt (26 cells, 4 arms), harness cycle-034-gate.js, raw cycle-034-gate.json, pre-dispatch baseline cycle-034-baseline.txt, sealed prediction cycle-034-precommit.md.\n\nTHE HOLE WAS THREE HOLES, NOT ONE. The pre-dispatch baseline measured the filed shape (G1: a true claim then a contradictory one in a later dash-clause) and found two more the item had not named: G3, two claims in the SAME clause, silent because clause.search() finds only the first occurrence per clause; and G6, the IDENTICAL defect on the sibling C1 (`entries`) claim, silent because both tests share the helper. All three are now RED under the fix and GREEN with the fix removed, so each is failable AND attributable per L-029.\n\nTHE DISQUALIFICATION WAS MEASURED, NOT ARGUED. The acceptance rules out first-match and last-match. Rather than read the diff and agree it is neither, I built both disqualified designs MYSELF from the builder\'s own code, changing only the positional collapse (F_FIRST = bindings.slice(0,1), F_LAST = bindings.slice(-1)), so the comparison machinery is identical and only position differs. F_FIRST goes silent on G1/G3/G6 and reproduces HEAD exactly; F_LAST goes silent on G2 (the mirror, false claim first). Each positional design is blind precisely where the other sees. Only the all-bindings design is RED on all four. That is what establishes the fix\'s value as "catches G1 AND G2 together", which no positional design can deliver.\n\nNOT HARDCODED: R2 consistent-change (c21/c22) run against the triage doc -- flip a MEDIUM row to HIGH and update the README together -> GREEN; stale half -> RED naming 9. NO KILL TRADED AWAY: there is no cell where HEAD is RED and FIX is GREEN, which is the check cycle 28 rejected T-021 for failing.\n\nTWO FINDINGS FILED FROM THE GATE: T-030 (the loud false rejection this fix buys, G9) and T-031 (a residual SILENT path the fix does not reach, G12).';

const t030 = {
  id: 'T-030',
  title: 'Spurious binding: TRUE prose carrying both marker tokens ("3 HIGH entries") is extracted as a contradictory count claim',
  kind: 'fix', priority: 5, value: 'M', effort: 'S', status: 'todo',
  deps: [], files_hint: ['test/readme-tags.test.js'], packages: [], model: 'sonnet', attempts: 0,
  acceptance: 'A README whose Attribution section reads "... -- 8 are rated HIGH -- ... Of those, 3 HIGH entries name a primary source." -- EVERY claim in it TRUE -- must be GREEN, while a genuinely contradictory second claim (the cycle-34 G1 shape, a later clause asserting 9) still FAILS naming the wrong number. Proven twice per L-029. TWO GUARDS THE FIX MUST NOT BREAK: the G2 mirror (false claim first, true one second) must stay RED, so the fix must not reintroduce positional behaviour by the back door; and no cell that is currently RED may go GREEN (cycle-34 monotonicity check). BOUNDARY is a valid outcome per SPEC I-2 if tightening the marker is judged the more dangerous trade -- but it must be argued against the measurement, not instead of it.',
  notes: 'Source: conductor gate cell G9, cycle 34 (.swarm/runs/cycle-034-verify-T-029.txt). EIGHTH cycle running that a gate cell or a builder\'s volunteered uncertainty converted directly into a measured item. Predicted in the cycle-34 SEALED pre-dispatch file and independently disclosed by the builder in its own "things I was unsure about" section, so it is a known and accepted cost of T-029, not a surprise.\n\nMEASURED: GREEN on HEAD, RED under the T-029 fix at 76/78 fail=2. It fires on BOTH tests, which the seal did NOT predict: "3 HIGH entries" carries the C2 marker (HIGH) and the C1 marker (entries), so it binds 3 against truth 8 and 3 against truth 50.\n\nLOUD, therefore the SAFE direction -- same classification as T-018 (c20), T-020 (c22), T-023 (c25), T-026 (c29), T-027 (c30). That is why it is priority 5 and not 3.\n\nNEW MECHANISM INSIDE THE PROSE-ANCHOR FAMILY, and this is the part worth carrying: every prior member failed to FIND a claim (a heading did not match, a parse missed). This one MANUFACTURES a claim out of unrelated true prose. The cycle-25 standing finding says the cure for prose anchors is to extract from structure or from tokens carrying mathematical meaning; here the marker token IS the meaning-bearing token and it still misfires, because English reuses it for a different quantity. Tightening /\\bHIGH\\b/ or /\\bentries\\b/ is exactly the narrowing that finding warns raises the odds a maintainer deletes the whole family.\n\nCOUPLED WITH T-031, AND THEY PULL OPPOSITE WAYS -- read both before touching the helper. This item wants FEWER bindings (suppress a spurious one); T-031 wants MORE (bind one currently missed). A fix aimed at either in isolation can worsen the other, so whoever takes one should re-run the other\'s cells.',
};

const t031 = {
  id: 'T-031',
  title: 'SILENT residual: a contradictory count whose digit sits across a dash boundary from its marker is never bound',
  kind: 'fix', priority: 3, value: 'L', effort: 'S', status: 'todo',
  deps: [], files_hint: ['test/readme-tags.test.js'], packages: [], model: 'sonnet', attempts: 0,
  acceptance: 'A README whose Attribution section reads "A later audit note records 9 -- HIGH entries -- in total." alongside the true 8 must FAIL, and the message must name 9 as the wrong figure. Proven twice per L-029 (fails with the fix, survives green with it removed). REGRESSION SURFACE, all of which must hold: the pristine README and the R2 consistent-change cell stay GREEN, and every cell RED at cycle 34 stays RED -- specifically G1, G2, G3, G6 (so the fix must not become positional) and G5 (a genuine parse miss must still fail loud). BOUNDARY is a valid outcome per SPEC I-2, but only if argued against the measurement.',
  notes: 'Source: conductor gate cell G12, cycle 34, ADDED AT VERIFICATION TIME specifically to measure the builder\'s volunteered uncertainty about the clause-scoped digit window rather than record it as a suspicion.\n\nMEASURED: GREEN under the T-029 fix AND GREEN on HEAD, 78/78 both. NOT A REGRESSION -- a case the fix does not reach, the same classification cycle 29 gave T-026 against T-025 and cycle 30 gave T-027 against T-021.\n\nWHY IT IS PRIORITY 3 WHILE ITS SIBLINGS SIT AT 5-7, DESPITE NOT BEING A REGRESSION: it fails SILENT. A README contradicting itself in plain sight passes green. That is the exact class T-029 was raised to remove and the class this whole improvement run was chartered against; the loud members of this family are irritating, this one is wrong. It is the same defect as T-029 one level down: T-029 collected a binding and ignored it, this collects no binding at all.\n\nMECHANISM: collectMarkerBindings splits the section on em/en dashes and binds, for each marker occurrence, the nearest preceding digit WITHIN THAT OCCURRENCE\'S OWN CLAUSE. A digit on the far side of a dash from its marker is therefore invisible, and an occurrence that binds nothing contributes nothing -- it is silently skipped rather than counted as unparseable. Note the tension the fix will have to resolve honestly: treating an unbound occurrence as a parse FAILURE would make G5 louder but risks false rejections wherever the section mentions HIGH or entries without a count at all, which the current README\'s own prose may well do.\n\nCOUPLED WITH T-030, AND THEY PULL OPPOSITE WAYS -- read both before touching the helper.',
};

if (!b.items.find(i => i.id === 'T-030')) b.items.push(t030);
if (!b.items.find(i => i.id === 'T-031')) b.items.push(t031);
fs.writeFileSync(B + '.tmp', JSON.stringify(b, null, 2));
fs.renameSync(B + '.tmp', B);

const s = JSON.parse(fs.readFileSync(S, 'utf8'));
s.cycle = 34;
s.counters.wave_streak = 1;
s.counters.autotune_note_cycle_34 = 'CLEAN branch: zero reverts, zero failed verifies -- T-029 passed its gate outright. Autotune APPLIES (cycle-9 rule: it keys on the ITEM KIND, not the dispatch mechanism, and kind:"fix" on a test file is build-class code dispatched through the documented headless substitute for build-wave). wave_streak 0 -> 1; k_current stays 4 because the raise happens at a streak of 2. INERT this run either way: effective wave size = min(k_current 4, gear cap 1) = 1, and gear 1 is structurally fixed because the weekly window resets at 1786942799, after stop_at 1786879464. Carried for a future run on a healthier window.';
s.counters.churn_note_cycle_34 = 'consecutive_no_value stays 0. T-029 reached done on a 26-cell, 4-arm gate with every acceptance clause proven twice and non-positionally. Second consecutive verified-value cycle after the cycle-31/32 pair of no-value cycles.';
s.decisions.push({
  cycle: 34,
  what: 'The acceptance clause that disqualifies "first match" and "last match" was settled by BUILDING both disqualified designs from the builder\'s own code and measuring them, rather than by reading the diff and agreeing it was neither.',
  why: 'This is the one clause a code review genuinely cannot settle. Any all-bindings implementation LOOKS non-positional -- it says filter(...).length === 0 -- and the question the acceptance actually asks is a behavioural one: does the verdict change when the two contradictory claims swap places? Deriving F_FIRST (bindings.slice(0,1)) and F_LAST (bindings.slice(-1)) from FIX holds the comparison machinery identical and varies ONLY position, so the difference in outcome is attributable to position and nothing else. The result is sharper than the acceptance anticipated: F_FIRST is silent on G1/G3/G6 and reproduces HEAD exactly, F_LAST is silent on G2, and each is blind precisely where the other sees. That is what upgrades the claim from "the fix catches the filed case" -- which F_LAST also does -- to "the fix catches the case AND its mirror", which no positional design can. Recorded because the cheaper path (agree with a plausible diff) would have produced the same verdict on this occasion and would have been worthless as evidence.',
});
s.decisions.push({
  cycle: 34,
  what: 'The fix was authorised to land in the SHARED helper, closing the sibling C1 (`entries`) hole that T-029\'s acceptance never named -- and the authorisation was written into the SEALED pre-dispatch file, before the builder was told anything.',
  why: 'Cycle 8 set the boundary: widening an acceptance is principled when the identical defect sits in the same edit at zero additional risk, artificial when it needs new machinery. C1 and C2 call the same function, and the baseline measured C1 silent on the same shape (cell G6, GREEN on HEAD), so it is one defect with two call sites, not two items. The reason to record it is the TIMING rather than the ruling: a scope widening decided AFTER seeing a passing result is indistinguishable from rationalising whatever the agent happened to do. Sealing it in cycle-034-precommit.md before dispatch makes it a decision the evidence was then tested against. Cycle 8 took the same widening from the other end and had to argue it post hoc.',
});
s.decisions.push({
  cycle: 34,
  what: 'The builder\'s volunteered uncertainty about the clause-scoped digit window was MEASURED as a new gate cell (G12) rather than filed as a suspicion -- and it found a residual SILENT path, which was filed as T-031 at priority 3 while T-029 was still accepted.',
  why: 'Filing an unmeasured silent-class suspicion out of the cycle whose entire purpose was closing a silent hole would have been the precise failure this run exists to remove. Measured: a contradictory count whose digit sits across a dash from its marker binds nothing and is never examined, green at 78/78 under the fix. Accepting T-029 anyway is not generosity, and the distinction from cycle 28 is what makes it principled: cycle 28 REJECTED a 22/22 fix because it converted a case HEAD caught into a case nothing caught. Here G12 is green on HEAD TOO -- no kill was traded, and across all 13 cells there is no cell where HEAD is RED and FIX is GREEN. The fix strictly adds kills. A case the fix does not REACH is not a case the fix BREAKS, which is the reading cycle 29 gave T-026 and cycle 30 gave T-027.',
});
s.decisions.push({
  cycle: 34,
  what: 'The sealed prediction was NOT refuted, and the one place it was understated is recorded rather than smoothed over: it predicted the new false rejection would hit C2, and the measurement shows it hits C1 as well (2 failures, not 1).',
  why: 'The seal named its own refutation conditions and none were met -- the fix closed all three silent cells, the false rejection appeared as predicted, F_LAST turned the mirror green as predicted, and nothing outside C1/C2 moved. But "3 HIGH entries" carries BOTH marker tokens, so it binds spuriously against corpus.length as well, which I did not see coming. Recording an understatement in a seal that otherwise held is the whole point of sealing it: the seal exists to measure the conductor, and a seal only ever reported as vindicated is not being read honestly. Cycle 33 is the precedent in the strong direction -- there the sealed prediction was flatly refuted and the conductor\'s verdict reversed.',
});
s.last_cycle = {
  cycle: 34,
  work: 'T-029 (silent hole in the Attribution count extraction)',
  outcome: '1 verified',
  commit: 'PENDING',
};
fs.writeFileSync(S + '.tmp', JSON.stringify(s, null, 2));
fs.renameSync(S + '.tmp', S);

const c = {};
for (const i of b.items) c[i.status] = (c[i.status] || 0) + 1;
console.log('backlog', JSON.stringify(c), 'items', b.items.length);
console.log('state cycle', s.cycle, 'wave_streak', s.counters.wave_streak, 'no_value', s.counters.consecutive_no_value);
