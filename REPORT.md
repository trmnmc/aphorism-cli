# aphorism-cli — report

A tiny, zero-dependency Node.js CLI that prints one attributed programming aphorism —
`fortune(6)` for programmers, quiet and pipeable. This page is the current status in one
screen. The complete forensic history — five SWARM runs, every correction and every dated
claim, moved verbatim rather than summarized — is in
[`docs/report-history.md`](docs/report-history.md).

_No screenshot captured this run — this is a CLI with no rendered surface._

## Run it

```sh
node bin/aphorism.js
```

## What ships

**Unchanged by improvement run #5.** This run added zero features, zero flags, zero
dependencies and did not touch `src/corpus.js`, `src/select.js` or `bin/aphorism.js`.

- **Run it:** `node bin/aphorism.js` — no install step, no `package.json`, zero runtime
  dependencies; Node plus this repo is the whole requirement.
- **Corpus:** 50 curated aphorisms in `src/corpus.js` — 24 distinct authors, 12 tags,
  smallest pool 3 entries / largest 14.
- **Flags:** `--author <name>`, `--tag <tag>`, `--seed <n>`, `--list`, `--json`,
  `--help`/`-h`. Full semantics in [README.md](README.md).
- **Error contract:** exit 1 = no match (message on stderr, zero bytes on stdout);
  exit 2 = unknown flag or unparseable `--seed`; exit 3 = the output could not be
  delivered, distinct from "no match".

## What run #5 was for, and what it found

The brief was housekeeping under a TRICKLE posture: harden tests, fix playbook items,
polish docs, **no new features**. Five must-haves, all closed and conductor-verified.

| Must-have | Status | Evidence |
|---|---|---|
| **P-1** — enumerate the `bin/aphorism.js` branch gap, classify each branch HOLE or BOUNDARY, pin every HOLE with a failable + attributable + converse-controlled test | ✅ shipped | Measured, cycle 1. The kickoff had *inferred* a "12 of 14 branches" gap; measurement returned **1 unexecuted branch of 7** (`bin/aphorism.js:72`, false arm), classified **BOUNDARY** — it is unreachable dead code. **Zero tests added**, because zero HOLEs existed. The suite already executes 64 of 65 reachable branches. |
| **P-2** — coverage baseline written down and observable per-push in CI on Node 18/20/22/24, cited to a real run, and never gated on | ✅ shipped | [`docs/coverage-baseline.md`](docs/coverage-baseline.md) + an informational coverage step in the Actions matrix. Took two attempts: the cycle-2 gate turned over two false claims, one of them authored by cycle 1 itself. Explicitly **not** a gate — an enforced coverage threshold is a locked non-goal of this run. |
| **P-3** — audit every README/`--help`/docs claim in both directions, every citation form including the bare `:N` shorthand | ✅ shipped | Cycle 3. The mechanical surfaces came back **clean**, which is a valid result and is reported as one. One claim had documented its own falsifier, which is what P-6 then mechanized. |
| **P-4** — prove the playbook allowlist gap closed by *executing* the denied script, else hand off denial #31 with an exact patch | ✅ shipped (as a hand-off) | Cycle 4 re-derived and **shrank** the ask; the script is still denied. See "Reported as not-run" below. |
| **P-5** — suite green ≥ 119 on every commit, Actions matrix green on final HEAD, zero features, zero deps, `src/corpus.js` byte-identical | ✅ shipped, **with one recorded exception class** | Verified at close; the exception is P-7, below, and it is recorded rather than re-labelled. |

Beyond the must-haves the run also closed a review-fix pass (RF-1/2/3, cycle 6), a full QA
pass (4/4 clean, cycle 7), a CI deprecation bump (RF-4, cycle 8), a taste pass (cycle 9),
and RF-5 (cycle 10), which made the README's citation guard able to fire on the working
tree — on the very commit that breaks it — instead of a cycle later.

## What is machine-verified

Every number here was re-run by the conductor against the shipped tree at the closing gate.
None is taken from an agent's claim.

- **Test suite, full clone:** `node --test test/*.test.js` → **121 tests, 121 pass, 0 fail,
  0 skipped** (node v24.19.0).
- **Actions matrix on final code-bearing HEAD:**
  [run 32338243331](https://github.com/trmnmc/aphorism-cli/actions/runs/32338243331) —
  **4/4 green** on v18.20.8, v20.20.2, v22.23.2, v24.19.0, each reporting
  **121 tests / 119 pass / 0 fail / 2 skipped**.
- **Why CI shows 2 skips and a full clone shows 0:** both skips are the two arms of
  `test/node-support-citation.test.js`, the guard on README's own Node-support claim. CI
  checks out shallow, so the guard cannot read the history it needs and **stands down
  loudly rather than passing silently**. On a full clone both arms execute. This is the
  guard being honest about what it could not measure, not a suppressed failure.
- **Zero features, zero dependencies:** no `package.json` and no `node_modules` exist, so
  the dependency claim holds by construction rather than by audit.
- **`src/corpus.js` byte-identical:** last modified at commit `64a465f` (2026-08-18,
  during run #4) and untouched for all of run #5.

## What is open

Backlog at close: **31 items — 22 done, 1 declined, 8 blocked, 0 todo, 0 in flight.** The
run ended because the dispatchable column reached zero, not because the clock did.

### The one conflict a human must rule on

- **P-7** — **P-5 and P-6 are in direct conflict and only a human can settle it.**
  README's Node-support section cites `git diff <base>..HEAD -- src bin test .github`
  as its own retirement condition, and P-6 mechanized that condition into a test. The
  consequence: **any** commit touching those paths falsifies the citation *at that commit*,
  and the CI run that would refresh it cannot exist until after the push. So a commit that
  changes `src/`, `bin/`, `test/` or `.github/` is red on a full clone for the minutes
  between push and re-citation. This run walked that window knowingly three times
  (`5f833ab` c5, `c08562b` c6, `2b003ea` c10), said so in each commit message, and closed
  it each time with the round trip README itself prescribes.
  *Settles when* a human picks one of: **(a)** amend P-5's wording to exempt the single
  commit that introduces such a change; **(b)** change the citation design so the window
  closes; **(c)** retire the guard. Until then the exception stands **recorded, never
  re-labelled as a pass**. Note the window is not a defect in the test — it is the price
  of the claim being checkable at all, and the alternative (a citation nothing runs) is
  the state that let this claim go stale undetected in an earlier run.

### Blocked on a human ruling (8)

Unchanged in substance from run #4's report, which describes each in full; none is
re-described here as work a builder could pick up, because **no agent action can unblock
any of them**.

- **T-006** — corpus attribution audit (needs primary sources; network is a product
  non-goal). Highest-severity open issue on the repo. Triage that a human can act on:
  [`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md), 8 HIGH /
  16 MEDIUM / 26 LOW of 50.
- **T-040** — ratify or reverse the 26-name tag fold map, especially `testing → debugging`.
- **J-7** — seven CLI behaviours SPEC.md leaves undecided.
- **TS-1 / TS-2 / TS-3** — corpus depth, tag-pool depth, voice concentration. All three
  need the locked "corpus expansion" non-goal lifted at a kickoff.
- **TS-6** — `--tag` vocabulary is undiscoverable without `jq`. The **documentary half is
  already shipped** (README lists all 12 tags with counts); the remaining half needs a new
  flag, which is a locked non-goal.
- **P-7** — above.

### Declined, not dropped

- **R-1** — README acknowledgement-guard reshape, ruled by the conductor at run #4 cycle 4;
  the property is already covered twice by sibling guards that fail closed. The residual
  is live as KI-12 below.

### Known issues carried forward (18 open)

Two classes, and the distinction matters to whoever picks this up:

- **Product/repo issues (7):** KI-2 (unaudited attributions, **high** — the only high one
  in this class), KI-12 (the README acknowledgement guard is a token co-occurrence check
  and documents itself as *not* a meaning check), KI-24 (English number *words* are
  invisible to the `\d+` guard), KI-27 ("Node 18+" is a floor claim proven at four specific
  versions, not at 18.0.0), KI-28 (repeated `--tag`/`--author` unprotected and
  spec-undecided), KI-29 (three domain-rule clauses undecided), KI-35 (per-cycle artifact
  names collide across runs).
- **SWARM tool gaps (11):** KI-6, KI-11, KI-13, KI-14, KI-15, KI-16, KI-25, KI-26, KI-30,
  KI-33, KI-34. These are defects in the *build harness*, not in this CLI. Three are
  **high**: KI-14 and KI-16 disable or fail-open a spend governor, and KI-26 silently
  removes the run's crash-recovery net. All are reported to the morning report rather than
  live-patched, because SWARM's own `bin/` and `reference/` are read-only during a run
  (hard rule 5).

## Reported as not-run, never as passed

- **`bin/swarm-playbook.sh` is still denied — denial #31, now the 7th consecutive
  occurrence**, including once at this wrap-up. The cause is structural and confirmed by
  reading `/opt/swarm/.claude/settings.json` directly: the script has **no allowlist entry
  under any path form**, while its sibling `swarm-notify.sh` is present under two. Exact
  patch: `SWARM/playbook/HANDOFF-allowlist-2026-08-17.md`. Consequence for this run: both
  the kickoff parse and this wrap-up's playbook distillation were done **by hand**, in the
  documented fallback grammar. `SWARM/playbook/learnings.md` may need human review.
- **A correction to the ledger itself:** cycle 4 recorded a second structural gap as
  denial #32. Cycle 9 grepped the allowlist and found that script present under *both*
  path forms — that denial came from how the command was composed, not from a missing
  entry. **The true count is 31, not 32.** Left uncorrected it would have handed the
  operator a second, unactionable ask.
- **The final wrap-up commit's own CI run** is not cited above. The matrix is cited at the
  last code-bearing HEAD (`9794dd9`). Wrap-up commits touch only `REPORT.md`, `docs/` and
  `.swarm/`, none of which the suite reads, so the result cannot change — but "cannot
  change" is an argument, not an observation, and it is labelled as one.

## Stats

| Stat | Value |
|---|---|
| Cycles run | 12 (cycle 0 kickoff + cycles 1–11) |
| Commits | 26 + wrap-up |
| Stop reason | **DONE** — definition-of-done met, no candidate cleared the value ratchet inside the brief |
| Clock returned unspent | **~19.4 hours** of a ~24-hour window |
| Agents dispatched | 13, counted from the journal's per-cycle headers (1 planner; 5 builders across c2/c3/c5/c8/c10; 1 reviewer + 1 verifier + 1 fixer at c6; 3 QA seats at c7; 1 taste seat at c9). Cycle 4 and this wrap-up dispatched none. **k=1 on every wave** — gear 1 pinned the cap there all run |
| Models used | fable (judgment seats only), sonnet (all build/fix work) |
| Reverted merges | **0** |
| Items reaching `attempts ≥ 2` | **0** |
| Notifications sent | 1 (goodnight) + this wrap-up |
| Pace | mode `guest`, gear **1 on all 11 cycles** (range 1–1), ρ 3.92–9.79, weekly governor clamped to ceiling 2 throughout, promote blocked; voluntary idle cycles: **0** |

## Honest hand-off

**Machine-checked:** the 121-test suite; the 4-version Actions matrix; `src/corpus.js`
byte-identical since 2026-08-18; zero dependencies by construction; the branch-coverage
measurement and its BOUNDARY classification; every documented claim audited in both
directions with the citation guard now able to fire pre-commit.

**Only a human can finish** all eight blocked items and P-7's ruling. Corpus attribution
(KI-2) is the highest-severity open issue on this repo and needs primary sources this CLI
is designed never to reach.

**One infrastructure item:** disarming the watchdog timer needs root —
`sudo systemctl disable --now swarm-watchdog.timer`. Reported as not-done rather than
done. (The pacer stops on its own: `wrap_up_complete` is now true.)

**The standing finding, now for the third consecutive run.** The single highest-value
change available to this product — **no-repeat-until-exhausted rotation** — has now been
named independently by *four* taste judges across three runs. The corpus repeats by
roughly the ninth invocation, and every run that has measured it has said so. It is not
blocked by any engineering obstacle. It is blocked by the brief, which forbids new
features, and the brief is the operator's lever.

This run ran out of permitted work with 80% of its clock unspent, and spent that clock
returning it rather than manufacturing churn — which is what the SPEC asked for
("an early finish is the honest outcome here, not a failure"). But three runs of
housekeeping on a repo whose own instruments keep pointing at the same unbuilt feature is
a pattern, not a coincidence. **The next run should either permit the rotation feature, or
permit corpus expansion paired with the attribution audit — or not be scheduled.** There is
no third kind of useful work left here that a machine may do.

## Full history

Everything above is run #5's close, written 2026-08-20. Nothing was deleted to make room:
run #4's `REPORT.md` was moved byte-for-byte into
[`docs/report-history.md`](docs/report-history.md), joining the Build run and improvement
runs #1–#3 already there.

---

Repo tagged `improvement-run-5-2026-08-20`. Generated by /swarm WRAP_UP at
2026-08-20T06:30Z.
