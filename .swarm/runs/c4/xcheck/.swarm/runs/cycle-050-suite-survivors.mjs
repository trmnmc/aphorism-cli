// cycle 50 — does the SHIPPED 80-test suite catch the selection defects the cycle-050
// gate detects? SPEC I-2 admits a new test ONLY for a mutant measured to SURVIVE the
// existing suite, so this is the measurement that would license (or forbid) one.
//
// Method: plant each mutation in a full throwaway copy (bin + src + test) and run the
// project's own test_cmd against it. SURVIVES = the suite stays green on a product that
// is measurably broken at the user-facing surface.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIVE = '/opt/targets/aphorism-cli';
const MUT = [
  { id: 'M1', file: 'src/select.js',
    from: 'index = Math.floor(Math.random() * candidates.length);',
    to: 'index = Math.floor(Math.random() * (candidates.length - 1));',
    desc: 'unseeded off-by-one — the last corpus entry is unreachable forever' },
  { id: 'M3', file: 'src/select.js',
    from: 'index = Math.floor(Math.random() * candidates.length);',
    to: 'index = Math.floor(Math.random() ** 2 * candidates.length);',
    desc: 'unseeded selection heavily biased toward the front of the corpus' },
  { id: 'M5', file: 'src/select.js',
    from: 'return (ints[0] ^ ints[1]) >>> 0;', to: 'return 0;',
    desc: 'every seed folds to one state — --seed stays DETERMINISTIC but reaches ONE entry' },
];

// P0 first: the copy machinery itself must produce a green tree, or every SURVIVES
// verdict below is meaningless.
// The suite is not just unit tests: test/readme-tags.test.js reads README.md and
// docs/ from the tree root. A src+bin+test copy left P0 at 66/14 on an UNMUTATED
// tree — the control caught that before any SURVIVES verdict was drawn from it.
// Copy everything except the git and swarm state directories.
function copyTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aph-c50s-'));
  for (const e of fs.readdirSync(LIVE)) {
    if (e === '.git' || e === '.swarm') continue;
    fs.cpSync(path.join(LIVE, e), path.join(dir, e), { recursive: true });
  }
  return dir;
}
function suite(dir) {
  const files = fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
  const r = spawnSync(process.execPath, ['--test', ...files], { cwd: dir, encoding: 'utf8' });
  const pass = /^. pass (\d+)$/m.exec(r.stdout)?.[1];
  const fail = /^. fail (\d+)$/m.exec(r.stdout)?.[1];
  return { pass: Number(pass), fail: Number(fail), code: r.status };
}

const p0dir = copyTree();
const p0 = suite(p0dir);
fs.rmSync(p0dir, { recursive: true, force: true });
console.log(`P0  unmutated copy — suite ${p0.pass} pass / ${p0.fail} fail  ${p0.fail === 0 && p0.pass > 0 ? 'OK (copy machinery sound)' : 'BROKEN — verdicts below are void'}`);
console.log('');

for (const m of MUT) {
  const dir = copyTree();
  const p = path.join(dir, m.file);
  const src = fs.readFileSync(p, 'utf8');
  const hits = src.split(m.from).length - 1;
  if (hits !== 1) { console.log(`${m.id}  ANCHOR NOT UNIQUE (${hits}) — not planted`); fs.rmSync(dir, { recursive: true, force: true }); continue; }
  fs.writeFileSync(p, src.replace(m.from, m.to));
  const s = suite(dir);
  const survives = s.fail === 0 && s.pass === p0.pass;
  console.log(`${m.id}  ${survives ? 'SURVIVES the suite' : 'killed by the suite'} — ${s.pass} pass / ${s.fail} fail`);
  console.log(`     ${m.desc}`);
  fs.rmSync(dir, { recursive: true, force: true });
}
