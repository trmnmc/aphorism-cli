#!/usr/bin/env node
// cycle-004 CONDUCTOR CROSS-CHECK — written AFTER the agent returned, deliberately.
// This is not the sealed gate (that is c4-gate.mjs, sha256 263eafb8…). This re-runs the
// agent's three most consequential claims with mutations I plant myself, in a pristine
// tree I build myself, so the verdicts are reproduced rather than believed.
//
//   D-43  NOT-PLANTED  — is the spec really contradictory, or was this an evasion?
//   D-42  SURVIVED     — is the gap real, and does the suite really stay green?
//   D-13  KILLED       — spot-check a claimed kill (tag membership beyond slot 0)
//   D-38  KILLED       — spot-check a claimed kill (usage error routed to stdout)
//
// Every mutation below was authored from the SOURCE, not copied from the agent's rows.

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/opt/targets/aphorism-cli';
const SHA = 'e6c53b1e114a377bed3c6c90b40955bd1d65d493';
const WORK = path.join(ROOT, '.swarm/runs/c4/xcheck');

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
execSync(`git -C ${ROOT} archive ${SHA} | tar -x -C ${WORK}`, { stdio: 'inherit' });

function suite(dir) {
  let out;
  try {
    out = execFileSync('node', ['--test', '--test-reporter=tap',
      'test/args.test.js', 'test/cli.test.js', 'test/readme-tags.test.js', 'test/select.test.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const g = (k) => { const m = out.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? +m[1] : null; };
  const t = g('tests'), p = g('pass'), f = g('fail');
  if (t === null || p === null || f === null) return 'SUITE-UNPARSED';
  return `${p}p/${f}f`;
}

function cli(dir, args) {
  try {
    const out = execFileSync('node', ['bin/aphorism.js', ...args],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out, err: '' };
  } catch (e) { return { code: e.status, out: e.stdout || '', err: e.stderr || '' }; }
}

const snapshot = new Map();
for (const f of ['src/args.js', 'src/select.js', 'bin/aphorism.js'])
  snapshot.set(f, fs.readFileSync(path.join(WORK, f), 'utf8'));
const restore = () => { for (const [f, t] of snapshot) fs.writeFileSync(path.join(WORK, f), t); };
function mutate(file, from, to) {
  const p = path.join(WORK, file);
  const t = fs.readFileSync(p, 'utf8');
  const n = t.split(from).length - 1;
  if (n !== 1) throw new Error(`anchor for ${file} occurs ${n}x, expected exactly 1 — mutation NOT planted`);
  fs.writeFileSync(p, t.replace(from, to));
}

const line = (s) => console.log(s);

// ---------------------------------------------------------------- P0 + INERT controls
line(`P0    pristine archive @ ${SHA.slice(0, 7)}          suite ${suite(WORK)}   (must be 102p/0f)`);
mutate('src/select.js', 'function filter', '/* inert */ function filter');
line(`INERT comment-only edit to src/select.js       suite ${suite(WORK)}   (must be 102p/0f)`);
restore();

// -------------------------------------------------------- D-43: is the spec contradictory?
line('');
line('D-43  --seed "" / "   "  — the NOT-PLANTED claim');
line(`  Number("")    = ${Number('')}      NaN? ${Number.isNaN(Number(''))}`);
line(`  Number("   ") = ${Number('   ')}      NaN? ${Number.isNaN(Number('   '))}`);
for (const a of [['--seed', ''], ['--seed', '   '], ['--seed='], ['--seed=   ']]) {
  const r = cli(WORK, a);
  line(`  pristine ${JSON.stringify(a).padEnd(22)} -> exit ${r.code}  stderr ${JSON.stringify(r.err.trim().slice(0, 60))}`);
}
// Does the suite actually pin the REJECTION? Mutate toward the literal Selection reading
// (accept anything Number() parses non-NaN, i.e. accept "" as seed 0) and see who complains.
mutate('src/args.js',
  'const n = Number(raw);',
  'const n = raw.trim() === "" ? 0 : Number(raw);');
const s43 = suite(WORK);
const r43 = cli(WORK, ['--seed=', '--list']);
line(`  MUTANT (accept "" as seed 0, the literal Selection reading): suite ${s43}, --seed= --list exit ${r43.code}`);
line(`  => the suite ${s43 === '102p/0f' ? 'IGNORES' : 'ENFORCES'} the rejection; spec Selection says accept, spec Exit-codes/impl reject.`);
restore();

// ------------------------------------------------------------ D-42: the SURVIVED gap
line('');
line('D-42  repeated --tag  — the SURVIVED / BOUNDARY claim');
const pristineTag = cli(WORK, ['--tag', 'humor', '--tag', 'design', '--list']);
line(`  pristine  --tag humor --tag design --list -> ${pristineTag.out.trim().split('\n').filter(l => !l.startsWith('    ')).length} entries, first: ${JSON.stringify(pristineTag.out.split('\n')[0].slice(0, 55))}`);
mutate('src/args.js',
  'result[VALUE_FLAGS[arg]] = next;',
  'if (result[VALUE_FLAGS[arg]] === undefined) result[VALUE_FLAGS[arg]] = next;');
const mutTag = cli(WORK, ['--tag', 'humor', '--tag', 'design', '--list']);
const s42 = suite(WORK);
line(`  first-wins --tag humor --tag design --list -> ${mutTag.out.trim().split('\n').filter(l => !l.startsWith('    ')).length} entries, first: ${JSON.stringify(mutTag.out.split('\n')[0].slice(0, 55))}`);
line(`  behaviour changed? ${pristineTag.out !== mutTag.out ? 'YES (non-inert)' : 'NO — mutation is INERT, claim collapses'}`);
line(`  suite against the mutant: ${s42}   => ${s42 === '102p/0f' ? 'SURVIVED confirmed — the suite does not notice' : 'KILLED — the agent was WRONG'}`);
restore();

// --------------------------------------------------------- D-13 / D-38: spot-check kills
line('');
line('Spot-checks of two claimed KILLS (mutations authored from source, not copied):');
mutate('src/select.js', 'entry.tags.some(', 'entry.tags.slice(0, 1).some(');
line(`  D-13 tag membership limited to slot 0        suite ${suite(WORK)}   (claim: KILLED)`);
restore();
mutate('bin/aphorism.js', 'process.stderr.write(`aphorism: ${opts.error}\\n`);', 'process.stdout.write(`aphorism: ${opts.error}\\n`);');
line(`  D-38 usage error routed to stdout            suite ${suite(WORK)}   (claim: KILLED)`);
restore();

line('');
line(`FINAL restore check: tree matches pristine? ${['src/args.js', 'src/select.js', 'bin/aphorism.js'].every(f => fs.readFileSync(path.join(WORK, f), 'utf8') === snapshot.get(f)) ? 'yes' : 'NO'}`);
