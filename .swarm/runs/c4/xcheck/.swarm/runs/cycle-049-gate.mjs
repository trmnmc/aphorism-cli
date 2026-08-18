// cycle 49 — END-TO-END gate on the SHIPPED binary's --tag behaviour after the
// cycle-46 (T-007) retag.
//
// Why this exists: T-007 folded 37 tags -> 12 and thereby RETIRED 26 tag names
// that used to work. Every gate the run has pointed at that change so far reads
// either the corpus module, the README, or a test fixture. NOTHING has ever
// spawned the real `bin/aphorism.js` and asked what a user typing `--tag testing`
// actually gets. That is the one user-facing breaking change this run shipped,
// and it is the last unmeasured thing about it.
//
// Every cell below spawns the real binary as a child process. No module is
// require()d for behaviour — only to DERIVE EXPECTATIONS, which is a different
// thing and is the point: the expectation comes from the data, the observation
// comes from the process.
//
// Usage:  node cycle-049-gate.mjs [rootDir]
// Exit:   0 iff every cell is green.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '..', '..');

// ---------------------------------------------------------------- fold map
// The 26 retired names are read out of the cycle-046 retag script's SOURCE
// rather than hand-copied here (a hand-copy is a place for the gate to agree
// with itself about a list it never checked). Parsed, never executed: that file
// has module-scope side effects and reads the LIVE corpus, which would be wrong
// when this gate runs against a mutated temp copy.
function retiredNames(dir) {
  const src = fs.readFileSync(path.join(dir, 'cycle-046-retag.mjs'), 'utf8');
  const block = src.match(/export const FOLD = \{([\s\S]*?)\n\};/);
  if (!block) throw new Error('could not locate the FOLD map in cycle-046-retag.mjs');
  const names = [];
  for (const line of block[1].split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][\w]*)\s*:\s*'([^']+)'\s*,\s*$/);
    if (m) names.push({ old: m[1], now: m[2] });
  }
  return names;
}

export function runGate(root, opts = {}) {
  const cells = [];
  const bin = path.join(root, 'bin', 'aphorism.js');
  const req = createRequire(path.join(root, 'package.json.placeholder'));

  const cell = (id, kind, desc, fn) => {
    let ok = false;
    let detail = '';
    try {
      const r = fn();
      ok = r === true || (r && r.ok === true);
      detail = (r && r.detail) || '';
    } catch (e) {
      ok = false;
      detail = 'threw: ' + e.message;
    }
    cells.push({ id, kind, desc, ok, detail });
  };

  const run = (args) => {
    const r = spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };

  // ------------------------------------------------ expectations from data
  const { corpus } = req(path.join(root, 'src', 'corpus.js'));
  const liveCounts = new Map();
  for (const a of corpus) for (const t of a.tags) liveCounts.set(t, (liveCounts.get(t) || 0) + 1);
  const liveTags = [...liveCounts.keys()].sort();
  const retired = retiredNames(opts.foldFrom || HERE);

  // A cell that fails if the SHAPE of the world changed under this gate, so a
  // future reader is not silently reassured by 12 green cells over 3 tags.
  cell('S1', 'invariant', `vocabulary is 12 live tags (measured ${liveTags.length})`,
    () => ({ ok: liveTags.length === 12, detail: `tags=${liveTags.length} :: ${liveTags.join(',')}` }));
  cell('S2', 'invariant', `fold map retires 26 names (measured ${retired.length})`,
    () => ({ ok: retired.length === 26, detail: `retired=${retired.length}` }));
  cell('S3', 'invariant', 'no retired name is also a live tag (the fold is total)',
    () => {
      const clash = retired.filter((r) => liveCounts.has(r.old)).map((r) => r.old);
      return { ok: clash.length === 0, detail: `clashes=${JSON.stringify(clash)}` };
    });

  // ------------------------------------------------------ ARM A: live tags
  for (const t of liveTags) {
    const n = liveCounts.get(t);
    const members = corpus.filter((e) => e.tags.includes(t));

    // A1 — the flag works at all: exit 0, nothing on stderr.
    cell(`A1:${t}`, 'live', `--tag ${t} exits 0 with a silent stderr`, () => {
      const r = run(['--tag', t]);
      return { ok: r.code === 0 && r.err === '', detail: `exit=${r.code} stderrBytes=${r.err.length}` };
    });

    // A2 — DISCRIMINATOR. Not "it printed something": the printed text+author
    // pair must be an entry that genuinely carries this tag. An implementation
    // that ignored --tag and printed any aphorism cannot pass this for every
    // tag, because most entries do not carry most tags.
    cell(`A2:${t}`, 'live', `--tag ${t} prints an entry that actually carries ${t}`, () => {
      const r = run(['--tag', t, '--seed', '7']);
      const lines = r.out.replace(/\n$/, '').split('\n');
      if (lines.length !== 2) return { ok: false, detail: `expected 2 stdout lines, got ${lines.length}` };
      const m = lines[1].match(/^ {4}— (.+)$/);
      if (!m) return { ok: false, detail: `attribution line malformed: ${JSON.stringify(lines[1])}` };
      const hit = members.find((e) => e.text === lines[0] && e.author === m[1]);
      return { ok: Boolean(hit), detail: hit ? `matched a real ${t} entry by ${m[1]}` : `printed entry is NOT tagged ${t}: ${JSON.stringify(lines[0].slice(0, 40))}` };
    });

    // A3 — DISCRIMINATOR. --list must reproduce the exact membership, the exact
    // count, the exact corpus ORDER, and the exact documented line format.
    cell(`A3:${t}`, 'live', `--tag ${t} --list is the exact ${n}-entry set in corpus order`, () => {
      const r = run(['--tag', t, '--list']);
      if (r.code !== 0) return { ok: false, detail: `exit=${r.code}` };
      const got = r.out.replace(/\n$/, '').split('\n');
      const want = members.map((e) => `${e.text} — ${e.author}`);
      if (got.length !== want.length) return { ok: false, detail: `lines got=${got.length} want=${want.length}` };
      for (let i = 0; i < want.length; i++) {
        if (got[i] !== want[i]) return { ok: false, detail: `line ${i + 1} diverges: got ${JSON.stringify(got[i].slice(0, 50))}` };
      }
      return { ok: true, detail: `${want.length}/${want.length} lines identical, in order` };
    });

    // A4 — the Domain rule's case-insensitivity, on the shipped binary.
    cell(`A4:${t}`, 'live', `--tag ${t.toUpperCase()} yields the identical set (case-insensitive)`, () => {
      const lower = run(['--tag', t, '--list']);
      const upper = run(['--tag', t.toUpperCase(), '--list']);
      return {
        ok: upper.code === 0 && upper.out === lower.out,
        detail: `exit=${upper.code} identical=${upper.out === lower.out}`,
      };
    });
  }

  // --------------------------------------------------- ARM B: retired names
  // SPEC Domain rule: "Empty candidate set after filtering is an error, not an
  // empty success: exit code 1, a human-readable message on stderr, and ZERO
  // BYTES on stdout." A user who typed `--tag testing` yesterday types it today.
  for (const { old, now } of retired) {
    cell(`B1:${old}`, 'retired', `--tag ${old} (retired -> ${now}) exits 1`, () => {
      const r = run(['--tag', old]);
      return { ok: r.code === 1, detail: `exit=${r.code}` };
    });
    cell(`B2:${old}`, 'retired', `--tag ${old} writes ZERO BYTES to stdout`, () => {
      const r = run(['--tag', old]);
      return { ok: r.out.length === 0, detail: `stdoutBytes=${r.out.length}` };
    });
    cell(`B3:${old}`, 'retired', `--tag ${old} explains itself on stderr`, () => {
      const r = run(['--tag', old]);
      const ok = r.err.length > 0 && /no aphorism matches/i.test(r.err);
      return { ok, detail: ok ? JSON.stringify(r.err.trim()) : `stderr=${JSON.stringify(r.err.slice(0, 60))}` };
    });
  }

  // ------------------------------------- ARM C: the whole-tag / AND rules
  // SPEC names `--tag desi` against a `design` tag as the worked example of the
  // whole-tag rule. Checked on the binary, not on filter().
  cell('C1', 'rule', '--tag desi does not match design (whole-tag, prefix)', () => {
    const r = run(['--tag', 'desi']);
    return { ok: r.code === 1 && r.out.length === 0, detail: `exit=${r.code} stdoutBytes=${r.out.length}` };
  });
  cell('C2', 'rule', '--tag esign does not match design (whole-tag, suffix)', () => {
    const r = run(['--tag', 'esign']);
    return { ok: r.code === 1 && r.out.length === 0, detail: `exit=${r.code} stdoutBytes=${r.out.length}` };
  });

  // C3/C4 — the AND rule, with the author pair derived from the live corpus so
  // the cell cannot be satisfied by a stale hand-picked example.
  const designers = corpus.filter((e) => e.tags.includes('design'));
  const authorWith = designers.length ? designers[0].author : null;
  const authorWithout = corpus.map((e) => e.author).find((a) => !designers.some((d) => d.author === a));
  cell('C3', 'rule', `--tag design --author "${authorWith}" is a non-empty intersection`, () => {
    const r = run(['--tag', 'design', '--author', authorWith, '--list']);
    const n = r.code === 0 ? r.out.replace(/\n$/, '').split('\n').length : 0;
    return { ok: r.code === 0 && n >= 1, detail: `exit=${r.code} lines=${n}` };
  });
  cell('C4', 'rule', `--tag design --author "${authorWithout}" is AND, not OR (empty -> exit 1)`, () => {
    const r = run(['--tag', 'design', '--author', authorWithout, '--list']);
    return { ok: r.code === 1 && r.out.length === 0, detail: `exit=${r.code} stdoutBytes=${r.out.length}` };
  });

  // C5 — a name that never existed in either taxonomy must behave exactly like
  // a retired one. This separates "retired names are special-cased" from "the
  // no-match path is uniform", which are different products.
  cell('C5', 'rule', '--tag zzzznotatag behaves identically to a retired name', () => {
    const a = run(['--tag', 'zzzznotatag']);
    const b = run(['--tag', retired[0].old]);
    return {
      ok: a.code === b.code && a.out === b.out && a.err === b.err,
      detail: `unknown exit=${a.code} retired exit=${b.code} identical=${a.code === b.code && a.err === b.err}`,
    };
  });

  // C6 — the --help text ships a RECIPE for discovering the vocabulary
  // (`--list --json | jq '.tags[]'`) instead of a hardcoded tag list, which is
  // why --help could not go stale under the retag. But the recipe is itself an
  // untested user-facing claim: it promises NDJSON with a `tags` array per line.
  // Checked here by parsing the NDJSON directly rather than shelling out to jq,
  // so the gate stays dependency-free; the literal jq pipeline was additionally
  // executed by hand at cycle 49 and yielded the same 12 names.
  cell('C6', 'rule', "--help's documented recipe yields exactly the live vocabulary", () => {
    const r = run(['--list', '--json']);
    if (r.code !== 0) return { ok: false, detail: `exit=${r.code}` };
    const lines = r.out.replace(/\n$/, '').split('\n');
    const seen = new Set();
    for (const ln of lines) {
      const obj = JSON.parse(ln); // throws -> cell fails, which is the point
      if (!Array.isArray(obj.tags)) return { ok: false, detail: 'a record has no tags array' };
      for (const t of obj.tags) seen.add(t);
    }
    const got = [...seen].sort();
    const same = got.length === liveTags.length && got.every((t, i) => t === liveTags[i]);
    return { ok: same, detail: `records=${lines.length} distinctTags=${got.length}` };
  });

  return cells;
}

// ------------------------------------------------------------------- main
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
  const cells = runGate(root);
  const red = cells.filter((c) => !c.ok);
  const byKind = {};
  for (const c of cells) {
    byKind[c.kind] = byKind[c.kind] || { n: 0, ok: 0 };
    byKind[c.kind].n++;
    if (c.ok) byKind[c.kind].ok++;
  }
  console.log(`root: ${root}\n`);
  for (const c of cells) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.id.padEnd(20)} ${c.desc}${c.detail ? '   [' + c.detail + ']' : ''}`);
  }
  console.log('');
  for (const k of Object.keys(byKind)) console.log(`  ${k.padEnd(10)} ${byKind[k].ok}/${byKind[k].n}`);
  console.log(`\n${cells.length - red.length}/${cells.length} cells green`);
  if (red.length) {
    console.log('RED: ' + red.map((c) => c.id).join(', '));
  }
  process.exitCode = red.length ? 1 : 0;
}
