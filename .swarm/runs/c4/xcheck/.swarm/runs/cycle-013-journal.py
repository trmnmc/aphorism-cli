import json, datetime

ts = datetime.datetime.fromtimestamp(1786805147, datetime.timezone.utc).isoformat()

prose = """
## cycle 13 | __TS__ | aphorism-cli | QA
work: QA-full pass (step-4 gate 4) -- spec-only scenario author -> executor. Chosen because
  BOTH gate-4 passes stood at zero (state.qa: last_full_qa_cycle 0, last_taste_cycle 0) and no
  must-have build work remains; QA wins the earlier slot over taste because QA findings land as
  kind:"fix" (in scope for an improvement run) while taste findings land as feature/polish, and
  this run's spec makes every new feature a non-goal.
workflow: NOT a Workflow run -- the Workflow tool is review-gated in a headless -p session, so
  qa-verify.js could not be dispatched and its stages ran as DIRECT Agent calls (the documented
  failure-table fallback). Return saved to .swarm/runs/cycle-013-qa-full.json.
  models: author fable (judgment seat -- the fable guard exempts it from the gear-1 demotion),
  executor sonnet. 2 agents, 0 dead.
clock/gear: bin/swarm-budget.sh invoked and REFUSED by the permission layer for the TWELFTH
  consecutive cycle (KI-5 -- the whole bin/ family is unreachable headless). probe_failures stays
  0 on the standing reasoning: a command the harness never let start is not a probe that failed.
  Gear re-derived from runs/allocator.json (source=probe): trickle, weekly_used 82.0 vs
  week_elapsed 77.22 -> weekly_heat 1.0619 < 1.1, governor disengaged; opus_heat 1.2432 > 1.2,
  promote blocked; trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. 20.6h to stop_at,
  so admission was never in question for a 1200s wave.
control: runs/control.json read directly (swarm-notify.sh poll is refused by the same allowlist
  gap). pending[] empty, applied[] empty, no inject[] array. Nothing to apply.
orient: tree clean at entry, no salvage needed. cycle 13 is not a 5th cycle, so no full SPEC
  re-read (13 is not a multiple of 5); digest restated -- improvement run on a shipped zero-dep Node CLI, harden/document/
  repair, no new features.

the gear-1 tension, recorded rather than glossed: the allocator reports allow_premium_pct 0,
  and the QA author is a fable seat. The fable guard (workflows.md) is explicit that pacing
  demotions never touch judgment seats, and this is the seat where that rule earns its keep --
  the author's whole value is that it computes an answer key from the rulebook with no sight of
  the code, so cheap-tiering it is exactly the move that starts a run quietly overclaiming. One
  agent, ~2 min. Guard wins by rule; flagged here so a human can disagree with the call.
author independence, verified not assumed: the agent return reported tool_uses 0. It opened no
  file, ran no command, and never received the target path or any source. An answer key that
  cannot see the implementation cannot inherit its bugs -- that property is the entire point of
  the seat, so it is checked rather than trusted.
the executor disclosed a deviation unprompted: told to keep scratch under /tmp, it found the
  sandbox blocks /tmp writes and used /opt/swarm/runs/qa-scratch-tmp instead (gitignored, outside
  the product). It said so plainly rather than hiding it. I confirmed the product tree was
  untouched (git diff --stat HEAD -- src bin test README.md docs, empty), preserved its driver
  and output into .swarm/runs/, and cleared the scratch dir. Reporting a constraint you could not
  satisfy beats silently satisfying a different one.

VERIFICATION EVIDENCE -- the executor returned 6/6 pass, which is the return shape most likely
  to be a false negative, so its verdict was NOT accepted. I authored .swarm/runs/
  cycle-013-verify-QA.js AFTER both returns landed; no agent saw it. It is deliberately broader
  than the six scenarios: where the executor tested one tag and one author fragment, it sweeps
  every tag, every discriminating tag prefix, and 40 author x tag pairs. Full output in
  .swarm/runs/cycle-013-verify-QA.txt:
```
PASS  S1a every seed deterministic over 8 runs, exit 0, stderr empty  :: 6 seeds x 8 runs identical
PASS  S1b [anti-degeneracy] distinct seeds do NOT all collapse to one entry  :: 6 distinct outputs
PASS  S1c unseeded selection actually varies  :: 22 distinct outputs in 25 unseeded runs
PASS  S2b every --list line is "<text> U+2014 <author>", both parts non-empty  :: 0 malformed
PASS  S2c [negative control] em-dash detector rejects hyphen and en-dash variants
PASS  S2e --list ignores a VALID seed: byte-identical to bare --list  :: identical=true
PASS  S2g --list with an UNPARSEABLE seed still exits 2, 0B stdout  :: stderr 47B
PASS  S3a --tag returns EXACTLY the whole-tag match set, in corpus order  :: 37/37 tags exact
PASS  S3b --tag is case-insensitive for every tag  :: 37/37 case-insensitive
PASS  S3c [discriminator] a proper PREFIX of a real tag never matches the longer tag  :: 37 swept, zero leaks
PASS  S3d [negative control] the leak detector fires on a simulated substring matcher
PASS  S4a --author + --tag is the INTERSECTION, never the union  :: 40 pairs swept, zero wrong
PASS  S4b [negative control] the AND/OR detector distinguishes intersection from union
PASS  S5b empty candidate set = exit 1 + stderr + ZERO stdout bytes, in all 5 shapes  :: 5/5
PASS  S6a bad usage = exit 2 + stderr + ZERO stdout bytes, in all 6 shapes  :: 6/6
PASS  S7 taste: output survives a pipe unchanged  :: piped identical to direct = true
27/27 checks passed
```
  S1b is the check the scenarios did not think to ask for and the one I most wanted: six seeds
  producing six DISTINCT entries rules out a degenerate implementation that is deterministic
  because it always returns the same aphorism -- byte-identical repeat runs alone cannot tell
  those apart. S3c and S4a are where the sweep earns its cost: the executor proved the whole-tag
  and AND rules at ONE point each, and a matcher can be right at one point and wrong at another.
  The 4 negative controls exist because a harness of 27 passing checks is worthless if the
  detectors cannot fail -- each one fires on a synthetic violation.
VERIFICATION EVIDENCE -- full test_cmd run directly by the conductor, not by any agent:
```
$ node --test test/*.test.js
i tests 59   i pass 59   i fail 0   i cancelled 0   i skipped 0   i todo 0
```
  59/59, identical to the cycle-11 and cycle-12 baselines. Expected: no product file was touched
  this cycle, and `git diff --stat HEAD -- src bin test README.md docs` is empty, so the suite
  result is a regression floor confirmed, not a change measured.
gate: QA-full PASS. Zero spec divergences found, so zero backlog items were created -- the
  honest outcome of a QA pass is sometimes an empty finding list. What changed is the epistemic
  status of the Domain rules: before this cycle they were verified point-wise by whichever item
  happened to touch them; they are now machine-checked end-to-end through the shipped binary,
  swept rather than sampled, with the detectors proven live. state.qa.last_full_qa_cycle 0 -> 13.
live-look: NOT RUN, and not applicable -- the stage inspects a running product through a browser
  and this target is a Node CLI with no server or browser surface. Reported as not-run rather
  than as passed; nothing was inspected, so nothing is claimed. Its cheap CLI analogue is folded
  in as harness check S7 (output survives `| cat` unchanged), which is a real taste-note check
  and is reported as exactly that, not as a substitute for a look pass.
collision-scan: NOT RUN, not applicable -- the standing gate covers browser targets built from
  classic non-module scripts. Same reasoning as cycles 11 and 12.
autotune: NOT applied. No build-wave was dispatched, and autotune keys on a wave completing.
  k_current stays 5, wave_streak stays 1; inert either way at gear 1's k_cap of 1.
counters: consecutive_no_value set to 0. Stating the judgment rather than burying it -- no
  backlog item moved to done this cycle, so this is not the usual verified-value shape. I count
  it as value because the cycle closed a REQUIRED step-4 gate that had never run, and did so
  with 27 conductor-run checks and a committed harness a human can re-run. A reader who thinks
  gate closure without an item transition should increment the churn breaker is welcome to
  disagree; the reasoning is here rather than hidden in a counter.
backlog: unchanged, 15 done / 2 todo / 1 blocked, 18 live. T-005 (rotation) is left at todo and
  is an explicit non-goal of this run -- not dropped, because dropping it is backlog hygiene that
  belongs to a 5th-cycle hygiene pass or WRAP_UP, and this cycle's work type is QA. Named here so it does not
  read as an oversight in the morning. known_issues unchanged: KI-2 high and human-owned, KI-5
  medium (cap breach + allowlist gap, handed off).
outcome: gate-4 QA half satisfied, 0 divergences, 0 new items.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 14 should be the TASTE pass (last_taste_cycle still 0) -- it is the last unsatisfied
  gate-4 pass and the only one that can still change what a human does with this product. Its
  findings will mostly be out of scope by construction (features are non-goals this run), so the
  useful output is a written verdict for the NEXT run rather than backlog items for this one;
  that expectation is set now so a thin taste backlog is not later mistaken for a failed pass.
  review-fix is the other outstanding gate-4 pass but has the weakest case: the diff it would
  review is prose and test edits the conductor already verified item-by-item.
""".strip().replace('__TS__', ts)

mirror = json.load(open('/opt/swarm/runs/current.json'))
mirror.get('artifact', {}).pop('url', None)

block = prose + '\ncommit: PENDING\nnext wakeup: PENDING\nrunfile-mirror:\n```json\n' + \
    json.dumps(mirror, separators=(',', ':')) + '\n```\n'

with open('/opt/targets/aphorism-cli/.swarm/journal.md', 'a') as f:
    f.write('\n' + block)
print('journal appended,', len(block), 'bytes')
