# cycle 38 — sealed gate design for T-035

Written BEFORE dispatch. Hash committed pre-dispatch; this plaintext is deleted for the
whole dispatch window and restored afterwards (KI-8 commit-reveal, third consecutive cycle).

## the defect under test

`test/readme-tags.test.js` — test named `README should acknowledge single-entry tag limitation`.
Cycle 37 (T-033) scoped it to the `## Tag vocabulary` section and replaced 3 substring calls
with 9 phrase-level regexes. Cycle-37 discriminator D2 measured what scoping did NOT buy: a
decoy sentence INSIDE the section that happens to contain a marker phrase still silently
satisfies the guard when the genuine acknowledgement has been stripped. Silent on both arms
at 78/80. This item is that residual.

## judging rule (unchanged from cycles 36/37)

Every cell judged on the FAILING TEST NAME under `--test-reporter=tap`, never on suite
colour. Cycle 36 proved a silent cell's suite-level red can be produced entirely by a
neighbouring count guard noticing the stripped sentences.

`ack` below = the test named `README should acknowledge single-entry tag limitation`.
FIRED = that name appears among the failures. SILENT = it does not.

Two arms:
- HEAD = `test/readme-tags.test.js` at commit d7aff20 (pre-dispatch tree).
- WORK = the builder's returned file.

"Proven twice per L-029" is satisfied by the two-arm structure: a cell that FIRES on WORK
and is SILENT on HEAD is a kill attributable to this change; removing the change (the HEAD
arm) lets the mutation survive.

## cells

All mutations are applied to README.md in a scratch copy of the tree. "acks stripped" means
the three genuine acknowledgement clauses in `## Tag vocabulary` are removed or neutralised:
line 55's `the remaining 21 appear on exactly one entry`, line 81's `The remaining 21 tags
appear exactly once:`, and line 83's `Single-entry tags are real ...` sentence. Where a
count-bearing sentence must survive for the neighbouring count guards, only its
occurrence-claim clause is reworded away; the digits stay.

| cell | mutation | HEAD expected | WORK required |
|---|---|---|---|
| C0 | pristine README (control) | ack SILENT | ack SILENT |
| A1 | acks stripped + decoy `Each tag name is exactly one word.` INSIDE the section | ack SILENT | **ack FIRED** |
| A2 | acks stripped, NO decoy (anti-deletion control) | ack FIRED | ack FIRED |
| A3 | genuine acknowledgement MOVED verbatim into `## Layout` (cycle-37 cell D4) | ack SILENT | ack FIRED |
| D1 | acks stripped + decoy `Only one flag may be combined with the JSON output.` | ack SILENT | ack FIRED (expected) |
| D2 | acks stripped + decoy `Each aphorism carries exactly one primary tag.` | ack SILENT | ??? SHARP |
| D3 | acks stripped + decoy `Tags are listed in alphabetical order, one entry per line.` | ack SILENT | ??? SHARPEST |
| D4 | acks stripped + decoy `A tag name is a single-entry token with no spaces.` | ack SILENT | ??? SHARP |
| D5 | honest trim: drop lines 55 and 83's clauses, KEEP line 81's `appear exactly once` | ack SILENT | ack SILENT (must not newly reject) |
| D6 | acks reworded to `each backed by a lone aphorism` (T-034's D1 wording) | ack FIRED | record only — LOUD-direction cost check, NOT an acceptance requirement |
| D7 | rename `## Tag vocabulary` to `## Tags` (cycle-37 cell D3 / T-036) | ack SILENT | record only — the fix's known cost surface |
| R1 | pristine README, FULL suite `node --test test/*.test.js` | 80/80 | 80/80 |

## discriminators the item did not name — this is the point

The item's acceptance clause names exactly ONE decoy string: `Each tag name is exactly one
word.` (cell A1). Cycle 37's sharp finding was that an acceptance clause naming a literal
test input is SELF-FULFILLING — the builder sees the acceptance, so passing A1 cannot
distinguish a general fix from one fitted to that clause.

**D2, D3 and D4 are therefore the cells that decide this gate**, and none of them is in the
dispatch prompt. Each carries a corpus-domain noun (`aphorism`, `entry`, `tag`) next to its
marker phrase, so a fix that merely requires "marker phrase near a domain noun" passes A1
and fails these. D3 is the sharpest: `one entry per line` contains the literal marker
`one entry` AND the noun `entry`, in a sentence that is about display order, not occurrence
counts.

Predicted (recorded now so it can be refuted):
- P1: the builder will bind markers to a subject noun and A1 will pass.
- P2: **D3 will still be silent on WORK** — the subject-noun binding it most likely ships
  cannot separate `one entry per line` from `appear on exactly one entry`.
- P3: D2 will be silent on WORK for the same reason.
- P4: D6 stays FIRED on WORK (T-034 remains open); a fix that tightens will not loosen.

If P2/P3 hold, the honest verdict is a NARROWING, not a closure, and the item's classify-first
clause (SPEC I-2) applies: it passes only if the builder either closes them or documents the
residual at the assertion site with a measurement. A pass fitted to A1 alone with D2/D3/D4
silent is NOT a pass — it is the same half-repair T-033 delivered, and filing it as such is
the honest outcome.

## cost rule

Any cell where WORK is worse than HEAD is the fix's measured cost and must be reported with
its arithmetic (does the mutation already fail other guards at HEAD?), exactly as cycle 37
handled D3/T-036. A fix that makes the pristine README fail (C0) is rejected outright.
