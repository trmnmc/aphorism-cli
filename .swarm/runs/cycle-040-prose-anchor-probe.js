#!/usr/bin/env node
// cycle-040 conductor harness — measure the THREE remaining open prose-anchor
// items (T-024b, T-026, T-032) against current HEAD, in isolation.
//
// Method inherited from cycle 39 (.swarm/runs/cycle-039-ackguard-probe.js):
//   - every cell restores README.md from git afterwards and asserts the restored
//     bytes are IDENTICAL to the pristine read;
//   - each cell is run BOTH isolated (--test-name-pattern on the one test under
//     test, so neighbouring count guards firing for their own unrelated reasons
//     cannot be misread as this guard's verdict) AND against the full suite
//     (which is the only way to answer "does anything else catch this?");
//   - --test-reporter=tap, because node's default reporter defeats by-name
//     failure attribution (cycle 19 + cycle 23 both lost a cycle to this).
//
// CONTROLS, all four required before any verdict is reported:
//   PRISTINE    — unmutated README under each isolated pattern must be GREEN.
//   DENOMINATOR — each isolated run must execute >= 1 test. A pattern that
//                 matches nothing produces a vacuous pass that reads as GREEN.
//   FAILABLE    — a genuinely WRONG number under each guard must be RED, so a
//                 GREEN verdict elsewhere means "did not fire", not "cannot fire".
//   RESTORE     — README byte-identical to pristine after every cell.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const README = path.join(REPO, 'README.md');

const PRISTINE = execFileSync('git', ['-C', REPO, 'show', 'HEAD:README.md'], {
  encoding: 'utf8',
  maxBuffer: 1 << 24,
});

const onDisk = fs.readFileSync(README, 'utf8');
if (onDisk !== PRISTINE) {
  console.error('ABORT: README.md differs from HEAD before the probe started.');
  process.exit(9);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const T_BAND = 'README band table headings must state the correct count of tags in their band';
const T_C2 = 'README Attribution section HIGH-risk count must match the triage doc table (C2)';
const T_019 = 'every corpus tag appearing on 2+ entries must have a row in some band table (no band table may be deleted wholesale) (T-019)';
const T_EXACT = 'every band table in README Tag vocabulary contains exactly the corpus tags whose count fits that band';

// Run the suite. `pattern` null => full suite. Returns {pass, fail, failed:[names]}.
function runSuite(pattern) {
  const args = ['--test', '--test-reporter=tap'];
  if (pattern) args.push('--test-name-pattern=' + pattern);
  args.push('test/args.test.js', 'test/cli.test.js', 'test/readme-tags.test.js', 'test/select.test.js');
  let out;
  try {
    out = execFileSync('node', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const mPass = out.match(/^# pass (\d+)$/m);
  const mFail = out.match(/^# fail (\d+)$/m);
  if (!mPass || !mFail) {
    return { pass: null, fail: null, failed: [], unparseable: true };
  }
  const failed = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^not ok \d+ - (.*)$/);
    if (m) failed.push(m[1].trim());
  }
  return { pass: parseInt(mPass[1], 10), fail: parseInt(mFail[1], 10), failed, unparseable: false };
}

function restore() {
  fs.writeFileSync(README, PRISTINE);
  return fs.readFileSync(README, 'utf8') === PRISTINE;
}

// Apply a list of [find, replace] edits; every find must occur EXACTLY once,
// so a silently-missed edit can never masquerade as a passing cell.
function mutate(edits) {
  let text = PRISTINE;
  for (const [find, repl] of edits) {
    const n = text.split(find).length - 1;
    if (n !== 1) throw new Error('edit anchor occurs ' + n + ' times (want 1): ' + JSON.stringify(find.slice(0, 60)));
    text = text.replace(find, repl);
  }
  fs.writeFileSync(README, text);
}

const BAND_HEADING = '4 tags have a robust pool (5+ entries):';
const TABLE_HEAD = '| Tag | Count |\n|---|---|\n| `design` | 13 |';
const ATTR_TAIL = 'would settle each one. Nothing in that list has been resolved yet.';

const cells = [];
function cell(id, item, why, edits, patterns) {
  cells.push({ id, item, why, edits, patterns });
}

// ---- controls -------------------------------------------------------------
cell('P0', 'control', 'PRISTINE: unmutated README, all three isolated patterns', [], [T_BAND, T_C2]);

// ---- T-024b: band-heading "N tags" count is first-non-overlapping-match ----
cell('B1', 'T-024b',
  'true lead-in carrying its own "N tags" count: "Of 37 tags, 4 tags carry 5+ entries each:" (37 and 4 are BOTH true)',
  [[BAND_HEADING, 'Of 37 tags, 4 tags carry 5+ entries each:']], [T_BAND]);
cell('B2', 'T-024b',
  'FAILABLE control: a genuinely WRONG band count (5, truth is 4) must still be RED',
  [[BAND_HEADING, '5 tags have a robust pool (5+ entries):']], [T_BAND]);

// ---- T-026: heading-to-table scan aborts on a coincidental band token ------
cell('C1', 'T-026',
  'prose carrying a coincidental band-shaped token between heading and table: "Requires Node 18+ to run."',
  [[BAND_HEADING + '\n' + TABLE_HEAD, BAND_HEADING + '\n\nRequires Node 18+ to run.\n\n' + TABLE_HEAD]],
  [T_BAND, T_019, T_EXACT]);
cell('C2', 'T-026',
  'HOLE probe: the C1 layout PLUS a deleted row (`debugging` 5) under that same heading',
  [[BAND_HEADING + '\n' + TABLE_HEAD, BAND_HEADING + '\n\nRequires Node 18+ to run.\n\n' + TABLE_HEAD],
   ['| `debugging` | 5 |\n', '']],
  [T_BAND, T_019, T_EXACT]);
cell('C3', 'T-026',
  'ISOLATING control: the deleted row ALONE, no prose line -- establishes the deletion is caught absent the T-026 shape',
  [['| `debugging` | 5 |\n', '']], [T_BAND, T_019, T_EXACT]);

// ---- T-032: two count markers in the Attribution section ------------------
cell('A1', 'T-032',
  'a second, semantically DIFFERENT HIGH-marked count in the same section: "Of those, 3 HIGH entries name a primary source."',
  [[ATTR_TAIL, 'would settle each one. Of those, 3 HIGH entries name a primary source. Nothing in that list has been resolved yet.']],
  [T_C2]);
cell('A2', 'T-032',
  'FAILABLE control: a genuinely WRONG HIGH count (9, truth is 8) must still be RED',
  [['8 are rated HIGH', '9 are rated HIGH']], [T_C2]);

// ---- execute --------------------------------------------------------------
const results = [];
let restoreFailures = 0;

for (const c of cells) {
  const rec = { id: c.id, item: c.item, why: c.why, isolated: {}, full: null, restored: null };
  try {
    if (c.edits.length) mutate(c.edits);
    for (const p of c.patterns) {
      const r = runSuite(esc(p));
      rec.isolated[p] = r;
    }
    rec.full = runSuite(null);
  } catch (e) {
    rec.error = String(e.message || e);
  }
  rec.restored = restore();
  if (!rec.restored) restoreFailures++;
  results.push(rec);
}

// ---- report ---------------------------------------------------------------
const short = (n) => (n === T_BAND ? 'BAND' : n === T_C2 ? 'C2' : n === T_019 ? 'T019' : n === T_EXACT ? 'EXACT' : n.slice(0, 12));

console.log('=== cycle 040 — prose-anchor family measurement (T-024b / T-026 / T-032) ===\n');
console.log('cell item    guard  isolated          full-suite        verdict');
console.log('---- ------- ------ ----------------- ----------------- -------');
for (const r of results) {
  if (r.error) {
    console.log(r.id + '   ERROR: ' + r.error);
    continue;
  }
  for (const [name, iso] of Object.entries(r.isolated)) {
    const isoStr = iso.unparseable ? 'UNPARSEABLE' : 'pass=' + iso.pass + ' fail=' + iso.fail;
    const fullStr = r.full.unparseable ? 'UNPARSEABLE' : 'pass=' + r.full.pass + ' fail=' + r.full.fail;
    const verdict = iso.unparseable ? 'UNPARSEABLE' : iso.fail > 0 ? 'FIRES' : 'SILENT';
    console.log(
      r.id.padEnd(4) + ' ' + r.item.padEnd(7) + ' ' + short(name).padEnd(6) + ' ' +
      isoStr.padEnd(17) + ' ' + fullStr.padEnd(17) + ' ' + verdict
    );
  }
}

console.log('\n--- DENOMINATOR control (each isolated run must execute >= 1 test) ---');
let denomBad = 0;
for (const r of results) {
  for (const [name, iso] of Object.entries(r.isolated || {})) {
    const n = iso.unparseable ? 0 : iso.pass + iso.fail;
    if (n < 1) {
      denomBad++;
      console.log('  VACUOUS: ' + r.id + ' / ' + short(name) + ' ran 0 tests');
    }
  }
}
console.log(denomBad === 0 ? '  all isolated runs executed >= 1 test: OK' : '  ' + denomBad + ' VACUOUS RUN(S) — no verdict is valid');

console.log('\n--- full-suite failing test names per cell ---');
for (const r of results) {
  if (r.error || !r.full || r.full.unparseable) continue;
  console.log('  ' + r.id.padEnd(4) + ' (' + r.item + ') fail=' + r.full.fail +
    (r.full.failed.length ? '\n        ' + r.full.failed.join('\n        ') : '  (none)'));
}

console.log('\n--- RESTORE control ---');
console.log('  README restored byte-identical after every cell: ' + (restoreFailures === 0 ? 'yes' : 'NO (' + restoreFailures + ' failures)'));
const finalOk = fs.readFileSync(README, 'utf8') === PRISTINE;
console.log('  final on-disk README byte-identical to HEAD: ' + (finalOk ? 'yes' : 'NO'));

fs.writeFileSync(path.join(__dirname, 'cycle-040-prose-anchor-raw.json'), JSON.stringify(results, null, 1));
console.log('\nraw: .swarm/runs/cycle-040-prose-anchor-raw.json');
process.exit(restoreFailures === 0 && finalOk && denomBad === 0 ? 0 : 1);
