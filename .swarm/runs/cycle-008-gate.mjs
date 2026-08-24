#!/usr/bin/env node
// cycle-008-gate.mjs — the conductor's verification gate for cycle 8, item W-10.
//
// STANDING HAZARD, named here as a rule rather than remembered (D-R8-9, D-R8-10,
// D-R8-15, D-R8-17: five consecutive cycles of defects in the conductor's OWN
// one-shot instruments, eight distinct root causes). The defences below are the
// specific corrections, each stated so a reader can check the instrument itself:
//
//   1. `git status --porcelain` is split into LINES BEFORE any trim, and the path
//      is taken as line.slice(3). Trimming whole stdout first ate the leading space
//      of the first line's two-character status column in cycle 4.
//   2. Every status line is printed BRACKETED, so a column-eating bug is visible in
//      the evidence rather than only inferable from a wrong verdict (cycle 5).
//   3. Cells state RULES, never point-in-time snapshots. C1 does not hardcode the
//      dirty set; it classifies each dirty path against the builder's declared
//      scope, and carries a converse control naming paths the rule must REJECT
//      (cycle 5: a snapshot masquerading as an invariant failed the moment step 7
//      wrote .swarm/state.json).
//   4. `node --test`'s default reporter emits 'ℹ pass N', NOT TAP's '# pass N'.
//      Cycle 6 parsed the TAP form and read -1 for a suite whose own output, three
//      lines above the verdict, said pass 128 (cycle 6).
//   5. This repo has NEVER had a package.json. Being manifest-less IS its
//      zero-dependency surface, so C7 asserts ABSENCE, not contents (cycle 6).
//   6. No whole-file findIndex / first-match regex is used to locate a subject that
//      may legitimately occur more than once (cycle 6).
//   7. THIS CYCLE'S OWN DEFECT, named here rather than silently repaired. C5's first
//      draft cloned the target repo and then invoked `<clone>/tools/test-line-delta.mjs`
//      — but that tool is the work under test and is still UNTRACKED at verification
//      time, so `git clone` (which carries tracked content only) produced a clone
//      without it and the cell died on MODULE_NOT_FOUND, taking the whole gate with it
//      before C5..C13 ever returned a verdict. The subject of the perturbation is the
//      TOOL's behaviour against different git trees, so the fix is to copy the working
//      tree's tool into the clone explicitly and assert it arrived. Ninth distinct
//      root cause across six consecutive cycles of conductor-instrument defects; the
//      constant is not any bug class, it is that one-shot instruments are written once,
//      run once, and reviewed by nobody. See D-R8-20.
//
// Raw evidence is printed next to every verdict. Two of cycle 6's four instrument
// defects were caught ONLY because the raw output visibly contradicted the verdict.

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

const T = '/opt/targets/aphorism-cli';
const cells = [];
function cell(id, title, verdict, evidence) {
  cells.push({ id, title, verdict });
  console.log(`\n${'='.repeat(78)}\n${id} — ${title}\n${'='.repeat(78)}`);
  if (evidence) console.log(evidence.trimEnd());
  console.log(`  --> ${id}: ${verdict}`);
}
function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...opts });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const git = (...a) => sh('git', ['-C', T, ...a]);

// --------------------------------------------------------------------------
// C1 — builder write scope, stated as a RULE with a converse control
// --------------------------------------------------------------------------
{
  const raw = git('status', '--porcelain').out;
  const lines = raw.split('\n').filter((l) => l.length > 0); // split BEFORE any trim
  const paths = lines.map((l) => l.slice(3));
  // The RULE (not a snapshot): W-10's declared builder scope is REPORT.md plus
  // anything under tools/. Every .swarm/ path is the conductor's own.
  const inScope = (p) => p === 'REPORT.md' || p.startsWith('tools/') || p.startsWith('.swarm/');
  const violations = paths.filter((p) => !inScope(p));
  // Converse control: the classifier must REJECT these three.
  const mustReject = ['src/corpus.js', 'test/args.test.js', '.github/workflows/test.yml'];
  const rejected = mustReject.filter((p) => !inScope(p));
  const ev = [
    'raw `git status --porcelain`, one line per row, BRACKETED so a column-eating parse is visible:',
    ...lines.map((l) => `  [${l}]`),
    `parsed paths: ${JSON.stringify(paths)}`,
    `out-of-scope paths: ${JSON.stringify(violations)}`,
    `converse control — rule must reject ${JSON.stringify(mustReject)}: rejected ${rejected.length}/3`,
  ].join('\n');
  cell('C1', 'every dirty path is inside W-10 builder scope (REPORT.md, tools/) or conductor-owned (.swarm/)',
    violations.length === 0 && rejected.length === 3 ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C2 — the citation pathspec is untouched: no citation window opened
// --------------------------------------------------------------------------
{
  const SPEC = ['src', 'bin', 'test', '.github', 'README.md'];
  const st = git('status', '--porcelain', '--', ...SPEC).out;
  const df = git('diff', '--stat', '--', ...SPEC).out;
  const dfc = git('diff', '--cached', '--stat', '--', ...SPEC).out;
  const ev = [
    `git status --porcelain -- ${SPEC.join(' ')}:`, `  [${st.replace(/\n/g, '\\n')}]`,
    'git diff --stat over the same pathspec:', `  [${df.replace(/\n/g, '\\n')}]`,
    'git diff --cached --stat over the same pathspec:', `  [${dfc.replace(/\n/g, '\\n')}]`,
    'S-8 permits ONE citation window this run; it was spent in cycle 4 (02f4668 open, 4980f3a close).',
  ].join('\n');
  cell('C2', 'no commit this cycle can open a second citation window — pathspec byte-clean',
    st === '' && df === '' && dfc === '' ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C3 — the line delta, re-derived by the conductor from git objects directly
//      (NOT by running the builder's tool)
// --------------------------------------------------------------------------
let CONDUCTOR_DELTA = null;
{
  function totalAt(rev) {
    const files = git('ls-tree', '-r', '--name-only', rev, '--', 'test').out
      .split('\n').filter((f) => f.endsWith('.test.js')).sort();
    let total = 0; const per = {};
    for (const f of files) {
      const c = git('show', `${rev}:${f}`).out;
      const n = c.length === 0 ? 0 : c.split('\n').length - (c.endsWith('\n') ? 1 : 0);
      per[f] = n; total += n;
    }
    return { files, per, total };
  }
  const b = totalAt('20b7ede'); const a = totalAt('HEAD');
  CONDUCTOR_DELTA = a.total - b.total;
  const touching = git('log', '--oneline', '20b7ede..HEAD', '--', 'test').out.trim();
  const numstat = git('show', '--numstat', '--format=', '02f4668', '--', 'test').out.trim();
  // The report's claims, read as literals from the document itself.
  const rep = readFileSync(path.join(T, 'REPORT.md'), 'utf8');
  const claimsBefore = rep.includes('4,587') && rep.includes('4587');
  const claimsAfter = rep.includes('4,666') && rep.includes('4666');
  const claimsDelta = rep.includes('+79');
  const claimsItem = /W-7/.test(rep) && rep.includes('02f4668');
  const ev = [
    'conductor re-derivation (git ls-tree + git show; the builder tool was NOT invoked):',
    `  baseline 20b7ede: ${b.total} lines over ${b.files.length} files`,
    `  HEAD:             ${a.total} lines over ${a.files.length} files`,
    `  delta:            ${CONDUCTOR_DELTA >= 0 ? '+' : ''}${CONDUCTOR_DELTA}`,
    `  per-file movers:  ${JSON.stringify(Object.fromEntries(a.files.filter((f) => a.per[f] !== b.per[f]).map((f) => [f, `${b.per[f]}->${a.per[f]}`])))}`,
    `  commits touching test/ in 20b7ede..HEAD:`,
    ...touching.split('\n').map((l) => `    ${l}`),
    `  numstat for 02f4668 over test/: ${numstat}`,
    '',
    `REPORT.md carries 4,587/4587: ${claimsBefore}; 4,666/4666: ${claimsAfter}; +79: ${claimsDelta}; names W-7 and 02f4668: ${claimsItem}`,
  ].join('\n');
  const ok = b.total === 4587 && a.total === 4666 && CONDUCTOR_DELTA === 79
    && touching.split('\n').length === 1 && touching.includes('02f4668')
    && claimsBefore && claimsAfter && claimsDelta && claimsItem;
  cell('C3', 'REPORT.md\'s before/after/delta matches the conductor\'s own independent measurement, attributed to the one commit that produced it', ok ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C4 — the new tool agrees with the conductor's independent number
// --------------------------------------------------------------------------
{
  const r = sh('node', [path.join(T, 'tools/test-line-delta.mjs'), '--json'], { cwd: T });
  let j = null; try { j = JSON.parse(r.out); } catch (e) { /* leave null */ }
  const ev = [
    `exit ${r.code}`,
    `tool --json: baseline ${j?.baseline?.totalLines} target ${j?.target?.totalLines} delta ${j?.delta}`,
    `conductor's own number (C3): ${CONDUCTOR_DELTA}`,
    `touchingCommits: ${JSON.stringify(j?.touchingCommits)}`,
  ].join('\n');
  cell('C4', 'tools/test-line-delta.mjs reproduces the conductor\'s independently-derived delta',
    r.code === 0 && j && j.delta === CONDUCTOR_DELTA && j.baseline.totalLines === 4587 && j.target.totalLines === 4666 ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C5 — FAILABILITY, by the conductor's OWN perturbation, in directions the
//      builder never tested (a 46-line addition, then a whole-file REMOVAL —
//      the builder only ever tested +1 line and two zero cases)
// --------------------------------------------------------------------------
{
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'gate-c8-'));
  const clone = path.join(tmp, 'probe');
  const c = (...a) => sh('git', ['-C', clone, ...a]);
  const lines = [];
  const cl = sh('git', ['clone', '-q', T, clone]);
  lines.push(`clone exit ${cl.code} -> ${clone}`);
  sh('git', ['-C', clone, 'config', 'user.email', 'gate@local']);
  sh('git', ['-C', clone, 'config', 'user.name', 'gate']);
  // Defence 7 (see header): the tool under test is UNTRACKED at verification time,
  // so the clone does not carry it. Copy it in from the working tree and PROVE it
  // arrived — the first draft of this cell died on MODULE_NOT_FOUND here.
  const toolSrc = path.join(T, 'tools/test-line-delta.mjs');
  const toolDst = path.join(clone, 'tools/test-line-delta.mjs');
  lines.push(`  tool tracked by git? ${git('ls-files', '--', 'tools/test-line-delta.mjs').out.trim() === '' ? 'NO (untracked — clone cannot carry it)' : 'yes'}`);
  writeFileSync(toolDst, readFileSync(toolSrc));
  lines.push(`  copied working-tree tool into clone: exists=${existsSync(toolDst)} bytes_match=${readFileSync(toolDst).length === readFileSync(toolSrc).length}`);

  // Perturbation 1: add a test file with EXACTLY 46 lines (a number the builder
  // never used, and not derivable from anything the tool could hardcode).
  const N_ADD = 46;
  writeFileSync(path.join(clone, 'test', 'gate-probe.test.js'), Array.from({ length: N_ADD }, (_, i) => `// gate probe line ${i + 1}`).join('\n') + '\n');
  c('add', 'test/gate-probe.test.js');
  c('commit', '-q', '-m', 'gate probe: add a 46-line test file');
  const sha1 = c('rev-parse', 'HEAD').out.trim();
  // Parse defensively and SHOW the failure — a cell that dies silently teaches nothing.
  const runTool = (target) => {
    const r = sh('node', [toolDst, '--baseline', '20b7ede', '--target', target, '--json'], { cwd: clone });
    if (r.code !== 0 || !r.out.trim()) {
      lines.push(`  tool invocation FAILED for target ${target}: exit ${r.code}`);
      lines.push(`  stderr: ${r.err.split('\n').slice(0, 6).join(' | ')}`);
      return null;
    }
    try { return JSON.parse(r.out); } catch (e) {
      lines.push(`  tool output for ${target} is not JSON: ${JSON.stringify(r.out.slice(0, 200))}`);
      return null;
    }
  };
  const j1 = runTool(sha1);
  const want1 = 79 + N_ADD; // 4666 + 46 - 4587

  // Perturbation 2: REMOVE a whole file (298 lines) — drives the delta NEGATIVE,
  // a direction no earlier check exercised.
  const N_DEL = 298; // test/select.test.js at HEAD, per C3's census
  const rmR = c('rm', '-f', 'test/select.test.js');
  lines.push(`  git rm exit ${rmR.code} ${rmR.err.trim()}`);
  c('commit', '-q', '-m', 'gate probe: remove test/select.test.js');
  const sha2 = c('rev-parse', 'HEAD').out.trim();
  const j2 = runTool(sha2);
  const want2 = 79 + N_ADD - N_DEL;

  // Control that must stay steady: identity comparison is 0 on the same clone.
  const j3 = runTool('20b7ede');

  const deltas = [j1?.delta, j2?.delta, j3?.delta];
  lines.push(`  perturbation 1 (+${N_ADD}-line file): tool delta ${j1?.delta}, expected ${want1} -> ${j1?.delta === want1 ? 'MATCH' : 'MISMATCH'}`);
  lines.push(`  perturbation 2 (also -${N_DEL}-line file): tool delta ${j2?.delta}, expected ${want2} -> ${j2?.delta === want2 ? 'MATCH' : 'MISMATCH'}   [NEGATIVE direction, untested by the builder]`);
  lines.push(`  removedFiles reported at perturbation 2: ${JSON.stringify(j2?.removedFiles)}`);
  lines.push(`  control (identity 20b7ede..20b7ede): tool delta ${j3?.delta}, expected 0 -> ${j3?.delta === 0 ? 'MATCH' : 'MISMATCH'}   [a check that dies on everything is not an assertion]`);
  lines.push(`  the run's headline +79 was NOT printed for any of the three: ${deltas.every((d) => d !== 79)}`);
  rmSync(tmp, { recursive: true, force: true });
  lines.push(`  scratch clone removed: ${!existsSync(tmp)}`);
  const ok = j1 && j2 && j3 && j1.delta === want1 && j2.delta === want2 && j3.delta === 0 && deltas.every((d) => d !== 79);
  cell('C5', 'the tool is a MEASUREMENT, not a constant — conductor\'s own perturbations, including a negative direction, plus a green control', ok ? 'PASS' : 'FAIL', lines.join('\n'));
}

// --------------------------------------------------------------------------
// C6 — the suite, parsed from the reporter format node --test ACTUALLY emits
// --------------------------------------------------------------------------
{
  const r = sh('node', ['--test', 'test/args.test.js', 'test/cli.test.js', 'test/node-support-citation.test.js', 'test/pipe.test.js', 'test/readme-matrix-consistency.test.js', 'test/readme-tags.test.js', 'test/select.test.js'], { cwd: T });
  const all = r.out + r.err;
  const grab = (k) => {
    const m = all.match(new RegExp(`^[^\\S\\n]*[ℹ#]\\s*${k}\\s+(\\d+)\\s*$`, 'm'));
    return m ? Number(m[1]) : -1;
  };
  const tests = grab('tests'), pass = grab('pass'), fail = grab('fail'), skipped = grab('skipped');
  const ev = [
    'raw summary lines from node --test, verbatim (the reporter emits U+2139, not TAP "#"):',
    ...all.split('\n').filter((l) => /^\s*[ℹ#]\s*(tests|pass|fail|skipped|todo|duration_ms)/.test(l)).map((l) => `  [${l}]`),
    `parsed: tests=${tests} pass=${pass} fail=${fail} skipped=${skipped}  exit=${r.code}`,
  ].join('\n');
  cell('C6', 'suite green at the working tree (128/128/0/0)',
    r.code === 0 && tests === 128 && pass === 128 && fail === 0 && skipped === 0 ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C7 — S-8 invariants: corpus + --help sha, and the manifest-less surface
//      (asserted as ABSENCE — this repo has never had a package.json)
// --------------------------------------------------------------------------
{
  const sha = (b) => createHash('sha256').update(b).digest('hex');
  const corpus = sha(readFileSync(path.join(T, 'src/corpus.js')));
  const help = sha(Buffer.from(sh('node', [path.join(T, 'bin/aphorism.js'), '--help'], { cwd: T }).out));
  const WANT_C = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';
  const WANT_H = 'd759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64';
  const trackedManifests = git('ls-files', '--', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json').out.trim();
  const onDisk = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'node_modules'].filter((f) => existsSync(path.join(T, f)));
  // tools/ import classifier + converse control
  const toolFiles = sh('ls', [path.join(T, 'tools')]).out.split('\n').filter((f) => f.endsWith('.mjs'));
  const bad = [];
  let importCount = 0;
  for (const f of toolFiles) {
    const src = readFileSync(path.join(T, 'tools', f), 'utf8');
    for (const m of src.matchAll(/^\s*import\s+[^'"]*from\s+['"]([^'"]+)['"]/gm)) {
      importCount++; if (!m[1].startsWith('node:')) bad.push(`${f}: ${m[1]}`);
    }
  }
  const classifier = (s) => s.startsWith('node:');
  const mustReject = ['lodash', '../src/corpus.js', './helper.mjs'];
  const rejected = mustReject.filter((s) => !classifier(s));
  const ev = [
    `src/corpus.js sha256 = ${corpus}`, `                 want = ${WANT_C}  -> ${corpus === WANT_C ? 'UNMOVED' : 'MOVED'}`,
    `--help       sha256 = ${help}`, `                 want = ${WANT_H}  -> ${help === WANT_H ? 'UNMOVED' : 'MOVED'}`,
    `manifests/lockfiles tracked by git: [${trackedManifests}]  (expected: none — manifest-less IS the zero-dep surface)`,
    `manifests/node_modules present on disk: ${JSON.stringify(onDisk)}`,
    `tools/*.mjs scanned: ${toolFiles.length} files, ${importCount} import statements, non-node: imports: ${JSON.stringify(bad)}`,
    `converse control — classifier must reject ${JSON.stringify(mustReject)}: rejected ${rejected.length}/3`,
  ].join('\n');
  cell('C7', 'S-8 standing invariants hold: both sha unmoved, no manifest, tools/ imports node: builtins only',
    corpus === WANT_C && help === WANT_H && trackedManifests === '' && onDisk.length === 0 && bad.length === 0 && rejected.length === 3 ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C8 — every executable REPORT.md names under tools/ actually exists and runs
// --------------------------------------------------------------------------
{
  const rep = readFileSync(path.join(T, 'REPORT.md'), 'utf8');
  const named = [...new Set([...rep.matchAll(/tools\/[A-Za-z0-9_.-]+\.(mjs|json)/g)].map((m) => m[0]))].sort();
  const missing = named.filter((f) => !existsSync(path.join(T, f)));
  const ev = [
    `executables/artifacts REPORT.md names under tools/ (${named.length}):`,
    ...named.map((f) => `  ${existsSync(path.join(T, f)) ? 'EXISTS ' : 'MISSING'} ${f}`),
    `missing: ${JSON.stringify(missing)}`,
  ].join('\n');
  cell('C8', 'no finding cites an executable that does not exist (S-6: nothing is prose-only)',
    named.length >= 7 && missing.length === 0 ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C9 — the dispatcher still works after the new registration
// --------------------------------------------------------------------------
{
  const r = sh('node', [path.join(T, 'tools/run-all.mjs')], { cwd: T, timeout: 900000 });
  const all = r.out + r.err;
  const slotLines = all.split('\n').filter((l) => /\[\d\/\d\]/.test(l));
  const hasDelta = /test-line-delta/.test(all);
  const tail = all.trimEnd().split('\n').slice(-14);
  const ev = [
    `exit ${r.code}`,
    `slot headings seen (${slotLines.length}):`,
    ...slotLines.map((l) => `  [${l.trim()}]`),
    `mentions test-line-delta: ${hasDelta}`,
    'roll-up tail, verbatim:',
    ...tail.map((l) => `  ${l}`),
  ].join('\n');
  cell('C9', 'tools/run-all.mjs exits 0 with the new tool registered as a slot',
    r.code === 0 && hasDelta && slotLines.length >= 7 ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C10 — the S-7 escalation: one paragraph, all three changes, launchable,
//       stated ONCE. Structural markers the document owns, not regex on prose.
// --------------------------------------------------------------------------
{
  const rep = readFileSync(path.join(T, 'REPORT.md'), 'utf8');
  const secStart = rep.indexOf('\n## The S-7 escalation\n');
  const rest = rep.slice(secStart + 1);
  const nextH2 = rest.indexOf('\n## ', 1);
  const sec = nextH2 === -1 ? rest : rest.slice(0, nextH2);
  // the launchable brief is the blockquote the section owns
  const quoteLines = sec.split('\n').filter((l) => l.startsWith('> '));
  const quoteBlocks = sec.split('\n').reduce((acc, l) => {
    const isQ = l.startsWith('>');
    if (isQ && (acc.length === 0 || !acc[acc.length - 1].open)) acc.push({ open: true, n: 1 });
    else if (isQ) acc[acc.length - 1].n++;
    else if (acc.length) acc[acc.length - 1].open = false;
    return acc;
  }, []);
  const brief = quoteLines.map((l) => l.slice(2)).join(' ');
  const covers = {
    'corpus depth': /corpus/i.test(brief) && /50/.test(brief),
    'voice concentration (TS-3)': /34%/.test(brief) && /Dijkstra/.test(brief),
    'no-repeat rotation': /no-repeat rotation/i.test(brief),
    '--tag discoverability': /--tag/.test(brief) && /discoverab/i.test(brief),
    'cites TS ids': ['TS-1', 'TS-2', 'TS-3', 'TS-6'].every((t) => brief.includes(t)),
    'imperative to a builder (not a complaint)': /^Lift\b/.test(brief) || /^(Add|Grow|Make|Lift|Ship|Extend)\b/.test(brief),
  };
  // "stated once": the launchable brief text must not be duplicated elsewhere.
  const fingerprint = brief.slice(0, 60);
  const occurrences = rep.split(fingerprint).length - 1;
  const ev = [
    `section "## The S-7 escalation" found at offset ${secStart}, ${sec.split('\n').length} lines`,
    `blockquote blocks in the section: ${quoteBlocks.length} (must be exactly 1 — "a single paragraph")`,
    `brief length: ${brief.length} chars, ${quoteLines.length} quoted lines`,
    ...Object.entries(covers).map(([k, v]) => `  ${v ? 'YES' : 'NO '}  ${k}`),
    `fingerprint "${fingerprint}..." occurs ${occurrences}x in REPORT.md (must be 1 — "stated once, never re-derived elsewhere")`,
    '',
    'the brief text, verbatim, as a reader would paste it:',
    ...quoteLines.map((l) => `  ${l}`),
  ].join('\n');
  const ok = secStart !== -1 && quoteBlocks.length === 1 && Object.values(covers).every(Boolean) && occurrences === 1;
  cell('C10', 'S-7: one paragraph, all three changes, cites TS ids, reads as an instruction, stated once', ok ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C11 — the escalation's cited numbers exist in the backlog (CITED, not invented)
// --------------------------------------------------------------------------
{
  const bl = readFileSync(path.join(T, '.swarm/backlog.json'), 'utf8');
  const items = JSON.parse(bl).items;
  const blob = (id) => { const i = items.find((x) => x.id === id); return i ? JSON.stringify(i) : ''; };
  const checks = [
    ['TS-1 median first repeat at draw 9', /draw 9|9th draw/.test(blob('TS-1'))],
    ['TS-1 P(repeat by 12) = 76.2%', /76\.2/.test(blob('TS-1'))],
    ['TS-3 Dijkstra 7 / Perlis 5 / Pike 5', /Dijkstra 7/.test(blob('TS-3')) && /Perlis 5/.test(blob('TS-3')) && /Pike 5/.test(blob('TS-3'))],
    ['TS-3 34% of the corpus', /34%/.test(blob('TS-3'))],
    ['TS-2 five pools <= 4 entries', /<= 4|≤ 4/.test(blob('TS-2'))],
    ['TS-6 jq / byte-identical unknown tag', /jq/.test(blob('TS-6'))],
  ];
  const ev = checks.map(([k, v]) => `  ${v ? 'FOUND    ' : 'NOT FOUND'} ${k}`).join('\n')
    + `\n  (each number the escalation prints is looked up in .swarm/backlog.json; the clause says CITE, not re-derive)`;
  cell('C11', 'every number the S-7 escalation prints is on the backlog record, not manufactured',
    checks.every(([, v]) => v) ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C12 — must-have table honesty: exactly S-1..S-8, each with a legal status
// --------------------------------------------------------------------------
{
  const rep = readFileSync(path.join(T, 'REPORT.md'), 'utf8');
  const rows = rep.split('\n').filter((l) => /^\|\s*\*\*S-\d\*\*/.test(l));
  const LEGAL = ['shipped', 'held', 'NOT-RUN', 'blocked'];
  const parsed = rows.map((l) => {
    const cols = l.split('|').map((c) => c.trim());
    const id = (cols[1].match(/S-\d/) || [''])[0];
    const status = cols[2].replace(/\*/g, '').trim();
    return { id, status, legal: LEGAL.includes(status), evidenceLen: (cols[3] || '').length };
  });
  const ids = parsed.map((p) => p.id).sort();
  const want = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6', 'S-7', 'S-8'];
  const ev = [
    ...parsed.map((p) => `  ${p.id}  status=${JSON.stringify(p.status)} legal=${p.legal} evidence_chars=${p.evidenceLen}`),
    `ids present: ${JSON.stringify(ids)}`,
    `expected:    ${JSON.stringify(want)}`,
    `legal status vocabulary: ${JSON.stringify(LEGAL)}`,
  ].join('\n');
  const ok = JSON.stringify(ids) === JSON.stringify(want) && parsed.every((p) => p.legal && p.evidenceLen > 40);
  cell('C12', 'all eight must-haves appear, each with a legal status word and real evidence', ok ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
// C13 — no scratch tree survives; the run's commit count claim is true
// --------------------------------------------------------------------------
{
  const scratch = sh('ls', ['-a', T]).out.split('\n').filter((f) => /scratch/i.test(f));
  const rep = readFileSync(path.join(T, 'REPORT.md'), 'utf8');
  const n = git('rev-list', '--count', '912a2a4..d899fe0').out.trim();
  const claimed = (rep.match(/\*\*(\d+) commits?, `912a2a4`\.\.`d899fe0`\*\*|\((\d+) commits, `912a2a4`\.\.`d899fe0`\)/) || [])
    .slice(1).find(Boolean);
  const ev = [
    `scratch dirs in target root: ${JSON.stringify(scratch)}`,
    `git rev-list --count 912a2a4..d899fe0 = ${n}`,
    `REPORT.md claims: ${claimed ?? '(no parse)'} — raw line: ${(rep.split('\n').find((l) => l.includes('912a2a4')) || '').trim()}`,
  ].join('\n');
  cell('C13', 'no scratch tree left behind; the report\'s commit count is the real one',
    scratch.length === 0 && String(n) === String(claimed) ? 'PASS' : 'FAIL', ev);
}

// --------------------------------------------------------------------------
console.log(`\n${'#'.repeat(78)}`);
const pass = cells.filter((c) => c.verdict === 'PASS').length;
for (const c of cells) console.log(`${c.verdict.padEnd(5)} ${c.id}  ${c.title}`);
console.log(`\nGATE: ${pass}/${cells.length} cells PASS`);
process.exit(pass === cells.length ? 0 : 1);
