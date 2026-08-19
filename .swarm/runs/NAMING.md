# Artifact Naming Convention for `.swarm/runs/`

**Prefix each artifact with `runN-` where N is the run number.** Example: `run4-cycle-001-gate.mjs`, `run4-cycle-002-pre-manifest.json`.

## Why

The `.swarm/runs/` directory accumulates artifacts from multiple improvement runs. Each run restarts its cycle counter at 1, creating collision hazard: run #1's `cycle-001-gate.mjs` and a future run's cycle-1 gate would overwrite or shadow one another by sharing the same filename.

## The Convention

- **When writing artifacts**: prefix with `runN-` (e.g., `run4-cycle-003-my-artifact.json`)
- **Why the prefix appears at the start**: so a future conductor reads this file and applies the convention *before* naming their first artifact, preventing collision

## What's Here Now

Counted by the conductor at run #4, cycle 2. These numbers grow as a run writes, so
read them as a snapshot, not a constant.

- 418 files at the top level, 776 counting the two subdirectories (`c4/`,
  `cycle-006-qa-speconly/`)
- Runs 1–3: 399 top-level artifacts named `cycle-NNN-*` with no run prefix (e.g.
  `cycle-001-verify-J-1a.txt`, `cycle-002-baseline.mjs`, `cycle-004-seal.sha256`).
  These are the collision surface: every one of them is reachable by a cycle number a
  future run will also use.
- Run 4: 15 artifacts named `run4-cycle-NNN-*` (e.g. `run4-cycle-001-gate.mjs`,
  `run4-cycle-002-gate.mjs`)
- Four files predate the cycle-numbered scheme entirely (`taste-core-loop.txt`,
  `taste-list.txt`, `taste-server.log`, and this file). They are not renamed either.

## Limitations

This document cannot enforce the convention—only adherence by authors can. What makes it effective: run #4 followed it for all its own artifacts (visible above), and the next conductor will read this file *before* writing their first artifact. The convention survives by observation and conscious practice, not by automation.
