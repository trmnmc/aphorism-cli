// Conductor gate for cycle 3, item P-1. Authored at verification time.
// Acceptance: a README-side reword must name README as the side that moved; the
// doc-side reword must still name the history doc; honest text must exit 0.
// The conductor adds two cases the builder did NOT test:
//   [D] git/HEAD unavailable  -- the builder called this "coded but untested"
//   [E] the README change is COMMITTED, so HEAD moves under the tool's third anchor
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';

const ROOT = '/opt/targets/aphorism-cli';
const WORK = ROOT + '/.swarm/gate-c3p1';
const TOOL = 'tools/citation-rule-check.mjs';

const REDME_OLD = 'the push that carried the last change to';
const REDME_NEW = 'the push that carried the change to';

function fresh(name) {
  const d = WORK + '/' + name;
  execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, d]);
  execFileSync('git', ['-C', d, 'config', 'user.email', 'gate@local']);
  execFileSync('git', ['-C', d, 'config', 'user.name', 'gate']);
  cpSync(ROOT + '/' + TOOL, d + '/' + TOOL);            // working-tree version under test
  return d;
}
function run(cwd) {
  const r = spawnSync('node', [TOOL], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return { code: r.status, out: (r.stdout + r.stderr).trim() };
}
const show = (label, r) => {
  console.log('\n' + label);
  console.log('    exit:', r.code);
  console.log('    ' + r.out.split('\n').slice(0, 4).join('\n    ').slice(0, 700));
};

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

// [C] converse control -- nothing perturbed, must exit 0.
show('[C] CONTROL: neither file perturbed (must exit 0)', run(fresh('control')));

// [A] README-side reword, doc untouched -> must name README.md.
{
  const d = fresh('readme-side');
  const p = d + '/README.md';
  const s = readFileSync(p, 'utf8');
  if (!s.includes(REDME_OLD)) throw new Error('README anchor not found');
  writeFileSync(p, s.replace(REDME_OLD, REDME_NEW));
  show('[A] README reworded, doc untouched (must blame README.md)', run(d));
}

// [B] doc-side reword, README untouched -> must still name the history doc.
{
  const d = fresh('doc-side');
  const p = d + '/docs/node-support-citation-history.md';
  const s = readFileSync(p, 'utf8');
  if (!s.includes(REDME_OLD)) throw new Error('doc quote anchor not found');
  writeFileSync(p, s.replace(REDME_OLD, REDME_NEW));
  show('[B] doc reworded, README untouched (must blame the history doc)', run(d));
}

// [D] THE UNTESTED FALLBACK: no git repo at all, so `git show HEAD:` cannot work.
{
  const d = WORK + '/nogit';
  cpSync(ROOT, d, { recursive: true, filter: (s) => !s.includes('/.git') && !s.includes('/.swarm') });
  const p = d + '/README.md';
  writeFileSync(p, readFileSync(p, 'utf8').replace(REDME_OLD, REDME_NEW));
  show('[D] README reworded, NO .git present (fallback path — builder never exercised this)', run(d));
}

// [E] README change COMMITTED, so HEAD moves with it. Both files now match their
// own HEAD blobs, yet the quote no longer matches. Does the tool still tell the truth?
{
  const d = fresh('committed');
  const p = d + '/README.md';
  writeFileSync(p, readFileSync(p, 'utf8').replace(REDME_OLD, REDME_NEW));
  execFileSync('git', ['-C', d, 'commit', '--quiet', '-am', 'gate: commit the README reword']);
  cpSync(ROOT + '/' + TOOL, d + '/' + TOOL);
  show('[E] README reword COMMITTED (HEAD moved; both sides clean vs HEAD)', run(d));
}

rmSync(WORK, { recursive: true, force: true });
console.log('\ngate scratch removed.');
