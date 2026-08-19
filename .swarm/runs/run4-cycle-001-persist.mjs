// run #4, cycle 1 — step 7 persist. Conductor-authored.
import fs from "fs";

const T = "/opt/targets/aphorism-cli";
const sp = T + "/.swarm/state.json";
const s = JSON.parse(fs.readFileSync(sp, "utf8"));

s.cycle = 1;
s.phase = "BUILD"; // PLAN gate closed: every must-have parsed from SPEC.md is covered.
s.counters = s.counters || {};
s.counters.k_current = 2;      // runfile.playbook.directives.wave_k = 2
s.counters.wave_streak = 0;
s.counters.consecutive_no_value = 0; // this cycle produced verified value
s.qa = s.qa || {};

s.decisions.push({
  cycle: 1,
  kind: "verification",
  what: "The cycle-1 gate's C4 cell FAILED against a suite that was green the whole time. Adjudicated as an instrument defect and repaired ADDITIVELY - the gate file is left byte-unedited and the repair is a separate artifact carrying its own four-column measurement.",
  why: "C4 parsed `^# tests (\\d+)`, the TAP reporter's shape. Node 24 emitted the SPEC reporter - `ℹ tests 118` - so the cell read tests=0 against a tree that measures 118/118/0 when test_cmd is run directly. This repo has a standing precedent (cycles 4, 12, 14 of run #3) that a gate is not rewritten after it has run, because rewriting it destroys the evidence of what it measured; the repair therefore lives in run4-cycle-001-C4fix.mjs and the original FAIL stays on the record. WHAT MAKES THIS DEFECT DIFFERENT FROM THE WORST ONE THIS REPO HAS FILED, and the reason it is worth one line rather than an alarm: run #3 cycle 15's S1 defect under-measured and still EXITED 0 - green and silently incomplete. This cell required tests >= 118, so an unparsed count could only fail CLOSED. A parser that cannot read its input reported that it could not, which is the behaviour you want from an instrument that is wrong. THE REPAIR IS MEASURED, NOT ASSERTED, in four columns: the unfixed parser must still MISS on the real output (A - defect reproduced), the fixed parser must recover 118/0 on that same real output (B), must still read synthetic TAP (C - no regression on the format the old parser did handle), and must report fail=3 on synthetic failing output (D - not a rubber stamp). All four came out as expected. This is the 14th instrument defect in this repo's recorded history and the standing lesson is unchanged: a gate is a program and needs its own baseline, not confidence."
});

s.decisions.push({
  cycle: 1,
  kind: "method",
  what: "REFUSED the gear-2 mechanical demotion of N-2 (the REPORT.md split) from sonnet to haiku, and recorded the refusal rather than taking it silently.",
  why: "Gear pacing demotes docs/polish items sonnet->haiku, and N-2 is kind=docs. But this repo has MEASURED that exact routing failing on this exact file, twice: run #3 cycle 4 (record N-6) predicted an overclaiming failure mode for a haiku agent on REPORT.md, and run #3 cycle 14 caught a haiku agent writing a false provenance date into REPORT.md - inside the one paragraph whose entire job is dating claims correctly. N-2 is the highest-risk item of this run by construction: its acceptance is that every non-whitespace line survives a MOVE verbatim, so the failure mode is silent paraphrase, which is precisely what the two measured incidents were. A demotion rule exists to save budget on work where the cheap tier is adequate; here the cheap tier has a two-incident record on the same file. Recorded because it overrides a mechanical rule, and a silent override is how a run starts quietly deciding things it never wrote down."
});

s.decisions.push({
  cycle: 1,
  kind: "scope",
  what: "Split M-1 into a builder half (N-1, the workflow file) and a conductor half (N-7, pushing it and reading the REAL Actions output), instead of filing one item.",
  why: "The plan agent flagged this and it is right. A builder can write a correct matrix workflow; it cannot observe a GitHub Actions run, because only this session holds the gh token and only the conductor pushes (hard rule 1). Filing M-1 as a single builder item would leave the builder holding an acceptance clause it can only satisfy by fabricating a result - and M-1's whole purpose is to kill an unverified claim, so producing a new one to close it would be self-defeating. N-1's notes therefore forbid it from touching README.md's floor claim at all. MEASURED AT THIS CYCLE, and the reason M-1 is attemptable at all after three runs called it permanently unverifiable: the repo is PUBLIC, and `gh auth status` reports token scopes gist, read:org, repo, workflow. The prior runs' reasoning was about the VPS holding one Node runtime - true, and about the wrong machine."
});

fs.writeFileSync(sp + ".tmp", JSON.stringify(s, null, 2));
fs.renameSync(sp + ".tmp", sp);
console.log("state: cycle", s.cycle, "phase", s.phase, "decisions", s.decisions.length);
