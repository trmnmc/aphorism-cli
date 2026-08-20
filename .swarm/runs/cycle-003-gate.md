# Cycle 3 sealed verification gate — Q-7

SEALED at 2026-08-20T18:15Z, BEFORE the builder was dispatched. The builder never sees this
file. Cells are authored by the conductor from ground truth it measured itself (the CI logs in
`.swarm/runs/cycle-003-ci-4b63e91.log`), not from the backlog's acceptance text and not from
anything the builder will report.

## Ground truth measured by the conductor before dispatch

- CI run `32400996331` ran at commit `4b63e9124de935be9996b01267a9f49487f937ff`, conclusion
  `success`, created 2026-08-20T18:02:41Z. It is the most recent full-matrix run against a
  commit that actually changed `src/`, `bin/`, `test/` or the workflow — which is the
  selection rule the README section states for itself.
- The NEXT commit, `2014bb9` (run `32401050374`), touched only `.swarm/`, so it is NOT an
  eligible citation under that stated rule even though it is more recent.
- Per-major results in run `32400996331`, all four identical:
  `v18.20.8`, `v20.20.2`, `v22.23.2`, `v24.19.0` — each `124 tests, 122 pass, 0 fail, 2 skipped`.
- The 2 skips are exactly the two guards in `test/node-support-citation.test.js`, skipping
  with `cited base commit 2b003ea is not reachable in this checkout (this is a shallow clone)`.
- Node 18/20/22 print `# tests`; Node 24 prints `ℹ tests` (U+2139). The reporter split holds.

## A — invariants (Q-5). Any FAIL reverts the commit.

- A1  `sha256(src/corpus.js)` == `77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e`
- A2  `sha256(node bin/aphorism.js --help)` == `d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64`
- A3  `package.json` declares no dependencies and no devDependencies (byte-identical to HEAD)
- A4  `git diff 4b63e91..HEAD -- src bin test .github` is EMPTY. This is the load-bearing
      anti-cheat cell: it proves the builder closed the RED by re-citing, NOT by editing the
      guard, the pathspec, or any source under the cited paths.
- A5  `sha256(test/node-support-citation.test.js)` is byte-identical to its blob at `4b63e91`.
      "Never bought by narrowing the pathspec or relaxing the assertion", stated as bytes.

## B — the claim

- B1  `node --test test/*.test.js` on this full clone: `fail 0`, `tests >= 121`.
      EXPECTED exactly `tests 124 / pass 124 / fail 0 / skipped 0` — on a full clone the cited
      base is now reachable, so both guards must PASS, not skip.
- B2  That test FILE run alone: 2 pass / 0 fail / **0 skipped**. Attribution pinned to the file.
      A SKIP here is a FALSE GREEN and fails this cell — the whole point is that the guard
      actually evaluated the diff rather than standing down.
- B3  Parsed independently by the conductor (own parser, not the test's): the section names
      exactly ONE backtick-quoted `git diff <base>..<target> -- <paths>` command; its base is a
      prefix of `4b63e9124de935be9996b01267a9f49487f937ff`; its pathspec is exactly
      `src bin test .github`.
- B4  The cited Actions run id resolves via `gh` to a run whose `headSha` starts with the cited
      base and whose `conclusion` is `success`. (The test cannot check this; the conductor can.)
- B5  The four matrix rows report that run's REAL numbers, verbatim from the CI log:
      v18.20.8 / v20.20.2 / v22.23.2 / v24.19.0, each `124 tests, 122 pass, 0 fail, 2 skipped`.
      Any invented or rounded number fails this cell.
- B6  Exactly one such `git diff` command remains in the section — no leftover reference to
      `2b003ea` anywhere in README.md.
- B7  Count debt PAID IN THIS CYCLE, not declared: `docs/node-support-citation-history.md`
      gains a dated entry naming run `32400996331` / commit `4b63e91` and what retired the
      previous citation, and `git diff HEAD -- docs/node-support-citation-history.md` shows
      ADDITIONS ONLY — zero deleted lines. The archive of what past reports said is never
      rewritten.
- B8  No stale "reached run 32337875271" claim survives in README.md.

## C — controls. Each is run in a scratch worktree, never against the live tree.

- C1  KILL: rewrite the cited base to `23eaf9b` (a real, reachable, WRONG commit) →
      the citation guards must FAIL loudly, naming the base. Proves B1/B2's green is a
      property of the citation being CORRECT, not of the guard being dead.
- C2  KILL / reproduce-the-RED: restore README to its state at `2014bb9` (base `2b003ea`) →
      the guards must FAIL 2/2 on this full clone, reproducing exactly the failure cycle 2
      committed knowingly. Proves the repair is what closed it.
- C3  MUST-LIVE: a benign reword of unrelated prose inside the same section leaves the guards
      GREEN. Proves the instrument does not die on every edit (the D1/D3/E3 false-rejection
      direction).
- C4  HONEST-HOLE control, expected to show the gate is SILENT: change one matrix cell
      (`122 pass` -> `121 pass`) and confirm NOTHING in the suite fires. This does not fail
      Q-7 — Q-7 does not claim to cover it. It MEASURES the hole Q-3 exists to close, and its
      result is reported as an unfixed column rather than left implied.

## Disposition rule

Any A cell FAIL -> revert the merge before the cycle commits (hard rule 4), item -> todo,
attempts+1. Any B cell FAIL -> item -> todo, attempts+1, escalate one rung (sonnet -> opus).
C1/C2 failing to fire, or C3 firing, means the instrument is not trustworthy and B1/B2 are
withdrawn regardless of their own result. C4 has no pass/fail — only a measurement to report.
