import { appendFileSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
const SW = '/opt/targets/aphorism-cli/.swarm';

const add = `
cycle 6 addendum — the dashboard render harness reports a claim it cannot support.
  Rendering this cycle surfaced a defect in the harness itself (runs/c*-dashboard.mjs, the
  in-place anchor-substitution pattern cycles 3-6 all use). It replaces the evidence block at
  the FIRST occurrence of the evidence <pre> tag. dashboard.html contains THREE such blocks:
  two inside HTML template comments and one live in the TARGETS region — and the first is a
  COMMENTED one. So the harness printed "ok evidence block" and "MISS count: 0" while the
  block a visitor actually sees still carried cycle-5 evidence. Measured, not inferred:
    line  60  evidence block …(c6)…   <- inside a comment (was being updated)
    line 346  evidence block …(c5)…   <- inside a comment (stale)
    line 379  evidence block …(c5)…   <- LIVE, outside any comment (stale)
  Corrected within the cycle: all three now carry the c6 evidence, verified by re-scan
  (remaining c5 blocks: 0; dashboard 41,929 -> 45,257 bytes). The cycle-5 journal line
  "Every anchor hit, zero MISS" was therefore TRUE of the harness and FALSE of the page —
  recorded rather than quietly fixed, because the gap between those two statements is exactly
  the kind of thing this run exists to find. Filed KI-33. Adjacent to but DISTINCT from KI-19
  (gen/next meta fields never substituted by any render script): KI-19 is a field never
  written; this is a field written to the wrong one of several copies while reporting success.
  Also corrected this cycle, same render: the phase badge still read BUILD at cycle 5 despite
  the phase having advanced to REVIEW — no cycle-5 anchor targeted it. It now reads QA.
`;
appendFileSync(`${SW}/journal.md`, add);

const p = `${SW}/state.json`;
const st = JSON.parse(readFileSync(p, 'utf8'));
st.known_issues.push({
  id: 'KI-33',
  severity: 'medium',
  opened_cycle: 6,
  owner: 'swarm-maintainer',
  what: 'The dashboard render harness (runs/c*-dashboard.mjs, used by cycles 3-6) substitutes the evidence block at the FIRST match of the evidence <pre> tag. dashboard.html holds three such blocks, two of them inside HTML template comments, and the FIRST is a commented one. The harness therefore reports "ok evidence block" and "MISS count: 0" while the live TARGETS-region block stays stale. Measured at cycle 6: lines 60 and 346 are commented, line 379 is live; only line 60 was being updated. A "zero MISS" render report is NOT evidence that the page a visitor sees is current. The same duplication hid a second staleness: the phase badge read BUILD through cycle 5 although the phase was REVIEW.',
  settled_by: 'Either strip the template-comment copies from dashboard.html so exactly one evidence block exists, or make the harness select the block not enclosed in a comment and assert an EXPECTED occurrence count per anchor (it already prints counts for the other anchors, which is how the duplication became visible at all). Cycle 6 corrected the CONTENT by replacing every block still carrying the previous cycle tag, but the harness bug itself is untouched — hard rule 5 forbids editing SWARM tooling mid-run.'
});
writeFileSync(p + '.tmp', JSON.stringify(st, null, 2));
renameSync(p + '.tmp', p);
console.log('addendum appended | known_issues now ' + st.known_issues.length);
