# Cycle 5 — J-4 attempt 2, gate addendum

**VERDICT: PASS.** Raw v1 9/17 → re-authored v2 15/21 → re-authored v3 **22/22**.

**Every one of the 14 raw failing cells across v1 and v2 was MY OWN INSTRUMENT, not the
builder's work.** Zero real defects were found in attempt 2. That is a strong claim, so
this addendum states each correction and why it was a false alarm, rather than re-running
clean and reporting 22/22 as if the gate had been right the first time. A gate that
silently repairs its own failing cells is not evidence.

Files: `cycle-005-verify-J-4.txt` (v1, unmodified), `cycle-005-verify-J-4-v2.txt`,
`cycle-005-verify-J-4-v3.txt`. Scripts: `/opt/swarm/runs/c068-gate-J-4{,-v2,-v3}.mjs`.

## The seal held

The truth table (`c068-truth.mjs`) was built BEFORE the builder returned, from `test/`,
`src/`, `bin/`, `.git` and `.swarm/backlog.json` — all outside J-4's writable scope. It
could not be git-committed (SWARM `runs/` is gitignored), so it was bound a stronger way:
re-run after the builder finished, it reproduced **byte-identical hash
`6cfe3728b64b00d8b52c8fec0fac32bf2b990d54db719e581f689badfbd60115`**. That reproduction is
only possible if the ground truth never moved, which cell S1 independently confirms
(`git diff -- src bin test` empty).

## v1's 8 failures — all mine (window too narrow)

v1 exempted a stale claim only if a correction marker sat within ±2 lines. Attempt 1 had
used line-adjacent notes, so I encoded that as the method. **The builder used a better
one:** keep the historical passage verbatim, append one correction BLOCK after the whole
passage, covering every claim in it. v1 charged:

| cell | sites | why it was a false alarm |
|---|---|---|
| D1a, D1b, D1d | REPORT.md:163, :188, :484 | each sits in a passage whose correction block follows at :169–177, :205–212, :494–513 — 6 to 29 lines below, outside a ±2 window |
| D1a, D1b | REPORT.md:176 | a quotation *inside* a correction block, i.e. the note itself |
| D2a | REPORT.md:37 | a run #1 "80 tests" figure explicitly marked as a mid-run snapshot |
| D3a, D3b | REPORT.md:396 | corrected at :416–423, which even enumerates all three T-024a sites and names this one "the third and last" |
| A1 | REPORT.md:361, :395, :723, :945 | none describes the attributions as audited: :361 and :395 are *item titles for future work* ("human audit of corpus attributions"), :723 says "unaudited … HIGH, open", and :945 is the negative sentence "Neither file describes the corpus attributions as audited" — its negating clause wrapped to the next line, outside the window |
| A2 | REPORT.md:349 | the sentence is about **KI-1** being resolved before the run began; "KI-2" appears in the same line only as the start of the id range. Nothing softened KI-2. |

This is cycle 4's H2/H3/H4a/H6 false-alarm family repeating almost exactly — a lesson this
run has now paid for twice.

## v2's 6 failures — also mine (the reviewable ledger)

v2 fixed the window by requiring a correction block that TEXTUALLY NAMES the claim. It
then charged 17 sites in lines 807–930, which is
`## Claims corrected or flagged in this document (the reviewable diff)` — **the artifact
the acceptance criterion explicitly requires**: "the set of claims corrected or removed is
listed so the diff is reviewable." A corrections ledger works by quoting the claim it
corrects. Charging it would make the required deliverable unwritable. Also charged
REPORT.md:31, a row dated 2026-08-14 stating the build run shipped 48 tests — true at its
anchor, not a stale live claim.

v3 therefore exempts (a) the ledger section, with bounds computed from the headings rather
than hard-coded, and (b) figures carrying a date or commit anchor.

## Why v3's green is a measurement and not a loosened gate

Two exemptions were added, so two controls prove they are scoped:

- **X1** — a planted claim whose token no correction block names is NOT exempted
  (`uncovered-token exempted: false`), while a genuinely covered one is
  (`named-token exempted: true`). "Covered" means covered.
- **X2** — the ledger exemption is bounded to lines 807–931 as computed from the section
  headings; ordinary prose at line 163 remains chargeable; ledger line 870 is exempt.

Plus the pre-dispatch arm (`c068-gate-arm-pre.mjs`) recorded **4/4 detector families RED at
HEAD** before the builder started — the holes were open and the instrument could see them.

## Independent hand checks, outside the gate

Because the gate needed two rewrites, its green was not accepted alone:

- `git diff README.md` in full: **exactly one wording edit, no number changed** — the
  duplicated singleton-tag sentence reworded to "0 tags appear exactly once, which is to
  say 0 tags sit on exactly one entry". Both phrasings deliberately survive because
  `test/readme-tags.test.js` guards them as two independent claims; suite still 101/0
  confirms neither guard broke.
- `REPORT.md:64` now reads `# prints its own test/pass/fail totals` — the D-2 non-pinning
  route actually landed in the live instruction, not just in the ledger.
- The ledger carries **27** numbered entries.
- The three counts the builder corrected beyond the named defects were re-derived from the
  sealed truth, not accepted: commits **122**, backlog **18 (12 done, 4 todo, 1 blocked,
  1 dropped)**, known issues **20**. All three match (cells X-commits, X-backlog,
  X-knownissues).

## Residual honesty notes

1. **Cell A4 passed for the wrong reason.** Its numbered-entry regex expected `**N**` and
   the ledger uses `N. **…`, so it reported "0 numbered entries" and passed on its
   heading-present fallback. The underlying fact is independently verified above (27
   entries), but the cell as written is weak and should not be reused as-is.
2. **The builder's six disclosed UNCERTAIN items were read and none changes the verdict.**
   The most consequential is #5: REPORT.md's "disagreed on four entries (#38/#39/#45/#48)"
   sits beside the triage doc's own "four notes where they did NOT agree" (#45/#25/#6/#4-8-9).
   Both are separately true of different comparisons, and the builder declined to harmonise
   them because that would mean rewriting a run #1 finding rather than reconciling a count.
   I agree with the call; it is **filed as a follow-up, not charged**.
3. **No claim is made that every integer in REPORT.md is now true.** What is verified is:
   the three named defect families are closed at every occurrence, the four additional
   count families the builder corrected re-derive true from the sealed truth, and the
   acceptance clauses (audited-language, KI-2 open/high, cmd_parse left honest, reviewable
   list extended, scope held, suite green) all hold. A 796-line document is not exhaustively
   proved by 22 cells.
