# run #4 cycle 10 — Q-6 verification gate SEAL (pre-dispatch)

Committed to the TARGET repo before any agent ran. The gate FILE itself is held under
`SWARM/runs/` for the duration of the dispatch window — hard rule 5 says workflow agents
receive target paths only and never SWARM paths, so a gate held there is STRUCTURALLY
unreachable to a builder rather than merely forbidden to it (run #3 cycle-14 decision).
The file is copied into `.swarm/runs/` after verification and re-hashed against the seal
below.

## Seal

    file    SWARM/runs/run4-c010-q6-gate.mjs
    sha256  cad6150edfacebddf0fee5f56e8ef134d11eee4612d6584309ddaad606f45128
    HEAD    c491e5fbeedcdb6d86fce63657b87c1b0250915b

## Pre-dispatch tree anchors

    src/args.js             2e690560cfc305c25f2b436ca82ea20272ddc6bf7421620f92f1e8242f38eafb
    src/corpus.js           77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e
    src/select.js           dc3e57302f60127eaa04e38baa784512e845e8acf58a140b79a983a782dc236d
    bin/aphorism.js         469c7181364e1f76efa423232b865c9ab8825c92359484c8cdfd557dd75d815d
    test/args.test.js       e4d6c2d1a5c0adfdc36b44770977b692a258eb1cdfc97b45270f82db105d372f
    test/cli.test.js        c0083225bfa7061af610a8bbd45726df8042eacd73126055e53f502a1a612e3c
    test/pipe.test.js       86809b71ed6c8ebd170cdc42ea1f3eaa5dda5b3a2738a60734c1edc987aeb28e
    test/readme-tags.test.js 8b02cf0cfc62adac6f47def5e850abba0a943b0c9e8af85e4837e07cf4b378eb
    test/select.test.js     32bf6218afed774fce102da52380416e2b264833f31ee6b85b2e643cce769f71
    README.md               61e9ad7d3c88fc7ae0ac23db9debbe9b5a19fd72da7ad7017efbd582eabd34c5
    suite                   tests 118 / pass 118 / fail 0

## Discriminating baseline — 17 PASS / 4 FAIL of 21 cells, BASELINE SOUND

A baseline that merely checks its controls will ship a false PASS (run #4 cycle 8, the A2
defect). This one asserts WHICH cells must be RED before the work exists:

    B-cells that MUST be RED and are:  [B1,B2,B3,B4]
    B-cells wrongly GREEN (vacuous):   []
    non-B cells GREEN as expected:     [A1,A2,A3,A4,S1,S2,S3,C1,C2,C3,C4,C4b,C5,C6,C7,G1,G2]
    non-B cells wrongly RED:           []

### One gate bug found and repaired PRE-SEAL

C4 (the control proving B1 keys on the author's NAME rather than on "any non-ASCII byte")
asserted a property of the WORLD — "the README does not currently contain the surname" —
instead of a property of the CELL. It therefore failed against a perfectly correct README
and would have failed for the wrong reason after the fix landed too. Repaired by
extracting B1's predicate into a named function and running the control against THE ACTUAL
CODE: a synthetic document carrying every non-ASCII decoy the README already ships (`—`,
`ℹ`, `…`) and no author name must leave B1 dead (C4), while a document naming the author
must make it fire (C4b). The two-armed shape is the same one C6/C7 use for B4.

## What each cell is for

| cell | class | asks |
|---|---|---|
| A1 | regression | ASCII spelling STILL exits 1, stdout empty — Q-6 is DOCS ONLY, the shipped behaviour is SPEC-conforming and must not change |
| A2 | regression | NFC diacritic spelling STILL exits 0 |
| A3 | regression | NFD (decomposed) input STILL exits 1 |
| A4 | regression | the diacritic-avoiding partials still reach the entry — the measured severity cap |
| S1 | scope | `src/corpus.js` byte-identical (M-5) |
| S2 | scope | no `src/`, `bin/`, `test/`, `.github/` file changed since the seal |
| S3 | scope | the only changed tracked file is `README.md`, read from the WORKING TREE — cycle 5's G5 read committed history and passed silently while uncommitted fixer work sat outside its view |
| B1 | claim | README names the author in its diacritic form |
| B2 | claim | README names the ASCII spelling |
| B3 | claim | README offers a partial that ACTUALLY WORKS — the value is parsed out of the README and EXECUTED, not taken on the document's word |
| B4 | claim | the ASCII spelling is marked as not-matching, in prose within its OWN structural unit, or demonstrated by a README example that really exits 1 |
| C1 | must-die | the presence reader is not a rubber stamp |
| C2 | must-stay-green | the reader can read the file at all |
| C3 | must-die | inverting A1 kills it — A1 measures rather than asserts |
| C4 / C4b | must-die / must-stay-green | B1 is not satisfiable by the README's existing non-ASCII decoys, but does fire on the real name |
| C5 | must-die | B3 on a synthetic offering only the ASCII spelling must fail |
| C6 / C7 | must-not-overreach / must-stay-green | B4 cannot absorb a negation from a NEIGHBOURING unit (instrument defects #17/#18), but does fire on a same-unit one |
| G1 | standing | suite green ≥ 118, parsed for BOTH the TAP and spec-reporter summary shapes (instrument defect #14) |
| G2 | standing | the default run still works |

## Stated residual

B4's prose arm is a regex over a structural unit, which is the weakest cell here and the
KI-12 / R-1 failure class this repo has filed repeatedly. It is bounded three ways rather
than trusted: the unit splitter never merges neighbours, C6 proves the non-merge, and the
arm is a DISJUNCTION with an execution-backed demonstration path, so a README that shows
the failure by example does not depend on the regex at all. B1/B2 remain presence checks;
B3 is the cell carrying execution weight.
