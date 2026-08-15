#!/usr/bin/env node
// cycle-014-verify-taste.js — conductor-authored AFTER the taste agent returned.
// The agent never saw this file. A taste verdict is a judgment and cannot be
// gated by an exit code, but every FACTUAL claim it rests on is falsifiable, so
// each one is measured here rather than read and agreed with.
//
// Two negative controls are included: a harness of passing checks is worthless
// if its detectors cannot fail.
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const T = '/opt/targets/aphorism-cli';
const BIN = path.join(T, 'bin', 'aphorism.js');
const corpusMod = require(path.join(T, 'src', 'corpus.js'));
const selectMod = require(path.join(T, 'src', 'select.js'));
const arr = Array.isArray(corpusMod)
  ? corpusMod
  : (corpusMod.corpus || corpusMod.entries || corpusMod.default);
const pick = selectMod.pick || selectMod.select;

let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  (cond ? pass++ : fail++);
  console.log((cond ? 'PASS  ' : 'FAIL  ') + label + (detail ? '  :: ' + detail : ''));
};
const run = (args) => {
  try {
    return { code: 0, out: execFileSync('node', [BIN].concat(args), { cwd: T }).toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString() };
  }
};

// ---------------------------------------------------------------- tag shape
const tags = {};
for (const e of arr) for (const t of (e.tags || [])) tags[t] = (tags[t] || 0) + 1;
const distinct = Object.keys(tags).length;
const singles = Object.entries(tags).filter((x) => x[1] === 1);
const twos = Object.entries(tags).filter((x) => x[1] === 2);

ok('C1a corpus is 50 entries', arr.length === 50, arr.length + ' entries');
ok('C1b agent claim "37 distinct tags" holds', distinct === 37, 'actual ' + distinct);
// The agent said 23 singleton tags. This is the one number it got wrong.
ok('C1c agent claim "23 of 37 tags hold exactly one quote" is REFUTED',
  singles.length !== 23, 'actual singletons = ' + singles.length);
ok('C1d the finding survives on corrected numbers: a MAJORITY of tags are <=2 entries',
  (singles.length + twos.length) / distinct > 0.5,
  (singles.length + twos.length) + '/' + distinct + ' tags hold <=2 (' + singles.length + ' hold exactly 1)');

// ------------------------------------------------- singleton tags echo forever
const eight = [];
for (let i = 0; i < 4; i++) eight.push(run(['--tag', 'naming']).out.trim());
for (let i = 0; i < 4; i++) eight.push(run(['--tag', 'caching']).out.trim());
ok('C2a agent claim: --tag naming x4 + --tag caching x4 = ONE identical output',
  new Set(eight).size === 1, 'distinct outputs = ' + new Set(eight).size);
ok('C2b and that output is the Phil Karlton line the agent named',
  /Karlton/.test(eight[0]) && /cache invalidation/.test(eight[0]),
  eight[0].replace(/\s+/g, ' ').slice(0, 64));
ok('C2c [negative control] a MULTI-entry tag is NOT a fixed echo',
  new Set(Array.from({ length: 25 }, () => run(['--tag', 'humor']).out.trim())).size > 1,
  'humor pool = ' + tags.humor + ', distinct over 25 pulls = ' +
    new Set(Array.from({ length: 25 }, () => run(['--tag', 'humor']).out.trim())).size);

// ------------------------------------------------------ the staleness claim
// The agent's core claim is anecdotal ("first repeat at use 3"). A single
// session cannot establish it. Measured over 3000 in-process sessions instead,
// against the closed-form birthday value for a uniform 50-entry pool.
const trials = [];
for (let t = 0; t < 3000; t++) {
  const seen = new Set();
  let i = 0;
  for (;;) {
    i++;
    const k = pick(arr).text;
    if (seen.has(k)) { trials.push(i); break; }
    seen.add(k);
    if (i > 200) { trials.push(201); break; }
  }
}
const mean = trials.reduce((a, b) => a + b, 0) / trials.length;
const byTen = trials.filter((x) => x <= 10).length / trials.length;
let noRep = 1, analytic = 0;
for (let k = 1; k <= 50; k++) { analytic += k * (noRep * (k - 1) / 50); noRep *= (50 - (k - 1)) / 50; }
ok('C3a empirical first-repeat matches the closed-form birthday value',
  Math.abs(mean - analytic) < 0.5,
  'empirical mean ' + mean.toFixed(2) + ' vs analytic ' + analytic.toFixed(2));
ok('C3b a majority of users meet a repeat within 10 uses (the agent\'s "wears thin by ten")',
  byTen > 0.5, 'P(repeat by use 10) = ' + (byTen * 100).toFixed(1) + '%');
const hist = new Array(arr.length).fill(0);
for (let i = 0; i < 50000; i++) hist[arr.indexOf(pick(arr))]++;
ok('C3c [negative control] the picker is UNIFORM, so the repeat rate is corpus size, not a picker bug',
  Math.min.apply(null, hist) > 800 && Math.max.apply(null, hist) < 1200,
  'min ' + Math.min.apply(null, hist) + ' max ' + Math.max.apply(null, hist) + ' expected 1000');

// -------------------------------------------------- discoverability claims
const help = run(['--help']).out;
ok('C4a agent claim: --help names --tag but never names a single tag',
  /--tag/.test(help) && !Object.keys(tags).some((t) => new RegExp('\\b' + t + '\\b').test(help)),
  'help is ' + help.split('\n').length + ' lines, 0 tag names');
const readme = require('fs').readFileSync(path.join(T, 'README.md'), 'utf8');
const namedInReadme = Object.keys(tags).filter((t) => new RegExp('`' + t + '`|--tag ' + t).test(readme));
ok('C4b agent claim: README does not publish the tag vocabulary',
  namedInReadme.length < 5,
  'README names ' + namedInReadme.length + ' of ' + distinct + ' tags (' + namedInReadme.join(',') + ') — as examples, not a list');
ok('C4c agent claim: --tag bugs is an exit-1 miss while --tag debugging works',
  run(['--tag', 'bugs']).code === 1 && run(['--tag', 'debugging']).code === 0,
  'bugs -> exit 1, debugging -> exit 0 (' + tags.debugging + ' entries)');

// ------------------------------------------------------- the seed-as-date hook
const dates = ['20260815', '20260816', '20260817'];
const stable = dates.every((d) => {
  const a = run(['--seed', d]).out;
  return a === run(['--seed', d]).out && a === run(['--seed', d]).out;
});
const distinctDates = new Set(dates.map((d) => run(['--seed', d]).out)).size;
ok('C5a agent claim: --seed <date> is stable within a day', stable, '3 dates x 3 runs each');
ok('C5b agent claim: consecutive dates give DIFFERENT quotes',
  distinctDates === 3, distinctDates + '/3 distinct');
ok('C5c the README --seed example is the fixture-shaped one the agent criticised',
  /--tag simplicity --seed 42/.test(readme) && !/date \+%Y%m%d/.test(readme),
  'README shows "--tag simplicity --seed 42", no date recipe present');

// ------------------------------------------------------------- scope check
ok('C6 the taste agent modified NO product file',
  execFileSync('git', ['-C', T, 'diff', '--stat', 'HEAD', '--', 'src', 'bin', 'test', 'README.md', 'docs'])
    .toString().trim() === '',
  'git diff vs HEAD over product paths is empty');

console.log('\n' + pass + '/' + (pass + fail) + ' checks passed');
process.exit(fail === 0 ? 0 : 1);
