#!/usr/bin/env node
// CONDUCTOR VERIFICATION GATE — cycle 4, item W-9 (tools/run-all.mjs).
// Authored at verification time, outside the target tree. The builder never saw it.
//
// Acceptance clause under test:
//   "tools/run-all.mjs invokes every measurement executable this run shipped, in a
//    stated order, prints each one's re-derived output under a labelled heading, and
//    ends with a one-line roll-up of which ran clean and which reported a problem.
//    Zero-dependency, imports nothing outside node: builtins, not collected by the
//    suite, leaves the tree byte-identical."
//
// Six cells. Cell 4 is the DISCRIMINATOR: a roll-up that says "clean" no matter what
// is not a roll-up. It must be shown to FAIL for the reason it names (a broken tool)
// before its clean verdict counts for anything.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TARGET = '/opt/targets/aphorism-cli';
const RUNALL = 'tools/run-all.mjs';
const TOOLS = [
  'guard-inventory.mjs',
  'mutation-matrix.mjs',
  'citation-rule-check.mjs',
  'citation-tax.mjs',
  'matrix-adjudication.mjs',
];

const results = [];
function cell(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`\n[${pass ? 'PASS' : 'FAIL'}] ${name}`);
  console.log(String(detail).split('\n').map((l) => '    ' + l).join('\n'));
}
function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
}
// Manifest of every tracked file's sha256 — stronger than `git status`, which cannot
// see a write-then-restore-to-same-bytes but CAN miss nothing here; belt and braces.
function manifest(dir) {
  const ls = sh('git', ['-C', dir, 'ls-files', '-z']).stdout.split('\0').filter(Boolean);
  const h = sh('sh', ['-c', `cd ${JSON.stringify(dir)} && git ls-files -z | xargs -0 sha256sum | sort`]);
  return { count: ls.length, digest: h.stdout };
}

// ---------------------------------------------------------------------------
// CELL 1 — the file exists, is zero-dependency, and imports only node: builtins
// ---------------------------------------------------------------------------
const src = fs.readFileSync(path.join(TARGET, RUNALL), 'utf8');
const specifiers = [...src.matchAll(/(?:^|[^.\w])(?:import\s[\s\S]*?from\s*|import\s*|require\s*\()\s*['"]([^'"]+)['"]/gm)]
  .map((m) => m[1]);
const nonBuiltin = specifiers.filter((s) => !s.startsWith('node:'));
cell(
  'C1 zero-dependency: every import/require specifier in tools/run-all.mjs is a node: builtin',
  nonBuiltin.length === 0,
  `specifiers found: ${JSON.stringify(specifiers)}\nnon-node: specifiers: ${JSON.stringify(nonBuiltin)}`
);

// ---------------------------------------------------------------------------
// CELL 2 — a real end-to-end run: every tool gets a labelled heading, roll-up present
// ---------------------------------------------------------------------------
const before = manifest(TARGET);
const t0 = Date.now();
const run = sh('node', [RUNALL], { cwd: TARGET, timeout: 900000 });
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const out = (run.stdout || '') + (run.stderr || '');
fs.writeFileSync('/opt/swarm/runs/c4-w9-runall-output.txt', out);
const missingHeading = TOOLS.filter((t) => !out.includes(t));
cell(
  'C2 end-to-end run names every shipped tool in its output',
  missingHeading.length === 0,
  `exit=${run.status} duration=${secs}s output=${out.length} bytes -> /opt/swarm/runs/c4-w9-runall-output.txt\n` +
  `tools named in output: ${TOOLS.filter((t) => out.includes(t)).join(', ') || '(none)'}\n` +
  `tools MISSING from output: ${missingHeading.join(', ') || '(none)'}`
);

// ---------------------------------------------------------------------------
// CELL 3 — the tree is byte-identical after the run
// ---------------------------------------------------------------------------
const after = manifest(TARGET);
const porcelainAfter = sh('git', ['-C', TARGET, 'status', '--porcelain']).stdout;
cell(
  'C3 running the dispatcher leaves every tracked file byte-identical',
  before.digest === after.digest,
  `tracked files before=${before.count} after=${after.count}\n` +
  `sha256 manifest identical: ${before.digest === after.digest}\n` +
  `git status --porcelain after the run (untracked scratch is reported, not ignored):\n${porcelainAfter || '(clean)'}`
);

// ---------------------------------------------------------------------------
// CELL 4 — DISCRIMINATOR. Break one tool in a scratch clone; the roll-up must say so.
//          Converse control: the same clone unbroken must roll up clean for that tool.
// ---------------------------------------------------------------------------
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'c4-w9-gate-'));
const clone = path.join(scratch, 'clone');
const cl = sh('git', ['clone', '--no-hardlinks', '--quiet', TARGET, clone]);
let cell4 = { pass: false, detail: 'clone failed: ' + cl.stderr };
if (cl.status === 0) {
  // carry the UNCOMMITTED run-all.mjs into the clone (it is not committed yet)
  fs.mkdirSync(path.join(clone, 'tools'), { recursive: true });
  fs.copyFileSync(path.join(TARGET, RUNALL), path.join(clone, RUNALL));

  const VICTIM = 'tools/citation-tax.mjs';
  const victimPath = path.join(clone, VICTIM);
  const orig = fs.readFileSync(victimPath, 'utf8');

  // CONVERSE CONTROL first: unbroken clone. Must NOT report the victim as a problem.
  const ctrl = sh('node', [RUNALL], { cwd: clone, timeout: 900000 });
  const ctrlOut = (ctrl.stdout || '') + (ctrl.stderr || '');

  // Now break the victim in a way no static read could miss and no fallback could mask.
  fs.writeFileSync(victimPath, 'throw new Error("GATE-C4-INDUCED-FAILURE");\n');
  const brk = sh('node', [RUNALL], { cwd: clone, timeout: 900000 });
  const brkOut = (brk.stdout || '') + (brk.stderr || '');
  fs.writeFileSync(victimPath, orig);

  fs.writeFileSync('/opt/swarm/runs/c4-w9-discriminator-control.txt', ctrlOut);
  fs.writeFileSync('/opt/swarm/runs/c4-w9-discriminator-broken.txt', brkOut);

  // The roll-up must DISTINGUISH the two runs. We do not guess the wording: we require
  // that the broken run's output differs from the control AND that the induced failure
  // is attributed to the victim tool by name somewhere in the broken run's output.
  const surfaced = brkOut.includes('GATE-C4-INDUCED-FAILURE') || /citation-tax[\s\S]{0,400}?(fail|problem|error|FAIL)/i.test(brkOut);
  const differs = ctrlOut !== brkOut;
  const controlClean = !ctrlOut.includes('GATE-C4-INDUCED-FAILURE');
  cell4 = {
    pass: surfaced && differs && controlClean,
    detail:
      `converse control (unbroken clone): exit=${ctrl.status}, ${ctrlOut.length} bytes -> c4-w9-discriminator-control.txt\n` +
      `broken clone (tools/citation-tax.mjs replaced with a throw): exit=${brk.status}, ${brkOut.length} bytes -> c4-w9-discriminator-broken.txt\n` +
      `induced failure surfaced in broken run: ${surfaced}\n` +
      `broken output differs from control: ${differs}\n` +
      `control did NOT surface the induced failure: ${controlClean}\n` +
      `--- broken run, last 12 lines ---\n${brkOut.trimEnd().split('\n').slice(-12).join('\n')}\n` +
      `--- control run, last 12 lines ---\n${ctrlOut.trimEnd().split('\n').slice(-12).join('\n')}`,
  };
}
cell('C4 DISCRIMINATOR: the roll-up reports a broken tool as a problem, and a healthy one as clean', cell4.pass, cell4.detail);
fs.rmSync(scratch, { recursive: true, force: true });

// ---------------------------------------------------------------------------
// CELL 5 — the suite does not collect it
// ---------------------------------------------------------------------------
const suite = sh('node', ['--test', '--test-reporter=tap', ...fs.readdirSync(path.join(TARGET, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f)], { cwd: TARGET, timeout: 900000 });
const suiteOut = (suite.stdout || '') + (suite.stderr || '');
fs.writeFileSync('/opt/swarm/runs/c4-w9-suite.txt', suiteOut);
const grab = (k) => { const m = suiteOut.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? Number(m[1]) : null; };
const collected = /run-all/.test(suiteOut);
cell(
  'C5 tools/run-all.mjs is not collected by `node --test test/*.test.js`',
  collected === false,
  `suite totals: tests=${grab('tests')} pass=${grab('pass')} fail=${grab('fail')} skipped=${grab('skipped')}\n` +
  `the string "run-all" appears in suite output: ${collected}\n` +
  `full TAP -> /opt/swarm/runs/c4-w9-suite.txt`
);

// ---------------------------------------------------------------------------
// CELL 6 — the file states what a default run excludes (honest default)
// ---------------------------------------------------------------------------
const statesExclusion = /exclud|skip|opt[- ]?in|opt[- ]?out|--\w+/i.test(src) &&
  TOOLS.every((t) => src.includes(t));
cell(
  'C6 the file itself names every tool it dispatches and documents what a default run leaves out',
  statesExclusion,
  `all five tool filenames referenced in run-all.mjs: ${TOOLS.every((t) => src.includes(t))}\n` +
  `file documents an exclusion/opt-in/opt-out mechanism: ${/exclud|skip|opt[- ]?in|opt[- ]?out/i.test(src)}\n` +
  `flags mentioned: ${JSON.stringify([...new Set([...src.matchAll(/'(--[a-z-]+)'|"(--[a-z-]+)"/g)].map((m) => m[1] || m[2]))])}`
);

console.log('\n================ W-9 GATE VERDICT ================');
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}`);
const allPass = results.every((r) => r.pass);
console.log(`\nW-9: ${allPass ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length} cells)`);
process.exit(allPass ? 0 : 1);
