'use strict';

// Guards the self-falsifying claim in the README's "### Node support"
// section: that section cites a specific CI matrix as current and names its
// OWN retirement condition as an executable `git diff <base>..HEAD --
// <paths>` command -- the citation is supposed to remain the reference
// matrix only until that diff stops being empty. Nothing else in this repo
// ever runs that command, which is exactly how the citation went stale
// undetected two cycles ago (a human caught it by reading, not by any
// check). This test turns the README's own falsification command into a
// standing instrument instead of a claim nobody re-checks.
//
// Both the base commit and the pathspec are PARSED out of the README prose
// at run time -- neither is hardcoded here. If the section is later updated
// to cite a newer commit or a different set of paths, this test follows it
// automatically without needing an edit.
//
// This must DEGRADE, never FAIL, when an environmental precondition is
// legitimately absent rather than broken: no git binary, not a git work
// tree, or (the common case in CI, since actions/checkout@v4 defaults to a
// shallow, depth-1 checkout) the cited base commit not being reachable in
// this copy of the history. A missing base commit is not evidence the
// citation is stale -- it is evidence this checkout cannot judge the claim
// either way, so the test SKIPs (via the node:test skip mechanism, so it
// shows up as a SKIP in the suite summary, not a silent pass) rather than
// failing or passing for the wrong reason. A genuinely stale citation --
// base commit present, diff non-empty -- is not such a case and must fail.
//
// An unreachable base commit is ONLY treated as that environment limitation
// when the checkout is actually shallow, per `git rev-parse
// --is-shallow-repository`. On a full clone, a cited base that does not
// resolve is not a history gap -- it is a bogus citation -- so that case
// FAILS instead of skipping. (Shallow-ness itself being undeterminable, e.g.
// because the git binary is too old for that flag, is its own environment
// limitation and still routes to SKIP.)
//
// The section's prose is also required to name its retirement condition
// exactly once. If more than one backtick-quoted `git diff <base>..<target>
// -- <paths>` command shows up in the section (the prose grows over time and
// tends to accumulate references to earlier citations), picking whichever
// comes first would silently parse the wrong one depending on where in the
// text it happens to land. That ambiguity FAILS loudly, naming the count
// found, rather than resolving by position.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');

// Extract the "### Node support" section's raw text: from its own heading up
// to (but not including) the next heading of the same level or shallower
// ("## " or "### "), or the end of the file if it is the last section.
function getNodeSupportSection(readmeContent) {
  const headingMarker = '### Node support';
  const start = readmeContent.indexOf(headingMarker);
  assert(start !== -1, 'README must have a "### Node support" section');

  const rest = readmeContent.slice(start + headingMarker.length);
  const nextHeadingMatch = rest.match(/\n(##|###) /);
  const end = nextHeadingMatch
    ? start + headingMarker.length + nextHeadingMatch.index
    : readmeContent.length;

  return readmeContent.slice(start, end);
}

// Parse the backtick-quoted `git diff <base>..<target> -- <paths>` command
// out of the section's prose. Deliberately generic about the target (it is
// whatever ref the doc names, typically HEAD) and the pathspec (whatever
// space-separated tokens follow `--`), so a future edit to either does not
// require touching this file.
function parseCitedDiffCommand(sectionText) {
  const commandPattern = /`git diff ([0-9a-fA-F]+)\.\.(\S+) -- ([^`]+)`/g;
  const matches = [...sectionText.matchAll(commandPattern)];
  assert(
    matches.length > 0,
    'Node support section must name its retirement condition as a backtick-quoted ' +
      '`git diff <base>..<target> -- <paths>` command'
  );
  assert.equal(
    matches.length,
    1,
    'Node support section names ' + matches.length + ' backtick-quoted `git diff ' +
      '<base>..<target> -- <paths>` commands, not one -- the retirement-condition citation is ' +
      'ambiguous, and this guard refuses to silently parse whichever one comes first in the ' +
      'prose. Trim the section so exactly one such command appears (or remove the leftover ' +
      'reference to an earlier citation).'
  );

  const match = matches[0];
  const base = match[1];
  const target = match[2];
  const pathspec = match[3].trim().split(/\s+/);

  return { base, target, pathspec };
}

test('README Node support citation: cited git diff must be empty (or the check must skip on a missing precondition)', (t) => {
  const readmePath = path.join(REPO_ROOT, 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const section = getNodeSupportSection(readmeContent);
  const { base, target, pathspec } = parseCitedDiffCommand(section);

  // Precondition: git binary present.
  const gitVersion = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (gitVersion.error || gitVersion.status !== 0) {
    t.skip('git binary is not available in this environment');
    return;
  }

  // Precondition: this checkout is actually a git work tree.
  const isWorkTree = spawnSync(
    'git',
    ['rev-parse', '--is-inside-work-tree'],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  if (isWorkTree.error || isWorkTree.status !== 0 || isWorkTree.stdout.trim() !== 'true') {
    t.skip('this checkout is not a git work tree');
    return;
  }

  // Precondition: the cited base commit must be reachable in this history.
  // GitHub Actions checks out with actions/checkout@v4, which defaults to a
  // shallow (depth-1) clone, so the base commit named by an older citation
  // is frequently absent from CI's copy of history. That is an environment
  // limitation, not a stale citation -- but ONLY when the checkout actually
  // is shallow. On a full clone, a base commit that fails to resolve is not
  // a history gap; it is a bogus citation, and must fail rather than skip.
  const baseReachable = spawnSync(
    'git',
    ['cat-file', '-e', base + '^{commit}'],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  if (baseReachable.error || baseReachable.status !== 0) {
    const isShallow = spawnSync(
      'git',
      ['rev-parse', '--is-shallow-repository'],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    if (isShallow.error || isShallow.status !== 0) {
      t.skip(
        'cited base commit ' + base + ' is not reachable in this checkout, and whether this ' +
          'checkout is shallow could not be determined (`git rev-parse ' +
          '--is-shallow-repository` failed) -- cannot evaluate the README\'s Node support citation'
      );
      return;
    }
    if (isShallow.stdout.trim() === 'true') {
      t.skip(
        'cited base commit ' + base + ' is not reachable in this checkout ' +
          '(this is a shallow clone) -- cannot evaluate the README\'s Node support citation'
      );
      return;
    }
    assert.fail(
      'cited base commit ' + base + ' is not reachable in this checkout, and this checkout is ' +
        'a full clone (`git rev-parse --is-shallow-repository` reports false) -- on a full ' +
        'clone an unresolvable cited base is not a history gap, it is a bogus citation, so this ' +
        'must fail rather than skip.'
    );
  }

  // Run the cited command itself. A non-zero exit here (e.g. an unresolvable
  // target ref) is a *different* signal than a non-empty diff -- it means
  // the command could not be evaluated, not that it evaluated to "stale" --
  // so it also routes to skip rather than pass or fail for the wrong reason.
  const diffResult = spawnSync(
    'git',
    ['diff', base + '..' + target, '--', ...pathspec],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  if (diffResult.error || diffResult.status !== 0) {
    t.skip(
      'cited command `git diff ' + base + '..' + target + ' -- ' + pathspec.join(' ') +
        '` could not be evaluated in this checkout (exit ' + diffResult.status +
        (diffResult.stderr ? ': ' + diffResult.stderr.trim() : '') + ')'
    );
    return;
  }

  assert.equal(
    diffResult.stdout.trim(),
    '',
    'README\'s "### Node support" section cites `git diff ' + base + '..' + target + ' -- ' +
      pathspec.join(' ') + '` as its own retirement condition, and that diff is no longer ' +
      'empty -- the cited CI matrix no longer describes this tree. The section needs a new ' +
      'citation (see the repo\'s own note on how the previous stale citation was recorded).'
  );
});
