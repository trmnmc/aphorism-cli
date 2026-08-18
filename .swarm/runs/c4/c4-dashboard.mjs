import fs from 'node:fs';
const P = '/opt/swarm/runs/dashboard.html';
let h = fs.readFileSync(P, 'utf8');
const before = h.length;

const NOW = Math.floor(Date.now() / 1000);
const WAKE = NOW + 90;
const iso = (e) => new Date(e * 1000).toISOString().replace('.000Z', '+00:00');
const GEN = iso(NOW), NEXT = iso(WAKE);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sub = (from, to, label) => {
  const n = h.split(from).length - 1;
  if (n === 0) { console.log(`MISS  ${label} — anchor not found`); return; }
  h = h.split(from).join(to);
  console.log(`ok    ${label} (${n}x)`);
};

// 1 — banner / status line ----------------------------------------------------
const OLDBAN = 'cycle 3 | aphorism-cli | BUILD | build-wave N-3 + N-7 → 29/29 coverage map, 0 false claims, gate 15/15 | 102/102 green | next N-4';
const NEWBAN = 'cycle 4 | aphorism-cli | BUILD | build-wave N-4 + N-6 → inherited clause map was INCOMPLETE: 14 new clauses, 12 killed, 1 BOUNDARY survivor, 0 holes | 102/102 green | next N-10';
sub(OLDBAN, NEWBAN, 'banner');

// 2 — timeline tick -----------------------------------------------------------
const T3 = '<span class="tick tick-ok" title="aphorism-cli cycle 3 — 2026-08-18T04:57Z — build-wave N-3 + N-7 (2 sonnet agents) — VALUE, 2 verified">3</span>';
const T4 = T3 + '<span class="tick tick-ok" title="aphorism-cli cycle 4 — 2026-08-18T05:4xZ — build-wave N-4 (fable) + N-6 (haiku) — VALUE, 3 verified">4</span>';
sub(T3, T4, 'timeline tick 4');

// 3 — counts + bar ------------------------------------------------------------
sub('20 / 29 backlog items done &middot; cycle 3 &middot; 7 todo, 1 blocked',
  '23 / 30 backlog items done &middot; cycle 4 &middot; 5 todo, 1 blocked', 'counts');
sub('<div class="fill" style="width:69%"></div>', '<div class="fill" style="width:77%"></div>', 'bar fill');

// 4 — journal one-liners (newest first, cap 8) --------------------------------
const J3 = '<li>cycle 3 — 2026-08-18T04:57Z — build-wave N-3 + N-7 (2 sonnet agents) — VALUE, 2 verified</li>';
const J4 = '<li>cycle 4 — 2026-08-18T05:4xZ — build-wave N-4 (fable) + N-6 (haiku) — VALUE, 3 verified</li>\n        ' + J3;
sub(J3, J4, 'journal line');

// 5 — burn-up strip: cumulative verified 9 / 30 = 30% -------------------------
const B3 = '<span style="height:21%" title="cycle 3: 6/29 verified"></span>';
sub(B3, B3 + '<span style="height:30%" title="cycle 4: 9/30 verified"></span>', 'burn-up bar');

// 6 — verification evidence: last 3, newest first -----------------------------
const evOld = h.match(/<pre class="evidence">[\s\S]*?<\/pre>/);
if (evOld) {
  const ev = '<pre class="evidence">'
    + esc('N-4 the inherited 29-clause map was INCOMPLETE (c4) ') + '<code>'
    + esc('43 clauses derived from SPEC, 14 NEW: 12 KILLED / 1 SURVIVED / 1 NOT-PLANTED, 0 HOLE')
    + '</code> &mdash; ' + esc('the enumeration missed 14 behaviours, but the suite protects 12 of them anyway. I re-planted 4 rows with my own mutants in my own pristine archive; all 4 verdicts reproduced')
    + ' <span class="pass">PASS</span>\n'
    + esc('N-4 the one real gap is spec-undecided, so it is NOT hardened (c4) ') + '<code>'
    + esc('--tag humor --tag design --list: pristine 14 entries, first-wins mutant 9 entries, suite 102p/0f on BOTH')
    + '</code> &mdash; ' + esc('classified BOUNDARY not HOLE: SPEC spells every filter flag in the singular, so last-wins is an artifact of parseArgs order, not a contract. Filed to J-7 for a human ruling')
    + ' <span class="pass">PASS</span>\n'
    + esc('N-6 the gate FAILED and I repaired the doc rather than the check (c4) ') + '<code>'
    + esc('preservation 1226/1226 lines byte-identical, 22 inserted; N4-c FAIL adjudicated by hand')
    + '</code> &mdash; ' + esc('haiku dropped the lower-bound caveat from "29/29 killed, 0 survived" — every number true, the framing wrong. Conductor rewrote both claims; recorded done-by-repair, attempts=1')
    + ' <span class="pass">PASS</span></pre>';
  h = h.replace(evOld[0], ev);
  console.log('ok    evidence block replaced (3 snippets, newest first)');
}

// 7 — decisions ---------------------------------------------------------------
const D_ANCHOR = '<ul class="decisions">';
const newDecisions = [
  'cycle 4 — Re-scoped N-4 from “classify the survivors” (an empty set) to “test whether the inherited 29-clause enumeration is COMPLETE”. It was not: 14 omissions found.',
  'cycle 4 — The sealed gate FAILED check N4-c and the gate file was NOT edited; the failing row was adjudicated by hand and the CHECK recorded as the defective instrument.',
  'cycle 4 — N-6 closed done-by-conductor-repair, not done-as-delivered: the agent attempt is recorded as attempts=1 so the backlog does not read as a clean delivery.',
].map((d) => `<li>${esc(d)}</li>`).join('\n');
sub(D_ANCHOR, D_ANCHOR + newDecisions + '\n', 'decisions');

// 8 — meta line timestamps ----------------------------------------------------
h = h.replace(/data-generated="[^"]*" data-expected="[^"]*"/,
  `data-generated="${GEN}" data-expected="${NEXT}"`);
h = h.replace(/<div>gen <strong>[^<]*<\/strong><\/div>/, `<div>gen <strong>${GEN}</strong></div>`);
h = h.replace(/<div>next <strong>[^<]*<\/strong><\/div>/, `<div>next <strong>${NEXT}</strong></div>`);
h = h.replace(/^    \d{4}-\d\d-\d\dT[\d:+]+  ISO-8601 next scheduled wakeup/m,
  `    ${NEXT}  ISO-8601 next scheduled wakeup`);
console.log(`ok    meta line: gen ${GEN}, next ${NEXT}`);

fs.writeFileSync(P + '.tmp', h);
fs.renameSync(P + '.tmp', P);
console.log(`\ndashboard rendered: ${before} -> ${h.length} bytes`);
console.log(`WAKE epoch ${WAKE}`);
