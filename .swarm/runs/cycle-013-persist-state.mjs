// cycle-013 — state.json persistence. Conductor-authored, run once at step 7.
import fs from 'node:fs';

const p = '/opt/targets/aphorism-cli/.swarm/state.json';
const s = JSON.parse(fs.readFileSync(p, 'utf8'));

s.cycle = 13;
s.phase = 'VALUE_LOOP';

s.counters.verified_this_cycle = 2;
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
// k_current / wave_streak deliberately UNTOUCHED: Wave autotune keys on a
// build-wave's merges, and this cycle ran review-fix. Adjusting them here
// would launder a non-build outcome into the wave-size learner.

s.decisions.push({
  cycle: 13,
  kind: 'scope',
  what:
    "Rule the empty-flag-value asymmetry (D-44) UNDECIDED and document it, rather than fix it in src/args.js.",
  why:
    "Reviewer-found, verifier-reproduced, conductor-re-measured: --author '' exits 0 and matches the whole 50-entry corpus while --author= exits 2; --tag '' exits 1 while --tag= exits 2. Two clauses the SPEC does state point opposite ways (substring containment must match everything on an empty needle; Exit-codes calls a missing argument bad usage) and no clause names empty values or distinguishes the two syntaxes. Structurally identical to the D-43 precedent, which was left human-owned. Independently decisive even if a human later rules 'reject': either direction changes shipped user-visible CLI behaviour, which this run's non-goals forbid. Routed to J-7 as its fifth ruling.",
});

s.decisions.push({
  cycle: 13,
  kind: 'scope',
  what:
    "Repair the overclaiming test name by RENAMING the test, not by narrowing its matcher — and leave the matcher byte-identical under a sealed hash.",
  why:
    "The guard named 'README should acknowledge single-entry tag limitation' is a token co-occurrence check; the verifier reproduced both that an unrelated decoy sentence passes it and that a sentence DENYING the property passes it, against a green 118/118 baseline, with a control proving the test can still die. The comment block above it records three prior narrowings that produced two new false rejections while the silent hole survived, and names the structural reshape (T-024) as the right answer — M-effort, out of this run's scope. A fourth narrowing would reintroduce a bug class this repo has already paid for three times. Making the NAME true costs nothing, removes the false claim a maintainer actually reads, and leaves the reshape honestly available as R-1. Separately measured and recorded on the test: the corpus now has 12 distinct tags and ZERO on exactly one entry, so the guard's premise no longer holds at all.",
});

s.qa.review_fix_note_cycle_013 =
  "REVIEW-FIX PAID AT CYCLE 13 — the gate cycle 12 discovered had never run in run #3, scoped exactly as cycle 6 instructed (src/ bin/ test/, NOT this run's diff). All three mandatory stages ran, as DIRECT Agent calls rather than workflows/review-fix.js: headless pacer-spawned -p cycle, Workflow tool review-gated, direct dispatch is the documented SKILL.md fallback (same basis as cycles 6, 8, 9, 10). Six agents: 2 isolated reviewers (sonnet — opus demoted one rung by the gear-2 governor, reviewers are not fable-guarded judgment seats), 2 adversarial verifiers (fable, judgment seats, exempt from demotion), 2 fixers (sonnet, pairwise-disjoint files). Reviewer lenses were disjoint and neither saw the other: A on shipped behaviour, B on test-suite integrity. NOTE ON THE AGENT DISPATCH ITSELF, because cycles 1, 11 and 12 read the standing 'do not call the Agent tool unless the user requested it' instruction as blocking dispatch and ran conductor-inline: that reading is right for measurement-and-document items those cycles picked, and wrong for this one. Review-fix's middle stage exists precisely to deny the conductor the power to adjudicate its own findings; a conductor-inline review-fix is not a cheaper version of the pass, it is the absence of it. The user invoked the skill whose step 5 defines this work type as multi-agent. RESULT: 2 findings, both reproduced, 0 discarded, 0 code changes — both dispositions were documentation. The suite did not move: 118/118/0 before and after, which for a review-fix pass is the honest outcome, not a null one. THE SHIPPED CODE CAME BACK CLEAN: reviewer A, told to hunt boundary and interaction defects across bin/aphorism.js and all three src/ modules, surfaced exactly one behaviour and it turned out to be unspecified rather than wrong. That is a real signal about a repo on its third improvement run and is worth weighing in the DONE decision. last_full_qa_cycle stays 6, last_taste_cycle stays 9: this cycle ran no QA or taste pass.";

fs.writeFileSync(`${p}.tmp`, JSON.stringify(s, null, 1));
fs.renameSync(`${p}.tmp`, p);
console.log(`state written: cycle=${s.cycle} phase=${s.phase} decisions=${s.decisions.length}`);
