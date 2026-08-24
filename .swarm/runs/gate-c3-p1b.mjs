// Conductor gate for P-1, part 2 — the two cases the builder did NOT test.
// Part 1 (gate-c3-p1.mjs) confirmed [A] README-side, [B] doc-side, [C] control.
// Fixes the conductor's own cpSync-into-self bug from part 1.
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const WORK = '/opt/targets/aphorism-cli/.swarm/gate-c3p1b';
const TOOL = 'tools/citation-rule-check.mjs';
const OLD = 'the push that carried the last change to';
const NEW = 'the push that carried the change to';

function fresh(name) {
  const d = WORK + '/' + name;
  execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, d]);
  execFileSync('git', ['-C', d, 'config', 'user.email', 'gate@local']);
  execFileSync('git', ['-C', d, 'config', 'user.name', 'gate']);
  execFileSync('cp', [ROOT + '/' + TOOL, d + '/' + TOOL]);
  return d;
}
function run(cwd) {
  const r = spawnSync('node', [TOOL], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return { code: r.status, out: (r.stdout + r.stderr).trim() };
}
const show = (label, r) => {
  console.log('\n' + label);
  console.log('    exit:', r.code);
  console.log('    ' + r.out.split('\n').slice(0, 3).join('\n    ').slice(0, 800));
};

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

// [D] THE FALLBACK the builder reported as "coded but untested":
// a clone with .git removed, so `git show HEAD:<path>` cannot resolve.
{
  const d = fresh('nogit');
  const p = d + '/README.md';
  writeFileSync(p, readFileSync(p, 'utf8').replace(OLD, NEW));
  rmSync(d + '/.git', { recursive: true, force: true });
  show('[D] README reworded, .git REMOVED (fallback — must not guess a side)', run(d));
}

// [E] the README reword is COMMITTED, so HEAD moves with it. Both files now
// match their own HEAD blobs, yet the quote no longer matches README.
{
  const d = fresh('committed');
  const p = d + '/README.md';
  writeFileSync(p, readFileSync(p, 'utf8').replace(OLD, NEW));
  execFileSync('git', ['-C', d, 'commit', '--quiet', '-am', 'gate: commit the README reword']);
  execFileSync('cp', [ROOT + '/' + TOOL, d + '/' + TOOL]);
  show('[E] README reword COMMITTED (HEAD moved; both sides clean vs HEAD)', run(d));
}

// [F] both sides moved at once — must not falsely blame one.
{
  const d = fresh('both');
  const r = d + '/README.md';
  const h = d + '/docs/node-support-citation-history.md';
  writeFileSync(r, readFileSync(r, 'utf8').replace(OLD, NEW));
  writeFileSync(h, readFileSync(h, 'utf8').replace(OLD, 'the push that carried SOMETHING ELSE to'));
  show('[F] BOTH sides reworded (must not blame a single side)', run(d));
}

rmSync(WORK, { recursive: true, force: true });
console.log('\ngate scratch removed.');
