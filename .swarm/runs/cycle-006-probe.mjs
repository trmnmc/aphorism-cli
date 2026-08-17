// cycle-6 follow-up probe — NOT part of J-5's verdict. Two questions the gate
// raised that must be answered by measurement rather than by reading the diff:
//
//   (a) Gate cell I1 showed that a TRUE claim wearing a RECOGNISED phrase shape
//       ("2 tags appear on 10 or more entries.") sits in the section and stays
//       green. If the new rule allowlists by SHAPE, then a second claim of a
//       recognised shape is exempted -- and a FALSE one of that shape, placed
//       where it does not steal the existing guard's first-match, would slip.
//       That is the duplicated-label defect this file already documents for the
//       Attribution table, one level up. Measure it; do not infer it.
//
//   (b) The builder disclosed that word-form numbers ("Nine tags ...") are not
//       caught. A self-reported limitation is a claim like any other. Verify it.
//
// Every cell runs the project's own test_cmd in a throwaway copy of the LIVE
// tree. P0 is the control.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c6probe-'));
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
  { id: 'P0', what: 'control — live tree, unmutated', mut: t => t },
  { id: 'D1', truth: 'FALSE (corpus: 12)',
    what: 'DUPLICATE of a recognised shape, false, placed AFTER the opening sentence so it cannot steal first-match: "9 tags appear on 2 or more entries."',
    mut: t => t.replace(OPENING, OPENING + '\n\n9 tags appear on 2 or more entries.') },
  { id: 'D2', truth: 'FALSE (corpus: 12)',
    what: 'DUPLICATE of the distinct-total shape, false: "The corpus contains 13 distinct tags."',
    mut: t => t.replace(OPENING, OPENING + '\n\nThe corpus contains 13 distinct tags.') },
  { id: 'D3', truth: 'FALSE (band table holds 7 rows)',
    what: 'builder-disclosed gap: the SAME false claim spelled in WORDS — "Nine tags have a robust pool (5+ entries)."',
    mut: t => t.replace(OPENING, OPENING + '\n\nNine tags have a robust pool (5+ entries).') },
  { id: 'D4', truth: 'FALSE (corpus: 0)',
    what: 'DUPLICATE of the exactly-one shape, false: "In fact 4 tags sit on exactly one entry."',
    mut: t => t.replace(OPENING, OPENING + '\n\nIn fact 4 tags sit on exactly one entry.') },
];

console.log('=== cycle-6 follow-up probe (residual holes; NOT J-5\'s verdict) ===');
for (const c of CELLS) {
  const dir = path.join(WORK, c.id);
  execFileSync('cp', ['-a', base, dir]);
  const p = path.join(dir, 'README.md');
  const orig = fs.readFileSync(p, 'utf8');
  const mutated = c.mut(orig);
  if (c.id !== 'P0' && mutated === orig) { console.log(`[${c.id}] UNAPPLIABLE — anchor missing`); continue; }
  fs.writeFileSync(p, mutated);
  const r = run(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`[${c.id}] ${r.verdict} (${r.pass}/${r.fail})${c.truth ? '  claim is ' + c.truth : ''}`);
  console.log(`      ${c.what}`);
  if (r.failed.length) console.log(`      caught by: ${r.failed.map(s => s.slice(0, 100)).join(' | ')}`);
}
fs.rmSync(WORK, { recursive: true, force: true });
