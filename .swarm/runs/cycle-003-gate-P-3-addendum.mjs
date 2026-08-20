#!/usr/bin/env node
// cycle-3 gate ADDENDUM — item P-3.
//
// The sealed gate (c003-gate-P-3.mjs, sha256 d94a42e6…) is left BYTE-UNEDITED: editing a
// gate after it has run destroys the evidence of what it measured (cycle-4 / cycle-12
// precedent). This addendum adds the cell the audit proved was missing, and is scored
// separately.
//
// G12 mechanises README §Node support's OWN stated retirement condition. The audit's one
// real finding was that this self-dating claim had gone stale — the `git diff` the README
// names as its falsifier had stopped being empty, and the citation stayed put anyway. The
// claim was checkable all along; nothing was checking it.
//
// Why this is not a repo test: the CI checkout is `--depth=1`, so a shallow clone cannot
// resolve the base commit and the cell would fail for the wrong reason on all four Node
// versions. It is a conductor-side check by construction.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const T = '/opt/targets/aphorism-cli';
const mutate = process.argv.includes('--mutate') ? process.argv[process.argv.indexOf('--mutate') + 1] : null;
const results = [];
function cell(id, what, fn) {
  let pass, detail;
  try { const r = fn(); pass = r.pass; detail = r.detail; }
  catch (e) { pass = false; detail = 'THREW: ' + (e && e.message); }
  results.push({ id, what, pass, detail });
}
const read = (p) => fs.readFileSync(path.join(T, p), 'utf8');
const git = (...a) => execFileSync('git', a, { cwd: T, encoding: 'utf8' });

cell('G12', "README §Node support's own named falsifier does not fire: the git diff it cites is empty, and the run it cites really reported the counts in its table", () => {
  const txt = read('README.md');

  // 1. parse the self-guard command straight out of the prose — the doc owns this string
  const m = txt.match(/`git diff ([0-9a-f]{7,40})\.\.HEAD -- ([^`]+)`/);
  if (!m) return { pass: false, detail: 'README no longer states a self-guard `git diff <base>..HEAD -- <paths>` command' };
  const base = mutate === 'G12' ? '44702fb' : m[1];
  const paths = m[2].trim().split(/\s+/);
  const diff = git('diff', '--stat', `${base}..HEAD`, '--', ...paths).trim();

  // 2. the cited Actions run id and commit must be the SAME ones the guard is anchored to
  const runId = txt.match(/actions\/runs\/(\d+)\)/)?.[1];
  const asOf = txt.match(/As of commit `([0-9a-f]{7,40})`/)?.[1];

  // 3. the table's counts must match the archived log of THAT run, per Node version
  const logPath = `.swarm/runs/cycle-002-ci-${runId}.log`;
  let counts = null, logOk = fs.existsSync(path.join(T, logPath));
  if (logOk) {
    const log = read(logPath);
    counts = {};
    for (const mm of log.matchAll(/^test \((\d+)\)\tRun node --test test\/\*\.test\.js\t\S+ [#ℹ] (tests|pass|fail) (\d+)$/gm)) {
      (counts[mm[1]] ||= {})[mm[2]] = +mm[3];
    }
  }
  const rows = [...txt.matchAll(/^\| v(\d+)\.[\d.]+ \| (\d+) tests, (\d+) pass, (\d+) fail \|$/gm)]
    .map((r) => ({ major: r[1], tests: +r[2], pass: +r[3], fail: +r[4] }));
  const mismatched = counts ? rows.filter((r) => {
    const c = counts[r.major];
    return !c || c.tests !== r.tests || c.pass !== r.pass || c.fail !== r.fail;
  }).map((r) => `v${r.major}: README ${r.tests}/${r.pass}/${r.fail}, log ${JSON.stringify(counts[r.major])}`) : [];

  const guardEmpty = diff === '';
  const anchored = asOf === base;
  return {
    pass: guardEmpty && anchored && logOk && rows.length === 4 && mismatched.length === 0,
    detail: `self-guard \`git diff ${base}..HEAD -- ${paths.join(' ')}\` => ${guardEmpty ? 'EMPTY (claim still current)' : 'NON-EMPTY (claim is STALE):\n        ' + diff.split('\n').join('\n        ')}`
      + `\n        cited run ${runId}, "as of commit" ${asOf}, guard base ${base}, anchored: ${anchored}`
      + `\n        archived log ${logPath}: ${logOk ? 'present' : 'MISSING'}; ${rows.length} table rows, ${mismatched.length} disagree with the log`
      + (mismatched.length ? '\n        ' + mismatched.join('\n        ') : ''),
  };
});

const P = results.filter((r) => r.pass).length;
console.log(`\ncycle-3 gate ADDENDUM — item P-3   ${P} PASS / ${results.length - P} FAIL` + (mutate ? `   [MUTATION ${mutate} ACTIVE]` : ''));
console.log('='.repeat(78));
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.what}`);
  console.log(`        ${r.detail}`);
}
if (mutate) {
  const c = results.find((r) => r.id === mutate);
  const ok = c && !c.pass;
  console.log(`\nFAILABILITY CONTROL: mutation ${mutate} => ${ok ? 'CONTROL PASSED (cell can fail)' : 'CONTROL FAILED (cell is vacuous)'}`);
  process.exit(ok ? 0 : 1);
}
process.exit(results.every((r) => r.pass) ? 0 : 1);
