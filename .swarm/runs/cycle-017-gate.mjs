#!/usr/bin/env node
// cycle-017-gate.mjs -- SEALED BEFORE DISPATCH (sha256 published in the journal
// at dispatch time). The conductor authored this without any builder input and
// no builder has seen it. Run: node cycle-017-gate.mjs
//
// Cells are named. Each prints PASS / FAIL / REFUTED with the evidence that
// decided it. Every cell that must FIRE on a defect is paired with a converse
// control that must stay GREEN, and every "the fix changed the outcome" claim
// is measured against the PRE-FIX blob at PREFIX_COMMIT, not asserted.

import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const REPO = process.env.GATE_REPO || '/opt/targets/aphorism-cli';
const PREFIX_COMMIT = process.env.GATE_PREFIX || '8e17216';
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'swarm-gate-017-'));

const results = [];
function cell(id, verdict, evidence) {
  results.push({ id, verdict, evidence });
  console.log(`\n[${verdict}] ${id}`);
  for (const line of String(evidence).split('\n')) console.log('    ' + line);
}
function sh(cmd, args, cwd, env) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, ...(env || {}) } });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '', signal: r.signal };
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function clone(name) {
  const dir = path.join(SCRATCH, name);
  execFileSync('git', ['clone', '--quiet', REPO, dir], { stdio: 'pipe' });
  return dir;
}

// ===========================================================================
// W-6 -- standing invariants. These bind at EVERY commit this run makes.
// ===========================================================================
{
  const corpus = sha256(fs.readFileSync(path.join(REPO, 'src/corpus.js')));
  const want = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';
  cell('W6-1 corpus bytes unmoved', corpus === want ? 'PASS' : 'FAIL',
    `sha256(src/corpus.js) = ${corpus}\nexpected                 = ${want}`);
}
{
  const h = sh(process.execPath, ['bin/aphorism.js', '--help'], REPO);
  const got = sha256(h.out);
  const want = 'd759d781ddcac780ed7eb13d7768e90f1bd52d707377fab50ff5c8f648dd5e64';
  cell('W6-2 --help bytes unmoved', got === want ? 'PASS' : 'FAIL',
    `sha256(--help stdout) = ${got}\nexpected              = ${want}\nexit ${h.code}`);
}
{
  const d = sh('git', ['diff', '--stat', `${PREFIX_COMMIT}..HEAD`, '--', 'src', 'bin'], REPO);
  cell('W6-3 no src/ or bin/ movement', d.out.trim() === '' ? 'PASS' : 'FAIL',
    `git diff --stat ${PREFIX_COMMIT}..HEAD -- src bin\n${d.out.trim() || '(empty)'}`);
}
{
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  cell('W6-4 dependency surface still empty', Object.keys(deps).length === 0 ? 'PASS' : 'FAIL',
    `dependencies+devDependencies = ${JSON.stringify(deps)}`);
}
{
  const bad = [];
  for (const f of fs.readdirSync(path.join(REPO, 'tools')).filter((f) => f.endsWith('.mjs'))) {
    const src = fs.readFileSync(path.join(REPO, 'tools', f), 'utf8');
    for (const m of src.matchAll(/^\s*import\s+[^'"]*from\s+['"]([^'"]+)['"]/gm)) {
      if (!m[1].startsWith('node:') && !m[1].startsWith('.')) bad.push(`${f}: ${m[1]}`);
    }
  }
  cell('W6-5 tools/ import only node: builtins', bad.length === 0 ? 'PASS' : 'FAIL',
    bad.length ? bad.join('\n') : 'no non-builtin, non-relative import in any tools/*.mjs');
}
{
  const files = fs.readdirSync(path.join(REPO, 'test')).filter((f) => f.endsWith('.test.js')).sort().map((f) => 'test/' + f);
  const t = sh(process.execPath, ['--test', ...files], REPO);
  const all = t.out + '\n' + t.err;
  const g = (k) => (all.match(new RegExp(`[#ℹ]\\s*${k}\\s+(\\d+)`)) || [])[1];
  const ok = t.code === 0 && g('fail') === '0';
  cell('W6-6 suite green', ok ? 'PASS' : 'FAIL',
    `node --test test/*.test.js -> exit ${t.code}\ntests ${g('tests')} pass ${g('pass')} fail ${g('fail')} skipped ${g('skipped')}`);
}

// ===========================================================================
// Shared: the README rows this repo actually states right now. Several cells
// below compare a tool's announced numbers against these DERIVED numbers.
// ===========================================================================
const readmeRows = [...fs.readFileSync(path.join(REPO, 'README.md'), 'utf8')
  .matchAll(/\|\s*(v[\d.]+)\s*\|\s*(\d+)\s*tests,\s*(\d+)\s*pass,\s*(\d+)\s*fail,\s*(\d+)\s*skipped\s*\|/g)]
  .map((m) => ({ node: m[1], tests: +m[2], pass: +m[3], fail: +m[4], skipped: +m[5] }));
const ROW = readmeRows[0];

// ===========================================================================
// RV-17 -- a dispatched tool that publishes NOTHING must not read "clean".
// Reproduce first (the claim may not survive), then measure the fix against
// the pre-fix blob and against a converse control.
// ===========================================================================
{
  const VICTIM = 'tools/citation-rule-check.mjs';
  const ROLLUP = /^\s{2}(\S+)\s+(clean|PROBLEM|SKIPPED)(.*)$/;
  const rollupOf = (out, id) => (out.split('\n').map((l) => l.match(ROLLUP)).filter(Boolean).find((m) => m[1] === id) || [null])[0];

  // -- baseline: does the defect actually reproduce against the PRE-FIX blob?
  const b = clone('rv17-baseline');
  fs.writeFileSync(path.join(b, 'tools/run-all.mjs'),
    execFileSync('git', ['show', `${PREFIX_COMMIT}:tools/run-all.mjs`], { cwd: REPO, maxBuffer: 1 << 26 }));
  const healthyPre = sh(process.execPath, ['tools/run-all.mjs'], b);
  fs.writeFileSync(path.join(b, VICTIM), '');
  const truncPre = sh(process.execPath, ['tools/run-all.mjs'], b);
  const preHealthyLine = rollupOf(healthyPre.out, 'citation-rule-check');
  const preTruncLine = rollupOf(truncPre.out, 'citation-rule-check');
  const reproduced = preTruncLine === preHealthyLine && truncPre.code === 0;
  cell('RV17-0 defect reproduces at PREFIX (baseline column)', reproduced ? 'PASS' : 'REFUTED',
    `pre-fix run-all, ${VICTIM} intact    -> exit ${healthyPre.code}, roll-up "${preHealthyLine}"\n` +
    `pre-fix run-all, ${VICTIM} 0 bytes   -> exit ${truncPre.code}, roll-up "${preTruncLine}"\n` +
    `byte-identical roll-up line AND exit 0 = ${reproduced}`);

  // -- true positive: the FIXED dispatcher must not report a silent tool clean.
  const p = clone('rv17-truncated');
  fs.writeFileSync(path.join(p, VICTIM), '');
  const truncPost = sh(process.execPath, ['tools/run-all.mjs'], p);
  const postTruncLine = rollupOf(truncPost.out, 'citation-rule-check');
  const distinguishes = postTruncLine !== preHealthyLine && truncPost.code !== 0;
  cell('RV17-1 fixed dispatcher flags a zero-byte tool', distinguishes ? 'PASS' : 'FAIL',
    `fixed run-all, ${VICTIM} 0 bytes -> exit ${truncPost.code}, roll-up "${postTruncLine}"\n` +
    `healthy roll-up line was          "${preHealthyLine}"\n` +
    `differs from healthy AND exit != 0 = ${distinguishes}`);

  // -- converse control: an UNMODIFIED tree must still read wholly clean.
  const c = clone('rv17-control');
  const ctrl = sh(process.execPath, ['tools/run-all.mjs'], c);
  const skippedOk = /mutation-matrix\s+SKIPPED/.test(ctrl.out);
  const cleanOk = ctrl.code === 0 && /ROLL-UP: 6\/7 ran clean.*SKIPPED: mutation-matrix/.test(ctrl.out);
  cell('RV17-2 converse control: clean tree stays clean', cleanOk && skippedOk ? 'PASS' : 'FAIL',
    `unmodified clone, fixed run-all -> exit ${ctrl.code}\n` +
    (ctrl.out.split('\n').filter((l) => /^ROLL-UP:/.test(l))[0] || '(no ROLL-UP line)') + '\n' +
    `mutation-matrix still SKIPPED (not PROBLEM) = ${skippedOk}`);

  // -- RV-16: every slot number this file states for mutation-matrix must be
  //    the slot it actually emits. Derived from the live [n/N] heading.
  const emitted = (ctrl.out.match(/^\[(\d+)\/(\d+)\] tools\/mutation-matrix\.mjs/m) || [])[1];
  const src = fs.readFileSync(path.join(c, 'tools/run-all.mjs'), 'utf8');
  const header = src.slice(0, src.indexOf('\nimport '));
  const stated = [];
  for (const m of header.matchAll(/mutation-matrix/g)) {
    const win = header.slice(Math.max(0, m.index - 260), m.index + 260);
    for (const s of win.matchAll(/(?:slot|order)[^.\n]{0,40}?\[(\d+)\]|\[(\d+)\][^.\n]{0,40}?tools\/mutation-matrix/g)) {
      stated.push(s[1] || s[2]);
    }
  }
  const uniq = [...new Set(stated)];
  const slotOk = emitted && uniq.length > 0 && uniq.every((s) => s === emitted);
  cell('RV16-1 stated slot == emitted slot', slotOk ? 'PASS' : 'FAIL',
    `live heading emits [${emitted}/7] for tools/mutation-matrix.mjs\n` +
    `slot numbers stated in the header comment near "mutation-matrix": [${uniq.join(', ')}]\n` +
    `all stated numbers equal the emitted slot = ${slotOk}`);

  // -- RV-24: the W-5 heading must not announce counts that contradict README.
  const w5 = (ctrl.out.match(/^\[\d+\/\d+\] tools\/matrix-adjudication\.mjs.*$/m) || ['(not found)'])[0];
  const pairs = [...w5.matchAll(/(\d{2,4})-vs-(\d{2,4})/g)].map((m) => [+m[1], +m[2]]);
  const w5Ok = pairs.length === 0 || pairs.every(([a, b2]) => (a === ROW.pass && b2 === ROW.tests) || (a === ROW.tests && b2 === ROW.pass));
  cell('RV24-1 run-all W-5 label agrees with README', w5Ok ? 'PASS' : 'FAIL',
    `heading: ${w5}\nREADME row now states: ${ROW.tests} tests, ${ROW.pass} pass, ${ROW.fail} fail, ${ROW.skipped} skipped\n` +
    `hardcoded pairs in the label: ${JSON.stringify(pairs)} -> acceptable = ${w5Ok}`);
}

// ===========================================================================
// RV-14 -- "every case routes through a skip" must be a per-case fact, not a
// whole-file presence regex. DISCRIMINATOR: two probe trees that differ ONLY
// in whether the added third case routes through a skip. A tool that really
// checks per case must say something DIFFERENT about them.
// ===========================================================================
{
  const GUARD = 'test/node-support-citation.test.js';
  const UNCOND = "\ntest('gate probe: unconditional case', () => { });\n";
  const COND = "\ntest('gate probe: conditional case', (t) => { t.skip('gate probe'); });\n";

  const mk = (name, addition, prefix) => {
    const d = clone(name);
    if (prefix) {
      fs.writeFileSync(path.join(d, 'tools/matrix-adjudication.mjs'),
        execFileSync('git', ['show', `${PREFIX_COMMIT}:tools/matrix-adjudication.mjs`], { cwd: REPO, maxBuffer: 1 << 26 }));
    }
    fs.appendFileSync(path.join(d, GUARD), addition);
    return sh(process.execPath, ['tools/matrix-adjudication.mjs'], d);
  };
  // The skip-routing claim lives in section (b). Compare only that section so
  // unrelated verdict text cannot manufacture a difference.
  const sectionB = (out) => {
    const i = out.indexOf('== (b)');
    const j = out.indexOf('== (c)');
    return i === -1 ? out : out.slice(i, j === -1 ? undefined : j).trim();
  };

  const preU = sectionB(mk('rv14-pre-uncond', UNCOND, true).out);
  const preC = sectionB(mk('rv14-pre-cond', COND, true).out);
  cell('RV14-0 defect reproduces at PREFIX (baseline column)', preU === preC ? 'PASS' : 'REFUTED',
    `pre-fix tool, 3rd case UNCONDITIONAL vs SKIPPING -> section (b) identical = ${preU === preC}\n` +
    `--- unconditional ---\n${preU}\n--- skipping ---\n${preC}`);

  const postU = sectionB(mk('rv14-post-uncond', UNCOND, false).out);
  const postC = sectionB(mk('rv14-post-cond', COND, false).out);
  cell('RV14-1 fixed tool distinguishes the two trees', postU !== postC ? 'PASS' : 'FAIL',
    `fixed tool, 3rd case UNCONDITIONAL vs SKIPPING -> section (b) differs = ${postU !== postC}\n` +
    `--- unconditional ---\n${postU}\n--- skipping ---\n${postC}`);

  const wholeFileRegex = /guardHasSkipRouting\s*=\s*\/\\b?t\\?\.skip\\?\(\/\.test\(guardSource\)/
    .test(fs.readFileSync(path.join(REPO, 'tools/matrix-adjudication.mjs'), 'utf8'));
  cell('RV14-2 whole-file presence regex is gone', !wholeFileRegex ? 'PASS' : 'FAIL',
    `source still computes the claim from a single whole-file /t.skip(/ test = ${wholeFileRegex}`);

  const clean = clone('rv14-control');
  const cl = sh(process.execPath, ['tools/matrix-adjudication.mjs'], clean);
  const cleanOk = cl.code === 0 && /VERDICT: CORRECT-AS-CITED/.test(cl.out);
  cell('RV14-3 converse control: clean tree still CORRECT-AS-CITED', cleanOk ? 'PASS' : 'FAIL',
    `unmodified clone -> exit ${cl.code}\n` + (cl.out.match(/^== VERDICT.*$/m) || ['(no verdict line)'])[0]);
}

// ===========================================================================
// RV-15 -- the 127-vs-129 framing. TWO acceptable shapes, and the gate checks
// whichever the builder chose:
//   (A) DERIVED  -- the framing numbers move when the README rows move;
//   (B) HISTORICAL -- the numbers survive only inside text that names them as
//       the past question, and runtime output is unchanged.
// ===========================================================================
{
  const srcNow = fs.readFileSync(path.join(REPO, 'tools/matrix-adjudication.mjs'), 'utf8');
  const header = srcNow.slice(0, srcNow.indexOf('\nimport '));
  const HIST = /\b(histor|formerly|previously|at the time|as of|no longer|used to|once)\b/i;
  const staleLines = header.split('\n')
    .filter((l) => /\b(127|129)\b/.test(l))
    .filter((l) => !HIST.test(l));
  const shapeB = staleLines.length === 0;

  // Shape A probe: bump every README row by +2 tests / +2 pass and see whether
  // the tool's PRINTED framing tracks it.
  const d = clone('rv15-readme-moved');
  const rp = path.join(d, 'README.md');
  fs.writeFileSync(rp, fs.readFileSync(rp, 'utf8').replace(
    /\|\s*(v[\d.]+)\s*\|\s*(\d+)\s*tests,\s*(\d+)\s*pass,\s*(\d+)\s*fail,\s*(\d+)\s*skipped\s*\|/g,
    (_, n, t, p, f, s) => `| ${n} | ${+t + 2} tests, ${+p + 2} pass, ${f} fail, ${s} skipped |`));
  const moved = sh(process.execPath, ['tools/matrix-adjudication.mjs'], d);
  const base = clone('rv15-base');
  const unmoved = sh(process.execPath, ['tools/matrix-adjudication.mjs'], base);
  const framing = (out) => (out.match(/\b\d{2,4}-vs-\d{2,4}\b/g) || []).join(',');
  const shapeA = framing(moved.out) !== '' && framing(moved.out) !== framing(unmoved.out);

  cell('RV15-1 framing is derived OR named historical', (shapeA || shapeB) ? 'PASS' : 'FAIL',
    `shape A (printed framing tracks README): unmoved="${framing(unmoved.out)}" moved="${framing(moved.out)}" -> ${shapeA}\n` +
    `shape B (no present-tense 127/129 left in the header comment): ${shapeB}\n` +
    (staleLines.length ? 'lines still stating the numbers without a historical marker:\n' + staleLines.map((l) => '  ' + l).join('\n') : 'no unmarked 127/129 in the header'));

  const contradicts = header.split('\n').filter((l) => /\b(127|129)\b/.test(l) && /table says|a local run says/.test(l) && !HIST.test(l));
  cell('RV15-2 header does not announce a state this repo lacks', contradicts.length === 0 ? 'PASS' : 'FAIL',
    `README derives ${ROW.tests} tests / ${ROW.pass} pass; suite measures 128.\n` +
    (contradicts.length ? contradicts.map((l) => '  ' + l).join('\n') : 'no present-tense contradiction found'));
}

// ===========================================================================
console.log('\n' + '='.repeat(78));
for (const r of results) console.log(`  ${r.verdict.padEnd(8)} ${r.id}`);
const failed = results.filter((r) => r.verdict === 'FAIL');
const refuted = results.filter((r) => r.verdict === 'REFUTED');
console.log(`\nGATE: ${results.length - failed.length - refuted.length}/${results.length} PASS` +
  (failed.length ? `; FAIL: ${failed.map((r) => r.id).join(', ')}` : '') +
  (refuted.length ? `; REFUTED (claim did not reproduce): ${refuted.map((r) => r.id).join(', ')}` : ''));
console.log(`scratch: ${SCRATCH}`);
process.exitCode = failed.length > 0 ? 1 : 0;
