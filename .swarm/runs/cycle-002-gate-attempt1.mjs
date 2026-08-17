#!/usr/bin/env node
// cycle 2 VERIFICATION GATE — J-2 Attribution half.
//
// Authored AFTER the builder returned (KI-8 remedy option 2). None of these
// cells existed on disk during the dispatch window, and the builder's own
// failability probes were C1/C2/C7 single-value mutations — the F5-F8 and
// L/D cells below are new and were chosen specifically to attack the
// decisions the builder made on its own initiative.
//
// TWO ARMS, and they deliberately do NOT share a README. HEAD keeps its counts
// in prose; the working tree keeps them in a table. A cell is therefore an
// EDIT INTENT ("a maintainer states the HIGH count subject-first, truthfully"),
// realised on whichever shape that arm actually ships. Comparing a single
// literal string across two different document designs would measure the
// designs' spelling, not their guards.
//
// Method: full throwaway copy of the tree, mutate, run the project's own
// test_cmd. That is this repo's standing instrument since cycle 50.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SRC = '/opt/targets/aphorism-cli';
const READMETESTS = ['--test', 'test/readme-tags.test.js'];
const FULL = ['--test', 'test/args.test.js', 'test/cli.test.js',
              'test/readme-tags.test.js', 'test/select.test.js'];

function copy(arm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c2gate-'));
  execFileSync('cp', ['-a', SRC + '/.', dir]);
  fs.rmSync(path.join(dir, '.swarm'), { recursive: true, force: true });
  if (arm === 'HEAD') {
    for (const f of ['README.md', 'test/readme-tags.test.js']) {
      const blob = execFileSync('git', ['-C', SRC, 'show', 'HEAD:' + f], { encoding: 'utf8' });
      fs.writeFileSync(path.join(dir, f), blob);
    }
  }
  return dir;
}

function run(dir, cmd) {
  try {
    return { out: execFileSync('node', cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) { return { out: (e.stdout || '') + (e.stderr || '') }; }
}

function tally(out) {
  const g = (k) => { const m = out.match(new RegExp('^(?:ℹ |# )' + k + ' (\\d+)', 'm')); return m ? +m[1] : null; };
  return { tests: g('tests'), pass: g('pass'), fail: g('fail') };
}

// Return the [start, end) slice of the Attribution section in a README string.
function attrBounds(readme) {
  const s = readme.indexOf('## Attribution');
  if (s === -1) throw new Error('no Attribution section');
  const n = readme.indexOf('\n## ', s + 1);
  return [s, n === -1 ? readme.length : n + 1];
}
function replaceAttr(readme, newSection) {
  const [s, e] = attrBounds(readme);
  return readme.slice(0, s) + newSection.replace(/\n*$/, '\n\n') + readme.slice(e);
}
function attrOf(readme) {
  const [s, e] = attrBounds(readme);
  return readme.slice(s, e).replace(/\n+$/, '');
}
// Append a sentence to the last prose paragraph of the section (before any table).
function appendSentence(section, sentence) {
  const lines = section.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].trim().startsWith('|') && !lines[i].startsWith('## ')) last = i;
  }
  lines[last] = lines[last] + ' ' + sentence;
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// The cells. Each: { id, want, note, edit(arm, readme) -> readme|null }
//   want = 'GREEN' (this README is TRUE and conforming: accepting it is right)
//          'RED'   (this README is WRONG or unparseable: rejecting it is right)
//   edit returning null = not applicable to that arm.
// ---------------------------------------------------------------------------
const CELLS = [
  { id: 'T0 pristine (control)', want: 'GREEN',
    note: 'the shipped tree, untouched',
    edit: (arm, r) => r },

  { id: 'T1 verb reworded, all claims true', want: 'GREEN',
    note: 'ranks -> catalogues; no number touched',
    edit: (arm, r) => replaceAttr(r, attrOf(r).replace('ranks', 'catalogues')) },

  { id: 'T2 true no-digit sentence added', want: 'GREEN',
    note: 'a maintainer adds a caveat carrying no count',
    edit: (arm, r) => replaceAttr(r, appendSentence(attrOf(r), 'This is a triage, not an audit.')) },

  { id: 'T3 counts stated in prose, subject-first, TRUE', want: 'GREEN',
    note: 'the cycle-31 D1 shape: "8 of the 50 entries are rated HIGH" — every number correct',
    edit: (arm, r) => replaceAttr(r, appendSentence(attrOf(r), '8 of the 50 entries are rated HIGH.')) },

  { id: 'T4 true comparative on HIGH', want: 'GREEN',
    note: 'cycle-40 A3: "Fewer than 9 are rated HIGH." is true by arithmetic (8 < 9)',
    edit: (arm, r) => replaceAttr(r, appendSentence(attrOf(r), 'Fewer than 9 are rated HIGH.')) },

  { id: 'T5 true comparative on entries', want: 'GREEN',
    note: 'cycle-40 A4: "Fewer than 51 entries are listed." is true by arithmetic (50 < 51)',
    edit: (arm, r) => replaceAttr(r, appendSentence(attrOf(r), 'Fewer than 51 entries are listed.')) },

  { id: 'T6 counts absent from prose entirely', want: 'GREEN',
    note: 'the shape the new design requires: pointer prose, counts elsewhere. On HEAD there is nowhere else, so HEAD must fail LOUD — that failure is CORRECT for HEAD and is scored as such below.',
    edit: (arm, r) => arm === 'HEAD'
      ? replaceAttr(r, attrOf(r).replace(/ranks all 50\nentries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what\nwould settle each one\./,
          'ranks every entry by how likely the attribution is to be wrong and says what\nwould settle each one.'))
      : r },

  { id: 'T7 TRUE digit inside a fenced block', want: 'GREEN',
    note: 'a maintainer pastes a true snippet into the section',
    edit: (arm, r) => replaceAttr(r, attrOf(r) + '\n\n```sh\ngrep -c "| HIGH |" docs/corpus-attribution-triage.md   # 8\n```') },

  // ---- FALSE READMEs: rejecting them is right ----
  { id: 'F1 HIGH count wrong (8 -> 9)', want: 'RED',
    note: 'the count claim is false wherever that arm keeps it',
    edit: (arm, r) => replaceAttr(r, arm === 'HEAD'
      ? attrOf(r).replace('8 are rated HIGH', '9 are rated HIGH')
      : attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 9 |')) },

  { id: 'F2 entries count wrong (50 -> 51)', want: 'RED',
    note: 'the count claim is false wherever that arm keeps it',
    edit: (arm, r) => replaceAttr(r, arm === 'HEAD'
      ? attrOf(r).replace('ranks all 50', 'ranks all 51')
      : attrOf(r).replace('| Entries ranked | 50 |', '| Entries ranked | 51 |')) },

  { id: 'F3 FALSE claim, digit across an em dash (KI-10)', want: 'RED',
    note: 'the measured silent hole: "records 9 — HIGH entries — in total" is false and bound nothing at HEAD',
    edit: (arm, r) => replaceAttr(r, appendSentence(attrOf(r), 'A later audit note records 9 — HIGH entries — in total.')) },

  { id: 'F4 FALSE count in prose, table correct', want: 'RED',
    note: 'the exact regression C7 exists to prevent: prose says 51 entries, the table still says 50',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, appendSentence(attrOf(r), 'The triage doc ranks all 51 entries.')) },

  { id: 'F5 FALSE count inside a fenced block', want: 'RED',
    note: 'attacks the builder\'s own decision to strip fenced blocks before the C7 scan',
    edit: (arm, r) => replaceAttr(r, attrOf(r) + '\n\n```\n9 entries are rated HIGH.\n```') },

  { id: 'F6 duplicate table row, WRONG first', want: 'RED',
    note: 'a self-contradicting table; Map.set means later wins, so this order hides the wrong row',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 9 |\n| Rated HIGH risk | 8 |')) },

  { id: 'F7 duplicate table row, WRONG second', want: 'RED',
    note: 'the same contradiction in the other order',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 8 |\n| Rated HIGH risk | 9 |')) },

  { id: 'F8 extra table row, FALSE, differently labelled', want: 'RED',
    note: 'a wrong count parked in the table under a label C1/C2 do not read, and C7 does not scan',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 8 |\n| HIGH rows in the doc | 9 |')) },

  // ---- LOUDNESS: an unparseable claim must never read as a pass ----
  { id: 'L1 counts table deleted outright', want: 'RED',
    note: 'must fail loud, never pass by checking nothing',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).split('\n').filter((l) => !l.trim().startsWith('|')).join('\n')) },

  { id: 'L2 "Entries ranked" row relabelled', want: 'RED',
    note: 'the row C1 needs is gone; must name what it did find',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).replace('| Entries ranked |', '| Entries catalogued |')) },

  { id: 'L3 count cell is not an integer', want: 'RED',
    note: 'must name the row and the bad value',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).replace('| Entries ranked | 50 |', '| Entries ranked | fifty |')) },

  { id: 'L4 separator row removed', want: 'RED',
    note: 'the two-anchor locator must refuse a table it cannot confirm',
    edit: (arm, r) => arm === 'HEAD' ? null
      : replaceAttr(r, attrOf(r).split('\n').filter((l) => !/^\|[-\s|]+\|$/.test(l.trim())).join('\n')) },
];

// ---------------------------------------------------------------------------
// Derivation proofs: mutate the SOURCE OF TRUTH, not the README. If the guard
// derives its truth at test time it must fire; if a digit is hardcoded
// anywhere it will not.
// ---------------------------------------------------------------------------
const DERIVE = [
  { id: 'D1 triage doc: one MEDIUM row flipped to HIGH (truth 8 -> 9)', want: 'RED',
    apply: (dir) => {
      const p = path.join(dir, 'docs', 'corpus-attribution-triage.md');
      const t = fs.readFileSync(p, 'utf8');
      const i = t.indexOf('| MEDIUM |');
      if (i === -1) throw new Error('no MEDIUM row to flip');
      fs.writeFileSync(p, t.slice(0, i) + '| HIGH |' + t.slice(i + '| MEDIUM |'.length));
    } },
  { id: 'D2 corpus.js: one entry removed (truth 50 -> 49)', want: 'RED',
    apply: (dir) => {
      const p = path.join(dir, 'src', 'corpus.js');
      const t = fs.readFileSync(p, 'utf8');
      // drop the last object literal in the corpus array
      const last = t.lastIndexOf('  {');
      const close = t.indexOf('},', last);
      if (last === -1 || close === -1) throw new Error('could not locate a corpus entry to remove');
      fs.writeFileSync(p, t.slice(0, last) + t.slice(close + 3));
    } },
];

// ---------------------------------------------------------------------------
function verdict(dir) {
  const r = run(dir, READMETESTS);
  const t = tally(r.out);
  if (t.fail === null) throw new Error('reporter unparsed — refusing a verdict:\n' + r.out.slice(-1200));
  const names = [...r.out.matchAll(/^✖ (.+?)(?: \([\d.]+ms\))?$/gm)].map((m) => m[1].trim())
    .filter((n) => n !== 'failing tests:');
  const msgs = [...r.out.matchAll(/(?:AssertionError \[ERR_ASSERTION\]: |message: ')([^\n']{20,300})/g)].map((m) => m[1]);
  return { v: t.fail === 0 ? 'GREEN' : 'RED', t, names: [...new Set(names)], msgs: [...new Set(msgs)] };
}

console.log('=== cycle 2 GATE — J-2 Attribution half ===');
console.log('HEAD arm     : ' + execFileSync('git', ['-C', SRC, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim());
console.log('FIX arm      : working tree');
console.log('');

// floor first
for (const arm of ['HEAD', 'FIX']) {
  const d = copy(arm);
  const t = tally(run(d, FULL).out);
  console.log('FULL SUITE, %-4s arm : tests=%s pass=%s fail=%s', arm, t.tests, t.pass, t.fail);
  fs.rmSync(d, { recursive: true, force: true });
}
console.log('');

const score = { HEAD: { ok: 0, n: 0 }, FIX: { ok: 0, n: 0 } };
const detail = [];
for (const cell of CELLS) {
  const row = { id: cell.id, want: cell.want, note: cell.note, arms: {} };
  for (const arm of ['HEAD', 'FIX']) {
    const d = copy(arm);
    const rp = path.join(d, 'README.md');
    let edited;
    try { edited = cell.edit(arm, fs.readFileSync(rp, 'utf8')); }
    catch (e) { row.arms[arm] = { v: 'EDIT-ERR', err: e.message }; fs.rmSync(d, { recursive: true, force: true }); continue; }
    if (edited === null) { row.arms[arm] = { v: 'n/a' }; fs.rmSync(d, { recursive: true, force: true }); continue; }
    fs.writeFileSync(rp, edited);
    const res = verdict(d);
    const correct = res.v === cell.want;
    row.arms[arm] = { ...res, correct };
    score[arm].n++; if (correct) score[arm].ok++;
    fs.rmSync(d, { recursive: true, force: true });
  }
  detail.push(row);
}

const W = 44;
console.log('CELL LEDGER — "correct" means the verdict matches whether the README is actually TRUE');
console.log('%s  want   HEAD            FIX', 'cell'.padEnd(W));
for (const r of detail) {
  const f = (a) => {
    const x = r.arms[a];
    if (!x || x.v === 'n/a') return 'n/a          ';
    if (x.v === 'EDIT-ERR') return 'EDIT-ERR     ';
    return (x.v + (x.correct ? ' ok' : ' WRONG')).padEnd(13);
  };
  console.log('%s  %-5s  %s  %s', r.id.padEnd(W), r.want, f('HEAD'), f('FIX'));
}
console.log('');
console.log('SCORE (verdict matches the README\'s actual truth): HEAD %d/%d   FIX %d/%d',
            score.HEAD.ok, score.HEAD.n, score.FIX.ok, score.FIX.n);
console.log('');

console.log('=== derivation proofs (mutate the SOURCE OF TRUTH; a hardcoded digit cannot fire) ===');
for (const dv of DERIVE) {
  for (const arm of ['HEAD', 'FIX']) {
    const d = copy(arm);
    try { dv.apply(d); } catch (e) { console.log('%-52s %-4s EDIT-ERR %s', dv.id, arm, e.message); fs.rmSync(d, { recursive: true, force: true }); continue; }
    const res = verdict(d);
    console.log('%-52s %-4s %s %s  %s', dv.id, arm, res.v, res.v === dv.want ? 'ok   ' : 'WRONG', (res.names[0] || '').slice(0, 70));
    fs.rmSync(d, { recursive: true, force: true });
  }
}
console.log('');

console.log('=== assertion messages actually produced on the FIX arm (a guard must NAME the problem) ===');
for (const r of detail) {
  const x = r.arms.FIX;
  if (x && x.v === 'RED' && x.msgs && x.msgs.length) {
    console.log('--- ' + r.id);
    for (const m of x.msgs.slice(0, 2)) console.log('    ' + m.replace(/\s+/g, ' ').slice(0, 230));
  }
}
