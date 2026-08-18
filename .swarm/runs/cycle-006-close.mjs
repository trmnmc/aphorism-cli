import { readFileSync, writeFileSync, renameSync, copyFileSync, appendFileSync } from 'node:fs';
const RF = '/opt/swarm/runs/current.json';
const r = JSON.parse(readFileSync(RF, 'utf8'));
const now = Math.floor(Date.now() / 1000);
const WAKE = now + 90;
r.heartbeat.ts = now;
r.heartbeat.next_wakeup_at = WAKE;
writeFileSync(RF + '.tmp', JSON.stringify(r, null, 2));
renameSync(RF + '.tmp', RF);
copyFileSync(RF, RF + '.bak');

appendFileSync('/opt/targets/aphorism-cli/.swarm/journal.md',
`commit: 5eaf9e5 "cycle 6: QA full pass — 4/4 scenarios pass, 4/4 look findings reproduced,
  1 agent severity claim refuted [value]"; addendum 0ed1c1e (KI-33).
push: OK -> https://github.com/trmnmc/aphorism-cli.git  e0ce09c..0ed1c1e  master -> master
swarm-repo push: FAILED ("make sure you have the correct access rights and the repository
  exists") — the SWARM repo has no working remote. Unchanged from run #2 cycle 9, which
  recorded the same failure as a not-run signal. Hard rule 1 governs the TARGET repo, which
  pushed clean; the SWARM side is committed locally (76b3a01) and is durable on disk. Not a
  cycle failure, and not silently swallowed.
dashboard: rendered /opt/swarm/runs/dashboard.html (41,929 -> 45,257 bytes) via
  runs/c6-dashboard.mjs. All 10 anchors hit, MISS 0, unsubstituted placeholders none, stale
  "cycle 5" status strings remaining 0 — and then the harness's own zero-MISS claim was
  checked against the page and found insufficient; see the cycle 6 addendum and KI-33.
  Backlog counts 25/32 (was 25/30) and the progress bar DROPS 83% -> 78%; the burn-up bar
  drops 37% -> 34%. Both fall because the QA pass verified no backlog items and filed two new
  ones. Rendered as measured rather than flattered — a housekeeping cycle that finds work is
  supposed to move those bars DOWN.
notify: no push attempted this step — bin/swarm-notify.sh is denied (3rd denial this run, at
  orient). The phase change REVIEW -> QA therefore went undelivered; the dashboard meta line
  now says so explicitly ("notify on but UNDELIVERABLE (denied x3)") rather than claiming
  notify is on.
next wakeup: ${WAKE} (+90s, base after a value cycle; clamp ${WAKE} + 900 <= stop_at 1787111308 holds)
`);
console.log('heartbeat restamped ts', now, 'wake', WAKE, '| clamp ok:', (WAKE + 900) <= 1787111308);
