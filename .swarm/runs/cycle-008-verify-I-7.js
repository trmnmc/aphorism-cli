#!/usr/bin/env node
// Cycle 8 — conductor verification harness for item I-7.
// Authored AT VERIFICATION TIME. The builder agent never saw this file.
//
// I-7 changed prose inside the HELP string of src/args.js. Two things must be proven,
// and reading the diff proves neither:
//   1. NOTHING ELSE MOVED. HELP sits in a product file; a prose edit that also nudged
//      parseArgs would be invisible in a green suite if the nudge is in an untested
//      corner. Proven by byte-comparing everything OUTSIDE the HELP literal against HEAD.
//   2. WHAT HELP NOW CLAIMS IS TRUE. Every new phrase is a claim about runtime behavior,
//      so it is falsifiable exactly like code (cycle-7 precedent). Proven by EXECUTING
//      the shipped binary, never by reading the prose it produced.
// Discriminators are included because the naive form of each check is passable by a
// degenerate implementation.

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/opt/targets/aphorism-cli';
const BIN = path.join(ROOT, 'bin/aphorism.js');
const ARGS_SRC = path.join(ROOT, 'src/args.js');

let pass = 0, fail = 0;
function check(label, ok, detail) {
  (ok ? pass++ : fail++);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' :: ' + detail : ''}`);
}
function run(args) {
  const r = spawnSync('node', [BIN, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

// ---------------------------------------------------------------------------
console.log('--- (1) SCOPE: nothing outside the HELP literal moved ---');

const headArgs = execFileSync('git', ['-C', ROOT, 'show', 'HEAD:src/args.js'], { encoding: 'utf8' });
const workArgs = fs.readFileSync(ARGS_SRC, 'utf8');

// The HELP literal is the only region licensed to change. Split each file into
// (prologue up to the opening backtick) + (literal) + (everything after it).
function split(src) {
  const open = src.indexOf('const HELP = `');
  const close = src.indexOf('`;', open + 'const HELP = `'.length);
  if (open < 0 || close < 0) throw new Error('could not locate HELP literal');
  return {
    prologue: src.slice(0, open + 'const HELP = `'.length),
    literal: src.slice(open + 'const HELP = `'.length, close),
    epilogue: src.slice(close),
  };
}
const H = split(headArgs), W = split(workArgs);

check('prologue above HELP is byte-identical to HEAD', H.prologue === W.prologue,
  `${W.prologue.length} bytes`);
check('ALL code below HELP is byte-identical to HEAD', H.epilogue === W.epilogue,
  `${W.epilogue.length} bytes`);
check('the HELP literal DID change (the item is not a no-op)', H.literal !== W.literal,
  `${H.literal.length} -> ${W.literal.length} bytes`);

const diffFiles = execFileSync('git', ['-C', ROOT, 'diff', '--name-only'], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
check('git diff touches exactly src/args.js',
  diffFiles.length === 1 && diffFiles[0] === 'src/args.js', JSON.stringify(diffFiles));

// ---------------------------------------------------------------------------
console.log('--- (2) HELP structural constraints the suite enforces ---');

const { HELP } = require(ARGS_SRC);
const helpLines = HELP.split('\n');
check('HELP is a non-empty string', typeof HELP === 'string' && HELP.length > 0);
check('HELP is <= 24 lines', helpLines.length <= 24, `${helpLines.length} lines`);
for (const tok of ['--author', '--tag', '--seed', '--list', '--json', '--help', '-h']) {
  check(`HELP still mentions ${tok}`, HELP.includes(tok));
}

// ---------------------------------------------------------------------------
console.log('--- (3) END-TO-END: the binary actually prints the edited constant ---');
// Guards against editing a constant the shipped path does not use.
const h = run(['--help']);
check('--help exits 0', h.code === 0, `code=${h.code}`);
check('--help writes nothing to stderr', h.err === '', JSON.stringify(h.err.slice(0, 40)));
check('--help stdout contains the EDITED --author line verbatim',
  h.out.includes(W.literal.split('\n').find(l => l.includes('--author'))),
  JSON.stringify((W.literal.split('\n').find(l => l.includes('--author')) || '').trim()));

// ---------------------------------------------------------------------------
console.log('--- (4) CLAIM (a): HELP says --author is a SUBSTRING match ---');
const authorLine = helpLines.find(l => l.includes('--author')) || '';
check('HELP --author line states substring matching',
  /substring/i.test(authorLine), JSON.stringify(authorLine.trim()));

const partial = run(['--list', '--author', 'dijk']);
const full = run(['--list', '--author', 'Edsger W. Dijkstra']);
check('--author dijk exits 0 and matches entries', partial.code === 0 && partial.out.trim() !== '',
  `code=${partial.code}, ${partial.out.trim().split('\n').length} line(s)`);
// DISCRIMINATOR: a substring rule is indistinguishable from an equality rule unless the
// partial-name result set is required to EQUAL the full-name result set.
check('DISCRIMINATOR: partial-author result set EQUALS full-name result set',
  partial.out === full.out && partial.out.trim() !== '',
  'substring, not equality');

// ---------------------------------------------------------------------------
console.log('--- (5) CLAIM (b): HELP says --tag is a WHOLE-TAG match ---');
const tagLine = helpLines.find(l => l.includes('--tag <tag>')) || helpLines.find(l => l.includes('--tag')) || '';
check('HELP --tag line states whole-tag matching',
  /whole[- ]?tag/i.test(tagLine), JSON.stringify(tagLine.trim()));
// DISCRIMINATOR: the corpus has a `testing` tag and no `test` tag. Under a substring
// reading `--tag test` would match; under whole-tag it must find nothing (exit 1).
const tTest = run(['--tag', 'test']);
const tTesting = run(['--tag', 'testing']);
check('DISCRIMINATOR: --tag test exits 1 (no WHOLE tag "test" exists)', tTest.code === 1,
  `code=${tTest.code}`);
check('--tag test writes zero bytes to stdout', tTest.out === '', JSON.stringify(tTest.out));
check('--tag testing exits 0 (the whole tag does exist)', tTesting.code === 0,
  `code=${tTesting.code}`);
// The asymmetry must be VISIBLE: both lines adjacent in the rendered help.
const ai = helpLines.findIndex(l => l.includes('--author'));
const ti = helpLines.findIndex(l => l.includes('--tag <tag>'));
check('--author and --tag lines are adjacent (asymmetry readable at a glance)',
  ai >= 0 && ti === ai + 1, `--author at ${ai}, --tag at ${ti}`);

// ---------------------------------------------------------------------------
console.log('--- (6) CLAIM (c): HELP says --json is NDJSON when combined with --list ---');
const jsonLine = helpLines.find(l => l.includes('--json')) || '';
check('HELP --json line names the --list/NDJSON combination',
  /ndjson/i.test(jsonLine) && /--list/.test(jsonLine), JSON.stringify(jsonLine.trim()));

const lj = run(['--list', '--json']);
check('--list --json exits 0', lj.code === 0, `code=${lj.code}`);
check('--list --json does NOT start with "[" (not a JSON array)',
  !lj.out.trimStart().startsWith('['), JSON.stringify(lj.out.slice(0, 14)));
const ljLines = lj.out.trim().split('\n');
let allObjects = true;
for (const line of ljLines) {
  try {
    const v = JSON.parse(line);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) allObjects = false;
  } catch { allObjects = false; }
}
check('every --list --json line parses independently as a JSON object', allObjects,
  `${ljLines.length} lines`);

const corpus = require(path.join(ROOT, 'src/corpus.js'));
const corpusArr = Array.isArray(corpus) ? corpus : (corpus.corpus || corpus.aphorisms);
check('NDJSON line count equals corpus size', ljLines.length === corpusArr.length,
  `${ljLines.length} vs ${corpusArr.length}`);
check('NDJSON is in corpus order (first and last)',
  JSON.parse(ljLines[0]).text === corpusArr[0].text &&
  JSON.parse(ljLines[ljLines.length - 1]).text === corpusArr[corpusArr.length - 1].text,
  `first="${JSON.parse(ljLines[0]).text.slice(0, 28)}..."`);
// DISCRIMINATOR: HELP claims TWO distinct shapes on one line. Prove they are genuinely
// distinct — the non-list form must be exactly one line, i.e. not merely NDJSON-of-one.
const sj = run(['--json', '--seed', '42']);
check('DISCRIMINATOR: bare --json is exactly ONE line while --list --json is many',
  sj.code === 0 && sj.out.trim().split('\n').length === 1 && ljLines.length > 1,
  `bare=${sj.out.trim().split('\n').length} line, list=${ljLines.length} lines`);

// ---------------------------------------------------------------------------
console.log('--- (7) REGRESSION: behaviors HELP still claims unchanged ---');
const seeded = new Set();
for (let i = 0; i < 8; i++) seeded.add(run(['--seed', '42', '--json']).out);
check('--seed 42 still deterministic over 8 runs', seeded.size === 1, `distinct=${seeded.size}`);
const bad = run(['--seed', 'abc']);
check('--seed abc still exits 2 with stdout empty', bad.code === 2 && bad.out === '',
  `code=${bad.code}`);
const unk = run(['--nope']);
check('unknown flag still exits 2', unk.code === 2, `code=${unk.code}`);
const plain = run([]);
check('default invocation still exits 0 with output', plain.code === 0 && plain.out.trim() !== '',
  `code=${plain.code}`);

console.log(`\nTOTALS: pass=${pass} fail=${fail}`);
console.log(`GATE: ${fail === 0 ? 'PASS' : 'FAIL'}`);
process.exit(fail === 0 ? 0 : 1);
