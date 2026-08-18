#!/usr/bin/env node
// cycle-004 verification gate — AUTHORED AND SEALED BEFORE DISPATCH.
// Conductor-owned. Builders never see this file; it is written at 05:0x and hashed,
// and the hash is journaled before either Agent call is made.
//
// Covers: FLOOR (F1,F2) + N-4 (clause-completeness measurement) + N-6 (REPORT.md
// first-screen block, additive only).
//
// Design rules taken from the playbook and from cycle 3's three self-inflicted bugs:
//   * Never assert against prose matched by regex — read a structural marker the
//     document owns (here: a JSON sidecar the agent must emit). [L-043]
//   * Force --test-reporter=tap; an unparseable suite gets its own state and NEVER
//     falls through to a verdict. [cycle-3 bug 1]
//   * Every must-kill check gets a converse control that must stay GREEN. [L-044]

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/opt/targets/aphorism-cli';
const C4 = path.join(ROOT, '.swarm/runs/c4');
const PRE = path.join(C4, 'REPORT.md.pre');
const PRE_SHA = 'e152f20cb21f3cd7fd1e57219b2ccc128ed6248e2427a481ce024a8b326682a4';
const PRE_LINES = 1227;
const N4_JSON = path.join(ROOT, '.swarm/runs/cycle-004-clause-completeness.json');
const N4_MD = path.join(ROOT, '.swarm/runs/cycle-004-clause-completeness.md');

const results = [];
const ok = (id, msg) => results.push(['PASS', id, msg]);
const bad = (id, msg) => results.push(['FAIL', id, msg]);
const info = (id, msg) => results.push(['MANUAL', id, msg]);

// ---------------------------------------------------------------- F1: suite floor
function runSuite(cwd) {
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap', 'test/args.test.js',
      'test/cli.test.js', 'test/readme-tags.test.js', 'test/select.test.js'],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const g = (k) => { const m = out.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? +m[1] : null; };
  const tests = g('tests'), pass = g('pass'), fail = g('fail');
  if (tests === null || pass === null || fail === null) return { state: 'SUITE-UNPARSED', tests, pass, fail };
  return { state: 'OK', tests, pass, fail };
}

const live = runSuite(ROOT);
if (live.state !== 'OK') bad('F1', `FLOOR: suite output UNPARSEABLE — refusing to infer a verdict (${live.state})`);
else if (live.fail === 0 && live.tests === live.pass && live.tests >= 102)
  ok('F1', `FLOOR: suite green — tests ${live.tests} / pass ${live.pass} / fail ${live.fail} (>= known 102)`);
else bad('F1', `FLOOR: suite NOT green — tests ${live.tests} / pass ${live.pass} / fail ${live.fail}`);

// ------------------------------------------- F2: nobody touched code / other docs
const porc = execFileSync('git', ['-C', ROOT, 'status', '--porcelain'], { encoding: 'utf8' });
const touched = porc.split('\n').filter(Boolean).map((l) => l.slice(3).trim());
const forbidden = touched.filter((f) =>
  f.startsWith('src/') || f.startsWith('test/') || f.startsWith('bin/') ||
  f.startsWith('docs/') || f === 'README.md');
if (forbidden.length === 0) ok('F2', `FLOOR: src/ test/ bin/ docs/ README.md all untouched (${touched.length} paths dirty, none forbidden)`);
else bad('F2', `FLOOR: forbidden paths modified — ${forbidden.join(', ')}`);

const outsideScope = touched.filter((f) => f !== 'REPORT.md' && !f.startsWith('.swarm/'));
if (outsideScope.length === 0) ok('F3', 'FLOOR: writes confined to REPORT.md + .swarm/ as scoped');
else bad('F3', `FLOOR: writes outside scope — ${outsideScope.join(', ')}`);

// ------------------------------------------------- N-6: additive-only preservation
// preserve(newText) -> {okFlag, insertLines, reason}
function preserveCheck(newText, preText) {
  const pre = preText.split('\n');
  const nw = newText.split('\n');
  if (nw[0] !== pre[0]) return { okFlag: false, reason: 'line 1 (the H1 title) changed' };
  const tail = pre.slice(1);            // old lines 2..N, must survive contiguously
  // find tail as a contiguous byte-identical run inside nw
  let at = -1;
  for (let i = 1; i + tail.length <= nw.length; i++) {
    let m = true;
    for (let j = 0; j < tail.length; j++) { if (nw[i + j] !== tail[j]) { m = false; break; } }
    if (m) { at = i; break; }
  }
  if (at < 0) return { okFlag: false, reason: 'old lines 2..N are NOT present as a contiguous byte-identical block' };
  const trailing = nw.length - (at + tail.length);
  if (trailing > 1) return { okFlag: false, reason: `${trailing} lines appended AFTER the preserved block (insert must go at the top)` };
  return { okFlag: true, insertLines: at - 1, at };
}

const preText = fs.readFileSync(PRE, 'utf8');
const preSha = execFileSync('sha256sum', [PRE], { encoding: 'utf8' }).split(' ')[0];
if (preSha === PRE_SHA && preText.split('\n').length - 1 === PRE_LINES)
  ok('N6-0', `BASELINE: REPORT.md.pre matches the sealed sha256 ${PRE_SHA.slice(0, 12)}… at ${PRE_LINES} lines`);
else bad('N6-0', `BASELINE TAMPERED: sha ${preSha.slice(0, 12)}… lines ${preText.split('\n').length - 1}`);

const newText = fs.readFileSync(path.join(ROOT, 'REPORT.md'), 'utf8');
const pc = preserveCheck(newText, preText);
if (pc.okFlag) ok('N6-b', `PRESERVATION: line 1 intact; all ${PRE_LINES - 1} pre-existing lines 2..${PRE_LINES} survive byte-identical and contiguous; ${pc.insertLines} lines inserted at line 2`);
else bad('N6-b', `PRESERVATION BROKEN: ${pc.reason}`);

if (pc.okFlag) {
  if (pc.insertLines >= 5 && pc.insertLines <= 48) ok('N6-c', `ONE SCREEN: inserted block is ${pc.insertLines} lines (5..48 allowed)`);
  else bad('N6-c', `ONE SCREEN: inserted block is ${pc.insertLines} lines — outside 5..48`);
}

// N6-e  MUST-KILL CONTROL: delete one pre-existing line -> preservation MUST fail
{
  const l = newText.split('\n');
  const victim = pc.okFlag ? pc.at + 40 : 60;
  const mutated = l.slice(0, victim).concat(l.slice(victim + 1)).join('\n');
  const r = preserveCheck(mutated, preText);
  if (!r.okFlag) ok('N6-e', 'CONTROL (must-kill): deleting a single pre-existing line IS detected');
  else bad('N6-e', 'CONTROL FAILED: a deleted pre-existing line went UNDETECTED — this check is vacuous');
}

// N6-f  CONVERSE CONTROL: edit only the INSERTED block -> preservation MUST stay green
if (pc.okFlag && pc.insertLines >= 2) {
  const l = newText.split('\n');
  l[1] = l[1] + ' ';
  const r = preserveCheck(l.join('\n'), preText);
  if (r.okFlag) ok('N6-f', 'CONVERSE CONTROL (must-stay-green): editing only the inserted block stays PASS — not a snapshot test');
  else bad('N6-f', 'CONVERSE CONTROL FAILED: check dies on a benign edit to new text — it is a snapshot test, not an assertion');
}

// N6-d  every integer in the inserted block, listed for CONDUCTOR adjudication
if (pc.okFlag) {
  const block = newText.split('\n').slice(1, 1 + pc.insertLines);
  const nums = [];
  block.forEach((ln, i) => {
    for (const m of ln.matchAll(/\d[\d,]*/g)) nums.push(`L${i + 2}: ${m[0]}  «${ln.trim().slice(0, 90)}»`);
  });
  info('N6-d', `FACT ADJUDICATION — ${nums.length} integers in the inserted block, each to be re-derived BY HAND:\n      ` + nums.join('\n      '));
}

// ------------------------------------------------------- N-4: clause completeness
const LEGAL_V = new Set(['KILLED', 'SURVIVED', 'INERT', 'NOT-PLANTED']);
const LEGAL_C = new Set(['HOLE', 'BOUNDARY', 'n/a']);

function loadN4() {
  if (!fs.existsSync(N4_JSON)) return { err: 'sidecar JSON missing' };
  try { return { j: JSON.parse(fs.readFileSync(N4_JSON, 'utf8')) }; }
  catch (e) { return { err: 'sidecar JSON unparseable: ' + e.message }; }
}
const n4 = loadN4();

function n4Structural(j, tag) {
  const rows = j.clauses || [];
  const errs = [];
  if (!Array.isArray(rows) || rows.length === 0) errs.push('no clause rows');
  for (const r of rows) {
    if (!r.id || !r.source || typeof r.in_inherited_29 !== 'boolean') errs.push(`row ${r.id || '?'}: missing id/source/in_inherited_29`);
    if (!LEGAL_V.has(r.verdict)) errs.push(`row ${r.id}: illegal verdict ${JSON.stringify(r.verdict)}`);
    if (!LEGAL_C.has(r.classification)) errs.push(`row ${r.id}: illegal classification ${JSON.stringify(r.classification)}`);
    if (r.verdict === 'SURVIVED' && !['HOLE', 'BOUNDARY'].includes(r.classification))
      errs.push(`row ${r.id}: SURVIVED but not classified HOLE/BOUNDARY`);
    if (r.verdict === 'SURVIVED' && (!r.reasoning || r.reasoning.length < 40))
      errs.push(`row ${r.id}: SURVIVED classification lacks >=40 chars of reasoning`);
    if (r.verdict === 'NOT-PLANTED' && (!r.reasoning || r.reasoning.length < 30))
      errs.push(`row ${r.id}: NOT-PLANTED without >=30 chars of reason`);
  }
  return errs;
}

if (n4.err) bad('N4-a', `STRUCTURE: ${n4.err}`);
else {
  const errs = n4Structural(n4.j, 'live');
  const rows = n4.j.clauses;
  if (errs.length === 0) ok('N4-a', `STRUCTURE: ${rows.length} clause rows, every row legal; every SURVIVED row classified with reasoning`);
  else bad('N4-a', `STRUCTURE: ${errs.length} violations — ` + errs.slice(0, 6).join(' | '));

  // N4-b tally agreement, computed from ROWS (structure the doc owns), never from prose
  const t = { KILLED: 0, SURVIVED: 0, INERT: 0, 'NOT-PLANTED': 0 };
  let neu = 0, hole = 0, bound = 0;
  for (const r of rows) { t[r.verdict]++; if (!r.in_inherited_29) neu++; if (r.classification === 'HOLE') hole++; if (r.classification === 'BOUNDARY') bound++; }
  const claimed = n4.j.tally || {};
  const want = { derived: rows.length, new: neu, KILLED: t.KILLED, SURVIVED: t.SURVIVED, INERT: t.INERT, 'NOT-PLANTED': t['NOT-PLANTED'], HOLE: hole, BOUNDARY: bound };
  const dis = Object.entries(want).filter(([k, v]) => claimed[k] !== v);
  if (dis.length === 0) ok('N4-b', `TALLY: headline agrees with the rows — derived ${rows.length}, new ${neu}, KILLED ${t.KILLED}, SURVIVED ${t.SURVIVED}, INERT ${t.INERT}, NOT-PLANTED ${t['NOT-PLANTED']}, HOLE ${hole}, BOUNDARY ${bound}`);
  else bad('N4-b', `TALLY MISMATCH: ` + dis.map(([k, v]) => `${k} claimed ${claimed[k]} actual ${v}`).join('; '));

  // N4-c  the item's own acceptance: every NEW clause was actually measured
  const unmeasured = rows.filter((r) => !r.in_inherited_29 && !r.mutation_site);
  if (unmeasured.length === 0) ok('N4-c', `COVERAGE: all ${neu} newly-derived clauses carry a concrete mutation site — none left unmeasured`);
  else bad('N4-c', `COVERAGE: ${unmeasured.length} newly-derived clauses have NO mutation site (${unmeasured.map(r => r.id).join(',')})`);

  // N4-d  MUST-KILL CONTROL: a fabricated unclassified SURVIVED row must break N4-a
  {
    const fake = JSON.parse(JSON.stringify(n4.j));
    fake.clauses.push({ id: 'FAKE-1', source: 'fabricated', in_inherited_29: false, mutation_site: 'x', verdict: 'SURVIVED', classification: 'n/a', reasoning: '' });
    const e = n4Structural(fake, 'fake');
    if (e.length > 0) ok('N4-d', 'CONTROL (must-kill): a fabricated unclassified SURVIVED row IS detected');
    else bad('N4-d', 'CONTROL FAILED: a fabricated unclassified SURVIVED row went UNDETECTED — this check is vacuous');
  }
  // N4-e  CONVERSE CONTROL: a legal extra KILLED row must leave the structure check GREEN
  {
    const fine = JSON.parse(JSON.stringify(n4.j));
    fine.clauses.push({ id: 'CTRL-OK', source: 'SPEC line n', in_inherited_29: false, mutation_site: 'src/x.js: flip', verdict: 'KILLED', classification: 'n/a', reasoning: '' });
    const e = n4Structural(fine, 'fine');
    if (e.length === 0) ok('N4-e', 'CONVERSE CONTROL (must-stay-green): a legal extra KILLED row stays PASS — the structure check is not a blanket reject');
    else bad('N4-e', 'CONVERSE CONTROL FAILED: a legal row was rejected — check is over-strict: ' + e.join(' | '));
  }
  // N4-f  P0 + INERT controls must be RECORDED by the agent, and P0 must be green
  const ctl = n4.j.controls || {};
  if (ctl.p0 && ctl.p0.fail === 0 && ctl.p0.tests === ctl.p0.pass && ctl.inert && ctl.inert.fail === 0)
    ok('N4-f', `CONTROLS RECORDED: P0 pristine ${ctl.p0.tests}/${ctl.p0.pass} fail 0; INERT comment-only fail 0`);
  else bad('N4-f', `CONTROLS: P0/INERT missing or not green — ${JSON.stringify(ctl).slice(0, 160)}`);

  if (fs.existsSync(N4_MD)) ok('N4-g', `NARRATIVE: ${N4_MD.split('/').pop()} present (${fs.statSync(N4_MD).size} bytes)`);
  else bad('N4-g', 'NARRATIVE: the human-readable .md was not written');
}

// ------------------------------------------------------------------------- report
let fails = 0;
for (const [st, id, msg] of results) { if (st === 'FAIL') fails++; console.log(`${st.padEnd(6)} ${id.padEnd(6)} ${msg}`); }
console.log(fails === 0
  ? `\nGATE PASS — ${results.filter(r => r[0] === 'PASS').length}/${results.filter(r => r[0] !== 'MANUAL').length} automated checks passed (MANUAL items still require conductor adjudication)`
  : `\nGATE FAIL — ${fails} check(s) failed`);
process.exit(fails === 0 ? 0 : 1);
