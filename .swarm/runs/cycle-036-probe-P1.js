// cycle 36 probe P1 -- conductor measurement of a NEW prose-anchor member,
// found while adjudicating the T-027 builder's fourth volunteered uncertainty
// ("other files/sections may carry British-only or literal-wording locks").
//
// The suspect: test/readme-tags.test.js:160, 'README should acknowledge
// single-entry tag limitation'. It asserts the README contains one of the
// LITERAL strings 'exactly one' | 'single-entry' | 'Single-entry', anywhere in
// the document. That is a prose-CONTENT anchor, not an extraction anchor -- a
// different shape from every member of the T-024 family so far.
//
// Question measured: does an honest rewording that still plainly acknowledges
// the limitation turn the suite RED? And is the failure LOUD or silent?
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');

const CELLS = [
  { id: 'P0', what: 'pristine README (control)', mutate: (r) => r },
  {
    id: 'P1',
    what: 'HONEST REWORD: both anchor phrases replaced, limitation still plainly stated',
    mutate: (r) =>
      r
        .replace('the remaining 21 appear on exactly one entry.', 'the remaining 21 appear just once.')
        .replace(
          'Single-entry tags are real',
          'Tags with only one aphorism are real'
        ),
  },
  {
    id: 'P2',
    what: 'THE REAL FAILURE this test exists to catch: limitation not acknowledged AT ALL',
    mutate: (r) =>
      r
        .replace('the remaining 21 appear on exactly one entry.', 'they are distributed across the corpus.')
        .replace(
          /Single-entry tags are real.*?every time\./s,
          'Every tag matches real aphorisms in the corpus.'
        ),
  },
  {
    id: 'P3',
    what: 'DEGENERATE: anchor phrase present but in a totally unrelated sentence',
    mutate: (r) =>
      r
        .replace('the remaining 21 appear on exactly one entry.', 'the remaining 21 appear just once.')
        .replace(
          /Single-entry tags are real.*?every time\./s,
          'Every tag matches real aphorisms in the corpus. Install with exactly one command.'
        ),
  },
];

function run(cell) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-p36-'));
  try {
    fs.cpSync(REPO, dir, { recursive: true, filter: (s) => !s.includes('/.git') && !s.includes('/.swarm') });
    const readmePath = path.join(dir, 'README.md');
    const before = fs.readFileSync(readmePath, 'utf8');
    const after = cell.mutate(before);
    if (cell.id !== 'P0' && after === before) throw new Error(cell.id + ': mutation was a no-op -- probe invalid');
    fs.writeFileSync(readmePath, after);
    let out;
    let code = 0;
    try {
      const files = fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
      out = execFileSync('node', ['--test', ...files], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
      code = e.status;
    }
    const num = (l) => (out.match(new RegExp('^\\D*' + l + ' (\\d+)$', 'm')) || [])[1];
    return {
      verdict: code === 0 ? 'GREEN' : 'RED',
      pass: num('pass'),
      tests: num('tests'),
      acknowledgeFired: /README should acknowledge that some tags appear only once/.test(out),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const g = {};
for (const c of CELLS) {
  const r = run(c);
  g[c.id] = r;
  console.log(
    c.id.padEnd(4) + (r.verdict + ' ' + r.pass + '/' + r.tests).padEnd(12) +
    (r.acknowledgeFired ? 'ACK-TEST FIRED  ' : '                ') + c.what
  );
}

console.log('');
console.log('FINDING 1 (false rejection):   honest reword P1 is ' + g.P1.verdict +
  (g.P1.verdict === 'RED' ? ' -- the guard rejects a README that still states the limitation' : ' -- no false rejection'));
console.log('FINDING 2 (real catch works):  P2 is ' + g.P2.verdict + ', ack-test fired: ' + g.P2.acknowledgeFired);
console.log('FINDING 3 (silent pass):       degenerate P3 is ' + g.P3.verdict +
  (g.P3.verdict === 'GREEN' ? ' -- an unrelated sentence containing the literal SATISFIES the guard' : ''));
