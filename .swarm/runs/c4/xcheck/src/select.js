'use strict';

// Pure selection core: filtering and picking over a corpus array.
// No dependencies beyond Node builtins.

/**
 * Filter a corpus array by author (substring, case-insensitive) and/or
 * tag (membership, case-insensitive). Both filters, when supplied,
 * narrow to the intersection (AND). Undefined/absent options do not filter.
 *
 * @param {Array<{text: string, author: string, tags: string[]}>} corpus
 * @param {{author?: string, tag?: string}} [options]
 * @returns {Array<object>} a new array
 */
function filter(corpus, options) {
  const { author, tag } = options || {};

  let result = corpus.slice();

  if (author !== undefined && author !== null) {
    const needle = String(author).toLowerCase();
    result = result.filter((entry) =>
      entry.author.toLowerCase().includes(needle)
    );
  }

  if (tag !== undefined && tag !== null) {
    const needle = String(tag).toLowerCase();
    result = result.filter((entry) =>
      entry.tags.some((t) => t.toLowerCase() === needle)
    );
  }

  return result;
}

// mulberry32: small, fast, deterministic PRNG. Given the same 32-bit
// integer seed, it always produces the same sequence of floats in [0, 1).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Derive a 32-bit integer seed from an arbitrary finite number so that
// non-integer or large seed values still produce a stable, well-mixed
// starting state for mulberry32.
function toUint32Seed(seed) {
  // Fold the number's bit pattern down to 32 bits deterministically.
  const buf = new ArrayBuffer(8);
  new Float64Array(buf)[0] = seed;
  const ints = new Uint32Array(buf);
  return (ints[0] ^ ints[1]) >>> 0;
}

/**
 * Pick one element from candidates. When seed is a number (including
 * +Infinity/-Infinity), the pick is deterministic: the same seed over the
 * same candidates array always returns the same element. toUint32Seed
 * folds the seed's IEEE-754 bit pattern down to 32 bits, which is
 * well-defined even for non-finite values, so only NaN and
 * undefined/null seeds fall back to picking uniformly at random. Throws
 * RangeError if candidates is empty.
 *
 * @param {Array<object>} candidates
 * @param {number} [seed]
 * @returns {object}
 */
function pick(candidates, seed) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new RangeError('pick: candidates array must not be empty');
  }

  let index;
  if (typeof seed === 'number' && !Number.isNaN(seed)) {
    const rng = mulberry32(toUint32Seed(seed));
    index = Math.floor(rng() * candidates.length);
    if (index >= candidates.length) index = candidates.length - 1;
  } else {
    index = Math.floor(Math.random() * candidates.length);
  }

  return candidates[index];
}

module.exports = { filter, pick };
