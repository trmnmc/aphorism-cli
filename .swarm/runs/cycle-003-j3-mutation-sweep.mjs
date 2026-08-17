// cycle 003 (J-3) — a layer DEEPER than the cycle-50..54 one-mutant-per-clause map.
//
// That map (see .swarm/state.json qa.suite_coverage_note_cycle_52 / _cycle_54) already
// closed 29/29 SPEC Domain-rule clauses with one mutant each. This sweep does NOT
// re-run that map. It hunts for what a single-clause sweep structurally cannot find:
// compound mutations (two rules interacting), boundary values (seed=0, the falsy
// trap) the earlier seed mutants never tried, and the SEAM between bin/aphorism.js
// and src/ (args.js hands a parsed value to select.js; a bug can live in the handoff
// even when both sides are individually correct).
//
// Instrument is UNCHANGED from cycle 50 (standing since then, do not reinvent): copy
// the whole repo to a throwaway dir, mutate exactly one thing, run the project's own
// `node --test test/*.test.js` in the copy, record KILLED or SURVIVED. Two
// disciplines: (1) P0 control — unmutated copy must be green or the harness is
// broken; (2) a BEHAVIOURAL WITNESS per mutant, run against the actual shipped
// binary, proving the mutant really violates the rule before a SURVIVED verdict is
// trusted.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIVE = '/opt/targets/aphorism-cli';

function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c003-j3-'));
  for (const e of fs.readdirSync(LIVE)) {
    if (e === '.git' || e === '.swarm') continue;
    fs.cpSync(path.join(LIVE, e), path.join(dir, e), { recursive: true });
  }
  return dir;
}

function run(dir, args) {
  const r = spawnSync(process.execPath, ['bin/aphorism.js', ...args], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}

function distinct(dir, args, n = 8) {
  const set = new Set();
  for (let i = 0; i < n; i++) set.add(run(dir, args).out);
  return set;
}

function suite(dir) {
  // DELIBERATE DEVIATION from the literal cycle-50 instrument text
  // (`node --test test/*.test.js`), for a reason specific to THIS run: a second
  // builder is concurrently editing test/readme-tags.test.js and README.md in the
  // SAME live repo this copy is taken from. That file is mid-edit and currently
  // fails for reasons that have nothing to do with src/ or bin/ (confirmed by
  // running the full glob once against the live tree before writing this
  // harness). J-3's own scope is explicitly the three files below, and
  // readme-tags.test.js is explicitly OUT of scope ("another item's territory").
  // Including it here would make P0 red for a reason this item cannot fix and
  // would misattribute kills. So "the project's own test command" for this
  // sweep is scoped to the files this item owns and is answerable for.
  const files = ['test/select.test.js', 'test/args.test.js', 'test/cli.test.js'];
  const r = spawnSync('bash', ['-lc', `node --test ${files.join(' ')}`], { cwd: dir, encoding: 'utf8' });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  const pass = Number(/^. pass (\d+)$/m.exec(out)?.[1]);
  const fail = Number(/^. fail (\d+)$/m.exec(out)?.[1]);
  const failed = [...new Set(
    [...out.matchAll(/^✖ (.+?) \(\d+(?:\.\d+)?ms\)$/gm)].map((m) => m[1].trim())
  )];
  return { pass, fail, failed, raw: out };
}

// --- the mutants -------------------------------------------------------------
const M = [
  {
    id: 'D1-FMT',
    rule: 'plain single-pick output form (README.md "## Usage" example: text, NEWLINE, ' +
      'four-space indent, EM DASH, space, author) — the seam between src/select.js\'s ' +
      'chosen entry and bin/aphorism.js\'s format()',
    file: 'bin/aphorism.js',
    from: 'function format(entry) {\n  return `${entry.text}\\n    — ${entry.author}`;\n}',
    to: 'function format(entry) {\n  return `${entry.text} — ${entry.author}`;\n}',
    desc: 'the plain (non-list, non-json) single-pick output collapses onto ONE line ' +
      '(loses the newline + 4-space indent before the attribution) instead of matching ' +
      'the two-line form README.md documents',
    witness: (d) => {
      const r = run(d, ['--seed', '1']);
      // The rule: text, then a real newline, then exactly 4 spaces, then EM DASH, space,
      // author. Witness returns true when this is ABSENT (VIOLATED), for consistency with
      // every other mutant below where true == "the rule is observed to be broken".
      return !/\n {4}— /.test(r.out);
    },
  },
  {
    id: 'D2-SEED0',
    rule: 'seed determinism holds for EVERY seed Number() parses to non-NaN, including ' +
      'the falsy boundary value 0 — not exercised by any existing determinism test ' +
      '(cycle-52/54 used 42, 7, -5, Infinity, -Infinity, 12345, but never 0)',
    file: 'bin/aphorism.js',
    from: '  const chosen = pick(candidates, opts.seed);',
    to: '  const chosen = pick(candidates, opts.seed || undefined);',
    desc: 'the classic `x || fallback` falsy-zero trap at the bin/aphorism.js -> ' +
      'src/select.js seam: `--seed 0` is treated as "no seed" and silently falls back ' +
      'to a random pick',
    witness: (d) => distinct(d, ['--seed', '0']).size > 1,
  },
  {
    id: 'D3-SEEDINF-STR',
    rule: '--seed accepts any value Number() parses to a non-NaN number, including ' +
      'Infinity / -Infinity — the CLI-STRING form of this rule, at the args.js seam. ' +
      'The existing Infinity/-Infinity tests (select.test.js) call pick(candidates, ' +
      'Infinity) with the already-parsed JS value directly; none ever send the STRING ' +
      '"Infinity" through parseArgs/the shipped binary',
    file: 'src/args.js',
    from: 'function parseSeedValue(raw) {\n  if (raw === \'\' || raw.trim() === \'\') return { ok: false };\n  const n = Number(raw);\n  if (Number.isNaN(n)) return { ok: false };\n  return { ok: true, value: n };\n}',
    to: 'function parseSeedValue(raw) {\n  if (raw === \'\' || raw.trim() === \'\') return { ok: false };\n  const n = Number(raw);\n  if (Number.isNaN(n) || !Number.isFinite(n)) return { ok: false };\n  return { ok: true, value: n };\n}',
    desc: '`--seed Infinity` and `--seed -Infinity` typed on the actual command line ' +
      'become usage errors (exit 2) instead of deterministic picks, even though the ' +
      'Domain rule explicitly names Infinity/-Infinity as accepted seed values',
    witness: (d) => run(d, ['--seed', 'Infinity']).code === 2 && run(d, ['--seed', '-Infinity']).code === 2,
  },
  {
    id: 'D4-EMPTY-LIST',
    rule: 'compound of two rules that each have their OWN single-mutant test but were ' +
      'never tested TOGETHER: "empty candidate set after filtering is exit 1, stderr ' +
      'only, zero bytes on stdout" (tested only without --list) AND "--list prints the ' +
      'filtered set" (tested only with a non-empty filtered set) — the empty+list ' +
      'combination itself is untested',
    file: 'bin/aphorism.js',
    from: `  if (candidates.length === 0) {
    process.stderr.write('aphorism: no aphorism matches those filters\\n');
    return EXIT_NO_MATCH;
  }

  if (opts.list) {
    const body = candidates
      .map((e) => (opts.json ? JSON.stringify(e) : \`\${e.text} — \${e.author}\`))
      .join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }`,
    to: `  if (opts.list) {
    const body = candidates
      .map((e) => (opts.json ? JSON.stringify(e) : \`\${e.text} — \${e.author}\`))
      .join('\\n');
    process.stdout.write(\`\${body}\\n\`);
    return EXIT_OK;
  }

  if (candidates.length === 0) {
    process.stderr.write('aphorism: no aphorism matches those filters\\n');
    return EXIT_NO_MATCH;
  }`,
    desc: '--list crossed with a filter that matches nothing now prints an empty line ' +
      'and exits 0 instead of erroring — the empty-set check runs AFTER the list branch, ' +
      'so an empty filtered set under --list is misreported as a (trivial) success',
    witness: (d) => {
      const r = run(d, ['--list', '--author', 'zzzznobody-said-this-ever']);
      return r.code === 0;
    },
  },
];

// --- P0 control ----------------------------------------------------------------
console.log('P0 — pristine copy control.\n');
const p0dir = copyTree();
const p0suite = suite(p0dir);
let p0ok = p0suite.fail === 0 && p0suite.pass > 0;
console.log(`  suite: ${p0suite.pass} pass / ${p0suite.fail} fail  ${p0ok ? 'OK' : 'BROKEN'}`);
for (const m of M) {
  let held;
  try { held = m.witness(p0dir) === false; } catch (e) { held = false; }
  // On the PRISTINE tree the witness (which detects the VIOLATION) must be FALSE --
  // i.e. the rule holds and nothing is broken yet.
  if (!held) { p0ok = false; console.log(`  witness ${m.id} reports a violation on PRISTINE code -- instrument broken`); }
}
console.log(`  P0 ${p0ok ? 'OK -- verdicts below are meaningful.' : 'FAILED -- aborting, everything below would be void.'}\n`);
fs.rmSync(p0dir, { recursive: true, force: true });
if (!p0ok) process.exit(1);

// --- sweep -----------------------------------------------------------------
const rows = [];
for (const m of M) {
  const dir = copyTree();
  const p = path.join(dir, m.file);
  const src = fs.readFileSync(p, 'utf8');
  const hits = src.split(m.from).length - 1;
  if (hits !== 1) {
    console.log(`${m.id}  NOT-PLANTED -- anchor occurs ${hits}x in ${m.file}`);
    rows.push({ id: m.id, verdict: 'NOT-PLANTED' });
    fs.rmSync(dir, { recursive: true, force: true });
    continue;
  }
  fs.writeFileSync(p, src.replace(m.from, m.to));

  let violates;
  try { violates = m.witness(dir) === true; } catch (e) { violates = false; }

  let verdict, s = null;
  if (!violates) {
    verdict = 'INERT';
  } else {
    s = suite(dir);
    verdict = s.fail > 0 ? 'KILLED' : (s.pass === p0suite.pass && s.fail === 0 ? 'SURVIVED' : 'ANOMALOUS');
  }
  rows.push({ id: m.id, verdict, rule: m.rule, desc: m.desc, s });
  console.log(`\n${m.id}  ${verdict}`);
  console.log(`  rule: ${m.rule}`);
  console.log(`  mutant: ${m.desc}`);
  console.log(`  witness on mutant: VIOLATION ${violates ? 'CONFIRMED' : 'NOT CONFIRMED (inert)'}`);
  if (s) console.log(`  suite: ${s.pass} pass / ${s.fail} fail`);
  if (verdict === 'KILLED') console.log(`  killed by: ${s.failed.join(' | ') || '(names unresolved)'}`);
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n================ MAP ================');
for (const v of ['KILLED', 'SURVIVED', 'INERT', 'NOT-PLANTED', 'ANOMALOUS']) {
  const xs = rows.filter((r) => r.verdict === v);
  console.log(`${v}: ${xs.length}  ${xs.map((r) => r.id).join(' ')}`);
}
