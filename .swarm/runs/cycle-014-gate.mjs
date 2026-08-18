#!/usr/bin/env node
// cycle-014 verification gate for item R-2
// "Reconcile every J-7 behaviour-count claim in REPORT.md against the backlog (K-4 regression)"
//
// AUTHORED BY THE CONDUCTOR AT VERIFICATION-DESIGN TIME, BEFORE ANY AGENT WAS DISPATCHED.
// Sealed by sha256 and the hash committed to the target repo before dispatch.
//
// DELIBERATE PLACEMENT: this file lives under SWARM/runs/, NOT in the target repo, for the
// duration of the dispatch window. Workflow/Agent dispatches receive target paths only and
// never SWARM paths (hard rule 5), so the builder cannot reach this file even in principle.
// Cycle 13 committed its gate into the target before dispatch and relied on a prompt-line
// prohibition to stop a builder reading it; structural unreachability is strictly stronger
// than an instruction. The file is copied into the target AFTER verification completes, so
// the durable record is unchanged.
//
// THREE-STATE CELLS. R-2's acceptance sanctions TWO repairs per site: correct the count to
// five, OR explicitly re-label the site as a dated history claim. A binary matcher cannot
// tell a good re-label from a stale claim without reading English, so each site cell reports:
//   PASS   - the count reads five (or matches the live backlog title byte-for-byte)
//   REVIEW - the count is stale BUT a dating token sits within +/-2 lines; the conductor
//            adjudicates this cell BY HAND and records the reasoning
//   FAIL   - the count is stale and nothing nearby dates it
// REVIEW is not a pass. An unadjudicated REVIEW cell is an open cell.
//
// UNPARSEABLE (exit 2) whenever the gate cannot READ its subject - anchor missing, anchor
// ambiguous, backlog unreadable. An instrument that cannot read its subject has not failed
// its subject. This run has produced eight instrument bugs; four of them reported FAIL when
// the honest answer was "I could not measure this".

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const TARGET = '/opt/targets/aphorism-cli';
const REPORT = `${TARGET}/REPORT.md`;
const BACKLOG = `${TARGET}/.swarm/backlog.json`;

const cells = [];
const unparseable = [];
function pass(id, what, detail) { cells.push({ id, state: 'PASS', what, detail }); }
function fail(id, what, detail) { cells.push({ id, state: 'FAIL', what, detail }); }
function review(id, what, detail) { cells.push({ id, state: 'REVIEW', what, detail }); }
function unreadable(id, what, why) { unparseable.push({ id, what, why }); }

// Broad on purpose: this list only decides FAIL vs REVIEW, never FAIL vs PASS. A false
// positive here costs the conductor a hand-read; a narrow list would auto-FAIL an honest
// repair phrased in words the author did not anticipate.
const DATING_TOKENS = [
  'superseded', 'historical', 'dated', 'frozen', 'as written', 'was true',
  'at the time', 'since revised', 'later raised', 'no longer', 'stale',
  'run #2', 'cycle 5', 'cycle 8', 'quotation of',
];

const WORD2NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

let src, lines, backlog, j7;
try {
  src = fs.readFileSync(REPORT, 'utf8');
  lines = src.split('\n');
} catch (e) {
  console.error(`UNPARSEABLE: cannot read ${REPORT}: ${e.message}`);
  process.exit(2);
}
try {
  backlog = JSON.parse(fs.readFileSync(BACKLOG, 'utf8'));
  j7 = backlog.items.find((i) => i.id === 'J-7');
  if (!j7) throw new Error('no J-7 item in backlog');
} catch (e) {
  console.error(`UNPARSEABLE: cannot read J-7 from ${BACKLOG}: ${e.message}`);
  process.exit(2);
}

// Ground truth the gate measures AGAINST, derived from the backlog, not hardcoded.
// (Hardcoding "five" would make the gate stale the moment a sixth ruling is routed to J-7.)
const titleCountWord = (j7.title.match(/^(\w+)\s+CLI behaviours/i) || [])[1];
if (!titleCountWord || !(titleCountWord.toLowerCase() in WORD2NUM)) {
  console.error(`UNPARSEABLE: J-7 title does not open with a count word: ${JSON.stringify(j7.title)}`);
  process.exit(2);
}
const TRUE_COUNT = WORD2NUM[titleCountWord.toLowerCase()];

function nearbyHasDating(lineIdx) {
  const lo = Math.max(0, lineIdx - 2);
  const hi = Math.min(lines.length - 1, lineIdx + 2);
  const blob = lines.slice(lo, hi + 1).join('\n').toLowerCase();
  return DATING_TOKENS.filter((t) => blob.includes(t));
}

function siteCell(id, what, lineIdx, foundWord) {
  const n = WORD2NUM[String(foundWord).toLowerCase()];
  if (n === TRUE_COUNT) {
    return pass(id, what, `line ${lineIdx + 1} reads "${foundWord}" = ${TRUE_COUNT}`);
  }
  const tokens = nearbyHasDating(lineIdx);
  if (tokens.length) {
    return review(id, what, `line ${lineIdx + 1} reads "${foundWord}" (=${n}) not ${TRUE_COUNT}, but dating tokens are within +/-2 lines: ${tokens.join(', ')} -- CONDUCTOR MUST READ`);
  }
  return fail(id, what, `line ${lineIdx + 1} reads "${foundWord}" (=${n}), true count is ${TRUE_COUNT}, no dating token within +/-2 lines`);
}

// ---------------------------------------------------------------------------
// Locate the J-7 hand-off section. Uniqueness is ASSERTED, not assumed: cycle 13's
// A8 bug was a first-occurrence indexOf on an anchor that turned out not to be unique.
// ---------------------------------------------------------------------------
const headIdxs = lines
  .map((l, i) => [l, i])
  .filter(([l]) => /^## J-7: \w+ CLI behaviours are unspecified and require human ruling\s*$/.test(l))
  .map(([, i]) => i);

let sec = null, secStart = -1, secEnd = -1;
if (headIdxs.length !== 1) {
  unreadable('A1..A4', 'J-7 hand-off section', `expected exactly 1 matching "## J-7: <word> CLI behaviours..." heading, found ${headIdxs.length}`);
} else {
  secStart = headIdxs[0];
  secEnd = lines.length;
  for (let i = secStart + 1; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i]) || /^# /.test(lines[i])) { secEnd = i; break; }
  }
  sec = lines.slice(secStart, secEnd);

  // A1 - the section heading's own count word
  const hw = lines[secStart].match(/^## J-7: (\w+) CLI behaviours/)[1];
  siteCell('A1', 'J-7 section heading count', secStart, hw);

  // A2 - the ruling list actually enumerates TRUE_COUNT behaviours, numbered 1..n in order
  const bullets = [];
  for (let i = 0; i < sec.length; i++) {
    const m = sec[i].match(/^- \((\d+)\) \*\*/);
    if (m) bullets.push({ n: Number(m[1]), i: secStart + i, text: sec[i] });
  }
  const seq = bullets.map((b) => b.n);
  const wanted = Array.from({ length: TRUE_COUNT }, (_, k) => k + 1);
  if (JSON.stringify(seq) === JSON.stringify(wanted)) {
    pass('A2', 'ruling list enumerates every behaviour', `${bullets.length} bullets numbered ${seq.join(',')}`);
  } else {
    fail('A2', 'ruling list enumerates every behaviour', `expected bullets (1)..(${TRUE_COUNT}), found [${seq.join(',')}] -- a count claim of ${TRUE_COUNT} over a list of ${bullets.length} is a NEW false claim, not a repair`);
  }

  // A3 - the newly-routed behaviour (D-44: empty flag value, '=' form vs space form) is
  // present in substance, not merely counted. Checked by content so a builder cannot
  // satisfy A2 with an empty placeholder bullet.
  const lastBullet = bullets.length ? bullets[bullets.length - 1] : null;
  if (!lastBullet) {
    unreadable('A3', 'D-44 bullet substance', 'no numbered bullets found in the section');
  } else {
    // bullet text runs to the next bullet or section end
    const from = lastBullet.i;
    const to = secEnd;
    const blob = lines.slice(from, to).join('\n');
    const hasEmpty = /empt(y|ies)/i.test(blob);
    const hasFlag = /--author|--tag/.test(blob);
    const hasEquals = /=/.test(blob);
    if (hasEmpty && hasFlag && hasEquals) {
      pass('A3', 'D-44 present in substance', `final bullet mentions empty value, a filter flag, and the "=" form`);
    } else {
      fail('A3', 'D-44 present in substance', `final bullet missing: empty=${hasEmpty} flag=${hasFlag} equals=${hasEquals}`);
    }
  }

  // A4 - the "What would settle it" sentence carries the same count as the heading
  const settleIdxs = [];
  for (let i = 0; i < sec.length; i++) {
    const m = sec[i].match(/rules on (\w+) behaviours/);
    if (m) settleIdxs.push({ i: secStart + i, w: m[1] });
  }
  if (settleIdxs.length !== 1) {
    unreadable('A4', '"what would settle it" count', `expected exactly 1 "rules on <word> behaviours" in the section, found ${settleIdxs.length}`);
  } else {
    siteCell('A4', '"what would settle it" count', settleIdxs[0].i, settleIdxs[0].w);
  }

  // A5 - the section quotes the backlog title in backticks; the quotation must match the
  // LIVE title, or be labelled as quoting a superseded revision.
  const qIdxs = [];
  for (let i = 0; i < sec.length; i++) {
    if (/`\w+ CLI behaviours are unspecified/.test(sec[i])) qIdxs.push(secStart + i);
  }
  if (qIdxs.length === 0) {
    unreadable('A5', 'quoted backlog title', 'no backtick-quoted backlog title found in the section');
  } else {
    for (const [k, li] of qIdxs.entries()) {
      // the quotation may wrap across lines; reassemble from the backtick to its closer
      const blob = lines.slice(li, Math.min(li + 3, secEnd)).join(' ');
      const q = (blob.match(/`([^`]*CLI behaviours are unspecified[^`]*)`/) || [])[1];
      if (!q) { unreadable(`A5.${k}`, 'quoted backlog title', `unterminated backtick quotation at line ${li + 1}`); continue; }
      const norm = (s) => s.replace(/\s+/g, ' ').trim();
      if (norm(q) === norm(j7.title)) {
        pass(`A5.${k}`, 'quoted backlog title matches live backlog', `line ${li + 1} quotation is byte-equal (whitespace-normalised) to J-7's title`);
      } else {
        const tokens = nearbyHasDating(li);
        if (tokens.length) {
          review(`A5.${k}`, 'quoted backlog title matches live backlog', `line ${li + 1} quotes ${JSON.stringify(norm(q))} but live title is ${JSON.stringify(norm(j7.title))}; dating tokens nearby: ${tokens.join(', ')} -- CONDUCTOR MUST READ`);
        } else {
          fail(`A5.${k}`, 'quoted backlog title matches live backlog', `line ${li + 1} quotes ${JSON.stringify(norm(q))}, live title is ${JSON.stringify(norm(j7.title))}, nothing nearby dates the quotation`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Sites OUTSIDE the J-7 section. These are the three the cycle-12 repair missed.
// ---------------------------------------------------------------------------

// A6 - executive-summary hand-off line: "**Two CLI behaviours are unspecified (J-7)**"
{
  const hits = [];
  lines.forEach((l, i) => { const m = l.match(/\*\*(\w+) CLI behaviours are unspecified \(J-7\)\*\*/); if (m) hits.push({ i, w: m[1] }); });
  if (hits.length === 0) unreadable('A6', 'executive-summary hand-off count', 'no "**<word> CLI behaviours are unspecified (J-7)**" line found');
  else hits.forEach((h, k) => siteCell(`A6.${k}`, 'executive-summary hand-off count', h.i, h.w));
}

// A7 - ranked-action line: "Rule on J-7's two behaviours"
{
  const hits = [];
  lines.forEach((l, i) => { const m = l.match(/J-7's (\w+) behaviours/); if (m) hits.push({ i, w: m[1] }); });
  if (hits.length === 0) unreadable('A7', 'ranked-action count', `no "J-7's <word> behaviours" line found`);
  else hits.forEach((h, k) => siteCell(`A7.${k}`, 'ranked-action count', h.i, h.w));
}

// A8 - the cycle-8 "why this stopped early" bullet, which QUOTES J-7's acceptance clause
{
  const hits = [];
  lines.forEach((l, i) => { const m = l.match(/\*\*J-7\*\*.*?a human rules on (\w+) behaviours/i); if (m) hits.push({ i, w: m[1] }); });
  if (hits.length === 0) unreadable('A8', 'cycle-8 narrative quotation count', 'no "**J-7** ... a human rules on <word> behaviours" line found');
  else hits.forEach((h, k) => siteCell(`A8.${k}`, 'cycle-8 narrative quotation count', h.i, h.w));
}

// A9 - CATCH-ALL SWEEP. The three sites above are the ones the conductor enumerated by
// reading. This cell exists because an enumeration authored by reading is exactly the
// instrument that missed three sites at cycle 12. Any line mentioning J-7 alongside a
// non-true behaviour count, anywhere in the file, lands here.
{
  const stale = [];
  lines.forEach((l, i) => {
    if (!/J-7/.test(l)) return;
    const m = l.match(/\b(one|two|three|four|five|six)\b[^.\n]{0,60}behaviours?/i);
    if (!m) return;
    if (WORD2NUM[m[1].toLowerCase()] === TRUE_COUNT) return;
    stale.push({ i, w: m[1] });
  });
  if (stale.length === 0) {
    pass('A9', 'catch-all sweep for stale J-7 counts', `no line mentions J-7 alongside a count other than ${TRUE_COUNT}`);
  } else {
    const unlabelled = stale.filter((s) => nearbyHasDating(s.i).length === 0);
    if (unlabelled.length) {
      fail('A9', 'catch-all sweep for stale J-7 counts', `${stale.length} stale-count line(s) mention J-7; ${unlabelled.length} carry no dating token: ` + unlabelled.map((s) => `L${s.i + 1}("${s.w}")`).join(', '));
    } else {
      review('A9', 'catch-all sweep for stale J-7 counts', `${stale.length} stale-count line(s) mention J-7, all with dating tokens nearby: ` + stale.map((s) => `L${s.i + 1}("${s.w}")`).join(', ') + ' -- CONDUCTOR MUST READ');
    }
  }
}

// ---------------------------------------------------------------------------
// CONVERSE CONTROLS. These must be GREEN both before and after the repair. A gate whose
// every cell goes red on the unrepaired tree and green on the repaired one is a snapshot
// test; these cells are the ones a careless global s/two/five/ would break, so they carry
// the discriminating power.
// ---------------------------------------------------------------------------

// C1 - T-040 genuinely has TWO judgment calls. It must still say two.
{
  const hits = lines.filter((l) => /T-040|taxonomy judgment/.test(l) && /\btwo judgment calls\b/.test(l));
  if (hits.length >= 2) pass('C1', 'CONVERSE CONTROL: T-040 still says "two judgment calls"', `${hits.length} occurrences intact`);
  else fail('C1', 'CONVERSE CONTROL: T-040 still says "two judgment calls"', `expected >=2 occurrences, found ${hits.length} -- a blind s/two/five/ or an over-broad edit has damaged an ADJACENT and CORRECT count`);
}

// C2 - behaviours (1) and (2) are described as the pair measured at cycle 4 by J-6. That
// "two" is a correct historical statement about J-6's scope and must survive.
{
  const ok = /behaviours \(1\) and \(2\) measured/.test(src);
  if (ok) pass('C2', 'CONVERSE CONTROL: J-6 provenance line intact', 'the "(1) and (2) measured" cycle-4 provenance line survives');
  else fail('C2', 'CONVERSE CONTROL: J-6 provenance line intact', 'the cycle-4 J-6 provenance line was altered or removed');
}

// C3 - non-destruction, K-4's "nothing deleted". Measured against HEAD via git, not
// against a remembered line count.
{
  let numstat;
  try {
    numstat = execFileSync('git', ['-C', TARGET, 'diff', '--numstat', 'HEAD', '--', 'REPORT.md'], { encoding: 'utf8' }).trim();
  } catch (e) {
    unreadable('C3', 'non-destruction vs HEAD', `git diff failed: ${e.message}`);
    numstat = null;
  }
  if (numstat !== null) {
    if (numstat === '') pass('C3', 'non-destruction vs HEAD', 'REPORT.md is unchanged from HEAD (0 insertions, 0 deletions)');
    else {
      const [add, del] = numstat.split(/\s+/).map(Number);
      if (del <= 40) pass('C3', 'non-destruction vs HEAD', `+${add} / -${del} lines; deletions within the <=40 reconciliation budget`);
      else fail('C3', 'non-destruction vs HEAD', `+${add} / -${del} lines; ${del} deletions exceeds the reconciliation budget of 40 -- K-4 forbids deleting content`);
    }
  }
}

// C4 - every top-level and second-level heading present at HEAD survives.
{
  let headHeads;
  try {
    const headSrc = execFileSync('git', ['-C', TARGET, 'show', 'HEAD:REPORT.md'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    headHeads = headSrc.split('\n').filter((l) => /^#{1,2} /.test(l));
  } catch (e) {
    unreadable('C4', 'heading survival', `git show failed: ${e.message}`);
    headHeads = null;
  }
  if (headHeads) {
    const nowHeads = new Set(lines.filter((l) => /^#{1,2} /.test(l)));
    // the J-7 heading is EXPECTED to change (that is A1); exclude it from the survival set
    const missing = headHeads.filter((h) => !nowHeads.has(h) && !/^## J-7: /.test(h));
    if (missing.length === 0) pass('C4', 'heading survival', `all ${headHeads.length} HEAD headings survive (J-7 heading excluded, it is A1's subject)`);
    else fail('C4', 'heading survival', `${missing.length} heading(s) lost: ${missing.slice(0, 5).map((s) => JSON.stringify(s)).join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// REVIEW-ONLY OBSERVATION, carries no pass/fail weight. Recorded here so it is on the
// record BEFORE the repair, rather than discovered afterwards and presented as foresight.
// ---------------------------------------------------------------------------
{
  const noteIdx = lines.findIndex((l) => /This heading, and the executive summary line pointing at it, read/.test(l));
  if (noteIdx >= 0) {
    cells.push({
      id: 'OBS-1', state: 'OBSERVE',
      what: "V-7's own correction note may overstate the scope of the cycle-12 repair",
      detail: `line ${noteIdx + 1} says the heading AND the executive summary line read "two" until cycle 12 corrected them, but the executive-summary site (A6) was still stale when this gate was authored. This is outside R-2's acceptance clause, which names count claims and not the accuracy of a correction note's self-description. Flagged, NOT failed -- failing an item for a defect its acceptance does not name is moving the gate after the fact (cycle-6 precedent).`,
    });
  }
}

// ---------------------------------------------------------------------------
const P = cells.filter((c) => c.state === 'PASS').length;
const F = cells.filter((c) => c.state === 'FAIL').length;
const R = cells.filter((c) => c.state === 'REVIEW').length;

console.log(`cycle-014 gate / item R-2 / true J-7 count from backlog = ${TRUE_COUNT} ("${titleCountWord}")`);
console.log('='.repeat(78));
for (const c of cells) console.log(`[${c.state}] ${c.id}  ${c.what}\n        ${c.detail}`);
if (unparseable.length) {
  console.log('-'.repeat(78));
  for (const u of unparseable) console.log(`[UNPARSEABLE] ${u.id}  ${u.what}\n        ${u.why}`);
}
console.log('='.repeat(78));
console.log(`PASS ${P} / FAIL ${F} / REVIEW ${R} / UNPARSEABLE ${unparseable.length}`);

if (unparseable.length) { console.log('EXIT 2 - the instrument could not read part of its subject. This is not a verdict on the subject.'); process.exit(2); }
process.exit(F > 0 || R > 0 ? 1 : 0);
