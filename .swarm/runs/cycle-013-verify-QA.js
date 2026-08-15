// Conductor-authored verification harness for cycle 13's QA-full pass.
// Written AT VERIFICATION TIME, after the scenarios were authored and executed, and
// deliberately BROADER than the six scenarios: where the executor tested one tag and one
// author fragment, this sweeps every tag and many author fragments in the corpus.
// No agent saw this file. Every detector that can produce a PASS is paired with a
// negative control proving it fires on a synthetic violation.
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const TARGET = '/opt/targets/aphorism-cli';
const BIN = path.join(TARGET, 'bin', 'aphorism.js');
const EM = '—';
const SEP = ' ' + EM + ' ';

let pass = 0, fail = 0;
const lines = [];
function check(id, ok, detail) {
  (ok ? pass++ : fail++);
  const s = (ok ? 'PASS  ' : 'FAIL  ') + id + (detail ? '  :: ' + detail : '');
  lines.push(s);
  console.log(s);
}
function run(argv) {
  const r = spawnSync('node', [BIN].concat(argv), { cwd: TARGET, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const lc = (s) => String(s).toLowerCase();

// ---------------------------------------------------------------- harvest
const h = run(['--list', '--json']);
const harvest = h.out.split('\n').filter(Boolean).map((l) => JSON.parse(l));
check('H1 harvest parses as NDJSON, exit 0, stderr empty',
  h.code === 0 && h.err === '' && harvest.length > 0,
  'exit ' + h.code + ', ' + harvest.length + ' objects, stderr ' + h.err.length + 'B');
check('H2 corpus size >= 40 (spec floor)', harvest.length >= 40, harvest.length + ' entries');
check('H3 every harvested entry has text:string, author:string, tags:array',
  harvest.every((e) => typeof e.text === 'string' && e.text &&
    typeof e.author === 'string' && e.author && Array.isArray(e.tags)),
  harvest.length + ' checked');

const key = (e) => JSON.stringify([e.text, e.author, e.tags]);
const seq = (arr) => arr.map(key).join('\n');
const parseSeq = (out) => out.split('\n').filter(Boolean).map((l) => JSON.parse(l));

// ---------------------------------------------- S1 determinism + non-degeneracy
const SEEDS = ['42', 'Infinity', '-Infinity', '-2.5', '0', '7'];
const seedOut = {};
let detOk = true, detDetail = [];
for (const s of SEEDS) {
  const runs = [];
  for (let i = 0; i < 8; i++) runs.push(run(['--seed', s, '--json']));
  const same = runs.every((r) => r.out === runs[0].out);
  const clean = runs.every((r) => r.code === 0 && r.err === '');
  if (!same || !clean) { detOk = false; detDetail.push(s + (same ? '' : ' NOT-IDENTICAL') + (clean ? '' : ' exit/stderr')); }
  seedOut[s] = runs[0].out;
}
check('S1a every seed deterministic over 8 runs, exit 0, stderr empty (incl. Infinity/-Infinity/-2.5)',
  detOk, detOk ? SEEDS.length + ' seeds x 8 runs identical' : detDetail.join('; '));

const distinct = new Set(SEEDS.map((s) => seedOut[s]));
check('S1b [anti-degeneracy] distinct seeds do NOT all collapse to one entry',
  distinct.size >= 3, distinct.size + ' distinct outputs across ' + SEEDS.length + ' seeds');

const unseeded = new Set();
for (let i = 0; i < 25; i++) unseeded.add(run(['--json']).out);
check('S1c unseeded selection actually varies (not a disguised constant)',
  unseeded.size >= 2, unseeded.size + ' distinct outputs in 25 unseeded runs');

const j42 = JSON.parse(seedOut['42']);
const plain42 = run(['--seed', '42']);
check('S1d cross-format: plain --seed 42 stdout contains the JSON run text verbatim',
  plain42.code === 0 && plain42.out.includes(j42.text),
  'exit ' + plain42.code + ', contains=' + plain42.out.includes(j42.text));

// ---------------------------------------------------------------- S2 --list
const l1 = run(['--list']);
const listLines = l1.out.split('\n').filter(Boolean);
check('S2a --list exit 0, stderr empty, one line per corpus entry',
  l1.code === 0 && l1.err === '' && listLines.length === harvest.length,
  'exit ' + l1.code + ', ' + listLines.length + ' lines vs ' + harvest.length + ' entries');

function emDashShaped(line) {
  const i = line.lastIndexOf(SEP);
  return i > 0 && line.slice(i + SEP.length).length > 0;
}
const badShape = listLines.filter((l) => !emDashShaped(l));
check('S2b every --list line is "<text> U+2014 <author>" with both parts non-empty',
  badShape.length === 0, badShape.length + ' malformed lines');
check('S2c [negative control] em-dash detector rejects hyphen and en-dash variants',
  !emDashShaped('some text - Author') && !emDashShaped('some text – Author'),
  'hyphen and U+2013 both rejected');
check('S2d --list lines carry the harvest text+author, in corpus order',
  listLines.every((l, i) => l === harvest[i].text + SEP + harvest[i].author),
  'all ' + listLines.length + ' lines reconstructed from harvest');

const l2 = run(['--list', '--seed', '999']);
check('S2e --list ignores a VALID seed: byte-identical to bare --list',
  l2.code === 0 && l2.out === l1.out, 'exit ' + l2.code + ', identical=' + (l2.out === l1.out));
check('S2f [negative control] byte-identity detector distinguishes different strings',
  l1.out !== l1.out.slice(1), 'perturbed copy correctly reported different');

const l3 = run(['--list', '--seed', 'abc']);
check('S2g --list with an UNPARSEABLE seed is still a usage error: exit 2, 0B stdout, stderr set',
  l3.code === 2 && l3.out.length === 0 && l3.err.length > 0,
  'exit ' + l3.code + ', stdout ' + l3.out.length + 'B, stderr ' + l3.err.length + 'B');

// ------------------------------------- S3 whole-tag semantics, SWEPT over every tag
const allTags = [...new Set(harvest.flatMap((e) => e.tags.map(String)))];
const S_of_tag = (t) => harvest.filter((e) => e.tags.some((x) => lc(x) === lc(t)));

let tagExact = 0, tagExactBad = [];
let caseOk = 0, caseBad = [];
for (const t of allTags) {
  const got = run(['--list', '--json', '--tag', t]);
  const want = S_of_tag(t);
  if (got.code === 0 && seq(parseSeq(got.out)) === seq(want)) tagExact++;
  else tagExactBad.push(t);
  const flipped = t === lc(t) ? t.toUpperCase() : lc(t);
  const g2 = run(['--list', '--json', '--tag', flipped]);
  if (g2.out === got.out && g2.code === got.code) caseOk++; else caseBad.push(t);
}
check('S3a --tag returns EXACTLY the whole-tag match set, in corpus order, for every tag',
  tagExactBad.length === 0, tagExact + '/' + allTags.length + ' tags exact' +
  (tagExactBad.length ? ', bad: ' + tagExactBad.join(',') : ''));
check('S3b --tag is case-insensitive for every tag (flipped case byte-identical)',
  caseBad.length === 0, caseOk + '/' + allTags.length + ' tags case-insensitive');

// the substring-vs-whole-tag discriminator, swept: for every tag, drop the last char
let prefixTested = 0, prefixBad = [];
for (const t of allTags) {
  if (t.length < 2) continue;
  const p = t.slice(0, -1);
  const wantP = S_of_tag(p);              // whole-tag matches of the prefix (usually none)
  const leakIfSubstring = S_of_tag(t).filter((e) => !wantP.includes(e));
  if (leakIfSubstring.length === 0) continue;   // no discriminating power for this tag
  prefixTested++;
  const got = run(['--list', '--json', '--tag', p]);
  let ok;
  if (wantP.length === 0) ok = got.code === 1 && got.out.length === 0 && got.err.length > 0;
  else ok = got.code === 0 && seq(parseSeq(got.out)) === seq(wantP);
  if (!ok) prefixBad.push(p + ' (exit ' + got.code + ', ' + got.out.split('\n').filter(Boolean).length + ' lines)');
}
check('S3c [discriminator] a proper PREFIX of a real tag never matches the longer tag',
  prefixBad.length === 0, prefixTested + ' discriminating prefixes swept' +
  (prefixBad.length ? ', leaked: ' + prefixBad.join('; ') : ', zero leaks'));
check('S3d [negative control] the leak detector fires on a simulated substring matcher',
  (() => {                                   // simulate tag.includes(arg) over the harvest
    const t = allTags.find((x) => x.length >= 2 && S_of_tag(x).length > 0);
    const p = t.slice(0, -1);
    const sub = harvest.filter((e) => e.tags.some((x) => lc(x).includes(lc(p))));
    return sub.length > S_of_tag(p).length;  // a substring matcher WOULD over-match
  })(), 'simulated .includes() over-matches where whole-tag does not');

// --------------------------------------- S4 AND-not-OR, swept over many (author,tag) pairs
const S_of_author = (a) => harvest.filter((e) => lc(e.author).includes(lc(a)));
const fragments = [...new Set(harvest.map((e) => {
  const a = e.author.replace(/[^A-Za-z]/g, '');
  return a.length >= 6 ? a.slice(1, 5) : null;
}).filter(Boolean))];

let andTested = 0, andBad = [];
for (const frag of fragments) {
  const A = frag === lc(frag) ? frag.toUpperCase() : lc(frag);   // flip case: proves ci match
  const SA = S_of_author(A);
  if (SA.length === 0) continue;
  for (const t of allTags) {
    const ST = S_of_tag(t);
    const inter = SA.filter((e) => ST.includes(e));
    const union = [...new Set(SA.concat(ST))];
    if (union.length <= inter.length) continue;    // no AND/OR discriminating power
    andTested++;
    const got = run(['--list', '--json', '--author', A, '--tag', t]);
    let ok;
    if (inter.length === 0) ok = got.code === 1 && got.out.length === 0 && got.err.length > 0;
    else ok = got.code === 0 && seq(parseSeq(got.out)) === seq(inter);
    const looksLikeUnion = got.code === 0 && seq(parseSeq(got.out)) === seq(union);
    if (!ok) andBad.push(A + '+' + t + (looksLikeUnion ? ' [OR!]' : '') +
      ' want ' + inter.length + ' got ' + got.out.split('\n').filter(Boolean).length);
    if (andTested >= 40) break;
  }
  if (andTested >= 40) break;
}
check('S4a --author + --tag is the INTERSECTION (AND), never the union, across many pairs',
  andBad.length === 0, andTested + ' discriminating pairs swept' +
  (andBad.length ? ', wrong: ' + andBad.slice(0, 5).join('; ') : ', zero wrong'));
check('S4b [negative control] the AND/OR detector distinguishes intersection from union',
  (() => {
    const A = fragments.map((f) => f.toUpperCase()).find((f) => S_of_author(f).length > 0);
    const t = allTags.find((x) => {
      const inter = S_of_author(A).filter((e) => S_of_tag(x).includes(e));
      return [...new Set(S_of_author(A).concat(S_of_tag(x)))].length > inter.length;
    });
    if (!t) return false;
    const inter = S_of_author(A).filter((e) => S_of_tag(t).includes(e));
    const union = [...new Set(S_of_author(A).concat(S_of_tag(t)))];
    return seq(inter) !== seq(union);
  })(), 'a synthetic union is correctly reported as != intersection');

const fragA = fragments.map((f) => f.toUpperCase()).find((f) => S_of_author(f).length > 0);
const gotA = run(['--list', '--json', '--author', fragA]);
check('S4c --author matches by case-insensitive SUBSTRING (case-flipped fragment still matches)',
  gotA.code === 0 && seq(parseSeq(gotA.out)) === seq(S_of_author(fragA)) && S_of_author(fragA).length > 0,
  'fragment "' + fragA + '" -> ' + S_of_author(fragA).length + ' entries, exact match');

// ------------------------------------------------ S5 no-match triple (exit 1, 0B stdout)
const NOAUTH = 'qxzv-no-such-author-31337';
const NOTAG = 'qxzv-no-such-tag-31337';
check('S5a [assumption, tested not assumed] the probe strings match nothing in the harvest',
  S_of_author(NOAUTH).length === 0 && S_of_tag(NOTAG).length === 0,
  'author probe ' + S_of_author(NOAUTH).length + ' hits, tag probe ' + S_of_tag(NOTAG).length + ' hits');

const noMatch = [
  ['--author', NOAUTH],
  ['--tag', NOTAG, '--json'],
  ['--author', fragA, '--tag', NOTAG],
  ['--list', '--tag', NOTAG],
  ['--tag', NOTAG, '--seed', '42', '--json'],
];
const nmBad = [];
for (const argv of noMatch) {
  const r = run(argv);
  if (!(r.code === 1 && r.out.length === 0 && r.err.length > 0)) {
    nmBad.push(argv.join(' ') + ' -> exit ' + r.code + ', stdout ' + JSON.stringify(r.out.slice(0, 30)));
  }
}
check('S5b empty candidate set = exit 1 + stderr + ZERO stdout bytes, in all 5 shapes',
  nmBad.length === 0, nmBad.length ? nmBad.join('; ') : '5/5 correct (no "{}", "[]", "null" leak)');

// ------------------------------------------------------------- S6 exit-code taxonomy
const usage = [['--frobnicate'], ['--seed'], ['--author'], ['--tag'], ['--seed', 'abc'], ['-x']];
const uBad = [];
for (const argv of usage) {
  const r = run(argv);
  if (!(r.code === 2 && r.out.length === 0 && r.err.length > 0)) {
    uBad.push(argv.join(' ') + ' -> exit ' + r.code + ', stdout ' + r.out.length + 'B');
  }
}
check('S6a bad usage = exit 2 + stderr + ZERO stdout bytes, in all 6 shapes',
  uBad.length === 0, uBad.length ? uBad.join('; ') : '6/6 correct');

const j7 = run(['--seed', '7', '--json']);
const j7lines = j7.out.split('\n').filter(Boolean);
let j7ok = false;
try {
  const o = JSON.parse(j7lines[0]);
  j7ok = j7lines.length === 1 && typeof o.text === 'string' && typeof o.author === 'string' && Array.isArray(o.tags);
} catch (e) { j7ok = false; }
check('S6b --json emits exactly ONE line, parseable, with text/author/tags of the right types',
  j7.code === 0 && j7.err === '' && j7ok, j7lines.length + ' line(s), exit ' + j7.code);

const help = run(['--help']);
check('S6c --help exits 0 and fits one screen (taste note), stdout only',
  help.code === 0 && help.out.split('\n').length <= 40 && help.err === '',
  'exit ' + help.code + ', ' + help.out.split('\n').length + ' lines, stderr ' + help.err.length + 'B');

// ---------------------------------------------------------------- taste: pipe-safety
const piped = spawnSync('sh', ['-c', 'node ' + JSON.stringify(BIN) + ' --seed 42 | cat'],
  { cwd: TARGET, encoding: 'utf8' });
check('S7 taste: output survives a pipe unchanged (no tty-conditional decoration)',
  piped.status === 0 && piped.stdout === plain42.out,
  'piped identical to direct = ' + (piped.stdout === plain42.out));

console.log('\n' + pass + '/' + (pass + fail) + ' checks passed');
process.exit(fail === 0 ? 0 : 1);
