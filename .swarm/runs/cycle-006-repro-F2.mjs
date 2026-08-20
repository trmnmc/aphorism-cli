// cycle-006 conductor reproduction of review-fix FINDING 2.
//
// CLAIM UNDER TEST (stage-2 verifier, fable): parseCitedDiffCommand() at
// test/node-support-citation.test.js:61 uses sectionText.match(), so the FIRST
// `git diff <hex>..<ref> -- <paths>` token sequence in the "### Node support"
// section wins. Any such sequence appearing BEFORE the real citation shadows
// it, which yields (a) a false PASS over a genuinely stale citation and
// (b) a false SKIP on a full clone.
//
// This script is the CONDUCTOR's own instrument. It does not read the
// verifier's arms; it rebuilds them from scratch. Every arm runs the guard
// ALONE (single test file, TAP reporter) so the verdict is attributable to
// that one test by name and cannot be supplied or masked by a neighbour.
//
// Controls in BOTH directions, because a red arm proves nothing if the
// instrument dies on everything:
//   C1  the identical decoy placed AFTER the citation must leave the stale
//       citation RED  -> isolates "first match wins" as the mechanism rather
//       than "any decoy anywhere breaks it"
//   C2  a benign reword before the citation (no git-diff token) must stay
//       GREEN -> the arms are not an instrument that reddens on any edit
//
// Usage: node cycle-006-repro-F2.mjs
// Exit 0 = every arm landed as predicted; exit 1 = at least one did not.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/opt/targets/aphorism-cli';
const SCRATCH = path.join(REPO, '.scratch-c006');
const CLONE = path.join(SCRATCH, 'full');
const GUARD = 'test/node-support-citation.test.js';
const HEADING = '### Node support';

// ---------------------------------------------------------------- scaffolding

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 5e7 });
}

function freshClone() {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
  // Full clone (no --depth): every base sha used below must be reachable, so
  // that a SKIP can only come from the parser, never from the environment.
  sh('git', ['clone', '--quiet', REPO, CLONE], SCRATCH);
}

function readme() {
  return fs.readFileSync(path.join(CLONE, 'README.md'), 'utf8');
}

function writeReadme(text) {
  fs.writeFileSync(path.join(CLONE, 'README.md'), text);
}

// Run the guard ALONE and classify its single TAP verdict.
function runGuard() {
  const r = spawnSync('node', ['--test', '--test-reporter=tap', GUARD], {
    cwd: CLONE,
    encoding: 'utf8',
    maxBuffer: 5e7,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const line = out.split('\n').find((l) => /^(ok|not ok) 1 /.test(l)) || '(no TAP verdict line)';
  let verdict;
  if (/^not ok 1 /.test(line)) verdict = 'FAIL';
  else if (/# SKIP/i.test(line)) verdict = 'SKIP';
  else if (/^ok 1 /.test(line)) verdict = 'PASS';
  else verdict = 'UNKNOWN';
  // The skip REASON matters: a skip citing the wrong base is the false-skip.
  const skipReason = (line.match(/# SKIP\s*(.*)$/i) || [, ''])[1].trim();
  return { verdict, line: line.trim(), skipReason, exit: r.status };
}

// Replace the base sha in the live citation, making it point at a commit whose
// diff against HEAD is genuinely NON-empty -> the citation is really stale.
function makeCitationStale(text, staleBase) {
  const out = text.replace(
    /`git diff ([0-9a-fA-F]+)\.\.HEAD -- src bin test \.github`/,
    '`git diff ' + staleBase + '..HEAD -- src bin test .github`'
  );
  if (out === text) throw new Error('citation not found — repro cannot proceed');
  return out;
}

// Insert a decoy sentence immediately after the section heading, i.e. BEFORE
// the real citation paragraph.
function insertBeforeCitation(text, sentence) {
  const i = text.indexOf(HEADING);
  if (i === -1) throw new Error('heading not found');
  const cut = i + HEADING.length;
  return text.slice(0, cut) + '\n\n' + sentence + text.slice(cut);
}

// Insert the same decoy AFTER the citation paragraph (control C1).
function insertAfterCitation(text, sentence) {
  const m = text.match(/`git diff [0-9a-fA-F]+\.\.HEAD -- src bin test \.github`/);
  if (!m) throw new Error('citation not found');
  const cut = text.indexOf('\n', m.index + m[0].length);
  return text.slice(0, cut) + '\n\n' + sentence + text.slice(cut);
}

// ---------------------------------------------------------------------- arms

const results = [];
function arm(id, predicted, describe, mutate, note) {
  freshClone();
  if (mutate) writeReadme(mutate(readme()));
  const r = runGuard();
  const ok = r.verdict === predicted;
  results.push({ id, predicted, actual: r.verdict, ok, describe, note, line: r.line, skipReason: r.skipReason });
  return r;
}

const HEAD = sh('git', ['rev-parse', '--short', 'HEAD'], REPO).trim();
const STALE_BASE = '81b0958';   // run #5 kickoff — 159 insertions under the cited pathspec
const EMPTY_BASE = HEAD;        // trivially empty diff against HEAD
const UNREACHABLE = 'decade5';  // not a commit in any clone

// Sanity: the two bases must behave as the arms assume, or the arms prove nothing.
const staleDiff = sh('git', ['diff', '--stat', STALE_BASE + '..HEAD', '--', 'src', 'bin', 'test', '.github'], REPO).trim();
const emptyDiff = sh('git', ['diff', '--stat', EMPTY_BASE + '..HEAD', '--', 'src', 'bin', 'test', '.github'], REPO).trim();

console.log('PREMISE CHECKS (the arms are meaningless if these do not hold)');
console.log('  HEAD                                  = ' + HEAD);
console.log('  git diff ' + STALE_BASE + '..HEAD -- <cited paths> = ' +
  (staleDiff === '' ? 'EMPTY  <-- WRONG, stale arm is void' : 'NON-EMPTY (' + staleDiff.split('\n').pop().trim() + ')'));
console.log('  git diff ' + EMPTY_BASE + '..HEAD -- <cited paths> = ' +
  (emptyDiff === '' ? 'EMPTY (decoy will read as satisfied)' : 'NON-EMPTY <-- WRONG, decoy arm is void'));
console.log('');

const DECOY_EMPTY =
  '(Note: no tooling here ever runs `git diff ' + EMPTY_BASE + '..HEAD -- src bin test .github` — ' +
  'that command is quoted only as an example of what this section does NOT rely on.)\n';
const DECOY_UNREACHABLE =
  '(Historical note: an earlier revision of this section cited ' +
  '`git diff ' + UNREACHABLE + '..HEAD -- src bin` as its retirement condition.)\n';
const BENIGN =
  'This section is checked by a standing guard rather than by anyone remembering to look.\n';

arm('A0', 'PASS', 'BASELINE: pristine clone, untouched citation',
  null,
  'establishes the guard really runs and really passes here — a SKIP would void every arm below');

arm('A1', 'FAIL', 'STALE citation, no decoy: base -> ' + STALE_BASE,
  (t) => makeCitationStale(t, STALE_BASE),
  'the guard works: a genuinely stale citation is caught');

arm('A2', 'PASS', 'REFUTATION (false-pass): stale citation + empty-diff decoy BEFORE it',
  (t) => insertBeforeCitation(makeCitationStale(t, STALE_BASE), DECOY_EMPTY),
  'same stale citation as A1, now GREEN — the decoy is parsed instead of the citation');

arm('C1', 'FAIL', 'CONTROL: stale citation + the IDENTICAL decoy placed AFTER it',
  (t) => insertAfterCitation(makeCitationStale(t, STALE_BASE), DECOY_EMPTY),
  'stays red -> mechanism is FIRST-MATCH position, not the mere presence of a decoy');

arm('A3', 'SKIP', 'REFUTATION (false-skip): correct citation + unreachable-base decoy BEFORE it',
  (t) => insertBeforeCitation(t, DECOY_UNREACHABLE),
  'full clone, citation TRUE, guard stands down anyway and blames a shallow clone');

arm('C2', 'PASS', 'CONTROL: correct citation + benign sentence (no git-diff token) BEFORE it',
  (t) => insertBeforeCitation(t, BENIGN),
  'stays green -> the arms are not an instrument that reddens on any edit to the section');

// -------------------------------------------------------------------- report

console.log('ARMS — guard run ALONE (node --test --test-reporter=tap ' + GUARD + ')');
console.log('');
for (const r of results) {
  console.log('  ' + (r.ok ? 'AS PREDICTED' : 'NOT AS PREDICTED') +
    '  ' + r.id + '  predicted ' + r.predicted + ' / actual ' + r.actual);
  console.log('        ' + r.describe);
  console.log('        TAP: ' + r.line);
  if (r.skipReason) console.log('        SKIP REASON: ' + r.skipReason);
  console.log('        why it matters: ' + r.note);
  console.log('');
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
const dirty = sh('git', ['status', '--porcelain'], REPO).trim();
console.log('scratch removed; `git status --porcelain` in target =',
  dirty === '' ? '(clean)' : '\n' + dirty);

const bad = results.filter((r) => !r.ok);
console.log('');
console.log(bad.length === 0
  ? 'ALL ' + results.length + ' ARMS LANDED AS PREDICTED — FINDING 2 REPRODUCED, with both controls holding.'
  : bad.length + ' ARM(S) DID NOT LAND AS PREDICTED: ' + bad.map((b) => b.id).join(', '));
process.exit(bad.length === 0 ? 0 : 1);
