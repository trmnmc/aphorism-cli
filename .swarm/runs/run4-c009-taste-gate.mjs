#!/usr/bin/env node
// run #4 cycle 9 — conductor's verification gate for the TASTE pass.
//
// The taste agent's return is a CLAIM. This gate reproduces every checkable claim
// against the live tree, with must-die and must-stay-green controls so a green
// result cannot come from a broken instrument.
//
// Held under SWARM/runs/ per the run #3 cycle-14 decision (hard rule 5 makes a gate
// living here structurally unreachable to an agent). Authored AFTER the agent returned,
// which is correct for a taste pass: you cannot know which findings to reproduce until
// the findings exist. Nothing here was visible to the agent.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const T = '/opt/targets/aphorism-cli';
const BIN = path.join(T, 'bin/aphorism.js');

let pass = 0, fail = 0;
const rows = [];
function cell(id, desc, fn) {
  let ok = false, note = '';
  try { const r = fn(); ok = r === true || (r && r.ok === true); note = (r && r.note) || ''; }
  catch (e) { ok = false; note = 'threw: ' + e.message; }
  rows.push([ok ? 'PASS' : 'FAIL', id, desc, note]);
  ok ? pass++ : fail++;
  return ok;
}

// run the CLI; returns {code, out, err}
function run(args) {
  try {
    const out = execFileSync('node', [BIN, ...args], { cwd: T, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out, err: '' };
  } catch (e) {
    return { code: e.status, out: e.stdout || '', err: e.stderr || '' };
  }
}

// ---------------------------------------------------------------- A. corpus claims
cell('A0', 'INVOKER SANITY: a default draw produces non-empty stdout and exit 0', () => {
  const r = run([]);
  return { ok: r.code === 0 && r.out.trim().length > 0, note: 'exit=' + r.code + ' bytes=' + r.out.length };
});

cell('A1', 'corpus is exactly 50 entries (--list)', () => {
  const r = run(['--list']);
  const n = r.out.trim().split('\n').length;
  return { ok: n === 50, note: 'lines=' + n };
});

const dijkstra = run(['--author', 'dijkstra', '--list']).out.trim().split('\n').filter(Boolean).length;
cell('A2', 'CLAIM "Dijkstra is 7 of 50 entries = 14%"', () => {
  const pct = (dijkstra / 50) * 100;
  return { ok: dijkstra === 7 && Math.abs(pct - 14) < 0.001, note: 'count=' + dijkstra + ' pct=' + pct.toFixed(1) + '%' };
});

cell('C1', 'CONTROL must-die: the same cell asserting Dijkstra==8 must FAIL', () => {
  return { ok: dijkstra !== 8, note: 'cell discriminates (actual ' + dijkstra + ')' };
});

// ------------------------------------------------- B. the arithmetic, recomputed here
cell('B1', 'CLAIM "P(repeat in 7 daily draws) = 35.6%" recomputed independently', () => {
  let pDistinct = 1;
  for (let i = 0; i < 7; i++) pDistinct *= (50 - i) / 50;
  const pRepeat = 1 - pDistinct;
  const agentClaim = 0.356;
  return { ok: Math.abs(pRepeat - agentClaim) < 0.001,
           note: 'conductor=' + (pRepeat * 100).toFixed(2) + '%  agent=35.6%' };
});

cell('C2', 'CONTROL must-die: the same arithmetic over 3 draws must NOT equal 35.6%', () => {
  let p = 1; for (let i = 0; i < 3; i++) p *= (50 - i) / 50;
  return { ok: Math.abs((1 - p) - 0.356) > 0.05, note: '3-draw P=' + ((1 - p) * 100).toFixed(2) + '% (cell is not a constant)' };
});

// ------------------------------------- C. the central claim: NO anti-repeat memory
// Discriminator: if anti-repeat memory existed, immediate repeats would be structurally
// impossible. Over N draws there are N-1 adjacent pairs; under uniform draws from 50 the
// probability of observing ZERO immediate repeats in 200 draws is 0.98^199 = 1.8%, so a
// pass here has ~98% power against the "memory exists" hypothesis.
const N = 200;
const seq = [];
for (let i = 0; i < N; i++) seq.push(run([]).out.trim());
let immediate = 0;
for (let i = 1; i < N; i++) if (seq[i] === seq[i - 1]) immediate++;
const distinct = new Set(seq).size;

cell('C3', 'CLAIM "no anti-repeat memory": immediate repeats DO occur in ' + N + ' live draws', () => {
  return { ok: immediate > 0,
           note: 'immediate repeats=' + immediate + ' (uniform expectation ' + ((N - 1) / 50).toFixed(2) + '); P(0|no memory)=1.8%' };
});

cell('C4', 'the draw is UNIFORM, not degenerate — distinct count matches theory', () => {
  const expected = 50 * (1 - Math.pow(49 / 50, N));
  return { ok: distinct >= 45 && distinct <= 50,
           note: 'distinct=' + distinct + '/50  theory=' + expected.toFixed(1) };
});

cell('C5', 'CLAIM "30 draws yields ~23 distinct" matches uniform theory (agent measured 23)', () => {
  const theory = 50 * (1 - Math.pow(49 / 50, 30));
  return { ok: Math.abs(theory - 23) < 1.5, note: 'theory=' + theory.toFixed(2) + '  agent measured 23' };
});

cell('C6', 'no persisted draw state: source performs no filesystem write', () => {
  const src = ['bin/aphorism.js', 'src/args.js', 'src/corpus.js', 'src/select.js']
    .map((f) => readFileSync(path.join(T, f), 'utf8')).join('\n');
  const hits = ['writeFile', 'appendFile', 'writeFileSync', 'mkdir', '.cache', 'homedir']
    .filter((k) => src.includes(k));
  return { ok: hits.length === 0, note: hits.length ? 'found: ' + hits.join(',') : 'none of writeFile/appendFile/mkdir/.cache/homedir' };
});

cell('C7', 'no cache dir was created by ' + N + ' runs', () => {
  const p = path.join(homedir(), '.cache/aphorism');
  return { ok: !existsSync(p), note: p + ' absent' };
});

// ------------------------------------------------- D. presentation claim (attribution)
cell('D1', 'CLAIM "no TTY styling path at all" — no isTTY/ANSI branch in source', () => {
  const src = ['bin/aphorism.js', 'src/args.js', 'src/select.js']
    .map((f) => readFileSync(path.join(T, f), 'utf8')).join('\n');
  const hits = ['isTTY', '\\x1b', '\\u001b', '', '[2m'].filter((k) => src.includes(k));
  return { ok: hits.length === 0, note: hits.length ? 'found: ' + hits.join(',') : 'no isTTY, no escape sequences' };
});

cell('D2', 'CLAIM "attribution renders at full weight" — zero ANSI bytes in output', () => {
  const r = run(['--seed', '7']);
  const hasEsc = r.out.includes('');
  return { ok: !hasEsc, note: 'ESC bytes present=' + hasEsc };
});

cell('C8', 'CONTROL must-die: asserting ANSI IS present must FAIL against this tree', () => {
  const r = run(['--seed', '7']);
  return { ok: !r.out.includes(''), note: 'inverse cell would fail — D2 is not vacuous' };
});

cell('D3', 'CLAIM "the attribution line is indented under the quote"', () => {
  const r = run(['--seed', '7']);
  const lines = r.out.split('\n');
  const attr = lines.find((l) => l.includes('—'));
  return { ok: !!attr && /^\s{2,}/.test(attr), note: JSON.stringify(attr) };
});

// ------------------------------------------------------- E. discovery-loop claims
cell('E1', 'CLAIM "no --tags flag exists"', () => {
  const r = run(['--tags']);
  const help = run(['--help']).out;
  return { ok: r.code !== 0 && !help.includes('--tags'), note: 'exit=' + r.code + ' help mentions --tags=' + help.includes('--tags') };
});

cell('C9', 'CONTROL must-stay-green: a REAL flag (--json) is accepted, exit 0', () => {
  const r = run(['--json', '--seed', '3']);
  return { ok: r.code === 0 && r.out.trim().startsWith('{'), note: 'exit=' + r.code + ' ' + r.out.trim().slice(0, 40) };
});

cell('E2', 'CLAIM "unknown tag gives the generic no-match message, exit 1, stdout empty"', () => {
  const r = run(['--tag', 'hubris']);
  return { ok: r.code === 1 && r.out === '' && /no aphorism matches those filters/.test(r.err),
           note: 'exit=' + r.code + ' stdout=' + JSON.stringify(r.out) + ' stderr=' + JSON.stringify(r.err.trim()) };
});

cell('E3', 'CLAIM "the message does not distinguish an UNKNOWN tag from an empty intersection"', () => {
  const unknown = run(['--tag', 'hubris']).err.trim();
  const emptyIntersection = run(['--tag', 'humor', '--author', 'knuth']).err.trim();
  return { ok: unknown === emptyIntersection && unknown.length > 0,
           note: 'identical message for both cases: ' + JSON.stringify(unknown) };
});

cell('E4', 'CLAIM "--help delegates tag discovery to a jq pipeline"', () => {
  const help = run(['--help']).out;
  return { ok: /jq/.test(help), note: JSON.stringify((help.split('\n').find((l) => /jq/.test(l)) || '').trim()) };
});

cell('E5', 'CLAIM "--help fits one screen" (<= 24 lines)', () => {
  const n = run(['--help']).out.trim().split('\n').length;
  return { ok: n <= 24, note: 'lines=' + n + ' (agent said 12)' };
});

// ------------------------------------------------------------ F. determinism control
cell('C10', 'CONTROL must-stay-green: --seed is deterministic (same seed twice identical)', () => {
  const a = run(['--seed', '20260819']).out, b = run(['--seed', '20260819']).out;
  return { ok: a === b && a.trim().length > 0, note: 'identical=' + (a === b) };
});

cell('C11', 'CONTROL must-die: two DIFFERENT seeds must not be assumed equal', () => {
  const a = run(['--seed', '7']).out, b = run(['--seed', '8']).out;
  return { ok: a !== b, note: 'differ=' + (a !== b) + ' (C10 is not matching on emptiness)' };
});

// ---------------------------------------------------------------------- G. standing
cell('G1', 'SCOPE: the taste agent mutated nothing (working tree clean)', () => {
  const s = execFileSync('git', ['status', '--porcelain'], { cwd: T, encoding: 'utf8' });
  return { ok: s.trim() === '', note: s.trim() === '' ? 'clean' : JSON.stringify(s) };
});

cell('G2', 'SUITE: node --test 118/118/0', () => {
  let out = '';
  try { out = execFileSync('bash', ['-c', 'node --test test/*.test.js 2>&1'], { cwd: T, encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : NaN; };
  const tests = g(/^.\s*tests\s+(\d+)/m), p = g(/^.\s*pass\s+(\d+)/m), f = g(/^.\s*fail\s+(\d+)/m);
  return { ok: tests >= 118 && p === tests && f === 0, note: 'tests=' + tests + ' pass=' + p + ' fail=' + f };
});

// ---------------------------------------------------------------------------- report
const w = rows.reduce((m, r) => Math.max(m, r[1].length), 0);
for (const [v, id, desc, note] of rows) {
  console.log(v + '  ' + id.padEnd(w) + '  ' + desc);
  if (note) console.log('      ' + note);
}
console.log('\n=== ' + pass + ' PASS / ' + fail + ' FAIL of ' + rows.length + ' cells ===');
console.log('observed sequence stats: N=' + N + ' distinct=' + distinct + ' immediate_repeats=' + immediate);
process.exit(fail === 0 ? 0 : 1);
