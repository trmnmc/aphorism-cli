# aphorism-cli — run retro

SMOKE run, 2026-08-14, 1 cycle. Purpose was pipeline validation, not product depth; read
every entry below as "what the machinery did", not "what the product became".

## What worked

- **Splitting the wave on a purity boundary rather than a feature boundary (cycle 1).** T-001
  (corpus+select) and T-002 (args) shared no module, so two concurrent builders needed no
  dependency ordering and no worktrees. Both merged clean, zero reverts, zero failed verifies —
  a clean k=2 wave.
- **The conductor holding the integration layer as a third scope (cycle 1).** `bin/aphorism.js`
  and `test/cli.test.js` were written by the conductor while the builders ran, so wiring cost
  no wall-clock and the end-to-end tests were authored by someone who had not written the
  modules under test.
- **Writing e2e tests before the modules existed (cycle 1).** `test/cli.test.js` was committed
  while T-001 was still in flight. It failed loudly at first run and then passed unchanged —
  which is exactly the signal a test written after the fact cannot give you.
- **Conductor-authored verification catching what self-reports missed (cycle 1).** Both
  builders reported green and both were telling the truth about their own files. Running the
  *spec's documented* `test_cmd` is what exposed it as broken. The gate earned its keep.

## What thrashed

- **Nothing thrashed in the build.** Zero items hit `attempts >= 1`, zero merges reverted, zero
  findings discarded, zero dead agents.
- **The environment thrashed, not the work (cycle 1).** Four capabilities were denied in
  sequence — `settings.json` write, `gh`, `systemctl`, `swarm-budget.sh` — each costing a
  round trip to discover. All four are documented headless conditions; none was fatal; but they
  were found one at a time by hitting them.
- **Real cost: no remote.** The denied allowlist edit meant no `gh repo create`, so two commits
  sit local-only. This is the one place a denial produced a user-visible gap rather than a
  logged no-op.

## Pacing honesty

Pacing was `full`, gear pinned 5, per SMOKE. The budget probe **never ran** —
`bin/swarm-budget.sh` is not on the Bash allowlist in a headless session — so
`probe_failures` = 1 and every burn figure in the runfile is a zero placeholder, not a
measurement. Because `full` ignores ρ, this changed no decision this run. On a real
overnight run under `thermostat` it would have mattered: the gear would have cruised at 3 on
no evidence all night.

## Config recommendations

- L-CAND: on a SMOKE run, dispatch the build wave before writing state/backlog/journal —
  builders are the long pole and bookkeeping fills their latency for free.
  [apply: process] [source: aphorism-cli 2026-08-14 cycle 1]
- L-CAND: split concurrent build waves on module-dependency boundaries, not feature
  boundaries — a dependency-free split removes ordering constraints between builders and is
  what makes no-worktree headless dispatch safe. [apply: prompt:builder]
  [source: aphorism-cli 2026-08-14 cycle 1]
- L-CAND: the conductor should run the spec's literal `test_cmd` string at least once per
  run, not just per-file test commands — a `test_cmd` that does not execute is invisible to
  builders who self-test file by file. [apply: process]
  [source: aphorism-cli 2026-08-14 cycle 1]
- L-CAND: probe the headless capability surface once at kickoff (settings write, `gh`,
  `systemctl`, budget probe) instead of discovering each denial mid-cycle.
  [apply: process] [source: aphorism-cli 2026-08-14 cycle 1]

**These are NOT written to `SWARM/playbook/learnings.md`** — SMOKE runs never touch the
playbook (SKILL.md SMOKE mode + `swarm-playbook.sh --smoke` exit 3, double-locked). They are
recorded here only, for a human to promote by hand if any is worth keeping.

## House-rules proposals

- The kickoff spec-confirmation gate has no defined behaviour for a non-interactive session.
  This run proceeded under stated assumptions with the taste critique printed but unanswered,
  which is defensible for a throwaway SMOKE target and would **not** be defensible for a real
  overnight run. Worth an explicit rule: either SMOKE formally waives the gate, or headless
  kickoff refuses.

## Applied lessons check

`runfile.playbook` is absent — the playbook is disabled in both directions on SMOKE runs, so
no lessons were staged, applied, or vetoed. Nothing to check.
