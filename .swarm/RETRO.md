# aphorism-cli — run retro

<!-- Written by /swarm WRAP_UP. Evidence rules: every entry cites cycle numbers from
     .swarm/journal.md. No cycle number, no entry. Cycle numbers are RUN #4's own
     counter (kickoff 2026-08-19T14:05Z); run #3's cycles are cited as "run #3 cN". -->

Run: 2026-08-19 (improvement run #4) | cycles run: 12 | stop reason: **DONE** — all five
must-haves closed and conductor-re-verified at cycle 12 (12 PASS / 0 FAIL); backlog todo
reached 0 at cycle 11 with all 7 survivors human-owned; no VALUE_LOOP candidate cleared the
two-question ratchet. ~18.5 h of clock handed back unspent, deliberately.

## What worked

- **Sealing the gate by sha256 before dispatch, with a discriminating baseline recorded on
  the UNFIXED tree** (L-042). Used on every dispatching cycle — 2 (10P/9F baseline), 3
  (9P/6F), 4 (9P/5F), 5 (16P/4F), 8 (17P/10F), 10 (17P/4F), 11 (21P/10F). The baseline is
  the part that paid: a gate that already passes on the unfixed tree measures nothing, and
  the pre-dispatch smoke run caught **6 gate defects before they could judge anything** — 2
  at cycle 5, 3 at cycle 8, 1 at cycle 10 (cycles 5, 8, 10).
- **k=2 waves, dispatched as direct Agent calls with scopes declared in the prompt**
  (L-016). Zero reverted merges and zero merge conflicts across the entire run: cycles 2
  (2/2 verified), 3 (2/2), 4 (2 settled), 11 (2/2). `k_current` climbed 3 → 5 on clean-wave
  streaks while the gear-2 cap held the effective size at 2 the whole time — the autotune
  never actually got to spend what it earned (cycles 2–11).
- **Adjudicating a gate FAIL in explicit columns instead of accepting it or rewriting the
  gate.** Every FAIL this run turned out to be a defect in the conductor's own instrument,
  and each was adjudicated in a named column set with the gate left BYTE-UNEDITED: cycle 2
  (5 columns), 3 (17), 4 (11/11), 5 (13/13), 8 (8/8), 9 (7/7), 10 (11/11), 11 (11/11).
  Rewriting a gate after it runs destroys the evidence of what it measured; leaving it
  sealed and arguing in columns preserved it eight times.
- **Reading the diff even when the gate came back green** (L-042's own later clause). At
  cycle 10 the sealed gate passed on what it was aimed at, and a plain diff-read found an
  unguarded numeric claim the gate was never pointed at — which became Q-8 and shipped at
  cycle 11.
- **Refuting the run's own premises rather than inheriting them** (L-034). Cycle 6 spent
  itself demolishing three of this run's own diagnoses about the notify helper being denied;
  all three were false, and the owed push went out. Cycle 7 ran the full QA pass
  specifically because the premise that would have justified skipping it did not survive
  checking — it returned 32/32 scenarios and 3 findings that shipped as repairs at cycle 8.
- **Converse / must-die controls** (L-044). At cycle 5 a control went SILENT rather than
  green — visible only because the run demands each must-die cell have a must-stay-green
  twin. The cycle-12 closing gate carries two of them (M2-b, M4-b) for the same reason.

## What thrashed

- **The conductor's own dashboard renderer — four separate defects in one run** — why: the
  renderer had no staleness self-check, so regions that failed to update rendered as
  confident current values rather than as unknown. Cycle 1 (KI-11's root cause, open since
  run #3); cycle 3 addendum (published "notify off" while notify was ON — a check that
  *could not run* rendered as a definite negative); cycle 5 addendum (cycle-1 text
  published on four regions at once); cycle 7 (advertising cycle 7 beside cycle 6's work
  text) (cycles 1, 3, 5, 7).
- **A false denial diagnosis carried for two cycles** — why: the run recorded
  `swarm-notify.sh` as denied from the *shape* of a failure rather than by executing the
  helper under the exact form the allowlist grants. Cycle 4's addendum recorded "denial
  #33"; cycle 6 refuted it — the helper was allowlisted under its absolute path the whole
  time and had logged 11/11 ok. Two cycles of reasoning rested on it (cycles 4, 6).
- **Prose-reading gate cells blind to line wrapping** — why: raw-substring readers assume
  their target sits on one line, and documents wrap (L-043). Cycle 11's T3/T4 both
  fail-closed on this; the adjudication's own column I found the worse case — T7 asserts an
  ABSENCE, where a wrap-blind reader cannot distinguish "removed" from "still here but
  wrapped" and would have produced a **FALSE PASS** (cycle 11).
- **Builder scratch space had nowhere legal to go** — why: the target dir is an
  `additionalDirectories` entry and `/tmp` is not, so a prompt naming `/tmp` is
  unfollowable; the agent fell back to scratch trees *inside the repo*, and this repo has
  no `.gitignore`, so for the duration of the wave a `git add -A` would have committed
  them. Caught only because the scope check runs before the commit (cycle 11).
- **The playbook allowlist gap, unmoved for its 31st run** — why: it is genuinely
  structural, not incidental. `/opt/swarm/.claude/settings.json` was read directly at cycle
  12 and carries no entry for `bin/swarm-playbook.sh` in any form, and the kickoff step-5
  write that would add one is itself denied. Re-executed and denied again at cycle 12; the
  ledger stays at #31 because a second reproduction inside one run does not advance it
  (cycles 1, 12).

## Pacing honesty

- Governor clamps: **every probed cycle of the run** — `weekly.ok` true but
  `weekly_used_pct` 100 / `opus_used_pct` 100 against `week_elapsed_pct` ~37, i.e.
  `weekly_heat` 2.69–2.71, holding `ceiling: 2` and `promote_blocked: true` throughout.
  Ceilings hit: 2. Full-mode overrides: 0 (mode was `guest`, dial 0.3 — guest never
  upshifts and is clamped to gears 1–3 anyway). Promote-rung promotions: 0 — blocked by the
  governor on every cycle.
- Applied gear was **2 for the whole run** (ρ 1.05–1.14 at the last two probes), so
  demotion was live throughout: every non-judgment seat dropped one rung and the effective
  wave size was pinned at 2 regardless of what autotune had earned.
- Underused window: **this run ended with ~18.5 h of its ~24 h clock unspent, in gear 2.**
  Recorded plainly because it is not a pacing failure — it is a *brief* outcome. The run
  exhausted the work its non-goals permitted at cycle 11 and closed at 12. No amount of
  thermostat tuning would have produced more permitted work.

## Config recommendations

- [process] Never name `/tmp` (or any path outside the target) as scratch space in a builder
  prompt — it is outside `additionalDirectories`, so shell `cp`/`mkdir` are denied outright
  and the agent silently falls back to writing inside the repo; name an in-repo scratch path
  and require its removal, and treat a target with no `.gitignore` as a commit hazard for the
  whole dispatch window [apply: prompt builder "Use ./.scratch-<item>/ for any scratch tree and delete it before you finish; never write outside the target directory"] [confidence: high] [source: 2026-08-19 aphorism-cli] (evidence: cycle 11)
- [qa] Whitespace-normalise any gate cell that reads prose, and treat a cell asserting an
  ABSENCE as the dangerous case — a wrap-blind reader cannot distinguish "removed" from
  "still present but hard-wrapped", so it fails OPEN with a false pass rather than closed
  [apply: prompt qa "A gate cell that reads prose must normalise whitespace before matching; a cell asserting an absence must additionally prove the phrase was locatable in the unfixed input"] [confidence: high] [source: 2026-08-19 aphorism-cli] (evidence: cycle 11, adjudication columns A–D and I)
- [process] A reporting instrument must render "could not run" as unknown, never as a
  definite value — every one of this run's four dashboard defects was a region that failed
  to update and published a confident answer anyway [apply: prompt all "A check that could not run renders as unknown, never as a negative or a stale value"] [confidence: high] [source: 2026-08-19 aphorism-cli] (evidence: cycles 1, 3, 5, 7)
- [process] Before recording a tool as denied, EXECUTE it under the exact form the allowlist
  grants (absolute path, no env prefix, no compound command) — a denial inferred from the
  shape of a failure sent this run down two cycles of false reasoning, and the same session
  proved the adjacent script had been working all along [confidence: high] [source: 2026-08-19 aphorism-cli] (evidence: cycles 4, 6)
- [process] When the todo column empties and every survivor is human-owned, close the run
  and hand the clock back with the reason on the record — do not manufacture work to fill it;
  on a brief that forbids the only changes the taste instrument names, an early finish is the
  correct outcome and the lever is the brief, not the machinery [confidence: high] [source: 2026-08-19 aphorism-cli] (evidence: cycles 9, 11, 12)

## House-rules proposals

- [docs] A status document's counts must be re-derived at the moment of writing and dated to
  the cycle that wrote them — this report's own open-item count was falsified twice by the
  very commits that shipped it (cycles 3, 4).
- [review] When a sealed gate returns green, still read the diff — green bounds what you
  checked, never what is true (cycle 10).

## Applied lessons check

- **L-008** (conductor is sole committer): **re-observed** — carried in every builder and
  reviewer prompt; zero agent commits across 4 dispatching cycles (cycles 2, 3, 4, 5, 8, 10, 11).
- **L-016** (pairwise-disjoint fixer scopes; direct Agent calls when headless):
  **re-observed** — every wave ran as direct k=2 Agent calls with scopes in the prompt; zero
  conflicts, zero cross-scope contamination (cycles 2, 3, 4, 5, 11).
- **L-024** (verify with a discriminator): **re-observed** — cycle 11's column J distinguished
  a *sound* pass from a *lucky* one (column K) by a property a degenerate reader could not
  produce (cycle 11).
- **L-026** (route core logic to fable): **not-exercised** — this run made zero product-code
  changes; `bin/` and `src/` were untouched end to end, so no core-logic item existed to route.
- **L-029** (a new test must be FAILABLE and ATTRIBUTABLE): **re-observed** — the run's single
  added test (cycle 11, Q-8) was proved failable and attributable before acceptance; suite
  118 → 119, the only growth all run (cycle 11).
- **L-031** (find holes by mutation-measuring, not by reading the suite): **re-observed** — the
  29-clause Domain-rule coverage map re-run at cycle 3 came back 29 KILLED / 0 SURVIVED, which
  is precisely why no tests were added for "thinness" (cycle 3).
- **L-033** (classify survivors HOLE vs BOUNDARY first): **not-exercised** — zero survivors to
  classify (cycle 3, 29/29 killed).
- **L-034** (brief reviewers to REFUTE): **re-observed, twice, and it was the highest-yield
  lesson of the run** — cycle 6 refuted three of the run's own diagnoses; cycle 7's QA pass
  existed only because its skip-premise did not survive refutation and returned 3 shipping
  findings (cycles 6, 7, 8).
- **L-038** (reserve a mid-run cycle for the taste pass): **re-observed** — the TASTE gate ran
  at cycle 9, mid-run rather than in the VALUE_LOOP tail, and it is the reason TS-6 exists at
  all. Worth noting where it landed: on a non-goal wall — all 4 findings were unbuildable under
  this run's brief (cycle 9).
- **L-042** (seal the gate before dispatch; smoke it; read the diff anyway): **re-observed on
  every dispatching cycle** — 6 instrument defects caught pre-seal, and the read-the-diff
  clause produced Q-8 (cycles 2, 3, 4, 5, 8, 10, 11).
- **L-043** (never bind an assertion to regex-matched prose; the one-line assumption is the
  dominant failure): **re-observed, and sharpened** — cycle 11's T3/T4 are exactly the
  wrapping failure this lesson predicts, and column I extends it: the absence-assertion case
  fails OPEN, not closed (cycle 11).
- **L-044** (pair every must-die cell with a must-stay-green control): **re-observed** — cycle
  5's silent control was caught by its converse twin; the closing cycle-12 gate carries two
  (cycles 5, 12).
- **L-046** (implemented ≠ reachable): **re-observed, in an unexpected direction** — TS-5 at
  cycle 11 is the mirror image: the SPEC's taste note promises a "dim" attribution that is not
  implemented at all (zero ANSI on any path), while the SPEC's own Nice-to-haves list carries
  it as still-unbuilt. Documented rather than built, since building it is a locked non-goal
  (cycle 11).

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization at the last probe: overall **100%** / premium (opus) **100%**, at
  `week_elapsed_pct` 37.24 — `weekly_heat` 2.69. The governor held `ceiling: 2` and
  `promote_blocked: true` for the entire run.
- Allocator: no `runs/allocator.json` bucket data was consulted by this run; allowance
  granted vs burned is **not measured** — reported as not-run rather than estimated.
- Auto-kickoffs: this run was an allocator improvement-run kickoff (hints `source:
  allocator`, brief = housekeeping-only, no new features). Postures at start: pacing `guest`,
  dial 0.3. Three-strike queue drops: none observed.
- Final-hours floor release: **did not fire** — the run reached DONE at cycle 12 with ~18.5 h
  remaining, so no release window was ever entered.
