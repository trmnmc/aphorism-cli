#!/usr/bin/env node
// run4 cycle 4 — SEALED VERIFICATION GATE for N-5 (M-4 hand-off).
//
// Authored by the conductor BEFORE dispatch and held under SWARM/runs/, which hard rule 5
// makes structurally unreachable to a builder (workflow agents receive target paths only).
// The cycle-14 decision of run #3 established this over committing the gate into the
// target and relying on a prompt line: an instruction is only as strong as compliance.
//
// Every expected value is re-derived from backlog.json AT RUN TIME, never hardcoded and
// never taken from a journal note — the cycle-3 defect of this run was a count that was
// true when written and false when committed.
//
// usage: node run4-cycle-004-gate.mjs [--report <path>] [--json]

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const TARGET = '/opt/targets/aphorism-cli';
const argv = process.argv.slice(2);
const reportPath = argv.includes('--report') ? argv[argv.indexOf('--report') + 1]
                                             : path.join(TARGET, 'REPORT.md');
const asJson = argv.includes('--json');

const backlog = JSON.parse(fs.readFileSync(path.join(TARGET, '.swarm', 'backlog.json'), 'utf8'));
const report = fs.readFileSync(reportPath, 'utf8');

// ---- derived truth -------------------------------------------------------------------
const blocked = backlog.items.filter((i) => i.status === 'blocked').map((i) => i.id).sort();
const done = backlog.items.filter((i) => i.status === 'done').map((i) => i.id);
const inflight = backlog.items.filter((i) => i.status === 'todo').map((i) => i.id);
const declined = backlog.items.filter((i) => i.status === 'dropped').map((i) => i.id);
const MUST_APPEAR = [...blocked, ...declined].sort();

// ---- the hand-off section ------------------------------------------------------------
const secStart = report.indexOf('## What is open');
const secEndRel = report.indexOf('\n## ', secStart + 1);
const section = secStart === -1 ? '' : report.slice(secStart, secEndRel > -1 ? secEndRel : report.length);

// Per-item entry: text from this id's first occurrence in the section up to the next id's
// occurrence (or section end). Format-agnostic — works for a table or a list.
function entries() {
  const marks = [];
  for (const id of MUST_APPEAR) {
    const at = section.indexOf(id);
    if (at !== -1) marks.push({ id, at });
  }
  marks.sort((a, b) => a.at - b.at);
  const out = {};
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].at : section.length;
    out[marks[i].id] = section.slice(marks[i].at, end);
  }
  return out;
}
const ent = entries();

function longestCommon(a, b) {
  // cheap LCS-substring, good enough to catch copy-pasted boilerplate
  let best = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagPrev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diagPrev + 1 : 0;
      if (prev[j] > best) best = prev[j];
      diagPrev = tmp;
    }
  }
  return best;
}

const AGENTY = /\b(builder|agent|swarm|this run|next cycle|conductor)\b/i;
const HUMAN = /\bhuman\b/i;

// ---- cells ---------------------------------------------------------------------------
const cells = [];
const add = (id, label, ok, detail) => cells.push({ id, label, ok: !!ok, detail: String(detail) });

add('A0', 'a "## What is open" section exists', secStart !== -1, `found_at=${secStart}`);

const missing = MUST_APPEAR.filter((x) => !ent[x]);
add('A1', 'every blocked + declined item id appears in the section',
    missing.length === 0, `expected=${MUST_APPEAR.join(',')} missing=${missing.join(',') || 'none'}`);

// R-1 must read as DECLINED, not as pending work.
const r1 = ent['R-1'] || '';
add('A2', 'R-1 is described as DECLINED with a reason, not as pending work',
    /\bdeclin/i.test(r1) && !/\bnot yet done\b/i.test(r1) && r1.length >= 80,
    `declined_word=${/\bdeclin/i.test(r1)} stale_phrase=${/\bnot yet done\b/i.test(r1)} len=${r1.length}`);

const noActor = blocked.filter((x) => !HUMAN.test(ent[x] || ''));
add('A3', 'every BLOCKED item names a human as next actor',
    noActor.length === 0, `without_human=${noActor.join(',') || 'none'}`);

// Strip inline code spans BEFORE the agent-wording test. Found by this gate's own
// pre-seal baseline: J-7's honest row cites the path `.swarm/SPEC.md`, and a bare
// /\bswarm\b/ read that filename as "an agent will do this". A4 is about who the PROSE
// says owns the item; a path is not prose.
const deCode = (s) => s.replace(/`[^`]*`/g, ' ').replace(/\bhuman\b/gi, ' ');
const agenty = blocked.filter((x) => AGENTY.test(deCode(ent[x] || '')));
add('A4', 'no blocked item is re-described as agent-pickable work',
    agenty.length === 0, `agent_worded=${agenty.join(',') || 'none'}`);

const tooShort = blocked.filter((x) => (ent[x] || '').length < 80);
add('A5a', 'every blocked item carries substantive settling evidence (>=80 chars)',
    tooShort.length === 0, `short=${tooShort.map((x) => `${x}:${(ent[x] || '').length}`).join(',') || 'none'}`);

let worstPair = null, worstLen = 0;
for (let i = 0; i < blocked.length; i++) {
  for (let j = i + 1; j < blocked.length; j++) {
    const l = longestCommon(ent[blocked[i]] || '', ent[blocked[j]] || '');
    if (l > worstLen) { worstLen = l; worstPair = `${blocked[i]}/${blocked[j]}`; }
  }
}
add('A5b', 'settling evidence is item-specific, not boilerplate (<60-char shared run)',
    worstLen < 60, `longest_shared=${worstLen} at=${worstPair}`);

// Anti-staleness: any count the section asserts must match backlog.json right now.
const counts = {};
for (const [key, re] of [['done', /(\d+)\s+done/i], ['inflight', /(\d+)\s+in flight/i],
                         ['blocked', /(\d+)\s+blocked/i]]) {
  const m = section.match(re); if (m) counts[key] = +m[1];
}
const mismatches = [];
if (counts.done !== undefined && counts.done !== done.length) mismatches.push(`done ${counts.done}!=${done.length}`);
if (counts.inflight !== undefined && counts.inflight !== inflight.length) mismatches.push(`inflight ${counts.inflight}!=${inflight.length}`);
if (counts.blocked !== undefined && counts.blocked !== blocked.length) mismatches.push(`blocked ${counts.blocked}!=${blocked.length}`);
add('A6', 'every count asserted in the section agrees with backlog.json NOW',
    mismatches.length === 0, `claimed=${JSON.stringify(counts)} truth={done:${done.length},inflight:${inflight.length},blocked:${blocked.length}} ${mismatches.join(' ')}`);

// The reader must not be sent elsewhere to learn what would settle an item.
const punts = /search it for the item'?s id|see the appendix for (?:the )?evidence|refer to `?\.swarm\/backlog\.json`? (?:for|to learn)/i;
add('A7', 'settling evidence is present here, not deferred to another document',
    !punts.test(section), `punt_phrase=${punts.test(section)}`);

add('A8', 'the hand-off is on the first screen (REPORT.md itself, <=160 lines)',
    secStart !== -1 && report.split('\n').length <= 160, `report_lines=${report.split('\n').length}`);

// Nothing dropped, measured against the pre-dispatch baseline recorded beside this gate.
const basePath = '/opt/swarm/runs/run4-cycle-004-preids.json';
if (fs.existsSync(basePath)) {
  const pre = JSON.parse(fs.readFileSync(basePath, 'utf8')).ids;
  const lost = pre.filter((x) => !report.includes(x));
  add('A9', 'no item id present pre-dispatch was dropped from REPORT.md',
      lost.length === 0, `pre=${pre.length} lost=${lost.join(',') || 'none'}`);
} else {
  add('A9', 'no item id present pre-dispatch was dropped from REPORT.md', false, 'baseline id file missing');
}

// ---- standing checks (C) -------------------------------------------------------------
function sh(cmd, args, opts = {}) {
  try { return { code: 0, out: execFileSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', timeout: 300000, ...opts }) }; }
  catch (e) { return { code: e.status ?? -1, out: (e.stdout || '') + (e.stderr || '') }; }
}
const suite = sh('node', ['--test', '--test-reporter=tap',
  'test/args.test.js', 'test/cli.test.js', 'test/pipe.test.js',
  'test/readme-tags.test.js', 'test/select.test.js'], { cwd: TARGET });
const nOf = (k) => { const m = suite.out.match(new RegExp(`^# ${k} (\\d+)$`, 'm')); return m ? +m[1] : null; };
add('C1', 'suite green and >=118 tests',
    suite.code === 0 && nOf('tests') >= 118 && nOf('fail') === 0,
    `tests=${nOf('tests')} pass=${nOf('pass')} fail=${nOf('fail')} exit=${suite.code}`);

const codeDirs = sh('git', ['-C', TARGET, 'status', '--porcelain', '--', 'src', 'bin', 'test', '.github']);
add('C2', 'src/ bin/ test/ .github/ untouched (N-5 is docs-only)',
    codeDirs.code === 0 && codeDirs.out.trim() === '', `porcelain=${JSON.stringify(codeDirs.out.trim())}`);

// This repo carries NO manifest at all — absence of package.json / lockfile / node_modules
// IS the zero-dependency proof. (Found by this gate's own pre-seal baseline: the first
// draft assumed a package.json and crashed. A gate is a program and needs its own baseline.)
const manifests = ['package.json', 'package-lock.json', 'node_modules']
  .filter((f) => fs.existsSync(path.join(TARGET, f)));
let depsOk = manifests.length === 0, depDetail = 'no manifest, no lockfile, no node_modules';
if (fs.existsSync(path.join(TARGET, 'package.json'))) {
  const pkg = JSON.parse(fs.readFileSync(path.join(TARGET, 'package.json'), 'utf8'));
  depsOk = Object.keys(pkg.dependencies || {}).length === 0;
  depDetail = `deps=${JSON.stringify(pkg.dependencies || {})}`;
}
add('C3', 'zero runtime dependencies', depsOk, `${depDetail} present=${JSON.stringify(manifests)}`);

// ---- report --------------------------------------------------------------------------
const passN = cells.filter((c) => c.ok).length;
if (asJson) {
  console.log(JSON.stringify({ cells, pass: passN, fail: cells.length - passN }, null, 2));
} else {
  console.log(`=== N-5 SEALED GATE — ${path.basename(reportPath)} ===\n`);
  for (const c of cells) console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.id.padEnd(4)} ${c.label}\n          ${c.detail}`);
  console.log(`\n${passN} PASS / ${cells.length - passN} FAIL of ${cells.length}`);
}
process.exit(passN === cells.length ? 0 : 1);
