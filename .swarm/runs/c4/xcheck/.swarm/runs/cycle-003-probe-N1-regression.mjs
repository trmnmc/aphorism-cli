// Is gate cell N1 a REGRESSION introduced by J-2b, or a hole that pre-dates it?
//
// N1: the Tag vocabulary section carries a stray prose line stating a FALSE band count
// ("9 tags have a robust pool (5+ entries):" when the table has 7 rows). Against the merged
// tree it is GREEN — unread. The acceptance for J-2b forbids a removal that "drops coverage
// of a wrong-README behaviour a mutation can still reach", so the verdict turns entirely on
// whether the PRE-DISPATCH suite caught this same wrong-README behaviour.
//
// Pre-dispatch commit: caa3292 ("cycle 2: J-2a ..."). Checked out clean into a throwaway.
// Two arms, because the old document stated its band count IN the heading and the new one
// does not state it at all — so "the same behaviour" has to be posed twice:
//   OLD-A: the real heading's own count is falsified (7 -> 9). This is v1 cell T4.
//   OLD-B: a stray EXTRA prose line carrying a false count, heading left correct — the
//          nearest old-tree analogue of what N1 does to the new tree.
// If OLD-B is RED, J-2b dropped coverage and the item fails the gate. If OLD-B is GREEN,
// the hole pre-dates J-2b and is a BOUNDARY to file, not a regression to charge to it.

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const repo = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join('/opt/swarm/runs', 'n1probe-'));
const base = path.join(root, 'pre-dispatch');

execSync(`git -C ${repo} worktree add --detach ${JSON.stringify(base)} caa3292`, { stdio: 'pipe' });

const OLD_H1 = '7 tags have a robust pool (5+ entries):';

const arms = {
  'OLD-P0': (s) => s,
  'OLD-A': (s) => s.replace(OLD_H1, '9 tags have a robust pool (5+ entries):'),
  'OLD-B': (s) => s.replace('\n' + OLD_H1, '\n9 tags have a robust pool (5+ entries):\n' + OLD_H1)
};

for (const [id, mutate] of Object.entries(arms)) {
  const dir = path.join(root, id);
  execSync(`cp -a ${JSON.stringify(base)} ${JSON.stringify(dir)}`);
  const rp = path.join(dir, 'README.md');
  const before = fs.readFileSync(rp, 'utf8');
  const after = mutate(before);
  if (id !== 'OLD-P0' && after === before) { console.log(id + ': NO-OP MUTATION — needle absent'); continue; }
  fs.writeFileSync(rp, after);
  const r = spawnSync('node --test test/*.test.js', { cwd: dir, encoding: 'utf8', timeout: 300000, shell: true });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = (out.match(/^ℹ pass (\d+)/m) || [0, '?'])[1];
  const fail = (out.match(/^ℹ fail (\d+)/m) || [0, '?'])[1];
  const fired = [...new Set(out.split('\n').filter(l => /^✖/.test(l))
    .map(l => l.replace(/\s*\([\d.]+ms\)\s*$/, '').replace(/^✖\s*/, '')))].filter(t => t !== 'failing tests:');
  console.log(`${id}: ${pass}/${fail} ${fail === '0' ? 'GREEN' : 'RED'}`);
  for (const f of fired) console.log('    fired: ' + f.slice(0, 100));
  fs.writeFileSync(path.join(root, id + '.out'), out);
}

execSync(`git -C ${repo} worktree remove --force ${JSON.stringify(base)}`, { stdio: 'pipe' });
console.log('transcripts: ' + root);
