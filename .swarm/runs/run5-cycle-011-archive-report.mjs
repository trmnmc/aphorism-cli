// WRAP_UP helper, run #5 cycle 11: move run #4's REPORT.md into the history appendix
// VERBATIM before REPORT.md is rewritten for run #5.
//
// Why this exists: SPEC.md non-goals forbid "deleting or rewriting any historical claim,
// cycle citation, or dated row". Overwriting REPORT.md in place would delete run #4's
// dated claims outright, so they are appended byte-for-byte here first and the append is
// verified by re-reading the file and comparing the tail to the source.

import fs from 'node:fs';

const HIST = 'docs/report-history.md';
const REP = 'REPORT.md';

const body = fs.readFileSync(REP, 'utf8');
const before = fs.readFileSync(HIST, 'utf8');

const header = [
  '',
  '',
  '---',
  '',
  '# Improvement run #4 — REPORT.md as it stood at 2026-08-19 close',
  '',
  'Moved here verbatim on 2026-08-20 at the improvement run #5 WRAP_UP, under the same rule',
  'as the move above: run #5 SPEC.md non-goals forbid "deleting or rewriting any historical',
  'claim, cycle citation, or dated row". Every line below is unchanged and in its original',
  'order, including its own now-superseded counts (119 tests; 19 backlog items; 7 blocked)',
  'and its own "this document" self-references, which describe REPORT.md as it existed',
  'before this move.',
  '',
  '',
].join('\n');

fs.writeFileSync(HIST, before + header + body);

// Verify the append rather than assume it: the file must end with the source byte-for-byte,
// and nothing that was there before may have moved.
const after = fs.readFileSync(HIST, 'utf8');
const tailOk = after.endsWith(body);
const prefixOk = after.startsWith(before);
const grew = after.length - before.length;

console.log('appended bytes:      ', grew);
console.log('source bytes:        ', body.length);
console.log('tail === source:     ', tailOk);
console.log('prior content intact:', prefixOk);
console.log('VERDICT:', tailOk && prefixOk && grew === header.length + body.length ? 'PASS' : 'FAIL');
