'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { corpus } = require('../src/corpus.js');
const { filter, pick } = require('../src/select.js');

test('corpus has at least 40 entries', () => {
  assert.ok(
    corpus.length >= 40,
    `expected corpus.length >= 40, got ${corpus.length}`
  );
});

test('every corpus entry has non-empty text, non-empty author, and an array of tags', () => {
  for (const entry of corpus) {
    assert.strictEqual(typeof entry.text, 'string');
    assert.ok(entry.text.trim().length > 0, 'text must be non-empty');

    assert.strictEqual(typeof entry.author, 'string');
    assert.ok(entry.author.trim().length > 0, 'author must be non-empty');

    assert.ok(Array.isArray(entry.tags), 'tags must be an array');
    assert.ok(entry.tags.length > 0, 'tags array must be non-empty');
    for (const tag of entry.tags) {
      assert.strictEqual(typeof tag, 'string');
      assert.ok(tag.trim().length > 0, 'each tag must be non-empty');
    }
  }
});

test('filter: author match is case-insensitive', () => {
  const lower = filter(corpus, { author: 'dijkstra' });
  const upper = filter(corpus, { author: 'DIJKSTRA' });
  const mixed = filter(corpus, { author: 'DiJkStRa' });

  assert.ok(lower.length > 0, 'expected at least one Dijkstra entry');
  assert.deepStrictEqual(lower, upper);
  assert.deepStrictEqual(lower, mixed);
  for (const entry of lower) {
    assert.ok(entry.author.toLowerCase().includes('dijkstra'));
  }
});

test('filter: tag match is case-insensitive', () => {
  const lower = filter(corpus, { tag: 'debugging' });
  const upper = filter(corpus, { tag: 'DEBUGGING' });
  const mixed = filter(corpus, { tag: 'DeBuGgInG' });

  assert.ok(lower.length > 0, 'expected at least one debugging entry');
  assert.deepStrictEqual(lower, upper);
  assert.deepStrictEqual(lower, mixed);
  for (const entry of lower) {
    assert.ok(entry.tags.some((t) => t.toLowerCase() === 'debugging'));
  }
});

test('filter: author and tag together narrow to the intersection (AND)', () => {
  const both = filter(corpus, { author: 'kernighan', tag: 'debugging' });
  const authorOnly = filter(corpus, { author: 'kernighan' });
  const tagOnly = filter(corpus, { tag: 'debugging' });

  assert.ok(both.length > 0, 'expected at least one Kernighan debugging entry');
  assert.ok(both.length <= authorOnly.length);
  assert.ok(both.length <= tagOnly.length);

  for (const entry of both) {
    assert.ok(entry.author.toLowerCase().includes('kernighan'));
    assert.ok(entry.tags.some((t) => t.toLowerCase() === 'debugging'));
  }

  // Sanity: combining two non-overlapping filters yields the empty set.
  // Both halves must be individually NON-empty, or the AND proves nothing --
  // an empty result would be explained by the tag simply not existing. This
  // read "tag: 'management'" until cycle 46 (T-007) folded that tag away,
  // at which point it was passing vacuously; the two assertions below now
  // hold the premise in place so the same silent decay fails loudly instead.
  const nonOverlapTag = 'teamwork';
  assert.ok(
    corpus.some((e) => e.tags.some((t) => t.toLowerCase() === nonOverlapTag)),
    'fixture assumption violated: tag "' + nonOverlapTag + '" is not in the corpus'
  );
  assert.ok(
    !corpus.some(
      (e) =>
        e.author.toLowerCase().includes('dijkstra') &&
        e.tags.some((t) => t.toLowerCase() === nonOverlapTag)
    ),
    'fixture assumption violated: some Dijkstra entry now carries "' + nonOverlapTag + '"'
  );
  const none = filter(corpus, { author: 'dijkstra', tag: nonOverlapTag });
  assert.strictEqual(none.length, 0);
});

test('filter: undefined/absent options do not filter', () => {
  const result = filter(corpus, {});
  assert.deepStrictEqual(result, corpus);

  const resultNoOptions = filter(corpus);
  assert.deepStrictEqual(resultNoOptions, corpus);
});

test('pick: same seed over the same candidates always returns the same element', () => {
  const first = pick(corpus, 42);
  for (let i = 0; i < 20; i++) {
    assert.deepStrictEqual(pick(corpus, 42), first);
  }

  // Also true for a filtered candidate set.
  const filtered = filter(corpus, { tag: 'design' });
  const firstFiltered = pick(filtered, 7);
  for (let i = 0; i < 20; i++) {
    assert.deepStrictEqual(pick(filtered, 7), firstFiltered);
  }
});

test('pick: different seeds generally produce different results', () => {
  const results = new Set();
  for (let seed = 0; seed < 25; seed++) {
    results.add(JSON.stringify(pick(corpus, seed)));
  }
  assert.ok(
    results.size > 1,
    'expected different seeds to yield more than one distinct result'
  );
});

test('pick: undefined seed picks a valid member (random mode)', () => {
  const result = pick(corpus);
  assert.ok(corpus.includes(result));
});

test('pick: null seed also triggers random mode and returns a valid member', () => {
  const result = pick(corpus, null);
  assert.ok(corpus.includes(result));
});

test('pick: throws RangeError on empty candidates array', () => {
  assert.throws(() => pick([], 1), RangeError);
  assert.throws(() => pick([]), RangeError);
});

test('pick: Infinity seed is deterministic and returns a valid member', () => {
  const many = corpus.concat(corpus).concat(corpus); // >= 20 elements, well over
  const first = pick(many, Infinity);
  assert.ok(many.includes(first));
  for (let i = 0; i < 20; i++) {
    assert.deepStrictEqual(pick(many, Infinity), first);
  }
});

test('pick: -Infinity seed is deterministic and returns a valid member', () => {
  const many = corpus.concat(corpus).concat(corpus);
  const first = pick(many, -Infinity);
  assert.ok(many.includes(first));
  for (let i = 0; i < 20; i++) {
    assert.deepStrictEqual(pick(many, -Infinity), first);
  }
});

test('pick: NaN seed still uses the random branch and returns a valid member', () => {
  const result = pick(corpus, NaN);
  assert.ok(corpus.includes(result));
});

test('pick: finite seed determinism is unchanged by the non-finite-seed fix', () => {
  const many = corpus.concat(corpus).concat(corpus);
  const expected = pick(many, 12345);
  for (let i = 0; i < 20; i++) {
    assert.deepStrictEqual(pick(many, 12345), expected);
  }
});

test('pick: single-element candidates always returns that element regardless of seed', () => {
  const single = [corpus[0]];
  assert.deepStrictEqual(pick(single, 1), corpus[0]);
  assert.deepStrictEqual(pick(single, 99999), corpus[0]);
  assert.deepStrictEqual(pick(single), corpus[0]);
});
