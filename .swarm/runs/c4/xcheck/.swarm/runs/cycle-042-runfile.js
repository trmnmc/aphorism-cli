const fs = require('fs');
const p = '/opt/swarm/runs/current.json';
const r = JSON.parse(fs.readFileSync(p, 'utf8'));
const alloc = JSON.parse(fs.readFileSync('/opt/swarm/runs/allocator.json', 'utf8'));
const now = Math.floor(Date.now() / 1000);
const STOP = 1786879464;
const DELAY = 1800;

r.cycles_since_recycle = 16;

r.budget.last_probe_ts = now;
r.budget.weekly = {
  ok: true,
  weekly_used_pct: alloc.weekly_used_pct,
  opus_used_pct: alloc.opus_used_pct,
  week_elapsed_pct: alloc.week_elapsed_pct,
  weekly_heat: +(alloc.weekly_used_pct / alloc.week_elapsed_pct).toFixed(4),
  opus_heat: +(alloc.opus_used_pct / alloc.week_elapsed_pct).toFixed(4),
  ceiling: 3,
  promote_blocked: false,
  governor_note: "cycle 42: weekly_heat 94/85.04 = 1.1054, back ABOVE the 1.1 threshold, so the governor RE-ENGAGES at ceiling 3 exactly one cycle after disengaging at 1.0993. Trajectory across four readings: 1.1115 (c39) -> 1.1060 (c40) -> 1.0993 (c41) -> 1.1054 (c42). Per L-032 no trend is claimed from this -- the direction reversed on the fourth point, which is precisely the case that lesson warns about. The structural fact that does not depend on direction: the ceiling has never been the binding constraint in this run and is not one now, because guest clamps reachable gears to 1-3 and the gear is pinned at 1 by the ALLOWANCE. opus_heat 1.1406, under 1.2, so promote_blocked stays false either way."
};
r.budget.posture = 'trickle (allowance structurally 0 -- RE-MEASURED cycle 42 on fresh inputs)';
r.budget.reserve_overall_pct = alloc.reserve_overall_pct;
r.budget.allow_overall_pct = alloc.allow_overall_pct;
r.budget.posture_note = "RE-MEASURED at cycle 42, not inherited from cycle 41. The inputs MOVED since that derivation (weekly_used_pct 93 -> 94, week_elapsed_pct 84.60 -> 85.04), so runs/cycle-041-allocmath.js was re-run live against a freshly-read runs/allocator.json rather than its result being carried forward. Outcome unchanged and now confirmed on two different input sets: human reserve 23.66 exceeds the weekly remainder of 100 - 94 = 6, so allow = max(0, 100 - 94 - 23.66) = 0 at now; at stop_at reserve 20.17 against the same 6, still 0. The floor (12) releases only within 6h of the week reset and hours_left at stop_at is 17.59h, so it never releases during this run. allow > 0 would need weekly_used_pct below 79.83% and weekly usage is monotonic within a week. TRANSCRIPTION CONTROL: reproduced reserve 23.66 vs allocator-reported 23.67. KI-14 NOTE: allocator.json flipped back to posture=trickle with swarm_used_pct 0 (cycle 39 recorded halted with 4) -- that is the rollover-jitter wipe, a SECOND observed occurrence, and it grants no spend because allow is already 0 on the reserve curve, which the wipe does not touch. KI-14 stays HIGH. Evidence: .swarm/runs/cycle-042-verify-retro.txt check C9.";
r.budget.probe_note = "cycle 42: bin/swarm-budget.sh REFUSED for the FORTY-FIRST consecutive cycle (KI-5), attempted rather than skipped per the standing cycle-14 rule, in both path forms per cycle 27. Refused before the command started, so probe_failures stays 0 on the standing reasoning. The cycle-35 path-form finding reproduces an EIGHTH time: relative bin/swarm-notify.sh poll (cwd=/opt/swarm) ran clean while both budget forms refused. Gear DERIVED FROM THE ALLOCATOR SCRIPT ITSELF and re-measured on fresh inputs; see posture_note.";
delete r.budget.probe_note_prev_cycle_40;

r.heartbeat.ts = now;
r.heartbeat.pid = 789209;
r.heartbeat.next_wakeup_at = now + DELAY;
r.heartbeat.limp = false;
r.heartbeat.wakeup_note = "cycle 42: " + DELAY + "s, POSTURE-DRIVEN, on a posture RE-MEASURED this cycle rather than inherited (inputs moved 93 -> 94 weekly_used_pct). This was a verified-value cycle -- RETRO.md gated 15/15 against a 0/15 negative control -- so the 900-1800s no-value band does not apply on its own terms and the nominal delay is 90s. Overridden for the same measured reason as cycles 39-41: the allocator authorises ZERO agent burn and that is structural for the rest of the run (reserve 23.66 exceeds the weekly remainder of 6; allow > 0 would need weekly_used_pct below 79.83%, unreachable within a week; the reserve floor releases only within 6h of the week reset and there are 17.59h left at stop_at). Zero-agent cycles are not zero-cost -- the conductor session IS the cost -- and 90s would spend roughly 300 more wakeups over the remaining 7.5h against about 15 at 1800s. NOT mislabelled as a no-value cycle to justify the number; the honest label is verified-value-with-no-item-landed, recorded as such in counters.churn_note_cycle_42. Gears never touch the wakeup delay and this is not a gear. ScheduleWakeup NOT called: on the VPS bin/swarm-pacer.sh reads this field every 5 min and spawns the cycle, so the field IS the schedule. Clamp satisfied: " + (now + DELAY) + " + 900 = " + (now + DELAY + 900) + " <= stop_at " + STOP + ". PLAN FOR THE REMAINING CLOCK: both human-facing deliverables (REPORT.md at cycle 41, RETRO.md at cycle 42) are now drafted and gated, which was the point of pulling them out of WRAP_UP -- a session death from here costs the human nothing. Next, in order: cycle 43-44 hold or pre-draft the WRAP_UP DISTILL candidate set (bin/swarm-playbook.sh append is refused by KI-5, so the manual fallback needs drafting in advance), cycle 45 backlog hygiene (cycle %% 5 == 0), then hold to WRAP_UP at stop_at - 900 = 1786878564. No product work can land: all six remaining todos need a builder.";

fs.writeFileSync(p + '.tmp', JSON.stringify(r, null, 2));
fs.renameSync(p + '.tmp', p);
fs.copyFileSync(p, '/opt/swarm/runs/current.json.bak');
console.log('runfile written + .bak copied');
console.log('now=' + now + ' next_wakeup_at=' + (now + DELAY) + ' clamp_ok=' + ((now + DELAY + 900) <= STOP) + ' remaining_h=' + ((STOP - now) / 3600).toFixed(2));
