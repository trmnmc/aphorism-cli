'use strict';

// Guards the NUMBERS inside the README's "### Node support" matrix table,
// which `test/node-support-citation.test.js` does not cover. That file
// guards the section's CITATION (does the cited base commit still describe
// this tree, via `git diff <base>..HEAD`); it says nothing about whether the
// four rows of the table it cites are internally sane. A prior cycle proved
// the gap by hand: it flipped one row's pass count (`122` -> `121`) and
// separately replaced a whole row with absurd values (`999 tests, 998 pass`)
// against a deliberately falsified table, and the full suite stayed green at
// 124/124/0 both times -- neither the citation guard nor anything else
// noticed. This file is the guard that closes that hole.
//
// What this file deliberately does NOT do, and why:
//
// - It does NOT run `node --test` (or anything that re-executes this
//   checkout's own suite) and compare the result to the table. Two reasons.
//   First, a test file that spawns `node --test test/*.test.js` from inside
//   itself would re-run the whole suite recursively, including itself,
//   forever. Second, and more fundamentally, even if it could be done
//   safely, the comparison would be dishonest: the four table rows report a
//   REMOTE CI run's counts (Actions run 32400996331, shallow checkout, 2
//   legitimate skips), not this checkout's. A local full clone runs those
//   same 2 tests instead of skipping them, so a local `node --test` run
//   reports `0 skipped` where every table row honestly reports `2 skipped`.
//   Asserting the table against a local run would either fail permanently
//   on a correct table (wrong) or require hardcoding a "local counts always
//   differ from CI counts by exactly 2" fudge factor that has no anchor
//   other than "trust the table" -- which is circular, since the table is
//   the thing being checked.
// - It does NOT hit the network to re-fetch Actions run 32400996331 and
//   compare live. This suite runs offline; the run's actual reported counts
//   are a fact about the past that this checkout cannot re-observe, only
//   cite.
//
// So the anchor used here is INTERNAL CONSISTENCY -- the only thing an
// offline checkout can honestly check about a citation of a past remote run:
//
//   1. Each row's own arithmetic must hold: tests = pass + fail + skipped.
//      This alone would have caught both recorded falsification arms (the
//      `121 pass` row no longer sums to `124`; the `999 tests, 998 pass` row
//      no longer sums to `999` either), because both arms happened to break
//      per-row arithmetic. It would NOT catch a falsification that swaps two
//      rows' worth of numbers without breaking either row's own sum, so it
//      is paired with check 2.
//   2. The four rows must agree with each other. The section's own prose
//      asserts this ("The two skips are the same on all four majors"), and
//      the table as cited is in fact four identical rows -- one CI run
//      reporting the same result on four Node majors. A row that diverges
//      from the others, even if internally self-consistent, contradicts
//      that claim and the cited run.
//   3. The run id named in the link text ("Actions run 32400996331") must
//      match the run id embedded in that same link's URL
//      (".../actions/runs/32400996331"). These are two independent renderings
//      of the same fact sitting a few characters apart; if a future edit
//      updates one and not the other, the citation becomes internally
//      contradictory about which run it even names.
//   4. The commit named in the prose ("at commit `4b63e91`") must match the
//      commit embedded in the section's own falsification-condition command
//      ("git diff 4b63e91..HEAD -- ..."). Same reasoning as (3): two
//      independent mentions of what should be one fact.
//
// None of this asserts what the TRUE counts are -- only that the table does
// not contradict itself, and that the section's other doubled-up facts
// (run id, commit) do not contradict each other. That is deliberately
// weaker than "these counts are correct," because "correct" would require
// re-running CI, which this offline suite cannot honestly claim to do. Full
// arithmetic and cross-row agreement plus matching cross-references is the
// strongest claim obtainable without lying about what was measured.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

// Extract the "### Node support" section's raw text: from its own heading up
// to (but not including) the next heading of the same level or shallower
// ("## " or "### "), or the end of the file if it is the last section.
// Deliberately duplicated from test/node-support-citation.test.js rather
// than factored into a shared helper module: these two files guard distinct
// claims (citation freshness vs. table self-consistency) and each is meant
// to be independently readable and independently attributable when it
// fails, without a reader having to jump to a shared module to see what
// "the section" means.
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

// Parse the matrix table's rows out of the section text. Each row is
// expected in the shape `| vX.Y.Z | N tests, N pass, N fail, N skipped |`.
// Returns an array of { node, tests, pass, fail, skipped, raw }, in table
// order. Deliberately does not hardcode an expected row count -- a future
// cycle adding or dropping a Node major is a legitimate table edit, not a
// falsification, and this parser should follow it rather than block it.
function parseMatrixRows(sectionText) {
  const rowPattern =
    /\|\s*(v[\d.]+)\s*\|\s*(\d+)\s*tests,\s*(\d+)\s*pass,\s*(\d+)\s*fail,\s*(\d+)\s*skipped\s*\|/g;
  const rows = [];
  let match;
  while ((match = rowPattern.exec(sectionText)) !== null) {
    rows.push({
      node: match[1],
      tests: Number(match[2]),
      pass: Number(match[3]),
      fail: Number(match[4]),
      skipped: Number(match[5]),
      raw: match[0],
    });
  }
  return rows;
}

test('README Node support matrix: table must be present and non-empty', () => {
  const readmeContent = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  const section = getNodeSupportSection(readmeContent);
  const rows = parseMatrixRows(section);

  assert(
    rows.length > 0,
    'README "### Node support" section no longer contains any parseable matrix rows in the ' +
      '`| vX.Y.Z | N tests, N pass, N fail, N skipped |` shape -- either the table was removed ' +
      'or its row format changed in a way this guard no longer recognizes. Update the guard ' +
      'deliberately if the row format changed on purpose; this failure is not itself evidence ' +
      'of a falsified table.'
  );
});

test('README Node support matrix: each row\'s own arithmetic must hold (tests = pass + fail + skipped)', () => {
  const readmeContent = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  const section = getNodeSupportSection(readmeContent);
  const rows = parseMatrixRows(section);
  assert(rows.length > 0, 'no matrix rows parsed -- see the "table must be present" test');

  for (const row of rows) {
    const sum = row.pass + row.fail + row.skipped;
    assert.equal(
      row.tests,
      sum,
      'README Node support matrix row `' + row.raw + '` (Node ' + row.node + ') claims ' +
        row.tests + ' tests but pass (' + row.pass + ') + fail (' + row.fail + ') + skipped (' +
        row.skipped + ') = ' + sum + ' -- that row contradicts its own arithmetic. Fix the ' +
        'table to a measured value; do not just make the sum balance.'
    );
  }
});

test('README Node support matrix: all rows must agree with each other', () => {
  const readmeContent = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  const section = getNodeSupportSection(readmeContent);
  const rows = parseMatrixRows(section);
  assert(rows.length > 0, 'no matrix rows parsed -- see the "table must be present" test');

  const [first, ...rest] = rows;
  for (const row of rest) {
    const matches =
      row.tests === first.tests &&
      row.pass === first.pass &&
      row.fail === first.fail &&
      row.skipped === first.skipped;
    assert(
      matches,
      'README Node support matrix row for Node ' + row.node + ' (`' + row.raw + '`) does not ' +
        'agree with the Node ' + first.node + ' row (`' + first.raw + '`) -- the section\'s own ' +
        'prose asserts the cited run reported the same result on every major ("The two skips ' +
        'are the same on all four majors"), so the table is expected to be N identical rows, ' +
        'one per major. A row that diverges from the others contradicts that claim, even if ' +
        'the diverging row is internally self-consistent on its own.'
    );
  }
});

test('README Node support matrix: cited Actions run id must match between the link text and the link URL', () => {
  const readmeContent = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  const section = getNodeSupportSection(readmeContent);

  const linkMatch = section.match(
    /\[Actions run (\d+)\]\(https:\/\/github\.com\/[^)]+\/actions\/runs\/(\d+)\)/
  );
  assert(
    linkMatch,
    'README "### Node support" section no longer contains a `[Actions run <id>](.../actions/' +
      'runs/<id>)` citation link in the recognized shape -- update the guard deliberately if ' +
      'the citation format changed on purpose.'
  );

  const [, idInText, idInUrl] = linkMatch;
  assert.equal(
    idInText,
    idInUrl,
    'README Node support citation names run `' + idInText + '` in the link text but the link ' +
      'URL points at run `' + idInUrl + '` -- these two mentions of "which CI run is this" have ' +
      'diverged from each other.'
  );
});

test('README Node support matrix: cited commit must match between the prose and the falsification-condition command', () => {
  const readmeContent = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  const section = getNodeSupportSection(readmeContent);

  const proseMatch = section.match(/at commit `([0-9a-fA-F]+)`/);
  assert(
    proseMatch,
    'README "### Node support" section no longer names its cited commit as `at commit ' +
      '\\`<sha>\\`` -- update the guard deliberately if the phrasing changed on purpose.'
  );

  const commandMatch = section.match(/`git diff ([0-9a-fA-F]+)\.\.\S+ -- [^`]+`/);
  assert(
    commandMatch,
    'README "### Node support" section no longer names a backtick-quoted `git diff ' +
      '<base>..<target> -- <paths>` falsification-condition command -- update the guard ' +
      'deliberately if the phrasing changed on purpose (test/node-support-citation.test.js ' +
      'also depends on this command existing).'
  );

  const [, commitInProse] = proseMatch;
  const [, commitInCommand] = commandMatch;
  assert.equal(
    commitInProse,
    commitInCommand,
    'README Node support citation names commit `' + commitInProse + '` in the prose ("at ' +
      'commit") but names commit `' + commitInCommand + '` as the base of its own ' +
      'falsification-condition `git diff` command -- these two mentions of "which commit is ' +
      'this" have diverged from each other.'
  );
});
