// cycle 16 — conductor verification harness for T-011.
// Authored AT VERIFICATION TIME, after seeing the landed diff. The builder never saw it.
//
// The item is a prose fix, so the gate does NOT ask "does the wording look better".
// It decomposes the shipped comment into the FACTUAL CLAIMS it makes and machine-checks
// each one against the shipped binary and against date(1). A wording change that is
// merely prettier fails; only one whose claims are true passes.
//
// Run from anywhere:  node .swarm/runs/cycle-016-verify-T-011.js
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TARGET = '/opt/targets/aphorism-cli';
const README = path.join(TARGET, 'README.md');
const BIN = path.join(TARGET, 'bin/aphorism.js');
const BASE = '61336bd0d162f1c23c1dc69186f8eab3bddf0605'; // pre-wave master, captured before dispatch

let pass = 0, fail = 0;
const ok = (id, msg, detail) => { pass++; console.log(`PASS ${id}  ${msg}${detail ? '  | ' + detail : ''}`); };
const no = (id, msg, detail) => { fail++; console.log(`FAIL ${id}  ${msg}${detail ? '  | ' + detail : ''}`); };
const chk = (id, cond, msg, detail) => (cond ? ok : no)(id, msg, detail);

const git = (...a) => execFileSync('git', ['-C', TARGET, ...a], { encoding: 'utf8' });
const sh = (cmd) => execFileSync('bash', ['-lc', cmd], { encoding: 'utf8' });

// ---------------------------------------------------------------- the shipped line
const lines = fs.readFileSync(README, 'utf8').split('\n');
const recipeIdx = lines.findIndex((l) => l.includes('--seed $(date +%Y%m%d)'));
const recipe = recipeIdx >= 0 ? lines[recipeIdx] : '';
chk('A0', recipeIdx >= 0, 'the date-seeded recipe line still exists in README', `line ${recipeIdx + 1}`);

const hashCount = (recipe.match(/#/g) || []).length;
chk('A1', hashCount === 1, 'the line carries exactly ONE trailing comment (no added hedging clutter)', `# count: ${hashCount}`);

const cmdPart = recipe.split('#')[0];
const comment = recipe.slice(recipe.indexOf('#') + 1).trim();
console.log(`     comment under test: "${comment}"`);

// ------------------------------------------------- CLAIM 1: "same aphorism all day"
// Machine meaning: every instant inside one local day maps to ONE seed, and one seed
// maps to ONE aphorism. Both halves are checked; either failing falsifies the claim.
const seedAt = (tz, epoch) => sh(`TZ=${tz} date -d @${epoch} +%Y%m%d`).trim();
const TZ = 'America/Los_Angeles';
// 2026-08-15 in TZ: pick 00:00:30, 12:00:00 and 23:59:30 local.
const localMidnight = Number(sh(`TZ=${TZ} date -d '2026-08-15 00:00:00' +%s`).trim());
const sameDay = [localMidnight + 30, localMidnight + 43200, localMidnight + 86370];
const sameDaySeeds = new Set(sameDay.map((e) => seedAt(TZ, e)));
chk('B1', sameDaySeeds.size === 1, 'every instant within one local day yields ONE seed', `distinct seeds: ${sameDaySeeds.size} (${[...sameDaySeeds].join(',')})`);

const oneSeed = [...sameDaySeeds][0];
const pull = (s) => JSON.parse(execFileSync('node', [BIN, '--seed', String(s), '--json'], { cwd: TARGET, encoding: 'utf8' })).text;
const pulls = new Set(Array.from({ length: 10 }, () => pull(oneSeed)));
chk('B2', pulls.size === 1, 'one seed yields ONE aphorism across 10 pulls', `distinct: ${pulls.size}`);

// NEGATIVE CONTROL for B2: unseeded runs must NOT be stable, else B2 proves nothing.
const unseeded = new Set(Array.from({ length: 30 }, () =>
  JSON.parse(execFileSync('node', [BIN, '--json'], { cwd: TARGET, encoding: 'utf8' })).text));
chk('B3', unseeded.size > 1, 'negative control: UNSEEDED runs are not stable (so B2 can discriminate)', `distinct: ${unseeded.size}/30`);

// ------------------------------------- CLAIM 2: "seed refreshes at local midnight"
// Two halves: the boundary is midnight, and the boundary is LOCAL (not UTC).
const before = seedAt(TZ, localMidnight - 1);
const after = seedAt(TZ, localMidnight + 1);
chk('C1', before !== after, 'the seed value changes across local midnight', `${before} -> ${after}`);

// The same two instants must NOT straddle a boundary in UTC — that is what makes the
// word "local" load-bearing rather than decorative.
const beforeU = seedAt('UTC', localMidnight - 1);
const afterU = seedAt('UTC', localMidnight + 1);
chk('C2', beforeU === afterU, 'those same instants do NOT cross a UTC boundary (so "local" is the correct word)', `UTC: ${beforeU} -> ${afterU}`);

// NEGATIVE CONTROL for C1: two instants inside the same local day must NOT change seed.
const midA = seedAt(TZ, localMidnight + 3600);
const midB = seedAt(TZ, localMidnight + 7200);
chk('C3', midA === midB, 'negative control: mid-day instants do NOT change the seed (C1 is not trivially true)', `${midA} == ${midB}`);

// -------- CLAIM NOT MADE: the aphorism itself is NOT promised to differ day to day
// This is the whole point of T-011. Measured: 11 of 364 consecutive-day pairs repeat.
const seeds = [];
const d = new Date(Date.UTC(2026, 7, 15));
for (let i = 0; i < 365; i++) {
  const y = d.getUTCFullYear(), m = String(d.getUTCMonth() + 1).padStart(2, '0'), dd = String(d.getUTCDate()).padStart(2, '0');
  seeds.push(Number(`${y}${m}${dd}`));
  d.setUTCDate(d.getUTCDate() + 1);
}
const texts = seeds.map(pull);
let repeats = 0;
for (let i = 1; i < texts.length; i++) if (texts[i] === texts[i - 1]) repeats++;
chk('D1', repeats > 0, 'MEASURED: consecutive days DO repeat, so an "aphorism changes daily" claim would be false', `${repeats}/${texts.length - 1} pairs repeat (${((repeats / (texts.length - 1)) * 100).toFixed(2)}%)`);

// The shipped comment must attribute the change to the SEED, not leave the aphorism as
// the implied subject. Attributable: the OLD comment fails this exact test (D3).
const changeClause = comment.split(';').slice(-1)[0];
const namesSeed = /\bseed\b/i.test(changeClause);
const namesAphorism = /\b(aphorism|quote)\b/i.test(changeClause);
chk('D2', namesSeed && !namesAphorism, 'the change-clause names the SEED as what refreshes, not the aphorism', `clause: "${changeClause.trim()}"`);

const OLD = 'same aphorism all day; changes at local midnight';
const oldClause = OLD.split(';').slice(-1)[0];
const oldNamesSeed = /\bseed\b/i.test(oldClause);
chk('D3', !oldNamesSeed, 'negative control: the OLD comment FAILS D2 (subject omitted -> reads as the aphorism)', `old clause: "${oldClause.trim()}"`);

// --------------------------------------------------------------- diff shape
const numstat = git('diff', '--numstat', BASE, 'HEAD').trim();
chk('E1', numstat === '1\t1\tREADME.md', 'the entire change is 1 insertion / 1 deletion in README.md only', JSON.stringify(numstat));

const headCmd = git('show', `${BASE}:README.md`).split('\n')[recipeIdx].split('#')[0];
chk('E2', cmdPart === headCmd, 'the COMMAND (everything left of #) is byte-identical to pre-wave', 'unchanged');

// Everything except the recipe line must be byte-identical.
const headLines = git('show', `${BASE}:README.md`).split('\n');
const strip = (arr) => arr.filter((_, i) => i !== recipeIdx).join('\n');
chk('E3', strip(headLines) === strip(lines), 'every OTHER line of README.md is byte-identical to pre-wave', `${lines.length} lines`);

const tableOf = (arr) => arr.filter((l) => l.startsWith('| `')).join('\n');
chk('E4', tableOf(headLines) === tableOf(lines), 'the Flags table is byte-identical', 'unchanged');

const changed = git('diff', '--name-only', BASE, 'HEAD').trim().split('\n').filter(Boolean);
chk('E5', changed.length === 1 && changed[0] === 'README.md', 'no file outside README.md was touched', changed.join(','));

// --------------------------------------------------------------- suite
let suiteOut = '', suiteExit = 0;
try {
  suiteOut = execFileSync('bash', ['-lc', 'cd ' + TARGET + ' && node --test test/*.test.js 2>&1'], { encoding: 'utf8' });
} catch (e) { suiteOut = String(e.stdout || ''); suiteExit = e.status || 1; }
// HARNESS REPAIR (cycle 16, stated plainly): the first run of this gate scored 17/1.
// The failure was MINE, not the product's. I wrote the summary marker class as [#i],
// but this Node emits U+2139 (INFORMATION SOURCE, "i"), so `pass`/`fail` parsed as
// undefined against a suite that is in fact green -- confirmed by running test_cmd
// directly myself: 59 pass / 0 fail. The repair is marker-AGNOSTIC (any leading glyph)
// and makes the gate STRICTER, not looser: where there was one assertion there are now
// three, and nothing previously asserted stopped being asserted.
const grab = (k, s = suiteOut) => {
  const m = s.match(new RegExp('^\\D*\\b' + k + '\\s+(\\d+)\\s*$', 'm'));
  return m ? Number(m[1]) : undefined;
};
const passN = grab('pass'), failN = grab('fail'), testsN = grab('tests');
chk('F1', suiteExit === 0 && failN === 0 && passN > 0, 'full suite green (exit 0 AND a PARSED fail count of 0)', `exit ${suiteExit} | pass ${passN} | fail ${failN}`);

// Added by the repair: a partial/truncated run must not read as green just because
// exit was 0 and no failures were printed.
chk('F2', testsN !== undefined && testsN === passN, 'every test that RAN also passed (tests == pass, so a partial run cannot read as green)', `tests ${testsN} | pass ${passN}`);

// NEGATIVE CONTROL: the repaired parser must SEE a non-zero fail count.
chk('F3', grab('fail', 'i tests 59\ni pass 57\ni fail 2\n') === 2, 'negative control: the repaired parser can see a non-zero fail count', 'parsed 2');

// NEGATIVE CONTROL: an ABSENT summary must parse as undefined and fail loudly, never
// pass on exit code alone.
chk('F4', grab('pass', 'some output with no summary block at all\n') === undefined, 'negative control: a missing summary parses as undefined (fails loudly, not silently green)', 'undefined');

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
