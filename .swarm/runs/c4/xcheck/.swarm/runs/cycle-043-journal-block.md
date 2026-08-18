
## cycle 43 — 2026-08-16T04:46:46+00:00 — aphorism-cli — POLISH

**work:** KI-5 root cause measured + WRAP_UP DISTILL candidate set pre-drafted — conductor-inline, ZERO AGENTS
**outcome:** 1 verified (two deliverables, no backlog item — see churn note)

**clock:** now 1786855606, stop_at 1786879464 (2026-08-16T11:24:24Z), ~6h37m remaining. Not
within the WRAP_UP threshold (stop_at − 900 = 1786878564).

**heartbeat/PID:** pid **792491**, captured via `pgrep -a -f claude` and picked by inspection:
`claude -p /swarm cycle --output-format json --permission-mode acceptEdits --add-dir /opt/targets/aphorism-cli`.
New PID this cycle (cycle 42 ran as 789209) — the pacer spawns a fresh session per cycle, as designed.

**budget probe:** `bin/swarm-budget.sh` REFUSED for the FORTY-SECOND consecutive cycle, attempted
rather than skipped per the standing cycle-14 rule, in both path forms per cycle 27. Refused
before the command started, so `probe_failures` stays 0. **This cycle stopped re-observing the
refusal and diagnosed it** — see below.

**control channel:** `bin/swarm-notify.sh poll` ran clean. `runs/control.json` has
`pending: []`, `applied: []`, no `inject` array. No commands received this run.

**gear:** 1, unchanged and structurally fixed. Fresh allocator read: `weekly_used_pct` 94.0
(unmoved), `week_elapsed_pct` 85.04 → **85.51**, `reserve_overall_pct` 23.67 → **23.3**,
`allow_overall_pct` **0**. guest clamps 1–3; the gear is pinned by the ALLOWANCE, not the
ceiling. Per L-032 no trend is claimed from the reserve drifting down — it is one reading.

---

### VERIFICATION EVIDENCE — KI-5 root cause (16/16, 7/7 predicted cells, 2 negative controls)

For 42 cycles KI-5 was a black-box observation: *the script is refused*. This cycle read the
permission source of truth, `/opt/swarm/.claude/settings.json`. `permissions.allow` contains
exactly **two** SWARM-script entries:

```
Bash(/Users/truman/Projects/SWARM/bin/swarm-notify.sh:*)   <- macOS path, ABSENT on this host
Bash(bin/swarm-notify.sh:*)                                <- relative form, the one that works
```

No entry for `swarm-budget.sh` or `swarm-playbook.sh` in **any** path form; none for the VPS
prefix `/opt/swarm/bin`. **The settings file was never migrated from macOS to the VPS** — that
is the underlying cause of the whole KI-5 family.

The claim gated was not "the script is refused" (known 42 times over) but the stronger one:
*the allowlist contents PREDICT which invocations are permitted, including cells never
previously measured.* Harness `.swarm/runs/cycle-043-gate-ki5.js`, output
`.swarm/runs/cycle-043-verify-ki5.txt`.

```
PASS cell 1  predicted=DENY  observed=DENY  :: bin/swarm-budget.sh
PASS cell 2  predicted=DENY  observed=DENY  :: /opt/swarm/bin/swarm-budget.sh
PASS cell 3  predicted=DENY  observed=DENY  :: /opt/swarm/bin/swarm-notify.sh poll   [NEW]
PASS cell 4  predicted=ALLOW observed=ALLOW :: bin/swarm-notify.sh poll
PASS cell 5  predicted=DENY  observed=DENY  :: bin/swarm-playbook.sh parse           [NEW]
PASS cell 6  predicted=DENY  observed=DENY  :: awk ... (NEG CONTROL — absent)
PASS cell 7  predicted=ALLOW observed=ALLOW :: pgrep -a -f claude (NEG CONTROL — present)
--- 7/7 cells predicted correctly ---
PASS S1..S7 structural claims (2 entries; one macOS; that path absent; no budget entry;
            no playbook entry; no /opt/swarm/bin prefix; additionalDirectories EMPTY)
PASS S8 CONSEQUENCE: WRAP_UP `bin/swarm-playbook.sh append ...` predicted DENY
PASS S9 CONSEQUENCE: WRAP_UP `bin/swarm-notify.sh send wrap-up ...` predicted ALLOW
--- 9/9 structural claims hold ---
GATE GREEN
```

**The discriminator is cell 3 against cell 4.** They hold the script AND the arguments constant
(`swarm-notify.sh poll`) and vary ONLY the path form — and they come out **opposite**. A
"the script isn't allowlisted" theory predicts those two cells alike. The allowlist predicts
them opposite. That is the observation a wrong theory could not have produced, and it is why
this is a root cause rather than a restatement.

**Two operational consequences, derived from the allowlist rather than executed** (labelled as
derivation, not as measurement — S9 was deliberately NOT tested, because testing it means
pushing to the user's phone at 05:00):

- **S8** — WRAP_UP's `bin/swarm-playbook.sh append` **will** refuse. The manual fallback is
  confirmed necessary rather than assumed, which is what licensed this cycle's second deliverable.
- **S9** — `bin/swarm-notify.sh send wrap-up ...` (relative, cwd `/opt/swarm`) **will** be
  permitted. The wrap-up push can go out. Previously unknown and assumed dead.

**Scope discipline — what this does NOT establish.** The predictor models one rule (leading
token matches a `Bash(X:*)` entry) and was scored only on SIMPLE commands. The transcript
contains behaviour it does not model: `cd /opt/swarm` ran clean with no `cd` entry, while the
same `cd` inside a compound was flagged. The harness clearly decomposes compounds and treats
some builtins specially; that layer is **not** characterised, and two compound cells were
EXCLUDED from the gate rather than counted as passes. Both decision-relevant conclusions
(S8, S9) concern simple commands.

**NOT FIXED, deliberately.** Hard rule 5 makes `settings.json` read-only until WRAP_UP
completes; tool bugs found mid-run go to the journal and the morning report, never to a live
edit. The repair is two added lines and belongs to a human between runs.

---

### VERIFICATION EVIDENCE — DISTILL candidate set (13/13, 2 negative controls)

S8 confirmed the manual fallback is required, so the candidate set was drafted NOW rather than
under the WRAP_UP clock — a fallback drafted in a hurry is a fallback drafted badly. Written to
`/opt/swarm/runs/wrapup-candidates.md` (inside `runs/`, permitted by hard rule 5). Sourced from
RETRO.md § Config recommendations, semantically deduped against all 31 lessons on file.

The failure mode that matters is not "is the advice good" (unfalsifiable here) but "will these
parse, and will they collide" — both mechanically checkable against the live playbook, so both
were checked against it. Harness `.swarm/runs/cycle-043-gate-candidates.js`.

```
PASS P1 playbook exposes a next_id header                          37
PASS P2 every existing bullet parses under the derived grammar     31/31 parse
PASS P3 playbook lesson count is 31 (over the stated cap of 20)
PASS P4 existing ids are unique (the a49bafd repair held)          31 unique / 31
PASS C1 exactly 5 candidates drafted (WRAP_UP cap)
PASS C2 every candidate parses under the SAME grammar as the live file
PASS C3 ids start at next_id, consecutive   ["L-037".."L-041"]
PASS C4 NO candidate id collides with an existing lesson
PASS C5 every candidate sourced to THIS run  2026-08-15 aphorism-cli
PASS C6 every candidate carries a tag the playbook already uses    qa,process
PASS C7 every candidate shows its dedupe reasoning                 5 notes
PASS N1 NEG CONTROL — grammar rejects all 5 malformed bullets      all 5 rejected
PASS N2 NEG CONTROL — grammar still accepts a real existing bullet L-003
--- 13/13 checks passed ---   GATE GREEN
```

The grammar was derived FROM the live file rather than from memory, and N1/N2 are paired so
that N1 cannot pass by rejecting everything.

**Candidates:** L-037 [qa] extract doc-guard values from structure, never from prose position ·
L-038 [process] negative-control arm when the conductor authors both artifact and gate ·
L-039 [process] name an explicit in-target scratch path in every dispatch prompt ·
L-040 [process] seal pre-dispatch baselines by commit-reveal · L-041 [process] harnesses report
UNPARSEABLE rather than falling through to a verdict. Plus a recorded **confidence bump** for
existing L-033 (med → high), which is an edit to an existing lesson, not a sixth candidate.

Two dedupe calls are shown rather than asserted, because both are judgment: **L-037** overlaps
L-033's tail but keeps its own head (L-033 says when to stop hardening; L-037 says where the
guard should have anchored). **L-041** is the SAME FAMILY as L-010 (instrument silently converts
a failure into a pass) and says so in its own text, kept separate only because the actionable
mechanism differs; the cost of merging it away is named.

**A recommendation to the human is recorded WITH the candidates, and it is not to append them
yet.** The playbook is at 31 lessons against a cap of 20 — a pre-existing breach the previous
run already handed to a human (commit a49bafd). Appending these makes it 36. The documented
manual fallback says to apply the cap by dropping oldest non-high-confidence lessons, which
here means **hand-deleting 16 lessons** from a shared file whose overflow policy is explicitly
already someone else's open question. The conductor is not taking that action: it is
destructive, not reversible from this run's artifacts, and not its call. The lessons are
drafted and preserved; the append is deferred with the cap decision. No lesson is lost either
way, which is the requirement the fallback exists to satisfy.

---

### VERIFICATION EVIDENCE — full suite, run by the conductor

```
ℹ tests 80
ℹ suites 0
ℹ pass 80
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

80/80, matching RETRO.md's C1 literal. No product code changed this cycle; run because step 6
requires the conductor to run `test_cmd` itself, not because a change invited it.

**wave autotune:** NOT applied; `k_current` 5, `wave_streak` 0. Fifth consecutive zero-agent
cycle; a cycle that dispatched nothing measures nothing about code capacity.

**churn:** `consecutive_no_value` stays 0 — eleventh consecutive verified-value cycle, on the
same honest label cycle 42 used: **verified-value-with-no-item-landed**. No backlog item landed
and none could; all six remaining todos need a builder and the allowance is 0.

**not run, reported as not-run:** design-panel, review-fix (judged and declined cycle 14),
qa-verify look (N/A — CLI), collision-scan (N/A — no browser surface), budget probe (refused,
KI-5 — now root-caused), playbook `parse`/`record-applied`/`append` (refused, KI-5), the S9
push (derived, deliberately not executed).

### filed this cycle

- No new KI. **KI-5 updated** with `note_cycle_43` carrying the measured root cause, the
  discriminator, both consequences, and the two-independent-reasons finding: the playbook is
  inert because of the cap breach AND the allowlist gap, so **fixing either alone leaves it
  inert**.

```runfile-mirror
{"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","model_policy":"value-routing","auth_mode":"subscription","pacing":{"mode":"guest","dial":0.3},"targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"cycles_since_recycle":17,"budget":{"gear":1,"k_cap":1,"mode":"guest","source":"allocator","posture":"trickle (allowance structurally 0 -- re-read cycle 43)","promote":false,"demote":true,"probe_failures":0,"allow_overall_pct":0,"reserve_overall_pct":23.3,"weekly":{"ok":true,"weekly_used_pct":94.0,"opus_used_pct":97,"week_elapsed_pct":85.51,"ceiling":3,"promote_blocked":false}},"heartbeat":{"ts":1786855606,"pid":792491,"limp":false},"watchdog":{"mode":"normal","plist_loaded":true},"caffeinate_pid":0,"wrap_up_complete":false}
```
