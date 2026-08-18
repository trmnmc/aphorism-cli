// Cycle 29 -- conductor probe N1, run AFTER the 20/20 gate and asked by no
// acceptance clause.
//
// Gap being closed: every wrong-README variant in the gate had a band-token
// heading, so the shipped stop-at-band-token rule could always see the
// boundary. The shape it CANNOT see is an ORPHAN TABLE -- a table whose
// preceding heading carries no band token at all (to the scanner it is just
// prose). A heading whose own table was deleted can read straight past such
// a line and adopt the orphan's table.
//
// Cycle 28's lesson: the decisive probe is the one the acceptance never asked
// for, and the failure that matters is a WRONG README going GREEN.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/opt/targets/aphorism-cli';
const TESTFILE = 'test/readme-tags.test.js';
const README = 'README.md';

const newTest = fs.readFileSync(path.join(REPO, TESTFILE), 'utf8');
const headTest = execFileSync('git', ['-C', REPO, 'show', 'HEAD:' + TESTFILE], { encoding: 'utf8' });
const readme = fs.readFileSync(path.join(REPO, README), 'utf8');

const H5 = '4 tags have a robust pool (5+ entries):';
const T5 = `| Tag | Count |
|---|---|
| \`design\` | 13 |
| \`simplicity\` | 10 |
| \`humor\` | 9 |
| \`debugging\` | 5 |`;

function run(readmeText, testText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c29-n1-'));
  try {
    execFileSync('cp', ['-a', REPO + '/.', dir], { stdio: 'ignore' });
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
    fs.writeFileSync(path.join(dir, README), readmeText);
    fs.writeFileSync(path.join(dir, TESTFILE), testText);
    let out = '';
    try {
      out = execFileSync('bash', ['-c', 'cd ' + JSON.stringify(dir) +
        ' && node --test --test-reporter=tap test/*.test.js 2>&1'],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
    const m = re => { const x = out.match(re); return x ? parseInt(x[1], 10) : null; };
    const tests = m(/^# tests (\d+)/m), pass = m(/^# pass (\d+)/m), fail = m(/^# fail (\d+)/m);
    const failing = [];
    for (const l of out.split('\n')) { const n = l.match(/^not ok \d+ - (.*)$/); if (n) failing.push(n[1].trim()); }
    return { parsed: tests !== null, tests, pass, fail, failing };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const sig = r => r.parsed ? r.tests + '/' + r.pass + '/' + r.fail : 'UNPARSEABLE';

// P1 -- WRONG README. The 5+ band's table is deleted outright (the README now
// says nothing about design/simplicity/humor/debugging), replaced by prose.
// Below it sits an ORPHAN table under a heading with NO band token, holding
// unrelated single-entry tags. The 5+ heading can read past that heading and
// adopt the orphan table.
const P1 = readme.replace(H5 + '\n' + T5,
  H5 + '\n\nSee the listing below.\n\nOther tags of note:\n\n' +
  '| Tag | Count |\n|---|---|\n| `caching` | 1 |\n| `naming` | 1 |');

// P2 -- WRONG README, the nastier variant: the orphan table's rows are chosen
// to look plausible for the 5+ band (they are real 5+ tags) but INCOMPLETE --
// `debugging` is missing. If adoption is silent, the README has quietly
// dropped a tag and the suite would not say so.
const P2 = readme.replace(H5 + '\n' + T5,
  H5 + '\n\nSee the listing below.\n\nOther tags of note:\n\n' +
  '| Tag | Count |\n|---|---|\n| `design` | 13 |\n| `simplicity` | 10 |\n| `humor` | 9 |');

for (const [name, rm] of [['P1_orphan_unrelated_rows', P1], ['P2_orphan_plausible_incomplete', P2]]) {
  const rn = run(rm, newTest);
  const rh = run(rm, headTest);
  const silent = rh.fail > 0 && rn.fail === 0;
  console.log('\n--- ' + name + ' (WRONG README) ---');
  console.log('  HEAD ' + sig(rh) + '   NEW ' + sig(rn));
  if (rn.failing.length) console.log('  NEW fails: ' + rn.failing.slice(0, 3).join(' | '));
  console.log('  VERDICT: ' + (silent
    ? 'SILENT HOLE -- the fix traded a caught defect for a green suite. REJECT.'
    : (rn.fail > 0 ? 'caught (loud) -- no silent hole' : 'green at HEAD too -- not a regression')));
}
