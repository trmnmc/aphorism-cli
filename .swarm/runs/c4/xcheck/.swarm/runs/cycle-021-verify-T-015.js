#!/usr/bin/env node
// Cycle 21 VERIFICATION GATE for T-015. Conductor-authored AT VERIFICATION TIME.
// The builder never saw this file. Every mutation below uses numbers and directions
// the builder did not use; two checks (R2-TRACKS, N2/N3) test properties no acceptance
// clause mentions.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const SCRATCH = path.join(TARGET, '.swarm', 'scratch-c21-gate');
const NEW_TEST_NAMES = [
  'README band table headings must state the correct count of tags in their band',
  'README opening sentence must state correct multi-entry and single-entry tag counts',
];
// node --test-name-pattern is inclusive; to EXCLUDE the new tests we use --test-skip-pattern.
const SKIP_PATTERN = '(README band table headings must state|README opening sentence must state)';

let pass = 0, fail = 0;
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
function check(id, ok, detail) {
  if (ok) { pass++; say('PASS  ' + id.padEnd(16) + ' ' + detail); }
  else { fail++; say('FAIL  ' + id.padEnd(16) + ' ' + detail); }
}

function freshCopy(name) {
  const dest = path.join(SCRATCH, name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  execFileSync('bash', ['-c',
    'cd ' + JSON.stringify(TARGET) + ' && tar --exclude=.git --exclude=.swarm -cf - . | tar -xf - -C ' + JSON.stringify(dest)]);
  return dest;
}

function runSuite(dir, skipPattern) {
  const skip = skipPattern ? ' --test-skip-pattern=' + JSON.stringify(skipPattern) : '';
  const r = spawnSync('bash', ['-c',
    'cd ' + JSON.stringify(dir) + ' && node --test --test-reporter=tap' + skip + ' test/*.test.js 2>&1'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const t = /^# tests (\d+)$/m.exec(out);
  const p = /^# pass (\d+)$/m.exec(out);
  const f = /^# fail (\d+)$/m.exec(out);
  if (!t || !p || !f) return { parsed: false, raw: out.slice(-3000) };
  // Names of failing top-level tests, from TAP "not ok N - <name>" lines.
  const failing = [];
  const re = /^not ok \d+ - (.+)$/gm;
  let m;
  while ((m = re.exec(out)) !== null) failing.push(m[1].trim());
  return { parsed: true, tests: +t[1], pass: +p[1], fail: +f[1], failing };
}

function editReadme(dir, edits) {
  const rp = path.join(dir, 'README.md');
  let s = fs.readFileSync(rp, 'utf8');
  for (const [from, to] of edits) {
    if (!s.includes(from)) return { ok: false, missing: from };
    s = s.replace(from, to);
  }
  fs.writeFileSync(rp, s);
  return { ok: true };
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

say('CYCLE 21 VERIFICATION GATE — T-015');
say('conductor-authored at verification time; builder never saw these mutations');
say('');

// ---------------------------------------------------------------------------
// CONTROLS FIRST. Cycle 19's lesson: without a pristine control, a broken harness
// manufactures verdicts. Cycle 6's lesson: prove the skip pattern's denominator.
// ---------------------------------------------------------------------------
const pris = freshCopy('pristine');
const pr = runSuite(pris, null);
if (!pr.parsed) { say('CTRL-PRISTINE UNPARSEABLE — aborting, no verdict may be derived'); say(pr.raw); process.exit(2); }
check('CTRL-PRISTINE', pr.tests === 68 && pr.pass === 68 && pr.fail === 0,
  'unmutated copy: tests=' + pr.tests + ' pass=' + pr.pass + ' fail=' + pr.fail + ' (expect 68/68/0)');

const den = runSuite(pris, SKIP_PATTERN);
check('CTRL-DENOM', den.parsed && den.tests === 66 && den.fail === 0,
  'skip-pattern against PRISTINE removes exactly the 2 new tests: tests=' + den.tests +
  ' pass=' + den.pass + ' fail=' + den.fail + ' (expect 66/66/0 — the pre-cycle baseline)');

// SKIP-SANITY: the skip pattern must NOT silently disable everything. An unrelated
// mutation must still fail under the same pattern.
const sanity = freshCopy('sanity');
editReadme(sanity, [['contains 37 distinct tags', 'contains 38 distinct tags']]);
const sn = runSuite(sanity, SKIP_PATTERN);
check('CTRL-SKIPSANE', sn.parsed && sn.fail > 0,
  'unrelated mutation (37->38) still fails under the skip pattern: fail=' + sn.fail + ' (expect >0)');
say('');

// ---------------------------------------------------------------------------
// ACCEPTANCE: four claims, each FAILABLE and ATTRIBUTABLE.
// Conductor numbers, deliberately different from the builder's (99/88/77/55).
// A9 and A11 use OFF-BY-ONE errors — the hardest direction to catch and the one a
// sloppy substring/regex guard is most likely to miss. V6 uses a DECREASE.
// ---------------------------------------------------------------------------
const CLAIMS = [
  { id: 'A9',  edit: ['16 tags appear on 2 or more entries', '17 tags appear on 2 or more entries'],
    desc: 'line 55 multi-entry count 16 -> 17 (off-by-one, up)' },
  { id: 'V6',  edit: ['the remaining 21 appear on exactly one entry', 'the remaining 20 appear on exactly one entry'],
    desc: 'line 55 single-entry count 21 -> 20 (off-by-one, DOWN)' },
  { id: 'A10', edit: ['4 tags have a robust pool (5+ entries)', '3 tags have a robust pool (5+ entries)'],
    desc: 'line 57 band cardinality 4 -> 3 (off-by-one, down)' },
  { id: 'A11', edit: ['12 tags appear 2–4 times', '13 tags appear 2–4 times'],
    desc: 'line 65 band cardinality 12 -> 13 (off-by-one, up)' },
];

for (const c of CLAIMS) {
  const d1 = freshCopy(c.id + '-failable');
  const e1 = editReadme(d1, [c.edit]);
  if (!e1.ok) { check(c.id + '.APPLIED', false, 'anchor not found: ' + e1.missing); continue; }
  check(c.id + '.APPLIED', fs.readFileSync(path.join(d1, 'README.md'), 'utf8').includes(c.edit[1]),
    'mutation present in the copy (a mutation that fails to apply makes SURVIVED vacuous)');
  const r1 = runSuite(d1, null);
  const named = r1.parsed && r1.failing.some(n => NEW_TEST_NAMES.includes(n));
  check(c.id + '.FAILABLE', r1.parsed && r1.fail > 0 && named,
    c.desc + ' -> KILLED, fail=' + r1.fail + ', failing test is one of the NEW ones: ' +
    (r1.parsed ? JSON.stringify(r1.failing) : 'unparsed'));

  const d2 = freshCopy(c.id + '-attrib');
  editReadme(d2, [c.edit]);
  const r2 = runSuite(d2, SKIP_PATTERN);
  check(c.id + '.ATTRIB', r2.parsed && r2.tests === 66 && r2.fail === 0,
    'SAME mutation with the new tests filtered out must SURVIVE at the pre-cycle baseline: tests=' +
    r2.tests + ' pass=' + r2.pass + ' fail=' + r2.fail + ' (expect 66/66/0)');
}
say('');

// ---------------------------------------------------------------------------
// R1 — prose-keying (the T-012 hazard the item's notes forbid).
// Reword every lead-in in the section, digits intact. Must stay GREEN; and a wrong
// number UNDER the reworded prose must still be caught.
// ---------------------------------------------------------------------------
const REWORDS = [
  ['They are not evenly distributed:', 'The distribution is lumpy, as follows:'],
  ['4 tags have a robust pool (5+ entries):', '4 tags carry a deep bench (5+ entries):'],
  ['12 tags appear 2–4 times:', '12 tags crop up 2–4 times:'],
  ['The remaining 21 tags appear exactly once:', 'The other 21 tags appear exactly once:'],
];
const rw = freshCopy('reword');
const rwe = editReadme(rw, REWORDS);
if (!rwe.ok) {
  check('R1.NOFALSEREJECT', false, 'reword anchor not found: ' + rwe.missing);
} else {
  const r = runSuite(rw, null);
  check('R1.NOFALSEREJECT', r.parsed && r.fail === 0 && r.tests === 68,
    'all four lead-ins reworded, every digit intact: tests=' + r.tests + ' fail=' + r.fail +
    ' (expect 68/0 — a reword must not false-reject)' +
    (r.parsed && r.fail ? ' failing=' + JSON.stringify(r.failing) : ''));

  const rw2 = freshCopy('reword-plus-wrong');
  editReadme(rw2, REWORDS);
  const ok2 = editReadme(rw2, [['4 tags carry a deep bench (5+ entries)', '9 tags carry a deep bench (5+ entries)']]);
  const r2 = runSuite(rw2, null);
  const named2 = r2.parsed && r2.failing.some(n => NEW_TEST_NAMES.includes(n));
  check('R1.STILLKILLS', ok2.ok && r2.parsed && r2.fail > 0 && named2,
    'reworded prose + wrong band cardinality (4->9) still KILLED by a new test: fail=' + r2.fail +
    ' failing=' + (r2.parsed ? JSON.stringify(r2.failing) : 'unparsed'));
}
say('');

// ---------------------------------------------------------------------------
// R2 — THE HARDCODE DISCRIMINATOR. No acceptance clause asks for this.
// Mutate the CORPUS and update the README to the new TRUE numbers. A guard that
// derives its expectations from the corpus stays green. A guard that hardcodes
// 4/12 fails. This is the check that proves the guard survives T-007 (retagging),
// which is live on the backlog and is the whole reason this item is high value.
//
// Chosen mutation: give one entry the existing tag `performance`, taking it 4 -> 5.
// Consequences: 5+ band 4 -> 5 tags, 2-4 band 12 -> 11 tags, distinct stays 37,
// >=2 stays 16, ==1 stays 21. README is edited to match all of it.
// ---------------------------------------------------------------------------
const r2d = freshCopy('corpus-tracks');
const corpusPath = path.join(r2d, 'src', 'corpus.js');
{
  const { corpus } = require(corpusPath);
  const victim = corpus.findIndex(e => !e.tags.includes('performance'));
  const src = fs.readFileSync(corpusPath, 'utf8');
  // Rewrite the corpus file by regenerating the victim entry's tags array in place.
  const victimEntry = corpus[victim];
  const oldTags = JSON.stringify(victimEntry.tags).replace(/","/g, "', '").replace(/^\["/, "['").replace(/"\]$/, "']");
  const newTagsArr = victimEntry.tags.concat(['performance']);
  // Find the entry by its text and replace its tags: [...] array.
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entryRe = new RegExp('(text:\\s*[\'"`]' + esc(victimEntry.text) + '[\'"`][\\s\\S]{0,400}?tags:\\s*)\\[[^\\]]*\\]');
  const newSrc = src.replace(entryRe, '$1' + JSON.stringify(newTagsArr).replace(/"/g, "'"));
  const applied = newSrc !== src;
  fs.writeFileSync(corpusPath, newSrc);
  check('R2.APPLIED', applied,
    'corpus mutated: entry ' + victim + ' (' + victimEntry.text.slice(0, 40) + '...) gains tag `performance`, taking it 4 -> 5');

  // Re-derive the truth from the MUTATED corpus, independently.
  delete require.cache[require.resolve(corpusPath)];
  const { corpus: mc } = require(corpusPath);
  const cnt = {};
  for (const e of mc) for (const t of e.tags) cnt[t] = (cnt[t] || 0) + 1;
  const vals = Object.values(cnt);
  const truth = {
    distinct: vals.length, ge2: vals.filter(x => x >= 2).length,
    ge5: vals.filter(x => x >= 5).length, band24: vals.filter(x => x >= 2 && x <= 4).length,
    eq1: vals.filter(x => x === 1).length, perf: cnt['performance'],
  };
  check('R2.TRUTH', truth.perf === 5 && truth.ge5 === 5 && truth.band24 === 11 &&
        truth.ge2 === 16 && truth.eq1 === 21 && truth.distinct === 37,
    'mutated-corpus truth re-derived: performance=' + truth.perf + ' ge5=' + truth.ge5 +
    ' band2-4=' + truth.band24 + ' ge2=' + truth.ge2 + ' eq1=' + truth.eq1 + ' distinct=' + truth.distinct);

  // Now make the README TRUE again against the mutated corpus.
  const readmeEdits = [
    ['4 tags have a robust pool (5+ entries)', '5 tags have a robust pool (5+ entries)'],
    ['| `debugging` | 5 |', '| `debugging` | 5 |\n| `performance` | 5 |'],
    ['12 tags appear 2–4 times', '11 tags appear 2–4 times'],
    ['| `performance` | 4 |\n', ''],
  ];
  const re2 = editReadme(r2d, readmeEdits);
  check('R2.README', re2.ok, 'README updated to the mutated corpus truth' + (re2.ok ? '' : ' — MISSING: ' + re2.missing));

  const rr = runSuite(r2d, null);
  check('R2.TRACKS', rr.parsed && rr.fail === 0 && rr.tests === 68,
    'corpus + README changed CONSISTENTLY -> suite must be GREEN (a hardcoded 4/12 would fail here): tests=' +
    rr.tests + ' pass=' + rr.pass + ' fail=' + rr.fail +
    (rr.parsed && rr.fail ? ' failing=' + JSON.stringify(rr.failing) : ''));

  // And the paired half: mutated corpus with the README left STALE must be caught.
  const r2s = freshCopy('corpus-stale');
  fs.writeFileSync(path.join(r2s, 'src', 'corpus.js'), newSrc);
  const rs = runSuite(r2s, null);
  check('R2.STALEKILLS', rs.parsed && rs.fail > 0,
    'mutated corpus with a STALE README must be caught: fail=' + rs.fail +
    ' failing=' + (rs.parsed ? JSON.stringify(rs.failing) : 'unparsed'));
}
say('');

// ---------------------------------------------------------------------------
// CONDUCTOR-ORIGINAL PROBES. Nobody asked for these. They ask what ELSE the same
// blindness admits — the question that produced SPUR at cycle 20 and T-018.
// ---------------------------------------------------------------------------

// N1: a claim DELETED rather than made wrong. Constraint 3 says an unparsed claim
// must fail LOUD, never pass quiet.
const n1 = freshCopy('probe-deleted-claim');
const n1e = editReadme(n1, [['They are not evenly distributed: 16 tags appear on 2 or more entries; the remaining 21 appear on exactly one entry.', 'The distribution is uneven.']]);
if (!n1e.ok) { check('N1.PROBE', false, 'anchor not found: ' + n1e.missing); }
else {
  const r = runSuite(n1, null);
  check('N1.LOUD', r.parsed && r.fail > 0,
    'PROBE: whole line-55 claim sentence DELETED -> must fail LOUD (not pass quiet): fail=' + r.fail +
    ' failing=' + (r.parsed ? JSON.stringify(r.failing) : 'unparsed'));
}

// N2: an entire band table (heading + rows) deleted. The README simply stops claiming
// a band. Row-level set-equality (T-014) only inspects bands that are PRESENT.
const n2 = freshCopy('probe-deleted-band');
{
  const rp = path.join(n2, 'README.md');
  let s = fs.readFileSync(rp, 'utf8');
  const start = s.indexOf('12 tags appear 2–4 times:');
  const end = s.indexOf('The remaining 21 tags appear exactly once:');
  const applied = start > -1 && end > start;
  if (applied) { s = s.slice(0, start) + s.slice(end); fs.writeFileSync(rp, s); }
  const r = applied ? runSuite(n2, null) : null;
  check('N2.PROBE', applied, 'PROBE: entire "12 tags appear 2-4 times" band table removed from README');
  if (applied) {
    say('      -> tests=' + r.tests + ' pass=' + r.pass + ' fail=' + r.fail +
        ' verdict=' + (r.fail > 0 ? 'CAUGHT' : 'SURVIVES') +
        (r.fail ? ' failing=' + JSON.stringify(r.failing) : ''));
  }
}

// N3: does the line-55 "exactly one" guard actually discriminate from the line-81
// "exactly once" guard? Mutate ONLY line 81 and confirm the OLD test fires; the pair
// with V6 above (line 55 only -> a NEW test fires) proves the two are independent.
const n3 = freshCopy('probe-line81-only');
editReadme(n3, [['The remaining 21 tags appear exactly once', 'The remaining 19 tags appear exactly once']]);
{
  const r = runSuite(n3, null);
  const oldFired = r.parsed && r.failing.some(n => n === 'README must correctly describe single-entry tag count');
  const newQuiet = r.parsed && !r.failing.some(n => NEW_TEST_NAMES.includes(n));
  check('N3.DISCRIM', r.parsed && r.fail > 0 && oldFired && newQuiet,
    'line-81 phrasing mutated alone -> the PRE-EXISTING test fires and the new ones stay quiet ' +
    '(so the two statements of 21 are guarded independently, not by one regex catching both): failing=' +
    (r.parsed ? JSON.stringify(r.failing) : 'unparsed'));
}
say('');

// ---------------------------------------------------------------------------
// SCOPE. Reading the diff proves the agent changed what it was told; it cannot
// prove nothing ELSE moved. Measure it (cycle-8 precedent).
// ---------------------------------------------------------------------------
const names = execFileSync('bash', ['-c', 'cd ' + JSON.stringify(TARGET) + ' && git diff --name-only HEAD'], { encoding: 'utf8' }).trim();
check('SCOPE.FILES', names === 'test/readme-tags.test.js',
  'git diff --name-only HEAD = ' + JSON.stringify(names) + ' (expect test/readme-tags.test.js alone)');

const stat = execFileSync('bash', ['-c', 'cd ' + JSON.stringify(TARGET) + ' && git diff --numstat HEAD -- test/readme-tags.test.js'], { encoding: 'utf8' }).trim();
const nm = /^(\d+)\s+(\d+)/.exec(stat);
check('SCOPE.ADDITIVE', nm && nm[2] === '0',
  'purely additive: ' + (nm ? nm[1] + ' insertions, ' + nm[2] + ' deletions' : stat) + ' (expect 0 deletions)');

const headFile = execFileSync('bash', ['-c', 'cd ' + JSON.stringify(TARGET) + ' && git show HEAD:test/readme-tags.test.js'], { encoding: 'utf8' });
const nowFile = fs.readFileSync(path.join(TARGET, 'test', 'readme-tags.test.js'), 'utf8');
check('SCOPE.PREFIX', nowFile.startsWith(headFile.replace(/\s*$/, '')) || nowFile.startsWith(headFile),
  'every pre-existing byte is an unmodified PREFIX of the new file (no in-place edits to existing tests/helpers)');

check('SCOPE.SCRATCH', !fs.existsSync(path.join(TARGET, '.swarm', 'scratch')),
  'builder scratch dir removed: ' + !fs.existsSync(path.join(TARGET, '.swarm', 'scratch')));

say('');
say('=== ' + pass + ' pass / ' + fail + ' fail ===');
fs.rmSync(SCRATCH, { recursive: true, force: true });
say('gate scratch removed: ' + !fs.existsSync(SCRATCH));
fs.writeFileSync(path.join(TARGET, '.swarm/runs/cycle-021-verify-T-015.txt'), lines.join('\n') + '\n');
process.exit(fail === 0 ? 0 : 1);
