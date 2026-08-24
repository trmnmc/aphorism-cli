// Conductor gate for W-5, part 2. Corrects the conductor's own row-parser bug
// from gate-c3-w5.mjs (it assumed 5 pipe columns; the table has 2, counts in prose).
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const WORK = ROOT + '/.swarm/gate-c3w5b';

const readme = readFileSync(ROOT + '/README.md', 'utf8');
const rows = [...readme.matchAll(
  /^\|\s*(v\d+\.[\d.]+)\s*\|\s*(\d+) tests, (\d+) pass, (\d+) fail, (\d+) skipped\s*\|/gm)]
  .map((m) => ({ node: m[1], tests: +m[2], pass: +m[3], fail: +m[4], skipped: +m[5] }));

console.log('[1] README matrix rows, parsed independently by the conductor:');
for (const r of rows) console.log('   ', r.node, `-> ${r.tests}/${r.pass}/${r.fail}/${r.skipped}`);
console.log('    row count:', rows.length);

// Measured in gate-c3-w5.mjs run: depth-1 clone yielded 129 tests, 127 pass, 0 fail, 2 skipped.
const DEPTH1 = { tests: 129, pass: 127, fail: 0, skipped: 2 };
const allMatch = rows.length === 4 && rows.every((r) =>
  r.tests === DEPTH1.tests && r.pass === DEPTH1.pass && r.fail === DEPTH1.fail && r.skipped === DEPTH1.skipped);
console.log('\n[4-corrected] every README row == measured depth-1 result ->', allMatch ? 'YES' : 'NO');

// [7] FALSIFIABILITY with the correct anchor.
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
const PERT = WORK + '/pert';
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, PERT]);
const p = PERT + '/README.md';
const src = readFileSync(p, 'utf8');
const out = src.replace('| v18.20.8 | 129 tests, 127 pass, 0 fail, 2 skipped |',
                        '| v18.20.8 | 129 tests, 126 pass, 0 fail, 2 skipped |');
if (out === src) throw new Error('perturbation anchor STILL not found');
writeFileSync(p, out);
execFileSync('cp', [ROOT + '/tools/matrix-adjudication.mjs', PERT + '/tools/matrix-adjudication.mjs']);
const tp = spawnSync('node', ['tools/matrix-adjudication.mjs'], { cwd: PERT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
console.log('\n[7] row falsified 127->126, tool exit:', tp.status,
  tp.status === 1 ? '(STALE — the tool IS failable)' : '(NOT STALE — possible rubber-stamp)');
console.log('    verdict:', (tp.stdout.match(/^.*VERDICT.*$/mi) || ['(none)'])[0].trim());

// [7b] second falsification: make the retirement condition fire (touch src/ and commit).
const PERT2 = WORK + '/pert2';
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, PERT2]);
execFileSync('git', ['-C', PERT2, 'config', 'user.email', 'gate@local']);
execFileSync('git', ['-C', PERT2, 'config', 'user.name', 'gate']);
writeFileSync(PERT2 + '/src/corpus.js', readFileSync(PERT2 + '/src/corpus.js', 'utf8') + '\n// gate probe\n');
execFileSync('git', ['-C', PERT2, 'commit', '--quiet', '-am', 'gate: touch src to fire retirement']);
execFileSync('cp', [ROOT + '/tools/matrix-adjudication.mjs', PERT2 + '/tools/matrix-adjudication.mjs']);
const tp2 = spawnSync('node', ['tools/matrix-adjudication.mjs'], { cwd: PERT2, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
console.log('\n[7b] src/ touched + committed, tool exit:', tp2.status,
  tp2.status === 1 ? '(STALE — retirement condition fired)' : '(did not fire)');
console.log('    verdict:', (tp2.stdout.match(/^.*VERDICT.*$/mi) || ['(none)'])[0].trim());

rmSync(WORK, { recursive: true, force: true });
console.log('\ngate scratch removed.');
