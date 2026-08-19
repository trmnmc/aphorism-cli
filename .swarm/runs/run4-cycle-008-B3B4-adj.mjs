#!/usr/bin/env node
// Run #4 cycle 8 — adjudication of the sealed gate's B3 and B4 FAILs.
//
// THE SEALED GATE IS LEFT BYTE-UNEDITED (sha256 4f37ef97..., re-verified after the run).
// This repo has a standing precedent (run #3 cycles 4/12/14, run #4 cycles 1/2/3/5) that a
// gate is not rewritten after it has run, because rewriting it destroys the evidence of
// what it measured. The repair therefore lives here and the original FAILs stay on record.
//
// THE DEFECT: B3 and B4 read a markdown bullet with
//     d45.body.split('\n').find(l => /^- \*\*Status:\*\*/.test(l))
// i.e. the bullet's FIRST SOURCE LINE only. The builder wrapped its D-45 bullets at ~90
// columns (the three pre-existing entries D-42/D-43/D-44 are single unwrapped lines), so
// "J-7" and "stdout"/"stderr" sit on continuation lines and were structurally out of scope.
// Both cells could only fail CLOSED, which is the behaviour you want from a wrong
// instrument — but they were wrong about a document that satisfies the acceptance clause.
//
// SAME ROOT CAUSE AS A BUG THIS GATE'S OWN PRE-SEAL BASELINE ALREADY CAUGHT: the
// Domain-rules "Exit codes:" bullet also wraps across two lines, and B5 originally sealed
// only its first line. That was found and repaired before sealing. The repair was NOT
// propagated to B3/B4. Instrument defects #19 and #20 of this repo's recorded history;
// the standing lesson is unchanged and was again decisive: a gate is a program and needs
// its own baseline, not confidence.
//
// Columns A/B reproduce-then-repair; C is a no-regression control on the format the old
// reader DID handle; D/E are must-die controls so the repair is not a rubber stamp;
// F/G are must-not-overreach controls guarding the failure mode the repair could
// introduce — a whole-bullet reader that runs past the bullet's end and absorbs a
// NEIGHBOUR's text. F/G exist because that is exactly how instrument defects #17/#18
// (run #3 cycle 4) happened: a slice that bled into the next item's entry.

import { readFileSync } from 'node:fs';

const SPEC = readFileSync('/opt/targets/aphorism-cli/.swarm/SPEC.md', 'utf8');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// ---- section + entry slicing (identical to the sealed gate's, which was not at fault) --
function mdSection(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n');
}
const ENTRY_RE = /^\*\*.*\(measured gap (D-\d+)\)\*\*\s*$/;
function entries(section) {
  const lines = (section || '').split('\n');
  const idx = [];
  lines.forEach((l, i) => { const m = l.match(ENTRY_RE); if (m) idx.push({ i, id: m[1] }); });
  return idx.map((e, n) => ({
    id: e.id,
    body: lines.slice(e.i + 1, n + 1 < idx.length ? idx[n + 1].i : lines.length).join('\n'),
  }));
}

// ---- THE DEFECT (as sealed): first source line of the bullet only ----------------------
const bulletUNFIXED = (body, label) =>
  body.split('\n').find((l) => new RegExp(`^- \\*\\*${label}:\\*\\*`).test(l)) || '';

// ---- THE REPAIR: the whole LOGICAL bullet — its first line plus every continuation line,
// ---- stopping at the next bullet, a blank line, or a heading. Bounded on BOTH ends, so
// ---- it can never absorb a neighbouring bullet's text (controls F and G prove this).
const bulletFIXED = (body, label) => {
  const lines = body.split('\n');
  const s = lines.findIndex((l) => new RegExp(`^- \\*\\*${label}:\\*\\*`).test(l));
  if (s === -1) return '';
  let e = s + 1;
  while (e < lines.length && lines[e].trim() !== '' && !/^\s*[-*]\s/.test(lines[e]) && !/^#/.test(lines[e])) e++;
  return norm(lines.slice(s, e).join('\n'));
};

const undecided = mdSection(SPEC, '## Undecided behaviours');
const all = entries(undecided);
const d45 = all.find((e) => e.id === 'D-45');

// The two predicates the sealed cells were trying to evaluate.
const B3pred = (statusBullet) => /J-7/.test(statusBullet);
const B4pred = (shippedBullet) =>
  /stdout/i.test(shippedBullet) && /stderr/i.test(shippedBullet) && /(^|[^\d])3([^\d]|$)|`3`/.test(shippedBullet);

const rows = [];
const col = (id, expect, what, fn) => {
  let got, ok = false, detail = '';
  try { const r = fn(); got = r.got; detail = r.detail; ok = JSON.stringify(got) === JSON.stringify(expect); }
  catch (e) { detail = 'THREW: ' + e.message; }
  rows.push({ id, what, expect, got, ok, detail });
};

// A — the defect reproduces against the REAL document.
col('A', [false, false], 'UNFIXED single-line reader MISSES on the real D-45 bullets (defect reproduced)',
  () => {
    const st = bulletUNFIXED(d45.body, 'Status'), sb = bulletUNFIXED(d45.body, 'Shipped behaviour');
    return { got: [B3pred(st), B4pred(sb)], detail: `status1stline="${norm(st).slice(0, 90)}" shipped1stline="${norm(sb).slice(0, 90)}"` };
  });

// B — the repair recovers the truth on that same real document.
col('B', [true, true], 'FIXED whole-bullet reader recovers truth on the real D-45 bullets',
  () => {
    const st = bulletFIXED(d45.body, 'Status'), sb = bulletFIXED(d45.body, 'Shipped behaviour');
    return { got: [B3pred(st), B4pred(sb)], detail: `status="${st.slice(0, 130)}" | shipped="${sb.slice(0, 130)}"` };
  });

// C — NO REGRESSION on the format the old reader did handle (unwrapped single-line bullets).
col('C', [true, true, true], 'FIXED reader still reads the three PRE-EXISTING unwrapped entries correctly',
  () => {
    const got = ['D-42', 'D-43', 'D-44'].map((id) => B3pred(bulletFIXED(all.find((e) => e.id === id).body, 'Status')));
    return { got, detail: 'D-42/D-43/D-44 Status bullets each route to J-7' };
  });

// D — must-die: strip J-7 from the Status bullet; the fixed reader must say NO.
col('D', false, 'MUST-DIE: D-45 Status with J-7 removed still FAILS under the fixed reader',
  () => {
    const mutated = d45.body.replace(/J-7/g, 'the owner');
    return { got: B3pred(bulletFIXED(mutated, 'Status')), detail: 'J-7 -> "the owner" throughout the entry' };
  });

// E — must-die: a Shipped bullet naming only ONE stream must FAIL.
col('E', false, 'MUST-DIE: a Shipped-behaviour bullet naming only stdout still FAILS under the fixed reader',
  () => {
    const mutated = d45.body.replace(/- \*\*Shipped behaviour:\*\*[\s\S]*?(?=\n- \*\*Why)/,
      '- **Shipped behaviour:** `bin/aphorism.js` exits 3 on a stdout write failure.\n');
    return { got: B4pred(bulletFIXED(mutated, 'Shipped behaviour')), detail: 'stderr half deleted from the Shipped bullet' };
  });

// F — must-not-overreach: the Status slice must NOT absorb a neighbour that carries J-7.
// This is the failure mode the repair itself could introduce (instrument defects #17/#18).
col('F', false, 'MUST-NOT-OVERREACH: Status lacking J-7, with a FOLLOWING bullet that HAS J-7, still FAILS',
  () => {
    const mutated = d45.body.replace(/J-7/g, 'the owner') +
      '\n- **Follow-up:** this one mentions J-7 and must not be absorbed by the Status slice.';
    return { got: B3pred(bulletFIXED(mutated, 'Status')), detail: 'decoy bullet carrying J-7 appended immediately after Status' };
  });

// G — must-not-overreach, other direction: Shipped must not absorb the Why bullet's tokens.
col('G', false, 'MUST-NOT-OVERREACH: Shipped stripped of both stream names still FAILS even though the NEXT bullet names them',
  () => {
    const mutated = d45.body
      .replace(/- \*\*Shipped behaviour:\*\*[\s\S]*?(?=\n- \*\*Why)/,
        '- **Shipped behaviour:** `bin/aphorism.js` exits 3 on a write failure.\n')
      .replace(/- \*\*Why the SPEC does not decide it:\*\*/,
        '- **Why the SPEC does not decide it:** stdout and stderr are both involved.');
    return { got: B4pred(bulletFIXED(mutated, 'Shipped behaviour')), detail: 'stream names moved OUT of Shipped and INTO the following Why bullet' };
  });

// H — the sealed gate's OTHER bullet-reading cells were not affected: B2's presence checks
// use /^- \*\*...\*\*/m against the whole body, which wrapping cannot break. Verified, not
// assumed, so the blast radius of this defect is measured rather than asserted.
col('H', [true, true, true], 'BLAST RADIUS: B2\'s three presence regexes are wrap-immune (they scan the whole body)',
  () => {
    const need = [/^- \*\*Shipped behaviour:\*\*/m, /^- \*\*Why the SPEC does not decide it:\*\*/m, /^- \*\*Status:\*\*/m];
    return { got: need.map((r) => r.test(d45.body)), detail: 'unchanged from the sealed gate — no other cell shares the defect' };
  });

let pass = 0, fail = 0;
for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.what}\n        expected=${JSON.stringify(r.expect)} got=${JSON.stringify(r.got)}\n        ${r.detail}`);
  r.ok ? pass++ : fail++;
}
console.log(`\n=== ADJUDICATION ${pass} PASS / ${fail} FAIL of ${rows.length} columns ===`);
console.log('VERDICT: B3 and B4 are INSTRUMENT DEFECTS. The delivered D-45 entry satisfies');
console.log('both predicates; the sealed cells read one source line of a wrapped bullet.');
process.exit(fail === 0 ? 0 : 1);
