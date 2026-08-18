// cycle 36 verification gate for T-027 (builder verdict: HOLE, fix shipped).
//
// Authored by the conductor at verification time from the SEALED design in
// cycle-036-precommit.md, whose sha256 was committed BEFORE the builder was
// dispatched (cycle-036-precommit.sha256) and whose plaintext was DELETED from
// disk for the whole dispatch window. The builder never saw these cells.
//
// Arms:
//   HEAD  the committed file (git show HEAD:...)  -- the fix REMOVED
//   WORK  the working tree as the builder left it -- the fix PRESENT
//   REF   HEAD with the intended one-character widen applied BY THIS GATE,
//         so "the builder's fix works" and "the intended fix works" are two
//         independent measurements.
//
// HEAD is literally WORK with the change removed, so the HEAD-vs-WORK column
// pair proves BOTH L-029 directions in one comparison.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const TESTFILE = 'test/readme-tags.test.js';
const BRITISH = '### `--list` behaviour';

const HEAD_SRC = execFileSync('git', ['-C', REPO, 'show', 'HEAD:' + TESTFILE], { encoding: 'utf8' });
const WORK_SRC = fs.readFileSync(path.join(REPO, TESTFILE), 'utf8');

// REF: rebuild the intended fix from HEAD myself rather than trusting the diff.
const REF_ANCHOR = 'const hasBehaviourWord = /\\bbehaviour\\b/i.test(normalized);';
const REF_FIXED = 'const hasBehaviourWord = /\\bbehaviou?r\\b/i.test(normalized);';
if (!HEAD_SRC.includes(REF_ANCHOR)) {
  throw new Error('REF arm: anchor not found in HEAD -- the gate is invalid, not the code');
}
const REF_SRC = HEAD_SRC.replace(REF_ANCHOR, REF_FIXED);

const ARMS = [
  { name: 'HEAD', src: HEAD_SRC },
  { name: 'WORK', src: WORK_SRC },
  { name: 'REF', src: REF_SRC },
];

// Every cell rewrites README.md. `must` is asserted on the pristine text so a
// silently-drifted README turns the gate invalid rather than green.
function sub(from, to) {
  return (r) => {
    if (!r.includes(from)) throw new Error('cell anchor missing: ' + JSON.stringify(from));
    return r.replace(from, to);
  };
}
function chain(...fns) {
  return (r) => fns.reduce((acc, f) => f(acc), r);
}

const CELLS = [
  { id: 'H0', what: 'pristine README (control)', mutate: (r) => r },
  { id: 'H1', what: 'THE HOLE: American spelling, every claim still TRUE', mutate: sub(BRITISH, '### `--list` behavior') },
  {
    id: 'H2',
    what: 'H1 + format literal separator em-dash -> ASCII hyphen (must still be caught)',
    mutate: chain(sub(BRITISH, '### `--list` behavior'), sub('`<text> — <author>`', '`<text> - <author>`')),
  },
  {
    id: 'H3',
    what: 'H1 + a FALSE tag count elsewhere (other guards must stay live)',
    mutate: chain(sub(BRITISH, '### `--list` behavior'), sub('| `design` | 13 |', '| `design` | 14 |')),
  },
  {
    id: 'H4',
    what: 'COST CELL: real British heading + American DECOY, both TRUE',
    mutate: sub(BRITISH, '### Notes on `--list` behavior\n\nSee below.\n\n' + BRITISH),
  },
  {
    id: 'H5',
    what: 'cycle-30 ambiguity: two British headings both qualify',
    mutate: sub(BRITISH, '### Notes on `--list` behaviour\n\nSee below.\n\n' + BRITISH),
  },
  { id: 'H6', what: 'flag-token intact: only "--list-only behaviour" remains', mutate: sub(BRITISH, '### `--list-only` behaviour') },
  { id: 'H7', what: 'DISCRIMINATOR: the TYPO "behaviuor" must NOT be accepted', mutate: sub(BRITISH, '### `--list` behaviuor') },
  { id: 'H8', what: 'American + ALL CAPS (case-insensitivity survives the widen)', mutate: sub(BRITISH, '### `--list` BEHAVIOR') },
  { id: 'H9', what: 'word anchor intact: heading carries neither spelling', mutate: sub(BRITISH, '### `--list` output') },
];

function copyTree(dest) {
  fs.cpSync(REPO, dest, { recursive: true, filter: (src) => !src.includes('/.git') && !src.includes('/.swarm') });
}

function run(arm, cell) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-g36-'));
  try {
    copyTree(dir);
    fs.writeFileSync(path.join(dir, TESTFILE), arm.src);
    const readmePath = path.join(dir, 'README.md');
    fs.writeFileSync(readmePath, cell.mutate(fs.readFileSync(readmePath, 'utf8')));
    let out;
    let code = 0;
    try {
      const files = fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
      out = execFileSync('node', ['--test', ...files], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
      code = e.status;
    }
    const num = (label) => (out.match(new RegExp('^\\D*' + label + ' (\\d+)$', 'm')) || [])[1];
    return {
      verdict: code === 0 ? 'GREEN' : 'RED',
      pass: num('pass'),
      tests: num('tests'),
      fail: num('fail'),
      // WHICH failure fired matters as much as whether one did:
      locatorMiss: /could not find a|none found/.test(out),
      separatorMiss: /does not match the README's `--list` format literal/.test(out),
      ambiguity: /ambiguous, refusing to silently pick one/.test(out),
      tagCount: /README tag counts must match corpus|tag counts/.test(out),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const grid = {};
console.log('cell  ' + ARMS.map((a) => a.name.padEnd(14)).join('') + 'what');
for (const cell of CELLS) {
  const row = [];
  for (const arm of ARMS) {
    const r = run(arm, cell);
    grid[cell.id + ':' + arm.name] = r;
    const flag = r.locatorMiss ? 'L' : r.ambiguity ? 'A' : r.separatorMiss ? 'S' : r.verdict === 'RED' ? 'x' : '';
    row.push((r.verdict + ' ' + r.pass + '/' + r.tests + (flag ? ' ' + flag : '')).padEnd(14));
  }
  console.log(cell.id.padEnd(6) + row.join('') + cell.what);
}
console.log('\n(L = locator "none found" fired, A = ambiguity fired, S = separator/format mismatch fired, x = some other failure)');

const V = (k) => grid[k].verdict;
const checks = [
  ['C1  H0 GREEN on all three arms (no regression on the real README)',
    ARMS.every((a) => V('H0:' + a.name) === 'GREEN')],
  ['C2  H1 RED@HEAD and GREEN@WORK -- both L-029 directions in one comparison',
    V('H1:HEAD') === 'RED' && V('H1:WORK') === 'GREEN'],
  ['C2b H1@HEAD failed specifically on the LOCATOR miss (the defect as filed)',
    grid['H1:HEAD'].locatorMiss === true],
  ['C3  H1 GREEN@REF -- the intended fix lands independently of the builder',
    V('H1:REF') === 'GREEN'],
  ['C5  H2 RED@WORK on the SEPARATOR mismatch and NOT on the locator miss',
    V('H2:WORK') === 'RED' && grid['H2:WORK'].separatorMiss === true && grid['H2:WORK'].locatorMiss === false],
  ['C5b H3 RED@WORK -- unrelated guards still live under the widened locator',
    V('H3:WORK') === 'RED'],
  ['C6  H7 RED@WORK -- the TYPO "behaviuor" is still rejected (discriminator)',
    V('H7:WORK') === 'RED' && grid['H7:WORK'].locatorMiss === true],
  ['C7  H9 and H6 RED@WORK -- word anchor and flag-token condition intact',
    V('H9:WORK') === 'RED' && grid['H9:WORK'].locatorMiss === true &&
    V('H6:WORK') === 'RED' && grid['H6:WORK'].locatorMiss === true],
  ['C8  H5 RED@WORK on AMBIGUITY -- the cycle-30 P1/P2 behaviour is preserved',
    V('H5:WORK') === 'RED' && grid['H5:WORK'].ambiguity === true],
  // C9 AMENDED AFTER RUN 1, on the authority of the SEAL and not of the result.
  // As sealed, C9's exception set read {H1} while the SAME sealed document's cell
  // table predicted "H8 ... GREEN@WORK" -- so C9 as written contradicted C12 and
  // contradicted the seal's own H8 row. H8 is H1 with the case varied (HEAD's
  // regex is already /i, so only the American spelling makes H8 red at HEAD), so
  // it is the same intended flip, not a second behaviour change. Amending the
  // exception set to {H1, H8} changes nothing the gate demands of the code. Had
  // the seal predicted H8 RED@WORK, this would be weakening and the gate would
  // stand as FAILED. Full reasoning: cycle-036-verify-T-027.txt.
  ['C9  every cell RED@HEAD is still RED@WORK, except the sealed intended flips H1/H8',
    CELLS.every((c) => c.id === 'H1' || c.id === 'H8' || V(c.id + ':HEAD') !== 'RED' || V(c.id + ':WORK') === 'RED')],
  ['C9b H8 tracks H1 arm-for-arm -- it is the SAME flip, not an independent one',
    CELLS.length > 0 && ['HEAD', 'WORK', 'REF'].every((a) => V('H8:' + a) === V('H1:' + a))],
  ['C10 WORK and REF agree on every cell (P5)',
    CELLS.every((c) => V(c.id + ':WORK') === V(c.id + ':REF'))],
  ['C11 H4 cost reproduces in the PREDICTED direction (GREEN@HEAD -> RED@WORK on ambiguity)',
    V('H4:HEAD') === 'GREEN' && V('H4:WORK') === 'RED' && grid['H4:WORK'].ambiguity === true],
  ['C12 H8 GREEN@WORK -- case-insensitive matching survives the widen',
    V('H8:WORK') === 'GREEN'],
];

console.log('');
let allOk = true;
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label);
  if (!ok) allOk = false;
}
console.log('\nGATE ' + (allOk ? 'PASSES' : 'FAILS'));
process.exit(allOk ? 0 : 1);
