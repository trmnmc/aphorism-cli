// Discriminator for gate cell A2. A2 went RED, but the ONLY test that fired was
// "README tag counts must match corpus" — an unrelated tag-name guard — while every band
// guard passed. Question: is the band half blind to a SECOND band table (shape A), with the
// RED coming only from an incidental side effect of my mutation?
//
// A2b removes the side effect: the injected second band table uses tag names ALREADY in the
// README, and states counts that are TRUE for those tags, but parks them under a band
// heading whose numeric range they do not fit. Nothing a tag-name census would notice.
// If A2b is GREEN, the band guards have a silent hole.

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const repo = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join('/opt/swarm/runs', 'a2probe-'));

const cells = {
  // Second band table, existing tag names, TRUE counts, WRONG band ([2,2] cannot hold a
  // tag whose corpus count is 14). A first-match scan never reaches it.
  A2b: (s) => s.replace(
    '\nThe smallest pool holds three aphorisms',
    '\n2 tags appear exactly 2 times:\n| Tag | Count |\n|---|---|\n| `design` | 14 |\n| `humor` | 9 |\n\nThe smallest pool holds three aphorisms'
  ),
  // Control for A2b: the SAME second table, but placed FIRST, before the real 5+ table.
  // If document order is what decides, this one fires and A2b does not.
  A2c: (s) => s.replace(
    '\n7 tags have a robust pool (5+ entries):',
    '\n2 tags appear exactly 2 times:\n| Tag | Count |\n|---|---|\n| `design` | 14 |\n| `humor` | 9 |\n\n7 tags have a robust pool (5+ entries):'
  )
};

for (const [id, mutate] of Object.entries(cells)) {
  const dir = path.join(root, id);
  execSync(`cp -a ${JSON.stringify(repo)} ${JSON.stringify(dir)}`);
  const rp = path.join(dir, 'README.md');
  const before = fs.readFileSync(rp, 'utf8');
  const after = mutate(before);
  if (after === before) { console.log(id, 'NO-OP MUTATION'); continue; }
  fs.writeFileSync(rp, after);
  const r = spawnSync('node --test test/*.test.js', { cwd: dir, encoding: 'utf8', timeout: 300000, shell: true });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = (out.match(/^ℹ pass (\d+)/m) || [0, '?'])[1];
  const fail = (out.match(/^ℹ fail (\d+)/m) || [0, '?'])[1];
  const failed = [...new Set(out.split('\n').filter(l => /^✖/.test(l))
    .map(l => l.replace(/\s*\([\d.]+ms\)\s*$/, '').replace(/^✖\s*/, '')))]
    .filter(t => t !== 'failing tests:');
  console.log(`${id}: ${pass}/${fail} ${fail === '0' ? 'GREEN' : 'RED'}`);
  for (const f of failed) console.log('    fired: ' + f.slice(0, 110));
  fs.writeFileSync(path.join(root, id + '.out'), out);
}
console.log('transcripts: ' + root);
