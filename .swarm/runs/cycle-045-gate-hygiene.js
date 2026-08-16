#!/usr/bin/env node
// cycle 45 — step-3 backlog hygiene, POST GATE.
// Every claim is checked against the PRE snapshot, and every ordering claim carries a
// negative control that RE-RUNS THE SAME CHECK against the PRE state and requires it to
// go RED. An ordering rule that passes on both states proves nothing about the edit.
'use strict';
const fs = require('fs');
const path = require('path');

const T = '/opt/targets/aphorism-cli';
const BL = path.join(T, '.swarm/backlog.json');
const SNAP = path.join(T, '.swarm/runs/cycle-045-backlog-PRE.json');

const pre = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
const post = JSON.parse(fs.readFileSync(BL, 'utf8'));
const preById = Object.fromEntries(pre.items.map(i => [i.id, i]));
const postById = Object.fromEntries(post.items.map(i => [i.id, i]));

const out = [];
let pass = 0, fail = 0;
function chk(id, claim, ok, detail) {
  (ok ? pass++ : fail++);
  out.push(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(6)} ${claim}${detail ? ' -> ' + detail : ''}`);
  return ok;
}

out.push('');
out.push('=== CYCLE 45 — POST GATE (backlog hygiene) ===');
out.push('');

const isProduct = i => (i.files_hint || []).some(f => !f.startsWith('test/'));
const liveOf = b => b.items.filter(i => i.status !== 'done' && i.status !== 'dropped');

// ---- A1: the exact assignment -------------------------------------------
const EXPECT = { 'T-006': 2, 'T-007': 3, 'T-008': 4, 'T-024a': 5, 'T-024': 6, 'T-032': 7, 'T-024b': 8, 'T-039': 8 };
const got = Object.fromEntries(Object.keys(EXPECT).map(id => [id, postById[id].priority]));
chk('A1', 'live priorities are exactly as derived',
  JSON.stringify(got) === JSON.stringify(EXPECT), JSON.stringify(got));

// ---- A2 / A2n: CLAIM 1, with the same check run against PRE -------------
function claim1(b) {
  const live = liveOf(b);
  const U = live.filter(isProduct), G = live.filter(i => !isProduct(i));
  return { ok: Math.max(...U.map(i => i.priority)) < Math.min(...G.map(i => i.priority)),
           worstU: Math.max(...U.map(i => i.priority)), bestG: Math.min(...G.map(i => i.priority)) };
}
const c1post = claim1(post), c1pre = claim1(pre);
chk('A2', 'CLAIM 1 holds POST: every product-touching live item outranks every test-only one',
  c1post.ok, `worst product-touching p${c1post.worstU} < best test-only p${c1post.bestG}`);
chk('A2n', 'NEG CONTROL — the IDENTICAL check goes RED on the PRE snapshot (it is failable)',
  !c1pre.ok, `PRE: worst product-touching p${c1pre.worstU} vs best test-only p${c1pre.bestG} — inverted`);

// ---- A3 / A3n: CLAIM 2, with the same check run against PRE -------------
const BLOCKED_BY = ['T-024b', 'T-032', 'T-039'];
function claim2(b) {
  const byId = Object.fromEntries(b.items.map(i => [i.id, i]));
  const u = byId['T-024'].priority;
  const worst = Math.min(...BLOCKED_BY.map(id => byId[id].priority));
  return { ok: BLOCKED_BY.every(id => u < byId[id].priority), u, worst };
}
const c2post = claim2(post), c2pre = claim2(pre);
chk('A3', 'CLAIM 2 holds POST: T-024 outranks all three items that name it as their instrument',
  c2post.ok, `T-024 p${c2post.u} strictly above [${BLOCKED_BY.map(id => id + ':p' + postById[id].priority)}]`);
chk('A3n', 'NEG CONTROL — the IDENTICAL check goes RED on the PRE snapshot',
  !c2pre.ok, `PRE: T-024 p${c2pre.u} was TIED with T-024b/T-039 at p6, not above them`);

// ---- A4: schema repair ---------------------------------------------------
chk('A4a', 'T-039 now carries a `value`', postById['T-039'].value === 'M', `value=${postById['T-039'].value}`);
chk('A4b', 'no LIVE item is missing `value`',
  liveOf(post).every(i => i.value !== undefined && i.value !== null),
  'all ' + liveOf(post).length + ' live items scoreable');
chk('A4c', 'the done-item omissions were NOT backfilled with invented numbers',
  ['T-029', 'T-037', 'T-038'].every(id => postById[id].value === undefined),
  'T-029/T-037/T-038 still undefined, as measured in PRE');

// ---- A5: the false claim is gone, and its correction is attributed ------
const FALSE_CLAIM = 'Left todo at full priority for the next run.';
chk('A5a', 'the measurably-false "at full priority" sentence is gone from both items',
  !postById['T-007'].notes.includes(FALSE_CLAIM) && !postById['T-008'].notes.includes(FALSE_CLAIM),
  'absent from T-007 and T-008');
chk('A5b', 'it was CORRECTED, not deleted — the correction names the old value and the cycle',
  /CYCLE 45 CORRECTION/.test(postById['T-007'].notes) && /CYCLE 45 CORRECTION/.test(postById['T-008'].notes) &&
  /p8/.test(postById['T-007'].notes) && /p9/.test(postById['T-008'].notes),
  'both carry the correction marker and their prior priority');
chk('A5c', 'NEG CONTROL — the sentence WAS present in PRE (A5a is not vacuous)',
  preById['T-007'].notes.includes(FALSE_CLAIM) && preById['T-008'].notes.includes(FALSE_CLAIM),
  'present on both in the snapshot');

// ---- A6: T-008 reachability recorded, decision NOT reversed --------------
chk('A6a', 'T-008 deps are UNCHANGED — the cycle-14 judgment was not silently reversed',
  JSON.stringify(postById['T-008'].deps) === JSON.stringify(preById['T-008'].deps),
  JSON.stringify(postById['T-008'].deps));
chk('A6b', 'the unsatisfiable-dep fact is on the board, not only in the journal',
  /REACHABILITY NOTE/.test(postById['T-008'].notes) && /never complete on its own/.test(postById['T-008'].notes),
  'T-008 notes carry it');

// ---- A7: SCOPE — nothing else moved --------------------------------------
const MUTABLE = new Set(['priority', 'value', 'notes']);
const TOUCHED = new Set(Object.keys(EXPECT));
const scopeErrs = [];
if (pre.items.length !== post.items.length) scopeErrs.push(`item count ${pre.items.length} -> ${post.items.length}`);
for (const p of pre.items) {
  const q = postById[p.id];
  if (!q) { scopeErrs.push(`${p.id} vanished`); continue; }
  const keys = new Set([...Object.keys(p), ...Object.keys(q)]);
  for (const k of keys) {
    if (JSON.stringify(p[k]) === JSON.stringify(q[k])) continue;
    if (!TOUCHED.has(p.id)) scopeErrs.push(`${p.id}.${k} changed but the item was not in scope`);
    else if (!MUTABLE.has(k)) scopeErrs.push(`${p.id}.${k} changed — field not in {priority,value,notes}`);
  }
}
chk('A7', 'SCOPE: only priority/value/notes moved, and only on the 8 named live items',
  scopeErrs.length === 0, scopeErrs.length ? scopeErrs.join('; ') : `${pre.items.length} items compared, 0 out-of-scope diffs`);

// A7n: prove the scope check can actually see a violation
const tampered = JSON.parse(JSON.stringify(pre));
tampered.items.find(i => i.id === 'T-001').title += ' (tampered)';
tampered.items.find(i => i.id === 'T-024').acceptance += ' (tampered)';
const tById = Object.fromEntries(tampered.items.map(i => [i.id, i]));
const tErrs = [];
for (const p of pre.items) {
  const q = tById[p.id];
  for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) {
    if (JSON.stringify(p[k]) === JSON.stringify(q[k])) continue;
    if (!TOUCHED.has(p.id)) tErrs.push(`${p.id}.${k}`);
    else if (!MUTABLE.has(k)) tErrs.push(`${p.id}.${k}`);
  }
}
chk('A7n', 'NEG CONTROL — the scope check catches an out-of-scope edit and an in-scope-item/out-of-scope-FIELD edit',
  tErrs.length === 2 && tErrs.includes('T-001.title') && tErrs.includes('T-024.acceptance'),
  `caught [${tErrs}]`);

// ---- A8: id set + statuses untouched -------------------------------------
const preIds = pre.items.map(i => i.id).sort().join(','), postIds = post.items.map(i => i.id).sort().join(',');
chk('A8a', 'no item added, removed or renamed', preIds === postIds, `${post.items.length} ids identical`);
chk('A8b', 'no status changed — hygiene reprioritises, it does not close or drop',
  pre.items.every(p => postById[p.id].status === p.status), 'all 53 statuses identical');

// ---- A9: the board reads correctly top-down now --------------------------
const order = liveOf(post).slice().sort((a, c) => a.priority - c.priority || a.id.localeCompare(c.id));
out.push('');
out.push('       board as it now reads, top-down:');
for (const i of order) {
  out.push(`         p${i.priority} ${i.id.padEnd(7)} ${i.status.padEnd(7)} ${isProduct(i) ? 'product' : 'test-only'}  ${(i.title || '').slice(0, 62)}`);
}
const firstTodo = order.find(i => i.status === 'todo');
chk('A9', 'the first UNBLOCKED-status item a top-down reader now reaches is product-touching',
  isProduct(firstTodo), `${firstTodo.id} (was T-032, test-only, in PRE)`);

out.push('');
out.push(`--- POST: ${pass}/${pass + fail} checks passed ---  ${fail === 0 ? 'GATE GREEN' : String(fail) + ' RED'}`);
console.log(out.join('\n'));
process.exit(fail === 0 ? 0 : 1);
