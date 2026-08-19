
## cycle 1 | 2026-08-19T14:40:12Z | aphorism-cli | PLAN -> BUILD
work: PLAN (inline) — the backlog carried 7 items, six of them blocked on human rulings, and covered NONE of this run's must-haves M-1..M-5. cycle.md step 4 gate 2 holds the run in PLAN until it does. Six new items filed (N-1..N-3, N-5..N-7); R-1 carried forward and re-scoped rather than duplicated.
agent: ONE Plan-type subagent (sonnet), proposal-only — no writes, no commits. The conductor wrote backlog.json.
budget: gear 2, ρ 0.50, guest, k_cap 2, demote true, probe_ok true. window 7,666,544 tok / $7.56; 19.58M tok/h; projected depletion 1787174798. governor clamp 2 — weekly 100% used at 34.2% elapsed, heat 2.92, promote blocked. The envelope is spent; this run stays in gear 2.
control: poll ok, 0 pending, 0 injections.

BACKLOG WRITTEN (13 items; nothing lost, 7 pre-existing all present):
  N-6  p9   docs/S    conductor  M-3  — record denial #31 + the discriminator, hand off the patch
  N-1  p10  fix/S     sonnet     M-1  — Node 18/20/22/24 Actions matrix over the existing suite
  N-7  p10  qa/M      conductor  M-1  — push it, observe the REAL run, settle the README floor
  N-2  p11  docs/L    sonnet     M-2  — REPORT.md first screen; history MOVED to an appendix
  N-5  p12  docs/M    sonnet     M-4  — every open item gets a named actor + settling evidence
  N-3  p13  polish/S  haiku      M-4  — KI-35: run-scoped artifact naming, forward-only
  R-1  p14  fix/M     sonnet     M-4/M-5 — reshape-or-decline, carried forward unchanged

M-3 SETTLED FOR THIS CYCLE — denial #31, with a discriminator:
  `/opt/swarm/bin/swarm-playbook.sh parse`   (bare: no pipe, no env prefix, no redirect)
    -> "This command requires approval"                                          DENIED
  `/opt/swarm/bin/swarm-budget.sh`           (same directory, same shape)
    -> real JSON: gear 2, ratio 0.50, probe_ok true                             ALLOWED
  `/opt/swarm/bin/swarm-notify.sh poll`      (same directory, same shape)
    -> ran, exit 0                                                              ALLOWED
  Two siblings in the same directory under the same invocation shape ran in THIS session
  while the third was refused. So the deny is PER-ENTRY — a missing allowlist line — not a
  directory-level guard and not a harness quirk. That is what a discriminator is for: it
  rules out the explanations that would have made the fix pointless. Note this SHARPENS
  the kickoff's finding rather than repeating it — the kickoff established that /opt/swarm/.claude/
  is guarded as a directory; this establishes that /opt/swarm/bin/ is NOT, and the two
  facts together say the fix is one allowlist line a human adds, applied to a config no
  session may edit for itself. Honest limit unchanged from runs #2 and #3: the claim that
  cmd_parse exits 2 on validator output is still READ, never EXECUTED, and this run cannot
  execute it either.

VERIFICATION EVIDENCE:
  gate (authored AT verification time, after the plan agent returned; 8 cells, 2 of them
  CONTROLS that must fail-to-find): node .swarm/runs/run4-cycle-001-gate.mjs
    PASS C1a  backlog.json parses
    PASS C1b  all 7 pre-cycle items still present         pre=7 now=13 lost=[]
    PASS C2a  every must-have PARSED FROM SPEC.md covered  found 5: M-1..M-5, uncovered=[]
    PASS C2b  CONTROL: non-existent M-9 reads as NOT covered
    PASS C3a  no two builder todo items share a file without a dep edge
    PASS C3b  CONTROL: the one real overlap (N-2/N-5 on REPORT.md) exists AND is sequenced
    FAIL C4   M-5 guard: suite green >= 118      tests=0 fail=-1 exit0=true
    PASS C5   no acceptance clause names a test command or file   0 leaks
    7 PASS / 1 FAIL of 8      full output: .swarm/runs/run4-cycle-001-gate-out.txt

  C4 IS AN INSTRUMENT DEFECT, NOT A REGRESSION — the 14th of this repo's recorded history.
  test_cmd run DIRECTLY by the conductor: node --test test/*.test.js
    -> ℹ tests 118 / ℹ pass 118 / ℹ fail 0 / ℹ duration_ms 4785.65        PASS
  C4 parsed `^# tests (\d+)` (TAP); node 24 emitted the SPEC reporter, `ℹ tests 118`.
  The gate file is left BYTE-UNEDITED — cycles 4, 12 and 14 of run #3 each established
  that rewriting a gate after it runs destroys the evidence of what it measured. The
  repair is a separate artifact and is MEASURED in four columns, not asserted:
    node .swarm/runs/run4-cycle-001-C4fix.mjs
    PASS A  UNFIXED parser on REAL output — must MISS       parsed tests=0 fail=-1
    PASS B  FIXED parser on REAL output — recovers truth    parsed tests=118 fail=0
    PASS C  CONTROL: FIXED on synthetic TAP — no regression parsed tests=3 fail=0
    PASS D  CONTROL: FIXED on synthetic FAILING — not a rubber stamp  tests=118 fail=3
    ALL 4 COLUMNS AS EXPECTED     output: .swarm/runs/run4-cycle-001-C4fix-out.txt
  Worth one line on the shape: unlike run #3 cycle 15's S1 defect, which under-measured and
  still EXITED 0 — green and silently incomplete — this cell required tests >= 118, so an
  unparsed count could only fail CLOSED. A parser that could not read its input said so.

  gh capability (the fact that makes M-1 attemptable after three runs called it
  permanently unverifiable): gh auth status
    -> Token scopes: 'gist', 'read:org', 'repo', 'workflow'                     PASS
     gh repo view trmnmc/aphorism-cli --json visibility,defaultBranchRef
    -> {"defaultBranchRef":{"name":"master"},"visibility":"PUBLIC"}             PASS
  Public repo + workflow scope = a free Actions matrix can EXECUTE the Node-floor claim.
  The prior runs' "no second Node runtime on this VPS" was true, and about the wrong machine.

  KI-35 measured, not assumed: ls .swarm/runs | wc -l -> 404 files, all cycle-NNN-*, from
  four runs whose cycle counters each restart at 1. This cycle's own artifacts are named
  run4-cycle-001-* — adopting the convention now is what will make N-3 TRUE rather than
  merely documented, and it is the conductor, not a builder, who can make that true.

M-5 STANDING GUARD: green — 118 tests / 0 fail / exit 0, conductor-run, directly.
  Zero product code touched this cycle. src/corpus.js untouched. No dependency added.

decisions recorded: 3 — the C4 instrument defect and its additive repair; the REFUSED
  gear-2 demotion of N-2 to haiku (this repo has measured haiku overclaiming on REPORT.md
  twice, at run #3 cycles 4 and 14, and N-2's failure mode is silent paraphrase); the M-1
  split into a builder half and a conductor half.

next: BUILD. First wave is k=2 (playbook wave_k, and gear 2 caps at 2 anyway) — N-1 and
  N-3, disjoint files (.github/workflows/test.yml vs .swarm/runs/NAMING.md), both S-effort.
  N-6 and N-7 are conductor work and do not consume wave slots. N-2 is L-effort and wants
  its own wave with nothing else touching REPORT.md.
