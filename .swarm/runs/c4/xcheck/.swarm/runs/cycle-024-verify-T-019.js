#!/usr/bin/env node
'use strict';
// Cycle 24 CONDUCTOR VERIFICATION GATE for T-019.
// Authored at verification time. The builder never saw any of these checks
// or mutations. Every mutation runs in its own whole-repo-minus-.git copy
// under os.tmpdir(); the working tree is never touched.
//
// Baseline facts established BEFORE dispatch (.swarm/runs/cycle-024-baseline.txt):
//   pre-cycle suite = 72/72/0; deleting either band table alone SURVIVED.
//
// The acceptance clause is "deleting an entire band table fails the suite,
// proven failable and attributable". The checks that decide the item are
// A3/A4 (that clause, re-measured independently) and the R-pairs, which are
// the only form that separates a CORPUS-DERIVED guard from one hardcoding
// today's two bands and today's 16 multi-entry tags.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const NEWTEST = 'no band table may be deleted wholesale';
const PRE_CYCLE_BASELINE = 72;
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c24-gate-'));

let n = 0, bad = 0;
function check(id, desc, ok, detail) {
  n++; if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}`);
  if (detail) console.log(`        ${detail}`);
}

function copyRepo(label) {
  const dst = path.join(root, label);
  fs.mkdirSync(dst, { recursive: true });
  execSync(`tar -C ${SRC} --exclude=.git --exclude=.swarm -cf - . | tar -C ${dst} -xf -`);
  return dst;
}

function runSuite(dir, skipPattern) {
  const cmd = skipPattern
    ? `node --test --test-reporter=tap --test-skip-pattern=${JSON.stringify(skipPattern)} test/*.test.js`
    : 'node --test --test-reporter=tap test/*.test.js';
  let out;
  try {
    out = execFileSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const tests = g(/^# tests (\d+)$/m), pass = g(/^# pass (\d+)$/m), fail = g(/^# fail (\d+)$/m);
  if (tests === null || pass === null || fail === null) return { parsed: false, raw: out.slice(-1200) };
  const names = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^not ok \d+ - (.*)$/);
    if (m) names.push(m[1].trim());
  }
  const msgs = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*error:\s*'(.*)'\s*$/);
    if (m) msgs.push(m[1]);
  }
  return { parsed: true, tests, pass, fail, names, msgs, raw: out };
}

function fmt(r) { return r.parsed ? `tests ${r.tests} pass ${r.pass} fail ${r.fail}` : 'UNPARSEABLE'; }
function namesT019(r) { return r.parsed && r.names.some((x) => x.includes(NEWTEST)); }
function onlyT019(r) { return r.parsed && r.fail === 1 && namesT019(r); }

const README = path.join(SRC, 'README.md');
const readmeHead = fs.readFileSync(README, 'utf8');

// --- README mutation helpers -------------------------------------------------
function deleteBand(text, headingRe) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) throw new Error('deleteBand: heading not found ' + headingRe);
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  if (lines[end] === '') end++;
  return lines.slice(0, start).concat(lines.slice(end)).join('\n');
}

// Restructure today's two bands (5+, 2-4) into THREE bands (10+, 5-9, 2-4).
// Corpus is untouched; every stated fact stays true. This is a layout that
// does NOT exist in the repo today -- it is what a retagging (T-007) could
// plausibly produce -- so a guard hardcoding "there is a 5+ band and a 2-4
// band" fires here on a CORRECT README.
function threeBand(text) {
  const old5plus = [
    '4 tags have a robust pool (5+ entries):',
    '| Tag | Count |', '|---|---|',
    '| `design` | 13 |', '| `simplicity` | 10 |', '| `humor` | 9 |', '| `debugging` | 5 |',
  ].join('\n');
  const new3 = [
    '2 tags have a robust pool (10+ entries):',
    '| Tag | Count |', '|---|---|',
    '| `design` | 13 |', '| `simplicity` | 10 |',
    '',
    '2 tags appear 5–9 times:',
    '| Tag | Count |', '|---|---|',
    '| `humor` | 9 |', '| `debugging` | 5 |',
  ].join('\n');
  if (!text.includes(old5plus)) throw new Error('threeBand: 5+ block not found verbatim');
  return text.replace(old5plus, new3);
}

// --- corpus mutation: promote a single-entry tag to a multi-entry one --------
// `yagni` currently appears on exactly 1 entry. Adding it to one more entry
// makes it a 2-entry tag, so the README must grow a band row for it. A guard
// that hardcodes today's 16-tag union cannot survive the consistent half.
function corpusAddYagni(dir) {
  const p = path.join(dir, 'src', 'corpus.js');
  const before = fs.readFileSync(p, 'utf8');
  const marker = 'tags: [';
  const idx = before.indexOf(marker);
  if (idx < 0) throw new Error('corpusAddYagni: no tags array found');
  const cut = idx + marker.length;
  const after = before.slice(0, cut) + "'yagni', " + before.slice(cut);
  fs.writeFileSync(p, after);
  delete require.cache[require.resolve(path.join(dir, 'src', 'corpus.js'))];
  const { corpus } = require(path.join(dir, 'src', 'corpus.js'));
  const counts = {};
  for (const e of corpus) for (const t of e.tags) counts[t] = (counts[t] || 0) + 1;
  return counts;
}

function readmeConsistentForYagni(text) {
  let t = text;
  t = t.replace(
    '16 tags appear on 2 or more entries; the remaining 21 appear on exactly one entry.',
    '17 tags appear on 2 or more entries; the remaining 20 appear on exactly one entry.');
  t = t.replace('12 tags appear 2–4 times:', '13 tags appear 2–4 times:');
  t = t.replace('| `testing` | 2 |', '| `testing` | 2 |\n| `yagni` | 2 |');
  t = t.replace('The remaining 21 tags appear exactly once:', 'The remaining 20 tags appear exactly once:');
  t = t.replace(', `yagni`.', '.');
  return t;
}

console.log('=== CONTROLS ===');

// G0 PRISTINE: the working tree as the builder left it.
{
  const d = copyRepo('pristine');
  const r = runSuite(d);
  check('G0.PRISTINE', 'unmutated working-tree copy is fully green',
    r.parsed && r.fail === 0 && r.tests === PRE_CYCLE_BASELINE + 1, fmt(r));
}

// G0b DENOMINATOR: the skip pattern must remove EXACTLY the one new test.
{
  const d = copyRepo('denom');
  const r = runSuite(d, NEWTEST);
  check('G0b.DENOMINATOR', `skip pattern removes exactly 1 test, leaving the ${PRE_CYCLE_BASELINE}-test baseline green`,
    r.parsed && r.tests === PRE_CYCLE_BASELINE && r.fail === 0, fmt(r));
}

// G0c SKIP-SANITY: the pattern must not be silently disabling the whole run.
{
  const d = copyRepo('skipsanity');
  const p = path.join(d, 'README.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('| `performance` | 4 |', '| `performance` | 7 |'));
  const r = runSuite(d, NEWTEST);
  check('G0c.SKIP-SANITY', 'an unrelated breaking mutation still fails under the same skip pattern',
    r.parsed && r.fail > 0, `${fmt(r)} :: ${r.names.join(' | ')}`);
}

console.log('');
console.log('=== ACCEPTANCE: deleting an entire band table must fail, failable + attributable ===');

// A3 / A4: the acceptance clause, re-measured independently of the builder's report.
for (const [id, label, re] of [
  ['A3', 'the 2–4 band table', /^12 tags appear 2–4 times:$/],
  ['A4', 'the 5+ band table', /^4 tags have a robust pool \(5\+ entries\):$/],
]) {
  const d = copyRepo(id.toLowerCase());
  const p = path.join(d, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const after = deleteBand(before, re);
  fs.writeFileSync(p, after);
  check(`${id}.APPLIED`, `${label} really was removed (heading + rows)`,
    after !== before && after.split('\n').length < before.split('\n').length,
    `${before.split('\n').length} -> ${after.split('\n').length} lines`);

  const f = runSuite(d);
  check(`${id}.FAILABLE`, `deleting ${label} fails the suite, naming T-019 and nothing else`,
    onlyT019(f), `${fmt(f)} :: ${f.names.join(' | ')}`);
  if (f.parsed && f.msgs.length) console.log(`        message: ${f.msgs[0].slice(0, 160)}`);

  const a = runSuite(d, NEWTEST);
  check(`${id}.ATTRIBUTABLE`, `with T-019 filtered out, the same deletion SURVIVES at the pre-cycle baseline`,
    a.parsed && a.tests === PRE_CYCLE_BASELINE && a.pass === PRE_CYCLE_BASELINE && a.fail === 0, fmt(a));
}

console.log('');
console.log('=== R1: corpus-derived, not a hardcoded 16-tag union (TRACKS / STALE pair) ===');

// R1-TRACKS: corpus and README change TOGETHER and consistently -> must stay GREEN.
{
  const d = copyRepo('r1tracks');
  const counts = corpusAddYagni(d);
  const p = path.join(d, 'README.md');
  fs.writeFileSync(p, readmeConsistentForYagni(fs.readFileSync(p, 'utf8')));
  const multi = Object.keys(counts).filter((t) => counts[t] >= 2).length;
  check('R1.APPLIED', 'corpus mutation promoted `yagni` 1 -> 2 and moved nothing else',
    counts.yagni === 2 && multi === 17 && counts.design === 13 && counts.testing === 2,
    `yagni=${counts.yagni} multi-entry tags=${multi} (was 16)`);
  const r = runSuite(d);
  check('R1.TRACKS', 'corpus + README changed together and consistently stays GREEN',
    r.parsed && r.fail === 0, `${fmt(r)} :: ${r.names.join(' | ')}`);
}

// R1-STALE: same corpus change, README left untouched -> must FAIL, naming T-019.
{
  const d = copyRepo('r1stale');
  corpusAddYagni(d);
  const r = runSuite(d);
  check('R1.STALE', 'same corpus change with a stale README fails, and T-019 is among the failures',
    r.parsed && r.fail > 0 && namesT019(r), `${fmt(r)} :: ${r.names.join(' | ')}`);
}

console.log('');
console.log('=== R2: not hardcoded to today\'s TWO bands (the T-007 false-rejection risk) ===');

// R2-TRACKS: a THREE-band layout that does not exist in the repo today.
// Every stated fact stays true and the corpus is untouched -> must stay GREEN.
{
  const d = copyRepo('r2tracks');
  const p = path.join(d, 'README.md');
  const after = threeBand(fs.readFileSync(p, 'utf8'));
  fs.writeFileSync(p, after);
  check('R2.APPLIED', 'README restructured from 2 band tables to 3, corpus untouched',
    /10\+ entries/.test(after) && /5–9 times/.test(after) && /2–4 times/.test(after)
      && !/robust pool \(5\+ entries\)/.test(after),
    'bands now: 10+, 5–9, 2–4');
  const r = runSuite(d);
  check('R2.TRACKS', 'a correct THREE-band README is NOT falsely rejected',
    r.parsed && r.fail === 0, `${fmt(r)} :: ${r.names.join(' | ')}`);
}

// R2-KILL: delete the MIDDLE band of that three-band layout. This is the
// mutation the builder never had available -- it strands only humor+debugging
// while two other band tables remain, so bands.length is 2 and the pre-existing
// zero-band sanity assertion cannot fire.
{
  const d = copyRepo('r2kill');
  const p = path.join(d, 'README.md');
  const three = threeBand(fs.readFileSync(p, 'utf8'));
  const after = deleteBand(three, /^2 tags appear 5–9 times:$/);
  fs.writeFileSync(p, after);
  check('R2.APPLIED-KILL', 'middle band deleted; two band tables still present',
    !/5–9 times/.test(after) && /10\+ entries/.test(after) && /2–4 times/.test(after)
      && !/\| `humor` \| 9 \|/.test(after));
  const f = runSuite(d);
  check('R2.FAILABLE', 'deleting the MIDDLE of three bands fails, naming T-019 and nothing else',
    onlyT019(f), `${fmt(f)} :: ${f.names.join(' | ')}`);
  const a = runSuite(d, NEWTEST);
  check('R2.ATTRIBUTABLE', 'with T-019 filtered, the middle-band deletion SURVIVES at the baseline',
    a.parsed && a.tests === PRE_CYCLE_BASELINE && a.fail === 0, fmt(a));
}

console.log('');
console.log('=== R3: T-012 hazard — not keyed to lead-in prose ===');

// R3-GREEN: reword every band lead-in, digits and rows intact -> must stay GREEN.
{
  const d = copyRepo('r3green');
  const p = path.join(d, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace('4 tags have a robust pool (5+ entries):', 'Well-populated: 4 tags carry 5+ entries each.');
  t = t.replace('12 tags appear 2–4 times:', 'Mid-range: 12 tags land in the 2–4 band.');
  fs.writeFileSync(p, t);
  const r = runSuite(d);
  check('R3.GREEN', 'both band lead-ins reworded (digits + rows intact) stays green',
    r.parsed && r.fail === 0, `${fmt(r)} :: ${r.names.join(' | ')}`);
}

// R3-KILL: the same reworded prose with a band deleted must STILL kill.
{
  const d = copyRepo('r3kill');
  const p = path.join(d, 'README.md');
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace('4 tags have a robust pool (5+ entries):', 'Well-populated: 4 tags carry 5+ entries each.');
  t = t.replace('12 tags appear 2–4 times:', 'Mid-range: 12 tags land in the 2–4 band.');
  t = deleteBand(t, /^Mid-range: 12 tags land in the 2–4 band\.$/);
  fs.writeFileSync(p, t);
  const r = runSuite(d);
  check('R3.KILL', 'reworded prose + deleted band still kills, naming T-019',
    r.parsed && r.fail > 0 && namesT019(r), `${fmt(r)} :: ${r.names.join(' | ')}`);
}

console.log('');
console.log('=== SCOPE ===');
{
  const names = execSync('git -C ' + SRC + ' diff --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  check('S1.SCOPE', 'exactly one tracked file modified',
    names.length === 1 && names[0] === 'test/readme-tags.test.js', names.join(', '));

  let clean = true; const moved = [];
  for (const f of ['README.md', 'src/corpus.js', 'src/args.js', 'src/select.js', 'bin/aphorism.js',
    'docs/corpus-attribution-triage.md']) {
    const head = execSync(`git -C ${SRC} show HEAD:${f}`, { encoding: 'buffer' });
    const now = fs.readFileSync(path.join(SRC, f));
    if (!head.equals(now)) { clean = false; moved.push(f); }
  }
  check('S2.PRODUCT-UNTOUCHED', 'README, corpus, parser, selector, entry point and triage doc byte-identical to HEAD',
    clean, moved.length ? 'MOVED: ' + moved.join(', ') : 'all 6 identical');

  check('S3.SCRATCH', 'no .swarm/scratch directory left behind (KI-7)',
    !fs.existsSync(path.join(SRC, '.swarm', 'scratch')));

  const insertions = execSync(`git -C ${SRC} diff --numstat -- test/readme-tags.test.js`, { encoding: 'utf8' }).trim();
  const [ins, del] = insertions.split(/\s+/);
  check('S4.PURE-INSERTION', 'the test file gained lines and lost none (no assertion weakened or deleted)',
    Number(del) === 0 && Number(ins) > 0, `+${ins} -${del}`);
}

console.log('');
console.log(`root: ${root}`);
console.log(`GATE: ${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
