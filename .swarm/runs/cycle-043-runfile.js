#!/usr/bin/env node
// cycle 43 — runfile update + .bak copy.
// The timestamp is read INSIDE this process and used for both the heartbeat stamp and the
// derived next_wakeup_at, so no clock value is hand-passed between steps. That is the
// cycle-41 forward-dating defect fixed at source, per cycle 42.
const fs = require('fs');
const RF = '/opt/swarm/runs/current.json';
const r = JSON.parse(fs.readFileSync(RF, 'utf8'));

const now = Math.floor(Date.now() / 1000);
const STOP = 1786879464;
const DELAY = 1800;
const wake = now + DELAY;

// hard rule 8 / step 9 clamp: wakeup + 900 must not pass stop_at.
if (wake + 900 > STOP) throw new Error('clamp violated — WRAP_UP is the correct next move');

r.heartbeat = {
  ts: now,
  next_wakeup_at: wake,
  pid: 792491,
  limp: false,
  degraded_tiers: [],
  wakeup_note:
    'cycle 43: 1800s, POSTURE-DRIVEN, on an allocator re-read this cycle (week_elapsed_pct ' +
    '85.04 -> 85.51, reserve_overall_pct 23.67 -> 23.3, allow_overall_pct 0 unchanged). This ' +
    'was a verified-value cycle -- two deliverables gated 16/16 and 13/13, each against ' +
    'negative controls -- so the 900-1800s no-value band does not apply on its own terms and ' +
    'the nominal delay is 90s. Overridden for the same measured reason as cycles 39-42: the ' +
    'allocator authorises ZERO agent burn and that is structural for the rest of the run ' +
    '(allow > 0 would need weekly_used_pct below ~80% and weekly usage is monotonic within a ' +
    'week; the reserve floor releases only within 6h of the week reset at 1786942799, which ' +
    'is 17.4h past stop_at). Zero-agent cycles are not zero-cost -- the conductor session IS ' +
    'the cost -- and 90s would spend roughly 260 more wakeups over the remaining 6.6h against ' +
    'about 13 at 1800s. NOT mislabelled as a no-value cycle to justify the number; the honest ' +
    'label is verified-value-with-no-item-landed, recorded as such in counters.churn_note_cycle_43. ' +
    'Gears never touch the wakeup delay and this is not a gear. ScheduleWakeup NOT called: on ' +
    'the VPS bin/swarm-pacer.sh reads this field every 5 min and spawns the cycle, so the ' +
    'field IS the schedule. ' +
    'PLAN FOR THE REMAINING CLOCK: every human-facing deliverable is now drafted and gated -- ' +
    'REPORT.md (c41), RETRO.md (c42), and as of this cycle the WRAP_UP DISTILL candidate set ' +
    '(/opt/swarm/runs/wrapup-candidates.md), which cycle 43 proved is REQUIRED rather than ' +
    'assumed: gate check S8 shows bin/swarm-playbook.sh append will refuse. A session death ' +
    'from here costs the human nothing. Next, in order: cycle 44 hold, cycle 45 backlog ' +
    'hygiene (cycle %% 5 == 0, step 3), then hold to WRAP_UP at stop_at - 900 = 1786878564. ' +
    'No product work can land: all six remaining todos need a builder. ' +
    'ONE THING WRAP_UP SHOULD NOW DO DIFFERENTLY: gate check S9 shows the wrap-up push WILL ' +
    'be permitted via the relative form from cwd=/opt/swarm, where prior cycles assumed the ' +
    'notify channel was dead. Send it.',
};

r.cycles_since_recycle = 17;

// Allocator re-read this cycle (runs/allocator.json), not inherited.
r.budget.last_probe_ts = now;
r.budget.reserve_overall_pct = 23.3;
r.budget.allow_overall_pct = 0;
r.budget.weekly.weekly_used_pct = 94.0;
r.budget.weekly.week_elapsed_pct = 85.51;
r.budget.weekly.weekly_heat = +(94.0 / 85.51).toFixed(4);
r.budget.weekly.opus_heat = +(97 / 85.51).toFixed(4);
r.budget.weekly.governor_note =
  'cycle 43: weekly_heat 94.0/85.51 = ' + (94.0 / 85.51).toFixed(4) + '. Fifth reading ' +
  '(1.1115 c39 -> 1.1060 c40 -> 1.0993 c41 -> 1.1054 c42 -> this). Per L-032 no trend is ' +
  'claimed: the direction has now reversed twice across five points. The structural fact that ' +
  'does not depend on direction is unchanged and is the only one acted on: the ceiling has ' +
  'never been the binding constraint in this run, because guest clamps reachable gears to 1-3 ' +
  'and the gear is pinned at 1 by the ALLOWANCE, not the ceiling. opus_heat under 1.2, so ' +
  'promote_blocked stays false either way.';
r.budget.posture = 'trickle (allowance structurally 0 -- allocator re-read cycle 43)';
r.budget.posture_note =
  'RE-READ at cycle 43 from runs/allocator.json rather than inherited. allow_overall_pct is ' +
  'reported as 0 by the allocator directly, with reserve_overall_pct 23.3 against a weekly ' +
  'remainder of 100 - 94.0 = 6.0 -- the reserve still exceeds the remainder, which is the ' +
  'condition that pins allow at 0, so the cycle-41 derivation continues to hold on inputs ' +
  'that moved again. Fifth consecutive zero-agent cycle. KI-14 note: swarm_used_pct still ' +
  'reads 0 (the rollover-jitter wipe, now a third observation); it grants no spend because ' +
  'allow is already 0 on the reserve curve, which the wipe does not touch. KI-14 stays HIGH.';
r.budget.probe_note =
  'cycle 43: bin/swarm-budget.sh REFUSED for the FORTY-SECOND consecutive cycle (KI-5), ' +
  'attempted rather than skipped per the standing cycle-14 rule, in both path forms per cycle ' +
  '27. Refused before the command started, so probe_failures stays 0. THIS CYCLE STOPPED ' +
  'RE-OBSERVING THE REFUSAL AND ROOT-CAUSED IT by reading /opt/swarm/.claude/settings.json ' +
  'directly: permissions.allow has NO entry for swarm-budget.sh in any path form, and its ' +
  'only swarm-notify.sh entries are the relative form plus a dead /Users/truman/... macOS ' +
  'path -- the settings file was never migrated from macOS to the VPS. The allowlist ' +
  'contents predicted 7/7 measured cells including two negative controls and two ' +
  'never-before-measured cells. Evidence: .swarm/runs/cycle-043-verify-ki5.txt. NOT FIXED ' +
  '(hard rule 5: settings.json is read-only until WRAP_UP); the repair is two added lines ' +
  'and belongs to a human between runs.';

fs.writeFileSync(RF + '.tmp', JSON.stringify(r, null, 2) + '\n');
fs.renameSync(RF + '.tmp', RF);
fs.copyFileSync(RF, RF + '.bak');

console.log('runfile written + .bak copied');
console.log('  now            ', now);
console.log('  next_wakeup_at ', wake, '(+' + DELAY + 's)');
console.log('  clamp          ', wake + 900, '<= stop_at', STOP, '=>', wake + 900 <= STOP);
console.log('  h to stop_at   ', ((STOP - now) / 3600).toFixed(2));
