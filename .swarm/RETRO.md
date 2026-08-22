# aphorism-cli — run retro

Run: 2026-08-20 → 2026-08-22 (improvement run #6) | cycles run: 5 (0–5) | stop reason: WRAP_UP at step-1 clock check, **25.5 hours past `stop_at`** — see "What thrashed" for why that is a finding, not a footnote.

The run's premise: repair the README regression run #5 caused, and **measure** the guards that shaped it. No new features, no new deps.

## What worked

- **Re-aiming an unfalsifiable brief onto one falsifiable experiment.** The allocator brief said "harden tests" and "polish docs" — unfalsifiable as written, and the source of churn for five prior runs. Cycle 0 reshaped it into a single measurable question: extract the guard-shaped prose out of README.md and treat *every guard that breaks* as the finding. That made both halves of the brief checkable at once (cycle 0 decision; stress-test verdict RESHAPE, confidence 7).

- **Forbidding the builder from touching `test/`, and treating the pass/fail list as the deliverable.** Which guards break under honest prose *is* the measurement. A builder that repairs a failing guard mid-edit destroys the result. Zero guards broke — so they were anchored to structure, not to the padded prose, and the run's own premise turned out half wrong in the useful direction (cycle 1).

- **Sealed gates, unchanged across dispatch, every cycle.** Gate `5ed845eb` held 17/17 cells (cycle 3); gate `855beded` held 20/20 (cycle 4); the cycle-5 salvage gate ran 6/6. In all three the hash was identical before and after dispatch, which is the only thing that proves the check predated the work (L-042).

- **Predicting RED before dispatch instead of explaining it afterwards.** Cycle 2 committed with a citation guard red and filed Q-7. Cycle 4 did the same and filed Q-8 — but *predicted* it in the sealed gate before the builder ran, then checked the prediction: 129 tests, 127 pass, 2 fail, and the two failures were exactly the two predicted. Each was recorded as a walked exception, never re-labelled as a pass (cycles 2, 4).

- **Converse controls doing real work.** Cycle 4's headline result: C4a and C4b, *measured silent* in cycle 3, fire on byte-identical inputs after Q-3 (3 pass / 4 fail each), while converse controls C6/C5 stayed green 5/0 and C8 proved cross-row agreement is independent of per-row arithmetic. The silence was measured first and closed second — not assumed (cycles 3, 4; L-044, L-029).

- **Verifying citations against the cited system, not the citing document.** Cycle 5's gate went to GitHub's API and all four job logs: run `32405521233`, conclusion success, headSha `7e50d6f`, and 129/127/0/2 on Node 18/20/22/24 — byte-identical to the four matrix rows. A gate that reads the README to check the README proves nothing (cycle 5, cells 2/3/5).

- **k=1 waves on a guard-editing run.** Every build cycle dispatched a single builder. Zero merge conflicts, zero reverts, zero cross-scope contamination across cycles 1–4. On a run whose items all edit the same two or three documents, disjoint `files_hint` is unachievable at k≥2, and k=1 was the honest answer rather than a timid one (L-016).

- **Closing an item by discovering its work did not exist.** Q-2 carried "citations.test.js still untreated" across two cycles of notes. `git log --all` for that path is empty; only seven test files have ever been added. It was a PLAN-time `files_hint` restated as an observation, twice (cycle 4).

## What thrashed

- **The run overshot `stop_at` by 25.5 hours, respawning into a usage wall 504 times** — why: the account hit its **weekly** limit. Between 2026-08-20T18:59:48Z and 2026-08-22T16:04:02Z the pacer fired every ~5 minutes and spawned 504 cycles; all 503 that completed died in ~380 ms with HTTP 429 (`You've hit your weekly limit · resets Aug 24, 5am (UTC)`) *before their first turn*. Exhaustively classified — zero other causes. Limp mode cannot see this: it needs a session alive enough to run the tier probe, and these sessions died before turn one. L-037 already prescribes the fix (the **spawner** sets the limp flag on a usage-shaped launch failure rather than respawning on schedule); `swarm-pacer.sh` doesn't implement it, so it retried at the same cadence for a day while a crashed cycle's finished work sat uncommitted (cycles 4→5).

- **The conductor's own first diagnosis of that failure was wrong, and was written into four artifacts before being caught** — why: it was inferred from the *shape* of the evidence (a 25.5h gap, no commits, a known-dead watchdog) rather than measured at its source. One `grep` of `runs/pacer.log` falsified it. The cost is not cosmetic: the wrong version recommended a **pacer liveness check**, which would have passed every single time while the run stayed dead. Same error class this run spent five cycles hunting in documents — a claim restated confidently from adjacent evidence — committed by the conductor, about its own harness, inside the write-up of a run about exactly that (cycle 5).

- **The watchdog was structurally dead for the whole run** — why: its DONE-guard is satisfied by `<target>/REPORT.md` *existing*, which on an improvement run is true from cycle 0 because run #5 wrote it. Every firing logged "all-done / reports-present" and exited. This was *known and journaled at kickoff* (KI-R6-1), asserted-around via the pacer, and then the pacer is exactly what failed. Hard rule 5 forbids repairing it mid-run, so it was correctly left alone — but the mitigation was single-point and it was the point that broke (cycle 0; L-037, second observation).

- **A crashed cycle left complete, correct, ungated work sitting in the working tree** — why: cycle 5 died between finishing Q-8 and its persist step; no `.swarm/runs/cycle-005-*.json` was ever written. The work was good — it gated 6/6 when finally checked — but nothing on disk said it existed or that it had never been verified. `cycle.md` step 2's WIP-commit and WRAP_UP step 1's verified-only rule point in different directions for exactly this state (cycle 5).

- **`bin/swarm-playbook.sh` denied again — 9th consecutive occurrence** — why: no allowlist entry under any of the 11 `swarm-*` path forms tried. Directives were staged by direct `Read` of `learnings.md`, so the file was **never validated by the script's parser** this run. Correctly escalated once and not re-derived (KI-R6-2, L-045), but it means this run's playbook handling is unverified by its own tool (cycle 0, denials #34/#35).

- **A conductor-induced redundancy that the builder had to disclose** — why: cycle 2's dispatch mandated both a re-anchor *and* a no-shrink floor, which forced two guards in `test/readme-tags.test.js` to read the same table row. The builder flagged it rather than hiding it. Harmless, but it is not coverage, and the cause was the dispatch, not the builder (KI-R6-3, cycle 2).

## Pacing honesty

- Governor clamps: 0 cycles (`weekly_ok: true` throughout; `ceiling: 2` was set by **guest mode**, not by the governor). Full-mode overrides: 0. Promote-rung promotions: 0 — gear never rose above 2, so the promote rung was never reachable.
- Mode was `guest` with `dial: 0.3` for the entire run, clamping the reachable gear to 1–3; the applied gear sat at **2** every cycle (ρ ≈ 0.51). Under guest, a shared window is never upshifted into, which is the intended behavior and not a fault.
- Underused windows: **not measurable, and stated as such.** No budget probe ran in cycles 4→5 (the last real probe was `1787252496` ≈ 2026-08-20T18:21Z), and the run then sat idle for ~25h across roughly five window resets. Any utilization figure for that period would be fabricated. What *is* known: `weekly_used_pct: 100` and `opus_used_pct: 100` at the last probe, and the run burned nothing at all during the 25h gap.

## Config recommendations

- [process] A spawner must treat a **usage-shaped launch failure** as a limp signal and back off, not as a retryable cycle failure — limp mode structurally cannot see it, because limp needs a session alive enough to run the tier probe and these sessions die before their first turn; and the check that matters is on the spawn's **outcome**, never its liveness, because a liveness check passes while every session it starts is dying (evidence: 504 spawns / 503 × HTTP 429 weekly-limit over 25.5h, exhaustively classified from `runs/pacer.log`; KI-R6-6 — and its own first diagnosis, which recommended the liveness check, was wrong for exactly this reason)
- [process] When a cycle dies after finishing work but before persisting, the salvage decision is not WIP-vs-discard — author the verification gate at salvage time and let the result decide, because complete-but-ungated work is a third state that `cycle.md` step 2 and WRAP_UP step 1 disagree about (evidence: cycle 5, 6/6 PASS on work that would otherwise have entered as an unexamined WIP commit)
- [docs] A document that RESTATES a machine-checked rule in its own words reintroduces exactly the drift the machine check exists to prevent — quote the rule verbatim, never paraphrase it; the remedy already proven for counts (put them in a table the guard parses) has a direct analogue for rules (evidence: KI-R6-5/Q-10, cycle 5 — the history file's paraphrase selects `3a5d6e3` where the README's rule selects `7e50d6f`)
- [qa] When a document's selection rule is rewritten, test the NEW rule against the tree that motivated it before shipping — the old rule here was not merely stale but **unsatisfiable in fact**: the only commit that changed the cited paths (`a302f71`/`22fdeac`) never headed a push, so no CI run could ever exist to cite it by, and the rule would have kept pointing at `4b63e91` forever (evidence: cycle 5, cell 5, confirmed against `gh run list`)

## House-rules proposals

- [docs] Quote a machine-checked rule verbatim when referring to it from another document; never paraphrase it. If the quote is too long to carry, link to it and state nothing about its content.

## Applied lessons check

- L-008: not-exercised — every wave was k=1 and no agent needed scratch space (cycles 1–4).
- L-016: re-observed, in its k=1 corollary — all items edited the same two or three documents, so pairwise-disjoint scopes were unachievable above k=1; single-builder dispatch ran four clean waves, zero conflicts (cycles 1–4).
- L-022: **not-exercised, deliberately held out** — it prescribes persisted-UI-state cleanup for components that mount in a browser; this target is a zero-dependency terminal CLI with no browser surface. Staged as applied but kept out of `prompt_lines` at kickoff, and reported here as promised (cycle 0).
- L-024: re-observed — C4a/C4b are discriminators: they fire on byte-identical inputs that a snapshot check could not distinguish (cycle 4).
- L-026: not-exercised — no core-logic item existed; the run touched no `src/` file by construction (Q-5 invariant held all run).
- L-029: re-observed — every guard added in cycles 3 and 4 was shown both failable and attributable, with the removal arm run (cycle 4, C4a/C4b at 3 pass / 4 fail).
- L-031: re-observed — cycle 1 measured which guards break rather than reading the suite for gaps, and the measurement contradicted the run's own premise (zero broke).
- L-033: re-observed — C7 was classified as an unfixed column rather than hardened, because closing it needs an anchor outside the document; filed as KI-R6-4/Q-9 instead of producing a check that false-rejects honest output (cycle 4).
- L-034: re-observed — the cycle-5 gate was written to refute the citation, not confirm it, and went to GitHub's logs rather than the citing document (cycle 5).
- L-038: **re-observed in the inverse, and it held** — cycle 0 deliberately derived `usage_reset_at` from a real probe instead of setting it equal to `stop_at`, explicitly to avoid run #5's eleven gear-1 cycles. No such episode occurred. (The run's clock failure was of a different kind — see "What thrashed".)
- L-039: re-observed, 6th time — `bin/swarm-playbook.sh` confirmed denied under all 11 path forms by reading `settings.json` directly, not inferred from a failure shape (cycle 0, KI-R6-2).
- L-041: re-observed — cycle 4's C7 cell was reported SILENT (a measured negative) rather than allowed to read as coverage; the instrument's inability to see a coordinated falsification was published as an unfixed column (KI-R6-4).
- L-042: re-observed, 3 times — sealed gates `5ed845eb` (17/17), `855beded` (20/20), and the cycle-5 salvage gate (6/6), each hash-identical across dispatch; and the "read the diff even when green" clause paid off in cycle 5, where the gate passed 6/6 and reading the diff anyway surfaced KI-R6-5.
- L-043: re-observed, in its unstable-SUBJECT clause, **twice** — cycles 2 and 4 both walked the two-commit round trip knowingly, committing red, saying so in the commit message, and re-citing after the push. Neither was closed by narrowing the pathspec or relaxing an assertion.
- L-044: re-observed — C6/C5 held green 5/0 as converse controls while C4a/C4b fired, which is what rules out a snapshot check (cycle 4).
- L-045: re-observed, twice — Q-6 was closed at kickoff by one read rather than re-derived (cycle 0), and Q-2 was closed by discovering its remaining file had never existed on any branch (cycle 4). The converse-reading clause also drove the DONE verdict here.
- L-046: not-exercised — no domain capability was added; the run shipped zero features by brief.
- L-047: re-observed in the negative, which is the honest verdict — across cycles 3, 4 and 5 the sealed gates emitted **zero** FAILs, so no instrument-vs-work attribution was ever needed. The lesson's premise (on a mature repo the conductor's check is the likelier defect) was not tested this run.

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization achieved at reset: **not measured** — the run's last real probe was 2026-08-20T18:21Z (`weekly_used_pct: 100`, `opus_used_pct: 100`), and it then idled ~25h across roughly five resets with no probe. Reporting a figure here would be fabrication.
- Allocator: allowance granted vs actually burned — granted per `runs/kickoff-hints.json` (consumed and deleted at kickoff, per the guard); burned is **unknown for the idle window**, and ~`window_tokens: 38,488,345` / `$29.89` at the last probe covering cycles 0–4.
- Auto-kickoffs this run/week: 1 (this run, `kickoff_source: "allocator"`, `run_label: "improvement run #6"`). No 3-strike queue drops observed from inside the run.
- Final-hours floor release: **did not fire** — the run never reached its final hours as a live session; it crossed `stop_at` while dead.
