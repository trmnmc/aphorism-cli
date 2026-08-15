'use strict';
// Conductor verification harness for T-017, cycle 23. v2.
// Authored AT VERIFICATION TIME, never shown to the builder.
//
// v2 fixes three HARNESS defects found by running v1 (all in the harness, none in the
// item): (a) failing-test attribution was sniffed for TAP "not ok" while node's default
// reporter was in use -- every run now goes through --test-reporter=tap so a failure can
// be attributed to a test BY NAME; (b) one probe parsed totals with a stricter regex than
// the shared parser; (c) the SCOPE checks mis-sliced porcelain lines and counted the
// conductor's own .swarm/runs/ artifacts as builder scope creep. Fixing them TIGHTENS the
// gate -- v1 could not tell "the suite failed" from "the new test failed".
//
// Design notes:
//  - The builder's own proofs mutated only the README (ASCII-hyphen swap). The mutations
//    here run in the OPPOSITE direction (mutate the SHIPPED BINARY, README pristine) and
//    against a DIFFERENT target (corpus content, output order, output length).
//  - ATTRIBUTION is measured in the STRICT form established at cycle 5/6: apply the
//    mutation, filter out the test added this cycle, and require the run to land on the
//    PRE-CYCLE baseline (71 pass / 0 fail). Measured on the TEST COUNT, not on node's
//    `skipped` counter (--test-skip-pattern filters, it does not mark skipped).
//  - Every mutation runs in a throwaway copy of the tree; the real repo is never mutated.

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const BASELINE_PRE_CYCLE = 71; // tests in the suite before T-017 landed
const NEW_TEST_TOKEN = 'T-017';

let pass = 0, fail = 0;
function record(ok, name, detail) {
  (ok ? pass++ : fail++);
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + name.padEnd(18) + ' ' + detail);
}
function note(text) { console.log('  ----  ' + text); }

function mkTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c23-t017-'));
  execFileSync('cp', ['-a', REPO + '/.', dir]);
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
  fs.rmSync(path.join(dir, '.swarm'), { recursive: true, force: true });
  return dir;
}

// Run the suite under the TAP reporter so failures carry their test NAME.
function runSuite(dir, opts) {
  opts = opts || {};
  const argv = ['--test', '--test-reporter=tap'];
  if (opts.skip) argv.push('--test-skip-pattern=' + opts.skip);
  if (opts.only) argv.push('--test-name-pattern=' + opts.only);
  for (const f of fs.readdirSync(path.join(dir, 'test')).filter(f => f.endsWith('.test.js'))) {
    argv.push(path.join('test', f));
  }
  const r = spawnSync(process.execPath, argv, { cwd: dir, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const num = (re) => { const m = out.match(re); return m === null ? null : parseInt(m[1], 10); };
  // TAP: top-level failures appear as "not ok N - <name>"
  const failedNames = [];
  for (const m of out.matchAll(/^not ok \d+ - (.*)$/gm)) failedNames.push(m[1].trim());
  return {
    tests: num(/^# tests (\d+)$/m),
    pass: num(/^# pass (\d+)$/m),
    fail: num(/^# fail (\d+)$/m),
    failedNames,
    namesNew: failedNames.some(n => n.includes(NEW_TEST_TOKEN)),
    out,
  };
}

function sub(dir, rel, from, to) {
  const p = path.join(dir, rel);
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error('mutation anchor not found in ' + rel + ': ' + JSON.stringify(from));
  fs.writeFileSync(p, s.replace(from, to));
}

const LIT = '`<text> — <author>`';
const BIN_JOIN = '`${e.text} — ${e.author}`';
const GLOSS = '(text, space, EM DASH, space, author)';
const ORDER_ANCHOR = '.map((e) => (opts.json';

// ---------------------------------------------------------------- controls --
{
  const r = runSuite(mkTree());
  record(r.tests === 72 && r.pass === 72 && r.fail === 0, 'CTRL-PRISTINE',
    `unmutated copy: tests=${r.tests} pass=${r.pass} fail=${r.fail}`);
}
{
  const r = runSuite(mkTree(), { skip: NEW_TEST_TOKEN });
  record(r.tests === BASELINE_PRE_CYCLE && r.pass === BASELINE_PRE_CYCLE && r.fail === 0, 'CTRL-DENOM',
    `skip-pattern removes exactly the 1 new test: ${r.tests}/${r.pass}/${r.fail} (want ${BASELINE_PRE_CYCLE}/${BASELINE_PRE_CYCLE}/0)`);
}
{
  const d = mkTree();
  sub(d, 'README.md', '37 distinct tags', '38 distinct tags');
  const r = runSuite(d, { skip: NEW_TEST_TOKEN });
  record(r.fail === 1, 'CTRL-SKIPSANE',
    `unrelated README mutation still fails under the same pattern: fail=${r.fail}`);
}

// ---- C5: the item's OWN claim -- README literal vs the binary ---------------
// This is the mutation T-017 exists to catch, in a DIFFERENT character from the
// builder's ASCII-hyphen proof.
{
  const d = mkTree();
  sub(d, 'README.md', LIT, '`<text> | <author>`');
  const r = runSuite(d);
  record(r.fail === 1 && r.namesNew, 'C5.FAILABLE',
    `README literal -> "<text> | <author>": fail=${r.fail}, failing=${JSON.stringify(r.failedNames)}`);
  const d2 = mkTree();
  sub(d2, 'README.md', LIT, '`<text> | <author>`');
  const r2 = runSuite(d2, { skip: NEW_TEST_TOKEN });
  record(r2.tests === BASELINE_PRE_CYCLE && r2.pass === BASELINE_PRE_CYCLE && r2.fail === 0, 'C5.ATTRIB',
    `same mutation, new test filtered -> ${r2.tests}/${r2.pass}/${r2.fail} (pre-cycle baseline)`);
}
// Second, independent literal mutation: drop the spaces around the separator.
// Every character in the literal is still legal markdown and the prose gloss is
// untouched, so nothing but a live literal-vs-binary comparison can catch it.
{
  const d = mkTree();
  sub(d, 'README.md', LIT, '`<text>—<author>`');
  const r = runSuite(d);
  record(r.fail === 1 && r.namesNew, 'C5b.FAILABLE',
    `README literal loses the spaces around the em dash: fail=${r.fail}, failing=${JSON.stringify(r.failedNames)}`);
  const d2 = mkTree();
  sub(d2, 'README.md', LIT, '`<text>—<author>`');
  const r2 = runSuite(d2, { skip: NEW_TEST_TOKEN });
  record(r2.tests === BASELINE_PRE_CYCLE && r2.pass === BASELINE_PRE_CYCLE && r2.fail === 0, 'C5b.ATTRIB',
    `same mutation, new test filtered -> ${r2.tests}/${r2.pass}/${r2.fail}`);
}

// ---- BINARY-side mutations: is the guard really EXECUTING the binary? -------
// These are NOT expected to be attributable to T-017 alone -- the pre-existing
// suite already pins the binary's own output. What they establish is that the
// new test is a live comparison, not a README-only string check that would sit
// green while the binary drifted.
{
  const d = mkTree();
  sub(d, 'bin/aphorism.js', BIN_JOIN, '`${e.text} -- ${e.author}`');
  const r = runSuite(d);
  record(r.namesNew, 'B1.BINARY-SEP',
    `binary joins with " -- ", README pristine: fail=${r.fail}, T-017 among failures=${r.namesNew}`);
  note(`   B1 also failed: ${JSON.stringify(r.failedNames.filter(n => !n.includes(NEW_TEST_TOKEN)))}`);
}
{
  const d = mkTree();
  sub(d, 'bin/aphorism.js', ORDER_ANCHOR, '.reverse()' + ORDER_ANCHOR);
  const r = runSuite(d);
  record(r.namesNew, 'B2.BINARY-ORDER',
    `binary reverses --list order (format intact): fail=${r.fail}, T-017 among failures=${r.namesNew}`);
}
{
  const d = mkTree();
  sub(d, 'bin/aphorism.js', ORDER_ANCHOR, '.slice(0, -1)' + ORDER_ANCHOR);
  const r = runSuite(d);
  record(r.namesNew, 'B3.BINARY-LENGTH',
    `binary drops the last --list line: fail=${r.fail}, T-017 among failures=${r.namesNew}`);
}

// ---- TRACKS: a CONSISTENT corpus change must stay GREEN ---------------------
// Proves the expectation is derived from the corpus at test time, not frozen as
// a 50-line transcript of today's output.
{
  const d = mkTree();
  const cp = path.join(d, 'src/corpus.js');
  const s = fs.readFileSync(cp, 'utf8');
  const m = s.match(/text: '([^']+)'/);
  fs.writeFileSync(cp, s.replace(m[0], "text: 'MUTATED CORPUS TEXT FOR THE C23 PROBE'"));
  const r = runSuite(d, { only: NEW_TEST_TOKEN });
  record(r.fail === 0 && r.pass === 1, 'TRACKS.CORPUS',
    `corpus text changed (binary + expectation both follow) -> T-017 alone: ${r.tests}/${r.pass}/${r.fail}`);
}

// ---- R1: honest prose edits must NOT be rejected ---------------------------
{
  const d = mkTree();
  sub(d, 'README.md', GLOSS, '(the aphorism, then the separator shown above, then who said it)');
  const r = runSuite(d);
  record(r.tests === 72 && r.pass === 72 && r.fail === 0, 'R1.NOFALSEREJECT',
    `prose gloss reworded, literal + binary intact: ${r.tests}/${r.pass}/${r.fail}`);
}
{
  const d = mkTree();
  sub(d, 'README.md', GLOSS, '(the aphorism, then the separator shown above, then who said it)');
  sub(d, 'README.md', LIT, '`<text> | <author>`');
  const r = runSuite(d);
  record(r.fail === 1 && r.namesNew, 'R1.STILLKILLS',
    `reworded prose + mutated literal: fail=${r.fail}, failing=${JSON.stringify(r.failedNames)}`);
}

// ---- R5: a parse miss must fail LOUD, never go quiet ------------------------
{
  const d = mkTree();
  sub(d, 'README.md', '### `--list` behaviour\n', '');
  const r = runSuite(d);
  record(r.namesNew, 'R5.NOHEADING',
    `"--list behaviour" heading deleted: fail=${r.fail}, T-017 among failures=${r.namesNew}`);
}
{
  const d = mkTree();
  sub(d, 'README.md', 'in the form ' + LIT + ' ' + GLOSS,
      'in the form described here: ' + GLOSS);
  const r = runSuite(d);
  record(r.namesNew, 'R5.NOLITERAL',
    `backtick literal replaced by prose: fail=${r.fail}, T-017 among failures=${r.namesNew}`);
}

// ---- PROBE N1: heading reformat (backticks dropped) -- false rejection? -----
{
  const d = mkTree();
  sub(d, 'README.md', '### `--list` behaviour', '### --list behaviour');
  const r = runSuite(d);
  note(`PROBE.N1 heading backticks dropped (honest reformat): fail=${r.fail}, ` +
       `T-017 among failures=${r.namesNew} -> ` +
       (r.fail === 0 ? 'TOLERATED' : 'FALSE REJECTION, fails LOUD -- file as a LOW backlog item'));
}

// ---- SCOPE ------------------------------------------------------------------
{
  const numstat = execFileSync('git', ['-C', REPO, 'diff', '--numstat', '--', 'test/readme-tags.test.js'],
    { encoding: 'utf8' }).trim();
  const [added, deleted] = numstat.split(/\s+/).map(Number);
  record(deleted === 0, 'SCOPE.INSERTONLY',
    `git diff --numstat on the builder's file: +${added} -${deleted} (deletions must be 0)`);

  const st = execFileSync('git', ['-C', REPO, 'status', '--porcelain'], { encoding: 'utf8' });
  const paths = st.split('\n').filter(Boolean).map(l => l.slice(3).trim());
  const notMine = paths.filter(p => !p.startsWith('.swarm/'));
  record(notMine.length === 1 && notMine[0] === 'test/readme-tags.test.js', 'SCOPE.ONEFILE',
    `changed paths outside the conductor's own .swarm/: ${JSON.stringify(notMine)}`);
  note(`   conductor-owned paths in the same tree: ${JSON.stringify(paths.filter(p => p.startsWith('.swarm/')))}`);

  const stray = fs.readdirSync(REPO).filter(f => /scratch|tmp|bak/i.test(f));
  record(stray.length === 0, 'SCOPE.SCRATCH', `stray scratch/tmp/bak entries at repo root: ${JSON.stringify(stray)}`);
}

console.log(`\n  === ${pass} pass / ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
