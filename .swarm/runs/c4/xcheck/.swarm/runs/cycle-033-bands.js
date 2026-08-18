// Directly instrument extractBandTablesFromReadme on the V1 README under each
// arm, and print the BANDS it actually discovers. Test names cannot tell me
// which mechanism produced a failure; this can.
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const SRC = '/opt/targets/aphorism-cli';
const RD = fs.readFileSync(SRC + '/README.md', 'utf8');
const TF = fs.readFileSync(SRC + '/test/readme-tags.test.js', 'utf8');
const H5 = '4 tags have a robust pool (5+ entries):';

const STOP_OLD = '      if (lineHasBandToken(lines[idx])) {';
const ARMS = {
  HEAD: t => t,
  F_COLON: t => t.replace(STOP_OLD,
    '      if (lineHasBandToken(lines[idx]) && /:\\s*$/.test(lines[idx])) {'),
};

function v1(r) {
  const i = r.indexOf(H5), e = i + H5.length;
  return r.slice(0, e) + '\nRequires Node 18+ to run.' + r.slice(e);
}

// Pull the two helpers out of the test file and eval them standalone, so no
// test framework is involved and nothing is inferred from a test name.
function bandsFor(armName, readme) {
  const t = ARMS[armName](TF);
  const start = t.indexOf('function lineHasBandToken');
  const endMark = '\ntest(';
  const end = t.indexOf(endMark, start);
  const src = t.slice(start, end);
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'assert', 'require',
    src + '\nmodule.exports = { extractBandTablesFromReadme, lineHasBandToken };');
  fn(mod, mod.exports, require('assert'), require);
  const { extractBandTablesFromReadme } = mod.exports;
  const secStart = readme.indexOf('## Tag vocabulary');
  const secEnd = readme.indexOf('\n## ', secStart + 1);
  const section = readme.substring(secStart, secEnd > -1 ? secEnd : readme.length);
  return extractBandTablesFromReadme(section);
}

for (const arm of ['HEAD', 'F_COLON']) {
  for (const [label, rd] of [['V0 pristine', RD], ['V1 Node-18+ prose', v1(RD)]]) {
    let out;
    try {
      out = bandsFor(arm, rd).map(b =>
        '[' + b.min + ',' + (b.max === Infinity ? 'inf' : b.max) + '] rows=' +
        Object.keys(b.rows).sort().join(',')).join('   ');
    } catch (e) { out = 'THREW: ' + e.message; }
    console.log((arm + ' / ' + label).padEnd(28) + ' -> ' + out);
  }
}
