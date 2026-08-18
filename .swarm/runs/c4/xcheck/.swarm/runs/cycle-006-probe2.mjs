// cycle-6 probe, second authoring. My D3 cell was CONFOUNDED and its RED told
// me nothing about the question it asked: it inserted "Nine tags have a robust
// pool (5+ entries)." to test whether an English number WORD escapes the new
// guard -- but the sentence I chose carries the digit "5" in "(5+ entries)",
// and the guard fired on that digit, not on the word "Nine". A cell whose
// observable can be produced by something other than the thing under test is
// not a cell. Re-authored here with the builder's exact disclosed case, which
// contains no digit at all, plus a control proving the instrument can still go
// RED on this tree.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c6probe2-'));
const OPENING = 'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';

const base = path.join(WORK, 'base');
fs.mkdirSync(base);
execFileSync('cp', ['-a', TARGET + '/.', base]);
fs.rmSync(path.join(base, '.git'), { recursive: true, force: true });

function run(dir) {
  const r = spawnSync('bash', ['-c', 'node --test test/*.test.js'], {
    cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const n = re => Number((out.match(re) || [])[1] ?? -1);
  const failed = [...out.matchAll(/^✖ (.+?) \(\d[\d.]*ms\)$/gm)].map(m => m[1].trim());
  return { verdict: r.status === 0 ? 'GREEN' : 'RED', pass: n(/^ℹ pass (\d+)/m), fail: n(/^ℹ fail (\d+)/m), failed };
}

const CELLS = [
  { id: 'D3b', note: 'the builder\'s disclosed word-form case, NO digit anywhere in it',
    para: 'Nine tags sit in the robust-pool band.' },
  { id: 'D3c', note: 'failability control — same sentence, same position, digit form',
    para: '9 tags sit in the robust-pool band.' },
];

console.log('=== cycle-6 probe v2 — word-form gap, de-confounded ===');
for (const c of CELLS) {
  const dir = path.join(WORK, c.id);
  execFileSync('cp', ['-a', base, dir]);
  const p = path.join(dir, 'README.md');
  const orig = fs.readFileSync(p, 'utf8');
  const mutated = orig.replace(OPENING, OPENING + '\n\n' + c.para);
  if (mutated === orig) { console.log(`[${c.id}] UNAPPLIABLE`); continue; }
  console.log(`[${c.id}] inserted: ${JSON.stringify(c.para)}  (digits present: ${/\d/.test(c.para)})`);
  fs.writeFileSync(p, mutated);
  const r = run(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`      ${r.verdict} (${r.pass}/${r.fail}) — ${c.note}`);
  if (r.failed.length) console.log(`      caught by: ${r.failed.map(s => s.slice(0, 100)).join(' | ')}`);
}
fs.rmSync(WORK, { recursive: true, force: true });
