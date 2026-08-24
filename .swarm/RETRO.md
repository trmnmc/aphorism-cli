# aphorism-cli — run retro

Run: 2026-08-22 → 2026-08-24 (improvement run #7) | cycles run: **1 (cycle 0 only)** | stop reason: WRAP_UP at the step-1 clock check, **10.5 hours past `stop_at`**, on the first spawned session in 34 hours that survived long enough to take a turn.

The run's premise: reduce the guard layer's maintenance tax and publish the measurement that
justifies each reduction. No new features, no new deps.

**No work item was built.** Cycle 0 (KICKOFF) completed and committed; cycle 1 never got a
turn. Everything below is the retro of a run that was locked out of its own window, and the
one finding it produced is about that lockout.

## What worked

- **The kickoff's taste gate changed the spec before lock, rather than annotating it after**
  (cycle 0). The judge caught that R-1 asserted a universal detection claim over an unbounded
  mutation universe while asking only that the matrix be "published". The response was
  structural: the mutation set was bounded by a stated generation rule, capped at 30, given an
  identity control, and required to ship as a rerunnable `tools/mutation-matrix.mjs`. This is
  the one class of defect the taste gate exists to catch, and it caught it on a spec that had
  already passed a stress-test. Recorded as a decision in `state.json`.
- **The stress-test re-aimed the brief on measured grounds, not preference** (cycle 0). Verdict
  RESHAPE at confidence 8, on two numbers already in the repo: coverage is 100% line / 100%
  func / 98.44% branch with the single miss classified BOUNDARY, and `test/` is 4,409 lines
  guarding a 594-line program, 3,286 of them guarding *documents*. The toy reading of "harden
  tests" was to add a sixth layer of README guards — which is what runs #2–#6 built. Naming the
  measurement is what made refusing it defensible.
- **R-6 was closed by reading the authoritative source instead of re-triggering the failure**
  (cycle 0, re-confirmed at this WRAP_UP). `swarm-playbook.sh` appears under **zero** of the
  allowlisted `swarm-*` forms in `settings.json`; `additionalDirectories` is `[]`. Both facts
  were established by one `json.load` at kickoff and one at wrap-up. Run #6 spent denials
  #34/#35/#36 learning the same thing by hitting it. **Two denials not burned this run** —
  L-045 applied and it paid.
- **Step 11 (headless zero-prompt assert) was reported as NOT RUN, with its consequence named**
  (cycle 0). It was denied (#37), it produced no signal in either direction, and the journal
  says so plainly rather than rendering it as passed — including the sentence that mattered:
  *it was the probe that would have measured whether pacer-spawned sessions could run at all
  that night, and that question went unanswered.*
- **The run pre-registered its own predicted shape in the spec** (cycle 0): *"expected shape:
  ONE session — the whole run window sits inside an exhausted weekly limit; early DONE is the
  honest outcome."* That sentence is why this wrap-up is a measurement and not an excuse. See
  "What thrashed" for the part it still got wrong.

## What thrashed

- **The entire run window sat inside an exhausted weekly limit, and 381 spawned sessions died
  against it** — why: `swarm-pacer.sh` retries on a fixed ~5-minute cadence after a
  usage-shaped launch failure, and nothing in the loop consults the reset time the runfile
  already carries. Measured exhaustively over `runs/pacer.log` and every
  `runs/cycle-*.json` written since kickoff (cycle 0 → this WRAP_UP):

  | | |
  |---|---|
  | pacer decisions since kickoff | 1,159 |
  | sessions spawned | 382 |
  | `decision=cycle-failed` | 381 |
  | failures carrying an HTTP 429 weekly-limit result | **381 of 381** |
  | other failure causes | **0** |
  | median session lifetime | **415 ms**, `num_turns: 1`, `terminal_reason: api_error` |
  | verbatim result string | `You've hit your weekly limit · resets 5am (UTC)` |

  The classification is exhaustive, not a sample. The 382nd spawn is this session, which
  started at 05:02:07Z — **two minutes after the weekly reset** — and is the first one to reach
  a turn since 2026-08-22T18:47Z.

- **The kickoff session was not exempt from the limit it had just documented** — why: it
  recorded the standing tension honestly (*"this session is itself alive inside that same
  exhausted window, so the limit is evidently not uniform across session kinds — but a plan
  built on that hope is a plan built on an unmeasured claim"*) and then **died on that exact
  limit 15 minutes later**, at 18:47:13Z, logged `auto-kickoff-failed`, with
  `runs/kickoff-1787423508.log` containing exactly one line: `You've hit your weekly limit ·
  resets Aug 24, 5am (UTC)`. The hypothesis was falsified inside the same cycle that raised it.
  It had not been exempt; it had been spending the last of the headroom.

- **Even the pessimistic plan was optimistic by one cycle** — why: the spec predicted ONE
  session and budgeted cycle 1 to carry the whole run's work ("do the work in cycle 1, verify
  it in cycle 1, treat any later cycle as a bonus"). The delivered count was **zero** work
  cycles. A run that correctly identifies it is inside an exhausted limit still over-estimates
  what it can do, because the kickoff itself is not free — cycle 0 consumed the remaining
  headroom before cycle 1 could start. The lesson is not "predict harder"; it is that at
  `weekly_used_pct: 100` the correct number of planned cycles is **not one, it is none** — the
  run should not open.

- **This is the second consecutive run lost to the same mechanism, at a larger scale.** Run #6
  burned 504 spawns over its tail (KI-R6-6, L-037 clause 1). Run #7 burned 381 over its
  entirety. Cumulative: **885 spawned sessions, ~885 × 415 ms of wall clock and two runs of
  scheduled capacity, against a wall whose reset time was in the runfile the whole time.**
  Nothing in either run could fix it from the inside — `bin/` is read-only under hard rule 5.

## Pacing honesty

- Governor clamps: **1 of 1 cycles** (ceiling hit: 3, `promote_blocked: true`, `weekly_heat`
  1.26 / `opus_heat` 1.26 at `week_elapsed_pct` 79.48). Full-mode overrides: 0.
  Promote-rung promotions: 0. Gear range: **2–2** (single probe, cycle 0; ρ = 1.35, guest mode,
  dial 0.30, wave cap 2, demote one rung).
- Voluntary idle cycles: **0** — and that number is misleading on its own, so it is spelled
  out: the run was never idle by choice, it was locked out. 381 involuntary dead spawns is the
  honest figure.
- Window utilization at the one in-run reset (weekly, 2026-08-24T04:59:59Z): the limit was at
  **100% consumed** going in and reset while this run held **0%** of its own work done.
  SWARM burned essentially none of that window; it was already spent when the run opened. This
  is the exact case L-038 is about, in its degenerate form — no placement of `stop_at` helps
  when capacity is zero for the run's whole life.

## Config recommendations

- [process] Refuse an auto-kickoff whose entire window sits past an exhausted limit's reset:
  when the kickoff probe reports `weekly_used_pct >= 100` **and** the reset lands after the
  proposed `stop_at`, the run has zero capacity for its whole life — requeue the slice past the
  reset instead of reshaping its scope, because the scope was never the binding constraint
  [apply: process kickoff-refuse-on-exhausted-window] [confidence: high] [source: 2026-08-24
  aphorism-cli] (evidence: cycle 0 probe wrote `weekly_used_pct: 100` and
  `usage_reset_at` = `stop_at` + 10.5h into the runfile at kickoff; delivered work cycles: 0)
- [process] Back a spawner's retry cadence off to the reset timestamp the runfile already
  carries after a usage-shaped launch failure, rather than retrying at a fixed interval — the
  data needed to stop was present in `runfile.usage_reset_at` for all 381 spawns
  [apply: process spawner-backoff-to-known-reset] [confidence: high] [source: 2026-08-24
  aphorism-cli] (evidence: 381/381 spawns × HTTP 429, median 415 ms, `runs/pacer.log`
  2026-08-22T18:47Z → 2026-08-24T04:57Z)

## House-rules proposals

_None._ No build, review, or docs agent was dispatched this run, so no taste-gate complaint
was generated. A proposal from a run that dispatched zero agents would be invention, not
distillation.

## Applied lessons check

`runfile.playbook.applied` is `[]`, but that field is not the authoritative record — the
ledger is, and `playbook/applied.log` names **15 lessons staged at cycle 0**: L-008, L-016,
L-022, L-024, L-026, L-029, L-031, L-033, L-034, L-038, L-042, L-043, L-044, L-046, L-047
(staged by direct read of `learnings.md`; `swarm-playbook.sh` structurally denied, KI-R6-2).

**Twelve of the fifteen are NOT-EXERCISED, for one reason: zero agents were dispatched.**
L-008/L-016 (dispatch scoping), L-022 (persisted UI state — held out of `prompt_lines`
deliberately, as in the last three runs: this target is a terminal CLI with no browser
surface), L-024/L-029/L-031/L-033/L-034/L-044 (the mutation-craft lines, wired into the
*builder* role this run because R-1 and R-2 are themselves mutation work), L-026 (routing),
L-042 (sealed pre-dispatch gate), L-043, L-046, L-047 — none of these can be exercised by a
run that never reaches a build wave. Reported as not-exercised, never as confirmed.

The three that *were* exercised are below. Note that two of them (L-037, L-045) are
advice-only `process` lessons that steered the run without appearing in the staged roster —
which is the honest accounting, since they are what the run actually ran on:

- L-045 (read the authoritative source; escalate a locked lever once, never re-derive):
  **re-observed** (cycle 0 closed R-6 by one `settings.json` read; this WRAP_UP re-read the
  same source rather than burning a denial on the `swarm-playbook.sh append` call — two
  denials avoided).
- L-037 (a spawned conductor that dies on a usage-limit error before its first turn is
  invisible to limp mode): **re-observed at a third scale** (381/381 spawns, exhaustively
  classified; second consecutive run, cumulative 885).
- L-038 (place `stop_at` relative to the usage-window reset): **re-observed in its degenerate
  form** — the whole window was past an exhausted limit, so no placement of `stop_at` was
  survivable (cycle 0).

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization achieved at reset: **100% overall / 100% premium** — none of it this
  run's. `runs/allocator.json` at kickoff: posture `trickle`, dial 0.33 → 0.30.
- Allocator: allowance granted 10% overall / 10% premium (trickle); **actually burned by this
  run: one kickoff session's worth**, then zero for 34 hours.
- Auto-kickoffs this run/week: 1 for this run (2026-08-22T18:31:48Z, `mode=guest dial=0.30
  posture=trickle`), logged `auto-kickoff-failed` at 18:47:13Z. Four auto-kickoffs appear in
  `pacer.log` across the week. No 3-strike queue drops recorded.
- Final-hours floor release: **did not fire** — no cycle was alive in the final hours to
  release anything.
