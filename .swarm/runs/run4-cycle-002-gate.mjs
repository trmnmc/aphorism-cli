#!/usr/bin/env node
// ---------------------------------------------------------------------------
// run #4, cycle 2 — SEALED VERIFICATION GATE for the build wave [N-1, N-3].
//
// Authored by the CONDUCTOR before dispatch, sha256-sealed and committed with a
// discriminating baseline on the UNFIXED tree. No builder saw it. It is not edited
// after it runs: run #3 cycles 4/12/14 each established that rewriting a gate after
// the fact destroys the evidence of what it actually measured. If a cell turns out to
// be an instrument defect, the repair is a SEPARATE, four-column artifact.
//
// Cells:
//   A1-A7  N-1  .github/workflows/test.yml — a real Node 18/20/22/24 matrix
//   A8-A9  N-1  CONTROLS: the A2 and A5 extractors must FAIL on synthetic bad input
//   B1-B4  N-3  .swarm/runs/NAMING.md — forward-only run-scoped artifact convention
//   B5     N-3  CONTROL: the convention pattern must NOT match a legacy name
//   C1-C3  M-5  standing guard: suite green >= 118, corpus byte-identical, zero deps
//   C4     M-5  CONTROL: the suite parser must report failures on failing output
//   C5     M-5  nothing outside each item's declared file scope was touched
//
// Exit 0 iff every cell PASSES.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const MANIFEST = JSON.parse(fs.readFileSync(path.join(T, '.swarm/runs/run4-cycle-002-pre-manifest.json'), 'utf8'));
const CORPUS_SHA = '77a4de5c777a3bdb7099ea900e090831f3ec2d203e2346f9b9ac6419e545d09e';

const results = [];
const cell = (id, desc, fn) => {
  let ok = false, detail = '';
  try { const r = fn(); ok = r.ok; detail = r.detail; }
  catch (e) { ok = false; detail = 'threw: ' + e.message; }
  results.push({ id, desc, ok, detail });
};
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read = (rel) => fs.readFileSync(path.join(T, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(T, rel));

// --- shared extractors. Used by both the real cells and their controls, so a control
// --- failing means the extractor is blind, not that the input was odd.
const WF = '.github/workflows/test.yml';
// node-version list: any of `node-version: [18, 20, 22, 24]` or a block sequence.
function extractMatrixVersions(text) {
  const inline = text.match(/node[-_]version\s*:\s*\[([^\]]*)\]/i);
  if (inline) return inline[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
  const block = text.match(/node[-_]version\s*:\s*\n((?:\s*-\s*[^\n]+\n)+)/i);
  if (block) return block[1].split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/['"]/g, '')).filter(Boolean);
  return [];
}
// The repo's EXISTING test command, verbatim, as SPEC.md Commands states it.
const TEST_CMD = 'node --test test/*.test.js';
function runsExistingTestCommand(text) {
  return text.includes(TEST_CMD);
}
// The run-scoped naming convention: a run token AND a zero-padded cycle token.
const RUN_SCOPED = /run\d+-cycle-\d{3}-/;

// --- node --test output parser. Handles BOTH reporters: node 24 here emits the SPEC
// --- reporter (`ℹ tests 118`), while `# tests 118` is TAP. Cycle 1's C4 read only TAP
// --- and mis-reported a green suite as tests=0; this is that repair, carried forward.
function parseSuite(out) {
  const num = (label) => {
    const m = out.match(new RegExp('(?:^|\\n)\\s*(?:[#\\u2139]\\s*)' + label + '\\s+(\\d+)'));
    return m ? Number(m[1]) : null;
  };
  return { tests: num('tests'), pass: num('pass'), fail: num('fail') };
}

// =========================== N-1 : the Actions matrix ======================
cell('A1', 'workflow file exists at ' + WF, () => {
  const ok = exists(WF);
  return { ok, detail: ok ? sha(path.join(T, WF)).slice(0, 16) + ' / ' + read(WF).length + ' bytes' : 'MISSING' };
});

cell('A2', 'matrix covers exactly Node 18, 20, 22, 24', () => {
  if (!exists(WF)) return { ok: false, detail: 'no workflow file' };
  const got = extractMatrixVersions(read(WF)).map((v) => String(parseInt(v, 10)));
  const want = ['18', '20', '22', '24'];
  const missing = want.filter((w) => !got.includes(w));
  const extra = got.filter((g) => !want.includes(g));
  return { ok: missing.length === 0 && extra.length === 0, detail: 'got=[' + got.join(',') + '] missing=[' + missing + '] extra=[' + extra + ']' };
});

cell('A3', 'triggers on push to master AND workflow_dispatch', () => {
  if (!exists(WF)) return { ok: false, detail: 'no workflow file' };
  const t = read(WF);
  const hasPush = /(^|\n)\s*push\s*:/.test(t);
  const namesMaster = /branches\s*:.*master/s.test(t.split(/\n\s*jobs\s*:/)[0] || '');
  const hasDispatch = /workflow_dispatch\s*:/.test(t);
  return { ok: hasPush && namesMaster && hasDispatch, detail: 'push=' + hasPush + ' master=' + namesMaster + ' workflow_dispatch=' + hasDispatch };
});

cell('A4', 'fail-fast disabled so one bad version cannot hide the others', () => {
  if (!exists(WF)) return { ok: false, detail: 'no workflow file' };
  const ok = /fail[-_]fast\s*:\s*false/i.test(read(WF));
  return { ok, detail: ok ? 'fail-fast: false present' : 'fail-fast: false ABSENT — a Node 18 failure would cancel the evidence M-1 wants' };
});

cell('A5', 'runs the repo EXISTING test command unmodified: ' + TEST_CMD, () => {
  if (!exists(WF)) return { ok: false, detail: 'no workflow file' };
  const ok = runsExistingTestCommand(read(WF));
  return { ok, detail: ok ? 'verbatim command present' : 'the exact command string is absent' };
});

cell('A6', 'no dependency install step (zero-dep repo, no package.json)', () => {
  if (!exists(WF)) return { ok: false, detail: 'no workflow file' };
  const t = read(WF);
  const bad = ['npm ci', 'npm install', 'npm i ', 'yarn', 'pnpm'].filter((s) => t.includes(s));
  const cacheRef = /cache\s*:\s*['"]?npm/.test(t); // would fail: no lockfile in this repo
  return { ok: bad.length === 0 && !cacheRef, detail: 'install_steps=[' + bad.join(',') + '] npm_cache=' + cacheRef };
});

cell('A7', 'uses actions/checkout + actions/setup-node driven by the matrix', () => {
  if (!exists(WF)) return { ok: false, detail: 'no workflow file' };
  const t = read(WF);
  const co = /actions\/checkout@v\d/.test(t);
  const sn = /actions\/setup-node@v\d/.test(t);
  const wired = /node-version\s*:\s*\$\{\{\s*matrix\./.test(t);
  return { ok: co && sn && wired, detail: 'checkout=' + co + ' setup-node=' + sn + ' matrix-wired=' + wired };
});

cell('A8', 'CONTROL: the A2 extractor must MISS Node 18 in a workflow that omits it', () => {
  const synthetic = 'strategy:\n  matrix:\n    node-version: [20, 22, 24]\n';
  const got = extractMatrixVersions(synthetic).map((v) => String(parseInt(v, 10)));
  const ok = !got.includes('18') && got.length === 3;
  return { ok, detail: 'synthetic got=[' + got.join(',') + '] — extractor discriminates: ' + ok };
});

cell('A9', 'CONTROL: the A5 extractor must REJECT a workflow that runs `npm test` instead', () => {
  const synthetic = 'steps:\n  - run: npm test\n';
  const ok = runsExistingTestCommand(synthetic) === false;
  return { ok, detail: 'npm-test workflow accepted? ' + !ok + ' — extractor discriminates: ' + ok };
});

// =========================== N-3 : the naming convention ===================
const NAMING = '.swarm/runs/NAMING.md';

cell('B1', 'NAMING.md exists where the next conductor will meet it', () => {
  if (!exists(NAMING)) return { ok: false, detail: 'MISSING' };
  const bytes = fs.statSync(path.join(T, NAMING)).size;
  return { ok: bytes >= 400, detail: bytes + ' bytes' };
});

cell('B2', 'it states a run-scoped convention with a concrete matching example', () => {
  if (!exists(NAMING)) return { ok: false, detail: 'no NAMING.md' };
  const t = read(NAMING);
  const examples = (t.match(new RegExp(RUN_SCOPED.source, 'g')) || []);
  const namesCollision = /collid|overwrit|shadow|clash/i.test(t);
  return { ok: examples.length >= 1 && namesCollision, detail: 'run-scoped examples=' + examples.length + ' names-the-hazard=' + namesCollision };
});

cell('B3', 'FORWARD-ONLY: not one pre-existing .swarm/runs file renamed, edited or dropped', () => {
  const gone = [], changed = [];
  for (const [rel, want] of Object.entries(MANIFEST.runs_dir)) {
    const p = path.join(T, rel);
    if (!fs.existsSync(p)) { gone.push(rel); continue; }
    if (sha(p) !== want) changed.push(rel);
  }
  return { ok: gone.length === 0 && changed.length === 0, detail: 'pre=' + Object.keys(MANIFEST.runs_dir).length + ' gone=' + gone.length + ' changed=' + changed.length + (gone.length + changed.length ? ' :: ' + [...gone, ...changed].slice(0, 5).join(' ') : '') };
});

cell('B4', 'the convention is TRUE, not merely written: every file this cycle added to .swarm/runs obeys it', () => {
  const now = new Set(fs.readdirSync(path.join(T, '.swarm/runs')).filter((f) => fs.statSync(path.join(T, '.swarm/runs', f)).isFile()));
  const before = new Set(Object.keys(MANIFEST.runs_dir).map((r) => path.basename(r)));
  const added = [...now].filter((f) => !before.has(f));
  const violating = added.filter((f) => f !== 'NAMING.md' && !RUN_SCOPED.test(f));
  return { ok: added.length > 0 && violating.length === 0, detail: 'added=' + added.length + ' violating=[' + violating.join(',') + ']' };
});

cell('B5', 'CONTROL: the convention pattern must NOT match a legacy name', () => {
  const legacy = ['cycle-001-gate.mjs', 'cycle-015-done-gate.mjs', 'cycle-009-taste.json'];
  const falseMatches = legacy.filter((f) => RUN_SCOPED.test(f));
  return { ok: falseMatches.length === 0, detail: 'legacy names matched by the new pattern: ' + falseMatches.length + ' — pattern discriminates: ' + (falseMatches.length === 0) };
});

// =========================== M-5 : the standing guard ======================
let suiteOut = '', suiteExit = 0;
try {
  suiteOut = execSync(TEST_CMD + ' 2>&1', { cwd: T, encoding: 'utf8', timeout: 180000 });
} catch (e) {
  suiteOut = String(e.stdout || '') + String(e.stderr || '');
  suiteExit = e.status == null ? -1 : e.status;
}

cell('C1', 'suite green: >= 118 tests, 0 failures, exit 0', () => {
  const s = parseSuite(suiteOut);
  const ok = s.tests !== null && s.tests >= 118 && s.fail === 0 && suiteExit === 0;
  return { ok, detail: 'tests=' + s.tests + ' pass=' + s.pass + ' fail=' + s.fail + ' exit=' + suiteExit };
});

cell('C2', 'src/corpus.js byte-identical (locked non-goal)', () => {
  const got = sha(path.join(T, 'src/corpus.js'));
  return { ok: got === CORPUS_SHA, detail: got.slice(0, 16) + ' vs sealed ' + CORPUS_SHA.slice(0, 16) };
});

cell('C3', 'zero dependencies: no package.json, no lockfile, no node_modules', () => {
  const bad = ['package.json', 'package-lock.json', 'node_modules', 'yarn.lock', 'pnpm-lock.yaml'].filter((f) => exists(f));
  return { ok: bad.length === 0, detail: bad.length ? 'PRESENT: ' + bad.join(',') : 'none present' };
});

cell('C4', 'CONTROL: the suite parser must report failures on FAILING output', () => {
  const synthetic = 'ℹ tests 118\nℹ pass 115\nℹ fail 3\n';
  const s = parseSuite(synthetic);
  const ok = s.tests === 118 && s.fail === 3;
  return { ok, detail: 'synthetic parsed tests=' + s.tests + ' fail=' + s.fail + ' — not a rubber stamp: ' + ok };
});

cell('C5', 'no product code touched: src/ bin/ test/ and README/REPORT byte-identical', () => {
  const changed = [];
  for (const [rel, want] of Object.entries({ ...MANIFEST.product, ...MANIFEST.docs })) {
    const p = path.join(T, rel);
    if (!fs.existsSync(p) || sha(p) !== want) changed.push(rel);
  }
  return { ok: changed.length === 0, detail: changed.length ? 'CHANGED: ' + changed.join(',') : Object.keys({ ...MANIFEST.product, ...MANIFEST.docs }).length + ' files unchanged' };
});

// =========================== report ========================================
const pass = results.filter((r) => r.ok).length;
console.log('run #4 cycle 2 sealed gate — wave [N-1, N-3] + M-5 standing guard\n');
for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.id.padEnd(4) + ' ' + r.desc + '\n           ' + r.detail);
console.log('\n' + pass + ' PASS / ' + (results.length - pass) + ' FAIL of ' + results.length);
console.log('\n--- raw test_cmd tail ---');
console.log(suiteOut.split('\n').filter((l) => /tests|pass|fail|duration_ms/.test(l)).slice(-6).join('\n'));
process.exit(pass === results.length ? 0 : 1);
