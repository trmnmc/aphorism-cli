
---

## cycle 5 — REVIEW → QA — review-fix [run #4's own delta]

work: review-fix, dispatched as DIRECT Agent calls (headless pacer-spawned `-p` cycle; the
Workflow tool is review-gated and direct dispatch is the documented SKILL.md fallback —
same basis as run #3 cycles 6/8/9/10/13/14 and run #4 cycles 2/3/4).
gear 2 (guest mode, weekly ceiling 2, rho=0.44, demote=true, promote=false), k_cap 2.
clock: 21.75h to stop_at at cycle open — no time pressure on any decision below.

### WHY THIS PASS, AND WHY NOT THE DONE DECISION CYCLE 4 HANDED FORWARD

Cycle 4 closed all five must-haves and asked the next cycle to re-run the DONE decision.
cycle.md step 4 outranks a prior cycle's suggestion: ONE review-fix, ONE QA and ONE TASTE
pass come after BUILD and before POLISH/VALUE_LOOP, and **run #4 had run none of the
three**. The markers that might say otherwise — `last_full_qa_cycle 6`, `last_taste_cycle
9` — are RUN #3 cycle numbers carried forward. Reading them as this run's evidence is
precisely the bookkeeping-decay error run #3 cycle 12 caught and filed, and declaring DONE
on top of it is how run #3 cycle 8 came to be wrong four times over.

### SCOPE, MEASURED RATHER THAN ASSUMED

    $ git diff --stat 957c4bf HEAD -- . ':(exclude).swarm'     # run #4's whole delta
     .github/workflows/test.yml |   19 +
     README.md                  |   23 +
     REPORT.md                  | 1702 +---------------------------
     docs/report-history.md     | 1595 ++++++++++++++++++++++++++++++

    $ git diff --stat 7f00cf0 HEAD -- src bin test              # vs run #3's review-fix
    (empty)

So the product code is byte-identical to the tree run #3 cycle 13 reviewed and returned
clean. Pointing reviewers at it would have been reviewing bookkeeping — the mirror image of
the error run #3 cycle 6 warned the later review-fix cycle against. The pass was scoped to
what run #4 actually shipped: one new executable artifact and three documents, none of
which any adversarial reader had ever seen.

### VERIFICATION EVIDENCE

Sealed gate `run4-cycle-005-gate.mjs`, sha256 `8a3ff4f53c31b151...`, held under SWARM/runs/
for the whole dispatch window (hard rule 5 makes it structurally unreachable to a fixer
rather than merely forbidden to it) and re-hashed byte-identical after the run.
Pre-dispatch baseline: **16 PASS / 4 FAIL** on the unfixed tree, the four FAILs being
exactly the two findings' scope.

    AFTER THE FIXES — 19 PASS / 1 FAIL of 20
    PASS R1   no unqualified claim that the cited run is newest
    PASS R2   historical citation not deleted        run_id=true commit_sha=true
    PASS R3   four-version table intact              versions=4/4 rows=4
    PASS R4   every cited run is a green 4-job matrix  32267338333:4/4 green
    PASS R5   recency claim TRUE against live API    claims_newest=false (8 runs)
    PASS R6   verified-at-18 honesty wording survives
    PASS P1   "twice in this cycle alone" gone       absent
    PASS P2   BOTH historical examples survive       cycle3=true cycle4=true
    PASS P3   the running total of eight survives
    PASS P4   the "twice" claim names matching cycles  names_cycle3/4=true
    PASS P5   dated snapshot framing survives
    PASS C1-C3 controls fire; PASS G1-G5 regression
    FAIL C4   A CONTROL THAT WENT SILENT — adjudicated 13/13, see below

test_cmd, run directly by the conductor after the repairs:

    tests 118 / suites 0 / pass 118 / fail 0 / duration_ms 4923.42562

collision-scan: `applicable: false` — a CLI ships no classic browser scripts.

### TWO FINDINGS, BOTH REPRODUCED; A THIRD REFUTED AND DISCARDED

**A-1 (medium) — README asserted a false superlative.** "The most recent full matrix —
Actions run 32267338333, commit `44702fb`". That run is the OLDEST of the repository's
eight. Reproduced by the verifier and independently by the conductor:

    32274489339 bac3535 16:11:26Z  completed success   <- actual newest
    32274405251 177189b 16:10:34Z  completed success
    32271407713 60c71d3 15:39:55Z  completed success
    32271368477 9ddc480 15:39:30Z  completed success
    32271160889 132ed1b 15:37:23Z  completed success
    32267943098 39b6818 15:05:26Z  completed success
    32267864422 4fe8f55 15:04:39Z  completed success
    32267338333 44702fb 14:59:30Z  completed success   <- the one README cited

And it was **already false when written**: introduced by 132ed1b at 15:37:19Z, while runs
32267864422 and 32267943098 had COMPLETED at 15:04:57Z and 15:05:44Z — ~31 minutes earlier.

**B-1a (medium) — REPORT.md contradicted itself.** "measured eight times now, including
twice in this cycle alone: ... and once at cycle 3 in the same way." The paragraph is dated
to cycle 4, so its own second example is dated to a different cycle. The verifier went
further and checked the substrate: the journal's cycle-4 block records exactly ONE
measurement of this class, so the wrapper claim is flatly false, not merely a misplaced
illustration.

**B-1b — REFUTED, and therefore DISCARDED, not fixed.** The reviewer also claimed the total
of eight was untraceable. The verifier traced all eight across runs #3 and #4 (run #3's own
"this run has now measured that exact decay five times", plus cycle 2's inherited "~404"
figure, cycle 3, and cycle 4's A6 catch). The total is TRUE — so the gate got a cell (P3)
requiring it to SURVIVE the fix, because deleting a true claim would itself have been a
defect. An unreproduced finding is discarded; it stays in the return array, dropped from
nothing.

### THE DEFECT SPECIES THAT IS NEW FOR THIS REPO: A CONTROL THAT WENT SILENT

Four wrong instruments this cycle. Two were caught by the gate's own PRE-SEAL baseline and
repaired before sealing — fixing before a gate runs is repair; editing after it has run
destroys the evidence of what it measured:

1. **Unbounded recursion.** Cells were evaluated eagerly at registration, so the control
   cells — which re-invoke the gate with `--only` — ran the controls inside every control.
   The first baseline never terminated.
2. **A matcher blind to line-wrapping.** Both documents are hard-wrapped, so the sentence
   under review is stored as `"including twice\nin this cycle alone"`. The consequence is
   the part that matters: P1 reported the false sentence **ABSENT on a tree that contains
   it** — a cell failing OPEN — while P2 reported an intact example as DELETED. One root
   cause, opposite directions.

Two more survived to the sealed run and were adjudicated with the gate left byte-unedited
(`run4-cycle-005-C4G5-adj.mjs`, 13 PASS / 0 FAIL):

    A   DEFECT REPRODUCED  the sealed C4 mutation changed 0 characters — a no-op
    A2  CONSEQUENCE        under that no-op P2 reported PASS, certifying nothing
    B   REPAIR             a wrapping-aware mutation removes 37 chars
    C   P2 CAN DIE         with the example genuinely gone, P2 FAILS
    D   CONTROL other arm  removing the cycle-4 example also kills P2
    E   CONTROL            P2 PASSES untouched (not a check that dies on everything)
    F   CONTROL            benign rewrap, 124 newlines -> 120, same words: P2 GREEN
    G   DEFECT REPRODUCED  G5 diffed HEAD..HEAD; product diff [] vs true [README,REPORT]
    H   REPAIR             working-tree diff is EXACTLY the two intended files
    I   CONTROL            injecting .github/ into the set DOES fire the check
    J   CONTROL            .swarm/ churn neither masks nor triggers a violation
    K   CORROBORATION      git status --porcelain agrees, by a different command
    L   CONTROL            the exact wrong output K first produced still compares UNEQUAL

**C4 is the new species.** It is not the gate being wrong (the eight defects before it) and
not the cycle-14 shape of a gate being right and insufficient. It is a CONTROL — the one
cell whose entire job is proving another cell can fail — quietly testing nothing while
reporting that it had. Its mutation path kept the raw-text bug the assertion path had
already been fixed for.

**G5 is the worse one, and it PASSED.** It asserts only README.md and REPORT.md changed
since the seal, but it diffed committed history while the fixers' work was uncommitted, so
it compared `f9c286d..HEAD` to itself, reported `changed=[]`, and would have passed
identically had a fixer rewritten `.github/workflows/test.yml`. C4 failed loudly and told
me it was broken. G5 failed silently and read as green. That distinction is the carry-away.

**And the fourth instrument was mine.** The adjudication artifact's column K first returned
`["EADME.md","REPORT.md"]`. `git status --porcelain` emits two status characters then a
space, so `" M README.md"` needs `slice(3)` — but calling `.trim()` on the whole block
strips the leading space off the FIRST line only, shifting exactly one path by one
character. Caught because K disagreed with column H, which measures the same fact by a
different command. The discipline of demanding evidence applies to the conductor's evidence
too — third cycle running that this has needed saying.

### ONE CONDUCTOR REPAIR, RECORDED AS SUCH

The REPORT.md fixer wrote "once **this cycle**, when this paragraph was first written
mid-cycle". Changed to "once **at cycle 4**". A relative cycle reference inside a document
that outlives the cycle is the very decay class the sentence is about; naming the cycle
costs one word and cannot go stale. Re-dispatching at attempts+1 for one token would have
spent a cycle — the run #3 cycle-14 / cycle-4 N-6 precedent is conductor repair with the
agent attempt recorded as imperfect, which is what is recorded here.

### THE README FIX WAS VERIFIED ON ITS MERITS, NOT ON THE GATE

R1/R5 only prove README makes no UNQUALIFIED recency claim. Whether its new SCOPED claim is
TRUE is a different question and no cell asked it, so the conductor did:

    $ git log --oneline 44702fb..HEAD -- src bin test .github
    (empty)                          -> nothing has changed the tested code since 44702fb
    $ git show --stat 44702fb -- .github
     .github/workflows/test.yml | 19 +++++++++++++++++++
                                     -> 44702fb IS a commit that changed the workflow
    $ git log -1 --format=%cI 44702fb
    2026-08-19T14:59:22+00:00        -> the "(2026-08-19)" date is right
    $ gh api /repos/.../actions/workflows
    337892402  test  .github/workflows/test.yml  active
                                     -> the ?query=workflow%3Atest link resolves

### KI-36 FILED — AND RECONCILED HERE RATHER THAN BY EDITING HISTORY

Verifying B-1b turned up a residual the reviewer had not claimed: the journal's own ordinal
labels disagree. Cycle 3's block says **SIXTH** while enumerating only four run-#3 priors,
compressing run #3's own self-stated five; cycle 4's block says **Eighth**; nothing is ever
labelled seventh. The reconciliation, stated here because the journal is append-only and
correcting it in place would rewrite the record — the mechanism run #3 cycle 12 used for
exactly this: run #3 measured the class five times by its own count (journal 13130), then
run #4 cycle 2 (the inherited "~404" figure), cycle 3, and cycle 4 make 5+3 = **8**. The
total of eight is right; cycle 3's "SIXTH" label is the entry that undercounts.

verdicts: A-1 FIXED (conductor-verified). B-1a FIXED (conductor-verified, after a one-token
  conductor repair). B-1b DISCARDED — refuted, per the review-fix contract.
wave autotune: not applicable — this was a review-fix, not a build wave. `k_current` stays
  3, `wave_streak` stays 1; the gear-2 cap of 2 still binds.
sole committer: honored. `git status --porcelain` after both fixers showed exactly
  ` M README.md` and ` M REPORT.md` — nothing staged, no branches, nothing else touched.
  Corroborated by adjudication columns H, K and L.
backlog: unchanged at 13 — 6 done, 0 todo, 6 blocked (all human-owned), 1 declined. Both
  findings were fixed within the cycle, so neither became a backlog item; nothing was
  dropped. Cycle-5 hygiene (step 3, the every-5th-cycle pass) found the backlog well under
  the ~30 cap with no duplicates and no stale entries.
known issues: **KI-36 added** (low). Also repaired this cycle, as step-3 hygiene: 7 of the
  31 `known_issues` index entries in state.json carried EMPTY titles. Root cause fully
  accounted for — the detail file has three body keys (23 `desc`, 7 `what`, 1 `title`) and
  the kickoff summariser read `desc` only, so exactly the 7 `what`-keyed entries came out
  blank. The title convention was RECOVERED BY MEASUREMENT from the 24 good entries (first
  sentence, whitespace-collapsed, minus its terminating punctuation, capped at 140) and
  validated at **24/24 exact** BEFORE being applied; a naive 140-char slice reproduces only
  4/24, which is what makes that column discriminating. 8/8 in
  `run4-cycle-005-ki-title-repair.mjs`, with controls proving an absent body yields NO title
  and that exactly 7 of 31 rows change.
control channel: `swarm-notify.sh poll` DENIED by the harness allowlist again — denial #34
  of this repo's running count, same rule as #32 and #33. `runs/control.json` read directly
  instead: `pending: []`, `applied: []`, no `inject` array. Non-fatal per cycle.md.
notifications: the phase change REVIEW -> QA owes a `phase-change` push; `swarm-notify.sh
  send` is denied under the same rule (#33), so it did NOT go out. Unchanged from cycle 4
  and still a SWARM tool question for the morning report, not a live edit — hard rule 5
  fences `bin/`.
next: QA full and TASTE are the two gates still owed for run #4. The next cycle should not
  run either on autopilot: this run shipped ZERO product code, so a full QA pass would
  re-exercise a byte-identical CLI against a spec-derived answer key that run #3 cycle 6
  already ran, and TASTE would re-derive run #3 cycle 9's "wears-thin" verdict on an
  unchanged product whose named remedies are all locked non-goals. Decide their scope
  against that measurement — the same test this cycle applied to review-fix, which passed it
  because run #4's delta was genuinely unreviewed. If both come back as churn by that test,
  say so with the measurement and go to the DONE decision with all three gates honestly
  accounted for rather than three boxes ticked.
commit: (this cycle)
runfile-mirror: written to runs/current.json and current.json.bak this cycle
