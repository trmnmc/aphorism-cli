# journal — aphorism-cli

## cycle 1 | 2026-08-14T05:38:14+00:00 | aphorism-cli | DESIGN→BUILD
work: kickoff scaffolding + design decision (inline) + build-wave [T-001, T-002] — SMOKE run,
      2-builder cap, ~8 min of work clock before the stop_at−900 WRAP_UP threshold.
why: SMOKE stop_at = kickoff + 25 min leaves one working cycle; the DESIGN gate was cleared by a
     conductor-authored decision rather than design-panel (600s budget does not fit) — recorded as
     an explicit DEVIATION in state.json.decisions, not silently skipped.

ENVIRONMENT CONSTRAINTS (headless `-p` session, all documented, none fatal):
  - settings.json write DENIED → no allowlist edit, no `gh repo create`, no GitHub remote.
    Consequence: `git push` has no remote this run; journaled per hard rule 1, never blocking.
  - `bin/swarm-budget.sh` not on the Bash allowlist → budget probe not run.
    probe_failures = 1. SMOKE pins pacing `full` → gear 5 regardless of ρ, so this changed nothing.
  - Workflow tool is review-gated headless → build-wave dispatched as DIRECT Agent calls
    (documented failure-table fallback). No worktrees; builders were given strictly disjoint
    file scopes as the documented substitute.
  - `systemctl` not on the allowlist → watchdog timer state not asserted; plist_loaded=false.
  - Artifact publish unavailable headless → dashboard render deferred, publish_failures untouched.

wave: T-001 corpus+select (sonnet), T-002 args parser (sonnet) — dispatched in parallel,
      pairwise-disjoint files_hint, zero shared modules, no dependency ordering between them.
      Conductor owns the integration layer (bin/aphorism.js, test/cli.test.js, README.md) — a
      third scope disjoint from both builders.

VERIFICATION EVIDENCE:
  T-002 check (authored now, at verification time — NOT the builder's own suite):
    node -e "<19 assertions against the SPEC Domain rules: flag forms, seed typing, error
             semantics, never-throws, HELP content/length/taste>"
    PASS empty argv -> no error                        got=undefined
    PASS --author equals form                          got="Knuth"
    PASS --seed typed as number                        got="number"
    PASS non-numeric seed -> error                     got=true
    PASS unknown flag -> error                         got=true
    PASS missing value at end -> error                 got=true
    PASS value-less flag before flag -> error          got=true
    PASS both flags AND together                       got=["Hoare","design"]
    PASS never throws on malformed input               got=false
    PASS HELP names every flag                         got=true
    PASS HELP fits one screen (10 lines)               got=true
    PASS HELP has no emoji (taste note)                got=false
    -> 19/19 PASS. T-002 status: done.
  T-001: builder still in flight at commit time — NOT verified, NOT claimed.
  test_cmd (`node --test test/`): NOT RUN at this commit — the suite cannot pass until T-001's
    modules land (test/cli.test.js requires src/corpus.js and src/select.js). Reported as
    not-run, never as passed.

commit: 931057d "cycle 1: kickoff + build-wave T-002 [1 verified, T-001 in flight]"
next wakeup: n/a — SMOKE single-session run, conductor continued inline to WRAP_UP

--- cycle 1 continued: T-001 landed 05:42:44, verification completed ---

VERIFICATION EVIDENCE (T-001, checks authored now, NOT the builder's suite):
  node -e "<14 assertions against the SPEC Domain rules>"
    PASS corpus >=40 entries (n=50)                    got=true
    PASS every entry has text/author/non-empty tags    got=true
    PASS no duplicate aphorism text                    got=50
    PASS author filter case-insensitive (n=7)          got=true
    PASS tag filter case-insensitive (n=10)            got=true
    PASS both filters AND (intersection, n=2)          got=true
    PASS unmatched author -> empty set                 got=0
    PASS same seed -> same result (repeat call)        got=true
    PASS seeding spreads across corpus (distinct=26)   got=true
    PASS seed deterministic over a FILTERED set too    got=true
    PASS empty candidates throws RangeError            got=true
    PASS unseeded pick is actually random (distinct=50) got=true
    -> 14/14 PASS. T-001 status: done.

VERIFICATION EVIDENCE (test_cmd — the integration gate):
  FIRST RUN of the SPEC's literal test_cmd `node --test test/` -> FAILED:
    code: 'MODULE_NOT_FOUND' ... ℹ pass 0 / ℹ fail 1
  This is a DEFECT IN THE SPEC'S COMMAND STRING, not in the code. Both builders had
  self-reported green using per-FILE commands, which do work — only running the documented
  command surfaced it. Corrected to the glob form (SPEC.md + README.md + state.test_cmd).
  Re-run `node --test test/*.test.js`:
    ℹ tests 48
    ℹ pass 48
    ℹ fail 0
    ℹ duration_ms 1099.4
  Gate NOT weakened: zero tests altered, added, or skipped — only the invocation string.

VERIFICATION EVIDENCE (live product, conductor ran it):
  $ node bin/aphorism.js --seed 42
    Bad programmers worry about the code. Good programmers worry about data structures
    and their relationships.
        — Linus Torvalds
  $ node bin/aphorism.js --author dijkstra --json --seed 1
    {"text":"The competent programmer is fully aware of the strictly limited size of his
     own skull.","author":"Edsger W. Dijkstra","tags":["humility","simplicity"]}
  $ node bin/aphorism.js --help -> 10-line unix-quiet usage block, all six flags named

wave autotune: k=2 wave was CLEAN (0 reverts, 0 failed verifies) -> wave_streak 0 -> 1.
push: FAILED — "no configured remote". Cause: KI-1 (denied settings.json write blocked the
  gh allowlist entry, so kickoff could not run `gh repo create`). Journaled per hard rule 1,
  never blocking; both commits are durable on local disk.
commit: b4c9b06 "cycle 1: build-wave T-001 T-002 + integration T-003 T-004 [4 verified, 48 tests green]"

## WRAP_UP | 2026-08-14T05:44:39+00:00 | aphorism-cli
reason: SMOKE stop_at 06:03:14 minus the 900s threshold = 05:48:14 reached.
NOT RUN this run, reported as not-run rather than passed: design-panel, review-fix,
  qa-verify (full/look/taste), polish-docs, collision-scan, budget probe, dashboard publish.
  One build wave consumed the entire SMOKE window.
playbook: DISTILL SKIPPED — SMOKE guard (SKILL.md SMOKE mode; `swarm-playbook.sh --smoke`
  would exit 3 by design). `SWARM/playbook/learnings.md` untouched. 4 candidate lessons are
  parked in .swarm/RETRO.md for a human to promote by hand.
artifacts: .swarm/RETRO.md, REPORT.md written. Dashboard NOT published (Artifact denied
  headless); publish_failures left at 0 since no attempt was made.

runfile-mirror:
```json
{"version":1,"targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-14T06:03:14+00:00","usage_reset_at":"2026-08-14T06:03:14+00:00","model_policy":"value-routing","auth_mode":"subscription","smoke":true,"heartbeat":{"ts":1786686136,"next_wakeup_at":1786686494,"pid":44574,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"full","dial":1.0},"budget":{"source":"clock","gear":5,"gear_target":5,"ratio":0.0,"mode":"full","k_cap":2,"promote":false,"demote":false,"window_tokens":0,"window_cost_usd":0.0,"api_cap_usd":null,"api_spend_usd":0.0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786685894,"last_real_probe_ts":0,"probe_failures":1,"weekly":{"ok":false,"weekly_used_pct":0,"opus_used_pct":0,"week_elapsed_pct":0,"weekly_heat":0,"opus_heat":0,"ceiling":5,"promote_blocked":false}},"watchdog":{"mode":"normal","plist_loaded":false,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":0,"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## KICKOFF | 2026-08-15T11:32:33+00:00 | aphorism-cli | PLAN
run: improvement-aphorism-cli-2026-08-15 (run_kind improvement), stop_at 2026-08-16T11:24:24+00:00
source: allocator auto-kickoff. runs/kickoff-hints.json = {"mode":"guest","dial":0.30,
  "brief":"TRICKLE POSTURE: housekeeping only - harden tests, fix playbook items, polish
  docs - no new features","source":"allocator","stop_at":1786879464}. Hints consumed and
  the file DELETED per SKILL.md guard 1d, so it can never steer a later human kickoff.
guards: 1a no live runfile (runs/current.json absent; moon run archived, .bak wrap_up_complete).
  1b non-empty-dir refusal WAIVED by the improvement-run carve-out (idea text begins
  "improve existing target "). 1c cwd = /opt/swarm. 1d hints applied, interactive Q&A skipped.
  Existing repo REUSED: no dir creation, no git init, no gh repo create; verified git worktree
  with remote origin https://github.com/trmnmc/aphorism-cli.git (KI-1 from the build run is
  therefore RESOLVED - a remote now exists and push is live).

STRESS-TEST: verdict proceed, confidence 7. Two attacks bounced (nobody is reading this repo
  again as it stands; housekeeping on a finished artifact competes with nothing). The
  toy-version trap LANDED and forced a cut, recorded as a decision: "harden tests" on an
  already-48-green suite is the exact work that produces test-count churn, so tests are
  admitted ONLY for measured mutation survivors (playbook L-031/L-029/L-033). Second landing:
  the demo-embarrassment lens put the corpus attribution triage (I-4) above every test item.

PRIOR-ART SCOUT: reported NOT RUN, not "nothing found". gh is authed (scopes gist, read:org,
  repo, workflow) but `gh search repos` returned zero bytes on all three queries INCLUDING an
  unfiltered control - instrument-shaped, not finding-shaped. Claiming "no prior art exists"
  off a blind instrument would be a false negative (the L-030 failure mode). Decision impact
  nil: the artifact is already built and the brief forbids new features, so no adopt/extend
  call is live.

TASTE JUDGE (fresh sonnet subagent, taste-judge.md only): use-twice 4, product-not-demo 8,
  scope-fits-night 5, one-memorable-thing 3. Verdict: "worth the night as a hardening pass,
  but scope-fits-night is load-bearing - the promised rigor is what gets shortcut if the
  minimum-burn clock runs out first." ACTED ON, not just recorded: rigor items (I-1, I-2, I-3)
  are sequenced first, and the two shortcut-prone items (I-4 corpus triage, I-5 playbook
  repair) are scoped as honestly-partial-with-handoff rather than as completion claims.

DEVIATION (recorded as a decision, not silently treated as confirmed): proceeded past the
  spec-confirmation gate with NO user confirmation. Headless allocator auto-kickoff has no
  user, and SKILL.md defines no non-interactive behaviour for that gate - the exact house-rules
  gap this target's own RETRO (2026-08-14) proposed be settled. The taste critique (a/b/c) was
  printed in the kickoff transcript against an absent audience.

VERIFICATION EVIDENCE (kickoff probe, conductor-authored, run before any file was written):
  KI-4 check: node -e "6x execFileSync('node',['bin/aphorism.js','--seed','Infinity','--json'])"
    -> 6 distinct aphorisms, exit 0 every run, distinct:6  DEFECT CONFIRMED
    (Domain rule says a seeded pick is deterministic; args.js accepts Infinity because
     Number('Infinity') is not NaN, then select.js's Number.isFinite guard silently falls
     through to Math.random(). Both halves are individually defensible; the seam is the bug.)
  corpus shape: node -e "corpus.length / authors / dup texts" -> entries 50, authors 24,
    dupe texts 0  PASS (>= 40 must-have holds)
  test_cmd baseline: deferred to cycle 2 step 6 - no code changed at kickoff, and a baseline
    run with nothing to compare it against is not evidence.

playbook: apply_mode auto, 15 lessons staged. bin/swarm-playbook.sh parse REFUSED (not on the
  Bash allowlist) so directives were HAND-PARSED from playbook/learnings.md read-only, and
  record-applied could NOT be written - the ledger line for this run is missing and that is
  reported, not papered over. wave_k: no lesson sets it -> default 3 (gear caps it to 1 anyway).
  Four staged qa lines are browser-specific and INERT on a Node CLI; staged faithfully rather
  than silently dropped, since hard rule 5 bars editing the playbook's intent mid-run.
  The playbook FILE ITSELF is now item I-5: 31 lessons vs a documented cap of 20, and three
  duplicate ids (L-023, L-025, L-026 each name two different lessons).

budget: gear 1, k_cap 1, demote true, mode guest, dial 0.30. bin/swarm-budget.sh NOT invoked
  (allowlist gap, re-checked this kickoff - settings.json still carries no entry of any form
  for swarm-budget.sh or swarm-playbook.sh). probe_failures stays 0: an attempt not made is
  not a failure. Gear rests on runs/allocator.json (source=probe): posture trickle,
  allow_premium_pct 0, weekly_used_pct 80.0, opus_used_pct 96, week_elapsed_pct 75.24.
  weekly_heat 1.0633 < 1.1 -> governor disengaged; opus_heat 1.2759 > 1.2 -> promote blocked.
  Direction-free structural fact: week_resets_at 1786942799 falls AFTER stop_at 1786879464,
  so gear 1 is fixed for the whole run regardless of any trend (L-032 - no trend claimed).

DENIED CAPABILITIES this kickoff, each reported as not-run rather than as passed:
  - settings.json write (additionalDirectories + allowlist entries for swarm-budget.sh /
    swarm-playbook.sh / swarm-craft.mjs): DENIED headless. This is KI-5 and it cannot be
    self-healed from a headless session - a human must add the entries. Third run in a row.
  - headless zero-prompt assert (`claude -p "/swarm status ..."`): NOT RUN, `claude` is not on
    the Bash allowlist. Watchdog relaunches may stall; mitigating evidence is that the pacer
    spawned 47 headless cycles on the previous run under these same permissions.
  - Artifact publish: tool absent in a -p session. runs/dashboard.html written locally, which
    IS the publication on the VPS. publish_failures left at 0 - no attempt was made.
infra verified live, not assumed: systemctl is-enabled swarm-watchdog.timer -> enabled;
  systemctl is-active swarm-pacer.timer -> active; .ntfy.json present; goodnight push ->
  "2026-08-15T11:32:33+0000 send goodnight ok" in runs/notify.log.
next: cycle 2 - inline PLAN pass to cover I-1..I-6 in the backlog (PLAN gate, cycle.md step 4).

## cycle 2 | 2026-08-15T11:42:07+00:00 | aphorism-cli | PLAN -> BUILD
work: inline PLAN — the improvement backlog (I-1..I-6). Why: the PLAN gate (cycle.md step 4
  gate 2) held, because the six improvement must-haves written into SPEC.md at kickoff were
  covered by zero backlog items. Design gate was already satisfied by the cycle-1 decisions.
clock: 1786793624 at open, stop_at 1786879464 -> 85840s (23.8h) remaining. Admission control:
  inline PLAN budget 600s fits with enormous margin.
gear: 1 (guest, dial 0.30, trickle). k_cap 1, demote true. Unchanged from kickoff and fixed for
  the run — week_resets_at falls after stop_at. No probe invoked (allowlist gap); no trend claimed.
control: poll ok, merged=0. pending[] empty, applied[] empty, no inject[] array. Nothing to apply.
orient: git status --porcelain clean (kickoff commit 7e15664 pushed to origin/master).

agent: ONE Plan-type subagent, sonnet (gear-1 demote; PLAN is not a judgment seat — the
  judgment this cycle is the HOLE/BOUNDARY classification, which the conductor deliberately
  withheld from the item and kept for itself, per L-033).
CONDUCTOR CHANGES to what the agent proposed, recorded because accepting a plan silently is
  how a plan stops being the conductor's:
  1. Narrowed I-1's files_hint from four files to src/select.js + test/select.test.js. As
     proposed it shared SPEC.md and README.md with I-3, which is a planning error even at
     wave size 1; the seed resolution's PROSE moved to I-3, so code and docs never collide.
  2. Retargeted I-2c from test/cli.test.js to test/args.test.js. As proposed, I-2b and I-2c
     both edited test/cli.test.js and were kept apart only by a dep edge — disjoint file
     scopes are the mechanism, dep ordering is not a substitute for it.
  3. DECLINED to flag I-1 route_class "core" despite playbook L-026 (route the correctness
     core to fable even when small). L-026 is a routing recommendation; the allocator posture
     is trickle with allow_premium_pct 0 and opus at 96% of the weekly envelope, and gear 1's
     rule is S-effort sonnet builds only. Spending premium the allocator has explicitly zeroed
     on a three-line change would be honoring a lesson's letter against its purpose. Recorded
     as a deliberate non-application, not an oversight — the WRAP_UP applied-lessons check
     should read this as "contradicted by posture", not "not exercised".
  4. Accepted the agent's I-1 resolution recommendation (deterministic pick, not exit 2) after
     checking its reasoning independently: Number('Infinity') is not NaN so args.js already
     admits it; toUint32Seed folds the IEEE-754 bit pattern, and +/-Infinity have distinct
     stable bit patterns (0x7FF00000 / 0xFFF00000 in the high word), so the deterministic
     branch works on them unchanged. NaN stays exit 2 via parseSeedValue and is correct as-is.
     The defect is the seam between two individually-defensible halves, not either half.

VERIFICATION EVIDENCE (conductor-authored at verification time, not taken from the agent):
  PLAN coverage check: python3 — parse SPEC "- [ ] **I-N" must-haves, map to backlog ids
    -> SPEC must-haves ['I-1','I-2','I-3','I-4','I-5','I-6']
       I-1 -> ['I-1'] | I-2 -> ['I-2a','I-2b','I-2c'] | I-3 -> ['I-3']
       I-4 -> ['I-4'] | I-5 -> ['I-5'] | I-6 -> ['I-6']
       uncovered: []            PASS (the PLAN gate's actual condition)
  duplicate backlog ids -> []                                    PASS
  files shared by >1 todo item -> {} (empty)                      PASS (pairwise-disjoint)
  BASELINE test_cmd (the floor every later item must not break):
    $ node --test test/args.test.js test/cli.test.js test/select.test.js
    -> tests 48 | pass 48 | fail 0 | cancelled 0 | skipped 0 | todo 0   PASS
  Note on what this cycle did NOT verify: no code changed, so there is nothing else to prove.
  A plan is verified by coverage and disjointness, not by a green suite — the suite result
  above is recorded as the baseline for I-1/I-2, not as evidence the plan is good.

backlog: 15 items total (6 carried from the build run, 9 new). T-005 (rotation) kept todo at
  priority 9 and explicitly marked OUT OF SCOPE — it is a feature and the brief forbids
  features; NOT dropped, because the taste judge named its absence as the sole cause of the
  use-twice 4/10. T-006 moved todo -> blocked: confirming an attribution needs sources this
  run cannot reach, so it is a human item, and I-4 supersedes it with a triage a human can act on.
wave autotune: not applicable — no build wave ran this cycle. k_current stays 3, wave_streak 1
  (effective wave size is min(k_current, gear cap 1) = 1 regardless).
dashboard: runs/dashboard.html re-rendered locally (0 unreplaced placeholders verified by grep).
  Artifact publish skipped — tool absent in a -p session, which is not a publish failure.
wakeup: next_wakeup_at 1786794217 (+90s base). ScheduleWakeup NOT called: on the VPS
  bin/swarm-pacer.sh is the firing mechanism and reads next_wakeup_at directly (cycle.md step 9).
next: cycle 3 — I-1, the seed-determinism fix, dispatched as a single-item wave (k=1) to a
  sonnet builder with scope src/select.js + test/select.test.js.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786794127,"next_wakeup_at":1786794217,"pid":355895,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0.0,"api_cap_usd":null,"api_spend_usd":0.0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786793072,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"kickoff: bin/swarm-budget.sh NOT invoked \u2014 re-checked at this kickoff, /opt/swarm/.claude/settings.json still carries no allow entry of any form for swarm-budget.sh or swarm-playbook.sh (only swarm-notify.sh, twice). probe_failures stays 0: an attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 80.0, opus_used_pct 96, week_elapsed_pct 75.24, dial 0.30. weekly_heat 80.0/75.24 = 1.0633 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/75.24 = 1.2759 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structural fact, direction-free: week_resets_at 1786942799 falls AFTER stop_at 1786879464, so gear 1 is fixed for the whole run regardless of any trend.","weekly":{"ok":true,"weekly_used_pct":80.0,"opus_used_pct":96,"week_elapsed_pct":75.24,"weekly_heat":1.0633,"opus_heat":1.2759,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs \u2014 L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer \u2014 never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll \u2014 a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer \u2014 never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer \u2014 never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see \u2014 tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging \u2014 a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive \u2014 a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped \u2014 apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":1,"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 3 | 2026-08-15T11:49:52+00:00 | aphorism-cli | BUILD
work: build-wave, one item (I-1, the --seed non-finite determinism fix). Why: the DESIGN and
  PLAN gates are both satisfied (design decisions exist; the backlog now covers all six SPEC
  must-haves), and must-have items remain todo, so cycle.md step 4 gate 3 selects BUILD. Within
  BUILD, I-1 is priority 1 and the only conductor-CONFIRMED live defect in the shipped product.
clock: 1786794535 at open, stop_at 1786879464 -> 84929s (23.6h) remaining. Admission control:
  build-wave budget 2700s fits with enormous margin.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  weekly_heat 1.0599 < 1.1 -> governor disengaged; opus_heat 1.2719 > 1.2 -> promote blocked.
  Effective wave size = min(k_current 3, gear cap 1, hard max 5) = 1. No probe invoked: the
  allowlist still has no entry for bin/swarm-budget.sh (KI-5), so probe_failures stays 0 --
  an attempt not made is not a failure -- and the gear rests on runs/allocator.json (source=probe).
control: poll ok, pending[] empty, applied[] empty, no inject[] array. Nothing to apply.
orient: git status --porcelain clean at open (HEAD 04e0d6f).
craft pack: node bin/swarm-craft.mjs ran clean, degraded: []. NOT passed to the agent -- I-1 is
  not craft "ui" (files_hint is src/select.js + test/select.test.js) and this target has no
  browser surface at all, so craft.ui is inert here. Recorded rather than silently skipped.

dispatch: DIRECT Agent call, sonnet, NOT Workflow build-wave.js -- the Workflow tool is
  review-gated in a headless -p session, so this is the documented failure-table fallback.
  Wave size 1 makes the disjoint-file-scope substitute for worktree isolation trivially hold.
  Model derivation: routing table -> sonnet for an S-effort fix; gear-1 demote does not bite
  (build/fix never drops below sonnet); NOT promoted to fable despite routing_recs
  core-logic->fable, for the reason recorded at cycle 2 -- allow_premium_pct is 0 and
  promote_blocked is true. Playbook builder prompt_line "the conductor is the SOLE committer"
  was appended to the agent prompt; the other three staged builder lines are React/UI-specific
  and inert for a Node CLI.

VERIFICATION EVIDENCE (conductor-authored AT verification time; the builder never saw these
  checks, and its own self-report -- including its claim to have stash-tested the pre-fix
  failure -- was treated as a claim, not as evidence). Full output:
  .swarm/runs/cycle-003-verify-I-1.txt

  BASELINE measured before dispatch, same cycle -- 6 spawns of --seed Infinity --json:
    distinct: 6 of 6          <- defect reproduced, non-deterministic under a seed

  Scope + no weakened assertions:
    $ git diff --stat
     src/select.js       | 13 +++++++-----
     test/select.test.js | 31 +++++++++++++++++++++++
    $ git diff -U0 test/select.test.js | grep -c "^-[^-]"
    0                         <- zero deleted lines in the test file

  $ node --test test/*.test.js
    i tests 52 / i pass 52 / i fail 0     (baseline this morning was 48 pass / 0 fail)

  Conductor CLI-level checks A-D (8 process spawns per stability row):
    A1 +Inf distinct/8 : 1
    A2 -Inf distinct/8 : 1
    A3 +Inf+filter     : 1     <- --tag simplicity, per the item acceptance
    B Infinity  predicted-index match: true | idx 21
    B -Infinity predicted-index match: true | idx 3
    B 42        predicted-index match: true | idx 32
    C NaN exit: 2 | stdout empty: true | stderr: "aphorism: flag --seed requires a numeric value"
    D unseeded distinct/12: 12

  Check B is the DISCRIMINATOR and is why A alone was not accepted: a degenerate fix that
  pinned index 0, or collapsed every non-finite seed onto one entry, passes A perfectly. So
  the verify script re-implemented mulberry32 and the IEEE-754 bit-fold independently and
  PREDICTED which corpus index each seed must select. Three distinct indices, each predicted
  correctly through the shipped binary. C and D are the controls: NaN was not swept into the
  deterministic branch, and the random branch is still random.

gate: I-1 PASS -> done. KI-4 -> resolved (cycle 3), with the resolution and its evidence
  recorded in state.json rather than the entry being deleted.
autotune: clean wave (0 reverts, 0 failed verifies) -> wave_streak 1 -> 2 -> fires:
  k_current 3 -> 4, wave_streak reset to 0. INERT this run -- effective size stays
  min(4, gear cap 1) = 1 -- but carried so a future run on a healthier window inherits it.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 5 done / 8 todo / 1 blocked.
outcome: 1 item verified, 52 tests green, one high-severity known issue closed.

dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 4 -- I-2a, the mutation sweep. It is the only unblocked priority-2 item, it is
  measurement rather than code (so it fits gear 1 cleanly), and I-2b/I-2c both depend on it.
  The HOLE-vs-BOUNDARY classification of whatever survives stays with the conductor.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786794592,"next_wakeup_at":1786797292,"pid":358087,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786794798,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"cycle 3: bin/swarm-budget.sh still NOT invoked — /opt/swarm/.claude/settings.json re-read this cycle and its allow[] carries node/npm/npx/git/gh but no entry of any form for swarm-budget.sh or swarm-playbook.sh (only swarm-notify.sh, twice). probe_failures stays 0: an attempt not made is not a failure (KI-5). Gear re-derived from runs/allocator.json (source=probe, refreshed): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 80, opus_used_pct 96, week_elapsed_pct 75.48, dial 0.3. weekly_heat 1.0599 < 1.1 -> governor disengaged, ceiling 5. opus_heat 1.2719 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Unchanged from cycle 2 and structurally fixed for the run: week_resets_at 1786942799 falls after stop_at 1786879464.","weekly":{"ok":true,"weekly_used_pct":80,"opus_used_pct":96,"week_elapsed_pct":75.48,"weekly_heat":1.0599,"opus_heat":1.2719,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs — L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer — never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll — a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer — never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer — never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see — tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging — a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped — apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":2,"artifact":{"file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 4 | 2026-08-15T12:20:34+00:00 | aphorism-cli | BUILD
work: I-2a, the mutation sweep. Why: gates 1 and 2 are satisfied (design decisions exist; the
  backlog covers all six SPEC must-haves) and must-have items remain todo, so step 4 gate 3
  selects BUILD. Within BUILD, I-2a is the only unblocked priority-2 item, it is measurement
  rather than code (so it fits gear 1's haiku-priced/test-triage work class cleanly), and both
  I-2b and I-2c depend on it.
clock: 1786795294 at open, stop_at 1786879464 -> 84170s (23.4h) remaining. Admission control:
  the 2700s worst-case wave budget fits with enormous margin.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  weekly_heat 80.0/75.61 = 1.0581 < 1.1 -> governor disengaged, ceiling 5. opus_heat
  96/75.61 = 1.2697 > 1.2 -> promote blocked. Effective wave size = min(k_current 4, gear
  cap 1, hard max 5) = 1. No probe invoked: /opt/swarm/.claude/settings.json was re-read this
  cycle and grepping its allow[] for swarm-*.sh returns only swarm-notify.sh, so there is still
  no entry for bin/swarm-budget.sh (KI-5). probe_failures stays 0 -- an attempt not made is not
  a failure -- and the gear rests on runs/allocator.json (source=probe, refreshed this cycle).
control: bin/swarm-notify.sh poll ok; runs/control.json pending[] empty, applied[] empty, no
  inject[] array. Nothing to apply.
orient: git status --porcelain clean at open (HEAD 9c1c3b5).
craft pack: node bin/swarm-craft.mjs ran clean, degraded: []. NOT passed to the agent -- I-2a
  produces no product code at all, and this target has no browser surface, so craft.ui is inert.
  Recorded rather than silently skipped.

dispatch: DIRECT Agent call, sonnet, NOT Workflow -- the Workflow tool is review-gated in a
  headless -p session, so this is the documented failure-table fallback. Model derivation:
  routing table -> I-2a is kind qa, effort M, so it matches no specific row and lands on
  sonnet, the default for anything unmatched. attempts 0, no ladder escalation. Gear-1 demote
  does NOT bite: the sonnet->haiku rung is gated to docs/polish items and I-2a is neither.
  NOT a judgment seat -- the HOLE-vs-BOUNDARY judgment was deliberately withheld from the
  agent and kept by the conductor, so what was dispatched is mechanical measurement.
  Playbook qa prompt_lines applied: the SOLE-committer line, L-031 (measure by mutation, do
  not read the suite for gaps), L-020 (refute, distinguish verified-wrong from suspicious),
  L-022 (discriminator over remembered reference), L-030 (whole-repo-minus-.git scratch copies,
  never a hand-enumerated subset). The four browser-specific staged lines stayed inert.

agent return (CLAIM, not fact): 27 mutants; baseline 52/52; 19 KILLED, 7 SURVIVED,
  1 EQUIVALENT (M06-EQUIV: dropping .toLowerCase() on the tag ENTRY side is a no-op because
  every corpus tag is already lowercase -- correctly self-reported as equivalent, excluded from
  the survivor list, and replaced with a query-side variant that did kill).

VERIFICATION EVIDENCE (conductor-authored AT verification time, after the agent returned).
  Full output: .swarm/runs/cycle-004-verify-I-2a.txt | script: cycle-004-verify-I-2a.py

  Method: every mutation was RE-DERIVED by the conductor from the agent's one-SENTENCE
  description and never copied from its recorded diff -- copying the diff would reproduce a
  subtle no-op and pass vacuously. Each mutant got its own whole-repo-minus-.git copy (L-030),
  exactly one edit, a conductor-authored observable-difference probe against the pristine
  binary, then the full suite. Sample = ALL 7 claimed survivors PLUS a 4-mutant control sample
  of claimed KILLS, because under-reporting survivors is the worse error.

  BASELINE (pristine whole-repo copy): exit=0 pass=52 fail=0

    ok   M07    claimed=SURVIVED   observed=SURVIVED    (--tag test: pristine exit 1 -> mutant exit 0, 169B)
    ok   M12    claimed=SURVIVED   observed=SURVIVED    (--list: 4528B -> 4470B, one entry gone)
    ok   M13    claimed=SURVIVED   observed=SURVIVED    (--list: same 4528B, first line differs -> reversed)
    ok   M14    claimed=SURVIVED   observed=SURVIVED    (--json: 105B one line -> 126B multi-line)
    ok   M16    claimed=SURVIVED   observed=SURVIVED    (--list --json: NDJSON 91B -> pretty array 137B)
    ok   M21    claimed=SURVIVED   observed=SURVIVED    (--seed -5: exit 0 -> exit 2)
    ok   M22    claimed=SURVIVED   observed=SURVIVED    (--seed --list: stderr wording changes only)
    ok   K-M04  claimed=KILLED     observed=KILLED      (suite 49 pass / 3 fail)
    ok   K-M08  claimed=KILLED     observed=KILLED      (suite 51 pass / 1 fail)
    ok   K-M09  claimed=KILLED     observed=KILLED      (suite 51 pass / 1 fail)
    ok   K-M15  claimed=KILLED     observed=KILLED      (suite 51 pass / 1 fail)

    11/11 agree with the agent's claim; 0 disagree.

  Every survivor row carries its own observable-difference probe, so none of the 7 is an
  equivalent mutant dressed up as a survivor -- that check is what makes SURVIVED mean
  "the suite cannot see a real behavior change" rather than "nothing actually changed".
  The 4 KILLED controls are the falsification half: they confirm the suite really does fail
  when it should, so a green suite under a survivor is informative rather than a broken runner.
  Real repo after the sweep: node --test test/*.test.js -> 52 pass / 0 fail, and git status
  shows only new .swarm/runs/ artifacts -- no source or test file was touched by anyone.

  FIRST ATTEMPT WAS WRONG AND IS RECORDED AS SUCH: the initial verify run reported
  M12/M13/M16 as PATCH-FAILED because the conductor's patch anchors used 6-space indentation
  against a file that uses 4. That was a defect in the CHECK, not evidence about the claim,
  and it was fixed and re-run rather than being reported as a disagreement. Journaled because
  a check that silently fails to apply is exactly the failure mode that looks like a pass.

gate: I-2a PASS -> done. No test_cmd regression possible (the item changes no product code),
  but test_cmd was run on the real repo anyway and is 52/52.

CLASSIFICATION (conductor judgment, withheld from the agent by design; anchored to SPEC.md
  Domain rules, not intuition). Full reasoning: .swarm/runs/cycle-004-classification.md
    HOLE     M07 --tag membership vs substring     -> rule: "membership in the tags array"
    HOLE     M12 --list drops an entry             -> rule: "prints EVERY aphorism"
    HOLE     M13 --list order reversed             -> rule: "in corpus order"
    HOLE     M14 --json pretty-printed             -> rule: "a SINGLE-LINE JSON object"
    HOLE     M21 negative --seed rejected          -> exit 2 means unknown flag / missing arg; -5 is neither
    BOUNDARY M22 --seed lookahead guard dropped    -> exit 2 + clean stdout + stderr message ALL still hold;
                                                      only the message wording changes
    DEFER    M16 --list --json array vs NDJSON     -> no rule exists; SPEC lists it under OPEN
                                                      AMBIGUITIES as item I-3(c)
  M22 and M16 both produce no test, for OPPOSITE reasons, and the distinction is the point:
  M22 has a rule and satisfies it, so pinning the exact error string would freeze prose no
  rule fixes and false-reject an honest reword. M16 has no rule at all, so a test would
  silently promote today's NDJSON implementation to a promise and pre-empt the decision I-3
  exists to make. Hardening all 7 would have been the easy, wrong answer; test-count is not
  a deliverable (cycle-1 decision).
assignment: I-2b (test/cli.test.js) takes M07, M12, M13, M14 -- all observable through the
  shipped binary. I-2c (test/args.test.js) takes M21, and exactly M21: the item is neither
  padded nor closed as not-needed, because measurement put precisely one survivor in the
  parser. Files stay pairwise-disjoint. Both planning-time hypotheses recorded in I-2b at
  cycle 2 were CONFIRMED by measurement: the --list test asserts only a line-count floor of
  40 against a 50-entry corpus, and the --json test JSON.parses a trimmed blob that a
  pretty-printed object also satisfies. I-3 gains M16 as measured evidence that the
  --list --json surface is completely unprotected today.
autotune: not applicable -- no build wave, no branches, no merges this cycle. k_current stays
  4, wave_streak stays 0.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 6 done / 7 todo / 1 blocked.
outcome: 1 item verified. No product code changed by design; the deliverable is measurement
  plus the classification that turns it into scoped work.

dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 5 -- I-2b, the four CLI-level HOLE tests, as a single-item wave (k=1) to a sonnet
  builder scoped to test/cli.test.js only. The builder is handed the exact mutations and the
  twice-proven requirement (fails against its mutation AND removing it lets the mutation
  survive); the conductor re-proves both halves itself at the gate. Cycle 5 is also a
  cycle % 5 == 0 cycle, so it carries a full SPEC.md re-read plus backlog hygiene.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786795373,"next_wakeup_at":1786798073,"pid":360032,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786795373,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"cycle 4: bin/swarm-budget.sh still NOT invoked - /opt/swarm/.claude/settings.json re-read this cycle; grepping its allow[] for swarm-*.sh returns only swarm-notify.sh (twice), so there is still no entry of any form for swarm-budget.sh or swarm-playbook.sh. probe_failures stays 0: an attempt not made is not a failure (KI-5). Gear re-derived from runs/allocator.json (source=probe, refreshed this cycle): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 80.0, opus_used_pct 96, week_elapsed_pct 75.61, dial 0.3. weekly_heat 80.0/75.61 = 1.0581 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/75.61 = 1.2697 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structurally fixed for the run: week_resets_at 1786942799 falls after stop_at 1786879464.","weekly":{"ok":true,"weekly_used_pct":80.0,"opus_used_pct":96,"week_elapsed_pct":75.61,"weekly_heat":1.0581,"opus_heat":1.2697,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs — L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer — never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll — a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer — never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer — never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see — tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging — a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped — apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":3,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 5 | 2026-08-15T12:27:32+00:00 | aphorism-cli | BUILD
work: I-2b, the four CLI-level HOLE tests. Why: gates 1 and 2 remain satisfied and must-have
  items remain todo, so step 4 gate 3 selects BUILD. I-2b is the highest-priority unblocked
  item (p3; its only dep I-2a closed last cycle), it is S-effort, and it is test work rather
  than product code, which sits cleanly inside gear 1's work class.
clock: 1786796852 at open, stop_at 1786879464 -> 82612s (22.9h) remaining. Admission control:
  the build-wave 2700s worst case fits with enormous margin; no S-effort-only clamp needed.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct
  80.0, opus_used_pct 96, week_elapsed_pct 75.87. weekly_heat 80.0/75.87 = 1.0544 < 1.1 ->
  governor disengaged, ceiling 5. opus_heat 96/75.87 = 1.2653 > 1.2 -> promote blocked.
  guest clamps 1-3, trickle posture -> gear 1. Effective wave size = min(k_current 4, gear
  cap 1, hard max 5) = 1. No probe invoked, for the fourth cycle running:
  /opt/swarm/.claude/settings.json was re-read this cycle and its allow[] contains
  swarm-notify.sh twice and nothing else matching swarm-*.sh -- there is still no entry of any
  form for bin/swarm-budget.sh or bin/swarm-playbook.sh (KI-5). probe_failures stays 0: an
  attempt not made is not a failure.
control: bin/swarm-notify.sh poll ok (silent, exit clean); runs/control.json pending[] empty,
  applied[] empty, no inject[] array. Nothing to apply, nothing to triage.
orient: git status --porcelain clean at open (HEAD 6955c91).
re-anchor: cycle 5, so cycle % 5 == 0 -> FULL SPEC.md re-read performed (not just the digest)
  plus backlog hygiene. SPEC unchanged since kickoff; the six improvement must-haves I-1..I-6
  are all still covered by backlog items. Hygiene outcome: NO CHANGES. 14 live items is well
  under the ~30 cap, no duplicates, no stale entries, priorities coherent. T-005 (rotation)
  was re-examined for dropping -- it is a new feature and this run's non-goals forbid features
  -- and DELIBERATELY LEFT todo at p9: cycle 2's note on that item records that the kickoff
  taste judge scored use-twice 4/10 and named this exact deferral as the cause, so it is the
  first item a future feature-bearing run should pick. Dropping it would erase that finding to
  tidy a list. p9 already keeps it unreachable this run.
craft pack: node bin/swarm-craft.mjs ran clean, degraded: []. DEVIATION, recorded rather than
  hidden: it was run AFTER dispatch, not before as cycle.md step 5 requires. Consequence this
  cycle is nil -- I-2b touches one test file, produces no user-visible surface, and the item
  would not have carried craft: "ui" under the flagging rule -- but the ordering was wrong and
  the next build dispatch should run it first.

dispatch: DIRECT Agent call, sonnet, NOT Workflow -- the Workflow tool is review-gated in a
  headless -p session, so this is the documented failure-table fallback. k=1, so the
  disjoint-file-scope substitute for worktrees is trivially satisfied. Model derivation:
  routing table -> I-2b is kind test, effort S -> sonnet; attempts 0, no ladder escalation;
  gear-1 demote does not bite because the sonnet->haiku rung is gated to docs/polish items.
  Scope handed to the builder was ONE file, test/cli.test.js, with an explicit ban on editing
  src/, bin/, package.json, or any other test file, and an explicit instruction to report
  rather than fix any product bug it found. The four mutations were handed over verbatim from
  cycle-004-mutation-sweep.json (diff, rule, and observable difference each). The
  HOLE/BOUNDARY classification stayed with the conductor, as last cycle. Playbook builder
  prompt_lines applied verbatim, including the three React/UI-specific lines that are inert
  for a Node CLI -- staged faithfully per the standing inert_note rather than silently
  dropped. NO verify command was given to the builder (hard rule 2): it was told the goal
  (failable and attributable) and never how the gate would measure it.

agent return (CLAIM, not fact): four tests added, one per mutation, all corpus-derived rather
  than hardcoded; each proven failable and attributable; suite 52 -> 56; only test/cli.test.js
  modified. It also self-reported one methodological caveat unprompted -- that M12 and M13 are
  not fully independent because dropping the last --list entry also moves the last line -- and
  described isolating them by hand. That caveat turned out to be correct and is reproduced
  below by independent measurement.

VERIFICATION EVIDENCE (conductor-authored AT verification time, after the agent returned).
  Harness: .swarm/runs/cycle-005-verify-I-2b.py, written by the conductor this cycle, never
  seen by the builder. It re-derives all four mutations from the cycle-4 sweep record's own
  diffs, restores product files from `git show HEAD:<path>` between every step, and asserts a
  clean src/bin tree at the end. Full output: .swarm/runs/cycle-005-verify-I-2b.txt

```
PRISTINE          pass=56 fail=0  -> GREEN
SKIP-SANITY       ctrl mutation + all 4 new tests skipped: pass=48 fail=4 -> OK
M07  FAILABLE pass=55 fail=1 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED clean
M12  FAILABLE pass=54 fail=2 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED fail=1 (order test)
M13  FAILABLE pass=55 fail=1 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED clean
M14  FAILABLE pass=55 fail=1 named=True | ATTRIBUTABLE pass=52 fail=0 | ISOLATED clean
TREE AFTER HARNESS: M test/cli.test.js  (src/ and bin/ unmodified)
FINAL test_cmd (node --test test/*.test.js): pass=56 fail=0
GATE: PASS
```

  Reading the numbers, because the shape matters more than the verdict. ATTRIBUTABLE is the
  strict form: the mutation is applied AND all four new tests are skipped, and the suite must
  still be green. All four landed on exactly pass=52 fail=0 -- the pre-sweep baseline, to the
  test -- which says the mutation survives everything that existed before this cycle, so the
  kill is genuinely owed to work landed today and not to a pre-existing test that cycle 4's
  sweep mismeasured. Per-test isolation was ALSO run and is the weaker signal: M12 alone still
  shows fail=1 because dropping the last --list entry is length-changing and therefore trips
  the order test too. That is an expected overlap between two honest tests, not a failed
  attribution, and the strict form is what the gate rests on.
  SKIP-SANITY exists because ATTRIBUTABLE is a PASS-shaped result: if --test-skip-pattern had
  silently matched more than the four names, every ATTRIBUTABLE line would have read PASS
  vacuously. The control applies an obviously-breaking mutation (bare invocation returns exit
  3) with the same four names skipped and confirms the suite still fails, caught by
  pre-existing tests. Without that control the whole gate would be unfalsifiable.
  Independent read of the diff, separate from the harness: no existing test was weakened,
  deleted, or loosened; expected values are computed from require('../src/corpus.js') rather
  than hardcoded, so a corpus that grows will not produce a false alarm; no error-message
  wording is pinned anywhere.

gate: I-2b PASS -> done. test_cmd 56/56 on the real repo, up from 52/52, with zero product
  code changed.

OBSERVATION, filed rather than fixed: the M13 order test asserts full line equality,
  `${text} — ${author}`, which pins the --list LINE FORMAT. No Domain rule states that format
  -- the rules cover --list's completeness and its order, never its rendering. This is the
  same shape of gap as M16 from last cycle: a test now enforces something the spec does not
  promise. Appended to I-3's notes as measured evidence, since I-3 is the item that settles
  doc/behaviour divergences; it should either write the rule or loosen the assertion to
  order-only. Not fixed this cycle because rewriting the assertion is exactly the kind of
  churn the item exists to decide, and the gate does not fail on it -- the test is correct
  about today's behavior, just broader than the promise.
autotune: this was a build wave in substance (k=1, one dispatched item, one merge-equivalent
  landing) and it was CLEAN -- zero reverts, zero failed verifies -> wave_streak 0 -> 1.
  k_current stays 4; the streak must reach 2 to raise it. Still inert either way: effective
  size = min(k_current, gear cap 1) = 1 and gear 1 is structurally fixed for this run, since
  week_resets_at 1786942800 falls after stop_at 1786879464.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 7 done / 6 todo /
  1 blocked.
outcome: 1 item verified. Suite 52 -> 56 green.

dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 6 -- I-2c, the single parser-level HOLE (M21: parseArgs(['--seed','-5']) must
  yield seed === -5 with no error), as a k=1 sonnet build scoped to test/args.test.js only.
  One test, one mutation, same twice-proven requirement and the same strict-attribution gate,
  which the harness above already generalizes to. M22 must NOT be hardened -- it is the
  classified BOUNDARY. After I-2c the remaining must-have work is I-3 (doc divergences, now
  carrying the --list format finding above), I-4 (corpus triage), I-5 (playbook repair, still
  blocked in practice by the KI-5 allowlist gap), I-6 (report refresh at wrap-up).
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786796852,"next_wakeup_at":1786799552,"pid":374780,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786796852,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"cycle 5: bin/swarm-budget.sh still NOT invoked - /opt/swarm/.claude/settings.json re-read this cycle; its allow[] contains swarm-notify.sh twice and no entry of any form for swarm-budget.sh or swarm-playbook.sh (KI-5). probe_failures stays 0: an attempt not made is not a failure. Gear re-derived from runs/allocator.json (source=probe, refreshed this cycle): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 80.0, opus_used_pct 96, week_elapsed_pct 75.87, dial 0.3. weekly_heat 80.0/75.87 = 1.0544 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/75.87 = 1.2653 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structurally fixed for the run: week_resets_at 1786942800 falls after stop_at 1786879464.","weekly":{"ok":true,"weekly_used_pct":80.0,"opus_used_pct":96,"week_elapsed_pct":75.87,"weekly_heat":1.0544,"opus_heat":1.2653,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs — L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer — never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll — a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer — never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer — never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see — tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging — a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped — apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":4,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```
