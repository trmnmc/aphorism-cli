# Cycle 30 pre-commitment — T-021 attempt 2

Sealed to disk BEFORE the builder was dispatched. The builder never sees this file.
Its purpose is the cycle-10/29 one: convert "the conductor read the fix and agreed"
into a measurement. A fix that arrives at the shape named below is evidence about the
conclusion; a fix that arrives somewhere else is not automatically wrong, but the
divergence has to be argued rather than waved through.

## Baseline this is written against

`.swarm/runs/cycle-030-baseline.txt`, measured this cycle on the current 74-test suite:

| cell | README state | signature | reason |
|---|---|---|---|
| B0 | pristine | 74/74/0 | — |
| B1 | heading backticks dropped | 74/73/1 | HEADING-PARSE |
| B2 | B1 + real literal mutated | 74/73/1 | HEADING-PARSE |
| B3 | real literal mutated only | 74/73/1 | SEPARATOR-MISMATCH |
| P3 | decoy `### ` heading carrying both tokens + a correct-looking literal, real literal mutated | 74/73/1 | SEPARATOR-MISMATCH |

Two readings carried forward from cycle 28 and re-confirmed here, not inherited:

1. **B1 == B2.** The heading-parse failure MASKS the literal mutation, so T-021's
   original clause ("a mutated format literal under that same reformatted heading still
   FAILS") is ALREADY TRUE at HEAD and is satisfiable by a fix that never restores
   detection. The red half must therefore be required to fail with SEPARATOR-MISMATCH.
2. **P3 is RED at HEAD.** HEAD catches the decoy case. Cycle 28's rejected fix turned
   this cell GREEN — a silent hole. Any fix that leaves P3 green is rejected again.

## Classification

**HOLE**, not BOUNDARY. Stated in advance so a BOUNDARY finding has to beat this rather
than merely be asserted: an `### ` heading is real markdown structure, and "which h3 is
the `--list` behaviour section" is answerable from structure without consulting any
English sentence. That is what separates this from T-023, where a heading genuinely
carries two true "N tags" phrases and prose supplies no ground truth for choosing.

What would make BOUNDARY the right answer, named now so this seal cannot function as a
rubber stamp for the answer I prefer: a measurement showing that every structural
disambiguation rule either leaves P3 green or introduces a NEW false rejection on a
correct README. If the builder shows that, BOUNDARY is correct and the item should be
documented at the extraction site instead.

## Preferred fix shape

Re-shape `getListBehaviourSection` to read STRUCTURE, per the standing cycle-25 finding
and T-024's acceptance:

1. Enumerate every line matching `^###\s+` — headings as headings, not as a literal.
2. Normalise each heading's text by stripping backticks.
3. A heading is a CANDIDATE iff its text carries `--list` as a **standalone token**
   (not the prefix of a longer flag such as `--list-only`) AND the word
   `behaviour`/`behavior`.
4. **Zero candidates → assert LOUD** (today's heading-parse message; the guard must not
   go quiet).
5. **Two or more candidates → assert LOUD**, naming every candidate heading. This is the
   disambiguation step, and it is what kills P3: first-match-wins is what cycle 28
   measured into a silent hole, so ambiguity must be reported, never resolved by
   position.
6. Exactly one candidate → that heading's section, sliced to the next `### ` or `## `.

Predicted cell outcomes if that shape lands:

- B0 → GREEN (74 + 1 new test = 75/75/0)
- B1 → GREEN (the reformat is honest and now tolerated)
- B2 → RED, SEPARATOR-MISMATCH (detection restored, no longer masked)
- B3 → RED, SEPARATOR-MISMATCH (unchanged)
- P3 → RED, and the reason should now be an AMBIGUITY assert rather than
  SEPARATOR-MISMATCH — either is acceptable as long as it is RED and loud.

## What the conductor will NOT accept

- Any fix leaving P3 green (cycle 28's exact rejection).
- Any fix whose red half fails only on HEADING-PARSE — that is the masked signature and
  proves nothing.
- Any fix keyed to a prose sentence in the section body (standing T-012 hazard).
- A new false rejection on a correct README shape the guard handles today.
