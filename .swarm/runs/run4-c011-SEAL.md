# run #4 cycle 11 — verification gate SEAL (pre-dispatch)

Written and committed BEFORE any agent was dispatched. The gate file itself lives under
`SWARM/runs/` for the whole dispatch window: hard rule 5 gives workflow agents target paths
only, so a gate held there is STRUCTURALLY unreachable to a builder rather than merely
forbidden to it (run #3 cycle-14 decision, held every cycle since).

    file      SWARM/runs/run4-c011-gate.mjs
    sha256    280692db09cd6d4146a516be18516e810c4c00db1b032229e8f4c66ce9ccbc86
    cells     31
    baseline  21 PASS / 10 FAIL — BASELINE SOUND
    tree      957aca3 (clean; suite 118 tests / 118 pass / 0 fail)

## Wave

| item | kind | effort | model | files |
|---|---|---|---|---|
| Q-8  | fix  | S | sonnet | `test/readme-tags.test.js` |
| TS-5 | docs | S | sonnet | `.swarm/SPEC.md`, `REPORT.md` |

File scopes are pairwise disjoint. Gear 2 (guest, weekly ceiling 2, k_cap 2), so the
effective wave size is 2 — the first cycle of this run that can carry two items.

## The baseline is DISCRIMINATING, not merely control-checked

It declares, per cell, whether the cell must be RED (failing before the work exists) or
GREEN (a scope guard, an attribution control, or a standing truth), and the run FAILS if
either set is wrong. That is the run #4 cycle-8 lesson applied: a baseline that only checks
its controls will ship a false PASS.

    RED at baseline (the work must turn these green)
      Q1 Q2 Q5      Q-8   the count claim is guarded, re-derived, and newly tested
      T1 T2 T3 T4   TS-5  D-46 exists, in grammar, stating both halves, routed to J-7
      T5 T6 T7      TS-5  REPORT.md's J-7 count and enumeration, and the stale section comment

    GREEN at baseline and after (controls, scope guards, standing truths)
      G1 G2         suite green >= 118; the CLI still runs
      Q3a Q3b       ATTRIBUTION: the sealed test file does NOT catch either mutation
      Q4            CONVERSE: a benign reword that keeps the number must not trip the suite
      Q6 Q7         README.md and src/corpus.js byte-identical — Q-8 is a guard, not a correction
      T8 T9 T10     Taste notes, Domain rules, and D-42..D-45 byte-identical
      S1 S2 S3      changed paths within the wave's three files; no src/bin/.github; the
                    report ARCHIVE is not rewritten
      C1..C8        eight instrument controls (see below)

## What the two RED cells for Q-8 actually measure

`Q1` mutates the README figure `24 distinct authors` -> `23` and requires the suite to die.
`Q2` retargets one corpus entry's author to a name used nowhere else (24 distinct -> 25),
leaves the README at 24, and requires the suite to die.

**Q2 is the cell that cannot be satisfied by a literal.** A test that compares the README
number against a hard-coded `24` passes Q1 and fails Q2, because under Q2's mutation the
README still says 24 and so does the literal. Only a figure re-derived from `src/corpus.js`
at run time separates them. That is the acceptance clause's real content, expressed as an
executable discriminator rather than as a code-reading opinion.

Both were MEASURED red on the clean tree: each mutation leaves the suite at 118 tests /
118 pass / 0 fail today. That independently re-confirms the cycle-10 finding that the new
claim landed outside every section-scoped digit-hygiene guard.

## Attribution, and an honest note about it

`Q3a`/`Q3b` re-run each mutation with `git show HEAD:test/readme-tags.test.js` substituted
into the arm — same tree, same mutation, only the test file's content differing. If Q1 kills
and Q3a survives, the kill is attributable to the new test rather than to a pre-existing one.

Honest note, recorded now rather than discovered later: at BASELINE these two cells are
redundant with Q1/Q2, because the sealed file and the working file are the same bytes. They
do not become independent measurements until the builder has changed the file. They are
still real measurements today — "the sealed suite does not catch this" is a fact, not a
vacuum — but their discriminating power is post-work only, and the baseline cannot exercise
it. Cycle 10's instrument defect #22 was a cell the baseline never handed any data; this is
the same limit named in advance instead of after.

## Instrument controls

    C1  MUST-DIE          the D-46 reader stays dead on a SPEC that lacks D-46
    C2  MUST-STAY-GREEN   the same reader does fire on a SPEC that has it
    C3  MUST-DIE          the suite parser sees a planted failing test (not a rubber stamp)
    C4  MUST-DIE          the README mutation applier really changes the file
    C5  MUST-DIE          the corpus mutation really moves the distinct-author count (24 -> 25)
    C6  MUST-NOT-OVERREACH  T5's "seven not six" reader is scoped to the J-7 bullet — a
                          neighbouring bullet saying "six" must not trip it
    C7  MUST-STAY-GREEN   every byte-identity reader can read its subject at all
    C8  MUST-DIE          the changed-path reader sees a planted untracked file, and stops
                          seeing it once removed

Two habits carried forward from earlier defects this run: the suite parser reads BOTH
`node --test` summary dialects (defect #14), and no cell parses `git status --porcelain` or
slices a fixed offset off git output (defect #22) — changed paths come from
`git diff --name-only HEAD` plus `git ls-files --others --exclude-standard`, neither of
which has a status column to mis-slice.

## Scope decisions the conductor made before dispatch, recorded as decisions

1. **`docs/report-history.md` is NOT a count site to repair.** It carries eleven stale J-7
   figures ("Four", "five", "Five"). It is the ARCHIVE of what past reports said, moved
   there under this run's own M-2 ("history MOVED not deleted"). Rewriting it would falsify
   the record of what was believed when. `S3` pins it byte-identical.
2. **The live count sites are exactly two**: `REPORT.md`'s `- **J-7**` bullet (the only
   J-7 count claim in the live report — measured, not assumed: grep for
   `behaviours\|behaviors` in REPORT.md returns lines 77 and 85, both inside that one
   bullet), and the `J-7` backlog record. The backlog is the conductor's file, not a
   builder's, and is updated at persist time.
3. **`T7` is conductor-added scope.** The section's HTML comment says the entries are
   "Carried forward verbatim from run #3", which stopped being true at cycle 8 when D-45
   was added and gets worse with D-46. It is the same decay class Q-8 exists to close, one
   layer down, and the builder is editing that exact section. Named here rather than
   folded in silently.
