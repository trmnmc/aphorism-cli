#!/usr/bin/env node
// ---------------------------------------------------------------------------
// cycle-6 verification gate — aphorism-cli improvement run #8
// Subjects: W-14 (tools/mutation-matrix.mjs structured output for a non-default
// rev) and P-2 (tools/citation-rule-check.mjs ancestor-repo attribution).
//
// WRITTEN AGAINST THIS RUN'S OWN INSTRUMENT DEFECTS. Three consecutive cycles
// produced a defective gate, each with a DIFFERENT root cause:
//   D-R8-9  (c3): parsed a two-column README table as five pipe-separated
//                 columns -> zero rows parsed, verdict misreported.
//   D-R8-10 (c4): called .trim() on the whole `git status --porcelain` stdout
//                 BEFORE splitting, eating the leading space of the two-char
//                 status column, so the path was sliced one byte short.
//   D-R8-15 (c5): hardcoded the expected dirty set as a point-in-time SNAPSHOT
//                 and used it as a RULE, so the cell failed the moment step 7
//                 legitimately wrote .swarm/state.json.
// Rules adopted here, in force for every cell below:
//   R1. Split `git status --porcelain` into LINES BEFORE any trim; the path is
//       line.slice(3), never a trimmed-then-split token.
//   R2. Print every status line BRACKETED so a column-eating bug is visible in
//       the evidence itself, not merely inferable from a wrong verdict.
//   R3. State scope as a RULE over path CLASSES (builder-owned vs
//       conductor-owned), never as a snapshot of today's dirty files.
//   R4. Every rule cell carries a converse control naming inputs it must
//       REJECT. A check that cannot fail is not evidence.
//   R5. Parse nothing out of prose that a structural artifact can answer.
// ---------------------------------------------------------------------------
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const T = '/opt/targets/aphorism-cli';
const cells = [];
const note = (s) => console.log(s);
function cell(id, title, fn) {
  note('\n' + '='.repeat(78));
  note(`[${id}] ${title}`);
  note('='.repeat(78));
  let verdict = 'FAIL', detail = '';
  try {
    const r = fn();
    verdict = r.pass ? 'PASS' : 'FAIL';
    detail = r.detail || '';
  } catch (e) {
    verdict = 'FAIL';
    detail = 'threw: ' + (e && e.message);
    note('EXCEPTION: ' + (e && e.stack));
  }
  note(`--> ${id} ${verdict}${detail ? ' — ' + detail : ''}`);
  cells.push({ id, title, verdict, detail });
}
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: T, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------------------
// C1 — builder write scope, stated as a RULE (R3) with a converse control (R4)
// ---------------------------------------------------------------------------
cell('C1', 'Builder write scope is exactly the two dispatched tool files; .swarm/ is conductor-owned', () => {
  const raw = sh('git', ['status', '--porcelain']).stdout;
  // R1: split into lines BEFORE any trim. R2: bracket each line.
  const lines = raw.split('\n').filter((l) => l.length > 0);
  note('raw `git status --porcelain` lines, bracketed:');
  for (const l of lines) note('  [' + l + ']');
  const paths = lines.map((l) => l.slice(3));
  note('parsed paths: ' + JSON.stringify(paths));

  // THE RULE (not a snapshot of today's tree):
  //   builder-owned  = the two files dispatched this cycle
  //   conductor-owned = anything under .swarm/ (state, backlog, journal, runs)
  //   everything else = forbidden
  const BUILDER_OWNED = new Set(['tools/mutation-matrix.mjs', 'tools/citation-rule-check.mjs']);
  const classify = (p) => {
    if (BUILDER_OWNED.has(p)) return 'builder-owned';
    if (p === '.swarm/' || p.startsWith('.swarm/')) return 'conductor-owned';
    return 'FORBIDDEN';
  };
  const table = paths.map((p) => [p, classify(p)]);
  for (const [p, c] of table) note(`  ${c.padEnd(16)} ${p}`);
  const forbidden = table.filter(([, c]) => c === 'FORBIDDEN');

  // No scratch tree may survive the wave (both builders were told to delete theirs).
  const scratch = paths.filter((p) => p.startsWith('.scratch') || p.startsWith('.gate-'));
  note('surviving scratch/gate trees in the tree: ' + JSON.stringify(scratch));

  // R4 converse control: the rule must REJECT these three paths.
  const mustReject = ['src/corpus.js', 'test/readme-tags.test.js', 'package.json'];
  const rejected = mustReject.filter((p) => classify(p) === 'FORBIDDEN');
  note('converse control — rule must reject ' + JSON.stringify(mustReject) +
       ' -> rejected ' + JSON.stringify(rejected));

  const pass = forbidden.length === 0 && scratch.length === 0 && rejected.length === 3;
  return { pass, detail: `${forbidden.length} forbidden, ${scratch.length} scratch, converse ${rejected.length}/3` };
});

// ---------------------------------------------------------------------------
// C2 — structural: the JSON path does not depend on the --write-baseline branch
// ---------------------------------------------------------------------------
cell('C2', '`baseline` is built unconditionally, so --json cannot be a latent ReferenceError', () => {
  const src = readFileSync(join(T, 'tools/mutation-matrix.mjs'), 'utf8');
  const srcLines = src.split('\n');
  const declIdx = srcLines.findIndex((l) => /^\s*(const|let|var)\s+baseline\s*=/.test(l));
  const writeIdx = srcLines.findIndex((l) => /if\s*\(\s*WRITE_BASELINE\s*\)/.test(l));
  const jsonIdx = srcLines.findIndex((l) => /if\s*\(\s*JSON_OUTPUT\s*\)/.test(l));
  note(`declaration of \`baseline\` at line ${declIdx + 1}: ${srcLines[declIdx]}`);
  note(`\`if (WRITE_BASELINE)\`      at line ${writeIdx + 1}`);
  note(`\`if (JSON_OUTPUT)\`         at line ${jsonIdx + 1}`);
  // Indentation is the structural marker (R5): a top-level declaration starts at
  // column 0. A declaration nested inside the WRITE_BASELINE branch would be indented.
  const topLevel = declIdx >= 0 && /^(const|let|var)\s/.test(srcLines[declIdx]);
  const before = declIdx >= 0 && writeIdx >= 0 && declIdx < writeIdx;
  note(`declared at top level (column 0): ${topLevel}; declared BEFORE the WRITE_BASELINE branch: ${before}`);
  return { pass: topLevel && before && jsonIdx > declIdx, detail: `topLevel=${topLevel} before=${before}` };
});

// ---------------------------------------------------------------------------
// C3 — W-14 regression: the zero-arg contract is byte-identical pre/post change
// Run BOTH the HEAD version of the tool and the working-tree version, zero-arg,
// and diff stdout. The HEAD copy is placed in tools/ so `../` resolves to the
// same repo root — a copy anywhere else would silently measure a different tree.
// ---------------------------------------------------------------------------
let defaultStdout = null;
cell('C3', 'Zero-arg run: working-tree tool stdout is byte-identical to the pre-change HEAD tool', () => {
  const headCopy = join(T, 'tools/.gate-c6-head-matrix.mjs');
  const headSrc = execFileSync('git', ['show', 'HEAD:tools/mutation-matrix.mjs'],
    { cwd: T, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  writeFileSync(headCopy, headSrc);
  // The usage banner must be a constant, not argv[1]-derived, or the diff would
  // show a spurious filename skew (R5: check the structure, don't assume).
  const argvDerived = /process\.argv\[1\]|import\.meta\.url[^\n]*usage/.test(headSrc.slice(0, 8000));
  note('usage banner derived from argv[1]? ' + argvDerived + ' (false = filenames cannot skew the diff)');
  try {
    note('running HEAD-version tool, zero-arg …');
    const a = sh('node', ['tools/.gate-c6-head-matrix.mjs']);
    note('running working-tree tool, zero-arg …');
    const b = sh('node', ['tools/mutation-matrix.mjs']);
    defaultStdout = b.stdout;
    note(`HEAD  version: exit ${a.status}, stdout ${a.stdout.length} bytes, sha ${sha256(a.stdout).slice(0, 16)}`);
    note(`WTREE version: exit ${b.status}, stdout ${b.stdout.length} bytes, sha ${sha256(b.stdout).slice(0, 16)}`);
    const same = a.stdout === b.stdout;
    if (!same) {
      const al = a.stdout.split('\n'), bl = b.stdout.split('\n');
      for (let i = 0; i < Math.max(al.length, bl.length); i++) {
        if (al[i] !== bl[i]) { note(`first divergence, line ${i + 1}:\n  HEAD : ${al[i]}\n  WTREE: ${bl[i]}`); break; }
      }
    }
    note('last 6 lines of the working-tree zero-arg stdout:');
    for (const l of b.stdout.split('\n').filter(Boolean).slice(-6)) note('  | ' + l);
    return { pass: same && a.status === 0 && b.status === 0 && !argvDerived,
             detail: `identical=${same} exits=${a.status}/${b.status}` };
  } finally {
    rmSync(headCopy, { force: true });
  }
});

// ---------------------------------------------------------------------------
// C4 — W-14 acceptance: --rev <non-default> --json emits the structured record,
// row-by-row diffable against the committed baseline.
// ---------------------------------------------------------------------------
let revJsonStdout = null;
const baselineFile = join(T, 'tools/mutation-matrix-baseline.json');
let shaBefore = null, shaAfter = null;
cell('C4', '--rev HEAD --json emits ONE pure-JSON document on stdout, diffable row-by-row by id', () => {
  shaBefore = sha256(readFileSync(baselineFile));
  note('baseline sha256 BEFORE the --rev run: ' + shaBefore);
  const head = sh('git', ['rev-parse', '--short', 'HEAD']).stdout.trim();
  note('measuring rev: ' + head + ' (non-default; default baseline rev is 20b7ede)');
  const r = sh('node', ['tools/mutation-matrix.mjs', '--rev', head, '--json']);
  revJsonStdout = r.stdout;
  shaAfter = sha256(readFileSync(baselineFile));
  note(`exit ${r.status}; stdout ${r.stdout.length} bytes; stderr ${r.stderr.length} bytes`);
  // R5: parse the WHOLE stdout as JSON. If any prose leaked onto stdout this throws.
  let doc = null, parseErr = null;
  try { doc = JSON.parse(r.stdout); } catch (e) { parseErr = e.message; }
  note('JSON.parse(entire stdout): ' + (parseErr ? 'FAILED — ' + parseErr : 'ok'));
  if (!doc) return { pass: false, detail: 'stdout is not a single JSON document' };
  const committed = JSON.parse(readFileSync(baselineFile, 'utf8'));
  note('stdout top-level keys  : ' + JSON.stringify(Object.keys(doc)));
  note('committed baseline keys: ' + JSON.stringify(Object.keys(committed)));
  const sameKeys = JSON.stringify(Object.keys(doc).sort()) === JSON.stringify(Object.keys(committed).sort());
  // Row-by-row diff by id — the thing W-8 needs and could not do before.
  const byId = (a) => new Map((a.results || []).map((x) => [x.id, x]));
  const M = byId(doc), B = byId(committed);
  const onlyBase = [...B.keys()].filter((k) => !M.has(k));
  const onlyHead = [...M.keys()].filter((k) => !B.has(k));
  const shared = [...B.keys()].filter((k) => M.has(k));
  const verdictDiffs = shared.filter((k) => B.get(k).verdict !== M.get(k).verdict)
    .map((k) => `${k}: base=${B.get(k).verdict} head=${M.get(k).verdict}`);
  note(`rows: committed=${B.size} head=${M.size} shared=${shared.length}`);
  note('ids only in committed baseline (NOT folded into a pass): ' + JSON.stringify(onlyBase));
  note('ids only at HEAD                                       : ' + JSON.stringify(onlyHead));
  note('verdict differences on shared ids                      : ' + JSON.stringify(verdictDiffs));
  note('identity control — committed: ' + JSON.stringify(committed.identity) +
       ' | head: ' + JSON.stringify(doc.identity));
  // This cell proves the MECHANISM (a diffable record exists), not the W-8 verdict.
  const diffable = sameKeys && Array.isArray(doc.results) && doc.results.length > 0 &&
                   shared.length > 0 && r.status === 0;
  return { pass: diffable, detail: `sameKeys=${sameKeys} shared=${shared.length} exit=${r.status}` };
});

// ---------------------------------------------------------------------------
// C5 — CONVERSE CONTROL for C4 (R4): without --json, stdout must NOT be JSON.
// If both shapes parsed as JSON, C4 would pass on a tool that ignored the flag.
// ---------------------------------------------------------------------------
cell('C5', 'Converse control: the zero-arg run\'s stdout is NOT parseable as JSON', () => {
  if (defaultStdout === null) return { pass: false, detail: 'C3 did not capture the zero-arg stdout' };
  let parsed = true, msg = '';
  try { JSON.parse(defaultStdout); } catch (e) { parsed = false; msg = e.message.split('\n')[0]; }
  note('JSON.parse(zero-arg stdout) -> ' + (parsed ? 'PARSED (bad: flag is a no-op)' : 'threw: ' + msg));
  note('first 3 lines of zero-arg stdout, bracketed:');
  for (const l of defaultStdout.split('\n').slice(0, 3)) note('  [' + l + ']');
  note('first 3 lines of --json stdout, bracketed:');
  for (const l of (revJsonStdout || '').split('\n').slice(0, 3)) note('  [' + l + ']');
  return { pass: parsed === false, detail: parsed ? 'both shapes are JSON' : 'shapes differ as required' };
});

// ---------------------------------------------------------------------------
// C6 — the --rev + --write-baseline refusal is STILL in force, and is shown to
// fail for the reason it names.
// ---------------------------------------------------------------------------
cell('C6', '--rev + --write-baseline still refused, exit 2, for the reason it names', () => {
  const r = sh('node', ['tools/mutation-matrix.mjs', '--rev', 'HEAD', '--write-baseline']);
  note('exit code: ' + r.status);
  note('stderr, bracketed:');
  for (const l of r.stderr.split('\n').filter(Boolean).slice(0, 4)) note('  [' + l + ']');
  const named = /--write-baseline/.test(r.stderr) && /--rev/.test(r.stderr);
  // Also with --json in the mix: --json must not become a back door to the file.
  const r2 = sh('node', ['tools/mutation-matrix.mjs', '--rev', 'HEAD', '--write-baseline', '--json']);
  note('with --json added: exit ' + r2.status + ' (must also be refused)');
  const shaNow = sha256(readFileSync(baselineFile));
  note('baseline sha256 after both refused attempts: ' + shaNow);
  return { pass: r.status === 2 && r2.status === 2 && named && shaNow === shaBefore,
           detail: `exits=${r.status}/${r2.status} named=${named}` };
});

// ---------------------------------------------------------------------------
// C7 — the committed baseline is byte-unmoved by everything above
// ---------------------------------------------------------------------------
cell('C7', 'tools/mutation-matrix-baseline.json is byte-unmoved by the --rev/--json runs', () => {
  const shaNow = sha256(readFileSync(baselineFile));
  note('sha256 before C4 : ' + shaBefore);
  note('sha256 after  C4 : ' + shaAfter);
  note('sha256 now       : ' + shaNow);
  const g = sh('git', ['diff', '--exit-code', '--stat', '--', 'tools/mutation-matrix-baseline.json']);
  note('`git diff --exit-code` vs HEAD: exit ' + g.status + (g.stdout.trim() ? ' | ' + g.stdout.trim() : ' (no diff)'));
  return { pass: shaBefore === shaAfter && shaAfter === shaNow && g.status === 0,
           detail: 'unmoved across all runs and vs HEAD' };
});

// ---------------------------------------------------------------------------
// C8 — P-2 acceptance, THE BUG CASE, reproduced independently by the conductor:
// a directory that is not itself a repo but is nested inside one.
// ---------------------------------------------------------------------------
cell('C8', 'P-2 bug case: nested non-repo dir no longer claims it compared against "its own git HEAD"', () => {
  const nest = join(T, '.gate-c6-nested');
  rmSync(nest, { recursive: true, force: true });
  try {
    mkdirSync(join(nest, 'tools'), { recursive: true });
    mkdirSync(join(nest, 'docs'), { recursive: true });
    cpSync(join(T, 'tools/citation-rule-check.mjs'), join(nest, 'tools/citation-rule-check.mjs'));
    cpSync(join(T, 'docs/node-support-citation-history.md'), join(nest, 'docs/node-support-citation-history.md'));
    cpSync(join(T, 'README.md'), join(nest, 'README.md'));
    note('has its own .git? ' + existsSync(join(nest, '.git')));
    const top = sh('git', ['rev-parse', '--show-toplevel'], { cwd: nest }).stdout.trim();
    note('`git rev-parse --show-toplevel` from the nested dir -> ' + top);
    const isAncestor = top === T;
    note('resolves to the ANCESTOR repo (the precondition of the bug): ' + isAncestor);

    // Perturb the nested README so the tool MUST attribute a side. Before P-2 this
    // is exactly where it asserted "its own git HEAD version" against a foreign repo.
    const rm = readFileSync(join(nest, 'README.md'), 'utf8');
    writeFileSync(join(nest, 'README.md'), rm.replace('### Node support', '### Node support  '));
    const r = sh('node', ['tools/citation-rule-check.mjs'], { cwd: nest });
    const out = (r.stdout + r.stderr);
    note('exit ' + r.status + '; output:');
    for (const l of out.split('\n').filter(Boolean).slice(0, 6)) note('  [' + l + ']');
    const claimsOwnHead = /own git HEAD version/.test(out);
    const undetermined = /could not be determined/.test(out);
    note('asserts "own git HEAD version": ' + claimsOwnHead + ' (must be false)');
    note('takes the undetermined-direction path: ' + undetermined + ' (must be true)');
    return { pass: isAncestor && !claimsOwnHead && undetermined,
             detail: `ancestor=${isAncestor} claimsOwnHead=${claimsOwnHead} undetermined=${undetermined}` };
  } finally {
    rmSync(nest, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// C9 — CONVERSE CONTROL for C8 (R4): in a checkout that IS its own toplevel the
// tool must STILL use and name the git anchor. Without this, a fix that routed
// every run to "undetermined" would pass C8.
// Done in a clone OUTSIDE the target so the live tree is never perturbed.
// ---------------------------------------------------------------------------
cell('C9', 'Converse control: an own-toplevel clone still names the side that moved', () => {
  const clone = '/tmp/gate-c6-clone';
  rmSync(clone, { recursive: true, force: true });
  try {
    const c = spawnSync('git', ['clone', '--quiet', T, clone], { encoding: 'utf8' });
    note('clone exit ' + c.status);
    const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: clone, encoding: 'utf8' }).stdout.trim();
    note('clone toplevel: ' + top + ' (is its OWN root: ' + (top === clone) + ')');
    // The clone carries the working-tree (uncommitted) fix? No — clone takes HEAD.
    // Copy the working-tree tool in so we test the FIXED tool in an own-toplevel repo.
    cpSync(join(T, 'tools/citation-rule-check.mjs'), join(clone, 'tools/citation-rule-check.mjs'));
    const base = spawnSync('node', ['tools/citation-rule-check.mjs'], { cwd: clone, encoding: 'utf8' });
    note('unperturbed clone: exit ' + base.status + ' | ' + (base.stdout + base.stderr).split('\n')[0]);

    const rmPath = join(clone, 'README.md');
    const rm = readFileSync(rmPath, 'utf8');
    writeFileSync(rmPath, rm.replace('### Node support', '### Node support  '));
    const r = spawnSync('node', ['tools/citation-rule-check.mjs'], { cwd: clone, encoding: 'utf8' });
    const out = r.stdout + r.stderr;
    note('README-side perturbation in an own-toplevel clone: exit ' + r.status);
    for (const l of out.split('\n').filter(Boolean).slice(0, 4)) note('  [' + l + ']');
    const namesReadme = /README\.md has diverged/.test(out);
    const usesGitAnchor = /own git HEAD version/.test(out);
    const wronglyUndetermined = /could not be determined/.test(out);
    note('names README as the side that moved: ' + namesReadme + ' (must be true)');
    note('still uses and names the git anchor: ' + usesGitAnchor + ' (must be true)');
    note('degraded to "undetermined": ' + wronglyUndetermined + ' (must be false)');
    return { pass: base.status === 0 && namesReadme && usesGitAnchor && !wronglyUndetermined,
             detail: `control=${base.status} names=${namesReadme} anchor=${usesGitAnchor}` };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// C10 — P-2 honest control on the LIVE tree: unperturbed, still OK
// ---------------------------------------------------------------------------
cell('C10', 'P-2 honest control: the live unperturbed repo still reports OK', () => {
  const r = sh('node', ['tools/citation-rule-check.mjs']);
  note('exit ' + r.status);
  for (const l of (r.stdout + r.stderr).split('\n').filter(Boolean).slice(0, 3)) note('  [' + l + ']');
  return { pass: r.status === 0 && /^OK:/.test(r.stdout.trim()), detail: 'exit ' + r.status };
});

// ---------------------------------------------------------------------------
// C11 — the full suite, run by the conductor (never asked of an agent)
// ---------------------------------------------------------------------------
cell('C11', 'Full test_cmd green: node --test test/*.test.js', () => {
  const r = spawnSync('bash', ['-lc', 'cd ' + T + ' && node --test test/*.test.js 2>&1 | tail -20'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  note(r.stdout);
  const m = /# pass (\d+)/.exec(r.stdout), f = /# fail (\d+)/.exec(r.stdout);
  const pass = m ? +m[1] : -1, fail = f ? +f[1] : -1;
  note(`parsed: pass=${pass} fail=${fail}`);
  return { pass: fail === 0 && pass > 0, detail: `${pass} passing / ${fail} failing` };
});

// ---------------------------------------------------------------------------
// C12 — W-6 standing invariant (conductor-held, re-measured every cycle)
// ---------------------------------------------------------------------------
cell('C12', 'W-6 standing invariant: corpus + --help byte-frozen, no deps, no src/bin/test movement', () => {
  const CORPUS = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';
  const HELP = 'd759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64';
  const corpus = sha256(readFileSync(join(T, 'src/corpus.js')));
  const help = sha256(sh('node', ['bin/aphorism.js', '--help']).stdout);
  note('corpus sha256 : ' + corpus + (corpus === CORPUS ? '  == baseline' : '  != BASELINE'));
  note('--help sha256 : ' + help + (help === HELP ? '  == baseline' : '  != BASELINE'));
  const st = sh('git', ['status', '--porcelain', '--', 'src', 'bin', 'test', '.github',
    'README.md', 'package.json', 'docs']).stdout;
  const stLines = st.split('\n').filter((l) => l.length > 0);
  note('frozen-pathspec `git status --porcelain` lines: ' + (stLines.length === 0 ? '(none)' : ''));
  for (const l of stLines) note('  [' + l + ']');
  const imports = spawnSync('bash', ['-lc',
    `cd ${T} && grep -rhoE "from '[^']+'" tools/*.mjs | sort -u`], { encoding: 'utf8' });
  const nonNode = imports.stdout.split('\n').filter((l) => l.trim() && !/from 'node:/.test(l));
  note('imports under tools/:'); for (const l of imports.stdout.split('\n').filter(Boolean)) note('  ' + l);
  note('non-node: imports (must be none): ' + JSON.stringify(nonNode));
  const deps = JSON.parse(readFileSync(join(T, 'package.json'), 'utf8'));
  note('package.json dependencies: ' + JSON.stringify(deps.dependencies || {}) +
       ' devDependencies: ' + JSON.stringify(deps.devDependencies || {}));
  const noDeps = Object.keys(deps.dependencies || {}).length === 0 &&
                 Object.keys(deps.devDependencies || {}).length === 0;
  return { pass: corpus === CORPUS && help === HELP && stLines.length === 0 && nonNode.length === 0 && noDeps,
           detail: `corpus=${corpus === CORPUS} help=${help === HELP} frozen=${stLines.length === 0} deps=${noDeps}` };
});

// ---------------------------------------------------------------------------
note('\n' + '#'.repeat(78));
note('CYCLE 6 GATE SUMMARY');
note('#'.repeat(78));
for (const c of cells) note(`${c.verdict.padEnd(4)} ${c.id.padEnd(4)} ${c.title}`);
const failed = cells.filter((c) => c.verdict !== 'PASS');
note(`\n${cells.length - failed.length}/${cells.length} cells PASS`);
note('W-14 cells: C2 C3 C4 C5 C6 C7  |  P-2 cells: C8 C9 C10  |  scope C1  |  standing C11 C12');
process.exit(failed.length === 0 ? 0 : 1);
