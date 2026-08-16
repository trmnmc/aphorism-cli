// cycle 35 verification gate for T-031 (verdict claimed: BOUNDARY).
//
// The builder's BOUNDARY rests entirely on ONE claim: no widening of
// collectMarkerBindings closes the dash-boundary hole without buying a new
// false rejection on TRUE prose. A code review cannot settle that. So this
// gate REBUILDS both candidate fixes from the shipped helper and measures
// them, rather than accepting the builder's report of its own rejected work.
//
// Arms:
//   HEAD  the committed file (git show HEAD:...)
//   WORK  the working tree as the builder left it (claimed comment-only)
//   V1    WORK + unconditional fallback to the previous clause's trailing digit
//   V2    WORK + that fallback, but only if the previous clause holds no marker
//
// HEAD vs WORK on every cell is the behavioural test of "comment-only": any
// divergence falsifies it regardless of what the diff looks like.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const TESTFILE = 'test/readme-tags.test.js';
const EM = '—';
const ATTR_TAIL = 'Nothing in that list has been resolved yet.';

const HEAD_SRC = execFileSync('git', ['-C', REPO, 'show', 'HEAD:' + TESTFILE], { encoding: 'utf8' });
const WORK_SRC = fs.readFileSync(path.join(REPO, TESTFILE), 'utf8');

// The exact loop body shipped in the helper, replaced wholesale per arm.
const ORIGINAL_LOOP = `  for (const clause of clauses) {
    globalMarker.lastIndex = 0;
    let match;
    while ((match = globalMarker.exec(clause)) !== null) {
      const before = clause.slice(0, match.index);
      const digitMatches = before.match(/\\d+/g);
      if (digitMatches && digitMatches.length > 0) {
        bindings.push({
          value: parseInt(digitMatches[digitMatches.length - 1], 10),
          context: clause.trim().replace(/\\s+/g, ' '),
        });
      }`;

// V1: when the occurrence's own clause has no preceding digit, borrow the
// trailing digit of the PREVIOUS clause.
const V1_LOOP = `  for (let ci = 0; ci < clauses.length; ci++) {
    const clause = clauses[ci];
    globalMarker.lastIndex = 0;
    let match;
    while ((match = globalMarker.exec(clause)) !== null) {
      const before = clause.slice(0, match.index);
      let digitMatches = before.match(/\\d+/g);
      if ((!digitMatches || digitMatches.length === 0) && ci > 0) {
        digitMatches = (clauses[ci - 1].match(/\\d+/g) || null);
      }
      if (digitMatches && digitMatches.length > 0) {
        bindings.push({
          value: parseInt(digitMatches[digitMatches.length - 1], 10),
          context: clause.trim().replace(/\\s+/g, ' '),
        });
      }`;

// V2: same, but only borrow when the previous clause holds no marker of its
// own (its digit is not already "spoken for").
const V2_LOOP = `  for (let ci = 0; ci < clauses.length; ci++) {
    const clause = clauses[ci];
    globalMarker.lastIndex = 0;
    let match;
    while ((match = globalMarker.exec(clause)) !== null) {
      const before = clause.slice(0, match.index);
      let digitMatches = before.match(/\\d+/g);
      if ((!digitMatches || digitMatches.length === 0) && ci > 0) {
        const prevProbe = new RegExp(markerPattern.source, 'g');
        if (!prevProbe.test(clauses[ci - 1])) {
          digitMatches = (clauses[ci - 1].match(/\\d+/g) || null);
        }
      }
      if (digitMatches && digitMatches.length > 0) {
        bindings.push({
          value: parseInt(digitMatches[digitMatches.length - 1], 10),
          context: clause.trim().replace(/\\s+/g, ' '),
        });
      }`;

function makeArm(name, src, loop) {
  if (loop) {
    if (!src.includes(ORIGINAL_LOOP)) throw new Error('arm ' + name + ': loop anchor not found -- gate is invalid, not the code');
    src = src.replace(ORIGINAL_LOOP, loop);
  }
  return { name, src };
}

const ARMS = [
  makeArm('HEAD', HEAD_SRC, null),
  makeArm('WORK', WORK_SRC, null),
  makeArm('V1', WORK_SRC, V1_LOOP),
  makeArm('V2', WORK_SRC, V2_LOOP),
];

function append(sentence) {
  return (r) => {
    if (!r.includes(ATTR_TAIL)) throw new Error('anchor missing');
    return r.replace(ATTR_TAIL, ATTR_TAIL + ' ' + sentence);
  };
}

const CELLS = [
  { id: 'G0 ', what: 'pristine README (control)', mutate: (r) => r },
  { id: 'G1 ', what: 'T-031 THE SILENT HOLE: contradictory 9 across an em dash', mutate: append(`A later audit note records 9 ${EM} HIGH entries ${EM} in total.`) },
  { id: 'G1b', what: 'discriminator: same sentence, ASCII "--"', mutate: append('A later audit note records 9 -- HIGH entries -- in total.') },
  { id: 'G2 ', what: 'T-032: TRUE prose, two markers, live false rejection', mutate: append('Of those, 3 HIGH entries name a primary source.') },
  { id: 'G3 ', what: 'existing kill: single false HIGH count', mutate: (r) => r.replace('8 are rated HIGH', '9 are rated HIGH') },
  { id: 'G4 ', what: 'existing kill: contradiction in a later dash clause', mutate: append(`A later note ${EM} records that 9 are rated HIGH overall ${EM} as well.`) },
  { id: 'G5 ', what: 'existing kill: no claim parses at all -- must fail LOUD', mutate: (r) => r.replace(`ranks all 50\nentries by how likely the attribution is to be wrong ${EM} 8 are rated HIGH ${EM} and says what`, 'ranks every listed item by how likely the attribution is to be wrong, and says what') },
  { id: 'N1 ', what: 'SEALED cell: TRUE prose, marker, NO count ("No HIGH entry has been settled.")', mutate: append('No HIGH entry has been settled.') },
  { id: 'N2 ', what: 'SEALED cell: TRUE prose, C1 marker, no count ("Every entry is listed there.")', mutate: append('Every entry is listed there.') },
  { id: 'CA ', what: "builder case A: TRUE prose, entries marker with no count beside a HIGH clause", mutate: append(`Some entries ${EM} flagged HIGH by the triage doc ${EM} are still under review.`) },
  { id: 'CB ', what: 'builder case B: TRUE prose, unrelated year 2019 beside a HIGH clause', mutate: append(`The triage doc was rewritten in 2019 ${EM} HIGH standards apply to every entry reviewed since ${EM} and remains in force.`) },
];

function copyTree(dest) {
  fs.cpSync(REPO, dest, { recursive: true, filter: (src) => !src.includes('/.git') && !src.includes('/.swarm') });
}

function run(arm, cell) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-g35-'));
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
    const loud = /could not find a "/.test(out);
    return { verdict: code === 0 ? 'GREEN' : 'RED', pass: num('pass'), tests: num('tests'), fail: num('fail'), loud };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const grid = {};
console.log('cell  ' + ARMS.map((a) => a.name.padEnd(12)).join('') + 'what');
for (const cell of CELLS) {
  const row = [];
  for (const arm of ARMS) {
    const r = run(arm, cell);
    grid[cell.id.trim() + ':' + arm.name] = r;
    row.push((r.verdict + ' ' + r.pass + '/' + r.tests + (r.loud ? '*' : '')).padEnd(12));
  }
  console.log(cell.id + '   ' + row.join('') + cell.what);
}
console.log('\n(* = the "could not find a claim" LOUD parse-miss message was emitted)');

// ---- automatic checks, so a passing gate is not a matter of my eyesight ----
const V = (k) => grid[k].verdict;
const checks = [
  ['WORK is behaviourally identical to HEAD on every cell (the comment-only claim)',
    CELLS.every((c) => V(c.id.trim() + ':HEAD') === V(c.id.trim() + ':WORK'))],
  ['the silent hole G1 is REAL on HEAD and still open on WORK (GREEN both)',
    V('G1:HEAD') === 'GREEN' && V('G1:WORK') === 'GREEN'],
  ['V1 actually CLOSES the hole (G1 RED) -- the premise the BOUNDARY argues against',
    V('G1:V1') === 'RED'],
  ['V2 actually CLOSES the hole (G1 RED)',
    V('G1:V2') === 'RED'],
  ['V1 buys a NEW false rejection on true prose (CA or CB RED while GREEN on HEAD)',
    (V('CA:V1') === 'RED' && V('CA:HEAD') === 'GREEN') || (V('CB:V1') === 'RED' && V('CB:HEAD') === 'GREEN')],
  ['V2 buys a NEW false rejection on true prose (CA or CB RED while GREEN on HEAD)',
    (V('CA:V2') === 'RED' && V('CA:HEAD') === 'GREEN') || (V('CB:V2') === 'RED' && V('CB:HEAD') === 'GREEN')],
  ['no kill traded away: every cell RED on HEAD is still RED on WORK',
    CELLS.every((c) => V(c.id.trim() + ':HEAD') !== 'RED' || V(c.id.trim() + ':WORK') === 'RED')],
  ['G5 parse-miss still fails LOUD on WORK',
    grid['G5:WORK'].loud === true && V('G5:WORK') === 'RED'],
];
console.log('');
let allOk = true;
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label);
  if (!ok) allOk = false;
}
console.log('\nGATE ' + (allOk ? 'PASSES' : 'FAILS'));
process.exit(allOk ? 0 : 1);
