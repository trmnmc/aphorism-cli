#!/usr/bin/env node
'use strict';
// Cycle 19 conductor verification harness for T-013 (README-claim mutation sweep).
// Authored at VERIFICATION TIME. The sweep agent never saw this file.
//
// It does NOT read the agent's diffs or scratch copies. Every mutation below is
// re-derived by the conductor from the one-sentence description of what the mutation
// was supposed to be, then applied independently. That is the only way the result is
// evidence about the SUITE rather than about the agent's bookkeeping.
//
// Controls carried, each guarding a specific way this could produce a false result:
//   PRISTINE  - an unmutated whole-repo copy must be 65/65. Without it, a "KILL" could
//               be an artifact of the copy mechanism rather than of the mutation.
//   APPLIED   - every mutation asserts the file bytes actually changed AND that the
//               expected post-state is present. A mutation that silently fails to apply
//               makes SURVIVED vacuous, which is a PASS-shaped false result.
//   PAIRED    - each Class-A structural claim is paired with a positive control that
//               MUST kill. Survival alone says "no test fired"; the pair says "the
//               relevant test is live and is blind in this specific direction".

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = '/opt/targets/aphorism-cli';
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'c19-verify-'));
const results = [];
let pass = 0, fail = 0;

function check(id, ok, detail) {
  results.push((ok ? 'PASS' : 'FAIL') + '  ' + id + '  ' + detail);
  ok ? pass++ : fail++;
  return ok;
}

function freshCopy(name) {
  const dst = path.join(ROOT, name);
  fs.mkdirSync(dst, { recursive: true });
  execFileSync('cp', ['-r', SRC + '/.', dst]);
  fs.rmSync(path.join(dst, '.git'), { recursive: true, force: true });
  fs.rmSync(path.join(dst, '.swarm'), { recursive: true, force: true });
  return dst;
}

function runSuite(dir) {
  try {
    const out = execFileSync('bash', ['-c',
      'cd ' + JSON.stringify(dir) + ' && node --test --test-reporter=tap test/*.test.js 2>&1'],
      { encoding: 'utf8', timeout: 120000 });
    return parse(out);
  } catch (e) {
    return parse((e.stdout || '') + (e.stderr || ''));
  }
}

function parse(out) {
  const g = (re) => { const m = out.match(re); return m ? parseInt(m[1], 10) : null; };
  const failing = [];
  const re = /^not ok \d+ - (.+)$/gm;
  let m;
  while ((m = re.exec(out)) !== null) failing.push(m[1].trim());
  return { tests: g(/^# tests (\d+)$/m), pass: g(/^# pass (\d+)$/m),
           fail: g(/^# fail (\d+)$/m), failing, raw: out };
}

// Apply one exact-string edit to a file, asserting it actually landed.
function edit(dir, rel, from, to, id) {
  const p = path.join(dir, rel);
  const before = fs.readFileSync(p, 'utf8');
  const n = before.split(from).length - 1;
  if (n !== 1) {
    check(id + '.APPLIED', false,
      'expected the target string exactly once in ' + rel + ', found ' + n + ' -- NOT APPLIED');
    return false;
  }
  const after = before.replace(from, to);
  if (after === before) {
    check(id + '.APPLIED', false, 'replacement produced identical bytes -- NOT APPLIED');
    return false;
  }
  fs.writeFileSync(p, after);
  check(id + '.APPLIED', true, rel + ' changed (' + before.length + ' -> ' + after.length + ' bytes)');
  return true;
}

function verdict(id, dir, expected, note) {
  const r = runSuite(dir);
  // A null parse must NEVER fall through into a verdict: unparseable output would
  // silently read as "not green" and manufacture a KILLED for every mutant.
  if (r.tests === null || r.pass === null || r.fail === null) {
    check(id + '.VERDICT', false,
      'UNPARSEABLE suite output -- harness fault, not a measurement. tail: ' +
      JSON.stringify(r.raw.slice(-200)));
    return { got: 'UNPARSEABLE', r };
  }
  const survived = r.fail === 0 && r.pass === r.tests && r.tests > 0;
  const got = survived ? 'SURVIVED' : 'KILLED';
  check(id + '.VERDICT', got === expected,
    'expected ' + expected + ', measured ' + got +
    ' (tests ' + r.tests + ' pass ' + r.pass + ' fail ' + r.fail + ')' +
    (r.failing.length ? ' failing: ' + r.failing.join(' | ') : '') +
    (note ? ' -- ' + note : ''));
  return { got, r };
}

console.log('=== cycle 19 :: T-013 verification :: conductor harness ===');
console.log('scratch: ' + ROOT + '\n');

// ---------------------------------------------------------------- PRISTINE control
{
  const d = freshCopy('pristine');
  const r = runSuite(d);
  check('CTRL-PRISTINE', r.tests === 65 && r.pass === 65 && r.fail === 0,
    'unmutated whole-repo copy: tests ' + r.tests + ' pass ' + r.pass + ' fail ' + r.fail +
    ' (baseline must be 65/65/0 or every verdict below is unsound)');
}

// ------------------------------------------- CLASS A: structural blindness, PAIRED
// V1 / V1b -- is the count check blind to a DELETED row while live on a PRESENT one?
{
  const d = freshCopy('v1');
  if (edit(d, 'README.md', '| `debugging` | 5 |\n', '', 'V1'))
    verdict('V1', d, 'SURVIVED', 'A7: whole robust-pool row deleted');
}
{
  const d = freshCopy('v1b');
  if (edit(d, 'README.md', '| `humor` | 9 |', '| `humor` | 7 |', 'V1b'))
    verdict('V1b', d, 'KILLED', 'POSITIVE CONTROL: wrong count in the SAME table must kill');
}

// V2 / V2b -- is the check blind to BAND membership while live on the count itself?
{
  const d = freshCopy('v2');
  const p = path.join(d, 'README.md');
  let s = fs.readFileSync(p, 'utf8');
  const row = '| `performance` | 4 |\n';
  const ok = s.split(row).length - 1 === 1 && s.includes('| `debugging` | 5 |\n');
  if (check('V2.APPLIED', ok, 'located the performance row and the robust-pool table')) {
    s = s.replace(row, '');                                       // remove from the 2-4 table
    s = s.replace('| `debugging` | 5 |\n', '| `debugging` | 5 |\n' + row); // add to robust pool
    fs.writeFileSync(p, s);
    verdict('V2', d, 'SURVIVED',
      'A8: performance (count 4) now sits under "robust pool (5+ entries)" with its count still 4 -- README internally self-contradictory');
  }
}
{
  const d = freshCopy('v2b');
  if (edit(d, 'README.md', '| `performance` | 4 |', '| `performance` | 6 |', 'V2b'))
    verdict('V2b', d, 'KILLED', 'POSITIVE CONTROL: same row, wrong count -- proves the count check is live on this row');
}

// ------------------------------------------------- CLASS B: unguarded numeric claims
{
  const d = freshCopy('v3');
  if (edit(d, 'README.md', '16 tags appear on 2 or more entries', '26 tags appear on 2 or more entries', 'V3'))
    verdict('V3', d, 'SURVIVED', 'A9');
}
{
  const d = freshCopy('v4');
  if (edit(d, 'README.md', '4 tags have a robust pool (5+ entries)', '9 tags have a robust pool (5+ entries)', 'V4'))
    verdict('V4', d, 'SURVIVED', 'A10');
}
{
  const d = freshCopy('v5');
  if (edit(d, 'README.md', '12 tags appear 2–4 times', '22 tags appear 2–4 times', 'V5'))
    verdict('V5', d, 'SURVIVED', 'A11');
}

// V6 -- CONDUCTOR-ORIGINAL, not in the agent's sweep.
// The single-entry count is stated TWICE in the README, in two different sentences.
// The agent only mutated the one at the prose list. If the OTHER one is unguarded,
// the README can contradict itself about the same number and stay green.
{
  const d = freshCopy('v6');
  if (edit(d, 'README.md', 'the remaining 21 appear on exactly one entry',
                           'the remaining 19 appear on exactly one entry', 'V6'))
    verdict('V6', d, 'SURVIVED',
      'CONDUCTOR-ORIGINAL: second statement of the single-entry count, leaving the guarded sentence intact');
}
{
  const d = freshCopy('v6b');
  if (edit(d, 'README.md', 'The remaining 21 tags appear exactly once',
                           'The remaining 19 tags appear exactly once', 'V6b'))
    verdict('V6b', d, 'KILLED',
      'POSITIVE CONTROL: the OTHER statement of the same number is guarded -- proves V6 is a real asymmetry');
}

// ------------------------------------------------- CLASS B: non-tag README claims
{
  const d = freshCopy('v7');
  if (edit(d, 'README.md', 'ranks all 50\nentries', 'ranks all 40\nentries', 'V7'))
    verdict('V7', d, 'SURVIVED', 'C1: corpus size claim in Attribution');
}
{
  const d = freshCopy('v8');
  if (edit(d, 'README.md', '| `--tag <tag>` | Whole tag match, case-insensitive |',
                           '| `--tag <tag>` | Substring match in tag, case-insensitive |', 'V8'))
    verdict('V8', d, 'SURVIVED',
      'C3: a FLAT LIE about shipped behaviour -- --tag is whole-tag, and cli.test.js proves it, yet the Flags table can say otherwise');
}
{
  const d = freshCopy('v9');
  if (edit(d, 'README.md', '(text, space, EM DASH, space, author)', '(text, space, HYPHEN, space, author)', 'V9'))
    verdict('V9', d, 'SURVIVED', 'C5: --list render format prose');
}
{
  const d = freshCopy('v10');
  if (edit(d, 'README.md', 'src/select.js      pure filtering', 'src/selection.js   pure filtering', 'V10'))
    verdict('V10', d, 'SURVIVED', 'C6: layout block names a file that does not exist');
}

// ------------------------------------------------- claimed-KILL control sample
// Re-derived from descriptions only. If a claimed kill does not reproduce, the
// agent's whole table is suspect.
{
  const d = freshCopy('k1');
  if (edit(d, 'README.md', '| `design` | 13 |', '| `design` | 11 |', 'K1'))
    verdict('K1', d, 'KILLED', 'agent claimed A2 KILLED');
}
{
  const d = freshCopy('k2');
  if (edit(d, 'README.md', 'contains 37 distinct tags', 'contains 31 distinct tags', 'K2'))
    verdict('K2', d, 'KILLED', 'agent claimed A3 KILLED');
}
{
  // B3: raise yagni from 1 to 2 by adding it to an entry that lacks it.
  const d = freshCopy('k3');
  const p = path.join(d, 'src/corpus.js');
  let s = fs.readFileSync(p, 'utf8');
  const m = s.match(/tags: \['readability', 'design'\]/);
  if (check('K3.APPLIED', !!m, 'located a corpus entry lacking yagni')) {
    s = s.replace("tags: ['readability', 'design']", "tags: ['readability', 'design', 'yagni']");
    fs.writeFileSync(p, s);
    verdict('K3', d, 'KILLED', 'agent claimed B3 KILLED (yagni 1 -> 2)');
  }
}
{
  // B1: brand-new tag on the first entry -> distinct tags 37 -> 38.
  const d = freshCopy('k4');
  const p = path.join(d, 'src/corpus.js');
  let s = fs.readFileSync(p, 'utf8');
  const i = s.indexOf('tags: [');
  if (check('K4.APPLIED', i !== -1, 'located the first corpus tags array')) {
    s = s.slice(0, i) + s.slice(i).replace('tags: [', "tags: ['zzznew', ");
    fs.writeFileSync(p, s);
    verdict('K4', d, 'KILLED', 'agent claimed B1 KILLED (new distinct tag)');
  }
}

// ------------------------------------------------- real repo untouched
{
  const st = execFileSync('git', ['-C', SRC, 'status', '--porcelain'], { encoding: 'utf8' });
  const lines = st.split('\n').filter(Boolean);
  const bad = lines.filter(l => !/cycle-019-/.test(l));
  check('CTRL-TREE', bad.length === 0,
    'real repo carries only cycle-019 artifacts; unexpected entries: ' + (bad.join(' ; ') || 'none'));
  const scratch = fs.existsSync(path.join(SRC, '.swarm/scratch'));
  check('CTRL-SCRATCH', !scratch, '.swarm/scratch removed by the agent: ' + (!scratch));
}

console.log(results.join('\n'));
console.log('\n=== ' + pass + ' pass / ' + fail + ' fail ===');
fs.rmSync(ROOT, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
