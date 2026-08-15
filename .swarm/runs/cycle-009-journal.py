import json
import os
import shutil

RUNFILE = '/opt/swarm/runs/current.json'
JOURNAL = '/opt/targets/aphorism-cli/.swarm/journal.md'

with open(RUNFILE) as f:
    rf = json.load(f)

rf['budget'].update({
    'source': 'allocator',
    'gear': 1,
    'gear_target': 1,
    'ratio': None,
    'mode': 'guest',
    'k_cap': 1,
    'promote': False,
    'demote': True,
    'last_probe_ts': rf['heartbeat']['ts'],
    'probe_failures': 0,
    'probe_note': (
        'cycle 9: bin/swarm-budget.sh was invoked again (RUNFILE=... bin/swarm-budget.sh) '
        'and REFUSED by the permission layer, not by the script -- EIGHTH consecutive cycle, '
        'KI-5 unchanged. probe_failures stays 0: a command the harness never let start is not '
        'a probe that failed, and inflating it would trip the 3-strike back-off on evidence '
        'that does not exist. bin/swarm-notify.sh poll refused identically (clean in cycle 6, '
        'refused 7/8/9), so control was read from runs/control.json directly: pending[] and '
        'applied[] both empty, no inject[] array. Gear re-derived from runs/allocator.json '
        '(source=probe, refreshed): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, '
        'weekly_used_pct 81.0, opus_used_pct 96, week_elapsed_pct 76.54, dial 0.3. weekly_heat '
        '81.0/76.54 = 1.0583 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.54 = '
        '1.2542 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote '
        'true. Structurally fixed for the run: week_resets_at 1786942799 falls after stop_at '
        '1786879464.'
    ),
    'weekly': {
        'ok': True,
        'weekly_used_pct': 81.0,
        'opus_used_pct': 96,
        'week_elapsed_pct': 76.54,
        'weekly_heat': 1.0583,
        'opus_heat': 1.2542,
        'ceiling': 5,
        'promote_blocked': True,
    },
})

tmp = RUNFILE + '.tmp'
with open(tmp, 'w') as f:
    json.dump(rf, f, indent=2, ensure_ascii=False)
os.replace(tmp, RUNFILE)
shutil.copyfile(RUNFILE, RUNFILE + '.bak')

mirror = json.dumps(rf, ensure_ascii=False, separators=(',', ':'))

BLOCK = """
## cycle 9 | 2026-08-15T13:35:00+00:00 | aphorism-cli | BUILD
work: I-8, hardening `--list --json` against mutant M16. Why: gates 1 and 2 remain satisfied
  and must-have items remain todo, so step 4 gate 3 selects BUILD. I-8 was the pick cycle 8's
  handoff named, and it survives re-examination: it is S-effort on sonnet, which is exactly
  what gear 1 permits ("S-effort sonnet builds only"), and it is the LAST open item in the I-2
  hardening thread. Its dependency cleared two cycles ago when I-3 wrote the NDJSON rule, which
  is the whole reason a test can be written now without freezing an implementation. The two
  alternatives were declined for the same reason as last cycle: I-4 is M-effort (the one item
  that does not fit gear 1) and I-5 is blocked in practice by the KI-5 allowlist gap.
clock: 1786800938 at open, stop_at 1786879464 -> 78526s (21.8h) remaining. Admission control:
  build-wave's 2700s worst case fits with ~21h of margin; no S-effort-only clamp in force.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct
  81.0, opus_used_pct 96, week_elapsed_pct 76.54, dial 0.30. weekly_heat 81.0/76.54 = 1.0583
  < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.54 = 1.2542 > 1.2 -> promote
  blocked. guest clamps 1-3, trickle posture -> gear 1. Effective wave size =
  min(k_current 5, gear cap 1, hard max 5) = 1. Routing: I-8 is kind `test`, i.e. build-class
  code, so the table lands it on sonnet (S/M-effort build/fix), and gear 1's demotion rung
  cannot touch it -- sonnet->haiku applies to docs/polish only, and build/fix never drops
  below sonnet. Unchanged for the rest of the run: week_resets_at 1786942799 > stop_at.
probe: bin/swarm-budget.sh invoked and REFUSED by the permission layer -- the refusal came from
  the harness, not the script. EIGHTH consecutive cycle (KI-5). probe_failures stays 0
  deliberately: a command never allowed to start is not a probe that failed.
control: bin/swarm-notify.sh poll REFUSED by the same layer (clean in cycle 6, refused 7/8/9) --
  the documented non-fatal failed poll. Fell back to file-sourced state: runs/control.json has
  pending[] empty, applied[] empty, no inject[] array. Nothing to apply, nothing to triage.
  Honest limitation restated: a command sent to the ntfy topic since cursor 1786793064 would
  not have been seen this cycle.
orient: tree clean at open. Backlog at open: 10 done / 5 todo / 1 blocked.
re-anchor: improvement run on a shipped zero-dep Node CLI -- harden, document, repair, NO new
  features. Cycle 9 is not a %5 cycle; the full SPEC re-read and backlog hygiene fall to
  cycle 10, next cycle.
dispatch: ONE direct Agent call (sonnet, k=1), file scope EXACTLY test/cli.test.js. Workflow
  stays unavailable in a -p session (review-gated), so the documented direct-Agent fallback
  applies; at k=1 there is no concurrency to isolate. The agent was given the exact M16
  mutation, the settled Domain rule, the twice-proven bar, and an explicit warning that
  assertions of the form "output is valid JSON" or "contains all entries" are satisfied by the
  M16 array and therefore worthless here. It was NOT given the verification harness. Playbook
  builder line appended: "the conductor is the SOLE committer". The other three staged builder
  lines (React hooks, .env in beforeEach, persisted UI state) are browser/React-specific and
  INERT for a Node CLI -- passed through unedited and labelled inapplicable rather than
  silently dropped, the same treatment the runfile's inert_note gives the qa lines.
result (CLAIM): status done, one test added, baseline 58 -> 59, with failable and attributable
  evidence described. Every field treated as a claim until the gate below.

VERIFICATION EVIDENCE (conductor harness .swarm/runs/cycle-009-verify-I-8.js, authored at
verification time and never shown to the builder; full output
.swarm/runs/cycle-009-verify-I-8.txt):
```
PASS  SCOPE: exactly one tracked file changed, and it is test/cli.test.js
PASS  SCOPE: bin/aphorism.js byte-identical to HEAD (1456 B HEAD vs 1456 B worktree)
PASS  BASELINE: HEAD (pre-cycle) suite is 58 tests / 58 pass / 0 fail
PASS  CURRENT: working tree suite is 59 tests / 59 pass / 0 fail
PASS  DENOMINATOR: skip pattern removes exactly 1 test (59 -> 58), suite still green
PASS  FAILABLE: M16 makes the suite fail (tests 59 pass 58 fail 1)
PASS  FAILABLE: the ONLY failing test is the one added this cycle
PASS  ATTRIBUTABLE (strict): M16 + new test filtered -> 58 tests / 58 pass / 0 fail
PASS  SKIP-SANITY: an unrelated mutation still fails under the same skip pattern
PASS  DISCRIMINATOR: new test also kills COMPACT single-line JSON array
PASS  DISCRIMINATOR: new test also kills REVERSED NDJSON order
PASS  DISCRIMINATOR: new test also kills TRUNCATED NDJSON (last entry dropped)
PASS  END-TO-END: 13 lines, 13 design entries, every line a standalone object, corpus order
=== 24 pass / 0 fail ===
```
harness defect caught and fixed BEFORE the gate was read, recorded because it is the exact
  shape of error that produces a false pass: the first run reported 13 pass / 11 fail, and
  every failure carried `tests null pass null fail null`. The cause was mine, not the
  builder's -- the parser assumed TAP (`# tests N`, `not ok N - name`) while Node 24 defaults
  to the `spec` reporter, whose summary lines are prefixed `ĩ` and whose failures read `x`. A
  regex matching nothing yields null, and null compares falsely against every expectation, so
  it rendered as FAIL. The direction of that failure was lucky, not principled: a null `fail`
  count in a differently-written assertion would have read as "no failures" and passed
  vacuously. Fixed twice over -- the harness now forces `--test-reporter=tap` for deterministic
  machine parsing, AND runSuite THROWS if no TAP summary is found rather than returning nulls
  for a caller to misread.
gate: I-8 PASS -> done. Proven twice per L-029. FAILABLE: M16 applied -> fail=1 and the only
  failing test is the new one. ATTRIBUTABLE (strict, per the cycle-5 decision): M16 applied
  with the new test filtered out -> tests 58 / pass 58 / fail 0, exactly the pre-cycle
  baseline -- which the harness RE-MEASURED from `git show HEAD:test/cli.test.js` rather than
  taking the number 58 from the builder or from last cycle's journal. Controls: DENOMINATOR
  (cycle-6 rule -- the pattern removes exactly 1 of 59 against pristine source, 58 green, so
  what was excluded is pinned), SKIP-SANITY (cycle-5 rule -- an unrelated mutation still fails
  under the same pattern, so the pattern is not silently emptying the run), and
  MUTATION-APPLIED on every scratch copy. That last control is the one that matters most here
  and is new this cycle: ATTRIBUTABLE is a PASS-shaped result, so a mutation that silently
  failed to apply would have produced a clean 58/58/0 and read as proof. Every mutation is now
  required to change file bytes, anchored on the literal shipped text of the `--list` branch,
  so a drifted source refuses the mutation instead of no-opping through it.
discriminators: three shapes a weaker assertion would have survived. COMPACT single-line JSON
  array (still valid JSON, still every entry, still in order -- kills any "it parses" test);
  REVERSED NDJSON order (correct shape and count, wrong order -- kills a shape-only test);
  TRUNCATED NDJSON with the last entry dropped (kills a count FLOOR, which is exactly the
  weakness cycle 4 measured in the pre-existing --list test). The new test is among the
  failures in all three. Recorded honestly: the REVERSED and TRUNCATED mutants ALSO trip the
  pre-existing M12/M13 --list tests (fail=2 and fail=3), which is the length/order overlap
  cycle 5 already documented, not a defect -- the claim under test is that the NEW test catches
  them, and it does. Only the M16 mutant isolates to the new test alone.
collision-scan: NOT RUN, and not applicable -- the standing browser gate (cycle.md step 6.6)
  covers targets built from classic non-module scripts served to a browser. aphorism-cli is a
  Node CLI with no browser surface and no user-visible web files were merged. Reported as
  not-run rather than as passed.
corroboration outside the harness: full test_cmd run directly by the conductor,
  `node --test test/*.test.js` -> tests 59, pass 59, fail 0, skipped 0.
  `git diff --name-only` = test/cli.test.js, one file.
hard rule 5 deviation by the subagent, caught and cleaned: the builder created its mutation
  scratch copies under /opt/swarm/.scratch/ -- a SWARM path outside the runs/ and playbook/
  write fence. It removed the copies itself; the conductor removed the leftover empty
  directory. Recorded as a DECISION because the prompt did not hand it a SWARM path (it was
  given target paths only, exactly as hard rule 5 requires) -- the agent reached one anyway,
  almost certainly because the session cwd IS /opt/swarm, so a relative scratch path lands
  inside the fence by default. That makes it structural rather than a prompt defect. No harm
  done: scratch copies of the target only, nothing under bin/, reference/, workflows/ or
  templates/ touched. Candidate lesson for the wrap-up distillation -- builder prompts should
  name an explicit scratch location outside the repo, because "do not write to SWARM" is not
  something an agent can honor if it does not know where it is standing. The conductor's own
  harness used os.tmpdir() and left nothing behind.
autotune: APPLIED this cycle, wave_streak 0 -> 1, k_current unchanged at 5 (the raise needs a
  streak of 2). This REVERSES cycle 8's stated reasoning and is recorded as a decision rather
  than done quietly. Cycle 8 skipped autotune on the ground that a direct Agent call is not a
  build-wave; on re-examination that argument was really about the ITEM KIND -- cycle 8's item
  was docs, which is not a build-wave item under any dispatch mechanism. This cycle's item is
  build-class code dispatched through the documented headless SUBSTITUTE for build-wave, and
  keying autotune on the dispatch mechanism would mean a headless run can never learn its wave
  size at all. INERT either way this run: effective size = min(5, gear cap 1) = 1, and gear 1
  is structurally fixed.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 11 done / 4 todo /
  1 blocked. known_issues unchanged (KI-2 high, KI-5 medium open; KI-3 and KI-4 resolved).
outcome: 1 item verified. Suite 59/59 green, product tree provably untouched. The I-2 hardening
  thread is COMPLETE -- every HOLE survivor from cycle 4's sweep is now closed, and M22 remains
  BOUNDARY and deliberately unhardened.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 10 is a %5 cycle, so it opens with a full SPEC.md re-read plus backlog hygiene
  (dedupe, drop stale, reprioritize, cap ~30 live items -- the backlog is at 16, so the cap is
  not in play). Work pick: I-4, the corpus attribution triage. It is now the last substantive
  item and the honest position is that it does NOT fit gear 1 cleanly -- it is M-effort on
  sonnet where gear 1's rule is S-effort sonnet builds only. Two exits, and the choice should
  be made explicitly rather than drifted into: either accept it as the run's one M-effort
  exception (defensible -- ~21h of clock remain, the item is the highest-value thing left, and
  the stress-test's demo-embarrassment lens ranked it above the test items), or decompose it
  into S-effort slices by risk band. Prefer the decomposition. I-5 (playbook repair) stays
  blocked in practice by the KI-5 allowlist gap and is a conductor-executed hand edit whenever
  it is taken; I-6 (report refresh) runs at WRAP_UP by design.
runfile-mirror:
```json
__MIRROR__
```
""".replace('__MIRROR__', mirror)

with open(JOURNAL, 'a') as f:
    f.write(BLOCK)

print('journal appended, mirror bytes:', len(mirror))
with open(RUNFILE) as f:
    json.load(f)
print('runfile parse OK')
