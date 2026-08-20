// Cycle 9 verification gate: independently re-derive the TASTE pass's empirical claims.
// Authored by the conductor AT VERIFICATION TIME. The taste agent's `evidence` field is
// ITS evidence; every cell below re-measures from the shipped tree at run time and never
// reads the agent's return, the journal, or any prior cycle's summary.
//
// Discriminator design: the central claim is "the draw is MEMORYLESS, so repeats arrive
// inside one shell session". A no-repeat-rotation implementation could not produce ANY
// duplicate within 50 draws, and a with-replacement draw over N=50 must land its distinct
// count near 50*(1-(49/50)^n). Cells A2/A3 therefore compare an observed distinct count to
// that closed form rather than to a threshold I picked — an observable that a rotating
// implementation could not produce.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const BIN = path.join(TARGET, 'bin/aphorism.js');
const results = [];
const cell = (id, claim, fn) => {
  let pass, detail;
  try { const r = fn(); pass = r.pass; detail = r.detail; }
  catch (e) { pass = false; detail = 'THREW: ' + (e && e.message ? e.message : String(e)); }
  results.push({ id, claim, pass, detail });
};
const run = (args) => {
  try {
    return { out: execFileSync('node', [BIN, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), code: 0, err: '' };
  } catch (e) {
    return { out: e.stdout || '', code: e.status, err: e.stderr || '' };
  }
};

// --- corpus, read from the shipped module (not from any note) ---
const { corpus } = await import(path.join(TARGET, 'src/corpus.js'));
const N = corpus.length;

// A1 — corpus size is what the digest says. Anchors every expectation below.
cell('A1', 'corpus holds exactly 50 entries', () => ({
  pass: N === 50, detail: 'corpus.length = ' + N
}));

// A2 — MEMORYLESSNESS, 40 draws. Expected distinct under with-replacement = N*(1-((N-1)/N)^n).
// A rotation implementation would return 40 distinct. Tolerance +/-4 around the closed form.
cell('A2', '40 independent draws land near the with-replacement expectation, NOT at 40 distinct', () => {
  const seen = [];
  for (let i = 0; i < 40; i++) seen.push(run([]).out.split('\n')[0]);
  const distinct = new Set(seen).size;
  const expected = N * (1 - Math.pow((N - 1) / N, 40));
  const firstRepeatAt = (() => {
    const s = new Set();
    for (let i = 0; i < seen.length; i++) { if (s.has(seen[i])) return i + 1; s.add(seen[i]); }
    return null;
  })();
  const ok = distinct < 40 && Math.abs(distinct - expected) <= 4;
  return {
    pass: ok,
    detail: 'distinct ' + distinct + '/40, closed-form expectation ' + expected.toFixed(1)
      + ', |diff| ' + Math.abs(distinct - expected).toFixed(1)
      + '; first repeat at use ' + (firstRepeatAt === null ? 'NONE (rotation!)' : firstRepeatAt)
  };
});

// A3 — same shape at 30 draws, the sample size the agent reported 22/30 for.
cell('A3', '30 draws land near expectation (agent reported 22/30)', () => {
  const seen = [];
  for (let i = 0; i < 30; i++) seen.push(run([]).out.split('\n')[0]);
  const distinct = new Set(seen).size;
  const expected = N * (1 - Math.pow((N - 1) / N, 30));
  return {
    pass: distinct < 30 && Math.abs(distinct - expected) <= 4,
    detail: 'distinct ' + distinct + '/30, closed-form expectation ' + expected.toFixed(1)
      + ' (agent observed 22)'
  };
});

// A4 — CONVERSE CONTROL. The measurement above must be capable of reporting "no repeats"
// when there genuinely are none. Draw the corpus WITHOUT replacement in-process: if this
// cell reported a repeat, cells A2/A3 would be measuring noise rather than the draw.
cell('A4', 'CONTROL: a no-repeat sequence is reported as 40/40 distinct by the same counter', () => {
  const seen = corpus.slice(0, 40).map((e) => e.text);
  const distinct = new Set(seen).size;
  return { pass: distinct === 40, detail: 'control distinct ' + distinct + '/40 (must be 40)' };
});

// B1 — the no-match dead end: 'testing' is not a tag, 'debugging' is, and the message
// names neither the vocabulary nor the fold target.
cell('B1', '--tag testing exits 1 with a message that names no alternative', () => {
  const r = run(['--tag', 'testing']);
  const tags = new Set(corpus.flatMap((e) => e.tags || []));
  const msg = (r.err || '').trim();
  return {
    pass: r.code === 1 && !tags.has('testing') && tags.has('debugging')
      && !/debugging/.test(msg) && !/\btags?\b.*:/.test(msg),
    detail: 'exit ' + r.code + ' | stderr ' + JSON.stringify(msg)
      + ' | corpus has tag "testing"? ' + tags.has('testing')
      + ' | has "debugging"? ' + tags.has('debugging')
  };
});

// B2 — CONTROL for B1: a tag that DOES exist must succeed, proving B1's exit 1 is about
// the vocabulary and not about --tag being broken.
cell('B2', 'CONTROL: --tag debugging exits 0 and prints', () => {
  const r = run(['--tag', 'debugging']);
  return { pass: r.code === 0 && r.out.trim().length > 0, detail: 'exit ' + r.code + ', bytes ' + r.out.trim().length };
});

// C1 — tag vocabulary is undiscoverable from the CLI unaided: --help's only route is jq.
cell('C1', '--help offers only a jq pipeline for tag discovery', () => {
  const r = run(['--help']);
  const hasJq = /jq/.test(r.out);
  const hasDirect = /--tags\b|--list-tags\b/.test(r.out);
  return { pass: r.code === 0 && hasJq && !hasDirect, detail: 'exit ' + r.code + ' | mentions jq: ' + hasJq + ' | offers a direct tag-list flag: ' + hasDirect };
});

// D1 — author concentration, re-derived from the corpus module.
cell('D1', 'top authors are concentrated (agent claimed Dijkstra 7, Pike 5, Perlis 5)', () => {
  const c = {};
  for (const e of corpus) c[e.author] = (c[e.author] || 0) + 1;
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const authors = Object.keys(c).length;
  const share = top.slice(0, 3).reduce((s, [, n]) => s + n, 0) / N;
  return {
    pass: share >= 0.25,
    detail: 'top4 ' + top.map(([a, n]) => a + '=' + n).join(', ')
      + ' | distinct authors ' + authors + ' | top-3 share ' + (share * 100).toFixed(0) + '%'
  };
});

// E1 — determinism of --seed, the one flow that promises repeatability on purpose.
cell('E1', '--seed 42 is stable across invocations', () => {
  const a = run(['--seed', '42']).out, b = run(['--seed', '42']).out;
  return { pass: a === b && a.trim().length > 0, detail: a === b ? 'stable: ' + JSON.stringify(a.split('\n')[0].slice(0, 60)) : 'DIVERGED' };
});

const fails = results.filter((r) => !r.pass);
for (const r of results) console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.claim + '\n        ' + r.detail);
console.log('\n' + (results.length - fails.length) + ' PASS / ' + fails.length + ' FAIL');
process.exit(fails.length ? 1 : 0);
