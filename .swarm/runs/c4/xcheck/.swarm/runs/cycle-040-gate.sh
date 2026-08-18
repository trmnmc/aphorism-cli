#!/bin/bash
# cycle-040 verification gate — authored by the conductor AT VERIFICATION TIME.
# Claim under test: T-026 closed as a documented BOUNDARY via a comment-only
# edit at the extraction site, with zero behaviour change.
cd /opt/targets/aphorism-cli || exit 9
echo "=== G1  full suite unchanged (baseline was 80/80) ==="
node --test --test-reporter=tap test/*.test.js 2>&1 | grep -E '^# (tests|pass|fail)'

echo
echo "=== G2  comment-ONLY edit: zero non-comment lines added ==="
git diff -U0 -- test/readme-tags.test.js | grep -c '^+[^+]'      | sed 's/^/  added lines total      : /'
git diff -U0 -- test/readme-tags.test.js | grep '^+[^+]' | grep -vcE '^\+\s*(//|$)' | sed 's/^/  added NON-comment lines: /'
git diff -U0 -- test/readme-tags.test.js | grep -c '^-[^-]'      | sed 's/^/  removed lines          : /'

echo
echo "=== G3  comment sits AT the extraction site (adjacent to lineHasBandToken) ==="
awk '/^function lineHasBandToken/ {print "  function at line " NR; exit}' test/readme-tags.test.js
awk '/T-026 . CLOSED AS A DOCUMENTED BOUNDARY/ {print "  boundary note at line " NR; exit}' test/readme-tags.test.js

echo
echo "=== G4  names the exact prose shape out of scope ==="
grep -c 'EXACT PROSE SHAPE OUT OF SCOPE' test/readme-tags.test.js | sed 's/^/  scope clause present   : /'
grep -c 'WHY LOOSENING THE DIGIT-SHAPE HEURISTIC IS STILL THE WORSE TRADE' test/readme-tags.test.js | sed 's/^/  trade clause present   : /'

echo
echo "=== G5  no product file touched ==="
git status --porcelain | sed 's/^/  /'

echo
echo "=== G6  README byte-identical to HEAD ==="
git diff --stat -- README.md | sed 's/^/  /'
echo "  (no output above = identical)"
