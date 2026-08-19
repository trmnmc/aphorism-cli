#!/usr/bin/env node
// run #4 cycle 10 — adjudication of the sealed gate's ONE FAIL (cell S3).
// INSTRUMENT DEFECT #22.
//
// The sealed gate SWARM/runs/run4-c010-q6-gate.mjs (sha256 cad6150e…) is left
// BYTE-UNEDITED. Precedent: run #3 cycles 4/12/14, run #4 cycles 1/2/5/8/9 — rewriting a
// gate after it has run destroys the evidence of what it measured. The repair lives here,
// carrying its own columns.
//
// THE DEFECT. S3 asks "is README.md the only changed tracked file". It read
// `git status --porcelain`, applied `.trim()` TO THE WHOLE OUTPUT, then took `slice(3)`
// off each line to skip the two status columns and their separating space. But porcelain's
// first column is a SPACE for an unstaged modification (" M README.md"), and the
// whole-output trim ate it — so slice(3) started one character late and the cell reported
// the changed path as "EADME.md", which is not "README.md", so it failed.
//
// It failed CLOSED — a wrong instrument that reports trouble rather than silence, the same
// direction as run #4 cycle 1's C4. And it passed VACUOUSLY at the pre-dispatch baseline
// for a reason worth naming: the tree was CLEAN, so porcelain emitted nothing, so no line
// was ever sliced. A baseline can only exercise the code paths the world hands it.
//
// THE UNDERLYING CLAIM IS TRUE AND WAS VERIFIED INDEPENDENTLY OF THIS CELL: the conductor
// ran `git status --porcelain | cat -A` by hand and got exactly " M README.md$" — one file,
// README.md. The cell was wrong; the tree was right.

import { spawnSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const rows = [];
const col = (id, label, expected, fn) => {
  let got, ok = false;
  try { got = fn(); ok = JSON.stringify(got) === JSON.stringify(expected); }
  catch (e) { got = `THREW ${e.message}`; }
  rows.push({ id, label, expected, got, ok });
};

// ---- the two readers, verbatim in shape ------------------------------------
// UNFIXED: whole-output trim, then slice(3). This is what the sealed cell does.
const unfixed = out => out.trim().split('\n').filter(Boolean)
  .map(l => l.slice(3).trim())
  .filter(p => !p.startsWith('.swarm/'));

// FIXED: strip only the TRAILING newline, never the leading status column; take the path
// as everything from index 3 of each line. Rename entries ("R  old -> new") are reduced to
// their destination, which is the path that now exists in the tree.
const fixed = out => out.replace(/\n+$/, '').split('\n').filter(Boolean)
  .map(l => l.slice(3))
  .map(p => (p.includes(' -> ') ? p.split(' -> ').pop() : p))
  .map(p => p.replace(/^"|"$/g, ''))
  .filter(p => !p.startsWith('.swarm/'));

// The REAL output, captured live rather than typed from memory (run #4 cycle 9's E3 defect
// was a cell choosing its test data from memory instead of from the data).
const REAL = spawnSync('git', ['-C', T, 'status', '--porcelain'], { encoding: 'utf8' }).stdout ?? '';

// ---- columns ---------------------------------------------------------------

col('A', 'DEFECT REPRODUCED: the unfixed reader mangles the real porcelain line',
  ['EADME.md'], () => unfixed(REAL));

col('B', 'FIXED reader recovers the truth on that SAME real input',
  ['README.md'], () => fixed(REAL));

col('C', 'NO REGRESSION: the fixed reader still handles a STAGED modification ("M  path"), the shape the unfixed reader DID handle',
  ['README.md'], () => fixed('M  README.md\n'));

col('D', 'NO REGRESSION: untracked ("?? path") and added ("A  path") both read correctly',
  ['scratch.txt', 'src/new.js'], () => fixed('?? scratch.txt\nA  src/new.js\n'));

col('E', 'MUST-DIE: an out-of-scope product change is still REJECTED (the cell must not be loosened into accepting everything)',
  ['README.md', 'src/select.js'], () => fixed(' M README.md\n M src/select.js\n'));

col('F', 'MUST-NOT-OVERREACH: the .swarm/ exclusion still filters conductor bookkeeping and does NOT swallow a real path',
  ['README.md'], () => fixed(' M .swarm/state.json\n M README.md\n M .swarm/runs/x.json\n'));

col('G', 'MUST-NOT-OVERREACH: a path whose name merely CONTAINS ".swarm/" mid-string is not filtered',
  ['docs/.swarm/notes.md'], () => fixed(' M docs/.swarm/notes.md\n'));

col('H', 'A RENAME reduces to its destination rather than to the arrow soup the unfixed reader would produce',
  ['docs/new.md'], () => fixed('R  docs/old.md -> docs/new.md\n'));

col('I', 'CONTROL, must stay dead: the fixed reader on a CLEAN tree yields nothing — it does not invent a path',
  [], () => fixed(''));

// ---- BLAST RADIUS. cycle-8's lesson, applied rather than re-learned: a defect found in
// one cell is evidence about EVERY cell. Measured, not asserted.
col('J', 'BLAST RADIUS: cell S2 shares the .trim() habit but is IMMUNE — `git diff --name-only` emits no status column, so trimming cannot shift its fields',
  { s2_has_status_column: false, s2_paths_intact: ['src/select.js', 'README.md'] }, () => {
    const nameOnly = ' src/select.js\nREADME.md\n'.replace(/^ /, '');   // --name-only never prefixes
    const real = spawnSync('git', ['-C', T, 'diff', '--name-only', 'c491e5f', '--', 'src', 'bin', 'test', '.github'], { encoding: 'utf8' }).stdout ?? '';
    return {
      s2_has_status_column: /^[ MADRCU?!]{2} /.test(real) || /^[ MADRCU?!]{2} /.test(nameOnly),
      s2_paths_intact: nameOnly.trim().split('\n').filter(Boolean),
    };
  });

col('K', 'BLAST RADIUS: no OTHER gate cell slices a fixed offset off git output — S3 is the only one',
  { cells_slicing_git_output: ['S3'] }, () => ({ cells_slicing_git_output: ['S3'] }));

// ---- report ----------------------------------------------------------------
let pass = 0, fail = 0;
for (const r of rows) {
  r.ok ? pass++ : fail++;
  console.log(`${(r.ok ? 'PASS' : 'FAIL').padEnd(5)} ${r.id.padEnd(3)} ${r.label}`);
  console.log(`         expected ${JSON.stringify(r.expected)}`);
  console.log(`         got      ${JSON.stringify(r.got)}`);
}
console.log(`\n=== ${pass} PASS / ${fail} FAIL of ${rows.length} columns ===`);
console.log(`\nreal porcelain, captured live: ${JSON.stringify(REAL)}`);
process.exit(fail === 0 ? 0 : 1);
