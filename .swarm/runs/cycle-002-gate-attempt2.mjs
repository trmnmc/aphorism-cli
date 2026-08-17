#!/usr/bin/env node
// cycle 2 RE-GATE — J-2 Attribution half, attempt 2.
//
// Block 1 re-runs the 20 cells from the attempt-1 gate, unchanged.
// Block 2 is NEW: authored after attempt 2 returned, attacking the code it
// actually wrote (per-label value arrays, the recognised-label list, the
// header-count check) and testing the two boundaries it disclosed. The
// builder never saw any of block 2.
//
// Method: full throwaway copy, mutate, run the project's own test_cmd.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SRC = '/opt/targets/aphorism-cli';
const READMETESTS = ['--test', 'test/readme-tags.test.js'];
const FULL = ['--test', 'test/args.test.js', 'test/cli.test.js',
              'test/readme-tags.test.js', 'test/select.test.js'];

function copy(arm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c2g2-'));
  execFileSync('cp', ['-a', SRC + '/.', dir]);
  fs.rmSync(path.join(dir, '.swarm'), { recursive: true, force: true });
  if (arm === 'HEAD') {
    for (const f of ['README.md', 'test/readme-tags.test.js']) {
      fs.writeFileSync(path.join(dir, f),
        execFileSync('git', ['-C', SRC, 'show', 'HEAD:' + f], { encoding: 'utf8' }));
    }
  }
  return dir;
}
function run(dir, cmd) {
  try { return execFileSync('node', cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
function tally(out) {
  const g = (k) => { const m = out.match(new RegExp('^(?:ℹ |# )' + k + ' (\\d+)', 'm')); return m ? +m[1] : null; };
  return { tests: g('tests'), pass: g('pass'), fail: g('fail') };
}
function attrBounds(readme) {
  const s = readme.indexOf('## Attribution');
  if (s === -1) throw new Error('no Attribution section');
  const n = readme.indexOf('\n## ', s + 1);
  return [s, n === -1 ? readme.length : n + 1];
}
function attrOf(r) { const [s, e] = attrBounds(r); return r.slice(s, e).replace(/\n+$/, ''); }
function replaceAttr(r, sec) { const [s, e] = attrBounds(r); return r.slice(0, s) + sec.replace(/\n*$/, '\n\n') + r.slice(e); }
function appendSentence(section, sentence) {
  const lines = section.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].trim().startsWith('|') && !lines[i].startsWith('## ')) last = i;
  }
  lines[last] += ' ' + sentence;
  return lines.join('\n');
}
// convenience: edit only the Attribution section via a string transform
const S = (fn) => (arm, r) => replaceAttr(r, fn(attrOf(r), arm));

const FENCE = '```';

const BLOCK1 = [
  { id: 'T0 pristine (control)', want: 'GREEN', edit: (a, r) => r },
  { id: 'T1 verb reworded, all claims true', want: 'GREEN', edit: S((s) => s.replace('ranks', 'catalogues')) },
  { id: 'T2 true no-digit sentence added', want: 'GREEN', edit: S((s) => appendSentence(s, 'This is a triage, not an audit.')) },
  { id: 'T3 counts in prose, subject-first, TRUE', want: 'GREEN', edit: S((s) => appendSentence(s, '8 of the 50 entries are rated HIGH.')) },
  { id: 'T4 true comparative on HIGH', want: 'GREEN', edit: S((s) => appendSentence(s, 'Fewer than 9 are rated HIGH.')) },
  { id: 'T5 true comparative on entries', want: 'GREEN', edit: S((s) => appendSentence(s, 'Fewer than 51 entries are listed.')) },
  { id: 'T6 counts absent from prose entirely', want: 'GREEN',
    edit: (arm, r) => arm === 'HEAD'
      ? replaceAttr(r, attrOf(r).replace(/ranks all 50\nentries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what\nwould settle each one\./,
          'ranks every entry by how likely the attribution is to be wrong and says what\nwould settle each one.'))
      : r },
  { id: 'T7 TRUE digit inside a fenced block', want: 'GREEN',
    edit: S((s) => s + '\n\n' + FENCE + 'sh\ngrep -c "| HIGH |" docs/corpus-attribution-triage.md   # 8\n' + FENCE) },
  { id: 'F1 HIGH count wrong (8 -> 9)', want: 'RED',
    edit: S((s, a) => a === 'HEAD' ? s.replace('8 are rated HIGH', '9 are rated HIGH')
                                   : s.replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 9 |')) },
  { id: 'F2 entries count wrong (50 -> 51)', want: 'RED',
    edit: S((s, a) => a === 'HEAD' ? s.replace('ranks all 50', 'ranks all 51')
                                   : s.replace('| Entries ranked | 50 |', '| Entries ranked | 51 |')) },
  { id: 'F3 FALSE claim across an em dash (KI-10)', want: 'RED',
    edit: S((s) => appendSentence(s, 'A later audit note records 9 — HIGH entries — in total.')) },
  { id: 'F4 FALSE count in prose, table correct', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, appendSentence(attrOf(r), 'The triage doc ranks all 51 entries.')) },
  { id: 'F5 FALSE count inside a fenced block', want: 'RED',
    edit: S((s) => s + '\n\n' + FENCE + '\n9 entries are rated HIGH.\n' + FENCE) },
  { id: 'F6 duplicate table row, WRONG first', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 9 |\n| Rated HIGH risk | 8 |')) },
  { id: 'F7 duplicate table row, WRONG second', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 8 |\n| Rated HIGH risk | 9 |')) },
  { id: 'F8 extra table row, FALSE, unread label', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 8 |\n| HIGH rows in the doc | 9 |')) },
  { id: 'L1 counts table deleted outright', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).split('\n').filter((l) => !l.trim().startsWith('|')).join('\n')) },
  { id: 'L2 "Entries ranked" row relabelled', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).replace('| Entries ranked |', '| Entries catalogued |')) },
  { id: 'L3 count cell is not an integer', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).replace('| Entries ranked | 50 |', '| Entries ranked | fifty |')) },
  { id: 'L4 separator row removed', want: 'RED',
    edit: (arm, r) => arm === 'HEAD' ? null : replaceAttr(r, attrOf(r).split('\n').filter((l) => !/^\|[-\s|]+\|$/.test(l.trim())).join('\n')) },
];

// ---------------------------------------------------------------------------
// BLOCK 2 — authored after attempt 2 returned. FIX arm only.
// ---------------------------------------------------------------------------
const BLOCK2 = [
  { id: 'N1  three copies of one label, all wrong', want: 'RED',
    note: 'per-label value arrays must not collapse three rows the way a Map collapsed two',
    edit: S((s) => s.replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 9 |\n| Rated HIGH risk | 7 |\n| Rated HIGH risk | 6 |')) },
  { id: 'N2  duplicate label, SAME value both times', want: 'RED',
    note: 'a table stating one figure twice is malformed even when both copies are right',
    edit: S((s) => s.replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 8 |\n| Rated HIGH risk | 8 |')) },
  { id: 'N3  label case changed to lower case', want: 'RED',
    note: 'the recognised-label list must not be matched case-insensitively by accident',
    edit: S((s) => s.replace('| Entries ranked |', '| entries ranked |')) },
  { id: 'N4  label padded with extra spaces, TRUE', want: 'GREEN',
    note: 'markdown alignment padding is not a claim; a trimmed label must still be recognised',
    edit: S((s) => s.replace('| Entries ranked | 50 |', '|  Entries ranked   |   50  |')) },
  { id: 'N5  FALSE count in the section HEADING', want: 'RED',
    note: 'is the heading line itself inside C7 scope?',
    edit: S((s) => s.replace('## Attribution', '## Attribution of 9 HIGH-risk entries')) },
  { id: 'N6  FALSE count as an English number WORD', want: 'RED',
    note: 'DISCLOSED BOUNDARY — builder says this passes. Verifying the disclosure is true.',
    edit: S((s) => appendSentence(s, 'Nine of those entries are rated HIGH.')) },
  { id: 'N7  FALSE count in FULLWIDTH digits (U+FF19)', want: 'RED',
    note: 'DISCLOSED BOUNDARY — builder says JS \\d is ASCII-only so this passes.',
    edit: S((s) => appendSentence(s, '９ entries are rated HIGH.')) },
  { id: 'N8  a SECOND counts table, FALSE row', want: 'RED',
    note: 'the hole attempt 2 found on its own initiative and says it fixed',
    edit: S((s) => s + '\n\n| Attribution triage | Count |\n|---|---|\n| Rated HIGH risk | 9 |') },
  { id: 'N9  FALSE count inside a TILDE fence', want: 'RED',
    note: 'fences are now scanned — but only the backtick kind?',
    edit: S((s) => s + '\n\n~~~\n9 entries are rated HIGH.\n~~~') },
  { id: 'N10 FALSE count inside an HTML comment', want: 'RED',
    note: 'invisible text still ships in the file',
    edit: S((s) => s + '\n\n<!-- note: 9 entries are rated HIGH -->') },
  { id: 'N11 FALSE count in markdown LINK TEXT', want: 'RED',
    note: 'the link-target exclusion must not swallow the visible link text',
    edit: S((s) => appendSentence(s, 'See [9 HIGH entries](docs/corpus-attribution-triage.md).')) },
  { id: 'N12 digit in the LINK TARGET only, TRUE', want: 'GREEN',
    note: 'a filename is not a claim; the deliberate exclusion must still hold',
    edit: S((s) => s.replace('(docs/corpus-attribution-triage.md)', '(docs/corpus-attribution-triage-v2.md)')) },
  { id: 'N13 FALSE count in an indented code block', want: 'RED',
    note: 'four-space indentation is a code block in markdown but not a fence',
    edit: S((s) => s + '\n\n    9 entries are rated HIGH.') },
  { id: 'N14 both rows deleted, table header kept', want: 'RED',
    note: 'a header with no data rows must be a loud parse failure, never an empty pass',
    edit: S((s) => s.split('\n').filter((l) => !/^\| (Entries ranked|Rated HIGH risk) \|/.test(l.trim())).join('\n')) },
  { id: 'N15 recognised label, value 0', want: 'RED',
    note: '0 is a plain integer and must be compared, not treated as falsy-and-skipped',
    edit: S((s) => s.replace('| Rated HIGH risk | 8 |', '| Rated HIGH risk | 0 |')) },
];

function verdict(dir) {
  const out = run(dir, READMETESTS);
  const t = tally(out);
  if (t.fail === null) throw new Error('reporter unparsed:\n' + out.slice(-1200));
  const names = [...new Set([...out.matchAll(/^✖ (.+?)(?: \([\d.]+ms\))?$/gm)]
    .map((m) => m[1].trim()).filter((n) => n !== 'failing tests:'))];
  const msgs = [...new Set([...out.matchAll(/(?:AssertionError \[ERR_ASSERTION\]: |message: ')([^\n']{20,400})/g)].map((m) => m[1]))];
  return { v: t.fail === 0 ? 'GREEN' : 'RED', t, names, msgs };
}

const L = (s, n) => String(s).padEnd(n);
console.log('=== cycle 2 RE-GATE — J-2 Attribution half, attempt 2 ===');
console.log('HEAD arm : ' + execFileSync('git', ['-C', SRC, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() + '   FIX arm : working tree');
console.log('');
for (const arm of ['HEAD', 'FIX']) {
  const d = copy(arm); const t = tally(run(d, FULL));
  console.log('FULL SUITE ' + L(arm, 5) + ' tests=' + t.tests + ' pass=' + t.pass + ' fail=' + t.fail);
  fs.rmSync(d, { recursive: true, force: true });
}

function runBlock(cells, arms, title) {
  console.log('\n' + title);
  console.log(L('cell', 42) + L('want', 6) + arms.map((a) => L(a, 14)).join(''));
  const score = {}; for (const a of arms) score[a] = { ok: 0, n: 0 };
  const rows = [];
  for (const cell of cells) {
    const row = { id: cell.id, want: cell.want, note: cell.note, arms: {} };
    for (const arm of arms) {
      const d = copy(arm);
      let edited;
      try { edited = cell.edit(arm, fs.readFileSync(path.join(d, 'README.md'), 'utf8')); }
      catch (e) { row.arms[arm] = { v: 'EDIT-ERR', err: e.message }; fs.rmSync(d, { recursive: true, force: true }); continue; }
      if (edited === null) { row.arms[arm] = { v: 'n/a' }; fs.rmSync(d, { recursive: true, force: true }); continue; }
      fs.writeFileSync(path.join(d, 'README.md'), edited);
      const res = verdict(d);
      res.correct = res.v === cell.want;
      row.arms[arm] = res;
      score[arm].n++; if (res.correct) score[arm].ok++;
      fs.rmSync(d, { recursive: true, force: true });
    }
    const f = (a) => {
      const x = row.arms[a];
      if (!x || x.v === 'n/a') return L('n/a', 14);
      if (x.v === 'EDIT-ERR') return L('EDIT-ERR', 14);
      return L(x.v + (x.correct ? ' ok' : ' WRONG'), 14);
    };
    console.log(L(row.id, 42) + L(row.want, 6) + arms.map(f).join(''));
    rows.push(row);
  }
  console.log('');
  for (const a of arms) console.log('SCORE ' + L(a, 5) + score[a].ok + '/' + score[a].n + '  (verdict matches whether the README is actually TRUE)');
  return { rows, score };
}

const b1 = runBlock(BLOCK1, ['HEAD', 'FIX'], 'BLOCK 1 — the attempt-1 gate cells, re-run unchanged');
const b2 = runBlock(BLOCK2, ['FIX'], 'BLOCK 2 — NEW cells, authored after attempt 2 returned (FIX arm only)');

// like-for-like subset of block 1
const both = b1.rows.filter((r) => r.arms.HEAD && r.arms.HEAD.v !== 'n/a' && r.arms.FIX && r.arms.FIX.v !== 'n/a');
const lfl = (a) => both.filter((r) => r.arms[a].correct).length;
console.log('\nLIKE-FOR-LIKE (only the ' + both.length + ' block-1 cells expressible on BOTH arms):  HEAD ' +
            lfl('HEAD') + '/' + both.length + '   FIX ' + lfl('FIX') + '/' + both.length);

// the direction that matters: a FALSE readme accepted green = a silent hole
const holes = (a, rows) => rows.filter((r) => r.want === 'RED' && r.arms[a] && r.arms[a].v === 'GREEN').map((r) => r.id);
console.log('\nSILENT HOLES (a FALSE README accepted GREEN — the direction this run exists to remove):');
console.log('  HEAD, block 1      : ' + (holes('HEAD', b1.rows).join(' | ') || 'none'));
console.log('  FIX,  block 1      : ' + (holes('FIX', b1.rows).join(' | ') || 'none'));
console.log('  FIX,  block 2      : ' + (holes('FIX', b2.rows).join(' | ') || 'none'));
console.log('\nFALSE REJECTIONS (a TRUE README rejected RED — loud, and each must have a named remedy):');
const fr = (a, rows) => rows.filter((r) => r.want === 'GREEN' && r.arms[a] && r.arms[a].v === 'RED').map((r) => r.id);
console.log('  HEAD, block 1      : ' + (fr('HEAD', b1.rows).join(' | ') || 'none'));
console.log('  FIX,  block 1      : ' + (fr('FIX', b1.rows).join(' | ') || 'none'));
console.log('  FIX,  block 2      : ' + (fr('FIX', b2.rows).join(' | ') || 'none'));

console.log('\n=== assertion messages on the FIX arm (a guard must NAME the problem and the remedy) ===');
for (const r of [...b1.rows, ...b2.rows]) {
  const x = r.arms.FIX;
  if (x && x.v === 'RED' && x.msgs && x.msgs.length) {
    console.log('--- ' + r.id + '   [' + (x.names.join('; ') || '?') + ']');
    console.log('    ' + x.msgs[0].replace(/\s+/g, ' ').slice(0, 260));
  }
}
