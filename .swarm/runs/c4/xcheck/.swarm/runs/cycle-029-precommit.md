# Cycle 29 — conductor pre-commitment on T-025, sealed before dispatch

Written after running `.swarm/runs/cycle-029-probe-T025.js` and BEFORE any agent
was dispatched. The builder does not see this file. Its purpose is the cycle-10
method: convert "the agent's conclusion reads well" into a measurement, by
committing to an answer the agent cannot have seen.

## The item's filed expectation

T-025 was filed (cycle 27) as **PROBABLY A BOUNDARY**, priority 8. Its stated
reasoning: closing it requires scanning PAST non-blank content to find a table,
which is "precisely the mis-attachment hazard T-018 was told to avoid", so the
fix "trades a loud false rejection for a possible silent mis-parse, which is the
wrong direction on this repo's own stated standard."

That hazard was **argued, never measured**. This is the same shape as cycle 28,
where an argued-safe fix passed 22/22 and was still rejected only because a
probe went looking for the silent case.

## Conductor's sealed classification: **HOLE**, not BOUNDARY

I expect the builder, if it measures honestly, to reach HOLE. I expect a builder
that reasons from the item's notes without measuring to reach BOUNDARY, because
the notes argue that case explicitly and confidently.

### Evidence (cycle-029-probe-T025.txt), 6 README variants x 3 scan variants

- **Controls hold.** PRISTINE + conservative = 73/73/0; every one of the 18
  cells parsed. No verdict is read from a broken instrument (cycle 19).
- **The false rejection is real and reproduced.** R1 — the exact T-025 layout,
  every number still true — is RED at 73/72/1 under the conservative scan.
- **No silent hole was found under EITHER widening.** Across the genuinely
  wrong READMEs (R2 row-deleted under the T-025 layout, R3 table-rows deleted
  wholesale, R5 orphaned heading adopting a sibling's table) every widened cell
  was RED. Where they differ, the widened scans are **louder**, not quieter:
  R2 goes 73/72/1 conservative -> 73/71/2 widened; R3 goes 73/72/1 -> 73/71/2
  under W1.
- The predicted direction of harm did not appear once.

### The distinction that decides the fix shape

Two widenings were measured, and they are NOT equivalent:

- **W1 (maximal — skip anything until the next `| Tag | Count |` header row)**
  fixes R1 but introduces a NEW false rejection: R4, a CORRECT README carrying
  a decoy sentence with a `2–4` token above the real heading, is GREEN under
  the conservative scan and RED under W1. So W1 trades one false rejection for
  another. It should be rejected.
- **W2 (moderate — skip blanks and prose, but STOP at the next line carrying a
  band token)** fixes R1, keeps every defect loud (R2/R3/R5 all RED), and does
  NOT introduce R4's false rejection. R4 stays GREEN.

W2 is not merely "the sample came back clean". It restores a **structural**
property: a heading can never reach past a sibling band heading, so no heading
can steal a table that another heading claims. That is an argument about the
mechanism, which is what the conservative scan had and what W1 gives up.

## Honest limits of this pre-commitment

1. **Absence of a silent hole across 5 variants is sampling, not proof.** The
   conservative scan's safety is structural; W2's is structural for the
   sibling-theft case specifically, and sampled for everything else. If the
   builder argues BOUNDARY on the ground that it will not trade a proof for a
   sample, that is a legitimate position I would accept, and I will say so
   rather than scoring it wrong.
2. **A labelling error in my own harness, recorded not back-edited.** I marked
   R4 `wrong: true`. It is not — every number in it is true, so it is a second
   CORRECT-README case, not a wrong one. This did not corrupt the silent-hole
   verdict, which requires `conservative RED`, and R4 is conservative GREEN; it
   could never have produced a false silent-hole signal. But the label is wrong
   in the source and I am recording that rather than fixing the file to look
   clean (cycle 21/24/27 precedent).

## What I will accept at the gate

- **HOLE + W2-shaped fix**: accept if R1 goes green, R2/R3/R5 stay red, R4 stays
  green, and the suite is 73/73 or 74/74 with the new test attributable.
- **BOUNDARY + comment**: accept ONLY if the comment names the exact layout out
  of scope AND the builder's own measurement is shown — a BOUNDARY reached by
  restating the item's notes without measuring is a fail, because the notes'
  central factual claim is the thing in question.
- Either way the guard must keep failing LOUD, and the file must carry no
  change outside the extraction site plus (if HOLE) one test.
