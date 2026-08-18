#!/usr/bin/env node
// cycle-31 CONDUCTOR VERIFICATION GATE for T-024a. Authored at verification time.
// The builder never saw these cells. Every cell is run on BOTH arms:
//   FIXED = the working tree as the builder left it
//   HEAD  = test/readme-tags.test.js reverted to the committed version
// so each verdict is ATTRIBUTED to the change rather than merely observed.
//
// Restores README.md and test/readme-tags.test.js unconditionally.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..', '..');
const README = path.join(REPO, 'README.md');
const TESTFILE = path.join(REPO, 'test', 'readme-tags.test.js');

const README_ORIG = fs.readFileSync(README, 'utf8');
const TEST_FIXED = fs.readFileSync(TESTFILE, 'utf8');
const TEST_HEAD = execFileSync('git', ['show', 'HEAD:test/readme-tags.test.js'],
  { cwd: REPO, encoding: 'utf8' });

const SHIPPED =
  '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md) ranks all 50\n' +
  'entries by how likely the attribution is to be wrong — 8 are rated HIGH — and says what\n' +
  'would settle each one.';

if (!README_ORIG.includes(SHIPPED)) {
  console.error('FATAL: shipped Attribution paragraph not found verbatim -- gate is stale, refusing to run');
  process.exit(3);
}
if (TEST_FIXED === TEST_HEAD) {
  console.error('FATAL: working tree test file is identical to HEAD -- nothing to attribute, refusing to run');
  process.exit(3);
}

const LINK = '[`docs/corpus-attribution-triage.md`](docs/corpus-attribution-triage.md)';

// TRUTH: corpus.length is 50; the triage doc has 8 HIGH rows. Any cell whose
// numbers are both true MUST be green; any cell stating a false number MUST be
// red, and red naming THAT number.
const CELLS = {
  // ---- sealed pre-commitment (measured at HEAD before dispatch) ----
  G0: { why: 'control: untouched README', para: SHIPPED, expect: 'C1 GREEN / C2 GREEN' },

  G1: { why: 'THE ITEM: dashes removed, every number TRUE', expect: 'C1 GREEN / C2 GREEN (was C2 read 50)',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong. 8 of the 50 entries are rated HIGH,\nand it says what would settle each one.' },

  G2: { why: 'THE CELL THAT MATTERS: wrong HIGH (9) in the reworded shape', expect: 'C2 RED reading 9, not 50',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong. 9 of the 50 entries are rated HIGH,\nand it says what would settle each one.' },

  G3: { why: 'kill preserved: wrong HIGH (9), shipped dashed shape', expect: 'C2 RED reading 9',
    para: SHIPPED.replace('8 are rated HIGH', '9 are rated HIGH') },

  G4: { why: 'kill preserved: wrong corpus size (51), shipped dashed shape', expect: 'C1 RED reading 51',
    para: SHIPPED.replace('ranks all 50', 'ranks all 51') },

  G5: { why: 'kill preserved: wrong corpus size (51) reworded; HIGH claim (8) still TRUE', expect: 'C1 RED reading 51 / C2 GREEN',
    para: LINK + ' ranks all 51\nentries by how likely the attribution is to be wrong. 8 of the 51 entries are rated HIGH,\nand it says what would settle each one.' },

  G6: { why: 'parse miss: HIGH marker absent entirely', expect: 'C2 PARSE-MISS, never a guessed number',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong, and says what would settle each one.' },

  // ---- DISCRIMINATORS the builder never saw ----
  // D1 asks the question the report does not: is "first number in the clause"
  // a re-shape, or just the mirror image of "last number in the clause"?
  // Every number here is TRUE and the word order is entirely natural.
  D1: { why: 'DISCRIMINATOR: subject-last word order, every number TRUE', expect: 'GREEN if the rule reads grammar; RED if it just flipped first/last',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong. Of the 50 entries, 8 are rated HIGH,\nand it says what would settle each one.' },

  // D2: the same false claim as G2, in D1's word order. Tests whether the
  // failure still NAMES the wrong number when the word order moves.
  D2: { why: 'DISCRIMINATOR: wrong HIGH (9) in subject-last word order', expect: 'RED naming 9 if attribution is real',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong. Of the 50 entries, 9 are rated HIGH,\nand it says what would settle each one.' },

  // D3: parenthetical aside instead of a dashed one. All numbers TRUE.
  D3: { why: 'DISCRIMINATOR: parenthetical aside, every number TRUE', expect: 'GREEN',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong (8 are rated HIGH) and says what\nwould settle each one.' },

  // D4: SILENT-HOLE probe, the only direction that is not allowed to regress.
  // A FALSE HIGH claim (9) with a TRUE 8 sitting adjacent to the marker.
  // If any arm reports GREEN here, that arm passes a wrong README silently.
  D4: { why: 'SILENT-HOLE PROBE: false HIGH claim (9) with a true 8 adjacent to the marker', expect: 'RED on both arms -- GREEN here is a silent hole',
    para: LINK + ' ranks all 50\nentries by how likely the attribution is to be wrong. 9 entries carry the top rating; 8 is\nthe number of rows this repo would call HIGH.' },
};

function classify(out, which) {
  const marker = which === 'C1' ? '\\(C1\\)' : '\\(C2\\)';
  if (!new RegExp('^not ok .*' + marker, 'm').test(out)) return 'GREEN';
  if (which === 'C1') {
    if (/could not find a "<N> entries" claim/.test(out)) return 'PARSE-MISS';
    const m = out.match(/states the triage doc ranks (\d+) entries/);
    return m ? 'MISMATCH(read ' + m[1] + ')' : 'RED-UNCLASSIFIED';
  }
  if (/could not find a "<N> are rated HIGH" claim/.test(out)) return 'PARSE-MISS';
  const m = out.match(/section states (\d+) entries are rated HIGH/);
  return m ? 'MISMATCH(read ' + m[1] + ')' : 'RED-UNCLASSIFIED';
}

function runSuite(file) {
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap', file], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const n = re => Number((out.match(re) || [, '?'])[1]);
  return { tests: n(/^# tests (\d+)/m), pass: n(/^# pass (\d+)/m), fail: n(/^# fail (\d+)/m), out };
}

const rows = [];
try {
  for (const [name, cell] of Object.entries(CELLS)) {
    fs.writeFileSync(README, README_ORIG.replace(SHIPPED, cell.para));
    const arm = {};
    for (const [armName, src] of [['FIXED', TEST_FIXED], ['HEAD', TEST_HEAD]]) {
      fs.writeFileSync(TESTFILE, src);
      const r = runSuite('test/readme-tags.test.js');
      arm[armName] = { ...r, c1: classify(r.out, 'C1'), c2: classify(r.out, 'C2') };
    }
    rows.push([name, cell, arm]);
    const f = arm.FIXED, h = arm.HEAD;
    console.log(
      name.padEnd(3) +
      ' FIXED ' + (f.tests + '/' + f.pass + '/' + f.fail).padEnd(10) +
      'C1=' + f.c1.padEnd(18) + 'C2=' + f.c2.padEnd(18) +
      '| HEAD ' + (h.tests + '/' + h.pass + '/' + h.fail).padEnd(10) +
      'C1=' + h.c1.padEnd(18) + 'C2=' + h.c2
    );
    console.log('    ' + cell.why);
    console.log('    expect: ' + cell.expect + '\n');
  }
} finally {
  fs.writeFileSync(README, README_ORIG);
  fs.writeFileSync(TESTFILE, TEST_FIXED);
}

const clean = fs.readFileSync(README, 'utf8') === README_ORIG &&
              fs.readFileSync(TESTFILE, 'utf8') === TEST_FIXED;
console.log('README + test file restored byte-identical: ' + clean);
if (!clean) process.exit(2);
