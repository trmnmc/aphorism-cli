# GATE CRITERIA for J-3 — authored cycle 3, AFTER dispatch but BEFORE any result returned

Timestamp of authoring: 1786961594 (2026-08-17T10:13:14Z). The builder was dispatched at
~10:12Z and cannot have returned. Recording the criteria now is what stops them being
shaped by the findings they are meant to judge.

J-3's cells cannot be pre-instantiated the way J-2b's could: J-2b had a fixed, known target
(the band code) so its mutations were authorable in advance, but J-3's deliverable IS a set
of measurements, and which mutants it reports is not knowable before it reports them. What
IS authorable in advance is the standard each returned claim must meet. That is this file.

## The claim shapes J-3 can return, and what each must survive

### Claim A — "mutant M SURVIVED the suite" (i.e. a coverage hole)

1. **Re-measure it myself.** I plant M in my own throwaway copy from a clean checkout and
   run `node --test test/*.test.js`. I do not run the builder's harness, and I do not read
   its verdict as a result. If my copy disagrees with its transcript, the builder's number
   is discarded.
2. **Non-vacuity — the witness must be real.** The builder must show that M actually changes
   user-facing behaviour. I re-run that witness myself against the mutant binary. A mutation
   that no input distinguishes is a NO-OP, and a no-op reported as a coverage hole is a FALSE
   FINDING — it must be scored as a defect in the return, not as a discovery.
3. **P0 control.** The builder's own unmutated copy must be green in its transcript. Absent
   or red → every cell in that batch is unscored, exactly as my own J-2b harness was
   worthless until its P0 went green.

### Claim B — "test T was added, and it kills mutant M"

1. **Failable.** I run T against a copy carrying M: it must go RED. A test that passes with
   and without its mutant protects nothing, and adding it is a suite-inflation FAILURE of
   this item rather than partial credit.
2. **Attributable.** The failure message must name the rule T protects. The band-side
   measurement earlier this cycle is the cautionary case: gate cell A2 went RED and looked
   like coverage, but the test that fired was an unrelated tag-name census while every guard
   I cared about passed. RED is not attribution. I extract the failing test NAME per cell,
   not just the exit code.
3. **Sound on green.** T must pass against the PRISTINE repo. A new test that is red on
   unmutated main is a broken test, not a strict one.
4. **Not already covered.** If the suite already killed M before T existed, T is padding.
   I verify by running the pre-J-3 suite against M — the pre-dispatch commit is caa3292.

### Claim C — "all mutants killed, no tests added"

This is an explicitly sanctioned SUCCESS and I must not treat it as a no-value cycle. It
still has to clear Claim A's bars: the mutants must be real (witnessed) and the kills must
be re-measured by me on at least a sample. A builder that reports "all killed" without
witnesses has measured nothing and returns to todo — the honest outcome and the unearned
one look identical in the summary line, and only the transcripts tell them apart.

## Standing checks, independent of what is claimed

- **Scope.** `git diff --name-only` must show ONLY test/select.test.js, test/args.test.js,
  test/cli.test.js (plus .swarm/runs/ evidence). Any touch to src/ or bin/ FAILS the item
  outright — this is a test-hardening item on a shipped product, and a builder that edited
  the product to suit a test has inverted the item.
- **Full suite.** `node --test test/*.test.js` green on merged main, run by me, after both
  builders' work is in. Neither builder ran the full glob by instruction, so NEITHER has
  seen the merged state — I am the first to run it and cannot delegate that.
- **Determinism.** Any added test touching the unseeded draw must be seeded or
  distributional. I re-run the suite 3x; a count that moves between runs is a flake and the
  test goes back regardless of how good the finding behind it is.
- **No hardcoded derivables.** Scan added tests for digit literals matching corpus figures
  (50, 12, 14, 8...). Index/arity/radix literals are fine; a corpus figure is not.

## What I will NOT accept as evidence

The builder's own summary prose. Its self-run test output pasted into the return. "The
mutation is clearly equivalent." A verdict with no transcript path. Per hard rule 2 every
field in that return is a CLAIM until I have run something myself.
