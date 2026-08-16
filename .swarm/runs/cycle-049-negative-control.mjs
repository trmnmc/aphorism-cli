// cycle 49 — negative control / mutation arm for cycle-049-gate.mjs.
//
// The gate went 134/134 green on its first run. That is exactly when a gate is
// least trustworthy: an all-green instrument that has never been shown to fail
// is indistinguishable from an instrument that cannot fail. This arm plants a
// specific defect in a THROWAWAY COPY of the repo and requires that the cells
// which go red are the cells that SHOULD go red for that defect — not merely
// that something went red.
//
// A mutation whose damage is caught only by unrelated cells is recorded as a
// MISS even though the arm "detected" it: attributing the kill is the evidence.
//
// Each mutation gets a FRESH temp dir, because the gate require()s the corpus
// and Node's module cache is keyed by resolved path.
//
// Usage:  node cycle-049-negative-control.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runGate } from './cycle-049-gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

function freshCopy(label) {
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), `aph-${label}-`));
  for (const d of ['bin', 'src']) {
    fs.mkdirSync(path.join(dst, d), { recursive: true });
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      fs.copyFileSync(path.join(ROOT, d, f), path.join(dst, d, f));
    }
  }
  return dst;
}

const rd = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const wr = (root, rel, s) => fs.writeFileSync(path.join(root, rel), s);

// A mutation must actually change the file it claims to change; a no-op edit
// that silently matched nothing would show as a "caught nothing" MISS and be
// misread as a weak cell rather than a broken mutation.
function sub(root, rel, from, to) {
  const before = rd(root, rel);
  const after = before.replace(from, to);
  if (after === before) throw new Error(`mutation was a no-op on ${rel}: ${from}`);
  wr(root, rel, after);
}

const MUTATIONS = [
  {
    id: 'P0',
    desc: 'unmutated copy',
    expect: [],
    apply: () => {},
  },
  {
    id: 'M1',
    desc: "corpus revives the retired tag 'testing' on one entry",
    // A retired name that quietly still works is the exact regression this
    // whole cycle exists to detect.
    expect: ['B1:testing', 'B2:testing', 'B3:testing'],
    apply: (r) => sub(r, 'src/corpus.js', /tags: \['debugging'/, "tags: ['debugging', 'testing'"),
  },
  {
    id: 'M2',
    desc: 'no-match message goes to stdout instead of stderr',
    expect: 'ALL_B2_B3',
    apply: (r) => sub(r, 'bin/aphorism.js', "process.stderr.write('aphorism: no aphorism matches those filters\\n');", "process.stdout.write('aphorism: no aphorism matches those filters\\n');"),
  },
  {
    id: 'M3',
    desc: 'no-match exits 0 — an empty success instead of an error',
    expect: 'ALL_B1',
    apply: (r) => sub(r, 'bin/aphorism.js', /return EXIT_NO_MATCH;/, 'return EXIT_OK;'),
  },
  {
    id: 'M4',
    desc: '--tag matches on substring instead of whole tag',
    expect: ['C1', 'C2'],
    apply: (r) => sub(r, 'src/select.js', 'entry.tags.some((t) => t.toLowerCase() === needle)', 'entry.tags.some((t) => t.toLowerCase().includes(needle))'),
  },
  {
    id: 'M5',
    desc: '--tag becomes case-SENSITIVE',
    expect: 'ALL_A4',
    apply: (r) => sub(r, 'src/select.js', 'const needle = String(tag).toLowerCase();\n    result = result.filter((entry) =>\n      entry.tags.some((t) => t.toLowerCase() === needle)', 'const needle = String(tag);\n    result = result.filter((entry) =>\n      entry.tags.some((t) => t === needle)'),
  },
  {
    id: 'M6',
    desc: '--tag filter ignored entirely (every tag returns the whole corpus)',
    // Same derivation M9 needs, and for the same reason: with the filter gone,
    // `--tag X --seed 7` prints pick(corpus, 7) for every X, and that one entry
    // genuinely carries `philosophy` — so A2:philosophy is CORRECTLY green. The
    // mutation is invisible at that cell. Recorded as an arm correction, not a
    // gate correction: the first run asserted ALL 12 A2 cells and scored a MISS
    // against A2:philosophy, which would have libelled a sound cell as weak.
    expect: (root, cells) => {
      const req = createRequire(path.join(root, 'x.js'));
      const { corpus } = req(path.join(root, 'src', 'corpus.js'));
      const { pick } = req(path.join(root, 'src', 'select.js'));
      const shown = pick(corpus, 7);
      return cells
        .map((c) => c.id)
        .filter((id) => (id.startsWith('A2:') && !shown.tags.includes(id.slice(3))) || id.startsWith('A3:'));
    },
    apply: (r) => sub(r, 'src/select.js', /if \(tag !== undefined && tag !== null\) \{/, 'if (false) {'),
  },
  {
    id: 'M7',
    desc: '--list prints the right set in the WRONG (reversed) order',
    // The subtle one: correct membership, correct count, wrong order. A cell
    // that only counted lines would stay green here.
    expect: 'A3_MULTI',
    apply: (r) => sub(r, 'bin/aphorism.js', 'const body = candidates', 'const body = candidates.slice().reverse()'),
  },
  {
    id: 'M8',
    desc: "--list separator becomes a hyphen instead of the documented em dash",
    expect: 'ALL_A3',
    apply: (r) => sub(r, 'bin/aphorism.js', '`${e.text} — ${e.author}`', '`${e.text} - ${e.author}`'),
  },
  {
    id: 'M9',
    desc: 'default (non-list) output ignores --tag, but --list still honours it',
    // Targets A2 alone: proves A2 is not riding on A3's coat-tails.
    //
    // The expected set must be DERIVED, not assumed. pick(corpus, 7) returns
    // one fixed entry regardless of the tag, so the A2 cells for the tags that
    // entry happens to carry stay legitimately green — the mutation is genuinely
    // invisible there. Demanding those cells redden would be demanding a cell
    // detect a change that did not occur at it; asserting "ALL 12" and finding
    // 10 would have been recorded as a cell weakness that does not exist.
    expect: (root, cells) => {
      const req = createRequire(path.join(root, 'x.js'));
      const { corpus } = req(path.join(root, 'src', 'corpus.js'));
      const { pick } = req(path.join(root, 'src', 'select.js'));
      const shown = pick(corpus, 7);
      return cells
        .map((c) => c.id)
        .filter((id) => id.startsWith('A2:') && !shown.tags.includes(id.slice(3)));
    },
    apply: (r) => sub(r, 'bin/aphorism.js', 'const chosen = pick(candidates, opts.seed);', 'const chosen = pick(corpus, opts.seed);'),
  },
  {
    id: 'M10',
    desc: 'no-match stderr message reworded to something unhelpful',
    // Targets B3 alone: exit code and stdout stay correct.
    expect: 'ALL_B3',
    apply: (r) => sub(r, 'bin/aphorism.js', "'aphorism: no aphorism matches those filters\\n'", "'aphorism: nope\\n'"),
  },
  {
    id: 'M11',
    desc: 'one name removed from the fold map (the retired list shrinks to 25)',
    // Targets the invariant cell S2. Proves the S-cells are load-bearing and
    // not decorative: if the fold map drifts, this gate says so rather than
    // silently testing 25 names and reporting green.
    expect: ['S2'],
    scriptMutation: true,
    apply: (r) => sub(r, 'runs/cycle-046-retag.mjs', /\n  testing: 'debugging',/, ''),
  },
  {
    id: 'M13',
    desc: '--list --json emits one JSON array instead of NDJSON, breaking the help recipe',
    expect: ['C6'],
    apply: (r) => sub(r, 'bin/aphorism.js', ".join('\\n');", ".join(opts.json ? ',' : '\\n');"),
  },
  {
    id: 'M12',
    desc: '--list silently drops the last matching entry',
    expect: 'A3_MULTI',
    apply: (r) => sub(r, 'bin/aphorism.js', 'const body = candidates', 'const body = candidates.slice(0, -1)'),
  },
];

// Resolve the symbolic expectations against the cell ids the gate actually
// emits, so the arm cannot drift out of step with the gate's naming.
function resolveExpected(sym, cells, root) {
  const ids = cells.map((c) => c.id);
  if (typeof sym === 'function') return sym(root, cells);
  if (Array.isArray(sym)) return sym;
  const pick = (re) => ids.filter((i) => re.test(i));
  switch (sym) {
    case 'ALL_B1': return pick(/^B1:/);
    case 'ALL_B3': return pick(/^B3:/);
    case 'ALL_B2_B3': return pick(/^B[23]:/);
    case 'ALL_A4': return pick(/^A4:/);
    case 'ALL_A2': return pick(/^A2:/);
    case 'ALL_A3': return pick(/^A3:/);
    case 'ALL_A2_A3': return pick(/^A[23]:/);
    case 'A3_MULTI': {
      // Reversal and truncation are only OBSERVABLE on tags with >1 entry;
      // requiring them on a singleton pool would be requiring a cell to detect
      // a change that did not happen there.
      const { corpus } = JSON.parse(fs.readFileSync(path.join(root, '.counts.json'), 'utf8'));
      return pick(/^A3:/).filter((id) => corpus[id.slice(3)] > 1);
    }
    default: throw new Error('unknown expectation symbol: ' + sym);
  }
}

console.log('cycle 49 — mutation arm for the end-to-end --tag gate\n');
let pass = 0;
const rows = [];

for (const m of MUTATIONS) {
  const root = freshCopy(m.id);
  // The gate parses the fold map out of the retag script beside it; give the
  // copy its own runs/ so M11 can mutate that file without touching the repo.
  fs.mkdirSync(path.join(root, 'runs'), { recursive: true });
  for (const f of ['cycle-046-retag.mjs']) fs.copyFileSync(path.join(HERE, f), path.join(root, 'runs', f));

  try { m.apply(root); } catch (e) {
    rows.push({ id: m.id, verdict: 'BROKEN', note: e.message });
    console.log(`${m.id.padEnd(4)} ${m.desc}\n     BROKEN MUTATION: ${e.message}\n`);
    continue;
  }

  // Counts for the A3_MULTI resolver, measured from the copy AFTER mutation.
  const { corpus: cps } = createRequire(path.join(root, 'x.js'))(path.join(root, 'src', 'corpus.js'));
  const counts = {};
  for (const a of cps) for (const t of a.tags) counts[t] = (counts[t] || 0) + 1;
  fs.writeFileSync(path.join(root, '.counts.json'), JSON.stringify({ corpus: counts }));

  const cells = runGate(root, { foldFrom: path.join(root, 'runs') });
  const red = cells.filter((c) => !c.ok).map((c) => c.id);
  const expected = resolveExpected(m.expect, cells, root);

  const missed = expected.filter((id) => !red.includes(id));
  const ok = m.id === 'P0' ? red.length === 0 : missed.length === 0 && expected.length > 0;
  if (ok) pass++;

  const collateral = red.filter((id) => !expected.includes(id));
  rows.push({ id: m.id, verdict: ok ? 'PASS' : 'MISS', red: red.length });
  console.log(`${m.id.padEnd(4)} ${m.desc}`);
  console.log(`     expected red: ${expected.length ? expected.slice(0, 4).join(', ') + (expected.length > 4 ? ` … (${expected.length} cells)` : '') : '(none)'}`);
  console.log(`     actual red:   ${red.length} cells${missed.length ? '  MISSED: ' + missed.slice(0, 6).join(', ') : ''}`);
  if (collateral.length) console.log(`     collateral:   ${collateral.length} further cells also reddened`);
  console.log(`     ${ok ? 'PASS — every targeted cell caught its own mutation' : 'MISS — a targeted cell stayed green'}\n`);
}

console.log(`${pass}/${MUTATIONS.length} mutation checks passed`);
process.exitCode = pass === MUTATIONS.length ? 0 : 1;
