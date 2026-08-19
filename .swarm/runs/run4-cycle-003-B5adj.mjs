#!/usr/bin/env node
// run #4, cycle 3 — ADJUDICATION of the sealed gate's B5 CONTROL failure.
//
// The sealed gate (run4-cycle-003-gate.mjs, sha256 788171b7…) is left BYTE-UNEDITED.
//
// WHAT HAPPENED. B5 is the only evidence that B1 — M-2's line-preservation audit, the
// load-bearing cell of this whole cycle — is not vacuous. It plants one paraphrased
// line and asserts the audit fires. On the pre-dispatch BASELINE it fired (missing=1).
// Against the finished work it reported missing=0, i.e. THE CONTROL WENT SILENT AT THE
// EXACT MOMENT IT WAS SUPPOSED TO PROVE SOMETHING.
//
// The cause is not subtle once seen. B5 picks its victim line out of the ORIGINAL
// REPORT.md and then string-replaces it inside the NEW REPORT.md. That worked on the
// baseline only because there the two documents were the same file. After the move the
// history lives in docs/report-history.md, so the victim is not in REPORT.md at all,
// `.replace()` matches nothing, and the "mutated" input is byte-identical to the real
// one. B5 was mutating a file the history had already left.
//
// This is a control that passes when the system is untouched and silently stops testing
// once the system changes — the most dangerous shape a check can take, because the run
// that needs it is the run where it stops working.
//
// THE REPAIR, measured in columns. B1 is re-exercised against mutations planted in the
// file the history ACTUALLY lives in, plus controls proving the audit is not merely
// trigger-happy: additions, re-indentation and relocation must all stay silent, because
// M-2 requires preservation, not equality.
//
// Usage: node .swarm/runs/run4-cycle-003-B5adj.mjs

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = '/opt/targets/aphorism-cli';
const SEAL_SHA = '39b681837df404d7abbb4db078c7755411fee1f5';

const preReport = execFileSync('git', ['-C', ROOT, 'show', `${SEAL_SHA}:REPORT.md`],
  { encoding: 'utf8', maxBuffer: 1 << 28 });
const nowReport = readFileSync(`${ROOT}/REPORT.md`, 'utf8');
const nowHist = readFileSync(`${ROOT}/docs/report-history.md`, 'utf8');

// --- B1's audit, transcribed from the sealed gate unchanged -----------------
function lineCounts(txt) {
  const m = new Map();
  for (const raw of txt.split('\n')) {
    const k = raw.trim();
    if (k === '') continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
function audit(parts) {
  const want = lineCounts(preReport);
  const have = new Map();
  for (const p of parts) {
    if (p === null) continue;
    for (const [k, v] of lineCounts(p)) have.set(k, (have.get(k) ?? 0) + v);
  }
  let missing = 0;
  for (const [k, v] of want) if ((have.get(k) ?? 0) < v) missing++;
  return missing;
}

// --- pick victims out of the ORIGINAL, then locate where they now live ------
const origLines = preReport.split('\n').map((l) => l.trim()).filter((l) => l.length > 40 && !l.startsWith('#'));
const counts = lineCounts(preReport);
const unique = origLines.find((l) => counts.get(l) === 1);
const repeated = origLines.find((l) => counts.get(l) > 1);

const rows = [];
const col = (id, name, ok, detail) => rows.push({ id, name, ok: !!ok, detail });

// A — the diagnosis itself, stated as a measurement rather than an assertion.
{
  const inReport = nowReport.includes(unique);
  const inHist = nowHist.includes(unique);
  col('A', 'DIAGNOSIS: B5’s victim is in the appendix, NOT in REPORT.md',
    inReport === false && inHist === true,
    `victim in REPORT.md=${inReport} in appendix=${inHist}`);
}
// B — real state: the audit is clean on the shipped pair.
{
  const m = audit([nowReport, nowHist]);
  col('B', 'UNMUTATED shipped pair — audit clean', m === 0, `missing=${m}`);
}
// C — paraphrase a line IN THE APPENDIX: the audit must fire.
{
  const mutated = nowHist.replace(unique, unique.replace(/\s+/g, '  ') + ' (tidied)');
  const fired = mutated !== nowHist && audit([nowReport, mutated]) > 0;
  col('C', 'paraphrase one appendix line — audit FIRES', fired,
    `missing=${audit([nowReport, mutated])} applied=${mutated !== nowHist}`);
}
// D — delete a line from the appendix: the audit must fire.
{
  const mutated = nowHist.split('\n').filter((l) => l.trim() !== unique).join('\n');
  const m = audit([nowReport, mutated]);
  col('D', 'delete one appendix line — audit FIRES', m > 0, `missing=${m}`);
}
// E — MULTISET, not set: drop ONE of several copies; the audit must still fire.
{
  let dropped = false;
  const mutated = nowHist.split('\n').filter((l) => {
    if (!dropped && l.trim() === repeated) { dropped = true; return false; }
    return true;
  }).join('\n');
  const m = audit([nowReport, mutated]);
  col('E', 'drop ONE of several copies — audit FIRES (multiset, not set)', dropped && m > 0,
    `copies=${counts.get(repeated)} dropped=${dropped} missing=${m}`);
}
// F — CONTROL: adding new prose must NOT fire. M-2 requires preservation, not equality.
{
  const m = audit([nowReport + '\nA brand new sentence that never appeared before.\n', nowHist]);
  col('F', 'CONTROL: adding new prose stays SILENT', m === 0, `missing=${m}`);
}
// G — CONTROL: re-indenting must NOT fire (the audit trims by design).
{
  const mutated = nowHist.replace('\n' + unique, '\n      ' + unique + '   ');
  const m = audit([nowReport, mutated]);
  col('G', 'CONTROL: re-indenting a preserved line stays SILENT', m === 0, `missing=${m}`);
}
// H — CONTROL: relocation must NOT fire. The rule is about the CONCATENATION.
{
  const moved = nowHist.replace('\n' + unique, '');
  const m = audit([nowReport + '\n' + unique + '\n', moved]);
  col('H', 'CONTROL: moving a line between the two files stays SILENT', m === 0, `missing=${m}`);
}
// I — CONTROL: the audit is not satisfied by the appendix alone being large.
{
  const m = audit([nowReport, nowHist.split('\n').slice(0, 200).join('\n')]);
  col('I', 'CONTROL: truncating the appendix FIRES loudly', m > 500, `missing=${m}`);
}

let ok = 0;
for (const r of rows) {
  if (r.ok) ok++;
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.id}  ${r.name.padEnd(60)} ${r.detail}`);
}
console.log(`  ${ok} / ${rows.length} columns as expected`);
console.log(`  victim(unique)   "${(unique ?? '').slice(0, 72)}"`);
console.log(`  victim(repeated) "${(repeated ?? '').slice(0, 72)}"  x${counts.get(repeated)}`);
process.exit(ok === rows.length ? 0 : 1);
