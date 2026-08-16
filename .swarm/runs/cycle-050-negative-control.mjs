// cycle 50 — negative control for cycle-050-gate.mjs.
//
// 12/12 green on the first run is when a gate is least trustworthy: an instrument that
// has never been shown to fail is indistinguishable from one that CANNOT fail. Each
// mutation below is planted in a throwaway copy of the tree, and the requirement is not
// merely that the gate reddens — it is that the cells which redden are the cells that
// should detect THAT defect. A kill by an unrelated cell is scored a MISS, because
// attributing the kill is the evidence (playbook L-029).
//
// mustRed  cells that MUST go red, or the mutation is unattributed
// mayRed   cells allowed to redden as collateral (stochastic overlap), not required
// anything red outside mustRed U mayRed is a MISS.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIVE = '/opt/targets/aphorism-cli';
const GATE = LIVE + '/.swarm/runs/cycle-050-gate.mjs';
const CTRL_DRAWS = 500; // P(a uniform entry missed in 500 draws) = (49/50)^500 = 4.5e-5,
//                         so A1 is a sound control at this depth, not a coin flip.

const SELECT_UNSEEDED = 'index = Math.floor(Math.random() * candidates.length);';
const SELECT_SEEDGUARD = "if (typeof seed === 'number' && !Number.isNaN(seed)) {";
const SELECT_FOLD = 'return (ints[0] ^ ints[1]) >>> 0;';
const ARGS_NANGUARD = 'if (Number.isNaN(n)) return { ok: false };';

const MUTATIONS = [
  { id: 'P0', desc: 'unmutated copy (the control on the control)', file: null,
    mustRed: [], mayRed: [] },

  { id: 'M1', desc: 'unseeded off-by-one: the LAST corpus entry can never be picked',
    file: 'src/select.js', from: SELECT_UNSEEDED,
    to: 'index = Math.floor(Math.random() * (candidates.length - 1));',
    mustRed: ['A1'], mayRed: ['A2', 'A3'] },

  { id: 'M2', desc: 'unseeded pinned: every unseeded run prints corpus entry 0',
    file: 'src/select.js', from: SELECT_UNSEEDED, to: 'index = 0;',
    mustRed: ['A1', 'A2', 'A3'], mayRed: [] },

  { id: 'M3', desc: 'unseeded biased toward the front of the corpus (u -> u^2)',
    file: 'src/select.js', from: SELECT_UNSEEDED,
    to: 'index = Math.floor(Math.random() ** 2 * candidates.length);',
    mustRed: ['A2', 'A3'], mayRed: ['A1'] },

  { id: 'M4', desc: '--seed is silently ignored: the seeded branch never runs',
    file: 'src/select.js', from: SELECT_SEEDGUARD, to: 'if (false) {',
    mustRed: ['B1', 'B2'], mayRed: [] },

  { id: 'M5', desc: 'every seed folds to the same state: --seed is deterministic but reaches ONE entry',
    file: 'src/select.js', from: SELECT_FOLD, to: 'return 0;',
    mustRed: ['B1', 'C1', 'C2', 'C3'], mayRed: [],
    // B2 must stay GREEN here and that is the point of the cell split: determinism alone
    // cannot see this defect. Only reachability can.
    mustStayGreen: ['B2'] },

  { id: 'M6', desc: 'a NaN seed is accepted instead of exiting 2',
    file: 'src/args.js', from: ARGS_NANGUARD, to: 'if (false) return { ok: false };',
    mustRed: ['B3'], mayRed: [] },
];

function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c50-'));
  for (const sub of ['bin', 'src']) fs.cpSync(path.join(LIVE, sub), path.join(dir, sub), { recursive: true });
  return dir;
}

let pass = 0;
const rows = [];
for (const m of MUTATIONS) {
  const dir = copyTree();
  let planted = 'n/a (unmutated)';
  if (m.file) {
    const p = path.join(dir, m.file);
    const src = fs.readFileSync(p, 'utf8');
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) {
      rows.push({ id: m.id, ok: false, note: `ANCHOR NOT UNIQUE in ${m.file}: ${hits} occurrences — mutation not planted` });
      fs.rmSync(dir, { recursive: true, force: true });
      continue;
    }
    fs.writeFileSync(p, src.replace(m.from, m.to));
    planted = `${m.file}: 1 anchor replaced`;
  }

  const r = spawnSync(process.execPath, [GATE, dir, String(CTRL_DRAWS)],
    { encoding: 'utf8', env: { ...process.env, GATE_QUIET: '1', GATE_JSON: '1' } });
  let red = [];
  try { red = JSON.parse(r.stderr.trim().split('\n').pop()).red; }
  catch { rows.push({ id: m.id, ok: false, note: `gate produced no parseable verdict: ${r.stderr.slice(-200)}` }); fs.rmSync(dir, { recursive: true, force: true }); continue; }

  const missing = m.mustRed.filter((c) => !red.includes(c));
  const stray = red.filter((c) => !m.mustRed.includes(c) && !(m.mayRed || []).includes(c));
  const wrongGreen = (m.mustStayGreen || []).filter((c) => red.includes(c));
  const ok = missing.length === 0 && stray.length === 0 && wrongGreen.length === 0;
  if (ok) pass++;
  rows.push({
    id: m.id, ok, desc: m.desc, planted,
    note: `red=[${red.join(',')}] expect=[${m.mustRed.join(',')}]` +
      (m.mayRed && m.mayRed.length ? ` may=[${m.mayRed.join(',')}]` : '') +
      (m.mustStayGreen ? ` mustStayGreen=[${m.mustStayGreen.join(',')}]` : '') +
      (missing.length ? ` MISSING=${missing}` : '') +
      (stray.length ? ` UNATTRIBUTED=${stray}` : '') +
      (wrongGreen.length ? ` WRONGLY-RED=${wrongGreen}` : ''),
  });
  fs.rmSync(dir, { recursive: true, force: true });
}

for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.desc || ''}`);
  console.log(`        ${r.note}`);
}
console.log(`\n${pass}/${MUTATIONS.length} mutation checks passed`);
process.exit(pass === MUTATIONS.length ? 0 : 1);
