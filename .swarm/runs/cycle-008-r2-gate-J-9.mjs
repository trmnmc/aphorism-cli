#!/usr/bin/env node
// ===========================================================================
// cycle-8 (improvement run #2) conductor gate for J-9.
// AUTHORED PRE-DISPATCH, from README.md, src/corpus.js and the item's
// acceptance. Never from a builder's diff. Hash-committed before dispatch and
// the plaintext deleted for the dispatch window (KI-8 commit-reveal).
//
// FILE NAMING: this run's cycle numbering collides with run #1's, which also
// had a cycle 8 and left cycle-008-*.js artifacts in this directory. Run-#2
// files this cycle carry the `cycle-008-r2-` prefix so a later reader can tell
// the two apart.
//
// ---------------------------------------------------------------------------
// THE FACT UNDER TEST, not the shape of any fix:
//   (1) A SECOND, FALSE occurrence of one of the three RECOGNISED tag-count
//       claim shapes, placed in the Tag vocabulary section where it does not
//       displace the first occurrence, must make `node --test test/*.test.js`
//       go RED. Measured GREEN (i.e. the hole is open) at cycle 6, and proved
//       PRE-EXISTING on the pre-J-5 tree 0e5d917.
//   (2) All 14 scored cells of the cycle-6 gate must still hold — with their
//       expectations RESTATED for this cycle's arms (see REGRESSION below).
//   (3) The three legitimate prose counts must still be read.
//   (4) COST: a TRUE second occurrence of a recognised shape must NOT start
//       being rejected. This is the false-rejection ledger the item's
//       retirement branch turns on.
//
// ARMS. A = pre-dispatch commit cb4b1c2 (git archive) — J-5's fix is already
// IN it, so cycle-6's N1/N2/N3 kills are expected RED on BOTH arms here,
// unlike at cycle 6 where arm A predated the fix. B = the live tree after the
// builder returns.
//
// ---------------------------------------------------------------------------
// VERDICT RULE — WRITTEN DOWN BEFORE ANY CELL HAS BEEN RUN, so it cannot be
// moved to fit the numbers. J-9's acceptance allows two terminal routes and
// this gate decides WHICH ONE the evidence supports:
//
//   ROUTE (a) CLOSE — item passes as fixed iff:
//        all 6 HOLE cells read A=GREEN, B=RED
//        all 3 ATTRIBUTION checks hold (the failure names the wrong number)
//        all 14 REGRESSION cells hold
//        all 4 COST cells read GREEN on BOTH arms
//
//   ROUTE (b) RETIRE — if the HOLE cells close but ANY COST cell goes RED on
//        arm B against prose that is TRUE, the fix bought the hole with new
//        false rejections. That is a lateral trade, and this run has already
//        measured that trade three times in this family (cycles 31, 32, 35)
//        and recorded a standing decision against buying kills with false
//        rejections (cycle-39 family decision). In that case the change is
//        REVERTED and J-9 is retired DONE with this gate's numbers as the
//        measured argument its acceptance requires.
//
//   FAIL — any REGRESSION cell breaks, or the HOLE cells do not close and no
//        measured retirement argument is available.
//
// STOPPING RULE (cycle-6 decision, restated so it binds this cycle): if this
// gate surfaces a FURTHER prose hole beyond J-9's own, that is the signal to
// stop this family and report it. Do not file J-10.
// ---------------------------------------------------------------------------

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const BASE_COMMIT = process.env.BASE_COMMIT || 'cb4b1c2';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c8r2gate-'));
const log = (...a) => console.log(...a);

// Corpus facts, MEASURED at cycle 8 (.swarm/runs/cycle-008-r2-facts.mjs), used
// to make every cell's truth a measurement rather than a guess:
//   50 entries · 12 distinct tags · 12 tags on >=2 entries · 0 tags on exactly 1
//   7 tags on >=5 entries · 2 tags on >=10 entries · 5 tags on 3-4 entries
const OPENING =
  'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';

function replaceOnce(text, from, to) {
  if (text.split(from).length !== 2) return null; // absent or ambiguous
  return text.replace(from, to);
}
function insertAfter(text, anchor, para) {
  if (text.split(anchor).length !== 2) return null;
  return text.replace(anchor, anchor + '\n\n' + para);
}
function insertBefore(text, anchor, para) {
  if (text.split(anchor).length !== 2) return null;
  return text.replace(anchor, para + '\n\n' + anchor);
}

const CELLS = [
  // === sound control =======================================================
  { id: 'P0', group: 'control', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'no mutation — the shipped README',
    mut: t => t },

  // === THE HOLE: a FALSE duplicate of a RECOGNISED shape ===================
  // J1-J3 are the three cells the cycle-6 follow-up probe measured (D1/D2/D4).
  // J4-J6 were authored THIS cycle and no builder has seen them.
  { id: 'J1', group: 'hole', expect: { A: 'GREEN', B: 'RED' }, attrib: /\b9\b/,
    what: 'FALSE duplicate of recognised shape 2 after the opening paragraph: "9 tags appear on 2 or more entries." (true: 12)',
    mut: t => insertAfter(t, OPENING, '9 tags appear on 2 or more entries.') },

  { id: 'J2', group: 'hole', expect: { A: 'GREEN', B: 'RED' }, attrib: /\b13\b/,
    what: 'FALSE duplicate of recognised shape 1: "The corpus contains 13 distinct tags." (true: 12)',
    mut: t => insertAfter(t, OPENING, 'The corpus contains 13 distinct tags.') },

  { id: 'J3', group: 'hole', expect: { A: 'GREEN', B: 'RED' }, attrib: /\b4\b/,
    what: 'FALSE duplicate of recognised shape 3: "In fact 4 tags sit on exactly one entry." (true: 0)',
    mut: t => insertAfter(t, OPENING, 'In fact 4 tags sit on exactly one entry.') },

  { id: 'J4', group: 'hole', expect: { A: 'GREEN', B: 'RED' },
    what: 'NEW — same shape-2 falsehood at the END of the section instead of after the opening: position independence',
    mut: t => insertBefore(t, 'The smallest pool holds three aphorisms', 'Overall 9 tags appear on 2 or more entries.') },

  { id: 'J5', group: 'hole', expect: { A: 'GREEN', B: 'RED' },
    what: 'NEW — shape-1 falsehood in a different sentence frame: "Note that 30 distinct tags remain after the fold." (true: 12)',
    mut: t => insertAfter(t, OPENING, 'Note that 30 distinct tags remain after the fold.') },

  { id: 'J6', group: 'hole', expect: { A: 'GREEN', B: 'RED' },
    what: 'NEW — shape-3 falsehood in the "exactly once" phrasing: "Even so, 6 tags appear exactly once today." (true: 0)',
    mut: t => insertAfter(t, OPENING, 'Even so, 6 tags appear exactly once today.') },

  // === COST: TRUE prose that must NOT start being rejected =================
  // Every sentence here is TRUE by the measured corpus facts above. A RED on
  // arm B is a NEW FALSE REJECTION and routes the item to retirement (b).
  { id: 'X1', group: 'cost', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'TRUE restatement, shape 1, same number: "All 12 distinct tags are listed below."',
    mut: t => insertAfter(t, OPENING, 'All 12 distinct tags are listed below.') },

  { id: 'X2', group: 'cost', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'TRUE second occurrence, shape 2, DIFFERENT threshold: "7 tags appear on 5 or more entries." (measured: 7)',
    mut: t => insertAfter(t, OPENING, '7 tags appear on 5 or more entries.') },

  { id: 'X3', group: 'cost', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'TRUE second occurrence, shape 2, another threshold: "2 tags appear on 10 or more entries." (measured: 2)',
    mut: t => insertAfter(t, OPENING, '2 tags appear on 10 or more entries.') },

  { id: 'X4', group: 'cost', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'TRUE restatement, shape 2, SAME number and threshold: "Put another way, 12 tags appear on 2 or more entries."',
    mut: t => insertAfter(t, OPENING, 'Put another way, 12 tags appear on 2 or more entries.') },

  // === REGRESSION: the 14 scored cells of the cycle-6 gate =================
  // Expectations RESTATED for this cycle's arms. N1/N2/N3 were A=GREEN,B=RED
  // at cycle 6 because arm A predated J-5's fix; here that fix is in BOTH
  // arms, so a preserved kill reads RED on both.
  { id: 'N1', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/N1 kill preserved: stray FALSE unrecognised claim "9 tags have a robust pool (5+ entries):"',
    mut: t => insertAfter(t, OPENING, '9 tags have a robust pool (5+ entries):') },

  { id: 'N2', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/N2 kill preserved: same unrecognised claim before the closing "smallest pool" sentence',
    mut: t => insertBefore(t, 'The smallest pool holds three aphorisms', '9 tags have a robust pool (5+ entries):') },

  { id: 'N3', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/N3 kill preserved: "Only 5 tags appear on more than 10 entries." (unrecognised shape; truth 2)',
    mut: t => insertAfter(t, OPENING, 'Only 5 tags appear on more than 10 entries.') },

  { id: 'C1', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/C1: a false shape-2 claim inserted BEFORE the opening sentence (steals the first match)',
    mut: t => insertBefore(t, OPENING, '9 tags appear on 2 or more entries.') },

  { id: 'F1', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/F1: falsify the opening multi-entry count 12 -> 9',
    mut: t => replaceOnce(t, '12 tags appear on 2 or more entries', '9 tags appear on 2 or more entries') },

  { id: 'F2', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/F2: falsify the single-entry count 0 -> 3 ("exactly once")',
    mut: t => replaceOnce(t, '0 tags appear exactly once', '3 tags appear exactly once') },

  { id: 'F3', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/F3: falsify the distinct-tag total 12 -> 13',
    mut: t => replaceOnce(t, 'The corpus contains 12 distinct tags', 'The corpus contains 13 distinct tags') },

  { id: 'F4', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/F4: falsify a band table cell `design` 14 -> 15',
    mut: t => replaceOnce(t, '| `design` | 14 |', '| `design` | 15 |') },

  { id: 'F5', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/F5: delete a band table row entirely (`philosophy`)',
    mut: t => replaceOnce(t, '| `philosophy` | 3 |\n', '') },

  { id: 'B1', group: 'regression', expect: { A: 'RED', B: 'RED' },
    what: 'c6/B1: falsify a band heading boundary "(5+ entries)" -> "(6+ entries)"',
    mut: t => replaceOnce(t, '#### Robust pool (5+ entries)', '#### Robust pool (6+ entries)') },

  { id: 'R1', group: 'regression', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'c6/R1: reword band heading English only, digits intact ("Robust pool" -> "Deep pool")',
    mut: t => replaceOnce(t, '#### Robust pool (5+ entries)', '#### Deep pool (5+ entries)') },

  { id: 'R2', group: 'regression', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'c6/R2: reword the opening sentence English only, every number unchanged and still true',
    mut: t => replaceOnce(t, 'which is to say 0 tags sit on exactly one entry', 'meaning 0 tags sit on exactly one entry') },

  { id: 'R3', group: 'regression', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'c6/R3: a TRUE reworded band table heading ("Appears 3–4 times" -> "... times each")',
    mut: t => replaceOnce(t, '#### Appears 3–4 times', '#### Appears 3–4 times each') },

  // c6/I2 was informational at cycle 6; carried here as the 14th scored
  // regression cell only if it was scored there. It was NOT — see below.
];

// ---------------------------------------------------------------------------
function buildArm(name) {
  const dir = path.join(WORK, 'arm' + name);
  fs.mkdirSync(dir);
  if (name === 'A') {
    const tar = execFileSync('git', ['-C', TARGET, 'archive', BASE_COMMIT], { maxBuffer: 1 << 28 });
    const tarPath = path.join(WORK, 'armA.tar');
    fs.writeFileSync(tarPath, tar);
    execFileSync('tar', ['-xf', tarPath, '-C', dir]);
  } else {
    execFileSync('cp', ['-a', TARGET + '/.', dir]);
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
  }
  return dir;
}

// Verdict from the process EXIT STATUS (the fact); counts parsed from either
// reporter format (the shape). Cycle 6 learned this the hard way — its first
// authoring parsed for TAP while `node --test` emits the SPEC reporter, and
// read every arm including the unmutated control as RED.
function runSuite(dir) {
  const r = spawnSync('bash', ['-c', 'node --test test/*.test.js'], {
    cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const num = re => Number((out.match(re) || [])[1] ?? -1);
  let pass = num(/^# pass (\d+)/m);
  let fail = num(/^# fail (\d+)/m);
  if (pass < 0) pass = num(/^ℹ pass (\d+)/m);
  if (fail < 0) fail = num(/^ℹ fail (\d+)/m);
  const failed = [
    ...[...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1].trim()),
    ...[...out.matchAll(/^✖ (.+?) \(\d[\d.]*ms\)$/gm)].map(m => m[1].trim()),
  ];
  return { verdict: r.status === 0 ? 'GREEN' : 'RED', pass, fail, failed, out };
}

function runCell(armDir, cell, armName) {
  const cellDir = path.join(WORK, `${cell.id}-${armName}`);
  execFileSync('cp', ['-a', armDir, cellDir]);
  const readmePath = path.join(cellDir, 'README.md');
  const orig = fs.readFileSync(readmePath, 'utf8');
  const mutated = cell.mut(orig);
  if (mutated === null) {
    return { verdict: 'UNAPPLIABLE', pass: -1, fail: -1, failed: [], out: 'anchor absent or ambiguous' };
  }
  if (cell.id !== 'P0' && mutated === orig) {
    return { verdict: 'NOOP', pass: -1, fail: -1, failed: [], out: 'mutation was a no-op' };
  }
  fs.writeFileSync(readmePath, mutated);
  const res = runSuite(cellDir);
  fs.rmSync(cellDir, { recursive: true, force: true });
  return res;
}

// ---------------------------------------------------------------------------
const ARMS = (process.env.ARMS || 'AB').toUpperCase();
log('=== cycle-8 (run #2) J-9 gate ===');
log('base commit:', execFileSync('git', ['-C', TARGET, 'rev-parse', '--short', BASE_COMMIT], { encoding: 'utf8' }).trim());
log('arms run this invocation:', ARMS);

// Precondition: J-9 is a TEST-file item. A "fix" that edited the document under
// the guard would void every cell below, so it is checked first and loudly.
const baseReadme = execFileSync('git', ['-C', TARGET, 'show', `${BASE_COMMIT}:README.md`], { encoding: 'utf8' });
const liveReadme = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8');
const readmeUnchanged = baseReadme === liveReadme;
log('PRECONDITION README.md unchanged since pre-dispatch:', readmeUnchanged ? 'YES' : 'NO — CELLS BELOW ARE VOID');

const armA = ARMS.includes('A') ? buildArm('A') : null;
const armB = ARMS.includes('B') ? buildArm('B') : null;
if (armA) log('arm A suite:', JSON.stringify((({ verdict, pass, fail }) => ({ verdict, pass, fail }))(runSuite(armA))));
if (armB) log('arm B suite:', JSON.stringify((({ verdict, pass, fail }) => ({ verdict, pass, fail }))(runSuite(armB))));
log('');

const tally = {};
let scored = 0, held = 0, attribScored = 0, attribHeld = 0;
for (const cell of CELLS) {
  const a = armA ? runCell(armA, cell, 'A') : null;
  const b = armB ? runCell(armB, cell, 'B') : null;
  let mark = 'PARTIAL';
  if (a && b) {
    scored++;
    const ok = a.verdict === cell.expect.A && b.verdict === cell.expect.B;
    if (ok) held++;
    mark = ok ? 'HOLD' : 'BREAK';
    tally[cell.group] = tally[cell.group] || { held: 0, total: 0 };
    tally[cell.group].total++;
    if (ok) tally[cell.group].held++;
  }
  log(`[${mark}] ${cell.id} (${cell.group})  A=${a ? a.verdict : '-'}(${a ? a.pass + '/' + a.fail : '-'})` +
      ` B=${b ? b.verdict : '-'}(${b ? b.pass + '/' + b.fail : '-'})  expected A=${cell.expect.A} B=${cell.expect.B}`);
  log(`        ${cell.what}`);
  if (cell.attrib && b) {
    attribScored++;
    const named = b.verdict === 'RED' && cell.attrib.test(b.out);
    if (named) attribHeld++;
    log(`        ATTRIBUTION ${named ? 'HOLD' : 'BREAK'} — failure output ${named ? 'names' : 'does NOT name'} the wrong number ${cell.attrib}`);
  }
  if (b && b.failed.length) log(`        B failing: ${b.failed.slice(0, 3).map(s => s.slice(0, 120)).join(' | ')}${b.failed.length > 3 ? ` (+${b.failed.length - 3})` : ''}`);
  if (a && a.failed.length) log(`        A failing: ${a.failed.slice(0, 3).map(s => s.slice(0, 120)).join(' | ')}${a.failed.length > 3 ? ` (+${a.failed.length - 3})` : ''}`);
}

log('');
log(`SCORE ${held}/${scored} cells hold; attribution ${attribHeld}/${attribScored}`);
for (const [g, v] of Object.entries(tally)) log(`  ${g}: ${v.held}/${v.total}`);
log('README precondition:', readmeUnchanged ? 'OK' : 'VOID');
fs.rmSync(WORK, { recursive: true, force: true });
process.exit(held === scored && attribHeld === attribScored && readmeUnchanged ? 0 : 1);
