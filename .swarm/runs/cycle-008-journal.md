
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
