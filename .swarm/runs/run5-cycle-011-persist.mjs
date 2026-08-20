// WRAP_UP persist, run #5 cycle 11. Atomic (.tmp -> rename) per cycle.md step 7.
// Closes P-5 on the closing-gate evidence, sets phase DONE, records the DONE decision.

import fs from 'node:fs';

const NOW = process.argv[2];               // ISO timestamp, passed in — scripts have no clock
if (!NOW) { console.error('usage: node run5-cycle-011-persist.mjs <iso-ts>'); process.exit(2); }

const writeAtomic = (p, obj) => {
  fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2));
  fs.renameSync(p + '.tmp', p);
};

// ---------- backlog ----------
const BL = '.swarm/backlog.json';
const bl = JSON.parse(fs.readFileSync(BL, 'utf8'));
const p5 = bl.items.find((i) => i.id === 'P-5');
if (!p5) { console.error('P-5 not found'); process.exit(1); }

p5.status = 'done';
p5.notes = (p5.notes || '') +
  ' | cycle 11 CLOSING GATE: acceptance met at the run\'s final code-bearing HEAD 9794dd9. ' +
  'Suite re-run by the conductor on a full clone: tests 121 / pass 121 / fail 0 / skipped 0 ' +
  '(node v24.19.0), against the >=119 floor. Actions matrix 4/4 green on 9794dd9 ' +
  '(run 32338243331: 121 tests / 119 pass / 0 fail / 2 skipped on each of v18.20.8, v20.20.2, ' +
  'v22.23.2, v24.19.0 — the 2 skips are both arms of the citation guard standing down on ' +
  'CI\'s shallow checkout, which is the guard refusing to pass on evidence it cannot read). ' +
  'Zero features and zero dependencies (no package.json exists, so this holds by construction). ' +
  'src/corpus.js byte-identical: last touched at 64a465f on 2026-08-18, during run #4. ' +
  'THE RECORDED EXCEPTION STANDS AND IS NOT RE-LABELLED: three intermediate commits ' +
  '(5f833ab c5, c08562b c6, 2b003ea c10) were knowingly RED on a full clone between push and ' +
  're-citation, for the structural reason filed as P-7. Reported as an exception, never as a pass.';

const counts = bl.items.reduce((a, i) => ((a[i.status] = (a[i.status] || 0) + 1), a), {});
writeAtomic(BL, bl);

// ---------- state ----------
const ST = '.swarm/state.json';
const st = JSON.parse(fs.readFileSync(ST, 'utf8'));

st.phase = 'DONE';
st.cycle = 11;
st.counters = st.counters || {};
st.counters.consecutive_no_value = 0;
st.counters.wave_autotune_note_cycle11 =
  'Wave autotune NOT applied. cycle.md scopes it to "after a build-wave\'s merges + ' +
  'verification complete"; cycle 11 dispatched no agents at all — it is the DONE decision ' +
  'plus WRAP_UP. k_current stays 3, wave_streak stays 1. Same call and same reason as ' +
  'cycles 6, 7 and 9.';

st.decisions = st.decisions || [];
st.decisions.push({
  cycle: 11,
  ts: NOW,
  what: 'Declared the target DONE and entered WRAP_UP with ~19.4h left on the clock, rather than manufacturing a POLISH item to fill the un-run gate stage.',
  why: 'The DONE test is definition-of-done met AND no VALUE_LOOP candidate clearing the ratchet. ' +
       'Both were checked against the tree, not against the journal: all five must-haves closed; ' +
       'suite 121/121 green; matrix 4/4 green on HEAD; corpus byte-identical since run #4; zero deps. ' +
       'The POLISH stage had not run, and I looked for fodder before concluding there was none: ' +
       'every remaining backlog polish item (TS-1/2/3/6) is blocked on a human lifting a locked ' +
       'non-goal; the README\'s user-facing prose is shaped by live regex guards, so rewriting it ' +
       'fights the guards this run exists to keep honest; and TS-6\'s documentary half is already ' +
       'shipped in README, leaving only a --help change, which is shipped program output and so ' +
       'is forbidden by P-5\'s own "no new user-visible behaviour" clause. Leaning on a permissive ' +
       'sentence in a blocked item\'s notes to authorise that change would have been opening the ' +
       'gate by weakening it, in scope terms. SPEC.md pre-authorises this call in "Expected shape ' +
       'of this run": an early finish is the honest outcome here, not a failure.',
});

st.decisions.push({
  cycle: 11,
  ts: NOW,
  what: 'Minted playbook lesson L-047 and archived L-021 to hold the 20-lesson cap, rather than merging the run\'s sharpest finding into L-041.',
  why: 'L-041 covers instruments that UNDER-report a real failure; this run\'s finding is the ' +
       'over-report direction — 7 of 7 sealed-gate FAILs (c8, c10) were defects in the conductor\'s ' +
       'own instrument and 0 were defects in the dispatched work. Opposite blast radius, opposite ' +
       'remedy, and L-041 is already five clauses deep. The cap forced one drop; the tie-break ' +
       '(most-recent-observation date, then lowest id) and its cost are recorded in ' +
       'SWARM/playbook/DROP-RATIONALE-2026-08-20.md rather than left implicit.',
});

writeAtomic(ST, st);

console.log('backlog status counts:', JSON.stringify(counts));
console.log('phase:', st.phase, '| cycle:', st.cycle, '| decisions:', st.decisions.length);
console.log('P-5:', p5.status);
