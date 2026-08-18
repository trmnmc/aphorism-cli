# Cycle 22 — sealed pre-commitment for T-016

Written BEFORE the builder is dispatched. The builder never sees this file.
Its purpose is to name, in advance, the ways this item can land looking correct
while being worthless, so the verification gate measures those risks instead of
being designed around whatever the builder happens to produce.

## Measured baseline (not inherited)

`.swarm/runs/cycle-022-baseline.txt`, run before dispatch:

    CTRL-PRISTINE  OK  tests=68 pass=68 fail=0
    C1    SURVIVED  68/68/0  :: Attribution "ranks all 50 entries" -> 49
    C2    SURVIVED  68/68/0  :: Attribution "8 are rated HIGH" -> 9
    C6    SURVIVED  68/68/0  :: Layout block names src/selektor.js, which does not exist
    C0    KILLED    68/67/1  :: CONTROL "37 distinct tags" -> 38 (a claim the suite DOES guard)

C0 is what makes the three survivals attributed rather than merely observed: the
mutation pipeline and the suite are provably live, and provably blind to exactly
these three claims.

Independently derived truths (conductor, this cycle):
- `corpus.length` = 50 — so README's "ranks all 50 entries" is TRUE today.
- `docs/corpus-attribution-triage.md` holds 50 rows, ids 0..49 distinct, risk
  bands HIGH 8 / MEDIUM 16 / LOW 26 — so README's "8 are rated HIGH" is TRUE
  today, and C2 is machine-parseable. The item's notes permit dropping C2 if
  parsing proves fiddly; it does not, so C2 stays in scope and dropping it would
  now need a reason I do not have.

## Risks this gate must settle

**R1 — prose-keyed assertions (the T-012 hazard).** The obvious implementation
keys the corpus-size check to the literal sentence "ranks all 50 entries by how
likely the attribution is to be wrong". A future docs cycle rewording that
sentence would make the guard go QUIET rather than fail. The gate will reword
every lead-in while leaving the digits intact and require the suite to stay
green, then reword AND falsify and require a kill.

**R2 — hardcoded expectations.** Every check here can be passed today by a test
that hardcodes 50, 8, and a literal path list. Such a guard catches a wrong
README but fires falsely on a CORRECT one the moment the corpus, the triage doc,
or the file layout legitimately changes — a false rejection a maintainer resolves
by deleting the guard, which is worse than never writing it. Only a
CONSISTENT-CHANGE check separates the two, and this gate will run one per claim:
change the real artifact and the README together and require GREEN, paired with
the same artifact change and a stale README requiring FAIL.

**R3 — tautological extraction (the T-009/F5 failure).** A Layout check that
extracts paths from the README, filters to the ones that exist, then asserts
they exist cannot fail. Same shape for a HIGH count read out of the README and
compared against itself. Every FAILABLE check below is also an R3 check: a
tautology cannot fail.

**R4 — collateral edits.** The item is scoped to `test/readme-tags.test.js`.
README.md, `src/`, `bin/`, `docs/` and the other test files must be byte-identical
to HEAD.

**R5 — vacuous pass on parse failure.** If an extraction regex stops matching,
the test must fail LOUD and name the parse as the cause, never pass silently.
The two tests T-015 added got this right and set the standard for this file.

## Commitments

- The gate's mutations will DIFFER from the builder's. Where the builder is told
  to prove failability, I will use the opposite direction or a different target:
  50 -> 51 (up, not down), 8 -> 7 (down, not up), and a different Layout path
  than the one the baseline used.
- Every claim proven twice per L-029: FAILABLE against its specific mutation, and
  ATTRIBUTABLE — the same mutation with the new tests filtered out must return
  exactly 68/68/0, the pre-cycle baseline.
- Controls: PRISTINE (unmutated copy at the post-item count), DENOMINATOR (the
  skip pattern removes exactly the new tests and no others), SKIP-SANITY (an
  unrelated mutation still fails under the same pattern), APPLIED (a mutation
  that silently fails to apply makes ATTRIBUTABLE pass vacuously).
- SCOPE.SCRATCH stays a standing control, and per KI-7's cycle-21 note the
  dispatch prompt will require removing the scratch DIRECTORY, not just its
  contents.
