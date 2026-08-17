#!/usr/bin/env node
// ===========================================================================
// cycle-8 (run #2) — ADDENDUM to the J-9 cost reproduction.
//
// The main cost probe measured the three FALSE-duplicate shapes the cycle-6
// follow-up had already published (K1-K3). It did NOT run the three hole cells
// authored fresh this cycle and sealed before dispatch (J4/J5/J6 of the gate),
// so "a fix closes the hole" rested on three cells rather than six.
//
// This closes that gap against V2 only — the threshold-generalised design the
// builder reported building, and the one the retirement verdict judges. V1 is
// not re-run here because it is already refuted by a strictly larger cost
// (4 new false rejections against V2's 2); running it again would not change
// any verdict.
//
// A FAILABILITY CONTROL runs alongside: the same three sentences with their
// numbers made TRUE must stay GREEN on V2. Without it, three REDs could mean
// "the fix catches these falsehoods" or "the fix rejects these sentences
// whatever they say", and those are very different findings.
// ===========================================================================

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const BASE_COMMIT = 'cb4b1c2';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c8r2add-'));
const log = (...a) => console.log(...a);

const OPENING =
  'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';
const TAIL_ANCHOR = 'The smallest pool holds three aphorisms';

// V2 patch — identical text to cycle-008-r2-cost-probe.mjs. Re-stated rather
// than imported so this file is auditable on its own.
const S1_FROM = `  // Look for "X distinct tags" in the README
  const match = readmeContent.match(/(\\d+)\\s+distinct tags/);
  assert(match, 'README should state the total number of distinct tags');

  const statedCount = parseInt(match[1], 10);
  assert.equal(statedCount, totalUniqueTags, 'README states ' + statedCount + ' distinct tags but corpus has ' + totalUniqueTags);`;
const S1_TO = `  const all = [...readmeContent.matchAll(/(\\d+)\\s+distinct tags/g)];
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
const S2_TO = `  const all = [...readmeContent.matchAll(/(\\d+)\\s+tags appear exactly once/g)];
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

const CELLS = [
  { id: 'P0', want: 'GREEN', where: null, sentence: null, what: 'no README mutation (soundness control)' },
  // The three hole cells authored this cycle and sealed before dispatch.
  { id: 'J4', want: 'RED', where: 'tail', sentence: 'Overall 9 tags appear on 2 or more entries.',
    what: 'FALSE at the END of the section — position independence (true: 12)' },
  { id: 'J5', want: 'RED', where: 'after', sentence: 'Note that 30 distinct tags remain after the fold.',
    what: 'FALSE, shape 1, different sentence frame (true: 12)' },
  { id: 'J6', want: 'RED', where: 'after', sentence: 'Even so, 6 tags appear exactly once today.',
    what: 'FALSE, shape 3, "exactly once" phrasing (true: 0)' },
  // FAILABILITY CONTROLS — same three sentences made TRUE. Must stay GREEN, or
  // the three REDs above are the fix rejecting a sentence shape rather than
  // catching a falsehood, and they attribute nothing.
  { id: 'J4t', want: 'GREEN', where: 'tail', sentence: 'Overall 12 tags appear on 2 or more entries.',
    what: 'CONTROL — J4 made TRUE (12)' },
  { id: 'J5t', want: 'GREEN', where: 'after', sentence: 'Note that 12 distinct tags remain after the fold.',
    what: 'CONTROL — J5 made TRUE (12)' },
  { id: 'J6t', want: 'GREEN', where: 'after', sentence: 'Even so, 0 tags appear exactly once today.',
    what: 'CONTROL — J6 made TRUE (0)' },
];

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
  return { verdict: r.status === 0 ? 'GREEN' : 'RED', pass, fail, failed };
}

const baseDir = path.join(WORK, 'base');
fs.mkdirSync(baseDir);
const tar = execFileSync('git', ['-C', TARGET, 'archive', BASE_COMMIT], { maxBuffer: 1 << 28 });
fs.writeFileSync(path.join(WORK, 'base.tar'), tar);
execFileSync('tar', ['-xf', path.join(WORK, 'base.tar'), '-C', baseDir]);

const TESTFILE = 'test/readme-tags.test.js';
const shipped = fs.readFileSync(path.join(baseDir, TESTFILE), 'utf8');
let v2 = shipped;
v2 = applyOnce(v2, S1_FROM, S1_TO, 'S1');
v2 = applyOnce(v2, S2_FROM, S2_TO, 'S2');
v2 = applyOnce(v2, S3_FROM, S3_TO_V2, 'S3');
v2 = applyOnce(v2, S4_FROM, S4_TO, 'S4');

log('=== cycle-8 (run #2) J-9 cost addendum — sealed hole cells J4/J5/J6 against V2 ===');
log('base commit:', execFileSync('git', ['-C', TARGET, 'rev-parse', '--short', BASE_COMMIT], { encoding: 'utf8' }).trim());
log('V2 patch: applied, 4/4 anchors\n');

let held = 0;
for (const cell of CELLS) {
  const dir = path.join(WORK, cell.id);
  execFileSync('cp', ['-a', baseDir, dir]);
  fs.writeFileSync(path.join(dir, TESTFILE), v2);
  if (cell.sentence) {
    const p = path.join(dir, 'README.md');
    const t = fs.readFileSync(p, 'utf8');
    const anchor = cell.where === 'tail' ? TAIL_ANCHOR : OPENING;
    if (t.split(anchor).length !== 2) { log(`[VOID] ${cell.id} — anchor absent or ambiguous`); continue; }
    fs.writeFileSync(p, cell.where === 'tail'
      ? t.replace(anchor, cell.sentence + '\n\n' + anchor)
      : t.replace(anchor, anchor + '\n\n' + cell.sentence));
  }
  const r = runSuite(dir);
  const ok = r.verdict === cell.want;
  if (ok) held++;
  log(`[${ok ? 'HOLD' : 'BREAK'}] ${cell.id}  V2=${r.verdict}(${r.pass}/${r.fail})  want ${cell.want}`);
  log(`        ${cell.what}` + (cell.sentence ? `  "${cell.sentence}"` : ''));
  if (r.failed.length) log(`        failing: ${r.failed.slice(0, 2).map(s => s.slice(0, 110)).join(' | ')}`);
  fs.rmSync(dir, { recursive: true, force: true });
}

log('');
log(`SCORE ${held}/${CELLS.length} cells hold`);
fs.rmSync(WORK, { recursive: true, force: true });
process.exit(held === CELLS.length ? 0 : 1);
