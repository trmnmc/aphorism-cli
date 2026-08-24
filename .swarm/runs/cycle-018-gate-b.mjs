#!/usr/bin/env node
// cycle-018 verification gate — authored and sha256-sealed BEFORE either builder
// was dispatched. Builders were given acceptance clauses only; neither saw this file.
//
// Wave: RV-8 (tools/mutation-matrix.mjs) + P-5 (tools/guard-inventory.mjs).
//
// Design notes, written before the run:
//  - Cycle 17's gate crashed on a package.json this repo has never had. W6-4 here
//    treats an absent manifest as the strongest form of "zero dependencies".
//  - Cycle 17's gate asserted against prose with a line-scoped regex. Every cell
//    below that touches tool output compares the tool's OWN source constants
//    against its OWN emitted text, never a regex over meaning.
//  - Every mutation cell has a converse control that must stay GREEN.
//  - A cell that cannot run reports NOT-RUN with the reason. Never PASS by default.

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const REPO = '/opt/targets/aphorism-cli';
const PREFIX = 'a15e12bc957d713187c89bef1e903478977bb7b3'; // HEAD before this wave
const BASELINE_SHA = '20b7edec2eb42cae185bdd7934f4bc6cd2899577';
const SCRATCH = '/opt/swarm/runs/gate-scratch-018';

const CORPUS_SHA = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';
const HELP_SHA = 'd759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64';

const cells = [];
function cell(id, verdict, evidence) {
  cells.push({ id, verdict, evidence: String(evidence) });
  const pad = verdict.padEnd(7);
  console.log(`  ${pad} ${id}`);
  for (const line of String(evidence).split('\n')) console.log(`          ${line}`);
}
function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
}
function sha256(buf) {
  return execFileSync('sha256sum', [], { input: buf }).toString().slice(0, 64);
}

// ---------------------------------------------------------------------------
// Sandbox literal evaluation. Evaluates a source-literal fragment from the tool
// under test with stubbed identifiers; anything unstubbed resolves to a marked
// sentinel so a cell can say WHICH identifier it could not resolve rather than
// silently reading a wrong value.
// ---------------------------------------------------------------------------
const UNSTUBBED = (name) => '<<UNSTUBBED:' + name + '>>';
function sandboxEval(exprSrc, stubs) {
  const scope = new Proxy(stubs, {
    has: () => true,
    get(t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      return UNSTUBBED(String(k));
    },
  });
  const f = new Function('__scope', 'with (__scope) { return (' + exprSrc + '); }');
  return f(scope);
}
// --- GATE-B REPAIR (the only change from sealed gate A) ---------------------
// Gate A's sandbox returned a sentinel for any identifier it had not been given
// a stub for, and RV8-1/RV8-2 came back NOT-RUN because the RV-8 fix introduced
// a new binding (`baselineFullSha`). Hand-picking a value for that binding would
// let the conductor choose the outcome, which is exactly the bias the seal
// exists to prevent. So this does not stub it: it locates the builder's OWN
// assignment in the shipped source and EXECUTES that expression against the real
// repository, with a real `git` shim matching the tool's own helper signature
// (tools/mutation-matrix.mjs:535). The value under test is therefore produced by
// the code being judged, not by the judge. Every binding resolved this way is
// printed in the cell evidence with the source text that produced it.
function realGit(cwd, args) {
  const res = execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { stdout: res, stderr: '', status: 0 };
}
// Right-hand side of `<name> = ...;` at the first assignment (not a bare `let`).
function assignmentRhs(src, name) {
  const re = new RegExp('(?<![\\w$.])' + name + '\\s*=(?!=)', 'g');
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 0, quote = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      else if (c === ';' && depth === 0) {
        return src.slice(m.index + m[0].length, i).trim();
      }
    }
  }
  return null;
}
// Resolve sentinels by re-executing the shipped source's own assignments.
function resolveBindings(src, stubs, seed) {
  const scope = { ...stubs, git: realGit, ROOT: REPO };
  const resolved = [];
  for (let round = 0; round < 4; round++) {
    let obj;
    try { obj = seed(scope); } catch (e) { return { scope, resolved, error: e.message }; }
    const missing = new Set();
    for (const v of Object.values(obj)) {
      if (typeof v !== 'string') continue;
      for (const mm of v.matchAll(/<<UNSTUBBED:([A-Za-z_$][\w$]*)>>/g)) missing.add(mm[1]);
    }
    if (!missing.size) return { scope, resolved, obj };
    for (const name of missing) {
      const rhs = assignmentRhs(src, name);
      if (rhs === null) return { scope, resolved, error: 'no assignment found for ' + name };
      try {
        scope[name] = sandboxEval('(' + rhs + ')', scope);
        resolved.push(name + ' := ' + rhs.replace(/\s+/g, ' ').slice(0, 150) + '  ->  ' + String(scope[name]));
      } catch (e) { return { scope, resolved, error: 'evaluating ' + name + ': ' + e.message }; }
    }
  }
  return { scope, resolved, error: 'bindings did not converge in 4 rounds' };
}
// --- end GATE-B REPAIR ------------------------------------------------------

// Balanced-delimiter slice starting at the first `open` at or after `from`.
function balanced(src, from, open, close) {
  const start = src.indexOf(open, from);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return { start, end: i, text: src.slice(start, i + 1) };
    }
  }
  return null;
}
function extractMeta(src) {
  const anchor = src.indexOf('const baseline = {');
  if (anchor < 0) throw new Error('no `const baseline = {` in source');
  const metaKey = src.indexOf('meta:', anchor);
  if (metaKey < 0) throw new Error('no `meta:` after `const baseline = {`');
  const b = balanced(src, metaKey, '{', '}');
  if (!b) throw new Error('unbalanced meta object literal');
  return b.text;
}
function extractLimits(src) {
  const anchor = src.indexOf('const FLOOR_PROBE_LIMITS');
  if (anchor < 0) throw new Error('no FLOOR_PROBE_LIMITS in source');
  const b = balanced(src, anchor, '[', ']');
  if (!b) throw new Error('unbalanced FLOOR_PROBE_LIMITS literal');
  return b.text;
}
// Flatten a limits entry (string, or object with string fields) to the texts a
// reader would see printed.
function limitTexts(entry) {
  if (typeof entry === 'string') return [entry];
  if (entry && typeof entry === 'object') {
    return Object.values(entry).filter((v) => typeof v === 'string' && v.length > 12);
  }
  return [];
}

console.log('=== cycle-018 gate ===');
console.log('PREFIX ' + PREFIX.slice(0, 7) + '  REPO ' + REPO);
console.log('');

// ===========================================================================
// W-6 standing invariant
// ===========================================================================
try {
  const got = sha256(fs.readFileSync(path.join(REPO, 'src/corpus.js')));
  cell('W6-1 corpus bytes unmoved', got === CORPUS_SHA ? 'PASS' : 'FAIL',
    'sha256 ' + got.slice(0, 16) + '…  expected ' + CORPUS_SHA.slice(0, 16) + '…');
} catch (e) { cell('W6-1 corpus bytes unmoved', 'NOT-RUN', e.message); }

try {
  const out = sh('node bin/aphorism.js --help');
  const got = sha256(Buffer.from(out));
  cell('W6-2 --help bytes unmoved', got === HELP_SHA ? 'PASS' : 'FAIL',
    'sha256 ' + got.slice(0, 16) + '…  expected ' + HELP_SHA.slice(0, 16) + '…');
} catch (e) { cell('W6-2 --help bytes unmoved', 'NOT-RUN', e.message); }

try {
  const d = sh('git diff --stat ' + PREFIX + ' -- src bin test .github README.md docs').trim();
  const st = sh('git status --porcelain -- src bin test .github README.md docs').trim();
  cell('W6-3 no cited-pathspec movement', d === '' && st === '' ? 'PASS' : 'FAIL',
    'git diff --stat vs PREFIX -> ' + (d || '(empty)') + '\ngit status --porcelain -> ' + (st || '(empty)'));
} catch (e) { cell('W6-3 no cited-pathspec movement', 'NOT-RUN', e.message); }

try {
  const manifestsTracked = sh("git ls-files | grep -E '(^|/)(package\\.json|package-lock\\.json|yarn\\.lock|pnpm-lock\\.yaml|npm-shrinkwrap\\.json)$' || true").trim();
  const manifestsOnDisk = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']
    .filter((f) => fs.existsSync(path.join(REPO, f)));
  const nodeModules = fs.existsSync(path.join(REPO, 'node_modules'));
  const specs = [];
  for (const f of fs.readdirSync(path.join(REPO, 'tools')).filter((f) => f.endsWith('.mjs'))) {
    const s = fs.readFileSync(path.join(REPO, 'tools', f), 'utf8');
    for (const m of s.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) specs.push(m[1]);
  }
  const foreign = specs.filter((s) => !s.startsWith('node:'));
  // converse control: the classifier must reject three plants it was not shown.
  const plants = ['lodash', './sibling.mjs', '../node_modules/chalk/index.js'];
  const caught = plants.filter((s) => !s.startsWith('node:'));
  const ok = manifestsTracked === '' && manifestsOnDisk.length === 0 && !nodeModules
    && foreign.length === 0 && caught.length === 3;
  cell('W6-4 dependency surface still empty', ok ? 'PASS' : 'FAIL',
    'manifests tracked by git: ' + (manifestsTracked || 'NONE')
    + '\nmanifests on disk: ' + (manifestsOnDisk.join(',') || 'NONE') + '   node_modules: ' + nodeModules
    + '\ntools/ import specifiers: ' + specs.length + ' scanned, ' + foreign.length + ' non-node:'
    + '\nconverse control (3 planted foreign specifiers): ' + caught.length + '/3 rejected');
} catch (e) { cell('W6-4 dependency surface still empty', 'NOT-RUN', e.message); }

// Suite BEFORE any scratch dir exists, so no git-dependent guard sees a dirty tree.
try {
  let out, code = 0;
  try { out = sh('node --test test/*.test.js 2>&1', { shell: '/bin/bash' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); code = e.status; }
  // node --test's default reporter prints `ℹ tests 128` / `ℹ fail 0`; the TAP
  // reporter prints `# tests 128`. Accept either marker, reject a missing line.
  const g = (k) => { const m = out.match(new RegExp('^\\W*\\s' + k + ' (\\d+)\\s*$', 'm')); return m ? Number(m[1]) : null; };
  const tests = g('tests'), pass = g('pass'), fail = g('fail'), skipped = g('skipped');
  const parsed = tests !== null && fail !== null && skipped !== null;
  cell('W6-5 suite green (literal test_cmd)',
    !parsed ? 'NOT-RUN' : (code === 0 && fail === 0 && skipped === 0 ? 'PASS' : 'FAIL'),
    parsed ? 'exit ' + code + '  tests ' + tests + '  pass ' + pass + '  fail ' + fail + '  skipped ' + skipped
      : 'could not parse a totals line out of ' + out.split('\n').length + ' lines of runner output');
} catch (e) { cell('W6-5 suite green (literal test_cmd)', 'NOT-RUN', e.message); }

try {
  const now = sha256(fs.readFileSync(path.join(REPO, 'tools/mutation-matrix-baseline.json')));
  const then = sha256(Buffer.from(sh('git show ' + PREFIX + ':tools/mutation-matrix-baseline.json')));
  cell('W6-6 committed baseline record unmoved', now === then ? 'PASS' : 'FAIL',
    'working tree ' + now.slice(0, 16) + '…\nat PREFIX    ' + then.slice(0, 16) + '…');
} catch (e) { cell('W6-6 committed baseline record unmoved', 'NOT-RUN', e.message); }

try {
  let out, code = 0;
  try { out = sh('node tools/run-all.mjs 2>&1'); } catch (e) { out = (e.stdout || '') + (e.stderr || ''); code = e.status; }
  const rollup = (out.match(/^ROLL-UP:.*$/m) || ['(no ROLL-UP line)'])[0];
  cell('W6-7 tool dispatcher clean', code === 0 ? 'PASS' : 'FAIL', 'exit ' + code + '\n' + rollup);
} catch (e) { cell('W6-7 tool dispatcher clean', 'NOT-RUN', e.message); }

// ===========================================================================
// SCOPE — two builders, two files, no crossover
// ===========================================================================
try {
  const names = sh('git diff --name-only ' + PREFIX).trim().split('\n').filter(Boolean);
  const untracked = sh('git ls-files --others --exclude-standard').trim().split('\n').filter(Boolean);
  const toolsTouched = [...names, ...untracked].filter((f) => f.startsWith('tools/')).sort();
  const expected = ['tools/guard-inventory.mjs', 'tools/mutation-matrix.mjs'];
  const ok = JSON.stringify(toolsTouched) === JSON.stringify(expected);
  cell('SCOPE-1 exactly the two dispatched files', ok ? 'PASS' : 'FAIL',
    'tools/ paths changed or added: ' + (toolsTouched.join(', ') || '(none)')
    + '\nexpected: ' + expected.join(', '));
} catch (e) { cell('SCOPE-1 exactly the two dispatched files', 'NOT-RUN', e.message); }

// ===========================================================================
// RV-8 — meta.baselineCommit must name the baseline, or be renamed to what it holds
// ===========================================================================
const MEASURED_STUB = 'f'.repeat(40);
const revStubs = {
  DEFAULT_REV: '20b7ede', TARGET_REV: 'deadbee', measuredSha: MEASURED_STUB,
  IS_DEFAULT_REV: false, process: { version: 'v22.0.0' },
};
function metaFieldsNamingCommits(meta) {
  // A field "names a commit" if its value is a 7..40 char lowercase hex string.
  return Object.entries(meta).filter(([, v]) => typeof v === 'string' && /^[0-9a-f]{7,40}$/.test(v));
}
function baselineFieldsHoldingMeasured(meta) {
  return metaFieldsNamingCommits(meta)
    .filter(([k, v]) => /^baseline/i.test(k) && (v === MEASURED_STUB || MEASURED_STUB.startsWith(v)));
}
function baselineFieldsDisagree(meta) {
  const bl = metaFieldsNamingCommits(meta).filter(([k]) => /^baseline/i.test(k));
  const bad = [];
  for (const [k1, v1] of bl) for (const [k2, v2] of bl) {
    if (k1 >= k2) continue;
    const [s, l] = v1.length <= v2.length ? [v1, v2] : [v2, v1];
    if (!l.startsWith(s)) bad.push(k1 + '=' + v1 + ' vs ' + k2 + '=' + v2);
  }
  return bad;
}

let preMeta = null, postMeta = null;
try {
  const src = sh('git show ' + PREFIX + ':tools/mutation-matrix.mjs');
  preMeta = sandboxEval('(' + extractMeta(src) + ')', revStubs);
  const held = baselineFieldsHoldingMeasured(preMeta);
  cell('RV8-0 defect reproduces at PREFIX', held.length > 0 ? 'PASS' : 'FAIL',
    'stub: measuredSha=' + MEASURED_STUB.slice(0, 8) + '… on the --rev path (baseline short = 20b7ede)'
    + '\nbaseline* fields holding the MEASURED sha: ' + (held.map(([k]) => k).join(', ') || 'NONE')
    + '\nemitted commit fields: ' + JSON.stringify(Object.fromEntries(metaFieldsNamingCommits(preMeta))));
} catch (e) { cell('RV8-0 defect reproduces at PREFIX', 'NOT-RUN', e.message); }

try {
  const src = fs.readFileSync(path.join(REPO, 'tools/mutation-matrix.mjs'), 'utf8');
  const metaSrc = extractMeta(src);
  const r = resolveBindings(src, revStubs, (scope) => sandboxEval('(' + metaSrc + ')', scope));
  postMeta = r.obj || sandboxEval('(' + metaSrc + ')', r.scope);
  const unstub = r.error ? [['harness', r.error]] : [];
  const held = baselineFieldsHoldingMeasured(postMeta);
  const disagree = baselineFieldsDisagree(postMeta);
  const verdict = unstub.length ? 'NOT-RUN' : (held.length === 0 && disagree.length === 0 ? 'PASS' : 'FAIL');
  cell('RV8-1 no baseline* field holds the measured sha', verdict,
    (unstub.length ? 'could not resolve: ' + unstub.map(([k, v]) => k + '=' + v).join(', ') + '\n' : '')
    + (r.resolved.length ? 'bindings re-executed from the shipped source:\n  ' + r.resolved.join('\n  ') + '\n' : '')
    + 'baseline* fields holding the MEASURED sha: ' + (held.map(([k]) => k).join(', ') || 'NONE')
    + '\nbaseline* fields disagreeing with each other: ' + (disagree.join('; ') || 'NONE')
    + '\nemitted commit fields: ' + JSON.stringify(Object.fromEntries(metaFieldsNamingCommits(postMeta))));
} catch (e) { cell('RV8-1 no baseline* field holds the measured sha', 'NOT-RUN', e.message); }

try {
  const src = fs.readFileSync(path.join(REPO, 'tools/mutation-matrix.mjs'), 'utf8');
  const metaSrc2 = extractMeta(src);
  const defStubs = {
    DEFAULT_REV: '20b7ede', TARGET_REV: '20b7ede', measuredSha: BASELINE_SHA,
    IS_DEFAULT_REV: true, process: { version: 'v22.0.0' },
  };
  const rDef = resolveBindings(src, defStubs, (scope) => sandboxEval('(' + metaSrc2 + ')', scope));
  const defMeta = rDef.obj || sandboxEval('(' + metaSrc2 + ')', rDef.scope);
  if (rDef.error) throw new Error(rDef.error);
  // CONVERSE CONTROL. On the zero-argument path the measured rev IS the baseline,
  // so both meanings coincide and every commit-naming field must agree with the
  // baseline sha. This cell must be GREEN before AND after the fix: it is what
  // proves RV8-1 was earned by a repair rather than by breaking the frozen path.
  // (The key-set delta against PREFIX is REPORTED, not failed — the acceptance
  // permits renaming the field, and a rename is not a regression by itself.)
  const preSrc = sh('git show ' + PREFIX + ':tools/mutation-matrix.mjs');
  const preDefMeta = sandboxEval('(' + extractMeta(preSrc) + ')', {
    DEFAULT_REV: '20b7ede', TARGET_REV: '20b7ede', measuredSha: BASELINE_SHA,
    IS_DEFAULT_REV: true, process: { version: 'v22.0.0' },
  });
  const commitFields = metaFieldsNamingCommits(defMeta);
  const inconsistent = commitFields.filter(([, v]) => !BASELINE_SHA.startsWith(v));
  const unstub = Object.entries(defMeta).filter(([, v]) => typeof v === 'string' && v.includes('<<UNSTUBBED:'));
  const dropped = Object.keys(preDefMeta).filter((k) => !(k in defMeta));
  const added = Object.keys(defMeta).filter((k) => !(k in preDefMeta));
  cell('RV8-2 zero-arg path still self-consistent (converse control)',
    unstub.length ? 'NOT-RUN' : (inconsistent.length === 0 && commitFields.length >= 2 ? 'PASS' : 'FAIL'),
    (unstub.length ? 'could not resolve: ' + unstub.map(([k]) => k).join(', ') + '\n' : '')
    + (rDef.resolved.length ? 'bindings re-executed from the shipped source:\n  ' + rDef.resolved.join('\n  ') + '\n' : '')
    + 'commit-naming fields on the zero-arg path: ' + JSON.stringify(Object.fromEntries(commitFields))
    + '\nfields disagreeing with the baseline sha ' + BASELINE_SHA.slice(0, 7) + ': '
    + (inconsistent.map(([k, v]) => k + '=' + v).join(', ') || 'NONE')
    + '\nkey-set delta vs PREFIX (reported, not failed) — dropped: ' + (dropped.join(',') || 'none')
    + '  added: ' + (added.join(',') || 'none'));
} catch (e) { cell('RV8-2 zero-arg path still self-consistent (converse control)', 'NOT-RUN', e.message); }

try {
  let out, code = 0;
  try { out = sh('node tools/mutation-matrix.mjs --not-a-flag 2>&1'); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); code = e.status; }
  const usesUsage = out.includes('usage: node tools/mutation-matrix.mjs');
  cell('RV8-3 CLI contract intact', code === 2 && usesUsage ? 'PASS' : 'FAIL',
    'exit ' + code + ' (expected 2)   usage banner present: ' + usesUsage
    + '\nfirst line: ' + out.split('\n')[0]);
} catch (e) { cell('RV8-3 CLI contract intact', 'NOT-RUN', e.message); }

// ===========================================================================
// P-5 — a probe change must update the limits or fail loudly
// ===========================================================================
// The mutation: delete the F.ii.b probe object from FLOOR_PROBES (and only from
// FLOOR_PROBES — a post-fix limits table may legitimately mention the same id).
function removeProbe(src, id) {
  const arr = balanced(src, src.indexOf('const FLOOR_PROBES'), '[', ']');
  if (!arr) return null;
  const idAt = arr.text.indexOf("'" + id + "'");
  if (idAt < 0) return null;
  let openRel = arr.text.lastIndexOf('{', idAt);
  if (openRel < 0) return null;
  const obj = balanced(arr.text, openRel, '{', '}');
  if (!obj) return null;
  let endRel = obj.end + 1;
  if (arr.text[endRel] === ',') endRel++;
  const newArr = arr.text.slice(0, obj.start) + arr.text.slice(endRel);
  return src.slice(0, arr.start) + newArr + src.slice(arr.end + 1);
}
function freshClone(dir, rev) {
  fs.rmSync(dir, { recursive: true, force: true });
  execSync('git clone --no-hardlinks -q ' + REPO + ' ' + dir, { encoding: 'utf8' });
  if (rev) execSync('git -C ' + dir + ' checkout -q ' + rev, { encoding: 'utf8' });
  return dir;
}
function runInv(dir) {
  try {
    const out = execSync('node tools/guard-inventory.mjs 2>&1', { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { code: 0, out };
  } catch (e) { return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }; }
}
// Lines of `out` that carry any of the limit texts declared in `limitsSrcFile`.
function limitLines(out, limitsEntries) {
  const texts = limitsEntries.flatMap(limitTexts);
  return out.split('\n').filter((l) => texts.some((t) => l.includes(t)));
}

fs.mkdirSync(SCRATCH, { recursive: true });
try {
  // ---- PREFIX side: the defect
  const dirPre = freshClone(path.join(SCRATCH, 'pre'), PREFIX);
  const invPre = path.join(dirPre, 'tools/guard-inventory.mjs');
  const preSrc = fs.readFileSync(invPre, 'utf8');
  const preLimits = sandboxEval(extractLimits(preSrc), { FLOOR_MIN_DIGITS: 3 });
  const cleanPre = runInv(dirPre);
  const mutatedPreSrc = removeProbe(preSrc, 'F.ii.b');
  if (!mutatedPreSrc) throw new Error('could not locate the F.ii.b probe object at PREFIX');
  fs.writeFileSync(invPre, mutatedPreSrc);
  const mutPre = runInv(dirPre);
  const lPreClean = limitLines(cleanPre.out, preLimits);
  const lPreMut = limitLines(mutPre.out, preLimits);
  const identical = JSON.stringify(lPreClean) === JSON.stringify(lPreMut);
  cell('P5-0 drift is invisible at PREFIX', mutPre.code === 0 && identical && lPreClean.length > 0 ? 'PASS' : 'FAIL',
    'probe F.ii.b deleted from FLOOR_PROBES; source shrank ' + preSrc.length + ' -> ' + mutatedPreSrc.length + ' bytes'
    + '\nmutated run exit ' + mutPre.code + ' (defect: still 0)'
    + '\nlimit lines printed clean/mutated: ' + lPreClean.length + '/' + lPreMut.length + '  identical: ' + identical
    + '\nF.ii.b still named in mutated output: ' + mutPre.out.includes('F.ii.b'));

  // ---- HEAD side: the fix
  const dirPost = freshClone(path.join(SCRATCH, 'post'), null);
  // clone copies committed state only; overlay the uncommitted working file
  fs.copyFileSync(path.join(REPO, 'tools/guard-inventory.mjs'), path.join(dirPost, 'tools/guard-inventory.mjs'));
  const invPost = path.join(dirPost, 'tools/guard-inventory.mjs');
  const postSrc = fs.readFileSync(invPost, 'utf8');
  const postLimits = sandboxEval(extractLimits(postSrc), { FLOOR_MIN_DIGITS: 3 });
  const cleanPost = runInv(dirPost);

  const probeIds = ['F.i.a', 'F.i.b', 'F.i.c', 'F.ii.a', 'F.ii.b', 'F.iii', 'F.Q2'];
  const idsPresent = probeIds.filter((i) => cleanPost.out.includes(i));
  cell('P5-2 converse control: clean tree unchanged verdict',
    cleanPost.code === 0 && cleanPost.out.includes('VERDICT: ABSENT') && idsPresent.length === 7 ? 'PASS' : 'FAIL',
    'unmutated clone at the working tree: exit ' + cleanPost.code
    + '\nverdict line present: ' + cleanPost.out.includes('VERDICT: ABSENT')
    + '\nprobe ids printed: ' + idsPresent.length + '/7 (' + idsPresent.join(' ') + ')'
    + '\nlimit entries declared in source: ' + postLimits.length);

  const mutatedPostSrc = removeProbe(postSrc, 'F.ii.b');
  if (!mutatedPostSrc) {
    cell('P5-1 probe change updates limits or fails loudly', 'NOT-RUN',
      'could not locate the F.ii.b probe object inside FLOOR_PROBES in the working-tree file');
    cell('P5-3 the mutation actually landed', 'NOT-RUN', 'no mutation was produced');
  } else {
    fs.writeFileSync(invPost, mutatedPostSrc);
    const stillThere = balanced(mutatedPostSrc, mutatedPostSrc.indexOf('const FLOOR_PROBES'), '[', ']');
    cell('P5-3 the mutation actually landed', stillThere && !stillThere.text.includes("'F.ii.b'") ? 'PASS' : 'FAIL',
      'FLOOR_PROBES after edit still names F.ii.b: ' + (stillThere ? stillThere.text.includes("'F.ii.b'") : 'n/a')
      + '\nsource shrank ' + postSrc.length + ' -> ' + mutatedPostSrc.length + ' bytes');
    const mutPost = runInv(dirPost);
    const lPostClean = limitLines(cleanPost.out, postLimits);
    const lPostMut = limitLines(mutPost.out, postLimits);
    const changed = JSON.stringify(lPostClean) !== JSON.stringify(lPostMut);
    const loud = mutPost.code !== 0;
    cell('P5-1 probe change updates limits or fails loudly', loud || changed ? 'PASS' : 'FAIL',
      'mutated run exit ' + mutPost.code + (loud ? '  <- LOUD' : '  <- silent')
      + '\nlimit lines clean/mutated: ' + lPostClean.length + '/' + lPostMut.length + '  changed: ' + changed
      + (loud ? '\nfailure output tail: ' + mutPost.out.trim().split('\n').slice(-3).join(' | ') : '')
      + (!loud && changed ? '\nfirst differing limit line (clean): ' + (lPostClean.find((l, i) => l !== lPostMut[i]) || '(count differs)') : ''));
  }
} catch (e) {
  cell('P5-* probe-drift cells', 'NOT-RUN', 'harness error: ' + e.message + '\n' + (e.stack || '').split('\n')[1]);
} finally {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
}

// ===========================================================================
console.log('');
const pass = cells.filter((c) => c.verdict === 'PASS').length;
console.log('GATE: ' + pass + '/' + cells.length + ' PASS');
for (const c of cells) if (c.verdict !== 'PASS') console.log('  ' + c.verdict + ' ' + c.id);
process.exit(cells.every((c) => c.verdict === 'PASS') ? 0 : 1);
