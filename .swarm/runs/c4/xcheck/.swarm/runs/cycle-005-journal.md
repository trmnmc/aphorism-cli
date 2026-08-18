
## cycle 5 | 2026-08-15T12:27:32+00:00 | aphorism-cli | BUILD
work: I-2b, the four CLI-level HOLE tests. Why: gates 1 and 2 remain satisfied and must-have
  items remain todo, so step 4 gate 3 selects BUILD. I-2b is the highest-priority unblocked
  item (p3; its only dep I-2a closed last cycle), it is S-effort, and it is test work rather
  than product code, which sits cleanly inside gear 1's work class.
clock: 1786796852 at open, stop_at 1786879464 -> 82612s (22.9h) remaining. Admission control:
  the build-wave 2700s worst case fits with enormous margin; no S-effort-only clamp needed.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct
  80.0, opus_used_pct 96, week_elapsed_pct 75.87. weekly_heat 80.0/75.87 = 1.0544 < 1.1 ->
  governor disengaged, ceiling 5. opus_heat 96/75.87 = 1.2653 > 1.2 -> promote blocked.
  guest clamps 1-3, trickle posture -> gear 1. Effective wave size = min(k_current 4, gear
  cap 1, hard max 5) = 1. No probe invoked, for the fourth cycle running:
  /opt/swarm/.claude/settings.json was re-read this cycle and its allow[] contains
  swarm-notify.sh twice and nothing else matching swarm-*.sh -- there is still no entry of any
  form for bin/swarm-budget.sh or bin/swarm-playbook.sh (KI-5). probe_failures stays 0: an
  attempt not made is not a failure.
control: bin/swarm-notify.sh poll ok (silent, exit clean); runs/control.json pending[] empty,
  applied[] empty, no inject[] array. Nothing to apply, nothing to triage.
orient: git status --porcelain clean at open (HEAD 6955c91).
re-anchor: cycle 5, so cycle % 5 == 0 -> FULL SPEC.md re-read performed (not just the digest)
  plus backlog hygiene. SPEC unchanged since kickoff; the six improvement must-haves I-1..I-6
  are all still covered by backlog items. Hygiene outcome: NO CHANGES. 14 live items is well
  under the ~30 cap, no duplicates, no stale entries, priorities coherent. T-005 (rotation)
  was re-examined for dropping -- it is a new feature and this run's non-goals forbid features
  -- and DELIBERATELY LEFT todo at p9: cycle 2's note on that item records that the kickoff
  taste judge scored use-twice 4/10 and named this exact deferral as the cause, so it is the
  first item a future feature-bearing run should pick. Dropping it would erase that finding to
  tidy a list. p9 already keeps it unreachable this run.
craft pack: node bin/swarm-craft.mjs ran clean, degraded: []. DEVIATION, recorded rather than
  hidden: it was run AFTER dispatch, not before as cycle.md step 5 requires. Consequence this
  cycle is nil -- I-2b touches one test file, produces no user-visible surface, and the item
  would not have carried craft: "ui" under the flagging rule -- but the ordering was wrong and
  the next build dispatch should run it first.

dispatch: DIRECT Agent call, sonnet, NOT Workflow -- the Workflow tool is review-gated in a
  headless -p session, so this is the documented failure-table fallback. k=1, so the
  disjoint-file-scope substitute for worktrees is trivially satisfied. Model derivation:
  routing table -> I-2b is kind test, effort S -> sonnet; attempts 0, no ladder escalation;
  gear-1 demote does not bite because the sonnet->haiku rung is gated to docs/polish items.
  Scope handed to the builder was ONE file, test/cli.test.js, with an explicit ban on editing
  src/, bin/, package.json, or any other test file, and an explicit instruction to report
  rather than fix any product bug it found. The four mutations were handed over verbatim from
  cycle-004-mutation-sweep.json (diff, rule, and observable difference each). The
  HOLE/BOUNDARY classification stayed with the conductor, as last cycle. Playbook builder
  prompt_lines applied verbatim, including the three React/UI-specific lines that are inert
  for a Node CLI -- staged faithfully per the standing inert_note rather than silently
  dropped. NO verify command was given to the builder (hard rule 2): it was told the goal
  (failable and attributable) and never how the gate would measure it.

agent return (CLAIM, not fact): four tests added, one per mutation, all corpus-derived rather
  than hardcoded; each proven failable and attributable; suite 52 -> 56; only test/cli.test.js
  modified. It also self-reported one methodological caveat unprompted -- that M12 and M13 are
  not fully independent because dropping the last --list entry also moves the last line -- and
  described isolating them by hand. That caveat turned out to be correct and is reproduced
  below by independent measurement.

VERIFICATION EVIDENCE (conductor-authored AT verification time, after the agent returned).
  Harness: .swarm/runs/cycle-005-verify-I-2b.py, written by the conductor this cycle, never
  seen by the builder. It re-derives all four mutations from the cycle-4 sweep record's own
  diffs, restores product files from `git show HEAD:<path>` between every step, and asserts a
  clean src/bin tree at the end. Full output: .swarm/runs/cycle-005-verify-I-2b.txt

```
PRISTINE          pass=56 fail=0  -> GREEN
SKIP-SANITY       ctrl mutation + all 4 new tests skipped: pass=48 fail=4 -> OK
M07  FAILABLE pass=55 fail=1 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED clean
M12  FAILABLE pass=54 fail=2 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED fail=1 (order test)
M13  FAILABLE pass=55 fail=1 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED clean
M14  FAILABLE pass=55 fail=1 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED clean
TREE AFTER HARNESS: M test/cli.test.js  (src/ and bin/ unmodified)
FINAL test_cmd (node --test test/*.test.js): pass=56 fail=0
GATE: PASS
```

  Reading the numbers, because the shape matters more than the verdict. ATTRIBUTABLE is the
  strict form: the mutation is applied AND all four new tests are skipped, and the suite must
  still be green. All four landed on exactly pass=52 fail=0 -- the pre-sweep baseline, to the
  test -- which says the mutation survives everything that existed before this cycle, so the
  kill is genuinely owed to work landed today and not to a pre-existing test that cycle 4's
  sweep mismeasured. Per-test isolation was ALSO run and is the weaker signal: M12 alone still
  shows fail=1 because dropping the last --list entry is length-changing and therefore trips
  the order test too. That is an expected overlap between two honest tests, not a failed
  attribution, and the strict form is what the gate rests on.
  SKIP-SANITY exists because ATTRIBUTABLE is a PASS-shaped result: if --test-skip-pattern had
  silently matched more than the four names, every ATTRIBUTABLE line would have read PASS
  vacuously. The control applies an obviously-breaking mutation (bare invocation returns exit
  3) with the same four names skipped and confirms the suite still fails, caught by
  pre-existing tests. Without that control the whole gate would be unfalsifiable.
  Independent read of the diff, separate from the harness: no existing test was weakened,
  deleted, or loosened; expected values are computed from require('../src/corpus.js') rather
  than hardcoded, so a corpus that grows will not produce a false alarm; no error-message
  wording is pinned anywhere.

gate: I-2b PASS -> done. test_cmd 56/56 on the real repo, up from 52/52, with zero product
  code changed.

OBSERVATION, filed rather than fixed: the M13 order test asserts full line equality,
  `${text} — ${author}`, which pins the --list LINE FORMAT. No Domain rule states that format
  -- the rules cover --list's completeness and its order, never its rendering. This is the
  same shape of gap as M16 from last cycle: a test now enforces something the spec does not
  promise. Appended to I-3's notes as measured evidence, since I-3 is the item that settles
  doc/behaviour divergences; it should either write the rule or loosen the assertion to
  order-only. Not fixed this cycle because rewriting the assertion is exactly the kind of
  churn the item exists to decide, and the gate does not fail on it -- the test is correct
  about today's behavior, just broader than the promise.
autotune: this was a build wave in substance (k=1, one dispatched item, one merge-equivalent
  landing) and it was CLEAN -- zero reverts, zero failed verifies -> wave_streak 0 -> 1.
  k_current stays 4; the streak must reach 2 to raise it. Still inert either way: effective
  size = min(k_current, gear cap 1) = 1 and gear 1 is structurally fixed for this run, since
  week_resets_at 1786942800 falls after stop_at 1786879464.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 7 done / 6 todo /
  1 blocked.
outcome: 1 item verified. Suite 52 -> 56 green.

dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 6 -- I-2c, the single parser-level HOLE (M21: parseArgs(['--seed','-5']) must
  yield seed === -5 with no error), as a k=1 sonnet build scoped to test/args.test.js only.
  One test, one mutation, same twice-proven requirement and the same strict-attribution gate,
  which the harness above already generalizes to. M22 must NOT be hardened -- it is the
  classified BOUNDARY. After I-2c the remaining must-have work is I-3 (doc divergences, now
  carrying the --list format finding above), I-4 (corpus triage), I-5 (playbook repair, still
  blocked in practice by the KI-5 allowlist gap), I-6 (report refresh at wrap-up).
