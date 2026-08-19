#!/usr/bin/env node
// ---------------------------------------------------------------------------
// run #4, cycle 2 — ADJUDICATION of the sealed gate's single FAIL (cell A3).
//
// The sealed gate (sha256 46e6da99…) is left BYTE-UNEDITED. This is a SEPARATE
// artifact, measured in five columns rather than asserted, following the additive
// repair pattern this repo has now used for 14 instrument defects.
//
// WHAT A3 ASSERTED:  the workflow's `on:` block must contain `branches: … master`.
// WHAT N-1 ACTUALLY NEEDS: a push to the default branch must TRIGGER the workflow.
// The builder wrote a bare `push:` with no branch filter, which fires on EVERY
// branch — master included — and therefore cannot mis-name the branch at all.
// A3 encoded a MEANS (name the branch) where the item's acceptance states an END
// (it runs on push). So A3 rejects a file that satisfies the end.
//
// That is a claim about GitHub's semantics, and a parser cannot settle it. This
// script only establishes that the cell is blind to a legitimate form WITHOUT
// becoming blind to the real hazard. The DECISIVE evidence is separate and live:
// the conductor pushes and reads `gh run list` — either a run exists or it does not.
// ---------------------------------------------------------------------------
import fs from 'node:fs';

const REAL = fs.readFileSync('/opt/targets/aphorism-cli/.github/workflows/test.yml', 'utf8');

// --- the UNFIXED cell, copied verbatim out of the sealed gate ---------------
function unfixedA3(text) {
  const hasPush = /(^|\n)\s*push\s*:/.test(text);
  const namesMaster = /branches\s*:.*master/s.test(text.split(/\n\s*jobs\s*:/)[0] || '');
  const hasDispatch = /workflow_dispatch\s*:/.test(text);
  return hasPush && namesMaster && hasDispatch;
}

// --- the FIXED cell: asks whether a push to `master` triggers the workflow ---
function fixedA3(text, defaultBranch = 'master') {
  const head = text.split(/\n\s*jobs\s*:/)[0] || '';
  const hasDispatch = /workflow_dispatch\s*:/.test(head);
  const pushIdx = head.search(/(^|\n)\s*push\s*:/);
  if (pushIdx === -1) return { ok: false, why: 'no push trigger' };

  // the push block runs to the next top-level `on:` key at the same indent
  const after = head.slice(pushIdx).replace(/^\s*\n?\s*push\s*:/, '');
  const pushBlock = after.split(/\n(?=\s{0,2}\S)/)[0] || '';

  const allow = pushBlock.match(/branches\s*:\s*\[([^\]]*)\]/);
  const allowBlock = pushBlock.match(/branches\s*:\s*\n((?:\s*-\s*[^\n]+\n?)+)/);
  const deny = pushBlock.match(/branches-ignore\s*:\s*\[([^\]]*)\]/);

  const list = (m, b) => (m ? m[1].split(',') : b ? b[1].split('\n') : [])
    .map((s) => s.replace(/^\s*-\s*/, '').trim().replace(/['"]/g, '')).filter(Boolean);

  if (deny) {
    const denied = list(deny, null);
    const hit = denied.includes(defaultBranch);
    return { ok: !hit && hasDispatch, why: 'branches-ignore=[' + denied.join(',') + ']' };
  }
  if (allow || allowBlock) {
    const allowed = list(allow, allowBlock);
    const hit = allowed.some((p) => p === defaultBranch || p === '*' || p === '**');
    return { ok: hit && hasDispatch, why: 'branches=[' + allowed.join(',') + '] covers ' + defaultBranch + '=' + hit };
  }
  return { ok: hasDispatch, why: 'unfiltered push — fires on every branch incl. ' + defaultBranch };
}

const SYN_MAIN_ONLY = 'on:\n  push:\n    branches: [main]\n  workflow_dispatch:\njobs:\n  test:\n';
const SYN_NO_PUSH = 'on:\n  workflow_dispatch:\njobs:\n  test:\n';
const SYN_MASTER = 'on:\n  push:\n    branches: [master]\n  workflow_dispatch:\njobs:\n  test:\n';

const cols = [
  ['A', 'UNFIXED A3 on the REAL file — must MISS (reproduces the sealed FAIL)',
    () => unfixedA3(REAL) === false, () => 'unfixed verdict=' + unfixedA3(REAL)],
  ['B', 'FIXED A3 on the REAL file — must recover the truth',
    () => fixedA3(REAL).ok === true, () => 'fixed verdict=' + fixedA3(REAL).ok + ' :: ' + fixedA3(REAL).why],
  ['C', 'CONTROL: FIXED A3 on a `branches: [main]`-only workflow — must still REJECT',
    () => fixedA3(SYN_MAIN_ONLY).ok === false, () => 'verdict=' + fixedA3(SYN_MAIN_ONLY).ok + ' :: ' + fixedA3(SYN_MAIN_ONLY).why],
  ['D', 'CONTROL: FIXED A3 on a workflow with NO push trigger — must REJECT',
    () => fixedA3(SYN_NO_PUSH).ok === false, () => 'verdict=' + fixedA3(SYN_NO_PUSH).ok + ' :: ' + fixedA3(SYN_NO_PUSH).why],
  ['E', 'CONTROL: FIXED A3 on an explicit `branches: [master]` — must ACCEPT (no regression)',
    () => fixedA3(SYN_MASTER).ok === true, () => 'verdict=' + fixedA3(SYN_MASTER).ok + ' :: ' + fixedA3(SYN_MASTER).why],
];

let pass = 0;
console.log('run #4 cycle 2 — A3 adjudication, five columns\n');
for (const [id, desc, test, detail] of cols) {
  const ok = test();
  if (ok) pass++;
  console.log((ok ? 'PASS ' : 'FAIL ') + id + '  ' + desc + '\n        ' + detail());
}
console.log('\n' + pass + ' / ' + cols.length + ' columns as expected');
console.log('\nNOTE: columns C and D are what make this a repair rather than a loosening —');
console.log('the corrected cell still rejects a main-only trigger and a missing push trigger,');
console.log('the two ways N-1 could actually have been wrong. Column E shows the form the');
console.log('sealed gate expected is not regressed. The live `gh run list` check settles it.');
process.exit(pass === cols.length ? 0 : 1);
