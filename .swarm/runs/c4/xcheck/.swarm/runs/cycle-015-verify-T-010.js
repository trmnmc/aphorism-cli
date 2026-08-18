#!/usr/bin/env node
// Conductor-authored verification harness for T-010 (cycle 15).
// Written at verification time, never shown to the builder.
// Claim under test: the README's date-seeded quote-of-the-day recipe is TRUE of
// the shipped binary — stable all day, changes tomorrow — and the README edit
// stayed inside its documentation scope.
'use strict';
const { execFileSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TARGET = '/opt/targets/aphorism-cli';
const BIN = path.join(TARGET, 'bin/aphorism.js');
const README = path.join(TARGET, 'README.md');

let pass = 0, fail = 0;
const check = (id, desc, ok, detail) => {
  (ok ? pass++ : fail++);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}  ${desc}${detail ? '\n       ' + String(detail).replace(/\n/g, '\n       ') : ''}`);
};

const run = (args) => execFileSync('node', [BIN].concat(args), { encoding: 'utf8', cwd: TARGET });

// ---- A. the recipe's behavioural claim, measured against the shipped binary ----

// A1 stable all day: today's date seed, 6 runs, one distinct output
const today = execSync('date +%Y%m%d', { encoding: 'utf8' }).trim();
const todayRuns = Array.from({ length: 6 }, () => run(['--seed', today]));
const todayDistinct = new Set(todayRuns);
check('A1', `--seed ${today} is stable across 6 runs`, todayDistinct.size === 1,
  `distinct outputs: ${todayDistinct.size} | ${todayRuns[0].trim()}`);

// A2 NEGATIVE CONTROL: the same harness must be able to SEE instability.
// Unseeded selection is random over 50 entries; 25 runs collapsing to 1 distinct
// output would mean A1 proves nothing.
const unseeded = new Set(Array.from({ length: 25 }, () => run([])));
check('A2', 'negative control: unseeded runs are NOT stable (A1 can detect instability)',
  unseeded.size > 1, `distinct outputs across 25 unseeded runs: ${unseeded.size}`);

// A3 changes tomorrow: today vs tomorrow's date seed differ
const tomorrow = execSync('date -d "+1 day" +%Y%m%d', { encoding: 'utf8' }).trim();
const tomorrowOut = run(['--seed', tomorrow]);
check('A3', `--seed ${today} and --seed ${tomorrow} yield different aphorisms`,
  tomorrowOut !== todayRuns[0], `tomorrow: ${tomorrowOut.trim()}`);

// A4 how often does the "changes tomorrow" claim actually hold? Sweep a year of
// consecutive calendar days and count adjacent collisions. A README that says
// "changes tomorrow" is only honest if collisions are rare AND the wording does
// not promise more than the binary delivers.
const days = [];
for (let i = 0; i < 365; i++) {
  days.push(execSync(`date -d "+${i} day" +%Y%m%d`, { encoding: 'utf8' }).trim());
}
const outs = days.map((d) => run(['--seed', d]).trim());
let adjacentCollisions = 0;
const collisionDays = [];
for (let i = 1; i < outs.length; i++) {
  if (outs[i] === outs[i - 1]) { adjacentCollisions++; collisionDays.push(`${days[i - 1]}->${days[i]}`); }
}
check('A4', 'adjacent-day collisions over the next 365 days (reported, not gated)',
  true, `${adjacentCollisions}/364 consecutive-day pairs repeat` +
        (collisionDays.length ? ` | first few: ${collisionDays.slice(0, 5).join(', ')}` : '') +
        ` | distinct quotes across the year: ${new Set(outs).size}`);

// A5 the exact command string in the README must actually run and exit 0.
const readme = fs.readFileSync(README, 'utf8');
const recipeLine = (readme.match(/^.*date \+%Y%m%d.*$/m) || [null])[0];
check('A5', 'README contains a date-seeded recipe line', recipeLine !== null, recipeLine);
if (recipeLine) {
  // execute it literally, as a reader would paste it
  const cmd = recipeLine.replace(/^\s*\$?\s*/, '').trim();
  let out = '', code = 0;
  try {
    out = execSync(cmd, { encoding: 'utf8', cwd: TARGET, shell: '/bin/bash' });
  } catch (e) { code = e.status; out = String(e.stdout || '') + String(e.stderr || ''); }
  check('A6', 'the README line, pasted verbatim into bash, exits 0 and prints an aphorism',
    code === 0 && out.trim().length > 0, `exit ${code} | ${out.trim()}`);
  // and it must agree with the seed the recipe claims
  check('A7', 'the pasted recipe output equals the today-seeded output (same recipe, same result)',
    out === todayRuns[0], `pasted: ${out.trim()}`);
}

// A8 NEGATIVE CONTROL for the grep-shaped checks: a string that is NOT in the
// README must not be found, or A5 proves nothing about presence.
check('A8', 'negative control: an absent marker string is not found in README',
  !/ROTATION_CURSOR_NOT_IN_THIS_README/.test(readme), 'absent-string probe');

// A9 OVERCLAIM GATE. A4 measures that ~3% of consecutive-day pairs repeat, so an
// UNCONDITIONAL promise of a different aphorism every day is false about 11 days
// a year. This run's identity is closing doc/behaviour divergences (I-3) and
// sweeping overclaiming language (I-4a); the same standard applies to prose this
// run adds. Hedged wording ("usually", "almost always", "a new one most days")
// is fine; an unhedged guarantee is not.
const recipeContext = (() => {
  const i = readme.indexOf('date +%Y%m%d');
  return i === -1 ? '' : readme.slice(Math.max(0, i - 400), i + 400);
})();
const HEDGE = /\b(usually|typically|almost always|most days|nearly always|in general|generally|may|might|can repeat|occasionally|rarely)\b/i;
const ABSOLUTE = /\b(every day|each day|a different (one|aphorism|quote) (each|every) day|changes (every|each) day|always changes|guaranteed|never repeats?)\b/i;
const absoluteHit = (recipeContext.match(ABSOLUTE) || [])[0] || null;
check('A9', 'the recipe explanation makes no unhedged every-day-different promise ' +
  `(measured: ${adjacentCollisions}/364 consecutive-day pairs repeat)`,
  absoluteHit === null || HEDGE.test(recipeContext),
  absoluteHit === null ? 'no absolute phrasing found' : `absolute phrasing: "${absoluteHit}" — hedged? ${HEDGE.test(recipeContext)}`);

// ---- B. scope discipline ----

// B1 only README.md differs from the pre-wave commit
const preWave = 'f5242730823e1f1291cd8a19cad5bca3f0db0bba';
const changed = execSync(`git -C ${TARGET} diff --name-only ${preWave} HEAD`, { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
check('B1', 'only README.md changed since the pre-wave commit',
  changed.length === 1 && changed[0] === 'README.md', `changed: ${JSON.stringify(changed)}`);

// B2 the README sections the item was told not to touch are byte-identical.
// NOTE (conductor, cycle 15): the first draft of this check compared the WHOLE
// "## Flags" section and failed. That was the check being wrong, not the work:
// the dispatch fenced "the Flags TABLE", and the usage-examples fence sits under
// the same ## heading, which is exactly where the item's acceptance asks the
// recipe to go. Repaired to assert what was actually fenced — the table itself —
// and B4 below pins the change to a single added line, so this repair TIGHTENS
// the gate rather than opening it.
const before = execSync(`git -C ${TARGET} show ${preWave}:README.md`, { encoding: 'utf8' });
const section = (txt, heading) => {
  const i = txt.indexOf(heading);
  if (i === -1) return null;
  const rest = txt.slice(i + heading.length);
  const j = rest.search(/\n## /);
  return heading + (j === -1 ? rest : rest.slice(0, j));
};
for (const h of ['## Exit codes', '## Attribution', '## Layout', '## Tests']) {
  const a = section(before, h), b = section(readme, h);
  check('B2' + h.replace(/\W/g, ''), `section "${h}" is byte-identical to pre-wave`,
    a !== null && a === b, a === b ? '' : 'CHANGED');
}

// B3 the Flags TABLE specifically — the thing the dispatch actually fenced
const table = (txt) => (txt.match(/\| Flag \| Effect \|[\s\S]*?\n\n/) || [null])[0];
check('B3', 'the Flags table is byte-identical to pre-wave',
  table(before) !== null && table(before) === table(readme),
  table(before) === table(readme) ? '' : 'CHANGED');

// B4 the whole README change is exactly one added line, nothing removed
const numstat = execSync(`git -C ${TARGET} diff --numstat ${preWave} HEAD -- README.md`, { encoding: 'utf8' }).trim();
check('B4', 'README diff is exactly 1 insertion, 0 deletions', /^1\t0\tREADME\.md$/.test(numstat),
  `numstat: ${JSON.stringify(numstat)}`);

// B5 the one added line is the recipe line (not something else smuggled in)
const added = execSync(`git -C ${TARGET} diff -U0 ${preWave} HEAD -- README.md`, { encoding: 'utf8' })
  .split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
check('B5', 'the single added line is the date-seeded recipe',
  added.length === 1 && /date \+%Y%m%d/.test(added[0]), added.join(' | '));

// ---- C. the floor this run must not break ----
let suite = '', suiteCode = 0;
try {
  suite = execSync('node --test test/*.test.js 2>&1', { encoding: 'utf8', cwd: TARGET, shell: '/bin/bash' });
} catch (e) { suiteCode = e.status; suite = String(e.stdout || '') + String(e.stderr || ''); }
// This Node emits "ℹ pass N", not the TAP-style "# pass N" the first draft of
// this check looked for, so it read undefined and failed a suite that is green.
// Accept either marker AND still require exit 0 and a parsed fail count of 0 —
// an unparseable summary now fails loudly instead of passing on exit code alone.
const passLine = (suite.match(/^[#ℹ] pass (\d+)/m) || [])[1];
const failLine = (suite.match(/^[#ℹ] fail (\d+)/m) || [])[1];
check('C1', 'full suite green', suiteCode === 0 && failLine === '0' && passLine !== undefined,
  `exit ${suiteCode} | pass ${passLine} | fail ${failLine}`);

// C2 NEGATIVE CONTROL: the summary parser must be able to read a non-zero fail
// count, or C1's "fail 0" means nothing.
const fakeFail = 'ℹ tests 59\nℹ pass 58\nℹ fail 1\n';
check('C2', 'negative control: the summary parser detects a non-zero fail count',
  (fakeFail.match(/^[#ℹ] fail (\d+)/m) || [])[1] === '1', 'parser sees fail 1 in a synthetic summary');

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
