// cycle-013 VERIFICATION GATE — review-fix pass on src/ bin/ test/
//
// AUTHORED AND SEALED BY SHA256 BEFORE ANY FILE IN THE TREE WAS TOUCHED.
// The seal commit precedes the fix commit; `git log` is the proof of ordering.
//
// HONEST LIMIT ON WHAT THIS GATE PROVES, stated up front so no reader has to
// infer it. The eleven assertions split into two classes and they are NOT of
// equal weight:
//
//   PRESENCE checks (A1 A2 A3 A5 A10 A11) assert that documents I am about to
//   author actually carry the content I say they carry. They cannot discover
//   truth — I am the author of both the document and the check. Their only
//   real job is to catch a fixer that silently did nothing or wrote something
//   other than what it was told. Read them as delivery receipts, not evidence.
//
//   PROPERTY controls (A4 A8 A9) are the assertions that carry weight. Each
//   must be GREEN ON THE UNFIXED TREE AND GREEN AFTER (L-044 converse control):
//     A4 the 29-clause Domain-rules map did not grow by one byte
//     A8 the token matcher was RENAMED, NOT NARROWED — sealed hash of the
//        matcher body must survive the edit (this is the assertion that would
//        catch me reintroducing the prose-regex bug class this repo has
//        already paid for three times)
//     A9 the suite is still 118/118 — no test added, none deleted
//
// BASELINE PREDICTION, recorded before the run so it can be falsified:
//   PASS: A4 A8 A9   (3)
//   FAIL: A1 A2 A3 A5 A6 A7 A10 A11   (8)
// A baseline that comes back all-green would mean the gate tests nothing and
// must be thrown away, not celebrated.
//
// Run:  node .swarm/runs/cycle-013-gate.mjs        (cwd = repo root)

import fs from 'node:fs';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

// ---- SEALED VALUES, measured on the unfixed tree at cycle 13 --------------
const SEALED_DOMAIN_RULES_SHA =
  'aeca11d7f79642e5ac7589c4adbcb8cc4393011214fdd3e22391e7737a76c812';
const SEALED_MATCHER_SHA =
  '389c3c2a1678ecdc805682c48d5963dc96871cd1ae0041c8f0355df9972d6b28';

const OLD_TEST_NAME = 'README should acknowledge single-entry tag limitation';
const NEW_TEST_NAME =
  'README Tag vocabulary section carries a tag+entry sentence with a single-entry marker (token co-occurrence guard, not a meaning check)';

const results = [];
const check = (id, label, fn) => {
  let ok = false;
  let note = '';
  try {
    const r = fn();
    ok = r === true || (r && r.ok === true);
    note = (r && r.note) || '';
  } catch (e) {
    ok = false;
    note = `threw: ${e.message}`;
  }
  results.push({ id, label, ok, note });
};

const spec = fs.readFileSync('.swarm/SPEC.md', 'utf8');
const testFile = fs.readFileSync('test/readme-tags.test.js', 'utf8');

// The "## Undecided behaviours" section, sliced structurally by its own
// headings rather than pattern-matched out of the surrounding prose.
const undecidedStart = spec.indexOf('## Undecided behaviours');
const undecidedEnd = spec.indexOf('## Definition of done');
const undecided =
  undecidedStart !== -1 && undecidedEnd > undecidedStart
    ? spec.slice(undecidedStart, undecidedEnd)
    : '';

// ---- A1: the D-44 entry exists, inside the Undecided section -------------
check('A1', 'SPEC has a D-44 entry for the empty-value =/space asymmetry', () => {
  if (!undecided) return { ok: false, note: 'Undecided section not sliceable' };
  const hasId = /D-44/.test(undecided);
  const namesFlags = /--author/.test(undecided) && /--tag/.test(undecided);
  const namesEmpty = /\bempty\b/i.test(undecided);
  return {
    ok: hasId && namesFlags && namesEmpty,
    note: `D-44=${hasId} flags=${namesFlags} empty=${namesEmpty}`,
  };
});

// ---- A2: it records all four MEASURED outcomes ---------------------------
check('A2', 'D-44 records the four measured command/exit-code outcomes', () => {
  const need = [
    ["--author ''", 'exit code 0'],
    ['--author=', 'exit code 2'],
    ["--tag ''", 'exit code 1'],
    ['--tag=', 'exit code 2'],
  ];
  const missing = need.filter(([cmd]) => !undecided.includes(cmd)).map(([c]) => c);
  const codes = ['exit code 0', 'exit code 1', 'exit code 2'].filter(
    (c) => !undecided.includes(c)
  );
  return {
    ok: missing.length === 0 && codes.length === 0,
    note: `missing cmds=[${missing}] missing codes=[${codes}]`,
  };
});

// ---- A3: placement — inside Undecided, not appended at EOF ---------------
check('A3', 'D-44 sits inside "## Undecided behaviours", before Definition of done', () => {
  const at = spec.indexOf('D-44');
  return {
    ok: at > undecidedStart && at < undecidedEnd,
    note: `idx D-44=${at} section=[${undecidedStart},${undecidedEnd})`,
  };
});

// ---- A4 [CONTROL]: the 29-clause Domain-rules map did not change ---------
check('A4', 'CONTROL: "## Domain rules" byte-identical to the sealed hash', () => {
  const ds = spec.indexOf('## Domain rules');
  const de = spec.indexOf('## Undecided behaviours');
  const dr = spec.slice(ds, de);
  const sha = crypto.createHash('sha256').update(dr).digest('hex');
  return { ok: sha === SEALED_DOMAIN_RULES_SHA, note: `${sha.slice(0, 16)} vs sealed ${SEALED_DOMAIN_RULES_SHA.slice(0, 16)}` };
});

// ---- A5: names the human owner / tracking item ---------------------------
check('A5', 'D-44 names J-7 as the human-owned tracker', () => {
  const tail = undecided.slice(undecided.indexOf('D-44'));
  return { ok: /J-7/.test(tail), note: `J-7 in D-44 block=${/J-7/.test(tail)}` };
});

// ---- A6: the overclaiming test name is gone ------------------------------
check('A6', 'the old overclaiming test name no longer appears in the test file', () => {
  const n = testFile.split(OLD_TEST_NAME).length - 1;
  return { ok: n === 0, note: `occurrences=${n}` };
});

// ---- A7: the honest test name is present, exactly ------------------------
check('A7', 'the renamed test carries the exact pinned name', () => {
  const n = testFile.split(NEW_TEST_NAME).length - 1;
  return { ok: n === 1, note: `occurrences=${n}` };
});

// ---- A8 [CONTROL]: RENAMED, NOT NARROWED --------------------------------
check('A8', 'CONTROL: token matcher body byte-identical to the sealed hash', () => {
  const bs = testFile.indexOf('const singleEntryMarkers = [');
  const be = testFile.indexOf('assert(hasWarning', bs);
  if (bs === -1 || be === -1) return { ok: false, note: `anchors bs=${bs} be=${be}` };
  const body = testFile.slice(bs, be);
  const sha = crypto.createHash('sha256').update(body).digest('hex');
  return {
    ok: sha === SEALED_MATCHER_SHA,
    note: `${sha.slice(0, 16)} vs sealed ${SEALED_MATCHER_SHA.slice(0, 16)} (${body.length}B)`,
  };
});

// ---- A9 [CONTROL]: suite still 118/118, nothing added or deleted ---------
check('A9', 'CONTROL: node --test test/*.test.js => tests 118 pass 118 fail 0', () => {
  let out = '';
  try {
    out = execSync('node --test test/*.test.js 2>&1', {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    out = `${e.stdout || ''}${e.stderr || ''}`;
  }
  const g = (re) => {
    const m = out.match(re);
    return m ? Number(m[1]) : -1;
  };
  const tests = g(/^# tests (\d+)$/m);
  const pass = g(/^# pass (\d+)$/m);
  const fail = g(/^# fail (\d+)$/m);
  return {
    ok: tests === 118 && pass === 118 && fail === 0,
    note: `tests=${tests} pass=${pass} fail=${fail}`,
  };
});

// ---- A10: the measured premise is recorded in the test file --------------
check('A10', 'test file records the measured premise (0 single-entry tags, 12 distinct)', () => {
  const hasZero = /\b0 tags\b/.test(testFile) && /exactly one entry/i.test(testFile);
  const has12 = /\b12 distinct tags\b/.test(testFile);
  const dated = /2026-08-18/.test(testFile);
  return {
    ok: hasZero && has12 && dated,
    note: `zero=${hasZero} twelve=${has12} dated=${dated}`,
  };
});

// ---- A11: the assertion message stops making the false claim -------------
check('A11', 'assertion message no longer claims the README must acknowledge a limitation', () => {
  const bad = /should acknowledge that some tags appear only once/.test(testFile);
  return { ok: !bad, note: `old message present=${bad}` };
});

// ---- report --------------------------------------------------------------
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.label}${r.note ? `  [${r.note}]` : ''}`);
}
console.log(`\n${pass} PASS / ${fail} FAIL  (of ${results.length})`);
console.log(`controls A4/A8/A9: ${['A4', 'A8', 'A9'].map((id) => `${id}=${results.find((r) => r.id === id).ok ? 'PASS' : 'FAIL'}`).join(' ')}`);
process.exit(fail === 0 ? 0 : 1);
