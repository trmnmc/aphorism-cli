# aphorism-cli — overnight build report

**Run type:** SMOKE (pipeline validation, 25-minute clock — 2026-08-14 05:38 → 06:03 UTC)
**Cycles completed:** 1 (a SMOKE window affords exactly one working cycle; `stop_at − 900`
put the WRAP_UP threshold ~8 minutes after kickoff)
**Status:** all 5 spec must-haves met and machine-verified. 48/48 tests green.

## Run it

```sh
cd /opt/targets/aphorism-cli
node bin/aphorism.js
node bin/aphorism.js --author dijkstra --json --seed 1
node --test test/*.test.js
```

## Must-haves

| # | Must-have | Status | Evidence |
|---|---|---|---|
| 1 | One attributed aphorism to stdout, exit 0 | **VERIFIED** | live run printed the Torvalds line + attribution; e2e test asserts `status===0`, empty stderr, non-empty stdout |
| 2 | Corpus of >= 40 entries | **VERIFIED** | conductor check: `corpus.length` = **50**, every entry has non-empty text/author and non-empty tags, zero duplicate texts |
| 3 | Flags `--author`/`--tag`/`--seed`/`--list`/`--json`/`--help` | **VERIFIED** | 19 conductor-authored parser assertions + 11 end-to-end process-level tests, all pass |
| 4 | No-match → stderr, empty stdout, non-zero exit | **VERIFIED** | e2e test asserts `status===1`, `stdout===''`, non-empty stderr |
| 5 | `node --test` suite over pick/filter/seed/no-match/format | **VERIFIED** | 48 tests, 0 failures |

Nice-to-haves `--width`, ANSI/`NO_COLOR`, and no-repeat rotation were **not built** — out of
reach on a 25-minute clock. The rotation item survives as backlog **T-005**.

## Decisions log

- **cycle 1 — zero-dep CommonJS, pure modules under `src/` + thin `bin/` entry.** A ~200-line
  CLI has a forced architecture; the only real design choice is where the seam sits. Putting
  every rule in a pure function made the Domain rules testable without spawning a process.
- **cycle 1 — wave split by purity boundary, not by feature.** T-001 (corpus+select) and
  T-002 (args) share no module, so two concurrent builders needed no dependency ordering. The
  conductor kept `bin/` + `test/cli.test.js` + `README.md` as a third disjoint scope.

## Known issues

1. **No git remote; nothing is pushed.** `git push` failed with "no configured remote". The
   VPS kickoff path creates one via `gh repo create`, which needs a Bash-allowlist entry that
   this headless session was denied permission to write. Two commits exist locally only.
   *Settles by:* a human running `gh repo create aphorism-cli --private --source=. --push`.
2. **The spec's own `test_cmd` was wrong.** `node --test test/` fails on Node 24 with
   `MODULE_NOT_FOUND`; the glob form `node --test test/*.test.js` runs all 48. Corrected in
   SPEC.md and README.md. Worth noting the failure mode: a conductor that had trusted the
   builders' self-reported green (they ran per-file commands, which work) would never have
   seen this — it only surfaced when the conductor ran the documented command itself.
3. **`--list` ignores `--seed`, by design but undocumented.** Defensible (a list has no
   selection) but the spec's Domain rules do not say so explicitly.

## Night log

- **cycle 1** — kickoff scaffolding, conductor-authored design decision (DESIGN gate cleared
  without design-panel — an explicit deviation, recorded in `state.json.decisions`), then a
  2-builder wave. T-002 landed at ~3 min and verified 19/19. T-001 landed at ~5 min and
  verified 14/14. Integration layer + full suite green at ~6.5 min. Two commits.

## Night control log

No control commands received. `SWARM/.ntfy.json` absent → notifications and control polling
OFF for this run; every helper call was a silent no-op.

## Stats

| Stat | Value |
|---|---|
| Cycles | 1 |
| Backlog items verified done | 4 of 5 (T-001..T-004); T-005 left todo |
| Builder agents dispatched | 2 (both returned `done`, both survived verification) |
| Tests | 48 pass / 0 fail |
| Corpus size | 50 aphorisms |
| Commits | 2 (`931057d`, `b4c9b06`) — local only, unpushed |
| Reverted merges | 0 |
| Conductor-authored verification assertions | 33 (19 for T-002, 14 for T-001) |

## Honest hand-off

**Machine-checked:** every must-have above, by commands the conductor authored *at verification
time* and ran itself. The builders never saw those checks, so they could not have coded to them.
The 48-test suite, the exit codes, the corpus size and shape, seed determinism (including over a
filtered subset), and filter case-insensitivity are all real, reproducible results.

**Only a human can finish these:**

- **Attribution accuracy.** 50 quotes are attributed to named people. I verified the *shape*
  of every entry — non-empty text, non-empty author, tags present, no duplicates — and I did
  not verify that each human actually said each line. Programming aphorisms are widely
  misattributed. This is the single largest correctness risk in the repo and no test I can
  write will catch it. Read the corpus before shipping it anywhere public.
- **Whether the product is worth using.** Flagged at kickoff and unchanged: a 50-line static
  corpus with uniform random selection repeats fast and gets boring by roughly use 15. The run
  built the correct thing; nobody has judged whether it is the *interesting* thing. Backlog
  T-005 (no-repeat rotation) is the cheap half of the fix.
- **The unpushed remote** (known issue 1).
- **No review or QA pass ran.** One build wave consumed the entire SMOKE window. The
  review-fix and qa-verify stages — the adversarial reproduce-then-fix pass and the live-look
  pass — were never dispatched. Reported as **not run**, not as passed.
