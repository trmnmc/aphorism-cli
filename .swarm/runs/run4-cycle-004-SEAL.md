# run #4 cycle 4 — pre-dispatch seal

Committed to this repo **before any agent ran**. The gate file itself is deliberately
NOT here: it is held at `SWARM/runs/run4-cycle-004-gate.mjs`, which hard rule 5 makes
structurally unreachable to a builder (workflow agents receive target paths only), per
the run #3 cycle-14 decision that a structural fence beats a prompt-line instruction.
The hash below is the tamper-evidence; the gate file is copied in after verification and
re-hashed against it.

    run4-cycle-004-gate.mjs      sha256  dc077828d236464b65cbe0e5b9da9e5736da30b009ac26539762442195a95b07

Dispatch item: **N-5** (M-4 hand-off). Tree at seal time: `60c71d331253fa4ccfc90682fc6796e6dabe973e`.

## Discriminating baseline — the gate run against the UNFIXED tree

Full output: `run4-cycle-004-baseline.txt`. **9 PASS / 5 FAIL of 14.** The five FAILs are
exactly N-5's scope, and every control and standing check already passes, so a green
result after the wave cannot be an artefact of a gate that passes everything:

| cell | baseline | what it measures |
|---|---|---|
| A2  | FAIL | R-1's row still reads "todo, not yet done or explicitly declined" |
| A3  | FAIL | TS-1 and TS-2 carry no next actor of their own (collapsed into one shared row) |
| A5a | FAIL | TS-1 and TS-2 entries are 7 chars — no settling evidence |
| A6  | FAIL | section claims "2 in flight"; backlog.json says 1 |
| A7  | FAIL | settling evidence is deferred: "search it for the item's id" |
| A0 A1 A4 A5b A8 A9 C1 C2 C3 | PASS | controls + standing checks, green before and after |

## Two gate bugs found by that baseline, both fixed BEFORE sealing

The standing lesson on this repo is that a gate is a program and needs its own baseline,
not confidence. It earned that again, twice, in one cycle:

1. **C3 crashed.** It assumed a `package.json`. This repo has no manifest at all — the
   absence of manifest, lockfile and `node_modules` *is* the zero-dependency proof. A
   cell that throws is not a FAIL, it is a gate that cannot report.
2. **A4 false-positived on J-7.** The agent-wording test ran a bare `/\bswarm\b/` over
   the row, and J-7's honest text cites the path `` `.swarm/SPEC.md` ``. A4 asks who the
   *prose* says owns the item; a filename is not prose. Inline code spans are now
   stripped before the test. Without this fix A4 would have failed against every correct
   answer as well as every wrong one — the defect class this repo files as
   "instrument that cannot distinguish its cases".

Fixing a gate BEFORE it has run on the work is repair; editing it after is destroying the
evidence of what it measured. Both fixes are pre-seal and are inside the hash above.

## R-1 was settled BEFORE this dispatch, deliberately

R-1 is DECLINED (`backlog.json` → `decline_reason`, measured this cycle by
`run4-cycle-004-r1probe.mjs` 7/7 and `run4-cycle-004-r1attrib.mjs` 4 PASS + a 4/4
adjudication of its one instrument defect). Sequenced first so the builder writes the
hand-off against a settled board rather than one that moves underneath it — the standing
staleness hazard this repo has now measured seven times.
