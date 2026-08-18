// GATE for J-3 — run against the criteria recorded in c066-gate-J-3-criteria.md BEFORE the
// builder returned. Every mutant here is authored by me from the source, not copied from the
// builder's harness, and every verdict is measured in my own throwaway copies.
//
// Two arms per mutant, because "this test closes a hole" is two claims, not one:
//   MERGED  (working tree, both builders' work) — the test must KILL the mutant.
//   PRE     (caa3292, pre-dispatch)             — the mutant must have SURVIVED.
// A mutant that is RED in both arms was already covered, so a test added for it is padding,
// not protection. A mutant GREEN in both means the claimed fix does not work.
//
// Each mutant also carries a WITNESS I run myself at the user-facing surface: without one, a
// SURVIVED verdict cannot be told apart from a no-op mutation.

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const repo = '/opt/targets/aphorism-cli';
const root = fs.mkdtempSync(path.join('/opt/swarm/runs', 'j3-gate-'));
const preBase = path.join(root, '_pre');
execSync(`git -C ${repo} worktree add --detach ${JSON.stringify(preBase)} caa3292`, { stdio: 'pipe' });

const need = (s, n) => { if (!s.includes(n)) throw new Error('NEEDLE ABSENT: ' + n.slice(0, 60)); return s; };

const EMPTY_BLOCK =
  '  if (candidates.length === 0) {\n' +
  "    process.stderr.write('aphorism: no aphorism matches those filters\\n');\n" +
  '    return EXIT_NO_MATCH;\n' +
  '  }\n\n';
const LIST_TAIL = '    process.stdout.write(`${body}\\n`);\n    return EXIT_OK;\n  }\n';

const mutants = [
  {
    id: 'D1-FMT', file: 'bin/aphorism.js',
    expectPre: 'GREEN', expectMerged: 'RED',
    what: 'format() collapses the two-line plain output into --list\'s one-line shape',
    mutate: (s) => need(s, '${entry.text}\\n    — ${entry.author}')
      .replace('${entry.text}\\n    — ${entry.author}', '${entry.text} — ${entry.author}'),
    witness: (dir) => {
      const r = spawnSync('node', ['bin/aphorism.js', '--seed', '1'], { cwd: dir, encoding: 'utf8' });
      return { probe: 'node bin/aphorism.js --seed 1 | has "\\n    — "', value: /\n {4}— /.test(r.stdout) };
    },
    witnessPristine: true, witnessMutant: false
  },
  {
    id: 'D2-SEED0', file: 'bin/aphorism.js',
    expectPre: 'RED', expectMerged: 'RED',
    what: 'the classic falsy-zero trap: pick(candidates, opts.seed || undefined)',
    mutate: (s) => need(s, 'pick(candidates, opts.seed)').replace('pick(candidates, opts.seed)', 'pick(candidates, opts.seed || undefined)'),
    witness: (dir) => {
      const seen = new Set();
      for (let i = 0; i < 10; i++) {
        const r = spawnSync('node', ['bin/aphorism.js', '--seed', '0'], { cwd: dir, encoding: 'utf8' });
        seen.add(r.stdout);
      }
      return { probe: '10x `--seed 0` in separate processes -> distinct outputs === 1', value: seen.size === 1 };
    },
    witnessPristine: true, witnessMutant: false
  },
  {
    id: 'D3-SEEDINF', file: 'src/args.js',
    expectPre: 'GREEN', expectMerged: 'RED',
    what: 'parseSeedValue rejects non-finite seeds, so the CLI string "Infinity" becomes a usage error',
    mutate: (s) => need(s, 'if (Number.isNaN(n)) return { ok: false };')
      .replace('if (Number.isNaN(n)) return { ok: false };', 'if (Number.isNaN(n) || !Number.isFinite(n)) return { ok: false };'),
    witness: (dir) => {
      const a = spawnSync('node', ['bin/aphorism.js', '--seed', 'Infinity'], { cwd: dir, encoding: 'utf8' });
      const b = spawnSync('node', ['bin/aphorism.js', '--seed', '-Infinity'], { cwd: dir, encoding: 'utf8' });
      return { probe: '--seed Infinity and --seed -Infinity both exit 0', value: a.status === 0 && b.status === 0 };
    },
    witnessPristine: true, witnessMutant: false
  },
  {
    id: 'D4-EMPTYLIST', file: 'bin/aphorism.js',
    expectPre: 'GREEN', expectMerged: 'RED',
    what: 'the empty-candidates check is reordered to run AFTER the --list branch',
    mutate: (s) => need(need(s, EMPTY_BLOCK), LIST_TAIL).replace(EMPTY_BLOCK, '').replace(LIST_TAIL, LIST_TAIL + '\n' + EMPTY_BLOCK),
    witness: (dir) => {
      const r = spawnSync('node', ['bin/aphorism.js', '--list', '--author', 'zzzznobody-said-this-ever'], { cwd: dir, encoding: 'utf8' });
      return { probe: '--list with a filter matching nothing exits 1 with empty stdout', value: r.status === 1 && r.stdout === '' };
    },
    witnessPristine: true, witnessMutant: false
  }
];

const runSuite = (dir) => {
  const r = spawnSync('node --test test/*.test.js', { cwd: dir, encoding: 'utf8', timeout: 300000, shell: true });
  const out = (r.stdout || '') + (r.stderr || '');
  const pass = Number((out.match(/^ℹ pass (\d+)/m) || [0, -1])[1]);
  const fail = Number((out.match(/^ℹ fail (\d+)/m) || [0, -1])[1]);
  const fired = [...new Set(out.split('\n').filter(l => /^✖/.test(l))
    .map(l => l.replace(/\s*\([\d.]+ms\)\s*$/, '').replace(/^✖\s*/, '')))].filter(t => t !== 'failing tests:');
  return { verdict: (r.status === 0 && fail === 0) ? 'GREEN' : 'RED', pass, fail, fired, out };
};

// P0 controls first. If either is not green, nothing below is evidence.
for (const [label, src] of [['P0-MERGED', repo], ['P0-PRE', preBase]]) {
  const d = path.join(root, label);
  execSync(`cp -a ${JSON.stringify(src)} ${JSON.stringify(d)}`);
  const r = runSuite(d);
  console.log(`${label.padEnd(11)} ${r.verdict} ${r.pass}/${r.fail}`);
  if (r.verdict !== 'GREEN') { console.log('  CONTROL FAILED — gate aborted'); process.exit(1); }
}

console.log('');
const results = [];
for (const m of mutants) {
  const row = { id: m.id, what: m.what };
  for (const [arm, src, expect] of [['MERGED', repo, m.expectMerged], ['PRE', preBase, m.expectPre]]) {
    const d = path.join(root, m.id + '-' + arm);
    execSync(`cp -a ${JSON.stringify(src)} ${JSON.stringify(d)}`);
    const fp = path.join(d, m.file);
    fs.writeFileSync(fp, m.mutate(fs.readFileSync(fp, 'utf8')));
    // witness on the MUTANT, and (once) on the pristine copy, both run by me
    const wMut = m.witness(d);
    const wPri = m.witness(path.join(root, arm === 'MERGED' ? 'P0-MERGED' : 'P0-PRE'));
    const witnessOk = wPri.value === m.witnessPristine && wMut.value === m.witnessMutant;
    const r = runSuite(d);
    const ok = r.verdict === expect;
    row[arm] = { verdict: r.verdict, expect, pass: r.pass, fail: r.fail, fired: r.fired, witnessOk, probe: wMut.probe };
    console.log(`${m.id.padEnd(13)} ${arm.padEnd(7)} expect=${expect.padEnd(5)} actual=${r.verdict.padEnd(5)} ${r.pass}/${r.fail}  ` +
                `${ok ? 'OK' : 'GATE-FAIL'}  witness=${witnessOk ? 'REAL' : 'NO-OP/UNCONFIRMED'}`);
    if (arm === 'MERGED') for (const f of r.fired) console.log('                      killed-by: ' + f.slice(0, 92));
    fs.writeFileSync(path.join(root, m.id + '-' + arm + '.out'), r.out);
  }
  results.push(row);
}

console.log('\n--- VERDICTS ---');
for (const r of results) {
  const real = r.PRE.verdict === 'GREEN' && r.MERGED.verdict === 'RED';
  const padding = r.PRE.verdict === 'RED' && r.MERGED.verdict === 'RED';
  console.log(`${r.id.padEnd(13)} ${real ? 'HOLE WAS REAL, NOW CLOSED' : padding ? 'ALREADY COVERED PRE-DISPATCH' : 'ANOMALY — read transcripts'}` +
              `  witness ${r.MERGED.witnessOk && r.PRE.witnessOk ? 'confirmed both arms' : 'NOT confirmed'}`);
}
execSync(`git -C ${repo} worktree remove --force ${JSON.stringify(preBase)}`, { stdio: 'pipe' });
fs.writeFileSync(path.join(root, 'results.json'), JSON.stringify(results, null, 2));
console.log('transcripts: ' + root);
