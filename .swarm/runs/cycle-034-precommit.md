# Cycle 34 — sealed pre-dispatch prediction for T-029

Written and sha256-sealed BEFORE any agent is dispatched. The builder cannot see
this file. Its purpose is to convert "I read the fix and agree with it" into a
measurement: anything below that turns out wrong measures ME, not the agent.

## What the baseline actually established (.swarm/runs/cycle-034-baseline.txt)

Suite is 78/78/0 pristine. Against HEAD:

| cell | shape | HEAD |
|---|---|---|
| B0 | pristine | GREEN |
| B1 | HIGH: TRUE 8 then contradictory 9, different clause | **GREEN (silent)** |
| B2 | HIGH: FALSE 9 first, TRUE 8 second (mirror of B1) | RED, names 9 |
| B3 | HIGH: "8 are rated HIGH and 9 are rated HIGH", SAME clause | **GREEN (silent)** |
| B4 | HIGH: single false 9 | RED, names 9 |
| B5 | HIGH marker deleted | RED, parse-miss message |
| B6 | entries: TRUE 50 then contradictory 51 | **GREEN (silent)** |
| B7 | entries: single false 51 | RED, names 51 |

Three findings the filed item did NOT contain, all recorded here before dispatch:

1. **B3 — the hole is per-OCCURRENCE, not per-clause.** T-029's own hypothesis
   says "collect EVERY binding the section offers". `extractNearestPrecedingCount`
   splits on dashes and calls `clause.search(marker)`, which finds only the FIRST
   marker occurrence in each clause. A fix that iterates CLAUSES instead of
   OCCURRENCES closes B1 and leaves B3 silent — the same defect, one scope down.
2. **B6 — the hole is not the HIGH claim's, it is the shared helper's.** C1
   (`entries`, vs corpus.length) uses the identical helper and is identically
   silent. The item's acceptance names only the HIGH-count claim.
3. **B2 is a live discriminator, not a hypothetical one.** The acceptance
   disqualifies first-match AND last-match. First-match is what HEAD does and B2
   is where it succeeds; a last-match fix binds the TRUE 8 in B2 and passes a
   self-contradicting README silently. So the disqualification can be MEASURED
   rather than argued, by building the last-match arm myself.

## Predictions (the part that can be wrong)

- **P1.** The fix in T-029's hypothesis — collect every binding, require ≥1,
  require all to equal the derived truth — closes B1, B3 and B6 and keeps B2,
  B4, B5, B7 RED and B0 GREEN. Confidence: high for B1/B6, **medium for B3**,
  because B3 only closes if the implementation scans occurrences rather than
  clauses, and the natural minimal edit to this helper is a clause-level one.
- **P2.** The all-bindings rule BUYS A NEW LOUD FALSE REJECTION, and it is not
  exotic. A README reading "… — 8 are rated HIGH — … Of those, 3 HIGH entries
  name a primary source." has every claim TRUE, but yields bindings [8, 3]
  because the second occurrence's nearest preceding digit run is 3, not 8. I
  predict this cell (P-FALSEREJ) is GREEN on HEAD and **RED under any correct
  fix**. I predict it is unavoidable without a new English anchor, and that it
  is therefore the right trade rather than a defect: it fails LOUD, which is the
  direction this run has classified as safe eight times (T-018 c20, T-020 c22,
  T-023 c25, T-026 c29, T-027 c30), where B1/B3/B6 fail SILENT, which is the
  class this improvement run was chartered to remove.
- **P3.** A LAST-match arm (F_LAST) turns B2 GREEN while keeping B1 RED — i.e.
  it does not fix the defect, it relocates it. I will build F_LAST myself and
  measure this rather than asserting it from the acceptance's say-so.
- **P4.** No fix confined to `extractNearestPrecedingCount` can change any test
  outside C1/C2, so cells B0–B7 plus the full 78-test suite are a sufficient
  regression surface; I predict zero collateral failures in the other 76 tests
  under any arm that passes P1.

## Named refutation conditions

This seal is REFUTED if any of the following is measured:

- a fix closes B1, B3 and B6 while leaving B2/B4/B5/B7 RED and B0 GREEN **and**
  keeps P-FALSEREJ GREEN (P2 wrong — a fix exists with no new false rejection);
- F_LAST does NOT turn B2 green (P3 wrong — the disqualification is not what I
  think it is);
- any arm passing P1 breaks a test outside C1/C2 (P4 wrong).

## Scope ruling made in advance, so it is not a post-hoc rationalisation

T-029's acceptance names the HIGH-count claim only. I am authorising the fix to
land in the SHARED helper and therefore to close B6 as well. Cycle-8 boundary:
widening is principled when the identical defect sits in the same edit at zero
additional risk, and artificial when it needs new machinery. B6 is the same
defect, in the same function, on the same call path, caught by the same cells —
no new machinery. The opposite call would leave a known silent hole standing in
the very function being opened to remove that defect class.
