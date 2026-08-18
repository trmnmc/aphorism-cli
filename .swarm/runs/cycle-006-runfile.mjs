// Cycle 6 runfile update + journal runfile-mirror.
import { readFileSync, writeFileSync, renameSync, appendFileSync, copyFileSync } from 'node:fs';
const RF = '/opt/swarm/runs/current.json';
const r = JSON.parse(readFileSync(RF, 'utf8'));
const now = Math.floor(Date.now() / 1000);
const WAKE = now + 90; // base 90s after a value cycle

// Budget: NO probe ran this cycle. Not due (1037s < 1800 at cycle open) and the
// PROBE_CMD=false clock-cruise fallback is denied by the same allowlist gap.
// probe_failures is NOT incremented: no attempt was made, so no failure occurred.
r.budget.source = 'CARRIED from cycle 5, not re-measured — and that is the rule. probe_failures 6 (>= 3) means cycle.md step 1 stops invoking the probe and re-invokes only at now - last_real_probe_ts >= 1800; at cycle open that was 1037s, so no probe was DUE. The clock-cruise fallback (PROBE_CMD=false bin/swarm-budget.sh) is itself denied by the same allowlist gap. Honest position: gear 2 carried from cycle 5s REAL measurement 1037s earlier. No new burn evidence was minted this cycle and none is claimed. probe_failures unchanged at 6 because no attempt was made — an unattempted probe is not a failed one.';
r.budget.gear_evidence = 'CARRIED, not measured. Last real measurement cycle 5 @1787031576: rho 0.65, gear_from_ratio 4, weekly governor ceiling 2 (weekly heat 1.71, opus heat 1.23, both over threshold), t = min(4,2) = 2, applied gear 2 / k_cap 2 / promote false / demote true. Nothing about the weekly governor can change before week_resets_at 1787547599, so the binding constraint is unchanged by construction; the 5h window was the looser of the two and was not binding. Next real probe is due at 1787033376 (= last_real_probe_ts + 1800), i.e. available to cycle 7.';

r.heartbeat.ts = now;
r.heartbeat.next_wakeup_at = WAKE;
r.heartbeat.pid = 2155401;
r.heartbeat.wakeup_note = 'Written for the VPS pacer (swarm-pacer.timer), the firing mechanism here — cycle.md step 9 replaces ScheduleWakeup with the pacer on the VPS, and ScheduleWakeup chains do not sustain in a headless -p session. Base 90s after a value cycle. Clamp holds: 1787033656 + 900 = 1787034556 <= stop_at 1787111308.';

r.helper_denials['swarm-notify.sh'] = 3;
r.helper_denials.note = 'Cycle 6 adds a 3rd swarm-notify.sh denial (poll, at orient). Running totals this run: swarm-budget.sh 6, swarm-notify.sh 3, swarm-playbook.sh denied at kickoff (parse) and cycle 2 (record-applied). The gap is NOT specific to any one helper: every denied path is /opt/swarm/bin/*.sh, exactly the absolute-path entry set the K-1 hand-off patch adds, so that patch as written would fix all three. Nothing here is inferred — each count is a live denial observed this run. Per hard rule 5 this is journaled and reported, never live-patched mid-run.';

// stop_at arithmetic correction (cycle 5 journal recorded 1787110108; conservative, not a breach)
r.stop_at_epoch_note = 'stop_at 2026-08-19T03:48:28+00:00 parses to 1787111308. The cycle-5 journal recorded 1787110108, 1200s low. The error was CONSERVATIVE (it could only have triggered WRAP_UP early, never late), so hard rule 8 was never at risk; corrected here so it stops propagating.';

writeFileSync(RF + '.tmp', JSON.stringify(r, null, 2));
renameSync(RF + '.tmp', RF);
copyFileSync(RF, RF + '.bak');

const mirror = { ...r };
delete mirror.artifact;
mirror.artifact = { file: r.artifact.file, publish_failures: r.artifact.publish_failures };
appendFileSync('/opt/targets/aphorism-cli/.swarm/journal.md',
  `next wakeup: ${WAKE} (+90s, base after a value cycle; clamp ${WAKE} + 900 <= stop_at 1787111308 holds)\nrunfile-mirror:\n\`\`\`json\n${JSON.stringify(mirror)}\n\`\`\`\n`);

console.log('runfile written + .bak copied; mirror appended. now', now, 'wake', WAKE);
console.log('gear', r.budget.gear, '| k_cap', r.budget.k_cap, '| probe_failures', r.budget.probe_failures, '(unchanged, no attempt)');
