// cycle 15 dashboard patch — FINAL render. Same structure as c9–c14.
//
// Standing rules retained, all of them earned by a defect in an earlier cycle of this run:
//   - KI-33: split/join so ALL occurrences move, plus an assertion pass over the LIVE page.
//   - KI-19: the gen/next stamp anchors are GREPPED out of the live page at run time, never
//     copied forward from the previous cycle's harness.
//   - cycle 12: the stale-stamp assertion is ANCHOR-ELEMENT-LOCAL, not a raw substring test,
//     so the page is allowed to remember its own past.
//   - cycle 13: the converse control DERIVES the history serialization from the page.
//   - cycle 14 (the tenth instrument defect): CONTENT anchors are extracted from the live page
//     too, not reconstructed from harness source — the source writes &mdash; and -&gt; where
//     the rendered page carries the literal — and ->. Every anchor below came out of the
//     probe run against the live file.
//   - cycle 14 again: tick assertions are anchored on the attribute delimiter ("), never on >,
//     because [^>]* cannot cross a raw > inside an attribute value (valid HTML).
import fs from 'node:fs';

const P = '/opt/swarm/runs/dashboard.html';
let h = fs.readFileSync(P, 'utf8');
const before = h.length;
const GEN = process.argv[2];

const genM = h.match(/<div>gen <strong>([^<]*)<\/strong><\/div>/);
const nextM = h.match(/<div>next <strong>([^<]*)<\/strong><\/div>/);
if (!genM || !nextM) { console.error('FATAL: stamp anchors not found'); process.exit(2); }
const OLD_GEN = genM[1], OLD_NEXT = nextM[1];
console.log(`derived stamps from live page: gen "${OLD_GEN}" -> "${GEN}", next "${OLD_NEXT}" -> "— (run complete)"`);

const HISTORY_STAMPS_BEFORE = [...h.matchAll(/title="aphorism-cli cycle \d+ &mdash; ([^ ]+Z)|title="aphorism-cli cycle \d+ — ([^ ]+Z)/g)]
  .map((m) => m[1] || m[2]).filter(Boolean);
console.log(`derived ${HISTORY_STAMPS_BEFORE.length} history-row timestamps; newest: ${HISTORY_STAMPS_BEFORE.slice(-2).join(', ')}`);

const subs = [];
const sub = (id, oldS, newS) => subs.push({ id, oldS, newS });

sub('S1 gen stamp', `<div>gen <strong>${OLD_GEN}</strong></div>`, `<div>gen <strong>${GEN}</strong></div>`);
sub('S2 next stamp', `<div>next <strong>${OLD_NEXT}</strong></div>`, `<div>next <strong>&mdash; run complete</strong></div>`);

sub('S3 status line',
  'cycle 14 | aphorism-cli | VALUE_LOOP | R-2: every J-7 count claim in REPORT.md reconciled against the backlog | 118/118 green | next: re-run the DONE decision on a settled board',
  'cycle 15 | aphorism-cli | DONE | the DONE decision, re-run against a settled tree: DONE &mdash; WRAP_UP complete | 118/118 green | no further wakeups; ~17.7h of clock handed back unspent');

sub('S4 bar counts',
  '<p class="counts">33 / 41 backlog items done &middot; cycle 14 &middot; <strong>1 todo</strong>, 6 blocked &middot; <em>the one remaining todo failed the value ratchet; the six blocked are human-owned by their own acceptance clauses</em></p>',
  '<p class="counts">33 / 41 backlog items done &middot; cycle 15 &middot; <strong>RUN COMPLETE</strong> &middot; 1 todo, 6 blocked &middot; <em>all seven survivors are human-owned by their own acceptance clauses or locked behind a non-goal the swarm cannot lift for itself; R-1 is left standing on purpose as a known vacuous guard</em></p>');

sub('S5 journal entry',
  '<ul class="journal">\n        <li>cycle 14 —',
  '<ul class="journal">\n        <li>cycle 15 — 2026-08-18T10:2xZ — <strong>the DONE decision, re-run against a settled tree &rarr; DONE</strong>; zero agents, zero product code, nothing filed. Suite 118/118, the cycle-14 sealed gate re-run today at <strong>13 PASS / 0 FAIL</strong> with its sha256 still matching its seal, and a fresh DONE gate at 13 PASS / 3 FAIL whose three FAILs were all adjudicated as <em>my own instrument</em> and left unedited &mdash; the load-bearing finding being that <code>README.md</code> and <code>docs/</code> have not moved at all since cycle 12&#39;s sweep, so only one surface needed re-proving</li>\n        <li>cycle 14 —');

sub('S6 burnup',
  '</span>\n      </div>\n      <pre class="evidence">',
  '</span><span style="height:46%" title="cycle 15: 19/41 verified — FLAT, and correctly so. The DONE decision closed no backlog item because it is not one; the deliverable is the judgment. Denominator unchanged: this cycle filed nothing either. A run that ends should show a flat final bar, not a last-minute climb"></span>\n      </div>\n      <pre class="evidence">');

const OLD_TICK = '<span class="tick tick-ok" title="aphorism-cli cycle 14 — 2026-08-18T09:52Z — R-2, the live K-4 count regression (1 haiku builder) — VALUE, 1/1 verified; sealed gate 4 PASS / 8 FAIL / 1 REVIEW on the unrepaired tree -> 13 PASS / 0 FAIL, hash unchanged; one false provenance claim the gate could not see, repaired by the conductor after reading the diff">14</span>';
sub('S7 tick', OLD_TICK, OLD_TICK +
  '<span class="tick tick-ok" title="aphorism-cli cycle 15 — 2026-08-18T10:2xZ — the DONE decision on a settled tree (0 agents) — DONE, WRAP_UP; suite 118/118, cycle-14 gate re-verified 13 PASS / 0 FAIL against its seal, new DONE gate 13 PASS / 3 FAIL with all three FAILs adjudicated as conductor instrument error and the file left unedited">15</span>');

const EVID_START = '<pre class="evidence">';
const EVID_END = '</pre>';
// KI-33, REPRODUCED BY THIS HARNESS ON ITS FIRST RUN AND FIXED HERE. The filed issue says the
// render substitutes the evidence block "at the FIRST match of the evidence <pre> tag" — and
// this page carries THREE, of which the first two live inside the template's HTML comment
// region documenting the page shape. Taking the first match patched a commented-out EXAMPLE
// and left the live block untouched, while two assertions passed vacuously because their
// anchor strings happened to exist in the OLD live block too. Select the occurrence that is
// not inside a comment, and assert on something only the NEW text contains.
let eStart = -1;
for (let i = 0; (i = h.indexOf(EVID_START, i)) !== -1; i += 5) {
  if (h.lastIndexOf('<!--', i) <= h.lastIndexOf('-->', i)) { eStart = i; break; }
}
const eEnd = eStart === -1 ? -1 : h.indexOf(EVID_END, eStart);
if (eStart === -1 || eEnd === -1) { console.error('FATAL: live evidence block not found'); process.exit(2); }
console.log(`selected the LIVE evidence block at offset ${eStart} (skipped commented ones)`);
const NEW_EVID = `<pre class="evidence">$ node --test test/*.test.js                                     (c15)
tests 118   pass 118   fail 0

$ sha256sum .swarm/runs/cycle-014-gate.mjs   # re-checked against its seal
f3fb4648d979847f9ad14c2bfb2ade514facf1e341b3941e81b3baf7c39fa414   OK
$ node .swarm/runs/cycle-014-gate.mjs        # re-run against TODAY&#39;s tree
PASS 13 / FAIL 0 / REVIEW 0 / UNPARSEABLE 0

$ node .swarm/runs/cycle-015-done-gate.mjs   # the DONE decision&#39;s evidence
[PASS] P4   --list = 50/50, count derived from corpus.js, not from a note
[PASS] P7   filters AND: expected 3 derived from the corpus itself, got 3
[PASS] R1   zero NEW flags: --author --help --json --list --seed --tag
[PASS] K4a  README.md and docs/ UNCHANGED since the last full sweep
[PASS] K4b  the ONLY moved surface is REPORT.md (the c14 gate covers it)
[PASS] C1   CONVERSE CONTROL: a NaN seed still exits 2 &mdash; harness can fail
[FAIL] P1   asserted a 1-line default run; the product prints 2 &mdash; MINE
[FAIL] S1   hardcoded a 6-file test list naming 2 files that DO NOT EXIST:
            node --test ran the 4 real ones, EXITED 0, reported 100/0 &mdash; MINE
[FAIL] B1   correct FAIL, wrong surface: K-5 is met in REPORT.md:395 &mdash; MINE
PASS 13 / FAIL 3     &lt;- all 3 adjudicated by hand; gate file NOT edited

$ git diff --name-only c64fc09..HEAD -- README.md docs/ REPORT.md
REPORT.md                         &lt;- the only document surface that moved
$ git diff --name-only c64fc09..HEAD -- src bin
                                  &lt;- empty: no product code since cycle 12</pre>`;
h = h.slice(0, eStart) + NEW_EVID + h.slice(eEnd + EVID_END.length);
console.log('S8 evidence block replaced');

sub('S9 decisions',
  '<li>cycle 9 — Tagged improvement-run-2-2026-08-17;',
  '<li>cycle 15 — Declared the target DONE and entered WRAP_UP, handing ~17.7 hours of clock back unspent (cycle 8&#x27;s error was a mandatory gate unrun while a summary note said it ran; that root is measured absent).</li>\n<li>cycle 15 — The DONE gate was NOT commit-reveal sealed (zero agents dispatched &mdash; nobody to hide it from) and its 3 FAILs were adjudicated by hand with the file left unedited.</li>\n<li>cycle 9 — Tagged improvement-run-2-2026-08-17;');

sub('S10 notify meta',
  'notify on (&hellip;0d89) &middot; control: 0 pending &middot; last: poll ok merged=0 (cycle 13)',
  'notify on (&hellip;0d89) &middot; control: 0 pending &middot; last: poll ok merged=0 (cycle 15)');

let missed = 0;
for (const s of subs) {
  const n = h.split(s.oldS).length - 1;
  if (n === 0) { console.log(`MISS  ${s.id}`); missed++; continue; }
  h = h.split(s.oldS).join(s.newS);
  console.log(`ok    ${s.id}  (${n} occurrence${n > 1 ? 's' : ''})`);
}

fs.writeFileSync(P, h);
console.log(`\nwrote ${P}: ${before} -> ${h.length} bytes, ${missed} MISS`);

// ---- assertion pass over the LIVE page, HTML comments stripped ----
const live = fs.readFileSync(P, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
let pass = 0, fail = 0;
const A = (name, cond, detail = '') => {
  (cond ? pass++ : fail++);
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '\n      ' + detail : ''}`);
};

A('gen stamp updated', live.includes(`<div>gen <strong>${GEN}</strong></div>`));
A('next stamp reads run-complete', /next <strong>&mdash; run complete<\/strong>/.test(live));
A('status line is cycle 15 / DONE', /cycle 15 \| aphorism-cli \| DONE \|/.test(live));
A('no stale cycle-14 status banner', !live.includes('next: re-run the DONE decision on a settled board'));
A('bar still reads 33 / 41 (nothing filed, nothing closed)', live.includes('33 / 41 backlog items done'));
A('bar fill unchanged at 80%', live.includes('style="width:80%"'));
A('counts line says RUN COMPLETE', live.includes('<strong>RUN COMPLETE</strong>'));
A('cycle-15 journal one-liner present', /<li>cycle 15 — .*the DONE decision, re-run against a settled tree/.test(live));
A('cycle-14 journal one-liner survives', /<li>cycle 14 — .*R-2, the live K-4 count regression/.test(live));
A('cycle-15 tick present (anchored on the attribute delimiter, not on >)',
  /<span class="tick tick-ok" title="aphorism-cli cycle 15 [^"]*">15<\/span>/.test(live));
A('cycle-14 tick still present (history not dropped)',
  /<span class="tick tick-ok" title="aphorism-cli cycle 14 [^"]*">14<\/span>/.test(live));
A('cycle-13 tick still present', /<span class="tick tick-ok" title="aphorism-cli cycle 13 [^"]*">13<\/span>/.test(live));
A('burn-up gained a cycle-15 bar', /title="cycle 15: 19\/41 verified/.test(live));
A('burn-up kept the cycle-14 bar', /title="cycle 14: 19\/41 verified/.test(live));
A('evidence block carries the c15 suite result', live.includes('tests 118   pass 118   fail 0'));
A('evidence block carries the re-verified c14 seal', live.includes('f3fb4648d979847f9ad14c2bfb2ade514facf1e341b3941e81b3baf7c39fa414'));
A('evidence block reports the 3 FAILs honestly, marked MINE', (live.match(/&mdash; MINE/g) || []).length === 3,
  `found ${(live.match(/&mdash; MINE/g) || []).length} (expect 3)`);
A('evidence block shows the empty src/bin diff', live.includes('empty: no product code since cycle 12'));
A('cycle-15 decisions listed', (live.match(/<li>cycle 15 — /g) || []).length >= 2,
  `found ${(live.match(/<li>cycle 15 — /g) || []).length}`);
A('notify meta advanced to cycle 15', live.includes('last: poll ok merged=0 (cycle 15)'));
A('no full ntfy topic leaked (last 4 chars only)', !/notify on \([0-9a-z]{8,}/.test(live));

// CONVERSE CONTROLS — a check that cannot fail proves nothing.
const HISTORY_STAMPS_AFTER = [...live.matchAll(/title="aphorism-cli cycle \d+ &mdash; ([^ ]+Z)|title="aphorism-cli cycle \d+ — ([^ ]+Z)/g)]
  .map((m) => m[1] || m[2]).filter(Boolean);
A('CONVERSE CONTROL: the page still remembers its own history',
  HISTORY_STAMPS_BEFORE.every((s) => HISTORY_STAMPS_AFTER.includes(s)),
  `${HISTORY_STAMPS_BEFORE.filter((s) => HISTORY_STAMPS_AFTER.includes(s)).length}/${HISTORY_STAMPS_BEFORE.length} history-row timestamps survive, in their own serialization`);
// NOTE: `live` is COMMENT-STRIPPED, so comparing it to the raw `before` length measured a
// ~29 KB comment region and called it shrinkage. Compare like with like — strip comments from
// the pre-render snapshot too. (My own bug, caught by this control firing on the first run.)
const beforeStripped = fs.readFileSync('/opt/swarm/runs/dashboard.html.c15bak', 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '').length;
A('CONVERSE CONTROL: the page did not shrink (nothing wiped)', live.length > beforeStripped * 0.9,
  `${beforeStripped} -> ${live.length} bytes, comment-stripped both sides`);
A('CONVERSE CONTROL: a claim the page must NOT make (no fabricated cycle 16)',
  !/aphorism-cli cycle 16/.test(live));

console.log(`\n${'='.repeat(60)}\nPASS ${pass} / FAIL ${fail} / MISS ${missed}`);
process.exit(fail === 0 && missed === 0 ? 0 : 1);
