'use strict';
// Conductor verification gate for cycle 17, item T-009 (publish the tag vocabulary).
// Authored AT VERIFICATION TIME. The builder never saw any of these checks.
//
// Design notes:
//  - Every claim the builder returned is re-derived here from the artifacts, never read
//    back from its report.
//  - Negative controls are MY mutations, not the builder's. A test suite that cannot be
//    made to fail is not protection.
//  - The advertised shell commands are EXECUTED, not eyeballed: a README that tells the
//    reader to run something must tell the truth about what that something does.

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const WT = '/tmp/wave-c17-T-009';
const REPO = '/opt/targets/aphorism-cli';
const README = path.join(WT, 'README.md');
const ARGS = path.join(WT, 'src', 'args.js');
const NEWTEST = path.join(WT, 'test', 'readme-tags.test.js');

let pass = 0, fail = 0;
const results = [];
function check(id, desc, fn) {
  let ok, detail;
  try { const r = fn(); ok = r === true || (r && r.ok); detail = (r && r.detail) || ''; }
  catch (e) { ok = false; detail = 'threw: ' + e.message.split('\n')[0]; }
  results.push({ id, ok, desc, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(5) + ' ' + desc + (detail ? '\n            ' + detail : ''));
  ok ? pass++ : fail++;
  return ok;
}

// git status --porcelain prefixes each line with a 2-char XY status + a space. An
// unstaged modification is " M path", so the leading char is a SPACE -- .trim() on the
// whole blob eats it and shifts the first path by one char ("README.md" -> "EADME.md").
// Repaired mid-gate on the first run of this harness; the bug was mine, not the product's.
function porcelainPaths(dir) {
  return execSync('git -C ' + dir + ' status --porcelain', { encoding: 'utf8' })
    .split('\n').filter((l) => l.length > 3).map((l) => l.slice(3)).sort();
}

// Names of the tests that failed in a run, so a control can prove WHICH assertion fired
// rather than merely that something went red.
function failedTestNames(out) {
  const m = out.match(/✖ failing tests:\n([\s\S]*)$/);
  if (!m) return [];
  return [...new Set([...m[1].matchAll(/✖ (.+?) \(\d/g)].map((x) => x[1]))];
}

function testFiles(dir) {
  return fs.readdirSync(path.join(dir, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => path.join('test', f));
}

// Run the suite in a given tree. Returns {code, tests, pass, fail, out}.
function runSuite(dir) {
  let out, code = 0;
  try {
    out = execFileSync('node', ['--test', ...testFiles(dir)], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); code = e.status; }
  const num = (k) => { const m = out.match(new RegExp('^\\u2139 ' + k + ' (\\d+)$', 'm')); return m ? Number(m[1]) : null; };
  return { code, tests: num('tests'), pass: num('pass'), fail: num('fail'), out };
}

// Run the real binary. Returns {status, stdout, stderr}.
function cli(args, dir) {
  const r = require('child_process').spawnSync('node', [path.join(dir || WT, 'bin', 'aphorism.js'), ...args], { encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// ---------------------------------------------------------------- ground truth
const { corpus } = require(path.join(WT, 'src', 'corpus.js'));
const CENSUS = new Map();
for (const e of corpus) for (const t of e.tags) CENSUS.set(t, (CENSUS.get(t) || 0) + 1);
const readme = fs.readFileSync(README, 'utf8');
const argsSrc = fs.readFileSync(ARGS, 'utf8');
const argsHead = execSync('git -C ' + WT + ' show HEAD:src/args.js', { encoding: 'utf8' });
const readmeHead = execSync('git -C ' + WT + ' show HEAD:README.md', { encoding: 'utf8' });

console.log('# conductor census: ' + corpus.length + ' entries, ' + CENSUS.size + ' distinct tags, '
  + [...CENSUS.values()].filter((n) => n === 1).length + ' singletons\n');

// ------------------------------------------------------------------ A. scope
check('A1', 'exactly 3 paths differ from HEAD (README.md, src/args.js, +test/readme-tags.test.js)', () => {
  const st = porcelainPaths(WT);
  const want = ['README.md', 'src/args.js', 'test/readme-tags.test.js'];
  return { ok: JSON.stringify(st) === JSON.stringify(want), detail: 'changed: ' + JSON.stringify(st) };
});

check('A2', 'no runtime module touched (corpus/select/bin) and no dependency manifest added', () => {
  const forbidden = ['src/corpus.js', 'src/select.js', 'bin/aphorism.js', 'package.json', 'package-lock.json'];
  const diff = execSync('git -C ' + WT + ' diff HEAD --name-only', { encoding: 'utf8' });
  const hit = forbidden.filter((f) => diff.includes(f));
  const hasManifest = fs.existsSync(path.join(WT, 'package.json'));
  return { ok: hit.length === 0 && !hasManifest, detail: 'touched=' + JSON.stringify(hit) + ' package.json exists=' + hasManifest };
});

check('A3', 'new test file requires nothing outside node: builtins and relative paths (zero-dep held)', () => {
  const src = fs.readFileSync(NEWTEST, 'utf8');
  const reqs = [...src.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
  const bad = reqs.filter((r) => !r.startsWith('node:') && !r.startsWith('.') && !['fs', 'path', 'assert'].includes(r));
  return { ok: bad.length === 0, detail: 'requires=' + JSON.stringify(reqs) };
});

// -------------------------------------------- B. args.js: HELP-literal isolation
// Cycle-8 precedent: HELP lives inside src/args.js, so a prose edit there must be gated
// by byte-comparing everything OUTSIDE the template literal against HEAD.
function stripHelp(src) {
  const start = src.indexOf('const HELP = `');
  const end = src.indexOf('`;', start);
  if (start === -1 || end === -1) throw new Error('HELP literal not found');
  return { outside: src.slice(0, start + 'const HELP = `'.length) + src.slice(end), inside: src.slice(start + 'const HELP = `'.length, end) };
}
const headParts = stripHelp(argsHead);
const newParts = stripHelp(argsSrc);

check('B1', 'src/args.js OUTSIDE the HELP template literal is byte-identical to HEAD', () => ({
  ok: Buffer.compare(Buffer.from(newParts.outside), Buffer.from(headParts.outside)) === 0,
  detail: 'outside-bytes head=' + Buffer.byteLength(headParts.outside) + ' new=' + Buffer.byteLength(newParts.outside),
}));

check('B2', 'the HELP literal did change (the item is not a no-op)', () => ({
  ok: newParts.inside !== headParts.inside,
  detail: 'help lines head=' + headParts.inside.split('\n').length + ' new=' + newParts.inside.split('\n').length,
}));

// Differential behaviour test: HEAD's parser vs the new parser over a battery of vectors.
// This is the discriminator — a prose-only edit cannot move any of these outputs.
check('B3', 'parseArgs is behaviourally identical to HEAD across 44 argv vectors', () => {
  const tmpHead = '/tmp/c17-args-head.js';
  fs.writeFileSync(tmpHead, argsHead);
  const a = require(tmpHead).parseArgs;
  const b = require(ARGS).parseArgs;
  const vectors = [
    [], ['--help'], ['-h'], ['--list'], ['--json'], ['--list', '--json'],
    ['--tag', 'design'], ['--tag=design'], ['--tag'], ['--tag', '--json'], ['--tag='],
    ['--author', 'dijkstra'], ['--author=dijkstra'], ['--author'], ['--author='],
    ['--seed', '42'], ['--seed=42'], ['--seed', '-5'], ['--seed=-5'], ['--seed', '0'],
    ['--seed', 'abc'], ['--seed=abc'], ['--seed', ''], ['--seed='], ['--seed'],
    ['--seed', '1e3'], ['--seed', '  '], ['--seed', '0x10'], ['--seed', 'Infinity'],
    ['--seed', 'NaN'], ['--seed', '3.5'], ['--bogus'], ['--bogus=1'], ['-x'],
    ['positional'], ['--tag', 'design', '--author', 'fowler'], ['--tag=design', '--seed=7'],
    ['--list', '--tag', 'humor', '--seed', '9'], ['--json', '--author', 'knuth'],
    ['--help', '--bogus'], ['--tag', 'DESIGN'], ['--tag', '-h'], ['--author', '-5'],
    ['--seed', '42', 'extra'],
  ];
  const diffs = [];
  for (const v of vectors) {
    const ra = JSON.stringify(a(v)), rb = JSON.stringify(b(v));
    if (ra !== rb) diffs.push(JSON.stringify(v) + ': ' + ra + ' -> ' + rb);
  }
  return { ok: diffs.length === 0, detail: diffs.length ? diffs.join(' | ') : 'all 44 vectors identical' };
});

// ------------------------------------------------- C. README truthfulness vs corpus
const SEC = (() => {
  const i = readme.indexOf('## Tag vocabulary');
  if (i === -1) return null;
  const j = readme.indexOf('\n## ', i + 1);
  return readme.slice(i, j === -1 ? readme.length : j);
})();

check('C1', 'README has its own "## Tag vocabulary" heading (the acceptance criterion)', () =>
  ({ ok: SEC !== null, detail: SEC ? SEC.split('\n').length + ' lines' : 'heading absent' }));

check('C2', 'every tag named in the section exists in the corpus (no invented vocabulary)', () => {
  const named = [...new Set([...SEC.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]))];
  const bogus = named.filter((t) => !CENSUS.has(t));
  return { ok: bogus.length === 0, detail: named.length + ' backticked names, bogus=' + JSON.stringify(bogus) };
});

check('C3', 'every count in the section\'s tables matches the corpus exactly', () => {
  const rows = [...SEC.matchAll(/\|\s*`([a-z][a-z0-9-]*)`\s*\|\s*(\d+)\s*\|/g)].map((m) => [m[1], Number(m[2])]);
  const wrong = rows.filter(([t, n]) => CENSUS.get(t) !== n);
  return { ok: rows.length > 0 && wrong.length === 0, detail: rows.length + ' rows, wrong=' + JSON.stringify(wrong) };
});

check('C4', 'the three groups partition all 37 tags with no gap, no overlap, no duplicate', () => {
  const rows = [...SEC.matchAll(/\|\s*`([a-z][a-z0-9-]*)`\s*\|\s*(\d+)\s*\|/g)].map((m) => m[1]);
  const singleLine = SEC.split('\n').find((l) => /appear exactly once/.test(l)) || '';
  const singles = [...singleLine.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]);
  const all = [...rows, ...singles];
  const dupes = all.filter((t, i) => all.indexOf(t) !== i);
  const missing = [...CENSUS.keys()].filter((t) => !all.includes(t));
  const realSingles = [...CENSUS.entries()].filter(([, n]) => n === 1).map(([t]) => t).sort();
  const singlesCorrect = JSON.stringify([...singles].sort()) === JSON.stringify(realSingles);
  return {
    ok: dupes.length === 0 && missing.length === 0 && all.length === CENSUS.size && singlesCorrect,
    detail: 'documented=' + all.length + '/' + CENSUS.size + ' tables=' + rows.length + ' singles=' + singles.length
      + ' dupes=' + JSON.stringify(dupes) + ' missing=' + JSON.stringify(missing) + ' singles-exact=' + singlesCorrect,
  };
});

check('C5', 'the prose totals (37 distinct / 16 multi / 21 single) are the real figures', () => {
  const distinct = (SEC.match(/(\d+)\s+distinct tags/) || [])[1];
  const multi = (SEC.match(/(\d+)\s+tags appear on 2 or more entries/) || [])[1];
  const single = (SEC.match(/(\d+)\s+tags appear exactly once/) || [])[1];
  const realMulti = [...CENSUS.values()].filter((n) => n >= 2).length;
  const realSingle = [...CENSUS.values()].filter((n) => n === 1).length;
  return {
    ok: Number(distinct) === CENSUS.size && Number(multi) === realMulti && Number(single) === realSingle,
    detail: 'stated ' + distinct + '/' + multi + '/' + single + ' vs real ' + CENSUS.size + '/' + realMulti + '/' + realSingle,
  };
});

check('C6', 'the section states the unevenness plainly (the honesty requirement)', () => {
  const has = /exactly one entry/.test(SEC) && /(always return the same|same line every time)/.test(SEC);
  return { ok: has, detail: has ? 'states both the count and the consequence' : 'consequence of a single-entry tag not stated' };
});

check('C7', 'the rest of README.md is unchanged apart from the inserted section', () => {
  const stripped = readme.replace(SEC, '');
  const norm = (s) => s.replace(/\n{2,}/g, '\n\n').trim();
  return { ok: norm(stripped) === norm(readmeHead), detail: 'residual delta bytes=' + Math.abs(norm(stripped).length - norm(readmeHead).length) };
});

// ------------------------------------- D. the advertised commands must actually work
check('D1', 'README\'s advertised census pipeline runs and reproduces the conductor\'s census', () => {
  const cmd = (SEC.match(/```sh\n([\s\S]*?)\n```/) || [])[1];
  if (!cmd) return { ok: false, detail: 'no shell example in the section' };
  const out = execSync(cmd, { cwd: WT, encoding: 'utf8', shell: '/bin/bash' });
  const got = out.trim().split('\n').map((l) => l.trim().split(/\s+/)).map(([n, t]) => [t, Number(n)]);
  const want = [...CENSUS.entries()];
  const mismatch = want.filter(([t, n]) => !got.some(([gt, gn]) => gt === t && gn === n));
  return { ok: got.length === CENSUS.size && mismatch.length === 0, detail: 'cmd=' + cmd + ' -> ' + got.length + ' tags, mismatch=' + JSON.stringify(mismatch) };
});

check('D2', '--help still exits 0, writes only to stdout, and now names where the tags live', () => {
  const r = cli(['--help']);
  const pointsAtReadme = /README\.md/.test(r.stdout) && /Tag vocabulary/.test(r.stdout);
  return {
    ok: r.status === 0 && r.stderr === '' && pointsAtReadme,
    detail: 'exit=' + r.status + ' stderr=' + JSON.stringify(r.stderr) + ' lines=' + r.stdout.trim().split('\n').length + ' points-at-readme=' + pointsAtReadme,
  };
});

check('D3', 'the --help pointer is not a dangling reference: that heading really is in README.md', () => {
  const r = cli(['--help']);
  const quoted = [...r.stdout.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const bad = quoted.filter((q) => !readme.includes('## ' + q));
  return { ok: quoted.length > 0 && bad.length === 0, detail: 'quoted=' + JSON.stringify(quoted) + ' dangling=' + JSON.stringify(bad) };
});

check('D4', 'the --help jq recipe is truthful: --list --json really does expose .tags[]', () => {
  const out = execSync("node bin/aphorism.js --list --json | jq -r '.tags[]' | sort -u", { cwd: WT, encoding: 'utf8', shell: '/bin/bash' });
  const got = out.trim().split('\n').sort();
  return { ok: JSON.stringify(got) === JSON.stringify([...CENSUS.keys()].sort()), detail: got.length + ' distinct tags via the advertised recipe vs ' + CENSUS.size + ' real' };
});

check('D5', 'every tag the README advertises actually returns a match (exit 0, non-empty stdout)', () => {
  const named = [...new Set([...SEC.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]))].filter((t) => CENSUS.has(t));
  const broken = [];
  for (const t of named) { const r = cli(['--tag', t]); if (r.status !== 0 || !r.stdout.trim()) broken.push(t + ':exit' + r.status); }
  return { ok: named.length >= 30 && broken.length === 0, detail: named.length + ' tags exercised against the real binary, broken=' + JSON.stringify(broken) };
});

// ------------------------------------------------------------------ E. the suite
const suite = runSuite(WT);
check('E1', 'full suite green in the worktree', () => ({
  ok: suite.code === 0 && suite.fail === 0 && suite.tests > 0,
  detail: 'tests=' + suite.tests + ' pass=' + suite.pass + ' fail=' + suite.fail + ' exit=' + suite.code,
}));

check('E2', 'the new file is the whole test delta and adds real tests (59 -> ' + suite.tests + ')', () => {
  const hidden = path.join(WT, 'test', '_hidden-readme-tags.js');
  fs.renameSync(NEWTEST, hidden);
  const without = runSuite(WT);
  fs.renameSync(hidden, NEWTEST);
  return { ok: without.tests === 59 && suite.tests > without.tests, detail: 'without new file: tests=' + without.tests + ' fail=' + without.fail + '; delta=' + (suite.tests - without.tests) };
});

// ------------------------------------------------ F. NEGATIVE CONTROLS (my mutations)
// A gate that only ever observes green has measured nothing. Each control perturbs one
// artifact and REQUIRES the suite to go red; the file is restored from git afterwards.
function mutateReadme(id, desc, transform, mustFail) {
  check(id, desc, () => {
    const before = fs.readFileSync(README, 'utf8');
    const after = transform(before);
    if (after === before) return { ok: false, detail: 'mutation was a no-op — control is meaningless' };
    fs.writeFileSync(README, after);
    const r = runSuite(WT);
    fs.writeFileSync(README, before);
    const detected = r.fail > 0;
    const line = (r.out.match(/^\s+'?([^\n']*(?:README|corpus|Tag|tag)[^\n']*)'?$/m) || [])[1] || '';
    return { ok: detected === mustFail, detail: 'suite fail=' + r.fail + ' (expected ' + (mustFail ? 'RED' : 'GREEN') + ')' + (line ? ' :: ' + line.trim().slice(0, 90) : '') };
  });
}

mutateReadme('F1', 'control: understate the distinct-tag total (37 -> 36) must turn the suite RED',
  (s) => s.replace('37 distinct tags', '36 distinct tags'), true);

mutateReadme('F2', 'control: corrupt one table count (design 13 -> 12) must turn the suite RED',
  (s) => s.replace('| `design` | 13 |', '| `design` | 12 |'), true);

mutateReadme('F3', 'control: drop a real single-entry tag (`yagni`) from the list must turn the suite RED',
  (s) => s.replace(', `yagni`.', '.'), true);

mutateReadme('F4', 'control: misstate the single-entry count (21 -> 20) must turn the suite RED',
  (s) => s.replace('remaining 21 tags appear exactly once', 'remaining 20 tags appear exactly once'), true);

// The acceptance criterion I gave the builder in writing: the test must fail if the README
// names a tag that does not exist in the corpus. This control tests exactly that clause.
mutateReadme('F5', 'control: INVENT a tag (`refactoring`, absent from the corpus) in the single-entry list must turn the suite RED',
  (s) => s.replace(', `yagni`.', ', `yagni`, `refactoring`.'), true);

mutateReadme('F6', 'control: INVENT a tag as a table row (`| `refactoring` | 4 |`) must turn the suite RED',
  (s) => s.replace('| `performance` | 4 |', '| `performance` | 4 |\n| `refactoring` | 4 |'), true);

check('F7', 'control: a CORPUS-side change (add tag `refactoring` to entry 0) must turn the suite RED', () => {
  const p = path.join(WT, 'src', 'corpus.js');
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(/tags:\s*\[/, "tags: ['refactoring', ");
  if (after === before) return { ok: false, detail: 'mutation was a no-op — control is meaningless' };
  fs.writeFileSync(p, after);
  const r = runSuite(WT);
  fs.writeFileSync(p, before);
  return { ok: r.fail > 0, detail: 'suite fail=' + r.fail + ' (expected RED — the doc must rot loudly when the corpus moves)' };
});

// Coverage sweep. F5 proves ONE prose position is watched. That is not the same as the
// section being watched: an extractor can be scoped so narrowly it only ever sees a couple
// of positions. Substitute a bogus name into one documented position at a time, across all
// three groups, and require red every time.
check('F9', 'control: a bogus name substituted at ANY of 8 documented positions turns the suite RED', () => {
  const before = fs.readFileSync(README, 'utf8');
  const probes = [
    ['| `design` | 13 |', '| `zzzbogus` | 13 |', 'table-1 head'],
    ['| `debugging` | 5 |', '| `zzzbogus` | 5 |', 'table-1 tail'],
    ['| `performance` | 4 |', '| `zzzbogus` | 4 |', 'table-2 head'],
    ['| `testing` | 2 |', '| `zzzbogus` | 2 |', 'table-2 tail'],
    ['`algorithms`, ', '`zzzbogus`, ', 'prose head'],
    ['`naming`, ', '`zzzbogus`, ', 'prose middle'],
    ['`yagni`.', '`zzzbogus`.', 'prose tail'],
    ['`humor` | 9', '`zzzbogus` | 9', 'table-1 middle'],
  ];
  const missed = [];
  for (const [from, to, where] of probes) {
    const after = before.replace(from, to);
    if (after === before) { missed.push(where + ':NO-OP'); continue; }
    fs.writeFileSync(README, after);
    const r = runSuite(WT);
    if (r.fail === 0) missed.push(where);
  }
  fs.writeFileSync(README, before);
  return { ok: missed.length === 0, detail: probes.length + ' positions probed, unwatched=' + JSON.stringify(missed) };
});

// INFO probe, not a gate clause. The prose extractor keys on the literal lead-in sentence
// "The remaining N tags appear exactly once:". If a future editor rewords that sentence the
// prose list silently stops being checked. Recorded so the limitation is on the record
// rather than discovered later.
// Rewording the lead-in ALSO removes the "N tags appear exactly once" phrase that a
// different test keys on, so a bare fail-count cannot tell the two causes apart. Name the
// test that fired: only 'README tags must exist in corpus' proves the bogus tag was seen.
check('F10', 'INFO: is prose-list coverage keyed to the exact lead-in sentence?', () => {
  const before = fs.readFileSync(README, 'utf8');
  const after = before.replace(
    'The remaining 21 tags appear exactly once: `algorithms`',
    'Appearing exactly once: `zzzbogus`, `algorithms`');
  if (after === before) return { ok: true, detail: 'INFO probe could not be constructed — lead-in text moved' };
  fs.writeFileSync(README, after);
  const r = runSuite(WT);
  fs.writeFileSync(README, before);
  const names = failedTestNames(r.out);
  const bogusSeen = names.includes('README tags must exist in corpus');
  return { ok: true, detail: (bogusSeen
    ? 'NO — the bogus tag was still caught by name after rewording; coverage is not sentence-locked. '
    : 'YES — after rewording, the bogus tag went UNSEEN; the only failure came from a different assertion, so prose coverage IS keyed to that sentence. Not a gate failure (the shipped README is correct and watched) but a real limitation of the guard, filed as a residual. ')
    + 'suite fail=' + r.fail + ' firing=' + JSON.stringify(names) };
});

check('F8', 'control-of-the-controls: tree restored, suite green again at ' + suite.tests, () => {
  const st = porcelainPaths(WT);
  const r = runSuite(WT);
  return { ok: r.fail === 0 && r.tests === suite.tests && JSON.stringify(st) === JSON.stringify(['README.md', 'src/args.js', 'test/readme-tags.test.js']),
    detail: 'tests=' + r.tests + ' fail=' + r.fail + ' tree=' + JSON.stringify(st) };
});

console.log('\n================ GATE: ' + pass + ' pass / ' + fail + ' fail ================');
if (fail) {
  console.log('FAILED CHECKS:');
  for (const r of results.filter((x) => !x.ok)) console.log('  ' + r.id + ' ' + r.desc + '\n      ' + r.detail);
}
process.exit(fail ? 1 : 0);
