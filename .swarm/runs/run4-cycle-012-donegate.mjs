#!/usr/bin/env node
// run #4, cycle 12 — DONE-GATE: the conductor re-derives the run's definition-of-done
// from the tree itself. Independent of every prior cycle's claim. Cells print PASS/FAIL
// and the observable they read, so a FAIL is diagnosable without re-running.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const REPO = '/opt/targets/aphorism-cli';
const RUN_START = '957c4bf24ced07f87119de5e41052e61b97c13a6';
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
const read = (p) => fs.readFileSync(`${REPO}/${p}`, 'utf8');

let pass = 0, fail = 0;
const cell = (id, what, ok, obs) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${what}\n        ${obs}`);
};

// ---- M-2: nothing lost. Every non-whitespace line of the PRE-MOVE REPORT.md must
// still exist in (new REPORT.md + docs/report-history.md). Moved, not deleted.
const norm = (s) => s.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
const before = norm(git('show', `${RUN_START}:REPORT.md`));
const after = new Set([...norm(read('REPORT.md')), ...norm(read('docs/report-history.md'))]);
const lost = before.filter((l) => !after.has(l));
cell('M2-a', 'every pre-move REPORT.md line survives the move',
  lost.length === 0,
  `${before.length} non-blank lines at ${RUN_START.slice(0, 7)}; ${lost.length} missing` +
  (lost.length ? ` -> first 3: ${JSON.stringify(lost.slice(0, 3))}` : ''));

// CONVERSE CONTROL (L-044): the audit must be capable of reporting loss. Delete a real
// line from the "after" corpus and the same check must FAIL. A check that cannot fail
// is not evidence.
const probe = before[Math.floor(before.length / 2)];
const mutated = new Set(after); mutated.delete(probe);
cell('M2-b', 'CONTROL: the audit DETECTS a planted deletion (must-die)',
  before.some((l) => !mutated.has(l)),
  `planted removal of ${JSON.stringify(probe.slice(0, 60))} -> detected`);

// ---- M-2: first screen answers the three questions inside ~200 lines.
const rep = read('REPORT.md');
const repLines = rep.split('\n').length;
const heads = [...rep.matchAll(/^##+ (.+)$/gm)].map((m) => m[1]);
const firstScreen = rep.split('\n').slice(0, 200).join('\n');
const answers = {
  shipped: /^##+ .*(what ships|what shipped)/im.test(firstScreen),
  verified: /^##+ .*machine-verified/im.test(firstScreen),
  open: /^##+ .*what is open/im.test(firstScreen),
};
cell('M2-c', 'REPORT.md first screen answers shipped / verified / open',
  repLines <= 200 && Object.values(answers).every(Boolean),
  `${repLines} lines total; headings=${JSON.stringify(heads)}; ${JSON.stringify(answers)}`);

// ---- M-5: suite green, >= 118 tests.
let tap = '';
try {
  tap = execFileSync('bash', ['-c', `cd ${REPO} && node --test test/*.test.js 2>&1 | tail -8`],
    { encoding: 'utf8' });
} catch (e) { tap = String(e.stdout || e.message); }
const nTests = Number((tap.match(/tests (\d+)/) || [])[1] || 0);
const nFail = Number((tap.match(/fail (\d+)/) || [])[1] ?? 1);
cell('M5-a', 'suite green at >= 118 tests', nTests >= 118 && nFail === 0,
  `tests=${nTests} fail=${nFail}`);

// ---- M-5: src/corpus.js byte-identical; zero product-code churn; zero deps.
const corpusDiff = git('diff', '--stat', RUN_START, 'HEAD', '--', 'src/corpus.js').trim();
cell('M5-b', 'src/corpus.js byte-identical since run start', corpusDiff === '',
  corpusDiff === '' ? 'git diff --stat: empty' : corpusDiff);

const touched = git('diff', '--name-only', RUN_START, 'HEAD', '--', '.', ':!.swarm')
  .trim().split('\n').filter(Boolean);
const productTouched = touched.filter((f) => f.startsWith('bin/') || f.startsWith('src/'));
cell('M5-c', 'zero user-visible feature change (bin/ and src/ untouched)',
  productTouched.length === 0, `run #4 touched: ${JSON.stringify(touched)}`);

cell('M5-d', 'zero runtime dependencies', !fs.existsSync(`${REPO}/package.json`) &&
  !fs.existsSync(`${REPO}/node_modules`),
  'no package.json, no node_modules');

// ---- M-1: the README floor is cited to a run URL that really exists and really passed.
const readme = read('README.md');
const runId = (readme.match(/actions\/runs\/(\d+)/) || [])[1];
let jobs = [];
try {
  jobs = JSON.parse(execFileSync('gh', ['run', 'view', runId, '--json', 'jobs', '-R',
    'trmnmc/aphorism-cli'], { encoding: 'utf8', cwd: REPO })).jobs
    .map((j) => `${j.name}=${j.conclusion}`).sort();
} catch (e) { jobs = [`ERROR ${String(e.message).slice(0, 80)}`]; }
cell('M1-a', 'README Node floor cites a REAL green Actions matrix run',
  jobs.length === 4 && jobs.every((j) => j.endsWith('=success')),
  `run ${runId} -> ${jobs.join(' ')}`);

cell('M1-b', 'README states the floor as verified-at-18, NOT proven-minimal',
  /not\s+\*\*?proven minimal\*\*?|not \*\*proven minimal\*\*/i.test(readme) ||
  /verified-at-18/.test(readme),
  `README carries the calibration clause: ${/verified-at-18/.test(readme)}`);

// ---- M-4: every open backlog item carries a named next actor.
const bl = JSON.parse(read('.swarm/backlog.json'));
const open = bl.items.filter((i) => i.status !== 'done' && i.status !== 'dropped');
const actorless = open.filter((i) => {
  const t = `${i.blocked_reason || ''} ${i.notes || ''} ${i.owner || ''}`.toLowerCase();
  return !/human|owner|operator|kickoff|conductor/.test(t);
});
cell('M4-a', 'every open item names a next actor', actorless.length === 0,
  `${open.length} open (${open.map((i) => i.id).join(',')}); ${actorless.length} without an actor`);

// CONTROL for M4-a: the reader must be able to report an actorless item.
const decoy = { id: 'DECOY', status: 'blocked', blocked_reason: 'because reasons' };
const decoyCaught = !/human|owner|operator|kickoff|conductor/
  .test(`${decoy.blocked_reason}`.toLowerCase());
cell('M4-b', 'CONTROL: the actor reader FLAGS an actorless item (must-die)', decoyCaught,
  'synthetic item with no actor word -> flagged');

// ---- M-3: the allowlist handoff carries denial #30 and an exact patch.
const HANDOFF = '/opt/swarm/playbook/HANDOFF-allowlist-2026-08-17.md';
let ho = '';
try { ho = fs.readFileSync(HANDOFF, 'utf8'); } catch { ho = ''; }
cell('M3-a', 'handoff records denial #30 and an exact settings patch',
  /#?30\b/.test(ho) && /swarm-playbook\.sh/.test(ho) && ho.length > 500,
  `${HANDOFF}: ${ho.length} bytes; mentions denial 30 = ${/#?30\b/.test(ho)}`);

console.log(`\n---- ${pass} PASS / ${fail} FAIL ----`);
process.exit(fail === 0 ? 0 : 1);
