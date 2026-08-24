#!/usr/bin/env node
// tools/matrix-adjudication.mjs
//
// Adjudicates the README "### Node support" matrix's 127-vs-129 numbers by
// MEASUREMENT, offline, from this checkout alone. It answers the question:
// "the table says `129 tests, 127 pass, 0 fail, 2 skipped`; a local run says
// `129 tests, 129 pass, 0 fail, 0 skipped` -- is the table stale, or are both
// numbers true of different environments?"
//
// It re-derives, at run time and without hardcoding any count it can compute:
//
//   (a) the four matrix rows exactly as README.md states them (parsed from the
//       section's own table, the same structural shape the suite's guards
//       parse);
//   (b) how many tests the suite actually contains at HEAD (by running
//       `node --test test/*.test.js` and reading the summary) and how many of
//       those are the citation guard's environment-conditional cases (by
//       running the guard file the section itself names, alone, and confirming
//       statically that every one of its cases routes through a skip);
//   (c) whether the cited base commit's content under the cited pathspec
//       (src bin test .github) is identical to this tree's -- i.e. whether the
//       citation's own retirement condition (`git diff <base>..HEAD -- <paths>`
//       empty) still holds, and whether any commit since the base touched
//       those paths at all (the rule "the matrix run for the push that carried
//       the last change to src/, bin/, test/, or the workflow itself" still
//       selects the cited run only if none did);
//   (d) a verdict -- CORRECT-AS-CITED / STALE / UNDECIDABLE-OFFLINE -- with the
//       explicit arithmetic that separates a stale current-state claim from a
//       correctly-cited past-CI claim.
//
// It additionally looks for OFFLINE corroboration that the cited Actions run
// really reported the table's numbers: archived conductor evidence under
// .swarm/runs/ that names the cited run id and carries per-major count lines
// and the run's headSha. If no such archive exists, that single signal (what
// the remote run actually reported) is named as not re-observable offline --
// it does NOT by itself flip the verdict, because the citation's own stated
// retirement condition and the reconciliation arithmetic are fully decidable
// from this checkout.
//
// This tool only reads the repository. It never edits README.md or anything
// else. It is not a test and is not collected by the suite's glob
// (`node --test test/*.test.js`).
//
// Exit codes:
//   0  verdict CORRECT-AS-CITED
//   1  verdict STALE
//   2  verdict UNDECIDABLE-OFFLINE
//   3  structural/parse failure (README section or table not in the expected
//      shape, suite output unparseable) -- the adjudication could not run

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Structural parsing of the README section. Same markers the suite's own
// guards (test/node-support-citation.test.js, test/readme-matrix-consistency
// .test.js) read: the "### Node support" heading, the `| vX.Y.Z | N tests, N
// pass, N fail, N skipped |` rows, the single backtick-quoted `git diff
// <base>..<target> -- <paths>` retirement command, the `[Actions run <id>]
// (.../actions/runs/<id>)` link, and the `at commit \`<sha>\`` prose.
// ---------------------------------------------------------------------------

function fail(msg) {
  console.error('matrix-adjudication: PARSE FAILURE: ' + msg);
  process.exit(3);
}

function getNodeSupportSection(readmeContent) {
  const headingMarker = '### Node support';
  const start = readmeContent.indexOf(headingMarker);
  if (start === -1) fail('README has no "### Node support" section');
  const rest = readmeContent.slice(start + headingMarker.length);
  const nextHeading = rest.match(/\n(##|###) /);
  const end = nextHeading
    ? start + headingMarker.length + nextHeading.index
    : readmeContent.length;
  return readmeContent.slice(start, end);
}

function parseMatrixRows(sectionText) {
  const rowPattern =
    /\|\s*(v[\d.]+)\s*\|\s*(\d+)\s*tests,\s*(\d+)\s*pass,\s*(\d+)\s*fail,\s*(\d+)\s*skipped\s*\|/g;
  const rows = [];
  let m;
  while ((m = rowPattern.exec(sectionText)) !== null) {
    rows.push({
      node: m[1],
      tests: Number(m[2]),
      pass: Number(m[3]),
      fail: Number(m[4]),
      skipped: Number(m[5]),
      raw: m[0].trim(),
    });
  }
  if (rows.length === 0) fail('no matrix rows in the `| vX.Y.Z | N tests, N pass, N fail, N skipped |` shape');
  return rows;
}

function parseCitedDiffCommand(sectionText) {
  const pattern = /`git diff ([0-9a-fA-F]+)\.\.(\S+) -- ([^`]+)`/g;
  const matches = [...sectionText.matchAll(pattern)];
  if (matches.length !== 1) {
    fail('expected exactly one backtick-quoted `git diff <base>..<target> -- <paths>` retirement command in the section, found ' + matches.length);
  }
  const [, base, target, rawPaths] = matches[0];
  return { base, target, pathspec: rawPaths.trim().split(/\s+/) };
}

function parseRunId(sectionText) {
  const m = sectionText.match(
    /\[Actions run (\d+)\]\(https:\/\/github\.com\/[^)]+\/actions\/runs\/(\d+)\)/
  );
  if (!m) fail('no `[Actions run <id>](.../actions/runs/<id>)` citation link in the section');
  return { idInText: m[1], idInUrl: m[2] };
}

function parseCitedCommitProse(sectionText) {
  const m = sectionText.match(/at commit `([0-9a-fA-F]+)`/);
  if (!m) fail('section no longer names its cited commit as `at commit \\`<sha>\\``');
  return m[1];
}

function parseGuardFilename(sectionText) {
  // The section names the file that holds its environment-conditional guard
  // cases ("Both are in `test/node-support-citation.test.js` ..."). Collect
  // every backticked test-file path in the section; they must all name one
  // file, which is the guard.
  const mentions = [...sectionText.matchAll(/`(test\/[^`\s]+\.test\.js)`/g)].map((m) => m[1]);
  const unique = [...new Set(mentions)];
  if (unique.length !== 1) {
    fail('expected the section to name exactly one guard test file in backticks, found: [' + unique.join(', ') + ']');
  }
  return unique[0];
}

// ---------------------------------------------------------------------------
// Measurement helpers.
// ---------------------------------------------------------------------------

function git(args) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// Run `node --test <files>` and parse the summary. Node 18/20/22 print the
// TAP summary (`# tests <n>`); Node 24+ prints the spec-reporter summary
// (`ℹ tests <n>`, U+2139). Accept either marker -- the README's own prose
// documents this exact split.
function runNodeTest(files) {
  const res = spawnSync(process.execPath, ['--test', ...files], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = (res.stdout || '') + '\n' + (res.stderr || '');
  const counts = {};
  for (const m of out.matchAll(/[#ℹ]\s*(tests|pass|fail|skipped|cancelled|todo)\s+(\d+)/g)) {
    counts[m[1]] = Number(m[2]);
  }
  for (const key of ['tests', 'pass', 'fail', 'skipped']) {
    if (!(key in counts)) {
      fail('could not parse `' + key + '` from the summary of `node --test ' + files.join(' ') + '` (neither TAP `# ' + key + '` nor spec `ℹ ' + key + '` found)');
    }
  }
  return counts;
}

function listSuiteFiles() {
  // Replicate the documented invocation `node --test test/*.test.js` -- the
  // shell glob, expanded the same way, in sorted order.
  return fs
    .readdirSync(path.join(REPO_ROOT, 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .sort()
    .map((f) => path.join('test', f));
}

// ---------------------------------------------------------------------------
// Offline corroboration: archived CI evidence under .swarm/runs/ naming the
// cited run id, with per-major count lines and the run's headSha.
// ---------------------------------------------------------------------------

function findArchivedRunEvidence(runId) {
  const runsDir = path.join(REPO_ROOT, '.swarm', 'runs');
  if (!fs.existsSync(runsDir)) return null;
  const results = [];
  for (const name of fs.readdirSync(runsDir)) {
    if (!/\.(txt|log|md)$/.test(name)) continue;
    const filePath = path.join(runsDir, name);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    if (!content.includes(runId)) continue;
    const perMajor = [...content.matchAll(
      /Node\s+(\d+)\s+\(job\s+\d+\):\s+[#ℹ]\s*tests\s+(\d+)\s+[#ℹ]\s*pass\s+(\d+)\s+[#ℹ]\s*fail\s+(\d+)\s+[#ℹ]\s*skipped\s+(\d+)/g
    )].map((m) => ({
      major: Number(m[1]),
      tests: Number(m[2]),
      pass: Number(m[3]),
      fail: Number(m[4]),
      skipped: Number(m[5]),
    }));
    const headShaMatch = content.match(/headSha:\s*([0-9a-fA-F]{7,40})/);
    if (perMajor.length > 0 || headShaMatch) {
      results.push({
        file: path.relative(REPO_ROOT, filePath),
        perMajor,
        headSha: headShaMatch ? headShaMatch[1] : null,
      });
    }
  }
  return results.length > 0 ? results : null;
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

const staleReasons = [];
const undecidableReasons = [];
const notes = [];

const readmePath = path.join(REPO_ROOT, 'README.md');
const readme = fs.readFileSync(readmePath, 'utf8');
const section = getNodeSupportSection(readme);

// ---- (a) the matrix rows as README states them ----------------------------

const rows = parseMatrixRows(section);
const { base, target, pathspec } = parseCitedDiffCommand(section);
const { idInText, idInUrl } = parseRunId(section);
const commitInProse = parseCitedCommitProse(section);
const guardFile = parseGuardFilename(section);

console.log('== (a) README matrix rows, as parsed from the "### Node support" section of README.md ==');
for (const r of rows) console.log('   ' + r.raw);
console.log('   cited run id:        ' + idInText + (idInText === idInUrl ? ' (link text and URL agree)' : ' (URL says ' + idInUrl + ' -- MISMATCH)'));
console.log('   cited base commit:   ' + base + ' (prose says `at commit ' + commitInProse + '`' + (base === commitInProse ? ' -- agrees' : ' -- MISMATCH') + ')');
console.log('   retirement command:  git diff ' + base + '..' + target + ' -- ' + pathspec.join(' '));
console.log('   guard file named:    ' + guardFile);
console.log('');

if (idInText !== idInUrl) staleReasons.push('run id in link text (' + idInText + ') and link URL (' + idInUrl + ') disagree -- the citation contradicts itself');
if (base !== commitInProse) staleReasons.push('cited commit in prose (' + commitInProse + ') and in the retirement command (' + base + ') disagree');

// Per-row arithmetic and cross-row agreement (identities I1, I2).
for (const r of rows) {
  const sum = r.pass + r.fail + r.skipped;
  if (r.tests !== sum) {
    staleReasons.push('row `' + r.raw + '`: tests (' + r.tests + ') != pass+fail+skipped (' + sum + ') -- the row contradicts its own arithmetic');
  }
}
const [first, ...rest] = rows;
for (const r of rest) {
  if (r.tests !== first.tests || r.pass !== first.pass || r.fail !== first.fail || r.skipped !== first.skipped) {
    staleReasons.push('row for ' + r.node + ' disagrees with row for ' + first.node + ' -- the section claims one identical result on every major');
  }
}

// ---- (b) what the suite actually contains at HEAD, and the guard's cases --

const suiteFiles = listSuiteFiles();
const local = runNodeTest(suiteFiles);
const guard = runNodeTest([guardFile]);

const guardSource = fs.readFileSync(path.join(REPO_ROOT, guardFile), 'utf8');
const guardRegistrations = (guardSource.match(/^test\(/gm) || []).length;
const guardHasSkipRouting = /\bt\.skip\(/.test(guardSource);

console.log('== (b) measured suite at HEAD (this checkout, ' + process.version + ', full run of node --test test/*.test.js -- ' + suiteFiles.length + ' files) ==');
console.log('   whole suite:   ' + local.tests + ' tests, ' + local.pass + ' pass, ' + local.fail + ' fail, ' + local.skipped + ' skipped');
console.log('   ' + guardFile + ' alone: ' + guard.tests + ' tests, ' + guard.pass + ' pass, ' + guard.fail + ' fail, ' + guard.skipped + ' skipped');
console.log('   guard file top-level test() registrations: ' + guardRegistrations + '; contains t.skip() routing: ' + guardHasSkipRouting);
console.log('');

if (guard.tests !== guardRegistrations) {
  fail('guard file registers ' + guardRegistrations + ' top-level test() calls but running it reports ' + guard.tests + ' tests -- cannot identify the environment-conditional cases');
}
if (!guardHasSkipRouting) {
  staleReasons.push('the guard file named by the section (' + guardFile + ') contains no t.skip() routing, so the section\'s claim that its skips "stand down because CI checks out shallow" has no mechanism behind it');
}
const G = guard.tests; // the environment-conditional cases

// ---- (c) content identity of the cited base vs this tree ------------------

console.log('== (c) content identity: cited base vs this tree, on the cited pathspec ==');

let diffHeadEmpty = null;
let diffWorktreeEmpty = null;
let commitsTouchingPaths = null;

const gitVersion = spawnSync('git', ['--version'], { encoding: 'utf8' });
if (gitVersion.error || gitVersion.status !== 0) {
  undecidableReasons.push('no usable git binary -- cannot evaluate `git diff ' + base + '..' + target + ' -- ' + pathspec.join(' ') + '`');
} else {
  const isWorkTree = git(['rev-parse', '--is-inside-work-tree']);
  if (isWorkTree.status !== 0 || isWorkTree.stdout.trim() !== 'true') {
    undecidableReasons.push('this checkout is not a git work tree -- cannot evaluate the citation\'s retirement condition');
  } else {
    const baseReachable = git(['cat-file', '-e', base + '^{commit}']);
    if (baseReachable.status !== 0) {
      const isShallow = git(['rev-parse', '--is-shallow-repository']);
      if (isShallow.status !== 0) {
        undecidableReasons.push('cited base ' + base + ' does not resolve here and shallow-ness of this checkout could not be determined -- cannot evaluate the retirement condition');
      } else if (isShallow.stdout.trim() === 'true') {
        undecidableReasons.push('cited base ' + base + ' is not in this SHALLOW checkout\'s history -- the retirement diff needs a full clone (or a network fetch, unavailable offline) to evaluate');
      } else {
        staleReasons.push('cited base ' + base + ' does not resolve in a FULL clone -- the citation names a commit this repository does not contain (bogus citation)');
      }
    } else {
      const diffHead = git(['diff', base + '..' + target, '--', ...pathspec]);
      const diffWork = git(['diff', base, '--', ...pathspec]);
      const logTouch = git(['log', '--oneline', base + '..HEAD', '--', ...pathspec]);
      if (diffHead.status !== 0) {
        undecidableReasons.push('`git diff ' + base + '..' + target + ' -- ...` failed (exit ' + diffHead.status + '): ' + diffHead.stderr.trim());
      } else {
        diffHeadEmpty = diffHead.stdout.trim() === '';
        console.log('   git diff ' + base + '..' + target + ' -- ' + pathspec.join(' ') + '  ->  ' + (diffHeadEmpty ? 'EMPTY' : 'NON-EMPTY'));
        if (!diffHeadEmpty) {
          staleReasons.push('the citation\'s own retirement condition fired: `git diff ' + base + '..' + target + ' -- ' + pathspec.join(' ') + '` is non-empty -- the cited run no longer describes this tree');
        }
      }
      if (diffWork.status === 0) {
        diffWorktreeEmpty = diffWork.stdout.trim() === '';
        console.log('   git diff ' + base + ' -- ' + pathspec.join(' ') + '        ->  ' + (diffWorktreeEmpty ? 'EMPTY (working tree, incl. uncommitted, matches the cited base)' : 'NON-EMPTY'));
        if (!diffWorktreeEmpty) {
          staleReasons.push('the WORKING TREE differs from the cited base on the cited paths (uncommitted falsification): `git diff ' + base + ' -- ' + pathspec.join(' ') + '` is non-empty');
        }
      }
      if (logTouch.status === 0) {
        commitsTouchingPaths = logTouch.stdout.trim() === '' ? [] : logTouch.stdout.trim().split('\n');
        console.log('   commits in ' + base + '..HEAD touching those paths: ' + commitsTouchingPaths.length);
        if (commitsTouchingPaths.length === 0) {
          console.log('   -> no push since the cited one carried a change to src/, bin/, test/ or the workflow,');
          console.log('      so the section\'s selection rule ("the matrix run for the push that carried the');
          console.log('      last change ...") still selects the cited run.');
        } else if (diffHeadEmpty) {
          notes.push('content is identical to the cited base, but ' + commitsTouchingPaths.length + ' commit(s) since it touched the cited paths (changed-then-reverted); the stated retirement condition (the diff) has not fired, but the prose selection rule may now point at a later push: ' + commitsTouchingPaths.join('; '));
        }
      }
    }
  }
}
console.log('');

// ---- offline corroboration of what the cited run reported -----------------

console.log('== offline corroboration of the cited run\'s reported counts (.swarm/runs/) ==');
const evidence = findArchivedRunEvidence(idInText);
if (!evidence) {
  console.log('   none found.');
  notes.push('what Actions run ' + idInText + ' actually reported cannot be re-observed from this checkout: no archived evidence under .swarm/runs/ names that run id with per-major counts, and re-fetching it needs the network / gh CLI. The verdict below therefore rests on the citation\'s own retirement condition and the reconciliation arithmetic, both fully offline-decidable; the remote run\'s reported counts are taken from the archive when present, and are otherwise NOT independently confirmed offline.');
} else {
  for (const ev of evidence) {
    console.log('   ' + ev.file + (ev.headSha ? '  (records run headSha ' + ev.headSha.slice(0, 7) + ')' : ''));
    if (ev.headSha && !ev.headSha.startsWith(base) && !base.startsWith(ev.headSha)) {
      staleReasons.push('archived evidence ' + ev.file + ' records run ' + idInText + ' headSha ' + ev.headSha.slice(0, 12) + ', which is not the cited commit ' + base);
    }
    for (const pm of ev.perMajor) {
      const row = rows.find((r) => r.node.startsWith('v' + pm.major + '.'));
      const agrees = row && row.tests === pm.tests && row.pass === pm.pass && row.fail === pm.fail && row.skipped === pm.skipped;
      console.log('     Node ' + pm.major + ': ' + pm.tests + ' tests, ' + pm.pass + ' pass, ' + pm.fail + ' fail, ' + pm.skipped + ' skipped  ->  ' + (agrees ? 'agrees with the README row' : 'DISAGREES with the README row'));
      if (row && !agrees) {
        staleReasons.push('archived per-major counts for Node ' + pm.major + ' in ' + ev.file + ' disagree with the README row `' + row.raw + '`');
      }
    }
  }
}
console.log('');

// ---- (d) reconciliation arithmetic and verdict -----------------------------

console.log('== (d) reconciliation arithmetic ==');
const table = first; // all rows verified identical above (or staleReasons already says otherwise)

const identities = [
  {
    name: 'tests_table == pass_table + fail_table + skipped_table',
    lhs: table.tests,
    rhs: table.pass + table.fail + table.skipped,
  },
  {
    name: 'tests_local(HEAD) == tests_table  (empty diff on test/ means CI and this tree ran the same suite)',
    lhs: local.tests,
    rhs: table.tests,
  },
  {
    name: 'skipped_table == G  (the table\'s skips are exactly the guard\'s environment-conditional cases)',
    lhs: table.skipped,
    rhs: G,
  },
  {
    name: 'pass_local == pass_table + G  (a full clone runs the G guard cases that a shallow CI checkout skips)',
    lhs: local.pass,
    rhs: table.pass + G,
  },
  {
    name: 'skipped_local == skipped_table - G',
    lhs: local.skipped,
    rhs: table.skipped - G,
  },
  {
    name: 'fail_local == fail_table (== 0)',
    lhs: local.fail,
    rhs: table.fail,
  },
];

for (const id of identities) {
  const holds = id.lhs === id.rhs;
  console.log('   ' + (holds ? 'HOLDS ' : 'FAILS ') + id.name + '   [' + id.lhs + ' vs ' + id.rhs + ']');
  if (!holds) {
    staleReasons.push('reconciliation identity failed: ' + id.name + ' (' + id.lhs + ' != ' + id.rhs + ')');
  }
}
console.log('');
console.log('   In words: the table\'s ' + table.pass + ' is ' + table.tests + ' - ' + table.skipped +
  ' -- the cited CI run checked out at depth 1, so the ' + G + ' guard case(s) in ' + guardFile);
console.log('   skipped there; this full clone runs them, so a local run reports ' + local.pass + '/' + local.tests +
  ' with ' + local.skipped + ' skipped.');
console.log('   ' + table.pass + ' (CI, shallow) and ' + local.pass + ' (local, full clone) describe the SAME suite under two environments;');
console.log('   neither number falsifies the other unless an identity above fails or the retirement diff is non-empty.');
console.log('');

// ---- verdict ---------------------------------------------------------------

let verdict, exitCode;
if (undecidableReasons.length > 0) {
  verdict = 'UNDECIDABLE-OFFLINE';
  exitCode = 2;
} else if (staleReasons.length > 0) {
  verdict = 'STALE';
  exitCode = 1;
} else {
  verdict = 'CORRECT-AS-CITED';
  exitCode = 0;
}

console.log('== VERDICT: ' + verdict + ' ==');
if (verdict === 'CORRECT-AS-CITED') {
  console.log('   The matrix rows report the cited past CI run, the citation\'s own retirement');
  console.log('   condition has not fired (content under ' + pathspec.join(' ') + ' is identical to ' + base + '),');
  console.log('   and every reconciliation identity holds. The 127-vs-129 difference is exactly the');
  console.log('   ' + G + ' environment-conditional guard case(s): skipped on CI\'s shallow checkout, run and');
  console.log('   passing on a full clone. No README repair is warranted.');
}
for (const r of staleReasons) console.log('   STALE because: ' + r);
for (const r of undecidableReasons) console.log('   UNDECIDABLE because: ' + r);
if (verdict === 'STALE') {
  console.log('   A STALE verdict means the section needs a new citation (new run id, new base');
  console.log('   commit, re-measured rows) -- repair README.md\'s "### Node support" section.');
}
for (const n of notes) console.log('   NOTE: ' + n);

process.exit(exitCode);
