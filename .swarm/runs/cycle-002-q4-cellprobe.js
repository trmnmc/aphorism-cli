#!/usr/bin/env node
'use strict';
// Q-4 cell probe (cycle 2, improvement run #6).
//
// Re-measures the six documented cells of the Tag-vocabulary acknowledgement
// guard against a GIVEN tree, in isolation, so the "unfixed" and "fixed"
// columns of Q-4's acceptance are real command output rather than inherited
// claims. The six cells and their cycle-39 readings are recorded in the
// FAMILY BOUNDARY comment block of test/readme-tags.test.js; that measurement
// was taken against an older README, so it is re-taken here rather than
// quoted.
//
// Isolation rule (inherited from the cycle-39 harness): each cell runs ONLY
// the guard under test, selected by --test-name-pattern, so the neighbouring
// count guards can neither supply nor mask the verdict -- several of them
// fire on these mutated READMEs for their own, unrelated reasons.
//
// Usage:
//   node cycle-002-q4-cellprobe.js <tree-dir> <test-name-pattern>
//
// Prints one line per cell: <id>  <FIRES|SILENT>  <note>
// FIRES  = the guard failed on this README (an assertion tripped)
// SILENT = the guard passed on this README

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const treeDir = process.argv[2];
const pattern = process.argv[3] || 'token co-occurrence guard';
if (!treeDir) {
  console.error('usage: node cycle-002-q4-cellprobe.js <tree-dir> [test-name-pattern]');
  process.exit(2);
}

const readmePath = path.join(treeDir, 'README.md');
const pristine = fs.readFileSync(readmePath, 'utf8');

// Locate the Tag vocabulary section the same way the guard itself does.
function sectionBounds(text) {
  const start = text.indexOf('## Tag vocabulary');
  if (start === -1) throw new Error('no "## Tag vocabulary" heading in this tree');
  const next = text.indexOf('\n## ', start + 1);
  return { start, end: next > -1 ? next : text.length };
}

// The paragraph that carries the distribution facts: the first non-blank,
// non-heading, non-table paragraph inside the section. Found structurally so
// this harness does not hardcode today's wording.
function distributionParagraph(text) {
  const { start, end } = sectionBounds(text);
  const section = text.slice(start, end);
  for (const para of section.split('\n\n')) {
    const t = para.trim();
    if (!t || t.startsWith('##') || t.startsWith('####') || t.startsWith('|') || t.startsWith('*')) continue;
    if (/\btags?\b/i.test(t)) return para;
  }
  throw new Error('could not locate the distribution paragraph');
}

const para = distributionParagraph(pristine);

// ---------------------------------------------------------------------------
// The six cells. Every mutation below keeps every NUMBER in the document true
// -- these are TRUE inputs. D4a/D4b additionally strip the acknowledgement,
// which is what makes a SILENT reading there a miss rather than a correct pass.
// ---------------------------------------------------------------------------
const cells = [
  {
    id: 'C0',
    note: 'pristine README (control -- must be SILENT in both columns)',
    mutate: (t) => t,
  },
  {
    id: 'D1',
    note: 'T-034: distribution facts reworded outside the nine markers, numbers unchanged',
    mutate: (t) => t.replace(
      para,
      para.replace(/\bexactly once\b/gi, 'on a solitary entry')
          .replace(/\bexactly one entry\b/gi, 'a solitary entry')
          .replace(/\bexactly one\b/gi, 'a solitary')
    ),
  },
  {
    id: 'D3',
    note: 'T-036: section heading renamed "## Tags", every claim still true',
    mutate: (t) => t.replace('## Tag vocabulary', '## Tags'),
  },
  {
    id: 'D4a',
    note: 'T-037: acknowledgement stripped, in-section decoy pairing tag+entry+marker',
    mutate: (t) => t.replace(
      para,
      'Tags are listed in alphabetical order, one entry per line.'
    ),
  },
  {
    id: 'D4b',
    note: 'T-037: acknowledgement stripped, different in-section decoy',
    mutate: (t) => t.replace(
      para,
      'A tag name is a single-entry token with no spaces.'
    ),
  },
  {
    id: 'E3',
    note: 'T-038: the redundant restatement dropped -- each fact stated ONCE, numbers unchanged (this is the prose Q-4 exists to write)',
    // A first attempt at this cell (cycle 2, first run) split the paragraph
    // while LEAVING the "which is to say ... exactly one entry" restatement
    // intact, so one sentence still carried tag+entry+marker and the guard
    // read SILENT. That was a defect in this harness, not a reading about
    // the guard, and it is recorded here rather than quietly corrected: a
    // cell that does not actually sever the three tokens is not a test of a
    // same-sentence co-occurrence rule. The faithful mutation drops the
    // restatement clause -- which is exactly the honest, de-duplicated prose
    // this item is committed to producing -- leaving every number true and
    // every fact stated exactly once.
    mutate: (t) => t.replace(
      para,
      para.replace(/,\s*which is to say[^,]*,/i, ',')
    ),
  },
];

const results = [];
for (const cell of cells) {
  const mutated = cell.mutate(pristine);
  const changed = mutated !== pristine || cell.id === 'C0';
  fs.writeFileSync(readmePath, mutated);
  let verdict;
  let detail = '';
  try {
    execFileSync(
      process.execPath,
      ['--test', '--test-name-pattern=' + pattern, 'test/readme-tags.test.js'],
      { cwd: treeDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    verdict = 'SILENT';
  } catch (err) {
    verdict = 'FIRES';
    const out = String(err.stdout || '') + String(err.stderr || '');
    const m = out.match(/^# fail (\d+)/m);
    detail = m ? 'fail=' + m[1] : '';
  }
  if (!changed) detail = (detail ? detail + ' ' : '') + '[WARNING: mutation was a no-op]';
  results.push({ id: cell.id, verdict, note: cell.note, detail });
  fs.writeFileSync(readmePath, pristine); // restore before the next cell
}

// Belt and braces: the tree must be left byte-identical to how it was found.
const after = fs.readFileSync(readmePath, 'utf8');
if (after !== pristine) {
  console.error('FATAL: README not restored');
  process.exit(3);
}

for (const r of results) {
  console.log(r.id.padEnd(5) + r.verdict.padEnd(8) + (r.detail ? r.detail.padEnd(12) : ''.padEnd(12)) + r.note);
}
console.log('README restored byte-identical: yes');
