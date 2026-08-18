# Cycle 8 — pre-dispatch seal (Q-3)

Written and committed BEFORE any builder was dispatched. The gate script and its
pre-fix baseline output live OUTSIDE this repo, under the SWARM root's `runs/`
directory, which builder agents are never given a path to (hard rule 5: workflow
agents receive target paths only). Only their sha256 digests are recorded here, so
the gate can be proven unchanged at verification time without the gate's content
ever being reachable from the tree the builder edits.

| artefact | sha256 |
|---|---|
| `SWARM/runs/cycle-008-q3-gate.mjs` (the gate) | `013ce7611745df5102d3af4392b04be38c66c613dedb71d5c9e509796eb9fbe4` |
| `SWARM/runs/cycle-008-verify-Q-3-BASELINE.txt` (its pre-fix output) | `dba3d7cc43b4df4b58889149e645b003fe5bc1067e91246a981f8db864b7cb0e` |
| `bin/aphorism.js` at seal time | `8c619e36a7550fa5621656455573a7f3118d540f7fe89408fb8fd497063e2ac9` |

Tree at seal time: `64a465f`.

## Baseline result — the gate discriminates before it judges

Run against the unmodified tree at `64a465f`, the gate FAILED exactly the two clauses
Q-3 alleges and PASSED all eight controls:

- **a1 FAIL** — `open=2 shut=1`. Same command, same arguments; the only variable is
  whether the stderr reader stays open. This is the discriminator from Q-3's notes,
  reproduced by the conductor rather than inherited from the agent that filed it.
- **b FAIL** — `status=1`. A non-EPIPE stderr write failure (stderr handed an fd opened
  `O_RDONLY`, so writes fail `EBADF`) is silently rewritten to exit 1, i.e. reported to
  a calling script as "no aphorism matched".
- **a2 PASS at baseline**, and this CORRECTS Q-3's acceptance clause. That clause asserts
  a closed stderr reader "crashes the process and Node's exit 1 replaces whatever code
  the run had earned". The second half is measured true (a1, b). The first half is
  measured FALSE: no raw stack trace is emitted on this path — Node exits 1 quietly.
  a2 is therefore a control that must STAY green, not a hole to be closed. Recorded
  before dispatch so the correction cannot be mistaken for a post-hoc rationalisation
  of whatever the builder produced.
- Controls c1–c6 green, suite 115/115 green.

A gate that failed nothing at baseline would prove nothing at verification.
