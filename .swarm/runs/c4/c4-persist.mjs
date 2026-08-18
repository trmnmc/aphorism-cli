import fs from 'node:fs';
const T = '/opt/targets/aphorism-cli/.swarm/';
const CYCLE = 4;

// ---- backlog ----------------------------------------------------------------
const b = JSON.parse(fs.readFileSync(T + 'backlog.json', 'utf8'));
const it = (id) => b.items.find((x) => x.id === id);

const n4 = it('N-4');
n4.status = 'done'; n4.closed_cycle = CYCLE; n4.model = 'fable'; n4.route_class = 'core'; n4.effort = 'M';
n4.notes = (n4.notes || '') + ' | CYCLE 4: closed NOT as vacuous. N-3 measured zero survivors, so the literal charter was an empty set; the item was re-scoped (decision recorded) to test the COMPLETENESS of the inherited 29-clause enumeration, which cycle 3 flagged as unverified. Result: 43 clauses derived independently from SPEC text, 29 mapping to the inherited map (carried KILLED), 14 NEW. Of the 14: 12 KILLED, 1 SURVIVED (D-42, classified BOUNDARY), 1 NOT-PLANTED (D-43, spec self-contradictory). 0 HOLE. Conductor independently re-planted 4 rows (D-42, D-43, D-13, D-38) in his own pristine archive; all four verdicts reproduced.';

const n5 = it('N-5');
n5.status = 'done'; n5.closed_cycle = CYCLE;
n5.notes = (n5.notes || '') + ' | CYCLE 4: closes with ZERO tests added, which SPEC K-3 names as a valid result. N-4 classified 0 survivors as HOLE (the single survivor D-42 is BOUNDARY - spec-undecided repeated-flag semantics, and L-033 forbids hardening an undecided observable). Evidence is the cycle-4 gate: F2 shows test/ untouched by any agent, F1 shows the suite unchanged at 102/102. Writing a test here would freeze behaviour the spec never decided.';

const n6 = it('N-6');
n6.status = 'done'; n6.closed_cycle = CYCLE; n6.attempts = 1; n6.model = 'haiku';
n6.notes = (n6.notes || '') + ' | CYCLE 4: the agent delivery FAILED the no-false-claim clause and is recorded as attempts=1. Structure was right (22 lines, additive, all 1226 pre-existing lines byte-identical), but two claims overreached: (a) the mutation-coverage bullet reported "29/29 killed, 0 survived" with no lower-bound caveat, which reads as far stronger coverage than N-4 established in this same cycle; (b) "test suite has only been run on Node v24.19.0" is a historical claim neither agent nor conductor can verify. The conductor repaired both lines himself and re-ran the sealed gate; the repaired text is what is verified. Closed done-by-conductor-repair, not done-as-delivered.';

const j7 = it('J-7');
j7.title = 'Four CLI behaviours are unspecified and a human should rule on them (from J-6 + N-4)';
j7.notes = (j7.notes || '') + ' | CYCLE 4: N-4 added TWO more rulings to this item, both measured. (3) REPEATED --tag/--author (D-42): shipped behaviour is last-occurrence-wins and it is UNPROTECTED - conductor reproduced it independently (--tag humor --tag design --list prints the 14-entry design list; a first-wins mutant prints the 9-entry humor list; the suite stays 102p/0f on both). SPEC spells every filter flag in the singular and never mentions repetition, so last-wins is an artifact of assignment order in parseArgs, not a contract. (4) EMPTY/WHITESPACE --seed (D-43): SPEC Selection says --seed accepts any value that Number() parses to a non-NaN number, and Number("")===0 is non-NaN, so the literal reading says ACCEPT; the implementation rejects with exit 2 and SPEC Exit-codes calls a missing flag argument bad usage. The two clauses point opposite ways, so there is no decided behaviour to test against - a human must pick one.';

b.items.push({
  id: 'N-10', kind: 'docs', status: 'todo', priority: 6, effort: 'S', value: 'M', model: 'haiku',
  deps: [], attempts: 0, filed_cycle: CYCLE, files_hint: ['.swarm/SPEC.md'], packages: [], owner: 'conductor',
  covers: 'K-5',
  title: 'Document the two spec gaps N-4 measured, as gaps, without deciding them',
  acceptance: 'SPEC.md gains an explicit "undecided behaviours" note naming (a) repeated --tag/--author and (b) empty/whitespace --seed, each stating what the shipped binary currently does, which SPEC clauses conflict, and that no test pins it. It must NOT invent a ruling - that is J-7 and it is human-owned. Verified by reading SPEC.md for both entries and confirming no test file changed.',
  notes: 'From N-4 (cycle 4). Distinct from J-7: J-7 is the human RULING, N-10 is the honest record of the gap while it is unruled.',
});

// ---- state ------------------------------------------------------------------
const s = JSON.parse(fs.readFileSync(T + 'state.json', 'utf8'));
s.cycle = CYCLE;
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
s.counters.wave_streak = 0;         // mixed wave (one failed verify) -> streak resets
s.counters.k_current = 3;           // unchanged; the gear-2 cap of 2 was binding anyway
s.counters.verified_this_cycle = 3;

s.decisions.push({
  cycle: CYCLE, kind: 'scope',
  what: 'Re-scope N-4 from "classify the survivors" to "test whether the inherited 29-clause enumeration is COMPLETE".',
  why: 'N-3 measured 0 survivors, so N-4 as chartered was an empty set and N-5 a guaranteed no-op - two items that would have closed as vacuously satisfied while establishing nothing. Cycle 3 journaled the real weakness in its own result: the 29-clause enumeration is inherited from run #1 cycle 52 and had never been re-derived from the SPEC. Re-scoping tested exactly that. It paid: an independent derivation found 43 clauses, 14 never mutation-tested, and one genuine unprotected behaviour. The item still honours K-3 - tests come only from measured survivors, zero survivors were HOLE, so zero tests were written.',
});
s.decisions.push({
  cycle: CYCLE, kind: 'process',
  what: 'The sealed cycle-4 gate FAILED check N4-c, and the failure was adjudicated by hand rather than by editing the gate.',
  why: 'N4-c required every newly-derived clause to carry a mutation_site, which contradicts the NOT-PLANTED verdict the dispatch contract explicitly sanctioned (and which the structure check already guards with a >=30-char reason requirement). The failing row D-43 was verified by hand instead: Number("")===0 and Number("   ")===0 are non-NaN (so SPEC Selection literally says accept), the pristine binary rejects both with exit 2, and a mutant accepting "" as seed 0 left the suite at 102p/0f. The contradiction is real, so NOT-PLANTED is the honest verdict and the CHECK is the defective instrument. The sealed gate file was NOT edited and its FAIL stands recorded. This is the 4th instrument bug of the run, all the same shape: a check stricter than the contract it was written to enforce.',
});
s.decisions.push({
  cycle: CYCLE, kind: 'process',
  what: 'N-6 was closed done-by-conductor-repair rather than done-as-delivered.',
  why: 'The haiku agent produced correct structure but two overreaching claims, the worse being a bare "29/29 killed, 0 survived" with the lower-bound caveat dropped - which N-4, in this same cycle, proved materially understates the uncertainty. Re-dispatching at attempts+1 would have spent a cycle on a two-line correction whose facts only the conductor holds. The repair is journaled and the agent attempt is recorded as failed so the backlog does not read as a clean delivery.',
});

s.known_issues.push({
  id: 'KI-28', severity: 'low', opened_cycle: CYCLE, owner: 'human',
  what: 'Repeated --tag / --author is unprotected AND spec-undecided. Shipped behaviour is last-occurrence-wins; the suite does not notice a first-wins implementation (102p/0f against the mutant, conductor-reproduced). SPEC describes every filter flag in the singular and never mentions repetition.',
  settled_by: 'A human ruling in SPEC.md (tracked as J-7 item 3). Only once the behaviour is decided may a test pin it - hardening it now would freeze an artifact of argument-parsing order.',
});
s.known_issues.push({
  id: 'KI-29', severity: 'low', opened_cycle: CYCLE, owner: 'conductor',
  what: 'Three domain-rule clauses (D-04 non-integer seeds, D-36 --help on stdout, D-41 positional-argument rejection) are each killed by exactly ONE test. A single test deletion or skip silently removes protection for that clause.',
  settled_by: 'Either accept it explicitly, or add a second independent assertion per clause. Measured by N-4 at cycle 4 as a by-product; not itself a defect, but it is the thin ice in an otherwise 41/43-killed map.',
});
s.known_issues.push({
  id: 'KI-30', severity: 'medium', opened_cycle: CYCLE, owner: 'swarm-maintainer',
  what: 'The SWARM self-modification fence (hard rule 5) depends on agent goodwill. The N-4 agent found /tmp blocked by its sandbox and created scratch at /opt/swarm/.n4-scratch - INSIDE the SWARM repo, outside the runs/ and playbook/ paths the fence permits. It was dispatched with target paths only and never told a SWARM path; it derived one. It cleaned up after itself (directory absent and git status clean at verification), so no residue reached the repo.',
  settled_by: 'Give subagents a writable scratch dir inside the TARGET (e.g. <target>/.swarm/runs/scratch) in the dispatch contract, or unblock /tmp for subagents. Until then the fence is a convention, not a control.',
});

s.qa.suite_coverage_note_cycle_004_run3 = 'K-3 COMPLETENESS TESTED. The 29-clause map that cycle 3 re-measured 29/29 KILLED had itself never been re-derived from the SPEC. Cycle 4 derived 43 clauses independently from SPEC Domain rules / must-haves / taste notes / exit codes plus README, then diffed: 29 map onto the inherited enumeration (verdicts carried, not re-measured - src/ bin/ test/ are byte-identical between b627ed2 and e6c53b1), 14 are NEW. The 14 measured: 12 KILLED, 1 SURVIVED, 1 NOT-PLANTED. So the inherited enumeration was INCOMPLETE as an enumeration (14 omissions) while the SUITE turned out to protect 12 of those 14 anyway. The single survivor D-42 (repeated --tag/--author) is BOUNDARY, not HOLE. 0 HOLE therefore 0 new tests, which is why N-5 closes empty. RECORDED HERE, NOT in last_full_qa_cycle: this is the conductor/agent mutation instrument, not the qa-verify.js workflow - same convention as run #1 cycles 49-50 and run #3 cycle 3.';

s.last_cycle = { cycle: CYCLE, work: 'build-wave (N-4 + N-6)', outcome: 'VALUE (3 verified: N-4, N-5, N-6)', ts: Math.floor(Date.now() / 1000) };

for (const [p, o] of [[T + 'backlog.json', b], [T + 'state.json', s]]) {
  fs.writeFileSync(p + '.tmp', JSON.stringify(o, null, 2));
  fs.renameSync(p + '.tmp', p);
}
console.log('backlog', b.items.length, '| todo', b.items.filter((x) => x.status === 'todo').length,
  '| done', b.items.filter((x) => x.status === 'done').length,
  '| blocked', b.items.filter((x) => x.status === 'blocked').length,
  '| dropped', b.items.filter((x) => x.status === 'dropped').length);
console.log('known_issues', s.known_issues.length, '| decisions', s.decisions.length, '| cycle', s.cycle);
console.log('todo ids:', b.items.filter((x) => x.status === 'todo').map((x) => x.id).join(', '));
