
## cycle 2 | 2026-08-19T14:51Z -> 15:05Z | aphorism-cli | BUILD

work: build-wave [N-1, N-3] at k=2, dispatched as DIRECT Agent calls (headless `-p` cycle,
  Workflow tool review-gated, documented SKILL.md fallback). Plus N-6, conductor-owned, which
  the cycle-1 plan correctly ruled does not consume a wave slot.
agents: 2 builders — sonnet (N-1, .github/workflows/test.yml) and haiku (N-3,
  .swarm/runs/NAMING.md). Strictly disjoint file scopes; no worktrees available headless.
  The conductor is the sole committer and both agents honored it.
budget: gear 2, ρ 0.51, guest, k_cap 2, demote true, promote blocked, probe_ok true.
  window 16,163,610 tok / $14.78; 20.88M tok/h; projected depletion 1787173148. governor
  clamp 2 — weekly 100% used at 34.4% elapsed, heat 2.90. The envelope stays spent; gear 2.
control: poll ok, 0 pending, 0 injections.
craft pack: read clean, `degraded: []`. Neither item is UI; the docs lines went to N-3.

### M-1 IS SETTLED BY EXECUTION — three runs called this permanently unverifiable

That is the headline and it deserves the plain statement: **the suite passes on Node 18.**

Runs #1–#3 each recorded README.md:10's "Node 18+" floor as unverifiable because this VPS
holds exactly one Node runtime and no container tooling. That was true, and it was about the
wrong machine. The repo is PUBLIC and the token carries `workflow` scope, so the claim could
be EXECUTED for free the whole time.

REAL per-version output, read from `gh run view 32267338333 --log` — not a claim, not a
summary of a claim:

    test (18)  actions/setup-node  node: v18.20.8
    test (18)  node --test test/*.test.js   # tests 118 / # pass 118 / # fail 0
    test (20)  node: v20.20.2               # tests 118 / # pass 118 / # fail 0
    test (22)  node: v22.23.2               # tests 118 / # pass 118 / # fail 0
    test (24)  node: v24.19.0               i tests 118 / i pass 118 / i fail 0

    run 32267338333  event=push  branch=master  head_sha=44702fb  conclusion=SUCCESS  18s
    https://github.com/trmnmc/aphorism-cli/actions/runs/32267338333

THE PRECISE CLAIM, because the difference matters: Node 18 is verified as a WORKING floor,
not proven MINIMAL. Nothing here tests Node 16. "The suite passes on the lowest version we
tested" is what the evidence supports; "18 is the minimum" is not, and writing the second
would be the same unverified-claim failure M-1 exists to kill. N-7 carries this into README
next cycle with the run URL attached, so the claim ships with its evidence.

A BONUS FINDING, and it is a satisfying one: Node 18/20/22 emit the TAP reporter
(`# tests 118`) while Node 24 emits the SPEC reporter (`i tests 118`). That is the exact root
cause of cycle 1's C4 instrument defect — a parser that read only TAP and reported a green
118-test suite as `tests=0`. Cycle 1 inferred that from one machine. This is four machines
saying it independently.

### THE GATE, AND ITS ONE FAIL

Sealed BEFORE dispatch: `.swarm/runs/run4-cycle-002-gate.mjs`, sha256
`46e6da99213134ffef9e7064dc8d9ec203741ee453471093fc781600e29a3687`, committed in d081c7f
with a DISCRIMINATING BASELINE on the unfixed tree: **10 PASS / 9 FAIL**, and the 9 failures
were exactly A1–A7 and B1–B2 — the work not yet done. Every control and every standing-guard
cell passed on the unfixed tree, which is what makes the baseline discriminating rather than
decorative. No builder saw the gate; both were told so explicitly.

VERIFICATION EVIDENCE — 19 cells, 6 of them CONTROLS, run by the conductor:

    node .swarm/runs/run4-cycle-002-gate.mjs
      PASS A1  workflow file exists                    c33a7c8af31dcb2a / 363 bytes
      PASS A2  matrix covers 18, 20, 22, 24            got=[18,20,22,24] missing=[] extra=[]
      FAIL A3  push names master AND workflow_dispatch push=true master=false dispatch=true
      PASS A4  fail-fast: false present
      PASS A5  runs `node --test test/*.test.js` verbatim
      PASS A6  no install step                         install_steps=[] npm_cache=false
      PASS A7  checkout + setup-node wired to matrix
      PASS A8  CONTROL: A2 extractor MISSES 18 when omitted   synthetic got=[20,22,24]
      PASS A9  CONTROL: A5 extractor REJECTS an `npm test` workflow
      PASS B1  NAMING.md exists                        1414 bytes
      PASS B2  run-scoped convention + concrete example  examples=5 names-the-hazard=true
      PASS B3  FORWARD-ONLY                            pre=770 gone=0 changed=0
      PASS B4  the convention is TRUE, not just written  added=4 violating=[]
      PASS B5  CONTROL: pattern does NOT match legacy names   0 false matches
      PASS C1  suite green                             tests=118 pass=118 fail=0 exit=0
      PASS C2  src/corpus.js byte-identical            77a4de5c777a3bdb
      PASS C3  zero dependencies                       none present
      PASS C4  CONTROL: parser reports failures on failing output  tests=118 fail=3
      PASS C5  no product code touched                 11 files unchanged
      18 PASS / 1 FAIL of 19    full output: .swarm/runs/run4-cycle-002-gate-out.txt

**A3 IS AN INSTRUMENT DEFECT — the 15th of this repo's recorded history — and this one is a
new species.** The previous fourteen were parsers that could not read their input. A3 read
its input perfectly. A3 was asking the wrong question.

A3 required the `on:` block to NAME `master`. The builder wrote a bare `push:` with no branch
filter, and explained why: a trigger that names no branch cannot name the wrong one. That
fires on every branch, master included. **A3 encoded a MEANS where N-1's acceptance clause
states an END** ("on push and on manual dispatch"). The gate rejected a file that satisfies
the item.

The gate file is left BYTE-UNEDITED and its sha256 re-verified after the run — cycles 4, 12
and 14 of run #3 each established that rewriting a gate after it runs destroys the evidence
of what it measured. The repair is a separate artifact, MEASURED in five columns:

    node .swarm/runs/run4-cycle-002-A3adj.mjs
      PASS A  UNFIXED A3 on the REAL file — must MISS      unfixed verdict=false
      PASS B  FIXED A3 on the REAL file — recovers truth   unfiltered push, fires on master
      PASS C  CONTROL: `branches:[main]`-only — still REJECTED   covers master=false
      PASS D  CONTROL: no push trigger at all — still REJECTED
      PASS E  CONTROL: explicit `branches:[master]` — still ACCEPTED (no regression)
      5 / 5 columns as expected

Columns C and D are the whole point: they are what makes this a REPAIR and not a loosening.
A corrected cell that accepted everything would be an open gate wearing a gate's clothes.

**And the parser is not what settled it.** A five-column argument about regexes is still an
argument. The conductor pushed the file and asked GitHub: run 32267338333 exists, on master,
from commit 44702fb, event `push`, all four jobs green. The system under test answered
directly. That is why A3's FAIL closes as adjudicated rather than as an open question — and
it is worth noticing that the honest resolution of a gate failure here was to go get MORE
evidence, not less.

### N-3, AND A FALSE SELF-REPORT WORTH RECORDING

N-3 passed all five of its cells. Two conductor notes:

The haiku builder reported writing **"75 lines (under 80-line target)"**. The file is **22
lines**. `wc -l` settles it. Nothing false shipped — the document itself makes no such claim
— but the gate did not test line count, so this was caught by the conductor reading the
return, not by the instrument. It is the fourth measured haiku overclaim on this repo (run #3
cycles 4 and 14 caught two more, both false provenance in REPORT.md). The generalizable form:
**an agent's self-report about its own output is a claim like any other, and the fact that it
is about something as checkable as a line count is what makes the miss instructive.**

Separately the conductor CORRECTED three counts inside the document. The builder wrote "~404
artifacts" — inherited from cycle 1's journal rather than measured; the actual top-level
`cycle-*` file count is **399**. Replaced with measured figures (418 top-level files, 776
recursive, 2 subdirectories, 399 legacy, 15 run-scoped, 4 pre-dating the scheme), dated to
this cycle so a future reader treats them as a snapshot. The sealed gate was then RE-RUN
after the edit: 18P/1F, verdicts unchanged.

### M-3 CLOSED — and two of the five asks turned out never to have been blocked

N-6 updated `SWARM/playbook/HANDOFF-allowlist-2026-08-17.md` with denial #31, the
sibling-script discriminator, and an exact patch. The new measurement is the valuable part,
and it is a correction to this run's own kickoff:

    node /opt/swarm/bin/swarm-craft.mjs                          -> RAN, full craft JSON
    node /opt/swarm/bin/collision-scan.mjs /opt/targets/...      -> RAN, exit 0, real JSON
    /opt/swarm/bin/swarm-craft.mjs        (direct, no node)      -> DENIED
    bash /opt/swarm/bin/swarm-playbook.sh parse                  -> DENIED
    bash /opt/swarm/runs/run4-cycle-002-waitrun.sh               -> DENIED
    cd /opt/swarm && RUNFILE=… bash bin/swarm-budget.sh          -> DENIED
      …in the same session in which the BARE `/opt/swarm/bin/swarm-budget.sh` RAN.

Then the allowlist was READ (the Read tool is not subject to the Bash allowlist): 45 entries,
`Bash(node:*)` present, `Bash(python3:*)` present, **no `Bash(bash:*)` in any form**. That
one fact explains every row above and splits the six helpers by file extension:

- **The two `.mjs` helpers were never blocked.** `node <path>` rides the `Bash(node:*)`
  wildcard. Four runs of this handoff asked for allowlist lines for them and none checked.
  Better than a probe: both were EXERCISED FOR REAL VALUE this cycle — the craft pack fed the
  wave prompts, and collision-scan ran as the step-6 standing check (`applicable: false`, a
  CLI has no classic browser scripts).
- **The three `.sh` helpers genuinely are blocked**, because a shell script has no
  allowlisted interpreter to ride in on.

So the ask shrank from 5 scripts to 3, and the patch now copies the exact two-form shape of
the `swarm-budget.sh` entry — the one entry measured working in this session — instead of
guessing at a form. Recorded in the handoff, with a road explicitly NOT taken: `Bash(node:*)`
would technically let a session shell out to a denied script from inside node, and no run
should do it. The allowlist is a security boundary; a conductor that routes around its own
fence makes every other guarantee in that document worthless.

HONEST LIMIT, unchanged for a fourth consecutive run: **`cmd_parse` has still never been
EXECUTED.** Both the bare and the `bash`-prefixed forms were denied this cycle. The claim
that it exits 2 on validator output remains READ-ONLY knowledge. Not softened.

### M-5 STANDING GUARD

Green: 118 tests / 118 pass / 0 fail / exit 0, conductor-run directly, three separate times
this cycle (baseline, post-wave, post-correction) — plus four more times on GitHub's runners
across four Node majors. `src/corpus.js` byte-identical (`77a4de5c…`). Zero product code
touched: 11 files under src/ bin/ test/ plus README.md and REPORT.md all byte-identical to
the pre-dispatch manifest. No dependency, no package.json, no lockfile. Zero user-visible
change, exactly as the brief requires.

wave autotune: CLEAN wave (0 reverts, 0 failed verifies) -> wave_streak 0 -> 1. k_current
  stays 2; a second clean wave would raise it to 3, though the gear-2 cap of 2 would still
  bind.
must-haves: M-1 evidence obtained (README citation owed to N-7); M-3 CLOSED; M-5 green.
  M-2 (N-2) and M-4 (N-5, R-1) remain.
backlog: 3 done, 4 todo, 6 blocked (all six human-owned rulings, unchanged).

next: N-7 — cite the run URL in README.md and state the floor precisely (verified-at-18, not
  proven-minimal). S-effort, conductor-owned, its own sealed gate. Then N-2, the run's
  highest-risk item, which wants its own wave with nothing else touching REPORT.md.
commit: (this cycle)
next wakeup: see runfile
runfile-mirror: written to runs/current.json and current.json.bak this cycle
