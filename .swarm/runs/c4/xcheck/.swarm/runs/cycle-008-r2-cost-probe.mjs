#!/usr/bin/env node
// ===========================================================================
// cycle-8 (run #2) — INDEPENDENT REPRODUCTION of the J-9 retirement argument.
//
// WHY THIS EXISTS. The builder took route (b): it built the candidate fix,
// measured that the fix introduces false rejections on TRUE prose, reverted,
// and returned the measurement as J-9's retirement argument. That measurement
// IS the item's verdict, and it arrived as a CLAIM with its evidence deleted
// (the builder removed its own scratch tree, as instructed). Hard rule 2 says
// a claim that decides an item must be reproduced by the conductor, not
// accepted. So this rebuilds the candidate fix from the SHIPPED test file --
// not from the builder's diff, which no longer exists -- and re-measures.
//
// This is the cycle-35 method: rebuild the natural widenings from the shipped
// helper and measure what each one costs.
//
// THREE VARIANTS, all patched into throwaway copies of the pre-dispatch tree:
//   V0  the shipped file, unmodified                    (the hole is open)
//   V1  NAIVE: every extraction site moves from .match() (first occurrence)
//       to .matchAll() (every occurrence), each occurrence checked against
//       the SAME corpus-derived number the site already uses. This is the fix
//       any maintainer reaches for first, and it is what J-9's own notes
//       point at (the duplicated-label rule that parseAttributionCountsTable
//       already applies one level up).
//   V2  THRESHOLD-GENERALISED: V1, plus the "or more" site extracts the
//       threshold digit that precedes "or more" and computes the expected
//       count FOR THAT THRESHOLD instead of hardcoding 2. This is the design
//       the builder reported building, and it is strictly the more careful
//       of the two.
//
// FOUR EXTRACTION SITES exist in the shipped file (three tests):
//   S1  L109   readmeContent.match(/(\d+)\s+distinct tags/)
//   S2  L130   readmeContent.match(/(\d+)\s+tags appear exactly once/)
//   S3  L1095  tagVocabSection.match(/(\d+)\s+tags?\b[^.;\n]*\bor more\b/i)
//   S4  L1117  tagVocabSection.match(/(\d+)\b[^.;\n]*\bexactly one\b/i)
//
// CELLS. Every KILL sentence is FALSE and every COST sentence is TRUE, each
// by the corpus facts measured at cycle-008-r2-facts.mjs:
//   50 entries · 12 distinct tags · 12 tags on >=2 · 0 tags on exactly 1
//   7 tags on >=5 · 2 tags on >=10 · 5 tags on 3-4
// The three cost sentences marked BUILDER are the ones the builder reported
// as its false rejections. They are re-run here against a fix rebuilt from
// the shipped source, so a HOLD/BREAK on them is a reproduction rather than
// a restatement.
// ===========================================================================

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const BASE_COMMIT = process.env.BASE_COMMIT || 'cb4b1c2';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c8r2cost-'));
const log = (...a) => console.log(...a);

const OPENING =
  'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';

// --- the four shipped extraction sites, verbatim ---------------------------
const S1_FROM = `  // Look for "X distinct tags" in the README
  const match = readmeContent.match(/(\\d+)\\s+distinct tags/);
  assert(match, 'README should state the total number of distinct tags');

  const statedCount = parseInt(match[1], 10);
  assert.equal(statedCount, totalUniqueTags, 'README states ' + statedCount + ' distinct tags but corpus has ' + totalUniqueTags);`;

const S1_TO = `  // V-PATCH: every occurrence, not just the first.
  const all = [...readmeContent.matchAll(/(\\d+)\\s+distinct tags/g)];
  assert(all.length > 0, 'README should state the total number of distinct tags');
  for (const m of all) {
    const statedCount = parseInt(m[1], 10);
    assert.equal(statedCount, totalUniqueTags, 'README states ' + statedCount + ' distinct tags but corpus has ' + totalUniqueTags);
  }`;

const S2_FROM = `  // Look for "remaining X tags" or "X tags appear exactly once"
  const match = readmeContent.match(/(\\d+)\\s+tags appear exactly once/);
  assert(match, 'README should state how many tags appear exactly once');

  const statedCount = parseInt(match[1], 10);
  assert.equal(statedCount, singleEntryCount, 'README states ' + statedCount + ' single-entry tags but corpus has ' + singleEntryCount);`;

const S2_TO = `  // V-PATCH: every occurrence, not just the first.
  const all = [...readmeContent.matchAll(/(\\d+)\\s+tags appear exactly once/g)];
  assert(all.length > 0, 'README should state how many tags appear exactly once');
  for (const m of all) {
    const statedCount = parseInt(m[1], 10);
    assert.equal(statedCount, singleEntryCount, 'README states ' + statedCount + ' single-entry tags but corpus has ' + singleEntryCount);
  }`;

const S3_FROM = `  const multiEntryMatch = tagVocabSection.match(/(\\d+)\\s+tags?\\b[^.;\\n]*\\bor more\\b/i);
  assert(
    multiEntryMatch,
    'could not find a "<N> tags ... or more" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const statedMultiEntryCount = parseInt(multiEntryMatch[1], 10);
  const expectedMultiEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] >= 2).length;
  assert.equal(
    statedMultiEntryCount,
    expectedMultiEntryCount,
    'README states ' + statedMultiEntryCount + ' tags appear on 2 or more entries, but the corpus has ' +
      expectedMultiEntryCount
  );`;

const S3_TO_V1 = `  const multiAll = [...tagVocabSection.matchAll(/(\\d+)\\s+tags?\\b[^.;\\n]*\\bor more\\b/gi)];
  assert(
    multiAll.length > 0,
    'could not find a "<N> tags ... or more" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const expectedMultiEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] >= 2).length;
  for (const mm of multiAll) {
    const statedMultiEntryCount = parseInt(mm[1], 10);
    assert.equal(
      statedMultiEntryCount,
      expectedMultiEntryCount,
      'README states ' + statedMultiEntryCount + ' tags appear on 2 or more entries, but the corpus has ' +
        expectedMultiEntryCount + ' (claim: "' + mm[0] + '")'
    );
  }`;

// V2: the threshold that precedes "or more" is read out of the matched clause
// and the expectation is computed for THAT threshold.
const S3_TO_V2 = `  const multiAll = [...tagVocabSection.matchAll(/(\\d+)\\s+tags?\\b[^.;\\n]*\\bor more\\b/gi)];
  assert(
    multiAll.length > 0,
    'could not find a "<N> tags ... or more" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  for (const mm of multiAll) {
    const statedMultiEntryCount = parseInt(mm[1], 10);
    const thresholdMatch = mm[0].match(/(\\d+)\\s+or more/i);
    const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 2;
    const expectedMultiEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] >= threshold).length;
    assert.equal(
      statedMultiEntryCount,
      expectedMultiEntryCount,
      'README states ' + statedMultiEntryCount + ' tags appear on ' + threshold + ' or more entries, but the corpus has ' +
        expectedMultiEntryCount + ' (claim: "' + mm[0] + '")'
    );
  }`;

const S4_FROM = `  const singleEntryMatch = tagVocabSection.match(/(\\d+)\\b[^.;\\n]*\\bexactly one\\b/i);
  assert(
    singleEntryMatch,
    'could not find a "<N> ... exactly one" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const statedSingleEntryCount = parseInt(singleEntryMatch[1], 10);
  const expectedSingleEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] === 1).length;
  assert.equal(
    statedSingleEntryCount,
    expectedSingleEntryCount,
    'README states ' + statedSingleEntryCount + ' tags appear on exactly one entry, but the corpus has ' +
      expectedSingleEntryCount
  );`;

const S4_TO = `  const singleAll = [...tagVocabSection.matchAll(/(\\d+)\\b[^.;\\n]*\\bexactly one\\b/gi)];
  assert(
    singleAll.length > 0,
    'could not find a "<N> ... exactly one" claim in the Tag vocabulary section -- ' +
      'this claim must fail loud, not pass silently, when it cannot be parsed'
  );
  const expectedSingleEntryCount = Object.keys(tagsInCorpus).filter(tag => tagsInCorpus[tag] === 1).length;
  for (const sm of singleAll) {
    const statedSingleEntryCount = parseInt(sm[1], 10);
    assert.equal(
      statedSingleEntryCount,
      expectedSingleEntryCount,
      'README states ' + statedSingleEntryCount + ' tags appear on exactly one entry, but the corpus has ' +
        expectedSingleEntryCount + ' (claim: "' + sm[0] + '")'
    );
  }`;

function applyOnce(text, from, to, label) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`patch anchor ${label} matched ${n} times, expected exactly 1`);
  return text.replace(from, to);
}

function patchTestFile(src, variant) {
  if (variant === 'V0') return src;
  let out = src;
  out = applyOnce(out, S1_FROM, S1_TO, 'S1');
  out = applyOnce(out, S2_FROM, S2_TO, 'S2');
  out = applyOnce(out, S3_FROM, variant === 'V2' ? S3_TO_V2 : S3_TO_V1, 'S3');
  out = applyOnce(out, S4_FROM, S4_TO, 'S4');
  return out;
}

// --- README mutations ------------------------------------------------------
function insertAfter(text, anchor, para) {
  if (text.split(anchor).length !== 2) return null;
  return text.replace(anchor, anchor + '\n\n' + para);
}

const CELLS = [
  { id: 'P0', kind: 'control', sentence: null,
    what: 'no README mutation — the shipped document' },

  // KILLS — every sentence FALSE. Want: GREEN on V0 (the hole), RED on a fix.
  { id: 'K1', kind: 'kill', sentence: '9 tags appear on 2 or more entries.',
    what: 'FALSE shape-2 duplicate (true: 12)' },
  { id: 'K2', kind: 'kill', sentence: 'The corpus contains 13 distinct tags.',
    what: 'FALSE shape-1 duplicate (true: 12)' },
  { id: 'K3', kind: 'kill', sentence: 'In fact 4 tags sit on exactly one entry.',
    what: 'FALSE shape-3 duplicate (true: 0)' },

  // COST — every sentence TRUE. Want: GREEN everywhere. A RED is a NEW FALSE
  // REJECTION bought by the fix.
  { id: 'C1', kind: 'cost', sentence: 'All 12 distinct tags are listed below.',
    what: 'TRUE, shape 1, same number (my sealed cell X1)' },
  { id: 'C2', kind: 'cost', sentence: '7 tags appear on 5 or more entries.',
    what: 'TRUE, shape 2, different threshold — measured 7 (my sealed cell X2)' },
  { id: 'C3', kind: 'cost', sentence: '2 tags appear on 10 or more entries.',
    what: 'TRUE, shape 2, another threshold — measured 2 (my sealed cell X3)' },
  { id: 'C4', kind: 'cost', sentence: 'Put another way, 12 tags appear on 2 or more entries.',
    what: 'TRUE, shape 2, same number and threshold (my sealed cell X4)' },

  // The builder's three reported false rejections, re-run against a fix
  // rebuilt from the shipped source rather than against the builder's diff.
  { id: 'C5', kind: 'cost', builder: true, sentence: 'Of these, 7 distinct tags carry 5 or more entries each.',
    what: 'BUILDER-CLAIMED — TRUE; "distinct tags" meaning "different tags", not vocabulary size' },
  { id: 'C6', kind: 'cost', builder: true, sentence: 'With 50 entries in the corpus, exactly one aphorism is chosen per run.',
    what: 'BUILDER-CLAIMED — TRUE; "exactly one" about selection, nothing to do with tag counts' },
  { id: 'C7', kind: 'cost', builder: true, sentence: '7 tags appear on five or more entries.',
    what: 'BUILDER-CLAIMED — TRUE; word-form threshold, digit-form subject' },
];

// ---------------------------------------------------------------------------
function runSuite(dir) {
  const r = spawnSync('bash', ['-c', 'node --test test/*.test.js'], {
    cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const num = re => Number((out.match(re) || [])[1] ?? -1);
  let pass = num(/^# pass (\d+)/m);
  let fail = num(/^# fail (\d+)/m);
  if (pass < 0) pass = num(/^ℹ pass (\d+)/m);
  if (fail < 0) fail = num(/^ℹ fail (\d+)/m);
  const failed = [
    ...[...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1].trim()),
    ...[...out.matchAll(/^✖ (.+?) \(\d[\d.]*ms\)$/gm)].map(m => m[1].trim()),
  ];
  return { verdict: r.status === 0 ? 'GREEN' : 'RED', pass, fail, failed, out };
}

const baseDir = path.join(WORK, 'base');
fs.mkdirSync(baseDir);
const tar = execFileSync('git', ['-C', TARGET, 'archive', BASE_COMMIT], { maxBuffer: 1 << 28 });
fs.writeFileSync(path.join(WORK, 'base.tar'), tar);
execFileSync('tar', ['-xf', path.join(WORK, 'base.tar'), '-C', baseDir]);

const TESTFILE = 'test/readme-tags.test.js';
const shippedTest = fs.readFileSync(path.join(baseDir, TESTFILE), 'utf8');

log('=== cycle-8 (run #2) J-9 independent cost reproduction ===');
log('base commit:', execFileSync('git', ['-C', TARGET, 'rev-parse', '--short', BASE_COMMIT], { encoding: 'utf8' }).trim());

// Patch soundness: every variant must actually differ from the shipped file,
// and each anchor must have matched exactly once (applyOnce throws otherwise).
const VARIANTS = ['V0', 'V1', 'V2'];
const patched = {};
for (const v of VARIANTS) {
  patched[v] = patchTestFile(shippedTest, v);
  const changed = patched[v] !== shippedTest;
  log(`patch ${v}: ${v === 'V0' ? 'identity (control)' : changed ? 'applied, 4/4 anchors' : 'NO-OP — VARIANT IS VOID'}`);
  if (v !== 'V0' && !changed) process.exit(2);
}
if (patched.V1 === patched.V2) { log('V1 and V2 are identical — the threshold patch is VOID'); process.exit(2); }
log('');

const results = {};
for (const v of VARIANTS) {
  results[v] = {};
  for (const cell of CELLS) {
    const dir = path.join(WORK, `${v}-${cell.id}`);
    execFileSync('cp', ['-a', baseDir, dir]);
    fs.writeFileSync(path.join(dir, TESTFILE), patched[v]);
    if (cell.sentence) {
      const readmePath = path.join(dir, 'README.md');
      const mutated = insertAfter(fs.readFileSync(readmePath, 'utf8'), OPENING, cell.sentence);
      if (mutated === null) { results[v][cell.id] = { verdict: 'UNAPPLIABLE', pass: -1, fail: -1, failed: [] }; continue; }
      fs.writeFileSync(readmePath, mutated);
    }
    results[v][cell.id] = runSuite(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
log(pad('cell', 6) + pad('kind', 9) + pad('V0', 14) + pad('V1', 14) + pad('V2', 14) + 'sentence');
for (const cell of CELLS) {
  const r = v => `${results[v][cell.id].verdict}(${results[v][cell.id].pass}/${results[v][cell.id].fail})`;
  log(pad(cell.id, 6) + pad(cell.kind + (cell.builder ? '*' : ''), 9) + pad(r('V0'), 14) + pad(r('V1'), 14) + pad(r('V2'), 14) +
      (cell.sentence ? '"' + cell.sentence + '"' : '(none)'));
  log(pad('', 15) + cell.what);
  for (const v of ['V1', 'V2']) {
    const f = results[v][cell.id].failed;
    if (f.length) log(pad('', 15) + v + ' failing: ' + f.slice(0, 2).map(s => s.slice(0, 110)).join(' | '));
  }
}

// --- the ledger ------------------------------------------------------------
log('');
for (const v of VARIANTS) {
  const kills = CELLS.filter(c => c.kind === 'kill');
  const costs = CELLS.filter(c => c.kind === 'cost');
  const killed = kills.filter(c => results[v][c.id].verdict === 'RED').length;
  const falseRej = costs.filter(c => results[v][c.id].verdict === 'RED');
  const controlOk = results[v].P0.verdict === 'GREEN';
  log(`${v}: control ${controlOk ? 'GREEN (sound)' : 'RED — VARIANT UNSOUND, its cells attribute nothing'}` +
      ` · kills ${killed}/${kills.length}` +
      ` · FALSE REJECTIONS ${falseRej.length}/${costs.length}` +
      (falseRej.length ? ' [' + falseRej.map(c => c.id).join(', ') + ']' : ''));
}
const builderCells = CELLS.filter(c => c.builder);
const reproduced = builderCells.filter(c => results.V2[c.id].verdict === 'RED');
log('');
log(`BUILDER CLAIM REPRODUCTION (against V2, the design it reported building):` +
    ` ${reproduced.length}/${builderCells.length} of its reported false rejections reproduce` +
    (reproduced.length ? ' [' + reproduced.map(c => c.id).join(', ') + ']' : ''));

fs.rmSync(WORK, { recursive: true, force: true });
