#!/usr/bin/env node
// cycle-3 verification gate for backlog item P-3 (bidirectional doc-claim audit).
// Authored by the CONDUCTOR, sealed by sha256 BEFORE dispatch, held OUTSIDE the target
// repo (cycle-14 precedent: hard rule 5 makes SWARM/runs structurally unreachable to a
// builder, which is stronger than an instruction not to look).
//
// EVERY cell re-derives its expected value from the tree at run time -- from the shipped
// corpus module, from src/args.js, from the CLI's real exit codes, from a live lcov run --
// never from a journal note, a prior cycle's summary, or the document under audit.
//
// Usage:
//   node c003-gate-P-3.mjs [--inventory <path>] [--mutate <cellId>]
// --mutate applies a named falsification and asserts the corresponding cell turns RED
// (failability control: a cell that cannot fail is not evidence).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const T = '/opt/targets/aphorism-cli';
const argv = process.argv.slice(2);
const invPath = argv.includes('--inventory') ? argv[argv.indexOf('--inventory') + 1] : null;
const mutate = argv.includes('--mutate') ? argv[argv.indexOf('--mutate') + 1] : null;

const IN_SCOPE = ['README.md', 'docs/coverage-baseline.md', 'docs/corpus-attribution-triage.md'];

const results = [];
function cell(id, what, fn) {
  let pass, detail;
  try { const r = fn(); pass = r.pass; detail = r.detail; }
  catch (e) { pass = false; detail = 'THREW: ' + (e && e.message); }
  results.push({ id, what, pass, detail });
}
const read = (p) => fs.readFileSync(path.join(T, p), 'utf8');
function cli(args, opts = {}) {
  try {
    const out = execFileSync('node', ['bin/aphorism.js', ...args],
      { cwd: T, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

// ---- measured ground truth, derived from the shipped tree -------------------
const { corpus } = await import('file://' + path.join(T, 'src/corpus.js'));
const tagCount = {};
for (const a of corpus) for (const t of (a.tags || [])) tagCount[t] = (tagCount[t] || 0) + 1;
let TAGS = Object.entries(tagCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
let ENTRIES = corpus.length;
if (mutate === 'G3') TAGS = TAGS.map(([t, n], i) => (i === 0 ? [t, n + 1] : [t, n]));
if (mutate === 'G4') ENTRIES = ENTRIES + 1;

// ---- G1 citation resolution -------------------------------------------------
// Every `path:line`, every dir-less sibling shorthand (`select.js:83`), every `a.js:N-M`
// range. Resolution rule for a bare filename: search bin/ src/ test/ then repo root.
cell('G1', 'every file:line citation in the in-scope docs resolves to a real file AND a real line', () => {
  const RE = /\b([A-Za-z0-9_.\/-]+\.(?:js|mjs|md|json|ya?ml)):(\d+)(?:-(\d+))?\b/g;
  const cites = [];
  for (const f of IN_SCOPE) {
    const txt = mutate === 'G1' && f === 'docs/coverage-baseline.md'
      ? read(f) + '\nbogus reference src/select.js:99999\n' : read(f);
    txt.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(RE)) cites.push({ doc: f, docLine: i + 1, ref: m[1], a: +m[2], b: m[3] ? +m[3] : null });
    });
  }
  const bad = [];
  for (const c of cites) {
    const cands = c.ref.includes('/') ? [c.ref]
      : ['bin/' + c.ref, 'src/' + c.ref, 'test/' + c.ref, c.ref];
    const hit = cands.find((p) => fs.existsSync(path.join(T, p)));
    if (!hit) { bad.push(`${c.doc}:${c.docLine} -> NO SUCH FILE ${c.ref}`); continue; }
    const n = read(hit).split('\n').length;
    const last = c.b || c.a;
    if (c.a < 1 || last > n) bad.push(`${c.doc}:${c.docLine} -> ${hit} has ${n} lines, cited ${c.a}${c.b ? '-' + c.b : ''}`);
  }
  return { pass: bad.length === 0 && cites.length >= 10,
           detail: `${cites.length} file:line citations across ${IN_SCOPE.length} docs; ${bad.length} unresolvable` + (bad.length ? '\n      ' + bad.join('\n      ') : '') };
});

// ---- G2 markdown links + anchors --------------------------------------------
cell('G2', 'every local markdown link target exists; every in-page anchor matches a real heading slug', () => {
  const bad = []; let n = 0;
  for (const f of IN_SCOPE) {
    const txt = read(f);
    const slugs = new Set(txt.split('\n').filter((l) => /^#{1,6}\s/.test(l))
      .map((l) => l.replace(/^#{1,6}\s+/, '').toLowerCase()
        .replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-')));
    for (const m of txt.matchAll(/\]\(([^)]+)\)/g)) {
      const t = m[1]; n++;
      if (/^https?:/.test(t)) continue;
      if (t.startsWith('#')) { if (!slugs.has(t.slice(1))) bad.push(`${f} anchor ${t}`); continue; }
      const rel = path.join(path.dirname(path.join(T, f)), t.split('#')[0]);
      if (!fs.existsSync(rel)) bad.push(`${f} link ${t}`);
    }
  }
  return { pass: bad.length === 0 && n >= 4, detail: `${n} link targets; ${bad.length} broken` + (bad.length ? ' :: ' + bad.join(', ') : '') };
});

// ---- G3 README tag tables vs the shipped corpus ------------------------------
cell('G3', "README's two tag tables reproduce the measured tag multiset exactly (name AND count)", () => {
  const txt = read('README.md');
  const rows = [...txt.matchAll(/^\|\s*`([a-z]+)`\s*\|\s*(\d+)\s*\|$/gm)].map((m) => [m[1], +m[2]]);
  const doc = new Map(rows), got = new Map(TAGS);
  const diffs = [];
  for (const [t, n] of got) if (!doc.has(t)) diffs.push(`corpus tag '${t}'(${n}) MISSING from README tables`);
  for (const [t, n] of doc) {
    if (!got.has(t)) diffs.push(`README lists '${t}' which is NOT in the corpus`);
    else if (got.get(t) !== n) diffs.push(`'${t}': README ${n}, measured ${got.get(t)}`);
  }
  return { pass: diffs.length === 0 && rows.length >= 12,
           detail: `${rows.length} documented rows vs ${TAGS.length} measured tags; ${diffs.length} mismatches` + (diffs.length ? '\n      ' + diffs.join('\n      ') : '') };
});

// ---- G4 README's four prose count-claims about the vocabulary ----------------
cell('G4', "README's prose counts (distinct tags / tags on 2+ / tags on exactly 1 / smallest pool) are true", () => {
  const txt = read('README.md');
  const distinct = TAGS.length;
  const twoPlus = TAGS.filter(([, n]) => n >= 2).length;
  const exactlyOne = TAGS.filter(([, n]) => n === 1).length;
  const smallest = Math.min(...TAGS.map(([, n]) => n));
  const words = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
  const checks = [
    [`contains ${distinct} distinct tags`, new RegExp(`contains ${distinct} distinct tags`)],
    [`${twoPlus} tags appear on 2 or more entries`, new RegExp(`${twoPlus} tags appear on 2 or more entries`)],
    [`${exactlyOne} tags appear exactly once`, new RegExp(`${exactlyOne} tags appear exactly once`)],
    [`smallest pool holds ${words[smallest] || smallest}`, new RegExp(`smallest pool holds (?:${words[smallest] || ''}|${smallest})\\b`)],
  ];
  const missing = checks.filter(([, re]) => !re.test(txt)).map(([d]) => d);
  return { pass: missing.length === 0,
           detail: `measured: ${distinct} distinct, ${twoPlus} on 2+, ${exactlyOne} on exactly 1, smallest ${smallest} (of ${ENTRIES} entries); unsupported claims: ${missing.length}` + (missing.length ? ' :: ' + missing.join(' | ') : '') };
});

// ---- G5 the 26 folded tag names really match nothing -------------------------
cell('G5', 'every retired tag name README lists as folded is counted correctly AND matches nothing (exit 1)', () => {
  const txt = read('README.md');
  const para = txt.split('no longer match anything:')[1].split('\n\n')[1] || '';
  const names = [...para.matchAll(/\b([a-z]+)\b/g)].map((m) => m[1])
    .filter((w) => !['and', 'to', 'the', 'that', 'produced', 'this', 'change', 'is', 'fold', 'map'].includes(w));
  const uniq = [...new Set(names)].filter((w) => !tagCount[w]);
  const stillLive = uniq.filter((t) => cli(['--tag', t]).code !== 1);
  const claimsTwentySix = /Twenty-six low-count tag names were folded/.test(txt);
  return { pass: stillLive.length === 0 && claimsTwentySix && uniq.length === 26,
           detail: `README claims 26 folded names; parsed ${uniq.length} retired names, ${stillLive.length} still match something` + (stillLive.length ? ' :: ' + stillLive.join(', ') : '') };
});

// ---- G6 documented exit codes are the exit codes the binary really produces ---
cell('G6', 'each exit code README documents is reproduced by the shipped binary', () => {
  const obs = [];
  obs.push(['0 success', cli([]).code === 0]);
  obs.push(['0 help', cli(['--help']).code === 0]);
  obs.push(['1 no match', cli(['--tag', 'zzzznope']).code === 1]);
  obs.push(['1 stdout empty on no-match', cli(['--tag', 'zzzznope']).stdout === '']);
  obs.push(['2 unknown flag', cli(['--nope']).code === 2]);
  obs.push(['2 NaN seed', cli(['--seed', 'abc']).code === 2]);
  obs.push(['2 missing arg', cli(['--tag']).code === 2]);
  let pipe0 = false;
  try {
    execFileSync('sh', ['-c', 'node bin/aphorism.js --list | head -0'], { cwd: T, stdio: 'ignore' });
    pipe0 = true;
  } catch { pipe0 = false; }
  obs.push(['0 broken pipe (| head -0)', mutate === 'G6' ? false : pipe0]);
  const bad = obs.filter(([, ok]) => !ok).map(([d]) => d);
  return { pass: bad.length === 0, detail: `${obs.length} documented exit behaviours reproduced; ${bad.length} failed` + (bad.length ? ' :: ' + bad.join(', ') : '') };
});

// ---- G7 code->doc: the flag set is identical in three places -----------------
cell('G7', 'flags in src/args.js == flags in --help == flags in README (code->doc, both directions)', () => {
  const code = new Set([...read('src/args.js').matchAll(/'(--[a-z]+)':/g)].map((m) => m[1]));
  const help = new Set([...cli(['--help']).stdout.matchAll(/(--[a-z]+)/g)].map((m) => m[1]));
  const flagsSec = read('README.md').split('## Flags')[1].split('\n## ')[0];
  const rd = new Set([...flagsSec.matchAll(/(--[a-z]+)/g)].map((m) => m[1]));
  if (mutate === 'G7') code.add('--phantom');
  const all = new Set([...code, ...help, ...rd]);
  const diffs = [...all].filter((f) => !(code.has(f) && help.has(f) && rd.has(f)))
    .map((f) => `${f}: args=${code.has(f)} help=${help.has(f)} readme=${rd.has(f)}`);
  return { pass: diffs.length === 0 && code.size >= 6,
           detail: `${code.size} flags in args.js, ${help.size} in --help, ${rd.size} in README §Flags; ${diffs.length} asymmetric` + (diffs.length ? ' :: ' + diffs.join(', ') : '') };
});

// ---- G8 coverage-baseline's headline fraction re-derived from a live run ------
cell('G8', "coverage-baseline.md's headline branch fraction is re-derivable from a live lcov run", () => {
  const tmp = fs.mkdtempSync('/tmp/c003cov-');
  execFileSync('sh', ['-c',
    `node --test --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=${tmp}/l.info test/*.test.js >/dev/null 2>&1 || true`],
    { cwd: T });
  const lcov = fs.readFileSync(`${tmp}/l.info`, 'utf8');
  let BRF = 0, BRH = 0;
  for (const m of lcov.matchAll(/^BRF:(\d+)$/gm)) BRF += +m[1];
  for (const m of lcov.matchAll(/^BRH:(\d+)$/gm)) BRH += +m[1];
  fs.rmSync(tmp, { recursive: true, force: true });
  const doc = read('docs/coverage-baseline.md');
  // the doc must state the fraction it actually measures, and must NOT still say 64 of 65
  const statesFrac = new RegExp(`\\b${BRH}\\s*/\\s*${BRF}\\b|\\b${BRH} of ${BRF}\\b`).test(doc);
  const staleClaim = /64 of 65 branches executed/.test(doc);
  return { pass: statesFrac && !staleClaim,
           detail: `live lcov: BRH ${BRH} / BRF ${BRF} (${(100 * BRH / BRF).toFixed(2)}%); doc states ${BRH}/${BRF}: ${statesFrac}; stale "64 of 65" present: ${staleClaim}` };
});

// ---- G9 attribution-triage entry indices point at real corpus entries ---------
// The doc's index convention is DERIVED here, not assumed: each risk-table row is bound to
// the corpus entry it names (author + text prefix), and the whole table must agree on one
// convention. The pre-dispatch baseline of this cell assumed 1-based and was WRONG -- the
// doc is 0-based (#0 is Knuth). Calibrated before dispatch; recorded in the journal.
cell('G9', "corpus-attribution-triage.md's risk-table rows bind to the corpus entries they name (index -> author AND text prefix), on ONE consistent convention", () => {
  const txt = read('docs/corpus-attribution-triage.md');
  const rows = [...txt.matchAll(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([^|]+?)\s*\|/gm)]
    .map((m) => ({ n: +m[1], text: m[2], author: m[3] }));
  const score = (off) => rows.filter((r) => {
    const e = corpus[r.n + off];
    if (!e) return false;
    const head = r.text.replace(/[….]+$/, '').trim();
    return e.author === r.author && e.text.startsWith(head.slice(0, 20));
  }).length;
  const zero = score(0), one = score(-1);
  const off = zero >= one ? 0 : -1;
  const bad = rows.filter((r) => {
    const e = corpus[r.n + off];
    if (!e) return true;
    const head = r.text.replace(/[….]+$/, '').trim();
    return e.author !== r.author || !e.text.startsWith(head.slice(0, 20));
  }).map((r) => `#${r.n} claims ${r.author} / "${r.text.slice(0, 24)}"`);
  const inline = [...new Set([...txt.matchAll(/#(\d+)\b/g)].map((m) => +m[1]))];
  const oob = inline.filter((n) => n + off < 0 || n + off >= ENTRIES);
  return { pass: bad.length === 0 && oob.length === 0 && rows.length >= 40,
           detail: `${rows.length} risk-table rows; convention ${off === 0 ? '0-based' : '1-based'} (0-based binds ${zero}, 1-based binds ${one}); ${bad.length} rows bind to the wrong entry; ${inline.length} inline #N refs, ${oob.length} out of range` + (bad.length ? '\n      ' + bad.slice(0, 5).join('\n      ') : '') };
});

// ---- G10 P-5 standing floor --------------------------------------------------
cell('G10', 'P-5 floor: suite green at >= 119, src/corpus.js byte-identical to run start', () => {
  let out = '';
  try { out = execFileSync('sh', ['-c', 'node --test test/*.test.js 2>&1'], { cwd: T, encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const pass = +(out.match(/^.\s*pass (\d+)$/m)?.[1] ?? -1);
  const fail = +(out.match(/^.\s*fail (\d+)$/m)?.[1] ?? -1);
  const corpusDiff = execFileSync('git', ['diff', '81b0958', '--', 'src/corpus.js'], { cwd: T, encoding: 'utf8' });
  return { pass: pass >= 119 && fail === 0 && corpusDiff === '',
           detail: `pass ${pass} / fail ${fail}; src/corpus.js diff vs run start (81b0958): ${corpusDiff === '' ? 'IDENTICAL' : corpusDiff.split('\n').length + ' diff lines'}` };
});

// ---- G11 completeness of the dispatched inventory ----------------------------
cell('G11', 'the agent inventory covers every surface and every citation the gate independently found', () => {
  if (!invPath || !fs.existsSync(invPath)) return { pass: false, detail: 'NOT RUN — no inventory file supplied (expected before adjudication)' };
  const inv = fs.readFileSync(invPath, 'utf8');
  const surfaces = [...IN_SCOPE, '--help'];
  const missing = surfaces.filter((s) => !inv.includes(s));
  const claims = (inv.match(/^\s*\|/gm) || []).length;
  return { pass: missing.length === 0 && claims >= 30,
           detail: `inventory ${inv.length} bytes, ~${claims} table rows; surfaces not mentioned: ${missing.join(', ') || 'none'}` };
});

// ---- report -----------------------------------------------------------------
const P = results.filter((r) => r.pass).length;
console.log(`\ncycle-3 gate — item P-3 (bidirectional doc-claim audit)   ${P} PASS / ${results.length - P} FAIL` + (mutate ? `   [MUTATION ${mutate} ACTIVE]` : ''));
console.log('='.repeat(78));
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.what}`);
  console.log(`        ${r.detail}`);
}
if (mutate) {
  const c = results.find((r) => r.id === mutate);
  const ok = c && !c.pass;
  console.log(`\nFAILABILITY CONTROL: mutation ${mutate} => cell ${mutate} is ${c ? (c.pass ? 'GREEN' : 'RED') : 'MISSING'} — ${ok ? 'CONTROL PASSED (cell can fail)' : 'CONTROL FAILED (cell is vacuous)'}`);
  process.exit(ok ? 0 : 1);
}
process.exit(results.every((r) => r.pass) ? 0 : 1);
