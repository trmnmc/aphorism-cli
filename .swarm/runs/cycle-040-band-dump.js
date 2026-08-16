#!/usr/bin/env node
// cycle-040 — T-026 MECHANISM probe. The main probe measured that cell C1
// ("Requires Node 18+ to run." between a band heading and its table) fails the
// suite at 2 guards. It did NOT establish WHY, and my reading of the extractor
// predicted something specific and falsifiable:
//
//   the stop rule does not PREVENT mis-attachment, it RELOCATES it -- the prose
//   line itself becomes a candidate heading, matches its own "18+" band token,
//   scans forward, finds the very table the real heading was just stopped from
//   reaching, and grafts it on as a band [18, Infinity).
//
// This dumps the extractor's actual output for the pristine and C1 layouts so
// the claim is measured, not read. Prediction is printed BEFORE the result.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(REPO, 'test', 'readme-tags.test.js'), 'utf8');

// Lift the two helpers out of the test file verbatim (no re-implementation --
// a re-implementation would measure my copy, not the shipped extractor).
function lift(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('helper not found: ' + name);
  let depth = 0, i = src.indexOf('{', start), started = false;
  for (; i < src.length; i++) {
    if (src[i] === '{') { depth++; started = true; }
    else if (src[i] === '}') { depth--; if (started && depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}
const assert = require('assert');
const mod = { exports: {} };
// eslint-disable-next-line no-new-func
const make = new Function('assert', lift('lineHasBandToken') + '\n' + lift('extractBandTablesFromReadme') + '\n' + lift('getTagVocabSection') +
  '\nreturn {lineHasBandToken, extractBandTablesFromReadme, getTagVocabSection};');
const H = make(assert);

const PRISTINE = execFileSync('git', ['-C', REPO, 'show', 'HEAD:README.md'], { encoding: 'utf8', maxBuffer: 1 << 24 });
const BAND_HEADING = '4 tags have a robust pool (5+ entries):';
const TABLE_HEAD = '| Tag | Count |\n|---|---|\n| `design` | 13 |';
const C1 = PRISTINE.replace(BAND_HEADING + '\n' + TABLE_HEAD, BAND_HEADING + '\n\nRequires Node 18+ to run.\n\n' + TABLE_HEAD);
if (C1 === PRISTINE) throw new Error('C1 edit did not apply');

console.log('PREDICTION (written before the result below was read):');
console.log('  pristine -> 2 bands: [5,inf) and [2,4]');
console.log('  C1       -> the [5,inf) heading loses its table; a SPURIOUS band [18,inf)');
console.log('              appears, owning the very rows the real heading was denied.\n');

function dump(label, text) {
  const bands = H.extractBandTablesFromReadme(H.getTagVocabSection(text));
  console.log('--- ' + label + ' : ' + bands.length + ' band(s) ---');
  for (const b of bands) {
    console.log('  heading : "' + b.headingLine.trim() + '"');
    console.log('  bounds  : [' + b.min + ', ' + (b.max === Infinity ? 'inf' : b.max) + ']');
    console.log('  rows    : ' + JSON.stringify(b.rows));
  }
  console.log('');
  return bands;
}

const p = dump('PRISTINE', PRISTINE);
const c = dump('C1  (prose "Requires Node 18+ to run." between heading and table)', C1);

const spurious = c.filter((b) => b.min === 18);
const lostFivePlus = !c.some((b) => b.min === 5 && b.max === Infinity);
console.log('=== verdict ===');
console.log('  real [5,inf) band lost in C1                : ' + lostFivePlus);
console.log('  spurious [18,inf) band created in C1        : ' + (spurious.length > 0));
if (spurious.length) {
  const rowsMatch = JSON.stringify(spurious[0].rows) === JSON.stringify(p.find((b) => b.min === 5).rows);
  console.log('  spurious band owns the REAL band\'s rows     : ' + rowsMatch);
  console.log('  spurious heading line                       : "' + spurious[0].headingLine.trim() + '"');
}
console.log('  PREDICTION CONFIRMED                        : ' + (lostFivePlus && spurious.length > 0));
