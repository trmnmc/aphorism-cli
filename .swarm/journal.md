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

## cycle 6 | 2026-08-15T12:47:24+00:00 | aphorism-cli | BUILD
work: I-2c, the one parser-level HOLE survivor. Why: gates 1 and 2 stay satisfied and
  must-have items remain todo, so step 4 gate 3 selects BUILD. I-2c is the highest-priority
  unblocked item (p4; both deps I-2a and I-2b closed), it is S-effort, and it is test work
  rather than product code — the work class gear 1 permits.
clock: 1786798106 at open, stop_at 1786879464 -> 81358s (22.6h) remaining. Admission control:
  the build-wave 2700s worst case fits with enormous margin; no S-effort-only clamp needed.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct
  81.0, opus_used_pct 96, week_elapsed_pct 76.06. weekly_heat 81.0/76.06 = 1.0650 < 1.1 ->
  governor disengaged, ceiling 5. opus_heat 96/76.06 = 1.2621 > 1.2 -> promote blocked.
  guest clamps 1-3, trickle posture -> gear 1. Effective wave size = min(k_current 4, gear
  cap 1, hard max 5) = 1. No probe invoked, for the fifth cycle running:
  /opt/swarm/.claude/settings.json was re-read this cycle — allow[] holds 36 entries, of which
  the only swarm-*.sh matches are bin/swarm-notify.sh (twice, once under a stale macOS
  absolute path). Still no entry of any form for bin/swarm-budget.sh or bin/swarm-playbook.sh
  (KI-5). probe_failures stays 0: an attempt not made is not a failure.
  Demotion had nothing to bite: I-2c is a `test` item, and gear 1's sonnet->haiku drop applies
  to docs/polish items only. It ran on sonnet as routed.
control: bin/swarm-notify.sh poll ok (silent, exit clean); runs/control.json pending[] empty,
  applied[] empty, no inject[] array. Nothing to apply, nothing to triage.
orient: git status --porcelain clean at open (HEAD 3e3b7f3). No salvage needed.
re-anchor: cycle 6, 6 % 5 != 0 -> digest-level re-anchor only, no full SPEC re-read (cycle 5
  did that one). Definition of done unchanged: harden, document, repair; no new features.
dispatch: ONE direct Agent call (sonnet, k=1), file scope EXACTLY test/args.test.js. Workflow
  stays unavailable in a -p session (review-gated), so the documented direct-Agent fallback
  applies; with k=1 there is no concurrency to isolate. The builder was given M21's diff and
  the twice-proven requirement, and was told explicitly NOT to harden M22 and not to pin
  error-message wording. It was NOT given the verification harness.

VERIFICATION EVIDENCE — I-2c (full run: .swarm/runs/cycle-006-verify-I-2c.txt,
harness source: .swarm/runs/cycle-006-verify-I-2c.py):

```
--- FAILABLE: M21 applied, new tests active ---
pass=56 fail=2 exit=1
  FAILING: --seed <n> accepts a negative number
  FAILING: --seed=<n> equals form accepts a negative number
--- DENOMINATOR: pristine, new tests filtered out by the skip pattern ---
tests=56 pass=56 fail=0   (58 collected minus exactly the 2 added this cycle)
--- ATTRIBUTABLE (strict): M21 applied, new tests filtered out ---
tests=56 pass=56 fail=0 exit=0
--- SKIP-SANITY: breaking control mutation, same skip pattern ---
pass=49 fail=7  (all 7 pre-existing tests; none of the new names)
--- PRISTINE: source restored, full suite ---
pass=58 fail=0 exit=0
TREE AFTER HARNESS: M test/args.test.js  (src/ and bin/ unmodified)
GATE: PASS
```

conductor-run test_cmd on the real repo (`node --test test/*.test.js`): tests 58, pass 58,
  fail 0. Product tree proven untouched independently of the harness:
  `git diff --stat HEAD -- src/ bin/ package.json README.md` printed nothing at all.
  End-to-end through the shipped binary, both argument forms: `node bin/aphorism.js --seed=-5
  --json` and `--seed -5 --json` each exit 0 and print the identical Rob Pike entry — the
  behavior M21 would have turned into exit 2.

A HARNESS BUG, surfaced and fixed at the gate rather than papered over. The first harness run
  returned GATE: FAIL on the ATTRIBUTABLE line — but the numbers on that line were pass=56
  fail=0, which is exactly the claim passing. The failing assertion was `skipped == 2`,
  inherited from cycle 5's harness. Measured directly: node's --test-skip-pattern FILTERS
  matched tests out of the run (tests 58 -> 56) and leaves `# skipped` at 0; it does not mark
  them skipped. The assertion was measuring the reporter, not the claim. The fix REPLACES it
  with a strictly stronger control rather than deleting it: DENOMINATOR runs the same pattern
  against PRISTINE source and requires it to remove exactly the tests added this cycle,
  leaving the 56-test baseline green — that pins WHAT was excluded, which the skipped counter
  never did. Recorded as a decision because cycle 5's journal presents the skipped-count form
  as the precedent, and a later cycle would otherwise re-derive this the hard way. Hard rule 2
  was not bent here: no test was weakened, no claim deleted, no failure re-labeled — the
  product claim was independently true under both the old and new measurement.
gate: I-2c PASS -> done. test_cmd 56/56 -> 58/58 on the real repo, zero product code changed.
  The I-2 mutation-hardening thread (I-2a sweep, I-2b CLI holes, I-2c parser hole) is now
  complete: every conductor-classified HOLE from cycle 4's sweep is closed, M22 stands
  unhardened as the classified BOUNDARY, and M16 stays deferred to I-3 by design.
autotune: clean wave (k=1, one dispatched item, zero reverts, zero failed verifies) ->
  wave_streak 1 -> 2 -> raises k_current 4 -> 5, streak reset to 0. INERT as before: effective
  size = min(k_current 5, gear cap 1) = 1, and gear 1 is structurally fixed for this run since
  week_resets_at 1786942799 falls after stop_at 1786879464. Carried so a future run on a
  healthier window inherits the learned number.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 8 done / 5 todo /
  1 blocked.
outcome: 1 item verified. Suite 56 -> 58 green.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped — the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 7 — I-3, the four doc/behaviour divergences, as a haiku docs item (S-effort, the
  work class gear 1 actively prefers) scoped to .swarm/SPEC.md + README.md. It now carries two
  pieces of measured evidence from this thread that must both be settled in prose: M16
  (`--list --json` emits NDJSON, promised by no rule, deliberately left untested) and the
  cycle-5 finding that the M13 order test pins the `--list` LINE FORMAT (`<text> — <author>`)
  which no rule promises either — I-3 must write the rule or loosen that assertion, not leave
  the test as the de-facto spec. After I-3: I-4 (corpus triage, M-effort sonnet — the one
  remaining item gear 1 does not comfortably fit), I-5 (playbook repair, conductor-executed,
  still blocked in practice by the KI-5 allowlist gap), I-6 (report refresh at wrap-up).
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786798369,"next_wakeup_at":1786800806,"pid":385174,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786798106,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"cycle 6: bin/swarm-budget.sh still NOT invoked - /opt/swarm/.claude/settings.json re-read this cycle; allow[] has 36 entries, none matching swarm-budget.sh or swarm-playbook.sh in any form (KI-5 unchanged). probe_failures stays 0: an attempt not made is not a failure. Gear re-derived from runs/allocator.json (source=probe, refreshed this cycle): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 81.0, opus_used_pct 96, week_elapsed_pct 76.06, dial 0.3. weekly_heat 81.0/76.06 = 1.0650 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.06 = 1.2621 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structurally fixed for the run: week_resets_at 1786942799 falls after stop_at 1786879464.","weekly":{"ok":true,"weekly_used_pct":81.0,"opus_used_pct":96,"week_elapsed_pct":76.06,"weekly_heat":1.065,"opus_heat":1.2621,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs — L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer — never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll — a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer — never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer — never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see — tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging — a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped — apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":5,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 7 | 2026-08-15T13:01:25+00:00 | aphorism-cli | BUILD
work: I-3, the doc/behaviour divergences. Why: gates 1 and 2 stay satisfied (a design decision
  exists; the backlog covers every must-have), and must-have items remain todo, so step 4 gate 3
  selects BUILD. I-3 is the highest-priority unblocked item (p5, dep I-1 closed cycle 3), it is
  S-effort, and it is `kind: docs` — the haiku-priced work class gear 1 actively prefers.
clock: 1786798885 at open, stop_at 1786879464 -> 80579s (22.4h) remaining. Admission control:
  polish-docs' 900s budget fits with enormous margin; no S-effort-only clamp needed.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct 81.0,
  opus_used_pct 96, week_elapsed_pct 76.2. weekly_heat 81.0/76.2 = 1.0630 < 1.1 -> governor
  disengaged, ceiling 5. opus_heat 96/76.2 = 1.2598 > 1.2 -> promote blocked. guest clamps 1-3,
  trickle posture -> gear 1. Effective wave size = min(k_current 5, gear cap 1, hard max 5) = 1.
  Demotion had nothing to bite: I-3 is already the bottom rung (docs/S -> haiku per the routing
  table), and gear 1's sonnet->haiku drop cannot lower it further.
probe: bin/swarm-budget.sh WAS invoked this cycle and the permission layer REFUSED it — the
  refusal came from the harness, not the script. Sixth cycle running (KI-5). probe_failures
  stays 0 deliberately: a command that was never allowed to start is not a probe that failed,
  and incrementing it would trip the 3-strike back-off on evidence that does not exist.
control: bin/swarm-notify.sh poll was REFUSED this cycle by the same permission layer, though it
  ran clean in cycle 6 — recorded as the documented non-fatal failed poll. Fell back to
  file-sourced state: runs/control.json has pending[] empty, applied[] empty, no inject[] array.
  Nothing to apply, nothing to triage. No command was lost, but note the honest limitation — a
  command that arrived over ntfy and had not yet been pulled into the file would not have been
  seen this cycle.
orient: git status --porcelain clean at open (HEAD cbf9846). No salvage needed.
re-anchor: cycle 7, 7 % 5 != 0 -> digest-level re-anchor only. Definition of done unchanged:
  harden, document, repair; no new features.
craft: node bin/swarm-craft.mjs ok, degraded[] empty. The docs pack was spliced into the prompt.
dispatch: ONE direct Agent call (haiku, k=1), file scope EXACTLY .swarm/SPEC.md + README.md.
  Workflow stays unavailable in a -p session (review-gated), so the documented direct-Agent
  fallback applies; with k=1 there is no concurrency to isolate. The agent was NOT asked to
  decide anything: all six rulings were pre-decided by the conductor against the shipped source
  (src/select.js, src/args.js, bin/aphorism.js all read first), so its job was transcription and
  prose, which is what a haiku seat is for. It was NOT given the verification harness.

SIX RULINGS, where SPEC named three. All follow SHIPPED behavior — nothing here changes what the
  code does:
  (a) --author is SUBSTRING containment, case-insensitive (`--author dijk` matches Dijkstra).
  (b) --tag is WHOLE-TAG membership, case-insensitive — stated adjacent to (a) so the asymmetry
      is visible. This contrast is the most confusable thing about the tool and neither file
      said it before.
  (c) --list accepts a valid --seed and IGNORES it; no pick happens; exit 0. Closes KI-3.
  (d) --list --json is NDJSON — one object per line, corpus order, explicitly NOT an array.
  (e) --list plain form is `<text> — <author>`, em dash U+2014, one line per entry.
  (f) --seed accepts every value Number() parses to non-NaN (negative, non-integer, +/-Infinity),
      all deterministic; NaN alone is exit 2. Stated with no finiteness carve-out, since I-1
      removed the one that used to exist in the code.
  Also: SPEC's OPEN AMBIGUITIES comment block DELETED (not edited), and README's brittle
  "48 tests" count replaced with a description of coverage rather than a number that re-rots.

judgment call recorded as a decision — (e) and (d) were settled by WRITING THE RULE, not by
  loosening the tests that had been pinning them. Cycle 5 named both honest exits for the --list
  line format (write the rule, or loosen the M13 assertion to order-only) and one dishonest one
  (leave a test acting as the de-facto spec). Chose to write: --list is the flag people pipe into
  other tools, so its line shape is a real contract, and loosening would have deleted protection
  from a live surface to solve a paperwork problem. Same for --list --json: cycle 4 deferred
  hardening M16 precisely BECAUSE no rule existed, so writing the NDJSON rule is what unblocks
  hardening it (new item I-8) — the rule was not invented to bless whatever the code happened
  to do.

VERIFICATION EVIDENCE — I-3 (full run: .swarm/runs/cycle-007-verify-I-3.txt,
harness source: .swarm/runs/cycle-007-verify-I-3.js):

```
--- (a) --author is SUBSTRING containment, case-insensitive ---
  PASS  DISCRIMINATOR: partial-author result set equals full-name result set :: substring, not equality
--- (b) --tag is WHOLE-TAG membership, not substring ---
  PASS  --tag test exits 1 (no whole tag "test" exists) :: code=1
  PASS  --tag testing exits 0 and matches entries :: code=0, 2 line(s)
--- (c) --list accepts --seed and IGNORES it ---
  PASS  seeded --list output identical to unseeded :: three distinct seeds + unseeded all byte-identical
  PASS  EDGE: --list --seed abc is still a usage error (exit 2) :: code=2
--- (d) --list --json emits one JSON object per line (NDJSON, not an array) ---
  PASS  output does NOT start with "[" (not a JSON array) :: "{\"text\":\"Pre"
  PASS  every line parses independently as a JSON object :: 50 lines
  PASS  NDJSON lines are in corpus order :: first="Premature optimization is th..."
--- (e) --list plain form is "<text> — <author>", one line per entry ---
  PASS  first line is exactly `text EM-DASH author` :: Premature optimization is the root of all evil. — Donald Knuth
  PASS  DISCRIMINATOR: default output form differs (2 lines, indented attribution)
--- (f) --seed: every non-NaN Number() value is accepted AND deterministic ---
  PASS  --seed Infinity exits 0 and is deterministic over 8 runs :: distinct outputs=1
  PASS  DISCRIMINATOR: distinct seeds reach multiple distinct aphorisms :: 7 distinct results across 7 seeds
  PASS  --seed abc is a usage error, exit 2 :: code=2

TOTALS: pass=36 fail=0
GATE: PASS
```

a DOCS item was gated by EXECUTION, not by reading the prose. Every claim I-3 wrote is a claim
  about runtime behavior, so the docs are falsifiable exactly like code and hard rule 2 applies
  unchanged. Reading the diff would only have confirmed the agent wrote what it was told; it
  could not have caught a ruling transcribed faithfully but not honored by the code. Four
  DISCRIMINATORS were built in because the naive checks are each passable by a degenerate
  implementation: determinism alone is satisfied by an always-same-entry stub (so 7 seeds must
  reach 7 distinct aphorisms), and a substring rule is indistinguishable from equality unless the
  partial-author result set is required to EQUAL the full-name set. Corroborating checks the
  conductor ran outside the harness: full test_cmd `node --test test/*.test.js` = tests 58,
  pass 58, fail 0 (before and after); `git diff --stat` = exactly 2 files, both .md;
  `grep -c "OPEN AMBIGUITIES" .swarm/SPEC.md` = 0; `grep "48 tests" README.md` = no match.
conductor precision edit, disclosed: the agent's prose read "--list accepts --seed but ignores
  it", which invites the reading that ANY seed value is fine under --list. The harness EDGE check
  had already proven `--list --seed abc` still exits 2 with empty stdout. Both files now say
  "accepts a VALID --seed" and name the parse-failure carve-out explicitly. Hard rule 2 was not
  bent: no test was weakened, no claim deleted, no failure re-labeled — the gate had already
  passed and the edit made the prose match a measurement, not the other way round. The harness
  was re-run after the edit (36/36, GATE: PASS) rather than trusting that .md-only changes were
  inert.
gate: I-3 PASS -> done. KI-3 marked resolved (documented, not changed). SPEC checkboxes I-1, I-2
  and I-3 checked by the CONDUCTOR against cycle 3/4/5/6/7 evidence — the file's own rule is
  "checked off only after conductor verification, never by claim", and they had been left
  unchecked while their evidence landed. I-3's box carries a comment recording that it closed as
  a superset of the three divergences SPEC named.
follow-ups opened, both traceable to this cycle's measurement:
  I-7 (docs, haiku, p6) — src/args.js's HELP string is a THIRD documentation surface still
    carrying the pre-I-3 wording: "filter by author (case-insensitive)" is not false, but it is
    incomplete in exactly the way I-3 just closed in the other two files. Held OUT of I-3 on
    purpose: HELP lives in a product file, and pulling it in would have broken the
    pairwise-disjoint file scope. Its acceptance includes a green suite, since a HELP-content
    test may exist.
  I-8 (test, sonnet, p6) — M16 (--list --json rewritten to a pretty-printed array) survived the
    entire suite at cycle 4 and was deferred, correctly, for want of a rule. Ruling (d) is now
    that rule, so the deferral is spent and the surface is eligible for the same twice-proven
    hardening as I-2b/I-2c.
autotune: NOT applied — this was a docs item dispatched as a single direct Agent call, not a
  build-wave, and the autotune rule keys on build-wave merges. k_current stays 5, wave_streak
  stays 0. (k_current remains INERT this run regardless: effective size = min(5, gear cap 1) = 1,
  and gear 1 is structurally fixed since week_resets_at 1786942799 falls after stop_at.)
counters: consecutive_no_value 0 (verified value this cycle). backlog: 9 done / 6 todo /
  1 blocked (two of the todos are the new I-7 and I-8).
outcome: 1 item verified. Suite 58/58 green, zero product code touched.
heartbeat: next_wakeup_at was left at the step-0 worst-case (now+2700) through dispatch rather
  than re-touched down to polish-docs' 900s. Writing a SHORTER deadline mid-cycle can only raise
  the chance of being read as stale; the longer value is the conservative direction and step 9
  rewrites it with the real scheduled time anyway.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped — the tool is absent
  in a -p session, which is not a publish failure.
next: cycle 8 — I-4, the corpus attribution triage. It is the last substantive item and the one
  that does NOT fit gear 1 comfortably: M-effort on sonnet, where gear 1's rule is S-effort sonnet
  builds only. It is `kind: qa` producing a markdown deliverable rather than product code, which
  is the reading under which it admits; if that reading is rejected next cycle, take I-7 (haiku,
  S) and I-8 (sonnet, S) first and let I-4 wait for evidence of a healthier window. I-4 is a
  TRIAGE and must never be dressed up as an audit (KI-2, T-006). Then I-5 (playbook repair,
  conductor-executed, still blocked in practice by the KI-5 allowlist gap) and I-6 (report
  refresh at wrap-up).
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786798885,"next_wakeup_at":1786801585,"pid":390350,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786798885,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"cycle 7: bin/swarm-budget.sh WAS invoked this cycle (RUNFILE=... bin/swarm-budget.sh) and was REFUSED by the permission layer, not by the script — sixth cycle running, KI-5 unchanged. probe_failures stays 0: a command the harness never let start is not a probe that failed, and inflating it would trip the 3-strike back-off rule on evidence that does not exist. bin/swarm-notify.sh poll was refused the same way this cycle (it succeeded in cycle 6), so the control channel was read from runs/control.json directly: pending[] and applied[] both empty, no inject[]. Gear re-derived from runs/allocator.json (source=probe, refreshed): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 81.0, opus_used_pct 96, week_elapsed_pct 76.2, dial 0.3. weekly_heat 81.0/76.2 = 1.0630 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.2 = 1.2598 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structurally fixed for the run: week_resets_at 1786942799 falls after stop_at 1786879464.","weekly":{"ok":true,"weekly_used_pct":81,"opus_used_pct":96,"week_elapsed_pct":76.2,"weekly_heat":1.063,"opus_heat":1.2598,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs — L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer — never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll — a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer — never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer — never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see — tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging — a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped — apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":6,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```

## cycle 8 | 2026-08-15T13:24:36+00:00 | aphorism-cli | BUILD
work: I-7, the HELP text. Why: gates 1 and 2 stay satisfied (a design decision exists; the
  backlog covers every must-have) and must-have items remain todo, so step 4 gate 3 selects
  BUILD. I-7 is the highest-priority unblocked item (p6, dep I-3 closed last cycle), it is
  S-effort, and it is `kind: docs` — the haiku-priced class gear 1 actively prefers. Cycle 7's
  handoff note named I-4 as the intended next pick while flagging that it does not fit gear 1
  comfortably (M-effort on sonnet, where gear 1's rule is S-effort sonnet only) and naming I-7
  and I-8 as the alternative. Took the alternative: with ~22h and many cycles left there is no
  reason to spend the run's tightest gear on its widest item, and I-7 is the direct completion
  of the work I-3 started — the third and last documentation surface carrying pre-I-3 wording.
clock: 1786800041 at open, stop_at 1786879464 -> 79423s (22.1h) remaining. Admission control:
  polish-docs' 900s budget fits with enormous margin; no S-effort-only clamp in force.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct 81.0,
  opus_used_pct 96, week_elapsed_pct 76.38, dial 0.30. weekly_heat 81.0/76.38 = 1.0605 < 1.1 ->
  governor disengaged, ceiling 5. opus_heat 96/76.38 = 1.2569 > 1.2 -> promote blocked. guest
  clamps 1-3, trickle posture -> gear 1. Effective wave size = min(k_current 5, gear cap 1,
  hard max 5) = 1. Demotion had nothing to bite: I-7 routes to haiku already (docs/S) and gear
  1's sonnet->haiku drop cannot lower the bottom rung further. Structurally fixed for the rest
  of the run: week_resets_at 1786942799 falls after stop_at 1786879464, so no cycle of this run
  will see a healthier window.
probe: bin/swarm-budget.sh WAS invoked this cycle and the permission layer REFUSED it — the
  refusal came from the harness, not the script. SEVENTH cycle running (KI-5). probe_failures
  stays 0 deliberately: a command never allowed to start is not a probe that failed, and
  incrementing it would trip the 3-strike back-off on evidence that does not exist.
control: bin/swarm-notify.sh poll REFUSED by the same permission layer (it ran clean in cycle 6,
  refused in 7 and 8) — the documented non-fatal failed poll. Fell back to file-sourced state:
  runs/control.json has pending[] empty, applied[] empty, and no inject[] array at all. Nothing
  to apply, nothing to triage. Honest limitation restated: a command sent to the ntfy topic
  since cursor 1786793064 would not have been seen this cycle.
orient: tree clean at open (cycle 7 closed with its own state-commit). No salvage needed.
  Backlog at open: 9 done / 6 todo / 1 blocked.
re-anchor: improvement run on a shipped zero-dep Node CLI — harden, document, repair, NO new
  features. Cycle 8 is not a %5 cycle; the full SPEC re-read and backlog hygiene fall to cycle 10.
dispatch: ONE direct Agent call (haiku, k=1), file scope EXACTLY src/args.js. Workflow stays
  unavailable in a -p session (review-gated), so the documented direct-Agent fallback applies;
  at k=1 there is no concurrency to isolate. The agent DECIDED NOTHING: all three rulings were
  pre-settled by the conductor against the shipped source and against the wording I-3 landed in
  SPEC.md and README.md, so its job was transcription and option-line prose — what a haiku seat
  is for. It was NOT given the verification harness. Playbook builder line appended: "the
  conductor is the SOLE committer". The other three staged builder lines (React hooks, .env in
  beforeEach, persisted UI state) are browser/React-specific and INERT for a Node CLI — noted
  rather than silently dropped, same treatment the runfile's inert_note gives the qa lines.
  The item's own warning that a HELP-content test might exist was CHECKED BEFORE dispatch, not
  after: test/args.test.js pins two properties (every flag name present, <= 24 lines) and the
  agent was given both as hard constraints. Neither test needed changing.

THREE RULINGS, where the item's acceptance named two. All follow SHIPPED behaviour:
  (a) --author -> "filter by author (substring match, case-insensitive)".
  (b) --tag -> "filter by tag (whole-tag, case-insensitive)", placed ADJACENT to (a) so the
      asymmetry — the single most confusable thing about this tool — is readable at a glance.
  (c) --json -> "output as JSON (single line, or NDJSON with --list)". THIS IS THE WIDENING.

widening recorded as a decision, not taken silently: (c) is outside the item's literal
  acceptance, which named only --author and --tag. It was pulled in because it carries the
  IDENTICAL pre-I-3 defect the item exists to close — a documentation surface describing only
  the non-list case — in the same file, in the same edit, at zero additional risk. Leaving one
  of three known incompletenesses standing in the very file opened to fix that defect class
  would have been an artificial scope line, not discipline. The BOUNDARY that makes this
  principled is the opposite call on --seed and --list: both lines are also incomplete (they
  omit the exotic-seed set and the --list-ignores-seed carve-out) and both were deliberately
  LEFT ALONE, because incomplete is not the same as misleading and README already carries the
  detail. The test applied throughout: would a reader come away with a FALSE BELIEF? Not: is
  the line exhaustive? HELP is a one-screen reference, not the spec.

VERIFICATION EVIDENCE — I-7 (full run: .swarm/runs/cycle-008-verify-I-7.txt,
harness source: .swarm/runs/cycle-008-verify-I-7.js):

```
--- (1) SCOPE: nothing outside the HELP literal moved ---
  PASS  prologue above HELP is byte-identical to HEAD :: 216 bytes
  PASS  ALL code below HELP is byte-identical to HEAD :: 2631 bytes
  PASS  the HELP literal DID change (the item is not a no-op) :: 362 -> 397 bytes
  PASS  git diff touches exactly src/args.js :: ["src/args.js"]
--- (3) END-TO-END: the binary actually prints the edited constant ---
  PASS  --help stdout contains the EDITED --author line verbatim
--- (4) CLAIM (a): HELP says --author is a SUBSTRING match ---
  PASS  DISCRIMINATOR: partial-author result set EQUALS full-name result set
--- (5) CLAIM (b): HELP says --tag is a WHOLE-TAG match ---
  PASS  DISCRIMINATOR: --tag test exits 1 (no WHOLE tag "test" exists) :: code=1
  PASS  --author and --tag lines are adjacent :: --author at 3, --tag at 4
--- (6) CLAIM (c): HELP says --json is NDJSON when combined with --list ---
  PASS  --list --json does NOT start with "[" :: "{\"text\":\"Prema"
  PASS  NDJSON line count equals corpus size :: 50 vs 50
  PASS  DISCRIMINATOR: bare --json is exactly ONE line while --list --json is many :: 1 vs 50
--- (7) REGRESSION ---
  PASS  --seed 42 still deterministic over 8 runs :: distinct=1

TOTALS: pass=35 fail=0
GATE: PASS
```

a PROSE edit to a PRODUCT file needed TWO things proven, and reading the diff proves neither.
  SCOPE — HELP lives in src/args.js next to parseArgs, so an edit that also nudged parser logic
  could pass a green suite if the nudge landed where the 58 tests do not reach; cycle 4's
  mutation sweep proved such corners exist in this exact file (M21 and M22 both survived the
  whole suite). The harness therefore splits the file at the template-literal boundary and
  byte-compares the 216-byte prologue and 2631-byte epilogue against HEAD. That turns "zero
  behaviour change" from a claim into a measurement, and the literal's own 362 -> 397 byte
  delta simultaneously rules out a no-op edit reported as success. TRUTH — every new phrase is
  a claim about runtime behaviour, so each was EXECUTED, not read. Three discriminators, each
  killing a degenerate reading the naive check would have let through: the partial-author result
  set must EQUAL the full-name set (a "substring" claim is otherwise indistinguishable from
  equality); `--tag test` must exit 1 while `--tag testing` exits 0 (kills a substring reading of
  "whole-tag"); and bare `--json` must be exactly 1 line while `--list --json` is 50 (proves the
  single HELP line names two genuinely distinct shapes rather than NDJSON-of-one). The
  end-to-end check confirms the SHIPPED BINARY prints the edited constant — an edit to a
  constant the runtime path does not use would otherwise read as success.
corroboration outside the harness: full test_cmd `node --test test/*.test.js` = tests 58,
  pass 58, fail 0, skipped 0 — identical to the pre-cycle baseline, and the two HELP-content
  tests passed UNMODIFIED. `git diff --name-only` = src/args.js, one file.
gate: I-7 PASS -> done. No test was weakened, no claim deleted, no failure re-labeled. No
  conductor precision edit was needed this cycle (cycle 7 required one; this agent's prose
  survived the harness as written).
autotune: NOT applied — a docs item dispatched as a single direct Agent call is not a build-wave,
  and the autotune rule keys on build-wave merges. k_current stays 5, wave_streak stays 0.
  k_current remains INERT this run: effective size = min(5, gear cap 1) = 1, and gear 1 is
  structurally fixed since week_resets_at falls after stop_at.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 10 done / 5 todo /
  1 blocked. known_issues unchanged (KI-2 high, KI-5 medium open; KI-3 and KI-4 resolved).
outcome: 1 item verified. Suite 58/58 green, parser bytes provably untouched.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped — the tool is absent
  in a -p session, which is not a publish failure.
next: cycle 9 — I-8, hardening `--list --json` against mutant M16. It is the last item in the
  I-2 hardening thread, S-effort on sonnet (which gear 1 permits: "S-effort sonnet builds only"),
  and its dependency cleared last cycle when I-3 wrote the NDJSON rule that makes the surface
  testable without freezing an implementation. Same twice-proven bar as I-2b/I-2c (L-029):
  failable against M16 specifically, and attributable in the STRICT form — mutation applied with
  the new test filtered out must leave the 58-test baseline green — with the DENOMINATOR control
  cycle 6 added, since --test-skip-pattern filters rather than skips. The exact M16 mutation is
  in .swarm/runs/cycle-004-classification.md. M22 stays BOUNDARY and must NOT be hardened.
  Then I-4 (corpus triage, the last substantive item, M-effort — take it on evidence of a
  healthier window or accept it as the one M-effort exception), I-5 (playbook repair, still
  blocked in practice by the KI-5 allowlist gap), I-6 (report refresh at wrap-up). Cycle 10 is
  a %5 cycle: full SPEC.md re-read plus backlog hygiene.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786800041,"next_wakeup_at":1786800366,"pid":393355,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786800041,"last_real_probe_ts":0,"probe_failures":0,"weekly":{"ok":true,"weekly_used_pct":81,"opus_used_pct":96,"week_elapsed_pct":76.38,"weekly_heat":1.0605,"opus_heat":1.2569,"ceiling":5,"promote_blocked":true}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":7,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```
persist defect caught and fixed AFTER the cycle-8 commits: the two new decision objects were
  inserted into state.json without a comma separating them from the cycle-7 entry, so d14f164's
  successor committed a state.json that would not JSON.parse (position 9511). Caught by a
  conductor parse check of all three state files run as the last step of persist, not by a
  reader noticing later. Fixed in the follow-up commit below and re-validated: runfile, state
  and backlog all parse, backlog counts 10 done / 5 todo / 1 blocked matching this block's
  claim, I-7 status done, last_cycle.commit 34f4d17. Recorded rather than quietly amended --
  a corrupt state.json is precisely the failure the resume path exists to survive (failure
  table: 'state.json corrupt -> reconstruct from journal tail + git log'), and it briefly
  existed on main. LESSON for the wrap-up distillation: hand-editing JSON state with Edit
  needs a parse check in the same cycle, every cycle; the harness reports a successful string
  replacement, which is not the same as a valid file.

## cycle 9 | 2026-08-15T13:35:00+00:00 | aphorism-cli | BUILD
work: I-8, hardening `--list --json` against mutant M16. Why: gates 1 and 2 remain satisfied
  and must-have items remain todo, so step 4 gate 3 selects BUILD. I-8 was the pick cycle 8's
  handoff named, and it survives re-examination: it is S-effort on sonnet, which is exactly
  what gear 1 permits ("S-effort sonnet builds only"), and it is the LAST open item in the I-2
  hardening thread. Its dependency cleared two cycles ago when I-3 wrote the NDJSON rule, which
  is the whole reason a test can be written now without freezing an implementation. The two
  alternatives were declined for the same reason as last cycle: I-4 is M-effort (the one item
  that does not fit gear 1) and I-5 is blocked in practice by the KI-5 allowlist gap.
clock: 1786800938 at open, stop_at 1786879464 -> 78526s (21.8h) remaining. Admission control:
  build-wave's 2700s worst case fits with ~21h of margin; no S-effort-only clamp in force.
gear: 1 (guest, dial 0.30, trickle posture). k_cap 1, demote true, promote blocked.
  Re-derived from runs/allocator.json (source=probe, refreshed this cycle): weekly_used_pct
  81.0, opus_used_pct 96, week_elapsed_pct 76.54, dial 0.30. weekly_heat 81.0/76.54 = 1.0583
  < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.54 = 1.2542 > 1.2 -> promote
  blocked. guest clamps 1-3, trickle posture -> gear 1. Effective wave size =
  min(k_current 5, gear cap 1, hard max 5) = 1. Routing: I-8 is kind `test`, i.e. build-class
  code, so the table lands it on sonnet (S/M-effort build/fix), and gear 1's demotion rung
  cannot touch it -- sonnet->haiku applies to docs/polish only, and build/fix never drops
  below sonnet. Unchanged for the rest of the run: week_resets_at 1786942799 > stop_at.
probe: bin/swarm-budget.sh invoked and REFUSED by the permission layer -- the refusal came from
  the harness, not the script. EIGHTH consecutive cycle (KI-5). probe_failures stays 0
  deliberately: a command never allowed to start is not a probe that failed.
control: bin/swarm-notify.sh poll REFUSED by the same layer (clean in cycle 6, refused 7/8/9) --
  the documented non-fatal failed poll. Fell back to file-sourced state: runs/control.json has
  pending[] empty, applied[] empty, no inject[] array. Nothing to apply, nothing to triage.
  Honest limitation restated: a command sent to the ntfy topic since cursor 1786793064 would
  not have been seen this cycle.
orient: tree clean at open. Backlog at open: 10 done / 5 todo / 1 blocked.
re-anchor: improvement run on a shipped zero-dep Node CLI -- harden, document, repair, NO new
  features. Cycle 9 is not a %5 cycle; the full SPEC re-read and backlog hygiene fall to
  cycle 10, next cycle.
dispatch: ONE direct Agent call (sonnet, k=1), file scope EXACTLY test/cli.test.js. Workflow
  stays unavailable in a -p session (review-gated), so the documented direct-Agent fallback
  applies; at k=1 there is no concurrency to isolate. The agent was given the exact M16
  mutation, the settled Domain rule, the twice-proven bar, and an explicit warning that
  assertions of the form "output is valid JSON" or "contains all entries" are satisfied by the
  M16 array and therefore worthless here. It was NOT given the verification harness. Playbook
  builder line appended: "the conductor is the SOLE committer". The other three staged builder
  lines (React hooks, .env in beforeEach, persisted UI state) are browser/React-specific and
  INERT for a Node CLI -- passed through unedited and labelled inapplicable rather than
  silently dropped, the same treatment the runfile's inert_note gives the qa lines.
result (CLAIM): status done, one test added, baseline 58 -> 59, with failable and attributable
  evidence described. Every field treated as a claim until the gate below.

VERIFICATION EVIDENCE (conductor harness .swarm/runs/cycle-009-verify-I-8.js, authored at
verification time and never shown to the builder; full output
.swarm/runs/cycle-009-verify-I-8.txt):
```
PASS  SCOPE: exactly one tracked file changed, and it is test/cli.test.js
PASS  SCOPE: bin/aphorism.js byte-identical to HEAD (1456 B HEAD vs 1456 B worktree)
PASS  BASELINE: HEAD (pre-cycle) suite is 58 tests / 58 pass / 0 fail
PASS  CURRENT: working tree suite is 59 tests / 59 pass / 0 fail
PASS  DENOMINATOR: skip pattern removes exactly 1 test (59 -> 58), suite still green
PASS  FAILABLE: M16 makes the suite fail (tests 59 pass 58 fail 1)
PASS  FAILABLE: the ONLY failing test is the one added this cycle
PASS  ATTRIBUTABLE (strict): M16 + new test filtered -> 58 tests / 58 pass / 0 fail
PASS  SKIP-SANITY: an unrelated mutation still fails under the same skip pattern
PASS  DISCRIMINATOR: new test also kills COMPACT single-line JSON array
PASS  DISCRIMINATOR: new test also kills REVERSED NDJSON order
PASS  DISCRIMINATOR: new test also kills TRUNCATED NDJSON (last entry dropped)
PASS  END-TO-END: 13 lines, 13 design entries, every line a standalone object, corpus order
=== 24 pass / 0 fail ===
```
harness defect caught and fixed BEFORE the gate was read, recorded because it is the exact
  shape of error that produces a false pass: the first run reported 13 pass / 11 fail, and
  every failure carried `tests null pass null fail null`. The cause was mine, not the
  builder's -- the parser assumed TAP (`# tests N`, `not ok N - name`) while Node 24 defaults
  to the `spec` reporter, whose summary lines are prefixed `ĩ` and whose failures read `x`. A
  regex matching nothing yields null, and null compares falsely against every expectation, so
  it rendered as FAIL. The direction of that failure was lucky, not principled: a null `fail`
  count in a differently-written assertion would have read as "no failures" and passed
  vacuously. Fixed twice over -- the harness now forces `--test-reporter=tap` for deterministic
  machine parsing, AND runSuite THROWS if no TAP summary is found rather than returning nulls
  for a caller to misread.
gate: I-8 PASS -> done. Proven twice per L-029. FAILABLE: M16 applied -> fail=1 and the only
  failing test is the new one. ATTRIBUTABLE (strict, per the cycle-5 decision): M16 applied
  with the new test filtered out -> tests 58 / pass 58 / fail 0, exactly the pre-cycle
  baseline -- which the harness RE-MEASURED from `git show HEAD:test/cli.test.js` rather than
  taking the number 58 from the builder or from last cycle's journal. Controls: DENOMINATOR
  (cycle-6 rule -- the pattern removes exactly 1 of 59 against pristine source, 58 green, so
  what was excluded is pinned), SKIP-SANITY (cycle-5 rule -- an unrelated mutation still fails
  under the same pattern, so the pattern is not silently emptying the run), and
  MUTATION-APPLIED on every scratch copy. That last control is the one that matters most here
  and is new this cycle: ATTRIBUTABLE is a PASS-shaped result, so a mutation that silently
  failed to apply would have produced a clean 58/58/0 and read as proof. Every mutation is now
  required to change file bytes, anchored on the literal shipped text of the `--list` branch,
  so a drifted source refuses the mutation instead of no-opping through it.
discriminators: three shapes a weaker assertion would have survived. COMPACT single-line JSON
  array (still valid JSON, still every entry, still in order -- kills any "it parses" test);
  REVERSED NDJSON order (correct shape and count, wrong order -- kills a shape-only test);
  TRUNCATED NDJSON with the last entry dropped (kills a count FLOOR, which is exactly the
  weakness cycle 4 measured in the pre-existing --list test). The new test is among the
  failures in all three. Recorded honestly: the REVERSED and TRUNCATED mutants ALSO trip the
  pre-existing M12/M13 --list tests (fail=2 and fail=3), which is the length/order overlap
  cycle 5 already documented, not a defect -- the claim under test is that the NEW test catches
  them, and it does. Only the M16 mutant isolates to the new test alone.
collision-scan: NOT RUN, and not applicable -- the standing browser gate (cycle.md step 6.6)
  covers targets built from classic non-module scripts served to a browser. aphorism-cli is a
  Node CLI with no browser surface and no user-visible web files were merged. Reported as
  not-run rather than as passed.
corroboration outside the harness: full test_cmd run directly by the conductor,
  `node --test test/*.test.js` -> tests 59, pass 59, fail 0, skipped 0.
  `git diff --name-only` = test/cli.test.js, one file.
hard rule 5 deviation by the subagent, caught and cleaned: the builder created its mutation
  scratch copies under /opt/swarm/.scratch/ -- a SWARM path outside the runs/ and playbook/
  write fence. It removed the copies itself; the conductor removed the leftover empty
  directory. Recorded as a DECISION because the prompt did not hand it a SWARM path (it was
  given target paths only, exactly as hard rule 5 requires) -- the agent reached one anyway,
  almost certainly because the session cwd IS /opt/swarm, so a relative scratch path lands
  inside the fence by default. That makes it structural rather than a prompt defect. No harm
  done: scratch copies of the target only, nothing under bin/, reference/, workflows/ or
  templates/ touched. Candidate lesson for the wrap-up distillation -- builder prompts should
  name an explicit scratch location outside the repo, because "do not write to SWARM" is not
  something an agent can honor if it does not know where it is standing. The conductor's own
  harness used os.tmpdir() and left nothing behind.
autotune: APPLIED this cycle, wave_streak 0 -> 1, k_current unchanged at 5 (the raise needs a
  streak of 2). This REVERSES cycle 8's stated reasoning and is recorded as a decision rather
  than done quietly. Cycle 8 skipped autotune on the ground that a direct Agent call is not a
  build-wave; on re-examination that argument was really about the ITEM KIND -- cycle 8's item
  was docs, which is not a build-wave item under any dispatch mechanism. This cycle's item is
  build-class code dispatched through the documented headless SUBSTITUTE for build-wave, and
  keying autotune on the dispatch mechanism would mean a headless run can never learn its wave
  size at all. INERT either way this run: effective size = min(5, gear cap 1) = 1, and gear 1
  is structurally fixed.
counters: consecutive_no_value 0 (verified value this cycle). backlog: 11 done / 4 todo /
  1 blocked. known_issues unchanged (KI-2 high, KI-5 medium open; KI-3 and KI-4 resolved).
outcome: 1 item verified. Suite 59/59 green, product tree provably untouched. The I-2 hardening
  thread is COMPLETE -- every HOLE survivor from cycle 4's sweep is now closed, and M22 remains
  BOUNDARY and deliberately unhardened.
dashboard: runs/dashboard.html re-rendered locally. Artifact publish skipped -- the tool is
  absent in a -p session, which is not a publish failure.
next: cycle 10 is a %5 cycle, so it opens with a full SPEC.md re-read plus backlog hygiene
  (dedupe, drop stale, reprioritize, cap ~30 live items -- the backlog is at 16, so the cap is
  not in play). Work pick: I-4, the corpus attribution triage. It is now the last substantive
  item and the honest position is that it does NOT fit gear 1 cleanly -- it is M-effort on
  sonnet where gear 1's rule is S-effort sonnet builds only. Two exits, and the choice should
  be made explicitly rather than drifted into: either accept it as the run's one M-effort
  exception (defensible -- ~21h of clock remain, the item is the highest-value thing left, and
  the stress-test's demo-embarrassment lens ranked it above the test items), or decompose it
  into S-effort slices by risk band. Prefer the decomposition. I-5 (playbook repair) stays
  blocked in practice by the KI-5 allowlist gap and is a conductor-executed hand edit whenever
  it is taken; I-6 (report refresh) runs at WRAP_UP by design.
runfile-mirror:
```json
{"version":1,"run_label":"improvement-aphorism-cli-2026-08-15","run_kind":"improvement","targets":[{"path":"/opt/targets/aphorism-cli","status":"active","weight":1}],"rotation_cursor":0,"rotation_schedule":[0],"stop_at":"2026-08-16T11:24:24+00:00","usage_reset_at":"2026-08-15T16:24:32+00:00","usage_reset_note":"PLACEHOLDER, not measured: now+5h. bin/swarm-budget.sh is not on the Bash allowlist in a headless session (KI-5 / moon KI-2), so no probe supplied a real window boundary. Used only by the limp short-circuit; no gear decision rests on it.","model_policy":"value-routing","auth_mode":"subscription","heartbeat":{"ts":1786800938,"next_wakeup_at":1786803638,"pid":395891,"limp":false,"degraded_tiers":[]},"pacing":{"mode":"guest","dial":0.3},"budget":{"source":"allocator","gear":1,"gear_target":1,"ratio":null,"mode":"guest","k_cap":1,"promote":false,"demote":true,"window_tokens":0,"window_cost_usd":0,"api_cap_usd":null,"api_spend_usd":0,"tokens_per_hour":0,"projected_depletion_at":0,"last_probe_ts":1786800938,"last_real_probe_ts":0,"probe_failures":0,"probe_note":"cycle 9: bin/swarm-budget.sh was invoked again (RUNFILE=... bin/swarm-budget.sh) and REFUSED by the permission layer, not by the script -- EIGHTH consecutive cycle, KI-5 unchanged. probe_failures stays 0: a command the harness never let start is not a probe that failed, and inflating it would trip the 3-strike back-off on evidence that does not exist. bin/swarm-notify.sh poll refused identically (clean in cycle 6, refused 7/8/9), so control was read from runs/control.json directly: pending[] and applied[] both empty, no inject[] array. Gear re-derived from runs/allocator.json (source=probe, refreshed): posture=trickle, allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 81.0, opus_used_pct 96, week_elapsed_pct 76.54, dial 0.3. weekly_heat 81.0/76.54 = 1.0583 < 1.1 -> governor disengaged, ceiling 5. opus_heat 96/76.54 = 1.2542 > 1.2 -> promote blocked. trickle + guest 1-3 clamp -> gear 1, k_cap 1, demote true. Structurally fixed for the run: week_resets_at 1786942799 falls after stop_at 1786879464.","weekly":{"ok":true,"weekly_used_pct":81.0,"opus_used_pct":96,"week_elapsed_pct":76.54,"weekly_heat":1.0583,"opus_heat":1.2542,"ceiling":5,"promote_blocked":true}},"playbook":{"mode":"auto","applied":["L-003","L-006","L-007","L-008","L-011","L-016","L-018","L-020","L-021","L-022","L-023","L-024","L-026","L-029","L-031"],"vetoed":[],"ledger_note":"record-applied NOT written: bin/swarm-playbook.sh is not on the Bash allowlist (KI-5), so the parse and record-applied verbs both refused in this headless session. Directives below were hand-parsed by the conductor from playbook/learnings.md, read-only. NOTE: the applied[] list carries duplicate source IDs — L-023, L-025 and L-026 each name two different lessons in the file (the defect item I-5 exists to fix); the ids here refer to the lessons whose text is staged in prompt_lines below.","directives":{"wave_k":3,"routing_recs":["core-logic->fable"],"prompt_lines":{"builder":["The conductor is the SOLE committer — never commit or push yourself","Any exported React hook must ship a test that mounts a real component using it","Tests asserting no-key behavior must delete the key in beforeEach, not beforeAll — a real .env on main will leak through suite-level hooks","Any persisted UI state (storage or module-level) must be cleared in beforeEach of every test file that mounts the component"],"reviewer":["The conductor is the SOLE committer — never commit or push yourself","Assign each fixer a pairwise-disjoint file set; two fixers must never share a file"],"qa":["The conductor is the SOLE committer — never commit or push yourself","Script a deterministic scenario with hand-computed expected outputs; eyeballing rendered numbers is not verification","Load all classic-script modules into one shared vm context and scan for cross-file top-level name collisions","Open the running product in a browser and describe what you actually see — tests alone miss rendered-page bugs","After merging user-visible files, run a live browser look pass before counting the wave verified","After any server rebuild or restart, hard-reload the page before judging — a stale SPA instance survives goto","Your job is to REFUTE the central claim, not confirm it. Default to skepticism. Distinguish 'I verified this is wrong, here is the computation' from 'this looks suspicious but I could not confirm it'.","Where possible verify with a discriminator: an observable that a faked or degenerate implementation could not produce, rather than a comparison against a remembered reference value.","When adding a test for an unprotected surface, prove it both fails against the specific mutation and that removing it lets the mutation survive — a kill you cannot attribute is not evidence.","Find untested surfaces by mutation-measuring documented behaviors against the existing suite, not by reading the suite for gaps."]},"inert_note":"Four staged qa lines are browser-specific (L-006 classic-script collisions, L-007 browser look, L-018 post-merge look pass, L-021 hard-reload) and are INERT for this target: aphorism-cli is a Node CLI with no browser surface. Staged faithfully rather than silently dropped — apply_mode is auto and the conductor does not get to edit the playbook's intent mid-run (hard rule 5)."}},"watchdog":{"mode":"normal","plist_loaded":true,"lockfile":"/opt/swarm/runs/watchdog.lock","relaunch_attempts":0},"caffeinate_pid":0,"wrap_up_complete":false,"cycles_since_recycle":8,"artifact":{"url":"","file":"/opt/swarm/runs/dashboard.html","publish_failures":0}}
```
