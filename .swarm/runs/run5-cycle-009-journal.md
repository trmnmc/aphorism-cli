
# cycle 9 — 2026-08-20T05:39Z — the owed TASTE gate, and the red main it walked into

Gear 1, ninth consecutive crawl (ρ 8.41, up from 7.92; weekly governor still hot at 100%/100%,
heat 2.32, ceiling 2, promote blocked). k_cap 1. Guest mode, dial 0.33. Work type: qa-verify
**taste** — one fable judgment seat, dispatched as a direct Agent call per the headless
workflow fallback — plus a conductor-authored doc repair that the gate turned out to demand.

## The pick, and the candidate that reconnaissance killed before it cost anything

Every P-item must-have is closed (P-1…P-4, P-6, RF-1…RF-4). The backlog held one todo (P-5,
the standing conductor guard) and eight human-owned blocked items. So this was a VALUE_LOOP
cycle in everything but name, except for one thing: **the TASTE pass was still owed.**
cycle.md step 4 gate 4 puts one review-fix, one QA and one TASTE pass before POLISH, and this
run had spent cycles 6 and 7 on the first two and cycle 8 on RF-4.

I nearly skipped it. The argument for skipping was decent: this target's taste findings are
already enumerated as TS-1…TS-6, all blocked behind a brief that forbids acting on them, so a
taste pass looked like paying a fable seat to re-derive six known blocked items at ρ 8.41.
I ran it anyway, and the reason is worth writing down because it is a rule and not a mood:
**predicting a gate's verdict is not the same as running it.** Skipping a gate because I
expect its answer is the same move as weakening one, wearing better clothes.

Before that, one candidate died cheaply and should be recorded as a *win* rather than a
non-event. I had a plausible theory that the 37-entry `known_issues` list had drifted stale
and that auditing it would be high-yield gear-1 housekeeping — KI-31 (unhandled stdout EPIPE)
in particular reads as open in the morning report, and I had confirmed from the source that
`bin/aphorism.js` now carries both stream handlers. Two minutes of reading before dispatching
anything showed KI-31 already carries `status: resolved`, and that the list is maintained
throughout. One stale-ish entry across 37 is not a wave. **Cost of the theory: two file reads.
Cost had I dispatched on it: an agent, a gate, and a cycle.** The reconnaissance-before-dispatch
habit paid for itself here in a way that leaves no artifact unless it is deliberately recorded.

## The taste pass: wears-thin, and three findings that minted zero backlog ids

The agent was given the spec digest and the binary and explicitly told NOT to read the journal,
the backlog, REPORT.md, or the test suite — it had to form its judgment from the product. It
returned `wears-thin` after 10 minutes, 14 hand-run core-loop uses plus scripted draws, and
every flagged flow walked (`--help`, `--author`, `--tag`, AND-filtering, `--list`, `--json`,
`--seed` determinism, the README daily-seed trick, two no-match cases, one usage error).

Three findings, **all three landing on already-filed blocked items**:

| finding | severity | maps to |
|---|---|---|
| the draw has no memory; first repeat at use 12, one back-to-back duplicate | notable | **TS-1** |
| corpus is canonical greatest-hits; attribution predictable by use 6 | notable | **TS-3** |
| `--tag testing` dead-ends with no hint of what would match | minor | **TS-6** |

Zero ids minted from the taste pass. That is the honest result and it is a stronger one than a
pile of new items would have been: this is the **third** independent taste pass across three
runs (run #3 original, run #4 cycle 9, now run #5 cycle 9), each by an agent that had not seen
the others' output, and all three converge on the same three gaps and find no fourth. Three
passes agreeing is evidence the taste backlog is *complete*, not that the pass was wasted.
Corroboration was folded into the TS-1/TS-3/TS-6 notes per the cycle-6 dedupe rule.

Every label written this cycle says **"run #5 cycle 9"** in full, because run #4's taste pass
also landed at its cycle 9 and those items already carry a bare "cycle-9 TASTE pass" label
meaning run #4. That is exactly the ordinal ambiguity KI-36 exists to record.

**No finding came back `fundamental`**, so no decision entry re-aiming the remaining clock at
depth items was owed, and none was written.

My gate re-measured the agent's arithmetic independently rather than accepting its evidence
field (step 6.7), and the draw is **worse than either agent felt**: a fresh 40-draw sample hit
its first repeat at use **3**. The agent's "use 12" was a lucky sample, and the conservative
direction of the error is worth noting — the finding understates itself.

## The red main

Running `test_cmd` for the P-5 standing guard is routine. It failed.

`test/node-support-citation.test.js` — the P-6 self-falsifying citation guard — was RED at
HEAD. The README's "### Node support" section cites a specific CI matrix and names its own
retirement condition as an executable diff over `src bin test .github`. Cycle 8's RF-4 bumped
`actions/checkout` and `actions/setup-node` from `@v4` to `@v7`. That touches `.github/`, so
the cited diff stopped being empty and the guard fired. **Correctly.** It did precisely the job
it was built for.

So main had been red on a full clone since `c9dd7ff` — an entire cycle — while cycle 8's
journal recorded the suite green at 120/120/0 and CI green on four majors. Both of those
statements were *true when made*, which is the interesting part.

**Why nothing caught it, measured rather than inferred:**

    $ git diff c08562b..057d00c --stat -- src bin test .github     # cycle 8's PRE-commit HEAD
    (empty)
    $ git diff c08562b..c9dd7ff --stat -- src bin test .github      # the same diff, post-commit
     .github/workflows/test.yml | 4 ++--

The guard evaluates `git diff <base>..HEAD`, and HEAD by definition excludes work still sitting
in the working tree. Cycle 8 ran its suite before committing, so the falsification was
literally invisible to it: green, honestly reported. CI then checked out shallow, the guard
skipped, and that skip is the `1 skipped` in all four rows of run 32335038575 — the very number
cycle 8 quoted as evidence of health. **No signal available to the commit that breaks this
citation can observe the break.** Only the next full-clone run can.

### A correction I owe this block

I first wrote that up as a newly-discovered instrument defect. It is not, and I found that out
by reading the section I was about to edit. README §Node support, **limit 2, recorded at cycle
5**, already documents this window explicitly — "any commit touching `src/`, `bin/`, `test/` or
`.github/` is transiently red on a full clone… that window is intrinsic to a self-falsifying
citation, not a defect in the test." Cycle 5 measured it, accepted it knowingly, and repaired
its own citation in the same commit.

So the defect is not the window. **The defect is the word "transient."** It only holds if the
same commit that falsifies the citation also repairs it — and nothing enforces that. Cycles 5
and 6 did it by hand. Cycle 8 did not, and there was no mechanism to notice. That unenforced
assumption is filed as **KI-38**, with **RF-5** (todo, S, sonnet) to close it by having the
guard also compare base-to-worktree, which *would* see uncommitted work and fire pre-commit.

Recording the mis-framing rather than quietly shipping the corrected version, because "I found
a new defect" and "I re-found a documented cost and misread it as new" are different claims
about how much this repo already knows, and the second one is true.

## The repair, and why it is not a weakened gate

The only honest way to green here is to make the claim true: re-point the citation from run
`32331910336` @ `c08562b` to run `32335038575` @ `c9dd7ff`, which is the matrix that actually
describes this tree. Same move cycles 5 and 6 made. The guard was not touched, the pathspec was
not narrowed, no assertion was relaxed.

Every number in the new table was read from the run, not copied from cycle 8's journal:
120 tests / 119 pass / 0 fail / 1 skipped on each of v18.20.8, v20.20.2, v22.23.2, v24.19.0.

Blast radius: `README.md` only, +27/−3. `src/`, `bin/`, `test/`, `.github/` untouched — which
also means the newly-cited base `c9dd7ff` stays clean *after* this commit rather than being
falsified by it. Corpus byte-identical, zero features, zero dependencies.

One honest note carried into the README itself: the action bump changed which *action versions*
run, not which Node majors are tested — the matrix is still `[18, 20, 22, 24]`, byte-identical.
This citation was retired by a change that does not affect the claim it guards. That is the
deliberate cost of a coarse `.github` pathspec, and a guard that tried to judge relevance would
be the easier thing to fool.

## VERIFICATION EVIDENCE

**Taste gate — 9 cells, independently re-derived from the shipped tree, never from the agent's
return** (`.swarm/runs/run5-cycle-009-gate-taste.mjs`, full output in
`run5-cycle-009-verify-taste.txt`):

    PASS  A2  40 draws land near the with-replacement expectation, NOT at 40 distinct
              distinct 24/40, closed-form expectation 27.7, |diff| 3.7; first repeat at use 3
    PASS  A3  30 draws land near expectation (agent reported 22/30)
              distinct 22/30, closed-form expectation 22.7 (agent observed 22)
    PASS  A4  CONTROL: a no-repeat sequence is reported as 40/40 distinct by the same counter
    PASS  B1  --tag testing exits 1 | stderr "aphorism: no aphorism matches those filters"
              | corpus has tag "testing"? false | has "debugging"? true
    PASS  D1  top4 Dijkstra=7, Perlis=5, Pike=5, Brooks=4 | 24 authors | top-3 share 34%
    9 PASS / 0 FAIL

A4 is the load-bearing cell: it proves the counter *can* report "no repeats", so A2/A3 measure
the draw and not the instrument. A rotation implementation could not produce those numbers.

**The citation guard, must-die / must-live** (`run5-cycle-009-control-citation.mjs`) — green is
only evidence if the guard could have stayed red, and a disabled guard looks identical from the
summary line. Note `skipped=0` in both arms: a SKIP must never be read here as a PASS.

    [ARM1 stale base c08562b] exit=1 pass=0 fail=1 skipped=0
    [ARM2 live base c9dd7ff]  exit=0 pass=1 fail=0 skipped=0
    [restore] README byte-identical to pre-control state: true
    3 PASS / 0 FAIL

**P-5 standing guard, full suite at this commit:**

    $ node --test test/*.test.js
    ℹ tests 120   ℹ pass 120   ℹ fail 0   ℹ skipped 0

    $ git diff --stat        README.md | 30 +++++++++++++++++++++++++++---

**The cited CI run, read from GitHub rather than from the journal:**

    $ gh run view 32335038575
    ✓ master test · 32335038575    ✓ test (18) (20) (22) (24) — all four green
    $ gh run view 32335038575 --log | grep -E "tests|pass|fail|skipped"
    test (18|20|22|24)   tests 120   pass 119   fail 0   skipped 1
    node: v18.20.8 / v20.20.2 / v22.23.2 / v24.19.0   via actions/setup-node@v7

## Denial ledger — a correction, not a new entry

`swarm-notify.sh poll` **succeeded** this cycle. Cycle 8 recorded its failure as denial #32, a
structural allowlist gap in the same class as #31. That was wrong, and the allowlist says so:

    $ grep -n "swarm-" /opt/swarm/.claude/settings.json
    "Bash(/opt/swarm/bin/swarm-notify.sh:*)"     <- present, both path forms
    "Bash(bin/swarm-notify.sh:*)"                <- present
    (no swarm-playbook.sh entry in any form)

So **#31 is real and structural** — `swarm-playbook.sh` has no allowlist entry, and re-testing
it this cycle denied again, confirming P-4's hand-off. **#32 was an invocation-form artifact,
not a missing entry**: the script is allowlisted under both prefixes, and the denial came from
how the command was composed, not from what it was. This is KI-37 biting a second time, from
the other side. The running denial count is therefore **31, not 32** — a fence-post error in
the ledger that would have been reported to the operator as a second unactionable allowlist gap
when only one exists. Hard rule 5 still applies to the real one: an allowlist entry is a SWARM
write, so #31 goes to the morning report with its exact patch, not to a live edit.

## Standing situation, stated plainly for the morning

All five must-haves are closed. What remains in the backlog is one standing conductor guard
(P-5), one fresh implementable fix (RF-5), and **eight human-owned blocked items**. The run is
not stalled — this cycle produced verified value and `consecutive_no_value` stays 0 — but it is
close to the honest end of its brief, and the highest-value change to this product (TS-1's
no-repeat rotation, now corroborated by three independent taste passes) remains locked out by
the trickle brief rather than by any engineering obstacle. That is an operator lever, not a
swarm problem, and it is the second run in a row it has been named.

## runfile-mirror

    stop_at 1787276706 | usage_reset_at 1787276706 | mode guest dial 0.33 | auth subscription
    gear 1 (target 1, rho 8.41) | k_cap 1 | demote true | promote false
    weekly: used 100% / opus 100% at week 43.12% elapsed, heat 2.32, ceiling 2, promote_blocked
    targets: /opt/targets/aphorism-cli (active, weight 1) | rotation [0] cursor 0
    watchdog pacer, plist_loaded true | caffeinate_pid 0 (Linux) | cycles_since_recycle 8
    playbook auto: L-008 L-016 L-024 L-026 L-029 L-031 L-033 L-034 L-038 L-042 L-043 L-044 L-046
