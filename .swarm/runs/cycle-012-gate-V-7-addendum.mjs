#!/usr/bin/env node
// cycle-012-gate-V-7-addendum.mjs
//
// AUTHORED AFTER the sealed gate's baseline run, and labelled as such. It carries no
// weight as pre-committed evidence for anything the V-7 repair changed. It exists for
// exactly one reason: assertion A6 of the sealed gate `cycle-012-gate-V-7.mjs` is a
// DEFECTIVE INSTRUMENT, and the sealed file is not edited after it has run (run #3
// cycle 4 set that precedent when its sealed gate's N4-c check failed for the same
// class of reason — a check stricter or sloppier than the claim it was written to test).
//
// The defect: A6 extracts the retired tag names with the lookahead /(?=,| and | to )/,
// which requires a SPACE after "to". In the README the phrase "...and interoperability to
// reliability" wraps across a line, so the text is "to\nreliability" and the name
// `interoperability` is silently dropped. A6 therefore measured 25 names, compared that
// against the README's word "Twenty-six", and failed the README for the extractor's
// own bug. The README claim is TRUE.
//
// A6' below fixes only that lookahead (\s instead of a literal space) and changes nothing
// else. It is a CONTROL: it must pass on the pre-repair tree and the post-repair tree
// alike, because V-7 changed no tag, no corpus entry and no README sentence.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const REPO = '/opt/targets/aphorism-cli';
const require = createRequire(import.meta.url);
const README = readFileSync(`${REPO}/README.md`, 'utf8');
const corpus = require(`${REPO}/src/corpus.js`).corpus;

const tagCount = {};
for (const e of corpus) for (const t of e.tags) tagCount[t] = (tagCount[t] || 0) + 1;

const para = README.match(/optimization, algorithms[\s\S]*?and\s+testing to debugging\./);
const names = para ? [...para[0].matchAll(/\b([a-z]+)\b(?=,|\s+and\s+|\s+to\s+)/g)].map((m) => m[1]) : [];
const folded = [...new Set(names)].filter((n) => !['to', 'and'].includes(n) && !(n in tagCount));

const bad = [];
for (const n of folded) {
  try {
    execFileSync('node', [`${REPO}/bin/aphorism.js`, '--tag', n], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    bad.push(`${n}:exit0`);
  } catch (err) {
    if (err.status !== 1 || (err.stdout ?? '') !== '' || !(err.stderr ?? '').trim()) bad.push(`${n}:exit${err.status}`);
  }
}

const countOk = README.includes('Twenty-six low-count tag names') && folded.length === 26;
const pathOk = bad.length === 0;

console.log(`extracted ${folded.length} retired tag names: ${folded.join(', ')}`);
console.log(`${countOk ? 'PASS' : 'FAIL'} A6'-count : README says "Twenty-six" and ${folded.length} names are listed`);
console.log(`${pathOk ? 'PASS' : 'FAIL'} A6'-nomatch: all ${folded.length} exit 1 with stdout empty and a stderr message${bad.length ? ` — OFFENDERS ${bad.join(',')}` : ''}`);

// Negative control: the extractor must be able to fail. Feed it a mutated paragraph with
// one name removed and confirm the count assertion goes RED — a check that cannot fail is
// not evidence, which is the defect this file exists to correct in the first place.
const mutated = para[0].replace('yagni and ', '');
const mutNames = [...new Set([...mutated.matchAll(/\b([a-z]+)\b(?=,|\s+and\s+|\s+to\s+)/g)].map((m) => m[1]))]
  .filter((n) => !['to', 'and'].includes(n) && !(n in tagCount));
console.log(`${mutNames.length === 25 ? 'PASS' : 'FAIL'} A6'-control: dropping one name from the paragraph makes the extractor count ${mutNames.length}, not 26`);

process.exit(countOk && pathOk && mutNames.length === 25 ? 0 : 1);
