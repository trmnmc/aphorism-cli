
## cycle 7 | 2026-08-24T17:19:00+00:00 | aphorism-cli | BUILD

work: build-wave [W-8] — a ONE-item wave, and honestly so. W-6 is a conductor-held
invariant that is never dispatched, and W-10 (the last must-have) lists W-8 among its
deps, so W-8 was the only unblocked item on the board. Effective wave size was
min(k_current 5, gear cap 3, hard max 5) = 3; the board supplied one. Padding it with a
blocked item would have been a fake wave.
dispatch: 1 DIRECT Agent call (Workflow is review-gated in a headless -p session, L-016
fallback).
models: W-8 fable — re-routed sonnet→fable in cycle 6 because the item's core deliverable
is a RULING, and judgment seats sit on fable. Gear 3, table as-is, no demote/promote.
Craft pack ran clean (degraded: none); not a UI item, so no craft.ui text was passed.
budget: gear 3 cruise, ratio 0.71, k_cap 3, 39.5M window tokens at 22.8M tok/h, projected
depletion 1787606387 (~20:39Z) — AFTER the 20:00Z window reset, so no pressure.
control: 0 pending commands, 0 injections. Tree clean at d8403a3 on entry.

**one deliberate deviation from the playbook prompt lines, stated rather than buried.**
The builder prompt line the playbook supplies says "the conductor seals its verification
gate by hash before dispatch". That is not what this conductor does — hard rule 2 says the
check is authored AT VERIFICATION TIME, and this cycle's gate was written after the work
landed. Rather than tell an agent something false, the clause was replaced in-prompt with
the true statement that carries the same deterrent: "the conductor authors its verification
gate AFTER your work lands, and you will never see it. Do not attempt to locate, read or
infer a check." Every other playbook prompt line went out verbatim. Flagging for RETRO:
L-047's wording and hard rule 2 disagree about WHEN the gate exists, and the lesson should
be reworded rather than quietly ignored each cycle.

VERIFICATION EVIDENCE — 13 cells; full output in
.swarm/runs/r8-cycle-007-verify-gate.txt (10/13) and
.swarm/runs/r8-cycle-007-verify-gate-addendum.txt (3/3 re-taken);
scripts committed as .swarm/runs/r8-gate-c7.py and r8-gate-c7-addendum.py.

  W-8 — the detection floor re-run at final HEAD, with a ruling the mechanism can't make

  C3 THE ARTIFACT IS NOT FABRICATED — conductor re-derived it independently, not by
     asking the tool's own --remeasure:
       conductor ran: node tools/mutation-matrix.mjs --rev d8403a3 --json   exit=0
       rows: conductor=15  committed=15
       verdict differences (id-by-id)      : []
       guardTitle differences on shared ids: []
       skippedClaims conductor=['M01','M02','M03'] == committed
       identity control  conductor GREEN 128/128/0/0 == committed GREEN 128/128/0/0
  C4' PARTITION RECOMPUTED BY THE CONDUCTOR, from firedGuards, must match set for set:
       conductor SAME-GUARD (14) == tool SAME-GUARD (14)
       conductor GUARD-CHANGED (1) ['M08'] == tool GUARD-CHANGED (1)
       conductor CLAIM-GONE (3) ['M01','M02','M03'] == tool CLAIM-GONE (3)
       conductor DETECTION-LOST [] ; UNACCOUNTED [] ; 18 baseline-CAUGHT, buckets sum 18
       M08 measured: baseline named guard still fires at HEAD = False; fired instead =
         'README must state correct multi-entry and single-entry tag counts'
  C5  converse control, conductor's own injection on an id the builder never used —
       M09 CAUGHT→SILENT in a COPY → exit 1
       "[M09] DETECTION LOST: caught at baseline 20b7ede (...) but SILENT at HEAD"
  C5b M15 deleted from results AND skippedClaims → exit 1 "UNACCOUNTED (1): M15"
  C6  GREEN control on the same --final path, undoctored copy → exit 0
       "VERDICT: DETECTION FLOOR HOLDS at HEAD d8403a35..."  (without this, C5/C5b prove
       nothing but that the tool can die)
  C7  the FRESH-BY-CONTENT exemption cannot wave a real staleness through:
       measuredCommit → e40736c, whose diff to HEAD touches tools/mutation-matrix.mjs
       → exit 3 STALE, and no SAME-GUARD header printed (it refuses to compare at all)
  C2  provenance: meta.measuredCommit == repo HEAD; top-level keys identical to baseline
       ['meta','identity','results','skippedClaims']; 18 unique ids; identity GREEN both
  C2b' the exemption's path set is a SUPERSET of the real verdict inputs — mutations edit
       only README.md and src/corpus.js, guards fire from test/, and the 18-row mutation
       table is hardcoded in the instrument, NOT re-derived from guard-inventory.mjs at
       runtime (checked for an invocation with comments stripped, not a substring)
  C8  run-all.mjs: exit 0, "ROLL-UP: 5/6 ran clean; SKIPPED: mutation-matrix." —
       registered, and the slow tool still explicitly SKIPPED rather than dropped
  C11 ruling W8-R1 prints all six required parts (id, ruling, FOR, AGAINST, falsifier,
       scope guard) on the PASSING run AND on a FAILING run — a ruling that only prints
       when the news is good is not a record

  standing
  C1' scope: 3 builder paths touched, all inside the declared set; 4 conductor gate
       artifacts partitioned out BY NAME (never by a .swarm/ wildcard); 0 unclassified;
       converse control rejects 5/5, including a plausible builder file smuggled under
       .swarm/. 0 leftover .scratch trees. Baseline record sha256 5ac3c65d... identical
       on disk and at HEAD — byte-unmoved.
  C9  W-6: corpus sha256 77a4de5c == baseline; --help sha256 d759d781 == baseline; git
       status over src bin test .github README.md docs empty; 0 manifests tracked, 0 on
       disk, no node_modules; 24 tools/ imports, 0 non-node:; converse control 3/3.
  C10 test_cmd: node --test test/*.test.js → tests 128 / pass 128 / fail 0 / skipped 0.

GATE DEFECTS THIS CYCLE (D-R8-19) — the first-pass gate returned 10/12+1 and **all three
failures were the instrument, not the work**. Sixth consecutive cycle with a defective
conductor instrument; eleven distinct root causes now, still no two alike.
(D1/C1) The scope classifier ran AFTER the gate had written its own script and transcript
into .swarm/runs/, then reported those two conductor-authored files as "outside declared
scope" — the check was measuring itself.
(D2/C2b) The "does the instrument re-derive its mutation table from guard-inventory.mjs?"
probe stripped comments from the WRONG FILE (detection-floor.mjs) and substring-matched
"guard-inventory" — which appears there inside the W8-R1 ruling text as a string literal.
It answered "yes it does" on the strength of prose in an unrelated file.
(D3/C4) The worst of the three, and the one worth carrying forward: the conductor decided
SAME-GUARD vs GUARD-CHANGED by comparing the `guardTitle` field between the two records.
`guardTitle` is TRANSCRIBED from the instrument's hardcoded mutation table, so it is
byte-identical in both records for all 15 shared ids BY CONSTRUCTION (measured, and now
asserted as a precondition in C4'). That rule could never have returned GUARD-CHANGED for
anything — it would have rubber-stamped a real guard change as "same guard" and called the
floor clean. The measured signal is `firedGuards`. **The tool was right and the gate was
wrong**, which is the first time this run that a disagreement resolved in the builder's
favour. Nothing was re-labelled and nothing silently re-run: r8-gate-c7.py is committed AS
IT RAN at 10/13, and r8-gate-c7-addendum.py re-takes the three cells with each defect named
in its own cell header.

builder-initiative note (not a defect, recorded because it is a self-granted widening):
detection-floor.mjs's freshness check is exact-sha-match FIRST, then applies one narrow
exemption — if the recorded commit is an ancestor whose diff to HEAD touches none of
README.md/docs/src/bin/test/.github/tools/mutation-matrix.mjs, it proceeds as
FRESH-BY-CONTENT with the changed-file list printed. The builder's stated reason is sound
(without it, the very commit that lands the artifact would turn the finding permanently red
in run-all despite a byte-identical tree everywhere the verdicts look), C2b' confirms the
path set is a superset of the real inputs, and C7 confirms it cannot mask a real staleness.
But an agent widening its own acceptance clause is worth a line in the record either way.

instrument disagreement, second confirmation (KI-37, still open, reported not edited —
bin/ is read-only under hard rule 5): at the identical week_elapsed_pct 6.977, the budget
probe wrote weekly_used_pct 0 / opus_used_pct 100 while runs/allocator.json read
weekly_used_pct 13.0 / opus_used_pct 16. Cycle 6 recorded the disagreement on opus alone;
it is on BOTH counters. It cost this cycle nothing — W-8 routed to fable, not opus — but
promote stayed blocked all cycle on a number one of the two instruments has wrong.

outcomes: W-8 done, W-6 held. Clean wave: 0 reverts, 0 failed verifies → wave_streak
reached 2 and reset to 0, k_current stays 5 (already at the hard max).
consecutive_no_value 0. Board now: 14 done, 2 todo (W-6 the standing invariant, W-10 the
last must-have — now unblocked), 9 blocked on human rulings, 4 dropped.
burn attribution: 13,660,922 window tokens credited to aphorism-cli for cycle 6.
