#!/usr/bin/env node
// run #4, cycle 3 — SEALED VERIFICATION GATE for wave [N-7 (conductor), N-2 (builder)]
//
// Authored and sha256-sealed BEFORE dispatch. Builders never see this file.
// Pre-dispatch tree SHA: 39b681837df404d7abbb4db078c7755411fee1f5
//
// Usage:  node .swarm/runs/run4-cycle-003-gate.mjs [--baseline]
//   --baseline  run against the UNFIXED tree; the A/B cells MUST fail there.
//               A gate that passes before the work is done measures nothing.
//
// Exit 0 iff every non-CONTROL cell passes AND every CONTROL cell behaves as stated.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = '/opt/targets/aphorism-cli';
const SEAL_SHA = '39b681837df404d7abbb4db078c7755411fee1f5';
const RUN_URL = 'https://github.com/trmnmc/aphorism-cli/actions/runs/32267338333';

const BASELINE = process.argv.includes('--baseline');
const rows = [];
function cell(id, name, ok, detail) {
  rows.push({ id, name, ok: !!ok, detail: String(detail ?? '') });
}

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });

// ---------------------------------------------------------------- inputs
const preReport = git('show', `${SEAL_SHA}:REPORT.md`);
const preReadme = git('show', `${SEAL_SHA}:README.md`);

const nowReport = BASELINE ? preReport : read(join(ROOT, 'REPORT.md'));
const nowReadme = BASELINE ? preReadme : read(join(ROOT, 'README.md'));
const histPath = join(ROOT, 'docs/report-history.md');
const nowHist = BASELINE ? null : read(histPath);

// ============================================================ N-7 : README
// Acceptance (backlog N-7): the Node floor README states is backed by the OBSERVED
// result of a real multi-version CI run, cited; and the floor is recorded as
// verified-at-18, NOT proven-minimal.

const OVERCLAIM = [
  /minimum\s+supported/i,
  /proven\s+minimal/i,
  /lowest\s+supported\s+version/i,
  /guaranteed\s+to\s+(?:work|run)\s+on\s+node\s*1[0-7]/i,
  /does\s+not\s+(?:work|run)\s+on\s+node\s*1[0-7]/i,
  /node\s*1[0-7][^\d].{0,40}\bfails?\b/i,
];
const HONEST = [
  /lowest\s+version\s+(?:actually\s+)?tested/i,
  /verified[- ]at[- ]18/i,
  /lowest\s+(?:node\s+)?version\s+(?:in|on)\s+the\s+matrix/i,
  /nothing\s+(?:here\s+)?tests?\s+node\s*1[0-7]/i,
  /not\s+proven\s+minimal/i,
];

function a1(txt) { return txt !== null && txt.includes(RUN_URL); }
function a2(txt) {
  if (txt === null) return { ok: false, seen: [] };
  // each observed major must appear together with its real result (118 pass / 0 fail)
  const majors = ['18', '20', '22', '24'];
  const seen = majors.filter((m) => new RegExp(`(?:^|[^\\d])v?${m}[.\\d]*[^\\n]{0,80}118`, 'm').test(txt));
  return { ok: seen.length === 4, seen };
}
function a3(txt) {
  if (txt === null) return { ok: false, honest: false, over: [] };
  const honest = HONEST.some((r) => r.test(txt));
  const over = OVERCLAIM.filter((r) => r.test(txt)).map(String);
  return { ok: honest && over.length === 0, honest, over };
}

cell('A1', 'README cites the REAL run URL', a1(nowReadme), a1(nowReadme) ? RUN_URL : `absent (${RUN_URL})`);
{
  const r = a2(nowReadme);
  cell('A2', 'all four observed majors carry their 118-pass result', r.ok, `matched=[${r.seen.join(',')}]`);
}
{
  const r = a3(nowReadme);
  cell('A3', 'floor stated as verified-at-18, no minimality overclaim', r.ok,
    `honest-phrase=${r.honest} overclaims=${r.over.length}`);
}
// CONTROL A4 — the pre-dispatch README must FAIL A1..A3. If it passed, the cells
// are measuring something that was already true and prove nothing about this cycle.
{
  const pre = a1(preReadme) && a2(preReadme).ok && a3(preReadme).ok;
  cell('A4', 'CONTROL: unfixed README must FAIL A1-A3', pre === false,
    `unfixed verdict=${pre} (A1=${a1(preReadme)} A2=${a2(preReadme).ok} A3=${a3(preReadme).ok})`);
}
// CONTROL A5 — a README that cites the URL but claims minimality must be REJECTED.
{
  const decoy = preReadme.replace('Node 18+', `Node 18+ (${RUN_URL}) — Node 18 is the proven minimal ` +
    'runtime; it is the lowest version actually tested. v18 118 v20 118 v22 118 v24 118');
  const rej = !(a3(decoy).ok);
  cell('A5', 'CONTROL: URL + minimality claim still REJECTED', rej, `decoy A3=${a3(decoy).ok}`);
}

// ============================================================ N-2 : REPORT move
// M-2's mechanical rule: every non-whitespace line of the pre-dispatch REPORT.md must
// still appear in the concatenation of the new REPORT.md and the appendix, with at
// least its original multiplicity. Paraphrase, reflow, or a tidied citation fails.

function lineCounts(txt) {
  const m = new Map();
  for (const raw of txt.split('\n')) {
    const k = raw.trim();
    if (k === '') continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
function preservationAudit(preTxt, parts) {
  const want = lineCounts(preTxt);
  const have = new Map();
  for (const p of parts) {
    if (p === null) continue;
    for (const [k, v] of lineCounts(p)) have.set(k, (have.get(k) ?? 0) + v);
  }
  const missing = [];
  for (const [k, v] of want) {
    const got = have.get(k) ?? 0;
    if (got < v) missing.push({ line: k, want: v, got });
  }
  return { missing, distinct: want.size };
}

{
  const r = preservationAudit(preReport, [nowReport, nowHist]);
  cell('B1', 'every non-whitespace line survives the move (multiset)', r.missing.length === 0,
    `distinct=${r.distinct} missing=${r.missing.length}` +
    (r.missing.length ? ` first="${r.missing[0].line.slice(0, 70)}"` : ''));
}

// B2 — first screen answers ships / verified / open, each with real substance.
const FIRST_SCREEN_LINES = 200;
function firstScreenSections(txt) {
  if (txt === null) return { ok: false, found: {}, thin: [] };
  const head = txt.split('\n').slice(0, FIRST_SCREEN_LINES);
  const probes = {
    ships: /^#{1,4}\s.*\b(ships?|shipped|what (?:the|this) (?:cli|tool|command)\b.*\bdoes|what it does)\b/i,
    verified: /^#{1,4}\s.*\b(verified|machine-checked|machine checked|proven)\b/i,
    open: /^#{1,4}\s.*\b(open|unfinished|outstanding|hand-?off|what (?:is|remains) (?:open|unsettled))\b/i,
  };
  const idx = [];
  head.forEach((l, i) => { if (/^#{1,4}\s/.test(l)) idx.push(i); });
  const found = {}; const thin = [];
  const claimed = new Set();
  for (const [key, re] of Object.entries(probes)) {
    // DISTINCT headings: one heading may not satisfy two of the three questions.
    // (Baseline caught "### Build run — all 5 shipped, re-verified today" answering
    // both `ships` and `verified` at once, which is not a first screen, it is a pun.)
    const at = head.findIndex((l, i) => !claimed.has(i) && re.test(l));
    found[key] = at;
    if (at < 0) continue;
    claimed.add(at);
    const next = idx.find((i) => i > at);
    const body = head.slice(at + 1, next === undefined ? head.length : next)
      .filter((l) => l.trim() !== '' && !/^#{1,4}\s/.test(l));
    if (body.length < 3) thin.push(`${key}:${body.length}`);
  }
  const ok = Object.values(found).every((v) => v >= 0) && thin.length === 0;
  return { ok, found, thin };
}
{
  const r = firstScreenSections(nowReport);
  cell('B2', `ships/verified/open all answered in first ${FIRST_SCREEN_LINES} lines, each with >=3 content lines`,
    r.ok, `at=${JSON.stringify(r.found)} thin=[${r.thin.join(',')}]`);
}

// B3 — the history is MOVED, not copied: REPORT.md gets short, the appendix holds the bulk.
{
  const rl = nowReport === null ? -1 : nowReport.split('\n').length;
  const hl = nowHist === null ? -1 : nowHist.split('\n').length;
  const preL = preReport.split('\n').length;
  const ok = nowHist !== null && rl > 0 && rl <= 420 && hl >= 1000 && (rl + hl) >= preL;
  cell('B3', 'history MOVED: REPORT<=420 lines, appendix>=1000, nothing lost', ok,
    `pre=${preL} report=${rl} appendix=${hl} sum=${rl + hl}`);
}

// B4 — cross-references resolve. Every docs/report-history.md#anchor link from REPORT.md
// must hit a real heading; and REPORT.md must link to the appendix at least once.
function slug(h) {
  return h.replace(/^#{1,6}\s+/, '').trim().toLowerCase()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
}
{
  if (nowReport === null || nowHist === null) {
    cell('B4', 'cross-references resolve', false, 'REPORT.md or appendix missing');
  } else {
    const anchors = new Set(nowHist.split('\n').filter((l) => /^#{1,6}\s/.test(l)).map(slug));
    const links = [...nowReport.matchAll(/\]\(([^)\s]*report-history\.md)(#([^)\s]+))?\)/g)];
    const bad = links.filter((m) => m[3] && !anchors.has(m[3].toLowerCase()));
    const ok = links.length >= 1 && bad.length === 0;
    cell('B4', 'REPORT links to the appendix and every anchor resolves', ok,
      `links=${links.length} broken=${bad.length}` + (bad.length ? ` first=#${bad[0][3]}` : ''));
  }
}

// CONTROL B5 — B1 must FAIL on a paraphrase. Plant one changed line and re-audit.
{
  const victim = preReport.split('\n').find((l) => l.trim().length > 40 && !/^#/.test(l));
  const mutated = (nowReport ?? preReport).replace(victim, victim.replace(/\s+/g, '  ') + ' (tidied)');
  const r = preservationAudit(preReport, [mutated, nowHist]);
  const fires = r.missing.length > 0;
  cell('B5', 'CONTROL: B1 fires on a single paraphrased line', fires,
    `missing-after-mutation=${r.missing.length} victim="${(victim ?? '').slice(0, 50)}"`);
}

// CONTROL B6 — B2 must reject headings with no substance under them.
{
  const hollow = ['# r', '## What ships', '', '## What is machine-verified', '', '## What is open', ''].join('\n');
  const rej = !firstScreenSections(hollow).ok;
  cell('B6', 'CONTROL: B2 rejects empty placeholder sections', rej, `hollow verdict=${firstScreenSections(hollow).ok}`);
}

// ============================================================ standing (M-5)
// Node's two reporters mark summary lines differently: TAP (Node 18/20/22) writes `#`,
// spec (Node 24) writes U+2139 INFORMATION SOURCE `ℹ` — NOT an ASCII `i`. The
// baseline run caught this: C4 certified an ASCII-`i` sample the tool never emits while
// C1 could not read the real output. A control built from a fabricated sample is a
// control over the fabrication.
const SUITE_RE_TOTAL = /^\s*(?:#|ℹ)\s+tests\s+(\d+)/m;
const SUITE_RE_PASS = /^\s*(?:#|ℹ)\s+pass\s+(\d+)/m;
const SUITE_RE_FAIL = /^\s*(?:#|ℹ)\s+fail\s+(\d+)/m;
function parseSuite(out) {
  const t = out.match(SUITE_RE_TOTAL), p = out.match(SUITE_RE_PASS), f = out.match(SUITE_RE_FAIL);
  if (!t || !p || !f) return null;
  return { tests: +t[1], pass: +p[1], fail: +f[1] };
}
{
  let out = '', code = 0;
  try {
    out = execFileSync('node', ['--test', 'test/args.test.js', 'test/cli.test.js', 'test/pipe.test.js',
      'test/readme-tags.test.js', 'test/select.test.js'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  } catch (e) { out = (e.stdout ?? '') + (e.stderr ?? ''); code = e.status ?? 1; }
  const s = parseSuite(out);
  const ok = !!s && s.tests >= 118 && s.fail === 0 && s.pass === s.tests && code === 0;
  cell('C1', 'suite green, >=118 tests', ok, s ? `tests=${s.tests} pass=${s.pass} fail=${s.fail} exit=${code}` : `UNPARSEABLE exit=${code}`);
}
// C2 — no product code touched by a docs wave.
{
  const files = ['src/args.js', 'src/corpus.js', 'src/select.js', 'bin/aphorism.js',
    'test/args.test.js', 'test/cli.test.js', 'test/pipe.test.js', 'test/readme-tags.test.js',
    'test/select.test.js', '.github/workflows/test.yml', 'docs/corpus-attribution-triage.md'];
  const drift = files.filter((f) => sha(git('show', `${SEAL_SHA}:${f}`)) !== sha(read(join(ROOT, f)) ?? ''));
  cell('C2', 'src/ bin/ test/ .github/ byte-identical to seal', drift.length === 0,
    drift.length ? `DRIFT: ${drift.join(', ')}` : `${files.length} files unchanged`);
}
// C3 — zero dependencies.
{
  const bad = ['package.json', 'package-lock.json', 'node_modules', 'yarn.lock', 'pnpm-lock.yaml']
    .filter((f) => existsSync(join(ROOT, f)));
  cell('C3', 'zero dependencies', bad.length === 0, bad.length ? bad.join(', ') : 'none present');
}
// CONTROL C4 — the suite parser must read BOTH reporters and must report failure on
// failing output. (Run #4 cycle 2 confirmed Node 18/20/22 emit TAP `#`, Node 24 `i`.)
{
  const tap = '# tests 118\n# suites 0\n# pass 115\n# fail 3\n';
  const spec = 'ℹ tests 118\nℹ suites 0\nℹ pass 115\nℹ fail 3\n';
  const asciiDecoy = 'i tests 118\ni pass 115\ni fail 3\n';
  const a = parseSuite(tap), b = parseSuite(spec), c = parseSuite(asciiDecoy);
  const ok = a && b && a.fail === 3 && b.fail === 3 && a.tests === 118 && b.tests === 118 && c === null;
  cell('C4', 'CONTROL: parser reads real TAP + real spec glyphs, sees failures', ok,
    `tap=${JSON.stringify(a)} spec=${JSON.stringify(b)} ascii-i-decoy=${JSON.stringify(c)}`);
}

// ---------------------------------------------------------------- report
const pass = rows.filter((r) => r.ok).length;
for (const r of rows) {
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.id.padEnd(3)} ${r.name.padEnd(62)} ${r.detail}`);
}
console.log(`  ${pass} PASS / ${rows.length - pass} FAIL of ${rows.length}${BASELINE ? '   [BASELINE: A/B cells are EXPECTED to fail]' : ''}`);
process.exit(pass === rows.length ? 0 : 1);
