#!/usr/bin/env node
// run4 cycle 4 — ADJUDICATION of cell G1 of run4-cycle-004-r1attrib.mjs.
// That control file is left BYTE-UNEDITED (standing precedent: run #3 cycles 4/12/14,
// run #4 cycles 1/2/3 — rewriting a gate after it has run destroys the evidence of what
// it measured). This is instrument defect #16 in this repo's recorded history.
//
// THE DEFECT: G1 asserted `# skipped == 2` in the TAP summary. Node's
// --test-skip-pattern FILTERS tests out of the run rather than emitting them as skipped,
// so `# skipped` is 0 by construction and the cell could only ever fail. It failed
// CLOSED — it under-claimed attribution rather than asserting one that was not there —
// which is the direction you want from an instrument that is wrong.
//
// THE REPAIR IS STRONGER THAN THE CELL IT REPLACES. G1 only ever asked "were two tests
// removed?". Two ARBITRARY tests disappearing would have satisfied it. What actually
// matters for attribution is WHICH two, so this measures set identity of the executed
// test names, not their count.
//
// Four columns, because a repair that cannot distinguish its cases is not a repair:
//   A  DEFECT REPRODUCED  the `# skipped` counter really does read 0 on a run that
//                         demonstrably dropped tests
//   B  REPAIR             the removed set is EXACTLY the two named count guards
//   C  CONTROL            the R-1 target guard is NOT among the removed (skipping it
//                         would invalidate G3/G4 entirely)
//   D  CONTROL            a deliberately non-matching skip pattern removes NOTHING, so
//                         column B is not an artefact of skip-pattern always eating tests

import { execFileSync } from 'node:child_process';

const ARM = '/opt/swarm/runs/r1probe/A_baseline';
const SKIP = 'single-entry tag counts?';
const NONSENSE = 'zzz-no-test-has-this-name-zzz';

const EXPECTED_REMOVED = [
  'README must correctly describe single-entry tag count',
  'README opening sentence must state correct multi-entry and single-entry tag counts',
];
const TARGET_GUARD = 'README Tag vocabulary section carries a tag+entry sentence with a single-entry marker (token co-occurrence guard, not a meaning check)';

function names(skipPattern) {
  const args = ['--test', '--test-reporter=tap'];
  if (skipPattern) args.push(`--test-skip-pattern=${skipPattern}`);
  args.push('test/args.test.js', 'test/cli.test.js', 'test/pipe.test.js',
            'test/readme-tags.test.js', 'test/select.test.js');
  let out = '';
  try {
    out = execFileSync('node', args, { cwd: ARM, encoding: 'utf8', stdio: 'pipe', timeout: 180000 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const set = new Set([...out.matchAll(/^(?:not )?ok \d+ - (.*)$/gm)]
    .map((m) => m[1].trim())
    .filter((n) => !/^test\/.*\.test\.js$/.test(n)));
  const sk = out.match(/^# skipped (\d+)$/m);
  return { set, skipped: sk ? +sk[1] : null };
}

const full = names(null);
const cut = names(SKIP);
const noop = names(NONSENSE);

const removed = [...full.set].filter((n) => !cut.set.has(n)).sort();
const expected = [...EXPECTED_REMOVED].sort();

const cols = [
  ['A  DEFECT REPRODUCED: `# skipped` reads 0 despite tests being dropped',
   cut.skipped === 0 && cut.set.size < full.set.size,
   `skipped_counter=${cut.skipped} executed ${full.set.size} -> ${cut.set.size}`],
  ['B  REPAIR: the removed set is EXACTLY the two named count guards',
   JSON.stringify(removed) === JSON.stringify(expected),
   `removed=${JSON.stringify(removed)}`],
  ['C  CONTROL: the R-1 target guard still RAN (was not skipped)',
   cut.set.has(TARGET_GUARD),
   `target_guard_present=${cut.set.has(TARGET_GUARD)}`],
  ['D  CONTROL: a non-matching skip pattern removes NOTHING',
   noop.set.size === full.set.size,
   `executed_with_nonsense_pattern=${noop.set.size} vs ${full.set.size}`],
];

console.log('=== G1 ADJUDICATION (instrument defect #16) ===\n');
let p = 0;
for (const [label, ok, detail] of cols) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  console.log(`         ${detail}`);
  if (ok) p++;
}
console.log(`\n${p} PASS / ${cols.length - p} FAIL of ${cols.length}`);
