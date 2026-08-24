#!/usr/bin/env node
// CONDUCTOR VERIFICATION GATE — cycle 4, item W-11 (close the citation window).
// Authored at verification time, outside the target tree. The builder never saw it.
//
// Eight cells. The ones that carry the weight:
//   C4  the citation-rule check is FAILABLE — a checker that cannot go red proves nothing
//   C6  the history doc's promise ("nothing below has been altered") survived the edit
//   C7  the cited run id is re-queried FROM THE ACTIONS API by the conductor, not taken
//       from the builder's prose. A citation whose run id was typed from memory is exactly
//       the failure this whole section exists to prevent.
//   C8  the matrix table's numbers are re-read from that run's OWN logs, not from C7's
//       metadata and not from the builder.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const TARGET = '/opt/targets/aphorism-cli';
const WINDOW_BASE = '02f4668';
const EXPECT_RUN = '32742357417';
const EXPECT_HEADSHA = '02f4668b70658d9d06ee562034e47bcd9ade55c5';
const CITATION_GUARDS = [
  'README Node support citation: cited git diff must be empty (or the check must skip on a missing precondition)',
  'README Node support citation: base-to-working-tree diff must also be empty, so an uncommitted falsification is visible now (or the check must skip on a missing precondition)',
];

const results = [];
function cell(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`\n[${pass ? 'PASS' : 'FAIL'}] ${name}`);
  console.log(String(detail).split('\n').map((l) => '    ' + l).join('\n'));
}
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const git = (args, cwd = TARGET) => sh('git', ['-C', cwd, ...args]);

function runSuite(dir) {
  const files = fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
  const r = sh('node', ['--test', '--test-reporter=tap', ...files], { cwd: dir, timeout: 900000 });
  const raw = (r.stdout || '') + (r.stderr || '');
  const failed = new Set([...raw.matchAll(/^not ok \d+ - (.+?)$/gm)].map((m) => m[1].trim()));
  const skipped = new Set([...raw.matchAll(/^ok \d+ - (.+?) # SKIP/gm)].map((m) => m[1].trim()));
  const n = (k) => { const m = raw.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')); return m ? Number(m[1]) : null; };
  return { totals: { tests: n('tests'), pass: n('pass'), fail: n('fail'), skipped: n('skipped') }, failed, skipped, raw };
}
function nodeSupportSection(readmeText) {
  const head = readmeText.indexOf('\n### Node support\n');
  if (head < 0) return null;
  const after = readmeText.slice(head + 1);
  const end = after.indexOf('\n### ', 1);
  return end < 0 ? after : after.slice(0, end);
}

// ---------------------------------------------------------------------------
// C1 — scope: exactly the two doc files moved
// ---------------------------------------------------------------------------
const lines = git(['status', '--porcelain']).stdout.split('\n').filter((l) => l.length > 0);
const entries = lines.map((l) => ({ xy: l.slice(0, 2), p: l.slice(3).split(' -> ').pop() }));
const modified = entries.filter((e) => e.xy !== '??').map((e) => e.p).sort();
const untracked = entries.filter((e) => e.xy === '??').map((e) => e.p);
const EXPECT_FILES = ['README.md', 'docs/node-support-citation-history.md'];
cell(
  'C1 exactly README.md and docs/node-support-citation-history.md moved, nothing inside the cited pathspec',
  JSON.stringify(modified) === JSON.stringify(EXPECT_FILES) && untracked.filter((p) => /\.scratch/.test(p)).length === 0,
  `modified: ${JSON.stringify(modified)}\nexpected: ${JSON.stringify(EXPECT_FILES)}\nuntracked: ${JSON.stringify(untracked)}`
);

// ---------------------------------------------------------------------------
// C2 — the window is actually shut, in both directions the guards check
// ---------------------------------------------------------------------------
const dHead = git(['diff', `${WINDOW_BASE}..HEAD`, '--', 'src', 'bin', 'test', '.github']).stdout;
const dWork = git(['diff', WINDOW_BASE, '--', 'src', 'bin', 'test', '.github']).stdout;
cell(
  'C2 the cited diff is empty against BOTH HEAD and the working tree',
  dHead.trim() === '' && dWork.trim() === '',
  `git diff ${WINDOW_BASE}..HEAD -- src bin test .github  -> ${dHead.trim() === '' ? 'EMPTY' : dHead.length + ' bytes'}\n` +
  `git diff ${WINDOW_BASE} -- src bin test .github        -> ${dWork.trim() === '' ? 'EMPTY' : dWork.length + ' bytes'}`
);

// ---------------------------------------------------------------------------
// C3 — the suite is green AND the two guards RAN. A skip is not a pass.
// ---------------------------------------------------------------------------
const suite = runSuite(TARGET);
fs.writeFileSync('/opt/swarm/runs/c4-w11-suite.txt', suite.raw);
const guardsSkipped = CITATION_GUARDS.filter((g) => suite.skipped.has(g));
const guardsFailed = CITATION_GUARDS.filter((g) => suite.failed.has(g));
cell(
  'C3 suite green at 128/128 and both citation guards RAN rather than skipped',
  suite.totals.fail === 0 && suite.totals.skipped === 0 && guardsSkipped.length === 0 && guardsFailed.length === 0,
  `totals: ${JSON.stringify(suite.totals)}\n` +
  `citation guards that SKIPPED (must be 0 — a skip is not a pass): ${JSON.stringify(guardsSkipped)}\n` +
  `citation guards that FAILED: ${JSON.stringify(guardsFailed)}\n` +
  `full TAP -> /opt/swarm/runs/c4-w11-suite.txt`
);

// ---------------------------------------------------------------------------
// C4 — citation-rule-check passes AND is failable. Converse control included.
// ---------------------------------------------------------------------------
const live = sh('node', ['tools/citation-rule-check.mjs'], { cwd: TARGET });
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'c4-w11-gate-'));
const clone = path.join(scratch, 'clone');
let c4detail = '', c4pass = false;
if (sh('git', ['clone', '--no-hardlinks', '--quiet', TARGET, clone]).status === 0) {
  // carry the uncommitted docs into the clone
  for (const f of EXPECT_FILES) fs.copyFileSync(path.join(TARGET, f), path.join(clone, f));
  sh('git', ['-C', clone, 'add', '-A']);
  sh('git', ['-C', clone, '-c', 'user.email=g@l', '-c', 'user.name=g', 'commit', '--quiet', '-m', 'gate: stage W-11 docs']);
  const ctrl = sh('node', ['tools/citation-rule-check.mjs'], { cwd: clone });
  // FAILABILITY: perturb the README side of the quoted sentence. The checker must go red.
  const rmPath = path.join(clone, 'README.md');
  const rm = fs.readFileSync(rmPath, 'utf8');
  const perturbed = rm.replace('the matrix run for the push that carried the last change to',
                               'the matrix run for the push that carried the latest change to');
  const didPerturb = perturbed !== rm;
  fs.writeFileSync(rmPath, perturbed);
  const broken = sh('node', ['tools/citation-rule-check.mjs'], { cwd: clone });
  fs.writeFileSync(rmPath, rm);
  const restored = sh('node', ['tools/citation-rule-check.mjs'], { cwd: clone });
  c4pass = live.status === 0 && ctrl.status === 0 && didPerturb && broken.status !== 0 && restored.status === 0;
  c4detail =
    `live tree              -> exit ${live.status} ${(live.stdout || live.stderr || '').trim().split('\n')[0] || ''}\n` +
    `clone, unperturbed     -> exit ${ctrl.status} (converse control: must be 0)\n` +
    `perturbation applied   -> ${didPerturb} ("last change" -> "latest change" in README's quoted sentence)\n` +
    `clone, perturbed       -> exit ${broken.status} (FAILABILITY: must be non-zero)\n` +
    `   ${(broken.stderr || broken.stdout || '').trim().split('\n')[0] || ''}\n` +
    `clone, restored        -> exit ${restored.status} (must return to 0)`;
} else {
  c4detail = 'clone failed';
}
cell('C4 tools/citation-rule-check.mjs passes on the live tree AND is shown to be failable', c4pass, c4detail);

// ---------------------------------------------------------------------------
// C5 — the quote block is a substring of README's section. Checked by the CONDUCTOR,
//      independently of the builder's tool, so C4 and C5 cannot fail together silently.
// ---------------------------------------------------------------------------
const readme = fs.readFileSync(path.join(TARGET, 'README.md'), 'utf8');
const hist = fs.readFileSync(path.join(TARGET, 'docs/node-support-citation-history.md'), 'utf8');
const FENCE = '```readme-quote\n';
const open = hist.indexOf(FENCE);
const close = open < 0 ? -1 : hist.indexOf('\n```', open + FENCE.length);
const quote = open >= 0 && close >= 0 ? hist.slice(open + FENCE.length, close) : null;
const section = nodeSupportSection(readme);
cell(
  'C5 the readme-quote block is byte-identical to a substring of README\'s "### Node support" section (conductor-checked)',
  quote !== null && section !== null && section.includes(quote) && quote.includes(EXPECT_RUN),
  `quote block found: ${quote !== null}\nsection found: ${section !== null}\n` +
  `section contains the quote byte-for-byte: ${quote !== null && section !== null ? section.includes(quote) : 'n/a'}\n` +
  `quote names the new run id ${EXPECT_RUN}: ${quote ? quote.includes(EXPECT_RUN) : 'n/a'}\n` +
  `--- quote block ---\n${quote ?? '(none)'}`
);

// ---------------------------------------------------------------------------
// C6 — "Nothing below has been altered": every preserved blockquote line survives
// ---------------------------------------------------------------------------
const histHead = git(['show', 'HEAD:docs/node-support-citation-history.md']).stdout;
const bq = (s) => s.split('\n').filter((l) => l.startsWith('> ') || l === '>');
const bqHead = bq(histHead), bqNow = bq(hist);
const removedBq = bqHead.filter((l) => !bqNow.includes(l));
cell(
  'C6 the file\'s "nothing below has been altered" promise survived: no preserved blockquote line was changed or removed',
  removedBq.length === 0,
  `blockquote lines at HEAD: ${bqHead.length}\nblockquote lines now:     ${bqNow.length}\n` +
  `lines present at HEAD but gone/changed now: ${removedBq.length}\n` +
  removedBq.slice(0, 8).map((l) => '  ' + JSON.stringify(l)).join('\n')
);

// ---------------------------------------------------------------------------
// C7 — the cited run is RE-QUERIED from the Actions API by the conductor.
//      Never take a run id from prose. This is the exact failure the section guards.
// ---------------------------------------------------------------------------
const citedRun = (section || '').match(/actions\/runs\/(\d+)/)?.[1] ?? null;
const citedSha = (section || '').match(/at commit `([0-9a-f]{7,40})`/)?.[1] ?? null;
const api = sh('gh', ['run', 'view', citedRun ?? '0', '--repo', 'trmnmc/aphorism-cli',
  '--json', 'databaseId,headSha,conclusion,status,workflowName']);
let apiObj = null;
try { apiObj = JSON.parse(api.stdout); } catch { /* left null */ }
const c7 =
  citedRun === EXPECT_RUN &&
  apiObj !== null &&
  String(apiObj.databaseId) === EXPECT_RUN &&
  apiObj.conclusion === 'success' &&
  apiObj.status === 'completed' &&
  apiObj.headSha === EXPECT_HEADSHA &&
  citedSha !== null && EXPECT_HEADSHA.startsWith(citedSha);
cell(
  'C7 the run id README cites is a REAL successful run whose headSha is the commit README names (re-queried, not trusted)',
  c7,
  `run id parsed out of README: ${citedRun}\ncommit sha parsed out of README: ${citedSha}\n` +
  `Actions API says: ${JSON.stringify(apiObj)}\n` +
  `cited sha is a prefix of the run's headSha: ${citedSha ? EXPECT_HEADSHA.startsWith(citedSha) : 'n/a'}`
);

// ---------------------------------------------------------------------------
// C8 — the matrix table's four rows match what that run's OWN LOGS reported
// ---------------------------------------------------------------------------
const ciLog = fs.readFileSync('/opt/swarm/runs/c4-ci-log.txt', 'utf8');
const perMajor = {};
for (const m of ciLog.matchAll(/^test \((\d+)\)\t+Run node --test test\/\*\.test\.js\t+\S+ [#ℹ] (tests|pass|fail|skipped) (\d+)$/gm)) {
  (perMajor[m[1]] ??= {})[m[2]] = Number(m[3]);
}
const tableRows = [...(section || '').matchAll(/^\| (v\d+\.\d+\.\d+) \| (\d+) tests, (\d+) pass, (\d+) fail, (\d+) skipped \|$/gm)]
  .map((m) => ({ v: m[1], tests: +m[2], pass: +m[3], fail: +m[4], skipped: +m[5] }));
const majorOf = (v) => v.slice(1).split('.')[0];
const mismatches = tableRows.filter((r) => {
  const l = perMajor[majorOf(r.v)];
  return !l || l.tests !== r.tests || l.pass !== r.pass || l.fail !== r.fail || l.skipped !== r.skipped;
});
cell(
  'C8 every README matrix row matches what run ' + EXPECT_RUN + ' actually printed in its own logs',
  tableRows.length === 4 && mismatches.length === 0,
  `rows parsed from README: ${tableRows.length}\n` +
  `README table: ${JSON.stringify(tableRows)}\n` +
  `run ${EXPECT_RUN} logs: ${JSON.stringify(perMajor)}\n` +
  `mismatched rows: ${JSON.stringify(mismatches)}`
);

fs.rmSync(scratch, { recursive: true, force: true });

console.log('\n================ W-11 GATE VERDICT ================');
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}`);
const allPass = results.every((r) => r.pass);
console.log(`\nW-11: ${allPass ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length} cells)`);
process.exit(allPass ? 0 : 1);
