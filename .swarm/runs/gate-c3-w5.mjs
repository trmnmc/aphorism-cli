// Conductor gate for cycle 3, item W-5. Authored at verification time.
// The claim under test: 127 and 129 are the SAME suite under two environments,
// so README is CORRECT-AS-CITED and needs no repair.
// The decisive discriminator is reproduced here by the conductor, independently:
// a depth-1 clone (CI's checkout condition) must yield exactly the table row.
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const WORK = ROOT + '/.swarm/gate-c3w5';
const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

function suite(cwd) {
  const files = readdirSync(cwd + '/test').filter((f) => f.endsWith('.test.js')).sort()
    .map((f) => 'test/' + f);
  const r = spawnSync('node', ['--test', '--test-reporter=tap', ...files],
    { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout + r.stderr;
  const g = (k) => { const m = out.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? +m[1] : null; };
  const skipped = [...out.matchAll(/^ok \d+ - (.+?) # SKIP/gm)].map((m) => m[1].trim());
  const failed = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  return { tests: g('tests'), pass: g('pass'), fail: g('fail'), skipped: skipped.length, skippedTitles: skipped, failed };
}

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

// --- 1. Parse the four matrix rows out of README myself, no tool involved.
const readme = readFileSync(ROOT + '/README.md', 'utf8');
const rows = [...readme.matchAll(/^\|\s*(v\d+\.[\d.]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gm)]
  .map((m) => ({ node: m[1], tests: +m[2], pass: +m[3], fail: +m[4], skipped: +m[5] }));
console.log('[1] README matrix rows, parsed independently:');
for (const r of rows) console.log('   ', r.node, `${r.tests} tests, ${r.pass} pass, ${r.fail} fail, ${r.skipped} skipped`);

// --- 2. FULL local clone (developer condition).
const FULL = WORK + '/full';
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, FULL]);
git(FULL, ['checkout', '--quiet', '--', '.']);
git(FULL, ['clean', '--quiet', '-fd']);
const full = suite(FULL);
console.log('\n[2] FULL clone (dev condition)   ->',
  `${full.tests} tests, ${full.pass} pass, ${full.fail} fail, ${full.skipped} skipped`);

// --- 3. DEPTH-1 clone (CI's checkout condition). THE DISCRIMINATOR.
const SHALLOW = WORK + '/shallow';
execFileSync('git', ['clone', '--quiet', '--depth', '1', 'file://' + ROOT, SHALLOW]);
console.log('\n[3] depth-1 clone is shallow    ->', git(SHALLOW, ['rev-parse', '--is-shallow-repository']).trim());
const shallow = suite(SHALLOW);
console.log('    DEPTH-1 result              ->',
  `${shallow.tests} tests, ${shallow.pass} pass, ${shallow.fail} fail, ${shallow.skipped} skipped`);
console.log('    skipped test titles:', shallow.skippedTitles);

// --- 4. Does the depth-1 result equal the README table row?
const row = rows[0];
const match = row && shallow.tests === row.tests && shallow.pass === row.pass
  && shallow.fail === row.fail && shallow.skipped === row.skipped;
console.log('\n[4] depth-1 == README row?      ->', match ? 'YES — table reproduced exactly' : 'NO');
console.log('    all four rows identical?    ->', rows.every((r) =>
  r.tests === row.tests && r.pass === row.pass && r.fail === row.fail && r.skipped === row.skipped));

// --- 5. Retirement condition: does the citation rule still select the cited run?
const base = (readme.match(/\b([0-9a-f]{7,40})\b(?=[^\n]*retire)/i) || [])[1];
console.log('\n[5] content identity vs cited base 7e50d6f:');
const diff = git(ROOT, ['diff', '--stat', '7e50d6f..HEAD', '--', 'src', 'bin', 'test', '.github']).trim();
console.log('    git diff 7e50d6f..HEAD -- src bin test .github ->', diff === '' ? 'EMPTY (rule still selects cited run)' : diff);

// --- 6. The tool's own verdict + exit code.
const t = spawnSync('node', ['tools/matrix-adjudication.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
console.log('\n[6] tool exit code:', t.status, '(0=CORRECT-AS-CITED, 1=STALE, 2=UNDECIDABLE, 3=parse fail)');
console.log('    verdict line:', (t.stdout.match(/^.*VERDICT.*$/mi) || ['(none found)'])[0].trim());

// --- 7. FALSIFIABILITY: perturb a row; the tool must reach STALE, not rubber-stamp.
const PERT = WORK + '/pert';
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, PERT]);
{
  const p = PERT + '/README.md';
  const src = readFileSync(p, 'utf8');
  const out = src.replace(/(\|\s*v18\.20\.8\s*\|\s*129\s*\|\s*)127(\s*\|)/, '$1126$2');
  if (out === src) throw new Error('perturbation anchor not found');
  writeFileSync(p, out);
}
// copy the tool in (clone is at HEAD, tool is untracked)
execFileSync('cp', [ROOT + '/tools/matrix-adjudication.mjs', PERT + '/tools/matrix-adjudication.mjs']);
const tp = spawnSync('node', ['tools/matrix-adjudication.mjs'], { cwd: PERT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
console.log('\n[7] falsified row 127->126, tool exit:', tp.status, tp.status === 1 ? '(STALE — tool is failable)' : '(NOT STALE — tool may be rubber-stamping)');
console.log('    verdict line:', (tp.stdout.match(/^.*VERDICT.*$/mi) || ['(none found)'])[0].trim());

// --- 8. README untouched in the real working tree?
console.log('\n[8] README.md dirty in working tree? ->',
  git(ROOT, ['status', '--porcelain', '--', 'README.md']).trim() || 'NO — untouched');

rmSync(WORK, { recursive: true, force: true });
console.log('\ngate scratch removed.');
