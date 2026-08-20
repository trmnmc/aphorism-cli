
---

# cycle 11 — 2026-08-20T06:13Z → 06:4xZ — **the DONE decision and WRAP_UP**

    date +%s -> 1787206415 | stop_at 1787276706 | 70291s (~19.5h) remaining
    target /opt/targets/aphorism-cli | phase BUILD -> DONE | work: DONE decision + WRAP_UP
    outcome: VERIFIED — run closed with ~19.4h of clock returned unspent

## Clock, gear, control

    probe OK: gear 1 (target 1), rho 3.92 — down from 9.79 because the USAGE WINDOW RESET
      (window_tokens 96,190,726 -> 6,549,992). ELEVENTH consecutive crawl even so: rho fell
      but not below 2.0, and the weekly governor still clamps the ceiling to 2.
    weekly governor HOT: weekly 100% / opus 100% at week 43.59% elapsed, heat 2.29,
      ceiling 2, promote blocked. k_cap 1, demote true.
    burn 6,549,992 tok @ 27,609,849 tok/h | control: poll clean, pending [] applied []
      inject [] — nothing to triage. cycles_since_recycle 9 -> 10 (below the 25 threshold).

## The decision: DONE, not a manufactured POLISH item

Cycle 10 recorded that RF-5 was the last implementable item in the queue. That is a claim
about the past, and this cycle's job was to test it against the tree rather than inherit it.

**The gate stage that had not run was POLISH** (review-fix landed c6, QA-full c7, TASTE c9),
so the phase gates said POLISH before VALUE_LOOP. I went looking for polish fodder before
concluding there was none, and the search is the evidence for the decision:

- **Backlog polish items** — TS-1, TS-2, TS-3, TS-6 are all `blocked`, every one of them on
  a human lifting a SPEC-locked non-goal. None is engineering-blocked.
- **README user-facing prose** — genuinely degraded (the Tag vocabulary section states one
  number three ways: "12 tags appear on 2 or more entries… 0 tags appear exactly once,
  which is to say 0 tags sit on exactly one entry"). But `test/readme-tags.test.js` pins
  that prose with three live regex guards (`(\d+) distinct tags`, `(\d+) tags appear
  exactly once`, and a tag-word/entry-word/single-entry-marker co-occurrence check). The
  prose reads that way *because* the guards shaped it. Rewriting it under a haiku polish
  agent means fighting the guards this run exists to keep honest, and KI-12 already records
  that the co-occurrence guard is satisfiable by a README that does not acknowledge
  anything. Declined.
- **TS-6's documentary half** — the most user-noticeable candidate available, and the one I
  spent longest on. TS-6's own acceptance clause explicitly carves it out as in scope:
  "README and `--help` may list the twelve tag names inline". **README already does it** —
  the Tag vocabulary section lists all 12 tags with counts in two tables. So the only
  remaining half is `--help`, and `--help` output is *shipped program output*, which P-5's
  acceptance forbids changing ("no new user-visible flag or behaviour"). Unblocking it by
  leaning on a permissive sentence in a blocked item's notes would be **opening the gate by
  weakening it**, in scope terms rather than test terms. Declined, and TS-6 stays blocked on
  the human.

That exhausts POLISH. The ratchet — *would the target user notice, and would they still
care ten minutes later?* — is passed only by things this run's brief locks: no-repeat
rotation, corpus expansion, a `--tags` flag. SPEC.md pre-authorises the disposition in
"Expected shape of this run": **"An early finish is the honest outcome here, not a
failure."**

## VERIFICATION EVIDENCE — the closing gate, re-derived from the tree

Every cell below was run by the conductor against the shipped tree this cycle. None is
carried forward from a prior cycle's journal, and none is an agent's claim.

**Suite, full clone:**

    $ node --test test/*.test.js
    ℹ tests 121   ℹ pass 121   ℹ fail 0   ℹ skipped 0      (node v24.19.0)

Re-run a second time after the REPORT.md / report-history.md edits landed, identical
result — the doc move cannot reach the suite, but "cannot" is an argument and the re-run is
the observation.

**Actions matrix on the final code-bearing HEAD, read from GitHub, not from the journal:**

    $ gh run view 32338243331
    ✓ master test · 32338243331        (HEAD 9794dd9)
    ✓ test (18) 17s   ✓ test (20) 15s   ✓ test (22) 14s   ✓ test (24) 15s
    $ gh run view 32338243331 --log | grep -E "tests|pass|fail|skipped"
    test (18)  # tests 121   # pass 119   # fail 0   # skipped 2

The 2 skips are both arms of `test/node-support-citation.test.js` standing down on CI's
shallow checkout. That is the guard **refusing to pass on evidence it cannot read** — the
fail-closed direction L-041 names — and it is why the full-clone number (0 skipped) and the
CI number (2 skipped) differ without either being wrong.

**Corpus byte-identical, and zero dependencies:**

    $ git log -1 --format='%h %ci %s' -- src/corpus.js
    64a465f 2026-08-18 06:49:05 +0000 cycle 7: Q-1 stdout write-error handling + Q-2 corpus accent
    $ ls package.json node_modules
    ls: cannot access 'package.json': No such file or directory
    ls: cannot access 'node_modules': No such file or directory

`src/corpus.js` last moved during run #4, two days before this run's kickoff — so
"byte-identical across run #5" is settled by the commit date, not by a diff I chose the
base for. Zero dependencies holds **by construction**: there is no manifest to add one to.

**Working tree and branches at close:**

    $ git status --porcelain     (empty)
    $ git branch -a
    * master
      remotes/origin/master

No unmerged in-flight branches to list in the report — WRAP_UP step 1 has nothing to leave
behind.

P-5 therefore closes on its acceptance, with its recorded exception intact and
**not re-labelled**: commits `5f833ab` (c5), `c08562b` (c6) and `2b003ea` (c10) were each
knowingly red on a full clone between push and re-citation, for the structural reason filed
as P-7.

## The playbook distillation, and a denial

`bin/swarm-playbook.sh append` was invoked under its exact absolute-path form and was
**DENIED** — denial **#31**, the 7th consecutive occurrence, and still the one genuine
structural allowlist gap this fleet has. cycle.md's WRAP_UP fallback applied: manual append
in the v2 grammar with ids from the `next_id` header.

Distilled 5 candidates → **4 merged semantically, 1 minted**:

- **L-047 MINTED** — when a sealed gate FAILS, attribute the failure to the INSTRUMENT or
  to the WORK before the verdict touches the item's `attempts` counter. Not merged into
  L-041 because L-041 covers the *under*-report direction; this is the *over*-report
  direction, with the opposite blast radius and the opposite remedy. The datum is this
  run's sharpest: **7 of 7 sealed-gate FAILs across c8 and c10 were defects in my own
  instrument; zero were defects in the dispatched work.**
- L-043 gained the unstable-SUBJECT clause (a guard bound to a git pathspec cannot be green
  on the commit that changes it) — observed 5→6.
- L-045 gained the converse-reading clause (satisfied spec + brief-locked backlog = DONE,
  escalate once) — observed 4→5.
- L-039 gained the every-path-FORM diagnostic clause (the #32 → #31 correction) —
  observed 3→4.
- L-031 observed bump only (c0 inferred 12-of-14; c1 measured 1-of-7, added zero tests) —
  observed 1→2.

Minting a 21st lesson into a file at its 20-lesson cap forced one overflow drop. **L-021
archived** to `learnings-archive-2026-08-20.md`. The cap rule leaves the tie-break open when
every lesson is high-confidence, so it is recorded rather than left implicit: ordered by
**most-recent observation date** (not first-source date, which would have dropped L-008 —
re-observed 2026-08-19 and applied by this very run), then lowest id. Full reasoning and its
cost in `DROP-RATIONALE-2026-08-20.md`, including the honest part: **the cap is now binding
hard enough that genuine lessons are traded against each other every run**, and two of the
last three wrap-ups minted zero specifically to dodge that trade. That is a signal for a
human, not something a run should keep absorbing.

## Nothing deleted to make room

Run #4's `REPORT.md` was moved **byte-for-byte** into `docs/report-history.md` before
REPORT.md was rewritten — SPEC.md non-goals forbid "deleting or rewriting any historical
claim, cycle citation, or dated row", and overwriting in place would have deleted run #4's
dated claims outright. The move was verified rather than assumed
(`.swarm/runs/run5-cycle-011-archive-report.mjs`):

    appended bytes:       14393
    source bytes:         13863
    tail === source:      true
    prior content intact: true
    VERDICT: PASS

## Standing situation, handed to the morning

Denial ledger closes at **31**. Backlog closes at **31 items — 22 done, 8 blocked, 1
declined, 0 todo**. 18 known issues open: 7 product/repo (KI-2 the only high one), 11 SWARM
tool gaps (KI-14, KI-16, KI-26 high) — all fenced read-only by hard rule 5 and reported,
never live-patched.

For the **third consecutive run**, the single highest-value change to this product —
no-repeat-until-exhausted rotation, now named independently by four taste judges — is locked
out by the brief rather than by any engineering obstacle. This run ran out of permitted work
with **80% of its clock unspent** and returned it rather than manufacturing churn, which is
exactly what the SPEC asked for. But three runs of housekeeping on a repo whose own
instruments keep pointing at the same unbuilt feature is a pattern, not a coincidence. The
report states the lever plainly: permit the rotation, or permit corpus expansion paired with
the attribution audit, or don't schedule the next run.

## runfile-mirror

    stop_at 1787276706 | usage_reset_at 1787276706 | mode guest dial 0.33 | auth subscription
    gear 1 (target 1, rho 3.92) | k_cap 1 | demote true | promote false
    weekly: used 100% / opus 100% at week 43.59% elapsed, heat 2.29, ceiling 2, promote_blocked
    targets: /opt/targets/aphorism-cli (DONE, weight 1) | rotation [0] cursor 0
    watchdog pacer, plist_loaded true | caffeinate_pid 0 (Linux) | cycles_since_recycle 10
    wrap_up_complete true | playbook auto: L-008 L-016 L-024 L-026 L-029 L-031 L-033 L-034
      L-038 L-042 L-043 L-044 L-046
