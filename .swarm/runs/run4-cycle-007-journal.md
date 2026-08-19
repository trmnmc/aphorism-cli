
## cycle 7 — QA — the owed QA-full pass, and the premise that would have skipped it was false

work: qa-verify `mode: "full"`, dispatched as DIRECT Agent calls rather than
`workflows/qa-verify.js` — headless pacer-spawned `-p` cycle, Workflow tool review-gated,
the documented SKILL.md RESUME fallback (same basis as run #3 c6/8/9/10/13/14 and run #4
c2/3/4/5).
gear 2 (guest, weekly ceiling 2, rho=0.30, demote=true, promote=false), k_cap 2.
clock: 20.6h to stop_at at cycle open — no time pressure on any decision below.
backlog todo was EMPTY at orient; the three survivors are human-owned blocked items, so
this cycle picked a phase gate, not a backlog item.

### THE QUESTION CYCLE 6 HANDED FORWARD, AND WHY THE ANSWER FLIPPED

Cycles 5 and 6 both carried the same premise forward:

    cycle 5: "a full QA pass would re-exercise a byte-identical CLI"
    cycle 6: "QA full and TASTE are owed for run #4 against a product whose code has not
              changed since run #3 reviewed it clean"

Cycle 6 asked the next cycle to decide the two owed gates' scope by measurement rather than
tick boxes. Measured:

    instrument: run4-cycle-007-identity.mjs — git TREE-OBJECT ids for bin/ src/ test/
                (content-addressed), 2 controls

    run3-reviewfix-c13  a83c0b7   IDENTICAL to HEAD
    run3-DONE-c15       0ced19a   IDENTICAL to HEAD
    run3-WRAPUP         957c4bf   IDENTICAL to HEAD
    run3-QAfull-c6      5eaf9e5   DIFFERS
    run3-TASTE-c9       b5b9d55   DIFFERS

    C2 must-MATCH   HEAD~1 (a documents cycle) vs HEAD -> IDENTICAL (PASS)
    C1 must-DIFFER  root 931057d vs HEAD          -> DIFFERS   (PASS)

**The premise is TRUE for the gate already paid and FALSE for both gates still owed.** The
delta QA-full had never seen:

    bin/aphorism.js          +44   two stream 'error' handlers + EXIT_WRITE_ERROR = 3
    src/args.js              +3/-1
    src/corpus.js              1   Saint-Exupery -> Saint-Exupéry
    test/pipe.test.js        +245  an entire new file
    test/readme-tags.test.js  +24

Correct reasoning about review-fix was generalised to QA and TASTE without re-measuring.
That is the tenth instance of this run's decay class, and the first found in a forward
plan rather than in a shipped document.

**INSTRUMENT DEFECT, FOUND BEFORE USE.** v1 of that instrument hashed
`git archive | sha256sum`. `git archive` stamps every tar member's mtime from the COMMIT
DATE, so it was measuring dates, not content — it duly reported all five anchors as
DIFFERS. Caught by its own implausible unanimity, not by a control, which is the honest
account: five-for-five is a smell, not a finding. v2 reads git's content-addressed tree
objects and carries the must-MATCH / must-DIFFER pair above.

### VERIFICATION EVIDENCE — scenario stage (spec-blind author, conductor executor)

Author isolation: a byte-identical SPEC copy alone in a directory, plus an explicit
no-other-file instruction. The agent reported back
`spec_sha256_seen = d942389c6e402daaf758ea8fbb49b6392368bf7ee5534898fd19f21b201e81f7`,
which equals the isolation copy — proof of which text it saw. `contamination_note: none`.

Blindness is INSTRUCTION-enforced, not sandbox-enforced: the agent could reach the target
repo either way. The single-file directory removes accidental exposure and makes the
instruction checkable; it was never the mechanism, and saying otherwise would overclaim.

**THE FIRST DISPATCH FAILED AND IS RECORDED, NOT HIDDEN.** The isolation dir was `/tmp`,
outside this session's `additionalDirectories`, so every content read was refused —
including the one `sha256sum` the task explicitly permitted. The agent reported the block
and *explicitly declined to fabricate an answer key it had no basis for*. Re-dispatched
from `/opt/swarm/runs/c007-speconly`, inside both the allowlist and hard rule 5's fence.
An agent refusing to invent evidence under pressure is worth more to this run than the
28 scenarios it went on to produce.

    32 PASS / 0 DIVERGENCE  (decidable scenarios)

    S-01..S-24  exit code, stream discipline, filtering, --list/--json, --seed
    S-20..S-24  determinism re-runs: same command twice, bytes compared -> all stable
    S-12        --author dijk == --author DIJK (byte-identical, 714 bytes)
    S-18        --list ignores --seed (byte-identical, 4528 bytes)
    S-15        --list = 50 lines          S-16  --list --json = 50 NDJSON lines, all parse
    S-10        | cat byte-identical to unpiped

UNDECIDED-BY-SPEC scenarios were RECORDED, never scored — the point of D-42/43/44 is that
the contract does not decide them. All four reproduce exactly what SPEC "Undecided
behaviours" already records, which corroborates that section:

    S-25 --seed ''                 exit 2      (D-43)
    S-26 --author ''               exit 0, 109 bytes  (D-44)
    S-27 --tag humor --tag design  exit 0, 1484 bytes = the design list  (D-42)
    S-28 --author=                 exit 2      (D-44)

### VERIFICATION EVIDENCE — live-look findings, all conductor-reproduced

Gate `run4-cycle-007-gate-qa.mjs`, authored AFTER the agent returned (correct for a QA
look: the findings ARE the input; seal-before-dispatch exists for build waves, where an
agent could code to the check). 15 PASS / 0 FAIL with five controls — three that must stay
GREEN and two that must DIE:

    PASS A1  ASCII "Saint-Exupery" -> exit 1, stdout EMPTY
             exit=1 stdout_bytes=0 stderr="aphorism: no aphorism matches those filters"
    PASS A2  NFC "Saint-Exupéry"   -> exit 0 (the entry EXISTS)   exit=0 bytes=139
    PASS A3  partial "saint"       -> exit 0 (reachable; CAPS the severity)
    PASS A4  corpus has exactly ONE non-ASCII author, read from the module
             authors=24 nonascii=["Antoine de Saint-Exupéry"]
    PASS A5  --tag nope 2>/dev/full -> exit 3   (earned 1 DESTROYED)
    PASS A6  --bogus  2>/dev/full  -> exit 3    (earned 2 DESTROYED)
    PASS A7  ...with zero readable diagnostic anywhere
    PASS A8  --seed 1 >/dev/full   -> exit 3 WITH "aphorism: ENOSPC: no space left on device"
    PASS A9  README row 3 scopes exit 3 to STDOUT and promises a stderr line
    PASS A10 SPEC "Exit codes" Domain rule does NOT enumerate 3
             clause="- Exit codes: 0 success, 1 no match, 2 bad usage (...)"  mentions_3=false
    PASS C1  control must-stay-GREEN: success run, stderr->/dev/full unwritten -> exit 0
    PASS C2  control must-stay-GREEN: stderr merely CLOSED preserves earned 1 and 2
    PASS C3  control must-stay-GREEN: --list | head -1 -> CLI exit 0, stderr silent
    PASS C4  control must-DIE: asserting the EARNED code at A5 would FAIL -> A5 discriminates
    PASS C5  control must-DIE: a nonsense author is ALSO exit 1 -> A1 alone cannot tell
             "absent" from "unmatchable"; A2 is what supplies that

test_cmd, run by the conductor:

    tests 118 / suites 0 / pass 118 / fail 0 / duration_ms 5126.189039  (node v24.19.0)

collision-scan: not applicable — a CLI ships no classic browser scripts.

### C2 IS THE ROW THAT CORRECTS MY OWN EARLIER PROBE

An earlier conductor probe this cycle appended `2>/tmp/err` after `2>&-` and read the
result as "stderr closed". The later redirect wins, so stderr was never closed and those
two rows measured nothing. They are not cited as evidence anywhere above. C2 replaces them
by distinguishing the two states properly: a merely CLOSED stderr preserves the earned exit
code (Node reopens closed stdio to `/dev/null`); only a stderr pointed at a FAILING device
triggers the handler. The look agent had already flagged this exact trap unprompted.

### THREE FINDINGS, AND WHY NONE OF THEM CHANGES CODE

**L-01 (medium) — `--author` is diacritic-sensitive.** The corpus's one non-ASCII author is
unreachable by the ASCII spelling a user would type, and gets a confident false "no match"
rather than a hint. Severity is capped at medium BY MEASUREMENT, not by judgement: A3 shows
`saint`, `exup`, `antoine` all still reach it. The shipped behaviour CONFORMS to the SPEC's
Filtering clause ("substring containment, case-insensitively"), so the repair is
documentary. -> **Q-6**.

**L-02 (low) — README's exit-3 row contradicts shipped behaviour.** README scopes exit 3 to
"a real stdout write failure" and promises "one `aphorism: …` line on stderr". A non-EPIPE
STDERR failure also exits 3, emits nothing, and deliberately replaces the code the run had
earned. This is NOT a bug: `test/pipe.test.js:160` explicitly asserts `status !== 2`, `!== 1`,
`!== 0`, and the code comment argues the case. The behaviour is deliberate and test-pinned,
so a code "fix" would correctly break 118/118 — the DOCUMENT is what diverges. -> **Q-5**.

**C-01 (medium, conductor) — the SPEC never enumerated exit 3.** Gate A10 reads the Domain
rule structurally: `0 success, 1 no match, 2 bad usage`. The spec-blind author, which had
seen nothing but that text, returned `exit_code_enumeration: [0,1,2]` and
`spec_documents_a_write_error_code: false` independently. Chronology explains it: the
43-clause coverage enumeration was derived at run #3 cycle 4; exit 3 and both handlers
landed at run #3 cycles 7-8. No clause has ever covered exit 3, and the Domain-rules header
calls those clauses the regression floor.

The author's own framing is the sharpest thing in the pass and is adopted verbatim rather
than sanded down: the SPEC is **silent, not prohibitive** — "a caller cannot cite the SPEC
to claim a 4th code is forbidden, but also cannot cite the SPEC to say what a 4th code would
mean." So exit 3 is not a violation; it is outside the contract. Amending a Domain rule is a
SPEC change this run may not make, so the honest disposition is an "Undecided behaviours"
entry in the D-42/43/44 grammar routed to J-7 for a human ruling. -> **Q-7**.

The TEST suite does cover exit 3 on both streams (`test/pipe.test.js:86` and `:160`, both
exercising `/dev/full`, `skipped 0` in the 118/118 run). This is a SPEC and README gap, not
a test hole, which is why it adds zero tests — M-5 holds.

### THE AGENT PASS ITSELF

Two findings, both reproduced, zero discarded, and **zero severity claims measured false —
the first agent pass on this repo with no overclaim to correct** (the running tally before
today was four haiku overclaims plus one severity inflation). The look agent volunteered a
14-item `things_i_attacked_and_found_CLEAN` list, which is what makes two findings readable
as coverage rather than as a thin sample: EPIPE on both streams, genuinely closed stderr,
the documented exit-3 path, the `--help` recipe run verbatim, README band counts, `| cat` vs
`> file` byte-identity, the accented author round-tripping through `--json`.

verdicts: QA-FULL PAID for run #4 (32/32 scenarios, 0 divergences; 2 look findings + 1
  conductor finding, all 3 conductor-verified 15/15 with 5 controls). 0 code changes, and
  0 is the correct number: all three dispositions are documentary.
wave autotune: not applicable — no build wave. `k_current` stays 3, `wave_streak` stays 1;
  the gear-2 cap of 2 still binds.
sole committer: honored — `git status --porcelain` empty after both agents.
backlog: 13 -> 16. **Q-5, Q-6, Q-7 filed as todo**, the run's first non-empty todo list
  since cycle 4. Six blocked survivors unchanged.
known issues: none added. L-01 is medium and L-02 low, so neither meets the blocker/high
  bar for a `known_issues` entry; filing them there anyway would inflate the list the run
  spent cycle 4 pruning.
control channel: `poll` ran, `pending: []`, `applied: []`, no `inject` array. Nothing to
  triage.
notifications: no phase change this cycle — QA -> QA — so none is owed.
next: TASTE is the last owed gate and its delta is now MEASURED, not assumed:
  `src/args.js` (a reworded `--help` recipe) and `test/readme-tags.test.js`. The corpus
  that run #3's TASTE actually judged is byte-identical, and all four of its boredom
  findings routed to TS-1/TS-2/TS-3, which are blocked on features the brief forbids. So
  the honest call is that TASTE re-run IS churn by cycle 5's own test — but say it with
  that measurement attached, and note the asymmetry that QA was NOT. Then Q-5/Q-6/Q-7 are
  three S-effort documentary fixes that fit gear 2, after which the DONE decision has all
  three gates honestly accounted.
commit: (this cycle)
runfile-mirror: written to runs/current.json and current.json.bak this cycle
