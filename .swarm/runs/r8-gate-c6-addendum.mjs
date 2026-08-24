#!/usr/bin/env node
// ---------------------------------------------------------------------------
// cycle-6 gate ADDENDUM — corrects FOUR defects in runs/gate-c6.mjs, this
// conductor's own instrument, and re-takes the verdicts those cells were meant
// to take. The original gate's PASSING cells (C1 C3 C4 C5 C6 C7 C10) stand as
// taken; only the four defective cells are re-run here.
//
// This is the FIFTH consecutive cycle in which a conductor instrument carried a
// defect (D-R8-9 c3, D-R8-10 c4, D-R8-15 c5, D-R8-16 c5-renderer). It is the
// first in which a single gate carried four at once. Each is named in the cell
// that corrects it, per this run's standing practice: a gate that misreports
// must be as visible as a build that does, and NEVER silently re-run.
//
// DEFECT 1 (was C2) — WRONG-OCCURRENCE REGEX.
//   The cell located `if (JSON_OUTPUT)` with a findIndex over the whole file and
//   then asserted an ordering against it. But that text occurs TWICE and
//   legitimately so: line 624 inside the one-line `P()` helper (which routes the
//   human report to stderr) and line 804 as the stdout-emit block. findIndex
//   returned 623, the cell compared 623 > 773 and reported FAIL — against a
//   subject that is true. Cousin of D-R8-9: a parser that assumed a shape.
//   CORRECTION: assert on the LAST occurrence (the emit block) and print every
//   occurrence, so a second match can never be silently mistaken for the first.
//
// DEFECT 2 (was C8 and C9) — A PERTURBATION THAT NEVER REACHED ITS SUBJECT.
//   Both P-2 cells perturbed README by rewriting '### Node support' to
//   '### Node support  '. tools/citation-rule-check.mjs extracts its section by
//   an EXACT match on '\n### Node support\n' (line 57), so that edit deleted the
//   heading, and the tool exited at line 85 -- "README.md has no ### Node support
//   section" -- a branch taken BEFORE any git-anchor attribution runs. Both cells
//   therefore measured a code path neither one was about, and both reported FAIL
//   against work that was never exercised.
//   CORRECTION: perturb a byte INSIDE the quoted region while leaving the heading
//   intact, and assert first that the perturbation actually reached the
//   attribution branch before reading any verdict off it.
//
// DEFECT 3 (was C11) — WRONG REPORTER FORMAT.
//   The cell parsed `# pass N` / `# fail N` (TAP). `node --test` on this Node
//   emits `ℹ pass N` / `ℹ fail N` by default, so both regexes missed, pass and
//   fail both read -1, and the cell failed a suite whose own output in the same
//   evidence block reads `pass 128 / fail 0`. Cousin of D-R8-10: the verdict was
//   contradicted by the raw output printed directly above it.
//   CORRECTION: accept either reporter's marker, and FAIL LOUDLY if neither
//   matches rather than treating an unparsed count as a failing count.
//
// DEFECT 4 (was C12) — ASSUMED A FILE THAT HAS NEVER EXISTED.
//   The cell read package.json to prove the dependency surface was unchanged.
//   This repo has no package.json and never has: being manifest-less IS its
//   zero-dependency surface. The cell threw ENOENT and reported the standing
//   invariant as violated. Cousin of D-R8-15: an assumption about the world
//   dressed as an invariant.
//   CORRECTION: state the rule as "no manifest or lockfile exists, tracked or
//   untracked, and no node_modules" -- which is what zero-dependency means here
//   -- with a converse control naming inputs the rule must reject.
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
  try { const r = fn(); verdict = r.pass ? 'PASS' : 'FAIL'; detail = r.detail || ''; }
  catch (e) { detail = 'threw: ' + (e && e.message); note('EXCEPTION: ' + (e && e.stack)); }
  note(`--> ${id} ${verdict}${detail ? ' — ' + detail : ''}`);
  cells.push({ id, title, verdict, detail });
}
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: T, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// The perturbation used by C8' and C9': a byte inside the quoted region, heading
// untouched. Derived from the HIST quote itself so it cannot drift out of date.
function perturbInsideQuote(readmeText, histText) {
  const FENCE = '```readme-quote\n';
  const open = histText.indexOf(FENCE);
  const close = histText.indexOf('\n```', open + FENCE.length);
  const quote = histText.slice(open + FENCE.length, close);
  if (!readmeText.includes(quote)) throw new Error('precondition failed: README does not contain the quote');
  // Change one digit of the Actions run id, which lives inside the quoted region.
  const m = /Actions run (\d+)/.exec(quote);
  if (!m) throw new Error('precondition failed: no Actions run id inside the quote');
  const bumped = m[1].slice(0, -1) + (m[1].endsWith('9') ? '8' : '9');
  const out = readmeText.replace('Actions run ' + m[1], 'Actions run ' + bumped);
  if (out === readmeText) throw new Error('perturbation was a no-op');
  return { out, quote, from: m[1], to: bumped };
}

// ---------------------------------------------------------------------------
cell("C2'", 'W-14 structural: `baseline` is top-level and precedes BOTH the write branch and the emit block', () => {
  const srcLines = readFileSync(join(T, 'tools/mutation-matrix.mjs'), 'utf8').split('\n');
  const all = (re) => srcLines.map((l, i) => [i + 1, l]).filter(([, l]) => re.test(l));
  const decls = all(/^\s*(const|let|var)\s+baseline\s*=/);
  const writes = all(/if\s*\(\s*WRITE_BASELINE\s*\)/);
  const jsons = all(/if\s*\(\s*JSON_OUTPUT\s*\)/);
  // DEFECT 1 correction: print EVERY occurrence. The original took the first.
  note('occurrences of `const/let/var baseline =`:'); for (const [n, l] of decls) note(`   L${n}: ${l.trim()}`);
  note('occurrences of `if (WRITE_BASELINE)`:');      for (const [n, l] of writes) note(`   L${n}: ${l.trim()}`);
  note('occurrences of `if (JSON_OUTPUT)`:');         for (const [n, l] of jsons)  note(`   L${n}: ${l.trim()}`);
  note('  ^ TWO legitimate occurrences of `if (JSON_OUTPUT)`: the P() stream router and the');
  note('    stdout emit block. The original cell took the FIRST and asserted ordering on it.');
  const declLine = decls.length === 1 ? decls[0][0] : null;
  const emitLine = jsons.length ? jsons[jsons.length - 1][0] : null;  // the emit block
  const writeLine = writes.length === 1 ? writes[0][0] : null;
  const topLevel = declLine !== null && /^(const|let|var)\s/.test(srcLines[declLine - 1]);
  note(`decl L${declLine} at column 0: ${topLevel}`);
  note(`decl precedes the WRITE_BASELINE branch (L${writeLine}): ${declLine < writeLine}`);
  note(`decl precedes the JSON emit block (L${emitLine}): ${declLine < emitLine}`);
  note('=> --json cannot be a latent ReferenceError: `baseline` is built on every path.');
  return { pass: topLevel && declLine < writeLine && declLine < emitLine,
           detail: `decl L${declLine} < write L${writeLine} and emit L${emitLine}` };
});

// ---------------------------------------------------------------------------
cell("C8'", 'P-2 bug case (corrected perturbation): nested non-repo dir takes the undetermined path', () => {
  const nest = join(T, '.gate-c6-nested');
  rmSync(nest, { recursive: true, force: true });
  try {
    mkdirSync(join(nest, 'tools'), { recursive: true });
    mkdirSync(join(nest, 'docs'), { recursive: true });
    cpSync(join(T, 'tools/citation-rule-check.mjs'), join(nest, 'tools/citation-rule-check.mjs'));
    cpSync(join(T, 'docs/node-support-citation-history.md'), join(nest, 'docs/node-support-citation-history.md'));
    cpSync(join(T, 'README.md'), join(nest, 'README.md'));
    note('nested dir has its own .git? ' + existsSync(join(nest, '.git')) + ' (must be false)');
    const top = sh('git', ['rev-parse', '--show-toplevel'], { cwd: nest }).stdout.trim();
    note('`git rev-parse --show-toplevel` from it -> ' + top);
    note('resolves to the ANCESTOR repo (the bug precondition): ' + (top === T));

    const rmText = readFileSync(join(nest, 'README.md'), 'utf8');
    const histText = readFileSync(join(nest, 'docs/node-support-citation-history.md'), 'utf8');
    const p = perturbInsideQuote(rmText, histText);
    writeFileSync(join(nest, 'README.md'), p.out);
    note(`perturbation: "Actions run ${p.from}" -> "Actions run ${p.to}" (inside the quoted region)`);
    // DEFECT 2 correction: prove the perturbation reached the attribution branch,
    // i.e. the heading still exists, BEFORE reading any verdict off the run.
    const headingIntact = p.out.includes('\n### Node support\n');
    note('heading "### Node support" still intact after perturbation: ' + headingIntact +
         '  <- the original cell broke this and short-circuited at the no-section branch');

    const r = sh('node', ['tools/citation-rule-check.mjs'], { cwd: nest });
    const out = r.stdout + r.stderr;
    note('exit ' + r.status + '; output:');
    for (const l of out.split('\n').filter(Boolean).slice(0, 3)) note('  [' + l + ']');
    const noSectionBranch = /has no "### Node support" section/.test(out);
    const claimsOwnHead = /own git HEAD version/.test(out);
    const undetermined = /could not be determined/.test(out);
    note('hit the no-section short-circuit: ' + noSectionBranch + ' (must be false)');
    note('asserts "own git HEAD version": ' + claimsOwnHead + ' (must be false — this is P-2)');
    note('takes the undetermined-direction path: ' + undetermined + ' (must be true)');
    return { pass: top === T && headingIntact && !noSectionBranch && !claimsOwnHead && undetermined,
             detail: `ancestor=${top === T} reached=${!noSectionBranch} ownHead=${claimsOwnHead} undetermined=${undetermined}` };
  } finally { rmSync(nest, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------
cell("C9'", 'P-2 converse control (corrected): an own-toplevel clone STILL names the side that moved', () => {
  const clone = '/tmp/gate-c6-clone';
  rmSync(clone, { recursive: true, force: true });
  try {
    note('clone exit ' + spawnSync('git', ['clone', '--quiet', T, clone], { encoding: 'utf8' }).status);
    const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: clone, encoding: 'utf8' }).stdout.trim();
    note('clone toplevel: ' + top + ' (IS its own root: ' + (top === clone) + ')');
    cpSync(join(T, 'tools/citation-rule-check.mjs'), join(clone, 'tools/citation-rule-check.mjs'));
    const base = spawnSync('node', ['tools/citation-rule-check.mjs'], { cwd: clone, encoding: 'utf8' });
    note('unperturbed clone: exit ' + base.status + ' | ' + (base.stdout + base.stderr).split('\n')[0]);

    const rmPath = join(clone, 'README.md');
    const p = perturbInsideQuote(readFileSync(rmPath, 'utf8'),
      readFileSync(join(clone, 'docs/node-support-citation-history.md'), 'utf8'));
    writeFileSync(rmPath, p.out);
    note(`perturbation: "Actions run ${p.from}" -> "Actions run ${p.to}"; heading intact: ` +
         p.out.includes('\n### Node support\n'));
    const r = spawnSync('node', ['tools/citation-rule-check.mjs'], { cwd: clone, encoding: 'utf8' });
    const out = r.stdout + r.stderr;
    note('own-toplevel README-side perturbation: exit ' + r.status);
    for (const l of out.split('\n').filter(Boolean).slice(0, 2)) note('  [' + l + ']');
    const namesReadme = /README\.md has diverged/.test(out);
    const usesGitAnchor = /own git HEAD version/.test(out);
    const degraded = /could not be determined/.test(out);
    note('names README as the side that moved : ' + namesReadme + ' (must be true)');
    note('still uses and NAMES the git anchor : ' + usesGitAnchor + ' (must be true)');
    note('degraded to "undetermined"          : ' + degraded + ' (must be false)');
    note('=> the P-2 fix is narrow: it suppresses the anchor ONLY when the toplevel is foreign.');
    return { pass: base.status === 0 && namesReadme && usesGitAnchor && !degraded,
             detail: `control=${base.status} names=${namesReadme} anchor=${usesGitAnchor} degraded=${degraded}` };
  } finally { rmSync(clone, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------
cell("C11'", 'Full test_cmd green (reporter-format corrected), and the 129 -> 128 count drop reconciled', () => {
  const r = spawnSync('bash', ['-lc', `cd ${T} && node --test test/*.test.js 2>&1 | tail -12`],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  note(r.stdout.trimEnd());
  // DEFECT 3 correction: accept either reporter marker; an UNPARSED count is its
  // own failure mode ("could not read the suite"), never a failing count.
  const grab = (word) => {
    const m = new RegExp(String.raw`(?:^|\n)\s*(?:#|ℹ)\s+${word}\s+(\d+)`).exec(r.stdout);
    return m ? +m[1] : null;
  };
  const pass = grab('pass'), fail = grab('fail'), tests = grab('tests');
  note(`parsed: tests=${tests} pass=${pass} fail=${fail}` +
       (pass === null ? '  <- UNPARSED: that is a gate failure, not a suite failure' : ''));
  if (pass === null || fail === null) return { pass: false, detail: 'could not read the suite counts' };
  // Reconcile against the run baseline recorded in state.json.
  note('run baseline (commit 20b7ede, state.json): 129 tests / 129 pass / 0 fail');
  note(`HEAD now: ${tests} tests / ${pass} pass / ${fail} fail  -> delta ${tests - 129}`);
  note('The -1 is W-7 (cycle 4): two guards reading the same "Tags on exactly one entry" row');
  note('were consolidated into one, closing KI-R6-3. Corroborated INDEPENDENTLY by the C4');
  note('identity control, which measured the suite on two untouched scratch clones:');
  note('  baseline 20b7ede -> 129 tests / 129 pass / 0 fail / 0 skipped  verdict GREEN');
  note('  HEAD     e40736c -> 128 tests / 128 pass / 0 fail / 0 skipped  verdict GREEN');
  note('Per must-have S-1, a test-count DROP is a PASS, not a regression.');
  return { pass: fail === 0 && pass === tests && tests === 128,
           detail: `${pass}/${tests} passing, ${fail} failing; -1 vs baseline, attributed to W-7` };
});

// ---------------------------------------------------------------------------
cell("C12'", 'W-6 standing invariant, restated as a rule this repo can actually satisfy', () => {
  const CORPUS = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';
  const HELP = 'd759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64';
  const corpus = sha256(readFileSync(join(T, 'src/corpus.js')));
  const help = sha256(sh('node', ['bin/aphorism.js', '--help']).stdout);
  note('corpus sha256 : ' + corpus + (corpus === CORPUS ? '  == baseline' : '  != BASELINE'));
  note('--help sha256 : ' + help + (help === HELP ? '  == baseline' : '  != BASELINE'));

  const stLines = sh('git', ['status', '--porcelain', '--', 'src', 'bin', 'test', '.github',
    'README.md', 'docs']).stdout.split('\n').filter((l) => l.length > 0);
  note('frozen-pathspec status lines: ' + (stLines.length === 0 ? '(none)' : ''));
  for (const l of stLines) note('  [' + l + ']');

  // DEFECT 4 correction. The dependency surface of THIS repo is the ABSENCE of a
  // manifest, not the contents of one. Check what is actually true of it.
  const MANIFESTS = ['package.json', 'package-lock.json', 'npm-shrinkwrap.json',
                     'yarn.lock', 'pnpm-lock.yaml', 'node_modules'];
  const tracked = sh('git', ['ls-files']).stdout.split('\n').filter(Boolean);
  const trackedManifests = tracked.filter((p) => MANIFESTS.includes(p.split('/').pop()) &&
                                                 !p.startsWith('.swarm/'));
  const onDisk = MANIFESTS.filter((m) => existsSync(join(T, m)));
  note('manifests/lockfiles tracked in git (excluding .swarm/ run archives): ' + JSON.stringify(trackedManifests));
  note('manifests/lockfiles present on disk at the repo root: ' + JSON.stringify(onDisk));
  note('=> zero-dependency here means MANIFEST-LESS. The original cell read package.json,');
  note('   which has never existed, and reported the invariant violated on an ENOENT.');

  const imports = spawnSync('bash', ['-lc', `cd ${T} && grep -rhoE "from '[^']+'" tools/*.mjs | sort -u`],
    { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
  const isBuiltin = (l) => /from 'node:/.test(l);
  note('imports under tools/:'); for (const l of imports) note('   ' + l + (isBuiltin(l) ? '' : '   <- NOT a builtin'));
  const nonNode = imports.filter((l) => !isBuiltin(l));

  // Converse control (R4): the classifier must REJECT these.
  const mustReject = ["from 'lodash'", "from './helper.js'", "from 'node_modules/x'"];
  const rejected = mustReject.filter((l) => !isBuiltin(l));
  note('converse control — must reject ' + JSON.stringify(mustReject) + ' -> rejected ' + rejected.length + '/3');

  const pass = corpus === CORPUS && help === HELP && stLines.length === 0 &&
               trackedManifests.length === 0 && onDisk.length === 0 &&
               nonNode.length === 0 && rejected.length === 3;
  return { pass, detail: `corpus/help frozen, ${stLines.length} frozen-path changes, ` +
    `${trackedManifests.length} manifests, ${nonNode.length} non-builtin imports` };
});

// ---------------------------------------------------------------------------
note('\n' + '#'.repeat(78));
note('CYCLE 6 GATE ADDENDUM SUMMARY');
note('#'.repeat(78));
for (const c of cells) note(`${c.verdict.padEnd(4)} ${c.id.padEnd(5)} ${c.title}`);
const failed = cells.filter((c) => c.verdict !== 'PASS');
note(`\n${cells.length - failed.length}/${cells.length} corrected cells PASS`);
note('Combined with the original gate\'s cells that stood (C1 C3 C4 C5 C6 C7 C10),');
note('the cycle-6 verdict rests on 12 cells, 4 of which had to be re-taken because');
note('the conductor\'s own instrument, not the dispatched work, was wrong.');
process.exit(failed.length === 0 ? 0 : 1);
