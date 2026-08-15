#!/usr/bin/env node
'use strict';
// Cycle 22 VERIFICATION GATE for T-016.
// Authored at verification time. The builder never saw this file.
// Deliberately uses DIFFERENT mutations than the builder reported:
//   C1  50 -> 51 (UP; builder used 49, DOWN)
//   C2   8 ->  7 (DOWN; builder used 9, UP)
//   C6  bin/aphorism.js and test/ (builder used src/select.js)
// Parse failures are reported UNPARSEABLE and never fall through to a verdict.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const TARGET = '/opt/targets/aphorism-cli';
const SKIP = '\\(C1\\)|\\(C2\\)|\\(C6\\)';

let pass = 0, fail = 0;
function report(name, ok, detail) {
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name.padEnd(20) + detail);
}

function copyRepo(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-g22-' + label + '-'));
  execFileSync('bash', ['-c',
    'cd ' + JSON.stringify(TARGET) + ' && tar --exclude=.git -cf - . | tar -xf - -C ' + JSON.stringify(dir)]);
  return dir;
}

function runTests(dir, skipPattern) {
  const cmd = skipPattern
    ? 'node --test --test-reporter=tap --test-skip-pattern=' + JSON.stringify(skipPattern) + ' test/*.test.js 2>&1'
    : 'node --test --test-reporter=tap test/*.test.js 2>&1';
  const r = spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const mt = /^# tests (\d+)$/m.exec(out);
  const mp = /^# pass (\d+)$/m.exec(out);
  const mf = /^# fail (\d+)$/m.exec(out);
  if (!mt || !mp || !mf) return { unparseable: true, raw: out.slice(0, 1500) };
  const failing = [];
  const re = /^not ok \d+ - (.+)$/gm;
  let x;
  while ((x = re.exec(out)) !== null) failing.push(x[1].trim());
  return { unparseable: false, tests: +mt[1], pass: +mp[1], fail: +mf[1], failing };
}

// edits: array of {file, from, to} | {file, append} | {file, create}
function applyEdits(dir, edits) {
  for (const e of edits) {
    const p = path.join(dir, e.file);
    if (e.create !== undefined) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, e.create); continue; }
    if (e.remove) { fs.rmSync(p, { force: true }); continue; }
    const before = fs.readFileSync(p, 'utf8');
    if (!before.includes(e.from)) return 'literal NOT FOUND in ' + e.file + ': ' + JSON.stringify(e.from.slice(0, 70));
    const after = before.split(e.from).join(e.to);
    if (after === before) return 'no-op replacement in ' + e.file;
    fs.writeFileSync(p, after);
  }
  return null;
}

function scenario(label, edits, opts) {
  opts = opts || {};
  const dir = copyRepo(label.replace(/[^a-z0-9]/gi, ''));
  const applyErr = applyEdits(dir, edits);
  if (applyErr) {
    fs.rmSync(dir, { recursive: true, force: true });
    return { error: 'NOT-APPLIED: ' + applyErr };
  }
  const r = runTests(dir, opts.skip ? SKIP : null);
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.unparseable) return { error: 'UNPARSEABLE' };
  return r;
}

const fmt = r => 'tests=' + r.tests + ' pass=' + r.pass + ' fail=' + r.fail;
const named = (r, frag) => r.failing.some(n => n.includes(frag));

// ---------------------------------------------------------------------------
// Mutation literals (mine, not the builder's)
// ---------------------------------------------------------------------------
const M_C1_UP    = { file: 'README.md', from: 'ranks all 50', to: 'ranks all 51' };
const M_C2_DOWN  = { file: 'README.md', from: '8 are rated HIGH', to: '7 are rated HIGH' };
const M_C6_BIN   = { file: 'README.md', from: 'bin/aphorism.js    entry point', to: 'bin/aphorisms.js   entry point' };
const M_C6_TEST  = { file: 'README.md', from: 'test/              node:test', to: 'tests/             node:test' };
const M_C0_CTRL  = { file: 'README.md', from: '37 distinct tags', to: '38 distinct tags' };

const CORPUS_ADD = {
  file: 'src/corpus.js',
  from: "    tags: ['humor', 'debugging'],\n  },\n];",
  to:   "    tags: ['humor', 'debugging'],\n  },\n  {\n    text: 'Gate probe entry added by the cycle-22 verification harness.',\n    author: 'Conductor',\n    tags: ['design'],\n  },\n];",
};
const README_DESIGN_14 = { file: 'README.md', from: '| `design` | 13 |', to: '| `design` | 14 |' };
const README_51        = { file: 'README.md', from: 'ranks all 50', to: 'ranks all 51' };

const TRIAGE_HIGH = {
  file: 'docs/corpus-attribution-triage.md',
  from: '| MEDIUM | no-primary-source | Reads consistent',
  to:   '| HIGH | no-primary-source | Reads consistent',
};
const README_HIGH_9 = { file: 'README.md', from: '8 are rated HIGH', to: '9 are rated HIGH' };

const NEWFILE  = { file: 'src/formatting.js', create: "'use strict';\nmodule.exports = {};\n" };
const LAYOUT_ADD = {
  file: 'README.md',
  from: 'src/args.js        pure argv parser; returns a usage error, never throws\n',
  to:   'src/args.js        pure argv parser; returns a usage error, never throws\nsrc/formatting.js  shared output helpers\n',
};

const REWORD_ATTR = {
  file: 'README.md',
  from: 'ranks all 50\nentries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what\nwould settle each one.',
  to:   'catalogues all 50\nentries by how doubtful the credit looks — 8 sit in the HIGH band — and records what\nwould settle each one.',
};
const REWORD_LAYOUT = {
  file: 'README.md',
  from: 'src/select.js      pure filtering and (optionally seeded) selection',
  to:   'src/select.js      filtering plus optionally-seeded choice, all pure',
};
const REWORD_C1_WRONG = { file: 'README.md', from: 'catalogues all 50', to: 'catalogues all 52' };

const ATTR_SECTION_TEXT = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8')
  .match(/## Attribution[\s\S]*?(?=\n## Layout)/)[0];
const DROP_ATTR = { file: 'README.md', from: ATTR_SECTION_TEXT, to: '' };

const LAYOUT_FENCE = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8')
  .match(/```\nbin\/aphorism\.js[\s\S]*?```/)[0];
const DROP_FENCE = { file: 'README.md', from: LAYOUT_FENCE, to: 'The entry point stays thin and the logic lives in pure modules.' };

const N1_REORDER = {
  file: 'README.md',
  from: 'ranks all 50\nentries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what',
  to:   'covers every entry. 8 of the 50\nentries carry a rating of HIGH, and it says what',
};

// ---------------------------------------------------------------------------
console.log('--- controls ---');

let r = scenario('pristine', []);
if (r.error) { console.log('CTRL-PRISTINE ' + r.error + ' — ABORT'); process.exit(3); }
report('CTRL-PRISTINE', r.fail === 0 && r.tests === 71, fmt(r) + '  (expect 71/71/0)');
if (r.fail !== 0) { console.log('baseline not green — abort'); process.exit(3); }

r = scenario('denom', [], { skip: true });
report('CTRL-DENOM', !r.error && r.tests === 68 && r.fail === 0,
  (r.error || fmt(r)) + '  (skip pattern must remove exactly the 3 new tests: 68/68/0)');

r = scenario('skipsane', [M_C0_CTRL], { skip: true });
report('CTRL-SKIPSANE', !r.error && r.fail > 0,
  (r.error || fmt(r)) + '  (unrelated mutation still fails under the same pattern)');

console.log('\n--- failable / attributable (conductor mutations) ---');

r = scenario('c1f', [M_C1_UP]);
report('C1.FAILABLE', !r.error && r.fail > 0 && named(r, '(C1)'),
  (r.error || fmt(r) + '  failing: ' + r.failing.join(' | ')) + '  :: "ranks all 50" -> 51 (UP)');
r = scenario('c1a', [M_C1_UP], { skip: true });
report('C1.ATTRIB', !r.error && r.tests === 68 && r.fail === 0, (r.error || fmt(r)) + '  (expect 68/68/0)');

r = scenario('c2f', [M_C2_DOWN]);
report('C2.FAILABLE', !r.error && r.fail > 0 && named(r, '(C2)'),
  (r.error || fmt(r) + '  failing: ' + r.failing.join(' | ')) + '  :: "8 are rated HIGH" -> 7 (DOWN)');
r = scenario('c2a', [M_C2_DOWN], { skip: true });
report('C2.ATTRIB', !r.error && r.tests === 68 && r.fail === 0, (r.error || fmt(r)) + '  (expect 68/68/0)');

r = scenario('c6f', [M_C6_BIN]);
report('C6.FAILABLE', !r.error && r.fail > 0 && named(r, '(C6)'),
  (r.error || fmt(r) + '  failing: ' + r.failing.join(' | ')) + '  :: Layout bin/aphorism.js -> bin/aphorisms.js');
r = scenario('c6a', [M_C6_BIN], { skip: true });
report('C6.ATTRIB', !r.error && r.tests === 68 && r.fail === 0, (r.error || fmt(r)) + '  (expect 68/68/0)');

r = scenario('c6bf', [M_C6_TEST]);
report('C6b.FAILABLE', !r.error && r.fail > 0 && named(r, '(C6)'),
  (r.error || fmt(r)) + '  :: Layout directory entry test/ -> tests/ (different path shape)');

console.log('\n--- R2: does the guard TRACK the real artifact, or hardcode today\'s numbers? ---');

r = scenario('r2at', [CORPUS_ADD, README_DESIGN_14, README_51]);
report('R2a.C1.TRACKS', !r.error && r.fail === 0,
  (r.error || fmt(r) + (r.failing && r.failing.length ? '  failing: ' + r.failing.join(' | ') : '')) +
  '  :: corpus 50->51 + README updated consistently must stay GREEN');
r = scenario('r2as', [CORPUS_ADD, README_DESIGN_14]);
report('R2a.C1.STALE', !r.error && r.fail > 0 && named(r, '(C1)'),
  (r.error || fmt(r)) + '  :: same corpus change, README left stale must FAIL naming C1');

r = scenario('r2bt', [TRIAGE_HIGH, README_HIGH_9]);
report('R2b.C2.TRACKS', !r.error && r.fail === 0,
  (r.error || fmt(r) + (r.failing && r.failing.length ? '  failing: ' + r.failing.join(' | ') : '')) +
  '  :: triage HIGH 8->9 + README updated must stay GREEN');
r = scenario('r2bs', [TRIAGE_HIGH]);
report('R2b.C2.STALE', !r.error && r.fail > 0 && named(r, '(C2)'),
  (r.error || fmt(r)) + '  :: same triage change, README left stale must FAIL naming C2');

r = scenario('r2ct', [NEWFILE, LAYOUT_ADD]);
report('R2c.C6.TRACKS', !r.error && r.fail === 0,
  (r.error || fmt(r)) + '  :: real new file + matching Layout line must stay GREEN');
r = scenario('r2cs', [LAYOUT_ADD]);
report('R2c.C6.STALE', !r.error && r.fail > 0 && named(r, '(C6)'),
  (r.error || fmt(r)) + '  :: Layout line for a file that was never created must FAIL naming C6');

console.log('\n--- R1: prose-keying (the T-012 hazard) ---');

r = scenario('r1n', [REWORD_ATTR, REWORD_LAYOUT]);
report('R1.NOFALSEREJECT', !r.error && r.fail === 0,
  (r.error || fmt(r) + (r.failing && r.failing.length ? '  failing: ' + r.failing.join(' | ') : '')) +
  '  :: prose reworded, digits and paths intact, must stay GREEN');
r = scenario('r1k', [REWORD_ATTR, REWORD_LAYOUT, REWORD_C1_WRONG]);
report('R1.STILLKILLS', !r.error && r.fail > 0 && named(r, '(C1)'),
  (r.error || fmt(r)) + '  :: reworded prose + wrong number must still FAIL naming C1');

console.log('\n--- R5: parse failure must be LOUD, never a silent pass ---');

r = scenario('r5a', [DROP_ATTR]);
report('R5.NOSECTION', !r.error && r.fail > 0,
  (r.error || fmt(r) + '  failing: ' + r.failing.join(' | ')) + '  :: whole Attribution section deleted');
r = scenario('r5f', [DROP_FENCE]);
report('R5.NOFENCE', !r.error && r.fail > 0 && named(r, '(C6)'),
  (r.error || fmt(r)) + '  :: Layout fenced block replaced by prose');

console.log('\n--- N1: conductor probe, RECORDED not gated ---');
r = scenario('n1', [N1_REORDER]);
console.log('      N1.REORDER          ' + (r.error || fmt(r) +
  (r.failing && r.failing.length ? '  failing: ' + r.failing.join(' | ') : '')) +
  '\n                          :: honest reword putting 50 nearer to HIGH than 8 ("8 of the 50 entries carry a rating of HIGH")');

console.log('\n--- scope ---');
{
  const head = execFileSync('git', ['-C', TARGET, 'show', 'HEAD:test/readme-tags.test.js'], { encoding: 'utf8' });
  const now = fs.readFileSync(path.join(TARGET, 'test/readme-tags.test.js'), 'utf8');
  report('SCOPE.PREFIX', now.startsWith(head),
    'every pre-existing byte is an unmodified prefix (HEAD ' + head.length + ' B, now ' + now.length + ' B)');
  const changed = execFileSync('git', ['-C', TARGET, 'diff', '--name-only', 'HEAD'], { encoding: 'utf8' })
    .split('\n').filter(Boolean);
  report('SCOPE.ONEFILE', changed.length === 1 && changed[0] === 'test/readme-tags.test.js',
    'tracked files changed: ' + JSON.stringify(changed));
  report('SCOPE.SCRATCH', !fs.existsSync(path.join(TARGET, '.swarm/scratch')),
    'builder scratch DIRECTORY removed: ' + !fs.existsSync(path.join(TARGET, '.swarm/scratch')));
}

console.log('\n=== ' + pass + ' pass / ' + fail + ' fail ===');
process.exit(fail === 0 ? 0 : 1);
