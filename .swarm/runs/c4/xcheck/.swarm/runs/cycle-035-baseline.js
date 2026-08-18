// cycle 35 pre-dispatch baseline for T-031 (SILENT: a contradictory count whose
// digit sits across a dash boundary from its marker is never bound).
//
// Method: copy the tree to a temp dir, mutate ONLY README.md, run the real suite
// with `node --test test/*.test.js`, record pass/fail counts and the C1/C2 messages.
// Nothing here touches the target's working tree.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const EM = '—'; // EM DASH, the character collectMarkerBindings splits on
const ATTR_TAIL = 'Nothing in that list has been resolved yet.';

function copyTree(dest) {
  fs.cpSync(REPO, dest, {
    recursive: true,
    filter: (src) => !src.includes('/.git') && !src.includes('/.swarm'),
  });
}

// Append a sentence to the end of the Attribution section.
function appendToAttribution(readme, sentence) {
  if (!readme.includes(ATTR_TAIL)) throw new Error('anchor missing');
  return readme.replace(ATTR_TAIL, ATTR_TAIL + ' ' + sentence);
}

const CELLS = [
  {
    id: 'B0',
    what: 'pristine README (control)',
    mutate: (r) => r,
    expect: 'GREEN',
  },
  {
    id: 'B1',
    what: 'THE FILED SHAPE: contradictory 9, digit across an EM DASH from its markers',
    mutate: (r) => appendToAttribution(r, `A later audit note records 9 ${EM} HIGH entries ${EM} in total.`),
    expect: 'GREEN (silent hole)',
  },
  {
    id: 'B1b',
    what: 'DISCRIMINATOR: same sentence, ASCII "--" instead of em dashes (no clause split)',
    mutate: (r) => appendToAttribution(r, 'A later audit note records 9 -- HIGH entries -- in total.'),
    expect: 'RED (if GREEN, the em dash is NOT the mechanism)',
  },
  {
    id: 'B2',
    what: 'T-032 / cycle-34 cell G9: entirely TRUE prose carrying two markers',
    mutate: (r) => appendToAttribution(r, 'Of those, 3 HIGH entries name a primary source.'),
    expect: 'RED fail=2 (live false rejection)',
  },
  {
    id: 'B3',
    what: 'existing kill: single false HIGH count',
    mutate: (r) => r.replace('8 are rated HIGH', '9 are rated HIGH'),
    expect: 'RED',
  },
  {
    id: 'B4',
    what: 'cycle-34 cell G1: contradictory 9 in a LATER dash clause (T-029 closed this)',
    mutate: (r) => appendToAttribution(r, `A later note ${EM} records that 9 are rated HIGH overall ${EM} as well.`),
    expect: 'RED',
  },
];

function runCell(cell) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c35-'));
  try {
    copyTree(dir);
    const readmePath = path.join(dir, 'README.md');
    fs.writeFileSync(readmePath, cell.mutate(fs.readFileSync(readmePath, 'utf8')));
    let out;
    let code = 0;
    try {
      // test_cmd is `node --test test/*.test.js`; execFileSync does not glob, so
      // expand it here rather than shelling out.
      const files = fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
      out = execFileSync('node', ['--test', ...files], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
      code = e.status;
    }
    const num = (label) => (out.match(new RegExp('^\\D*' + label + ' (\\d+)$', 'm')) || [])[1];
    const pass = num('pass');
    const fail = num('fail');
    const tests = num('tests');
    const msgs = [...out.matchAll(/README Attribution section states ([^\n]*)/g)].map((m) => m[1].slice(0, 160));
    const loud = [...out.matchAll(/could not find a "([^"]*)" claim/g)].map((m) => m[1]);
    return { tests, pass, fail, code, verdict: code === 0 ? 'GREEN' : 'RED', msgs, loud, raw: out };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

for (const cell of CELLS) {
  const r = runCell(cell);
  console.log(`${cell.id}  ${r.verdict}  ${r.pass}/${r.tests} fail=${r.fail}  ${cell.what}`);
  console.log(`     expected: ${cell.expect}`);
  for (const m of r.msgs) console.log(`     msg: ${m}`);
  for (const l of r.loud) console.log(`     LOUD-MISS: could not find "${l}"`);
  if (r.pass === undefined) {
    console.log('     RAW TAIL:\n' + r.raw.split('\n').slice(-25).map((l) => '       ' + l).join('\n'));
  }
}
