// cycle 3, improvement run #3 — CONDUCTOR VERIFICATION GATE for items N-3 and N-7.
//
// Authored by the conductor at verification time. Builders never saw it. Nothing here
// is copied from a builder's notes or from the backlog's acceptance text: the acceptance
// is the GOAL, this file decides how the goal is PROVEN.
//
// The measurement arm (c3r3-mutants.mjs) already ran independently and is the ground
// truth this gate cross-checks the N-3 deliverable against. Ground truth for N-7 was
// measured by the conductor before reading any agent output.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const T = '/opt/targets/aphorism-cli';
const COMMIT = 'b627ed2eb547d8f06e73a8ac52cccb4031e3ba6c';

const checks = [];
const check = (id, label, fn) => {
  let ok = false, note = '';
  try { const r = fn(); ok = !!(r && r.ok); note = (r && r.note) || ''; }
  catch (e) { ok = false; note = 'threw: ' + (e && e.message); }
  checks.push({ id, label, ok, note });
};

const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
const sh = (cmd, cwd = T) => spawnSync('sh', ['-c', cmd], { cwd, encoding: 'utf8' });

// ---------------------------------------------------------------------------
// Ground truth measured by the conductor, independently, before reading agent output.
// ---------------------------------------------------------------------------
const TRUTH = { corpus: 50, srcFiles: 3, testFiles: 4, tests: 102, pass: 102, fail: 0 };

// The 29 clause IDs the standing instrument has used since run #1 cycle 52.
const CLAUSES = ['S1','S2','S3','S4','S5','F1','F2','F3','F4','F5','E1','E2','E3',
                 'L1','L2','L3','L4','L5','L6','L7','J1','J2','J3','J3b','J4',
                 'X0','X2a','X2b','X2c'];

// My arm's verdicts, by the clause each conductor mutant targeted. Cross-checked
// against the builder's table: a disagreement is a gate failure, not a footnote.
const MY_VERDICTS = { F2:'KILLED', F3:'KILLED', S2:'KILLED', E1:'KILLED',
                      L5:'KILLED', L7:'KILLED', X2c:'KILLED' };

const MAP  = `${T}/.swarm/runs/cycle-003-coverage-map.md`;
const OUT  = `${T}/.swarm/runs/cycle-003-rule-coverage-out.txt`;
const INST = `${T}/.swarm/runs/cycle-003-rule-coverage.mjs`;
const AUDIT= `${T}/.swarm/runs/cycle-003-count-audit.md`;

// ===========================================================================
// FLOOR — the product must not have regressed. This outranks both items.
// ===========================================================================
check('F1', 'FLOOR: the shipped suite is green at its known size', () => {
  const r = sh('node --test --test-reporter=tap test/*.test.js');
  const all = r.stdout + r.stderr;
  const g = (re) => { const m = all.match(re); return m ? Number(m[1]) : null; };
  const pass = g(/^# pass (\d+)$/m), fail = g(/^# fail (\d+)$/m), tests = g(/^# tests (\d+)$/m);
  return { ok: tests === TRUTH.tests && pass === TRUTH.pass && fail === 0,
           note: `tests ${tests} / pass ${pass} / fail ${fail} (expected ${TRUTH.tests}/${TRUTH.pass}/0)` };
});

check('F2', 'FLOOR: neither agent modified src/, test/ or bin/', () => {
  const r = sh('git status --porcelain');
  const dirty = r.stdout.split('\n').filter(Boolean)
    .filter((l) => /^\s*[MADRU]/.test(l))
    .filter((l) => /\s(src|test|bin)\//.test(l));
  return { ok: dirty.length === 0, note: dirty.length ? 'MODIFIED: ' + dirty.join(' ; ') : 'src/, test/, bin/ all clean' };
});

// ===========================================================================
// N-3 — the coverage map re-measurement
// ===========================================================================
check('N3-a', 'N-3 deliverables: all three files exist and are non-trivial', () => {
  const m = read(MAP), o = read(OUT), i = read(INST);
  const sizes = `map ${m ? m.length : 'MISSING'} / out ${o ? o.length : 'MISSING'} / instrument ${i ? i.length : 'MISSING'}`;
  return { ok: !!m && !!o && !!i && m.length > 1500 && o.length > 1000 && i.length > 3000, note: sizes };
});

check('N3-b', 'N-3 map covers all 29 clause IDs (structural, not prose)', () => {
  const m = read(MAP);
  if (!m) return { ok: false, note: 'map missing' };
  // Each clause must appear as a standalone token — a row label, not a substring of prose.
  const missing = CLAUSES.filter((c) => !new RegExp(`(^|[\\s|\`*])${c.replace('b','b')}([\\s|\`*]|$)`, 'm').test(m));
  return { ok: missing.length === 0, note: missing.length ? 'MISSING rows: ' + missing.join(' ') : 'all 29 clause IDs present as row labels' };
});

// Tally the verdicts from the TABLE ROWS the document owns — one row per clause —
// rather than from a prose sentence. An earlier version of this check grepped the whole
// document for a number near the word KILLED and matched "suite 94p/8f" inside a row's
// evidence cell, reporting KILLED=94. Counting rows cannot be fooled that way, and it
// verifies the thing that actually matters: that all 29 clauses carry a verdict.
function rowVerdicts(md) {
  const out = {};
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*([A-Za-z0-9]+)\s*\|/);
    if (!m) continue;
    const id = m[1];
    if (!CLAUSES.includes(id)) continue;
    // The verdict is a standalone cell, not a word buried in the evidence prose.
    // Strip markdown emphasis and code ticks before matching: the author bolded the
    // verdict on the two historically-interesting rows (`**KILLED**`), and a matcher
    // that only accepts a bare token would read those rows as having no verdict at all.
    const cells = line.split('|').map((c) => c.trim().replace(/[*`_]/g, '').trim());
    const verdict = cells.find((c) => /^(KILLED|SURVIVED|INERT|NOT-PLANTED)$/.test(c));
    if (verdict) out[id] = verdict;
  }
  return out;
}

check('N3-c', 'N-3 table carries one verdict per clause and they tally to exactly 29', () => {
  const m = read(MAP);
  if (!m) return { ok: false, note: 'map missing' };
  const v = rowVerdicts(m);
  const ids = Object.keys(v);
  const missing = CLAUSES.filter((c) => !ids.includes(c));
  const tally = {};
  for (const x of Object.values(v)) tally[x] = (tally[x] || 0) + 1;
  const sum = ids.length;
  const desc = Object.entries(tally).map(([k, n]) => `${k} ${n}`).join(' + ') + ` = ${sum}`;
  // Cross-check the prose headline against the row tally: if the document states a
  // headline, it must agree with its own table.
  const head = m.match(/(\d+)\s*KILLED\s*\/\s*(\d+)\s*SURVIVED\s*\/\s*(\d+)\s*INERT\s*\/\s*(\d+)\s*NOT-PLANTED/i);
  const headAgrees = !head || (Number(head[1]) === (tally.KILLED || 0) && Number(head[2]) === (tally.SURVIVED || 0) &&
                               Number(head[3]) === (tally.INERT || 0) && Number(head[4]) === (tally['NOT-PLANTED'] || 0));
  return { ok: missing.length === 0 && sum === 29 && headAgrees,
           note: `${desc}${missing.length ? ' | MISSING verdict rows: ' + missing.join(' ') : ''}` +
                 (head ? ` | headline "${head[0]}" ${headAgrees ? 'agrees with' : 'CONTRADICTS'} the table` : ' | no headline found') };
});

check('N3-c2', 'CONTROL: the row tally DETECTS a dropped clause row and a lying headline', () => {
  const good = CLAUSES.map((c) => `| ${c} | clause | mutation | KILLED | suite 94p/8f |`).join('\n');
  const dropped = rowVerdicts(good.split('\n').slice(0, 28).join('\n'));
  const full = rowVerdicts(good);
  // The "94" inside the evidence cell must NOT be read as a count.
  const noFalseCount = Object.values(full).every((x) => x === 'KILLED') && Object.keys(full).length === 29;
  return { ok: Object.keys(dropped).length === 28 && noFalseCount,
           note: `28 rows read as 28 (not 29), and "suite 94p/8f" is never mistaken for a verdict count — the check is not vacuous` };
});

check('N3-d', 'CROSS-CHECK: builder verdicts agree with the conductor arm on all 7 sampled clauses', () => {
  const m = read(MAP);
  if (!m) return { ok: false, note: 'map missing' };
  const lines = m.split('\n');
  const disagree = [];
  for (const [clause, mine] of Object.entries(MY_VERDICTS)) {
    // Find the row whose label is this clause, then read the verdict token on that row.
    const row = lines.find((l) => new RegExp(`(^|[|\\s\`*])${clause}([|\\s\`*])`).test(l) && /KILLED|SURVIVED|INERT|NOT-PLANTED/.test(l));
    if (!row) { disagree.push(`${clause}: no verdict row found`); continue; }
    const theirs = (row.match(/NOT-PLANTED|SURVIVED|KILLED|INERT/) || [])[0];
    if (theirs !== mine) disagree.push(`${clause}: conductor measured ${mine}, builder reported ${theirs}`);
  }
  return { ok: disagree.length === 0,
           note: disagree.length ? disagree.join(' ; ') : 'all 7 sampled clauses agree with my independent mutants' };
});

check('N3-e', 'CONTROL: the cross-check DETECTS a fabricated verdict', () => {
  // Feed the same matcher a row that claims SURVIVED where I measured KILLED.
  const fake = '| L7 | unparseable seed under --list | some mutation | SURVIVED | suite 102p/0f |';
  const theirs = (fake.match(/NOT-PLANTED|SURVIVED|KILLED|INERT/) || [])[0];
  const matched = new RegExp(`(^|[|\\s\`*])L7([|\\s\`*])`).test(fake);
  return { ok: matched && theirs === 'SURVIVED' && theirs !== MY_VERDICTS.L7,
           note: 'a SURVIVED row for L7 is matched and flagged as disagreeing — the check is not vacuous' };
});

// ===========================================================================
// N-7 — the count audit
// ===========================================================================
check('N7-a', 'N-7 ledger exists and records commands with their output', () => {
  const a = read(AUDIT);
  if (!a) return { ok: false, note: 'audit ledger missing' };
  const hasCmd = /node bin\/aphorism\.js|node --test|wc -c|corpus\.length/.test(a);
  return { ok: a.length > 1500 && hasCmd, note: `${a.length} bytes; measuring commands present: ${hasCmd}` };
});

check('N7-b', 'N-7 ledger reports the conductor-measured ground truth', () => {
  const a = read(AUDIT);
  if (!a) return { ok: false, note: 'audit ledger missing' };
  const want = [String(TRUTH.corpus), String(TRUTH.tests), String(TRUTH.srcFiles), String(TRUTH.testFiles)];
  const missing = want.filter((v) => !new RegExp(`(^|[^0-9])${v}([^0-9]|$)`).test(a));
  return { ok: missing.length === 0, note: missing.length ? 'ledger never states: ' + missing.join(', ') : `states corpus ${TRUTH.corpus}, tests ${TRUTH.tests}, src ${TRUTH.srcFiles}, test files ${TRUTH.testFiles}` };
});

check('N7-c', 'REPORT.md CENSUS: no prose line was deleted (only digits may change)', () => {
  const before = sh(`git show ${COMMIT}:REPORT.md`).stdout;
  const after = read(`${T}/REPORT.md`);
  if (!after) return { ok: false, note: 'REPORT.md missing' };
  const afterSet = new Set(after.split('\n'));
  // Every original line that is GONE must be a line that carried a number — i.e. a
  // corrected count. An original line with no digit that vanished is deleted prose.
  const gone = before.split('\n').filter((l) => l.trim() && !afterSet.has(l));
  const goneWithoutDigits = gone.filter((l) => !/\d/.test(l));
  return { ok: goneWithoutDigits.length === 0,
           note: `${gone.length} original lines changed/removed, ${goneWithoutDigits.length} of them carried NO digit` +
                 (goneWithoutDigits.length ? ' -> DELETED PROSE: ' + goneWithoutDigits.slice(0, 3).map((s) => JSON.stringify(s.slice(0, 70))).join(' ; ') : '') };
});

check('N7-d', 'REPORT.md did not shrink materially', () => {
  const before = sh(`git show ${COMMIT}:REPORT.md`).stdout;
  const after = read(`${T}/REPORT.md`) || '';
  const bl = before.split('\n').length, al = after.split('\n').length;
  return { ok: al >= bl, note: `${bl} lines before -> ${al} lines after (must not decrease)` };
});

check('N7-e', 'CONTROL: the census DETECTS a deleted prose line', () => {
  const before = 'alpha line\nbeta line\ngamma 42 line\n';
  const after = 'alpha line\ngamma 42 line\n';
  const afterSet = new Set(after.split('\n'));
  const gone = before.split('\n').filter((l) => l.trim() && !afterSet.has(l));
  const goneWithoutDigits = gone.filter((l) => !/\d/.test(l));
  return { ok: goneWithoutDigits.length === 1 && goneWithoutDigits[0] === 'beta line',
           note: 'a removed digit-free line is caught — the census is not vacuous' };
});

check('N7-f', 'CONVERSE CONTROL: the census stays GREEN when only a digit changes', () => {
  const before = 'the suite has 91 tests\nunrelated prose\n';
  const after  = 'the suite has 102 tests\nunrelated prose\n';
  const afterSet = new Set(after.split('\n'));
  const gone = before.split('\n').filter((l) => l.trim() && !afterSet.has(l));
  const goneWithoutDigits = gone.filter((l) => !/\d/.test(l));
  return { ok: gone.length === 1 && goneWithoutDigits.length === 0,
           note: 'a count correction passes while a prose deletion fails — the check discriminates' };
});

check('N7-g', 'HISTORICAL CONTROL: a past-tense count was NOT rewritten to today\'s value', () => {
  const before = sh(`git show ${COMMIT}:REPORT.md`).stdout;
  const after = read(`${T}/REPORT.md`) || '';
  // Historical statements anchored to a run/cycle must survive verbatim. Pick every
  // original line that anchors a number to a cycle and confirm it is still present.
  const anchored = before.split('\n').filter((l) => /cycle\s*\d+/i.test(l) && /\b(9[0-9]|8[0-9]|10[0-2])\b/.test(l));
  const afterSet = new Set(after.split('\n'));
  const rewritten = anchored.filter((l) => !afterSet.has(l));
  return { ok: rewritten.length === 0,
           note: `${anchored.length} cycle-anchored count lines checked, ${rewritten.length} rewritten` +
                 (rewritten.length ? ' -> ' + rewritten.slice(0, 2).map((s) => JSON.stringify(s.slice(0, 80))).join(' ; ') : '') };
});

// ===========================================================================
const pass = checks.filter((c) => c.ok).length;
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
say('CONDUCTOR VERIFICATION GATE — cycle 3, items N-3 and N-7');
say('');
for (const c of checks) say(`${c.ok ? 'PASS' : 'FAIL'}  ${c.id.padEnd(6)} ${c.label}\n        ${c.note}`);
say('');
say(`GATE ${pass === checks.length ? 'PASS' : 'FAIL'} — ${pass}/${checks.length} checks passed`);
fs.writeFileSync('/opt/swarm/runs/c3r3-gate-out.txt', lines.join('\n') + '\n');
process.exit(pass === checks.length ? 0 : 1);
