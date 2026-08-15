#!/usr/bin/env node
// Cycle 28 CONDUCTOR VERIFICATION GATE for T-021.
// Authored at verification time. The builder never saw this file.
//
// Two things drive this gate beyond T-021's acceptance clause as written:
//
// (1) THE MASKING FINDING (pre-dispatch baseline, cycle-028-baseline.txt):
//     at HEAD, "reformat alone" (B1) and "reformat + mutated literal" (B3)
//     both give 73/72/1 naming the SAME test. So the acceptance clause
//     "a mutated literal under that same reformatted heading still FAILS"
//     is ALREADY true at HEAD, and is satisfiable by a fix that never
//     restores real detection. Test-name attribution cannot separate the
//     two. This gate therefore attributes by ASSERTION MESSAGE: under a
//     reformatted heading, a mutated literal must fail with the SEPARATOR
//     MISMATCH message, not the heading-parse message.
//
// (2) THE DEGENERATE-FIX DISCRIMINATOR: a fix that abandoned the section
//     scope and searched the whole README for the format literal would go
//     green on the reformat and still fail on a mutated literal -- passing
//     both acceptance clauses while regressing constraint 2. A decoy
//     literal planted in an EARLIER section separates the readings.
//
// (3) The builder's own "did not execute" list is executed here. Fourth
//     cycle running that an honest uncertainty note becomes a measured check.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TARGET = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
let pass = 0, fail = 0;
const rows = [];

function copyRepo(label) {
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), `c28v-${label}-`));
  execFileSync('rsync', ['-a', '--exclude', '.git', `${TARGET}/`, `${dst}/`]);
  return dst;
}

// Restore the test file to git HEAD inside a scratch copy. This is the
// cycle-25/27 attribution mechanism: the test COUNT is unchanged by this
// item (no test added), so --test-skip-pattern has nothing to filter and
// the HEAD-reversion is what isolates the fix.
function revertTestFileToHead(dir) {
  const head = execFileSync('git', ['-C', TARGET, 'show', `HEAD:${TESTFILE}`], { encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, TESTFILE), head);
}

function runSuite(dir) {
  let out;
  try {
    out = execFileSync(
      process.execPath,
      ['--test', '--test-reporter=tap', 'test/readme-tags.test.js', 'test/cli.test.js',
       'test/args.test.js', 'test/select.test.js', 'test/corpus.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const t = /^# tests (\d+)$/m.exec(out);
  const p = /^# pass (\d+)$/m.exec(out);
  const f = /^# fail (\d+)$/m.exec(out);
  if (!t || !p || !f) return { parsed: false, raw: out.slice(0, 3000) };
  const failing = [];
  const re = /^not ok \d+ - (.+)$/gm;
  let m; while ((m = re.exec(out)) !== null) failing.push(m[1].trim());
  // Message-level capture: pull the assertion text out of the TAP YAML block.
  let reason = null;
  if (/must have a "### " heading|must have a "### `--list` behaviour" section/.test(out)) {
    reason = 'HEADING-PARSE';
  } else if (/could not find a `<text>\.\.\.<author>` format literal/.test(out)) {
    reason = 'LITERAL-PARSE';
  } else if (/Expected values to be strictly equal|actualLines|--list output/.test(out)) {
    reason = 'SEPARATOR-MISMATCH';
  }
  return { parsed: true, tests: +t[1], pass: +p[1], fail: +f[1], failing, reason, raw: out };
}

function check(id, desc, got, want, detail) {
  const ok = got === want;
  ok ? pass++ : fail++;
  rows.push({ id, ok, desc, got, want, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${id}] ${desc}`);
  console.log(`        got=${got}  want=${want}${detail ? '  :: ' + detail : ''}`);
}

function sig(r) { return r.parsed ? `${r.tests}/${r.pass}/${r.fail}` : 'UNPARSEABLE'; }

function patch(dir, fn) {
  const p = path.join(dir, 'README.md');
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
}

const DROP_TICKS = (s) => s.replace('### `--list` behaviour', '### --list behaviour');
const MUTATE_LIT = (s) => s.replace('`<text> — <author>`', '`<text> | <author>`');
const DECOY = (s) => s.replace('## Flags',
  '## Flags\n\nHistorical note: releases before 0.1 printed `<text> | <author>` instead.\n');

console.log('=== CYCLE 28 GATE: T-021 ===\n');

// ---------------------------------------------------------------- CONTROLS
{
  const d = copyRepo('pristine');
  const r = runSuite(d);
  check('C0.PRISTINE', 'unmutated copy of the WORKED tree is green', sig(r), '73/73/0',
    'if this fails, every result below is meaningless');
}
{
  // Negative control: the harness must be able to produce a red at all.
  const d = copyRepo('negctl');
  patch(d, MUTATE_LIT);
  const r = runSuite(d);
  check('C1.NEGATIVE', 'harness can produce a RED (mutated literal, heading untouched)',
    `${sig(r)}|${r.reason}`, '73/72/1|SEPARATOR-MISMATCH',
    'also proves the guard is still LIVE on the literal after the fix');
}
{
  // Proves the HEAD-reversion attribution mechanism itself is sound.
  const d = copyRepo('revctl');
  revertTestFileToHead(d);
  const r = runSuite(d);
  check('C2.REVERT-SOUND', 'HEAD test file on an UNMUTATED README is green', sig(r), '73/73/0',
    'so a red in any A*b check below measures the fix, not the swap');
}

// ------------------------------------------------- ACCEPTANCE: GREEN HALF
{
  const d = copyRepo('a1');
  patch(d, DROP_TICKS);
  const r = runSuite(d);
  check('A1.GREEN', 'T-021 case: backticks dropped from the heading -> suite GREEN',
    sig(r), '73/73/0', 'the false rejection is removed');
}
{
  const d = copyRepo('a1b');
  patch(d, DROP_TICKS);
  revertTestFileToHead(d);
  const r = runSuite(d);
  check('A1b.ATTRIB', 'same README against HEAD test file -> REJECTED',
    `${sig(r)}|${r.reason}`, '73/72/1|HEADING-PARSE',
    'attributes A1 to this fix rather than to anything else');
}

// -------------------------------------- ACCEPTANCE: RED HALF, BY MESSAGE
// This is the check the baseline's masking finding forced. Failing is not
// enough -- it must fail for the RIGHT REASON.
{
  const d = copyRepo('a2');
  patch(d, (s) => MUTATE_LIT(DROP_TICKS(s)));
  const r = runSuite(d);
  check('A2.RED-REASON', 'reformatted heading + mutated literal -> fails as SEPARATOR-MISMATCH',
    `${sig(r)}|${r.reason}`, '73/72/1|SEPARATOR-MISMATCH',
    'at HEAD this same input failed as HEADING-PARSE (baseline B3) -- detection is ' +
    'genuinely restored, not merely still-red');
}
{
  const d = copyRepo('a2b');
  patch(d, (s) => MUTATE_LIT(DROP_TICKS(s)));
  revertTestFileToHead(d);
  const r = runSuite(d);
  check('A2b.MASK-PROOF', 'the SAME input at HEAD fails as HEADING-PARSE (the masking)',
    `${sig(r)}|${r.reason}`, '73/72/1|HEADING-PARSE',
    'identical test-name signature to A2, different cause -- this is exactly why ' +
    'the acceptance clause as written could not have settled this item');
}

// ------------------------------------ DISCRIMINATOR: degenerate whole-README fix
{
  const d = copyRepo('d1');
  patch(d, DECOY);
  const r = runSuite(d);
  check('D1.DECOY', 'decoy literal in an EARLIER section, heading untouched -> GREEN',
    sig(r), '73/73/0', 'a whole-README search would hit the decoy and go red');
}
{
  const d = copyRepo('d2');
  patch(d, (s) => DECOY(DROP_TICKS(s)));
  const r = runSuite(d);
  check('D2.DECOY+REFORMAT', 'decoy literal AND reformatted heading -> GREEN',
    sig(r), '73/73/0',
    'the shape a degenerate fix provably cannot reach; section scope survived the fix');
}

// ------------------------------------------------------------- LOUDNESS
{
  const d = copyRepo('l1');
  patch(d, (s) => s.replace('### `--list` behaviour', '### output notes'));
  const r = runSuite(d);
  check('L1.NO-SECTION', 'heading with NEITHER token -> loud HEADING-PARSE assert',
    `${sig(r)}|${r.reason}`, '73/72/1|HEADING-PARSE', 'a parse miss must never pass silently');
}
{
  const d = copyRepo('l2');
  patch(d, (s) => s.replace('`<text> — <author>`', 'the usual form'));
  const r = runSuite(d);
  check('L2.NO-LITERAL', 'format literal removed -> loud LITERAL-PARSE assert',
    `${sig(r)}|${r.reason}`, '73/72/1|LITERAL-PARSE', 'second helper kept its loudness');
}

// ------------------------- THE BUILDER'S OWN UNEXECUTED EDGE CASES (B-list)
// It flagged four. All four are executed here rather than taken on reasoning.
{
  const d = copyRepo('b1');
  patch(d, (s) => s.replace('### `--list` behaviour', '### behaviour of --list'));
  const r = runSuite(d);
  check('B1.REVERSE-ORDER', 'builder said untested: "### behaviour of --list" -> GREEN',
    sig(r), '73/73/0', 'tokens in either order, as it reasoned but did not run');
}
{
  const d = copyRepo('b2');
  patch(d, (s) => s.replace('### `--list` behaviour', '### `--list` Behaviour'));
  const r = runSuite(d);
  check('B2.CASE', 'builder said deliberate: capitalised "Behaviour" -> still REJECTED loud',
    `${sig(r)}|${r.reason}`, '73/72/1|HEADING-PARSE',
    'scope was backtick tolerance only; case tolerance was NOT requested and is not silently added');
}
{
  const d = copyRepo('b3');
  patch(d, (s) => s.replace('### `--list` behaviour', '### `--list` behavior'));
  const r = runSuite(d);
  check('B3.SPELLING', 'builder said deliberate: American "behavior" -> still REJECTED loud',
    `${sig(r)}|${r.reason}`, '73/72/1|HEADING-PARSE', 'same reasoning as B2');
}
{
  // The builder's own adversarial case, which it declined to construct.
  const d = copyRepo('b4');
  patch(d, (s) => s.replace('### `--list` behaviour',
    '### --list-only mode behaviour\n\nUnrelated prose about a mode that does not exist.\n\n### `--list` behaviour'));
  const r = runSuite(d);
  check('B4.MISPICK', 'builder\'s own adversarial case: an EARLIER heading carrying both tokens',
    sig(r), '73/72/1',
    'FIRST-MATCH-WINS means the decoy heading is picked and the real section is missed. ' +
    'Recorded as a MEASUREMENT: red here is the newly-introduced surface, not a pass/fail ' +
    'of T-021 -- see the gate note. want is set to the OBSERVED-at-authoring value so the ' +
    'row is honest either way; the finding is reported regardless.');
}
{
  // Does the same mis-pick exist at HEAD? Attribution for B4.
  const d = copyRepo('b4b');
  patch(d, (s) => s.replace('### `--list` behaviour',
    '### --list-only mode behaviour\n\nUnrelated prose about a mode that does not exist.\n\n### `--list` behaviour'));
  revertTestFileToHead(d);
  const r = runSuite(d);
  check('B4b.MISPICK-ATTRIB', 'the SAME decoy-heading README against HEAD test file',
    sig(r), '73/73/0',
    'HEAD matched the exact backticked heading, so it skipped the decoy. If HEAD is green ' +
    'and the fix is red, the mis-pick is INTRODUCED by this fix and must be filed.');
}

// ------------------------------------------------------------------ SCOPE
{
  const changed = execFileSync('git', ['-C', TARGET, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  check('S1.SCOPE', 'exactly one tracked file changed', changed.join(','), TESTFILE);
}
{
  const headReadme = execFileSync('git', ['-C', TARGET, 'show', 'HEAD:README.md'], { encoding: 'utf8' });
  const nowReadme = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8');
  check('S2.README', 'README.md byte-identical to HEAD', String(headReadme === nowReadme), 'true');
}
{
  const prod = ['src/corpus.js', 'src/select.js', 'src/args.js', 'bin/aphorism.js'];
  const same = prod.every((f) =>
    execFileSync('git', ['-C', TARGET, 'show', `HEAD:${f}`], { encoding: 'utf8' }) ===
    fs.readFileSync(path.join(TARGET, f), 'utf8'));
  check('S3.PRODUCT', 'every product file byte-identical to HEAD', String(same), 'true');
}
{
  const head = execFileSync('git', ['-C', TARGET, 'show', `HEAD:${TESTFILE}`], { encoding: 'utf8' });
  const now = fs.readFileSync(path.join(TARGET, TESTFILE), 'utf8');
  const countAsserts = (s) => (s.match(/assert[.(]/g) || []).length;
  check('S4.NO-WEAKEN', 'assertion count not reduced',
    String(countAsserts(now) >= countAsserts(head)), 'true',
    `HEAD=${countAsserts(head)} now=${countAsserts(now)}`);
  check('S5.TESTCOUNT', 'no test added or removed (this item changes a helper only)',
    String((now.match(/^test\(/gm) || []).length), String((head.match(/^test\(/gm) || []).length));
}
{
  check('S6.SCRATCH', 'builder scratch directory removed',
    String(fs.existsSync(path.join(TARGET, '.swarm/scratch'))), 'false',
    'KI-7 standing control');
}

console.log(`\n=== ${pass} pass / ${fail} fail ===`);
fs.writeFileSync(path.join(TARGET, '.swarm/runs/cycle-028-verify-T-021.json'),
  JSON.stringify(rows, null, 2));
