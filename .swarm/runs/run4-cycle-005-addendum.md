
### cycle 5 addendum — the dashboard renderer was publishing cycle-1 text, and had been for four cycles

Step 8 is one file write, so it is the step most easily done on autopilot. Rendering it and
then READING what it published turned up a defect bigger than either finding this cycle
reviewed.

`SWARM/runs/run4-render-dashboard.mjs` derived cycle number, phase, budget and backlog
counts from the tree — and carried FOUR regions as frozen strings written at cycle 1:

- the status line's work description (`PLAN → backlog covers M-1..M-5, 6 items filed`),
  published unchanged at cycles 2, 3, 4 and 5;
- **every** tick tooltip, all five reading `c<N> PLAN: backlog now covers M-1..M-5`;
- the entire verification-evidence pane — four cycle-1 rows including a `FAIL` that no
  longer described anything current;
- three of four crew stations, still announcing "Not dispatched yet. First wave is next."
  three build waves and a review-fix pass later.

**The render's own self-check printed OK on every one of those four renders.** It counted
ticks and checked for comment leaks — the two defects run #3 had filed (KI-11) — and never
asked whether a rendered CLAIM was still true. That is exactly the shape of this cycle's
two sealed-gate defects: an instrument certifying what it measures while the thing it
exists to report rots. Third occurrence of the pattern in one cycle, in a third instrument.

A fifth region was wrong differently: the journal pane rendered **2 one-liners for 5
cycles**, because its regex knew only the `## cycle N | ...` header dialect and this run
switched to `## cycle N — ...`. A parser that silently drops what it cannot parse.

REPAIRED — every region now derives from the tree at render time, plus a STALENESS
SELF-CHECK that fails loudly if any frozen cycle-1 string reappears, if all tick tooltips
are identical, if the journal parser drops blocks, or if the evidence pane fails to cite
the current cycle. It earned its keep immediately: it caught a shape error in my own repair
rather than rendering around it.

FOUR BUGS IN MY OWN REPAIR, all found by reading the rendered output rather than by
trusting the script's OK. Recorded because the count is the argument:

1. **`$` under the `m` flag.** The block parser ended each body with `(?=\n## |$)`, where
   `$` matches end of LINE, not end of input — so every block was truncated at its first
   line. Cycles whose header is followed by a blank line got an EMPTY body and rendered
   "(no work line)". Only cycle 1 survived, because its `work:` line sits immediately under
   its header. Replaced with a split on the heading.
2. **Burn-up spanning four runs.** Deriving the strip from git closed KI-18's
   "not reconstructable" — but the first version walked the whole log and emitted ~150 bars
   across runs #1-#4, since cycle numbers restart per run. Now scoped to run #4's kickoff
   commit, keeping the last commit per cycle number: 5 bars, 0 → 23 → 38 → 46 → 46%.
3. **The evidence pane published the PRE-DISPATCH BASELINE as the result.** Taking the
   first `N PASS / M FAIL` in a verification section reported c5 as 16P/4F against an
   actual 19P/1F, and c4 as 9P/5F against 12P/2F — the unfixed tree, presented as the
   verification outcome. Taking the LAST match was no better: it picked up whichever
   adjudication artifact came after (c5 then read 13P/0F). A section contains several
   instruments' tallies and the prose does not distinguish them, which is the standing
   lesson about asserting against prose. It no longer guesses a tally at all — it renders
   the verbatim snippet the template contract actually asks for, and colours only from the
   unambiguous suite line. Where no suite line exists it prints `suite NOT STATED` rather
   than a green it never earned (c3 does).
4. **A stale destructure.** The staleness check still read `EVROWS` as tuples after I
   changed it to objects, and threw. It failed CLOSED and loudly, which is the behaviour
   you want; the render simply did not publish until it was fixed.

DURABILITY LIMIT, stated rather than assumed: `runs/` is gitignored in the SWARM repo
(`.gitignore:2`), so this repair lives on disk and in this journal, not in SWARM's git
history. That is the already-filed KI-34 class. A future run that regenerates a renderer
from scratch will not inherit the fix — the lesson worth carrying forward is the
self-check, not the script.

FOR THE MORNING REPORT, as a SWARM tool question and not a live edit (hard rule 5 fences
`templates/`): the dashboard template's contract names a burn-up strip, an evidence pane
and a journal pane, and nothing in the pipeline verifies that a render actually satisfies
that contract. Every conductor writes its own renderer under `runs/`, so every run
re-implements — and re-breaks — the same five regions. A checked-in renderer with the
staleness self-check built in would make this class structurally impossible instead of
rediscovered per run.
