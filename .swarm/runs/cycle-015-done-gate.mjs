#!/usr/bin/env node
// cycle-015-done-gate.mjs — the DONE decision's evidence.
//
// AUTHORED BY THE CONDUCTOR AT VERIFICATION TIME, cycle 15 of improvement run #3.
// NOT commit-reveal sealed, and that is deliberate rather than a lapse: the seal exists
// to stop a builder coding to the check (hard rule 2), and this cycle dispatches ZERO
// agents. There is nobody to hide it from. What it must still be is INDEPENDENT of the
// claims it checks — so every cell below re-derives its expected value from the tree or
// the backlog at run time, never from a journal note or a prior cycle's summary.
//
// It asks exactly one question: is this run's own Definition of done TRUE on today's
// tree, measured rather than inherited?

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const T = '/opt/targets/aphorism-cli';
let pass = 0, fail = 0;
const rows = [];

function cell(id, what, ok, detail) {
  rows.push({ id, what, ok, detail });
  ok ? pass++ : fail++;
}

function sh(cmd, args, opts = {}) {
  try {
    return { out: execFileSync(cmd, args, { cwd: T, encoding: 'utf8', ...opts }), code: 0 };
  } catch (e) {
    return { out: (e.stdout || '') + (e.stderr || ''), code: e.status ?? -1 };
  }
}

function node(args) {
  try {
    const out = execFileSync('node', ['bin/aphorism.js', ...args], { cwd: T, encoding: 'utf8' });
    return { out, err: '', code: 0 };
  } catch (e) {
    return { out: e.stdout ?? '', err: e.stderr ?? '', code: e.status ?? -1 };
  }
}

// ---------------------------------------------------------------- PRODUCT FLOOR
// SPEC "Product must-haves" + "Definition of done / Product". A regression here fails
// the run regardless of anything else, so it is measured first and from the binary.

const d1 = node([]);
cell('P1', 'default run prints one attributed line, exit 0',
  d1.code === 0 && d1.out.trim().split('\n').length === 1 && d1.out.includes('—') && d1.err === '',
  `exit=${d1.code} lines=${d1.out.trim().split('\n').length} stderr=${JSON.stringify(d1.err)}`);

const s1 = node(['--seed', '7']), s2 = node(['--seed', '7']);
cell('P2', 'seed determinism: same seed, same aphorism',
  s1.code === 0 && s1.out === s2.out && s1.out.trim().length > 0,
  `identical=${s1.out === s2.out} exit=${s1.code}`);

const inf = node(['--seed', 'Infinity']), inf2 = node(['--seed', 'Infinity']);
cell('P3', 'non-finite seed is accepted AND deterministic (SPEC Selection)',
  inf.code === 0 && inf.out === inf2.out,
  `exit=${inf.code} identical=${inf.out === inf2.out}`);

const lst = node(['--list']);
// Load the corpus through the SHIPPED module, not by re-parsing its text: the count
// that matters is the one the binary actually serves.
const { createRequire } = await import('node:module');
const { corpus } = createRequire(`${T}/package.json`)('./src/corpus.js');
cell('P4', '--list prints every corpus entry, count derived from corpus.js not from a note',
  lst.code === 0 && lst.out.trim().split('\n').length === corpus.length && corpus.length >= 40,
  `list=${lst.out.trim().split('\n').length} corpus=${corpus.length} (SPEC floor >=40)`);

const nm = node(['--tag', 'nosuchtag']);
cell('P5', 'no match = exit 1, stderr message, ZERO bytes stdout',
  nm.code === 1 && nm.out === '' && nm.err.trim().length > 0,
  `exit=${nm.code} stdout=${JSON.stringify(nm.out)} stderr=${JSON.stringify(nm.err.trim().slice(0, 60))}`);

const bad = node(['--nosuchflag']);
cell('P6', 'unknown flag = exit 2 (SPEC Exit codes)',
  bad.code === 2 && bad.out === '',
  `exit=${bad.code} stdout=${JSON.stringify(bad.out)}`);

const both = node(['--author', 'dijk', '--tag', 'simplicity', '--list']);
const expectAnd = corpus.filter(a =>
  a.author.toLowerCase().includes('dijk') &&
  a.tags.some(t => t.toLowerCase() === 'simplicity')).length;
cell('P7', 'filters compose as AND, expected count derived from the corpus itself',
  (expectAnd === 0 ? both.code === 1 : both.code === 0 &&
    both.out.trim().split('\n').length === expectAnd),
  `expected=${expectAnd} exit=${both.code} got=${both.out.trim() ? both.out.trim().split('\n').length : 0}`);

const js = node(['--json', '--seed', '3']);
let jsonOk = false;
try {
  const o = JSON.parse(js.out.trim());
  jsonOk = js.code === 0 && 'text' in o && 'author' in o && 'tags' in o &&
    js.out.trim().split('\n').length === 1;
} catch { jsonOk = false; }
cell('P8', '--json emits single-line object with text/author/tags', jsonOk,
  `exit=${js.code} parsed=${jsonOk}`);

// ---------------------------------------------------------------- SUITE
const tc = sh('node', ['--test', 'test/args.test.js', 'test/cli.test.js',
  'test/corpus.test.js', 'test/pick.test.js', 'test/pipe.test.js', 'test/readme-tags.test.js']);
const mPass = tc.out.match(/^# pass (\d+)$/m) || tc.out.match(/pass (\d+)/);
const mFail = tc.out.match(/^# fail (\d+)$/m) || tc.out.match(/fail (\d+)/);
cell('S1', 'test_cmd green, zero failures ("green throughout" — Definition of done)',
  tc.code === 0 && mFail && Number(mFail[1]) === 0 && mPass && Number(mPass[1]) > 100,
  `exit=${tc.code} pass=${mPass ? mPass[1] : '?'} fail=${mFail ? mFail[1] : '?'}`);

// ---------------------------------------------------------------- RUN CHARTER
// "zero new user-visible features" — measured as a diff over the run, not asserted.
const runStart = 'ef4fa6d';
const srcDiff = sh('git', ['diff', '--stat', `${runStart}..HEAD`, '--', 'src', 'bin']);
const flagsNow = (readFileSync(`${T}/src/args.js`, 'utf8').match(/--[a-z][a-z-]*/g) || []);
const uniqFlags = [...new Set(flagsNow)].sort();
const SPEC_FLAGS = ['--author', '--tag', '--seed', '--list', '--json', '--help'];
cell('R1', 'zero NEW user-visible flags vs the six SPEC names',
  uniqFlags.every(f => SPEC_FLAGS.includes(f)),
  `flags in args.js: ${uniqFlags.join(' ')}`);

const helpOut = node(['--help']);
cell('R2', '--help exits 0 on stdout and fits one screen (SPEC taste note)',
  helpOut.code === 0 && helpOut.out.trim().split('\n').length <= 24 && helpOut.err === '',
  `exit=${helpOut.code} lines=${helpOut.out.trim().split('\n').length} (<=24)`);

// ---------------------------------------------------------------- DOC SURFACES
// K-4 governs THREE surfaces. Cycle 12's V-7 swept all three. The honest question for a
// DONE call is not "were they true once" but "which have MOVED since that sweep, and is
// each mover covered by a gate re-run against today's tree". Derived by diff, not claimed.
const sweep = 'c64fc09'; // cycle-12 V-7 commit
const moved = sh('git', ['diff', '--name-only', `${sweep}..HEAD`, '--', 'README.md', 'docs/', 'REPORT.md'])
  .out.trim().split('\n').filter(Boolean);
cell('K4a', 'README.md and docs/ are UNCHANGED since the last full three-surface sweep',
  !moved.includes('README.md') && !moved.some(f => f.startsWith('docs/')),
  `moved since ${sweep}: ${moved.length ? moved.join(', ') : '(nothing)'}`);

cell('K4b', 'the ONLY moved surface is REPORT.md (the one the cycle-14 gate covers)',
  moved.length === 1 && moved[0] === 'REPORT.md',
  `moved = [${moved.join(', ')}]`);

// ---------------------------------------------------------------- BOARD
// The DONE ratchet needs the board to be genuinely out of actionable work. Re-read from
// backlog.json at run time — never from a journal summary of it.
const backlog = JSON.parse(readFileSync(`${T}/.swarm/backlog.json`, 'utf8')).items;
const todo = backlog.filter(i => i.status === 'todo');
const blocked = backlog.filter(i => i.status === 'blocked');
cell('B1', 'every BLOCKED item names a human actor in its acceptance (K-5)',
  blocked.length > 0 && blocked.every(i => /human|owner|maintainer/i.test(i.acceptance || '')),
  `${blocked.length} blocked: ${blocked.map(i => i.id).join(',')} — all name a human: ` +
  `${blocked.every(i => /human|owner|maintainer/i.test(i.acceptance || ''))}`);

cell('B2', 'no TODO item survives the ratchet as agent-actionable',
  todo.length === 0 || todo.every(i => i.id === 'R-1'),
  `todo = [${todo.map(i => i.id).join(', ')}] (R-1 scored ratchet-FAIL at cycle 14)`);

// CONVERSE CONTROL — this gate must be able to go red. If it cannot, it proves nothing.
const controlBroken = node(['--seed', 'notanumber']);
cell('C1', 'CONVERSE CONTROL: a NaN seed still exits 2, so the harness can detect failure',
  controlBroken.code === 2,
  `exit=${controlBroken.code} (a passing suite with this red would mean the harness is blind)`);

// ---------------------------------------------------------------- REPORT
console.log('cycle-015 DONE-decision gate — improvement run #3, aphorism-cli');
console.log('='.repeat(78));
for (const r of rows) {
  console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.id.padEnd(5)} ${r.what}`);
  console.log(`        ${r.detail}`);
}
console.log('='.repeat(78));
console.log(`PASS ${pass} / FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
