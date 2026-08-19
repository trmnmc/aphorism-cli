#!/usr/bin/env node
// Adjudication of the two cycle-11 gate FAILs, T3 and T4.
//
// The sealed gate (280692db…) is left BYTE-UNEDITED: rewriting a gate after it has run
// destroys the evidence of what it measured (run #3 c4/c12/c14 precedent, held every
// cycle since). This is a separate instrument that reproduces the defect, repairs the
// reader, and proves the repaired reader can still die.
//
// SUSPECTED ROOT CAUSE, one defect showing in two cells: both T3 and T4 match against
// HARD-WRAPPED markdown. T3 asks whether the block contains the literal substring
// `dim, not loud`; the delivered entry wraps it as `dim, not\n  loud`. T4 reads the
// Status bullet as a SINGLE LINE; the delivered bullet carries `J-7` on its continuation
// line. Every existing entry in this section (D-42..D-45) is wrapped the same way, so a
// raw-substring / line-oriented reader over this section was always going to be wrong.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const SPEC = '/opt/targets/aphorism-cli/.swarm/SPEC.md';
const txt = fs.readFileSync(SPEC, 'utf8');

const rows = [];
const check = (id, note, fn) => {
  let ok, detail;
  try { const r = fn(); ok = r.ok; detail = r.detail; }
  catch (e) { ok = false; detail = 'THREW: ' + String(e.message).slice(0, 160); }
  rows.push({ id, ok, note, detail });
};

// --- the sealed gate's own readers, reproduced verbatim -------------------------------
function undecidedSection(t) {
  const start = t.indexOf('## Undecided behaviours');
  if (start < 0) return null;
  const rest = t.slice(start + 3);
  const nextIdx = rest.indexOf('\n## ');
  return nextIdx < 0 ? t.slice(start) : t.slice(start, start + 3 + nextIdx);
}
function entryBlock(sectionTxt, id) {
  if (!sectionTxt) return null;
  const lines = sectionTxt.split('\n');
  const isHeader = (l) => /^\*\*.+\*\*\s*$/.test(l);
  let i = lines.findIndex((l) => isHeader(l) && l.includes(id));
  if (i < 0) return null;
  let j = i + 1;
  while (j < lines.length && !isHeader(lines[j])) j++;
  return lines.slice(i, j).join('\n');
}

// --- the repaired readers -------------------------------------------------------------
// Normalise the wrap, not the content: collapse runs of whitespace to one space. This
// changes NOTHING about what the document says; it only stops the reader from treating
// a line break as a word boundary that isn't one.
const unwrap = (s) => s.replace(/\s+/g, ' ').trim();

// A bullet runs from its `- **Label:**` line through every continuation line (a line that
// is not blank and does not start a new bullet), then stops.
function bulletText(blockTxt, label) {
  const lines = blockTxt.split('\n');
  const i = lines.findIndex((l) => l.includes(label));
  if (i < 0) return null;
  let j = i + 1;
  while (j < lines.length && lines[j].trim() !== '' && !/^\s*-\s+\*\*/.test(lines[j])) j++;
  return unwrap(lines.slice(i, j).join(' '));
}

const block = entryBlock(undecidedSection(txt), 'D-46');

// =====================================================================================
check('A', 'DEFECT REPRODUCED — T3 raw-substring reader fails on the delivered block', () => {
  const sealedAnswer = block.includes('dim, not loud');
  const wrapped = /dim, not\s*\n\s*loud/.test(block);
  return { ok: sealedAnswer === false && wrapped === true, detail: `rawIncludes=${sealedAnswer} wrapPresent=${wrapped}` };
});

check('B', 'FIXED reader recovers truth on that SAME input — the taste note IS quoted', () => {
  const ok = unwrap(block).includes('dim, not loud');
  return { ok, detail: ok ? 'quote found once the wrap is normalised' : 'still not found' };
});

check('C', 'DEFECT REPRODUCED — T4 read only the Status bullet\'s FIRST line', () => {
  const firstLineOnly = block.split('\n').find((l) => l.includes('**Status:**')) || '';
  return { ok: !firstLineOnly.includes('J-7'), detail: JSON.stringify(firstLineOnly.trim().slice(0, 92)) };
});

check('D', 'FIXED reader recovers truth — the Status bullet DOES route to J-7', () => {
  const st = bulletText(block, '**Status:**');
  return { ok: !!st && st.includes('J-7'), detail: st ? st.slice(0, 120) : 'no Status bullet' };
});

check('E', 'MUST-DIE: the fixed quote reader does NOT fire on a block omitting the taste note', () => {
  const decoy = '**Something (measured gap D-99)**\n\n- **Shipped behaviour:** the attribution is\n  quiet and plain.\n- **Status:** J-7\n';
  return { ok: !unwrap(decoy).includes('dim, not loud'), detail: 'stayed dead on a decoy that talks about attribution' };
});

check('F', 'MUST-DIE: the fixed Status reader does NOT find J-7 in a Status bullet lacking it', () => {
  const decoy = '**X (D-99)**\n\n- **Why:** J-7 is mentioned here, in the WRONG bullet.\n- **Status:** No test pins this.\n  Owned by nobody in particular.\n';
  const st = bulletText(decoy, '**Status:**');
  return { ok: !!st && !st.includes('J-7'), detail: st || 'no bullet' };
});

check('G', 'MUST-NOT-OVERREACH: the fixed Status reader stops at its own bullet', () => {
  const two = '**X (D-99)**\n\n- **Status:** owned locally.\n  Second line of the same bullet.\n- **Other:** J-7 lives in the NEXT bullet.\n';
  const st = bulletText(two, '**Status:**');
  const ok = !!st && st.includes('Second line') && !st.includes('J-7');
  return { ok, detail: st || 'no bullet' };
});

check('H', 'MUST-STAY-GREEN: the fixed readers still work on a bullet that is NOT wrapped', () => {
  const flat = '**X (D-99)**\n\n- **Status:** Human-owned, tracked as backlog item J-7.\n';
  const st = bulletText(flat, '**Status:**');
  return { ok: !!st && st.includes('J-7'), detail: st || 'no bullet' };
});

// =====================================================================================
// BLAST RADIUS — which OTHER sealed cells share the habit, and does any of them fail OPEN?
// T3/T4 failed CLOSED, which is what you want from a wrong instrument. A cell that
// asserts the ABSENCE of a wrapped string would fail OPEN instead, and that is worse.
// =====================================================================================

check('I', 'BLAST RADIUS: T7 asserts an ABSENCE, so the same defect there would fail OPEN', () => {
  // T7 passed. This measures WHY, instead of asserting that it did. T7 asks whether the
  // phrase "Carried forward verbatim from run #3" is GONE. A wrap-blind reader cannot
  // distinguish "removed" from "still here but wrapped" — so had that phrase been
  // hard-wrapped in the sealed document, T7 would have reported the stale claim repaired
  // while it sat untouched. That is a FALSE PASS, strictly worse than T3/T4's fail-closed.
  const sealed = execFileSync('git', ['show', 'HEAD:.swarm/SPEC.md'],
    { cwd: '/opt/targets/aphorism-cli', encoding: 'utf8' });
  const phrase = 'Carried forward verbatim from run #3';
  const onOneLine = sealed.split('\n').some((l) => l.includes(phrase));
  const presentAtAll = unwrap(sealed).includes(phrase);
  const goneNow = !unwrap(txt).includes(phrase);
  // T7's verdict is sound iff the phrase was visible to a line-blind reader BEFORE
  // (so its disappearance means something) and is genuinely gone under a wrap-proof
  // reader NOW.
  return {
    ok: onOneLine && presentAtAll && goneNow,
    detail: `sealed: onOneLine=${onOneLine} present=${presentAtAll} | now: goneUnderUnwrap=${goneNow}`,
  };
});

check('J', 'BLAST RADIUS: T2 is immune — bold markers are tokens markdown wrapping cannot split', () => {
  const markers = ['**Shipped behaviour:**', '**Why the SPEC does not decide it:**', '**Status:**'];
  // Immune for two independent reasons, both measured: each marker is found by a
  // WHOLE-BLOCK search (not a per-line one), and each sits entirely within one line of
  // the delivered block, because markdown wrapping breaks at the label, never inside it.
  const wholeBlock = markers.every((m) => block.includes(m));
  const eachOnOneLine = markers.every((m) => block.split('\n').some((l) => l.includes(m)));
  return { ok: wholeBlock && eachOnOneLine, detail: `wholeBlock=${wholeBlock} eachOnOneLine=${eachOnOneLine}` };
});

check('K', 'BLAST RADIUS: T5 reads only the J-7 bullet\'s FIRST line — same habit, safe HERE only', () => {
  const rep = fs.readFileSync('/opt/targets/aphorism-cli/REPORT.md', 'utf8');
  const lines = rep.split('\n');
  const i = lines.findIndex((l) => /^-\s+\*\*J-7\*\*/.test(l));
  const head = lines[i];
  // The count word happens to sit on the first line. If a future edit wrapped
  // "seven" onto the continuation line, T5 would fail closed the same way T4 did.
  const ok = /\bseven\b/.test(head);
  return { ok, detail: `count word on line 1 = ${ok}; the habit is identical, the luck is not a property of the cell` };
});

// ---------------------------------------------------------------------------------
let pass = 0, fail = 0;
console.log('');
for (const r of rows) {
  r.ok ? pass++ : fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.note}`);
  console.log(`          ${r.detail}`);
}
console.log('');
console.log(`=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
