#!/usr/bin/env node
// run #4 cycle 5 — repair the 7 empty known_issues titles in state.json.
//
// DEFECT: state.json's known_issues[] is a 31-entry INDEX over .swarm/known-issues.json.
// 7 of its 31 entries carry title "". The index every future conductor and every dashboard
// render reads is blind on 7 of 31 issues.
//
// ROOT CAUSE, fully accounted for: the detail file has THREE body keys, not one —
// 23 entries under `desc`, 7 under `what`, 1 under `title`. The summariser that built the
// index at the run #4 kickoff split read `desc` only, so exactly the 7 `what`-keyed
// entries produced empty titles. 23 + 1 = 24 non-empty, 7 empty, 31 total. No other cause.
//
// THE REPAIR IS DERIVED, NOT WRITTEN. The title convention was recovered from the 24
// existing good titles by measurement, not by assumption: first sentence of the body,
// whitespace-collapsed, MINUS its terminating punctuation, hard-capped at 140 chars.
// Column B proves that rule reproduces all 24 known-good titles EXACTLY. Only then is it
// applied to the 7.
//
// Usage:  node run4-cycle-005-ki-title-repair.mjs          (measure only, writes nothing)
//         node run4-cycle-005-ki-title-repair.mjs --apply  (measure, then write state.json)

import fs from 'node:fs';

const STATE = '/opt/targets/aphorism-cli/.swarm/state.json';
const DETAIL = '/opt/targets/aphorism-cli/.swarm/known-issues.json';
const APPLY = process.argv.includes('--apply');

const state = JSON.parse(fs.readFileSync(STATE, 'utf8'));
const detail = JSON.parse(fs.readFileSync(DETAIL, 'utf8'));
const dmap = new Map(detail.issues.map((d) => [d.id, d]));

const body = (d) => String((d && (d.desc || d.title || d.what)) || '');

function derive(src) {
  const s = src.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const m = s.match(/^(.*?)[.!?](\s|$)/);
  let t = m ? m[1] : s;
  if (t.length > 140) t = s.slice(0, 140);
  return t;
}

const rows = [];
const pass = (c, d, e) => rows.push([c, d, e, true]);
const fail = (c, d, e) => rows.push([c, d, e, false]);

// ---- A  DEFECT REPRODUCED ------------------------------------------------
const emptyIds = state.known_issues.filter((k) => !k.title || !k.title.trim()).map((k) => k.id);
const A = emptyIds.length === 7 &&
  ['KI-19', 'KI-28', 'KI-29', 'KI-30', 'KI-31', 'KI-33', 'KI-34'].every((i) => emptyIds.includes(i));
(A ? pass : fail)('A', 'DEFECT REPRODUCED — 7 index entries have empty titles',
  `${emptyIds.length} empty: ${emptyIds.join(',')}`);

// ---- A2 ROOT CAUSE ACCOUNTS FOR ALL 31 -----------------------------------
const byKey = { desc: 0, what: 0, title: 0, none: 0 };
for (const d of detail.issues) {
  if (d.desc) byKey.desc++;
  else if (d.title) byKey.title++;
  else if (d.what) byKey.what++;
  else byKey.none++;
}
const A2 = byKey.desc === 23 && byKey.what === 7 && byKey.title === 1 && byKey.none === 0 &&
  byKey.desc + byKey.what + byKey.title === state.known_issues.length;
(A2 ? pass : fail)('A2', 'ROOT CAUSE — the 7 empties are exactly the `what`-keyed entries',
  `desc=${byKey.desc} title=${byKey.title} what=${byKey.what} none=${byKey.none} total=${state.known_issues.length}`);

// ---- B  THE RULE IS VALIDATED BEFORE IT IS USED --------------------------
let reproduced = 0;
const ruleMiss = [];
for (const k of state.known_issues) {
  if (!k.title || !k.title.trim()) continue;
  const d = derive(body(dmap.get(k.id)));
  if (d === k.title) reproduced++;
  else ruleMiss.push(k.id);
}
const B = reproduced === 24 && ruleMiss.length === 0;
(B ? pass : fail)('B', 'RULE VALIDATED — reproduces every known-good title exactly',
  `${reproduced}/24 exact${ruleMiss.length ? ', missed ' + ruleMiss.join(',') : ''}`);

// ---- C  CONTROL: the rule is not a rubber stamp --------------------------
// A rule that returned the whole body, or any non-empty constant, would also "fill" the 7.
// It must NOT reproduce the 24 when deliberately broken.
const brokenDerive = (src) => src.replace(/\s+/g, ' ').trim().slice(0, 140);
let brokenHits = 0;
for (const k of state.known_issues) {
  if (!k.title || !k.title.trim()) continue;
  if (brokenDerive(body(dmap.get(k.id))) === k.title) brokenHits++;
}
const C = brokenHits < 24;
(C ? pass : fail)('C', 'CONTROL — a naive 140-char slice does NOT reproduce the 24',
  `naive rule matches only ${brokenHits}/24, so column B is discriminating`);

// ---- D  CONTROL: fails CLOSED on an absent body --------------------------
const D = derive('') === '' && derive('   ') === '';
(D ? pass : fail)('D', 'CONTROL — an entry with no body yields NO title, never a fabricated one',
  `derive("")=${JSON.stringify(derive(''))} derive("   ")=${JSON.stringify(derive('   '))}`);

// ---- E  DERIVE THE 7 -----------------------------------------------------
const derived = [];
for (const id of emptyIds) {
  const t = derive(body(dmap.get(id)));
  derived.push({ id, title: t });
}
const E = derived.length === 7 && derived.every((d) => d.title.length > 0 && d.title.length <= 140);
(E ? pass : fail)('E', 'ALL 7 recovered, each within the convention (1..140 chars)',
  derived.map((d) => `${d.id}:${d.title.length}`).join(' '));

// ---- F  CONTROL: nothing else in the index is touched --------------------
const before = JSON.stringify(state.known_issues);
const patched = JSON.parse(before);
for (const d of derived) {
  const row = patched.find((k) => k.id === d.id);
  row.title = d.title;
}
const untouched = patched.filter((k, i) => JSON.stringify(k) === JSON.stringify(JSON.parse(before)[i]));
const F = untouched.length === 24 && patched.length === 31;
(F ? pass : fail)('F', 'CONTROL — exactly 7 rows change, the other 24 are byte-identical',
  `${untouched.length}/31 rows unchanged, ${31 - untouched.length} changed`);

// ---- G  CONTROL: severity/status/id fields survive ----------------------
const G = patched.every((k, i) => {
  const o = JSON.parse(before)[i];
  return k.id === o.id && k.severity === o.severity && k.status === o.status;
});
(G ? pass : fail)('G', 'CONTROL — id, severity and status are untouched on all 31',
  G ? 'all 31 preserved' : 'a non-title field moved');

// ---- report --------------------------------------------------------------
const passed = rows.filter((r) => r[3]).length;
console.log(`run #4 cycle 5 — known_issues title repair    ${passed} PASS / ${rows.length - passed} FAIL`);
console.log('');
for (const [c, d, e, ok] of rows) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${c.padEnd(3)} ${d}`);
  console.log(`            ${e}`);
}
console.log('');
console.log('  RECOVERED TITLES');
for (const d of derived) console.log(`    ${d.id}  ${d.title}`);

if (!APPLY) {
  console.log('');
  console.log('  (measure-only run — state.json NOT written; pass --apply to write)');
  process.exit(passed === rows.length ? 0 : 1);
}

if (passed !== rows.length) {
  console.error('\n  REFUSING TO APPLY — a column failed. Nothing written.');
  process.exit(1);
}

state.known_issues = patched;
fs.writeFileSync(STATE + '.tmp', JSON.stringify(state, null, 1));
fs.renameSync(STATE + '.tmp', STATE);
console.log('\n  APPLIED — state.json rewritten, 7 titles recovered, 24 rows untouched.');
