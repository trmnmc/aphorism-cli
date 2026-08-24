# aphorism-cli — overnight build report

Improvement run #8 adopted run #7's spec (which delivered zero work cycles) and re-verified
it item by item before building anything (L-045). It measured which count-claim guards in
`test/` actually bind at HEAD, replaced the "COUNT floor" question run #7 named with a
bounded, rerunnable DETECTION floor (mutation matrix + identity control), closed the
long-carried KI-R6-3 duplicate-guard issue by consolidation, quoted README's citation rule
verbatim instead of paraphrasing it, counted the citation two-commit tax over real history,
adjudicated README's 127-vs-129 Node-support matrix numbers by measurement (verdict:
correct as cited, zero README edits), and shipped every one of those findings as a
rerunnable tool under `tools/`, plus one dispatcher (`tools/run-all.mjs`) that re-runs all of
them. This item (W-10) is the last piece: it states the run's own before/after `test/` line
count — which is **not** flattering — and carries the run's escalation of the three
user-visible product changes the trickle brief has now locked out for four consecutive runs.

_No screenshot captured this run — the target is a terminal CLI with no visual surface._

## Run it

```
node bin/aphorism.js
```

Re-measured at this writing, at HEAD `d899fe0` (cycle 7's commit; this item is cycle 8's
work and has not been committed by the conductor yet): suite green **128 / 128**,
`src/corpus.js` sha256 `77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e`,
`--help` sha256 `d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64` — both
byte-identical to the run's locked baseline (`state.json.baseline`, commit `20b7ede`).

## Must-haves

Status vocabulary: **shipped** / **held** / **NOT-RUN** / **blocked**. Every row below is
either independently re-run in this checkout (evidence commands shown) or cites the
conductor's own verification gate on record in `.swarm/backlog.json` — never a builder's
unverified claim.

| Must-have | Status | Evidence |
|---|---|---|
| **S-1** — measure which count-claim guards bind at HEAD, then replace a COUNT floor with a DETECTION floor | **shipped** | `node tools/guard-inventory.mjs` (W-1): floor verdict **ABSENT** — no `>= 121 tests` (or any) suite-size floor ever existed; re-run here shows `"121"` occurs only in 2 comment-position locations. `node tools/mutation-matrix.mjs` (W-2, W-12/13/14): 18 rule-generated mutations + 1 identity control, baselined at `20b7ede`, committed in `tools/mutation-matrix-baseline.json`. `node tools/detection-floor.mjs` (W-8): re-run here — **VERDICT: DETECTION FLOOR HOLDS at HEAD**, 14 same-guard + 1 guard-changed (M08, named) + 3 claim-gone (M01–M03, ruling W8-R1: a claim whose README anchor occurs 0 times is a retired claim, not lost detection) + **0 detection lost**. Conductor gate 13/13 cells, cycle 7. |
| **S-2** — close KI-R6-3 (the two guards reading the same "Tags on exactly one entry" row) | **shipped** | W-7, commit `02f4668` (cycle 4): 9 falsifications probed, firing sets identical on all of them except one direction; the `~434` guard was a strict subset of `~1598` and was removed. Test count **129 → 128**, a permitted drop per S-1. Conductor gate 6/6 on two throwaway clones (detection preserved, converse control green, BOTH-deleted → SILENT). |
| **S-3** — history doc quotes README's citation rule verbatim, not a paraphrase | **shipped** | `node tools/citation-rule-check.mjs` (W-3, P-1, P-2) — re-run here: `OK: docs/node-support-citation-history.md quotes README.md "### Node support" verbatim (257 bytes)`. P-1 (cycle 3) and P-2 (cycle 6) fixed two attribution defects the conductor gate found beyond W-3's own clause (blaming the wrong document on a README-side edit; trusting an ancestor repo's HEAD from a nested non-repo directory). |
| **S-4** — count the citation two-commit tax over history, change nothing | **shipped** | `node tools/citation-tax.mjs` (W-4) — re-run here: **honest denominator 7** pathspec-touching commits since the guard was born, **7 landed RED (100.0%)**, **7 separate follow-up commits** spent re-citing, gaps `1, 1, 2, 1, 2, 3, 1`, 0 same-commit repairs. (The tax grew from the cycle-2 measurement of 6/6 to 7/7 because W-7/W-11, cycle 4, opened and closed one more citation window — itself a measured instance of the same tax, not an exception to it.) Tool writes nothing; re-verified `git status --porcelain` empty after running it. |
| **S-5** — adjudicate README's 127-vs-129 matrix numbers by measurement | **shipped** | `node tools/matrix-adjudication.mjs` (W-5) — re-run here: **VERDICT: CORRECT-AS-CITED**. Cited base `02f4668`'s `src bin test .github` content is identical to HEAD's (empty diff, both committed and working-tree forms); reconciliation holds `128 = 128`, `126 (CI, shallow) = 128 (local) − 2 (guard cases skipped on a shallow checkout)`. **Zero README edits made**, per S-5's own "correct-as-cited is a pass" clause. |
| **S-6** — every published finding ships as a rerunnable tool, not prose | **shipped** | `node tools/run-all.mjs` (W-9) re-run here: dispatches all 7 tools (guard-inventory, test-line-delta, mutation-matrix [opt-in, excluded by default], citation-rule-check, citation-tax, matrix-adjudication, detection-floor) in a stated order; roll-up **6/7 ran clean, 1 SKIPPED by design**. See the findings→executables ledger below — nothing in this report is prose-only. |
| **S-7** — the escalation, written as launchable brief text | **shipped** | The single paragraph below, under "The S-7 escalation." This is where S-7 is discharged; it is not re-derived anywhere else in this document. |
| **S-8** — standing invariants (no new deps/features, corpus/`--help` sha unmoved, green every commit bar one predicted citation window) | **held** | Re-measured directly in this checkout (see "Run it" above): both sha256 hashes unmoved, suite green 128/128/0/0. `git status --porcelain` over `src bin test .github README.md docs` is empty except this item's own files (`tools/run-all.mjs` edited, `tools/test-line-delta.mjs` added — both `tools/`, outside the cited pathspec). `grep` over every `tools/*.mjs` import: **zero** non-`node:` imports (this item's own `test-line-delta.mjs` imports only `node:child_process`, `node:path`, `node:url`). No manifest/lockfile exists or was added. The one permitted citation window (S-8's "bar one") was opened by W-7 (`02f4668`) and closed in the same cycle by W-11 (`4980f3a`), both named in advance per S-8's own clause; no commit since has opened another. |

**7 of 8 must-haves shipped, 1 (S-8) held as a standing invariant across every commit this run has made.** Nothing is NOT-RUN and nothing is blocked in this table — every item below the table that IS blocked is a backlog item outside S-1..S-8, surfaced honestly in "Known issues."

## The before/after `test/` line count

**`test/` moved from 4,587 lines (baseline `20b7ede`) to 4,666 lines (HEAD `d899fe0`): +79 lines.** This is *not* the flattering half of the story and it is reported anyway, as the run's own scoreboard requires: `test/` is **larger** than when the run started, even though the run's only test-count change was a **removal** (129 → 128 tests, S-2/W-7). The 79 added lines are not a second guard — they are the documentation, attribution controls, and comments that commit `02f4668` (cycle 4, item **W-7**, closing KI-R6-3) added alongside the one test block it removed: 119 insertions / 40 deletions in `test/readme-tags.test.js`, net +79. No other commit between baseline and HEAD touches `test/` at all (`git log --oneline 20b7ede..HEAD -- test/` returns exactly one commit).

| File | Baseline (`20b7ede`) | HEAD (`d899fe0`) | Δ |
|---|---:|---:|---:|
| `test/args.test.js` | 217 | 217 | 0 |
| `test/cli.test.js` | 541 | 541 | 0 |
| `test/node-support-citation.test.js` | 270 | 270 | 0 |
| `test/pipe.test.js` | 245 | 245 | 0 |
| `test/readme-matrix-consistency.test.js` | 238 | 238 | 0 |
| `test/readme-tags.test.js` | 2,778 | 2,857 | **+79** |
| `test/select.test.js` | 298 | 298 | 0 |
| **TOTAL** | **4,587** | **4,666** | **+79** |

**The executable that re-derives this: `tools/test-line-delta.mjs` (new this cycle, item W-10).**

```
$ node tools/test-line-delta.mjs
TEST/ LINE-COUNT DELTA -- measured from git objects, never hardcoded
...
  TOTAL                                       4587    4666  +79
...
== commit(s) between baseline and target that touched test/ ==
  02f4668 cycle 4: KI-R6-3 closed by consolidation, and one entry point that re-runs every finding [value]
VERDICT: test/ moved from 4587 lines (20b7ede) to 4666 lines (HEAD): +79 lines.
```

**The S-6 ruling this required, and the measurement that forced it.** `tools/guard-inventory.mjs`
(W-1) already re-derives a `test/` line census — but a grep of the file shows it has **no**
`process.argv` handling anywhere, and its census function calls `readFileSync` on the
checked-out working tree with no revision argument. It can answer "how many lines does
`test/` carry right now"; it cannot answer "how many lines did `test/` carry at `20b7ede`."
That is a two-revision question no shipped tool answered, so this is **branch (a)**: a new
tool, not a citation of existing tooling. `tools/test-line-delta.mjs` was built, registered
as slot `[2/7]` in `tools/run-all.mjs`, and proven to be a real measurement rather than a
constant: run against the baseline compared to itself it reports delta **0**; run against the
commit immediately *before* `02f4668` it also reports delta **0** (confirming `test/` is
untouched up to that point); and run against a scratch clone with a synthetic one-line
addition to `test/args.test.js` committed on top of HEAD, it reported **+81**, not +79 — a
different number, forced by different input, which is what makes it a measurement rather than
a hardcoded print statement. (The scratch clone was built and discarded under
`.scratch-W-10/`, which is deleted; nothing outside `tools/test-line-delta.mjs` and the
`tools/run-all.mjs` registration survives from that check.)

## Findings → executables

Every published finding this run makes, and the executable a skeptical reader re-runs to
re-derive it. Nothing below is prose-only.

| Finding | Item(s) | Executable |
|---|---|---|
| No suite-size COUNT floor ever existed at HEAD (run #7's inherited premise was false) | W-1 | `tools/guard-inventory.mjs` |
| The detection floor: bounded rule-generated mutation matrix + identity control | W-2, W-12, W-13, W-14 | `tools/mutation-matrix.mjs`, `tools/mutation-matrix-baseline.json` |
| No baseline detection lost at final HEAD; ruling W8-R1 on retired claims | W-8 | `tools/detection-floor.mjs`, `tools/mutation-matrix-final.json` |
| The citation two-commit tax, counted over the honest denominator (now 7/7) | W-4 | `tools/citation-tax.mjs` |
| README's 127-vs-129 matrix numbers adjudicated: verdict CORRECT-AS-CITED, zero README edits | W-5 | `tools/matrix-adjudication.mjs` |
| The history doc quotes README's selection rule verbatim, checkably | W-3, P-1, P-2 | `tools/citation-rule-check.mjs` |
| The before/after `test/` line count: 4,587 → 4,666, +79, attributed to `02f4668` | **W-10** | **`tools/test-line-delta.mjs`** |
| Single entry point re-running every published finding | W-9 | `tools/run-all.mjs` |
| KI-R6-3 closed: the two same-row guards consolidated (129→128 tests) | W-7, W-11 | — a code change, not a measured finding; cite commits `02f4668` (removal) and `4980f3a` (the same-cycle re-citation it required) |

## The S-7 escalation

The trickle brief has now locked out the same three user-visible changes for the fourth
consecutive run, and their measurements are already on the record — cited here from
`.swarm/backlog.json` items `TS-1`, `TS-2`, `TS-3` and `TS-6`, not re-derived. Written as brief
text run #9 can be launched with, verbatim:

> Lift the corpus-expansion and no-new-CLI-flags non-goals for run #9, scoped to exactly
> three changes, each already measured and recorded in `.swarm/backlog.json` (items TS-1,
> TS-2, TS-3, TS-6) — do not re-measure them, extend or repair them. (1) Grow
> `src/corpus.js` past its current 50 canon-only entries: under uniform sampling the median
> first exact repeat lands at draw 9 and P(repeat by draw 12) = 76.2% (TS-1), and the corpus
> is 34% concentrated in three voices — Dijkstra 7 + Perlis 5 + Pike 5 of 50 (TS-3). Add
> entries that diversify author and era rather than deepening the three dominant voices, and
> prefer less-anthologized lines over deeper cuts from the same canon. (2) Add no-repeat
> rotation within a session: at minimum, never return the immediately-previous pick on
> consecutive unseeded draws, so a user running the CLI repeatedly in one sitting does not
> hit a near-immediate repeat from a pool where five tag pools already hold <= 4 entries each
> — philosophy 3, readability/reliability/language/process 4 each (TS-2). (3) Make the
> `--tag` vocabulary discoverable without `jq`: today README and `--help` delegate discovery
> to `--list --json | jq -r '.tags[]' | sort -u`, and a retired tag name (e.g. the tag folded
> into "debugging") is byte-identical in exit code, stdout and stderr to a tag that never
> existed (TS-6) — list the tag vocabulary inline in README and `--help`, and if a listing
> flag such as `--tags` is judged in scope, ship it. These three are the only user-visible
> changes in scope for run #9; do not reopen guard-layer or measurement work on this repo
> unless a fresh measurement shows a regression this run's tools did not catch.

## Known issues

Carried honestly from `.swarm/known-issues.json` and `.swarm/backlog.json`'s blocked items —
nothing invented, nothing silently dropped. Resolved/closed entries are named, not re-explained.

**Product-facing (affects a user or a maintainer of this repo):**

- **KI-2 / T-006 (high, open)** — corpus attributions are unaudited; no check available to a
  swarm run can confirm each of the 50 quotes against a primary source. Settles only when a
  human checks the 8 HIGH-risk entries in `docs/corpus-attribution-triage.md` against sources.
- **TS-1, TS-2, TS-3, TS-6 (blocked on a human scope decision)** — see the S-7 escalation
  above; not restated here per S-7's "stated once" clause.
- **J-7 (blocked)** — seven CLI behaviours the Domain rules do not decide (e.g. `--help` vs.
  usage-error precedence, `-0`/`0` seed identity, repeated `--tag`/`--author`, empty `--seed`,
  exit code 3 unlisted in the enumeration). Needs a human ruling written into `.swarm/SPEC.md`.
- **P-7 (blocked)** — "green at every commit" (S-8-style) and the self-falsifying citation
  guard are in direct conflict on the one commit that opens a citation window; a human must
  rule which gives (amend the wording, redesign the citation, or retire the guard).
- **Q-9 (blocked)** — whether a coordinated, table-wide falsification of the Node-support
  matrix is worth an out-of-document anchor (network provenance or a committed CI artifact);
  a human call, not an engineering one.
- **T-040 (blocked)** — two prior editorial judgment calls (a 26-name tag fold map; one SPEC
  illustration line) a human should ratify or reverse.

**SWARM tooling gaps (do not affect the shipped product; fenced from live edits by hard rule
5, reported for a human maintainer):**

- **KI-26 (high, open)** — the WRAP_UP watchdog's DONE-guard treats `REPORT.md` existing as
  "done," which is true from cycle 0 on every improvement run, so it has never once triggered
  a crash-recovery relaunch across 195 firings measured to date.
- **KI-16 (high, open)** — the allocator fails OPEN on a usage-probe blackout (`ok:false`
  still emitted a non-zero spend allowance in one measured instance).
- **KI-14 (high, open, scoped)** — the weekly-rollover detector's integer-second comparison
  can misfire on a sub-second boundary crossing; shown this run to be currently harmless only
  because a second, independent gate (the human-reserve floor) already reads 0.
- **KI-8 (high, mitigated in practice, root cause open)** — the conductor's pre-dispatch
  verification seal has leaked to a running builder through four distinct channels across
  prior runs; commit-reveal (hash-commit, delete, restore) has held every time it was used
  correctly, but the boundary is conductor discipline, not a structural control.
- **KI-37 (medium, open)** — two SWARM usage-probe instruments disagreed on opus weekly usage
  by a factor of six in one measured window (100% vs. 16%); root cause not diffed.
- **KI-13 (low, open)** — the allocator's `halted` posture has no defined conductor semantics
  for a run already in flight.
- Additional lower-severity SWARM-side render/audit/naming gaps remain open and are not
  restated here: **KI-5, KI-6, KI-7, KI-12, KI-15, KI-17, KI-18, KI-19, KI-20, KI-21, KI-22,
  KI-24, KI-25, KI-27, KI-28, KI-29, KI-30, KI-33, KI-34, KI-35** — see
  `.swarm/known-issues.json` for each. **Resolved or closed since being filed** (named, not
  re-explained): KI-9, KI-10, KI-23, KI-31, KI-36.

## Honest hand-off

**Machine-checked in this checkout, right now, by tools committed to `tools/`:** the suite
(128/128 green), both S-8 invariant hashes (byte-identical to baseline), a clean working tree
outside this item's own two files, the `test/` line-count delta (+79, attributed to one named
commit), the citation tax (7/7), the matrix adjudication (CORRECT-AS-CITED), the citation-rule
quote check (OK), and the detection floor (holds, 0 lost). `tools/run-all.mjs` re-runs all of
it in one command.

**Not run, and reported as NOT-RUN rather than passed:** nothing in S-1..S-8 falls into this
bucket at this checkout — every must-have above is either shipped-and-reverified or held. What
*is* genuinely unresolved is everything in "Known issues": those are correctly BLOCKED, not
NOT-RUN, because engineering cannot settle them — a human ruling can.

**What only a human can finish:**

1. **The S-7 escalation.** Corpus depth, no-repeat rotation, and `--tag` discoverability are
   the three product changes a user would actually notice, locked out for a fourth
   consecutive run by a brief this run had no authority to widen. The paragraph above is
   written to be pasted into run #9's kickoff without editing.
2. **Every blocked item above** — KI-2/T-006, J-7, P-7, Q-9, T-040 — needs a named human
   ruling, not another measurement pass; none of them is dispatchable to a future swarm cycle
   until a human decides.
3. **The SWARM tooling gaps**, especially KI-26 (watchdog never fires) and KI-16/KI-14/KI-8
   (spend-authorization and evidence-sealing edges) — all fenced from in-run edits by hard
   rule 5, all reported here for whoever maintains the swarm harness itself.

**What run #8 leaves behind, and it is not nothing:** eight must-haves, seven shipped and
independently re-verifiable by seven executables under `tools/` plus a dispatcher that runs
them all, one held standing invariant across every commit this run made, and one honest,
unflattering scoreboard number (`test/` is 79 lines larger than when the run started) reported
instead of rounded away.

---

Cycles run this improvement run: **0 through 7 complete** (13 commits, `912a2a4^..d899fe0`; the
caret is load-bearing since `912a2a4` is this run's own first commit and two-dot ranges exclude
their left endpoint),
**cycle 8 in progress** — this item, W-10, is cycle 8's work and has not yet been committed by
the conductor at the time this file was written. If the run stops before a further cycle
runs, this report is the complete and honest record of where it stopped; nothing above assumes
a cycle that has not happened.
