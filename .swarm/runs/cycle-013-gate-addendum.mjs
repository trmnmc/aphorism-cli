// cycle-013 GATE ADDENDUM — the corrected A9 control.
//
// AUTHORED AFTER THE BASELINE RAN. This file did not exist when
// cycle-013-gate.mjs was sealed (adf046b8…) or when its baseline was
// captured, and it therefore pre-commits NOTHING. Read it as a repair of a
// broken instrument, never as part of the sealed evidence.
//
// WHY IT EXISTS. The sealed gate's A9 control asserted the suite was still
// 118/118/0 by matching /^# tests (\d+)$/m — the TAP reporter's format. Node
// runs `node --test` through the SPEC reporter here, which emits "ℹ tests
// 118". So A9 read tests=-1 and reported FAIL against a suite that is in
// fact green. Measured directly, the property HOLDS:
//
//     $ node --test test/*.test.js 2>&1 | tail -12
//     ℹ tests 118
//     ℹ pass 118
//     ℹ fail 0
//
// The sealed gate is deliberately NOT edited (cycle-4 precedent, restated at
// cycle 12): an assertion rewritten after it has run no longer records what
// it measured. The sealed file stands at 2 PASS / 9 FAIL with A9 adjudicated
// here as a FALSE FAIL.
//
// THIS IS THE SIXTH INSTRUMENT BUG OF RUN #3 AND THE THIRD INSIDE A GATE I
// SEALED MYSELF. It is a new sub-species, worth naming separately from the
// substring-vs-structural family the cycle-12 addendum catalogued: this one
// is a FORMAT ASSUMPTION — the check assumed an output dialect of the tool it
// was measuring, and a tool that speaks a second dialect returns not a wrong
// answer but NO answer, which the check then scored as failure. A parser that
// cannot find its field must report UNPARSEABLE, not FAIL; the two are
// different verdicts and collapsing them manufactures a defect. The standing
// lesson is unchanged and now has a sixth data point: a gate is a program and
// needs its own baseline, not confidence.
//
// Run:  node .swarm/runs/cycle-013-gate-addendum.mjs      (cwd = repo root)

import { execSync } from 'node:child_process';

let out = '';
try {
  out = execSync('node --test test/*.test.js 2>&1', {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  out = `${e.stdout || ''}${e.stderr || ''}`;
}

// Accept BOTH reporter dialects, and distinguish "unparseable" from "wrong".
const grab = (field) => {
  const m = out.match(new RegExp(`^[#ℹ]\\s*${field} (\\d+)\\s*$`, 'm'));
  return m ? Number(m[1]) : null;
};

const tests = grab('tests');
const pass = grab('pass');
const fail = grab('fail');

if (tests === null || pass === null || fail === null) {
  console.log(`UNPARSEABLE  A9'  could not locate the count fields in either reporter dialect`);
  console.log(`  tail: ${out.split('\n').slice(-8).join(' | ')}`);
  process.exit(2); // NOT exit 1 — an unread instrument is not a failed suite.
}

const ok = tests === 118 && pass === 118 && fail === 0;
console.log(
  `${ok ? 'PASS' : 'FAIL'}  A9'  CONTROL (corrected): suite is 118/118/0  [tests=${tests} pass=${pass} fail=${fail}]`
);

// Negative control on the PARSER itself, so this replacement is not taken on
// trust the way the original was: feed it a TAP-shaped and a spec-shaped
// sample and require it reads both, plus a garbage sample it must refuse.
const probe = (sample) => {
  const m = sample.match(/^[#ℹ]\s*tests (\d+)\s*$/m);
  return m ? Number(m[1]) : null;
};
const tap = probe('# tests 118\n# pass 118\n# fail 0\n');
const spec = probe('ℹ tests 118\nℹ pass 118\nℹ fail 0\n');
const junk = probe('all good, everything passed\n');
const parserOk = tap === 118 && spec === 118 && junk === null;
console.log(
  `${parserOk ? 'PASS' : 'FAIL'}  A9'-control  parser reads both dialects and refuses garbage  [tap=${tap} spec=${spec} junk=${junk}]`
);

process.exit(ok && parserOk ? 0 : 1);
