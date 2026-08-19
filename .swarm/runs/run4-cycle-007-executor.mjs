// Cycle 7 (run #4) — EXECUTOR stage of the QA-full pass.
//
// Run by the conductor rather than a third agent: for a CLI with no dev server every
// scenario is a plain invocation, so executing here yields conductor evidence directly
// instead of an agent claim the gate would have to re-verify anyway (the run #3 cycle-6
// precedent, recorded there).
//
// The answer key comes from the SPEC-BLIND author (agent, spec text only, sha256
// d942389c... == the isolation copy). It never saw the source, so a match here is a real
// spec-vs-shipped agreement, not a restatement of the implementation.
//
// Only mechanically-checkable expectations are asserted: exit code, and "exactly zero
// bytes" stream claims. Prose expectations ("a human-readable message") are checked as
// non-empty. UNDECIDED-BY-SPEC scenarios are RECORDED, never scored — the whole point of
// D-42/43/44 is that the contract does not decide them.
import { spawnSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const run = (cmd) => {
  const r = spawnSync('/bin/bash', ['-c', cmd], { cwd: T, encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
};

// (id, command, expected_exit, stdout_rule, stderr_rule)
//   'zero'    -> must be exactly zero bytes
//   'nonzero' -> must be > 0 bytes
//   null      -> not mechanically asserted
const KEY = [
  ['S-01', `node bin/aphorism.js`, 0, 'nonzero', 'zero'],
  ['S-02', `node bin/aphorism.js --author 'zzzznotinthecorpusxyz123'`, 1, 'zero', 'nonzero'],
  ['S-03', `node bin/aphorism.js --nonexistent-flag`, 2, 'zero', 'nonzero'],
  ['S-04', `node bin/aphorism.js --author`, 2, 'zero', 'nonzero'],
  ['S-05', `node bin/aphorism.js --seed banana`, 2, 'zero', 'nonzero'],
  ['S-06', `node bin/aphorism.js --list --seed banana`, 2, 'zero', 'nonzero'],
  ['S-08', `node bin/aphorism.js --tag 'nonexistentzzz'`, 1, 'zero', 'nonzero'],
  ['S-09', `node bin/aphorism.js --badflag123`, 2, 'zero', 'nonzero'],
  ['S-11', `node bin/aphorism.js --author dijk --list`, 0, 'nonzero', 'zero'],
  ['S-12', `node bin/aphorism.js --author DIJK --list`, 0, 'nonzero', 'zero'],
  ['S-13', `node bin/aphorism.js --tag desi --list`, 1, 'zero', 'nonzero'],
  ['S-14', `node bin/aphorism.js --tag design --author 'zzzznotinthecorpusxyz123'`, 1, 'zero', 'nonzero'],
  ['S-15', `node bin/aphorism.js --list`, 0, 'nonzero', 'zero'],
  ['S-16', `node bin/aphorism.js --list --json`, 0, 'nonzero', 'zero'],
  ['S-17', `node bin/aphorism.js --json`, 0, 'nonzero', 'zero'],
  ['S-18', `node bin/aphorism.js --list --seed 42`, 0, 'nonzero', 'zero'],
  ['S-19', `node bin/aphorism.js --json --tag design --seed 7`, 0, 'nonzero', 'zero'],
  ['S-20', `node bin/aphorism.js --seed 42`, 0, 'nonzero', 'zero'],
  ['S-21', `node bin/aphorism.js --seed -3.7`, 0, 'nonzero', 'zero'],
  ['S-22', `node bin/aphorism.js --seed Infinity`, 0, 'nonzero', 'zero'],
  ['S-23', `node bin/aphorism.js --seed -Infinity`, 0, 'nonzero', 'zero'],
  ['S-24', `node bin/aphorism.js --seed 42 --tag design`, 0, 'nonzero', 'zero'],
];

let pass = 0, fail = 0;
const diverged = [];
console.log('id     exit want  stdout      stderr      verdict');
for (const [id, cmd, wantExit, soRule, seRule] of KEY) {
  const r = run(cmd);
  const okExit = r.code === wantExit;
  const okSo = soRule === 'zero' ? r.out.length === 0 : r.out.length > 0;
  const okSe = seRule === 'zero' ? r.err.length === 0 : r.err.length > 0;
  const ok = okExit && okSo && okSe;
  ok ? pass++ : fail++;
  if (!ok) diverged.push({ id, cmd, wantExit, got: r.code, out: r.out.length, err: r.err.slice(0, 80) });
  console.log(
    `${id.padEnd(6)} ${String(r.code).padStart(4)} ${String(wantExit).padStart(4)}  ` +
    `${String(r.out.length).padStart(6)}${okSo ? ' ok' : ' XX'}  ${String(r.err.length).padStart(6)}${okSe ? ' ok' : ' XX'}  ${ok ? 'PASS' : 'DIVERGENCE'}`
  );
}

// --- determinism, which a single invocation cannot show (S-20/21/22/23/24) ---
console.log('\n--- determinism re-runs (same command twice, bytes compared) ---');
for (const [id, cmd] of [['S-20', `node bin/aphorism.js --seed 42`],
                         ['S-21', `node bin/aphorism.js --seed -3.7`],
                         ['S-22', `node bin/aphorism.js --seed Infinity`],
                         ['S-23', `node bin/aphorism.js --seed -Infinity`],
                         ['S-24', `node bin/aphorism.js --seed 42 --tag design`]]) {
  const a = run(cmd).out, b = run(cmd).out;
  const ok = a === b && a.length > 0;
  ok ? pass++ : fail++;
  if (!ok) diverged.push({ id: id + '-det', cmd, wantExit: 'stable', got: 'unstable' });
  console.log(`${id.padEnd(6)} ${ok ? 'PASS  stable' : 'DIVERGENCE  unstable'}  ${JSON.stringify(a.trim().slice(0, 48))}`);
}

// --- cross-scenario equalities the key asserts ---
console.log('\n--- cross-scenario equalities ---');
const s11 = run(`node bin/aphorism.js --author dijk --list`).out;
const s12 = run(`node bin/aphorism.js --author DIJK --list`).out;
const eqCase = s11 === s12 && s11.length > 0;
eqCase ? pass++ : fail++;
console.log(`S-12 case-insensitivity: --author dijk == --author DIJK -> ${eqCase ? 'PASS' : 'DIVERGENCE'}`);

const s15 = run(`node bin/aphorism.js --list`).out;
const s18 = run(`node bin/aphorism.js --list --seed 42`).out;
const eqSeed = s15 === s18;
eqSeed ? pass++ : fail++;
console.log(`S-18 --list ignores --seed: byte-identical -> ${eqSeed ? 'PASS' : 'DIVERGENCE'}`);

const listLines = s15.trimEnd().split('\n').length;
const okCount = listLines === 50;
okCount ? pass++ : fail++;
console.log(`S-15 --list line count = ${listLines} (key says 50, derived from SPEC "50 entries") -> ${okCount ? 'PASS' : 'DIVERGENCE'}`);

const ndjson = run(`node bin/aphorism.js --list --json`).out.trimEnd().split('\n');
let jsonOk = ndjson.length === 50;
for (const l of ndjson) { try { const o = JSON.parse(l); if (!('text' in o && 'author' in o && 'tags' in o)) jsonOk = false; } catch { jsonOk = false; } }
jsonOk ? pass++ : fail++;
console.log(`S-16 --list --json = ${ndjson.length} NDJSON lines, all parse with text/author/tags -> ${jsonOk ? 'PASS' : 'DIVERGENCE'}`);

const piped = run(`node bin/aphorism.js --seed 42 | cat`).out;
const unpiped = run(`node bin/aphorism.js --seed 42`).out;
const eqPipe = piped === unpiped && piped.length > 0;
eqPipe ? pass++ : fail++;
console.log(`S-10 | cat byte-identical to unpiped -> ${eqPipe ? 'PASS' : 'DIVERGENCE'}`);

// --- UNDECIDED: recorded, never scored ---
console.log('\n--- UNDECIDED-BY-SPEC (recorded, NOT scored — the contract does not decide these) ---');
for (const [id, cmd, gap] of [
  ['S-25', `node bin/aphorism.js --seed ''`, 'D-43'],
  ['S-26', `node bin/aphorism.js --author ''`, 'D-44'],
  ['S-27', `node bin/aphorism.js --tag humor --tag design --list`, 'D-42'],
  ['S-28', `node bin/aphorism.js --author=`, 'D-44'],
]) {
  const r = run(cmd);
  console.log(`${id.padEnd(6)} ${gap}  exit=${r.code} stdout_bytes=${String(r.out.length).padStart(5)}  ${JSON.stringify(r.err.trim().slice(0, 46))}`);
}

console.log(`\n${pass} PASS / ${fail} DIVERGENCE (decidable scenarios only)`);
if (diverged.length) console.log('\nDIVERGENCES:\n' + JSON.stringify(diverged, null, 2));
