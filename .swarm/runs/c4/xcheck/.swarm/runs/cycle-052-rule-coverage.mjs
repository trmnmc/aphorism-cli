// cycle 52 — SPEC DOMAIN-RULE COVERAGE SWEEP.
//
// Question: for EVERY clause of SPEC.md § Domain rules, does the shipped suite
// (`node --test test/*.test.js`) protect it? Method is L-031 pointed at the spec's
// own rules rather than at the product: plant a mutant that VIOLATES the clause,
// then run the project's own test_cmd against the mutated tree.
//
// This is the generalisation of the cycle-50 instrument (which asked the same
// question about three selection mutants and found one uncovered clause, closed at
// cycle 51 as T-043). Cycle 50's harness took "this mutant is a real defect" from a
// separate gate. A 29-mutant sweep cannot borrow that, so every mutant here carries
// its OWN behavioural WITNESS:
//
//   witness(dir) -> true  iff the rule clause is OBSERVED TO HOLD in that tree,
//                          judged by running the shipped binary, never by reading it.
//
//   P0  pristine copy: every witness must hold, and the suite must be green.
//       If not, every verdict below is void.
//   Per mutant, three arms:
//     1. witness on the MUTATED tree. Still holds => the mutation is INERT and its
//        suite verdict is VOID — reported as INERT, never as "survived". This is the
//        arm that makes a SURVIVES verdict mean something: it proves the tree really
//        is broken at the user-facing surface before asking whether the suite noticed.
//     2. suite on the mutated tree. fail > 0 => KILLED. green at P0's pass count
//        => SURVIVED (the suite is green on a product that measurably violates the spec).
//     3. on KILLED, the failing test NAMES are extracted from TAP so a kill is
//        attributable, not just a red number.
//
// Output is a MAP, not a pass/fail gate: SURVIVED cells are holes in the suite's
// protection of the spec, to be FILED. Only an S-effort one gets closed this cycle.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIVE = '/opt/targets/aphorism-cli';
const EM = '—';

function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c52-'));
  for (const e of fs.readdirSync(LIVE)) {
    if (e === '.git' || e === '.swarm') continue;
    fs.cpSync(path.join(LIVE, e), path.join(dir, e), { recursive: true });
  }
  return dir;
}

// Run the SHIPPED binary in a tree. Every witness observes the product through this.
function run(dir, args) {
  const r = spawnSync(process.execPath, ['bin/aphorism.js', ...args], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const lines = (s) => (s === '' ? [] : s.replace(/\n$/, '').split('\n'));
// N independent runs of the same argv, deduped — the instrument for "deterministic".
function distinct(dir, args, n = 8) {
  const set = new Set();
  for (let i = 0; i < n; i++) set.add(run(dir, args).out);
  return set;
}

function suite(dir) {
  const files = fs.readdirSync(path.join(dir, 'test'))
    .filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
  const r = spawnSync(process.execPath, ['--test', ...files], { cwd: dir, encoding: 'utf8' });
  const out = r.stdout ?? '';
  const pass = Number(/^. pass (\d+)$/m.exec(out)?.[1]);
  const fail = Number(/^. fail (\d+)$/m.exec(out)?.[1]);
  // ATTRIBUTION, repaired twice. This runner is NOT emitting TAP: `node --test`
  // defaults to the SPEC reporter here, so there is no `not ok` line at all — the
  // first cycle-52 pass anchored on `^not ok`, the second allowed indentation, and
  // both resolved zero names on 25 kills because the line they sought never existed.
  // The real format is `✖ <name> (<n>ms)`, and the counts above only ever parsed
  // because the inherited cycle-50 regex leads with a wildcard char, which matches
  // this reporter's `ℹ` marker. Failing names are repeated in a trailing
  // "failing tests:" block, hence the dedupe.
  const failed = [...new Set(
    [...out.matchAll(/^✖ (.+?) \(\d+(?:\.\d+)?ms\)$/gm)].map((m) => m[1].trim())
  )];
  return { pass, fail, failed };
}

// --- the rule clauses, one mutant each -------------------------------------
// `rule` quotes the SPEC clause the mutant violates.
const M = [
  // ---- Selection -----------------------------------------------------------
  { id: 'S1', rule: 'seeded pick is deterministic', file: 'src/select.js',
    from: 'const rng = mulberry32(toUint32Seed(seed));', to: 'const rng = Math.random;',
    desc: 'a seeded pick becomes random',
    witness: (d) => distinct(d, ['--seed', '42']).size === 1 },
  { id: 'S2', rule: 'Infinity / -Infinity are accepted AND deterministic', file: 'src/select.js',
    from: '  const buf = new ArrayBuffer(8);',
    to: '  if (!Number.isFinite(seed)) return (Math.random() * 4294967296) >>> 0;\n  const buf = new ArrayBuffer(8);',
    desc: 'non-finite seeds go random again (the I-1 hole, re-planted)',
    witness: (d) => distinct(d, ['--seed', 'Infinity']).size === 1 && distinct(d, ['--seed', '-Infinity']).size === 1 },
  { id: 'S3', rule: 'without --seed, selection is uniform over the candidate set', file: 'src/select.js',
    from: 'index = Math.floor(Math.random() * candidates.length);',
    to: 'index = Math.floor(Math.random() * (candidates.length - 1));',
    desc: 'off-by-one: the last corpus entry is unreachable forever',
    witness: (d) => {
      const last = JSON.parse(run(d, ['--json', '--list']).out.trim().split('\n').pop()).text;
      for (let i = 0; i < 400; i++) if (run(d, ['--json']).out.includes(JSON.stringify(last).slice(1, -1))) return true;
      return false;
    } },
  { id: 'S4', rule: 'without --seed, selection is uniform over the candidate set', file: 'src/select.js',
    from: 'index = Math.floor(Math.random() * candidates.length);',
    to: 'index = Math.floor(Math.random() ** 2 * candidates.length);',
    desc: 'unseeded selection heavily biased toward the front of the corpus',
    // POWER CALIBRATION (repaired after the first cycle-52 pass reported S4 INERT).
    // index = floor(r^2 * n), so P(back half) = P(r > sqrt(.5)) = 0.293, not 0.5.
    // At N=400: uniform ~ 200 (sd 10), mutant ~ 117 (sd 9). The first pass used
    // N=120 with a >=30 threshold, which the MUTANT clears (~35) — so it could not
    // separate the two and INERT was an instrument verdict, not a product one.
    // Threshold 160 sits ~4 sd below uniform and ~4.8 sd above the mutant.
    witness: (d) => {
      const all = lines(run(d, ['--list']).out);
      const half = Math.floor(all.length / 2);
      const back = new Set(all.slice(half).map((l) => l.split(` ${EM} `)[0]));
      let hits = 0;
      for (let i = 0; i < 400; i++) if (back.has(run(d, []).out.split('\n')[0])) hits++;
      return hits >= 160;
    } },
  { id: 'S5', rule: 'the SAME seed and set yield the same aphorism (distinct seeds are not collapsed)',
    file: 'src/select.js', from: 'return (ints[0] ^ ints[1]) >>> 0;', to: 'return 0;',
    desc: 'every seed folds to one state — still deterministic, but reaches ONE entry',
    witness: (d) => new Set(['1', '2', '3', '7', '99'].map((s) => run(d, ['--seed', s]).out)).size > 1 },

  // ---- Filtering -----------------------------------------------------------
  { id: 'F1', rule: '--author matches case-insensitively', file: 'src/select.js',
    from: 'const needle = String(author).toLowerCase();', to: 'const needle = String(author);',
    desc: '--author becomes case-SENSITIVE',
    witness: (d) => run(d, ['--list', '--author', 'DIJK']).code === 0 },
  { id: 'F2', rule: '--author matches by SUBSTRING containment', file: 'src/select.js',
    from: 'entry.author.toLowerCase().includes(needle)', to: 'entry.author.toLowerCase() === needle',
    desc: '--author becomes an exact whole-field match',
    witness: (d) => run(d, ['--list', '--author', 'dijk']).code === 0 },
  { id: 'F3', rule: '--tag matches a WHOLE tag (--tag desi does not match design)', file: 'src/select.js',
    from: 'entry.tags.some((t) => t.toLowerCase() === needle)',
    to: 'entry.tags.some((t) => t.toLowerCase().includes(needle))',
    desc: '--tag becomes a substring match, so --tag desi matches design',
    witness: (d) => run(d, ['--list', '--tag', 'desi']).code === 1 },
  { id: 'F4', rule: '--tag matches case-insensitively', file: 'src/select.js',
    from: 'const needle = String(tag).toLowerCase();', to: 'const needle = String(tag);',
    desc: '--tag becomes case-SENSITIVE',
    witness: (d) => run(d, ['--list', '--tag', 'DESIGN']).code === 0 },
  { id: 'F5', rule: 'supplying both filters narrows to the intersection (AND, not OR)',
    file: 'src/select.js',
    from: '    result = result.filter((entry) =>\n      entry.tags.some((t) => t.toLowerCase() === needle)\n    );',
    to: '    const tagged = corpus.filter((entry) =>\n      entry.tags.some((t) => t.toLowerCase() === needle)\n    );\n    result = corpus.filter((e) => result.includes(e) || tagged.includes(e));',
    desc: 'the two filters UNION instead of intersecting',
    witness: (d) => {
      const a = lines(run(d, ['--list', '--author', 'dijk']).out).length;
      const t = lines(run(d, ['--list', '--tag', 'design']).out).length;
      const both = lines(run(d, ['--list', '--author', 'dijk', '--tag', 'design']).out).length;
      return both <= Math.min(a, t);
    } },

  // ---- Empty candidate set --------------------------------------------------
  { id: 'E1', rule: 'empty set after filtering is exit code 1, not an empty success',
    file: 'bin/aphorism.js', from: '    return EXIT_NO_MATCH;', to: '    return EXIT_OK;',
    desc: 'no-match exits 0',
    witness: (d) => run(d, ['--author', 'zzzznobody']).code === 1 },
  { id: 'E2', rule: 'empty set writes a human-readable message on stderr', file: 'bin/aphorism.js',
    from: "    process.stderr.write('aphorism: no aphorism matches those filters\\n');", to: '    ;',
    desc: 'the no-match message disappears — a silent failure',
    witness: (d) => run(d, ['--author', 'zzzznobody']).err.trim().length > 0 },
  { id: 'E3', rule: 'empty set writes ZERO BYTES on stdout', file: 'bin/aphorism.js',
    from: "    process.stderr.write('aphorism: no aphorism matches those filters\\n');",
    to: "    process.stderr.write('aphorism: no aphorism matches those filters\\n');\n    process.stdout.write('aphorism: no aphorism matches those filters\\n');",
    desc: 'the no-match message ALSO goes to stdout, poisoning a pipe',
    witness: (d) => run(d, ['--author', 'zzzznobody']).out.length === 0 },

  // ---- --list ---------------------------------------------------------------
  { id: 'L1', rule: '--list prints EVERY aphorism in the filtered set', file: 'bin/aphorism.js',
    from: '    const body = candidates', to: '    const body = candidates.slice(0, 5)',
    desc: '--list silently truncates to the first 5 entries',
    witness: (d) => lines(run(d, ['--list']).out).length === 50 },
  { id: 'L2', rule: '--list prints in CORPUS ORDER', file: 'bin/aphorism.js',
    from: '    const body = candidates', to: '    const body = candidates.slice().reverse()',
    desc: '--list emits the set in reverse corpus order',
    witness: (d) => lines(run(d, ['--list']).out)[0].startsWith('Premature optimization') },
  { id: 'L3', rule: '--list prints ONE PER LINE', file: 'bin/aphorism.js',
    from: "      .join('\\n');", to: "      .join('  ');",
    desc: 'the whole filtered set collapses onto one line',
    witness: (d) => lines(run(d, ['--list']).out).length === 50 },
  { id: 'L4', rule: '--list line form is `<text> SPACE EM-DASH SPACE <author>`', file: 'bin/aphorism.js',
    from: '`${e.text} — ${e.author}`', to: '`${e.text} - ${e.author}`',
    desc: 'the EM DASH separator degrades to a hyphen',
    witness: (d) => lines(run(d, ['--list']).out).every((l) => l.includes(` ${EM} `)) },
  { id: 'L5', rule: '--list accepts a valid --seed and IGNORES it (no pick happens)',
    file: 'bin/aphorism.js', from: '  if (opts.list) {', to: '  if (opts.list && opts.seed === undefined) {',
    desc: '--list --seed stops listing and does a single seeded pick instead',
    witness: (d) => {
      const plain = run(d, ['--list']).out;
      return run(d, ['--list', '--seed', '1']).out === plain && run(d, ['--list', '--seed', '999999']).out === plain;
    } },
  { id: 'L6', rule: '--list exits 0', file: 'bin/aphorism.js',
    from: '    process.stdout.write(`${body}\\n`);\n    return EXIT_OK;',
    to: '    process.stdout.write(`${body}\\n`);\n    return 3;',
    desc: '--list exits 3 on a successful listing',
    witness: (d) => run(d, ['--list']).code === 0 },
  { id: 'L7', rule: 'a seed that fails to parse is STILL a usage error under --list',
    file: 'bin/aphorism.js', from: '  if (opts.error) {', to: '  if (opts.error && !argv.includes(\'--list\')) {',
    desc: '--list swallows every usage error, including an unparseable seed',
    witness: (d) => run(d, ['--list', '--seed', 'abc']).code === 2 && run(d, ['--list', '--seed', 'abc']).out === '' },

  // ---- --json ---------------------------------------------------------------
  { id: 'J1', rule: '--json emits a SINGLE-LINE JSON object', file: 'bin/aphorism.js',
    from: 'JSON.stringify(chosen)', to: 'JSON.stringify(chosen, null, 2)',
    desc: '--json pretty-prints across many lines',
    witness: (d) => lines(run(d, ['--json']).out).length === 1 },
  { id: 'J2', rule: '--json carries at minimum the keys text, author, tags', file: 'bin/aphorism.js',
    from: 'JSON.stringify(chosen)', to: 'JSON.stringify({ text: chosen.text, author: chosen.author })',
    desc: 'the tags key is dropped from --json output',
    witness: (d) => {
      const o = JSON.parse(run(d, ['--json']).out);
      return ['text', 'author', 'tags'].every((k) => k in o);
    } },
  { id: 'J3', rule: '--json composes with the SEED flag', file: 'bin/aphorism.js',
    from: '  const chosen = pick(candidates, opts.seed);',
    to: '  const chosen = pick(candidates, opts.json ? undefined : opts.seed);',
    desc: '--json ignores --seed, so a seeded JSON pick is random',
    witness: (d) => distinct(d, ['--json', '--seed', '42']).size === 1 },
  { id: 'J3b', rule: '--json composes with the FILTER flags', file: 'bin/aphorism.js',
    from: '  const chosen = pick(candidates, opts.seed);',
    to: '  const chosen = pick(opts.json ? corpus : candidates, opts.seed);',
    desc: '--json ignores the filters and picks from the whole corpus',
    witness: (d) => {
      for (let i = 0; i < 40; i++) {
        if (!JSON.parse(run(d, ['--json', '--author', 'dijk']).out).author.toLowerCase().includes('dijk')) return false;
      }
      return true;
    } },
  { id: 'J4', rule: '--list --json emits one JSON OBJECT per line (NDJSON)', file: 'bin/aphorism.js',
    from: 'opts.json ? JSON.stringify(e)', to: 'opts.json ? JSON.stringify([e])',
    desc: 'each NDJSON line becomes a one-element ARRAY instead of an object',
    witness: (d) => {
      const ls = lines(run(d, ['--list', '--json']).out);
      return ls.length === 50 && ls.every((l) => {
        const v = JSON.parse(l);
        return v && typeof v === 'object' && !Array.isArray(v);
      });
    } },

  // ---- Exit codes -----------------------------------------------------------
  { id: 'X0', rule: 'exit code 0 on success', file: 'bin/aphorism.js',
    from: '  process.stdout.write(`${opts.json ? JSON.stringify(chosen) : format(chosen)}\\n`);\n  return EXIT_OK;',
    to: '  process.stdout.write(`${opts.json ? JSON.stringify(chosen) : format(chosen)}\\n`);\n  return 5;',
    desc: 'a successful ordinary run exits 5',
    witness: (d) => run(d, []).code === 0 },
  { id: 'X2a', rule: 'exit code 2 on an UNKNOWN FLAG', file: 'src/args.js',
    from: '    result.error = `unknown flag: ${arg}`;\n    return result;', to: '    continue;',
    desc: 'an unknown flag is silently ignored',
    witness: (d) => run(d, ['--bogus']).code === 2 && run(d, ['--bogus']).out === '' },
  { id: 'X2b', rule: 'exit code 2 on a MISSING FLAG ARGUMENT', file: 'src/args.js',
    from: '        result.error = `flag ${arg} requires a value`;\n        return result;', to: '        continue;',
    desc: 'a value flag with no value is silently ignored',
    witness: (d) => run(d, ['--author']).code === 2 && run(d, ['--author']).out === '' },
  { id: 'X2c', rule: 'exit code 2 on a SEED that Number() parses to NaN', file: 'src/args.js',
    from: '  if (Number.isNaN(n)) return { ok: false };', to: '  if (false) return { ok: false };',
    desc: '--seed abc is accepted and falls back to a random pick',
    witness: (d) => run(d, ['--seed', 'abc']).code === 2 && run(d, ['--seed', 'abc']).out === '' },
];

// --- P0: the pristine control ----------------------------------------------
console.log('P0 — pristine copy: every witness must HOLD and the suite must be green.');
console.log('     A witness that does not hold here is a BROKEN INSTRUMENT, not a product bug.\n');
const p0dir = copyTree();
const p0suite = suite(p0dir);
let p0ok = p0suite.fail === 0 && p0suite.pass > 0;
console.log(`  suite: ${p0suite.pass} pass / ${p0suite.fail} fail  ${p0ok ? 'OK' : 'BROKEN'}`);
const p0w = {};
for (const m of M) {
  let held;
  try { held = m.witness(p0dir) === true; } catch (e) { held = false; }
  p0w[m.id] = held;
  if (!held) { p0ok = false; console.log(`  witness ${m.id} DOES NOT HOLD on pristine — instrument broken`); }
}
console.log(`  witnesses: ${Object.values(p0w).filter(Boolean).length}/${M.length} hold`);
fs.rmSync(p0dir, { recursive: true, force: true });
if (!p0ok) { console.log('\nP0 FAILED — every verdict below would be void. Aborting.'); process.exit(1); }
console.log('  P0 OK — the instrument is sound; verdicts below are meaningful.\n');

// --- the sweep ---------------------------------------------------------------
console.log('SWEEP — one mutant per SPEC Domain-rule clause.\n');
const rows = [];
for (const m of M) {
  const dir = copyTree();
  const p = path.join(dir, m.file);
  const src = fs.readFileSync(p, 'utf8');
  const hits = src.split(m.from).length - 1;
  if (hits !== 1) {
    rows.push({ id: m.id, verdict: 'NOT-PLANTED', note: `anchor occurs ${hits}x`, rule: m.rule });
    console.log(`${m.id.padEnd(4)} NOT-PLANTED — anchor occurs ${hits}x in ${m.file}`);
    fs.rmSync(dir, { recursive: true, force: true });
    continue;
  }
  fs.writeFileSync(p, src.replace(m.from, m.to));

  let stillHolds;
  try { stillHolds = m.witness(dir) === true; } catch (e) { stillHolds = false; }

  let verdict, s = null;
  if (stillHolds) {
    verdict = 'INERT';
  } else {
    s = suite(dir);
    verdict = s.fail > 0 ? 'KILLED' : (s.pass === p0suite.pass ? 'SURVIVED' : 'ANOMALOUS');
  }
  rows.push({ id: m.id, verdict, rule: m.rule, desc: m.desc, s });
  const tail = s ? `  [suite ${s.pass}p/${s.fail}f]` : '  [suite not run — mutation had no observable effect]';
  console.log(`${m.id.padEnd(4)} ${verdict.padEnd(9)} ${m.rule}${tail}`);
  console.log(`     mutant: ${m.desc}`);
  if (verdict === 'KILLED') {
    const names = s.failed.slice(0, 4);
    const more = s.failed.length > 4 ? ` (+${s.failed.length - 4} more)` : '';
    console.log(`     killed by: ${names.length ? names.join(' | ') + more : '(names unresolved)'}`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- the map ------------------------------------------------------------------
const by = (v) => rows.filter((r) => r.verdict === v);
console.log('\n================ COVERAGE MAP ================');
console.log(`clauses swept:    ${rows.length}`);
console.log(`KILLED (protected): ${by('KILLED').length}  ${by('KILLED').map((r) => r.id).join(' ')}`);
console.log(`SURVIVED (HOLE):    ${by('SURVIVED').length}  ${by('SURVIVED').map((r) => r.id).join(' ')}`);
console.log(`INERT (void):       ${by('INERT').length}  ${by('INERT').map((r) => r.id).join(' ')}`);
console.log(`NOT-PLANTED:        ${by('NOT-PLANTED').length}  ${by('NOT-PLANTED').map((r) => r.id).join(' ')}`);
console.log(`ANOMALOUS:          ${by('ANOMALOUS').length}  ${by('ANOMALOUS').map((r) => r.id).join(' ')}`);
if (by('SURVIVED').length) {
  console.log('\nHOLES — the suite is green on a product that violates these clauses:');
  for (const r of by('SURVIVED')) console.log(`  ${r.id}  ${r.rule}\n      mutant that survived: ${r.desc}`);
}
console.log('\nA SURVIVED cell is a suite hole, not a product defect: the product is correct,');
console.log('but nothing would tell you if it stopped being correct.');
