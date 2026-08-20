# aphorism-cli — run retro

<!-- Written by /swarm WRAP_UP to <target>/.swarm/RETRO.md. Evidence rules apply
     here exactly as in the verification gate: every entry cites cycle numbers
     from .swarm/journal.md. No cycle number, no entry — vibes are not evidence. -->

Run: 2026-08-20 (improvement run #5) | cycles run: 12 (cycle 0 kickoff + cycles 1–11)
| stop reason: **DONE — definition-of-done met, no VALUE_LOOP candidate cleared the ratchet
inside the brief. Early finish, ~19.4h before `stop_at`.**

## What worked

- **Measuring the instrument instead of reading the code for gaps.** Cycle 0's kickoff text
  inferred a "12 of 14 branches" coverage gap; cycle 1 measured it and found **1 unexecuted
  branch of 7** (`bin/aphorism.js:72`, false arm), classified it BOUNDARY (dead code), and
  added **zero tests**. The whole P-1 must-have closed on a measurement that contradicted
  the run's own premise. This is the single highest-leverage thing the run did: the
  alternative — building to the inferred number — is exactly the test-count churn this
  repo's brief exists to stop. (cycles 0, 1)
- **k=1 waves merged clean, all run, zero reverts.** Gear 1 pinned `k_cap` at 1 for all
  eleven cycles; every dispatched item merged on first attempt and **no merge was ever
  reverted**. One item took a second attempt (P-2, cycle 2) and that was the gate doing its
  job, not a merge failure. (cycles 2, 3, 5, 6, 8, 10)
- **Sealing the gate by sha256 before dispatch, with the seal committed.** Cycle 3 committed
  the gate hash (`d94a42e6`, commit `92f04be`) plus its pre-dispatch baseline BEFORE the
  builder was dispatched, so "the check predated the work" is a checkable claim rather than
  an assurance. Cycle 5's sealed gate then caught a self-falsifying guard **pre-commit** —
  the first time a gate on this repo prevented a bad commit rather than describing one.
  (cycles 3, 5)
- **Converse controls / must-die–must-live arms.** Cycle 9's cell A4 (a no-repeat sequence
  must be reported as 40/40 distinct by the same counter) and cycle 10's two-arm citation
  control (stale base → red, live base → green, `skipped=0` asserted in both arms) are the
  reason the green results are evidence at all. A disabled guard and a passing guard look
  identical from a summary line; these arms are what tell them apart. (cycles 9, 10)
- **Refutation-shaped QA briefs.** The playbook's qa prompt line ("your job is to REFUTE the
  central claim") produced three real defects in an already-green suite at cycle 6
  (RF-1/RF-2/RF-3) and a genuinely red main at cycle 9 that the green suite had not shown.
  (cycles 6, 7, 9)
- **Publishing a gate's own failures instead of quietly re-running it.** Cycles 8 and 10 ran
  sealed gates that emitted FAILs, published the failing output, then corrected the
  instrument in a **separate** hash-sealed addendum rather than editing the sealed artifact.
  (cycles 8, 10)

## What thrashed

- **The conductor's gate instrument was the dominant defect source of the run, not the
  builders** — why: cycle 8's gate emitted 1 FAIL (cell A4 read a prohibition as its own
  violation) and cycle 10's emitted 6 of 8 FAILs; **every one was an instrument defect and
  every behavioural assertion passed on first execution of a correct instrument.** The
  journal states it plainly: "it was my fault, not the builder's". The cost is not the
  re-run — it is that each one required a written adjudication before the item's `attempts`
  counter could be left alone, and an unadjudicated instrument FAIL would have charged a
  correct builder with a failure. (cycles 8, 10)
- **The red-commit window, three times, structurally** — why: `test/node-support-citation.js`
  cites `git diff <base>..HEAD -- src bin test .github`, so **any** commit touching those
  paths falsifies the citation at that commit, and the CI run that would refresh it cannot
  exist until after the push. Commits `5f833ab` (c5), `c08562b` (c6) and `2b003ea` (c10)
  were each knowingly red between push and re-citation. Every available fix — narrowing the
  pathspec, relaxing the assertion — is opening the gate by weakening it, so the run took
  the two-commit round trip each time and recorded the exception rather than re-labelling
  it. Filed as **P-7, human-owned**; cycle 10's RF-5 made the window visible pre-commit
  (strictly better detection, identical disposition). (cycles 5, 6, 10)
- **The denial ledger was double-booked for five cycles** — why: cycle 4 recorded a
  `swarm-notify.sh` denial as structural allowlist gap #32; cycle 9 grepped the allowlist
  and found the script present under **both** path forms — the denial came from how the
  command was composed, not from what it was. The real count is **31**, one gap
  (`swarm-playbook.sh`, which has no entry in any form). Left uncorrected it would have
  handed the operator a second, unactionable allowlist ask. (cycles 4, 9)
- **P-2 needed a second attempt** — why: the cycle-2 gate turned over two false claims, one
  of them authored by cycle 1 itself. Correct gate behaviour; recorded here because it is
  the run's only `attempts ≥ 1` item. (cycles 1, 2)
- **Six consecutive SWARM-side push failures** — why: a standing host gap, unrelated to the
  target repo (whose pushes all succeeded). Handed off, never worked around. (cycles 2–7)

## Pacing honesty

- Governor clamps: **11 of 11 cycles** (ceiling 2 every cycle; weekly 100% / opus 100% used
  against 43–44% of the week elapsed, heat 2.29–2.32). Full-mode overrides: 0.
  Promote-rung promotions: **0** — `promote_blocked` was true for the entire run.
  Applied gear was **1 (crawl) on every single cycle**, with ρ ranging 3.92–9.79.
  Voluntary idle cycles: **0**.
- One in-run window reset, at cycle 11: `window_tokens` 96.19M → 6.55M, ρ 9.79 → 3.92.
  Utilization at that reset was **100%** (the governor's own reading) — the window was
  fully spent, which is the target, but it was spent at a ceiling of 2 the whole way.
- **The run's `stop_at` was set equal to `usage_reset_at`** (both 1787276706). This is the
  exact anti-pattern L-038 names, and the run paid its price: ten consecutive crawl cycles
  in the emptiest part of a window it was scheduled to sit on the boundary of. The kickoff
  was allocator-driven, so the boundary came from the hints file, not from a human answer —
  which is where the fix belongs.

## Config recommendations

- [qa] When a sealed gate FAILS, adjudicate instrument-versus-item before the failure
  touches the item's `attempts` counter — on this run 7 of 7 sealed-gate FAILs were defects
  in the conductor's own check and none were defects in the dispatched work, so an
  unadjudicated FAIL would have charged correct builders and escalated them a routing rung
  for nothing [apply: prompt all "A gate cell that fails must be proven to fail for the
  reason it names before its verdict is recorded against the work; publish the failing
  output and repair the instrument in a separate artifact, never by editing the sealed
  one"] [confidence: high] [source: 2026-08-20 aphorism-cli]
- [process] A guard that cites a git pathspec cannot be green on the commit that changes
  that pathspec — budget the two-commit round trip (commit red, say so in the message, push,
  re-cite to the CI run that describes it) and never buy green by narrowing the pathspec or
  relaxing the assertion [confidence: high] [source: 2026-08-20 aphorism-cli]
- [process] When a run's brief locks out every candidate that clears the value ratchet, go
  DONE early and escalate the lever ONCE — do not spend the remaining clock re-deriving the
  same escalation; this run re-derived "no-repeat rotation is the highest-value change and
  is locked out by the brief" for the THIRD consecutive run, from four independent taste
  judges, at the cost of three runs' worth of housekeeping cycles [confidence: high]
  [source: 2026-08-20 aphorism-cli]
- [process] Before counting a harness denial as a structural allowlist gap, grep the
  allowlist for the script under every path form — an invocation-form denial (env-var
  prefix, `bash <script>`, relative path) looks identical at the call site and inflates the
  operator's ask with entries that already exist (evidence: the #32 → #31 correction)
  [confidence: high] [source: 2026-08-20 aphorism-cli]
- [process] Set `stop_at` strictly inside the usage-window boundary in ALLOCATOR-generated
  hints too, not only in human kickoff answers — this run's hints file set
  `stop_at == usage_reset_at` and bought eleven consecutive gear-1 cycles [confidence: med]
  [source: 2026-08-20 aphorism-cli]

## House-rules proposals

- [docs] A README section that exists to satisfy a guard should say so in one line and keep
  its provenance apparatus in `docs/` — this run's README grew 6.0 KB → 16.6 KB in a night,
  and the growth is citation bookkeeping a first-time reader of a 50-aphorism CLI meets
  before they meet the tool.
- [review] Prose that restates one number three ways is a guard-satisfaction artifact, not
  writing; when a regex guard shapes the sentence, fix the guard's anchor rather than
  padding the prose (README Tag vocabulary: "12 tags appear on 2 or more entries… 0 tags
  appear exactly once, which is to say 0 tags sit on exactly one entry").

## Applied lessons check

- L-008 (sole committer + legal scratch): **re-observed** — carried in every builder prompt
  line; zero agent-authored commits across the run (cycles 2, 3, 5, 6, 8, 10).
- L-016 (pairwise-disjoint fixer scopes): **re-observed** — cycle 6's review-fix split
  RF-1/RF-2/RF-3 across disjoint files; zero merge conflicts (cycle 6).
- L-024 (verify with a discriminator): **re-observed** — cycle 9's A4 control and cycle 10's
  two-arm citation control are both discriminators a degenerate implementation could not
  produce (cycles 9, 10).
- L-026 (route core logic to fable): **not-exercised** — gear 1 held `demote: true` /
  `promote: false` for all eleven cycles and no core-logic build item was dispatched; fable
  appeared only in judgment seats (cycles 6, 7, 9), which is the fable guard, not this
  routing recommendation.
- L-029 (failable AND attributable): **re-observed** — applied in the negative at cycle 1
  (no HOLE measured → zero tests added) and in the positive at cycle 10 (must-die/must-live
  arms with `skipped=0` asserted) (cycles 1, 10).
- L-031 (measure untested surfaces, don't read for them): **re-observed, strongly** — the
  run's headline result; measurement returned 1-of-7 against an inferred 12-of-14 and
  produced zero test churn (cycle 1).
- L-033 (classify HOLE vs BOUNDARY before hardening): **re-observed** — `bin/aphorism.js:72`
  false arm classified BOUNDARY (unreachable), hardening declined, reasoning recorded
  (cycle 1).
- L-034 (brief reviewers to REFUTE): **re-observed** — three real defects found in a green
  suite at cycle 6; a red main found at cycle 9 (cycles 6, 7, 9).
- L-038 (stop strictly inside the window boundary): **re-observed by violation** — this
  run's `stop_at` equalled `usage_reset_at` and it cost eleven consecutive crawl cycles.
  The lesson is right; the delivery path (allocator hints) does not yet apply it (cycles
  1–11).
- L-042 (seal the gate before dispatch, seal must be tracked): **re-observed** — cycle 3's
  seal committed at `92f04be` before dispatch. Residual, open as KI-8: the sealed baseline
  is readable by the builder, so the seal proves precedence, not secrecy (cycles 3, 5).
- L-043 (never bind an assertion to prose matched by regex): **re-observed and sharpened** —
  RF-1 was exactly this defect (the citation guard was steerable by the prose it read) and
  the fix moved it to a structural marker. Residual, open as KI-12: the acknowledgement
  guard is still token co-occurrence and documents itself as "NOT a meaning check"
  (cycles 5, 6).
- L-044 (pair every kill with a converse control that must stay GREEN): **re-observed** —
  cycle 9 A4, cycle 10 ARM2 (cycles 9, 10).
- L-046 (not shipped until exercised through the outermost layer): **not-exercised** — zero
  user-visible features shipped by brief, so no domain capability existed to check.

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization achieved at reset: **100% overall / 100% premium** at 43.6% of the week
  elapsed (heat 2.29). The account was in sustained overage for the entire run.
- Allocator: this was an allocator auto-kickoff (`kickoff_source: "allocator"`) under a
  TRICKLE posture brief. Allowance granted vs burned is not recorded on the target side;
  the observable is that gear 1 and ceiling 2 bound every cycle, so the run never had the
  headroom the posture assumed it might.
- Auto-kickoffs this run: 1 (this one). 3-strike queue drops: none observed.
- Final-hours floor release: **did not fire** — the run reached DONE ~19.4h before
  `stop_at`, so there were no final hours to release into.
