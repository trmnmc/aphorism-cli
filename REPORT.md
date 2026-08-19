# aphorism-cli — report

A tiny, zero-dependency Node.js CLI that prints one attributed programming aphorism —
`fortune(6)` for programmers, quiet and pipeable. This page is the current status in one
screen. The complete forensic history behind it — four SWARM runs, 1578 lines, every
correction and every dated claim, moved verbatim rather than summarized — lives in
[`docs/report-history.md`](docs/report-history.md).

## What ships

- **Run it:** `node bin/aphorism.js` — no install step, no `package.json`, zero runtime
  dependencies. Node plus this repo is the whole requirement.
- **Corpus:** 50 curated aphorisms in `src/corpus.js` (text, author, tags) — 24 distinct
  authors, 12 tags, smallest pool 3 entries / largest 14.
- **Flags:** `--author <name>` (substring match, case-insensitive), `--tag <tag>`
  (whole-tag match, case-insensitive, AND with `--author`), `--seed <n>` (deterministic
  for any value `Number()` parses to non-NaN, including `Infinity`/negatives/fractions),
  `--list` (print the filtered set, one per line, corpus order), `--json` (single-line
  JSON; newline-delimited with `--list`), `--help`/`-h`.
- **Error contract:** no match on the active filters is exit 1, a message on stderr, and
  zero bytes on stdout — never a silent empty success. Unknown flag or an unparseable
  `--seed` is exit 2. A real stdout write failure is exit 3, distinct from "no match".
- **Source:** `src/args.js` (134 lines), `src/corpus.js` (269), `src/select.js` (91),
  `bin/aphorism.js` (100) — three pure modules plus a thin entry point. Full usage, the
  flag table and the tag vocabulary are documented in [README.md](README.md).

## What is machine-verified

- **Test suite:** `node --test test/*.test.js` — **118 tests, 118 pass, 0 fail**,
  re-run directly against the shipped tree while writing this report (2026-08-19).
  3496 lines of tests across 5 files (`args`, `cli`, `pipe`, `readme-tags`, `select`).
- **Node support floor:** README.md cites a real GitHub Actions matrix run —
  [run 32267338333](https://github.com/trmnmc/aphorism-cli/actions/runs/32267338333),
  commit `44702fb` — reporting 118 tests / 118 pass / 0 fail on Node v18.20.8, v20.20.2,
  v22.23.2 and v24.19.0. README frames this honestly as **verified-at-18**, not
  proven-minimal: nothing tests Node 16 or 17, so whether the CLI runs there is unknown,
  not ruled out.
- **Reported as not run, never as passed:** the SWARM playbook helper
  `bin/swarm-playbook.sh` has never been executed successfully against this repo, across
  four SWARM runs — its `cmd_parse` behaviour is read-only knowledge from reading the
  script, not an execution result (`.swarm/journal.md`). Corpus attribution accuracy is
  unaudited (see below) — no check available to this repo's tooling can confirm a quote's
  provenance.

## What is open

Per `.swarm/backlog.json` **as of run #4 cycle 3** (a snapshot — the run is still
moving): 13 tracked items — 5 done, 2 in flight, and **6 blocked on a human ruling an
agent must not make**:

| Item(s) | What's needed | Next actor |
|---|---|---|
| **T-006** | Audit the 50 corpus attributions against primary sources — start with the 8 HIGH-risk rows in `docs/corpus-attribution-triage.md` | human |
| **T-040** | Ratify or reverse two judgment calls made in the tag-vocabulary fold (`testing → debugging` is the load-bearing one) | human |
| **J-7** | Rule on five CLI behaviours the spec leaves unspecified (e.g. repeated `--tag`/`--author`, empty `--seed`) and record the ruling in `.swarm/SPEC.md` | human |
| **TS-1 / TS-2 / TS-3** | Lift the "corpus expansion" non-goal before corpus depth, tag-pool depth or voice concentration can be addressed — all three wait on this one scope decision | human |
| **R-1** | README acknowledgement-guard reshape — todo, not yet done or explicitly declined | this run |
| **N-5** | Confirm every open item carries a named actor and the evidence that would settle it | this run (builder) |

`N-2` (this restructure) and `N-7` (the Node-floor citation in README) both closed
conductor-verified at cycle 3 and are counted among the 5 done above.

Every one of the items above has fuller evidence, prior attempts and exact citations
already recorded in the appendix — search it for the item's id.

## Full history

Everything above this line is new, written 2026-08-19 to answer three questions in one
screen. Nothing from the previous 1578-line `REPORT.md` was deleted or paraphrased to make
room for it: the whole document — Build run, Improvement runs #1 through #3, every
inline correction, every known-issue table, every hand-off — was moved, byte for byte,
into [`docs/report-history.md`](docs/report-history.md).
