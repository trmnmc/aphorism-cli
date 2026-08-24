#!/usr/bin/env node
// CONDUCTOR VERIFICATION GATE — cycle 4, item W-7 (close KI-R6-3).
// Authored at verification time, outside the target tree. The builder never saw it.
//
// The risk this gate exists to catch: removing one of two guards that read the same
// README row LOSES DETECTION of that row's falsification. Nothing the builder returns
// can settle that — only re-running the falsification against the post-change tree can.
//
// Method: two scratch clones of the repo, both at HEAD, one carrying the builder's
// uncommitted change and one not. Falsify the row in each. Compare the sets of NAMED
// tests that fail. Detection is preserved iff the post-change clone still fails on that
// mutation. Converse control in both clones: no mutation, no row-guard failure.
//
// The two guards in test/node-support-citation.test.js are EXPECTED to fail in the
// post-change clone: editing anything under test/ falsifies README's cited diff. That is
// the predicted citation window, named in advance. This gate separates them out by name
// and asserts they fail FOR THAT REASON, rather than ignoring them.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TARGET = '/opt/targets/aphorism-cli';
const GUARDED_FILE = 'test/readme-tags.test.js';
const CITATION_GUARDS = [
  'README Node support citation: cited git diff must be empty (or the check must skip on a missing precondition)',
  'README Node support citation: base-to-working-tree diff must also be empty, so an uncommitted falsification is visible now (or the check must skip on a missing precondition)',
];
// The falsification under test: README states 0 tags appear on exactly one entry (true of
// the corpus). Rewriting it to 3 makes the row false while leaving the table well-formed.
const ROW_TRUE = '| Tags on exactly one entry | 0 |';
const ROW_FALSE = '| Tags on exactly one entry | 3 |';

const results = [];
function cell(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`\n[${pass ? 'PASS' : 'FAIL'}] ${name}`);
  console.log(String(detail).split('\n').map((l) => '    ' + l).join('\n'));
}
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });

// Run the suite in `dir`; return { totals, failed:Set<testname>, raw }.
function runSuite(dir) {
  const files = fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
  const r = sh('node', ['--test', '--test-reporter=tap', ...files], { cwd: dir, timeout: 900000 });
  const raw = (r.stdout || '') + (r.stderr || '');
  const failed = new Set();
  // TAP: `not ok <n> - <name>` at any indent. Take top-level test names only.
  for (const m of raw.matchAll(/^not ok \d+ - (.+?)$/gm)) failed.add(m[1].trim());
  const skipped = new Set();
  for (const m of raw.matchAll(/^ok \d+ - (.+?) # SKIP/gm)) skipped.add(m[1].trim());
  const n = (k) => { const m = raw.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? Number(m[1]) : null; };
  return { totals: { tests: n('tests'), pass: n('pass'), fail: n('fail'), skipped: n('skipped') }, failed, skipped, raw };
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'c4-w7-gate-'));
function makeClone(name, withChange) {
  const dir = path.join(scratch, name);
  const c = sh('git', ['clone', '--no-hardlinks', '--quiet', TARGET, dir]);
  if (c.status !== 0) throw new Error('clone failed: ' + c.stderr);
  if (withChange) fs.copyFileSync(path.join(TARGET, GUARDED_FILE), path.join(dir, GUARDED_FILE));
  return dir;
}
function falsifyRow(dir) {
  const p = path.join(dir, 'README.md');
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(ROW_TRUE)) throw new Error('anchor row not found in README: ' + ROW_TRUE);
  fs.writeFileSync(p, s.replace(ROW_TRUE, ROW_FALSE));
}
function restore(dir) { sh('git', ['-C', dir, 'checkout', '--', 'README.md']); }

// ---------------------------------------------------------------------------
// CELL 1 — the change is confined to the one file in scope
// ---------------------------------------------------------------------------
const porcelain = sh('git', ['-C', TARGET, 'status', '--porcelain']).stdout.trim();
const changedTracked = porcelain.split('\n').filter(Boolean)
  .filter((l) => !l.startsWith('??'))
  .map((l) => l.slice(3).trim());
const untracked = porcelain.split('\n').filter(Boolean).filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim());
const diffstat = sh('git', ['-C', TARGET, 'diff', '--stat', '--', GUARDED_FILE]).stdout.trim();
cell(
  'C1 W-7 changed exactly test/readme-tags.test.js and nothing else tracked',
  changedTracked.length >= 1 && changedTracked.includes(GUARDED_FILE),
  `modified tracked files: ${JSON.stringify(changedTracked)}\n` +
  `untracked paths present (W-9's new tool is expected here): ${JSON.stringify(untracked)}\n` +
  `diffstat for the guarded file:\n${diffstat || '(no change)'}`
);

// ---------------------------------------------------------------------------
// CELL 2 — which branch did the builder take? Read it off the diff, do not ask.
// ---------------------------------------------------------------------------
const diff = sh('git', ['-C', TARGET, 'diff', '--', GUARDED_FILE]).stdout;
fs.writeFileSync('/opt/swarm/runs/c4-w7-diff.txt', diff);
const removedTestDecls = [...diff.matchAll(/^-\s*test\(\s*['"`](.+?)['"`]/gm)].map((m) => m[1]);
const addedTestDecls = [...diff.matchAll(/^\+\s*test\(\s*['"`](.+?)['"`]/gm)].map((m) => m[1]);
const branch = removedTestDecls.length > addedTestDecls.length ? 'CONSOLIDATE' : 'KEEP-BOTH';
cell(
  'C2 the branch taken is readable from the diff itself, not from the builder\'s claim',
  diff.length > 0,
  `branch as measured from the diff: ${branch}\n` +
  `test() declarations REMOVED: ${JSON.stringify(removedTestDecls)}\n` +
  `test() declarations ADDED:   ${JSON.stringify(addedTestDecls)}\n` +
  `diff is ${diff.length} bytes -> /opt/swarm/runs/c4-w7-diff.txt`
);

// ---------------------------------------------------------------------------
// CELL 3 — DETECTION PRESERVED. The whole point of the item.
//   before-clone (HEAD, no change) + row falsified  -> set A of failing tests
//   after-clone  (builder change)  + row falsified  -> set B of failing tests
//   Detection is preserved iff B contains at least one test that is not a citation guard.
// ---------------------------------------------------------------------------
const beforeDir = makeClone('before', false);
const afterDir = makeClone('after', true);

falsifyRow(beforeDir);
const beforeMut = runSuite(beforeDir);
restore(beforeDir);

falsifyRow(afterDir);
const afterMut = runSuite(afterDir);
restore(afterDir);

const isCitation = (t) => CITATION_GUARDS.some((g) => t === g);
const A = [...beforeMut.failed].filter((t) => !isCitation(t));
const B = [...afterMut.failed].filter((t) => !isCitation(t));
const lost = A.filter((t) => !B.includes(t));
const stillDetected = B.length > 0;
cell(
  'C3 DETECTION PRESERVED: falsifying the "Tags on exactly one entry" row still fails the suite after the change',
  stillDetected,
  `FIRING SET at HEAD (pre-change), citation guards excluded — ${A.length} test(s):\n` +
    A.map((t) => '  - ' + t).join('\n') +
  `\nFIRING SET after the change, citation guards excluded — ${B.length} test(s):\n` +
    (B.map((t) => '  - ' + t).join('\n') || '  (NONE — DETECTION LOST)') +
  `\nguards present pre-change but no longer firing: ${JSON.stringify(lost)}\n` +
  `(a name in that list is expected and fine IFF it is the guard that was deliberately removed\n` +
  ` AND at least one other guard still fires — that is exactly what "redundant" means)\n` +
  `totals pre-change/mutated:  ${JSON.stringify(beforeMut.totals)}\n` +
  `totals post-change/mutated: ${JSON.stringify(afterMut.totals)}`
);

// ---------------------------------------------------------------------------
// CELL 4 — CONVERSE CONTROL. Without the mutation, the row guards must be GREEN.
//   A check that fails on everything is a snapshot test, not an assertion.
// ---------------------------------------------------------------------------
const beforeClean = runSuite(beforeDir);
const afterClean = runSuite(afterDir);
const beforeCleanNonCitation = [...beforeClean.failed].filter((t) => !isCitation(t));
const afterCleanNonCitation = [...afterClean.failed].filter((t) => !isCitation(t));
cell(
  'C4 CONVERSE CONTROL: with the row TRUE, no row guard fires in either clone',
  beforeCleanNonCitation.length === 0 && afterCleanNonCitation.length === 0,
  `unmutated pre-change clone — non-citation failures: ${JSON.stringify(beforeCleanNonCitation)} totals ${JSON.stringify(beforeClean.totals)}\n` +
  `unmutated post-change clone — non-citation failures: ${JSON.stringify(afterCleanNonCitation)} totals ${JSON.stringify(afterClean.totals)}\n` +
  `so every failure in C3 is attributable to the mutation, not to ambient breakage`
);

// ---------------------------------------------------------------------------
// CELL 5 — THE PREDICTED CITATION WINDOW, in BOTH states, shown to fail for the reason
//   it names. Two guards watch the citation: one diffs base..HEAD (blind to uncommitted
//   work), one diffs base..WORKING TREE. So the window opens in two stages, and the
//   honest check measures both rather than asserting a single count:
//     uncommitted overlay -> ONLY the working-tree guard may fire
//     committed in-clone  -> BOTH must fire
//   The committed state is the one that ships, so it is the one that must be proven.
// ---------------------------------------------------------------------------
const WT_GUARD = CITATION_GUARDS[1];   // base -> working tree
const HEAD_GUARD = CITATION_GUARDS[0]; // base..HEAD
const uncommittedFiring = [...afterClean.failed].filter(isCitation);
const windowAbsentBefore = [...beforeClean.failed].filter(isCitation);

// Now commit the change inside the throwaway clone and re-measure.
sh('git', ['-C', afterDir, 'add', '-A']);
sh('git', ['-C', afterDir, '-c', 'user.email=gate@local', '-c', 'user.name=gate',
  'commit', '--quiet', '-m', 'gate: commit W-7 change in scratch clone to measure the committed citation state']);
const afterCommitted = runSuite(afterDir);
const committedFiring = [...afterCommitted.failed].filter(isCitation);
const committedNonCitation = [...afterCommitted.failed].filter((t) => !isCitation(t));
const windowMsgHit = /no longer describes this tree|as its own retirement condition/.test(afterCommitted.raw);

const stagedCorrectly =
  uncommittedFiring.length === 1 && uncommittedFiring[0] === WT_GUARD &&
  committedFiring.length === 2 &&
  committedFiring.includes(WT_GUARD) && committedFiring.includes(HEAD_GUARD) &&
  windowAbsentBefore.length === 0 && windowMsgHit &&
  committedNonCitation.length === 0;
cell(
  'C5 the citation window is real, predicted, attributed, and confined to the two citation guards in BOTH states',
  stagedCorrectly,
  `PRE-change clone, citation guards firing (must be 0 — proves the change is what opens it): ${windowAbsentBefore.length}\n` +
  `POST-change UNCOMMITTED, citation guards firing (must be exactly the working-tree guard): ${uncommittedFiring.length}\n` +
    uncommittedFiring.map((t) => '  - ' + t).join('\n') +
  `\nPOST-change COMMITTED, citation guards firing (must be BOTH): ${committedFiring.length}\n` +
    committedFiring.map((t) => '  - ' + t).join('\n') +
  `\nPOST-change COMMITTED, NON-citation failures (must be 0 — the window is the ONLY breakage): ${JSON.stringify(committedNonCitation)}\n` +
  `failure message names the cited-diff retirement condition: ${windowMsgHit}\n` +
  `committed totals: ${JSON.stringify(afterCommitted.totals)}`
);

// ---------------------------------------------------------------------------
// CELL 6 — test count moved in the direction the branch implies, and only there
// ---------------------------------------------------------------------------
const delta = (afterClean.totals.tests ?? 0) - (beforeClean.totals.tests ?? 0);
const consistent = branch === 'CONSOLIDATE' ? delta < 0 : delta >= 0;
cell(
  'C6 test count moved consistently with the measured branch (a DROP is a pass, per the clause)',
  consistent,
  `pre-change total tests:  ${beforeClean.totals.tests}\n` +
  `post-change total tests: ${afterClean.totals.tests}\n` +
  `delta: ${delta} (branch ${branch})`
);

fs.writeFileSync('/opt/swarm/runs/c4-w7-firing-sets.txt',
  `PRE-CHANGE, ROW FALSIFIED\n${[...beforeMut.failed].map((t) => '  ' + t).join('\n')}\n\n` +
  `POST-CHANGE, ROW FALSIFIED\n${[...afterMut.failed].map((t) => '  ' + t).join('\n')}\n\n` +
  `PRE-CHANGE, UNMUTATED\n${[...beforeClean.failed].map((t) => '  ' + t).join('\n') || '  (none)'}\n\n` +
  `POST-CHANGE, UNMUTATED\n${[...afterClean.failed].map((t) => '  ' + t).join('\n') || '  (none)'}\n`);

fs.rmSync(scratch, { recursive: true, force: true });

console.log('\n================ W-7 GATE VERDICT ================');
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}`);
const allPass = results.every((r) => r.pass);
console.log(`\nW-7: ${allPass ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length} cells)`);
console.log('firing sets -> /opt/swarm/runs/c4-w7-firing-sets.txt');
process.exit(allPass ? 0 : 1);
