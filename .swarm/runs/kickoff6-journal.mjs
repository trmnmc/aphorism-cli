import fs from "node:fs";

const rf = JSON.parse(fs.readFileSync("/opt/swarm/runs/current.json", "utf8"));
const mirror = JSON.parse(JSON.stringify(rf));
delete mirror.artifact.url;

const block = `

## cycle 0 | 2026-08-20T14:36:57Z | aphorism-cli | KICKOFF

**Run:** improvement run #6 (allocator auto-kickoff, source=allocator, mode=guest, dial=0.30,
posture=trickle). Brief: "TRICKLE POSTURE: housekeeping only — harden tests, fix playbook
items, polish docs — no new features. Haiku-priced work types; no new features."

**Guards.** 1a no live runfile (\`runs/current.json\` absent). 1b non-empty-dir refusal WAIVED —
improvement run on a repo SWARM already built (guard 1d). 1c cwd is \`/opt/swarm\`. 1d hints
file present with \`source: "allocator"\` and an idea beginning \`"improve existing target "\` →
IMPROVEMENT RUN: interactive Q&A skipped, pacing/stop_at verbatim from hints, existing repo
REUSED (no dir creation, no \`git init\`, no \`gh repo create\`; \`git rev-parse\` confirms a work
tree). Hints file consumed and deleted.

**Work chosen + why.** Re-aim the brief's three open-ended chore headings onto ONE falsifiable
experiment. Five prior runs treated "harden tests" and "polish docs" as reading exercises and
produced churn; run #5's own RETRO filed two house-rules proposals about README bloat and
actioned NEITHER, because it closed DONE the same cycle it wrote them. Those proposals name a
real regression SWARM itself caused, and repairing it is what "polish docs" means. The prose in
question is guard-shaped, so moving it MEASURES whether each guard reads a structural marker
(L-043) or the prose — which makes "harden tests" checkable rather than rhetorical.

**STRESS-TEST: reshape, confidence 7.** Three of four lenses landed (sixth consecutive lap; run
#5 DONE at cycle 11 with ~19.4h unspent; all surviving backlog items human-blocked; L-045,
written from this repo, says that means DONE not another lap). The defence that held is narrow
and measured, and is recorded in SPEC.md in full.

**PRIOR-ART SCOUT: nothing found, stance build.** Two \`gh search repos\` queries
("programming aphorism quote cli", "random quote terminal zero dependency node") returned zero
rows. The adoption question is closed regardless — zero-dependency is a product constraint and
the brief forbids new deps.

**TASTE JUDGE (fresh subagent, spec text only):** use-twice 4 / product-not-demo 8 /
scope-fits-night 8 / one-memorable-thing 6. Verdict: worth the night as scoped, but use-twice
is load-bearing and this is the sixth housekeeping run on a finished toy. RECORDED AS DISSENT,
NOT OVERRIDDEN — third consecutive run. Scored HIGHER than run #5 (product-not-demo 6→8,
verdict moved from "only if the operator declines to lift the brief" to "worth the night as
scoped"): the difference is repairing a real regression instead of inventing a chore.

### VERIFICATION EVIDENCE (kickoff baselines — measured, not claimed)

\`\`\`
$ node --test test/*.test.js   (HEAD 3a17cc5, full clone, node v24.19.0)
ℹ tests 121
ℹ pass 121
ℹ fail 0
ℹ skipped 0
ℹ duration_ms 4900.22648

$ sha256sum src/corpus.js README.md
77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e  src/corpus.js
0f3f5945ffc4c923436f444639a0ff05845983f8ace7e29bcfc9144f03ee771f  README.md

$ node bin/aphorism.js --help | sha256sum
d759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64  -

$ wc -c -l README.md
  309 16609 README.md
\`\`\`

The suite is green at **121 / 121 / 0 fail / 0 skipped on a full clone** — note this differs
from the README's own matrix table, which reports \`121 tests, 119 pass, 0 fail, 2 skipped\` in
CI (the two skips are the shallow-clone citation guard standing down, as that section
documents). Both are true of their own environment. What is NOT true of either is README:306,
which claims \`# tests 120\` and \`(119 -> 120)\`. That is Q-3.

### Budget probe

\`\`\`
$ /opt/swarm/bin/swarm-budget.sh
{"gear":2,"gear_target":2,"ratio":0.62,"mode":"thermostat","dial":"1.00","source":"probe",
 "probe_ok":true,"k_cap":2,"promote":false,"demote":true,
 "weekly":{"weekly_used_pct":100,"opus_used_pct":100,"week_elapsed_pct":48.58,
           "weekly_heat":2.06,"ceiling":2,"promote_blocked":true}}

$ npx ccusage@latest blocks --json --token-limit max   (active block)
startTime 2026-08-20T11:00:00.000Z  endTime 2026-08-20T16:00:00.000Z  endEpoch 1787241600
\`\`\`

\`usage_reset_at\` is set from that measured boundary (2026-08-20T16:00Z), **not** to \`stop_at\`.
Run #5's retro recorded that the allocator hints set \`stop_at == usage_reset_at\` and bought
eleven consecutive gear-1 cycles on a fabricated input (L-038). \`stop_at\` is 2026-08-21T14:36Z,
~5 window resets away, so the defect does not repeat here. Pacing is \`guest\` per the hints —
never upshifts — and the weekly ceiling of 2 blocks promotion independently.

### Denials this session (recorded once; NOT to be re-derived — L-045)

- **#34** — \`/opt/swarm/bin/swarm-playbook.sh parse\`: DENIED. Playbook directives were staged
  by direct Read of \`learnings.md\`; the file was NOT validated by the script's parser.
- **#35** — kickoff step-5 write to \`/opt/swarm/.claude/settings.json\`
  (\`additionalDirectories: []\` → \`["/opt/targets/aphorism-cli"]\`): DENIED.

Structural cause confirmed in ONE read, which closes Q-6: \`permissions.allow\` carries eleven
\`swarm-*\` entries (\`swarm-budget.sh\`, \`swarm-notify.sh\`, \`swarm-usage-probe.sh\`,
\`swarm-weekly-from-allocator.sh\`, in bare/absolute/\`bash \`-prefixed forms) and **no
\`swarm-playbook.sh\` entry in any form**. \`HANDOFF-allowlist-2026-08-17.md\`'s stated ask is
unchanged and still correct. Hard rule 5 forbids repairing it mid-run; it is permanently a
human's item. \`--add-dir\` is the load-bearing path for headless scope and does not depend on
this (step 11).

### Watchdog blind spot, asserted rather than assumed (L-037)

\`swarm-watchdog.timer\` is \`enabled\` + \`active\`, but its DONE-guard is satisfied by
\`<target>/REPORT.md\` EXISTING, which on an improvement run is true from cycle 0 because run #5
wrote it. So it is expected to log \`all-done / reports-present\` and no-op on every firing, and
watchdog crash recovery is NOT live for this run. **Mitigation, verified:**
\`swarm-pacer.timer\` is \`enabled\` + \`active\` and drives cycles directly on the VPS, so recovery
does not depend on the watchdog. Tracked as KI-R6-1; tool bug, journal + report only.

### State written

- \`.swarm/SPEC.md\` rewritten for run #6 (Q-1..Q-6).
- \`.swarm/state.json\` + \`.swarm/backlog.json\` rotated to \`*.pre-run6-1787236617\`, rebuilt:
  6 new items (Q-6 already \`done\`, closed at kickoff), 9 human-blocked carried forward
  unchanged (T-006, TS-1, TS-2, TS-3, TS-6, T-040, J-7, P-7, R-1).
- \`/opt/swarm/runs/current.json\` + \`.bak\`; project registry recorded (\`{"ok":true,"projects":1}\`).
- \`/opt/swarm/runs/dashboard.html\` re-rendered at cycle-0 empty state; every region derived
  from a completed cycle renders \`UNKNOWN\`, never confident-or-stale (L-041).

**Commit:** see below. **Next wakeup:** cycle 1 (Q-1), driven by \`swarm-pacer.timer\`.

runfile-mirror:
\`\`\`json
${JSON.stringify(mirror, null, 2)}
\`\`\`
`;

fs.appendFileSync("/opt/targets/aphorism-cli/.swarm/journal.md", block);
console.log("journal appended,", block.length, "chars");
