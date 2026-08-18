#!/usr/bin/env node
// cycle-6 conductor gate for J-5 — AUTHORED PRE-DISPATCH, from README.md and the
// item's acceptance, never from a builder's diff. Lives OUTSIDE the target so the
// builder (which receives target paths only) cannot read it.
//
// THE FACT UNDER TEST, not the shape of any fix:
//   (1) A stray unrecognised count claim about tags, sitting as prose in the
//       Tag vocabulary section while the tables say otherwise, must make the
//       project's own test_cmd go RED. Today it does not (measured at cycle 3,
//       gate cell N1).
//   (2) Nothing that legitimately reads a count in that section may stop biting.
//   (3) No correct README may start being rejected (false-rejection ledger must
//       not grow).
//
// Two arms, one instrument: arm A = the pre-dispatch commit (git archive), arm B =
// the live tree. Each cell mutates README.md in a throwaway copy of the arm and
// runs `node --test test/*.test.js` in that copy. A cell's verdict is GREEN/RED
// plus the names of the tests that failed, so a RED can be attributed to a guard
// that actually names the claim rather than to unrelated collateral.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const BASE_COMMIT = process.env.BASE_COMMIT || '0e5d917';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c6gate-'));

const log = (...a) => console.log(...a);

// ---------------------------------------------------------------------------
// Cells. `mut` returns the mutated README text (or null to signal the anchor
// vanished, which is itself a loud failure — a cell that cannot be applied is
// never silently a pass).
// ---------------------------------------------------------------------------
const OPENING = 'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';

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
  // --- sound control -------------------------------------------------------
  { id: 'P0', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'no mutation — the shipped README',
    mut: t => t },

  // --- the item's headline hole -------------------------------------------
  { id: 'N1', expect: { A: 'GREEN', B: 'RED' },
    what: 'stray FALSE prose claim "9 tags have a robust pool (5+ entries):" after the opening paragraph, table holds 7 rows',
    mut: t => insertAfter(t, OPENING, '9 tags have a robust pool (5+ entries):') },

  { id: 'N2', expect: { A: 'GREEN', B: 'RED' },
    what: 'same FALSE claim, different position — immediately before the closing "smallest pool" sentence',
    mut: t => insertBefore(t, 'The smallest pool holds three aphorisms', '9 tags have a robust pool (5+ entries):') },

  { id: 'N3', expect: { A: 'GREEN', B: 'RED' },
    what: 'a DIFFERENTLY-SHAPED false unrecognised claim: "Only 5 tags appear on more than 10 entries." (truth: 2)',
    mut: t => insertAfter(t, OPENING, 'Only 5 tags appear on more than 10 entries.') },

  // --- coverage that must NOT be lost --------------------------------------
  { id: 'C1', expect: { A: 'RED', B: 'RED' },
    what: 'a false "N tags ... or more" claim inserted BEFORE the opening sentence (steals first-match)',
    mut: t => insertBefore(t, OPENING, '9 tags appear on 2 or more entries.') },

  { id: 'F1', expect: { A: 'RED', B: 'RED' },
    what: 'falsify the opening sentence multi-entry count 12 -> 9',
    mut: t => replaceOnce(t, '12 tags appear on 2 or more entries', '9 tags appear on 2 or more entries') },

  { id: 'F2', expect: { A: 'RED', B: 'RED' },
    what: 'falsify the single-entry count 0 -> 3 ("exactly once")',
    mut: t => replaceOnce(t, '0 tags appear exactly once', '3 tags appear exactly once') },

  { id: 'F3', expect: { A: 'RED', B: 'RED' },
    what: 'falsify the distinct-tag total 12 -> 13',
    mut: t => replaceOnce(t, 'The corpus contains 12 distinct tags', 'The corpus contains 13 distinct tags') },

  { id: 'F4', expect: { A: 'RED', B: 'RED' },
    what: 'falsify a band table cell: `design` 14 -> 15',
    mut: t => replaceOnce(t, '| `design` | 14 |', '| `design` | 15 |') },

  { id: 'F5', expect: { A: 'RED', B: 'RED' },
    what: 'delete a band table row entirely (`philosophy`)',
    mut: t => replaceOnce(t, '| `philosophy` | 3 |\n', '') },

  { id: 'B1', expect: { A: 'RED', B: 'RED' },
    what: 'falsify a band heading boundary: "Robust pool (5+ entries)" -> "(6+ entries)"',
    mut: t => replaceOnce(t, '#### Robust pool (5+ entries)', '#### Robust pool (6+ entries)') },

  // --- false-rejection controls: an honest README must stay GREEN ----------
  { id: 'R1', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'reword band heading English only, digits intact: "Robust pool" -> "Deep pool"',
    mut: t => replaceOnce(t, '#### Robust pool (5+ entries)', '#### Deep pool (5+ entries)') },

  { id: 'R2', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'reword the opening sentence English only, every number unchanged and still true',
    mut: t => replaceOnce(t, 'which is to say 0 tags sit on exactly one entry', 'meaning 0 tags sit on exactly one entry') },

  { id: 'R3', expect: { A: 'GREEN', B: 'GREEN' },
    what: 'a TRUE reworded band table heading elsewhere: "Appears 3–4 times" -> "Appears 3–4 times each"',
    mut: t => replaceOnce(t, '#### Appears 3–4 times', '#### Appears 3–4 times each') },

  // --- informational: measures the COST of whatever rule lands -------------
  { id: 'I1', informational: true,
    what: 'a TRUE but unrecognised claim: "2 tags appear on 10 or more entries." after the opening paragraph',
    mut: t => insertAfter(t, OPENING, '2 tags appear on 10 or more entries.') },

  { id: 'I2', informational: true,
    what: 'an honest prose count in digits rather than words: "holds three aphorisms" -> "holds 3 aphorisms"',
    mut: t => replaceOnce(t, 'The smallest pool holds three aphorisms', 'The smallest pool holds 3 aphorisms') },
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

// The project's test_cmd (`node --test test/*.test.js`) emits node's SPEC
// reporter, not TAP -- the first authoring of this gate parsed for `# pass` /
// `not ok` and therefore read EVERY arm, including the unmutated P0 control, as
// RED. The P0 control is what caught it. Both formats are parsed here, and the
// verdict is taken from the process exit status (the fact) rather than from a
// successfully-parsed count (the shape), so a future reporter change degrades
// the counts, never the verdict.
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
log('=== cycle-6 J-5 gate ===');
log('base commit:', execFileSync('git', ['-C', TARGET, 'rev-parse', '--short', BASE_COMMIT], { encoding: 'utf8' }).trim());

// Precondition: README.md must be byte-identical to the pre-dispatch commit.
// J-5 is a test-file item; a builder that "fixed" it by editing the document
// under the guard would invalidate every cell below, so this is checked first.
const baseReadme = execFileSync('git', ['-C', TARGET, 'show', `${BASE_COMMIT}:README.md`], { encoding: 'utf8' });
const liveReadme = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8');
log('PRECONDITION README.md unchanged since pre-dispatch:', baseReadme === liveReadme ? 'YES' : 'NO — CELLS BELOW ARE VOID');

const armA = buildArm('A');
const armB = buildArm('B');
log('arm A suite:', JSON.stringify((({ verdict, pass, fail }) => ({ verdict, pass, fail }))(runSuite(armA))));
log('arm B suite:', JSON.stringify((({ verdict, pass, fail }) => ({ verdict, pass, fail }))(runSuite(armB))));
log('');

let scored = 0, held = 0;
const rows = [];
for (const cell of CELLS) {
  const a = runCell(armA, cell, 'A');
  const b = runCell(armB, cell, 'B');
  let mark;
  if (cell.informational) {
    mark = 'INFO';
  } else {
    scored++;
    const ok = a.verdict === cell.expect.A && b.verdict === cell.expect.B;
    if (ok) held++;
    mark = ok ? 'HOLD' : 'BREAK';
  }
  rows.push({ cell, a, b, mark });
  log(`[${mark}] ${cell.id}  A=${a.verdict}(${a.pass}/${a.fail}) B=${b.verdict}(${b.pass}/${b.fail})` +
      (cell.informational ? '' : `  expected A=${cell.expect.A} B=${cell.expect.B}`));
  log(`        ${cell.what}`);
  if (b.failed.length) log(`        B failing tests: ${b.failed.slice(0, 4).map(s => s.slice(0, 110)).join(' | ')}${b.failed.length > 4 ? ` (+${b.failed.length - 4})` : ''}`);
  if (a.failed.length) log(`        A failing tests: ${a.failed.slice(0, 4).map(s => s.slice(0, 110)).join(' | ')}${a.failed.length > 4 ? ` (+${a.failed.length - 4})` : ''}`);
}

log('');
log(`SCORE ${held}/${scored} scored cells hold (${CELLS.length - scored} informational)`);
fs.rmSync(WORK, { recursive: true, force: true });
process.exit(held === scored ? 0 : 1);
