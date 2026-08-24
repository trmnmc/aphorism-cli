# aphorism-cli — overnight build report

Improvement run #7 **built nothing**, and that is the report: the run's entire window sat inside an already-exhausted weekly usage limit, so cycle 0 (KICKOFF) committed and then died on that limit, and the 381 sessions spawned after it each lived ~415 ms before the same HTTP 429. The product is untouched and green; the finding is about the scheduler, and it is the second consecutive run lost to the same mechanism.

_No screenshot captured this run — the target is a terminal CLI with no visual surface, and no cycle ran to capture one anyway._

> Run #6's report (the current state of the product, which this run did not change) is preserved in git at commit `1281377` / `ea481bc`. Everything below describes **run #7 only**.

## Run it

```
node bin/aphorism.js
```

Unchanged from run #6. Verified at this wrap-up: suite green **129 / 129**, `src/corpus.js` sha256 `77a4de5c…`, `--help` sha256 `d759d781…` — all three byte-identical to the cycle-0 baseline.

## Must-haves

| Must-have | Status | Reason / evidence |
|---|---|---|
| **R-1** — retire the `>= 121 tests` COUNT floor; replace it with a rerunnable DETECTION floor (bounded ≤ 30 rule-generated mutation set + identity control, shipping as `tools/mutation-matrix.mjs`) | ❌ **not started** | No cycle ran. Backlog status `todo`, `attempts: 0`, priority 1. Fully specified and ready to dispatch — the spec work survives for run #8. |
| **R-2** — close KI-R6-3: consolidate the two guards reading the same "Tags on exactly one entry" row, or publish the distinguishing mutation and keep both | ❌ **not started** | No cycle ran. Backlog `todo`, `attempts: 0`. Third consecutive run this item has been carried. |
| **R-3** — `docs/node-support-citation-history.md` QUOTES README's selection rule verbatim (closes KI-R6-5 / Q-10) | ❌ **not started** | No cycle ran. Backlog `todo` (as Q-10), `attempts: 0`. One-line fix, unblocked at kickoff by reading the `blocked_reason` rather than the status. |
| **R-4** — COUNT the citation two-commit tax over repo history; publish the number and a recommendation; touch nothing | ❌ **not started** | No cycle ran. Backlog `todo`, `attempts: 0`. |
| **R-5** — STANDING INVARIANT: zero features, zero new deps, `src/corpus.js` + `--help` sha256 unmoved, green at every commit | ✅ **held** | Held **trivially and honestly**: one commit was made this run (`55dfbb8`, kickoff state only) and it touched no source. Verified at wrap-up — see evidence below. This is a real pass on a weak test: an invariant is easy to hold when nothing runs. |
| **R-6** — playbook allowlist / `additionalDirectories` / pacer-429 CLOSED at kickoff by one read; escalate once, never re-derive (L-045) | ✅ **shipped** | Closed at cycle 0 by a single `settings.json` read: `swarm-playbook.sh` appears under **zero** of the 11 allowlisted `swarm-*` forms; `additionalDirectories` is `[]`. Re-read at this wrap-up, same result. **Two denials not burned.** |

**1 of 6 must-haves shipped, 1 held trivially, 4 not started.** Nothing is blocked on a ruling; all four are blocked only on a session that can take a turn.

### Verification evidence (wrap-up, run by the conductor)

```
$ node --test test/*.test.js
ℹ tests 129   ℹ pass 129   ℹ fail 0   ℹ skipped 0   ℹ duration_ms 4876.13

$ sha256sum src/corpus.js
77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e  src/corpus.js
$ node bin/aphorism.js --help | sha256sum
d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64  -
$ git status --porcelain | wc -l
0
```

All three match `state.json.baseline_2026_08_22_run7` exactly.

## Decisions log

- **cycle 0**: Re-aimed the brief's "harden tests / polish docs" onto **reducing the guard layer's maintenance tax** — because coverage is already 100% line / 100% func / 98.44% branch (the one miss classified BOUNDARY), while `test/` is 4,409 lines guarding a 594-line program and 3,286 of those guard *documents*. A new product test would have been written to a number, not to a defect.
- **cycle 0**: Retired run #6's `>= 121 tests` invariant for a detection floor — a test-COUNT floor can only be satisfied by growth, which makes consolidation a spec violation regardless of whether detection is preserved. It is the specific mechanism that kept KI-R6-3 open for two runs.
- **cycle 0**: Acted on the taste judge's finding **before** lock rather than recording it — R-1's mutation set was bounded by a stated rule, capped at 30, given an identity control, and required to ship as a rerunnable harness. A floor nobody can re-run is not a floor.
- **cycle 0**: Planned the run as ONE session and said so in the spec, on the measurement that the whole window sat inside an exhausted weekly limit. **This prediction was correct in kind and wrong in degree** — the delivered count was zero work cycles, not one.
- **cycle 0**: Did NOT re-attempt the `swarm-playbook.sh` allowlist call or the `settings.json` write (L-045).

## Known issues

Carried unchanged from run #6 — no cycle ran to address or re-observe any of them, except KI-R6-6, which this run reproduced at larger scale.

- **KI-R6-6 (high)**: the spawner respawns into a usage limit on a fixed cadence instead of backing off to the reset time the runfile already carries. **Re-measured this run and worse: 382 sessions spawned, 381 `cycle-failed`, 381 of 381 carrying `You've hit your weekly limit · resets 5am (UTC)`, zero other causes, median lifetime 415 ms at `num_turns: 1`.** Cumulative over runs #6 and #7: **885 dead spawns.** Found cycle 5 (run #6); reproduced across the entirety of run #7. Human item — `bin/` is read-only under hard rule 5.
- **KI-R6-1 (med)**: the watchdog DONE-guard keys on `REPORT.md` *existing*, which on an improvement run is true from cycle 0, so `swarm-watchdog.timer` no-ops on every firing and the run has no watchdog crash recovery. Found cycle 0. Mitigation (pacer drives cycles directly) was live — and this run demonstrates its limit: **the pacer was alive and firing the whole time; what was dead was every session it started.**
- **KI-R6-2 (med)**: `bin/swarm-playbook.sh` has no allowlist entry under any of the 11 `swarm-*` forms. Re-confirmed by reading `settings.json` at this wrap-up. Human item — see `HANDOFF-allowlist-2026-08-17.md`.
- **KI-R6-3 (low)**: two guards in `test/readme-tags.test.js` read the same "Tags on exactly one entry" table row. Found cycle 2 (run #6). R-2 was written to close it; R-2 did not run.
- **KI-R6-4 (low)**: the README Node-support matrix can still be falsified *wholesale* — a self-consistent lie across all four rows passes every per-row and cross-row check. Found cycle 4 (run #6). Needs an operator ruling (Q-9) on whether an out-of-document anchor is worth its cost.
- **KI-R6-5 (low)**: `docs/node-support-citation-history.md` paraphrases the citation-selection rule, and the paraphrase selects a *different* commit than the README's rule does. Found cycle 5 (run #6). R-3 was written to close it; R-3 did not run.

## Night log

- **cycle 0** (2026-08-22T18:31:48Z → 18:47:13Z): KICKOFF. Stress-test verdict RESHAPE (confidence 8) re-aimed the brief; prior-art scout ran; taste judge scored use-twice **4** / product-not-demo 8 / scope-fits-night 8 / one-memorable-thing 6; spec locked; backlog seeded R-1…R-6; R-6 closed by one read; baseline recorded (129/129 green, both invariants captured); dashboard rendered; goodnight push sent 18:45:58Z. Committed `55dfbb8`. **Then the session died on the weekly limit** — `runs/kickoff-1787423508.log` contains exactly one line: `You've hit your weekly limit · resets Aug 24, 5am (UTC)`. Logged `auto-kickoff-failed` at 18:47:13Z.
- **18:47:13Z 2026-08-22 → 04:56:58Z 2026-08-24** (~34.2 hours): the pacer fired faithfully every ~5 minutes and spawned **381** cycles. All 381 died on HTTP 429 before their first turn. No cycle 1 exists.
- **cycle 0 (wrap-up)** 2026-08-24T05:02:07Z: the 382nd spawn — started **two minutes after the weekly reset** — is the first session in 34 hours to reach a turn. `now` is 10.5 h past `stop_at`, so the step-1 clock check routes it straight to WRAP_UP. It verified the baseline, wrote this report, and stopped.

## Night control log

_No commands received._ (`runs/control.json`: `pending: []`, `applied: []`; poll at wrap-up returned `merged=0`.)

## Stats

| Stat | Value |
|---|---|
| Cycles run | **1** (cycle 0 only — cycle 1 never started) |
| Commits | 2 (`55dfbb8` kickoff; this wrap-up commit) |
| Agents dispatched | **1** — the kickoff taste judge. **Zero** builder, reviewer, or QA agents were ever dispatched. |
| Models used | fable (taste judge). No build/review/QA routing was ever exercised. |
| Notifications sent | 3 (`auto-kickoff`, `goodnight`, `wrap-up`) |
| Pace | mode **guest** (dial 0.30), gear range **2–2** (one probe, ρ 1.35), governor clamped: ceiling 3, promote blocked, weekly 100% / opus 100% used at 79.5% week elapsed. Window utilization at the in-run reset: **100% consumed, ~0% of it this run's**. Voluntary idle cycles: **0** — the run was never idle by choice; it was locked out, 381 times. |

## Honest hand-off

**Machine-checked at this wrap-up:** the suite (129/129 green), both R-5 invariants (`src/corpus.js` and `--help` sha256, byte-identical to baseline), a clean working tree, and the 381-of-381 failure classification — that last one is exhaustive over `runs/pacer.log` and every `runs/cycle-*.json` written since kickoff, not a sample.

**Not run, and reported as not-run:** the kickoff's headless zero-prompt assert (denied, #37). It produced no signal in either direction — and it was precisely the probe that would have measured whether pacer-spawned sessions could run at all that night. That question stayed unanswered until 34 hours of 429s answered it the expensive way.

**What only a human can finish:**

1. **The scheduler, and it is now the whole story.** Two consecutive runs, 885 spawned sessions, one mechanism: `bin/swarm-pacer.sh` retries on a fixed ~5-minute cadence after a usage-shaped launch failure, and never consults `runfile.usage_reset_at` — a timestamp *this run's own cycle-0 probe wrote into the runfile 15 minutes before the first of its 381 dead spawns*. Two changes, both outside a run's reach under hard rule 5: (a) back the retry cadence off to the known reset, and (b) refuse an auto-kickoff whose entire window sits past an exhausted limit's reset, requeuing the slice instead of reshaping its scope. Recorded as L-037 (observed 4) and L-038 (observed 3).
2. **The brief, for the fifth consecutive run.** Four independent taste judges have now scored this product's use-twice dimension at **4/10**, and all four named the same cause: corpus depth and no-repeat rotation. Both are locked out by the trickle brief's "no new features". This run never reached the point of being constrained by that — but if run #8 opens with the same brief, it will spend its clock the way runs #2–#6 did. The lever is the brief, not the machinery.
3. **The two open rulings**, unchanged: Q-9 (is a coordinated table-wide falsification worth an out-of-document anchor?) and the corpus-attribution audit (T-006).

**What run #8 inherits, and it is not nothing:** a locked, stress-tested, taste-corrected spec with six fully-specified items, four of them ready to dispatch on the first cycle, and a baseline captured to the byte. The design work of this run survived; only its execution didn't.

---

Repo tagged `improvement-run-7-2026-08-24`. Generated by /swarm WRAP_UP at 2026-08-24T05:10:00Z.
