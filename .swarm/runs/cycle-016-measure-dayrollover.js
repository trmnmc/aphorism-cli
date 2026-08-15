// cycle 16 — conductor's OWN re-measurement of the day-rollover behaviour.
// Cycle 15's journal claims 11 of 364 consecutive-day pairs repeat (~3%). That is a
// prior-cycle claim. This gate's wording assertions rest on a number I measured myself,
// not on a number I read. Runs the SHIPPED binary, not the pure modules.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const TARGET = '/opt/targets/aphorism-cli';
const BIN = path.join(TARGET, 'bin/aphorism.js');

function runSeed(seed) {
  const out = execFileSync('node', [BIN, '--seed', String(seed), '--json'], {
    cwd: TARGET, encoding: 'utf8',
  });
  return JSON.parse(out).text;
}

// 365 consecutive real calendar days starting 2026-08-15, formatted the way the README
// recipe formats them: date +%Y%m%d -> YYYYMMDD as a number.
const seeds = [];
const d = new Date(Date.UTC(2026, 7, 15));
for (let i = 0; i < 365; i++) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  seeds.push(Number(`${y}${m}${day}`));
  d.setUTCDate(d.getUTCDate() + 1);
}

const texts = seeds.map(runSeed);

let repeats = 0;
const examples = [];
for (let i = 1; i < texts.length; i++) {
  if (texts[i] === texts[i - 1]) {
    repeats++;
    if (examples.length < 5) examples.push(`${seeds[i - 1]}->${seeds[i]}`);
  }
}

const pairs = texts.length - 1;
const distinct = new Set(texts).size;

console.log(`consecutive-day pairs examined : ${pairs}`);
console.log(`pairs returning the SAME text  : ${repeats}  (${((repeats / pairs) * 100).toFixed(2)}%)`);
console.log(`first repeat examples          : ${examples.join(', ')}`);
console.log(`distinct aphorisms over 365 d  : ${distinct}`);
console.log('');
console.log(`CLAIM "the aphorism always changes day to day" is ${repeats === 0 ? 'TRUE' : 'FALSE'}`);
console.log(`CLAIM "output is stable within one seed"       : checked separately below`);

// Stability within a single seed: 8 pulls of one seed must all agree.
const s = seeds[0];
const pulls = new Set(Array.from({ length: 8 }, () => runSeed(s)));
console.log(`same-seed pulls (${s}) distinct : ${pulls.size} (must be 1)`);
