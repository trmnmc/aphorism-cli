#!/usr/bin/env node
// cycle-5 verification gate — item P-6
// "mechanize README §Node support's own quoted falsifier as a test in test/"
//
// Held under SWARM/runs/ for the duration of the dispatch window (run #3 cycle-14
// precedent): hard rule 5 says workflow agents receive target paths only, so a gate
// here is STRUCTURALLY unreachable to the builder rather than merely forbidden to it.
//
// Every cell re-derives its expected value from the tree, from README's own prose, or
// from a real git object at run time. Nothing is read from a journal note or a prior
// cycle's summary.
//
// Usage:
//   node c005-gate-P-6.mjs                 scoring run
//   node c005-gate-P-6.mjs --mutate A1     failability control for A1
//   node c005-gate-P-6.mjs --mutate A2     failability control for A2
//
// Cells A3/A4/A5/A6/A7 are mutation ARMS by construction — each builds a real git
// repository whose README carries a deliberately different falsifier command and
// asserts which direction the suite must move. They are their own controls.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TARGET = '/opt/targets/aphorism-cli';
const ARMS = '/opt/swarm/runs/c005-arms';
const MUTATE = (() => {
  const i = process.argv.indexOf('--mutate');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const rows = [];
const pass = (id, msg) => rows.push({ id, ok: true, msg });
const fail = (id, msg) => rows.push({ id, ok: false, msg });

const sh = (cmd, cwd) => {
  try {
    return { code: 0, out: execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout ?? '') + (e.stderr ?? '') };
  }
};

// ---------------------------------------------------------------------------
// suite summary parser
//
// Node 18/20/22 emit the TAP summary ("# pass 119"); node 24 emits the spec
// reporter ("<U+2139> pass 119"). Cycle 4's G6 cell pinned only the TAP form and read
// pass=-1 on this host. It failed CLOSED, which is the right direction (L-041:
// a summary the parser cannot read must never be readable as zero failures), and
// the repair is to accept either marker rather than to pin whichever one this host
// happens to run today.
// ---------------------------------------------------------------------------
function suiteSummary(cwd) {
  const r = sh('node --test test/*.test.js', cwd);
  const num = (word) => {
    const m = r.out.match(new RegExp(String.raw`(?:^|\n)\s*(?:#|ℹ)\s+${word}\s+(\d+)`));
    return m ? Number(m[1]) : -1;
  };
  return { tests: num('tests'), pass: num('pass'), fail: num('fail'), skipped: num('skipped'), raw: r.out };
}

function readmeFalsifier(readmeText) {
  // README §Node support names its own retirement condition as an executable command.
  // Parse it out of the prose; never hardcode it here either.
  const m = readmeText.match(/git diff ([0-9a-f]{7,40})\.\.HEAD --\s+([^\n`]+?)\s*`/);
  if (!m) return null;
  return { base: m[1], paths: m[2].trim() };
}

// ---------------------------------------------------------------------------
// arm construction
//
// L-042 asks for arms built from a fixed object rather than by copying a live tree
// several agents are editing. Only one agent ran this cycle and it had finished before
// any arm was built, so the copy is taken once, committed inside the COPY (never in the
// live repo), and every arm is cloned or copied from that frozen base. The live target
// tree is never mutated by this program.
// ---------------------------------------------------------------------------
function buildArms() {
  fs.rmSync(ARMS, { recursive: true, force: true });
  fs.mkdirSync(ARMS, { recursive: true });

  const base = path.join(ARMS, 'base');
  fs.cpSync(TARGET, base, {
    recursive: true,
    filter: (src) => !src.includes('/.swarm') && !src.includes('/node_modules'),
  });
  sh('git add -A', base);
  sh('git -c user.email=gate@swarm -c user.name=gate commit -q -m "gate arm base" --allow-empty', base);

  const readmePath = path.join(base, 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');
  const f = readmeFalsifier(readme);
  if (!f) return { base, f: null };

  // A commit that predates the two commits which last touched test/ and .github/.
  // Derived, not hardcoded: walk back until `git diff <sha>..HEAD -- <paths>` is
  // non-empty, so the "stale" arm is stale against THIS tree rather than against a
  // sha someone wrote down once.
  const log = sh(`git log --format=%H -n 40`, base).out.trim().split('\n');
  let staleSha = null;
  for (const sha of log) {
    const d = sh(`git diff --name-only ${sha}..HEAD -- ${f.paths}`, base).out.trim();
    if (d) { staleSha = sha; break; }
  }

  const mk = (name, mutate) => {
    const dir = path.join(ARMS, name);
    fs.cpSync(base, dir, { recursive: true });
    if (mutate) {
      const p = path.join(dir, 'README.md');
      fs.writeFileSync(p, mutate(fs.readFileSync(p, 'utf8')));
      sh('git add -A', dir);
      sh('git -c user.email=gate@swarm -c user.name=gate commit -q -m "arm mutation"', dir);
    }
    return dir;
  };

  const arms = { current: mk('current', null) };
  if (staleSha) {
    // Rewrite the citation anchor AND the falsifier base together, so a test that
    // cross-checks "as of commit X" against the diff base cannot go red for the
    // wrong reason and be miscredited to the falsifier check.
    arms.staleFull = mk('stale-full', (t) => t.split(f.base).join(staleSha.slice(0, 7)));
    // Same stale base, but the PATHSPEC narrowed to the paths that did NOT change.
    // `git diff <stale>..HEAD -- <narrowed>` is empty, so a test that parses the
    // pathspec out of the prose must stay GREEN here, while one that hardcoded the
    // full pathspec goes red. This is the cell that distinguishes parsed from
    // hardcoded, and it is a must-NOT-overreach control at the same time.
    const narrowed = f.paths.split(/\s+/).filter((p2) => {
      const d = sh(`git diff --name-only ${staleSha}..HEAD -- ${p2}`, base).out.trim();
      return !d;
    }).join(' ');
    if (narrowed) {
      arms.staleNarrow = mk('stale-narrow', (t) =>
        t.split(f.base).join(staleSha.slice(0, 7)).replace(`..HEAD -- ${f.paths}`, `..HEAD -- ${narrowed}`));
      arms.narrowed = narrowed;
    }
  }
  // Real shallow clone — the condition CI actually creates (actions/checkout@v4
  // defaults to depth 1), not a synthetic "sha that does not exist".
  const shallow = path.join(ARMS, 'shallow');
  const cl = sh(`git clone -q --depth=1 file://${base} ${shallow}`, ARMS);
  if (cl.code === 0) arms.shallow = shallow;
  return { base, f, staleSha, arms };
}

// ===========================================================================
const built = buildArms();
const f = built.f;
const arms = built.arms ?? {};

// --- A1: a test in test/ runs README's own command, parsed rather than hardcoded ---
{
  const files = fs.readdirSync(path.join(TARGET, 'test')).filter((n) => n.endsWith('.js'));
  let src = files.map((n) => fs.readFileSync(path.join(TARGET, 'test', n), 'utf8')).join('\n');
  if (MUTATE === 'A1') src += `\nconst BASE = '${f ? f.base : '0000000'}'; // injected hardcode\n`;
  const readsReadme = /README\.md/.test(src);
  // CALIBRATED PRE-DISPATCH. The first draft required the literal string "git diff".
  // That encodes a MEANS where the acceptance states an END — `execFileSync('git',
  // ['diff', ...])` satisfies the item perfectly and contains no such substring. This
  // is instrument defect #15's shape (cycle-2 A3) and it is cheaper to fix before
  // dispatch than to adjudicate after. A1's load-bearing job is the HARDCODE BAN;
  // whether the command actually runs and asserts is proved BEHAVIOURALLY by the
  // A3/A4/A5/A6 arms, which no source regex can fake.
  const invokesGit = /\bgit\b/.test(src) && /\bdiff\b/.test(src);
  const hardBase = f && src.includes(f.base);
  const hardPaths = f && src.includes(f.paths);
  if (readsReadme && invokesGit && !hardBase && !hardPaths) {
    pass('A1', `test/ reads README.md and invokes git diff; base "${f.base}" and pathspec "${f.paths}" appear 0 times in test sources (parsed, not hardcoded)`);
  } else {
    fail('A1', `readsREADME=${readsReadme} invokesGitDiff=${invokesGit} hardcodedBase=${!!hardBase} hardcodedPathspec=${!!hardPaths}`);
  }
}

// --- A2: P-5 floor holds and the suite GREW by the new test ---
{
  const s = suiteSummary(TARGET);
  const floor = MUTATE === 'A2' ? 999 : 120;
  if (s.pass >= floor && s.fail === 0) {
    pass('A2', `suite tests ${s.tests} / pass ${s.pass} / fail ${s.fail} / skipped ${s.skipped} (floor >= ${floor} pass, 0 fail)`);
  } else {
    fail('A2', `suite tests ${s.tests} / pass ${s.pass} / fail ${s.fail} (needed pass >= ${floor}, fail 0; -1 means the summary could not be parsed, which fails CLOSED)`);
  }
}

// --- A3: CURRENT arm — the claim is true today, so the suite is green ---
{
  if (!arms.current) fail('A3', 'current arm not built');
  else {
    const s = suiteSummary(arms.current);
    const d = sh(`git diff --name-only ${f.base}..HEAD -- ${f.paths}`, arms.current).out.trim();
    if (s.fail === 0 && s.pass >= 120 && d === '') {
      pass('A3', `README falsifier \`git diff ${f.base}..HEAD -- ${f.paths}\` => EMPTY; suite ${s.pass}/${s.fail} green`);
    } else {
      fail('A3', `diff="${d.replace(/\n/g, ',')}" suite pass ${s.pass} fail ${s.fail}`);
    }
  }
}

// --- A4: STALE arm — must go RED (failability of the new test) ---
{
  if (!arms.staleFull) fail('A4', 'stale-full arm not built (no commit in the last 40 makes the falsifier non-empty)');
  else {
    const s = suiteSummary(arms.staleFull);
    const d = sh(`git diff --stat ${built.staleSha}..HEAD -- ${f.paths}`, arms.staleFull).out.trim().split('\n').pop();
    if (s.fail >= 1) {
      pass('A4', `base -> ${built.staleSha.slice(0, 7)} (real diff: ${d}); suite goes RED: pass ${s.pass} / fail ${s.fail}`);
    } else {
      fail('A4', `stale base ${built.staleSha.slice(0, 7)} left the suite GREEN (pass ${s.pass} / fail ${s.fail}) — the falsifier is not being run, or not being asserted on`);
    }
  }
}

// --- A5: STALE base + NARROWED pathspec — must stay GREEN (parsed, not hardcoded) ---
{
  if (!arms.staleNarrow) fail('A5', 'stale-narrow arm not built');
  else {
    const s = suiteSummary(arms.staleNarrow);
    const d = sh(`git diff --name-only ${built.staleSha}..HEAD -- ${arms.narrowed}`, arms.staleNarrow).out.trim();
    if (s.fail === 0 && d === '' && s.pass >= 120) {
      pass('A5', `base -> ${built.staleSha.slice(0, 7)} AND pathspec -> "${arms.narrowed}" (real diff EMPTY); suite stays GREEN pass ${s.pass} — the pathspec is read from the prose, and the A4 red is attributable to the base, not to an over-broad hardcoded check`);
    } else {
      fail('A5', `narrowed pathspec "${arms.narrowed}" real diff="${d.replace(/\n/g, ',')}" but suite pass ${s.pass} fail ${s.fail} — a hardcoded pathspec would produce exactly this`);
    }
  }
}

// --- A6: SHALLOW CLONE — must SKIP, not fail ---
{
  if (!arms.shallow) fail('A6', 'shallow clone arm not built');
  else {
    const reach = sh(`git cat-file -e ${f.base}^{commit}`, arms.shallow);
    const s = suiteSummary(arms.shallow);
    if (reach.code !== 0 && s.fail === 0 && s.skipped >= 1) {
      pass('A6', `depth=1 clone: base ${f.base} unreachable (git cat-file -e => ${reach.code}); suite pass ${s.pass} / fail ${s.fail} / skipped ${s.skipped} — degrades, does not fail`);
    } else {
      // Label calibrated pre-dispatch: a NON-zero `git cat-file -e` exit means the base
      // is UNREACHABLE. The first draft printed "reachable(exit 128)", which reads as the
      // opposite of what it measured — and this line is evidence a human reads.
      fail('A6', `base ${f.base} ${reach.code === 0 ? 'REACHABLE' : 'unreachable'} (git cat-file -e exit ${reach.code}) | suite pass ${s.pass} fail ${s.fail} skipped ${s.skipped} — needed unreachable base, 0 failures, >=1 skip`);
    }
  }
}

// --- A7: the shallow GREEN is not vacuous — same suite ran, one test stepped aside ---
{
  if (!arms.shallow || !arms.current) fail('A7', 'arms not built');
  else {
    const sc = suiteSummary(arms.current);
    const ss = suiteSummary(arms.shallow);
    if (sc.tests === ss.tests && sc.skipped === 0 && ss.skipped >= 1 && ss.pass === sc.pass - ss.skipped) {
      pass('A7', `current ${sc.tests} tests / ${sc.skipped} skipped vs shallow ${ss.tests} tests / ${ss.skipped} skipped — identical test count, the skip is the falsifier test standing down and nothing else went quiet`);
    } else {
      fail('A7', `current tests ${sc.tests} pass ${sc.pass} skipped ${sc.skipped} | shallow tests ${ss.tests} pass ${ss.pass} skipped ${ss.skipped}`);
    }
  }
}

// --- A8: no product change, no new dependency, corpus byte-identical ---
{
  const prod = sh('git diff --name-only HEAD -- src bin', TARGET).out.trim();
  const corpusNow = crypto.createHash('sha256').update(fs.readFileSync(path.join(TARGET, 'src/corpus.js'))).digest('hex');
  const corpusRef = crypto.createHash('sha256')
    .update(sh('git show 81b0958:src/corpus.js', TARGET).out).digest('hex');
  const hasPkg = fs.existsSync(path.join(TARGET, 'package.json'));
  const hasLock = fs.existsSync(path.join(TARGET, 'package-lock.json'));
  const hasNM = fs.existsSync(path.join(TARGET, 'node_modules'));
  if (prod === '' && corpusNow === corpusRef && !hasPkg && !hasLock && !hasNM) {
    pass('A8', `src/ bin/ unchanged this cycle; src/corpus.js identical to 81b0958 (${corpusNow.slice(0, 8)}); no package.json, no lockfile, no node_modules`);
  } else {
    fail('A8', `changed="${prod.replace(/\n/g, ',')}" corpus ${corpusNow.slice(0, 8)} vs ${corpusRef.slice(0, 8)} pkg=${hasPkg} lock=${hasLock} nm=${hasNM}`);
  }
}

// --- A9: README still owns a parseable falsifier, anchored to the same commit ---
{
  const readme = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8');
  const ff = readmeFalsifier(readme);
  const anchor = readme.match(/As of commit `([0-9a-f]{7,40})`/);
  if (ff && anchor && anchor[1] === ff.base) {
    pass('A9', `README §Node support: falsifier base ${ff.base}, pathspec "${ff.paths}", "As of commit" anchor ${anchor[1]} — anchored and parseable`);
  } else {
    fail('A9', `falsifier=${ff ? `${ff.base}/${ff.paths}` : 'UNPARSEABLE'} anchor=${anchor ? anchor[1] : 'ABSENT'}`);
  }
}

// ===========================================================================
const nPass = rows.filter((r) => r.ok).length;
const nFail = rows.length - nPass;
console.log(`cycle-5 gate — item P-6 (mechanize the README §Node support falsifier)   ${nPass} PASS / ${nFail} FAIL${MUTATE ? `   [--mutate ${MUTATE}]` : ''}`);
for (const r of rows) console.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.id}  ${r.msg}`);
if (MUTATE) {
  const target = rows.find((r) => r.id === MUTATE);
  console.log(`  CONTROL ${target && !target.ok ? 'PASSED' : 'FAILED'} (cell ${MUTATE} ${target && !target.ok ? 'went red under mutation' : 'did NOT go red — it cannot fail'})`);
}
fs.rmSync(ARMS, { recursive: true, force: true });
process.exit(nFail === 0 ? 0 : 1);
