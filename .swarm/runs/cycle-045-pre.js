#!/usr/bin/env node
// cycle 45 — step-3 backlog hygiene, PRE-state measurement.
// Snapshots backlog.json and measures every claim this cycle intends to act on,
// BEFORE any edit. A hygiene pass that reports only its own output is unfalsifiable;
// the snapshot is what makes the POST gate's scope check a measurement.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const T = '/opt/targets/aphorism-cli';
const BL = path.join(T, '.swarm/backlog.json');
const SNAP = path.join(T, '.swarm/runs/cycle-045-backlog-PRE.json');

const raw = fs.readFileSync(BL, 'utf8');
fs.writeFileSync(SNAP, raw);
const b = JSON.parse(raw);
const items = b.items;
const byId = Object.fromEntries(items.map(i => [i.id, i]));
const live = items.filter(i => i.status !== 'done' && i.status !== 'dropped');

const out = [];
let pass = 0, fail = 0;
function chk(id, claim, ok, detail) {
  (ok ? pass++ : fail++);
  out.push(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(6)} ${claim}${detail ? ' -> ' + detail : ''}`);
  return ok;
}

out.push('=== CYCLE 45 — PRE-STATE MEASUREMENT (backlog hygiene) ===');
out.push(`snapshot: ${SNAP} (${raw.length} bytes)`);
out.push('');

// ---- P1: cap + live inventory -------------------------------------------
const todo = live.filter(i => i.status === 'todo').map(i => i.id);
const blocked = live.filter(i => i.status === 'blocked').map(i => i.id);
chk('P1', 'live board is under the ~30-item hygiene cap',
  live.length <= 30, `${live.length} live (todo ${todo.length} [${todo}], blocked ${blocked.length} [${blocked}]), total ${items.length}`);

// ---- P2: the priority convention, established from data not assumed -----
// If lower number = higher urgency, the kickoff must-have core must occupy the
// minimum. If the convention were reversed, these would sit at the maximum.
const CORE = ['T-001', 'T-002', 'T-003', 'I-1', 'I-4'];
const prios = items.map(i => i.priority);
const minP = Math.min(...prios), maxP = Math.max(...prios);
const coreAtMin = CORE.every(id => byId[id] && byId[id].priority === minP);
chk('P2', 'priority is ASCENDING-URGENCY (lower number = more urgent)',
  coreAtMin, `all 5 kickoff must-haves [${CORE}] sit at the minimum ${minP}; range ${minP}..${maxP}`);

// ---- P3: the classifier, derived from a field the items already carried --
// An item is PRODUCT-TOUCHING iff any files_hint path is outside test/.
// This is mechanical and pre-existing: files_hint was written when each item was
// filed, by earlier cycles, so it cannot have been shaped to this cycle's answer.
const isProduct = i => (i.files_hint || []).some(f => !f.startsWith('test/'));
const U = live.filter(isProduct).map(i => i.id);
const G = live.filter(i => !isProduct(i)).map(i => i.id);
chk('P3a', 'the partition is non-vacuous — both sides non-empty',
  U.length > 0 && G.length > 0, `product-touching=[${U}] test-only=[${G}]`);
chk('P3b', 'NEG CONTROL — the fabricated claim "T-024 is product-touching" is REJECTED',
  !isProduct(byId['T-024']), `T-024 files_hint=${JSON.stringify(byId['T-024'].files_hint)}`);
chk('P3c', 'NEG CONTROL — the fabricated claim "T-008 is test-only" is REJECTED',
  isProduct(byId['T-008']), `T-008 files_hint=${JSON.stringify(byId['T-008'].files_hint)}`);

// ---- P4: THE INVERSION ---------------------------------------------------
const liveTodo = live.filter(i => i.status === 'todo');
const uTodo = liveTodo.filter(isProduct), gTodo = liveTodo.filter(i => !isProduct(i));
const worstU = Math.max(...uTodo.map(i => i.priority));
const bestG = Math.min(...gTodo.map(i => i.priority));
chk('P4', 'INVERSION PRESENT: some test-only todo outranks a product-touching todo',
  bestG < worstU,
  `best test-only priority ${bestG} (${gTodo.filter(i => i.priority === bestG).map(i => i.id)}) ` +
  `outranks worst product-touching ${worstU} (${uTodo.filter(i => i.priority === worstU).map(i => i.id)})`);
out.push(`       ordering as filed: ${liveTodo.slice().sort((a, c) => a.priority - c.priority).map(i => i.id + ':p' + i.priority + (isProduct(i) ? '/U' : '/G')).join('  ')}`);

// ---- P5: schema completeness on LIVE items -------------------------------
const noValue = live.filter(i => i.value === undefined || i.value === null).map(i => i.id);
chk('P5', 'a LIVE item is missing `value`, so step-4 value scoring cannot run on it',
  noValue.length > 0, `missing value: [${noValue}]`);
const noValueDone = items.filter(i => (i.value === undefined || i.value === null) && i.status === 'done').map(i => i.id);
out.push(`       (also missing on done items, inert: [${noValueDone}])`);

// ---- P6: prose/state divergence in the board's OWN notes -----------------
const claim = 'at full priority';
const claimants = live.filter(i => (i.notes || '').includes(claim)).map(i => i.id);
const liveMax = Math.max(...live.map(i => i.priority));
const claimantsAtWorst = claimants.filter(id => byId[id].priority === liveMax || byId[id].priority === liveMax - 1);
chk('P6a', `items whose notes claim "${claim}"`, claimants.length > 0, `[${claimants}]`);
chk('P6b', 'that claim is FALSE — the claimants hold the LOWEST-urgency live priorities',
  claimants.length > 0 && claimants.every(id => claimantsAtWorst.includes(id)),
  claimants.map(id => id + ':p' + byId[id].priority).join(', ') + ` vs live max ${liveMax}`);
chk('P6c', 'NEG CONTROL — the phrase is not matching every item',
  !(byId['T-032'].notes || '').includes(claim) && !(byId['T-024'].notes || '').includes(claim),
  'T-032 and T-024 notes do NOT carry the phrase');

// ---- P7: T-008 dependency reachability -----------------------------------
const t8 = byId['T-008'], t6 = byId['T-006'];
chk('P7a', 'T-008 depends on T-006', JSON.stringify(t8.deps) === '["T-006"]', JSON.stringify(t8.deps));
chk('P7b', 'T-006 is blocked on a human, so the dep can never be satisfied autonomously',
  t6.status === 'blocked' && /human/i.test(t6.notes || ''), `T-006 status=${t6.status}`);
chk('P7c', "T-008's own notes document an OR-branch that `deps` cannot express",
  /or this item should ship with its own triage/i.test(t8.notes || ''),
  'notes name two paths; deps encodes only the human-audit-first one');

// ---- P8: dedupe — are the family items actually distinct? ----------------
const FAM = ['T-024a', 'T-024b', 'T-032', 'T-039'];
const anchors = {
  'T-024a': 'extractNearestPrecedingCount',
  'T-024b': 'band-heading',
  'T-032': 'two count markers',
  'T-039': 'heading-to-table stop rule',
};
const found = FAM.map(id => {
  const txt = (byId[id].title || '') + ' ' + (byId[id].acceptance || '') + ' ' + (byId[id].notes || '');
  return [id, txt.includes(anchors[id])];
});
chk('P8a', 'each family item names a DISTINCT mechanism (no dedupe warranted)',
  found.every(([, ok]) => ok), found.map(([id, ok]) => id + ':' + (ok ? anchors[id] : 'NOT-FOUND')).join(' | '));
const allSameFile = FAM.every(id => JSON.stringify(byId[id].files_hint) === '["test/readme-tags.test.js"]');
chk('P8b', 'they share one file but not one mechanism — same-file is not duplication',
  allSameFile, 'all four files_hint = ["test/readme-tags.test.js"]');

// ---- P9: does every family member name T-024 as its instrument? ----------
// Cycle 44 gate S8c claimed all three S-effort todos do. Re-measured here rather
// than inherited, because this cycle proposes to act on it.
const S_TODO = ['T-024b', 'T-032', 'T-039'];
const namesUmbrella = S_TODO.map(id => [id, /T-024\b/.test((byId[id].notes || '') + ' ' + (byId[id].acceptance || ''))]);
chk('P9', 'cycle-44 S8c re-measured: every S-effort todo names T-024 as its instrument',
  namesUmbrella.every(([, ok]) => ok), namesUmbrella.map(([id, ok]) => id + ':' + (ok ? 'names T-024' : 'DOES NOT')).join(' | '));
chk('P9n', 'NEG CONTROL — the product-touching todos do NOT name T-024',
  !/T-024\b/.test((byId['T-007'].notes || '')) && !/T-024\b/.test((byId['T-008'].notes || '')),
  'T-007, T-008 carry no T-024 reference');

// ---- P10: staleness — do the measured premises still describe HEAD? ------
let lastTouch = '';
try {
  lastTouch = execFileSync('git', ['-C', T, 'log', '-1', '--format=%h %s', '--', 'test/readme-tags.test.js', 'src/'], { encoding: 'utf8' }).trim();
} catch (e) { lastTouch = 'GIT-ERROR: ' + e.message; }
chk('P10', 'no commit has touched src/ or readme-tags.test.js since cycle 40 — the cycle-32/35/40 premises still describe HEAD',
  /cycle 40/.test(lastTouch), lastTouch.slice(0, 120));

out.push('');
out.push(`--- PRE: ${pass}/${pass + fail} checks passed ---  ${fail === 0 ? 'MEASUREMENT COMPLETE' : String(fail) + ' RED'}`);
console.log(out.join('\n'));
process.exit(0);
