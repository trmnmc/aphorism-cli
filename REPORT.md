# aphorism-cli — overnight build report

A zero-dependency Node CLI that prints one attributed programming aphorism from a curated
50-entry corpus — `fortune(6)` for programmers, unix-quiet and pipeable.

_No screenshot: a CLI has no rendered surface. The live-look QA stage is reported as
not-applicable, never as passed._

> **Document status (added 2026-08-17, run #2 cycle 4, item J-4).** The body below and the
> "Closing addendum" section were both written by Improvement run #1's conductor and frozen at
> that run's WRAP_UP (cycle 56, 2026-08-16T11:24 UTC, commit `ef4fa6d`). Every cycle number,
> "in flight" phrase and count between here and the closing addendum describes run #1's state
> at the moment it was written, not the repo today — none of that text was rewritten to update
> it. A second improvement run (#2) began 2026-08-17 and is at cycle 4 as this note is added.
> **§ Improvement run #2 status**, appended at the very end of this document, gives fresh,
> sourced numbers for everything the tables below no longer get right, and lists every claim
> that was corrected or flagged stale. Numbers drawn from `src/corpus.js` and
> `docs/corpus-attribution-triage.md` (corpus size, tag counts, author counts, the triage risk
> bands) are unaffected by any of this — the corpus has not changed since run #1, and every
> such number below is still independently true today.

## What this report covers

This repo has been through **three** SWARM runs. This report's body and closing addendum
cover the first two (Build, then Improvement run #1) in full; a status section appended at the
end covers the third (Improvement run #2, still in flight when that section was written) — see
**§ Improvement run #2 status**.

| Run | When | Kind | Outcome |
|---|---|---|---|
| Build | 2026-08-14 05:38 → 05:44 UTC | SMOKE (25-min pipeline validation) | product shipped, 5/5 must-haves, 48 tests |
| Improvement | 2026-08-15 21:38 UTC → in flight, stops 2026-08-16 11:24 UTC | allocator auto-kickoff, brief *"harden tests, fix playbook items, polish docs — no new features"* | 11/11 improvement must-haves closed, 80 tests |

_Correction carried by this reconciliation (run #2, J-4 attempt 2, measured at commit `dbc1939`)._
The Improvement row says "in flight" because it was written mid-run. **Run #1 has since ended**,
at the stop time the row predicted: WRAP_UP at cycle 56, 2026-08-16T11:24 UTC, commit `ef4fa6d`
(`git log -1 --format=%ci ef4fa6d`). Its "80 tests" figure was the count when the row was
written, not at WRAP_UP — the closing addendum below records further tests landing at cycles
51–54. The row is left as written because it is a dated history row; current suite and line
counts are in **§ Improvement run #2 status**.

**Cycles completed: 46**, cycle 47 in flight (this refresh was written by it). The run has
not reached WRAP_UP; nothing below is a wrap-up summary, and the counts are live as of
2026-08-16 07:25 UTC.

**Product behaviour changed in exactly two ways this run** — the I-1 seed fix (cycle 3)
and the tag-vocabulary consolidation (T-007, cycle 46, and it is a **breaking change** to
`--tag`; see below). Everything else was tests, guards, documentation and triage — which
is what the brief asked for.

_Correction carried by this refresh._ Between cycle 41 and cycle 46 this document said
"changed in exactly one way", described a **37-tag** corpus, and listed T-007 as unfinished
work that only "a run on a healthy window" could reach. All three statements were made
false by cycle 46, which landed T-007 at gear 1 with **zero agents dispatched**. The
prediction is corrected in place rather than quietly deleted — see *Unfinished work*.

## Run it

```sh
cd /opt/targets/aphorism-cli
node bin/aphorism.js                                  # one random attributed aphorism
node bin/aphorism.js --author dijkstra --json --seed 1
node bin/aphorism.js --tag simplicity --list
node --test test/*.test.js                            # prints its own test/pass/fail totals
```

No install step, no `package.json`, no dependencies — Node and the repo are the whole
requirement.

## Must-haves

### Build run (2026-08-14) — all 5 shipped, re-verified today

| Must-have | Status | Evidence (re-measured 2026-08-16 03:10 UTC) |
|---|---|---|
| One attributed aphorism to stdout, exit 0 | ✅ shipped | suite green; covered by `test/cli.test.js` end-to-end process tests |
| Corpus of ≥ 40 entries as structured data | ✅ shipped | conductor re-count: **50** entries, **24** authors, **12** distinct tags (0 singletons, 7 tags ≥5 uses, 5 tags in the 2–4 band; thinnest pool 3, largest 14) |
| Flags `--author` `--tag` `--seed` `--list` `--json` `--help` | ✅ shipped | `test/args.test.js` + `test/cli.test.js` |
| No-match → stderr only, empty stdout, non-zero exit | ✅ shipped | asserted in `test/cli.test.js`; unchanged this run |
| `node --test` suite over pick/filter/seed/no-match/format | ✅ shipped | **80 pass / 0 fail**, 1.49 s |

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
| **I-6** refresh this report | ✅ done, cycle 41 | This document. Gated by re-measuring every falsifiable claim in it against the repo, not by reading it. Refreshed again at cycles 44 and 47 on the same standard — the cycle-47 pass exists because cycle 46 changed the product and left this document describing a corpus that no longer ships. |

### The one product change after the chartered items — T-007, cycle 46

The tag vocabulary was consolidated from **37 tags to 12**, by retagging existing entries
only: no aphorism text or author was touched, and no entry was added or removed. Twenty-six
low-count tag names were folded onto a surviving neighbour. The problem it fixed is
user-visible and was measured, not assumed — 21 of the 37 tags matched exactly one
aphorism, so `--tag` on any of them returned the same line every time. Every tag now has a
pool of at least 3.

**This is a breaking change to a shipped contract.** Anyone who scripted `--tag
optimization` (or any of the other 25 folded names) now gets the no-match path: empty
stdout, a stderr line, non-zero exit. The README's *Tag vocabulary changes* section lists
all 26 retired names. The suite stayed green across the change (80/80), and two fixtures
the retag invalidated were rebuilt from the live corpus.

**Two judgment calls in it are logged for a human to ratify or reverse — backlog T-040.**
(1) Several fold mappings are defensible but debatable, and one is load-bearing:
`testing → debugging` dissolves the corpus's only tag for testing as a discipline, because
only 2 entries were about testing and manufacturing a third would have been dishonest
tagging. (2) A `.swarm/SPEC.md` Domain-rules illustration named a tag the change removed
and was re-pointed at a surviving one; the rule itself is untouched. Reversing either is
cheap — the fold map is a data table in `.swarm/runs/cycle-046-retag.mjs`.

### What has actually been run against the shipped binary — cycles 49–50

Everything above this line was verified by gates that read modules, fixtures or prose. Two
late cycles pointed the instrument at the thing a user actually types instead: they spawn
`bin/aphorism.js` as a child process a few hundred times and ask what comes back. Modules
are loaded only to *derive expectations*, never to produce observations.

**Cycle 49 — the `--tag` surface after the retag. No defect found.** 135/135 cells: all 12
live tags print an entry that genuinely carries that tag and reproduce the exact membership,
count and corpus order under `--list`; all 26 retired names exit 1 with zero bytes on
stdout; the whole-tag rule, the `--author` AND intersection, and the `--help` discovery
recipe hold end to end. A 14-mutation arm attributes every kill. This is a **confirmation,
not a repair** — the retag landed cleanly and nothing needed to change.

One consequence was measured and is handed to a human rather than acted on: a **retired tag
name and a name that never existed are byte-identical** in exit code, stdout and stderr, so
a user whose `--tag testing` worked last week is never told it became `debugging`. That is
what the Domain rule requires, so it is not a defect — a "did you mean" hint would be a
feature, fenced by this run's non-goals. Appended to **T-040**.

**Cycle 50 — the selection surface. No product defect found, but a real hole in the
suite.** 12/12 cells over 1000 unseeded spawns and 25 seeds, with a 7-mutation arm that
attributes every kill. What it establishes, none of which had been measured at the binary
before: every one of the 50 entries is reachable; the unseeded distribution is uniform on a
chi-square test at p=0.001 (χ²=59.6, df=49); every sampled seed — including `Infinity`,
`-Infinity`, `1e300`, negatives and fractions — prints exactly the entry an independent
derivation predicts, and is byte-identical across two separate spawns; every entry is
reachable by *some* seed, and every member of every one of the 12 `--tag` sets is reachable
by some seed. Cycle 14 had measured unseeded uniformity once, but over the **module**, with
a loose ±20% min/max band; the seeded path's reachability had never been measured at any
level by anything.

**The finding is about the tests, not the product.** Planting two defects that plainly
violate the Domain rule *"without `--seed`, selection is uniform over the filtered candidate
set"* — an off-by-one that makes the **last corpus entry unreachable forever**, and a heavy
bias toward the front of the corpus — leaves the shipped suite at **80 pass / 0 fail in both
cases**. Both survive. (A control on an unmutated copy scores 80/0, so the measurement is
sound; a third mutation that collapses every seed to one entry *is* killed, 78/2.) So the
run spent cycles 13–40 hardening README guards to 1511 of 2101 test lines while the rule
governing the product's central behaviour had **no test at all**. It is a HOLE in SPEC I-2's
sense — a stated rule, violated by a surviving mutant — not a BOUNDARY, and it is filed as
**T-043**. Evidence: `.swarm/runs/cycle-050-gate.mjs`,
`cycle-050-negative-control.mjs`, `cycle-050-suite-survivors.mjs`.

_Correction carried by this reconciliation (run #2, J-4 attempt 2, measured at commit `dbc1939`)._
**"1511 of 2101 test lines" is stale.** It was exactly true when run #1's cycle-47 conductor
wrote it — at commit `fa68c0a`, `test/readme-tags.test.js` was 1511 lines and the four suites
summed to 2101 (190 args + 220 cli + 1511 readme-tags + 180 select) — and the suites have grown
since. Measured at `dbc1939`: `wc -l test/*.test.js` → **args 217, cli 541, readme-tags 1978, select 298,
total 3034**, so the README-guard family is **1978 of 3034 test lines**. The same stale pair
appears twice more, and each site carries its own note: *§ What the run actually spent itself
on* ("1511 of the repo's 2101 test lines") and the *Stats* table ("2101 lines of tests"). The
sentences above are left as run #1 wrote them.

## What the run actually spent itself on

Worth stating plainly, because the item list above understates it. After the 11 chartered
items closed at cycle 12, cycles 13–40 went almost entirely into **one thing**: the
README-guard family — tests that check the README's factual claims against the code, the
corpus, other files, and the filesystem. Cycles 41–47 went into the hand-off itself
(this report, `RETRO.md`, the KI-5 root cause, backlog hygiene) plus the single product
change described above.

That family is now **1511 of the repo's 2101 test lines** (`test/readme-tags.test.js`),
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

_Correction carried by this reconciliation (run #2, J-4 attempt 2, measured at commit `dbc1939`)._
Two claims in the passage above no longer hold.
**(1) "1511 of the repo's 2101 test lines"** was true at run #1 cycle 47 (commit `fa68c0a`) and
is stale now: `wc -l test/*.test.js` → args 217, cli 541, readme-tags 1978, select 298,
**total 3034**, so the family is **1978 of 3034**. The adjacent "**549 lines of shipped
source**" is re-measured and **still exactly right** — `wc -l src/*.js bin/aphorism.js` →
133 + 269 + 91 + 56 = 549 — and is left alone.
**(2) "Blocked at the attempts cap: T-024a"** is no longer true. **T-024a is `done`**, closed in
run #2 cycle 2 as part of J-2a, by removal — the remedy the Blocked-items table's own "what
would settle it" column named, not a third narrowing. Source: `.swarm/backlog.json` → `items[]`
where `id == "T-024a"` → `status: "done"`. The bullet is left as written because it is run #1's
own accounting of where its items landed.

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

**Fifteen recorded** in `.swarm/state.json`: 11 open, 2 mitigated with the root cause
still open (KI-7, KI-8), 2 resolved (KI-3, KI-4). Grouped below by who can settle them.
(An earlier version of this line said "thirteen open"; it was counting recorded entries,
resolved ones included, against a smaller list. Corrected at cycle 47, which also filed
KI-16.)

_Correction carried by this reconciliation (run #2, J-4 attempt 2, measured at commit `dbc1939`)._
The paragraph above is a run #1 cycle-47 snapshot and undercounts `.swarm/state.json`, which at
commit `dbc1939` records **20** known issues (KI-2, then KI-5 through KI-23 — KI-1/KI-3/KI-4
were already fully resolved and retired from the array before run #1 ended, which is why the ids
are not contiguous): **14 open**, **2 mitigated** (KI-7, KI-8 — KI-8's root cause still open),
**1 partially resolved** (KI-5 — the playbook cap is fixed, the allowlist gap is handed to a
human), **2 resolved during run #2** (KI-9, KI-10 — the README Attribution guards stopped reading
English prose), and **1 accepted trade, not pursued further** (KI-21). **KI-2 is unchanged: still
OPEN, still HIGH.** (An earlier pass of this same reconciliation wrote **19 / 13 open** here;
that was true when written and was overtaken by KI-23 being filed. The counts above are pinned to
a committed state rather than to "now" so they cannot drift again.) The individual entries below
(KI-3 through KI-16) are run #1's own text and are left as written — read them as history, not as
today's status. Source: `git show dbc1939:.swarm/state.json` → `known_issues[]`, counted by
`status`; entries with no `status` field (KI-2, KI-15) are counted as open.

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
  and refused on **46 consecutive cycles**. Root-caused at cycle 43: `SWARM/.claude/settings.json`
  was never migrated from the macOS host, so its allow entries do not cover these scripts.
  Cycles 46–47 added a second, independent failure mode with the same symptom: the
  allowlist entries are **cwd-relative**, and the pacer does not guarantee the session's
  cwd is `/opt/swarm` — cycle 46 ran from the target directory, where even the working
  `bin/swarm-notify.sh` entry failed with exit 127 before permissions were consulted.
  Cycle 47 confirmed the split by running both forms: `bin/swarm-notify.sh poll` from
  `/opt/swarm` succeeded, the absolute path `/opt/swarm/bin/swarm-budget.sh` was refused.
  **A fix that adds only relative allow entries closes neither reliably; absolute entries
  close both.** Combined with the 31-lessons-against-a-cap-of-20
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
- **KI-16 (high, open, filed cycle 47)** — the allocator **fails open**: with its usage
  probe returning nothing (`"ok": false`, `"source": "none"`, every usage field zeroed) it
  still emits a 10% spend allowance. Full measurement and the discriminator that rules out
  a week rollover are in *Why the run stopped dispatching agents* above. The conservative
  default already exists in the same script — its jq-missing fallback emits allow 0 — and
  the no-data path simply does not use it.
- **KI-15 (low, open)** — playbook `apply_mode: auto` stages every apply-able lesson with
  no capability gate on target shape. Measured this run: 9 of 15 staged lessons were
  not-exercised, and 8 of those 9 were **structurally unreachable** rather than unlucky —
  four browser-specific and three React/UI-specific lessons staged against a zero-dependency
  Node CLI with neither surface, plus one routing lesson unreachable at gear 1. The
  conductor staged them faithfully rather than editing the playbook's intent mid-run
  (hard rule 5), which is correct and leaves the gap where it belongs: in the staging step.
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

_Correction carried by this reconciliation (run #2, cycle 4)._ **T-024a is no longer
blocked.** It closed **done** in run #2 cycle 2 as part of J-2a, by removal — the option this
row's own "What would settle it" column names, and not by a third attempt of the narrowing
shape that was capped. **T-006 is unchanged: still blocked on a human.** Source:
`.swarm/backlog.json` → `items[]` where `id` is `T-024a` / `T-006`.

## Unfinished work — the six open items, and what each is actually waiting on

The stats row below says "6 todo". That number invites a wrong inference — that a bigger
usage window would restart all six — so here is the per-item measurement instead
(cycle-44 gate, 15/15 with three negative controls,
`.swarm/runs/cycle-044-verify-reachability.txt`).

**Correcting this report's own earlier framing, twice.** First: cycles 41–43 recorded that
"all six remaining todos need a builder [because the allowance is 0]". True as far as it
goes, but it conflates two different constraints. **Three of the six are S-effort, and
gear 1 explicitly admits S-effort builds** — the gear is not what holds them. A standing,
measured decision is. More window alone will not restart those three.

Second, and sharper because this document made the claim itself: cycles 41–45 listed
**T-007 as gear-blocked**, needing "a run on a healthy weekly window". **That was wrong,
and cycle 46 disproved it by landing the item** — conductor-inline, zero agents dispatched,
at the same gear 1 that supposedly forbade it. The error was treating the gear's *dispatch*
cap as a cap on *work*. It is not: the allowance governs what may be spent on subagents,
and a conductor that does the work itself spends none. Cycles 39–47 were all zero-agent,
and one of them shipped a product change. Whoever reads the table below should apply the
same test before accepting "unreachable": ask whether the item needs an agent, or only a
worker.

| Item | Binding constraint | What would unblock it | Who |
|---|---|---|---|
| **T-008** deepen the corpus past 50 entries | **Effort _and_ a dependency.** L-effort, and `deps: [T-006]`, which is blocked on a human | The attribution audit lands first, or a decision to ship the added entries with their own triage in the same change (the item's own second path, which `deps` cannot express) | Human, then any run |
| **T-024** structural re-shape of the prose-anchored README guards (umbrella) | **Its own measurements.** M-effort and not itself dispatchable — it closes when its children do, and one child (T-024a) is blocked at the attempts cap. Cycle 33 further measured that "read structure instead of prose" is **not available at all** for the Attribution counts without a README document change (V0:F_MD is red on a pristine README) | The KI-9 remedy option 2 — give the README's counts real structure — which is a human's call, not more clock | Human decision, then any run |
| **T-024b** band-heading "N tags" count | **Not the gear — a standing decision.** S-effort, so gear 1 would admit it. Held by the cycle-39 family decision: no further *narrowing* of these guards this run | T-024 landing, or an argued BOUNDARY per SPEC I-2 | Any run |
| **T-032** two count-markers in one true sentence manufacture a spurious claim | **Not the gear — a standing decision.** Same as T-024b | Same as T-024b | Any run |
| **T-039** heading-to-table stop rule relocates mis-attachment | **Not the gear — its own filing terms.** S-effort; filed explicitly as a member of the T-024 umbrella so it does not become a seventh narrowing | T-024 landing, or an argued BOUNDARY | Any run |
| **T-040** ratify the two judgment calls inside the T-007 retag | **A human.** Filed by the conductor against its own change; nothing blocks on it | Read the fold map in `.swarm/runs/cycle-046-retag.mjs` and either ratify or reverse — reversal is cheap | human |

_Correction carried by this reconciliation (run #2, cycle 4)._ **Five of the six rows above
have since changed status; only T-040 is still todo.** Re-derived from the live
`.swarm/backlog.json`, not from this table: **T-008** is now **dropped** — excluded as a
non-goal for run #2, on the recorded ground that widening an unaudited 50-entry corpus before
a human has worked the KI-2 queue would enlarge the run's worst open problem, not shrink it.
**T-024** (the umbrella), **T-024b** and **T-039** are **done**, closed run #2 cycle 3 as part
of J-2b, by giving the band headings real markdown structure and deleting the prose-anchored
extraction, not by a seventh narrowing. **T-032** is **done**, closed run #2 cycle 2 as part
of J-2a. **T-040 is unchanged: still todo**, still waiting on a human to ratify or reverse the
T-007 retag's two judgment calls. The paragraphs below this table are run #1's own account of
*why* these items were stuck and what would unstick them; left as written because they explain
a decision rather than assert a current count, and because the outcome they predicted — a
structural re-shape rather than an eighth narrowing — is what actually happened.

_Correction carried by this reconciliation (run #2, J-4 attempt 2, measured at commit `dbc1939`)._
One clause inside the table above was missed by the note directly preceding this one: the
**T-024** row gives as its binding constraint that "one child (**T-024a**) is blocked at the
attempts cap". **That is no longer true — T-024a is `done`**, closed run #2 cycle 2 as part of
J-2a by removal, which is what allowed the T-024 umbrella to close at cycle 3. Source:
`.swarm/backlog.json` → `items[]` where `id == "T-024a"` → `status: "done"`. This is the third
and last site in this document that asserts T-024a is blocked; the other two are above — the
*Blocked items* table's own T-024a row, and the "Blocked at the attempts cap" bullet in
*§ What the run actually spent itself on* — and each now carries the same correction.

**Why the three S-effort items are fenced rather than simply unfinished.** Every README
guard this run built extracts a number by anchoring to a position or a literal inside an
English sentence, and six successive fixes each narrowed the anchor rather than removing
it. Cycle 39 measured that instrument's cost curve on one guard: three narrowings bought
three kills, introduced two new false rejections, and left the silent direction open.
These guards fail *loud* — they reject a correct README, they do not pass a wrong one —
but a maintainer's cheapest escape from a false rejection is deleting the guard, so the
accumulated risk is the whole family going at once. A seventh narrowing does not reduce
that risk; changing what the extractions *read* does — and cycle 33 measured that for the
Attribution counts, changing what they read requires changing the **document**, not just
the test. That is why the remedy in the table above is a README-structure decision (KI-9
option 2) and not simply "land T-024".

**What this means for the run's status.** All six improvement must-haves (I-1…I-6) are
closed and conductor-verified, so the definition-of-done is met. The target is still not
`DONE`, and the report should not imply otherwise: `DONE` also requires that no remaining
candidate pass the value ratchet, and **T-008 passes it** — the picker is uniform, so the
repeat rate is corpus size, and a user meets a repeat by use ~9.6 (60.1% by use 10). It is
real, user-visible, and out of reach tonight *because it is gated on a human's attribution
call*, not because of the clock. Nor is the target `stalled`: that needs six consecutive
no-value cycles or a wholly blocked board, and neither holds.

**What T-008 would actually buy, before anyone starts writing aphorisms.** The repeat rate
is now measured end to end (cycle 50) and not merely asserted: selection is uniform over all
50 entries at the shipped binary, so the arithmetic below is the whole story and there is no
cheaper selection-side fix hiding behind it. Exact closed-form values — cycle 14's empirical
9.60 and 60.1% were 3000-trial estimates, consistent with these to within their own noise:

| corpus size | first repeat expected on run | P(a repeat by run 10) |
|---|---|---|
| 50 (today) | 9.5 | 61.8% |
| 100 | 13.2 | 37.2% |
| 238 | 20.0 | 17.4% |

**Doubling the corpus buys 3.7 runs.** Reaching "no repeat before run 20" needs ~238
entries — roughly 190 new attributions, every one of them carrying the KI-2 attribution risk
a human already holds a queue for. By contrast the deferred nice-to-have,
**no-repeat-until-exhausted rotation, moves the first repeat from 9.5 to exactly 51** at zero
new attributions. On the metric that produced the finding, rotation is ~5× better than
doubling the corpus and carries none of its risk. That does not overturn T-008 — a deeper
corpus is worth having on its own merits, and rotation is a feature this run's non-goals
fence out. It does mean **whoever picks T-008 up should decide against rotation on purpose
rather than by default**, which the taste judge flagged at kickoff (use-twice 4/10, naming
exactly this deferral) and nobody has quantified until now.

## Night control log

_No commands received._ `SWARM/runs/control.json` has an empty `pending[]` and `applied[]`.
Four notifications were sent (`auto-kickoff`, `goodnight`, and two `posture` pushes).

## Stats

| Stat | Value |
|---|---|
| Cycles run | **46 completed**, 47 in flight (stop_at 2026-08-16 11:24 UTC — a premature stop would be visible here) |
| Commits | **102 total**, 96 of them this improvement run; `master` in sync with `origin/master` |
| Backlog | 54 items — **42 done**, 4 dropped, 2 blocked, 6 todo |
| Tests | **80 pass / 0 fail** (was 48 at the build run's wrap-up) |
| Source size | 549 lines shipped (`src/` + `bin/`), 2101 lines of tests, zero dependencies |
| Corpus | 50 aphorisms · 24 authors · **12 tags** (was 37 until cycle 46) |
| Decisions recorded | 93 |
| Verification artifacts | **233** files in `.swarm/runs/` from cycles 1–46, plus cycle 47's own, which are still being written as this refresh is gated (the earlier report's "196 from cycles 1–40" used the same convention) |
| Agents dispatched | **Not tallied in a machine-readable field — reported as a bound rather than a fabricated count.** Effective wave size was 1 on every cycle of this run (gear 1), so at most one builder per cycle; **cycles 39–47 dispatched none** — nine consecutive zero-agent cycles, one of which (46) still shipped a product change |
| Models used | sonnet (builders), conductor on fable; design-panel, review-fix and the premium tiers never dispatched this run |
| Notifications sent | 4 (`auto-kickoff`, `goodnight`, two `posture`); 29 further log lines are control-channel polls, not sends |
| Reverted merges | 0 (gear 1 dispatches a single builder into the tree; two items were rejected at the gate and their changes reverted by hand, cycles 31 and 32) |
| Pace | mode **guest**, dial 0.3, gear pinned at **1** for the entire run. The weekly window resets 2026-08-17 05:00 UTC, *after* `stop_at`, so gear 1 was structurally fixed from kickoff. Window utilization: **not measured** — `bin/swarm-budget.sh` was refused by the allowlist on every cycle that attempted it (46 attempts through cycle 47, KI-5), so every burn figure in the runfile is a placeholder. Voluntary idle cycles: 0 |

_Correction carried by this reconciliation (run #2, J-4 attempt 2, measured at commit `dbc1939`)._
The table above is a run #1 cycle-47 snapshot; most rows are superseded. Rather than edit cells
that were true when written, re-derived numbers are in **§ Improvement run #2 status** at the end
of this document — which covers the Commits, Backlog, Tests, Source size, Corpus, Decisions and
Verification-artifact rows. The remaining rows (Agents dispatched, Models used, Notifications
sent, Reverted merges, Pace) describe run #1's dispatch history and are **not restated**; read
them as history. The three that drift furthest:

- **Cycles run** — "46 completed, 47 in flight". Run #1 finished at cycle 56 (WRAP_UP, commit
  `ef4fa6d`); improvement run #2 began 2026-08-17 and was still running when this note was
  written.
- **Tests** — "80 pass / 0 fail". At commit `dbc1939`, `node --test test/*.test.js` reports
  **101 pass / 0 fail** (tests 101, fail 0). An earlier pass of this reconciliation wrote
  "currently 100 pass / 0 fail" here; that was true when written and was overtaken within the
  same wave by another item adding a test, which is why the figure is now pinned to a commit
  instead of to "currently".
- **Source size** — "549 lines shipped (`src/` + `bin/`), 2101 lines of tests". The 549 is
  re-measured and **still exactly right** (133 + 269 + 91 + 56). The **2101 is stale**:
  `wc -l test/*.test.js` at `dbc1939` gives args 217, cli 541, readme-tags 1978, select 298,
  **total 3034**.

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
session but no agent burn. The wakeup interval was stretched to 1800 s while that was read
as "no work is reachable"; cycle 46 disproved that reading by landing a product item with
no agents, and cycle 47 moved the interval back down to 1200 s accordingly.

**Cycle-47 addendum — the allocator went blind, and it fails OPEN.** At 07:10 UTC
`SWARM/runs/allocator.json` was rewritten with every usage field zeroed and
`"source": "none"`, `"ok": false` — the usage probe returned nothing at all. This is not a
week rollover: `week_resets_at` is 0 (a real reset would carry a future epoch), and the
real reset is not due until 2026-08-17 02:19 UTC. **The hazard is what it emits while
blind:** `allow_overall_pct` **10**, not 0. A conductor that reads the allowance without
checking `ok` would take a probe blackout as authorisation to spend 10% of a window last
measured at **95% weekly / 97% opus** six cycles earlier. Cycle 47 declined the allowance
on that ground and stayed at zero agents. Recorded as **KI-16**, not fixed — hard rule 5
fences SWARM's own code during a run. It is adjacent to KI-14 but distinct: KI-14 wipes the
swarm's spend counter on a false rollover; KI-16 is the whole file defaulting to a
permissive number when it has no data at all.

## Honest hand-off

**Machine-checked.** Every must-have and every improvement item above, by commands the
conductor authored *at verification time* and ran itself; builders never saw the checks, so
they could not code to them. Re-measured fresh for this refresh at 2026-08-16 07:15–07:30
UTC by `.swarm/runs/cycle-047-measure.mjs` (output: `cycle-047-measure.txt`), which reads
the live repo and never reads this document: the 80-test suite, corpus size and shape, the
new tag distribution, backlog and known-issue counts, commit counts, the repo's git sync
state and the still-absent remote tag. Every number in this report was then re-derived from
that output by an independent gate (`cycle-047-gate.mjs`) that parses the prose and compares
it against the measurements, with a negative control. Where a check could not be run, it is
named as not-run below rather than rendered as passed.

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
- **Window utilization was never measured** — the budget probe was refused on all 46 attempts,
  and as of cycle 47 the allocator's own usage source reports itself absent (KI-16). No burn
  figure anywhere in this run's state is a measurement.
- **The tag consolidation was not reviewed by anyone but its author.** The conductor
  proposed the fold map, executed it, and gated it. The gate proves the mechanical
  properties (no text or author changed, no entry added or removed, every tag pool ≥ 3,
  suite green); it cannot prove the mappings are the *right* editorial calls. That is
  T-040, and it is why the change is reported as landed rather than as settled.
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
   disagree about a primary source is itself the finding. _(This four-entry tally is a
   different comparison from the "four notes" in the triage document's own Conductor
   addendum, which cover #45, #25, #6, and #4/#8/#9 — the two lists overlap only on #45; see
   that addendum for the separate count.)_
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
4. **Ratify or reverse the tag consolidation (T-040).** Twenty-six tag names were retired
   and `--tag` on any of them now returns the no-match path. The mechanics are proven; the
   editorial judgment is yours, and the load-bearing call is `testing → debugging`, which
   leaves the corpus with no tag for testing as a discipline. Reversal is cheap — the fold
   map is a data table in `.swarm/runs/cycle-046-retag.mjs`.
5. **Three SWARM tooling bugs need your hand, not the swarm's** — KI-14 (the allocator's
   rollover comparison silently refills a spend cap), KI-16 (the allocator emits a
   permissive 10% allowance while reporting `ok: false` and no usage source — it fails
   open), and KI-5 (the playbook is inert until someone culls it to the cap;
   `playbook/HANDOFF-cap-2026-08-15.md` has the computed drop-list and the reason the swarm
   declined to apply it; the allowlist fix must use **absolute** paths — see KI-5 above for
   why relative entries close neither failure mode).

   _Correction carried by this reconciliation (run #2, cycle 4)._ **The KI-5 cap half of
   this item is done and no longer needs your hand.** Run #2 cycle 1 (J-1a) brought
   `playbook/learnings.md` from 36 lessons back within its 20-lesson cap, losslessly, with
   all 15 `[apply:]` directives intact (gate 9/9 with negative controls). **What is still
   owed is only the allowlist half**, and the exact patch is now at
   `playbook/HANDOFF-allowlist-2026-08-17.md` (J-1b) rather than the cap handoff named
   above. KI-14 and KI-16 are unchanged: still open, still high, still a human's call.
   Source: `.swarm/state.json` → `known_issues[]` → `KI-5.status`, which currently reads
   "partially resolved cycle 1 of run #2".
6. **Push the tag:** `git push origin v0.1-overnight`.

---

Repo tagged `v0.1-overnight` (local; not yet pushed). Generated by the cycle-47 conductor at
2026-08-16T07:30:00+00:00, superseding the cycle-41 report (2026-08-16T03:15:00), which
described a 37-tag corpus this run no longer ships and listed T-007 as unreachable six
cycles before it landed. That report in turn superseded the 2026-08-14T05:58:00 one, which
covered only the SMOKE build run.


---

# Closing addendum — cycles 48–56, written at WRAP_UP

The body above was generated by the cycle-47 conductor. It was five addenda behind at the
final cycle; this section pays that off in one place rather than editing the text above, so
what each earlier conductor knew stays legible.

## What changed after cycle 47

| cycle | what landed | evidence |
|---|---|---|
| 49–51 | **KI-17 extension + KI-18 + KI-19** — the dashboard staleness family. Live evidence strip found stale since cycle 42 (renders 43–48 had been writing into a legend comment); repaired and re-audited with the KI-11 classifier. KI-18: the mandated burn-up strip has never rendered and was deliberately not fabricated. | `.swarm/runs/` cycle-049/050/051 artifacts |
| 51 | **T-043** — the uniformity Domain rule finally has a test | commit c2ebece |
| 52 | **The whole spec, mutation-measured.** 29 Domain-rule clauses mutated one at a time → coverage map; **4 holes found**, T-044 closes 2 | commit 4378051, `cycle-052-rule-coverage.mjs` |
| 53 | **T-045** — the cycle-7 conductor gate finally became a permanent test; coverage 28/29 | commit 12c848e |
| 54 | **T-046** — the coverage map **closes at 29/29** | commit 5135c12 |
| 55 | Distill set refreshed and gated 10/10 against the sealed cycle-43 draft's 6/10 | commit 83b4a23 |
| 56 | WRAP_UP | this addendum |

**The headline result:** every one of the 29 Domain-rule clauses in SPEC.md is now asserted
by a permanent test. At cycle 51 four were not, and two of those had been "verified" only by
a conductor gate at cycle 7 — proved once by execution, leaving nothing that would notice a
regression. That distinction is the run's main finding.

## The five distilled lessons — full text

`playbook/learnings.md` was **deliberately left untouched**. It holds **31 lessons against a
stated cap of 20** — a pre-existing breach the previous run already handed to a human
(commit a49bafd). Appending five would make it 36, and the documented fallback's literal
remedy is hand-deleting 16 lessons from a shared file whose overflow policy is explicitly
someone else's call. That action is destructive and not reversible from this run's
artifacts, so it was not taken. The append was also *attempted* via
`bin/swarm-playbook.sh append` and **refused** — the 55th consecutive refusal (KI-5).

So the lessons are carried here in full, and survive without the playbook:

- **L-037 [qa]** Documentation guards must extract from STRUCTURE — tables, rows, delimited
  tokens — and anchor to English prose only where the prose token itself carries
  mathematical meaning. Five consecutive narrowings each bought one attributed kill and left
  a smaller false-rejection hole, and a maintainer's cheapest escape from a false rejection
  is *deleting the guard*. Evidence: cycles 20, 22, 25, 27, 33, 35, 37, 38, 39; KI-9, KI-10,
  KI-12.
- **L-038 [process]** When you author BOTH an artifact and its verification gate, the
  builder-never-saw-the-check protection is gone — add an arm **whose outcome you cannot
  choose**: for a document, the previous version must score 0 on the same checks; for a
  test, the same pre-registered mutant with your new tests filtered out must SURVIVE, or the
  kill was already in the suite. The run's strongest lesson, and the only one observed in
  two different media. Evidence — documents: cycle 41 (13/13 vs 0/13), cycle 42 (15/15 vs
  0/15); tests: cycles 52–54 (cycle 54's L7-ATTR arm, 85p/6f vs 85p/0f filtered).
- **L-039 [prompt]** An agent's filesystem is not the one the conductor pictures: its cwd is
  the SWARM root, not the target, and everything inside the target is readable by it. Name
  an EXPLICIT scratch path inside the target in every dispatch prompt, and seal any
  pre-dispatch baseline by publishing only its HASH, revealing the plaintext after the agent
  returns. Evidence: cycles 9, 19, 21, 24 (KI-7) — four occurrences, zero after the prompt
  named a path; sealing: KI-8, applied cycles 36–38.
- **L-040 [qa]** A conductor verification gate and a permanent test are **NOT interchangeable
  evidence** — a gate proves the behaviour once, by execution, and leaves nothing that would
  notice a regression. Point the mutation instrument at the SPEC's own RULE LIST rather than
  at one code surface; the survivors mark exactly where a past gate stood in for a test.
  When closing a measured hole, pick the assertion the two readings DISAGREE on, not the
  cheapest one that kills the mutant. Evidence: cycles 7, 52 (29 clauses, 4 holes), 53
  (28/29), 54 (29/29).
- **L-041 [process]** A conductor harness must report UNPARSEABLE rather than fall through to
  a verdict, and must force `--test-reporter=tap` whenever it parses test output — a null
  parse that evaluates to "killed" manufactures a clean sheet for every mutant *including the
  control*. And when an instrument's failure mode is found, WRITE IT INTO THE HANDOFF NOTE:
  `node --test` here defaults to the SPEC reporter, and that single fact was re-paid for at
  cycles 19, 23 and 52, and stopped costing cycles only once the handoff named it. Same
  family as L-010. Evidence: cycles 19, 23, 24, 41, 52.

Full drafting rationale, dedupe notes and the losslessness ledger for the cycle-43 draft:
`/opt/swarm/runs/wrapup-candidates.md`.

## What a human must do — ranked

1. **Resolve the playbook cap** (31 lessons vs a stated cap of 20) and then decide whether
   to append the five above. Nothing is lost while this waits.
2. **Repair the allowlist gap (KI-5).** On this host the entries must be **ABSOLUTE**:
   `Bash(/opt/swarm/bin/swarm-budget.sh:*)` and `Bash(/opt/swarm/bin/swarm-playbook.sh:*)`.
   Not fixed here by design — hard rule 5 makes `settings.json` read-only until WRAP_UP
   completes. This one gap cost the run every real budget probe for 55 cycles.
3. **The attribution audit (KI-2, HIGH, open).** 50 corpus attributions, 8 ranked HIGH-risk,
   unaudited. The ranked queue is `docs/corpus-attribution-triage.md`; T-006 is blocked on
   exactly this and T-008 (deepening the corpus) is deliberately deps-gated behind it.
4. **KI-16 (HIGH, open)** — the allocator measured a **zero** premium allowance by real probe
   for six consecutive cycles, pinning the run at gear 1 throughout. Recorded not fixed.

_Correction carried by this reconciliation (run #2, cycle 4)._ **Item 1 is done.** Run #2
cycle 1 (J-1a) cut `learnings.md` from 36 lessons to 20, losslessly, with all 15 `[apply:]`
directives intact — the archive and rationale are `DROP-RATIONALE-2026-08-17.md` in the
playbook directory, superseding the cap handoff this addendum names. **Item 2 (the
allowlist) is unchanged and still owed** — it was attempted at run #2 kickoff and the write
was denied to a `-p` session, confirming rather than resolving the gap; the exact patch is
now at `playbook/HANDOFF-allowlist-2026-08-17.md`. **Items 3 and 4 are unchanged**: KI-2 is
still open and high, and no attribution was checked against a primary source; KI-16 is still
open and high. Source: `.swarm/state.json` → `known_issues[].KI-5.status` /
`.KI-2` / `.KI-16`.

## Verified vs claimed — final

**Machine-checked:** the full suite, run by the conductor at every gate, green at the final
cycle; all 29 SPEC Domain-rule clauses asserted by permanent tests; every closed item gated
by a conductor-authored check the builder never saw, with output pasted into the journal.

**Not machine-checked, and named as such:** the truth of the 50 attributions (a human
judgment against primary sources — KI-2); whether the "Node 18+" floor is real (needs a CI
matrix, cycle 19); and the boundary-classified claims deliberately left unguarded, each with
its reason recorded rather than silently skipped.

Cycles run: **56.** Generated by the cycle-56 conductor at WRAP_UP.

---

# Improvement run #2 status — added by J-4 reconciliation

Everything above this line is run #1's report, frozen at its WRAP_UP (cycle 56,
2026-08-16T11:24 UTC). This section was added 2026-08-17 by item **J-4** (kind: docs,
"Reconcile README.md, REPORT.md and the triage doc against the verified state") of
**Improvement run #2**, which began 2026-08-17, and was extended by that item's second attempt.
Its job is narrow: re-derive every count claim in this document, README.md and
`docs/corpus-attribution-triage.md` from an actual source of truth, correct or flag whatever
does not hold up, and leave a reviewable list of what changed. It does not re-litigate run
#1's findings, does not touch `src/`, `bin/` or `test/`, and does not change the corpus or
any triage risk band.

## Fresh derivation table

**Everything below is measured at commit `dbc1939`** (2026-08-17 11:09:57 UTC), by the command
shown — not copied from any earlier report. Rows are anchored to that commit rather than to
"now" on purpose: an earlier pass of this table pinned five live counts to the running cycle,
and four of them (suite size, total commits, backlog items, known issues) were overtaken by
other items landing in the same wave before the cycle closed. A count pinned to a commit stays
checkable; a count pinned to "just now" does not. Anything you want as of today, re-run the
command without the `dbc1939` ref.

| Claim | Value at `dbc1939` | Source / command |
|---|---|---|
| Corpus entries | 50 | `node -e "console.log(require('./src/corpus.js').corpus.length)"` |
| Distinct authors | 24 | same script, `new Set(corpus.map(e=>e.author)).size` |
| Distinct tags | 12 | same script, tag-count map keys |
| Tag pool range | min 3 (`philosophy`), max 14 (`design`) | same script, min/max of tag-count map |
| Tags used by exactly one entry | 0 | same script, count of tag-count values `=== 1` |
| Entries hedged to "Anonymous" | 1 | same script, count of `author === 'Anonymous'` |
| Triage table rows | 50 | `grep -c '^| [0-9]' docs/corpus-attribution-triage.md` |
| Triage risk bands | HIGH 8 / MEDIUM 16 / LOW 26 | `grep -oP '\| (HIGH\|MEDIUM\|LOW) \|' docs/corpus-attribution-triage.md \| sort \| uniq -c` |
| Suite result | **101 pass / 0 fail** (tests 101, fail 0) | `node --test test/*.test.js` from the repo root |
| Shipped source lines | **549** (args 133 + corpus 269 + select 91 + `bin/aphorism.js` 56) | `wc -l src/*.js bin/aphorism.js` |
| Test lines | **3034** (args 217 + cli 541 + readme-tags 1978 + select 298) | `wc -l test/*.test.js` |
| README-guard share of the suite | **1978 of 3034 lines** (`test/readme-tags.test.js`) | same `wc -l` |
| Commits, total | 122 | `git log --oneline dbc1939 \| wc -l` |
| Commits, run #1 (Build + Improvement #1, through WRAP_UP) | 116 | `git log --oneline ef4fa6d \| wc -l` |
| Commits, run #2 through `dbc1939` | 6 | `git log --oneline ef4fa6d..dbc1939 \| wc -l` |
| Backlog items tracked live | 18 (12 done, 4 todo, 1 blocked, 1 dropped) | `git show dbc1939:.swarm/backlog.json` → `items[]`, counted by `status` |
| Known issues tracked live | 20 (14 open, 2 mitigated, 1 partially resolved, 2 resolved during run #2, 1 accepted-trade) | `git show dbc1939:.swarm/state.json` → `known_issues[]`, counted by `status`; the two entries with no `status` field (KI-2, KI-15) counted as open |
| KI-2 (corpus attributions) | **OPEN, severity HIGH** — unchanged | same file, `known_issues[]` where `id == "KI-2"` |
| Decisions recorded | 8 (run #2's own state file; run #1's 93 are in the pre-run-2 snapshot) | `git show dbc1939:.swarm/state.json` → `decisions[]` |
| Verification artifacts | 297 committed under `.swarm/runs/`, both runs combined | `git ls-tree --name-only dbc1939 .swarm/runs/ \| wc -l` |
| Last fully recorded cycle | 4 | `git show dbc1939:.swarm/state.json` → `.cycle` |

Note on the backlog count: `.swarm/backlog.json` deliberately does not restate the 48 done and
4 dropped items run #1 finished — its own `_provenance` field says they are carried forward
in `backlog.json.pre-run2-1786955683` and in git history instead. The 18-item live count above
is run #2's own items plus the handful of open/blocked items run #1 left behind (T-006,
T-008, T-024 and its children, T-040), not a repo-wide total.

## Claims corrected or flagged in this document (the reviewable diff)

All edits below are inline, italic, "_Correction carried by this reconciliation..._" notes
placed immediately after the claim they correct, in this document's own established house
style (matching the existing "_Correction carried by this refresh._" note near the top). No
existing sentence was deleted or silently reworded; each correction sits next to what it
corrects so a reader can compare both.

1. **"This repo has been through two SWARM runs"** → corrected in place to **three**, since a
   second improvement run now exists. (§ What this report covers)
2. **`node --test test/*.test.js  # 80 tests`** in the Run it section → corrected in place to
   **`# 100 tests as of run #2 cycle 4`**, since that comment is a live instruction a reader
   would run today, not a historical snapshot. (§ Run it) — **superseded by entry 9: that
   replacement was itself wrong for the cycle it named.**
3. **"Fifteen recorded... 11 open, 2 mitigated..., 2 resolved"** (Known issues summary) →
   flagged stale; current count is **19** (13 open / 2 mitigated / 1 partially resolved / 2
   resolved this run / 1 accepted-trade). Original left as written; correction note added
   directly below it. (§ Known issues) — **superseded by entry 12: 20 / 14 open.**
4. **T-024a listed as "blocked" in the Blocked items table** → corrected: T-024a is **done**,
   closed run #2 cycle 2 as part of J-2a, by removal — the exact remedy the row's own "what
   would settle it" column named. T-006 is unchanged, still blocked. (§ Blocked items) —
   **incomplete: two further sites asserted the same thing and were missed. See entry 11.**
5. **T-008, T-024, T-024b, T-032, T-039 listed as open/unfinished in the "six open items"
   table** → corrected: **T-008 dropped** (excluded as a non-goal — widening an unaudited
   corpus ahead of a human attribution pass would enlarge KI-2); **T-024, T-024b, T-039
   done** (run #2 cycle 3, J-2b); **T-032 done** (run #2 cycle 2, J-2a). Only **T-040** is
   still todo. (§ Unfinished work)
6. **Stats table "Cycles run: 46 completed, 47 in flight" and "Tests: 80 pass / 0 fail"** →
   flagged stale; a pointer note was added directly below the table to this section's fresh
   derivation table above (cycles: run #1 finished at 56, run #2 is now at cycle 4; tests: 100
   pass / 0 fail). Table cells left as written rather than edited piecemeal. (§ Stats) —
   **superseded by entry 13: the figure is 101 pass / 0 fail, and the same table's "2101 lines
   of tests" cell was stale and unflagged.**
7. **"KI-5 (the playbook is inert until someone culls it to the cap...)"** in the "Only a
   human can finish these" list → corrected: the cap half is **done** (run #2 cycle 1, J-1a —
   36 lessons to 20, losslessly, all 15 `[apply:]` directives intact); only the allowlist half
   is still owed, now handed off at `playbook/HANDOFF-allowlist-2026-08-17.md`. (§ Honest
   hand-off)
8. **"1. Resolve the playbook cap..."** in the closing addendum's "What a human must do —
   ranked" list → corrected: **done**, same fact as item 7, with the same superseding handoff
   file. Items 2–4 in that list (allowlist, KI-2, KI-16) are unchanged. (§ What a human must
   do — ranked)

### Entries 9–17 — added by J-4's second attempt

Entries 1–8 above were made by the first attempt at this item. Its three defects all had the
same shape: **the right correction was applied to the first occurrence of a claim and not to
the rest.** Entries 9–17 close that, and every one of them names *every* site the claim
appears at, found by `grep` over all three files rather than by memory.

9. **`# 100 tests as of run #2 cycle 4`** (§ Run it) → replaced with **`# prints its own
   test/pass/fail totals`**. The integer was wrong for the exact cycle it named: the suite
   closed that cycle at **101**, because another item added a test in the same wave. The form
   was the defect, not just the digit — a builder cannot know the end-of-cycle suite count, so
   **the route chosen here is to state how to obtain the number instead of pinning one**.
   `node --test` prints `tests`/`pass`/`fail` totals itself, so the comment now points at the
   command's own output and cannot go stale. (The alternative route — pin to a cycle that has
   already closed — was rejected for this site because the line is a copy-paste instruction, and
   a reader running it wants today's number, not a historical one.) Supersedes entry 2.
10. **"1511 of 2101 test lines"** — **three sites, all stale, none previously marked.**
    `grep -n "1511\|2101" README.md REPORT.md docs/corpus-attribution-triage.md` returned exactly
    three lines before this attempt added its notes — no hit in README.md or the triage doc, and
    three in this file: § *What has actually been run against the shipped binary —
    cycles 49–50* ("hardening README guards to 1511 of 2101 test lines"), § *What the run
    actually spent itself on* ("now **1511 of the repo's 2101 test lines**"), and the § *Stats*
    table ("2101 lines of tests"). A correction note is now appended at each. The pair was
    **exactly true when written** at run #1 cycle 47 — at commit `fa68c0a`, `wc -l` over the four
    suites gives 190 + 220 + 1511 + 180 = 2101 — and was overtaken by later test growth, most
    recently by run #2's own cycles 2–3. Measured at `dbc1939`: `wc -l test/*.test.js` → args
    217, cli 541, readme-tags 1978, select 298, **total 3034**; the README-guard family is
    **1978 of 3034**. The adjacent **"549 lines shipped (`src/` + `bin/`)" was re-measured and
    is exactly right** (133 + 269 + 91 + 56) — it is left untouched at both of its sites.
11. **T-024a asserted as blocked — three sites, one previously corrected.**
    `grep -n "T-024a" REPORT.md` returns five lines; three of them are assertions of status
    (the § *Blocked items* row, already handled by entry 4; the "**Blocked at the attempts
    cap:** T-024a" bullet in § *What the run actually spent itself on*; and the "one child
    (T-024a) is blocked at the attempts cap" clause inside the **T-024** row of § *Unfinished
    work*), and two are references inside correction notes. The two unmarked sites now carry
    the same dated note the first one did. **T-024a is `done`** — `.swarm/backlog.json` →
    `items[]` where `id == "T-024a"` → `status: "done"`. Extends entry 4.
12. **Known-issues count "19 (13 open)"** → corrected in place to **20 (14 open, 2 mitigated, 1
    partially resolved, 2 resolved during run #2, 1 accepted-trade)**, ids KI-2 plus KI-5
    through KI-**23**. The 19/13 figure was true when entry 3 was written and was overtaken by
    KI-23 being filed. Both sites carrying the number were fixed: the § *Known issues* note and
    the fresh derivation table row. Source: `git show dbc1939:.swarm/state.json`; the two
    entries with no `status` field (KI-2, KI-15) are counted as open, which is stated at both
    sites. Supersedes entry 3.
13. **The § *Stats* pointer note** → rewritten. "Currently **100 pass / 0 fail**" became
    **101 pass / 0 fail at commit `dbc1939`**, and the note now also names the **Source size**
    row, whose "2101 lines of tests" it had not flagged (→ **3034**) and whose "549 lines
    shipped" it confirms as still correct. Supersedes entry 6.
14. **Run-history table, Improvement row: "→ in flight, stops 2026-08-16 11:24 UTC"** (§ What
    this report covers). True when written; run #1 has since ended. Handled as a dated history
    row — the row is **kept verbatim** and a note under the table records the outcome (WRAP_UP
    at cycle 56, 2026-08-16T11:24 UTC, commit `ef4fa6d`) and marks the row's "80 tests" as a
    mid-run figure. `grep -n "in flight" README.md REPORT.md` found eight sites before this
    attempt, none of them in README.md: this row, three handled by entries 13, 15 and 16, one
    quotation inside this list, and three in run #1's body text about run #1's own cycle 47,
    already governed by the frozen-document note at the top of this report.
15. **"(Improvement run #2, in flight at cycle 4)"** (§ What this report covers) and **"is at
    **cycle 4** as this is written"** (§ Improvement run #2 status) → both de-pinned from a
    running cycle, for the same reason as entry 9. The section heading's ", cycle 4" was dropped
    for the same reason.
16. **The fresh derivation table** → re-anchored. Every row is now measured **at commit
    `dbc1939`** with the ref in the command, instead of "just now". Six values were re-measured
    and corrected: suite **100 → 101**, total commits **121 → 122**, run #2 commits **5 → 6**,
    backlog items **17 → 18** (12 done, not 11), known issues **19 → 20**, and the "Current
    cycle: 4 (in flight; `state.json.cycle` = 3)" row — whose parenthetical was already false,
    `.cycle` now reading 4 — rewritten as **"Last fully recorded cycle: 4"**. Six rows were
    added: shipped source lines (549), test lines (3034), the README-guard share (1978 of 3034),
    tags used by exactly one entry (0), decisions recorded (8), and verification artifacts (297).
    The last two were added because the § *Stats* note claimed this table carried "fresh sourced
    numbers for every one of" that table's rows, and it did not; that sentence is now replaced by
    one that names exactly which rows are restated here and which are left as run #1 history.
17. **README.md, § Tag vocabulary** — "0 tags appear exactly once **and 0 tags sit on exactly
    one entry**" stated one fact twice as though it were two. Both halves are **true** — building
    the tag-count map from `src/corpus.js` gives zero tags with a count of 1 — so this was
    redundancy, not error.
    Reworded so the second half reads as an explicit restatement rather than an independent
    count. **Both phrasings are deliberately kept**: `test/readme-tags.test.js` guards
    "`<N>` tags appear exactly once" and "`<N>` ... exactly one" as two separate, independently
    corpus-checked claims, and `test/` is outside this item's scope, so deleting either half
    would have broken a passing test to tidy a sentence.

## What did not need correcting

Every count claim citing the corpus or the triage table — in this document, in README.md, and
within `docs/corpus-attribution-triage.md` itself — was re-derived against `src/corpus.js` and
the triage table's own rows (see the derivation table above) and found **true, unchanged,
zero edits needed**: 50 entries, 24 authors, 12 distinct tags (pool range 3–14), 0 tags used by
exactly one entry, 1 entry hedged to Anonymous, 50 triage rows split 8 HIGH / 16 MEDIUM / 26
LOW. `docs/corpus-attribution-triage.md` needed **no edit at all**: it states no repo count, its
remaining integers are entry indices and citation years, and both it and README.md carry numbers
that already match the source of truth exactly. README.md's only edit is the wording change in
entry 17 — no number in it changed.

Neither file describes the corpus attributions as audited, verified, confirmed or vouched for
anywhere — both consistently use "triage, not an audit" / "unverified" / "unaudited" language,
and **KI-2 stays open and high throughout**. A repo-wide search for the audit/verified-attribution
word family turned up no file, in scope or out of it, that misdescribes the corpus as audited.

One honest limit is left honest on purpose: `SPEC.md` records that a prior run's `cmd_parse`
claim was code-read and **never executed**, and this document's single mention of it carries no
verification verb. It was not upgraded.

## Non-goals honored

No file outside README.md, REPORT.md and docs/corpus-attribution-triage.md was edited —
`git diff --name-only -- src bin test` is empty. No number in `src/corpus.js` or any triage risk
band was changed. No test was weakened, skipped or deleted to make this reconciliation land —
`node --test test/*.test.js` was run unmodified and reported **101 pass / 0 fail** both before
and after these edits.
