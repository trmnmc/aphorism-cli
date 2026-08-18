#!/usr/bin/env node
// cycle 47 — negative control for the REPORT.md gate (L-029 double proof).
// A gate that passes everything proves nothing. Each mutation below plants ONE false claim
// in a copy of the report and asserts the gate flips the EXPECTED cell red — attribution,
// not just failure. A mutation that goes green, or that reddens only some other cell, is
// itself a finding.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const SRC = `${T}/REPORT.md`;
const TMP = `${T}/.swarm/runs/cycle-047-mutant.md.tmp`;
const GATE = `${T}/.swarm/runs/cycle-047-gate.mjs`;
const base = readFileSync(SRC, 'utf8');

const MUTATIONS = [
  ['M1', 'C3', 'the exact regression this refresh exists to prevent: 12 tags -> 37',
    '**24** authors, **12** distinct tags', '**24** authors, **37** distinct tags'],
  ['M2', 'C25', 'stale cycle count in the stats table', '| Cycles run | **46 completed**', '| Cycles run | **40 completed**'],
  ['M3', 'C11', 'stats corpus line off by one', '· **12 tags** (was 37', '· **11 tags** (was 37'],
  ['M4', 'C29', 'artifact count reverted to the cycle-41 figure', 'Verification artifacts | **233** files', 'Verification artifacts | **196** files'],
  ['M5', 'C35', 'known-issue open count inflated', '`.swarm/state.json`: 11 open', '`.swarm/state.json`: 13 open'],
  ['M6', 'C42', 'allocator allowance understated (would hide the fail-open hazard)',
    '`allow_overall_pct` **10**, not 0', '`allow_overall_pct` **0**, not 0'],
  ['M7', 'C38', 'notification count inflated', 'Notifications sent | 4 (', 'Notifications sent | 5 ('],
  ['M8', 'C15', 'retired tag-name count understated', 'Twenty-six\nlow-count tag names', 'Twenty-five\nlow-count tag names'],
  ['M9', 'C19', 'backlog done count stale', 'items — **42 done**', 'items — **41 done**'],
  ['M10', 'C16', 'pre-retag singleton count wrong', '21 of the 37 tags matched', '19 of the 37 tags matched'],
  ['M11', 'C47', 'a done item smuggled back into the unfinished-work table',
    '| **T-040** ratify', '| **T-007** consolidate the tag taxonomy | Gear | A healthy window | Any run |\n| **T-040** ratify'],
  ['M12', 'C31', 'test-line count stale', '`bin/`), 2101 lines of tests', '`bin/`), 2051 lines of tests'],
  ['M13', 'C23', 'headline cycle count stale — the failure mode this whole refresh exists to catch',
    '**Cycles completed: 46**', '**Cycles completed: 40**'],
  ['M14', 'C34', 'known-issue recorded count stale', '**Fifteen recorded**', '**Fourteen recorded**'],
];

const runGate = (path) => {
  try { return { code: 0, out: execSync(`node ${GATE} ${path}`, { encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, out: e.stdout || '' }; }
};
const redCells = (out) => [...out.matchAll(/^FAIL  (\S+)/gm)].map((m) => m[1]);

// positive control: the copy path itself must not disturb any cell
writeFileSync(TMP, base);
const pos = runGate(TMP);
const posRed = redCells(pos.out);
console.log(`P0   unmutated copy            expect 0 red   got ${posRed.length} red ${posRed.join(',') || ''}   ${posRed.length === 0 ? 'PASS' : 'FAIL'}`);
let ok = posRed.length === 0;

for (const [id, expectCell, why, from, to] of MUTATIONS) {
  if (!base.includes(from)) {
    console.log(`${id.padEnd(4)} ${expectCell.padEnd(5)} MUTATION DID NOT APPLY — anchor absent: ${JSON.stringify(from).slice(0, 60)}   FAIL`);
    ok = false;
    continue;
  }
  writeFileSync(TMP, base.replace(from, to));
  const red = redCells(runGate(TMP).out);
  const hit = red.includes(expectCell);
  const clean = red.length === 1;
  console.log(`${id.padEnd(4)} ${expectCell.padEnd(5)} ${why.slice(0, 56).padEnd(58)} red=[${red.join(',')}] ${hit ? (clean ? 'PASS' : 'PASS (multi-cell)') : 'FAIL — expected cell stayed green'}`);
  if (!hit) ok = false;
}
unlinkSync(TMP);
console.log(`\nnegative control: ${ok ? 'ALL MUTATIONS CAUGHT BY THEIR OWN CELL' : 'AT LEAST ONE MUTATION SURVIVED — the gate is not measuring what it claims'}`);
process.exit(ok ? 0 : 1);
