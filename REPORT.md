# aphorism-cli — overnight build report

A zero-dependency Node CLI that prints one attributed programming aphorism from a curated
50-entry corpus — `fortune(6)` for programmers, unix-quiet and pipeable.

_No screenshot: a CLI has no rendered surface. The live-look QA stage is reported as
not-applicable, never as passed._

## What this report covers

This repo has been through **two** SWARM runs, and this report covers both:

| Run | When | Kind | Outcome |
|---|---|---|---|
| Build | 2026-08-14 05:38 → 05:44 UTC | SMOKE (25-min pipeline validation) | product shipped, 5/5 must-haves, 48 tests |
| Improvement | 2026-08-15 21:38 UTC → in flight, stops 2026-08-16 11:24 UTC | allocator auto-kickoff, brief *"harden tests, fix playbook items, polish docs — no new features"* | 11/11 improvement must-haves closed, 80 tests |

**Cycles completed: 40**, cycle 41 in flight (this report was written by it). The run has
not reached WRAP_UP; nothing below is a wrap-up summary, and the counts are live as of
2026-08-16 03:15 UTC.

**Product behaviour changed in exactly one way this run** (the I-1 seed fix). Everything
else was tests, guards, documentation and triage — which is what the brief asked for.

## Run it

```sh
cd /opt/targets/aphorism-cli
node bin/aphorism.js                                  # one random attributed aphorism
node bin/aphorism.js --author dijkstra --json --seed 1
node bin/aphorism.js --tag simplicity --list
node --test test/*.test.js                            # 80 tests
```

No install step, no `package.json`, no dependencies — Node and the repo are the whole
requirement.

## Must-haves

### Build run (2026-08-14) — all 5 shipped, re-verified today

| Must-have | Status | Evidence (re-measured 2026-08-16 03:10 UTC) |
|---|---|---|
| One attributed aphorism to stdout, exit 0 | ✅ shipped | suite green; covered by `test/cli.test.js` end-to-end process tests |
| Corpus of ≥ 40 entries as structured data | ✅ shipped | conductor re-count: **50** entries, **24** authors, **37** distinct tags (21 singletons, 4 tags ≥5 uses, 12 tags in the 2–4 band) |
| Flags `--author` `--tag` `--seed` `--list` `--json` `--help` | ✅ shipped | `test/args.test.js` + `test/cli.test.js` |
| No-match → stderr only, empty stdout, non-zero exit | ✅ shipped | asserted in `test/cli.test.js`; unchanged this run |
| `node --test` suite over pick/filter/seed/no-match/format | ✅ shipped | **80 pass / 0 fail**, 1.32 s |

### Improvement run (2026-08-15/16) — 11 items, every one conductor-verified

Each row's evidence file is committed in `.swarm/runs/`. The conductor authored every check
**at verification time**, after the builder returned — builders never saw them.

| Item | Status | Outcome and evidence |
|---|---|---|
| **I-1** close the `--seed` non-finite determinism hole | ✅ done, cycle 3 | Real defect, confirmed at kickoff (6 distinct aphorisms in 6 runs of `--seed Infinity`). Fixed by widening `pick()`'s guard from `Number.isFinite` to `!Number.isNaN`, so the existing IEEE-754 bit-fold handles ±Infinity. Verified through the shipped binary, 8/8 identical outputs each for +Inf/−Inf, against an independently re-derived corpus index. `cycle-003-verify-I-1.txt` |
| **I-2a** mutation sweep of every documented behaviour | ✅ done, cycle 4 | 7 mutation survivors measured against the then-52-test suite; classified 5 HOLE, 1 BOUNDARY, 1 deferred. `cycle-004-verify-I-2a.txt` |
| **I-2b** close HOLE survivors, CLI suite | ✅ done, cycle 5 | 4 tests admitted, each proven **failable** against its mutation and **attributable** (mutation with all 4 new tests filtered out leaves the suite at the exact pre-sweep baseline). `cycle-005-verify-I-2b.txt` |
| **I-2c** close HOLE survivors, pure-module suite | ✅ done, cycle 6 | Same twice-proven standard, plus a new DENOMINATOR control after cycle 5's attribution assertion was found to be measuring node's reporter rather than the claim. `cycle-006-verify-I-2c.txt` |
| **I-3** settle the doc/behaviour divergences | ✅ done, cycle 7 | Six divergences settled where the SPEC named three. Gated by **executing the binary** — 36 behavioural checks with 4 discriminators — not by reading the prose. One imprecision was caught this way and fixed. `cycle-007-verify-I-3.txt` |
| **I-7** align `--help` with the I-3 rules | ✅ done, cycle 8 | Prose edit inside a product file (`src/args.js`), so scope was proven by **byte-comparing** the 216-byte prologue and 2631-byte epilogue against HEAD, not by reading the diff. `cycle-008-verify-I-7.txt` |
| **I-8** harden `--list --json` | ✅ done, cycle 9 | Unblocked by I-3 writing the NDJSON rule; the surface was completely unprotected before. `cycle-009-verify-I-8.txt` |
| **I-4** corpus attribution triage (umbrella) | ✅ done, cycle 10 — *as its two children* | Decomposed at cycle 10 into I-4a + I-4b, split by **kind of claim** rather than by risk band: slicing the corpus by risk would have been circular, since the band assignment *is* the deliverable. The umbrella carries no evidence file of its own; its outcome is the two rows below, and it is listed here so no I-item is silently absent. |
| **I-4b** risk-ranked attribution triage | ✅ done, cycle 10 | 50-row triage (HIGH 8 / MEDIUM 16 / LOW 26) at `docs/corpus-attribution-triage.md`. Gated against a conductor ranking **sealed to disk before dispatch**; the agent surfaced 4 HIGH entries the sealed list had missed, so the pre-commitment measured the conductor too. `cycle-010-verify-I-4b.txt` |
| **I-4a** remove language overclaiming the corpus as audited | ✅ done, cycle 11 | The `src/corpus.js` header described a hedging policy the file does not follow (1 of 50 hedged against 8 HIGH-risk named attributions); the claim was **deleted**, not softened. `cycle-011-verify-I-4a.txt` |
| **I-5** repair or losslessly hand off the SWARM playbook | ⚠️ **done by clause 2** (hand-off), cycle 12 | Duplicate lesson IDs repaired losslessly (31 in, 31 out, bodies an identical multiset, 17/17 harness checks + 4 negative controls). The **20-lesson cap breach was NOT fixed** and is handed to a human with a computed drop-list — the file's overflow rule drops one lesson per append and extrapolating it to shed 11 would delete 5 `[apply:]`-bearing lessons. See `playbook/HANDOFF-cap-2026-08-15.md`. `cycle-012-verify-I-5.txt` |
| **I-6** refresh this report | ✅ done, cycle 41 | This document. Gated by re-measuring every falsifiable claim in it against the repo, not by reading it. |

## What the run actually spent itself on

Worth stating plainly, because the item list above understates it. After the 11 chartered
items closed at cycle 12, cycles 13–40 went almost entirely into **one thing**: the
README-guard family — tests that check the README's factual claims against the code, the
corpus, other files, and the filesystem.

That family is now **1511 of the repo's 2051 test lines** (`test/readme-tags.test.js`),
against 549 lines of shipped source. Twenty-eight items were opened against it (T-012
through T-039). The honest accounting of where they landed:

- **Genuinely fixed (HOLE):** T-012, T-014…T-019, T-021, T-022, T-025, T-027, T-028, T-029,
  T-033, T-035. A guard that was blind, or absent, now catches a real false claim, and each
  was proven both **failable** and **attributable**.
- **Documented, not fixed (BOUNDARY):** T-026, T-031, T-034, T-036, T-037, T-038. The
  defect named in the item's own title is still true; what was verified is a **decision**
  about the instrument, backed by measurement. SPEC I-2 explicitly provides for this
  outcome, and it is called out here because a reader scanning a "done" count would
  otherwise infer repairs that do not exist.
- **Blocked at the attempts cap:** T-024a, after two independent re-shapes each measured a
  lateral or negative trade (see KI-9).
- **Dropped as superseded:** T-005 (feature, out of scope for this brief), T-020, T-023,
  T-030.

At cycle 25 the conductor recorded this as a **standing design finding** rather than as
five separate bugs: every one of these guards extracts a number by anchoring to a position
or a literal in English prose, and every fix so far has *narrowed* the anchor rather than
removed it. The failure direction has been safe almost every time — a false rejection is
loud — but the cheapest escape from a false rejection is deleting the guard. **KI-10 is the
exception and the reason this matters**: one measured wording fails *silent*, so a
self-contradicting README passes green.

At cycle 39 the run stopped the treadmill on measurement rather than fatigue: four
remaining members were closed as documented BOUNDARY, with the reasoning that a fourth
narrowing was the wrong instrument. **The right instrument is KI-9 remedy option 2** — give
the README's counts real structure (a table or a fenced `key: value` block) so the guard
stops reading English. That retires KI-9, KI-10, KI-12, T-024, T-032 and T-039 together,
and it is a human's call.

## Known issues

Thirteen open, from `.swarm/state.json`. Grouped by who can settle them.

### About the product — a human must settle these

- **KI-2 (high, open)** — **the single largest correctness risk.** The 50 corpus
  attributions are unaudited. Entry *shape* is machine-verified; no check available to this
  run can confirm each quote is correctly attributed, and programming aphorisms are widely
  misattributed. Mitigated but not closed by I-4b's triage: `docs/corpus-attribution-triage.md`
  ranks all 50 by risk and names what would settle each one. Start with the 8 HIGH rows.
  Backlog **T-006**, owner: human.
- **KI-9 (medium, open)** and **KI-10 (medium, open)** — the README Attribution guards. KI-9:
  no prose-reading rule can bind the two count claims to their markers without falsely
  rejecting some naturally-written, entirely true README (measured twice, from different
  premises, both lateral or negative). KI-10: a contradictory count whose digit sits across
  an em/en dash from its marker binds nothing and is **skipped** — so a README that
  contradicts itself in plain sight passes green. This is the one failure direction the
  improvement run was chartered to remove, and it is open **by decision, not by neglect**:
  a 44-cell gate proved both natural widenings close the hole and both break true prose.
- **KI-12 (medium, open)** — the single-entry-tag acknowledgement guard can be satisfied by
  a README that does not actually acknowledge the limitation; an in-section decoy pairing a
  tag-word and an entry-word with any of nine marker phrases leaves it silent.

### About the tooling — for the SWARM maintainer, not the product

Recorded here rather than fixed, because hard rule 5 fences SWARM's own code during a run.

- **KI-14 (high, open)** — `bin/swarm-allocator.sh` detects a weekly rollover with an exact
  integer comparison against a probe value that is **not stable to the second**. Measured:
  25 samples over 125 s returned both `1786942799` and `1786942800`, and four consecutive
  5 s samples caught the crossing live. Consequence observed, not theorised: at 02:16:47 the
  rollover branch fired with no week having rolled over, wiping the trickle cap from spent
  back to zero and re-authorising spend. It also wipes human usage attribution, so the human
  reserve curve resets too. Fixes for a human: compare with a tolerance, floor the probe
  value, or require the value to have moved forward by most of a week.
- **KI-8 (high, root cause open, mitigated in practice)** — the conductor's sealed
  pre-dispatch baseline lives in `<target>/.swarm/runs/`, **inside every builder's
  directory**. Observed on three cycles through three distinct channels: a builder read the
  baseline (c31), read the previous cycle's *gate* (c32), and read the conductor's
  uncommitted working-tree edit via `git diff` (c33). Each time the agent disclosed it
  unprompted, and each verdict was saved only because the deciding discriminators were
  authored *after* the builder returned. Mitigated since c36 by commit-reveal (hash
  committed, plaintext deleted for the dispatch window) — but that is conductor discipline,
  not a boundary.
- **KI-5 (medium, open)** — `bin/swarm-playbook.sh` is not on the Bash allowlist in a
  headless session, so `validate`/`parse`/`append`/`record-applied` all refuse. Attempted
  and refused on **40 consecutive cycles**. Combined with the 31-lessons-against-a-cap-of-20
  breach, this makes the shared playbook **inert**: `cmd_parse` exits 2 on any validate
  output, so every future kickoff falls back to defaults and applies zero lessons until the
  count reaches 20.
- **KI-6 (low, open)** — subagents are sandboxed to the session `--add-dir` list, so a
  worktree under `/tmp` is unreachable. Cost one builder dispatch at cycle 18.
- **KI-7 (low, mitigated — control passing 4 consecutive cycles)** — subagent scratch files
  land in the SWARM root unless the dispatch prompt names an explicit scratch path, because
  the session cwd *is* the SWARM root. Five occurrences; the remedy (name the exact path
  whose absence is checked) is measured to work, and the one relapse was the conductor
  forgetting to type the line.
- **KI-11 (low, open)** — `SWARM/runs/dashboard.html` carries stale copies of a timeline
  tick inside HTML comment regions. The page renders correctly; what it corrupts is anchor
  uniqueness. Caught by the uniqueness guard **aborting loudly** rather than splicing into a
  comment — the guard working as designed.
- **KI-13 (low, open)** — allocator posture `halted` has no defined conductor semantics for
  an already-running run. `swarm-pacer.sh` skips on `halted`, but that skip governs
  auto-kickoff only, so an in-flight run keeps cycling with its allowance spent. This run
  chose zero-agent cycles as the conservative reading; SWARM should state the intended
  behaviour.

### Resolved

- **KI-3 (low)** — `--list` silently ignoring `--seed` was **documented**, not changed
  (cycle 7). Verified by execution: `--list` output is byte-identical across unseeded,
  `--seed 1`, `--seed 999999` and `--seed Infinity`, while `--list --seed abc` still exits 2.
- **KI-4 (high)** — the non-finite seed hole, closed by I-1 at cycle 3.
- **KI-1 (medium — provenance note: this id lives in the 2026-08-14 run's report, not in
  this run's `.swarm/state.json`, whose `known_issues` start at KI-2; it was resolved before
  the improvement run began and was not carried forward)** — no git remote at the
  2026-08-14 wrap-up. `origin` is now
  `https://github.com/trmnmc/aphorism-cli.git` and `master` is in sync.
  **Residual, re-checked today and still true:** the tag `v0.1-overnight` is local-only
  (`git ls-remote --tags origin` returns nothing). Settles with
  `git push origin v0.1-overnight`.

## Blocked items — complete outcomes, not omissions

| Item | Why blocked | What would settle it | Who |
|---|---|---|---|
| **T-006** human audit of corpus attributions | Confirming an attribution needs sources this run cannot reach — network is a product non-goal and web tools are outside the conductor's allowed surface | Read `docs/corpus-attribution-triage.md`, settle the 8 HIGH rows against primary sources | human |
| **T-024a** re-shape the Attribution count extraction | Hit the attempts cap at 2. Both attempts measured: attempt 1 scored a perfect 2/4 ↔ 2/4 mirror; attempt 2 scored 5/9 against HEAD's 7/9, buying one repair with three new false rejections | Not a third attempt of the same shape — KI-9 remedy option 2 (structure the README's counts) | human decision, then any run |

## Night control log

_No commands received._ `SWARM/runs/control.json` has an empty `pending[]` and `applied[]`.
Four notifications were sent (`auto-kickoff`, `goodnight`, and two `posture` pushes).

## Stats

| Stat | Value |
|---|---|
| Cycles run | **40 completed**, 41 in flight (stop_at 2026-08-16 11:24 UTC — a premature stop would be visible here) |
| Commits | **95 total**, 91 of them this improvement run; `master` in sync with `origin/master` |
| Backlog | 53 items — **41 done**, 4 dropped, 2 blocked, 6 todo |
| Tests | **80 pass / 0 fail** (was 48 at the build run's wrap-up) |
| Source size | 549 lines shipped (`src/` + `bin/`), 2051 lines of tests, zero dependencies |
| Corpus | 50 aphorisms · 24 authors · 37 tags |
| Decisions recorded | 79 |
| Verification artifacts | 196 files in `.swarm/runs/` from cycles 1–40 (cycle 41's own artifacts excluded — that count is still moving as this report is written) |
| Agents dispatched | **Not tallied in a machine-readable field — reported as a bound rather than a fabricated count.** Effective wave size was 1 on every cycle of this run (gear 1), so at most one builder per cycle; cycles 39–41 dispatched none |
| Models used | sonnet (builders), conductor on fable; design-panel, review-fix and the premium tiers never dispatched this run |
| Notifications sent | 4 |
| Reverted merges | 0 (gear 1 dispatches a single builder into the tree; two items were rejected at the gate and their changes reverted by hand, cycles 31 and 32) |
| Pace | mode **guest**, dial 0.3, gear pinned at **1** for the entire run. The weekly window resets 2026-08-17 05:00 UTC, *after* `stop_at`, so gear 1 was structurally fixed from kickoff. Window utilization: **not measured** — `bin/swarm-budget.sh` was refused by the allowlist on all 40 cycles (KI-5), so every burn figure in the runfile is a placeholder. Voluntary idle cycles: 0 |

### Why the run stopped dispatching agents at cycle 39

Measured this cycle rather than inherited. SWARM's allocator authorises **0%** of the
weekly window to the swarm right now, and it cannot authorise more before `stop_at`:

```
weekly_used_pct = 93   opus_used_pct = 97   human_used_pct = 0
reserve_overall_pct = 24.01   allow_overall_pct = 0
break-even at stop_at: allow > 0 needs weekly_used_pct < 79.83%
```

The reserve floor (12%) releases only within 6 h of the week reset; there are 17.6 h left at
`stop_at`, so it never releases during this run. Weekly usage is monotonic within a week, so
`allow` cannot rise. **This is independent of the KI-14 rollover bug** — even with the
trickle counter wrongly wiped, the allowance stays 0 on the reserve curve alone. Cycles 39
and 40 held at zero agents on a conservative reading of an ambiguous posture; this cycle
turned that into a measurement.

The practical consequence: cycles 39 onward are conductor-only. They cost the conductor
session but no agent burn, and the wakeup interval was stretched to 1800 s to reflect that.

## Honest hand-off

**Machine-checked.** Every must-have and every improvement item above, by commands the
conductor authored *at verification time* and ran itself; builders never saw the checks, so
they could not code to them. Re-measured fresh for this report at 2026-08-16 03:10–03:15
UTC: the 80-test suite, corpus size and shape, the tag distribution numbers, the repo's
git sync state and the absent remote tag. Where a check could not be run, it is named as
not-run below rather than rendered as passed.

**Reported as not run, never as passed.**

- **review-fix never ran this improvement run.** It was judged and declined at cycle 14 with
  reasons in the journal — the adversarial reproduce-then-fix pass was traded for QA-full
  (cycle 13) and the taste pass (cycle 14). **Nothing in this repo has been read by an
  adversarial reviewer.**
- **design-panel never ran** (the original build run cleared the DESIGN gate with a
  conductor-authored decision under a 25-minute SMOKE clock, recorded as a deviation).
- **The live-look QA stage is not applicable** — a CLI has no browser surface. Its cheap
  analogue (output survives a pipe unchanged) was folded into the cycle-13 conductor harness
  as check S7.
- **Window utilization was never measured** — the budget probe was refused on all 40 cycles.
- **The kickoff spec-confirmation gate was never confirmed by a human.** This was a headless
  allocator auto-kickoff with no user present, and SKILL.md defines no non-interactive
  behaviour for that gate. Recorded as a deviation at cycle 1 rather than treated as
  confirmed.

**Only a human can finish these.**

1. **Attribution accuracy (KI-2).** The largest correctness risk in the repo, and unchanged
   in kind since the build run. `docs/corpus-attribution-triage.md` is the run's main
   deliverable to you: 50 rows ranked by risk, with what would settle each. Read the 8 HIGH
   rows before this goes anywhere public. Note the triage's own honest caveat — it rests on
   recall, not sources, and the conductor's independent pass **disagreed with it on four
   entries** (#38 Wheeler, #39 Hopper, #45 Stroustrup, #48 Kay). That two independent passes
   disagree about a primary source is itself the finding.
2. **Decide the README-guard question (KI-9 / KI-10 / KI-12).** Give the README's counts
   real structure so the guards stop parsing English. One decision retires six open items.
   The alternative — another narrowing — has been measured twice and does not pay.
3. **Whether the product is worth using.** Flagged at the build run's kickoff, still true,
   and now quantified: the cycle-14 taste pass measured the mean first repeat at **use 9.6**
   across 3000 simulated sessions, against a closed-form 9.54 — the picker is provably
   uniform, so the cause is corpus size, not a selection bug. The cheap half of the fix is
   T-005 (no-repeat-until-exhausted rotation); the deep half is T-008 (grow the corpus),
   deliberately gated behind T-006 so it cannot multiply the unaudited attribution surface.
   **Both are features, which this run's brief forbade.** A future feature-bearing run should
   pick T-005 first.
4. **Two SWARM tooling bugs need your hand, not the swarm's** — KI-14 (the allocator's
   rollover comparison silently refills a spend cap) and KI-5 (the playbook is inert until
   someone culls it to the cap; `playbook/HANDOFF-cap-2026-08-15.md` has the computed
   drop-list and the reason the swarm declined to apply it).
5. **Push the tag:** `git push origin v0.1-overnight`.

---

Repo tagged `v0.1-overnight` (local; not yet pushed). Generated by the cycle-41 conductor at
2026-08-16T03:15:00+00:00, superseding the 2026-08-14T05:58:00 report, which described only
the SMOKE build run and was 40 cycles out of date.
