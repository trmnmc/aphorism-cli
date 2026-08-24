// Conductor probe: why did [D] still resolve a "git HEAD" after .git was deleted?
// Hypothesis: git walks UP the directory tree and finds the ANCESTOR repo, so a
// non-repo checkout nested inside a repo is silently compared to the wrong HEAD.
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = '/opt/targets/aphorism-cli';
const TOOL = 'tools/citation-rule-check.mjs';
const OLD = 'the push that carried the last change to';
const NEW = 'the push that carried the change to';

// Case 1: nested inside the repo, .git deleted  -> what toplevel does git resolve?
const NEST = ROOT + '/.swarm/gate-c3p1c/nested';
rmSync(ROOT + '/.swarm/gate-c3p1c', { recursive: true, force: true });
mkdirSync(ROOT + '/.swarm/gate-c3p1c', { recursive: true });
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, NEST]);
rmSync(NEST + '/.git', { recursive: true, force: true });
const top = spawnSync('git', ['-C', NEST, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
console.log('[1] nested-no-.git  -> git rev-parse --show-toplevel =', (top.stdout || top.stderr).trim());
console.log('    (if this prints the PARENT repo, the third anchor silently used the wrong repo)');

// Case 2: OUTSIDE any git repo entirely -> the genuine fallback path.
const OUT = tmpdir() + '/gate-c3p1c-outside';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, OUT + '/copy']);
rmSync(OUT + '/copy/.git', { recursive: true, force: true });
const top2 = spawnSync('git', ['-C', OUT + '/copy', 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
console.log('\n[2] outside-any-repo -> git rev-parse --show-toplevel =',
  ((top2.stdout || '') + (top2.stderr || '')).trim().split('\n')[0]);

const p = OUT + '/copy/README.md';
writeFileSync(p, readFileSync(p, 'utf8').replace(OLD, NEW));
execFileSync('cp', [ROOT + '/' + TOOL, OUT + '/copy/' + TOOL]);
const r = spawnSync('node', [TOOL], { cwd: OUT + '/copy', encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
console.log('\n[2b] tool run with NO repo anywhere above it:');
console.log('    exit:', r.status);
console.log('    ' + (r.stdout + r.stderr).trim().split('\n').slice(0, 3).join('\n    ').slice(0, 700));

rmSync(ROOT + '/.swarm/gate-c3p1c', { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
console.log('\nprobe scratch removed.');
