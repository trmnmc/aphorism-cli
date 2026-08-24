#!/usr/bin/env node
// cycle-008-gate-c13-addendum.mjs — re-take C13 as the TWO independent checks it
// actually was, because rolling them into one verdict hid which half failed.
//
// The original C13 asserted (a) no scratch tree survives and (b) REPORT.md's
// commit count is the real one, and returned a single FAIL. Split here:
//
//   C13a — scratch tree: PASSES.
//   C13b — commit count: the report says "13 commits, `912a2a4`..`d899fe0`".
//          `git rev-list --count 912a2a4..d899fe0` = 12, because git's `A..B`
//          EXCLUDES A. But 912a2a4 is itself run #8's cycle-0 KICKOFF commit
//          (its parent, 20b7ede, is run #7's wrap-up and this run's baseline),
//          so the run really has made 13 commits. The NUMBER is true of the run;
//          the RANGE NOTATION printed beside it selects 12. Both facts are
//          measured below rather than asserted.
//
// This is NOT rounded into a failure of W-10. W-10's acceptance clause requires
// the measured test/ before/after, the findings→executables ledger, the S-7
// escalation, and NOT-RUN honesty — it carries no commit-count clause at all,
// and the cycle count that WRAP_UP does require ("0 through 7 complete, cycle 8
// in progress") is correct. Same ruling shape as D-R8-7 and D-R8-8: recorded as
// a new backlog item (P-3) with the exact defect, not buried and not inflated.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const T = '/opt/targets/aphorism-cli';
const git = (...a) => spawnSync('git', ['-C', T, ...a], { encoding: 'utf8' }).stdout ?? '';
const rep = readFileSync(`${T}/REPORT.md`, 'utf8');

console.log('C13a — no scratch tree survives into the commit');
const scratch = spawnSync('ls', ['-a', T], { encoding: 'utf8' }).stdout.split('\n').filter((f) => /scratch/i.test(f));
console.log(`  scratch entries in target root: ${JSON.stringify(scratch)}`);
console.log(`  --> C13a: ${scratch.length === 0 ? 'PASS' : 'FAIL'}`);

console.log('\nC13b — the commit-count claim, adjudicated by measurement');
const claimLine = (rep.split('\n').find((l) => l.includes('912a2a4')) || '').trim();
const exclusive = Number(git('rev-list', '--count', '912a2a4..d899fe0').trim());
const inclusive = Number(git('rev-list', '--count', '912a2a4^..d899fe0').trim());
const kickoff = git('show', '--no-patch', '--format=%h %s', '912a2a4').trim();
const baseline = git('show', '--no-patch', '--format=%h %s', '912a2a4^').trim();
const claimed = Number((claimLine.match(/\((\d+) commits/) || [])[1]);
console.log(`  REPORT.md line: ${claimLine}`);
console.log(`  claimed count: ${claimed}`);
console.log(`  git rev-list --count 912a2a4..d899fe0   = ${exclusive}   (git's A..B EXCLUDES A)`);
console.log(`  git rev-list --count 912a2a4^..d899fe0  = ${inclusive}   (inclusive of 912a2a4)`);
console.log(`  912a2a4 is: ${kickoff}`);
console.log(`  its parent: ${baseline}`);
console.log('');
console.log(`  NUMBER true of the run's own commits?   ${claimed === inclusive ? 'YES' : 'NO'}  (${claimed} vs ${inclusive})`);
console.log(`  NOTATION beside it selects that number? ${claimed === exclusive ? 'YES' : 'NO'}  (${claimed} vs ${exclusive})`);
console.log('');
console.log('  VERDICT: the count is right and the range notation is wrong by one commit.');
console.log('  A reader who runs the printed range gets 12 and concludes the report is off by one.');
console.log('  Correct forms: `912a2a4^..d899fe0`, or the prose "912a2a4 through d899fe0".');
console.log(`  --> C13b: DEFECT CONFIRMED (filed as backlog item P-3, beyond W-10's clause)`);

// Converse control: a notation check that cannot fire is not a check. Prove the
// same comparison ACCEPTS a correctly-notated claim.
const wouldPass = 12 === exclusive;
console.log('\n  converse control — the same comparison applied to a correctly-notated claim');
console.log(`  hypothetical claim "(12 commits, 912a2a4..d899fe0)" -> accepted: ${wouldPass}`);
console.log(`  hypothetical claim "(13 commits, 912a2a4^..d899fe0)" -> accepted: ${13 === inclusive}`);
console.log(`  --> converse control: ${wouldPass && 13 === inclusive ? 'GREEN' : 'RED'}`);
