// cycle 3, improvement run #3 — CONDUCTOR'S INDEPENDENT MUTATION ARM for item N-3.
//
// This is NOT the builder's instrument and does not read it. Every mutant below was
// authored by the conductor from src/select.js, src/args.js and bin/aphorism.js read
// directly, BEFORE any agent output existed. Its purpose is to answer one question
// with my own hands: does the shipped suite still kill a real spec violation?
//
// Method (hard rule 2): arms are built with `git archive` at the pre-dispatch commit,
// never by copying a live tree that may move underfoot while builders are working.
//
// Per mutant, three arms:
//   1. WITNESS on the mutated tree — the clause must be OBSERVED violated at the
//      user-facing surface. A witness that still holds means the mutation is INERT
//      and its suite verdict is VOID, reported as INERT, never as SURVIVED.
//   2. SUITE on the mutated tree — fail > 0 => KILLED, green => SURVIVED.
//   3. Attribution — on KILLED, the failing test names are extracted from the output.
//
// Controls:
//   P0     pristine archive: suite must be GREEN. If not, every verdict is void.
//   INERT  a comment-only edit: the suite must stay GREEN. Without this arm, a
//          harness that dies on everything would read as perfect coverage.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const COMMIT = 'b627ed2eb547d8f06e73a8ac52cccb4031e3ba6c';
// The project's test_cmd is `node --test test/*.test.js`. Node 24 defaults to the SPEC
// reporter (`ℹ pass 102`), so a TAP-shaped parser silently matches nothing and every
// count comes back null. `--test-reporter=tap` selects the machine-readable format
// WITHOUT changing which tests run or whether they pass. The shell glob is load-bearing:
// `node --test test/` does not do the same thing.
const TEST_CMD = 'node --test --test-reporter=tap test/*.test.js';

let arch = null;
function archiveOnce() {
  if (arch) return arch;
  arch = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c3-src-'));
  const r = spawnSync('sh', ['-c', `git -C ${TARGET} archive ${COMMIT} | tar -x -C ${arch}`], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git archive failed: ${r.stderr}`);
  return arch;
}

function freshTree() {
  const src = archiveOnce();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c3-'));
  for (const e of fs.readdirSync(src)) {
    if (e === '.swarm') continue; // not needed by the suite; keeps arms fast
    fs.cpSync(path.join(src, e), path.join(dir, e), { recursive: true });
  }
  return dir;
}

// Observe the product through the SHIPPED binary. Witnesses never read source.
function run(dir, args) {
  const r = spawnSync(process.execPath, ['bin/aphorism.js', ...args], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}

function suite(dir) {
  const r = spawnSync('sh', ['-c', TEST_CMD], { cwd: dir, encoding: 'utf8' });
  const all = (r.stdout ?? '') + (r.stderr ?? '');
  const g = (re) => { const m = all.match(re); return m ? Number(m[1]) : null; };
  const names = [...all.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  const pass = g(/^# pass (\d+)$/m), fail = g(/^# fail (\d+)$/m), tests = g(/^# tests (\d+)$/m);
  // A result we could not PARSE is a broken harness, not a measurement. Returning it
  // as {fail: null} would let `fail > 0` be false and quietly render every cell
  // SURVIVED — the most alarming verdict, produced by a regex miss. Flag it instead.
  const parsed = pass !== null && fail !== null && tests !== null;
  return { pass, fail, tests, names, parsed, raw: all };
}

// Apply an exact string replacement. Refuses silently-failing mutations: if the
// target string is absent or ambiguous, the cell is NOT-PLANTED, never a verdict.
function mutate(dir, file, from, to) {
  const p = path.join(dir, file);
  const before = fs.readFileSync(p, 'utf8');
  const n = before.split(from).length - 1;
  if (n === 0) return { ok: false, why: `target string ABSENT in ${file}: ${JSON.stringify(from)}` };
  if (n > 1) return { ok: false, why: `target string AMBIGUOUS in ${file} (${n} occurrences): ${JSON.stringify(from)}` };
  fs.writeFileSync(p, before.replace(from, to));
  return { ok: true };
}

const MUTANTS = [
  {
    id: 'C-A', clause: 'F2 — --author matches by SUBSTRING containment, case-insensitively',
    file: 'src/select.js',
    from: 'entry.author.toLowerCase().includes(needle)',
    to: 'entry.author.toLowerCase() === needle',
    desc: '--author becomes an exact whole-field match',
    // Dijkstra is reachable by a substring; under the mutant only a full name is.
    witness: (d) => run(d, ['--author', 'dijk', '--list']).out.trim() === '',
  },
  {
    id: 'C-B', clause: 'F3 — --tag matches a WHOLE tag (--tag desi must not match design)',
    file: 'src/select.js',
    from: 'entry.tags.some((t) => t.toLowerCase() === needle)',
    to: 'entry.tags.some((t) => t.toLowerCase().includes(needle))',
    desc: '--tag becomes a substring match',
    witness: (d) => run(d, ['--tag', 'desi', '--list']).out.trim() !== '',
  },
  {
    id: 'C-C', clause: 'S2 — non-finite seeds (Infinity) are accepted AND deterministic',
    file: 'src/select.js',
    from: "if (typeof seed === 'number' && !Number.isNaN(seed)) {",
    to: "if (typeof seed === 'number' && Number.isFinite(seed)) {",
    desc: 'Infinity / -Infinity fall through to a random pick again (the I-1 hole, re-planted)',
    witness: (d) => new Set(Array.from({ length: 12 }, () => run(d, ['--seed', 'Infinity']).out)).size > 1,
  },
  {
    id: 'C-D', clause: 'E1 — empty candidate set is exit 1, not an empty success',
    file: 'bin/aphorism.js',
    from: '    return EXIT_NO_MATCH;',
    to: '    return EXIT_OK;',
    desc: 'a no-match becomes a silent success',
    witness: (d) => run(d, ['--author', 'zzzznotanauthorzzzz']).code === 0,
  },
  {
    id: 'C-E', clause: 'L5 — --list accepts a valid --seed and IGNORES it (was a HOLE at cycle 52)',
    file: 'bin/aphorism.js',
    from: '  if (opts.list) {',
    to: '  if (opts.list && opts.seed === undefined) {',
    desc: '--list --seed stops listing and does a single seeded pick instead',
    // The clause is "--list accepts a valid --seed and IGNORES it", so the violation
    // is precisely: the seeded output stops being identical to the unseeded listing.
    // (An earlier version of this witness counted lines and asserted the mutated run
    // produced 1. That was wrong: a single pick prints TWO lines — the text, then the
    // indented "    — author" — so the witness read a real violation as INERT.)
    witness: (d) => run(d, ['--list', '--seed', '5']).out !== run(d, ['--list']).out,
  },
  {
    id: 'C-F', clause: 'L7 — an unparseable seed is STILL a usage error under --list (was a HOLE at cycle 52)',
    file: 'bin/aphorism.js',
    from: '  if (opts.error) {',
    to: "  if (opts.error && !argv.includes('--list')) {",
    desc: '--list swallows every usage error, including an unparseable seed',
    witness: (d) => run(d, ['--list', '--seed', 'abc']).code === 0,
  },
  {
    id: 'C-G', clause: 'X2c — a seed that Number() parses to NaN is exit 2 (bad usage)',
    file: 'src/args.js',
    from: '  if (Number.isNaN(n)) return { ok: false };',
    to: '  if (false) return { ok: false };',
    desc: '--seed abc is accepted and falls back to a random pick',
    witness: (d) => run(d, ['--seed', 'abc']).code !== 2,
  },
];

const out = [];
const say = (s) => { out.push(s); console.log(s); };

say('CONDUCTOR INDEPENDENT MUTATION ARM — cycle 3, item N-3');
say(`archive commit: ${COMMIT}`);
say(`test_cmd:       ${TEST_CMD}`);
say('');

// ---- P0 control -----------------------------------------------------------
const p0dir = freshTree();
const p0 = suite(p0dir);
say('P0 CONTROL — pristine archive. The suite must be GREEN or every verdict below is void.');
say(`  tests ${p0.tests} / pass ${p0.pass} / fail ${p0.fail}`);
const p0ok = p0.parsed && p0.fail === 0 && p0.pass > 0;
say(`  P0 ${p0ok ? 'OK' : 'BROKEN — verdicts below are VOID'}`);
say('');

// ---- INERT control --------------------------------------------------------
const inertDir = freshTree();
fs.appendFileSync(path.join(inertDir, 'src/select.js'), '\n// conductor inert control: a comment, no behaviour change\n');
const inert = suite(inertDir);
const inertOk = inert.parsed && inert.fail === 0 && inert.pass === p0.pass;
say('INERT CONTROL — a comment-only edit. The suite must stay GREEN.');
say(`  tests ${inert.tests} / pass ${inert.pass} / fail ${inert.fail}`);
say(`  INERT ${inertOk ? 'OK — the harness does not die on everything' : 'BROKEN — this harness reports a kill for any edit; it is a snapshot test, not an assertion'}`);
say('');

// ---- Sweep ----------------------------------------------------------------
say('SWEEP — conductor-authored mutants, one per sampled clause.');
say('');
const results = [];
for (const m of MUTANTS) {
  const dir = freshTree();
  const planted = mutate(dir, m.file, m.from, m.to);
  if (!planted.ok) {
    results.push({ id: m.id, verdict: 'NOT-PLANTED', why: planted.why });
    say(`${m.id}  NOT-PLANTED  ${m.clause}`);
    say(`     ${planted.why}`);
    say('');
    continue;
  }
  let witnessViolated = false;
  let witnessErr = null;
  try { witnessViolated = !!m.witness(dir); } catch (e) { witnessErr = String(e && e.message); }

  const s = suite(dir);
  let verdict;
  if (!s.parsed) verdict = 'SUITE-UNPARSED';
  else if (witnessErr) verdict = 'WITNESS-ERROR';
  else if (!witnessViolated) verdict = 'INERT';
  else if (s.fail > 0) verdict = 'KILLED';
  else verdict = 'SURVIVED';

  results.push({ id: m.id, verdict, pass: s.pass, fail: s.fail, names: s.names });
  say(`${m.id}  ${verdict.padEnd(9)} ${m.clause}`);
  say(`     mutant:  ${m.desc}`);
  say(`     witness: ${witnessErr ? 'ERROR ' + witnessErr : (witnessViolated ? 'clause OBSERVED VIOLATED at the binary — the tree really is broken' : 'clause still holds — mutation is INERT, suite verdict VOID')}`);
  say(`     suite:   ${s.pass}p / ${s.fail}f`);
  if (verdict === 'KILLED') {
    const shown = s.names.slice(0, 4);
    say(`     killed by: ${shown.join(' | ')}${s.names.length > 4 ? ` (+${s.names.length - 4} more)` : ''}`);
  }
  say('');
}

// ---- Summary --------------------------------------------------------------
const tally = {};
for (const r of results) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
say('================ CONDUCTOR ARM SUMMARY ================');
say(`sampled clauses: ${MUTANTS.length}`);
for (const k of Object.keys(tally)) say(`  ${k}: ${tally[k]}  ${results.filter((r) => r.verdict === k).map((r) => r.id).join(' ')}`);
say(`P0 control:    ${p0ok ? 'PASS' : 'FAIL'}`);
say(`INERT control: ${inertOk ? 'PASS' : 'FAIL'}`);
const allKilled = results.every((r) => r.verdict === 'KILLED');
say('');
say(`ARM VERDICT: ${p0ok && inertOk && allKilled ? 'every sampled clause is PROTECTED by the shipped suite' : 'NOT clean — see cells above'}`);
say('');
say('What this arm does NOT establish: it samples 7 of 29 clauses. It cannot show the');
say('other 22 are protected, and a KILLED verdict shows the suite notices THIS mutation,');
say('not that it notices every way the clause could break.');

fs.writeFileSync('/opt/swarm/runs/c3r3-mutants-out.txt', out.join('\n') + '\n');
process.exit(p0ok && inertOk && allKilled ? 0 : 1);
