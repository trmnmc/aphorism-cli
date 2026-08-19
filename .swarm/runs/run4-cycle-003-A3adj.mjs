#!/usr/bin/env node
// run #4, cycle 3 — ADJUDICATION of the sealed gate's A3 FAIL.
//
// The sealed gate (run4-cycle-003-gate.mjs, sha256 788171b7…) is left BYTE-UNEDITED.
// Rewriting a gate after it runs destroys the evidence of what it measured; the repair
// is a separate artifact, and it is only a repair if it is measured in columns that
// prove it did not simply open the gate.
//
// THE DEFECT: A3's overclaim list contains /proven\s+minimal/i with no negation guard.
// The README says "It is **not proven minimal**" — the honest disclaimer A3 exists to
// require. A3 read its input correctly and reached the opposite of the right verdict,
// because a substring test cannot see the word in front of it.
//
// Note this is the SECOND consecutive cycle whose A3 cell misfired, and the two are
// different species: cycle 2's A3 encoded a MEANS where the item stated an END; this
// one encodes a PHRASE where the item states a CLAIM.
//
// Usage: node .swarm/runs/run4-cycle-003-A3adj.mjs

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = '/opt/targets/aphorism-cli';
const SEAL_SHA = '39b681837df404d7abbb4db078c7755411fee1f5';

const realReadme = readFileSync(`${ROOT}/README.md`, 'utf8');
const preReadme = execFileSync('git', ['-C', ROOT, 'show', `${SEAL_SHA}:README.md`], { encoding: 'utf8' });

const OVERCLAIM = [
  /minimum\s+supported/i,
  /proven\s+minimal/i,
  /lowest\s+supported\s+version/i,
  /guaranteed\s+to\s+(?:work|run)\s+on\s+node\s*1[0-7]/i,
  /does\s+not\s+(?:work|run)\s+on\s+node\s*1[0-7]/i,
  /node\s*1[0-7][^\d].{0,40}\bfails?\b/i,
];
const HONEST = [
  /lowest\s+version\s+(?:actually\s+)?tested/i,
  /verified[- ]at[- ]18/i,
  /lowest\s+(?:node\s+)?version\s+(?:in|on)\s+the\s+matrix/i,
  /nothing\s+(?:here\s+)?tests?\s+node\s*1[0-7]/i,
  /not\s+proven\s+minimal/i,
];

// --- A3 exactly as sealed -------------------------------------------------
function a3Sealed(txt) {
  const honest = HONEST.some((r) => r.test(txt));
  const over = OVERCLAIM.filter((r) => r.test(txt));
  return honest && over.length === 0;
}

// --- A3 repaired ----------------------------------------------------------
// Only change: a phrase carried under a negator is not an assertion of that phrase.
// The overclaim list, the honest list, and the conjunction are untouched.
const NEGATED = /\b(?:not|never|isn'?t|aren'?t|no|nor)\b[^.!?\n]{0,40}?(?=minimum\s+supported|proven\s+minimal|lowest\s+supported\s+version)/gi;
function stripNegated(txt) {
  // blank out "not … proven minimal" spans (negator through the phrase) before testing
  return txt.replace(
    /\b(?:not|never|isn'?t|aren'?t|no|nor)\b([^.!?\n]{0,40}?)(minimum\s+supported|proven\s+minimal|lowest\s+supported\s+version)/gi,
    (m, mid) => `NEGATED${mid.replace(/\S/g, '.')}NEGATED`,
  );
}
function a3Fixed(txt) {
  const honest = HONEST.some((r) => r.test(txt));
  const probe = stripNegated(txt);
  const over = OVERCLAIM.filter((r) => r.test(probe));
  return honest && over.length === 0;
}

// --- decoys ---------------------------------------------------------------
const HONEST_TAIL = '\n18 is the lowest version actually tested.\n';
const decoyAssert = realReadme.replace('It is **not proven minimal**', 'It is the proven minimal runtime');
const decoyMinSup = realReadme.replace('It is **not proven minimal**', 'Node 18 is the minimum supported runtime');
const decoyNoHonest = `# r\nCI ran on Node 18, 20, 22 and 24. All green.\n`;
const decoyBoth = `# r${HONEST_TAIL}But Node 18 is the minimum supported version.\n`;

const cols = [
  ['A', 'UNFIXED A3 on the REAL README — must MISS',
    a3Sealed(realReadme) === false, `sealed verdict=${a3Sealed(realReadme)}`],
  ['B', 'FIXED A3 on the REAL README — recovers truth',
    a3Fixed(realReadme) === true, `fixed verdict=${a3Fixed(realReadme)}`],
  ['C', 'CONTROL: asserts "the proven minimal runtime" — still REJECTED',
    a3Fixed(decoyAssert) === false, `verdict=${a3Fixed(decoyAssert)}`],
  ['D', 'CONTROL: asserts "minimum supported runtime" — still REJECTED',
    a3Fixed(decoyMinSup) === false, `verdict=${a3Fixed(decoyMinSup)}`],
  ['E', 'CONTROL: no honest disclaimer at all — still REJECTED',
    a3Fixed(decoyNoHonest) === false, `verdict=${a3Fixed(decoyNoHonest)}`],
  ['F', 'CONTROL: honest phrase AND a real overclaim — still REJECTED',
    a3Fixed(decoyBoth) === false, `verdict=${a3Fixed(decoyBoth)}`],
  ['G', 'CONTROL: pre-dispatch README — still REJECTED (no lost discrimination)',
    a3Fixed(preReadme) === false, `verdict=${a3Fixed(preReadme)}`],
  ['H', 'CONTROL: the fix is NARROW — sealed and fixed agree on all 5 decoys',
    [decoyAssert, decoyMinSup, decoyNoHonest, decoyBoth, preReadme]
      .every((t) => a3Sealed(t) === a3Fixed(t)),
    'sealed==fixed on every non-negated input'],
];

let ok = 0;
for (const [id, name, pass, detail] of cols) {
  if (pass) ok++;
  console.log(`  ${pass ? 'PASS' : 'FAIL'} ${id}  ${name.padEnd(62)} ${detail}`);
}
console.log(`  ${ok} / ${cols.length} columns as expected`);
process.exit(ok === cols.length ? 0 : 1);
