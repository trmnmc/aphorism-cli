# cycle-3 gate seal — item P-3 (bidirectional doc-claim audit)

Committed to the TARGET repo **before any agent ran**, so the seal is tamper-evident.
The gate program itself is held OUTSIDE this repo, under `SWARM/runs/c003-gate-P-3.mjs`
(cycle-14 precedent: hard rule 5 forbids workflow agents SWARM paths, which makes the
gate *structurally* unreachable to a builder rather than merely forbidden to it).

    sha256(SWARM/runs/c003-gate-P-3.mjs) = d94a42e657612d5db51a538d2fcbccefbec0e61cf654c797ef5932b4b92b1078

## Pre-dispatch baseline of the gate (the gate is a program and needs its own baseline)

First run: **8 PASS / 3 FAIL**. Two of the three FAILs were INSTRUMENT DEFECTS in the
gate, not findings about the tree, and both were calibrated away *before* dispatch:

- **G1** — I had written a non-vacuity floor of `>= 15` citations. The docs contain 13.
  An arbitrary magic number, wrong against reality. Floor lowered to `>= 10`.
- **G9** — I assumed `#N` in `docs/corpus-attribution-triage.md` was a 1-based corpus
  index. It is **0-based** (`#0` is Knuth / "Premature optimization"). Rather than flip
  the constant, the cell was rewritten to *derive* the convention from the tree and to
  bind every risk-table row to the corpus entry it names (index -> author AND text
  prefix), which is a strictly stronger check than range-testing an integer.

The third FAIL, **G11**, is the dispatched inventory's completeness cell and correctly
reads NOT RUN until an inventory exists.

Calibrated baseline: **10 PASS / 1 FAIL (G11 not-run)**.

## Failability controls

A cell that cannot fail is not evidence. Four cells were mutated and each turned RED,
against a converse run in which all ten are GREEN:

    --mutate G1  => G1 RED   (injected an unresolvable src/select.js:99999 citation)
    --mutate G3  => G3 RED   (perturbed one measured tag count by +1)
    --mutate G6  => G6 RED   (falsified the broken-pipe exit-0 observation)
    --mutate G7  => G7 RED   (injected a phantom flag into the args.js flag set)

## What the gate does NOT cover, stated before the fact

The ten mechanical cells cover citations, links, tag tables and prose counts, folded tag
names, exit codes, the flag set in three places, the coverage headline fraction, the
attribution-table bindings, and the P-5 floor. They do **not** cover free prose claims
that no program can resolve — that is exactly the surface the dispatched inventory is
for, and every claim it returns is re-measured by the conductor at the gate.
