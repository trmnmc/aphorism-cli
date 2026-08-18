# N-9 — KI-26 SETTLED: the watchdog's recovery path is structurally unreachable on an improvement run

Cycle 8, 2026-08-18. Conductor-measured, READ-ONLY on `SWARM/bin` per hard rule 5. **No drill
was run** — N-9's acceptance forbids staling this run's own heartbeat, and
`runs/incident-duplicate-conductor.md` records a stacked conductor having happened before.
The verdict below comes from the watchdog's own decision log plus its source, not from a
provoked failure.

## Verdict

KI-26 asked whether the watchdog actually RECOVERS or whether only its timer fires. The
answer is neither of the two states N-9 anticipated. It is not "recovery proven" and it is
not "recovery unproven". It is **recovery is unreachable, by construction, for the whole of
this run** — and the cause is identified exactly.

## Evidence 1 — the timer fires, and the watchdog runs, and it decides nothing

`runs/watchdog.log`, whole-history decision histogram:

```
    150 decision=all-done
     37 decision=run-complete
      5 decision=no-run
      3 decision=fresh
```

195 firings. **Zero `decision=relaunch`, ever.** The relaunch path has never once executed
in the log's entire recorded history — not in this run, not in any prior run. `grep -E
"relaunch|stale|kill|resume"` over the log returns nothing.

This is the distinction KI-26 turns on, now measured. The timer is not merely firing: the
watchdog script is really running and really writing a decision every 30 minutes. It is
reaching a decision and that decision is always "nothing to do".

## Evidence 2 — every firing of THIS run took the same exit

Run #3 kicked off at 03:48:36Z. Every subsequent firing:

```
2026-08-18T04:09:47+0000 decision=all-done detail=reports-present
2026-08-18T04:39:48+0000 decision=all-done detail=reports-present
2026-08-18T05:09:48+0000 decision=all-done detail=reports-present
2026-08-18T05:39:48+0000 decision=all-done detail=reports-present
2026-08-18T06:09:49+0000 decision=all-done detail=reports-present
2026-08-18T06:39:49+0000 decision=all-done detail=reports-present
```

Six consecutive firings, all `all-done / reports-present`, while the run was healthy and
actively working. Note the transition: 02:09–03:39 read `run-complete
wrap_up_complete=true` (still run #2's runfile); from 04:09 — the first firing after run
#3's kickoff replaced the runfile with `wrap_up_complete: false` — it falls through to the
REPORT.md check and exits there instead.

## Evidence 3 — the source says why, and the staleness gate is downstream

`SWARM/bin/swarm-watchdog.sh`, step 4, the DONE-guard:

```sh
275  if jq -e '.targets | type == "array" and length > 0' "$RUNFILE" >/dev/null 2>&1; then
276      ALL_REPORTS=1
277      while IFS= read -r tpath; do
278          [ -n "$tpath" ] || continue
279          [ -f "$tpath/REPORT.md" ] || { ALL_REPORTS=0; break; }
280      done < <(rf '.targets[]?.path // empty')
281      if [ "$ALL_REPORTS" = "1" ]; then
282          log_decision "all-done" "reports-present"
283          exit 0
284      fi
285  fi
```

`exit 0`, unconditional on the file's mere existence. The staleness gate that decides
whether the conductor has died is **step 6, at line 340**. Step 4 exits 55 lines before it.
So for this run the staleness gate is not "passing" — it is never evaluated at all. The
kill-and-relaunch machinery below it (steps 7 and 8) is dead code for the run's entire
duration.

The block's own header comment shows this is deliberate, and shows the case it was designed
for:

```
265  # 4. DONE-guard: wrap_up_complete flag OR REPORT.md existing in EVERY target — NEVER on
266  #    raw statuses (cycle.md WRAP_UP step 6, state-spec). The file check is UNCONDITIONAL:
267  #    a stop_at-triggered WRAP_UP that dies after writing reports but before setting the
268  #    flag leaves statuses "active" + reports present, and must still read as done.
```

The check is a safety net for a run that died *after* writing its reports. It is correct for
that case. It was written on the unstated assumption that `REPORT.md` can only exist because
*this* run produced it.

## Root cause

**An improvement run breaks that assumption on contact.** Run #3 is an improvement run on a
repo SWARM already built and already shipped (SKILL.md guard 1d: "the existing repo is the
point"). `/opt/targets/aphorism-cli/REPORT.md` — 106 KB — was written by run #1 and refreshed
by run #2, long before this run existed. It was on disk at 03:48:36Z when run #3 started.

The 04:09:47Z log line is itself the proof that it predates this run's own report work: that
firing read `reports-present` a full 99 minutes before cycle 5 (05:48:19Z, commit `318b225`)
next touched the file.

So the DONE-guard's safety net, intended to catch the last five minutes of a dying run, fires
on the first firing of an improvement run and stays latched for every firing thereafter.
**Every improvement run SWARM has ever done, or will do, has run with no watchdog recovery.**

## Blast radius, stated honestly

- This does **not** affect the run's *pacing*: `swarm-pacer.timer` is a separate unit and is
  the thing that actually spawns cycles on the VPS. It fired 5 minutes ago and spawned this
  cycle. Cycles keep happening.
- What is lost is the *crash* path only: if this conductor session dies mid-cycle, nothing
  kills the orphan, nothing clears an abandoned `.git/index.lock`, and nothing relaunches
  `/swarm resume`. Recovery depends entirely on the pacer's next spawn, which does not do
  the PID identity-check, the git-lock cleanup, or the `relaunch_attempts` accounting.
- `watchdog.mode` is `normal` in this runfile, so the pacer-mode skip at line 344 is NOT a
  contributing factor here. The staleness gate is fully intact — it is simply never reached.
- The runfile's `plist_note` claim, written at kickoff, is now measurably too weak: it said
  the timer was "confirmed ACTIVE and firing" and flagged that this is "not the same signal
  as a recovering watchdog". That caution was right, and this finding converts it from a
  caveat into a measured defect.

## Hand-off — the patch, NOT applied

Per hard rule 5 this is journaled and reported, never live-patched mid-run. The fix belongs
to a human editing `SWARM/bin/swarm-watchdog.sh` between runs.

The DONE-guard must distinguish "a report this run wrote" from "a report that was already
there". The cheapest correct discriminator is the run's own start time, which the runfile
already carries — gate the file check on the report being newer than the run:

```sh
# line 279, replacing the bare existence test
[ -f "$tpath/REPORT.md" ] &&
  [ "$(stat -c %Y "$tpath/REPORT.md")" -ge "$RUN_STARTED_EPOCH" ] || { ALL_REPORTS=0; break; }
```

`RUN_STARTED_EPOCH` is derivable from the runfile; if no such field is guaranteed, the
target's `.swarm/state.json` carries `run_started_at` (`2026-08-18T03:48:36+00:00` here).

A human must decide one thing this finding cannot: whether an improvement run should instead
set an explicit `runfile.improvement_run: true` and have the DONE-guard skip the file check
outright. The mtime test is the smaller change; the explicit flag is the more honest one,
because the ambiguity is about the run's *kind*, not about the file's age. Owner: the human
maintaining `SWARM/bin`. Neither option is safe to apply mid-run.

## What this finding does NOT establish

The relaunch path is unreachable — that is measured. Whether the relaunch path would *work*
if it were reached remains **UNPROVEN**, and this cycle deliberately did not test it. Zero
relaunches in 195 firings means the code has never executed in production, so it carries the
usual risk of any never-run path. Fixing the DONE-guard would make recovery reachable; it
would not, by itself, make recovery proven. That second question needs a drill on a
throwaway target, which is a SMOKE-run job, not a live-run job.
