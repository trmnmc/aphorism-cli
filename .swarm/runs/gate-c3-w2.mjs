// Conductor gate for cycle 3, item W-2. Authored at verification time, by the
// conductor, independently of the builder's harness. Kept as committed evidence
// so a skeptic can re-run it.
//
// Question it exists to answer: is "18 CAUGHT / 0 SILENT" a real measurement, or
// an artifact of a suite that fails on ANY edit to README?
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const WORK = ROOT + '/.swarm/gate-c3';
const CLONE = WORK + '/clone';
const BASELINE = '20b7ede';

const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

function suite(cwd) {
  const files = readdirSync(cwd + '/test').filter((f) => f.endsWith('.test.js')).sort()
    .map((f) => 'test/' + f);
  const r = spawnSync('node', ['--test', '--test-reporter=tap', ...files],
    { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout + r.stderr;
  const g = (k) => { const m = out.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? +m[1] : null; };
  const failed = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  const skipped = [...out.matchAll(/^ok \d+ - (.+?) # SKIP/gm)].map((m) => m[1].trim());
  return { tests: g('tests'), pass: g('pass'), fail: g('fail'), skipped: skipped.length, failed, skippedTitles: skipped };
}

function reset() {
  git(CLONE, ['checkout', '--quiet', '--', '.']);
  git(CLONE, ['clean', '--quiet', '-fd']);
  const st = git(CLONE, ['status', '--porcelain']).trim();
  if (st) throw new Error('clone not clean: ' + st);
}

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, CLONE]);
git(CLONE, ['checkout', '--quiet', '--detach', BASELINE]);
console.log('clone HEAD :', git(CLONE, ['rev-parse', 'HEAD']).trim());
console.log('is shallow :', git(CLONE, ['rev-parse', '--is-shallow-repository']).trim());

const README = CLONE + '/README.md';

// [A] untouched baseline must be GREEN, or every CAUGHT verdict is meaningless.
reset();
const a = suite(CLONE);
console.log('\n[A] untouched baseline       ->', a.tests + ' tests, ' + a.pass + ' pass, ' + a.fail + ' fail, ' + a.skipped + ' skipped');
console.log('    git-dependent guards skipped here?', a.skippedTitles.length ? a.skippedTitles : 'none (they ran for real)');

// [B] THE KEY CONTROL. A README edit no guard should read. If this FAILS, the
// suite fails on any README edit and the 18/18 result proves nothing.
reset();
writeFileSync(README, readFileSync(README, 'utf8')
  + '\n<!-- gate-c3 neutral prose control: no digits, no table row, no format literal. -->\n');
const b = suite(CLONE);
console.log('\n[B] neutral README prose     ->', b.tests + ' tests, ' + b.pass + ' pass, ' + b.fail + ' fail');
console.log('    failing guards:', b.failed.length ? b.failed : 'NONE — suite is discriminating, not blanket-failing');

// [C] hand-replicated M06 ("Distinct tags" 12 -> 13), applied by the conductor.
reset();
{
  const src = readFileSync(README, 'utf8');
  const re = /(\|\s*Distinct tags\s*\|\s*)12(\s*\|)/;
  if (!re.test(src)) throw new Error('M06 anchor "Distinct tags | 12" not found');
  writeFileSync(README, src.replace(re, '$1' + '13' + '$2'));
}
const c = suite(CLONE);
console.log('\n[C] M06 Distinct tags 12->13 ->', c.tests + ' tests, ' + c.pass + ' pass, ' + c.fail + ' fail');
console.log('    failing guards:', c.failed);

// [D] a second hand-replicated mutation, M18 ("24 distinct authors" -> 25).
reset();
{
  const src = readFileSync(README, 'utf8');
  if (!/24 distinct authors/.test(src)) throw new Error('M18 anchor "24 distinct authors" not found');
  writeFileSync(README, src.replace('24 distinct authors', '25 distinct authors'));
}
const d = suite(CLONE);
console.log('\n[D] M18 24->25 authors       ->', d.tests + ' tests, ' + d.pass + ' pass, ' + d.fail + ' fail');
console.log('    failing guards:', d.failed);

reset();
console.log('\nclone restored clean:', git(CLONE, ['status', '--porcelain']).trim() === '');
rmSync(WORK, { recursive: true, force: true });
console.log('gate scratch removed.');
