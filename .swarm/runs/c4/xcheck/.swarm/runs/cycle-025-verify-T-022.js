#!/usr/bin/env node
'use strict';
// Cycle 25 CONDUCTOR VERIFICATION GATE for T-022.
// Authored AT VERIFICATION TIME, after the builder returned, and never shown
// to the builder. The builder saw only the acceptance clause and the two
// baseline rewordings B1/B2; every NOVEL and every R-pair mutation below is
// one it did not have available.
//
// Claim under test: the band-heading count parser now tolerates a descriptive
// lead-in before the "N tags" count, WITHOUT going quiet on a wrong count and
// WITHOUT being keyed to any particular lead-in wording.
//
// Every mutation runs in its own whole-repo-minus-.git copy under os.tmpdir().

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c25-verify-'));
const TESTFILE = 'test/readme-tags.test.js';
const TARGET_TEST = 'README band table headings must state the correct count of tags in their band';

const H5 = '4 tags have a robust pool (5+ entries):';
const H24 = '12 tags appear 2–4 times:';

let pass = 0, fail = 0;
const failures = [];
function check(id, desc, ok, detail) {
  if (ok) pass++; else { fail++; failures.push(id + ': ' + desc + (detail ? ' :: ' + detail : '')); }
  console.log((ok ? 'PASS  ' : 'FAIL  ') + id.padEnd(22) + ' ' + (detail || desc));
}

function copyRepo(label, useHeadTests) {
  const dst = path.join(root, label);
  fs.mkdirSync(dst, { recursive: true });
  execSync('tar -C ' + SRC + ' --exclude=.git --exclude=.swarm -cf - . | tar -C ' + dst + ' -xf -');
  if (useHeadTests) {
    // restore the PRE-FIX version of the test file from git HEAD -- this is
    // how each reading is attributed to the change rather than assumed.
    const head = execSync('git -C ' + SRC + ' show HEAD:' + TESTFILE, { encoding: 'utf8', maxBuffer: 1 << 24 });
    fs.writeFileSync(path.join(dst, TESTFILE), head);
  }
  return dst;
}

function runSuite(dir) {
  let out;
  try {
    out = execFileSync('bash', ['-c', 'node --test --test-reporter=tap test/*.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  const tests = g(/^# tests (\d+)$/m), p = g(/^# pass (\d+)$/m), f = g(/^# fail (\d+)$/m);
  if (tests === null || p === null || f === null) return { parsed: false, raw: out.slice(-600) };
  const names = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^not ok \d+ - (.*)$/);
    if (m) names.push(m[1].trim());
  }
  // NOTE (instrument repair, first gate run): the pre-fix HEAD message is
  // 'could not parse a leading "N tags" count ...' and the post-fix message is
  // 'could not parse a "N tags" count (distinct from ...)'. The first version
  // of this matcher was keyed to the post-fix wording only, so every HEAD-side
  // reading came back reason-less and four ATTRIB checks failed on the
  // INSTRUMENT rather than on the readings (which were 73/72/1 either way).
  // Matching both wordings; the readings themselves are unchanged.
  let why = '';
  if (/could not parse a(?: leading)? "N tags" count/.test(out)) why = 'PARSE-FAILURE';
  else if (/but the corpus has \d+ tags with count in/.test(out)) why = 'COUNT-MISMATCH';
  return { parsed: true, tests, pass: p, fail: f, names, why, out };
}

function fmt(r) {
  return r.parsed ? ('tests ' + r.tests + ' pass ' + r.pass + ' fail ' + r.fail + (r.why ? ' [' + r.why + ']' : '') +
                     (r.names.length ? ' :: failing=' + JSON.stringify(r.names) : ''))
                  : 'UNPARSEABLE ' + r.raw;
}
// green = suite fully passes
function green(r) { return r.parsed && r.fail === 0; }
// killedByTargetAlone = exactly one failure, and it is the guard under test
function killedByTargetAlone(r) { return r.parsed && r.fail === 1 && r.names.length === 1 && r.names[0] === TARGET_TEST; }

// apply a README edit to a copy; throws if the literal is absent (a mutation
// that silently fails to apply makes any SURVIVED verdict vacuous)
function readme(dir, fn) {
  const p = path.join(dir, 'README.md');
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) throw new Error('mutation did not apply in ' + dir);
  fs.writeFileSync(p, after);
}
function sub(from, to) {
  return (t) => { if (!t.includes(from)) throw new Error('literal absent: ' + from); return t.replace(from, to); };
}

// ---------------------------------------------------------------------------
console.log('=== CONTROLS ===');

{
  const r = runSuite(copyRepo('pristine'));
  check('G0.PRISTINE', 'working tree as the builder left it is fully green', green(r) && r.tests === 73, fmt(r));
}
{
  const r = runSuite(copyRepo('head', true));
  check('G0b.HEAD-GREEN', 'pre-fix HEAD is also green (same test count -- nothing added or removed)',
    green(r) && r.tests === 73, fmt(r) + ' (HEAD test file)');
}
{
  // the guard must not have been quietly disarmed: an unrelated, definitely-wrong
  // README number must still be caught by the suite
  const d = copyRepo('sanity');
  readme(d, sub('| `design` | 13 |', '| `design` | 11 |'));
  const r = runSuite(d);
  check('G0c.SUITE-LIVE', 'an unrelated wrong README number is still caught', r.parsed && r.fail > 0, fmt(r));
}

console.log('');
console.log('=== ACCEPTANCE, GREEN HALF: honest rewordings must no longer be rejected ===');

const rewords = [
  ['A1', 'B1 -- lead-in, 5+ heading (the builder saw this one)', H5, 'Well-populated: 4 tags carry 5+ entries each.'],
  ['A2', 'B2 -- lead-in, 2-4 heading (the builder saw this one)', H24, 'Mid-range: 12 tags land in the 2-4 band.'],
  ['A3', 'NOVEL -- em-dash aside, no colon, count mid-sentence', H5, 'Tags with a robust pool — 4 tags — carry 5+ entries.'],
  ['A4', 'NOVEL -- lead-in that itself contains a digit', H24, 'Of the 50 corpus entries, 12 tags land in the 2-4 band.'],
  ['A5', 'NOVEL -- both headings reworded at once, wholly different prose', null, null],
];

for (const [id, desc, from, to] of rewords) {
  if (id === 'A5') continue;
  const d = copyRepo('green-' + id);
  readme(d, sub(from, to));
  const r = runSuite(d);
  check(id + '.GREEN', desc, green(r), fmt(r) + ' :: ' + JSON.stringify(to));
  // attribution: the SAME mutation against the pre-fix test file must be REJECTED
  const dh = copyRepo('green-head-' + id, true);
  readme(dh, sub(from, to));
  const rh = runSuite(dh);
  check(id + '.ATTRIB', 'same reword against PRE-FIX HEAD is rejected -- the fix is what made it green',
    killedByTargetAlone(rh) && rh.why === 'PARSE-FAILURE', fmt(rh) + ' (HEAD test file)');
}

{
  const d = copyRepo('green-A5');
  readme(d, sub(H5, 'A robust pool of 5+ entries backs 4 tags in this corpus.'));
  readme(d, sub(H24, 'Sitting in the 2-4 band, 12 tags are neither rare nor common.'));
  const r = runSuite(d);
  check('A5.GREEN', 'NOVEL -- both headings reworded, count AFTER the band token in one of them', green(r), fmt(r));
  const dh = copyRepo('green-A5-head', true);
  readme(dh, sub(H5, 'A robust pool of 5+ entries backs 4 tags in this corpus.'));
  readme(dh, sub(H24, 'Sitting in the 2-4 band, 12 tags are neither rare nor common.'));
  const rh = runSuite(dh);
  check('A5.ATTRIB', 'same pair against PRE-FIX HEAD is rejected', rh.parsed && rh.fail > 0, fmt(rh) + ' (HEAD test file)');
}

console.log('');
console.log('=== ACCEPTANCE, RED HALF: a wrong count must still fail, and for the RIGHT reason ===');

const wrongs = [
  ['A6', 'wrong count, heading format UNCHANGED', H5, '7 tags have a robust pool (5+ entries):'],
  ['A7', 'wrong count UNDER a lead-in reword', H5, 'Well-populated: 7 tags carry 5+ entries each.'],
  ['A8', 'wrong count under the NOVEL em-dash reword', H5, 'Tags with a robust pool — 9 tags — carry 5+ entries.'],
  ['A9', 'wrong count under the NOVEL 2-4 reword', H24, 'Of the 50 corpus entries, 5 tags land in the 2-4 band.'],
];
for (const [id, desc, from, to] of wrongs) {
  const d = copyRepo('red-' + id);
  readme(d, sub(from, to));
  const r = runSuite(d);
  check(id + '.FAILABLE', desc + ' -- fails naming the guard ALONE', killedByTargetAlone(r), fmt(r));
  check(id + '.REASON', desc + ' -- fails on a COUNT COMPARISON, not a parse error',
    r.why === 'COUNT-MISMATCH', 'reason=' + (r.why || 'none'));
}

console.log('');
console.log('=== CLAUSE 4: still LOUD when it genuinely cannot find a count ===');

{
  const d = copyRepo('loud-A10');
  readme(d, sub(H5, 'Robust pool (5+ entries):'));
  const r = runSuite(d);
  check('A10.LOUD', 'band token + table but NO "N tags" phrase anywhere -> asserts, never silent',
    killedByTargetAlone(r) && r.why === 'PARSE-FAILURE', fmt(r));
}
{
  // the sharpest form: the ONLY "N tags"-shaped match in the line is the band
  // token's own trailing digit. The overlap exclusion must remove it AND then
  // still fail loud rather than pass with nothing to check.
  const d = copyRepo('loud-A11');
  readme(d, sub(H24, 'Tags in the 2-4 tags range are listed here:'));
  const r = runSuite(d);
  check('A11.LOUD-OVERLAP', 'only candidate count overlaps the band token -> excluded, then LOUD',
    killedByTargetAlone(r) && r.why === 'PARSE-FAILURE', fmt(r));
  const dh = copyRepo('loud-A11-head', true);
  readme(dh, sub(H24, 'Tags in the 2-4 tags range are listed here:'));
  const rh = runSuite(dh);
  check('A11.CONTRAST', 'pre-fix HEAD also rejects it (a loud reading, unchanged by the fix)',
    rh.parsed && rh.fail > 0, fmt(rh) + ' (HEAD test file)');
}

console.log('');
console.log('=== R1 DISCRIMINATOR: the expected count still tracks the CORPUS, under rewording ===');
// A parser that satisfied every check above by hardcoding "4" and "12", or by
// reading the count back out of the table it is supposed to be checking, dies
// here. The corpus is changed so a band count genuinely becomes 13, and the
// README is reworded AND updated consistently.

function corpusAddYagni(dir) {
  const p = path.join(dir, 'src', 'corpus.js');
  const before = fs.readFileSync(p, 'utf8');
  const marker = 'tags: [';
  const idx = before.indexOf(marker);
  if (idx < 0) throw new Error('corpusAddYagni: no tags array found');
  const cut = idx + marker.length;
  fs.writeFileSync(p, before.slice(0, cut) + "'yagni', " + before.slice(cut));
  const mod = path.join(dir, 'src', 'corpus.js');
  delete require.cache[require.resolve(mod)];
  const { corpus } = require(mod);
  const counts = {};
  for (const e of corpus) for (const t of e.tags) counts[t] = (counts[t] || 0) + 1;
  return counts;
}

{
  const d = copyRepo('R1-tracks');
  const counts = corpusAddYagni(d);
  check('R1.APPLIED', 'corpus mutation promoted `yagni` 1 -> 2 and moved nothing else',
    counts.yagni === 2 && counts.design === 13 && Object.keys(counts).filter(t => counts[t] >= 2).length === 17,
    'yagni=' + counts.yagni + ' multi-entry tags=' + Object.keys(counts).filter(t => counts[t] >= 2).length + ' (was 16)');
  // README updated consistently AND reworded at the same time
  readme(d, sub('16 tags appear on 2 or more entries; the remaining 21 appear on exactly one entry.',
                '17 tags appear on 2 or more entries; the remaining 20 appear on exactly one entry.'));
  readme(d, sub(H24, 'Mid-range, neither rare nor common: 13 tags land in the 2-4 band.'));
  readme(d, sub(H5, 'Well-populated: 4 tags carry 5+ entries each.'));
  readme(d, sub('| `testing` | 2 |', '| `testing` | 2 |\n| `yagni` | 2 |'));
  readme(d, sub('The remaining 21 tags appear exactly once:', 'The remaining 20 tags appear exactly once:'));
  readme(d, sub(', `yagni`.', '.'));
  const r = runSuite(d);
  check('R1.TRACKS', 'corpus + REWORDED README changed together and consistently -> GREEN', green(r), fmt(r));
}
{
  const d = copyRepo('R1-stale');
  corpusAddYagni(d);
  // reworded heading, but the count left STALE at 12 while the corpus says 13
  readme(d, sub(H24, 'Mid-range, neither rare nor common: 12 tags land in the 2-4 band.'));
  const r = runSuite(d);
  const named = r.parsed && r.names.includes(TARGET_TEST);
  check('R1.STALE', 'same corpus change, reworded heading, STALE count -> guard fires',
    named && r.why === 'COUNT-MISMATCH', fmt(r) + ' :: guard named=' + named);
}

console.log('');
console.log('=== R2 DISCRIMINATOR: a THREE-band layout this repo has never had, reworded ===');
// T-007 (retagging) is live on the backlog and could legitimately change the
// number of bands. A guard that assumes today's two bands would fire on a
// CORRECT README -- a false rejection a maintainer resolves by deleting it.

function threeBandReworded(text) {
  const old5plus = [
    H5,
    '| Tag | Count |', '|---|---|',
    '| `design` | 13 |', '| `simplicity` | 10 |', '| `humor` | 9 |', '| `debugging` | 5 |',
  ].join('\n');
  const new3 = [
    'The deepest pools: 2 tags carry 10+ entries.',
    '| Tag | Count |', '|---|---|',
    '| `design` | 13 |', '| `simplicity` | 10 |',
    '',
    'Solidly stocked — 2 tags appear 5–9 times.',
    '| Tag | Count |', '|---|---|',
    '| `humor` | 9 |', '| `debugging` | 5 |',
  ].join('\n');
  if (!text.includes(old5plus)) throw new Error('threeBandReworded: 5+ block not found verbatim');
  return text.replace(old5plus, new3);
}

{
  const d = copyRepo('R2-tracks');
  readme(d, threeBandReworded);
  readme(d, sub(H24, 'Mid-range: 12 tags land in the 2-4 band.'));
  const r = runSuite(d);
  check('R2.TRACKS', 'three reworded bands, every stated fact TRUE -> not falsely rejected', green(r), fmt(r));
  const dh = copyRepo('R2-head', true);
  readme(dh, threeBandReworded);
  readme(dh, sub(H24, 'Mid-range: 12 tags land in the 2-4 band.'));
  const rh = runSuite(dh);
  check('R2.ATTRIB', 'the same three-band layout against PRE-FIX HEAD is rejected', rh.parsed && rh.fail > 0, fmt(rh) + ' (HEAD test file)');
}
{
  const d = copyRepo('R2-wrong');
  readme(d, threeBandReworded);
  readme(d, sub(H24, 'Mid-range: 12 tags land in the 2-4 band.'));
  // wrong count on the MIDDLE band of a three-band layout -- a band position
  // that does not exist in this repo today
  readme(d, sub('Solidly stocked — 2 tags appear 5–9 times.', 'Solidly stocked — 6 tags appear 5–9 times.'));
  const r = runSuite(d);
  check('R2.FAILABLE', 'wrong count on the MIDDLE reworded band -> fails naming the guard ALONE',
    killedByTargetAlone(r) && r.why === 'COUNT-MISMATCH', fmt(r));
}

console.log('');
console.log('=== RESIDUAL PROBE: a lead-in that carries its own "N tags" phrase ===');
// Not an acceptance clause -- measured to find out where the fix's edge now
// sits, so the residual is FILED rather than discovered by a maintainer.
{
  const d = copyRepo('resid');
  readme(d, sub(H5, 'Of 37 tags, 4 tags carry 5+ entries each.'));
  const r = runSuite(d);
  console.log('      probe: lead-in contains "37 tags" (true) before the real count "4 tags" -> ' + fmt(r));
  console.log('      verdict: ' + (green(r) ? 'tolerated' : 'FALSE REJECTION -- residual, file it'));
}

console.log('');
console.log('=== SCOPE ===');
{
  const changed = execSync('git -C ' + SRC + ' status --porcelain', { encoding: 'utf8' })
    .split('\n').filter(Boolean).map(l => l.slice(3).trim())
    .filter(f => !f.startsWith('.swarm/'));
  check('S1.ONE-FILE', 'exactly one non-.swarm file modified', changed.length === 1 && changed[0] === TESTFILE,
    JSON.stringify(changed));
  let identical = [];
  for (const f of ['README.md', 'src/corpus.js', 'src/args.js', 'src/select.js', 'bin/aphorism.js',
                   'test/args.test.js', 'test/cli.test.js', 'test/select.test.js',
                   'docs/corpus-attribution-triage.md']) {
    const head = execSync('git -C ' + SRC + ' show HEAD:' + f, { encoding: 'utf8', maxBuffer: 1 << 24 });
    if (head === fs.readFileSync(path.join(SRC, f), 'utf8')) identical.push(f);
  }
  check('S2.PRODUCT-INTACT', 'every product/doc/other-test file byte-identical to HEAD', identical.length === 9,
    identical.length + '/9 byte-identical');
  const diffstat = execSync('git -C ' + SRC + ' diff --numstat -- ' + TESTFILE, { encoding: 'utf8' }).trim();
  check('S3.DIFFSTAT', 'change is small and confined', /^\d+\s+\d+\s+/.test(diffstat), diffstat);
  const scratch = path.join(SRC, '.swarm', 'scratch');
  check('S4.SCRATCH', 'builder left no scratch directory behind (KI-7)', !fs.existsSync(scratch),
    fs.existsSync(scratch) ? 'STILL PRESENT: ' + fs.readdirSync(scratch).join(',') : 'absent');
  const swarmDirt = execSync("git -C /opt/swarm status --porcelain | grep -v '^.. runs/' || true", { encoding: 'utf8' }).trim();
  check('S5.FENCE', 'no builder debris inside the SWARM write fence', swarmDirt === '', swarmDirt || 'clean');
}

console.log('');
console.log('root: ' + root);
console.log('RESULT: ' + pass + '/' + (pass + fail) + ' checks passed');
for (const f of failures) console.log('  FAILED ' + f);
