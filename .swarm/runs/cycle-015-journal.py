#!/usr/bin/env python3
"""Append the cycle-15 journal block, including the runfile mirror."""
import json

RF = "/opt/swarm/runs/current.json"
J = "/opt/targets/aphorism-cli/.swarm/journal.md"
rf = json.load(open(RF))
mirror = dict(rf)
mirror["artifact"] = {k: v for k, v in rf["artifact"].items() if k != "url"}

block = """
## cycle 15 -- 2026-08-15T15:28:37Z -- aphorism-cli -- POLISH

clock: now 1786807717, stop_at 1786894464 (2026-08-16T11:24:24Z) -- 24.06h of run clock left, so no
  WRAP_UP trigger and no S-effort-only clamp. Admission control: build-wave's 2700s worst case fits
  the window with ~23h of margin.
probe: bin/swarm-budget.sh REFUSED by the permission layer for the FOURTEENTH consecutive cycle
  (KI-5 -- the whole bin/ family is unreachable from a -p session). probe_failures stays 0 on the
  standing reasoning: a command the harness never let start is not a probe that failed. Gear
  re-derived by hand from runs/allocator.json (source=probe): posture trickle, allow_overall_pct 0,
  allow_premium_pct 0, weekly_used_pct 83, opus_used_pct 97, week_elapsed_pct 77.66, dial 0.3.
  weekly_heat 1.0688 < 1.1 -> governor disengaged, ceiling 5. opus_heat 1.249 > 1.2 -> promote
  blocked. trickle + guest 1-3 clamp -> GEAR 1, k_cap 1, demote true. Craft pack loaded clean via
  node bin/swarm-craft.mjs (degraded: []) -- node is allowlisted where the shell scripts are not.
orient: tree clean at HEAD f524273, no salvage needed. control.json pending[] and applied[] both
  empty, no inject[] array -- nothing to triage, no ack to send.
re-anchor: cycle 15 is a 5th cycle, so SPEC.md was re-read in full, not just digested. Definition of
  done for this run: I-1 closed with a failable attributable test; every I-2 test traced to a
  measured mutation survivor; I-3 divergences stated identically in SPEC and README; I-4 triage
  human-actionable and never dressed as an audit; I-5 within cap or archived with a reason; suite
  green throughout; ZERO new user-visible features.
pick: T-010 (S, docs, haiku) -- the only sensible gear-1 pick. Effective wave = min(k_current 5,
  gear cap 1) = 1, so one item. T-009 is the equal-priority sibling and was deliberately NOT paired:
  both touch README.md, so they are not pairwise-disjoint and could not share a wave regardless of
  k. Ordering between them is not arbitrary -- T-009 publishes the tag vocabulary, and T-007 would
  RETAG the corpus, so documenting the taxonomy before consolidating it would manufacture exactly
  the doc/behaviour divergence class this run exists to close. T-010 has no such coupling.
work type: build-wave.js via the Workflow tool (permitted for a second consecutive cycle).
tool note (hard rule 5 -- journaled, NOT fixed): polish-docs.js is the natural vehicle for a docs
  item and was REJECTED for it. Line 254 passes the harness's `isolation: "worktree"`, which
  reference/workflows.md line 94 records as the KI-1 defect: that option derives the worktree from
  the SESSION repo (/opt/swarm), never the target. build-wave.js was hardened against exactly this
  (its line 197 comment refuses the option outright and makes builders self-provision a
  target-derived worktree with a rev-parse assertion); polish-docs.js never received the same fix
  and has not run in this run. Dispatching it would have pointed a builder at a worktree of SWARM.
  workflows/ is READ-ONLY during a run, so this is reported for the morning, not patched.
dispatch: one builder, model haiku, effort small. Playbook builder line 1 ('the conductor is the
  SOLE committer') was staged verbatim into the item context WITH a conductor clarification, because
  taken literally it contradicts build-wave's own brief telling the builder to commit in its
  worktree; the clarification scopes it to the target's master branch and its remote. The other
  three staged builder lines (React hook mount tests, .env keys in beforeEach, persisted UI state)
  are INERT on a zero-dep Node CLI and were named as inert rather than silently dropped. craft.docs
  guidance was folded into the item context by hand: build-wave splices only craft.ui, and only for
  items flagged craft:"ui" -- README.md is not a UI path, so the flag was correctly withheld and the
  docs guidance would otherwise never have reached the agent.
DEVIATION (builder, caught at merge): the builder provisioned its worktree at
  /opt/swarm/wave-T-010-worktree -- a path INSIDE the SWARM fence -- instead of the mktemp dir its
  brief specifies. Checked before trusting or merging anything: `git rev-parse --git-common-dir`
  inside it returned /opt/targets/aphorism-cli/.git, so the worktree DERIVED correctly from the
  target and the branch is a real target branch; only its location was wrong. Merged on that
  evidence, then removed with `git worktree remove --force` + prune; `git -C /opt/swarm status
  --porcelain` is empty again. Had the derivation check failed, the branch would have been discarded
  unmerged.
merge: wave-000000-T-010 merged --no-ff into master, one file, +1/-0. No conflict, no revert.
gate: T-010 PASSES. Harness .swarm/runs/cycle-015-verify-T-010.js authored AT VERIFICATION TIME and
  never shown to the builder -- 19/19 including 4 negative controls (A2 unseeded runs really are
  unstable, so A1's stability result can discriminate; A8 an absent marker string is not found; C2
  the summary parser really can see a non-zero fail count; plus B4/B5 pinning the diff shape).
  The check that actually decides the item is A6/A7: the README line was extracted from the file and
  pasted verbatim into bash, and its output matched the today-seeded run byte for byte. That is a
  discriminator -- a plausible-but-wrong recipe (bad flag, wrong date format, shell-quoted so the
  substitution never happens) fails it, where reading the line would not.
HARNESS REPAIRS (stated plainly, because repairing a check mid-gate is the shape of gate-weakening):
  the first run was 14/2. Both failures were MY checks being wrong, and neither was the product's.
  (1) C1 parsed `^# pass N`; this Node emits `i pass N`, so it read undefined against a suite that
  is green -- confirmed by running test_cmd directly myself, 59 pass / 0 fail. Repaired to accept
  either marker AND to still require exit 0 plus a PARSED fail count of 0, so an unreadable summary
  now fails loudly instead of passing on exit code alone, and C2 was added to prove the parser can
  see a failure. (2) B2 compared the whole '## Flags' section, but the dispatch fenced the Flags
  TABLE, and the usage-examples fence sits under that same heading -- which is precisely where the
  acceptance asks the recipe to go. Repaired to B3 (table byte-identical) plus B4/B5 (the entire
  change is one added line and that line is the recipe). Both repairs make the gate STRICTER: 19
  assertions where there were 17, and nothing that was being asserted stopped being asserted.
VERIFICATION EVIDENCE -- conductor-run, full output at .swarm/runs/cycle-015-verify-T-010.txt:
```
PASS A1  --seed 20260815 is stable across 6 runs | distinct outputs: 1
PASS A2  negative control: unseeded runs are NOT stable (25 runs -> 19 distinct)
PASS A6  the README line, pasted verbatim into bash, exits 0 and prints an aphorism | exit 0
PASS A7  the pasted recipe output equals the today-seeded output (same recipe, same result)
PASS B3  the Flags table is byte-identical to pre-wave
PASS B4  README diff is exactly 1 insertion, 0 deletions | numstat: "1\\t0\\tREADME.md"
PASS B5  +node bin/aphorism.js --seed $(date +%Y%m%d)      # same aphorism all day; changes at local midnight
PASS C1  full suite green | exit 0 | pass 59 | fail 0
=== 19 passed, 0 failed ===
```
VERIFICATION EVIDENCE -- test_cmd run directly by the conductor, not by any agent:
```
$ node --test test/*.test.js
i tests 59   i pass 59   i fail 0   i cancelled 0   i skipped 0   i todo 0
```
  59/59, holding the cycle-11/12/13/14 baseline. This cycle touched only README.md, so the suite is
  a regression floor confirmed rather than a change measured.
RESIDUAL FOUND AND FILED, NOT ABSORBED (T-011): the gate measured something the item's own
  acceptance had glossed. Sweeping 365 consecutive date seeds against the shipped binary, 11 of 364
  consecutive-day pairs return the SAME aphorism (~3%) -- the seed changes at local midnight, but
  the selection it maps to does not always change with it. The acceptance I dispatched said 'changes
  tomorrow', which is itself that small overclaim, so the builder was working from a slightly
  wrong contract and still landed something defensible: 'same aphorism all day; changes at local
  midnight' makes the one claim that matters unambiguously right (LOCAL midnight, not UTC -- the
  honesty constraint the dispatch asked for), and carries no unhedged every-day-different promise,
  which is why A9 passes and this is not a gate failure. But read as 'the aphorism changes at local
  midnight' it is false about 11 days a year, and this run has spent cycles 7 and 11 closing
  doc/behaviour divergences and deleting overclaiming language -- prose the run ADDS gets the same
  standard. Filed as T-011 (S, docs, p5) with the measurement attached. Deliberately NOT fixed by
  the conductor inline: I authored the check that found it, and fixing it myself would be coding to
  my own gate.
autotune: the wave was CLEAN -- zero reverts, zero failed verifies -- so wave_streak 1 -> 2, which
  fires the bump; k_current is already at the hard max 5, so it stays 5 and the streak resets to 0.
  Inert in practice: gear 1's k_cap of 1 has bound the effective wave size every cycle regardless.
counters: consecutive_no_value stays 0, and this is the answer to the standard cycle 14 set for
  itself -- after two consecutive gate-closure cycles that moved no item to done, cycle 15 was
  required to LAND one or start incrementing the counter. It landed T-010, verified.
hygiene (5th-cycle backlog pass): 23 live items, under the ~30 cap, no duplicates found. T-005
  (rotation) moved todo -> dropped: the SPEC's Non-goals exclude every Nice-to-have for this run, so
  it is unpickable by construction and leaving it `todo` misreported it as available work on every
  board read. `dropped` never deletes -- and cycle 14's taste pass independently named no-repeat
  rotation as the structural fix for its top complaint, which makes it the strongest candidate for
  the NEXT run's spec. That is a scope statement, not a verdict on its worth.
backlog: 16 done / 5 todo / 1 dropped / 1 blocked, 23 live. known_issues unchanged: KI-2 high and
  human-owned (corpus attributions unaudited), KI-5 medium (playbook cap breach + the headless
  allowlist gap, handed off).
phase: QA -> POLISH. All three gate-4 passes are accounted for (QA-full cycle 13, taste cycle 14,
  review-fix judged and declined cycle 14), so the board is in polish/VALUE_LOOP. The phase-change
  notification could NOT be sent: bin/swarm-notify.sh is unreachable under the same KI-5 allowlist
  gap. Reported as not-sent, never as sent.
outcome: 1 item verified done (T-010), 1 residual filed (T-011), 1 stale item dropped (T-005).
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is absent
  in a -p session, which is not a publish failure.
next: cycle 16 should take T-009 (publish the tag vocabulary in README + --help, S, docs, haiku,
  gear-1 admissible) or T-011 (S, docs, one-line reword). T-009 carries the cycle-8 precedent: HELP
  lives inside src/args.js, so a prose edit there must be gated by byte-comparing everything outside
  the template literal against HEAD. Note the T-007 coupling recorded under `pick` above -- if
  T-007 is ever picked, it should land BEFORE T-009, not after.
runfile-mirror:
```json
__MIRROR__
```
commit: PENDING (recorded by the follow-up bookkeeping commit, as in cycles 10-14).
next wakeup: __WAKE__ (+90s -- base delay: this was a verified-value cycle, not a no-value one, and
  cycle.md step 9 applies no pacing multiplier, so gear 1 does not stretch it. Clamp checked:
  wakeup + 900 is far inside stop_at. Fired by swarm-pacer.timer, which reads
  heartbeat.next_wakeup_at)
"""
block = block.replace("__MIRROR__", json.dumps(mirror, ensure_ascii=False))
block = block.replace("__WAKE__", str(rf["heartbeat"]["next_wakeup_at"]))

with open(J, "a") as f:
    f.write(block)
print("journal appended, %d chars" % len(block))
