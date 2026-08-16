# cycle 36 — sealed pre-dispatch gate design for T-027

Written BEFORE the builder is dispatched, hashed, and then DELETED from disk
until the builder returns. Only cycle-036-precommit.sha256 is committed before
dispatch. This is the cycle-36 mitigation for KI-8, where a sealed baseline
written to <target>/.swarm/runs/ was read by the very agent it was sealed from
(cycle 33, T-026). /tmp is unreachable to subagents per KI-6 but is denied to
the conductor's Write tool, so a commit-reveal scheme replaces a hidden path:
the hash binds the conductor, and a deleted file cannot be read at all.

## The item

T-027: headingNamesListBehaviourSection tests /\bbehaviour\b/i, so the American
spelling "### `--list` behavior" yields ZERO candidates and the suite fails LOUD
at the "none found" locator message. Classified HOLE at cycle 33. The fix
recorded there: /\bbehaviour\b/i -> /\bbehaviou?r\b/i at
test/readme-tags.test.js line 1043.

## What the builder is told

The item's acceptance text and the file. NOT this gate, NOT the cell list, NOT
the discriminators below.

## Predictions, recorded before I see the builder's work

P1. The shipped fix is the one-character widen at line 1043 and nothing else.
    Refutation condition: any edit outside headingNamesListBehaviourSection.
P2. H1 (American spelling, all claims true) is RED on HEAD and GREEN on WORK.
P3. H7 (the TYPO "behaviuor") stays RED on WORK. This is the discriminator the
    builder cannot have coded to: a sloppy fix -- dropping the word requirement,
    or /behavi.*r/ -- turns H7 GREEN. A principled behaviou?r widen leaves it RED.
P4. H4 (American-spelled DECOY heading alongside the real British one, every
    claim in both TRUE) flips GREEN->RED. This is the KNOWN COST cycle 33
    measured as cell V6. I predict it reproduces. If H4 is GREEN on WORK the fix
    has weakened the ambiguity check and the gate FAILS.
P5. WORK and REF (my own independent rebuild of the widen) agree on all 10 cells.

## Arms

- HEAD  git show HEAD:test/readme-tags.test.js
- WORK  the working tree as the builder leaves it
- REF   HEAD with /\bbehaviour\b/i -> /\bbehaviou?r\b/i applied by the gate itself

REF exists so that "the builder's fix works" and "the intended fix works" are two
separate measurements. A divergence anywhere is a finding.

## Cells (each mutates README.md, then runs the FULL suite)

H0  pristine README                                   control, GREEN everywhere
H1  heading -> "### `--list` behavior" (American)      RED@HEAD, GREEN@WORK
H2  H1 + format literal separator em-dash -> ASCII "-" RED@WORK on the SEPARATOR
    MISMATCH, not on the locator parse-miss. This is the L-029 attribution half:
    it proves the fix FOUND the section and then caught a real mutation, rather
    than merely going quiet. Checked by message content, not just by colour.
H3  H1 + a false README tag count elsewhere            RED@WORK (other guards live)
H4  real British heading + American decoy, both true   GREEN@HEAD, RED@WORK
                                                       (the measured cost, P4)
H5  two British headings both qualifying               RED everywhere (cycle-30
                                                       P1/P2 ambiguity preserved)
H6  only "### `--list-only` behaviour"                 RED everywhere, "none
                                                       found" -- flag-token intact
H7  heading -> "### `--list` behaviuor" (TYPO)         RED@WORK  <-- discriminator
H8  heading -> "### `--list` BEHAVIOR" (Am. + caps)    GREEN@WORK (case-insensitive
                                                       match survives the widen)
H9  heading -> "### `--list` output" (no word at all)  RED everywhere, "none found"

## Automatic checks (a passing gate must not depend on my eyesight)

C1  H0 GREEN on all three arms.
C2  H1 RED@HEAD and GREEN@WORK. HEAD is literally the tree with the fix removed,
    so this single comparison proves both L-029 directions: the false rejection
    disappears with the fix and returns without it.
C3  H1 GREEN@REF -- the intended fix lands independently of the builder's.
C5  H2 RED@WORK AND the output names the format-literal/separator failure AND
    does NOT emit the locator "none found" message.
C6  H7 RED@WORK.                                     (discriminator, P3)
C7  H9 RED@WORK and H6 RED@WORK.                     (word anchor and flag token intact)
C8  H5 RED@WORK.                                     (ambiguity preserved)
C9  every cell RED@HEAD is still RED@WORK, EXCEPT H1 (the one intended flip).
C10 WORK and REF agree on all 10 cells.              (P5)
C11 H4 is GREEN@HEAD and RED@WORK -- the cost reproduces in the predicted
    direction. GREEN@WORK would mean the ambiguity check was weakened: FAIL.

## Verdict rule

All checks pass -> T-027 done. Any failure -> todo, attempts+1, and the specific
failing check is journaled as the reason.

If the builder returns BOUNDARY instead of a fix, the gate still runs: C3 on the
REF arm alone settles whether a fix was available, and a BOUNDARY argued against
a REF arm that is GREEN on H1 is refuted.
