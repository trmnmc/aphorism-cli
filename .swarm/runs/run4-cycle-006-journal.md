
## cycle 6 — QA — Q-4: the notify helper was never denied, and the run reasoned from that for two cycles

work: conductor-inline measurement + forward reconciliation. No agent dispatch: this is a
measurement-and-document item, the reading run #3 cycles 1/11/12 took and run #3 cycle 13
distinguished from work whose whole point is multi-agent adjudication.
gear 2 (guest, weekly ceiling 2, rho=0.40, demote=true, promote=false), k_cap 2.
clock: 20.9h to stop_at at cycle open — no time pressure on any decision below.

### WHY THIS AND NOT THE TWO OWED GATES

Cycle 5 handed forward a real question: QA full and TASTE are owed for run #4, but this run
shipped ZERO product code, so both would re-exercise a byte-identical CLI. It asked the next
cycle to decide their scope against that measurement rather than tick boxes.

That question is still open and is NOT answered this cycle. What displaced it: the first
command of this cycle's own step 1 was refused, and checking why turned up a claim the run
has been carrying in its bookkeeping for two cycles that is false.

### THE CLAIM UNDER TEST

    cycle 4 journal:   "swarm-notify.sh poll was DENIED by the harness allowlist (denial #32)"
    cycle 4 addendum:  "swarm-notify.sh send is denied too (denial #33)"
    cycle 4 addendum:  "every push this run has claimed to emit since the allowlist gap
                        opened has silently not been delivered"
    cycle 5 journal:   "swarm-notify.sh poll DENIED by the harness allowlist again (#34)"

The third sentence is the load-bearing one: cycle 4 derived a morning-report recommendation
from it (that the dashboard's meta line conflates `notify configured` with `notify
delivering`) and cycle 5 skipped the owed REVIEW -> QA push because of it.

### VERIFICATION EVIDENCE

`runs/notify.log` — on disk since kickoff, never read by cycles 4 or 5:

    2026-08-19T14:05:09+0000 poll ok init cursor=now
    2026-08-19T14:05:09+0000 poll ok merged=0
    2026-08-19T14:05:10+0000 send auto-kickoff ok
    2026-08-19T14:16:52+0000 send goodnight ok          <- inside run #4
    2026-08-19T14:28:42+0000 poll ok merged=0
    2026-08-19T14:45:13+0000 send phase-change ok       <- inside run #4, cycle 1
    2026-08-19T14:52:19+0000 poll ok merged=0
    2026-08-19T15:11:49+0000 poll ok merged=0
    ---- cycles 4 and 5: NO ENTRIES ----
    2026-08-19T17:13:30+0000 poll ok merged=0           <- this cycle
    2026-08-19T17:14:34+0000 poll ok merged=0
    2026-08-19T17:15:06+0000 send phase-change ok       <- the owed cycle-5 push, delivered

11 invocations, 11 `ok`, ZERO failures, all time. Cycle 4 wrote "every push ... has silently
not been delivered" at ~16:10, roughly 85 minutes after `send phase-change ok` at 14:45:13.

Sealed gate `run4-cycle-006-gate.mjs`, 11 PASS / 0 FAIL, five controls — three that must DIE
(C1 strip the allowlist entry, C2 drop the in-run sends, C3 inject a failure line) and two
that must stay GREEN (C4 a benign extra poll must not fire A3/A4; C5 an unrelated allowlist
entry must not fire A2). The must-stay-green pair is there because run #4 cycle 5 shipped a
control that went silent, and a check that dies on every edit is a snapshot test.

    PASS A1  swarm-notify.sh IS allowlisted, absolute form
             3 entries incl. Bash(/opt/swarm/bin/swarm-notify.sh:*)
    PASS A2  swarm-playbook.sh is NOT allowlisted in ANY form     entries=0
    PASS A3  >=1 SUCCESSFUL send DURING run #4     3/3 ok, first=14:16:52
    PASS A4  ZERO failure lines, all time          11 entries, 0 non-ok
    PASS A5  the cycle 4-5 window is a SILENT GAP  entries in window = 0
    PASS A6  the owed cycle-5 push was DELIVERED   17:15:06 send phase-change ok

test_cmd, run by the conductor:

    tests 118 / suites 0 / pass 118 / fail 0 / duration_ms 4943.625985

collision-scan: `applicable: false` — a CLI ships no classic browser scripts.

### THE DENIALS WERE REAL EVENTS. THE CAUSE ATTACHED TO THEM WAS WRONG.

Both halves matter and the distinction is the whole finding. A5 shows the cycle 4-5 window
contains no log entries at all: had the helper RUN and failed, it would have logged. The
harness refused above the script, so the refusal those cycles saw was genuine. What they got
wrong was the inference from it — "the script is not allowlisted" — when the script is
allowlisted and works.

Measured rule, on two independent scripts in two independent dimensions, so it is a rule and
not a quirk:

    /opt/swarm/bin/swarm-notify.sh poll          RAN (logged ok)
    /opt/swarm/bin/swarm-notify.sh send ...      RAN (logged ok)
    /opt/swarm/bin/swarm-budget.sh               RAN (gear 2, rho 0.40, probe_ok true)
    SWARM/bin/swarm-notify.sh poll               DENIED
    SWARM/bin/swarm-budget.sh                    DENIED
    FOO=1 /opt/swarm/bin/swarm-notify.sh poll    DENIED
    RUNFILE=... /opt/swarm/bin/swarm-budget.sh   DENIED
    /opt/swarm/bin/swarm-playbook.sh parse       DENIED  (no entry, any form — REAL gap)
    bin/swarm-notify.sh poll                     exit 127, ENOENT (cwd is the TARGET dir)

Three causes, none of them "the helper is denied":

1. **The documented form is not a runnable form.** `reference/cycle.md` writes
   `SWARM/bin/swarm-notify.sh poll`, where `SWARM` is defined in SKILL.md as a *variable*
   for the repo root. The allowlist matches literal command prefixes. A conductor that
   substitutes gets a working command; one that pastes the documented string gets a denial
   that is indistinguishable, at the call site, from a missing allowlist entry.
2. **An env-var prefix defeats the prefix match.** `RUNFILE=x /opt/swarm/bin/swarm-budget.sh`
   is denied while the bare path runs — and cycle.md step 1 prescribes exactly the prefixed
   form. Harmless here only because the script defaults `RUNFILE` to the same file
   (`swarm-budget.sh:36`) and guest mode forces the dial regardless (`:82`), so the bare
   invocation is equivalent for this run. That is luck, not design.
3. **The allowlisted relative form is unreachable.** `Bash(bin/swarm-notify.sh:*)` IS in
   `allow[]`, but headless pacer-spawned cycles run with `cwd = /opt/targets/aphorism-cli`,
   so it exits 127. Filed as KI-37.

### WHAT THIS DOES AND DOES NOT OVERTURN

**M-3 STANDS, unchanged.** M-3 is scoped precisely to `swarm-playbook.sh`, A2 re-confirms it
has no allowlist entry in any form, and this cycle re-executed the denial. The must-have's
"else" branch — denial recorded, exact patch handed off — remains correctly closed. The
run #4 kickoff had already corrected the SWARM handoff document (SWARM `df1d120`) and its
finding was right: the guard on `.claude/` is structural and human-only. Nothing here
loosens that.

**Denial #32, #33, #34 are re-labelled, not deleted.** They happened. They are not instances
of the playbook allowlist gap that M-3 tracks, so the running count overstates that gap's
evidence by three. Recorded here rather than by editing cycles 4 and 5 — the journal is
append-only and cycle 5 set this precedent reconciling KI-36 forward.

**Cycle 4's morning-report recommendation survives its false premise, downgraded.** It argued
the dashboard meta line should distinguish `notify configured` from `notify delivering`. The
premise (nothing was delivering) was false, so the line was accurate, not misleading. The
suggestion still has independent merit — a configured-but-failing channel would render
identically — but it is a hardening idea, not evidence of an active defect, and it is
reported that way rather than dropped.

### THE CLASS, WHICH IS WHY THIS WAS WORTH A CYCLE

This run has an elaborate, genuinely good discipline for POSITIVE claims: seal the gate
before dispatch, baseline it for discrimination, paste real output, never accept an agent's
self-report. Nine measured instances of documents decaying are recorded in this journal.

It applied none of that to a NEGATIVE claim. "I could not run X" was taken as self-evidently
true three times running, because the harness said no — and nobody asked whether the refusal
was about X or about how X was spelled. The refuting evidence was one `tail` away in a log
the pipeline writes itself.

That asymmetry is the transferable lesson, and it is sharper than the nine document-decay
findings: a false negative claim is *load-bearing in the same way* a false positive is.
Cycle 5 skipped a real user-facing notification because of it, and cycle 4 shipped a
recommendation built on it.

### THE OWED PUSH WENT OUT

`send phase-change "swarm: aphorism-cli → QA" "cycle 5 (owed push, delayed one cycle by a
misdiagnosed denial)"` — logged `ok` at 17:15:06. Cycle 5's REVIEW -> QA transition is now
actually on the user's phone, one cycle late, with the reason stated in the payload.

verdicts: Q-4 MEASURED AND REPAIRED (conductor-verified, 11P/0F with 5 controls). M-3
  re-tested and STANDS. KI-37 FILED.
wave autotune: not applicable — no build wave. `k_current` stays 3, `wave_streak` stays 1;
  the gear-2 cap of 2 still binds.
sole committer: honored — no agents ran this cycle.
backlog: unchanged at 13 (6 done, 0 todo, 6 blocked, 1 declined). Q-4 was measured and
  settled inside the cycle, so it is not a backlog item; its residual is KI-37, which is
  SWARM-side and human-only.
known issues: **KI-37 added** (medium) — the documented `SWARM/bin/<script>` invocation form
  matches no allowlist entry, and the form that does match is unreachable from a headless
  cycle's cwd. This will bite every future run and cannot be fixed from inside one
  (hard rule 5 fences `bin/` and `reference/`; `.claude/` is structurally unwritable).
control channel: `poll` RAN, twice, `merged=0`. `runs/control.json` — `pending: []`,
  `applied: []`, no `inject` array. Nothing to triage.
notifications: the owed cycle-5 phase-change push DELIVERED (above). No phase change this
  cycle — QA -> QA — so none is owed for cycle 6.
next: cycle 5's question is still the live one and is now unobstructed — QA full and TASTE
  are owed for run #4 against a product whose code has not changed since run #3 reviewed it
  clean. Decide their scope by cycle 5's own test (is there something genuinely unexamined?)
  and, if both come back as churn by that test, say so WITH the measurement and take the
  DONE decision with all three gates honestly accounted rather than three boxes ticked.
  One correction to carry into that decision: run #4's gate tally is not "review-fix paid,
  two owed" — it is that plus the fact that two of the run's last three cycles spent their
  value on instrument and bookkeeping defects rather than on the product.
commit: (this cycle)
runfile-mirror: written to runs/current.json and current.json.bak this cycle
