// Cycle 9 CONVERSE CONTROL for the README re-citation.
//
// The suite went green after I re-pointed the citation. Green is only evidence if the
// guard was CAPABLE of staying red -- a citation guard that has been accidentally
// disabled (regex no longer matches, test silently skipping, base always resolving
// empty) also reports green, and would look identical from the summary line.
//
// So: mutate the live README back to the STALE base and confirm the guard FAILS, then
// restore and confirm it PASSES again. Both arms must land for the repair to count.
// The file is snapshotted byte-exact and restored in a finally block, so a throw
// cannot leave the tree mutated.

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const README = '/opt/targets/aphorism-cli/README.md';
const TEST = 'test/node-support-citation.test.js';
const CWD = '/opt/targets/aphorism-cli';
const STALE = 'c08562b';   // the base this cycle retired -- known to falsify
const LIVE = 'c9dd7ff';    // the base this cycle installed

const original = fs.readFileSync(README, 'utf8');
const results = [];

// Run ONLY the citation guard, and read its verdict structurally (pass/fail/skip counts)
// rather than by grepping prose -- a SKIP must never be read as a PASS here, because
// "skipped" is precisely the failure mode this control exists to rule out.
function runGuard(label) {
  const r = spawnSync('node', ['--test', TEST], { cwd: CWD, encoding: 'utf8' });
  const num = (k) => {
    const m = r.stdout.match(new RegExp('^[ℹ#]\\s*' + k + ' (\\d+)$', 'm'));
    return m ? Number(m[1]) : null;
  };
  const v = { pass: num('pass'), fail: num('fail'), skipped: num('skipped'), exit: r.status };
  console.log('  [' + label + '] exit=' + v.exit + ' pass=' + v.pass + ' fail=' + v.fail + ' skipped=' + v.skipped);
  return v;
}

try {
  // ARM 1 -- MUST-DIE. Restore the stale base; the guard must FAIL (not skip).
  const staleText = original.replace(
    '`git diff ' + LIVE + '..HEAD -- src bin test .github`',
    '`git diff ' + STALE + '..HEAD -- src bin test .github`'
  );
  if (staleText === original) throw new Error('ARM1 setup failed: live citation string not found -- control cannot run');
  fs.writeFileSync(README, staleText);
  const a1 = runGuard('ARM1 stale base ' + STALE);
  results.push({
    id: 'ARM1', claim: 'stale citation FAILS the guard (and does not skip)',
    pass: a1.fail === 1 && a1.pass === 0 && a1.skipped === 0 && a1.exit !== 0,
    detail: 'fail=' + a1.fail + ' pass=' + a1.pass + ' skipped=' + a1.skipped + ' exit=' + a1.exit
  });

  // ARM 2 -- MUST-LIVE. Restore the live base; the guard must PASS (not skip).
  fs.writeFileSync(README, original);
  const a2 = runGuard('ARM2 live base ' + LIVE);
  results.push({
    id: 'ARM2', claim: 'repaired citation PASSES the guard (and does not skip)',
    pass: a2.pass === 1 && a2.fail === 0 && a2.skipped === 0 && a2.exit === 0,
    detail: 'pass=' + a2.pass + ' fail=' + a2.fail + ' skipped=' + a2.skipped + ' exit=' + a2.exit
  });
} finally {
  fs.writeFileSync(README, original);
  const restored = fs.readFileSync(README, 'utf8') === original;
  console.log('  [restore] README byte-identical to pre-control state: ' + restored);
  results.push({ id: 'ARM3', claim: 'CONTROL LEAVES NO TRACE: README restored byte-exact', pass: restored, detail: 'restored=' + restored });
}

console.log('');
const fails = results.filter((r) => !r.pass);
for (const r of results) console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.claim + '\n        ' + r.detail);
console.log('\n' + (results.length - fails.length) + ' PASS / ' + fails.length + ' FAIL');
process.exit(fails.length ? 1 : 0);
