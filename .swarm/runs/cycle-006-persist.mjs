// cycle-006 state persistence.
import fs from 'node:fs';

const sp = '/opt/targets/aphorism-cli/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(sp, 'utf8'));

s.cycle = 6;
s.qa = s.qa || {};
s.qa.run5_review_fix_cycle = 6;
s.qa.run5_gate_note =
  'RUN-SCOPED KEY NAMES ON PURPOSE. last_full_qa_cycle / last_taste_cycle in this object are ' +
  'RUN #3 numbers carried forward and are NOT evidence for run #5 — reading them as this run’s ' +
  'is the exact error run #3 cycle 12 caught and run #4 cycle 5 avoided. Run #5 has now paid ' +
  'REVIEW-FIX (cycle 6). QA-full and TASTE remain OWED before POLISH / VALUE_LOOP.';

s.counters = s.counters || {};
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
s.counters.wave_autotune_note_cycle6 =
  'Wave autotune NOT applied this cycle. cycle.md scopes it to “after a build-wave’s merges + ' +
  'verification complete”; this cycle’s work type was review-fix, not build-wave. k_current stays 3 ' +
  'and wave_streak stays 1. Recorded because silently crediting a review-fix pass as a clean build ' +
  'wave would inflate k on evidence autotune was never defined over — and the gear cap of 1 binds ' +
  'first regardless, so the credit would have bought nothing but a wrong number.';

s.decisions.push({
  cycle: 6,
  kind: 'method',
  what:
    'Ran REVIEW-FIX instead of the DONE decision cycle 5 handed forward, and pointed stage 2 at ' +
    'the reviewer’s CLEAN VERDICT rather than at findings, because there were none.',
  why:
    'ON THE WORK TYPE: cycle 5’s hand-off asked cycle 6 to run VALUE_LOOP/DONE. cycle.md step 4 ' +
    'outranks a prior cycle’s suggestion — it places ONE review-fix, ONE QA and ONE TASTE pass ' +
    'after BUILD and before POLISH, and run #5 had run NONE of the three. This is the identical ' +
    'call run #4 cycle 5 made, for the identical reason, and the trap it avoids is one this repo ' +
    'has already paid for: run #3 cycle 8 declared DONE and was wrong four times over, every error ' +
    'tracing to a mandatory gate that had never run while the bookkeeping said it had. The qa ' +
    'markers in this object (last_full_qa_cycle 7, last_taste_cycle 9) are RUN #3 numbers carried ' +
    'forward; this cycle added run-scoped keys so a later cycle cannot misread them. ' +
    'ON THE STAGE-2 ADAPTATION, which is the part worth recording: the review-fix contract sends ' +
    'stage-1 findings to adversarial verifiers that must REPRODUCE them, discarding what cannot be ' +
    'reproduced. Stage 1 returned ZERO findings, so that pipeline had nothing to consume and the ' +
    'pass would have closed as clean. But the reviewer had been demoted from its table seat (opus) ' +
    'to sonnet by gear 1, and a cheap reviewer’s characteristic failure is not a wrong finding — ' +
    'it is SILENCE, which from outside is indistinguishable from a clean surface. So the fable ' +
    'verifier was aimed at the clean verdict itself, with the reviewer’s five specific claims ' +
    'restated as attack targets and an explicit instruction that UPHELD requires describing what ' +
    'was mutated. It refuted three of the five. Had stage 2 been skipped for want of findings, all ' +
    'three would have shipped under the label “reviewed clean”.',
  consequence:
    'Three findings, every one reproduced independently by the conductor before anything changed. ' +
    'RF-1 fixed by dispatch under a sealed gate (10 PASS / 0 FAIL); RF-2 and RF-3 by conductor ' +
    'repair. RF-4 filed from a CI annotation, not fixed. QA-full and TASTE are still owed by run #5.',
});

s.decisions.push({
  cycle: 6,
  kind: 'verification',
  what:
    'The sealed gate scored 10/10 immediately after the fix, then 8/10 when re-run later against a ' +
    'byte-identical fix. Both later FAILs are cells run OUTSIDE the window they were authored to ' +
    'score. Adjudicated, with the gate left BYTE-UNEDITED at sha256 9d3743cb.',
  why:
    'B9 asks whether the only changed tracked path outside .swarm/ is the guard file — i.e. whether ' +
    'the FIXER edited README.md to make the guard agree with it. That question is about the dispatch ' +
    'window, and by the re-run the window had closed: the fix was committed at c08562b and README.md ' +
    'was dirty because the CONDUCTOR was performing the re-citation round trip the section itself ' +
    'prescribes. The cell measured the right property at the wrong moment. It is answered decisively ' +
    'and independently of the cell by the commit: c08562b touches .github/workflows/test.yml, ' +
    'docs/coverage-baseline.md, test/node-support-citation.test.js and two .swarm artifacts, and ' +
    'README.md is ABSENT from it. ' +
    'B6 requires that a genuine depth-1 clone still SKIP — the must-not-overreach control protecting ' +
    'the CI path. It returned PASS, and that is a TRUE reading of a transient state rather than a ' +
    'regression: mid-round-trip the working tree cited c08562b while HEAD WAS c08562b, so the cited ' +
    'base was present even in a depth-1 clone and the guard could evaluate it for once. RESOLVED BY ' +
    'MEASUREMENT RATHER THAN BY ARGUMENT: the re-citation was committed, HEAD moved past the cited ' +
    'base, and the gate re-run returned B6 to SKIP. ' +
    'WHY THIS IS NOT AN INSTRUMENT DEFECT, which matters because this repo has filed 23 of those and ' +
    'the count should stay honest: neither cell was wrong about the world — both reported accurately, ' +
    'and what moved underneath them was which moment they sampled. The lesson is narrower and newer ' +
    'than the standing one that a gate is a program needing its own baseline: a gate cell has a VALID ' +
    'WINDOW as well as a correct assertion, and a cell whose subject is an agent dispatch stops being ' +
    'meaningful the moment the conductor itself starts editing.',
});

fs.writeFileSync(sp + '.tmp', JSON.stringify(s, null, 2));
fs.renameSync(sp + '.tmp', sp);
console.log('state.json: cycle', s.cycle, '| decisions', s.decisions.length,
  '| run5_review_fix_cycle', s.qa.run5_review_fix_cycle);
