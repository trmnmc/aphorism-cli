
## cycle 8 — 2026-08-17T13:28Z — aphorism-cli — VALUE_LOOP → **target DONE, next cycle is WRAP_UP**

gear 3 (cruise) · guest mode, dial 1.0 effective · rho NOT COMPUTABLE (ccusage reports no limit)
  · window 48,240,264 tok / $37.47 at 113 min into the 11:00Z-16:00Z block · burn 425,321 tok/min
  ($19.82/hr) · block projection $98.92, DOWN from $99.73 — second consecutive fall · weekly heat
  1.071 (used 5.0% vs elapsed 4.67%), DOWN from 1.117 because the DENOMINATOR moved and the
  numerator held — the rounding artefact cycle 6 warned about, now seen falling · posture trickle,
  allow_overall_pct steady at 5 · bin/swarm-budget.sh DENIED for the SIXTH consecutive cycle
  (J-1b allowlist gap; the exact patch has been sitting in playbook/HANDOFF-allowlist-2026-08-17.md
  since 08:52Z and is still owed a human).

work: build-wave, 1 item, direct-Agent dispatch (Workflow is review-gated in a -p session), sonnet.
  J-9 — a FALSE duplicate of a RECOGNISED count-claim shape is unread in the Tag vocabulary section.
  OUTCOME: **DONE via route (b), the retirement branch its own acceptance offers.** Nothing shipped.

### Why I took the item two cycles in a row recommended against

Cycle 6 filed J-9 at p6 with a stopping rule and cycle 7 recommended leaving it untaken and
wrapping up. I checked that advice instead of inheriting it — which is precisely the lesson cycle 7
itself wrote, now applied to cycle 7. J-9's acceptance, read directly, offers a NON-HUMAN branch:
"or the item is retired with a measured argument that the fix costs more false rejections than the
hole is worth." Executing that branch is the same treatment must-have J-2 required for the five
prose items ("closed OR formally retired as measured boundaries") — inside the charter, not a
descent past it. Wrapping up 19 hours early while the only dispatchable item sat open is the weaker
artifact. Cycle 7 explicitly sanctioned this route ("take it ONCE and honour the stopping rule"),
and the stopping rule was honoured: no J-10 filed.

### VERIFICATION EVIDENCE — the sealed gate, authored and validated BEFORE dispatch

Gate .swarm/runs/cycle-008-r2-gate-J-9.mjs, 24 scored cells x 2 arms. sha256 of the script AND of
its pre-dispatch output committed to the target at bdacc00 before any agent ran; both plaintexts
deleted for the dispatch window (KI-8 commit-reveal). Pre-dispatch reading:

```
arm A suite: {"verdict":"GREEN","pass":102,"fail":0}
SCORE 18/24 cells hold; attribution 0/3
  control: 1/1     hole: 0/6     cost: 4/4     regression: 13/13
```

The six BREAKs are the item: all 6 hole cells GREEN, i.e. the hole reproduces. Three of them
(J4/J5/J6) were authored this cycle and no builder has ever seen them — J4 puts the falsehood at
the END of the section, proving the hole is position-independent rather than an artefact of the
published probe's insertion point; J5 and J6 use different sentence frames.

### The builder reverted — and the re-run proved it byte for byte

The builder took route (b) itself: built the fix, measured that it introduces false rejections on
true prose, reverted, reported. On restore the gate script hashed byte-identical to its commitment
(c555b7a5...9cf8), and re-running it AFTER dispatch reproduced the output file byte-identical to
the sealed hash (d9d99054...5883) — 24 cells x 2 arms, 48 suite runs, every verdict the same. That
is a mechanical proof the tree did not move, independent of trusting a clean `git diff`.

### The claim that decided the item was reproduced, not accepted — and it was partly wrong

The builder's cost measurement IS J-9's verdict, and it arrived as a claim whose evidence the
builder had deleted with its own scratch tree (as instructed). So I rebuilt the candidate fix from
the SHIPPED test file — never from its diff, which no longer existed — in two variants across the
four extraction sites: V1 naive first-match -> matchAll, V2 the same plus threshold extraction for
the "or more" shape. Full output .swarm/runs/cycle-008-r2-cost-probe-out.txt:

```
cell  kind     V0            V1            V2            sentence
K1    kill     GREEN(102/0)  RED(101/1)    RED(101/1)    "9 tags appear on 2 or more entries."
K2    kill     GREEN(102/0)  RED(101/1)    RED(101/1)    "The corpus contains 13 distinct tags."
K3    kill     GREEN(102/0)  RED(101/1)    RED(101/1)    "In fact 4 tags sit on exactly one entry."
C2    cost     GREEN(102/0)  RED(101/1)    GREEN(102/0)  "7 tags appear on 5 or more entries."
C3    cost     GREEN(102/0)  RED(101/1)    GREEN(102/0)  "2 tags appear on 10 or more entries."
C5    cost*    GREEN(102/0)  RED(101/1)    RED(101/1)    "Of these, 7 distinct tags carry 5 or more entries each."
C6    cost*    RED(101/1)    RED(100/2)    RED(100/2)    "With 50 entries in the corpus, exactly one aphorism is chosen per run."
C7    cost*    GREEN(102/0)  RED(101/1)    RED(101/1)    "7 tags appear on five or more entries."

V0: control GREEN (sound) · kills 0/3 · FALSE REJECTIONS 1/7 [C6]
V1: control GREEN (sound) · kills 3/3 · FALSE REJECTIONS 5/7 [C2, C3, C5, C6, C7]
V2: control GREEN (sound) · kills 3/3 · FALSE REJECTIONS 3/7 [C5, C6, C7]
```

**A CORRECTION TO THE BUILDER, found by the V0 column.** It reported THREE new false rejections.
Only TWO are new. C6 is RED on V0 as well — rejected by the SHIPPED tree before any fix, by the J-5
unrecognised-digit guard doing exactly what its own failure message documents. The builder's
sentence "under the original guards, none of cases 3-5 would ever fail" is false for that case. Its
CONCLUSION is untouched — two new false rejections is still decisive — but the ledger should be
right, and without a V0 column the over-count would have entered the record uncorrected.

And the sealed cells against V2, with failability controls
(.swarm/runs/cycle-008-r2-cost-addendum-out.txt):

```
[HOLD] J4   V2=RED(101/1)    want RED     "Overall 9 tags appear on 2 or more entries."
[HOLD] J5   V2=RED(101/1)    want RED     "Note that 30 distinct tags remain after the fold."
[HOLD] J6   V2=RED(101/1)    want RED     "Even so, 6 tags appear exactly once today."
[HOLD] J4t  V2=GREEN(102/0)  want GREEN   CONTROL — same sentence made TRUE (12)
[HOLD] J5t  V2=GREEN(102/0)  want GREEN   CONTROL — same sentence made TRUE (12)
[HOLD] J6t  V2=GREEN(102/0)  want GREEN   CONTROL — same sentence made TRUE (0)
SCORE 7/7 cells hold
```

The controls matter: without them three REDs could mean "the fix catches these falsehoods" or "the
fix rejects these sentences whatever they say", and those are different findings.

### The ruling

A fix closes the hole on 6/6 cells and costs 2 new false rejections on entirely TRUE, ordinary
prose (V1 costs 4). C5 is rejected because "distinct tags" is ambiguous between "the vocabulary
total" and "different tags" — a property of the English phrase, not of the implementation. C7 is
rejected because the threshold is spelled as a word. Both are sentences a maintainer would plainly
write. This is the identical trade cycles 31, 32 and 35 each measured and each reverted, and the
cycle-39 family decision forbids buying kills with false rejections. **Retired.** The hole stays on
the record with its exact reproduction rather than being closed at that price.

Conductor-run test_cmd on the real tree, unchanged as a retirement cycle should leave it:

```
i tests 102   i pass 102   i fail 0   duration_ms 4582.9
```

### MY INSTRUMENT DID NOT CATCH ITSELF — first time in six cycles, and that is not a win

Cycles 3-7 each found a defect in my own gate via a control cell (missing shell glob; a cell
reading a random draw as signal; a gate checking the SHAPE of a fix rather than the FACT; a
reporter-format assumption; a buffer-trim off-by-one). Five for five, all found by controls, none
by inspection. This cycle's gate ran correctly on first authoring. The honest reason is not that
the authoring problem is solved — it is that I copied cycle 6's harness wholesale instead of
writing a new one, which removed most of the surface those five defects lived on. Reuse, not skill,
and a sample of one either way.

### THE TARGET IS DONE — declared with ~19 hours of clock left, deliberately

All five must-haves are verified done. J-9 was the last dispatchable item and is now terminal. The
three items left on the board each require a human BY THEIR OWN ACCEPTANCE CLAUSE, verified this
cycle by reading all three rather than inheriting the claim: T-006 "confirmed against a primary
source"; T-040 "a human confirms two judgment calls"; J-7 "a human rules ... written into SPEC.md
as an explicit clause either way". Every remaining open known issue is human-owned (KI-2), SWARM
tooling fenced read-only by hard rule 5, or a documented boundary inside the guard family cycle 0
fenced off. Nothing left passes the VALUE_LOOP ratchet, because nothing left is actionable by a
swarm at all.

Cycling for another 19 hours on that board is the "look productive forever while the product does
not move" failure the cycle-6 decision names. The clock is not a reason to keep going. Phase set to
WRAP_UP; the runfile target status stays `active` until WRAP_UP step 6 sets it, per the written
procedure, and `wrap_up_complete` stays false so the pacer still spawns the wrap-up cycle.

KI-7 scratch control PASSES a second consecutive cycle for run #2: the dispatch prompt named the
exact in-target path .swarm/scratch-c008-r2-j9/ and required removing THAT directory; the builder
did, and `git -C /opt/swarm status --porcelain` was empty at orient AND at commit.
