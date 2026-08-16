#!/usr/bin/env node
// cycle 47 — conductor measurement harness for the REPORT.md refresh.
// Derives every falsifiable number the report will state, from the live repo.
// Nothing here reads REPORT.md; this is the INDEPENDENT side of the gate.
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const T = '/opt/targets/aphorism-cli';
const sh = (c) => execSync(c, { cwd: T, encoding: 'utf8' }).trim();
const out = {};

// --- corpus ---------------------------------------------------------------
const { createRequire } = await import('node:module');
const { corpus: APHORISMS } = createRequire(`${T}/x.js`)('./src/corpus.js');
out.corpus_entries = APHORISMS.length;
out.corpus_authors = new Set(APHORISMS.map((a) => a.author)).size;
const tagCount = new Map();
for (const a of APHORISMS) for (const t of a.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
out.corpus_tags = tagCount.size;
const counts = [...tagCount.values()];
out.tags_singleton = counts.filter((n) => n === 1).length;
out.tags_ge5 = counts.filter((n) => n >= 5).length;
out.tags_2to4 = counts.filter((n) => n >= 2 && n <= 4).length;
out.tag_pool_min = Math.min(...counts);
out.tag_pool_max = Math.max(...counts);
out.tag_table = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

// --- tests ----------------------------------------------------------------
let testOut = '';
try { testOut = sh('node --test test/*.test.js'); } catch (e) { testOut = e.stdout || ''; }
out.tests_pass = Number(/^. pass (\d+)$/m.exec(testOut)?.[1] ?? -1);
out.tests_fail = Number(/^. fail (\d+)$/m.exec(testOut)?.[1] ?? -1);
out.tests_total = Number(/^. tests (\d+)$/m.exec(testOut)?.[1] ?? -1);

// --- sizes ----------------------------------------------------------------
out.src_lines = Number(sh('cat src/*.js bin/*.js | wc -l'));
out.test_lines = Number(sh('cat test/*.test.js | wc -l'));
out.readme_guard_lines = Number(sh('wc -l < test/readme-tags.test.js'));

// --- backlog --------------------------------------------------------------
const bl = JSON.parse(readFileSync(`${T}/.swarm/backlog.json`, 'utf8'));
out.backlog_total = bl.items.length;
out.backlog_by_status = {};
for (const i of bl.items) out.backlog_by_status[i.status] = (out.backlog_by_status[i.status] || 0) + 1;
out.todos = bl.items.filter((i) => i.status === 'todo')
  .sort((a, b) => a.priority - b.priority)
  .map((i) => `${i.id} p${i.priority} ${i.effort} ${i.kind} :: ${i.title.slice(0, 60)}`);
out.blocked = bl.items.filter((i) => i.status === 'blocked').map((i) => i.id);

// --- state ----------------------------------------------------------------
const st = JSON.parse(readFileSync(`${T}/.swarm/state.json`, 'utf8'));
out.state_cycle = st.cycle;
out.state_phase = st.phase;
out.decisions = st.decisions.length;
out.ki_total = st.known_issues.length;
out.ki_by_status = {};
for (const k of st.known_issues) out.ki_by_status[k.status] = (out.ki_by_status[k.status] || 0) + 1;
out.ki_list = st.known_issues.map((k) => `${k.id} ${k.severity} ${k.status}`);

// --- git ------------------------------------------------------------------
out.commits_total = Number(sh('git rev-list --count HEAD'));
out.commits_this_run = Number(sh('git log --oneline --grep "^cycle " | wc -l'));
out.head_subject = sh('git log -1 --pretty=%s').slice(0, 80);
out.sync = sh('git status -sb').split('\n')[0];
out.dirty = sh('git status --porcelain').length === 0 ? 'clean' : 'dirty';
out.tag_local = sh('git tag -l v0.1-overnight') || '(none)';
try { out.tag_remote = sh('git ls-remote --tags origin v0.1-overnight') || '(absent on remote)'; }
catch { out.tag_remote = '(ls-remote failed)'; }

// --- run artifacts / control ---------------------------------------------
out.run_artifacts = readdirSync(`${T}/.swarm/runs`).length;
const ctl = JSON.parse(readFileSync('/opt/swarm/runs/control.json', 'utf8'));
out.control_pending = ctl.pending.length;
out.control_applied = ctl.applied.length;
try { out.notifications = Number(execSync('wc -l < /opt/swarm/runs/notify.log', { encoding: 'utf8' }).trim()); }
catch { out.notifications = 0; }

// --- README self-claims (product docs, not the report) --------------------
const rd = readFileSync(`${T}/README.md`, 'utf8');
out.readme_claims_tagcount = /contains (\d+) distinct tags/.exec(rd)?.[1] ?? '(no match)';
out.readme_mentions_37 = /\b37\b/.test(rd);

for (const [k, v] of Object.entries(out)) {
  console.log(`${k} = ${Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : v}`);
}
