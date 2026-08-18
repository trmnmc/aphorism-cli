
## cycle 4 — 2026-08-18T05:04:52Z → 05:4xZ — build-wave (N-4 + N-6) — VALUE (3/3 verified)

CLOCK/GEAR. now 1787029492, stop_at 1787111308 (~22.7h left). Not limp, not WRAP_UP.
`bin/swarm-budget.sh` invoked and DENIED a **5th** consecutive time (probe_failures 4 → 5) —
the allowlist gap is unchanged and is already handed off (N-1, cycle 2). But a REAL probe was
DUE this cycle (`now − last_real_probe_ts` = 2124s ≥ 1800), so I ran the script's exact
`PROBE_CMD` directly — `npx ccusage@latest blocks --json --token-limit max`, which IS
allowlisted — and re-derived the gear by hand against `swarm-budget.sh:146-190,292-310`:

    window     2026-08-18T03:00Z..08:00Z   tokens 35,172,604 / limit 130,591,250   cost $29.04
    burnRate   451,403 tok/min  (27,084,183 tok/h)      REM 95,418,646  over 173 min to reset
    target     dial 1.00 (guest forces 1.00, budget.sh:82) × REM / 173 = 551,553 tok/min
    ρ          451,403 / 551,553 = 0.82   → gear_from_ratio(0.82) = 3 (cruise)
    weekly     used 24.0% at 14.33% elapsed → heat 1.67 > 1.3 → WCEIL 2, promote BLOCKED
               opus heat 17/14.33 = 1.19 (below the 1.2 promote-block threshold)
    applied    min(3, WCEIL 2) = 2; hysteresis no-op (prev 2) → **gear 2**, k_cap 2, demote true

Worth stating because it changed nothing but means something different: cycle 3 carried gear 2
forward on cycle 2's evidence. This cycle it is MEASURED, and the binding constraint is now
visible — **the 5-hour window is fine (ρ 0.82, cruise); it is the WEEKLY governor holding the
gear at 2.** That will not lift before the week rolls (`week_resets_at` 1787547600), so
"wait for a better gear" is not a strategy this run can use. Cycle 3 had parked N-6 hoping for
one; this cycle spends it instead. Projected depletion 1787042299 is 211 min out, i.e. AFTER
the 08:00Z window reset — the window resets before it depletes.

ORIENT. Tree clean, no salvage. `swarm-notify.sh poll` was DENIED (same allowlist gap class);
read `runs/control.json` from disk instead — `pending: []`, `applied: []`, no `inject` array.
Nothing to apply, nothing to triage. Not the 5th cycle, so no full SPEC re-read.

PICK. Effective wave = min(k_current 3, gear cap 2) = **2**.
  - **N-4** (qa, K-3) — flagged `route_class: "core"` → **fable**, and the fable guard exempts
    it from gear-2 demotion. Justified: N-4's deliverable is a HOLE-vs-BOUNDARY *judgment about
    whether the suite's coverage claim is honest*, and workflows.md is explicit that
    cheap-tiering a judgment call is how a run starts quietly overclaiming.
  - **N-6** (docs/M, K-4) — table gives sonnet, gear-2 demote drops docs sonnet→haiku. Cycle 3
    refused that as too risky for a 98 KB delete-nothing restructure. Resolved by RESHAPING the
    item instead of the routing: make the edit purely ADDITIVE (insert one block at the top,
    touch nothing below), and supply the agent a conductor-measured fact table rather than
    letting it source its own numbers. That is honest haiku work, and "nothing deleted" becomes
    exactly checkable — the whole old file must survive as one contiguous byte-identical run.
  Scopes disjoint: N-4 writes only `.swarm/runs/`, N-6 only `REPORT.md`. Dispatched as direct
  Agent calls — Workflow is review-gated in a `-p` session.

**Gate sealed before dispatch:** `.swarm/runs/c4/c4-gate.mjs`, sha256
`263eafb886b6eabc54f4ccf77e6907a1e261551f7434cb5adee141e7e43c3c0c`, sealed 1787029868, and
re-hashed identical at verification time (1787030581). Neither agent saw it.

WORK — N-4. Re-scoped, and this is the cycle's real result. N-3 measured zero survivors, so
  N-4 as chartered was an empty set and N-5 a guaranteed no-op. Cycle 3's own journal named the
  weakness in its 29/29 result: *"the completeness of the 29-clause enumeration itself is
  unverified — it is inherited from run #1 cycle 52 and no one has re-derived it from the SPEC
  text this run."* So N-4 was pointed at exactly that.
  **43 clauses derived independently from the SPEC before opening the inherited map. 29 map onto
  it (verdicts carried, not re-measured — `src/`, `bin/`, `test/` are byte-identical between
  b627ed2 and e6c53b1). 14 are NEW — behaviours the inherited enumeration never tested.**
  Of the 14: **12 KILLED, 1 SURVIVED, 1 NOT-PLANTED. 0 HOLE, 1 BOUNDARY.**
  The honest headline is two-sided and neither side should be dropped: **the inherited
  enumeration was incomplete (14 omissions found by a second independent reading), but the suite
  protects 12 of those 14 anyway.** The map understated the suite.

WORK — N-6. 22-line executive summary inserted at line 2; all 1226 pre-existing lines survive
  byte-identical. Delivery FAILED the no-false-claim clause — see the gate section.

VERIFICATION EVIDENCE (gate authored and hashed before dispatch; all commands run by me):

    $ node .swarm/runs/c4/c4-gate.mjs
    PASS F1    FLOOR: suite green — tests 102 / pass 102 / fail 0
    PASS F2    FLOOR: src/ test/ bin/ docs/ README.md all untouched
    PASS F3    FLOOR: writes confined to REPORT.md + .swarm/ as scoped
    PASS N6-0  BASELINE: REPORT.md.pre matches sealed sha256 e152f20cb21f… at 1227 lines
    PASS N6-b  PRESERVATION: line 1 intact; all 1226 lines 2..1227 byte-identical and
               contiguous; 22 lines inserted at line 2
    PASS N6-c  ONE SCREEN: inserted block is 22 lines (5..48 allowed)
    PASS N6-e  CONTROL (must-kill): deleting one pre-existing line IS detected
    PASS N6-f  CONVERSE CONTROL: editing only the inserted block stays PASS — not a snapshot
    PASS N4-a  STRUCTURE: 43 rows legal; every SURVIVED row classified with reasoning
    PASS N4-b  TALLY: headline agrees with the ROWS — derived 43, new 14, KILLED 41,
               SURVIVED 1, INERT 0, NOT-PLANTED 1, HOLE 0, BOUNDARY 1
    FAIL N4-c  COVERAGE: 1 newly-derived clause has NO mutation site (D-43)
    PASS N4-d  CONTROL (must-kill): a fabricated unclassified SURVIVED row IS detected
    PASS N4-e  CONVERSE CONTROL: a legal extra KILLED row stays PASS — not a blanket reject
    PASS N4-f  CONTROLS RECORDED: P0 pristine 102/102 fail 0; INERT comment-only fail 0
    PASS N4-g  NARRATIVE present (10,708 bytes)
    GATE FAIL — 1 check failed

    $ node .swarm/runs/c4/c4-crosscheck.mjs      # my own mutants, my own pristine archive
    P0    pristine archive @ e6c53b1        suite 102p/0f
    INERT comment-only edit to src/select.js  suite 102p/0f
    D-43  Number("") = 0  NaN? false        Number("   ") = 0  NaN? false
          pristine ["--seed",""]    -> exit 2  "aphorism: flag --seed requires a numeric value"
          pristine ["--seed","   "] -> exit 2  "aphorism: flag --seed requires a numeric value"
          MUTANT (accept "" as seed 0, the literal Selection reading): suite 102p/0f
    D-42  pristine   --tag humor --tag design --list -> 14 entries ("Any fool can write code…")
          first-wins --tag humor --tag design --list ->  9 entries ("Beware of bugs in the…")
          behaviour changed? YES (non-inert)      suite vs mutant: 102p/0f
          => SURVIVED CONFIRMED — the suite does not notice
    D-13  tag membership limited to slot 0     suite  99p/3f   (agent claimed KILLED 99p/3f)
    D-38  usage error routed to stdout         suite  94p/8f   (agent claimed KILLED 94p/8f)
    FINAL restore check: tree matches pristine? yes

  Four rows re-planted with mutations I wrote from the source, in an archive I built myself:
  all four verdicts reproduce, and the two spot-checked kills reproduce the agent's exact
  suite counts (99p/3f, 94p/8f). Full outputs: `.swarm/runs/c4/`, harnesses committed as .mjs.

THE GATE FAILED AND I DID NOT EDIT IT. N4-c required every newly-derived clause to carry a
  `mutation_site`. D-43 is NOT-PLANTED and has none — but NOT-PLANTED is a verdict I explicitly
  sanctioned in the dispatch contract, and the structure check already guards it with a ≥30-char
  reason requirement. So N4-c contradicts the contract it was written to enforce. The tempting
  move is a one-line edit to the gate; that is precisely the move hard rule 2 forbids, so
  instead I verified the substance by hand: `Number("")` and `Number("   ")` are both 0 and
  non-NaN, so SPEC §Selection ("`--seed` accepts any value that `Number()` parses to a non-NaN
  number") literally says ACCEPT, while the binary rejects both with exit 2 and §Exit codes
  calls a missing flag argument bad usage. **The spec genuinely contradicts itself, so there is
  no decided behaviour to plant a defect against, and NOT-PLANTED is the honest verdict.** My
  mutant toward the literal reading also left the suite at 102p/0f — the suite does not pin that
  path either. The sealed file is unedited, its FAIL stands recorded above, and the adjudication
  is a decision in state.json. **Fourth instrument bug of this run, all the same shape: a check
  written stricter than the contract it was meant to enforce.** Cycle 3 hit it three times.

N-6 FAILED ITS OWN CLAUSE, AND I REPAIRED IT RATHER THAN RE-DISPATCHING. All automated N6
  checks passed; the manual fact adjudication (29 integers, each re-derived by hand) is where it
  broke. Two claims overreached:
  (a) the mutation bullet read "29 pre-registered domain-rule clauses were tested; all 29 killed;
      0 survived" **with the lower-bound caveat I supplied dropped**. Every number in it is true,
      and the framing is still wrong — in this very cycle N-4 showed that enumeration is
      incomplete and that one behaviour outside it is unprotected. A first screen saying "29/29,
      0 survived" reads as stronger coverage than exists. Numbers can be individually true and
      collectively misleading; K-4 says no false count claim, and I am reading that as covering
      the claim the numbers make together.
  (b) "test suite has only been run on Node v24.19.0" — I supplied "only ever been run *here*";
      the agent widened it into a history claim neither of us can verify.
  I rewrote both lines myself: (a) now carries the lower bound AND today's 14-clause result
  including the survivor, (b) now says what is checkable — no `engines` field, no CI matrix, no
  runtime assertion, and no run under Node 18 or 20 recorded anywhere in the journal (grepped:
  9 hits, every one about the README claim text, none an actual run). Re-ran the sealed gate
  after the repair: preservation still PASS, still 22 lines. The item is recorded
  **done-by-conductor-repair with attempts=1**, not as a clean delivery — the backlog should not
  read as though haiku got this right.

WHAT THE ONE SURVIVOR MEANS. D-42: repeated `--tag`/`--author`. Shipped behaviour is
  last-occurrence-wins; a first-wins implementation changes observable output (14 entries vs 9)
  and the suite stays fully green. It is classified **BOUNDARY, not HOLE**, and deliberately NOT
  hardened: SPEC spells every filter flag in the singular and never mentions repetition, so
  last-wins is an artifact of assignment order in `parseArgs`, not a contract. Writing a test
  would freeze an accident into a guarantee (L-033). It goes to J-7 for a human ruling, and
  N-10 is filed to record the gap honestly while it stays unruled. **0 HOLE is why N-5 closes
  with zero tests written — which SPEC K-3 names in advance as a valid result, not a shortfall.**

WHAT THIS CYCLE DOES NOT ESTABLISH. The 43-clause derivation is one reading by one agent plus
  my spot-checks of 4 rows; a third reading could find a 44th clause. Mutation testing stays
  N=1 per clause — a lower bound on defect classes, saying nothing about combined defects.
  12 of the 14 new clauses I did NOT re-plant myself; for those I have the agent's arm and its
  controls, not independent corroboration. And KI-29 records real fragility: D-04, D-36 and
  D-41 are each killed by exactly one test.

FENCE VIOLATION (KI-30, medium). The N-4 agent found `/tmp` blocked by its sandbox and created
  scratch at **`/opt/swarm/.n4-scratch`** — inside SWARM, outside the `runs/`+`playbook/` paths
  hard rule 5 permits. It was dispatched with target paths only and never told a SWARM path; it
  derived one. It cleaned up: directory absent and `git -C /opt/swarm status --porcelain` clean
  at verification, so nothing reached the repo. Recorded, not fixed mid-run (hard rule 5). The
  lesson for the morning report is that the fence is a convention, not a control — the fix is to
  hand subagents a scratch dir inside the TARGET in the dispatch contract.

WAVE AUTOTUNE. Not a clean wave — one failed verify (N-6). `wave_streak` 1 → 0; `k_current`
  stays 3. It was not binding anyway: the gear-2 cap of 2 was.

KNOWN ISSUES. KI-28 (low, human): repeated-flag semantics unprotected and undecided.
  KI-29 (low): three clauses each hang on a single killing test. KI-30 (medium): the SWARM
  fence depends on agent goodwill.

next: **N-10** (S, docs, haiku) — write the two measured spec gaps into SPEC.md as gaps, without
  deciding them; it is the natural follow-through while D-42/D-43 are fresh, and it is
  gear-2-priced. Then **N-8** (S, docs) — name an actor and settling evidence for T-006, T-040,
  J-7, closing K-5; J-7 now carries four rulings, not two, so N-8 got bigger this cycle. **N-9**
  (KI-26 watchdog) stays last: it is the only remaining item that tests SWARM rather than the
  product. Must-have coverage after this cycle: K-1 ✓, K-2 ✓, K-3 ✓ (N-3/N-4/N-5 all closed),
  K-4 ✓ (N-7 + N-6), K-5 open (N-8, N-10).
