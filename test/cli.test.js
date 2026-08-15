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
  // Fixture assumptions, derived from the live corpus rather than hardcoded:
  // no tag is the literal string "test", but at least one tag (e.g. "testing")
  // contains "test" as a substring. That makes "--tag test" a probe that only
  // a substring-matching implementation would satisfy.
  const hasExactTagMatch = corpus.some((e) => e.tags.includes('test'));
  assert.strictEqual(
    hasExactTagMatch,
    false,
    'fixture assumption violated: corpus now has a literal "test" tag'
  );
  const hasSubstringTagMatch = corpus.some((e) =>
    e.tags.some((t) => t.includes('test'))
  );
  assert.ok(
    hasSubstringTagMatch,
    'fixture assumption violated: corpus no longer has any tag containing "test" as a substring'
  );

  const r = run(['--tag', 'test']);
  assert.strictEqual(r.status, 1, '--tag test should match nothing by membership');
  assert.strictEqual(r.stdout, '');
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
