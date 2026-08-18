// cycle-6 probe v3 — is the duplicate-recognised-shape slip (D1/D2/D4) a
// REGRESSION introduced by J-5, or pre-existing? Charging a builder for a hole
// that predates their change would be dishonest, and so would crediting them
// with one they widened. Same cells, run on arm A (the pre-dispatch tree) as
// well as arm B (live).

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = '/opt/targets/aphorism-cli';
const BASE = '0e5d917';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'c6probe3-'));
const OPENING = 'The corpus contains 12 distinct tags. The distribution is uneven, but every tag is a real pool: 12 tags appear on 2 or more entries. On the other side of that count, 0 tags appear exactly once, which is to say 0 tags sit on exactly one entry, so `--tag` never returns a foregone conclusion.';

function buildArm(name) {
  const dir = path.join(WORK, 'arm' + name);
  fs.mkdirSync(dir);
  if (name === 'A') {
    const tarPath = path.join(WORK, 'a.tar');
    fs.writeFileSync(tarPath, execFileSync('git', ['-C', TARGET, 'archive', BASE], { maxBuffer: 1 << 28 }));
    execFileSync('tar', ['-xf', tarPath, '-C', dir]);
  } else {
    execFileSync('cp', ['-a', TARGET + '/.', dir]);
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
  }
  return dir;
}

function run(dir) {
  const r = spawnSync('bash', ['-c', 'node --test test/*.test.js'], {
    cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const n = re => Number((out.match(re) || [])[1] ?? -1);
  return { verdict: r.status === 0 ? 'GREEN' : 'RED', pass: n(/^ℹ pass (\d+)/m), fail: n(/^ℹ fail (\d+)/m) };
}

const CELLS = [
  { id: 'P0', para: null, what: 'control, unmutated' },
  { id: 'D1', para: '9 tags appear on 2 or more entries.', what: 'FALSE duplicate of the "or more" shape (corpus: 12)' },
  { id: 'D2', para: 'The corpus contains 13 distinct tags.', what: 'FALSE duplicate of the "distinct tags" shape (corpus: 12)' },
  { id: 'D4', para: 'In fact 4 tags sit on exactly one entry.', what: 'FALSE duplicate of the "exactly one" shape (corpus: 0)' },
];

const armA = buildArm('A'), armB = buildArm('B');
console.log('=== cycle-6 probe v3 — duplicate-shape slip: regression or pre-existing? ===');
for (const c of CELLS) {
  const res = {};
  for (const [name, arm] of [['A', armA], ['B', armB]]) {
    const dir = path.join(WORK, c.id + name);
    execFileSync('cp', ['-a', arm, dir]);
    const p = path.join(dir, 'README.md');
    const orig = fs.readFileSync(p, 'utf8');
    if (c.para) {
      const mut = orig.replace(OPENING, OPENING + '\n\n' + c.para);
      if (mut === orig) { res[name] = { verdict: 'UNAPPLIABLE', pass: -1, fail: -1 }; continue; }
      fs.writeFileSync(p, mut);
    }
    res[name] = run(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const same = res.A.verdict === res.B.verdict;
  console.log(`[${c.id}] A(pre-J-5)=${res.A.verdict}(${res.A.pass}/${res.A.fail})  B(post-J-5)=${res.B.verdict}(${res.B.pass}/${res.B.fail})  -> ${same ? 'UNCHANGED by J-5' : 'CHANGED by J-5'}`);
  console.log(`      ${c.what}`);
}
fs.rmSync(WORK, { recursive: true, force: true });
