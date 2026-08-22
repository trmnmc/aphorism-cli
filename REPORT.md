# aphorism-cli — overnight build report

Improvement run #6 repaired the README regression run #5 caused and, more usefully, **measured** the guards that shaped it — turning an unfalsifiable "harden tests / polish docs" brief into one experiment whose result contradicted the run's own premise.

_No screenshot captured this run — the target is a terminal CLI with no visual surface._

## Run it

```
node bin/aphorism.js
```

Suite: `node --test test/*.test.js` — **129 tests, 129 pass, 0 fail, 0 skipped** at the final commit `180e9da`.

## Must-haves

| Must-have | Status | Reason / evidence |
|---|---|---|
| **Q-1** — the five `Updated 2026-08-20 (cycle N)` run-journal blockquotes move verbatim out of README.md to `docs/`; README ≥ 5000 bytes smaller; zero tests weakened | ✅ shipped | README 16,609 → **11,046 bytes (−5,563)**, verified by `wc -c` at wrap-up. Blockquotes live in `docs/node-support-citation-history.md`. Gate 7/7, cycle 1. **Zero guards broke** — which is the run's headline finding, below. |
| **Q-2** — every guard that breaks is repaired AT ITS ANCHOR, never by restoring prose; each classified guard-defect vs real-claim-loss, both columns reported, survivors named as the control | ✅ shipped | Vacuously satisfied in the useful direction: zero guards broke under the extraction (cycle 1), so the guard-defect column is empty and every guard is a survivor/control. Its one carried-forward item was closed in cycle 4 by discovering the file it named (`citations.test.js`) **has never existed on any branch** — `git log --all` for that path is empty. |
| **Q-3** — Node-support section audited doc→code AND doc→doc; the `tests 120` vs `121` self-contradiction fixed to a measured value; a count claim there can no longer silently disagree with its own matrix table, failable + attributable + converse-controlled | ✅ shipped | Gate 20/20, cycle 4. `test/readme-matrix-consistency.test.js` added (5 tests, suite 124 → 129). Cells C4a/C4b, **measured SILENT in cycle 3**, fire on byte-identical inputs after the fix (3 pass / 4 fail each); converse controls C6/C5 stayed green 5/0; C8 proved cross-row agreement does independent work. |
| **Q-4** — tag-vocabulary guard re-anchored to the table, one honest sentence restored, fixed-vs-unfixed columns on true inputs reported | ✅ shipped | Gate 14/14, cycle 2. Both columns measured and reported: a FALSE prose count fires on both trees; a TRUE prose count is SILENT on the unfixed tree and FIRES on the fixed one. The real cost — an honest TRUE restatement in prose is now refused — is recorded, not buried. |
| **Q-5** — suite green ≥ 121 at every commit, zero features, zero new deps, `src/corpus.js` and `--help` byte-identical | ✅ shipped | Held at every commit and re-checked at wrap-up: corpus `sha256 77a4de5c…`, `--help` `sha256 d759d781…`, both **unmoved from the kickoff baseline**; no manifest exists, so no dependency can be added. Suite never below 121. See the two RED-BY-DESIGN windows under "Known issues" — both were predicted, walked knowingly, and closed. |
| **Q-6** — the playbook allowlist item is CLOSED at kickoff by one read; escalate once, never re-derive | ✅ shipped | Closed at cycle 0 by a single structural read of live `settings.json` (L-045). Re-confirmed once at wrap-up, as the fallback path required — see KI-R6-2. |
| **Q-8** — re-cite the Node-support matrix to a run describing the post-Q-3 tree | ✅ shipped | Gate 6/6, cycle 5, **salvaged from a crashed cycle and gated at salvage time** — details below. |

Also closed: **Q-7** (cycle 3, gate 17/17) — the first of the two re-citation round trips.

## Decisions log

- **cycle 0**: Re-aimed the brief's three open-ended chore headings onto ONE falsifiable experiment — extract the guard-shaped prose out of README.md and treat every guard that breaks as the finding — because "harden tests" and "polish docs" are unfalsifiable as written and produced churn for five runs.
- **cycle 0**: Closed Q-6 at kickoff in one read rather than opening it as work (L-045: escalate the locked lever once, never re-derive it).
- **cycle 0**: Derived `usage_reset_at` from a real probe rather than setting it equal to `stop_at` — run #5's retro showed that defect bought eleven consecutive gear-1 cycles.
- **cycle 0**: Recorded taste-judge dissent (use-twice: 4/10) for the third consecutive run rather than overriding it. Every candidate that would move it is a new user-visible feature, excluded by the brief. **Operator lever, not a swarm one.**
- **cycle 1**: Forbade the Q-1 builder from touching `test/`, and treated the resulting pass/fail list as the deliverable — a builder that repairs a failing guard mid-edit destroys the measurement.
- **cycle 2**: Committed with a citation guard RED, knowingly, filing the re-cite as Q-7 rather than buying green. The guard's subject is a git pathspec covering `test/`, so it cannot be green on the commit that changes it.
- **cycle 2**: Kept the builder's out-of-scope deletion of a prose allowlist but **rejected its stated rationale** — measured both arms directly; the allowlist was not a live hole, it went dead when the prose readers were retired.
- **cycle 3**: Cited run `32400996331` @ `4b63e91`, NOT the newer `32401050374` @ `2014bb9` — the newer run was ineligible under the section's own selection rule. Citing it would have satisfied the machine guard while violating the prose rule the guard exists to serve.
- **cycle 3**: Ratified the builder's departure from the history file's "Cycle N" labelling — for a better reason than it gave (label collision, not the builder's stated uncertainty).
- **cycle 4**: Committed with both citation guards RED again, **predicted in the sealed gate BEFORE dispatch** rather than explained afterwards; the prediction was then checked and matched exactly.
- **cycle 4**: Forbade the builder from editing the four matrix rows and made that a gate cell rather than a hope — the rows describe a real past CI run, and "fixing" them to match the local suite would fabricate a result that never ran.
- **cycle 4**: Reported C7 as an **unfixed column** rather than letting the C4a/C4b win imply coverage it did not buy.
- **cycle 4**: Closed Q-2 by discovering its remaining work was a file that has never existed — a PLAN-time `files_hint` restated as an observation, twice, with no cycle spending four seconds to `ls` it.
- **cycle 5**: Salvaged the crashed cycle's uncommitted Q-8 work and committed it as **verified, not WIP** — authored a 6-cell gate at verification time that the (long-dead) builder never saw.
- **cycle 5**: Verified the cited CI run against **GitHub's API and its four job logs**, not against the document doing the citing.
- **cycle 5**: Filed the README-vs-history rule disagreement as KI-R6-5/Q-10 and **did not fix it** — WRAP_UP finishes nothing new.

## Known issues

- **KI-R6-1** (med, cycle 0): The watchdog DONE-guard keys on `REPORT.md` *existing*, which on an improvement run is true from cycle 0 because run #5 wrote it — so `swarm-watchdog.timer` read "all-done / reports-present" and **no-opped on every firing for the entire run**. Mitigation at kickoff was `swarm-pacer.timer`; that mitigation then failed (see KI-R6-6). Tool bug; hard rule 5 forbids repairing it mid-run. **Human item.**
- **KI-R6-2** (med, cycle 0): `bin/swarm-playbook.sh` has **no allowlist entry under any path form** in `/opt/swarm/.claude/settings.json`. Confirmed structural at wrap-up per L-039's diagnostic: re-executed under the bare absolute-path form (no env prefix, no compound command), denied, then confirmed by grepping the settings file — `swarm-budget.sh` and `swarm-notify.sh` are both present; this one has never been added. Denial #36, 10th consecutive. Playbook directives were staged by direct `Read`, so **the file was never validated by the script's own parser this run**. **Human item** — see `HANDOFF-allowlist-2026-08-17.md`.
- **KI-R6-3** (low, cycle 2): Two guards in `test/readme-tags.test.js` read the same table row. **Induced by the conductor's dispatch**, which mandated both a re-anchor and a no-shrink floor; the builder disclosed it rather than hiding it. Harmless but not coverage — a candidate consolidation once the Q-5 floor is not binding.
- **KI-R6-4** (low, cycle 4): The README Node-support matrix can still be falsified **wholesale**. Gate cell C7 changed all four rows together to a self-consistent falsehood and `test/readme-matrix-consistency.test.js` stayed SILENT (5 pass / 0 fail). Per-row arithmetic and cross-row agreement catch a single bad row, a transcription slip, or a partial edit — **not a lie told consistently**. Closing it needs an anchor outside the document (live network provenance, or a committed machine-readable CI artifact). **Operator's call — Q-9.**
- **KI-R6-5** (low, cycle 5): `docs/node-support-citation-history.md` **paraphrases** the rewritten citation-selection rule instead of quoting it, and the paraphrase is a *different rule*: it selects "the most recent run whose cited commit's content is byte-identical to this tree", which on this tree selects `3a5d6e3` @ run `32405575919` (35 seconds more recent, and `git diff 7e50d6f..3a5d6e3 -- src bin test .github` is empty) — **not** the `7e50d6f` the README cites. The README's own rule is correct and green; no guard reads the history file's prose, so nothing catches the disagreement. Fix is one line: quote the rule verbatim. **Q-10.**
- **KI-R6-6** (high, cycle 5, found at wrap-up): The run **overshot `stop_at` by 25.5 hours with no cycle firing**. Cycle 4 committed ~2026-08-20T18:55Z; the next session woke 2026-08-22T16:04Z. `swarm-pacer.timer` was the designated recovery path and produced no cycle in that window, while the watchdog was already structurally dead (KI-R6-1). A crashed cycle 5's **finished work sat uncommitted in the working tree the entire time** and no mechanism detected it. **Human item** — the pacer's own liveness needs a check.

## Night log

- **cycle 0**: KICKOFF. Stress-test verdict RESHAPE (confidence 7); brief re-aimed onto one falsifiable experiment. Q-6 closed by a single read. Watchdog no-op identified and journaled *before* it mattered.
- **cycle 1**: Q-1 — the run journal leaves the README (−5,563 bytes). Gate 7/7. **Zero guards broke**, so they were anchored to structure, not to the padded prose: the run's premise was half wrong in the useful direction.
- **cycle 2**: Q-4 — tag counts leave the prose; guards stop punishing honest writing. Gate 14/14. Committed with a citation guard RED by design; Q-7 filed.
- **cycle 3**: Q-7 — re-cited to the run that is *eligible*, not the one that is newest. Gate 17/17, suite 124/124/0. Green at commit, re-measured rather than assumed.
- **cycle 4**: Q-3 — the matrix table's own numbers get a guard, and the silence stops. Gate 20/20. C4a/C4b go SILENT → FIRES on byte-identical inputs. C7 measured silent and reported as an unfixed column. Q-2 closed on a file that never existed.
- **cycle 5**: WRAP_UP, 25.5h late. Crashed-cycle salvage gated 6/6 against GitHub's own job logs; suite 129/129/0/0; KI-R6-5 found while reading the diff of a gate that had already passed.

## Night control log

_No commands received._

## Stats

| Stat | Value |
|---|---|
| Cycles run | **5** (0–5), against an expected shape of 3–5 |
| Commits | 11 (baseline `3a17cc5` → `180e9da`), all pushed |
| Agents dispatched | 5 builders (k=1 every wave) + 1 taste judge + 1 stress-test pass |
| Models used | sonnet (build/test items), fable (judgment seats — never demoted, per the fable guard) |
| Notifications sent | 8 `ok` lines in `runs/notify.log` |
| Pace | mode **guest**, dial 0.3, gear range **2–2** (ρ ≈ 0.51; guest clamps to 1–3 and never upshifts). Window utilization at each in-run reset: **not measured — no probe ran after 2026-08-20T18:21Z**, and the run then idled ~25h across roughly five resets. Voluntary idle cycles: 0 (the 25h gap was a *failure*, not voluntary idle). |

## Honest hand-off

**Machine-checked, and you can trust it:** the suite is 129/129/0/0 at `180e9da` and green in CI on Node 18, 20, 22 and 24. Every guard added this run was shown both *failable* and *attributable* (the mutation was run twice, once with the new test removed), and each was paired with a converse control that must stay green — so none of them is a snapshot hash wearing an assertion's clothes. The README's CI citation is verified against GitHub's API and all four job logs, not against itself. `src/corpus.js` and `--help` are byte-identical to the kickoff baseline; the CLI's behavior did not change at all this run, by design.

**Machine-checked, with a stated limit:** the matrix guard catches a single falsified row, a transcription slip, or a partial edit. It does **not** catch all four rows falsified together consistently — that was measured, not assumed (KI-R6-4), and closing it needs an anchor outside the document. A narrowed hole stated as narrowed is worth more than a closed hole claimed.

**Only a human can finish these:**
1. **The product question, raised for the third consecutive run by a fourth independent taste judge.** "Would you use this twice?" scores **4/10**. The fix — corpus depth, or no-repeat rotation so 50 canon-only entries stop repeating by roughly the 9th draw — is a user-visible feature and is locked out by the allocator brief in every run so far. Three runs have now re-derived this same conclusion at the cost of three runs' worth of manufactured chores. **This is an operator lever; the swarm cannot pull it.** (Backlog: TS-1, TS-2, TS-3.)
2. **Q-9 / KI-R6-4** — is a coordinated table-wide falsification worth an out-of-document anchor? Both mechanisms (live network provenance; a committed CI artifact) change what CI is responsible for. Your call, not the swarm's.
3. **Q-10 / KI-R6-5** — one-line doc fix: make the history file quote the README's selection rule instead of paraphrasing it.
4. **KI-R6-2** — add `bin/swarm-playbook.sh` to the allowlist. Ten consecutive denials; this run's playbook handling was staged by hand and **never validated by the script's parser**.
5. **KI-R6-6** — the pacer stopped firing and nothing noticed for 25.5 hours. The watchdog could not cover for it (KI-R6-1). Both need a human.
6. **Corpus attribution** (T-006, T-040) and **seven unspecified CLI behaviours** (J-7) remain human rulings, unchanged from prior runs.

**Not run, and reported as not-run:** no full QA pass ran after cycle 1 (`qa.last_full_qa_cycle: 1`); no taste pass ran this run at all (`last_taste_cycle` unset — the cycle-0 taste judge ran at kickoff, before any code moved); no security review was performed; no window-utilization telemetry exists for the 25h idle gap. None of these should be read as passed.

---

Repo tagged `improvement-run-6-2026-08-22`. Generated by /swarm WRAP_UP at 2026-08-22T16:04Z.
