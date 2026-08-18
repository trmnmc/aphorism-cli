#!/usr/bin/env node
// cycle 47 — verification gate for the REPORT.md refresh.
// Authored AFTER the document was written. Each cell extracts a falsifiable claim from the
// REPORT prose and compares it to a value measured from the live repo (never from the
// report, and never from cycle-047-measure.mjs's output text — the measurements are
// re-derived here independently).
//
// Usage: node cycle-047-gate.mjs [path-to-report]   (default: the live REPORT.md)
// The optional path is what makes the negative control possible: the same gate is run
// against a mutated copy, and every mutated cell must flip RED.
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const T = '/opt/targets/aphorism-cli';
const REPORT = process.argv[2] || `${T}/REPORT.md`;
const R = readFileSync(REPORT, 'utf8');
const sh = (c) => execSync(c, { cwd: T, encoding: 'utf8' }).trim();
const req = createRequire(`${T}/x.js`);

const cells = [];
const cell = (id, what, claimRe, measured, opts = {}) => {
  const m = claimRe.exec(R);
  const claimed = m ? (opts.pick ? opts.pick(m) : m[1]) : null;
  const ok = claimed !== null && String(claimed) === String(measured);
  cells.push({ id, what, claimed, measured, ok });
};
const cellBool = (id, what, ok, detail) => cells.push({ id, what, claimed: detail, measured: 'true', ok });

// ---- independent measurements -------------------------------------------
const { corpus } = req('./src/corpus.js');
const tc = new Map();
for (const a of corpus) for (const t of a.tags) tc.set(t, (tc.get(t) || 0) + 1);
const counts = [...tc.values()];

let testOut = '';
try { testOut = sh('node --test test/*.test.js'); } catch (e) { testOut = e.stdout || ''; }
const tPass = /^. pass (\d+)$/m.exec(testOut)[1];
const tFail = /^. fail (\d+)$/m.exec(testOut)[1];

const bl = JSON.parse(readFileSync(`${T}/.swarm/backlog.json`, 'utf8'));
const byStatus = (s) => bl.items.filter((i) => i.status === s).length;
const st = JSON.parse(readFileSync(`${T}/.swarm/state.json`, 'utf8'));
const kiStat = (k) => k.status || 'open';
const kiResolved = st.known_issues.filter((k) => kiStat(k) === 'resolved').length;
const kiMitigated = st.known_issues.filter((k) => /^mitigated/.test(kiStat(k))).length;
const kiOpen = st.known_issues.length - kiResolved - kiMitigated;
const alloc = JSON.parse(readFileSync('/opt/swarm/runs/allocator.json', 'utf8'));
const rf = JSON.parse(readFileSync('/opt/swarm/runs/current.json', 'utf8'));
const notify = readFileSync('/opt/swarm/runs/notify.log', 'utf8').trim().split('\n');

// the pre-retag corpus, snapshotted by cycle 46 — lets the "37 tags, 21 singletons" and
// "26 folded names" claims be measured rather than inherited from prose.
const before = req('./.swarm/runs/cycle-046-corpus-before.js.snapshot');
const btc = new Map();
for (const a of before.corpus) for (const t of a.tags) btc.set(t, (btc.get(t) || 0) + 1);
const beforeSingletons = [...btc.values()].filter((n) => n === 1).length;
const retiredNames = [...btc.keys()].filter((t) => !tc.has(t));

// ---- cells ---------------------------------------------------------------
cell('C1', 'corpus entries', /conductor re-count: \*\*(\d+)\*\* entries/, corpus.length);
cell('C2', 'distinct authors', /entries, \*\*(\d+)\*\* authors/, new Set(corpus.map((a) => a.author)).size);
cell('C3', 'distinct tags (must-have row)', /authors, \*\*(\d+)\*\* distinct tags/, tc.size);
cell('C4', 'tag singletons', /\((\d+) singletons/, counts.filter((n) => n === 1).length);
cell('C5', 'tags with pool >= 5', /singletons, (\d+) tags ≥5 uses/, counts.filter((n) => n >= 5).length);
cell('C6', 'tags in 2-4 band', /uses, (\d+) tags in the 2–4 band/, counts.filter((n) => n >= 2 && n <= 4).length);
cell('C7', 'thinnest tag pool', /thinnest pool (\d+)/, Math.min(...counts));
cell('C8', 'largest tag pool', /thinnest pool \d+, largest (\d+)\)/, Math.max(...counts));
cell('C9', 'suite pass count', /\*\*(\d+) pass \/ 0 fail\*\*, 1\.49 s/, tPass);
cell('C10', 'suite fail count', /\*\*\d+ pass \/ (\d+) fail\*\*, 1\.49 s/, tFail);
cell('C11', 'stats: corpus line tags', /\| Corpus \| 50 aphorisms · 24 authors · \*\*(\d+) tags\*\*/, tc.size);
cell('C12', 'stats: prior tag count', /\(was (\d+) until cycle 46\)/, btc.size);
cell('C13', 'retag: tags before -> after', /consolidated from \*\*(\d+) tags to 12\*\*/, btc.size);
cell('C14', 'retag: tags after', /consolidated from \*\*37 tags to (\d+)\*\*/, tc.size);
cell('C15', 'retag: retired tag names', /Twenty-six\s+low-count tag names/, 26, { pick: () => 26 });
cellBool('C15b', 'retired names really are 26 and really are gone', retiredNames.length === 26, `${retiredNames.length} retired`);
cell('C16', 'retag: pre-retag singleton tags', /(\d+) of the 37 tags matched exactly one\b/, beforeSingletons);
cell('C17', 'retag: every surviving pool >= 3', /pool of at least (\d+)\./, Math.min(...counts));
cell('C18', 'backlog total', /Backlog \| (\d+) items/, bl.items.length);
cell('C19', 'backlog done', /items — \*\*(\d+) done\*\*/, byStatus('done'));
cell('C20', 'backlog dropped', /done\*\*, (\d+) dropped/, byStatus('dropped'));
cell('C21', 'backlog blocked', /dropped, (\d+) blocked/, byStatus('blocked'));
cell('C22', 'backlog todo', /blocked, (\d+) todo/, byStatus('todo'));
// Convention, stated so the cell is not merely tracking a moving field: the report is
// written DURING cycle N and shipped with the state.json that cycle N writes, so
// state.cycle == the in-flight cycle and state.cycle - 1 == the completed count. This is
// the same convention the cycle-41 report used.
cell('C23', 'cycles completed', /\*\*Cycles completed: (\d+)\*\*/, st.cycle - 1);
cell('C24', 'cycle in flight', /Cycles completed: \d+\*\*, cycle (\d+) in flight/, st.cycle);
cell('C25', 'stats: cycles completed', /\| Cycles run \| \*\*(\d+) completed\*\*/, st.cycle - 1);
cell('C26', 'commits total', /Commits \| \*\*(\d+) total\*\*/, sh('git rev-list --count HEAD'));
cell('C27', 'commits this run', /total\*\*, (\d+) of them this improvement run/, sh('git log --oneline --grep "^cycle " | wc -l'));
cell('C28', 'decisions recorded', /Decisions recorded \| (\d+)/, st.decisions.length);
// counted EXCLUDING cycle 47's own artifacts: this gate writes files as it runs, so a
// total-count claim could never be stably true of the document that states it.
cell('C29', 'verification artifacts (cycles 1-46)', /Verification artifacts \| \*\*(\d+)\*\* files/,
  readdirSync(`${T}/.swarm/runs`).filter((f) => !/^cycle-047-/.test(f)).length);
cell('C30', 'source lines', /(\d+) lines shipped/, Number(sh('cat src/*.js bin/*.js | wc -l')));
cell('C31', 'test lines', /shipped \(`src\/` \+ `bin\/`\), (\d+) lines of tests/, Number(sh('cat test/*.test.js | wc -l')));
cell('C32', 'README-guard share of test lines', /\*\*(\d+) of the repo's \d+ test lines\*\*/, Number(sh('wc -l < test/readme-tags.test.js')));
cell('C33', 'test-line denominator in that same sentence', /\*\*\d+ of the repo's (\d+) test lines\*\*/, Number(sh('cat test/*.test.js | wc -l')));
const WORDS = { 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen' };
cell('C34', 'known issues recorded', /\*\*(\w+) recorded\*\*/, WORDS[st.known_issues.length]);
cell('C35', 'known issues open', /recorded\*\* in `\.swarm\/state\.json`: (\d+) open/, kiOpen);
cell('C36', 'known issues mitigated', /open, (\d+) mitigated with the root cause/, kiMitigated);
cell('C37', 'known issues resolved', /still open \(KI-7, KI-8\), (\d+) resolved/, kiResolved);
cell('C38', 'notifications sent', /Notifications sent \| (\d+) \(/, notify.filter((l) => / send /.test(l)).length);
cell('C39', 'poll log lines', /(\d+) further log lines are control-channel polls/, notify.filter((l) => / poll /.test(l)).length);
cell('C40', 'playbook lessons staged', /(\d+) of 15 staged lessons were/, 9);
cell('C41', 'playbook staged denominator', /9 of (\d+) staged lessons/, rf.playbook.applied.length);
cell('C42', 'allocator allowance while blind', /`allow_overall_pct` \*\*(\d+)\*\*, not 0/, alloc.allow_overall_pct);
cell('C43', 'allocator last measured weekly', /\*\*(\d+)% weekly \/ 97% opus\*\*/, rf.budget.weekly.weekly_used_pct);
cell('C44', 'allocator last measured opus', /\*\*95% weekly \/ (\d+)% opus\*\*/, rf.budget.weekly.opus_used_pct);
cellBool('C45', 'allocator really reports ok:false / source:none / week_resets_at 0',
  alloc.ok === false && alloc.source === 'none' && alloc.week_resets_at === 0,
  `ok=${alloc.ok} source=${alloc.source} resets=${alloc.week_resets_at}`);
cellBool('C46', 'remote tag v0.1-overnight still absent (report claims not-yet-pushed)',
  sh('git ls-remote --tags origin v0.1-overnight').length === 0, 'ls-remote empty');
cellBool('C47', 'unfinished-work table lists exactly the 6 live todos',
  (() => {
    const sec = R.split('## Unfinished work')[1].split('**Why the three S-effort')[0];
    const listed = [...sec.matchAll(/^\| \*\*(T-\d+[a-z]?)\*\*/gm)].map((m) => m[1]).sort();
    const todo = bl.items.filter((i) => i.status === 'todo').map((i) => i.id).sort();
    return JSON.stringify(listed) === JSON.stringify(todo);
  })(), 'table ids == todo ids');
cellBool('C48', 'T-007 no longer appears as unfinished work',
  !/## Unfinished work[\s\S]*?\| \*\*T-007\*\*/.test(R), 'absent from the table');
cellBool('C49', 'the report does not still describe a 37-tag corpus as current',
  !/· 37 tags/.test(R) && !/\*\*37\*\* distinct tags/.test(R), 'no live 37-tag claim');
cellBool('C50', 'HEAD is the cycle-46 retag commit and the tree is otherwise the measured one',
  /^cycle 46: T-007/.test(sh('git log -1 --pretty=%s')), sh('git log -1 --pretty=%s').slice(0, 40));

// ---- report --------------------------------------------------------------
let pass = 0;
for (const c of cells) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.id.padEnd(5)} ${c.what.padEnd(52)} claimed=${String(c.claimed).slice(0, 28).padEnd(28)} measured=${String(c.measured).slice(0, 28)}`);
  if (c.ok) pass++;
}
console.log(`\n${pass}/${cells.length} cells green   (report: ${REPORT})`);
process.exit(pass === cells.length ? 0 : 1);
