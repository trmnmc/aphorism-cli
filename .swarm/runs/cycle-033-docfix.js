// Does the RECOMMENDED fix (make band headings real markdown headings, so the
// extractor can stop on structure instead of a digit shape) actually work?
// Recommending an unmeasured fix is the overclaim this repo keeps removing, so
// this measures the extractor directly. It deliberately does NOT run the suite:
// the T-025 test carries its own in-test fixture built from PROSE headings, so a
// document change also requires migrating that fixture -- named, not hidden.
const fs = require('fs');
const SRC = '/opt/targets/aphorism-cli';
const TF = fs.readFileSync(SRC + '/test/readme-tags.test.js', 'utf8');
const STOP_OLD = '      if (lineHasBandToken(lines[idx])) {';
const F_MD = t => t.replace(STOP_OLD, '      if (/^\\s{0,3}#{1,6}\\s/.test(lines[idx])) {');

function load(t) {
  const start = t.indexOf('function lineHasBandToken');
  const end = t.indexOf('\ntest(', start);
  const mod = { exports: {} };
  new Function('module', 'exports', 'assert', 'require',
    t.slice(start, end) + '\nmodule.exports = { extractBandTablesFromReadme };')(
    mod, mod.exports, require('assert'), require);
  return mod.exports.extractBandTablesFromReadme;
}
const show = bs => bs.map(b =>
  '[' + b.min + ',' + (b.max === Infinity ? 'inf' : b.max) + '] rows=' +
  Object.keys(b.rows).sort().join(',')).join('   ') || '(none)';

// Band headings promoted to REAL markdown headings (#### ...).
const MD_OK = [
  '#### 4 tags have a robust pool (5+ entries):',
  '',
  'Requires Node 18+ to run.',
  '',
  '| Tag | Count |', '|---|---|',
  '| `design` | 13 |', '| `simplicity` | 10 |', '| `humor` | 9 |', '| `debugging` | 5 |',
  '',
  '#### 12 tags appear 2-4 times:',
  '| Tag | Count |', '|---|---|',
  '| `performance` | 4 |', '| `language` | 3 |',
].join('\n');

// The SAME mis-attachment hazard, under markdown headings: the 5+ heading's own
// table is gone. A structural stop rule must refuse to reach past the second
// heading and steal its table.
const MD_MISATTACH = [
  '#### 4 tags have a robust pool (5+ entries):',
  '',
  'The table for this band was removed by mistake.',
  '',
  '#### 12 tags appear 2-4 times:',
  '| Tag | Count |', '|---|---|',
  '| `performance` | 4 |', '| `language` | 3 |',
].join('\n');

// F_MD2: the COMPLETE structural re-shape -- markdown structure read in BOTH
// places. A line is only a candidate band heading if it IS a markdown heading
// (closes defect 2, the promotion of prose to a heading), and the scan stops at
// the next markdown heading (closes defect 1, the digit-shape stop rule).
const F_MD2 = t => {
  const CAND = '    const headingLine = lines[i];';
  if (!t.includes(CAND)) throw new Error('candidate anchor missing');
  return F_MD(t).replace(CAND,
    CAND + '\n    if (!/^\\s{0,3}#{1,6}\\s/.test(headingLine)) continue;');
};

for (const [armName, arm] of [['HEAD', t => t], ['F_MD', F_MD], ['F_MD2', F_MD2]]) {
  const ex = load(arm(TF));
  for (const [label, txt] of [['doc-fixed, Node 18+ prose', MD_OK],
                              ['doc-fixed, MIS-ATTACH hazard', MD_MISATTACH]]) {
    let out; try { out = show(ex(txt)); } catch (e) { out = 'THREW: ' + e.message; }
    console.log((armName + ' / ' + label).padEnd(42) + ' -> ' + out);
  }
}
