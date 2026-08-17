# aphorism-cli — run retro

<!-- Written by /swarm WRAP_UP to <target>/.swarm/RETRO.md. Evidence rules apply
     here exactly as in the verification gate: every entry cites cycle numbers
     from .swarm/journal.md. No cycle number, no entry — vibes are not evidence. -->

> **This file holds TWO retros, newest first.** Everything down to the horizontal rule is
> **improvement run #2 (2026-08-17)**. Below it, preserved verbatim and clearly fenced, is
> **improvement run #1's** retro (2026-08-15/16). Nothing was overwritten: run #1's own
> provenance note records that this file once silently carried a *previous* run's retro into
> a new run, and that was filed as the defect. Appending rather than replacing is the repair.

Run: **2026-08-17 improvement run #2** (allocator auto-kickoff, `source=allocator`,
`mode=guest`, `dial=0.33`, posture *trickle*, brief *"harden tests, fix playbook items,
polish docs — no new features"*) | cycles run: **9** (cycle 0 kickoff through cycle 8, plus
this WRAP_UP cycle) | stop reason: **target DONE at cycle 8**, declared with ~19 h of clock
left against `stop_at` 2026-08-18T08:34:37Z — not a stall, not a usage limit, not a crash.

## What worked

- **Sealing the verification gate BEFORE dispatch, by hash, in the repo.** The gate script
  (and at cycle 8 its pre-dispatch *output*) was written, validated, and its sha256 committed
  to the target before any agent ran; the plaintext was withheld for the dispatch window.
  This turns hard rule 2's "builders never see the check" from a promise into a mechanical
  fact. Cycle 8 closed the loop: on restore the script hashed byte-identical to its
  commitment (`c555b7a5…9cf8`) and re-running it reproduced the sealed output byte-identical
  (`d9d99054…5883`) — 24 cells × 2 arms, 48 suite runs, every verdict unchanged. That is a
  proof the tree did not move that does not require trusting a clean `git diff`. (cycles 4, 6, 8)
- **Recording the pre-dispatch READING, not just the seal.** "11/14 already hold; N1/N2/N3
  are the item" (cycle 6) and "18/24 hold; the 6 hole cells are the item" (cycle 8) were
  journaled *before* dispatch, so "it already held" could not be claimed afterwards in either
  direction. (cycles 6, 8)
- **Control and failability cells inside every gate.** Five consecutive cycles the conductor's
  own instrument was defective and a control-shaped cell caught it — c3 a missing shell glob,
  c4 a cell whose observable was an unseeded random draw, c5 a gate checking the *shape* of a
  fix rather than the *fact*, c6 a reporter-format assumption, c7 a buffer-trim off-by-one
  that truncated a path to "EPORT.md". **Five for five found by controls, zero by inspection.**
  Every one would otherwise have been charged to a builder as a defect. (cycles 3–7)
- **Checking the previous cycle's wakeup-note premise instead of inheriting it.** Cycle 6's
  note said the remaining board was "all human rulings"; cycle 7 re-read the acceptance
  clauses, found that true for T-006/T-040/J-7 and *overstated* for J-8, took J-8, and closed
  it 14/14 with 4/4 live controls. Cycle 8 then applied the same treatment to cycle 7's own
  advice and found J-9's non-human retirement branch. Two verified outcomes that pure
  inheritance would have skipped, for the cost of one grep each. (cycles 7, 8)
- **Rebuilding the builder's decisive claim rather than accepting it.** J-9's verdict *was* a
  builder measurement, and the builder had deleted its evidence with its own scratch tree, as
  instructed. The conductor rebuilt the candidate fix from the shipped test file in two
  variants across four extraction sites and added a **V0 (unfixed) column** the builder never
  ran — which showed one of its three claimed new false rejections (C6) was already RED on the
  shipped tree. Conclusion unchanged, ledger corrected. A claim reproduced is worth more than
  a claim believed, and the reproduction is where the correction lived. (cycle 8)
- **Retirement as a first-class closing branch, on measurement.** J-2's five README-prose items
  and J-9 all closed by documented BOUNDARY retirement with the measurement attached, never by
  quiet deletion or by weakening a test. Cycle 8's trade was explicit: the fix closes the hole
  6/6 and buys 2 new false rejections on ordinary true prose, so it was rejected and the hole
  stays on the record with its exact reproduction. (cycles 3, 6, 8)
- **Small waves with disjoint scope: zero merge damage all run.** 7 dispatching cycles, one
  2-item wave (cycle 3) and the rest single-item, **0 reverted merges, 0 merge conflicts, 0
  garbage returns**. `counters.k_current` autotuned 3→4→5 on clean-wave streaks and was never
  binding — the gear-3 cap and, latterly, a board with one dispatchable item were the real
  limits. Recorded so the autotune number is not mistaken for a live constraint. (cycles 3–8)
- **Semantic collision beats file-scope disjointness when composing a wave.** Cycle 4 had room
  for J-5 (k_eff 3, three pairwise-disjoint `files_hint`) and excluded it anyway, because
  `test/readme-tags.test.js` *reads* README.md, which J-4 was rewriting. The related decision
  to build gate arms with `git archive` at the pre-dispatch commit — instead of copying a live
  tree carrying another builder's half-finished edits — came from the same observation. (cycle 4)

## What thrashed

- **J-4 (docs reconciliation) needed two attempts and three gate authorings** — why: two
  distinct causes, both mine. (a) The item's unit of work was under-specified: the builder
  corrected *claims* where the acceptance meant *every occurrence* of each claim, so attempt 1
  landed 8 ledger entries where 27 were needed. (b) My gate twice encoded the previous
  attempt's fix *shape* as the required method rather than checking the *fact*, so it failed a
  correct fix. Raw scores 10/16 (c4, effective 14/16 after four of six BAD cells proved to be
  my own checks) then 9/17 → 15/21 → 22/22 (c5), where **all 14 raw failures across v1+v2 were
  the instrument and zero were real defects**. Corrections were written into addenda, never
  re-run clean. (cycles 4, 5)
- **A completion heuristic that was not a completion signal** — why: I judged builders done by
  "diff non-empty and byte-stable for 100 s", and it fired while J-2b was still writing; its
  diff then grew from 413 to 557 changed lines. No verdict was recorded off the stale reading
  (both gates were re-run against the final tree, and the P0 controls are what exposed the
  drift), but my first suite reading was 98, gate v2's first run 99, and the shipped tree 100.
  The agent completion notification is the only real signal. (cycle 3)
- **The README-prose guard family consumed 4 of 8 cycles and the false-rejection ledger never
  shrank** — why: it is a BOUNDARY, not a hole. Cycle 2 moved the ledger's membership (4 cells
  at HEAD, 4 cells on the fix) while changing only the *character* of the failures — from
  "names the wrong number, no correct action available" to "names the action: move the number
  into the table". Cycles 6 and 8 then measured the same trade twice more, and cycle 8's cost
  probe priced it exactly: 3/3 kills bought for 2 new false rejections on true sentences a
  maintainer would plainly write. The cycle-0 stress test had already fenced this family as
  the toy-version trap; the run entered it anyway, three times, each entry individually
  defensible. That pattern — a fenced area re-entered one defensible step at a time — is the
  single most useful thing in this retro. (cycles 2, 3, 6, 8)
- **The playbook was inert for the entire run: zero lessons applied, by the book** — why: J-1b,
  the allowlist gap. `bin/swarm-playbook.sh parse` was DENIED at kickoff, so SKILL.md step 3
  routed to "proceed with defaults"; the conductor deliberately did *not* hand-stage the
  directives (run #1 did), so the cost would be visible rather than papered over. The same
  denial recurred for `bin/swarm-budget.sh` in **8 of 8 cycles** and for `bin/swarm-notify.sh
  poll` from cycle 5 on. Every burn number this run came from `npx ccusage` invoked directly.
  It cannot be fixed from inside a run: a `-p` session cannot write `settings.json`. (cycles 0–8)
- **Two false "pacer silent" alerts** at 09:35Z and 10:35Z — why: `bin/swarm-health.sh` fires
  when `pacer.log` is untouched for `HEALTH_STALE_MIN` (30 min), and its suppression clause
  (`systemctl is-active swarm-pacer.service`) did not hold for cycles the pacer had already
  spawned. `pacer.log` gaps of 59 min (08:59:28→09:58:15, cycles 1–2) and 33 min
  (10:03:25→10:36:53, cycle 3) are simply long cycles working. Two pushes, both wrong, both
  during healthy work. Evidence: `runs/notify.log` "send fail ok" ×2 against `runs/pacer.log`.
  (cycles 1–3)
- **My instrument stopped catching itself at cycle 8, and that is not a win** — why: the gate
  ran correctly on first authoring because I copied cycle 6's harness wholesale instead of
  writing a new one, which removed most of the surface the previous five defects lived on.
  Reuse, not skill, and a sample of one either way. Recorded so a later reader does not price
  it as progress. (cycle 8)

## Pacing honesty

- Governor clamps: **0** cycles (ceilings hit: **none** — `weekly.ceiling` was `null` every
  cycle); full-mode overrides: **0**; promote-rung promotions: **0** (`promote_blocked: true`
  all run, from guest mode pinning the ceiling at 3, never from the governor).
- **Gear 3 in all 8 dispatching cycles**, by two independent routes that agreed every time:
  guest mode clamps the reachable ceiling to 3, and the evidence rule lands a probe with no
  limit data at cruise. **ρ was NOT COMPUTABLE for the whole run** — `ccusage` reports no
  limit, so `ratio: 0.0` in every runfile means *not computed*, never *zero burn*. Any future
  reader of this run's telemetry should treat the ratio column as absent data.
- Windows that reset below 90 % utilization: **none — and no in-run reset happened at all.**
  `usage_reset_at` was 16:00Z; the target went DONE at 13:28Z. There is no window-utilization
  figure for this run, and it is reported as not-applicable rather than filled with a number.
- Voluntary idle cycles: **0**. Limp episodes: **0**. Degraded tiers: **none** all run.
- Weekly heat trend: 0.66 (c2) → 0.88 (c4) → 1.066 (c5, first cycle hotter than elapsed) →
  1.117 (c7) → 1.071 (c8). The cycle-8 fall came from the *denominator* moving while the
  numerator held flat at 5 % — a 1 %-resolution rounding artefact, which is why a single-cycle
  heat delta is not a trend. `opus_used_pct` stayed **0** all run even though J-4 attempt 2
  ran on opus: one M-effort docs item does not move a weekly bucket.
- Measured spend, from `runs/pacer.log` `cycle-done cost=` entries for cycles 1–8:
  20.75 + 15.12 + 15.49 + 14.31 + 10.55 + 6.46 + 13.46 = **$96.14** subscription-equivalent,
  falling in the second half as the work narrowed to single-item gates.

## Config recommendations

- [qa] Seal the verification gate before dispatch: write and validate it, commit its sha256 (and its pre-dispatch output hash) to the repo, withhold the plaintext for the dispatch window, then re-hash after the builder returns — an identical hash proves the check predates the work and that the tree did not move [apply: prompt all "The conductor seals its verification gate by hash before dispatch; do not attempt to locate, read or infer the check"] [confidence: high] [source: 2026-08-17 aphorism-cli]
- [qa] Classify every surviving mutant as HOLE or BOUNDARY before hardening anything — a boundary survivor is documented, never tested around; hardening one manufactures false confidence and generates work forever [apply: prompt qa "Classify each surviving mutant as HOLE (a real gap — harden it) or BOUNDARY (behaviour the spec does not decide — document it) BEFORE writing any test"] [confidence: high] [source: 2026-08-17 aphorism-cli]
- [qa] Never bind an assertion to prose matched by regex — read a structural marker the document owns, or retire the check; a prose guard's failure mode is a false rejection of an honest document, and fixes relocate that risk rather than removing it [apply: prompt qa "Never assert against prose matched by regex — read a structural marker the document owns (a table, an explicit anchor), or retire the check"] [confidence: high] [source: 2026-08-17 aphorism-cli]
- [qa] Price a detection fix on TRUE inputs before accepting it: run the unfixed arm too, and report closed-cells AND newly-false-rejected cells — a fix that closes 6 holes and false-rejects 2 honest inputs is a trade, not a win [apply: prompt qa "When a fix closes a detection hole, measure it against true-positive controls AND against the unfixed baseline; report both columns"] [confidence: high] [source: 2026-08-17 aphorism-cli]
- [process] Treat the previous cycle's wakeup-note recommendation as a claim to check, not an instruction to inherit — re-read the acceptance clauses it summarises; two cycles here produced verified value that inheritance would have skipped, at the cost of one grep each [confidence: high] [source: 2026-08-17 aphorism-cli]
- [process] A completion heuristic based on tree stability (diff non-empty and byte-stable for N seconds) is not a completion signal — the agent completion notification is the only one [confidence: high] [source: 2026-08-17 aphorism-cli]
- [process] The dead-man staleness threshold must exceed the longest expected cycle, or long healthy cycles page the human — this run sent two false "pacer silent" alerts across 59 min and 33 min log gaps that were simply work in progress [confidence: med] [source: 2026-08-17 aphorism-cli]

## House-rules proposals

- [docs] A number that is only true at a particular commit must name that commit in the same
  sentence or table header, with the command to re-derive it — REPORT.md's vintaged
  derivation table survived a later re-check that would otherwise have read as a false claim
  (cycles 5, 7; KI-23 closed on exactly this).
- [docs] State a fact once. A sentence that restates the same count in two clauses reads as two
  independent claims and invites a guard to double-count it (cycle 5, ledger entry 17).

## Applied lessons check

**Zero lessons were applied this run**, so there is nothing to re-observe or contradict —
`runfile.playbook.applied` is empty and `parse_source` records why (J-1b: the parse was denied,
and step 3 routes a parse failure to defaults). This is itself the finding: the playbook
mechanism was inert for a second consecutive run on the same config gap, which is what J-1a
and J-1b exist to make visible. L-039 in the current playbook ("allowlist helper scripts by
absolute path for the host they will actually run on", learned 2026-08-16 on *moon*) predicted
this exact failure and could not be applied, because applying it requires the tool it describes.

## Telemetry (squeeze slice, 2026-08-14)

- Weekly utilization achieved at reset: **not applicable — no usage-window reset occurred
  during this run** (reset 16:00Z, run ended 13:4xZ). At the last probe: overall 5 %, premium
  (opus) 0 %, against 4.67 % of the week elapsed.
- Allocator: posture *trickle* throughout; `allow_overall_pct` tightened 9 → 8 → 7 → 6 → 6 → 5
  across cycles 2–8, and the run stayed compliant with it (housekeeping only, zero product
  code, zero new dependencies). Granted-vs-burned cannot be stated as a ratio because the
  allowance is a percentage posture, not a token grant; burned was $96.14 by `pacer.log`.
- Auto-kickoffs this run/week: **1** (this run, 08:34:37Z, `mode=guest dial=0.33
  posture=trickle`); postures at start: trickle; 3-strike queue drops: **0**.
- Final-hours floor release: **did not fire** — the run ended ~19 h before `stop_at`, so the
  release window was never entered.

---

# PRIOR RUN — improvement run #1 retro (2026-08-15 → 2026-08-16), preserved verbatim

<!-- Everything below this line is improvement run #1's retro exactly as its WRAP_UP left
     it at 2026-08-16T11:24Z. It is history, not a description of the repo today: its cycle
     numbers are run #1's, and its counts were true when written. Improvement run #2's retro
     is above. Nothing here was edited by run #2. -->

## aphorism-cli — run retro (run #1)

<!-- Written by /swarm WRAP_UP to <target>/.swarm/RETRO.md. Evidence rules apply
     here exactly as in the verification gate: every entry cites cycle numbers
     from .swarm/journal.md. No cycle number, no entry — vibes are not evidence. -->

Run: **2026-08-15 improvement run** (allocator auto-kickoff, `source=allocator`,
brief *"harden tests, fix playbook items, polish docs — no new features"*) |
cycles run: **47 complete and counting** — PRE-DRAFTED at cycle 42, **refreshed at cycle 48**
(~3h34m before `stop_at` 2026-08-16T11:24:24Z) | stop reason: **not yet stopped**; drafted
early because a session death before WRAP_UP would otherwise hand the human the *previous*
run's retro.

> **Provenance note.** Until cycle 42 this file was the **2026-08-14 SMOKE run's** retro
> (1 cycle, 4424 bytes, untouched since 05:44 that morning). That is the identical defect
> cycle 41 found and fixed in `REPORT.md`, in the identical place, and the reason both
> documents were pulled forward out of WRAP_UP. The cycle count, item counts, and
> telemetry below are conductor-measured at cycle 42 and are re-measured at WRAP_UP.
>
> **Cycle-48 refresh note.** Drafting early buys durability and costs currency: five cycles
> later this document was describing a product that had changed under it. Cycle 46 shipped a
> **product change** (T-007, the tag consolidation) and cycle 43 **root-caused KI-5** after
> this document had already characterised it as a black box. Cycle 47 found and fixed exactly
> that decay in `REPORT.md`; this refresh is the same repair, one document over, and the
> generalisation is recorded below under *What thrashed*. Every count in this header was
> re-measured against the live repo at cycle 48 — none is inherited from the cycle-42 draft.

**Board at cycle 48:** 54 items — **42 done**, 6 todo, 2 blocked, 4 dropped.
Done by kind: test 21, docs 7, fix 6, qa 4, feature 3, polish 1.
Suite: **48 green at kickoff → 80 green at cycle 48**, `fail 0` (re-run by the conductor this
cycle: `tests 80 · pass 80 · fail 0`).
All **12 chartered improvement must-haves are closed** — I-1, I-2a, I-2b, I-2c, I-3, I-4,
I-4a, I-4b, I-5, I-6, I-7, I-8 (`status: done`, every one gated; I-4 is the umbrella whose
outcome is its two children).

## What worked

- **Mutation-measurement as the source of work, not suite-reading (cycles 4, 19).** Both
  sweeps generated the run's real backlog: cycle 4's 27 mutants → 7 survivors → items
  I-2a/I-2b/I-2c; cycle 19's sweep → 12 survivors classified 10 HOLE / 3 BOUNDARY →
  T-014..T-017, which became six of the run's 21 shipped test items. Nothing in this run
  that came from *reading* the suite for gaps produced a closed hole.

- **Classifying every survivor HOLE or BOUNDARY *before* hardening (cycles 4, 19, 33, 35,
  39, 40).** This is what stopped the run from manufacturing test-count. Cycle 4 deferred
  M16 because no rule existed to test against; cycle 19 deliberately left C3 and C7 alone
  (C7 — the "Node 18+" claim — cannot be verified by any test in a repo whose suite runs on
  whatever Node is installed, so a test asserting `18` would *look* like verification while
  verifying nothing). Cycle 39 closed four items as documented BOUNDARY rather than
  narrowing a guard a fourth time.

- **The failable-AND-attributable double arm (cycles 5, 6, 20, 22, 23, 34, 36, 37, 38).**
  Every new test was run twice: once with the mutation and the test present, once with the
  mutation and the test removed, requiring the second arm to go green at the *pre-cycle
  baseline count*. Cycle 5 found the strict form was the only honest one (M12 is
  length-changing, so per-test isolation reads as a failed attribution when it is really an
  expected overlap). Cycle 23 caught a test that passed but was **not attributable** — the
  binary-side kills belonged to a pre-existing test, and reporting them as T-017's value
  would have inflated the item threefold.

- **The consistent-change discriminator (cycles 21, 22, 24).** Every acceptance-shaped check
  asks whether a *wrong* README is caught, and a guard that hardcodes today's numbers passes
  all of them. Only changing the real artifact and the README *together* and requiring green
  separates a derived guard from a hardcoded one. Cycle 21 ran it against the corpus; cycle
  22 generalised it to three different kinds of ground truth (a source module, another
  document, the filesystem); cycle 24 extended it from changing the artifact to changing the
  artifact's **shape**, using a three-band README layout this repo has never had.

- **Sealing the gate design before dispatch (cycles 30, 36, 37, 38).** After KI-8 found the
  sealed baseline was readable by the builder it was sealed *from*, the run switched to
  commit-reveal: publish the hash before dispatch, the plaintext after the builder returns.

- **Conductor-authored gates catching conductor-authored documents (cycles 41, 42, 43, 44,
  47, 48).** When the conductor writes both the artifact and its check, builder-blindness is
  gone. The substitute that worked is a **negative-control arm**: the previous version of the
  document must score 0. Cycle 41 landed 13/13 against a 0/13 control and found two genuine
  defects in its own report (a missing I-4 row; a KI-1 severity graded from a file the report
  does not cite — **KI-1 is not in this run's `state.json`**: it was resolved in the
  *2026-08-14* run and never carried forward, so its only provenance is that run's report).
  The method kept earning its keep after drafting: cycle 44's gate **refuted the conductor's
  own first draft of its central claim** and the claim was restated to the measurement rather
  than the regex widened to fit it; cycle 47 ran 51 cells against a 14-mutation control and
  went **red on two of its own cells**, both real defects in the conductor's work, fixed
  rather than argued away. The arm that generalises is not the control alone but the
  requirement that **each planted mutation redden its OWN cell** — a mutation caught by some
  other cell proves coverage, not attribution.

- **Zero agents is not zero product work (cycles 41–48).** The strongest single correction
  this run made to its own thinking. From cycle 39 the allocator authorised **0%** agent
  burn, and cycles 41–43 recorded — in this document, in `REPORT.md`, and in the journal —
  that no further product work could land because "all six remaining todos need a builder".
  **Cycle 46 refuted it by doing it**: T-007 consolidated the tag taxonomy 37 → 12 in a
  gear-1, zero-agent, conductor-inline cycle, and it is a user-visible behaviour change on a
  shipped CLI. Cycle 44 had already found the arithmetic half of the same error (three of the
  six todos are S-effort, which gear 1 explicitly *admits*, so the gear was never what held
  them — a standing measured decision was). The generalised lesson, now written into
  `REPORT.md`'s unfinished-work table: **ask whether an item needs an agent or only a
  worker.** A dispatch cap was being read as a cap on work.

## What thrashed

- **T-024a — two rejections, then blocked (cycles 31, 32).** Why: it asks a guard to bind
  each Attribution count to its own marker, and the measurement at cycle 32 showed the two
  candidate bindings each false-reject some naturally-written, entirely-**true** README.
  The item is not hard to implement; it is **underdetermined**, which is now recorded as
  KI-9 rather than carried as a failing item. Cost: the run's only two consecutive
  no-verified-value cycles, which tripped the churn breaker at cycle 32 and forced the
  work-type switch that produced cycle 33.

- **T-021 — rejected once, landed on attempt 2 (cycles 28, 30).** Why: attempt 1 narrowed a
  prose anchor; attempt 2 replaced it with a structural locator that is loud on ambiguity.
  The pattern, not the item, is the lesson — see the next entry.

- **The prose-anchor guard family: five items, five narrowings, one standing defect
  (cycles 20, 22, 25, 27, 33, 35, 37, 38, 39).** Why: every README guard this run built
  extracts a number by anchoring to a position or a literal in *English prose*, and every
  fix narrowed the anchor rather than removing it. Each narrowing bought a real, attributed
  kill and left a smaller false-rejection hole (T-018 → T-020 → T-022 → T-023 → T-032;
  separately T-033 → T-035 → T-037/T-038 → KI-12). Cycle 25 named it a standing design
  finding rather than five bugs; cycle 39 stopped the treadmill on measurement rather than
  fatigue. **The failure direction has been safe every time** — these guards reject a
  correct README loudly, never pass a wrong one silently — but a maintainer's cheapest
  escape from a false rejection is deleting the guard, so the cumulative risk is that the
  whole family is removed at once.

- **The instrument failed before the item did, four times (cycles 19, 23, 24, 41).** Why:
  conductor harnesses were written per-cycle and re-made the same class of mistake —
  measuring the *reporter* instead of the claim. Cycle 19 is the dangerous one: `node --test`
  defaults to the spec reporter, so TAP regexes returned null, the `survived` predicate
  evaluated false for **every** mutant, and the harness manufactured a KILLED verdict for
  all 21 — including the unmutated PRISTINE control. Only the control exposed it. Cycle 23
  repeated the class (TAP `not ok` sniffing under the default reporter); cycle 24's was
  loud and safe (a SyntaxError); cycle 41's counted its own artifacts into the number it
  was asserting. **Every repair demanded strictly more than the version it replaced.**

- **Scratch debris in the SWARM root, four occurrences (cycles 9, 19, 21, 24 — KI-7).**
  Why: hard rule 5 hands agents target paths only, but the session cwd **is** `/opt/swarm`,
  so a relative scratch path lands inside the write fence by default. An agent cannot honor
  "do not write to SWARM" if it does not know where it is standing. Fixed by naming an
  explicit scratch path in the dispatch prompt from cycle 19 on; the control has passed for
  4 consecutive cycles since.

- **`/tmp` worktrees are unreachable to builders (cycle 18 — KI-6).** Why: subagents in this
  VPS `-p` session are sandboxed to the session `--add-dir` list. The builder reported the
  blocker instead of fabricating a diff, which is the good outcome; the cost was one wasted
  dispatch, and SKILL.md's headless rule had prescribed the direct-tree form all along.

- **`bin/swarm-budget.sh` refused on all 47 cycles — and the run spent 42 of them
  re-observing the refusal instead of reading the permission file (KI-5, root-caused cycle
  43, extended cycle 47).** Attempted rather than skipped every cycle per the cycle-14 rule,
  in both path forms per cycle 27. **Never fatal, never once informative** — the gear came
  from `runs/allocator.json` all run. What thrashed is not the refusal but the *diagnosis
  latency*: for 42 cycles KI-5 was a black-box observation restated 42 times, and the fix was
  one `Read` of `/opt/swarm/.claude/settings.json`.

  **Root cause (cycle 43, 16/16 gate, 7/7 predicted cells, 2 negative controls).**
  `permissions.allow` contains exactly **two** SWARM-script entries —
  `Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)` (a **macOS path, absent on this
  host**) and `Bash(bin/swarm-notify.sh:*)` (relative, the one that works). There is **no
  entry for `swarm-budget.sh` or `swarm-playbook.sh` in any path form**, and none for the VPS
  prefix `/opt/swarm/bin`. **The settings file was never migrated from macOS to the VPS.**
  The claim gated was the strong one — that the allowlist *predicts* which invocations are
  permitted, including cells never previously measured — and the discriminator is cell 3
  against cell 4: same script, same arguments (`swarm-notify.sh poll`), **varying only the
  path form, and they come out opposite.** A "the script isn't allowlisted" theory predicts
  those two alike; the allowlist predicts them opposite. That is the observation a wrong
  theory could not have produced.

  **Second, independent failure mode (cycle 47).** The working entry is *cwd-relative*, and
  the pacer does not guarantee cwd. Proven both ways in one cycle: `bin/swarm-notify.sh poll`
  from `/opt/swarm` **succeeded** (the run's first successful poll), while cycle 46 — running
  from the target dir — saw the same entry fail with exit 127. **A settings repair that adds
  only relative entries closes neither failure mode reliably; absolute entries close both.**
  That is the concrete instruction for the human, and it is two lines of `settings.json`.
  **NOT FIXED, deliberately** — hard rule 5 makes `settings.json` read-only until WRAP_UP.

  **Operational consequences, derived from the allowlist rather than executed** (S9 was
  deliberately not tested, because testing it means pushing to the user's phone at 05:00):
  WRAP_UP's `bin/swarm-playbook.sh append` **will** refuse, so the manual DISTILL fallback is
  confirmed necessary rather than assumed — which is what licensed pre-drafting the candidate
  set at cycle 43 (13/13, 2 negative controls, at `runs/wrapup-candidates.md`, mirrored into
  the target repo at cycle 43 because SWARM `runs/` is gitignored). And
  `bin/swarm-notify.sh send wrap-up …` (relative, cwd `/opt/swarm`) **will** be permitted, so
  the wrap-up push can go out — previously assumed dead.

- **Hand-off documents decay silently, and this one decayed too (cycles 41, 42, 47, 48).**
  Why: `REPORT.md` and `RETRO.md` are WRAP_UP obligations pulled forward for durability, and
  a document written early is a *snapshot* while the run keeps moving. Three occurrences, the
  same defect each time. (1) Cycle 41 found `REPORT.md` was the previous run's, 40 cycles
  stale. (2) Cycle 42 found this file was the **2026-08-14 SMOKE run's** retro. (3) Cycle 47
  found the freshly-rewritten `REPORT.md` had become **factually wrong about the shipped
  product** within five cycles — it described a 37-tag corpus six cycles after the corpus
  stopped having one, and listed T-007 as needing "a run on a healthy weekly window" six
  cycles after a zero-agent cycle had landed it. This cycle-48 refresh is occurrence (4),
  against this document. **The cost is asymmetric and that is why it keeps earning a cycle:**
  these two files are the run's entire hand-off to a human who reads them once, at `stop_at`,
  with no other window into the night — a stale deliverable does not merely omit, it
  *misinforms*, and it does so with the full authority of a gated document. The countermeasure
  the run converged on is cheap: **re-measure every number in a hand-off document against the
  live repo before trusting it, and retract superseded claims in place rather than deleting
  them**, so the reader sees what changed and can judge the drift for themselves.

## Pacing honesty

- **Gear 1 for all 47 cycles; effective wave size 1 for all 47 cycles.** Not a thermostat
  response — structural. `pacing.mode` is `guest` (clamps reachable gears to 1–3, dial
  forced to 0.30), and the binding constraint was the **allocator allowance**, not the gear
  logic: `allow_overall_pct` has been **0** since kickoff.
- **Governor clamps: engaged from cycle 37 at ceiling 3**, briefly disengaged at cycle 41.
  Nine `weekly_heat` readings, quoted as readings and not as a trend (L-032): 1.1115 (c39) →
  1.1060 (c40) → 1.0993 (c41, dips below 1.1) → 1.1054 (c42, re-engaged) → 1.0962 (c46) →
  **1.0870 (c48**, 95.0/87.4). `opus_heat` **1.1099** at cycle 48, under the 1.2
  `promote_blocked` threshold, as it has been all run. **Inert in every one of those cycles**
  — the ceiling has never been the binding constraint, because the gear is pinned at 1 by the
  allowance. Cycle 47 took **no reading at all** (the allocator was blind, KI-16); its zeroes
  are excluded here rather than plotted as a ninth point, because a default is not a
  measurement.
- **Full-mode overrides: 0** (guest all run). **Promote-rung promotions: 0** (gear never
  reached 5; `promote_blocked` stayed false, and it never mattered). **Demotions: standing**
  (`demote: true` in every cycle).
- **Underused windows: none observable.** The weekly window resets at 1786942799, which is
  *after* `stop_at` 1786879464 — no window reset falls inside this run, so no
  reset-utilization figure can be attributed to it. Reported as not-observable, not as zero.
- **Zero agents dispatched from cycle 39 through cycle 47 — nine consecutive cycles**, and
  cycle 48 is the tenth. Cycles 39/40 held on a conservative reading of an ambiguous posture;
  cycle 41 **measured** it, transcribing `bin/swarm-allocator.sh`'s `calc()` from its own
  constants and replaying it — human reserve 24.01% against a weekly remainder of 7%, so
  `allow = 0` at now *and* at `stop_at`. Re-measured at cycle 42 on fresh inputs (reserve
  **23.67**, remainder 6%): **still 0**, and the transcription still reproduces the shipped
  script's own number to within a rounding step. The computed reserve is a function of the
  clock and falls continuously as the week elapses — 24.01 (c41) → 23.67 (c42) → 23.3 (c43) →
  22.99 (c44) → 22.73 (c45) → 22.41 (c46) → **21.83 (c48)** — so only the *reported* figure
  and the `stop_at` projection are quoted as literals here; the live arithmetic is re-run by
  the gate rather than frozen into this sentence. At `stop_at`: reserve **20.17**, allow **0**.
  **What those ten cycles produced:** I-6, T-026, the KI-5 root cause, the reachability
  correction, a backlog re-ranking, the DISTILL candidate set, **T-007 (a shipped product
  change)**, the `REPORT.md` refresh, KI-16, and this document. See *Zero agents is not zero
  product work* above — the framing that these cycles could not ship product was this run's
  own, and this run refuted it.

- **KI-16 (high, open) — the allocator fails open, and cycle 48 caught it out.** At cycle 47
  `runs/allocator.json` was rewritten with **every usage field zeroed**, `"ok": false`,
  `"source": "none"` — and `allow_overall_pct: 10`. A non-zero spend authorisation derived
  from **no data**. The allowance was **declined** and the cycle held at zero agents; the
  discriminator against the innocent explanation (the week rolled over, so the counters are
  legitimately fresh) is that `week_resets_at` was **0**, whereas a genuine reset carries a
  future epoch — the true reset, 1786942799, is ~19h out and *past* `stop_at`. Sharper still:
  **the same script's jq-missing fallback emits `allow 0`, so the conservative default exists
  in the file and the no-data path does not use it.**
  **Cycle 48 supplies the confirming measurement.** The next real probe (`"ok": true`,
  `"source": "probe"`) reads `allow_overall_pct` **0** — weekly 95.0%, opus 97%, elapsed
  87.4%, reserve 21.83. So the blind file's 10% was not a stale-but-roughly-right figure: the
  window it was authorising spend against permits **zero**. Accepting it would have burned
  agent budget on the strength of a file that declares its own data source absent. Distinct
  from **KI-14**, which wipes only the swarm's own spend counter on a false rollover; this is
  the whole file defaulting *permissive* when blind. Filed, not fixed (hard rule 5).

## Config recommendations

- [qa] Documentation guards must extract from **structure** — tables, rows, delimited
  tokens — and anchor to English prose only where the prose token carries mathematical
  meaning; five consecutive narrowings each bought one attributed kill and left a smaller
  false-rejection hole, and the maintainer's cheapest escape from a false rejection is
  deleting the guard [apply: prompt qa "Extract documentation-guard values from structure (tables, rows, delimited tokens), never by position in English prose; if the value is only expressible in prose, classify it BOUNDARY instead of narrowing the anchor."] [confidence: high] [source: 2026-08-15 aphorism-cli]
  (evidence: cycles 20, 22, 25, 27, 33, 35, 37, 38, 39; KI-9, KI-10, KI-12)

- [process] When the conductor authors **both** an artifact and its verification gate, the
  builder-never-saw-the-check protection is gone; substitute an explicit **negative-control
  arm** requiring the artifact's previous version to score 0 on the same checks
  [apply: prompt all "When you author both the artifact and its gate, add a negative-control arm: the previous version of the artifact must FAIL the same checks. A gate only its own subject can pass is not a gate."] [confidence: high] [source: 2026-08-15 aphorism-cli]
  (evidence: cycles 41 — 13/13 vs 0/13, two genuine document defects found; 42)

- [process] Every dispatch prompt must name an **explicit scratch path inside the target**;
  agents are given target paths only, but the session cwd is the SWARM root, so a relative
  scratch path silently lands inside the hard-rule-5 write fence
  [apply: prompt all "Write all scratch files to <target>/.swarm/scratch/ and remove them before returning. Never use a relative scratch path — your cwd is not your workspace."] [confidence: high] [source: 2026-08-15 aphorism-cli]
  (evidence: cycles 9, 19, 21, 24 — KI-7, four occurrences, zero after the prompt named a path)

- [process] A sealed pre-dispatch baseline must live **outside** the target directory, or be
  sealed by commit-reveal (publish the hash before dispatch, the plaintext after the builder
  returns) — `<target>/.swarm/runs/` is inside the directory every builder can read
  [apply: prompt all "Seal pre-dispatch baselines by publishing only their hash; reveal the plaintext after the agent returns."] [confidence: high] [source: 2026-08-15 aphorism-cli]
  (evidence: KI-8 found at cycle 30; commit-reveal applied cycles 36, 37, 38)

- [process] A conductor harness must fail **UNPARSEABLE** rather than fall through to a
  verdict, and must force `--test-reporter=tap` when it parses test output; a null parse
  that evaluates to "killed" manufactures a clean sheet for every mutant including the
  control [apply: prompt all "Parse test output only under an explicitly forced reporter, and make an unparseable run report UNPARSEABLE — never let a failed parse fall through into a pass/fail verdict."] [confidence: high] [source: 2026-08-15 aphorism-cli]
  (evidence: cycles 19, 23, 24, 41 — four instrument failures, one of them silent)

### Below the line — two candidates the cap cannot carry

The five above are **already drafted, gated (13/13, 2 negative controls) and staged** for
WRAP_UP at `/opt/swarm/runs/wrapup-candidates.md` as L-037…L-041, mirrored into this repo at
cycle 43. DISTILL is capped at **≤ 5 per run** and the script enforces it. Cycles 43–48 then
produced two more findings of lesson quality. They are recorded here **below the line, not
smuggled in as a sixth** — the honest options are to displace one of the five or to leave
these for a future run's second observation, and that is the human's call, not the
conductor's. Neither is in the gated set:

- **[process] A conductor must re-measure a pulled-forward hand-off document against the live
  repo before `stop_at`, and retract superseded claims in place rather than deleting them.**
  Four occurrences this run (cycles 41, 42, 47, 48), one of which left the report *factually
  wrong about the shipped product* for six cycles. Ranked below L-038 because L-038's
  negative-control arm is the mechanism that *catches* this, and a lesson naming the
  mechanism beats one naming the symptom.
- **[process] An authorisation file that reports its own data source as absent must be read
  as authorising zero, never as authorising its default.** KI-16, cycles 47–48 — the blind
  file emitted `allow 10` while `ok:false`/`source:none`, and the next real probe measured
  the true allowance at **0**. This is arguably the highest-value finding of the late run,
  and it is held below the line for a reason worth stating: it is a **SWARM tool defect**,
  and lessons are crew-tuning only by the playbook's own bans — the repair belongs in
  `bin/swarm-allocator.sh` (whose jq-missing path *already* emits the correct conservative
  0), not in a prompt line.

**Not a new candidate lesson — a confidence bump on an existing one.** Playbook L-033
(classify each mutation survivor HOLE or BOUNDARY before hardening anything) carries
`confidence: med`. This run is a strong second independent observation of it (cycles 4, 19,
33, 35, 39, 40), including the case it was written for: cycle 39 stopped a five-deep
narrowing treadmill by classifying rather than hardening. It was **not** staged in this
run's `runfile.playbook.applied`, so it is recorded here as evidence for promotion to
`confidence: high` rather than as an applied-lessons verdict.

## House-rules proposals

- [docs] A number stated in prose that is also derivable from an artifact in the repo must be
  written adjacent to its own marker within a single delimited clause, so a guard can bind
  the two without positional guessing (cycles 22, 33, 39).
- [review] Report what a new test catches **that nothing else does**, not what it happens to
  notice — kills attributable to a pre-existing test are not the new test's value (cycle 23).
- [docs] When an agent volunteers an uncertainty about its own work, probe exactly that
  uncertainty before accepting the item; it converted directly into a measured backlog item
  eight times this run (cycles 22, 33).

## Applied lessons check

Fifteen lessons were staged at kickoff (`runfile.playbook.applied`). The playbook script is
refused in this session (KI-5), so they were hand-parsed from `playbook/learnings.md`.

- **L-003** (hand-computed QA expectations): **re-observed** — cycle 13's QA-full swept 37
  tags, 37 prefixes and 40 filter pairs against hand-computed expectations (27/27 harness
  checks, 0 divergences); cycle 14 re-derived the taste agent's singleton-tag figure and
  found it wrong (21, not 23).
- **L-024** (verify with a discriminator): **re-observed, load-bearing** — the run's central
  method, and the lesson with the widest reach: it decided outcomes about the product, about
  the tooling, and about the budget. Cycle 7's seven-distinct-seeds and set-equality
  discriminators; the cycle-21/22/24 consistent-change pairs. Two late applications outside
  the test surface entirely: cycle 43's **cell 3 vs cell 4** (same script, same arguments,
  varying only the path form, coming out *opposite* — the observation a wrong theory of KI-5
  could not produce), and cycle 47's **`week_resets_at == 0`**, which separated "the allocator
  is blind" from "the week legitimately rolled over" and is the whole basis for declining the
  10% allowance (KI-16).
- **L-029** (failable AND attributable): **re-observed, load-bearing** — the standing form of
  every test gate this run (cycles 5, 6, 20, 22, 23, 34, 36, 37, 38). Cycle 23 is the proof
  it earns its keep: a test that passed but was not attributable. Late cycles extended it
  from tests to **documents**: cycle 47 required each of 14 planted mutations to redden its
  **own** cell, and reported a mutation that failed to *apply* (its anchor had moved) as a
  FAIL rather than skipping it — which is why two such cases were caught rather than counted
  as passes.
- **L-031** (mutation-measure, don't read for gaps): **re-observed** — cycles 4 and 19; both
  sweeps produced exactly the items that closed real holes, and cycle 19's found a surface
  this run had itself created. Cycle 46 added the complementary case: rebuilding two fixtures
  the T-007 retag invalidated, it mutation-proved one in 3 cells and found the other **had
  gone vacuous** — an assertion still passing while testing nothing. Reading the suite would
  have shown a green fixture; measuring it showed an empty one.
- **L-034** (brief reviewers to REFUTE): **re-observed** — cycle 33's independently-briefed
  classifier **refuted the conductor's own** T-026 BOUNDARY verdict, which was reverted and
  reopened as a HOLE; cycle 38's D2 refuted a conductor prediction. Both times the refutation
  brief caught the conductor, not the builder.
- **L-008** (conductor is the sole committer): **contradicted in text, upheld in spirit** —
  the only measured contradiction of the run. Cycles 15, 16 and 17 each produced a real
  two-parent merge commit (`b47d0e0`, `73604d3`, `d737296`) whose side parent is a
  **builder-authored** commit, despite the directive being staged in every builder prompt.
  No harm followed: the branches were pairwise disjoint and merged sequentially with the
  suite run after each. From cycle 18 on (KI-6 made `/tmp` worktrees unreachable) builders
  wrote directly into the shared tree — the case the lesson is actually *about* — and the
  conductor was sole committer for all 24 remaining cycles. **The directive's text is
  stricter than its rationale**; it should be scoped to shared-tree dispatch rather than
  forbidding branch-per-item commits.
- **L-006**, **L-007**, **L-018**, **L-021** (browser/live-look QA): **not-exercised** —
  aphorism-cli is a zero-dep Node CLI with no browser or server surface. Staged faithfully
  rather than silently dropped (`apply_mode` is `auto`, and hard rule 5 forbids editing the
  playbook's intent mid-run); recorded as inert in `runfile.playbook.directives.inert_note`.
- **L-011** (React hook mount tests), **L-020** (env-var `beforeEach`), **L-022** (persisted
  UI state): **not-exercised** — no React, no env-var-dependent tests, no UI in this target.
- **L-016** (pairwise-disjoint fixer scopes): **not-exercised** — no review-fix pass ran.
  Judged and declined at cycle 14 and never revisited; at gear 1 with an effective wave size
  of 1 there was never more than one agent in flight to give disjoint scopes to.
- **L-026** (route core logic to fable): **not-exercised** — every dispatched item ran on
  **sonnet**. Gear 1 carries `demote: true` for the whole run, so the routing recommendation
  was unreachable by construction. This is the one staged directive that a healthier window
  would have exercised and this one could not.

**Honest summary of the check:** 5 re-observed, 1 contradicted, 9 not-exercised. More than
half the staged playbook was inert against this target — four lessons are browser-specific
against a CLI, three are React/UI-specific, and one was unreachable at gear 1. That is a
**staging** problem, not a playbook-content problem: `apply_mode: auto` stages every
apply-able lesson regardless of target shape. The nine break down as four browser-specific
against a CLI (L-006/L-007/L-018/L-021), three React/UI-specific (L-011/L-020/L-022), one
needing a review-fix pass that never ran (L-016), and one unreachable at gear 1 (L-026).

## Telemetry (squeeze slice, 2026-08-14)

- **Weekly utilization achieved at reset: NOT OBSERVABLE from this run.** The window resets
  at 1786942799, after `stop_at` 1786879464. Last **real** reading (cycle 48,
  `runs/allocator.json`, `ok:true`/`source=probe`): **overall 95.0%, premium/opus 97%**, week
  elapsed **87.4%**, `reserve_overall_pct` **21.83**. The cycle-47 read is excluded: it
  reported `ok:false`/`source:none` with every usage field zeroed, and a default is not a
  reading (KI-16).
- **Allocator — allowance granted vs actually burned.** Granted: `allow_overall_pct` **0**,
  `allow_premium_pct` **0**, for the entire run — **confirmed against a real probe at cycle
  48**, the last measurement of the run to date. Burned: `swarm_used_pct` rose to **4** (the
  `trickle_pct` cap) by cycle 39, at which point the posture flipped `trickle → halted`;
  agent burn has been **0 since cycle 39** — ten consecutive cycles. At cycles 42 and 48
  `swarm_used_pct` reads **0** again with the posture back at `trickle` — that is **KI-14's
  rollover-jitter wipe**, not a real refund, and it granted no spend because `allow` is
  already 0 on the reserve curve, which the wipe does not touch.
- **Auto-kickoffs this run/week: 1** (this run; `source=allocator`, posture at start
  `trickle`). 3-strike queue drops observed: **0**.
- **Final-hours floor release: did NOT fire, and structurally cannot fire before `stop_at`.**
  The floor (`floor_pct` 12) releases only within 6h of the week reset; `hours_left` at
  `stop_at` is **17.59h**. Measured at cycles 41 and 42 with
  `runs/cycle-041-allocmath.js`. Tokens burned in the release window: **n/a**.

## The honest hand-off

Machine-checked and true as of cycle 48: **80 tests green** (re-run this cycle); all **12**
chartered improvement must-haves closed; every one of the **42** done items passed a
conductor-authored gate whose output is pasted in the journal.

> **Retracted in place, not deleted.** The cycle-42 draft of this paragraph said "**11**
> chartered must-haves" while its own header said 12. The measured figure is **12** (I-1,
> I-2a, I-2b, I-2c, I-3, I-4, I-4a, I-4b, I-5, I-6, I-7, I-8 — all `status: done`). The
> document contradicted itself for six cycles and no gate caught it, because until this cycle
> no gate had been pointed at *this* document. Recorded rather than quietly corrected: an
> internal contradiction that survives is evidence about the checking, not just the claim.

**Needs a human, and is new since the cycle-42 draft: T-040 — ratify the T-007 retag.** Cycle
46 consolidated the tag vocabulary **37 → 12** by a mechanical fold map (21 of the 37 tags
had been returning a fixed single line; the corpus now has **0 singleton tags** and a
thinnest pool of **3**). No aphorism text or author was touched. But it is a **breaking
change to `--tag`**: 26 retired tag names now take the no-match path, and the fold contains
judgment calls only a human can ratify — notably `testing → debugging`, which dissolves the
corpus's only tag for testing as a discipline. The gate proved the *mechanical* properties;
it cannot prove the *editorial* ones. This is the one item where the run owes a human a
question rather than the reverse.

Not machine-checked, and no signal in this run could have checked it: **KI-2** — whether the
50 corpus attributions are correctly attributed. Confirming a quote's author needs sources
this run has no access to (network is a product non-goal; MCP tools are outside the
conductor's fence). Item I-4b produced a risk-ranked triage of all 50 with 8 flagged HIGH,
and T-006 is blocked on a human by design, not by neglect. **Two independent passes disagree
about what Stroustrup's FAQ actually says** (rows #45/#46, cycle 10) — that disagreement is
itself the finding and sits at the top of the human queue.

Also standing — **SWARM tool gaps**, journaled and never live-edited per hard rule 5; they
need a human with the fence lifted, not another cycle. **15 known issues** are on file at
cycle 48 (8 open, 2 mitigated, 2 resolved, 3 carrying no status label). The three that cost
this run something concrete, in the order a human should take them:

1. **KI-5** (medium) — `settings.json` was never migrated from macOS. Two lines, and it
   restores the budget probe and the playbook script for every future run on this host. Add
   **absolute** entries (`/opt/swarm/bin/…`), not relative ones: cycle 47 proved relative
   entries close neither failure mode reliably.
2. **KI-16** (high) — the allocator **fails open**, emitting a 10% spend allowance while
   reporting `ok:false`/`source:none`. Cycle 48's real probe measured the true allowance at
   **0**, so the failure is not conservative. The conservative default already exists in the
   same script's jq-missing path; the no-data path simply does not use it.
3. **KI-14** (high) — rollover jitter wipes the swarm's own spend counter. Harmless *this*
   week only because `allow` was already 0 on the reserve curve, which the wipe does not
   touch; on a cooler week, or inside the 6h floor release, it grants real spend.

**KI-13** (low) remains as filed.


---

## Cycle 49–56 addendum — written at WRAP_UP, cycle 56

This retro's body was drafted at cycle 42 and refreshed at cycle 48. Cycles 49–56 are
recorded here rather than by rewriting above, so the cycle-48 text stays auditable as what
was known then.

**What worked, cycles 49–56.**
- The mutation instrument was re-aimed from a code surface to the SPEC's own rule list
  (cycle 52), producing a 29-clause coverage map — protected / hole / boundary. It found 4
  holes; cycles 52–54 closed all of them, ending at **29/29**. This is the run's single
  most valuable method result and it became candidate lesson L-040.
- The three-arm gate (WITNESS / KILL-BY-NAME / ATTRIBUTION-BY-SUBTRACTION) settled the
  question the whole run kept circling: what a *new* test buys over the suite that already
  existed. Cycle 54's L7-ATTR arm — 85p/6f with the six new tests, 85p/0f with them
  filtered out, same mutant — is the form to reuse.
- Cycle 55 spent a whole cycle refreshing the distill candidates instead of building. That
  was correct: the cycle-43 draft scored 6/10 against the refreshed set's 10/10 on the
  sealed gate (0/4 discriminating), so a WRAP_UP consuming the stale draft would have
  appended this run's *weakest* five lessons.

**What thrashed, cycles 49–56.**
- **KI-17, the dashboard staleness family.** Cycle 49 found one stale region; cycle 50's
  audit of every region with the KI-11 classifier found the live evidence strip had been
  stale since cycle 42 while renders 43–48 wrote into a legend *comment*. A render script
  that reports its own `ok` lines is not evidence — reading the rendered artifact is.
  KI-19 (cycle 51) is the third mechanism in the same family. All repaired in the artifact;
  the defective pattern is what stays filed.
- **KI-18.** The burn-up strip the template contract mandates has never been rendered in 56
  cycles, and was deliberately NOT fabricated: the verified-per-cycle series is not
  reconstructable from state (measured at cycle 51, not asserted). A guessed chart on the
  one page a human reads is worse than an absent one.
- **KI-5, the allowlist gap.** `bin/swarm-playbook.sh` refused for the **55th consecutive
  cycle**, including this WRAP_UP's append attempt. Attempted every cycle rather than
  skipped on precedent — the cycle-14 rule, and the right one: the Workflow gate *did*
  turn out not to be a fixed property of headless sessions.

**Applied-lessons check, cycles 49–56 (extends § Applied lessons check above).**
- L-031 (mutation-measure, don't read for gaps) — **re-observed, strongest form yet.** The
  cycle-52 sweep found 4 holes no amount of reading the suite had surfaced in 51 cycles.
- L-029 (failable AND attributable) — **re-observed.** Generalised into the three-arm gate.
- L-033 (HOLE vs BOUNDARY) — **re-observed**; this run promotes it to `confidence: high`
  in the candidate set.
- L-034 (the REFUTE line staged into `prompt_lines.qa`) — **not exercised** after cycle 39;
  the run stopped dispatching agents, so no QA agent saw it in this window.

**Cycles run: 56.** The run ends at a finish line, not a stall: 48 done, 6 todo (every one
human-, deps-, effort- or cycle-39-decision-gated), 2 blocked, 4 dropped, and
`consecutive_no_value` standing at **0**.
