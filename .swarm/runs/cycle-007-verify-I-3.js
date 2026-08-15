'use strict';
// Conductor-authored verification harness for backlog item I-3 (cycle 7).
// Written AT VERIFICATION TIME; the docs agent never saw it.
//
// I-3 makes six normative claims about SHIPPED behaviour. A docs item cannot be
// verified by reading the docs — each claim is executed against the real binary
// here, and the doc text is only accepted if the behaviour agrees.

const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');

const BIN = path.join(__dirname, '..', '..', 'bin', 'aphorism.js');
const EM = '—';

let pass = 0;
let fail = 0;

function run(args) {
  const r = spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function check(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}${detail ? ' :: ' + detail : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ' :: ' + detail : ''}`);
  }
}

function lines(s) {
  return s.replace(/\n$/, '').split('\n');
}

// ---------------------------------------------------------------- (a) --author
console.log('--- (a) --author is SUBSTRING containment, case-insensitive ---');
{
  const r = run(['--list', '--author', 'dijk']);
  const ls = lines(r.out);
  check('exit 0', r.code === 0, `code=${r.code}`);
  check('matched >=1 entry on a partial, lowercased author', r.out.trim() !== '',
    `${ls.length} line(s)`);
  check('every match contains "dijkstra" case-insensitively',
    ls.every((l) => l.toLowerCase().includes('dijkstra')),
    ls[0]);
  // discriminator: an EQUALITY implementation could not match 'dijk' at all.
  const eq = run(['--list', '--author', 'Edsger W. Dijkstra']);
  check('DISCRIMINATOR: partial-author result set equals full-name result set',
    r.out === eq.out, 'substring, not equality');
}

// ------------------------------------------------------------------ (b) --tag
console.log('--- (b) --tag is WHOLE-TAG membership, not substring ---');
{
  const sub = run(['--tag', 'test']);
  const whole = run(['--list', '--tag', 'testing']);
  check('--tag test exits 1 (no whole tag "test" exists)', sub.code === 1, `code=${sub.code}`);
  check('--tag test writes nothing to stdout', sub.out === '', JSON.stringify(sub.out));
  check('--tag test writes a message to stderr', sub.err.trim() !== '', sub.err.trim());
  check('--tag testing exits 0 and matches entries', whole.code === 0 && whole.out.trim() !== '',
    `code=${whole.code}, ${lines(whole.out).length} line(s)`);
}

// ------------------------------------------------------- (c) --list ignores --seed
console.log('--- (c) --list accepts --seed and IGNORES it ---');
{
  const plain = run(['--list']);
  const s1 = run(['--list', '--seed', '1']);
  const s2 = run(['--list', '--seed', '999999']);
  const s3 = run(['--list', '--seed', 'Infinity']);
  check('--list --seed 1 exits 0', s1.code === 0, `code=${s1.code}`);
  check('seeded --list output identical to unseeded',
    plain.out === s1.out && s1.out === s2.out && s2.out === s3.out,
    'three distinct seeds + unseeded all byte-identical');
  // Tension check the conductor flagged: the exit-code rule must still hold under --list.
  const bad = run(['--list', '--seed', 'abc']);
  check('EDGE: --list --seed abc is still a usage error (exit 2)', bad.code === 2, `code=${bad.code}`);
  check('EDGE: --list --seed abc writes nothing to stdout', bad.out === '', JSON.stringify(bad.out));
}

// ------------------------------------------------------- (d) --list --json is NDJSON
console.log('--- (d) --list --json emits one JSON object per line (NDJSON, not an array) ---');
{
  const r = run(['--list', '--json']);
  const ls = lines(r.out);
  const plain = lines(run(['--list']).out);
  check('exit 0', r.code === 0, `code=${r.code}`);
  check('output does NOT start with "[" (not a JSON array)', !r.out.trimStart().startsWith('['),
    JSON.stringify(r.out.slice(0, 12)));
  let allObjects = true;
  for (const l of ls) {
    try {
      const v = JSON.parse(l);
      if (typeof v !== 'object' || v === null || Array.isArray(v)) allObjects = false;
    } catch (e) { allObjects = false; }
  }
  check('every line parses independently as a JSON object', allObjects, `${ls.length} lines`);
  check('one JSON line per --list entry (same cardinality)', ls.length === plain.length,
    `json=${ls.length} plain=${plain.length}`);
  // corpus order claim
  const { corpus } = require(path.join(__dirname, '..', '..', 'src', 'corpus.js'));
  check('NDJSON lines are in corpus order',
    JSON.parse(ls[0]).text === corpus[0].text &&
    JSON.parse(ls[ls.length - 1]).text === corpus[corpus.length - 1].text,
    `first="${JSON.parse(ls[0]).text.slice(0, 28)}..."`);
}

// ------------------------------------------------- (e) --list plain line format
console.log('--- (e) --list plain form is "<text> ' + EM + ' <author>", one line per entry ---');
{
  const r = run(['--list']);
  const ls = lines(r.out);
  const { corpus } = require(path.join(__dirname, '..', '..', 'src', 'corpus.js'));
  check('line count equals corpus size', ls.length === corpus.length,
    `lines=${ls.length} corpus=${corpus.length}`);
  check('first line is exactly `text EM-DASH author`',
    ls[0] === `${corpus[0].text} ${EM} ${corpus[0].author}`, ls[0]);
  check('last line is exactly `text EM-DASH author`',
    ls[ls.length - 1] === `${corpus[corpus.length - 1].text} ${EM} ${corpus[corpus.length - 1].author}`,
    ls[ls.length - 1]);
  check('every line carries the EM DASH U+2014 (not a hyphen or en dash)',
    ls.every((l) => l.includes(` ${EM} `)), 'all ' + ls.length + ' lines');
  // discriminator: the DEFAULT single-aphorism form is two lines with an indent,
  // so the doc is right to describe them separately.
  const one = run(['--seed', '42']);
  check('DISCRIMINATOR: default output form differs (2 lines, indented attribution)',
    lines(one.out).length === 2 && lines(one.out)[1].startsWith('    ' + EM),
    JSON.stringify(one.out));
}

// ----------------------------------------------------------- (f) --seed acceptance
console.log('--- (f) --seed: every non-NaN Number() value is accepted AND deterministic ---');
{
  const seeds = ['42', '-5', '-3.5', '3.75', 'Infinity', '-Infinity', '1e21'];
  const firsts = {};
  for (const s of seeds) {
    const outs = new Set();
    let code = null;
    for (let i = 0; i < 8; i++) {
      const r = run(['--seed', s, '--json']);
      code = r.code;
      outs.add(r.out);
    }
    firsts[s] = [...outs][0];
    check(`--seed ${s} exits 0 and is deterministic over 8 runs`,
      code === 0 && outs.size === 1, `distinct outputs=${outs.size}`);
  }
  // discriminator: determinism alone is satisfiable by a degenerate always-same-entry
  // implementation. Distinct seeds must reach distinct entries.
  const distinct = new Set(Object.values(firsts));
  check('DISCRIMINATOR: distinct seeds reach multiple distinct aphorisms',
    distinct.size >= 4, `${distinct.size} distinct results across ${seeds.length} seeds`);

  const nan = run(['--seed', 'abc']);
  check('--seed abc is a usage error, exit 2', nan.code === 2, `code=${nan.code}`);
  check('--seed abc writes nothing to stdout', nan.out === '', JSON.stringify(nan.out));
  check('--seed abc writes to stderr', nan.err.trim() !== '', nan.err.trim());
  const nanLit = run(['--seed', 'NaN']);
  check('--seed NaN is a usage error, exit 2', nanLit.code === 2, `code=${nanLit.code}`);
}

// -------------------------------------------------------------- (g) --json alone
console.log('--- (g) --json alone is a single-line JSON object with text/author/tags ---');
{
  const r = run(['--json', '--seed', '7']);
  const ls = lines(r.out);
  check('exactly one line', ls.length === 1, `${ls.length} line(s)`);
  let ok = false;
  try {
    const v = JSON.parse(ls[0]);
    ok = typeof v.text === 'string' && typeof v.author === 'string' && Array.isArray(v.tags);
  } catch (e) { ok = false; }
  check('parses as an object carrying text, author, tags', ok, ls[0].slice(0, 60) + '...');
}

console.log('');
console.log(`TOTALS: pass=${pass} fail=${fail}`);
console.log(`GATE: ${fail === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = fail === 0 ? 0 : 1;
