#!/usr/bin/env node
// cycle 2 gate, closing checks.
//   (a) Are the two remaining silent holes (English number words, fullwidth
//       digits) REGRESSIONS introduced by this change, or pre-existing? The
//       builder asserted pre-existing; asserting is not measuring. Run both
//       cells on the HEAD arm.
//   (b) test_cmd on the REAL working tree, not a copy.
//   (c) derive-never-hardcode: does the new test code compare a README number
//       against a digit literal written in the test file?

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SRC = '/opt/targets/aphorism-cli';
const READMETESTS = ['--test', 'test/readme-tags.test.js'];

function copy(arm) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c2g3-'));
  execFileSync('cp', ['-a', SRC + '/.', dir]);
  fs.rmSync(path.join(dir, '.swarm'), { recursive: true, force: true });
  if (arm === 'HEAD') {
    for (const f of ['README.md', 'test/readme-tags.test.js']) {
      fs.writeFileSync(path.join(dir, f),
        execFileSync('git', ['-C', SRC, 'show', 'HEAD:' + f], { encoding: 'utf8' }));
    }
  }
  return dir;
}
function run(dir, cmd) {
  try { return execFileSync('node', cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
function fails(out) {
  const m = out.match(/^(?:ℹ |# )fail (\d+)/m);
  return m ? +m[1] : null;
}
function attrBounds(r) {
  const s = r.indexOf('## Attribution');
  const n = r.indexOf('\n## ', s + 1);
  return [s, n === -1 ? r.length : n + 1];
}
function appendToProse(readme, sentence) {
  const [s, e] = attrBounds(readme);
  const sec = readme.slice(s, e).replace(/\n+$/, '');
  const lines = sec.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].trim().startsWith('|') && !lines[i].startsWith('## ')) last = i;
  }
  lines[last] += ' ' + sentence;
  return readme.slice(0, s) + lines.join('\n') + '\n\n' + readme.slice(e);
}

console.log('=== (a) are the two remaining holes REGRESSIONS or PRE-EXISTING? ===');
console.log('Both cells state a FALSE count (the true HIGH count is 8). RED is the correct');
console.log('verdict. If HEAD is also GREEN, the hole predates this change and is not a');
console.log('regression — it is a boundary this change failed to close, which is a different');
console.log('and much smaller claim.');
console.log('');
const HOLES = [
  ['N6 English number word : "Nine of those entries are rated HIGH."', 'Nine of those entries are rated HIGH.'],
  ['N7 fullwidth digit U+FF19: "９ entries are rated HIGH."', '９ entries are rated HIGH.'],
];
for (const [label, sentence] of HOLES) {
  const line = [];
  for (const arm of ['HEAD', 'FIX']) {
    const d = copy(arm);
    const rp = path.join(d, 'README.md');
    fs.writeFileSync(rp, appendToProse(fs.readFileSync(rp, 'utf8'), sentence));
    const f = fails(run(d, READMETESTS));
    line.push(arm + '=' + (f === 0 ? 'GREEN (hole)' : f === null ? 'UNPARSED' : 'RED (caught)'));
    fs.rmSync(d, { recursive: true, force: true });
  }
  console.log(label);
  console.log('    ' + line.join('   '));
}

console.log('');
console.log('=== (b) test_cmd on the REAL working tree ===');
const real = run(SRC, ['--test', 'test/args.test.js', 'test/cli.test.js', 'test/readme-tags.test.js', 'test/select.test.js']);
console.log(real.split('\n').filter((l) => /^ℹ (tests|pass|fail|duration_ms)/.test(l)).join('\n'));

console.log('');
console.log('=== (c) derive-never-hardcode: digit literals in the new Attribution guard code ===');
const src = fs.readFileSync(path.join(SRC, 'test', 'readme-tags.test.js'), 'utf8');
const lines = src.split('\n');
const start = lines.findIndex((l) => l.includes('function parseAttributionCountsTable'));
const endIdx = lines.findIndex((l, i) => i > start && l.includes('function parseTriageRiskRows'));
const c7end = lines.length;
// scan the whole Attribution guard region: locator through the last C7 line
const c1 = lines.findIndex((l) => l.includes('(C1)') && l.startsWith('test('));
const region = lines.slice(start, endIdx).concat(lines.slice(c1, c7end));
const suspicious = [];
region.forEach((l) => {
  const code = l.replace(/\/\/.*$/, '');            // drop comments
  if (/^\s*$/.test(code)) return;
  const stripped = code.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""'); // drop string literals
  const m = stripped.match(/(?<![\w$])\d+(?![\w$])/g);
  if (m) suspicious.push([m.join(','), code.trim().slice(0, 110)]);
});
if (!suspicious.length) {
  console.log('no bare numeric literals in code positions in the Attribution guard region');
} else {
  console.log('bare numeric literals found in code positions — each judged below:');
  for (const [nums, code] of suspicious) console.log('  [' + nums + ']  ' + code);
}
console.log('');
console.log('the three truths these guards compare against, and where each comes from:');
for (const pat of ['corpus.length', 'riskRows.length', "risk === 'HIGH'", 'parseTriageRiskRows(']) {
  const hits = lines.map((l, i) => [i + 1, l]).filter(([, l]) => l.includes(pat) && !l.trim().startsWith('//'));
  console.log('  ' + pat.padEnd(20) + hits.map(([n]) => 'L' + n).join(' '));
}
