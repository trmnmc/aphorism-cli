# cycle-014 verification gate — commit-reveal seal

**Item:** R-2 — Reconcile every J-7 behaviour-count claim in REPORT.md against the backlog (K-4 regression)

**Gate file:** `cycle-014-gate.mjs`
**sha256:** `f3fb4648d979847f9ad14c2bfb2ade514facf1e341b3941e81b3baf7c39fa414`

This commit is made **before any agent is dispatched**. The hash above is the seal; the gate's
own pre-repair output is committed alongside it as `cycle-014-gate-baseline.txt`.

## Where the gate file is during the dispatch window, and why

The gate script is **not in this repository** while the builder is running. It sits under
`SWARM/runs/`, and it is copied into `.swarm/runs/` only after verification completes.

Cycle 13 committed its gate into the target repo before dispatch and relied on a prompt-line
prohibition ("do not attempt to locate, read or infer the check") to keep builders out of it.
That is an instruction, and an instruction is only as good as the agent's compliance. Workflow
and Agent dispatches receive target paths only and never SWARM paths (hard rule 5), so a gate
held under `SWARM/runs/` is **structurally unreachable** to the builder rather than merely
forbidden to it. Structural unreachability is strictly stronger, and it costs nothing: the
hash is sealed here at the same moment, so the tamper-evidence property that motivated cycle
13's in-repo commit is fully preserved.

Verify after the fact with:

```
sha256sum .swarm/runs/cycle-014-gate.mjs   # must equal the hash above
node .swarm/runs/cycle-014-gate.mjs        # re-runs the same checks against the tree
```

## Baseline on the unrepaired tree

`PASS 4 / FAIL 8 / REVIEW 1 / UNPARSEABLE 0` — full output in `cycle-014-gate-baseline.txt`.

The baseline is the evidence that the gate **can** fail, which R-2's acceptance clause
requires. It is reproducible: the gate reads only committed files and shells out only to
`git`, so re-running it against this commit regenerates the same output. This deliberately
follows the cycle-7 remedy — a sealed check plus a *reproducible source* for the baseline,
rather than a sealed nondeterministic measurement whose hash nobody can ever re-check.

## The four cells that are GREEN in the baseline

C1–C4 are **converse controls**, and they pass before the repair as well as after. They are
the cells a careless global `s/two/five/` would break:

- **C1** — T-040 genuinely has *two* judgment calls; that "two" must survive.
- **C2** — the cycle-4 provenance line "behaviours (1) and (2) measured" is a correct
  historical statement about J-6's scope and must survive.
- **C3** — non-destruction vs `HEAD`, measured by `git diff --numstat`, not by a remembered
  line count.
- **C4** — every `#`/`##` heading present at `HEAD` survives (the J-7 heading is excluded; it
  is A1's subject).

A gate whose every cell goes red before and green after is a snapshot test. These four carry
the discriminating power.

## Three-state cells

R-2's acceptance sanctions **two** repairs per site: correct the count to five, or explicitly
re-label the site as a dated history claim. A binary matcher cannot separate an honest re-label
from a stale claim without reading English, so each site cell reports PASS / **REVIEW** / FAIL.
REVIEW means the count is stale but a dating token sits within ±2 lines, and **the conductor
adjudicates that cell by hand and records the reasoning**. A REVIEW cell is not a pass; an
unadjudicated REVIEW is an open cell.

The baseline's one REVIEW cell is A5.0, the backtick-quoted backlog title at line 1304.

## Instrument defect found in this gate during the baseline read, recorded now

`OBS-1` did not fire, and it should have. Its anchor regex requires
`This heading, and the executive summary line pointing at it, read` on a single line; the
sentence wraps in REPORT.md between "line" and "pointing", so the match silently failed.

This is the **ninth instrument defect of the run and the same family as cycle 12's A6** — a
prose regex defeated by a line wrap. It is recorded here rather than quietly repaired because
the baseline it appears in is now sealed. It carries **no verdict weight**: OBS-1 is an
OBSERVE-only cell by construction and can move no cell state. The observation it was meant to
surface was confirmed by hand instead, and is written up in the cycle-14 journal block.
