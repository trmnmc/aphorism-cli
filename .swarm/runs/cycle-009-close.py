note = """
### cycle 9 close — dashboard (step 8)

rendered runs/dashboard.html via runs/c9-dashboard.mjs. 53,973 -> 56,017 bytes.
Substitutions: status x2, bar x2, ticks x3, burn-up x2, journal x2, decisions x1, notify x3,
gen x1, next x1, evidence x3 (ALL blocks, KI-33 structure retained). **MISS count 0.**
**Live assertions 16/16 on the FIRST pass.**

KI-19 FIXED BY CONSTRUCTION THIS CYCLE, not by re-derivation after a miss. Cycle 8 ended by
  writing down the lesson: "every future harness must GREP the live page for the current stamp
  values instead of inheriting them from the previous cycle script." c9-dashboard.mjs does
  exactly that — it regex-extracts the live `gen`/`next` values at run time and fails hard
  (exit 2) if the anchors are absent. It printed `derived stamp anchors from live page: gen
  "2026-08-18T07:13:36+00:00" -> ..., next "2026-08-18T07:15:06+00:00" -> ...` and both
  substituted on the first attempt, where cycle 8 needed a second pass. Two new assertions
  ("no stale gen stamp left" / "no stale next stamp left") now make a silently-stale clock a
  FAILING render rather than a passing one. This is the first cycle since KI-19 was opened at
  run-1 cycle 51 where the stamps were right without a repair step.

BURN-UP RENDERED HONESTLY, INCLUDING THAT IT FELL. The strip is cumulative verified backlog
  items / current backlog total. This cycle completed NO backlog item — the taste pass is a
  gate, TS-4 is todo, TS-1..TS-3 are blocked — while filing 4 new ones. So the numerator
  stayed 15 and the denominator went 33 -> 37: 45% -> **41%**. The progress bar fell the same
  way, 88% -> 78%. Both were left falling and the tooltip says why ("a taste seat is supposed
  to enlarge the known work, not shrink it"). Rebasing the denominator to keep the bar rising
  would have been a render that lies.

notifications: none emitted, correctly. Phase did not change (VALUE_LOOP -> VALUE_LOOP), no
  target stalled, publish_failures still 0 — none of the three step-8 triggers fired.

artifact: skipped silently. The Artifact tool is not available in a headless pacer-spawned
  `-p` session; cycle.md step 8 says that is NOT a publish failure, so publish_failures stays
  0. On the VPS the dashboard.html write IS the publication (caddy serves it).

commit: b5b9d55 (target), pushed to origin/master a68e78d..b5b9d55.
"""

JR = '/opt/targets/aphorism-cli/.swarm/journal.md'
with open(JR, 'a') as f:
    f.write(note)
print('appended, journal bytes now:', __import__('os').path.getsize(JR))
