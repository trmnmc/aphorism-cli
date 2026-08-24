#!/usr/bin/env node
// tools/detection-floor.mjs
//
// DETECTION-FLOOR COMPARISON (W-8). Answers ONE question, row by row, by
// mutation id: is any falsification that the suite CAUGHT at the W-2
// baseline (20b7ede, tools/mutation-matrix-baseline.json) UNDETECTED at
// final HEAD (tools/mutation-matrix-final.json)? Run from the repo root:
//
//     node tools/detection-floor.mjs               # fast: compare the two
//                                                  # committed records; no
//                                                  # suite runs
//     node tools/detection-floor.mjs --remeasure   # slow: re-derive the HEAD
//                                                  # side live by running
//                                                  # tools/mutation-matrix.mjs
//                                                  # --rev <HEAD> --json, so a
//                                                  # reader can prove the
//                                                  # committed final record is
//                                                  # not fabricated
//     node tools/detection-floor.mjs --final <p>   # read the HEAD-side record
//     node tools/detection-floor.mjs --baseline <p>#   / baseline record from
//                                                  # an alternate path. These
//                                                  # exist so the FAILURE
//                                                  # paths below can be
//                                                  # exercised against a
//                                                  # doctored copy without
//                                                  # touching the committed
//                                                  # artifacts; a doctored
//                                                  # input MUST turn the run
//                                                  # red (see EXIT CODES) --
//                                                  # that is the proof this
//                                                  # tool is an assertion, not
//                                                  # a snapshot.
//
// EXIT CODES (the verdict IS the exit code; the prose is commentary):
//   0  the detection floor holds: every baseline-CAUGHT mutation is accounted
//      for at HEAD as same-guard, changed-guard (listed by name), or
//      claim-no-longer-exists (listed, per the ruling below) -- AND the
//      identity control is GREEN on both sides -- AND the HEAD-side record is
//      fresh (see FRESHNESS).
//   1  the floor is BROKEN or the comparison is not trustworthy: a detection
//      was lost, an identity control is not green, a skipped row cannot be
//      proven to be a retired claim, a baseline row is unaccounted for at
//      HEAD, or a record is malformed. The specific mutation ids are printed.
//   2  usage error.
//   3  STALE: the committed final record does not describe the repo's current
//      HEAD (see FRESHNESS). A stale comparison is NOT a pass.
//
// ---------------------------------------------------------------------------
// FRESHNESS (checked FIRST, before any row is compared)
// ---------------------------------------------------------------------------
// The HEAD-side record carries meta.measuredCommit, the full sha the
// instrument asserted against its scratch clone's own HEAD. This tool
// resolves the repo's current HEAD and:
//
//   * if they are EQUAL, the record is FRESH.
//   * if they DIFFER, this is said loudly, and the record is STALE (exit 3)
//     -- with exactly one narrow, evidence-printed exemption: if the recorded
//     commit is an ancestor of HEAD and `git diff <recorded> HEAD` touches
//     NONE of the paths any verdict in the record depends on, the record is
//     FRESH-BY-CONTENT and the comparison proceeds, with the full changed
//     file list printed. The verdict-relevant path set is: README.md, docs/,
//     src/, bin/, test/, .github/ (the suite reads the first five; the two
//     citation guards run `git diff <base>..HEAD -- src bin test .github`,
//     which a commit outside those paths cannot change), plus
//     tools/mutation-matrix.mjs itself (if the instrument changed after the
//     record was written, the record no longer reproduces from the current
//     instrument and must be re-measured). This exemption exists because the
//     very commit that lands this tool and its artifact necessarily moves
//     HEAD one step past the measured rev while changing only tools/ -- a
//     byte-identical tree everywhere the verdicts look. Anything beyond that
//     exemption is STALE, exit 3, and the fix is printed: --remeasure.
//
// --remeasure sidesteps the question entirely: the HEAD side is re-derived
// live at the current HEAD, and the committed final record (when present and
// at the same commit) is cross-checked verdict-for-verdict against the live
// run -- a mismatch is a FAILURE (exit 1), because it means the committed
// artifact does not reproduce.
//
// ---------------------------------------------------------------------------
// THE BUCKETS (every baseline mutation lands in exactly one; ids printed)
// ---------------------------------------------------------------------------
//   SAME-GUARD        still CAUGHT at HEAD, and the baseline's named target
//                     guard is among the guards that fired.
//   GUARD-CHANGED     still CAUGHT at HEAD, but NOT by the baseline's named
//                     target guard (typically: that guard was renamed or
//                     consolidated away). The old guard and the new firing
//                     guard(s) are printed BY NAME. This is never folded into
//                     SAME-GUARD.
//   CLAIM-GONE        recorded in the HEAD run's skippedClaims because the
//                     mutation's anchor text occurs 0 times at HEAD: the
//                     document claim this mutation falsifies no longer exists.
//                     Counted as NOT-lost under ruling W8-R1 below -- but
//                     always listed, never folded into a pass bucket.
//   DETECTION-LOST    ran at HEAD and the suite stayed green (verdict
//                     SILENT). This is the failure the whole item exists to
//                     catch; it is named per-id and the run exits 1.
//   SKIP-UNPROVEN     in skippedClaims at HEAD for any reason OTHER than
//                     anchor-count 0 (e.g. an anchor that occurs 2+ times):
//                     the claim may still exist and detection was NOT
//                     measured. Not-verified is not passed: exit 1.
//   UNACCOUNTED       present in the baseline but in neither results nor
//                     skippedClaims at HEAD. The record shape contract is
//                     broken: exit 1.
//
// ---------------------------------------------------------------------------
// RULING W8-R1 -- does CLAIM-GONE count as "detection lost"? (the ruling the
// mechanism cannot make; recorded here so it survives without a human
// remembering the conversation. The tool prints this block on every run.)
// ---------------------------------------------------------------------------
const RULING_W8_R1 = [
  'RULING W8-R1: a baseline mutation that is SKIPPED at HEAD because its',
  'anchor text occurs 0 times -- i.e. the document claim it falsifies no',
  'longer exists in the document -- is NOT a lost detection. It is a RETIRED',
  'CLAIM, reported in its own CLAIM-GONE bucket, never folded into the pass.',
  '',
  'FOR the ruling: the detection floor measures whether FALSE CLAIMS in the',
  'document get caught. A claim that has been removed from the document can',
  'no longer be false in it; there is nothing left for the mutation to',
  'falsify and nothing left for a guard to defend. The guard may have been',
  'deleted along with the claim, but deleting the claim removes the exact',
  'risk that guard existed to catch. Ruling the other way would make every',
  'claim permanent: retiring a stale README section would count as "losing"',
  'its detections, turning the floor into a ratchet on document CONTENT',
  'rather than on DETECTION of false content.',
  '',
  'AGAINST the ruling (recorded, not hidden): "anchor occurs 0 times" is a',
  'mechanical proxy for "the claim no longer exists". A claim could be',
  'REWORDED -- semantically present, textually different -- and the anchor',
  'would miss it; the suite could simultaneously have dropped the guard, and',
  'this bucket would then mask a genuine detection loss. The proxy is also',
  'point-in-time: if the claim is later re-added without its guard, this',
  'comparison will not see it.',
  '',
  'WHAT WOULD MAKE IT WRONG: evidence that the claim\'s semantic content',
  'still exists at HEAD under different wording (for the current CLAIM-GONE',
  'rows M01-M03: a README Node support results table that the suite no',
  'longer cross-checks). The adjudicator for that question is',
  'tools/guard-inventory.mjs run at HEAD -- it inventories what is',
  'machine-checked NOW; a reworded-but-unguarded count claim surfaces there',
  'as an excluded/unguarded claim, not here. W-8\'s floor is one-directional',
  'by design: it proves no BASELINE detection was lost, not that HEAD',
  'coverage is complete.',
  '',
  'SCOPE GUARD on the ruling: it applies ONLY to skips whose recorded reason',
  'is anchor-count 0. A skip for any other reason (ambiguous anchor,',
  'unparseable reason) is SKIP-UNPROVEN and FAILS the run: not-verified is',
  'never rounded to passed.',
].join('\n');

// ---------------------------------------------------------------------------
// ZERO DEPENDENCIES: node: builtins only (fs, child_process, path, url).
// This file registers no node:test tests and is not collected by the suite
// glob. Its default path writes nothing and runs no suite.
// ---------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// The acceptance clause pins the baseline by rev; assert it, never assume it.
const BASELINE_FULL_SHA = '20b7edec2eb42cae185bdd7934f4bc6cd2899577';

const DEFAULT_BASELINE_PATH = path.join(HERE, 'mutation-matrix-baseline.json');
const DEFAULT_FINAL_PATH = path.join(HERE, 'mutation-matrix-final.json');
const INSTRUMENT = path.join(HERE, 'mutation-matrix.mjs');

// Paths any recorded verdict depends on (see FRESHNESS above).
const VERDICT_RELEVANT = /^(README\.md$|docs\/|src\/|bin\/|test\/|\.github\/|tools\/mutation-matrix\.mjs$)/;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function usageError(msg) {
  process.stderr.write(
    'error: ' + msg + '\n' +
    'usage: node tools/detection-floor.mjs [--remeasure] [--baseline <path>] [--final <path>]\n' +
    '  (no args)          compare the committed baseline and final records (fast)\n' +
    '  --remeasure        re-derive the HEAD side live via tools/mutation-matrix.mjs\n' +
    '                     --rev <HEAD> --json (slow: ~19 full suite runs), and\n' +
    '                     cross-check the committed final record against it\n' +
    '  --baseline <path>  read the baseline record from <path> (failure-injection aid)\n' +
    '  --final <path>     read the HEAD-side record from <path> (failure-injection aid)\n'
  );
  process.exit(2);
}

let REMEASURE = false;
let baselinePath = DEFAULT_BASELINE_PATH;
let finalPath = DEFAULT_FINAL_PATH;
{
  const rest = process.argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--remeasure') REMEASURE = true;
    else if (a === '--baseline') {
      if (i + 1 >= rest.length) usageError('--baseline requires a value');
      baselinePath = path.resolve(rest[++i]);
    } else if (a === '--final') {
      if (i + 1 >= rest.length) usageError('--final requires a value');
      finalPath = path.resolve(rest[++i]);
    } else usageError('unknown argument: ' + a);
  }
}

function git(args) {
  const res = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error('git ' + args.join(' ') + ' failed (exit ' + res.status + '): ' + (res.stderr || '').trim());
  }
  return res.stdout;
}

const failures = []; // {id or '(record)', reason}
function fail(id, reason) { failures.push({ id, reason }); }

// ---------------------------------------------------------------------------
// RV-6: shared freshness classification.
//
// Before this fix, this file computed "is `recorded` an ancestor of `head`
// with a verdict-neutral diff?" inline, ONLY in the default (no-flag) path,
// and used it purely to decide whether to TRUST the committed record without
// checking a single verdict in it. --remeasure never asked this question at
// all: its reproduction cross-check fired only on an exact sha match, so the
// one case FRESH-BY-CONTENT exists for -- a record at an ancestor whose
// verdict-relevant tree is byte-identical to HEAD -- was the one case no
// code path ever validated. Factoring the classification out lets
// --remeasure ask the same question and, when the answer is
// FRESH-BY-CONTENT, actually cross-check the committed record against the
// live run instead of declining.
function classifyFreshness(recorded, head) {
  if (recorded === head) return { status: 'FRESH', changed: [], relevant: [] };
  const isAncestor = spawnSync('git', ['merge-base', '--is-ancestor', recorded, head], { cwd: ROOT });
  if (isAncestor.status !== 0) return { status: 'NOT-ANCESTOR', changed: null, relevant: null };
  const changed = git(['diff', '--name-only', recorded, head]).split('\n').filter(Boolean);
  const relevant = changed.filter((f) => VERDICT_RELEVANT.test(f));
  return relevant.length === 0
    ? { status: 'FRESH-BY-CONTENT', changed, relevant }
    : { status: 'STALE', changed, relevant };
}

// Row-for-row reproduction cross-check of a committed record against a
// live-derived one. Pre-existing logic (previously inlined, exact-sha-match
// only); now shared so the FRESH-BY-CONTENT ancestor case (RV-6) gets the
// identical, already-proven comparison rather than a weaker one. A mismatch
// is pushed onto the module-level `failures` array, same as every other
// check in this file -- this is an assertion, not a report.
function crossCheckAgainstLive(committed, live, modeLabel) {
  const liveById = new Map(live.results.map((r) => [r.id, r]));
  const liveSkip = new Set(live.skippedClaims.map((s) => s.id));
  let mismatches = 0;
  for (const row of committed.results) {
    const l = liveById.get(row.id);
    if (!l || l.verdict !== row.verdict) {
      mismatches++;
      fail(row.id, 'committed final record says ' + row.verdict + ' but the live remeasure says '
        + (l ? l.verdict : (liveSkip.has(row.id) ? 'SKIPPED' : 'ABSENT')) + ' -- the committed artifact does not reproduce');
    }
  }
  for (const s of committed.skippedClaims) {
    if (!liveSkip.has(s.id)) {
      mismatches++;
      fail(s.id, 'committed final record says SKIPPED but the live remeasure says '
        + (liveById.get(s.id) ? liveById.get(s.id).verdict : 'ABSENT') + ' -- the committed artifact does not reproduce');
    }
  }
  console.log('[--remeasure] reproduction cross-check (' + modeLabel + ') vs committed ' + path.relative(ROOT, finalPath) + ': '
    + (mismatches === 0 ? 'every verdict matches the live run' : mismatches + ' MISMATCH(ES) -- reported as failures below'));
  return mismatches;
}

function loadRecord(p, label) {
  let raw;
  try {
    raw = readFileSync(p, 'utf8');
  } catch (e) {
    console.log('FAILURE: cannot read ' + label + ' record at ' + p + ': ' + e.message);
    process.exit(1);
  }
  let rec;
  try {
    rec = JSON.parse(raw);
  } catch (e) {
    console.log('FAILURE: ' + label + ' record at ' + p + ' is not valid JSON: ' + e.message);
    process.exit(1);
  }
  for (const k of ['meta', 'identity', 'results', 'skippedClaims']) {
    if (!(k in rec)) {
      console.log('FAILURE: ' + label + ' record at ' + p + ' is missing the "' + k + '" key -- not the machine-comparable shape this tool compares.');
      process.exit(1);
    }
  }
  return rec;
}

// The recorded full sha: newer records carry meta.measuredCommit (asserted by
// the instrument against its scratch clone's HEAD); the committed W-2
// baseline predates that key and carries meta.baselineCommit.
function recordedSha(rec) {
  return rec.meta.measuredCommit || rec.meta.baselineCommit || null;
}

// RV-2: the sha pin above (BASELINE_FULL_SHA) proves the record CLAIMS to
// have measured the right commit; it proves nothing about whether the
// record's `results` array still has the rows that measurement actually
// produced. meta.measuredCommit/baselineCommit is plain text sitting next
// to `results` in the same JSON file -- editing one does not touch the
// other, so a row silently deleted from `results` (or the whole array
// emptied) leaves the sha pin untouched and passes the check above. The W-2
// generation rule (tools/mutation-matrix.mjs) is a frozen contract: exactly
// 18 falsifying mutations (M01..M18, inventory order) plus identity M00 at
// the baseline rev. Assert that SHAPE -- exact row count, exact id set, no
// duplicates -- before trusting the row-by-row partition below, or a
// shrunk baseline silently shrinks the floor this tool claims to hold.
const EXPECTED_BASELINE_RESULT_IDS = Array.from({ length: 18 }, (_, i) => 'M' + String(i + 1).padStart(2, '0'));

// ---------------------------------------------------------------------------
// banner + ruling (printed on every run, before any verdict)
// ---------------------------------------------------------------------------
console.log('DETECTION FLOOR (W-8) -- baseline ' + BASELINE_FULL_SHA.slice(0, 7) + ' vs final HEAD');
console.log('');
console.log(RULING_W8_R1);
console.log('');
console.log('='.repeat(78));

// ---------------------------------------------------------------------------
// load baseline
// ---------------------------------------------------------------------------
const baseline = loadRecord(baselinePath, 'baseline');
{
  const sha = recordedSha(baseline);
  if (sha !== BASELINE_FULL_SHA) {
    console.log('FAILURE: baseline record ' + baselinePath + ' says it measured ' + sha
      + ' but the acceptance clause pins the baseline at ' + BASELINE_FULL_SHA
      + '. Refusing to compare against the wrong baseline.');
    process.exit(1);
  }
}
{
  // RV-2: assert the record's row COUNT and id SET before ruling on
  // anything below (see EXPECTED_BASELINE_RESULT_IDS above for why the sha
  // pin alone cannot catch this).
  const gotIds = Array.isArray(baseline.results) ? baseline.results.map((r) => r && r.id) : null;
  const expectedSet = new Set(EXPECTED_BASELINE_RESULT_IDS);
  const gotSet = new Set(gotIds || []);
  const missing = gotIds ? EXPECTED_BASELINE_RESULT_IDS.filter((id) => !gotSet.has(id)) : EXPECTED_BASELINE_RESULT_IDS;
  const unexpected = gotIds ? gotIds.filter((id) => !expectedSet.has(id)) : [];
  const dupes = gotIds ? gotIds.filter((id, i) => gotIds.indexOf(id) !== i) : [];
  const shapeOk = gotIds !== null
    && gotIds.length === EXPECTED_BASELINE_RESULT_IDS.length
    && missing.length === 0
    && unexpected.length === 0
    && dupes.length === 0;
  if (!shapeOk) {
    console.log('FAILURE: baseline record ' + baselinePath + ' does not carry the expected shape -- '
      + 'exactly ' + EXPECTED_BASELINE_RESULT_IDS.length + ' results with ids '
      + EXPECTED_BASELINE_RESULT_IDS.join(', ') + ' (the W-2 generation rule\'s frozen contract).');
    console.log('  got: ' + (gotIds ? gotIds.length : 0) + ' row(s)'
      + (gotIds ? ', ids [' + gotIds.join(', ') + ']' : ' (results is not an array)'));
    if (missing.length) console.log('  MISSING ids: ' + missing.join(', '));
    if (unexpected.length) console.log('  UNEXPECTED ids: ' + unexpected.join(', '));
    if (dupes.length) console.log('  DUPLICATE ids: ' + [...new Set(dupes)].join(', '));
    console.log('  A baseline record whose row count or id set has drifted from the frozen 18-mutation');
    console.log('  contract cannot be trusted to set the full detection floor -- refusing to compare.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// obtain the HEAD-side record (committed file, or live via --remeasure),
// then decide freshness BEFORE comparing anything.
// ---------------------------------------------------------------------------
const headSha = git(['rev-parse', 'HEAD']).trim();
let finalRec;
let freshness; // 'FRESH' | 'FRESH-BY-CONTENT' | 'LIVE'
let crossCheckMode = null; // set under --remeasure only (RV-6); see final verdict block

if (REMEASURE) {
  console.log('[--remeasure] re-deriving the HEAD side live: node tools/mutation-matrix.mjs --rev ' + headSha + ' --json');
  console.log('[--remeasure] this runs the full suite ~19 times in a scratch clone; expect minutes, progress on stderr.');
  const res = spawnSync(process.execPath, [INSTRUMENT, '--rev', headSha, '--json'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
  if (res.error || res.status !== 0) {
    console.log('FAILURE: live remeasure did not complete (exit ' + (res.status ?? 'spawn error') + '); no comparison performed.');
    process.exit(1);
  }
  finalRec = JSON.parse(res.stdout);
  if (recordedSha(finalRec) !== headSha) {
    console.log('FAILURE: live remeasure record says it measured ' + recordedSha(finalRec) + ', not the current HEAD ' + headSha + '.');
    process.exit(1);
  }
  freshness = 'LIVE';

  // Cross-check the committed final record against the live run. A committed
  // record whose verdicts differ from a live re-run does not reproduce --
  // that is a failure, not a footnote. RV-6: this used to fire ONLY on an
  // exact sha match; a committed record at an ancestor commit whose
  // verdict-relevant tree is byte-identical to HEAD (FRESH-BY-CONTENT, same
  // test used by the default path's freshness exemption) is just as
  // reproducible against this same live run, so it gets the same check
  // instead of being waved through unchecked.
  crossCheckMode = 'not performed: no committed final record found at ' + finalPath;
  if (existsSync(finalPath)) {
    const committed = loadRecord(finalPath, 'committed-final');
    const committedSha = recordedSha(committed);
    if (committedSha === headSha) {
      crossCheckAgainstLive(committed, finalRec, 'exact HEAD match');
      crossCheckMode = 'exact HEAD match';
    } else {
      const fr = classifyFreshness(committedSha, headSha);
      if (fr.status === 'FRESH-BY-CONTENT') {
        console.log('[--remeasure] committed final record measured ' + committedSha + ', not exactly HEAD ' + headSha
          + ' -- but it is an ancestor and git diff ' + committedSha.slice(0, 7) + '..' + headSha.slice(0, 7)
          + ' touches NONE of the verdict-relevant paths (FRESH-BY-CONTENT, RV-6). Changed paths (all verdict-neutral):');
        for (const f of fr.changed) console.log('    - ' + f);
        crossCheckAgainstLive(committed, finalRec, 'FRESH-BY-CONTENT ancestor');
        crossCheckMode = 'FRESH-BY-CONTENT ancestor (' + committedSha.slice(0, 7) + ')';
      } else {
        console.log('[--remeasure] NOTE: the committed final record measured ' + committedSha
          + ', not the current HEAD ' + headSha + ', and is NOT FRESH-BY-CONTENT (' + fr.status
          + '); the live run replaces it for this comparison and no reproduction cross-check is possible.');
        crossCheckMode = 'not performed: committed record is ' + fr.status + ' relative to HEAD';
      }
    }
  }
} else {
  finalRec = loadRecord(finalPath, 'final');
  const recorded = recordedSha(finalRec);
  if (!recorded || !/^[0-9a-f]{40}$/.test(recorded)) {
    console.log('FAILURE: final record ' + finalPath + ' does not carry a full 40-hex measured commit in meta -- cannot establish freshness.');
    process.exit(1);
  }
  if (recorded === headSha) {
    freshness = 'FRESH';
    console.log('freshness: FRESH -- the final record measured ' + recorded + ', which IS the repo\'s current HEAD.');
  } else {
    console.log('');
    console.log('!'.repeat(78));
    console.log('THE FINAL RECORD IS NOT AT HEAD.');
    console.log('  recorded (meta.measuredCommit): ' + recorded);
    console.log('  current HEAD:                   ' + headSha);
    console.log('!'.repeat(78));
    const fr = classifyFreshness(recorded, headSha);
    if (fr.status === 'FRESH-BY-CONTENT') {
      freshness = 'FRESH-BY-CONTENT';
      console.log('However: the recorded commit is an ancestor of HEAD, and git diff '
        + recorded.slice(0, 7) + '..' + headSha.slice(0, 7) + ' touches NONE of the paths any');
      console.log('recorded verdict depends on (README.md, docs/, src/, bin/, test/, .github/,');
      console.log('tools/mutation-matrix.mjs). Every input to every verdict is byte-identical');
      console.log('between the two commits, so the record is FRESH-BY-CONTENT. Changed paths');
      console.log('(all verdict-neutral):');
      for (const f of fr.changed) console.log('  - ' + f);
      console.log('RV-6: this is a content-equivalence argument, NOT a live cross-check -- no row\'s');
      console.log('claim below was reproduced by actually running the suite on this fast, no-flag path.');
      console.log('If you doubt this exemption, or want that live proof, run: node tools/detection-floor.mjs --remeasure');
    } else {
      console.log('STALE. ' + (fr.status === 'NOT-ANCESTOR'
        ? 'The recorded commit is not an ancestor of HEAD, so no content-equivalence argument is even possible.'
        : 'The diff from the recorded commit to HEAD touches verdict-relevant paths:'));
      if (fr.relevant) for (const f of fr.relevant) console.log('  - ' + f);
      console.log('A stale comparison is NOT a pass. No rows were compared. To fix, re-measure at');
      console.log('the current HEAD and regenerate the artifact:');
      console.log('  node tools/mutation-matrix.mjs --rev ' + headSha + ' --json > tools/mutation-matrix-final.json');
      console.log('or run this tool with --remeasure for a one-off live comparison.');
      console.log('');
      console.log('VERDICT: STALE (exit 3)');
      process.exit(3);
    }
  }
}

// ---------------------------------------------------------------------------
// identity controls: GREEN on BOTH sides, or nothing else below means a thing
// ---------------------------------------------------------------------------
console.log('');
console.log('identity control (M00), both sides:');
for (const [label, rec] of [['baseline ' + BASELINE_FULL_SHA.slice(0, 7), baseline], ['final    ' + recordedSha(finalRec).slice(0, 7), finalRec]]) {
  const idn = rec.identity;
  const s = idn && idn.suite ? idn.suite : {};
  const gdg = idn && idn.gitDependentGuards ? idn.gitDependentGuards : null;
  console.log('  ' + label + ': ' + (idn ? idn.verdict : '(missing)')
    + '  (' + s.tests + ' tests, ' + s.pass + ' pass, ' + s.fail + ' fail, ' + s.skipped + ' skipped'
    + ', git-dependent guards ran: ' + (gdg ? gdg.ran : '(missing)') + ')');
  if (!idn || idn.verdict !== 'GREEN') {
    fail('M00', label + ' identity control is ' + (idn ? idn.verdict : 'missing') + ', not GREEN -- every CAUGHT verdict on that side is meaningless');
    continue;
  }
  // RV-3: a record's `verdict: 'GREEN'` string is the instrument's OWN
  // self-report; nothing above cross-checks it against the evidence sitting
  // right next to it in the same object. A doctored (or buggy) record could
  // say GREEN while its own suite totals show failures, or while
  // gitDependentGuards.ran is false (meaning the two git-dependent citation
  // guards never actually ran, so every other row's CAUGHT/SILENT verdict
  // on that side is unproven). Recompute the same GREEN condition the
  // instrument itself uses (tools/mutation-matrix.mjs: fail===0 &&
  // skipped===0 && gitGuardsRan) FROM the recorded evidence, and refuse to
  // trust a self-reported GREEN that its own evidence contradicts.
  const evidenceGreen = s.fail === 0 && s.skipped === 0 && gdg !== null && gdg.ran === true;
  if (!evidenceGreen) {
    fail('M00', label + ' identity control claims verdict GREEN but its own recorded evidence contradicts that '
      + '(suite.fail=' + s.fail + ', suite.skipped=' + s.skipped + ', gitDependentGuards.ran='
      + (gdg ? gdg.ran : '(missing)') + ') -- refusing to trust a self-reported GREEN that disagrees with the '
      + 'evidence recorded in the same object; every CAUGHT verdict on that side is meaningless');
  }
}
console.log('  (a smaller green total at HEAD is expected and is not a regression here: the');
console.log('   W-7 guard consolidation removed one duplicate test, 129 -> 128. This tool');
console.log('   compares detection per mutation, never raw test counts.)');

// ---------------------------------------------------------------------------
// the row-by-row partition
// ---------------------------------------------------------------------------
const finalById = new Map(finalRec.results.map((r) => [r.id, r]));
const finalSkipById = new Map(finalRec.skippedClaims.map((s) => [s.id, s]));

const buckets = {
  sameGuard: [],
  guardChanged: [],
  claimGone: [],
  detectionLost: [],
  skipUnproven: [],
  unaccounted: [],
};

// The instrument writes skip reasons in exactly one machine-generated shape
// (applyEdits): "<id>: anchor occurs <n> times (need exactly 1) in <file>".
// Parse n; an unparseable reason is SKIP-UNPROVEN (fails), never assumed.
function anchorCount(reason) {
  const m = /anchor occurs (\d+) times \(need exactly 1\)/.exec(reason || '');
  return m ? Number(m[1]) : null;
}

for (const row of baseline.results) {
  if (row.verdict !== 'CAUGHT') {
    // The committed baseline is 18/18 CAUGHT; if a doctored baseline says
    // otherwise, that row sets no floor and is reported as such.
    fail(row.id, 'baseline verdict is ' + row.verdict + ', not CAUGHT -- this row sets no detection floor and the baseline record is not the one this tool was built against');
    continue;
  }
  const atHead = finalById.get(row.id);
  const skippedAtHead = finalSkipById.get(row.id);
  if (atHead && skippedAtHead) {
    fail(row.id, 'present in BOTH results and skippedClaims at HEAD -- the final record is malformed');
    continue;
  }
  if (skippedAtHead) {
    const n = anchorCount(skippedAtHead.reason);
    if (n === 0) {
      buckets.claimGone.push({ id: row.id, guardTitle: row.guardTitle, reason: skippedAtHead.reason });
    } else {
      buckets.skipUnproven.push({ id: row.id, reason: skippedAtHead.reason });
      fail(row.id, 'skipped at HEAD but not because the claim is gone (reason: ' + skippedAtHead.reason + ') -- detection was not measured, and not-verified is not passed');
    }
    continue;
  }
  if (!atHead) {
    buckets.unaccounted.push(row.id);
    fail(row.id, 'in the baseline record but in neither results nor skippedClaims at HEAD -- the record shape contract is broken');
    continue;
  }
  if (atHead.verdict === 'CAUGHT') {
    // RV-4: `verdict: 'CAUGHT'` and `caughtByTargetGuard` are themselves
    // just fields in the record -- nothing before this point cross-checks
    // them against the OTHER evidence carried in the same row. A verdict of
    // CAUGHT is only possible if the suite actually failed (suite.fail > 0)
    // and at least one guard actually fired (firedGuards non-empty); if
    // caughtByTargetGuard is true, the target guard's own title must be
    // among those fired guards. A row that claims CAUGHT / target-fired
    // while its own suite/firedGuards evidence says otherwise is internally
    // impossible and must not be trusted into SAME-GUARD (or GUARD-CHANGED)
    // silently.
    const headSuite = atHead.suite || {};
    const headFired = Array.isArray(atHead.firedGuards) ? atHead.firedGuards : [];
    if (!(headSuite.fail > 0)) {
      fail(row.id, 'final record row claims verdict CAUGHT but its own suite.fail is '
        + headSuite.fail + ' (must be > 0) -- internally inconsistent row, refusing to trust its verdict');
      continue;
    }
    if (headFired.length === 0) {
      fail(row.id, 'final record row claims verdict CAUGHT but its own firedGuards is empty -- '
        + 'internally inconsistent row, refusing to trust its verdict');
      continue;
    }
    if (atHead.caughtByTargetGuard === true) {
      const targetFired = headFired.some((g) => g && g.title === row.guardTitle);
      if (!targetFired) {
        fail(row.id, 'final record row claims caughtByTargetGuard=true (target guard "' + row.guardTitle
          + '") but that title does not appear in its own firedGuards list ['
          + headFired.map((g) => g && g.title).join(' | ') + '] -- internally inconsistent row, refusing to trust its verdict');
        continue;
      }
      buckets.sameGuard.push({ id: row.id, guard: row.guard, guardTitle: row.guardTitle });
    } else {
      buckets.guardChanged.push({
        id: row.id,
        oldGuard: row.guard,
        oldGuardTitle: row.guardTitle,
        oldGuardStillExists: atHead.guardTitleInMeasuredTree === true,
        newGuards: (atHead.firedGuards || []).map((g) => (g.file ? g.file + '  ' : '') + g.title),
      });
    }
  } else if (atHead.verdict === 'SILENT') {
    buckets.detectionLost.push({ id: row.id, guardTitle: row.guardTitle });
    fail(row.id, 'DETECTION LOST: caught at baseline ' + BASELINE_FULL_SHA.slice(0, 7)
      + ' ("' + row.guardTitle + '") but SILENT at HEAD -- no guard fired');
  } else {
    fail(row.id, 'final record carries unknown verdict "' + atHead.verdict + '" -- malformed');
  }
}

// Ids at HEAD that the baseline never had (would mean the fixed mutation set
// grew). Informational: they cannot lower the BASELINE floor.
const baselineIds = new Set(baseline.results.map((r) => r.id));
const extraAtHead = [...finalById.keys(), ...finalSkipById.keys()].filter((id) => !baselineIds.has(id) && id !== 'M00');

// ---------------------------------------------------------------------------
// print the partition
// ---------------------------------------------------------------------------
console.log('');
console.log('partition of all ' + baseline.results.length + ' baseline-CAUGHT mutations at '
  + (freshness === 'LIVE' ? 'live HEAD ' : 'recorded HEAD ') + recordedSha(finalRec).slice(0, 7) + ':');
console.log('');
console.log('SAME-GUARD (' + buckets.sameGuard.length + '): still detected, target guard fired on both sides');
for (const r of buckets.sameGuard) console.log('  ' + r.id + '  ' + r.guard + '  ' + r.guardTitle);
console.log('');
console.log('GUARD-CHANGED (' + buckets.guardChanged.length + '): still detected, but NOT by the baseline\'s named guard');
for (const r of buckets.guardChanged) {
  console.log('  ' + r.id + '  old guard (baseline): ' + r.oldGuard + '  ' + r.oldGuardTitle);
  console.log('       old guard still present at HEAD: ' + (r.oldGuardStillExists ? 'yes (it just did not fire)' : 'NO -- retired/renamed/consolidated'));
  console.log('       now caught by:');
  for (const g of r.newGuards) console.log('         - ' + g);
}
console.log('');
console.log('CLAIM-GONE (' + buckets.claimGone.length + '): skipped at HEAD, anchor occurs 0 times -- the claim no longer exists (NOT lost, per ruling W8-R1 above; listed, never folded into the pass)');
for (const r of buckets.claimGone) {
  console.log('  ' + r.id + '  ' + r.guardTitle);
  console.log('       instrument reason: ' + r.reason);
}
console.log('');
console.log('DETECTION-LOST (' + buckets.detectionLost.length + ')' + (buckets.detectionLost.length ? ':' : ': none'));
for (const r of buckets.detectionLost) console.log('  ' + r.id + '  ' + r.guardTitle);
if (buckets.skipUnproven.length) {
  console.log('');
  console.log('SKIP-UNPROVEN (' + buckets.skipUnproven.length + '): skipped at HEAD for a reason other than claim-gone -- detection NOT measured');
  for (const r of buckets.skipUnproven) console.log('  ' + r.id + '  reason: ' + r.reason);
}
if (buckets.unaccounted.length) {
  console.log('');
  console.log('UNACCOUNTED (' + buckets.unaccounted.length + '): ' + buckets.unaccounted.join(', '));
}
if (extraAtHead.length) {
  console.log('');
  console.log('note: ids at HEAD with no baseline row (cannot affect the baseline floor): ' + extraAtHead.join(', '));
}

// ---------------------------------------------------------------------------
// verdict
// ---------------------------------------------------------------------------
console.log('');
console.log('='.repeat(78));
if (failures.length === 0) {
  // RV-7: recordedSha(finalRec) is the sha the record CLAIMS to have
  // measured -- under FRESH or LIVE that sha IS the repo's current HEAD
  // (asserted above), but under FRESH-BY-CONTENT it is an ancestor of HEAD,
  // not HEAD itself. Naming it "HEAD" unconditionally contradicts the
  // freshness banner already printed for that exact case. Say which one it
  // is, plainly, rather than calling an ancestor "HEAD".
  if (freshness === 'FRESH-BY-CONTENT') {
    console.log('VERDICT: DETECTION FLOOR HOLDS -- record measured at ' + recordedSha(finalRec)
      + ', an ancestor of current HEAD ' + headSha + ', exempt under FRESH-BY-CONTENT (see freshness note above).');
  } else {
    console.log('VERDICT: DETECTION FLOOR HOLDS at HEAD ' + recordedSha(finalRec));
  }
  console.log('  every mutation the suite caught at baseline ' + BASELINE_FULL_SHA.slice(0, 7) + ' is accounted for:');
  console.log('  ' + buckets.sameGuard.length + ' same-guard, '
    + buckets.guardChanged.length + ' changed-guard (listed by name above), '
    + buckets.claimGone.length + ' claim-gone (listed above, ruling W8-R1);');
  console.log('  0 detection lost; identity control GREEN on both sides; HEAD record '
    + (freshness === 'LIVE' ? 'derived live' : freshness.toLowerCase()) + '.');
  if (freshness === 'LIVE') {
    // RV-6: say plainly whether the committed artifact was itself validated
    // by this run, and how -- silence here would read as a pass on the
    // committed file when in fact only the live run (this record) was ever
    // proven; a reader relying on the checked-in tools/mutation-matrix-final.json
    // needs to know which of those two things just happened.
    console.log('  committed-final-record cross-check: ' + crossCheckMode + '.');
  }
  process.exit(0);
} else {
  console.log('VERDICT: FAILURE -- the detection floor does NOT hold (or the comparison is untrustworthy).');
  console.log('  ' + failures.length + ' failure(s):');
  for (const f of failures) console.log('  - [' + f.id + '] ' + f.reason);
  process.exit(1);
}
