#!/usr/bin/env node
// Cycle 28 PRE-DISPATCH BASELINE for T-021.
// Measures the defect at the CURRENT 73-test suite rather than inheriting
// cycle 23's figure. Conductor-authored; the builder never sees this file.
//
// Question 1: does dropping the backticks from "### `--list` behaviour"
//             actually fail today, and which test is named?
// Question 2 (the one that matters): can a DEGENERATE fix pass T-021's
//             acceptance as written? If the locator were replaced by
//             "search the whole README for the format literal", the reformat
//             would go green AND a mutated literal would still fail -- both
//             acceptance clauses satisfied by a fix that located nothing.
//             Measure whether a decoy literal in another section can
//             distinguish the two readings.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TARGET = '/opt/targets/aphorism-cli';
const results = [];

function copyRepo(label) {
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), `c28-${label}-`));
  execFileSync('rsync', ['-a', '--exclude', '.git', `${TARGET}/`, `${dst}/`]);
  return dst;
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
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const tests = /^# tests (\d+)$/m.exec(out);
  const pass = /^# pass (\d+)$/m.exec(out);
  const fail = /^# fail (\d+)$/m.exec(out);
  if (!tests || !pass || !fail) {
    return { parsed: false, raw: out.slice(0, 4000) };
  }
  const failing = [];
  const re = /^not ok \d+ - (.+)$/gm;
  let m;
  while ((m = re.exec(out)) !== null) failing.push(m[1].trim());
  return {
    parsed: true,
    tests: +tests[1],
    pass: +pass[1],
    fail: +fail[1],
    failing,
  };
}

function record(id, desc, r, note) {
  results.push({ id, desc, r, note });
  const sig = r.parsed ? `${r.tests}/${r.pass}/${r.fail}` : 'UNPARSEABLE';
  console.log(`\n[${id}] ${desc}`);
  console.log(`   -> ${sig}`);
  if (r.parsed && r.failing.length) {
    r.failing.forEach((f) => console.log(`      FAIL: ${f}`));
  }
  if (!r.parsed) console.log(r.raw);
  if (note) console.log(`   NOTE: ${note}`);
}

function patchReadme(dir, fn) {
  const p = path.join(dir, 'README.md');
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
}

// --- P0: PRISTINE control -------------------------------------------------
// An unmutated copy must be fully green. This control is what caught the
// cycle-19 harness bug that silently manufactured a verdict for every mutant.
{
  const d = copyRepo('pristine');
  record('P0.PRISTINE', 'unmutated whole-repo copy must be green', runSuite(d),
    'if this is not N/N/0 every result below is meaningless');
}

// --- B1: the T-021 defect, measured at the current suite -------------------
{
  const d = copyRepo('b1');
  patchReadme(d, (s) => s.replace('### `--list` behaviour', '### --list behaviour'));
  record('B1.REFORMAT', 'drop backticks from the heading (honest markdown reformat, no claim made false)',
    runSuite(d), 'expected: FAILS today; note WHICH test is named');
}

// --- B2: control -- the guard is provably LIVE on the literal -------------
{
  const d = copyRepo('b2');
  patchReadme(d, (s) => s.replace('`<text> — <author>`', '`<text> | <author>`'));
  record('B2.LITERAL', 'mutate the format literal separator, heading untouched',
    runSuite(d), 'expected: FAILS naming T-017 -- proves the guard is live');
}

// --- B3: the acceptance clause as written, at HEAD ------------------------
{
  const d = copyRepo('b3');
  patchReadme(d, (s) => s
    .replace('### `--list` behaviour', '### --list behaviour')
    .replace('`<text> — <author>`', '`<text> | <author>`'));
  record('B3.BOTH', 'reformatted heading AND mutated literal, at HEAD',
    runSuite(d),
    'MASKING CHECK: if this has the same signature as B1, the literal mutation is ' +
    'masked by the parse failure and the acceptance clause "still FAILS" is ' +
    'satisfiable by a fix that never restores detection');
}

// --- D1: the DEGENERATE-FIX discriminator ---------------------------------
// A fix that abandons the section locator and searches the WHOLE README for
// the format literal would pass both acceptance clauses. This measures
// whether such a fix is distinguishable: plant a DECOY literal in an
// earlier section. A section-locating guard reads the real one and stays
// green; a whole-README search hits the decoy first and fails.
{
  const d = copyRepo('d1');
  patchReadme(d, (s) => s.replace(
    '## Flags',
    '## Flags\n\nHistorical note: releases before 0.1 printed `<text> | <author>` instead.\n'
  ));
  record('D1.DECOY', 'plant a decoy `<text> | <author>` literal in an EARLIER section, heading untouched',
    runSuite(d),
    'expected GREEN at HEAD (locator is section-scoped). A degenerate whole-README ' +
    'fix would turn this RED -- so this check separates the two readings and must ' +
    'be part of the gate.');
}

// --- D2: decoy + reformat -- the combined discriminator -------------------
{
  const d = copyRepo('d2');
  patchReadme(d, (s) => s
    .replace('### `--list` behaviour', '### --list behaviour')
    .replace('## Flags',
      '## Flags\n\nHistorical note: releases before 0.1 printed `<text> | <author>` instead.\n'));
  record('D2.DECOY+REFORMAT', 'decoy literal AND reformatted heading',
    runSuite(d),
    'the shape the FIXED tree must satisfy: GREEN. A degenerate fix cannot ' +
    'reach green here.');
}

// --- D3: loudness must survive -- literal removed entirely ----------------
{
  const d = copyRepo('d3');
  patchReadme(d, (s) => s.replace('`<text> — <author>`', 'the usual form'));
  record('D3.LOUD', 'remove the format literal entirely, heading untouched', runSuite(d),
    'expected: FAILS loud on the "could not find a format literal" assert, never a silent pass');
}

fs.writeFileSync(
  path.join(TARGET, '.swarm/runs/cycle-028-baseline.json'),
  JSON.stringify(results, null, 2)
);
console.log('\n=== baseline complete ===');
