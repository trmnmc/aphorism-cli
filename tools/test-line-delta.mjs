#!/usr/bin/env node
// tools/test-line-delta.mjs -- measure the before/after LINE COUNT of test/
// between two git revisions, and print the delta plus the exact evidence
// that explains it (which commits between the two revisions touched test/,
// and the per-file +/- for each).
//
// WHY THIS TOOL EXISTS (S-6 ruling, recorded in REPORT.md)
// ----------------------------------------------------------------------------
// tools/guard-inventory.mjs (W-1) already re-derives a per-file test/ line
// census, but ONLY for the checked-out WORKING TREE -- it calls
// readFileSync(path.join(ROOT, 'test', f)) with no revision argument
// anywhere in the file (grep it: no process.argv handling exists at all). It
// cannot answer "how many lines did test/ carry at commit 20b7ede", only
// "how many lines does test/ carry right now". This run's REPORT.md needs a
// BEFORE (baseline commit) and an AFTER (this run's HEAD) number, which is a
// two-revision comparison guard-inventory.mjs cannot produce -- confirmed by
// reading it, not assumed. So this is new tooling (branch (a)), not a
// citation of existing tooling (branch (b)).
//
// WHAT THIS IS
// ----------------------------------------------------------------------------
// Run from anywhere inside the repo:
//
//     node tools/test-line-delta.mjs
//     node tools/test-line-delta.mjs --baseline 20b7ede --target HEAD
//     node tools/test-line-delta.mjs --json
//
// For BOTH revisions it lists every test/*.test.js blob that revision's tree
// actually contains (`git ls-tree`), reads each blob's content at that
// revision (`git show <rev>:<path>`), and counts lines the same way the
// repo's own guard-inventory.mjs does: split on '\n', minus one if the blob
// ends with a trailing newline. Nothing is hardcoded -- not the baseline
// commit's line count, not the target's, not the delta, not which files
// changed. A caller who does not trust the printed numbers can re-run this
// file, or diff its two `git show` calls by hand.
//
// It also runs `git log --oneline <baseline>..<target> -- test/` so the
// commit(s) responsible for the delta are named as evidence, and
// `git diff --stat <baseline>..<target> -- test/` for the per-file
// insertions/deletions those commits produced. It does NOT know about this
// run's backlog item IDs -- attributing a delta to a specific work item
// (e.g. "W-7") is a claim REPORT.md makes by reading this evidence
// alongside the backlog, not a claim this tool manufactures.
//
// WHAT THIS IS NOT
// ----------------------------------------------------------------------------
// It writes nothing (read-only git plumbing: ls-tree, show, log, diff
// --stat, rev-parse -- no verb that could mutate the repo or checkout is
// ever invoked). It is not part of the test suite (`node --test
// test/*.test.js` does not collect *.mjs). It has no dependency beyond
// `node:` builtins (child_process only).
//
// PROVING THIS IS A MEASUREMENT, NOT A CONSTANT
// ----------------------------------------------------------------------------
// A tool that always prints 4587 -> 4666 (delta +79) regardless of what it
// is pointed at would not be a measurement. Point it at two revisions where
// the true answer is known to differ from the run's headline number and it
// must report THAT answer instead -- e.g.:
//
//     node tools/test-line-delta.mjs --baseline 20b7ede --target 20b7ede
//         -> delta 0 (identity: comparing a revision against itself)
//     node tools/test-line-delta.mjs --baseline 20b7ede --target 02f4668^
//         -> delta 0 (the parent of the only commit that ever touches
//            test/ between baseline and HEAD; test/ is untouched there)
//     node tools/test-line-delta.mjs --baseline 20b7ede --target 02f4668
//         -> delta +79 (that commit's own net change lands in one step)
//
// See REPORT.md for the actual run of these three invocations and their
// output, plus a fourth against a scratch clone with a synthetic one-line
// mutation, kept outside this file so the tool itself stays read-only.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log([
    'usage: node tools/test-line-delta.mjs [--baseline <rev>] [--target <rev>] [--json]',
    '',
    'Measures the test/*.test.js line count at two git revisions (default',
    '--baseline 20b7ede --target HEAD) and prints the per-file counts, the',
    'total at each revision, the delta, and the commit(s) between them that',
    'touched test/ (with a --stat of what each one did).',
    '',
    '  --baseline <rev>   revision to measure as the "before" (default 20b7ede)',
    '  --target <rev>     revision to measure as the "after"  (default HEAD)',
    '  --json              machine-readable record on stdout instead of prose',
    '  --help, -h          print this message and exit 0',
  ].join('\n'));
  process.exit(0);
}

function optval(flag, fallback) {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) {
    console.error(`[test-line-delta] ${flag} needs a value`);
    process.exit(2);
  }
  return v;
}

const BASELINE_REV = optval('--baseline', '20b7ede');
const TARGET_REV = optval('--target', 'HEAD');
const JSON_OUT = args.includes('--json');

// ---------------------------------------------------------------------------
// read-only git (mirrors tools/citation-tax.mjs's belt-and-braces wrapper:
// refuse any verb that could mutate the repo or the checkout)
// ---------------------------------------------------------------------------
const WRITE_VERBS = new Set([
  'commit', 'add', 'push', 'checkout', 'reset', 'stash', 'tag', 'merge',
  'rebase', 'cherry-pick', 'am', 'apply', 'rm', 'mv', 'clean', 'gc',
  'update-ref', 'switch', 'restore', 'fetch', 'pull', 'branch', 'notes',
]);

function git(gitArgs, { allowFailure = false } = {}) {
  if (WRITE_VERBS.has(gitArgs[0])) {
    throw new Error(`refusing to run a mutating git verb: git ${gitArgs[0]}`);
  }
  const r = spawnSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) {
    if (allowFailure) return { ok: false, out: '', err: String(r.error) };
    throw r.error;
  }
  if (r.status !== 0) {
    if (allowFailure) return { ok: false, out: r.stdout ?? '', err: (r.stderr ?? '').trim() };
    throw new Error(`git ${gitArgs.join(' ')} failed (${r.status}): ${(r.stderr ?? '').trim()}`);
  }
  return { ok: true, out: r.stdout ?? '', err: (r.stderr ?? '').trim() };
}

function resolveSha(rev) {
  return git(['rev-parse', rev]).out.trim();
}

// Same convention as tools/guard-inventory.mjs's census (section A): split
// on '\n', minus one if the text ends with a trailing newline.
function countLines(text) {
  if (text.length === 0) return 0;
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

function testFilesAt(rev) {
  const out = git(['ls-tree', '-r', '--name-only', rev, '--', 'test/']).out;
  return out.split('\n').filter((l) => l.endsWith('.test.js')).sort();
}

function fileLinesAt(rev, filePath) {
  const r = git(['show', `${rev}:${filePath}`]);
  return countLines(r.out);
}

function census(rev) {
  const sha = resolveSha(rev);
  const files = testFilesAt(sha);
  const perFile = {};
  let total = 0;
  for (const f of files) {
    const n = fileLinesAt(sha, f);
    perFile[f] = n;
    total += n;
  }
  return { rev, sha, files, perFile, total };
}

const before = census(BASELINE_REV);
const after = census(TARGET_REV);

const allFiles = [...new Set([...before.files, ...after.files])].sort();
const addedFiles = after.files.filter((f) => !before.files.includes(f));
const removedFiles = before.files.filter((f) => !after.files.includes(f));

const delta = after.total - before.total;

// Evidence: which commits between the two revisions touched test/, and what
// each one did (a --stat, not this tool's own opinion about which backlog
// item that commit corresponds to).
let touchingCommits = [];
let statText = '';
if (before.sha !== after.sha) {
  const logR = git(['log', '--oneline', `${before.sha}..${after.sha}`, '--', 'test/'], { allowFailure: true });
  touchingCommits = logR.ok && logR.out.trim() ? logR.out.trim().split('\n') : [];
  const statR = git(['diff', '--stat', `${before.sha}..${after.sha}`, '--', 'test/'], { allowFailure: true });
  statText = statR.ok ? statR.out.trimEnd() : '';
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    baseline: { rev: BASELINE_REV, sha: before.sha, files: before.files.length, totalLines: before.total, perFile: before.perFile },
    target: { rev: TARGET_REV, sha: after.sha, files: after.files.length, totalLines: after.total, perFile: after.perFile },
    delta,
    addedFiles,
    removedFiles,
    touchingCommits,
    diffStat: statText,
  }, null, 2));
  process.exit(0);
}

console.log('TEST/ LINE-COUNT DELTA -- measured from git objects, never hardcoded');
console.log(`repo root: ${ROOT}`);
console.log('');
console.log(`baseline: ${BASELINE_REV}  (resolved ${before.sha})`);
console.log(`target:   ${TARGET_REV}  (resolved ${after.sha})`);
console.log('');

console.log('== per-file line counts ==');
console.log('');
const w = Math.max(...allFiles.map((f) => f.length), 'FILE'.length);
console.log(`  ${'FILE'.padEnd(w)}  BASELINE  TARGET  DELTA`);
for (const f of allFiles) {
  const b = before.perFile[f];
  const a = after.perFile[f];
  const bStr = b == null ? '(absent)' : String(b);
  const aStr = a == null ? '(absent)' : String(a);
  const dStr = b == null || a == null ? 'n/a' : String(a - b);
  console.log(`  ${f.padEnd(w)}  ${bStr.padStart(8)}  ${aStr.padStart(6)}  ${dStr.padStart(5)}`);
}
console.log('');
console.log(`  TOTAL${' '.repeat(w - 5)}  ${String(before.total).padStart(8)}  ${String(after.total).padStart(6)}  ${(delta >= 0 ? '+' : '') + delta}`);
console.log('');

if (addedFiles.length) console.log(`  files present at target but not baseline: ${addedFiles.join(', ')}`);
if (removedFiles.length) console.log(`  files present at baseline but not target: ${removedFiles.join(', ')}`);
console.log('');

console.log('== commit(s) between baseline and target that touched test/ ==');
console.log('');
if (before.sha === after.sha) {
  console.log('  (baseline and target resolve to the same commit; nothing to walk)');
} else if (touchingCommits.length === 0) {
  console.log('  NONE -- test/ is byte-identical in tree shape between the two revisions');
  console.log('  for every path git tracks there (their contents may still differ from');
  console.log('  each other only if this run is comparing non-ancestor revisions).');
} else {
  for (const line of touchingCommits) console.log(`  ${line}`);
  console.log('');
  console.log('  --stat for that range, test/ only:');
  for (const line of statText.split('\n')) console.log(`    ${line}`);
}
console.log('');

console.log(`VERDICT: test/ moved from ${before.total} lines (${BASELINE_REV}) to ${after.total} lines (${TARGET_REV}): ${delta >= 0 ? '+' : ''}${delta} lines.`);
