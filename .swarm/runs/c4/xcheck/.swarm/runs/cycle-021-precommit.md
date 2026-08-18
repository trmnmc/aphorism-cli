# Cycle 21 — sealed pre-commitment (T-015)

Written BEFORE the builder was dispatched. The builder never sees this file. Its purpose is
to make the gate a measurement rather than a reading: predictions written in advance can be
refuted by the diff, predictions written afterwards cannot.

## Measured blindness (conductor, pre-dispatch)

Harness `.swarm/runs/cycle-021-baseline.js`, evidence `.swarm/runs/cycle-021-baseline.txt`.
Whole-repo-minus-.git scratch copies, TAP reporter, PRISTINE control fired first at 66/66/0.

| id | claim mutated | verdict |
|---|---|---|
| A9 | line 55 `16 tags appear on 2 or more entries` -> 15 | SURVIVED |
| V6 | line 55 `the remaining 21 appear on exactly one entry` -> 22 | SURVIVED |
| A10 | line 57 `4 tags have a robust pool (5+ entries)` -> 6 | SURVIVED |
| A11 | line 65 `12 tags appear 2–4 times` -> 11 | SURVIVED |
| V6b | CONTROL line 81 `The remaining 21 tags appear exactly once` -> 22 | KILLED |
| C0 | CONTROL line 55 `contains 37 distinct tags` -> 38 | KILLED |

The two controls are what make the four survivals ATTRIBUTED rather than merely observed:
the README->corpus number guards are provably live, and provably blind to exactly these four.
V6/V6b is the sharpest pair in the run — the SAME integer (21) stated twice in the same
section, guarded in one phrasing and unguarded in the other.

Corpus ground truth, conductor-computed this cycle: 50 entries, 37 distinct tags,
16 tags with count >= 2, 4 tags with count >= 5, 12 tags with count in [2,4], 21 tags with
count == 1. Every number the README currently states is TRUE today.

## Predicted shape of an honest fix

1. The two BAND-HEADING cardinalities (A10, A11) are the easy half: each heading already
   carries its band bounds in digits, and `extractBandTablesFromReadme` (added at cycle 20)
   already parses them and already collects that table's own rows. The claimed cardinality
   is the integer immediately preceding the word `tag`/`tags` in the heading line. Expect it
   checked against BOTH the corpus-derived band membership count AND the table's row count.
2. The two PROSE claims (A9, V6) sit in one sentence on line 55 and have no table to lean on.
   Expect a claim parser that pairs an integer with a band predicate derived from that clause.
3. Expect a COVERAGE/sanity assertion in the T-014 mould (`bands.length > 0`) so that an
   unparsed claim fails LOUD rather than going quiet — this is the T-012 hazard the item's
   own notes flag, and loud false-rejection is the safe failure direction (cycle 20, T-018).

## Named risks — to be refuted or confirmed by the diff, not by the agent's report

- **R1 — prose-keyed extraction.** The fix keys to a literal lead-in ("They are not evenly
  distributed:", "have a robust pool") so rewording silences it. This is the exact defect
  cycle 18 removed in T-012 and the item's notes forbid it. Gate check: reword every
  lead-in with digits intact and require the suite to stay GREEN, and separately require a
  wrong number under the reworded prose to still KILL.
- **R2 — hardcoded expectations.** The fix asserts literal `16`/`4`/`12`/`21` rather than
  deriving them from `corpus`. That passes today and silently rots the moment T-007
  (retagging, live on the backlog) lands. Gate check: mutate the CORPUS instead of the
  README and require the new assertions to fire.
- **R3 — tautological extraction.** The T-009 failure mode (cycle 17, F5): the parser
  filters claims down to the ones that already match and then asserts they match, so it can
  never fail. Gate check: every new assertion must be individually failable AND attributable.
- **R4 — collateral edits.** Pre-existing tests or helpers quietly altered. Gate check:
  `git diff` must show insertions to `test/readme-tags.test.js` only, with every
  pre-existing test and helper byte-identical, and zero product files touched.

## Gate mutations the builder will NOT be told about

The builder is given the four failability targets by ID and description. The gate will use
DIFFERENT concrete numbers and, for at least one claim, a DIFFERENT direction of error, plus
the R2 corpus-side mutation, which no acceptance clause mentions.
