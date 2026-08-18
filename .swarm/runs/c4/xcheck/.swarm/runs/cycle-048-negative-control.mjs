#!/usr/bin/env node
// cycle-048 negative control — mutation arm for the RETRO.md refresh gate.
//
// The control arm (cycle-42 baseline scores 0/30) proves the gate detects a STALE document.
// It does not prove each cell is bound to its OWN claim: a gate where one cell reddens for
// everything would score identically. So each mutation below plants ONE false claim in the
// refreshed document and must redden its OWN target cell.
//
// Discipline carried from cycle 47: a mutation whose anchor is missing (so the edit silently
// no-ops) is reported FAIL, never skipped — a mutation that did not apply proves nothing, and
// reporting it as a pass is exactly how a gate flatters itself.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GATE = '/opt/targets/aphorism-cli/.swarm/runs/cycle-048-gate.mjs';
const DOC = '/opt/targets/aphorism-cli/.swarm/RETRO.md';
const original = readFileSync(DOC, 'utf8');
const scratch = mkdtempSync(join(tmpdir(), 'c048-negctl-'));

const run = (text) => {
  const p = join(scratch, 'retro.md');
  writeFileSync(p, text);
  let out;
  try { out = execFileSync('node', [GATE, p], { encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  return (out.match(/^FAIL\s+(\S+)/gm) || []).map((l) => l.split(/\s+/)[1]);
};

const MUTATIONS = [
  ['M1',  'C1',  'cycles run: **47 complete and counting**', 'cycles run: **42 complete and counting**'],
  ['M2',  'C3',  '54 items — **42 done**', '54 items — **41 done**'],
  ['M3',  'C5',  'Done by kind: test 21,', 'Done by kind: test 22,'],
  ['M4',  'C6',  '80 green at cycle 48', '79 green at cycle 48'],
  ['M5',  'C8',  'all **12**\nchartered improvement must-haves closed', 'all 11 chartered improvement must-haves closed'],
  ['M6',  'C11', 'never migrated from macOS to the VPS', 'never configured correctly on this host'],
  ['M7',  'C15', 'refused on all 47 cycles', 'refused on all 42 cycles'],
  ['M8',  'C17', 'thinnest pool of **3**', 'thinnest pool of **5**'],
  ['M9',  'C20', 'cycle 39 through cycle 47 — nine consecutive cycles', 'cycle 39 through cycle 42 — four consecutive cycles'],
  ['M10', 'C21', '`week_resets_at` was **0**', '`week_resets_at` looked plausible'],
  ['M11', 'C24', '**21.83 (c48)**', '**22.41 (c48)**'],
  ['M12', 'C25', 'overall 95.0%, premium/opus 97%', 'overall 94.0%, premium/opus 97%'],
  ['M13', 'C26', '**1.0870 (c48**', '**1.1500 (c48**'],
  ['M14', 'C29', 'cycle 48 (8 open', 'cycle 48 (9 open'],
  ['M15', 'C32', '**Board at cycle 48:** 54 items', '**Board at drafting:** 53 items — **41 done**, and also 54 items'],
  ['M16', 'C33', 'Hand-off documents decay silently', 'Some documents get old'],
  ['M17', 'C10', 'every one of the **42** done items', 'every one of the **41** done items'],
  // M18 retargeted: the first version mutated the entry's TITLE, which recurs in a
  // cross-reference, so the edit left the cell satisfied by a pointer. It now mutates the
  // substantive claim, and C19 was strengthened to bind to that claim rather than the title.
  ['M18', 'C19', '**Cycle 46 refuted it by doing it**', 'Cycle 46 was uneventful'],
  ['M19', 'C14', 'exit 127', 'a nonzero status'],
  ['M20', 'C30', 'Neither is in the gated set', 'Both are in the gated set'],
];

// P0 — the unmutated document must be clean, or every result below is noise.
const p0 = run(original);
const rows = [];
rows.push(['P0', '(none)', 'unmutated copy', p0.length === 0 ? 'PASS' : 'FAIL', `red=[${p0}]`]);

for (const [id, target, from, to] of MUTATIONS) {
  if (!original.includes(from)) {
    rows.push([id, target, 'ANCHOR MISSING — mutation did not apply', 'FAIL', 'anchor not found in document']);
    continue;
  }
  const red = run(original.replace(from, to));
  const hitOwn = red.includes(target);
  rows.push([id, target, `${JSON.stringify(from.slice(0, 46))}`, hitOwn ? 'PASS' : 'FAIL', `red=[${red}]`]);
}

let fails = 0;
for (const [id, target, desc, verdict, note] of rows) {
  if (verdict === 'FAIL') fails++;
  console.log(`${verdict}  ${id.padEnd(4)} ${String(target).padEnd(5)} ${desc.padEnd(50)} ${note}`);
}
console.log('---');
console.log(fails === 0
  ? `negative control: ALL ${MUTATIONS.length} MUTATIONS CAUGHT BY THEIR OWN CELL (+ clean P0)`
  : `negative control: ${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
