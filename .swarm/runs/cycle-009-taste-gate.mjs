// Cycle 9 verification gate — conductor-authored AT VERIFICATION TIME (cycle.md step 6.1).
// Reproduces the taste agent's measurable claims. The agent never saw this file.
import { spawnSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const run = (...a) => {
  const r = spawnSync('node', ['bin/aphorism.js', ...a], { cwd: T, encoding: 'utf8' });
  return { out: r.stdout, err: r.stderr, code: r.status };
};

const checks = [];
const ck = (name, pass, detail) => { checks.push({ name, pass, detail }); };

// C1 determinism: --seed 42 twice must be byte-identical
const a = run('--seed', '42'), b = run('--seed', '42');
ck('C1 seed-42 deterministic', a.out === b.out && a.out.length > 0,
  JSON.stringify(a.out.trim().split('\n')[0]) + ' (exit ' + a.code + ')');

// C2 empty match: exit 1, stderr only, stdout EMPTY
const em = run('--tag', 'nonsense');
ck('C2 empty match = exit 1 + stderr only', em.code === 1 && em.out === '' && em.err.trim() !== '',
  'exit=' + em.code + ' stdout_bytes=' + em.out.length + ' stderr=' + JSON.stringify(em.err.trim()));

// C3 bad seed: non-numeric rejected with a usage exit code
const bs = run('--seed', 'banana');
ck('C3 --seed banana rejected', bs.code !== 0 && bs.out === '',
  'exit=' + bs.code + ' stdout_bytes=' + bs.out.length + ' stderr=' + JSON.stringify(bs.err.trim()));

// C4 corpus size + author skew + tag pools, straight from --list --json
const j = run('--list', '--json').out.trim().split('\n').map((l) => JSON.parse(l));
const auth = {}, tags = {};
for (const e of j) {
  auth[e.author] = (auth[e.author] || 0) + 1;
  for (const g of e.tags || []) tags[g] = (tags[g] || 0) + 1;
}
const as = Object.entries(auth).sort((x, y) => y[1] - x[1]);
const top3 = as.slice(0, 3).reduce((s, [, v]) => s + v, 0);
ck('C4 corpus = 50 entries / 24 authors', j.length === 50 && as.length === 24,
  'entries=' + j.length + ' authors=' + as.length);
ck('C5 top-3 voices hold ~1/3 of corpus', top3 === 17,
  'top3=' + top3 + '/' + j.length + ' (' + (100 * top3 / j.length).toFixed(0) + '%) : '
  + as.slice(0, 3).map(([k, v]) => k + ':' + v).join(', '));
const thin = Object.entries(tags).filter(([, v]) => v <= 4).map(([k]) => k).sort();
ck('C6 five tag pools hold <= 4 entries', thin.length === 5 && tags.philosophy === 3,
  'thin=' + thin.join(',') + ' | philosophy=' + tags.philosophy);

// C7 the help line the agent called un-pasteable: no binary name in the snippet
const help = run('--help').out;
const line = help.split('\n').find((l) => l.includes('jq')) || '';
ck('C7 help jq snippet omits the binary name', line.includes('jq') && !/aphorism\s+--list/.test(line),
  JSON.stringify(line.trim()));

// C8 "repeat by use 12" is TYPICAL, not an anecdote (birthday collision, N=50)
const N = 50; let p = 1; const cdf = [0];
for (let k = 1; k <= N + 1; k++) cdf[k] = 1 - (p *= (N - (k - 1)) / N);
let med = 0; for (let k = 1; k <= N + 1; k++) if (cdf[k] >= 0.5) { med = k; break; }
ck('C8 first repeat expected at ~9, so use-12 is conservative', med <= 12 && cdf[12] > 0.5,
  'median_first_repeat=' + med + ' P(repeat_by_12)=' + (100 * cdf[12]).toFixed(1) + '%');

for (const c of checks) console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + ' :: ' + c.detail);
const failed = checks.filter((c) => !c.pass).length;
console.log('---');
console.log(checks.length - failed + '/' + checks.length + ' gate checks PASS');
process.exit(failed ? 1 : 0);
