#!/usr/bin/env node
// run #4 cycle 10 — verification gate for Q-6 (README documents --author diacritic
// sensitivity). Held OUTSIDE the target repo for the dispatch window (run #3 cycle-14
// precedent: hard rule 5 makes a SWARM path structurally unreachable to a builder,
// which is stronger than an instruction not to look).
//
// Usage:  node run4-c010-q6-gate.mjs            (full gate)
//         node run4-c010-q6-gate.mjs --baseline (pre-dispatch: B-cells MUST be RED)
//
// ANCHORS captured pre-dispatch at HEAD c491e5f:
//   src/corpus.js  77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e
//   README.md      61e9ad7d3c88fc7ae0ac23db9debbe9b5a19fd72da7ad7017efbd582eabd34c5

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const T = '/opt/targets/aphorism-cli';
const BIN = `${T}/bin/aphorism.js`;
const README = `${T}/README.md`;

const BASELINE = process.argv.includes('--baseline');

// The one non-ASCII author in the corpus, read FROM THE MODULE, never from prose.
const corpusMod = await import(`file://${T}/src/corpus.js`);
const corpus = (() => {
  const c = corpusMod.default ?? corpusMod;
  for (const v of [c, c.corpus, c.aphorisms, c.APHORISMS]) if (Array.isArray(v)) return v;
  throw new Error('cannot locate corpus array');
})();
const NONASCII_AUTHORS = [...new Set(corpus.map(a => a.author))].filter(a => /[^\x00-\x7F]/.test(a));
if (NONASCII_AUTHORS.length !== 1) throw new Error(`expected exactly 1 non-ASCII author, got ${NONASCII_AUTHORS.length}`);
const AUTHOR = NONASCII_AUTHORS[0];                       // "Antoine de Saint-Exupéry"
const AUTHOR_LC = AUTHOR.toLowerCase();
// ASCII fold of the author, derived (not typed from memory).
const AUTHOR_ASCII = AUTHOR.normalize('NFD').replace(/[̀-ͯ]/g, '');
const SURNAME = AUTHOR.split(/\s+/).pop();                // "Saint-Exupéry"
const SURNAME_ASCII = AUTHOR_ASCII.split(/\s+/).pop();    // "Saint-Exupery"

const results = [];
const cell = (id, label, fn) => {
  let ok = false, note = '';
  try { const r = fn(); ok = !!r.ok; note = r.note ?? ''; }
  catch (e) { ok = false; note = `THREW ${e.message}`; }
  results.push({ id, label, ok, note });
};

function run(args) {
  const r = spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');

// ---------------------------------------------------------------------------
// UNIT SPLITTER. cycle-8 lesson (instrument defects #19/#20): a bullet/row read by
// "first source line matching the label" loses wrapped continuations, and a slice that
// runs to the next label absorbs its neighbour (defects #17/#18). So: each table row is
// its OWN unit, each fenced block is its OWN unit, and prose units are blank-line
// separated and whitespace-normalised. Neighbours are NEVER merged.
// ---------------------------------------------------------------------------
function units(text) {
  const out = [];
  const lines = text.split('\n');
  let buf = [];
  let inFence = false, fenceBuf = [];
  const flush = () => { const s = buf.join(' ').replace(/\s+/g, ' ').trim(); if (s) out.push(s); buf = []; };
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (inFence) { fenceBuf.push(line); out.push(fenceBuf.join('\n')); fenceBuf = []; inFence = false; }
      else { flush(); inFence = true; fenceBuf = [line]; }
      continue;
    }
    if (inFence) { fenceBuf.push(line); continue; }
    if (/^\s*\|/.test(line)) { flush(); out.push(line.replace(/\s+/g, ' ').trim()); continue; }
    if (/^\s*$/.test(line)) { flush(); continue; }
    if (/^\s*[-*]\s/.test(line)) { flush(); buf.push(line); continue; }
    buf.push(line);
  }
  flush();
  if (inFence && fenceBuf.length) out.push(fenceBuf.join('\n'));
  return out;
}

// Every `--author <value>` the README itself offers, from inline code spans and fences.
function authorValuesIn(text) {
  const vals = [];
  const re = /--author[=\s]+(?:'([^']*)'|"([^"]*)"|([^\s`|]+))/g;
  let m;
  while ((m = re.exec(text)) !== null) vals.push(m[1] ?? m[2] ?? m[3]);
  return [...new Set(vals)];
}

const readme = () => readFileSync(README, 'utf8');
const NEG = /(does not match|doesn't match|will not match|won't match|no match|not found|fails|failing|exits? 1|exit code 1|exit `1`|no aphorism)/i;

// =========================== A — SHIPPED BEHAVIOUR IS UNCHANGED =============
// Q-6 is DOCS ONLY. The SPEC Domain rule already specifies substring containment,
// case-insensitively; the shipped behaviour is CONFORMING and must not change.

cell('A1', 'ASCII spelling STILL exits 1, stdout empty (behaviour unchanged)', () => {
  const r = run(['--author', SURNAME_ASCII, '--list']);
  return { ok: r.code === 1 && r.out === '' && /no aphorism/i.test(r.err), note: `exit=${r.code} stdout=${JSON.stringify(r.out)}` };
});

cell('A2', 'diacritic spelling (NFC) STILL exits 0 and prints the entry', () => {
  const r = run(['--author', SURNAME.normalize('NFC'), '--list']);
  return { ok: r.code === 0 && r.out.includes(AUTHOR), note: `exit=${r.code} lines=${r.out.trim().split('\n').length}` };
});

cell('A3', 'NFD (decomposed) input STILL exits 1 — same root cause, rarer trigger', () => {
  const r = run(['--author', SURNAME.normalize('NFD'), '--list']);
  return { ok: r.code === 1 && r.out === '', note: `exit=${r.code}` };
});

cell('A4', 'the diacritic-avoiding partials STILL reach the entry (severity cap holds)', () => {
  const probes = ['saint', 'exup', 'antoine'];
  const codes = probes.map(p => run(['--author', p, '--list']).code);
  return { ok: codes.every(c => c === 0), note: probes.map((p, i) => `${p}=${codes[i]}`).join(' ') };
});

// =========================== S — SCOPE ======================================

cell('S1', 'src/corpus.js BYTE-IDENTICAL to the pre-dispatch anchor (M-5)', () => {
  const h = sha(`${T}/src/corpus.js`);
  return { ok: h === '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e', note: h.slice(0, 16) };
});

cell('S2', 'no product source or test file changed since the seal', () => {
  const r = spawnSync('git', ['-C', T, 'diff', '--name-only', 'c491e5f', '--', 'src', 'bin', 'test', '.github'], { encoding: 'utf8' });
  const changed = (r.stdout ?? '').trim();
  return { ok: changed === '', note: changed === '' ? '(none)' : changed.replace(/\n/g, ',') };
});

cell('S3', 'the ONLY tracked file changed since the seal is README.md', () => {
  // Reads the WORKING TREE, not committed history. cycle-5's G5 failed silently by
  // diffing committed history to itself while the work was still uncommitted.
  const r = spawnSync('git', ['-C', T, 'status', '--porcelain'], { encoding: 'utf8' });
  const paths = (r.stdout ?? '').trim().split('\n').filter(Boolean)
    .map(l => l.slice(3).trim())
    .filter(p => !p.startsWith('.swarm/'));   // conductor bookkeeping is not builder scope
  const bad = paths.filter(p => p !== 'README.md');
  return { ok: bad.length === 0, note: `tracked-changed=[${paths.join(',')}]` };
});

// =========================== B — THE DOCUMENTATION CLAIM ====================
// These are the cells that must be RED at the pre-dispatch baseline.

// B1's predicate, extracted so C4 can test THE ACTUAL CODE rather than a restatement
// of it. (Pre-seal baseline caught C4 asserting a property of the WORLD instead of a
// property of the CELL, and failing on a correct README.)
const b1Predicate = t => t.includes(SURNAME) || t.includes(AUTHOR);

cell('B1', `README names the author in its DIACRITIC form ("${SURNAME}")`, () => {
  const t = readme();
  return { ok: b1Predicate(t), note: `surname=${t.includes(SURNAME)} full=${t.includes(AUTHOR)}` };
});

cell('B2', `README names the ASCII spelling ("${SURNAME_ASCII}")`, () => {
  const t = readme();
  return { ok: t.includes(SURNAME_ASCII), note: `present=${t.includes(SURNAME_ASCII)}` };
});

cell('B3', 'README offers a partial that ACTUALLY WORKS (execution-backed, not asserted)', () => {
  const vals = authorValuesIn(readme());
  const relevant = vals.filter(v => v && AUTHOR_LC.includes(v.toLowerCase()));
  const working = relevant.filter(v => run(['--author', v, '--list']).code === 0);
  return { ok: working.length > 0, note: `readme --author values=[${vals.join('|')}] relevant=[${relevant.join('|')}] exit0=[${working.join('|')}]` };
});

cell('B4', 'the ASCII spelling is marked as NOT matching — in prose IN ITS OWN UNIT, or demonstrated by a README example that really exits 1', () => {
  const t = readme();
  const us = units(t).filter(u => u.includes(SURNAME_ASCII));
  const prose = us.some(u => NEG.test(u));
  const vals = authorValuesIn(t);
  const demo = vals.some(v => v && v.normalize('NFC').includes(SURNAME_ASCII) && run(['--author', v, '--list']).code === 1);
  return { ok: prose || demo, note: `units-with-ascii=${us.length} prose=${prose} demo=${demo}` };
});

// =========================== C — CONTROLS ===================================

cell('C1', 'MUST-DIE: the presence reader is not a rubber stamp', () => {
  const t = readme();
  const bogus = t.includes('Zzqx-Nonexistent-Marker');
  return { ok: bogus === false, note: `bogus-token-found=${bogus} (cell passes iff NOT found)` };
});

cell('C2', 'MUST-STAY-GREEN: the reader can actually read the file (pre-existing marker)', () => {
  const t = readme();
  return { ok: t.includes('## Exit codes') && t.includes('## Flags'), note: 'pre-existing headings present' };
});

cell('C3', 'MUST-DIE: asserting the ASCII spelling exits 0 must FAIL (A1 measures, not asserts)', () => {
  const r = run(['--author', SURNAME_ASCII, '--list']);
  return { ok: r.code !== 0, note: `inverted assertion correctly dies (real exit=${r.code})` };
});

cell('C4', 'MUST-DIE: B1 is not fooled by the non-ASCII DECOYS the README already carries', () => {
  // README already carries —, ℹ and … . A diacritic-blind B1 ("any non-ASCII byte")
  // would pass vacuously on those alone — the cycle-8 A2 bag-of-words failure class,
  // and the false-PASS direction, which is the one a baseline has to go looking for.
  // Tests B1's ACTUAL predicate against a synthetic carrying every decoy and no name.
  const decoys = ['—', 'ℹ', '…'];
  const present = decoys.filter(d => readme().includes(d));
  const synth = `A line — with ℹ and an ellipsis … but no author named.`;
  return { ok: b1Predicate(synth) === false, note: `decoys live in README=${present.length}/3; B1 on a decoys-only document = ${b1Predicate(synth)} (must be false)` };
});

cell('C4b', 'MUST-STAY-GREEN: B1 DOES fire on a document that names the author', () => {
  const synth = `Match it as \`--author ${SURNAME}\` with the accent.`;
  return { ok: b1Predicate(synth) === true, note: `B1 on a naming document = ${b1Predicate(synth)} — C4 is a guard, not a dead cell` };
});

cell('C5', 'MUST-DIE: B3 on a synthetic README offering ONLY the ASCII spelling must FAIL', () => {
  const synth = 'Try `node bin/aphorism.js --author ' + SURNAME_ASCII + '`.';
  const vals = authorValuesIn(synth);
  const relevant = vals.filter(v => v && AUTHOR_LC.includes(v.toLowerCase()));
  const working = relevant.filter(v => run(['--author', v, '--list']).code === 0);
  return { ok: working.length === 0, note: `synthetic vals=[${vals.join('|')}] relevant=[${relevant.join('|')}] -> B3 correctly dies` };
});

cell('C6', 'MUST-NOT-OVERREACH: B4 cannot be satisfied by a negation in a NEIGHBOURING unit', () => {
  // The exact instrument-defect class this repo filed as #17/#18 (a slice absorbing its
  // neighbour). Feed the unit splitter a document where the ASCII token and the negation
  // sit in ADJACENT units and require the prose arm to stay dead.
  const synth = `Type the name as ${SURNAME_ASCII} here.\n\nA filter that matches nothing exits 1 and does not match.\n`;
  const us = units(synth).filter(u => u.includes(SURNAME_ASCII));
  const prose = us.some(u => NEG.test(u));
  return { ok: prose === false, note: `units-with-ascii=${us.length}; neighbour negation correctly NOT absorbed` };
});

cell('C7', 'MUST-STAY-GREEN: B4 prose arm DOES fire when the negation is in the SAME unit', () => {
  const synth = `Typing ${SURNAME_ASCII} does not match; the diacritic is required.\n`;
  const us = units(synth).filter(u => u.includes(SURNAME_ASCII));
  const prose = us.some(u => NEG.test(u));
  return { ok: prose === true, note: `same-unit negation fires (units=${us.length}) — C6 is a guard, not a dead cell` };
});

// =========================== G — STANDING GUARDS ============================

cell('G1', 'SUITE: node --test test/*.test.js is green at >= 118 tests (M-5)', () => {
  const r = spawnSync('bash', ['-lc', `cd ${T} && node --test test/*.test.js 2>&1`], { encoding: 'utf8' });
  const out = r.stdout ?? '';
  // Node 24 emits the SPEC reporter ("ℹ tests 118"); 18/20/22 emit TAP ("# tests 118").
  // run #4 cycle 1 filed instrument defect #14 for a parser that read only one of them.
  const g = k => { const m = out.match(new RegExp(`^[\\u2139#]\\s*${k}\\s+(\\d+)`, 'm')); return m ? Number(m[1]) : null; };
  const tests = g('tests'), pass = g('pass'), fail = g('fail');
  return { ok: tests !== null && tests >= 118 && fail === 0 && pass === tests, note: `tests=${tests} pass=${pass} fail=${fail}` };
});

cell('G2', 'DEFAULT RUN still works: exit 0, non-empty stdout', () => {
  const r = run([]);
  return { ok: r.code === 0 && r.out.trim().length > 0, note: `exit=${r.code} bytes=${r.out.length}` };
});

// =========================== REPORT =========================================

const BCELLS = new Set(['B1', 'B2', 'B3', 'B4']);
let pass = 0, fail = 0;
for (const r of results) {
  const verdict = r.ok ? 'PASS' : 'FAIL';
  r.ok ? pass++ : fail++;
  console.log(`${verdict.padEnd(5)} ${r.id.padEnd(4)} ${r.label}`);
  if (r.note) console.log(`           ${r.note}`);
}
console.log(`\n=== ${pass} PASS / ${fail} FAIL of ${results.length} cells ===`);

if (BASELINE) {
  const reds = results.filter(r => BCELLS.has(r.id) && !r.ok).map(r => r.id);
  const greens = results.filter(r => !BCELLS.has(r.id) && r.ok).map(r => r.id);
  const wrongGreen = results.filter(r => BCELLS.has(r.id) && r.ok).map(r => r.id);
  const wrongRed = results.filter(r => !BCELLS.has(r.id) && !r.ok).map(r => r.id);
  console.log(`\nDISCRIMINATING BASELINE (the work does not exist yet):`);
  console.log(`  B-cells that MUST be RED and are:  [${reds.join(',')}]  (expect B1,B2,B3,B4)`);
  console.log(`  B-cells wrongly GREEN (vacuous):   [${wrongGreen.join(',')}]  (expect none)`);
  console.log(`  non-B cells GREEN as expected:     [${greens.join(',')}]`);
  console.log(`  non-B cells wrongly RED:           [${wrongRed.join(',')}]  (expect none)`);
  const ok = wrongGreen.length === 0 && wrongRed.length === 0 && reds.length === 4;
  console.log(`  BASELINE ${ok ? 'SOUND' : 'UNSOUND — fix the gate before sealing'}`);
  process.exit(ok ? 0 : 1);
}
process.exit(fail === 0 ? 0 : 1);
