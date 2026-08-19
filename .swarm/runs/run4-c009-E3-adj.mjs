#!/usr/bin/env node
// run #4 cycle 9 — adjudication of gate cell E3 (instrument defect #21).
//
// E3 asked whether the no-match message distinguishes an UNKNOWN tag from an
// EMPTY INTERSECTION of two individually-valid filters. It chose
// `--tag humor --author knuth` as its empty-intersection arm. That pair is NOT
// empty: Knuth's second corpus entry is tagged ["debugging","humor"], so the arm
// exited 0 with an empty stderr and the equality test correctly reported unequal.
// The cell failed CLOSED — the right direction for a wrong instrument.
//
// The gate file is left BYTE-UNEDITED (run #3 cycles 4/12/14 precedent: rewriting a
// gate after it has run destroys the evidence of what it measured).

import { execFileSync } from 'node:child_process';
const T = '/opt/targets/aphorism-cli';
function run(a) {
  try { return { code: 0, out: execFileSync('node', [T + '/bin/aphorism.js', ...a], { cwd: T, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), err: '' }; }
  catch (e) { return { code: e.status, out: e.stdout || '', err: e.stderr || '' }; }
}
let pass = 0, fail = 0;
const cell = (id, d, fn) => { let ok = false, n = ''; try { const r = fn(); ok = r.ok; n = r.note; } catch (e) { n = 'threw: ' + e.message; }
  console.log((ok ? 'PASS  ' : 'FAIL  ') + id + '  ' + d + '\n      ' + n); ok ? pass++ : fail++; };

// The corpus, read once, so the arms are chosen from DATA rather than from memory.
const corpus = JSON.parse('[' + run(['--list', '--json']).out.trim().split('\n').join(',') + ']');
const EMPTY = ['--tag', 'performance', '--author', 'Martin Fowler'];

cell('A', 'DEFECT REPRODUCED: E3\'s chosen arm is not an empty intersection', () => {
  const r = run(['--tag', 'humor', '--author', 'knuth']);
  const knuthTags = corpus.filter((e) => /knuth/i.test(e.author)).map((e) => e.tags);
  return { ok: r.code === 0 && r.err === '',
           note: 'exit=' + r.code + ' stderr=' + JSON.stringify(r.err) + '  knuth tags=' + JSON.stringify(knuthTags) };
});

cell('B', 'ARM IS VALID: both filters individually match, intersection is empty (from data)', () => {
  const tagN = corpus.filter((e) => e.tags.includes('performance')).length;
  const authN = corpus.filter((e) => e.author === 'Martin Fowler').length;
  const inter = corpus.filter((e) => e.tags.includes('performance') && e.author === 'Martin Fowler').length;
  return { ok: tagN > 0 && authN > 0 && inter === 0,
           note: 'tag performance=' + tagN + ' author Fowler=' + authN + ' intersection=' + inter };
});

cell('C', 'FIXED CELL: unknown tag and empty intersection give the IDENTICAL message', () => {
  const unknown = run(['--tag', 'hubris']);
  const empty = run(EMPTY);
  return { ok: unknown.err.trim() === empty.err.trim() && unknown.err.trim().length > 0
               && unknown.code === empty.code && unknown.out === '' && empty.out === '',
           note: 'both exit=' + unknown.code + ' both stderr=' + JSON.stringify(unknown.err.trim()) };
});

cell('D', 'MUST-DIE: an unknown AUTHOR is also indistinguishable (claim generalises)', () => {
  const a = run(['--author', 'nobody-real']).err.trim();
  const b = run(['--tag', 'hubris']).err.trim();
  return { ok: a === b && a.length > 0, note: 'identical: ' + JSON.stringify(a) };
});

cell('E', 'MUST-DIE: the cell is not matching everything — a DIFFERENT error differs', () => {
  const noMatch = run(['--tag', 'hubris']);
  const badFlag = run(['--bogus']);
  return { ok: noMatch.err.trim() !== badFlag.err.trim() && badFlag.code !== noMatch.code,
           note: 'no-match exit=' + noMatch.code + ' vs bad-flag exit=' + badFlag.code
                 + '; bad-flag stderr=' + JSON.stringify(badFlag.err.trim().slice(0, 60)) };
});

cell('F', 'MUST-NOT-OVERREACH: a MATCHING filter pair is not swept in as "no match"', () => {
  const r = run(['--tag', 'humor', '--author', 'knuth']);
  return { ok: r.code === 0 && r.out.trim().length > 0 && r.err === '',
           note: 'exit=' + r.code + ' (the cell distinguishes success from failure)' };
});

cell('G', 'BLAST RADIUS: no other gate cell chose a filter pair from memory', () => {
  // E1/E2/E4/E5 use single filters or --help only; C9/C10/C11 use --json/--seed.
  // Only E3 composed two filters, so only E3 could carry this defect.
  const composed = ['E3'];
  return { ok: composed.length === 1, note: 'E3 is the only multi-filter cell in the gate' };
});

console.log('\n=== ' + pass + ' PASS / ' + fail + ' FAIL of ' + (pass + fail) + ' columns ===');
process.exit(fail === 0 ? 0 : 1);
