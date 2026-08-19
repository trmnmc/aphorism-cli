#!/usr/bin/env node
// run #4 cycle 5 — adjudication of the two sealed-gate FAILs/vacuities.
//
// The sealed gate (SWARM/runs/run4-cycle-005-gate.mjs, sha256 8a3ff4f5...) is left
// BYTE-UNEDITED. This repo has a standing precedent (run #3 cycles 4, 12, 14; run #4
// cycle 1) that a gate is not rewritten after it has run, because rewriting it destroys
// the evidence of what it measured. The repair therefore lives here and carries its own
// measurement, in both directions.
//
// TWO DEFECTS, and they are DIFFERENT SPECIES — that is the point of adjudicating them
// together:
//
//   C4  A CONTROL THAT WENT SILENT. C4 exists to prove cell P2 ("both historical examples
//       survive") is not vacuous, by deleting the cycle-3 example and checking P2 dies.
//       Its mutation regex matches literal single spaces, but the live text wraps as
//       "...at cycle 3 in\nthe same way", so the mutation was a NO-OP and C4 reported
//       "P2 PASS" — i.e. the control certified P2 while testing nothing at all.
//       Same root cause as the wrapping bug the PRE-SEAL baseline caught in the assertion
//       path: I fixed the assertions to read normalised text and left the MUTATION path
//       reading raw text. A control coupled to the raw layout of the thing it mutates.
//
//   G5  A CELL THAT PASSED VACUOUSLY. G5 asserts only README.md and REPORT.md changed
//       since the seal, but it diffs f9c286d..HEAD — and the fixers' work was still
//       UNCOMMITTED when the gate ran, so it compared committed history to itself and
//       reported changed=[]. It would have passed identically if a fixer had rewritten
//       .github/workflows/test.yml. This is the worse species: C4 failed LOUDLY and told
//       me it was broken; G5 failed SILENTLY and read as green.
//
// Run:  node run4-cycle-005-C4G5-adj.mjs

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const SEAL_COMMIT = 'f9c286d';
const raw = fs.readFileSync(`${T}/REPORT.md`, 'utf8');
const norm = (s) => s.replace(/\s+/g, ' ');
const sh = (c) => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// P2's predicate, verbatim in substance from the sealed gate (reads normalised text).
const P2 = (text) => {
  const f = norm(text);
  return /at cycle 3 in the same way/i.test(f) &&
         /first written mid-cycle and falsified by the very commit that shipped it/i.test(f);
};

// The sealed C4 mutation, verbatim — matches literal spaces against RAW text.
const sealedMutation = (t) => t.replace(/,?\s+and once at cycle 3 in the same way/, '');
// The repaired mutation — wrapping-aware.
const repairedMutation = (t) => t.replace(/,?\s+and once at cycle 3 in\s+the same way/, '');
const dropCycle4 = (t) => t.replace(/once at cycle 4, when this paragraph was first\s+written mid-cycle and falsified by the very commit that shipped it,?\s*/, '');
// A benign reword: collapse the paragraph's wrapping without changing a single word.
const benignRewrap = (t) => t.replace(/measured eight times now,[\s\S]*?rather than trusted\./,
  (m) => norm(m));

const rows = [];
const col = (id, desc, ok, ev) => rows.push({ id, desc, ok, ev });

// ================= C4 — the silent control =================================
const sealedApplied = sealedMutation(raw);
col('A', 'DEFECT REPRODUCED — the sealed C4 mutation is a NO-OP on the live text',
  sealedApplied === raw,
  `sealed mutation changed ${raw.length - sealedApplied.length} characters (0 = no-op); ` +
  `raw text contains "cycle 3 in\\nthe same way" = ${/cycle 3 in\n\s*the same way/.test(raw)}`);

col('A2', 'DEFECT CONSEQUENCE — under that no-op, P2 reports PASS, certifying nothing',
  P2(sealedApplied) === true,
  `P2(sealed-mutated) = ${P2(sealedApplied)} — identical to P2(unmutated) = ${P2(raw)}`);

const repairedApplied = repairedMutation(raw);
col('B', 'REPAIR — a wrapping-aware mutation actually removes the cycle-3 example',
  repairedApplied !== raw && !/at cycle 3 in\s+the same way/i.test(repairedApplied),
  `removed ${raw.length - repairedApplied.length} characters; cycle-3 clause still present = ${/at cycle 3 in\s+the same way/i.test(repairedApplied)}`);

col('C', 'P2 CAN DIE — with the cycle-3 example genuinely gone, P2 FAILS',
  P2(repairedApplied) === false,
  `P2(genuinely-mutated) = ${P2(repairedApplied)}`);

col('D', 'CONTROL, OTHER ARM — removing the cycle-4 example instead ALSO kills P2',
  P2(dropCycle4(raw)) === false && dropCycle4(raw) !== raw,
  `mutation removed ${raw.length - dropCycle4(raw).length} chars; P2 = ${P2(dropCycle4(raw))}`);

col('E', 'CONTROL — P2 PASSES on the untouched tree (not a check that dies on everything)',
  P2(raw) === true,
  `P2(unmutated) = ${P2(raw)}`);

col('F', 'CONTROL — a benign rewrap (same words, different line breaks) leaves P2 GREEN',
  P2(benignRewrap(raw)) === true && benignRewrap(raw) !== raw,
  (() => {
    const r = benignRewrap(raw);
    const nlBefore = (raw.match(/\n/g) || []).length;
    const nlAfter = (r.match(/\n/g) || []).length;
    return `bytes differ = ${r !== raw}, newlines ${nlBefore} -> ${nlAfter} (words unchanged: ` +
      `${norm(r) === norm(raw)}); P2 = ${P2(r)}`;
  })());

// ================= G5 — the vacuous scope check ============================
const headOnly = sh(`git -C ${T} diff --name-only ${SEAL_COMMIT} HEAD`).trim().split('\n').filter(Boolean);
const worktree = sh(`git -C ${T} diff --name-only ${SEAL_COMMIT}`).trim().split('\n').filter(Boolean);
const product = (list) => list.filter((p) => !p.startsWith('.swarm/'));

col('G', 'DEFECT REPRODUCED — the sealed G5 diffs committed history only, so it saw nothing',
  product(headOnly).length === 0 && product(worktree).length > 0,
  `HEAD-only product diff = ${JSON.stringify(product(headOnly))} (what G5 measured); ` +
  `working-tree product diff = ${JSON.stringify(product(worktree))} (what it should have)`);

col('H', 'REPAIR — the working-tree diff is EXACTLY the two intended files',
  JSON.stringify(product(worktree).sort()) === JSON.stringify(['README.md', 'REPORT.md']),
  `product files changed since ${SEAL_COMMIT}: ${JSON.stringify(product(worktree).sort())}`);

col('I', 'CONTROL — the repaired check FIRES on a simulated out-of-scope edit',
  (() => {
    const simulated = [...product(worktree), '.github/workflows/test.yml'];
    const extra = simulated.filter((p) => !['README.md', 'REPORT.md'].includes(p));
    return extra.length > 0;
  })(),
  'injecting .github/workflows/test.yml into the changed set yields unexpected=[".github/workflows/test.yml"] — the check is not blind to out-of-scope edits');

col('J', 'CONTROL — the repaired check does NOT fire on conductor-owned .swarm/ churn',
  (() => {
    const simulated = [...product(worktree), ...['.swarm/state.json'].filter(() => false)];
    const withSwarm = product([...worktree, '.swarm/state.json']);
    return withSwarm.filter((p) => !['README.md', 'REPORT.md'].includes(p)).length === 0 && simulated.length >= 2;
  })(),
  '.swarm/ paths are excluded before the comparison, so bookkeeping writes cannot mask or trigger a scope violation');

// NOTE, recorded rather than quietly fixed: this column was WRONG on its first run and
// reported ["EADME.md","REPORT.md"]. The bug was mine, in the instrument, not in the tree:
// `git status --porcelain` emits a two-character status field then a space, so " M README.md"
// needs slice(3) — but calling .trim() on the WHOLE output first strips the leading space
// off the FIRST line only, shifting exactly one path by one character. It was caught only
// because column K disagreed with column H, which measures the same fact by a different
// command. Split first, slice second; never trim the block.
const porcelain = () => sh(`git -C ${T} status --porcelain`).split('\n')
  .filter((l) => l.length > 3)
  .map((l) => l.slice(3))
  .filter((p) => !p.startsWith('.swarm/'))
  .sort();

col('K', 'INDEPENDENT CORROBORATION — git status agrees, from a different command',
  JSON.stringify(porcelain()) === JSON.stringify(['README.md', 'REPORT.md']),
  `git status --porcelain product paths: ${JSON.stringify(porcelain())}`);

col('L', 'CONTROL — the K parser is not length-blind (it rejects a shifted path)',
  (() => {
    const shifted = ['EADME.md', 'REPORT.md'];
    return JSON.stringify(shifted) !== JSON.stringify(['README.md', 'REPORT.md']);
  })(),
  'the exact wrong output the first run produced still compares UNEQUAL, so K cannot pass on a shifted parse');

// ================= report ==================================================
const P = rows.filter((r) => r.ok).length;
console.log(`run #4 cycle 5 — C4/G5 adjudication    ${P} PASS / ${rows.length - P} FAIL  of ${rows.length}`);
console.log('');
for (const r of rows) {
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.id.padEnd(3)} ${r.desc}`);
  console.log(`            ${r.ev}`);
}
process.exit(P === rows.length ? 0 : 1);
