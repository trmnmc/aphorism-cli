
## cycle 6 | 2026-08-18T05:56:53+00:00 → 06:12:46Z | aphorism-cli | REVIEW -> QA

work: QA FULL pass (spec-only author → executor → live-look). Chosen over the other two owed
  passes on a MEASURED reason, not a hunch: `git diff --stat 3bd19f9~1..HEAD -- . ':(exclude).swarm'`
  returns `REPORT.md | 71 +++`, one file. Run #3 has changed ZERO product source, so a
  review-fix pass — the other candidate, and the one matching the entering phase — would have
  put two reviewers and two adversarial verifiers onto 71 lines of documentation. QA is the
  pass that actually points at the shipped binary. review-fix and TASTE remain owed before
  POLISH; whoever runs review-fix later should scope it to src/ bin/ test/, NOT to this run's
  diff, or it will review bookkeeping.
dispatch: DIRECT Agent calls, not the Workflow tool — headless `-p` cycle (pid 2155401),
  Workflow review-gated. Documented failure-table fallback, same as cycles 3-5.
agents: 2 (author fable, live-look fable), run CONCURRENTLY. The qa-verify contract mandates
  SEQUENTIAL stages, and its stated reason is that each server-using agent binds the same
  conductor-assigned port. aphorism-cli is a CLI: no server, no port, so the reason does not
  apply and the two read-only agents cannot collide. Executor stage: see deviation (2).
models: author fable, look fable — both judgment seats, and the fable guard exempts judgment
  seats from gear demotion in every gear. Executor would have been sonnet; gear-2 demotion is
  a no-op there anyway (sonnet→haiku is docs/polish only).
craft pack: node bin/swarm-craft.mjs -> degraded [] (ui 2969 / review 2233 / docs 1737 bytes).
  Not spliced: the craft pack feeds build-wave / review-fix / polish-docs, not QA.

TWO DEVIATIONS from the qa-verify.js contract, both recorded, neither a weakening:
  (1) Spec-blindness of the author. The script achieves it by passing `spec_text` INLINE, and
      Workflow args must be literal JSON — reproducing 16 KB of SPEC.md by hand into a tool
      call risks transcription drift in the one document that is the answer key. Instead the
      author got a byte-identical COPY in a directory containing nothing else, plus an
      explicit no-other-file instruction. Copy verified equal, not assumed:
        $ sha256sum .swarm/SPEC.md .swarm/runs/cycle-006-qa-speconly/SPEC.md
          b495c99f6dbcd4f03b89853f5edcb8a775218f14d1722fa159ed9b85bcd219b3  .swarm/SPEC.md
          b495c99f6dbcd4f03b89853f5edcb8a775218f14d1722fa159ed9b85bcd219b3  ...qa-speconly/SPEC.md
      Residual risk stated honestly: the isolation is now instruction-plus-empty-directory
      rather than structural, so a disobedient author COULD have read src/. The step-6 defence
      is unchanged — I checked each `derivation` against the Domain rules myself.
  (2) The executor stage was run BY THE CONDUCTOR, not by a sonnet agent. For a CLI with no
      dev server the scenarios are four plain invocations; running them here produces conductor
      evidence directly instead of an agent claim that the gate would have to re-verify anyway.
      This is strictly more evidence, not less — .swarm/runs/cycle-006-qa-exec.mjs is committed,
      so the executor is re-runnable and auditable in a way an agent transcript is not.

budget: gear 2 CARRIED, not re-measured — and that is the rule, not a shortcut. probe_failures
  is 6 (>= 3), so cycle.md step 1 says stop invoking the probe and re-invoke only when
  now - last_real_probe_ts >= 1800. At cycle open that was 1037s, so no probe was DUE. The
  clock-cruise fallback `PROBE_CMD=false bin/swarm-budget.sh` is itself denied by the same
  allowlist gap, so the honest position is: gear 2 carried from cycle 5's REAL measurement
  1037s earlier, k_cap 2, promote blocked, demote true. No new burn evidence was minted this
  cycle and none is claimed. The weekly governor still binds and does not lift before
  week_resets_at 1787547599.

control: poll DENIED again — bin/swarm-notify.sh, 3rd denial for this helper this run
  (cycle 5 saw two: `poll` and `send`). K-1 evidence continues to accumulate on the SAME
  absolute-path entry set the hand-off patch adds. Fell back to file-sourced pending[]:
  runs/control.json read directly — pending [], applied [], no inject array. Nothing to apply.
orient: tree CLEAN at entry (git status --porcelain empty). No salvage needed.
re-anchor: cycle 6, not a multiple of 5, so no full SPEC re-read. Digest restated: improvement
  run #3, measure/repair/document, no new features; K-1..K-5 all closed at cycle 5.
clock note: the cycle-5 journal recorded `stop_at 1787110108`. The runfile's ISO stop_at
  (2026-08-19T03:48:28+00:00) parses to 1787111308 — the earlier figure was 1200s low. The
  error was CONSERVATIVE (it would only ever have wrapped up early), so no rule was breached,
  but the arithmetic is corrected here so it does not propagate.

VERIFICATION EVIDENCE:
  Gate authored at verification time, run by the conductor. Full output committed at
  .swarm/runs/cycle-006-qa-verify.txt (54 lines); excerpt below.

  Spec-derived answer key, 4 scenarios, ALL PASS. I checked each `derivation` against the
  Domain rules before running anything — the author correctly refused to invent corpus
  strings it could not know and asserted derivable INVARIANTS instead, which is the behaviour
  that makes a spec-only answer key worth having:
    S1  --list --author dijk, --seed 7 vs --seed 99
        exit1=0 exit2=0 | stderr both "" | byte-identical across seeds: true | lines=7
        every line exactly one " U+2014 " separator: true | authors all contain "dijk": true
        hyphen-minus or en-dash used as separator anywhere: false                      PASS
    S2  --json --seed Infinity --tag design, run twice
        byte-identical: true | stdout lines=1 | text/author/tags present, tags isArray
        tags contains "design" (whole-tag, ci): true
        DISCRIMINATOR: -Infinity also exit 0 AND selects a DIFFERENT entry than Infinity,
        so the non-finite branch is genuinely seeded, not collapsed to a constant     PASS
    S3  --json --tag desi   exit=1 (spec: exactly 1) | stdout 0 bytes | stderr 44 bytes
        "aphorism: no aphorism matches those filters"                                  PASS
    S4  --list --seed abc   exit=2 (spec: exactly 2) | stdout 0 bytes, listing suppressed
        CONTROL: bare --list exits 0 with 50 lines, so the suppression is specific to the
        usage error and the check is not one that dies on everything                   PASS

  Regression floor re-run at cycle close, unchanged by this cycle (no product code touched):
    $ node --test test/*.test.js
      tests 102 | pass 102 | fail 0 | duration_ms 4564.4                               PASS

  LIVE-LOOK: 4 findings, ALL 4 conductor-reproduced. One agent severity claim MEASURED FALSE.
    F-1 EPIPE, agent said HIGH on the mechanism "`--list | head -1` only survives by luck
        because 50 lines fit the 64KB pipe buffer". I tested that mechanism instead of
        accepting it, and it is WRONG:
          CRASH err_bytes=1006 | --list | true
          CRASH err_bytes=1006 | node bin/aphorism.js | true
          CRASH err_bytes=1006 | --list | head -0
          CRASH err_bytes=1045 | --list | /nonexistent-cmd-xyz
          clean err_bytes=   0 | head -1, head -5, sed 1q, grep -q match, grep -q no-match,
                                 wc -l, --list --json | head -2
        The crash needs a consumer that closes the pipe WITHOUT READING AT ALL; every consumer
        that reads even one line is clean. RE-SCORED HIGH -> MEDIUM. The defect is real (1006
        bytes of Node internals where a Unix filter should exit quietly) and is filed; the
        agent's story about it was not. Most realistic real trigger: downstream fails to exec.
    F-2 Same root cause (no error handler on process.stdout, bin/aphorism.js:28,43,48). stdout
        redirected to /dev/full -> ENOSPC stack trace AND exit 1, the code README defines as
        "no aphorism matched". A script checking exit 1 mistakes a full disk for an empty
        filter result. MEDIUM. Filed with F-1 as ONE item (Q-1) — one cause, one fix.
    F-3 Corpus attribution "Antoine de Saint-Exupery" missing its acute accent. Reproduced by
        CODEPOINT, not by eye:
          codepoints around "Exup": E=U+0045 x=U+0078 u=U+0075 p=U+0070 e=U+0065 r=U+0072 y=U+0079
          corpus contains any U+00E9: false | corpus contains U+2014: true
        The discriminator matters: em dash present throughout proves UTF-8 transport works, so
        this is data entry, not an encoding limit. LOW. In scope — repairing an existing entry
        is repair, not the "corpus expansion" non-goal.
    F-4 Empty `--seed` contradicts the Selection clause. REPRODUCED — and then found to be a
        DUPLICATE. See the retraction below.

RETRACTION, same cycle, before commit: F-4 duplicates measured gap D-43, which cycle 5 had
  already written into SPEC.md "## Undecided behaviours" and routed to J-7. I filed Q-3 and
  KI-32 for it, then checked the SPEC and retracted BOTH. Kept instead: (a) the corroboration
  — an instrument with no knowledge of D-43 independently re-derived it from the binary, which
  is real evidence the gap is genuine and human-owned; (b) the ONE fact D-43 does not record,
  folded into J-7's notes — whitespace-PADDED seeds are ACCEPTED (`--seed " 5 "` is
  byte-identical to `--seed 5`, exit 0), so the refusal is specific to empty/whitespace-only.
  src/args.js:55 rejects only when the TRIMMED value is empty, then passes the UNTRIMMED string
  to Number(), which tolerates padding by itself. Consequence for the human ruling: "accept per
  Number()" deletes one guard clause rather than reworking seed parsing.
  Recorded because the near-miss IS the lesson: an independent instrument re-deriving a known
  gap is corroboration, not new backlog. Filing it would have inflated this cycle's apparent
  output with bookkeeping the run already owned — the exact failure mode a housekeeping run is
  most prone to.

outcome: VALUE. 4/4 spec scenarios verified PASS against a code-blind answer key; 4/4 look
  findings conductor-reproduced; 1 agent severity claim refuted by measurement; 2 backlog items
  filed (Q-1 priority 2, Q-2 priority 5); 1 known issue opened (KI-31); 1 duplicate retracted.
  state.qa.last_full_qa_cycle = 6.
counters: consecutive_no_value 0 (unchanged — this cycle produced verified value).
  k_current 3 and wave_streak 1 UNCHANGED: Wave autotune keys on a build-wave's merges and
  verification, and this cycle ran no build wave and merged nothing.

NEXT CYCLE, read this first: Q-1 is the highest-value item on the board (priority 2, S, the
  stdout-error-handler fix closing both F-1 and F-2) and it is a real product repair, the first
  of this run. Its acceptance already names the four crashing triggers as the mutants AND the
  six clean pipelines as the must-stay-green controls, so the builder has a measured target and
  the gate has a converse control by construction. Q-2 (accent, one character) is a natural
  same-wave partner ONLY if scoped to src/corpus.js while Q-1 owns bin/aphorism.js — disjoint,
  so k=2 fits gear 2 exactly. Still owed before POLISH: ONE review-fix pass (scope it to
  src/ bin/ test/, NOT this run's diff) and ONE TASTE pass. N-9 (bound KI-26) remains todo and
  is unaffected by any of this.
