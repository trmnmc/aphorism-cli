#!/usr/bin/env python3
"""Cycle 10 journal block + runfile persist (step 7) and next_wakeup_at (step 9)."""
import json, os, time

T = "/opt/targets/aphorism-cli"
SW = "/opt/swarm"
JOURNAL = f"{T}/.swarm/journal.md"
RUNFILE = f"{SW}/runs/current.json"

now = int(time.time())
WAKE = now + 90          # base delay, value cycle; gears never touch the wakeup delay
STOP_AT = 1786879464
assert WAKE + 900 <= STOP_AT, "hard rule 8: wakeup must not run past stop_at"

evidence = open(f"{T}/.swarm/runs/cycle-010-verify-I-4b.txt").read()
excerpt = "\n".join(
    l for l in evidence.split("\n")
    if l.startswith(("PASS", "FAIL", "===")) and "INFORMATIONAL" not in l
)

block = f"""
## cycle {10} | {time.strftime('%Y-%m-%dT%H:%M:%S+00:00', time.gmtime(now))} | aphorism-cli | BUILD
work: I-4b, the risk-ranked corpus attribution triage. Why: gates 1 and 2 stay satisfied and
  must-have items remain todo, so step 4 gate 3 selects BUILD. I-4 was the pick cycle 9's handoff
  named, along with an explicit instruction not to drift into the choice between accepting it as
  an M-effort exception or decomposing it. Decomposed, per that preference -- but NOT by risk
  band, which is what "slice by risk" would naively mean and which is circular: the band
  assignment IS the deliverable. Split instead by KIND OF CLAIM, into I-4b (the ranked judgment
  artifact) and I-4a (a mechanical sweep for repo language that overclaims the corpus). Those two
  need genuinely different evidence, which is what makes the seam real rather than cosmetic.
gear: 1 (crawl), k_cap 1, demote true, promote blocked -- re-derived from runs/allocator.json,
  refreshed since cycle 9 (source=probe): posture trickle, allow_premium_pct 0, allow_overall_pct
  0, weekly_used_pct 82.0, opus_used_pct 96, week_elapsed_pct 76.69, dial 0.3. weekly_heat
  82.0/76.69 = 1.0692 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.69 = 1.2518 > 1.2
  -> promote blocked. trickle + guest 1-3 clamp -> gear 1. Structurally fixed for the rest of the
  run: week_resets_at 1786942799 falls after stop_at 1786879464.
routing: I-4b is kind qa, so gear 1's demotion rung does not reach it -- sonnet->haiku applies to
  docs/polish only, and this is neither. Ran on sonnet, undemoted, and the reasoning is recorded
  because it would have been easy to wave the deliverable's .md extension at the rule and cheapen
  a judgment task to haiku.
probe: bin/swarm-budget.sh invoked and REFUSED by the permission layer -- NINTH consecutive cycle,
  KI-5 unchanged. probe_failures stays 0: a command the harness never let start is not a probe
  that failed, and inflating it would trip the 3-strike back-off on evidence that does not exist.
control: bin/swarm-notify.sh poll REFUSED identically. Fell back to file-sourced state:
  runs/control.json has pending[] and applied[] both empty, no inject[] array. Nothing to apply,
  nothing to triage. Honest limitation restated: a command sent to the ntfy topic since cursor
  1786793064 would not have been seen this cycle.
orient: tree clean at open. Backlog at open: 11 done / 4 todo / 1 blocked.
re-anchor: cycle 10 IS a %5 cycle, so SPEC.md was re-read in full. I-1/I-2/I-3 are checked done;
  I-4, I-5, I-6 remain. Backlog hygiene: no duplicates, nothing stale enough to drop (T-005 and
  T-006 are both deliberately-held with recorded reasons, not rot), 18 live items against a ~30
  cap so the cap is not in play. Only change was reprioritising to the actual remaining order.
dispatch: ONE direct Agent call (sonnet, k=1), file scope EXACTLY docs/corpus-attribution-triage.md.
  Workflow stays unavailable in a -p session (review-gated), so the documented direct-Agent
  fallback applies; at k=1 there is no concurrency to isolate. Network use was explicitly
  FORBIDDEN in the prompt -- not merely absent. The whole value of this deliverable rests on it
  being honest that it stands on recall alone, and an agent that quietly searched would have
  produced a document that reads like partial verification while being nothing of the kind. The
  prompt also named an explicit scratch location (mktemp -d, absolute) -- the structural fix for
  the cycle-9 finding that session cwd IS /opt/swarm, so a relative scratch path lands inside the
  hard-rule-5 fence by default. Nothing was written outside the target this cycle.
pre-commitment: BEFORE dispatch, the conductor sealed its own independent risk ranking to
  .swarm/runs/cycle-010-precommit.md -- 5 Tier A entries, 8 Tier B, and the structural properties
  the deliverable would have to satisfy. The agent never saw it. This is the cycle's method
  contribution and it exists because a triage BREAKS the gate this run has used nine times: every
  previous item had a command whose exit code carried the claim, and a ranked list of 50 opinions
  about provenance has none. Reading it can only establish that it reads well, which is exactly
  what a confabulated document also does.
result (CLAIM): one file written, 50 entries, 8 HIGH / 16 MEDIUM / 26 LOW. Every field treated as
  a claim until the gate below.

VERIFICATION EVIDENCE (conductor harness .swarm/runs/cycle-010-verify-I-4b.js, authored WHILE the
agent was still running and never shown to it; full output .swarm/runs/cycle-010-verify-I-4b.txt):
```
{excerpt}
```
harness defect caught and fixed BEFORE the gate was read, same discipline as cycle 9: the first
  run reported 15 pass / 1 fail, and the failure was mine. `git status --porcelain` COLLAPSES a
  new untracked directory to a single "docs/" line and never names the file inside it, so the
  scope filter saw an entry it could not account for. Fixed by making the check STRICTLY MORE
  PRECISE rather than looser -- `-uall` enumerates every untracked file individually, which would
  also catch a second stray file dropped into docs/ that the collapsed form would have hidden
  inside the same line. The deliverable was never at fault; had I read the FAIL as the agent's, I
  would have sent back a clean document for rework.
gate: I-4b PASS -> done. What is actually proven, stated precisely. COVERAGE: all 50 entries once
  each, double-keyed to the corpus by author-verbatim AND text-prefix, so a shifted, invented, or
  hallucinated row cannot pass -- one key alone would not do this. NON-DEGENERACY: >=3 bands, no
  band over 60%, 7 distinct signals, 50 distinct non-boilerplate reasons; an all-MEDIUM document
  is the cheap way to fake this work and it is explicitly rejected. ANCHOR: the self-hedged
  Anonymous entry sits in the lowest band. Two NEGATIVE CONTROLS prove the checks can fail at all
  -- a corrupted table (row dropped + author swapped) is rejected, and the flat all-MEDIUM table
  fails non-degeneracy. A check incapable of failing is not evidence.
discriminator (the substantive one): the agent's HIGH band {{0,3,10,27,38,39,45,48}} contains 4 of
  the 5 sealed Tier A entries {{0,3,6,10,27}} -- and the sealed list could not have leaked, being
  on disk before the agent existed. Recorded because it cuts BOTH ways and that is the point: the
  agent independently surfaced four HIGH entries the conductor had not ranked high (#38 Wheeler,
  #39 Hopper, #45 Stroustrup, #48 Kay), and on inspection at least three are good catches -- #48
  in particular (Gabor's 1963 "Inventing the Future" predating Kay) is one the sealed list simply
  missed. The pre-commitment measured the conductor as much as the agent.
conductor error, recorded: the sealed Tier B list contained an off-by-one -- it named idx 39 as
  David Wheeler, but Wheeler is 38 and 39 is Grace Hopper. It affected only the informational Tier
  B tally printed by the harness, never the gate, whose Tier A indices were all correct. Noted
  rather than quietly corrected, because a pre-commitment whose errors get edited after the fact
  is not a pre-commitment.
conductor addendum appended to the deliverable, marked as separately authored: the FOUR places the
  two independent derivations disagreed, written as disagreements between two unverified opinions
  rather than as corrections -- neither party has a source. (1) Row #45 asserts a specific
  checkable fact about what Stroustrup's FAQ SAYS -- that he disclaims the foot-gun line -- and row
  #46 leans on the same asserted FAQ to affirm a different quote. My recollection is the opposite.
  It is the only row in the table making a claim about a primary source's contents rather than
  about the absence of one, which is a different epistemic class, so it was moved to the top of the
  human's queue precisely BECAUSE the two passes conflict. (2) #25 Postel is rated LOW but carries
  a paraphrase the table missed: the RFC reads "be conservative in what you DO ... accept FROM
  OTHERS", the corpus reads "what you send". (3) #6 Dijkstra sits on the HIGH/MEDIUM boundary --
  rated MEDIUM by the agent, HIGH by the sealed list. (4) The MEDIUM Dijkstra rows are likely
  cheaper to settle than "no-primary-source" implies, since the EWD archive is indexed.
why accept rather than send back: the disagreements are not defects the author could fix. Neither
  party has a source, so a revision round would have yielded a more CONFIDENT document resting on
  the identical basis -- the opposite of what this deliverable is for. Two independent passes
  disagreeing about what a primary source says IS the finding, and suppressing it to ship a
  cleaner-looking artifact was the available dishonest option.
corroboration outside the harness: full test_cmd run directly by the conductor,
  `node --test test/*.test.js` -> tests 59, pass 59, fail 0. Product tree byte-identical to HEAD
  across all 8 tracked source/test/doc files; `git status --porcelain -uall` shows exactly one new
  product-side path, docs/corpus-attribution-triage.md.
collision-scan: NOT RUN, and not applicable -- the standing browser gate covers targets built from
  classic non-module scripts served to a browser. aphorism-cli is a Node CLI with no browser
  surface. Reported as not-run rather than as passed.
autotune: NOT applied. I-4b is kind qa -- a judgment artifact, not build-class code -- so it is
  not a build-wave item under any dispatch mechanism. This is the cycle-9 rule applied as written
  (autotune keys on the ITEM KIND, not the dispatch mechanism), not a reversal of it: cycle 9's
  item was a test, which is build-class, and this one is not. k_current stays 5, wave_streak
  stays 1. Inert either way at gear 1.
KI-2: STILL OPEN, still high. The triage is what KI-2 asked for and does not resolve it -- nothing
  in the corpus was changed and nothing was confirmed. Eight HIGH entries are now a queue a human
  can actually work, which is the whole deliverable.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 12 done / 5 todo /
  1 blocked, 18 live. known_issues unchanged in count (KI-2 high, KI-5 medium open; KI-3, KI-4
  resolved).
outcome: 1 item verified. The last substantive unit of the run's original I-4 scope is half
  closed, with the judgment half done and the mechanical half scouted.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is absent
  in a -p session, which is not a publish failure.
next: cycle 11 picks I-4a, the overclaim sweep, and it is a REAL finding rather than paperwork:
  src/corpus.js's header comment claims "honest attribution" and says uncertain entries are hedged
  to Anonymous rather than guessing a famous name. I-4b measured that as false -- exactly ONE of
  50 entries is hedged to Anonymous while EIGHT carry HIGH-risk attributions to named people. So a
  product file currently makes a confidence claim its own triage contradicts. Conductor-executed
  (S-effort prose edit to a product file), gated by the cycle-8 method: byte-compare everything
  outside the edited comment against HEAD, so "zero behaviour change" is measured, not asserted.
  After that only I-5 (playbook repair, blocked in practice by the KI-5 allowlist gap, a
  conductor hand edit whenever taken) and I-6 (report refresh, runs at WRAP_UP by design) remain.
"""

with open(JOURNAL, "a") as f:
    f.write(block)

# ---------------- runfile ----------------
rf = json.load(open(RUNFILE))
rf["cycles_since_recycle"] = 9
rf["budget"]["last_probe_ts"] = now
rf["budget"]["probe_note"] = (
    "cycle 10: bin/swarm-budget.sh invoked and REFUSED by the permission layer, not by the script "
    "-- NINTH consecutive cycle, KI-5 unchanged. probe_failures stays 0: a command the harness "
    "never let start is not a probe that failed, and inflating it would trip the 3-strike back-off "
    "on evidence that does not exist. bin/swarm-notify.sh poll refused identically, so control was "
    "read from runs/control.json directly: pending[] and applied[] both empty, no inject[] array. "
    "Gear re-derived from runs/allocator.json (source=probe, refreshed since cycle 9): "
    "posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 82.0, "
    "opus_used_pct 96, week_elapsed_pct 76.69, dial 0.3. weekly_heat 82.0/76.69 = 1.0692 < 1.1 -> "
    "governor disengaged, ceiling 5. opus_heat 96/76.69 = 1.2518 > 1.2 -> promote blocked. "
    "trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structurally fixed for the run: "
    "week_resets_at 1786942799 falls after stop_at 1786879464."
)
rf["budget"]["weekly"] = {
    "ok": True, "weekly_used_pct": 82.0, "opus_used_pct": 96, "week_elapsed_pct": 76.69,
    "weekly_heat": 1.0692, "opus_heat": 1.2518, "ceiling": 5, "promote_blocked": True,
}
rf["heartbeat"]["ts"] = now
rf["heartbeat"]["next_wakeup_at"] = WAKE

tmp = RUNFILE + ".tmp"
with open(tmp, "w") as f:
    json.dump(rf, f, indent=2)
os.replace(tmp, RUNFILE)
with open(RUNFILE + ".bak", "w") as f:
    json.dump(rf, f, indent=2)

print(f"journal block appended; next_wakeup_at={WAKE} (+90s), stop_at={STOP_AT}")
