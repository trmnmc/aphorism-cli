#!/usr/bin/env node
// cycle-007 conductor verification harness for the run #5 QA-full pass.
//
// Authored by the conductor AT VERIFICATION TIME. The scenario author never saw
// code; the executor never saw this file. Its job is twofold:
//
//   1. Re-run all four QA scenarios against the real binary with REAL exit codes
//      (spawnSync .status), because the executor could not capture $? in its
//      sandbox and inferred exit codes from harness error surfacing instead.
//   2. Prove the scenarios DISCRIMINATE, by re-running them against deliberately
//      mutated copies of the tree. A scenario that cannot go red is not evidence.
//      (L-029 failable+attributable, L-044 converse control.)
//
// Arms are built with `git archive HEAD` (L-042) rather than by copying a live
// tree. The real working tree is never touched.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const EM = '—';

function run(cwd, args) {
  const r = spawnSync('node', ['bin/aphorism.js', ...args], {
    cwd, encoding: 'buffer', timeout: 20000,
  });
  return {
    status: r.status,
    out: r.stdout ?? Buffer.alloc(0),
    err: r.stderr ?? Buffer.alloc(0),
  };
}

const lines = (b) => b.toString('utf8').split('\n').filter((l) => l.length > 0);

// ---------------------------------------------------------------- scenarios

// S1 — seed determinism composes with --author and --json, incl. exotic seeds.
function S1(cwd) {
  const f = [];
  const pairs = [
    ['filtered', ['--author', 'dijk', '--seed', '42', '--json']],
    ['neg_frac', ['--seed', '-3.5', '--json']],
    ['infinity', ['--seed', 'Infinity', '--json']],
  ];
  for (const [name, args] of pairs) {
    const a = run(cwd, args), b = run(cwd, args);
    if (a.status !== 0) { f.push(`${name}: exit ${a.status} (expected 0)`); continue; }
    if (!a.out.equals(b.out)) {
      f.push(`${name}: NOT byte-identical across two runs -> ${JSON.stringify(a.out.toString())} vs ${JSON.stringify(b.out.toString())}`);
      continue;
    }
    const ls = lines(a.out);
    if (ls.length !== 1) { f.push(`${name}: expected exactly 1 stdout line, got ${ls.length}`); continue; }
    let o;
    try { o = JSON.parse(ls[0]); } catch (e) { f.push(`${name}: stdout is not JSON: ${e.message}`); continue; }
    for (const k of ['text', 'author', 'tags']) {
      if (!(k in o)) f.push(`${name}: JSON missing key ${k}`);
    }
    if (!Array.isArray(o.tags)) f.push(`${name}: tags is not an array`);
    if (name === 'filtered' && !String(o.author).toLowerCase().includes('dijk')) {
      f.push(`filtered: author ${JSON.stringify(o.author)} does not contain "dijk" case-insensitively`);
    }
  }
  return f;
}

// S2 — --list is invariant under filter case and under any valid seed.
function S2(cwd) {
  const f = [];
  const invocations = [
    ['lower',   ['--list', '--author', 'dijk']],
    ['upper',   ['--list', '--author', 'DIJK']],
    ['seeded',  ['--list', '--author', 'dijk', '--seed', '999']],
    ['seeded2', ['--list', '--author', 'dijk', '--seed', '-1.25']],
  ].map(([n, a]) => [n, run(cwd, a)]);

  const [, base] = invocations[0];
  for (const [name, r] of invocations.slice(1)) {
    if (r.status !== base.status) f.push(`${name}: exit ${r.status} != lower's exit ${base.status}`);
    if (!r.out.equals(base.out)) f.push(`${name}: stdout NOT byte-identical to lower`);
  }
  if (base.status === 0) {
    for (const [name, r] of invocations) {
      if (r.err.length !== 0) f.push(`${name}: stderr non-empty on success (${r.err.length} bytes)`);
    }
    const ls = lines(base.out);
    if (ls.length === 0) f.push('lower: exit 0 but zero stdout lines');
    for (const [i, l] of ls.entries()) {
      const sep = ` ${EM} `;
      if (!l.includes(sep)) { f.push(`line ${i + 1}: no " ${EM} " separator: ${JSON.stringify(l)}`); continue; }
      const tail = l.slice(l.lastIndexOf(sep) + sep.length);
      if (!tail.toLowerCase().includes('dijk')) {
        f.push(`line ${i + 1}: author tail ${JSON.stringify(tail)} lacks "dijk"`);
      }
    }
  } else if (base.status === 1) {
    // ASSUMPTION-FAILURE branch: corpus lacks a Dijkstra author. Not a defect,
    // but the four-way identity must still hold (checked above).
    for (const [name, r] of invocations) {
      if (r.out.length !== 0) f.push(`${name}: exit 1 but stdout has ${r.out.length} bytes`);
      if (r.err.length === 0) f.push(`${name}: exit 1 but stderr empty`);
    }
  } else {
    f.push(`lower: unexpected exit ${base.status} (expected 0, or 1 on assumption failure)`);
  }
  return f;
}

// S3 — whole-tag matching vs substring, and AND-intersection.
function S3(cwd) {
  const f = [];
  const design = run(cwd, ['--list', '--json', '--tag', 'design']);
  const desi   = run(cwd, ['--list', '--json', '--tag', 'desi']);
  const dijk   = run(cwd, ['--list', '--json', '--author', 'dijk']);
  const both   = run(cwd, ['--list', '--json', '--author', 'dijk', '--tag', 'design']);

  // (a) every design line carries an EXACT design tag, not a substring match.
  if (design.status !== 0) {
    f.push(`design: exit ${design.status} (expected 0)`);
  } else {
    for (const [i, l] of lines(design.out).entries()) {
      const tags = (JSON.parse(l).tags || []).map((t) => String(t).toLowerCase());
      if (!tags.includes('design')) f.push(`design line ${i + 1}: no exact "design" tag, tags=${JSON.stringify(tags)}`);
    }
  }

  // (b) THE CRITICAL NEGATIVE. --tag desi must not return design-tagged entries.
  if (desi.status === 1) {
    if (desi.out.length !== 0) f.push(`desi: exit 1 but stdout has ${desi.out.length} bytes`);
    if (desi.err.length === 0) f.push('desi: exit 1 but stderr empty');
  } else if (desi.status === 0) {
    for (const [i, l] of lines(desi.out).entries()) {
      const tags = (JSON.parse(l).tags || []).map((t) => String(t).toLowerCase());
      if (!tags.includes('desi')) {
        f.push(`CRITICAL: desi line ${i + 1} has no literal "desi" tag (tags=${JSON.stringify(tags)}) -> --tag is substring-matching`);
      }
    }
  } else {
    f.push(`desi: unexpected exit ${desi.status}`);
  }

  // (c) intersection is exactly AND, in corpus order.
  if (dijk.status === 0 && design.status === 0) {
    const designSet = new Set(lines(design.out));
    const expected = lines(dijk.out).filter((l) => designSet.has(l));
    const actual = both.status === 0 ? lines(both.out) : [];
    if (expected.length === 0) {
      // (d) empty intersection must be exit 1, never exit 0 with empty stdout.
      if (both.status !== 1) f.push(`both: empty intersection but exit ${both.status} (expected 1)`);
      if (both.out.length !== 0) f.push('both: empty intersection but stdout non-empty');
    } else {
      if (both.status !== 0) f.push(`both: exit ${both.status} (expected 0)`);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        f.push(`both: intersection mismatch. expected ${expected.length} line(s), got ${actual.length}`);
      }
    }
  }
  return f;
}

// S4 — usage errors are exit 2 with silent stdout.
function S4(cwd) {
  const f = [];
  const cases = [
    ['list_seed_abc', ['--list', '--seed', 'abc']],
    ['seed_abc',      ['--seed', 'abc']],
    ['unknown_flag',  ['--frobnicate']],
    ['missing_arg',   ['--author']],
  ];
  for (const [name, args] of cases) {
    const r = run(cwd, args);
    if (r.status !== 2) f.push(`${name}: exit ${r.status} (expected exactly 2)`);
    if (r.out.length !== 0) f.push(`${name}: stdout ${r.out.length} bytes (expected 0)`);
    if (r.err.length === 0) f.push(`${name}: stderr empty (expected a message)`);
  }
  return f;
}

const SCENARIOS = { S1, S2, S3, S4 };

// ---------------------------------------------------------------- arms

// Each mutation names the ONE scenario it must kill. Any other scenario going
// red under it, or the named one staying green, invalidates the attribution.
const MUTATIONS = {
  'MUT-A': {
    kills: 'S3',
    what: '--tag becomes substring-matching',
    file: 'src/select.js',
    from: 'entry.tags.some((t) => t.toLowerCase() === needle)',
    to:   'entry.tags.some((t) => t.toLowerCase().includes(needle))',
  },
  'MUT-B': {
    kills: 'S1',
    what: '--seed is ignored; selection is always random',
    file: 'src/select.js',
    from: "if (typeof seed === 'number' && !Number.isNaN(seed)) {",
    to:   'if (false) {',
  },
  'MUT-C': {
    kills: 'S2',
    what: '--author matching becomes case-SENSITIVE on the needle',
    file: 'src/select.js',
    from: 'const needle = String(author).toLowerCase();',
    to:   'const needle = String(author);',
  },
  // Added after the first run of this harness: MUT-A/B/C all live in select.js,
  // which left S4 (usage errors) unproven as a discriminator. A scenario nobody
  // has shown can go red is not evidence, however green it is.
  'MUT-D': {
    kills: 'S4',
    what: 'an unparseable --seed stops being a usage error (exit 2 -> accepted)',
    file: 'src/args.js',
    from: '  if (Number.isNaN(n)) return { ok: false };',
    to:   '  if (Number.isNaN(n)) return { ok: true, value: undefined };',
  },
};

function buildArm(label) {
  const dir = mkdtempSync(join(tmpdir(), `aph-${label}-`));
  const ar = spawnSync('bash', ['-c', `git -C ${TARGET} archive HEAD | tar -x -C ${dir}`], { encoding: 'utf8' });
  if (ar.status !== 0) throw new Error(`git archive failed for ${label}: ${ar.stderr}`);
  return dir;
}

function applyMutation(dir, m) {
  const p = join(dir, m.file);
  const src = readFileSync(p, 'utf8');
  if (!src.includes(m.from)) throw new Error(`anchor NOT FOUND in ${m.file}: ${m.from}`);
  const occurrences = src.split(m.from).length - 1;
  if (occurrences !== 1) throw new Error(`anchor occurs ${occurrences}x in ${m.file}, expected exactly 1`);
  writeFileSync(p, src.replace(m.from, m.to));
}

function scoreArm(cwd) {
  const out = {};
  for (const [id, fn] of Object.entries(SCENARIOS)) {
    let f;
    try { f = fn(cwd); } catch (e) { f = [`harness threw: ${e.message}`]; }
    out[id] = f;
  }
  return out;
}

// ---------------------------------------------------------------- main

const armDirs = [];
const report = {};
try {
  // CONTROL: the live tree itself. This is the real verdict.
  console.log('=== ARM: LIVE (the real working tree) — this is the QA verdict ===');
  const live = scoreArm(TARGET);
  report.LIVE = live;
  for (const [id, f] of Object.entries(live)) {
    console.log(`  ${id}: ${f.length === 0 ? 'PASS' : 'FAIL'}`);
    for (const x of f) console.log(`      - ${x}`);
  }

  // CONVERSE CONTROL: pristine git archive of HEAD. Must match LIVE exactly;
  // if it does not, the working tree differs from HEAD and the run is unsound.
  const pristine = buildArm('pristine');
  armDirs.push(pristine);
  console.log('\n=== ARM: PRISTINE (git archive HEAD) — converse control, must be all-PASS ===');
  const pris = scoreArm(pristine);
  report.PRISTINE = pris;
  for (const [id, f] of Object.entries(pris)) {
    console.log(`  ${id}: ${f.length === 0 ? 'PASS' : 'FAIL'}`);
    for (const x of f) console.log(`      - ${x}`);
  }

  // MUTANTS: each must kill exactly its named scenario and no other.
  console.log('\n=== MUTATION MATRIX — does each scenario actually discriminate? ===');
  const matrix = {};
  for (const [id, m] of Object.entries(MUTATIONS)) {
    const dir = buildArm(id);
    armDirs.push(dir);
    applyMutation(dir, m);
    const s = scoreArm(dir);
    matrix[id] = s;
    const red = Object.entries(s).filter(([, f]) => f.length > 0).map(([k]) => k);
    const ok = red.length === 1 && red[0] === m.kills;
    console.log(`\n  ${id} (${m.what})`);
    console.log(`    must kill: ${m.kills}   actually red: [${red.join(', ')}]   ATTRIBUTION ${ok ? 'OK' : 'BROKEN'}`);
    if (s[m.kills].length > 0) console.log(`    kill reason: ${s[m.kills][0]}`);
  }
  report.MUTANTS = matrix;

  // ---- verdict
  console.log('\n=== VERDICT ===');
  const liveGreen = Object.values(live).every((f) => f.length === 0);
  const prisGreen = Object.values(pris).every((f) => f.length === 0);
  const attrOk = Object.entries(MUTATIONS).every(([id, m]) => {
    const red = Object.entries(matrix[id]).filter(([, f]) => f.length > 0).map(([k]) => k);
    return red.length === 1 && red[0] === m.kills;
  });
  console.log(`  LIVE all-pass:            ${liveGreen}`);
  console.log(`  PRISTINE all-pass:        ${prisGreen}`);
  console.log(`  every mutant attributed:  ${attrOk}`);
  console.log(`  SOUND (scenarios both pass on real code AND provably fail on broken code): ${liveGreen && prisGreen && attrOk}`);
  process.exitCode = liveGreen && prisGreen && attrOk ? 0 : 1;
} finally {
  for (const d of armDirs) rmSync(d, { recursive: true, force: true });
}
