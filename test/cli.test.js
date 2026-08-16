'use strict';

// End-to-end CLI tests: spawn the real binary and assert on real stdout/stderr/exit
// codes. These are deliberately process-level — the pure-module tests cover the
// logic, this file covers the contract a user actually touches.

const test = require('node:test');
const assert = require('node:assert');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const { corpus } = require('../src/corpus.js');

const BIN = path.join(__dirname, '..', 'bin', 'aphorism.js');

function run(args = []) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
}

test('bare invocation prints one attributed aphorism and exits 0', () => {
  const r = run();
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr, '');
  assert.ok(r.stdout.trim().length > 0, 'stdout should not be empty');
  assert.match(r.stdout, /—/, 'output should carry an attribution line');
});

test('--seed is deterministic across separate processes', () => {
  const a = run(['--seed', '42']);
  const b = run(['--seed', '42']);
  assert.strictEqual(a.status, 0);
  assert.strictEqual(a.stdout, b.stdout);
});

test('different seeds do not all collapse to one aphorism', () => {
  const outs = new Set();
  for (let s = 0; s < 12; s += 1) outs.add(run(['--seed', String(s)]).stdout);
  assert.ok(outs.size > 1, 'seeding should reach more than a single entry');
});

test('--json emits a single-line JSON object with text/author/tags', () => {
  const r = run(['--json', '--seed', '7']);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout.trim());
  assert.strictEqual(typeof parsed.text, 'string');
  assert.strictEqual(typeof parsed.author, 'string');
  assert.ok(Array.isArray(parsed.tags));
});

test('--list prints every entry in the filtered set', () => {
  const r = run(['--list']);
  assert.strictEqual(r.status, 0);
  const lines = r.stdout.trim().split('\n');
  assert.ok(lines.length >= 40, `expected >= 40 lines, got ${lines.length}`);
});

test('--help prints usage to stdout and exits 0', () => {
  const r = run(['--help']);
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /--author/);
  assert.match(r.stdout, /--seed/);
});

test('no match exits 1 with stderr only and zero bytes on stdout', () => {
  const r = run(['--author', 'nobody-said-this-ever']);
  assert.strictEqual(r.status, 1);
  assert.strictEqual(r.stdout, '');
  assert.ok(r.stderr.trim().length > 0);
});

test('unknown flag is a usage error, exit 2, stdout clean', () => {
  const r = run(['--nope']);
  assert.strictEqual(r.status, 2);
  assert.strictEqual(r.stdout, '');
  assert.match(r.stderr, /nope/);
});

test('non-numeric seed is a usage error, exit 2', () => {
  const r = run(['--seed', 'banana']);
  assert.strictEqual(r.status, 2);
  assert.strictEqual(r.stdout, '');
});

test('author filter is case-insensitive and narrows the list', () => {
  const all = run(['--list']).stdout.trim().split('\n');
  const r = run(['--list', '--author', 'dijkstra']);
  assert.strictEqual(r.status, 0);
  const some = r.stdout.trim().split('\n');
  assert.ok(some.length >= 1);
  assert.ok(some.length < all.length, 'filtering should narrow the set');
  for (const line of some) assert.match(line, /Dijkstra/i);
});

test('output is pipe-safe — no ANSI escapes when not a TTY', () => {
  const out = execFileSync(process.execPath, [BIN, '--seed', '3'], { encoding: 'utf8' });
  // eslint-disable-next-line no-control-regex
  assert.doesNotMatch(out, /\[/, 'no ANSI escapes should reach a pipe');
});

test('--tag matches membership, not substring containment', () => {
  // The probe is CONSTRUCTED from the live corpus rather than naming a tag
  // literal. Cycle 46 (T-007) consolidated the tag vocabulary and folded the
  // `testing` tag away; this test had hardcoded "test"/"testing" as its
  // substring pair and failed loudly when that pair stopped existing, which
  // is the fixture assertion working. Rebuilding the pair from whatever tags
  // the corpus actually holds removes the dependency on any one tag name
  // surviving a future retagging.
  //
  // Wanted: a real tag T and a proper prefix P of T such that P is not itself
  // a tag. Then "--tag P" is satisfiable ONLY by a substring/prefix matcher,
  // while "--tag T" must still succeed -- the positive control, without which
  // an implementation that matched NOTHING would also pass this test.
  const allTags = new Set();
  for (const e of corpus) for (const t of e.tags) allTags.add(t.toLowerCase());

  let whole = null;
  let prefix = null;
  for (const t of [...allTags].sort()) {
    for (let len = t.length - 1; len >= 1; len--) {
      const p = t.slice(0, len);
      if (!allTags.has(p)) {
        whole = t;
        prefix = p;
        break;
      }
    }
    if (whole) break;
  }
  assert.ok(
    whole && prefix,
    'fixture assumption violated: no corpus tag has a proper prefix that is not itself a tag, ' +
      'so no substring-vs-whole-tag probe can be built from this corpus'
  );

  const rPrefix = run(['--tag', prefix]);
  assert.strictEqual(
    rPrefix.status,
    1,
    '--tag ' + prefix + ' (a proper prefix of the real tag "' + whole +
      '") should match nothing by membership'
  );
  assert.strictEqual(rPrefix.stdout, '');

  // Positive control: the whole tag the prefix was cut from must still match,
  // so the exit 1 above is attributable to whole-tag matching and not to a
  // --tag flag that has stopped matching anything at all.
  const rWhole = run(['--tag', whole]);
  assert.strictEqual(
    rWhole.status,
    0,
    '--tag ' + whole + ' should match by membership (positive control)'
  );
  assert.ok(rWhole.stdout.trim().length > 0);
});

test('--list prints exactly one line per matching entry, no drops', () => {
  const expected = corpus.filter((e) => e.tags.includes('design'));
  assert.ok(expected.length > 1, 'fixture assumption: need multiple "design" entries');
  const r = run(['--tag', 'design', '--list']);
  assert.strictEqual(r.status, 0);
  const lines = r.stdout.trim().split('\n');
  assert.strictEqual(lines.length, expected.length);
});

test('--list preserves corpus order (first and last line match)', () => {
  const expected = corpus.filter((e) => e.tags.includes('design'));
  assert.ok(expected.length > 1, 'fixture assumption: need multiple "design" entries');
  const r = run(['--tag', 'design', '--list']);
  assert.strictEqual(r.status, 0);
  const lines = r.stdout.trim().split('\n');
  const first = expected[0];
  const last = expected[expected.length - 1];
  assert.strictEqual(lines[0], `${first.text} — ${first.author}`);
  assert.strictEqual(
    lines[lines.length - 1],
    `${last.text} — ${last.author}`
  );
});

test('--json output is exactly one line, never pretty-printed', () => {
  const r = run(['--json', '--seed', '1']);
  assert.strictEqual(r.status, 0);
  const lines = r.stdout.split('\n').filter((l) => l.length > 0);
  assert.strictEqual(lines.length, 1, 'expected --json output to be a single line');
});

test('--list --json emits newline-delimited JSON, one object per line, in corpus order', () => {
  // Fixture assumption, shared with the plain --list corpus-order test above:
  // multiple "design"-tagged entries exist, so a collapsed single-array shape
  // (one JSON.stringify of the whole list) is distinguishable by line count
  // from one-object-per-line NDJSON.
  const expected = corpus.filter((e) => e.tags.includes('design'));
  assert.ok(expected.length > 1, 'fixture assumption: need multiple "design" entries');

  const r = run(['--tag', 'design', '--list', '--json']);
  assert.strictEqual(r.status, 0);
  const lines = r.stdout.trim().split('\n');

  // NDJSON promises exactly one line per entry. A pretty-printed JSON array
  // (JSON.stringify(candidates, null, 2)) would spread each entry across many
  // lines instead, so this count check alone catches the array shape — but we
  // also confirm each line parses standalone as a JSON object, which no line
  // of a multi-line array (e.g. "[", "  {", '    "text": ...') can do.
  assert.strictEqual(
    lines.length,
    expected.length,
    'expected exactly one JSON line per matching entry, not a pretty-printed array'
  );

  const parsed = lines.map((line) => JSON.parse(line));
  for (const p of parsed) {
    assert.strictEqual(typeof p.text, 'string');
    assert.strictEqual(typeof p.author, 'string');
    assert.ok(Array.isArray(p.tags));
  }
  assert.deepStrictEqual(
    parsed.map((p) => p.text),
    expected.map((e) => e.text),
    'entries must appear in corpus order'
  );
});

// --- T-044: the "--json composes with the filter and seed flags" clause ------
//
// Added under SPEC I-2 for a MEASURED survivor, never for a read-through. The
// cycle-52 Domain-rule coverage sweep planted one mutant per SPEC Domain-rule
// clause and ran the shipped suite against each; this clause was one of four whose
// mutants the 82-test suite passed green. The two mutants below are quoted from
// that sweep (.swarm/runs/cycle-052-rule-coverage.mjs, cells J3 and J3b) and were
// registered as survivors BEFORE these tests were conceived.
//
// Both violations are SILENT: the CLI still prints a well-formed, single-line JSON
// object of a real corpus entry with the right keys — it is simply the WRONG entry.
// Every pre-existing --json test inspects shape (keys, line count, parseability),
// which is exactly why both mutants walked through them.

test('--json composes with --seed: the seeded JSON pick is reproducible AND is the same entry as the plain-text pick', () => {
  // Kills J3: `pick(candidates, opts.json ? undefined : opts.seed)` — --json
  // silently drops the seed and picks at random.
  //
  // Arm 1, reproducibility. A random pick over 50 entries repeating 8 times runs
  // at ~50^-7, so this is deterministic on correct code and effectively never
  // green on the mutant. The existing '--seed is deterministic across separate
  // processes' test never passes --json, and the existing --json tests never
  // compare two runs, so nothing covered this.
  const outs = new Set();
  for (let i = 0; i < 8; i += 1) outs.add(run(['--json', '--seed', '42']).stdout);
  assert.strictEqual(outs.size, 1, '--json --seed must be reproducible across processes');

  // Arm 2, the DISCRIMINATOR. Reproducibility alone would also be satisfied by a
  // degenerate implementation that ignored the seed and always returned entry 0.
  // The seed must select the SAME entry with and without --json — an observable
  // no seed-ignoring implementation can produce, and one that binds the JSON path
  // to the same selection core as the text path rather than to a remembered value.
  for (const seed of ['0', '1', '42', '-7', '3.5']) {
    const asJson = JSON.parse(run(['--json', '--seed', seed]).stdout.trim());
    const asText = run(['--seed', seed]).stdout;
    assert.ok(
      asText.startsWith(asJson.text),
      `--json --seed ${seed} must select the same entry as --seed ${seed}`
    );
  }
});

test('--json composes with the filter flags: the JSON pick is always a member of the FILTERED set', () => {
  // Kills J3b: `pick(opts.json ? corpus : candidates, opts.seed)` — --json picks
  // from the whole corpus, ignoring --author/--tag entirely.
  //
  // Sweeping seeds rather than trusting one: a single seed has a ~14% chance of
  // landing on a Dijkstra entry by luck even under the mutant, which would make a
  // one-seed test pass on broken code. Across 12 seeds that is (7/50)^12 ~ 1e-10.
  const authorSet = corpus.filter((e) => e.author.toLowerCase().includes('dijk'));
  assert.ok(authorSet.length > 0, 'fixture assumption: the corpus has a Dijkstra entry');
  assert.ok(authorSet.length < corpus.length, 'fixture assumption: the filter must actually narrow');

  const authorTexts = new Set(authorSet.map((e) => e.text));
  for (let s = 0; s < 12; s += 1) {
    const r = run(['--json', '--author', 'dijk', '--seed', String(s)]);
    assert.strictEqual(r.status, 0);
    const got = JSON.parse(r.stdout.trim());
    assert.ok(
      authorTexts.has(got.text),
      `--json --author dijk --seed ${s} returned an entry outside the filtered set: ${got.author}`
    );
  }

  // The same claim for --tag, which travels a different branch of filter().
  const tagSet = corpus.filter((e) => e.tags.some((t) => t.toLowerCase() === 'humor'));
  assert.ok(tagSet.length > 0, 'fixture assumption: the corpus has humor-tagged entries');
  assert.ok(tagSet.length < corpus.length, 'fixture assumption: the tag filter must narrow');

  const tagTexts = new Set(tagSet.map((e) => e.text));
  for (let s = 0; s < 12; s += 1) {
    const r = run(['--json', '--tag', 'humor', '--seed', String(s)]);
    assert.strictEqual(r.status, 0);
    const got = JSON.parse(r.stdout.trim());
    assert.ok(
      tagTexts.has(got.text),
      `--json --tag humor --seed ${s} returned an entry outside the filtered set: ${got.tags}`
    );
  }
});

// --- cycle 53 (T-045) -------------------------------------------------------
//
// PROVENANCE. The mutant below is cell L5 of the cycle-52 full-spec coverage sweep
// (.swarm/runs/cycle-052-rule-coverage.mjs). It was registered as a SURVIVOR of the
// whole 84-test suite before this test was conceived:
//
//     bin/aphorism.js:  if (opts.list)  ->  if (opts.list && opts.seed === undefined)
//
// so `--list --seed 1` stops listing and does a single seeded pick instead.
//
// WHY IT SURVIVED 45 CYCLES. The ruling — "`--list` accepts a valid `--seed` but
// ignores it; no random selection occurs" (SPEC Domain rules; README) — was settled
// by item I-3 at cycle 7 and verified there by EXECUTING the shipped binary in a
// conductor gate. That gate proved the behaviour on the day and left nothing behind
// that would notice a regression. Every pre-existing --list test invokes --list
// WITHOUT a seed, so none of them can see this mutation at all.
//
// A conductor gate and a permanent test are not interchangeable evidence. This is
// the gate's own check, promoted to something that runs on every `node --test`.

test('--list accepts a valid --seed and IGNORES it: output is byte-identical across seeds', () => {
  // Byte-identity rather than a line count, deliberately. A line-count assertion
  // would catch L5 (one pick vs ~50 lines) but would sit green on a seed that
  // REORDERED or RESAMPLED the same number of lines. Identity is the assertion the
  // rule actually makes, and it is the discriminator: no implementation that lets
  // the seed reach selection can hold it across five different seeds.
  const baseline = run(['--list']);
  assert.strictEqual(baseline.status, 0);
  assert.ok(baseline.stdout.trim().split('\n').length >= 40, 'fixture: --list should be long');

  for (const seed of ['0', '1', '42', '-7', '999999']) {
    const r = run(['--list', '--seed', seed]);
    assert.strictEqual(r.status, 0, `--list --seed ${seed} must exit 0`);
    assert.strictEqual(r.stderr, '', `--list --seed ${seed} must write nothing to stderr`);
    assert.strictEqual(
      r.stdout,
      baseline.stdout,
      `--list --seed ${seed} must be byte-identical to unseeded --list`
    );
  }

  // The rule is about --list, not about the plain --list surface only: the same
  // sentence governs the NDJSON and filtered forms, which travel the same branch.
  // Same rule, same edit, no new machinery — so they are covered here rather than
  // left as a second known hole.
  const ndjson = run(['--list', '--json']);
  assert.strictEqual(ndjson.status, 0);
  assert.strictEqual(
    run(['--list', '--json', '--seed', '3']).stdout,
    ndjson.stdout,
    '--list --json --seed must be byte-identical to unseeded --list --json'
  );

  const filtered = run(['--tag', 'design', '--list']);
  assert.strictEqual(filtered.status, 0);
  assert.strictEqual(
    run(['--tag', 'design', '--list', '--seed', '5']).stdout,
    filtered.stdout,
    '--tag design --list --seed must be byte-identical to the unseeded form'
  );
});
